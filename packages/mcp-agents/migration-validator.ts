#!/usr/bin/env node
/**
 * migration-validator.ts
 *
 * Agent de validation qui vérifie la cohérence entre les schémas MySQL, PostgreSQL et Prisma
 * après une migration. Génère un rapport d'audit détaillé des problèmes potentiels.
 *
 * Usage:
 *   ts-node migration-validator.ts --mappings=mappings.json --mysql=mysql_analysis.json --pg=schema_diff.json --prisma=schema.prisma --output=audit_report.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import chalk from 'chalk';

// Types pour les différents schémas et rapports
interface MappingDefinition {
  mysql: {
    type: string;
    table: string;
    column: string;
  };
  postgresql: {
    type: string;
    table: string;
    column: string;
  };
  prisma?: {
    type: string;
    model: string;
    field: string;
  };
  migrationStatus: 'success' | 'warning' | 'error';
  notes?: string;
}

interface MySQLTable {
  name: string;
  columns: MySQLColumn[];
  primaryKey?: string[];
  foreignKeys: MySQLForeignKey[];
  indexes: MySQLIndex[];
}

interface MySQLColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  extra?: string;
  comment?: string;
}

interface MySQLForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
}

interface MySQLIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

interface PostgreSQLTable {
  name: string;
  columns: PostgreSQLColumn[];
  primaryKey?: string[];
  foreignKeys: PostgreSQLForeignKey[];
  indexes: PostgreSQLIndex[];
}

interface PostgreSQLColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

interface PostgreSQLForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
}

interface PostgreSQLIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

interface PrismaModel {
  name: string;
  fields: PrismaField[];
  primaryKey?: string[];
  relations: PrismaRelation[];
}

interface PrismaField {
  name: string;
  type: string;
  optional: boolean;
  default?: string;
  isList: boolean;
  isId: boolean;
}

interface PrismaRelation {
  name: string;
  fromField: string;
  toModel: string;
  toField: string;
}

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  component: 'mysql' | 'postgresql' | 'prisma' | 'mapping';
  table: string;
  column?: string;
  message: string;
  details?: string;
  recommendation?: string;
}

interface AuditReport {
  summary: {
    totalTables: number;
    totalColumns: number;
    successfulMappings: number;
    warningMappings: number;
    errorMappings: number;
    missingTables: number;
    missingColumns: number;
    typeMismatch: number;
  };
  tables: {
    name: string;
    mysql: boolean;
    postgresql: boolean;
    prisma: boolean;
    columnCount: number;
    errors: number;
    warnings: number;
  }[];
  issues: AuditIssue[];
  mappings: MappingDefinition[];
}

// Configuration du programme
program
  .version('1.0.0')
  .description('Valide la cohérence entre les schémas MySQL, PostgreSQL et Prisma après une migration')
  .requiredOption('--mappings <path>', 'Chemin vers le fichier de mappings (JSON)')
  .requiredOption('--mysql <path>', 'Chemin vers le fichier d\'analyse MySQL (JSON)')
  .requiredOption('--pg <path>', 'Chemin vers le fichier de différences de schéma (JSON)')
  .requiredOption('--prisma <path>', 'Chemin vers le fichier schema.prisma')
  .requiredOption('--output <path>', 'Chemin de sortie pour le rapport d\'audit (JSON)')
  .option('--verbose', 'Afficher des informations détaillées pendant la validation')
  .parse(process.argv);

const options = program.opts();

// Fonction principale
async function main() {
  console.log(chalk.blue(`🚀 Démarrage de la validation de migration`));
  
  // Chargement des fichiers d'entrée
  const mappings: MappingDefinition[] = loadJSON(options.mappings, 'mappings');
  const mysqlAnalysis = loadJSON(options.mysql, 'analyse MySQL');
  const pgSchema = loadJSON(options.pg, 'schéma PostgreSQL');
  const prismaSchema = loadPrismaSchema(options.prisma);
  
  // Initialisation du rapport d'audit
  const auditReport: AuditReport = {
    summary: {
      totalTables: 0,
      totalColumns: 0,
      successfulMappings: 0,
      warningMappings: 0,
      errorMappings: 0,
      missingTables: 0,
      missingColumns: 0,
      typeMismatch: 0
    },
    tables: [],
    issues: [],
    mappings: []
  };
  
  // Vérification de la présence de toutes les tables MySQL dans PostgreSQL
  validateTablePresence(mysqlAnalysis.tables, pgSchema.tables, prismaSchema, auditReport);
  
  // Vérification de la cohérence des colonnes
  validateColumnConsistency(mysqlAnalysis.tables, pgSchema.tables, prismaSchema, mappings, auditReport);
  
  // Vérification des clés primaires et des contraintes
  validateConstraints(mysqlAnalysis.tables, pgSchema.tables, prismaSchema, auditReport);
  
  // Vérification des relations (clés étrangères)
  validateRelations(mysqlAnalysis.tables, pgSchema.tables, prismaSchema, auditReport);
  
  // Calcul des statistiques de synthèse
  calculateSummaryStats(auditReport);
  
  // Écriture du rapport d'audit
  fs.writeFileSync(options.output, JSON.stringify(auditReport, null, 2));
  console.log(chalk.green(`✅ Rapport d'audit généré: ${options.output}`));
  
  // Affichage du résumé de la validation
  printValidationSummary(auditReport);
  
  // Vérifier s'il y a des erreurs critiques
  if (auditReport.summary.errorMappings > 0) {
    console.log(chalk.red(`❌ La validation a détecté ${auditReport.summary.errorMappings} erreurs critiques. Veuillez consulter le rapport d'audit.`));
    process.exit(1);
  } else if (auditReport.summary.warningMappings > 0) {
    console.log(chalk.yellow(`⚠️ La validation a détecté ${auditReport.summary.warningMappings} avertissements. Veuillez vérifier le rapport d'audit.`));
  } else {
    console.log(chalk.green(`✅ Validation réussie sans erreurs ni avertissements.`));
  }
}

/**
 * Charge un fichier JSON
 */
function loadJSON(filePath: string, description: string): any {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du chargement du fichier ${description}: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Charge et parse un fichier schema.prisma
 */
function loadPrismaSchema(filePath: string): PrismaModel[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Analyse simple du schema Prisma (une analyse plus robuste nécessiterait une librairie dédiée)
    const models: PrismaModel[] = [];
    
    // Regex pour extraire les modèles
    const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/g;
    let modelMatch;
    
    while ((modelMatch = modelRegex.exec(fileContent)) !== null) {
      const modelName = modelMatch[1];
      const modelContent = modelMatch[2];
      
      const model: PrismaModel = {
        name: modelName,
        fields: [],
        relations: []
      };
      
      // Extraction des champs
      const fieldLines = modelContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));
      
      for (const line of fieldLines) {
        // Format typique: name String @id @default(uuid())
        const fieldMatch = line.match(/^(\w+)\s+(\w+)(\[\])?\s*(.*)$/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2];
          const isList = !!fieldMatch[3];
          const modifiers = fieldMatch[4] || '';
          
          const field: PrismaField = {
            name: fieldName,
            type: fieldType,
            optional: !modifiers.includes('@required') && !modifiers.includes('NOT NULL'),
            isList,
            isId: modifiers.includes('@id')
          };
          
          // Extraction de la valeur par défaut
          const defaultMatch = modifiers.match(/@default\(([^)]+)\)/);
          if (defaultMatch) {
            field.default = defaultMatch[1];
          }
          
          model.fields.push(field);
          
          // Détection des relations
          if (modifiers.includes('@relation')) {
            const relationMatch = modifiers.match(/@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\][^)]*\)/);
            if (relationMatch) {
              const fromField = relationMatch[1];
              const toField = relationMatch[2];
              
              // Tentative de détecter le modèle cible
              const toModelMatch = modifiers.match(/@relation\([^)]*references:\s*\[([^\]]+)\][^)]*\)/);
              if (toModelMatch) {
                model.relations.push({
                  name: fieldName,
                  fromField,
                  toModel: fieldType,
                  toField
                });
              }
            }
          }
        }
      }
      
      models.push(model);
    }
    
    return models;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du chargement du schema Prisma: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Valide la présence de toutes les tables MySQL dans PostgreSQL et Prisma
 */
function validateTablePresence(
  mysqlTables: MySQLTable[],
  pgTables: PostgreSQLTable[],
  prismaModels: PrismaModel[],
  auditReport: AuditReport
) {
  console.log(chalk.blue(`🔍 Vérification de la présence des tables...`));
  
  // Création d'un dictionnaire pour les recherches rapides
  const pgTableDict = pgTables.reduce((dict, table) => {
    dict[table.name.toLowerCase()] = table;
    return dict;
  }, {});
  
  const prismaModelDict = prismaModels.reduce((dict, model) => {
    dict[model.name.toLowerCase()] = model;
    return dict;
  }, {});
  
  // Vérifier chaque table MySQL
  for (const mysqlTable of mysqlTables) {
    const tableName = mysqlTable.name.toLowerCase();
    const pgTable = pgTableDict[tableName];
    const prismaModel = prismaModelDict[tableName] || prismaModelDict[toCamelCase(tableName)];
    
    const tableStatus = {
      name: mysqlTable.name,
      mysql: true,
      postgresql: !!pgTable,
      prisma: !!prismaModel,
      columnCount: mysqlTable.columns.length,
      errors: 0,
      warnings: 0
    };
    
    auditReport.tables.push(tableStatus);
    
    // Vérifier si la table existe dans PostgreSQL
    if (!pgTable) {
      auditReport.issues.push({
        type: 'error',
        component: 'postgresql',
        table: mysqlTable.name,
        message: `Table MySQL '${mysqlTable.name}' absente dans PostgreSQL`,
        recommendation: 'Vérifier pourquoi la table n\'a pas été migrée vers PostgreSQL'
      });
      tableStatus.errors++;
      auditReport.summary.missingTables++;
    }
    
    // Vérifier si la table existe dans Prisma
    if (!prismaModel) {
      auditReport.issues.push({
        type: 'error',
        component: 'prisma',
        table: mysqlTable.name,
        message: `Table MySQL '${mysqlTable.name}' absente dans le schéma Prisma`,
        recommendation: 'Exécuter prisma db pull pour mettre à jour le schéma Prisma'
      });
      tableStatus.errors++;
      auditReport.summary.missingTables++;
    }
  }
}

/**
 * Valide la cohérence des colonnes entre MySQL, PostgreSQL et Prisma
 */
function validateColumnConsistency(
  mysqlTables: MySQLTable[],
  pgTables: PostgreSQLTable[],
  prismaModels: PrismaModel[],
  mappings: MappingDefinition[],
  auditReport: AuditReport
) {
  console.log(chalk.blue(`🔍 Vérification de la cohérence des colonnes...`));
  
  // Création de dictionnaires pour les recherches rapides
  const pgTableDict = pgTables.reduce((dict, table) => {
    dict[table.name.toLowerCase()] = table;
    return dict;
  }, {});
  
  const prismaModelDict = prismaModels.reduce((dict, model) => {
    dict[model.name.toLowerCase()] = model;
    return dict;
  }, {});
  
  // Dictionnaire pour les mappings de type
  const typeMap = mappings.reduce((dict, mapping) => {
    const key = `${mapping.mysql.table.toLowerCase()}.${mapping.mysql.column.toLowerCase()}`;
    dict[key] = mapping;
    return dict;
  }, {});
  
  // Vérifier chaque table MySQL
  for (const mysqlTable of mysqlTables) {
    const tableName = mysqlTable.name.toLowerCase();
    const pgTable = pgTableDict[tableName];
    const prismaModel = prismaModelDict[tableName] || prismaModelDict[toCamelCase(tableName)];
    
    if (!pgTable || !prismaModel) {
      // Table manquante, déjà signalé dans validateTablePresence
      continue;
    }
    
    // Création de dictionnaires pour les colonnes
    const pgColumnDict = pgTable.columns.reduce((dict, column) => {
      dict[column.name.toLowerCase()] = column;
      return dict;
    }, {});
    
    const prismaFieldDict = prismaModel.fields.reduce((dict, field) => {
      dict[field.name.toLowerCase()] = field;
      return dict;
    }, {});
    
    // Vérifier chaque colonne MySQL
    for (const mysqlColumn of mysqlTable.columns) {
      const columnName = mysqlColumn.name.toLowerCase();
      const pgColumn = pgColumnDict[columnName];
      const prismaField = prismaFieldDict[columnName] || prismaFieldDict[toCamelCase(columnName)];
      
      const mappingKey = `${tableName}.${columnName}`;
      const mapping = typeMap[mappingKey];
      
      // Vérifier si la colonne existe dans PostgreSQL
      if (!pgColumn) {
        auditReport.issues.push({
          type: 'error',
          component: 'postgresql',
          table: mysqlTable.name,
          column: mysqlColumn.name,
          message: `Colonne MySQL '${mysqlColumn.name}' absente dans la table PostgreSQL '${mysqlTable.name}'`,
          recommendation: 'Vérifier pourquoi la colonne n\'a pas été migrée vers PostgreSQL'
        });
        auditReport.summary.missingColumns++;
        findTableInArray(auditReport.tables, mysqlTable.name).errors++;
      }
      
      // Vérifier si la colonne existe dans Prisma
      if (!prismaField) {
        auditReport.issues.push({
          type: 'error',
          component: 'prisma',
          table: mysqlTable.name,
          column: mysqlColumn.name,
          message: `Colonne MySQL '${mysqlColumn.name}' absente dans le modèle Prisma '${prismaModel.name}'`,
          recommendation: 'Vérifier pourquoi la colonne n\'a pas été importée dans le schéma Prisma'
        });
        auditReport.summary.missingColumns++;
        findTableInArray(auditReport.tables, mysqlTable.name).errors++;
      }
      
      // Vérifier la cohérence des types si toutes les colonnes existent
      if (pgColumn && prismaField) {
        // Créer une entrée de mapping si elle n'existe pas
        if (!mapping) {
          auditReport.mappings.push({
            mysql: {
              type: mysqlColumn.type,
              table: mysqlTable.name,
              column: mysqlColumn.name
            },
            postgresql: {
              type: pgColumn.type,
              table: pgTable.name,
              column: pgColumn.name
            },
            prisma: {
              type: prismaField.type,
              model: prismaModel.name,
              field: prismaField.name
            },
            migrationStatus: 'success'
          });
        } else {
          // Vérifier si le type PostgreSQL est conforme au mapping
          if (mapping.postgresql.type.toLowerCase() !== pgColumn.type.toLowerCase()) {
            auditReport.issues.push({
              type: 'warning',
              component: 'mapping',
              table: mysqlTable.name,
              column: mysqlColumn.name,
              message: `Type PostgreSQL réel ('${pgColumn.type}') différent du mapping ('${mapping.postgresql.type}')`,
              recommendation: 'Vérifier si la différence est intentionnelle ou problématique'
            });
            findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
            auditReport.summary.typeMismatch++;
          }
          
          // Ajouter le mapping au rapport
          auditReport.mappings.push(mapping);
        }
        
        // Vérifier la cohérence des contraintes de nullabilité
        if (mysqlColumn.nullable !== pgColumn.nullable) {
          auditReport.issues.push({
            type: 'warning',
            component: 'postgresql',
            table: mysqlTable.name,
            column: mysqlColumn.name,
            message: `Contrainte de nullabilité différente entre MySQL (${mysqlColumn.nullable ? 'NULL' : 'NOT NULL'}) et PostgreSQL (${pgColumn.nullable ? 'NULL' : 'NOT NULL'})`,
            recommendation: 'Vérifier si la différence est intentionnelle'
          });
          findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
        }
        
        if (mysqlColumn.nullable !== !prismaField.optional) {
          auditReport.issues.push({
            type: 'warning',
            component: 'prisma',
            table: mysqlTable.name,
            column: mysqlColumn.name,
            message: `Contrainte de nullabilité différente entre MySQL (${mysqlColumn.nullable ? 'NULL' : 'NOT NULL'}) et Prisma (${prismaField.optional ? 'optional' : 'required'})`,
            recommendation: 'Vérifier si la différence est intentionnelle'
          });
          findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
        }
        
        // Vérifier les valeurs par défaut
        if (mysqlColumn.defaultValue && !pgColumn.defaultValue) {
          auditReport.issues.push({
            type: 'warning',
            component: 'postgresql',
            table: mysqlTable.name,
            column: mysqlColumn.name,
            message: `Valeur par défaut présente dans MySQL ('${mysqlColumn.defaultValue}') mais absente dans PostgreSQL`,
            recommendation: 'Vérifier si l\'absence de valeur par défaut est intentionnelle'
          });
          findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
        }
        
        if (mysqlColumn.defaultValue && !prismaField.default) {
          auditReport.issues.push({
            type: 'warning',
            component: 'prisma',
            table: mysqlTable.name,
            column: mysqlColumn.name,
            message: `Valeur par défaut présente dans MySQL ('${mysqlColumn.defaultValue}') mais absente dans Prisma`,
            recommendation: 'Vérifier si l\'absence de valeur par défaut est intentionnelle'
          });
          findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
        }
      }
    }
  }
}

/**
 * Valide les contraintes (clés primaires) entre MySQL, PostgreSQL et Prisma
 */
function validateConstraints(
  mysqlTables: MySQLTable[],
  pgTables: PostgreSQLTable[],
  prismaModels: PrismaModel[],
  auditReport: AuditReport
) {
  console.log(chalk.blue(`🔍 Vérification des contraintes et clés primaires...`));
  
  // Création de dictionnaires pour les recherches rapides
  const pgTableDict = pgTables.reduce((dict, table) => {
    dict[table.name.toLowerCase()] = table;
    return dict;
  }, {});
  
  const prismaModelDict = prismaModels.reduce((dict, model) => {
    dict[model.name.toLowerCase()] = model;
    return dict;
  }, {});
  
  // Vérifier chaque table MySQL
  for (const mysqlTable of mysqlTables) {
    const tableName = mysqlTable.name.toLowerCase();
    const pgTable = pgTableDict[tableName];
    const prismaModel = prismaModelDict[tableName] || prismaModelDict[toCamelCase(tableName)];
    
    if (!pgTable || !prismaModel) {
      // Table manquante, déjà signalé dans validateTablePresence
      continue;
    }
    
    // Vérifier les clés primaires
    if (mysqlTable.primaryKey) {
      if (!pgTable.primaryKey) {
        auditReport.issues.push({
          type: 'error',
          component: 'postgresql',
          table: mysqlTable.name,
          message: `Clé primaire absente dans la table PostgreSQL '${mysqlTable.name}'`,
          recommendation: 'Ajouter la clé primaire manquante dans PostgreSQL'
        });
        findTableInArray(auditReport.tables, mysqlTable.name).errors++;
      } else {
        // Vérifier si les colonnes de la clé primaire sont les mêmes
        const mysqlPkCols = mysqlTable.primaryKey.map(col => col.toLowerCase()).sort();
        const pgPkCols = pgTable.primaryKey.map(col => col.toLowerCase()).sort();
        
        if (!arraysEqual(mysqlPkCols, pgPkCols)) {
          auditReport.issues.push({
            type: 'warning',
            component: 'postgresql',
            table: mysqlTable.name,
            message: `Colonnes de clé primaire différentes entre MySQL (${mysqlTable.primaryKey.join(', ')}) et PostgreSQL (${pgTable.primaryKey.join(', ')})`,
            recommendation: 'Vérifier si la différence est intentionnelle'
          });
          findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
        }
      }
      
      // Vérifier la clé primaire dans Prisma
      const prismaIdFields = prismaModel.fields
        .filter(field => field.isId)
        .map(field => field.name.toLowerCase());
      
      if (prismaIdFields.length === 0) {
        auditReport.issues.push({
          type: 'error',
          component: 'prisma',
          table: mysqlTable.name,
          message: `Clé primaire absente dans le modèle Prisma '${prismaModel.name}'`,
          recommendation: 'Ajouter l\'attribut @id dans le modèle Prisma'
        });
        findTableInArray(auditReport.tables, mysqlTable.name).errors++;
      } else {
        const mysqlPkCols = mysqlTable.primaryKey.map(col => col.toLowerCase()).sort();
        const prismaPkCols = prismaIdFields.sort();
        
        if (!arraysEqual(mysqlPkCols, prismaPkCols) && !arraysEqual(mysqlPkCols, prismaIdFields.map(field => toCamelCase(field)).sort())) {
          auditReport.issues.push({
            type: 'warning',
            component: 'prisma',
            table: mysqlTable.name,
            message: `Colonnes de clé primaire différentes entre MySQL (${mysqlTable.primaryKey.join(', ')}) et Prisma (${prismaIdFields.join(', ')})`,
            recommendation: 'Vérifier si la différence est intentionnelle'
          });
          findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
        }
      }
    }
  }
}

/**
 * Valide les relations (clés étrangères) entre MySQL, PostgreSQL et Prisma
 */
function validateRelations(
  mysqlTables: MySQLTable[],
  pgTables: PostgreSQLTable[],
  prismaModels: PrismaModel[],
  auditReport: AuditReport
) {
  console.log(chalk.blue(`🔍 Vérification des relations et clés étrangères...`));
  
  // Création de dictionnaires pour les recherches rapides
  const pgTableDict = pgTables.reduce((dict, table) => {
    dict[table.name.toLowerCase()] = table;
    return dict;
  }, {});
  
  const prismaModelDict = prismaModels.reduce((dict, model) => {
    dict[model.name.toLowerCase()] = model;
    return dict;
  }, {});
  
  // Vérifier chaque table MySQL
  for (const mysqlTable of mysqlTables) {
    const tableName = mysqlTable.name.toLowerCase();
    const pgTable = pgTableDict[tableName];
    const prismaModel = prismaModelDict[tableName] || prismaModelDict[toCamelCase(tableName)];
    
    if (!pgTable || !prismaModel) {
      // Table manquante, déjà signalé dans validateTablePresence
      continue;
    }
    
    // Vérifier les clés étrangères
    for (const mysqlFk of mysqlTable.foreignKeys) {
      // Rechercher la clé étrangère correspondante dans PostgreSQL
      const pgFkMatch = pgTable.foreignKeys.find(pgFk => {
        const mysqlFkCols = mysqlFk.columns.map(col => col.toLowerCase()).sort();
        const pgFkCols = pgFk.columns.map(col => col.toLowerCase()).sort();
        
        return arraysEqual(mysqlFkCols, pgFkCols) &&
               mysqlFk.referencedTable.toLowerCase() === pgFk.referencedTable.toLowerCase();
      });
      
      if (!pgFkMatch) {
        auditReport.issues.push({
          type: 'warning',
          component: 'postgresql',
          table: mysqlTable.name,
          message: `Clé étrangère '${mysqlFk.name}' absente dans la table PostgreSQL '${mysqlTable.name}'`,
          details: `Colonnes: ${mysqlFk.columns.join(', ')}, Référence: ${mysqlFk.referencedTable}(${mysqlFk.referencedColumns.join(', ')})`,
          recommendation: 'Vérifier si l\'absence de cette clé étrangère est intentionnelle'
        });
        findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
      }
      
      // Rechercher la relation correspondante dans Prisma
      // C'est plus complexe car Prisma représente les relations différemment
      const prismaRelationMatch = prismaModel.relations.find(relation => {
        // Simplification: vérifier si la relation pointe vers la table référencée
        return relation.toModel.toLowerCase() === mysqlFk.referencedTable.toLowerCase() ||
               toCamelCase(relation.toModel.toLowerCase()) === toCamelCase(mysqlFk.referencedTable.toLowerCase());
      });
      
      if (!prismaRelationMatch) {
        auditReport.issues.push({
          type: 'warning',
          component: 'prisma',
          table: mysqlTable.name,
          message: `Relation pour la clé étrangère '${mysqlFk.name}' absente dans le modèle Prisma '${prismaModel.name}'`,
          details: `Colonnes: ${mysqlFk.columns.join(', ')}, Référence: ${mysqlFk.referencedTable}(${mysqlFk.referencedColumns.join(', ')})`,
          recommendation: 'Vérifier si l\'absence de cette relation est intentionnelle ou ajouter manuellement la relation dans le schéma Prisma'
        });
        findTableInArray(auditReport.tables, mysqlTable.name).warnings++;
      }
    }
  }
}

/**
 * Calcule les statistiques de synthèse pour le rapport d'audit
 */
function calculateSummaryStats(auditReport: AuditReport) {
  auditReport.summary.totalTables = auditReport.tables.length;
  auditReport.summary.totalColumns = auditReport.tables.reduce((sum, table) => sum + table.columnCount, 0);
  
  auditReport.summary.successfulMappings = auditReport.mappings.filter(m => m.migrationStatus === 'success').length;
  auditReport.summary.warningMappings = auditReport.mappings.filter(m => m.migrationStatus === 'warning').length;
  auditReport.summary.errorMappings = auditReport.mappings.filter(m => m.migrationStatus === 'error').length;
  
  // Les autres statistiques (missingTables, missingColumns, typeMismatch) sont calculées pendant la validation
}

/**
 * Affiche un résumé de la validation
 */
function printValidationSummary(auditReport: AuditReport) {
  console.log(chalk.blue(`\n📊 Résumé de la validation:`));
  console.log(`Tables: ${auditReport.summary.totalTables} au total`);
  console.log(`Colonnes: ${auditReport.summary.totalColumns} au total`);
  console.log(`Mappings: ${auditReport.summary.successfulMappings} réussis, ${auditReport.summary.warningMappings} avec avertissements, ${auditReport.summary.errorMappings} avec erreurs`);
  
  if (auditReport.summary.missingTables > 0) {
    console.log(chalk.yellow(`⚠️ ${auditReport.summary.missingTables} tables manquantes`));
  }
  
  if (auditReport.summary.missingColumns > 0) {
    console.log(chalk.yellow(`⚠️ ${auditReport.summary.missingColumns} colonnes manquantes`));
  }
  
  if (auditReport.summary.typeMismatch > 0) {
    console.log(chalk.yellow(`⚠️ ${auditReport.summary.typeMismatch} incompatibilités de type`));
  }
  
  // Afficher les 5 premiers problèmes
  if (auditReport.issues.length > 0) {
    console.log(chalk.yellow(`\n⚠️ Premiers problèmes détectés (${auditReport.issues.length} au total):`));
    auditReport.issues.slice(0, 5).forEach((issue, index) => {
      const icon = issue.type === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${index + 1}. [${issue.component.toUpperCase()}] ${issue.table}${issue.column ? '.' + issue.column : ''}: ${issue.message}`);
    });
    
    if (auditReport.issues.length > 5) {
      console.log(chalk.yellow(`... et ${auditReport.issues.length - 5} autres problèmes (voir le rapport complet)`));
    }
  }
}

/**
 * Utilitaire pour trouver une table dans un tableau par son nom
 */
function findTableInArray(tables: AuditReport['tables'], tableName: string) {
  return tables.find(t => t.name.toLowerCase() === tableName.toLowerCase()) || {
    name: tableName,
    mysql: false,
    postgresql: false,
    prisma: false,
    columnCount: 0,
    errors: 0,
    warnings: 0
  };
}

/**
 * Utilitaire pour comparer deux tableaux
 */
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Utilitaire pour convertir une chaîne en camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`❌ Erreur inattendue: ${error.message}`));
  process.exit(1);
});