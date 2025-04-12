#!/usr/bin/env node
/**
 * prisma-smart-generator.ts
 * 
 * Agent 6 - Générateur Prisma Intelligent
 * 
 * Génère automatiquement un schema.prisma propre, lisible, modulaire, et compatible PostgreSQL
 * à partir des sorties des agents précédents, tout en anticipant les erreurs classiques de migration depuis MySQL.
 * 
 * Usage: ts-node prisma-smart-generator.ts [options]
 * 
 * Options:
 *   --input-schema=<path>     Chemin vers le fichier de schéma JSON analysé (default: ./reports/schema_analysis.json)
 *   --type-mapping=<path>     Chemin vers le fichier de mapping des types MySQL -> PostgreSQL (default: ./config/type_mapping.json)
 *   --table-classification=<path> Chemin vers le fichier de classification des tables (default: ./config/table_classification.json)
 *   --output-dir=<path>       Répertoire de sortie (default: ./reports/latest)
 *   --multi-file              Génère des fichiers Prisma séparés par domaine fonctionnel
 *   --keep-snake-case         Conserve le snake_case pour les noms de champs (pas de conversion en camelCase)
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import * as chalk from 'chalk';

// Types
interface MySQLSchema {
  tables: Record<string, TableInfo>;
  views: Record<string, ViewInfo>;
  procedures: Record<string, any>;
  functions: Record<string, any>;
  triggers: Record<string, any>;
  databaseInfo: any;
}

interface TableInfo {
  name: string;
  comment?: string;
  columns: Record<string, ColumnInfo>;
  primaryKey?: string[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  relations?: RelationInfo[];
  tableType?: 'TABLE' | 'VIEW' | 'JUNCTION' | 'TEMP';
}

interface ViewInfo {
  name: string;
  comment?: string;
  columns: Record<string, ColumnInfo>;
  definition: string;
}

interface ColumnInfo {
  name: string;
  position: number;
  type: string;
  originalType: string;
  suggestedPrismaType?: string;
  nullable: boolean;
  defaultValue?: any;
  comment?: string;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  isImplicitForeignKey?: boolean;
}

interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

interface ForeignKeyInfo {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onUpdate: string;
  onDelete: string;
}

interface RelationInfo {
  type: RelationType;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY'
}

interface TypeMapping {
  mysql: {
    [key: string]: {
      postgresql: string;
      prisma: string;
      jsType: string;
    }
  }
}

interface TableClassification {
  domains: {
    [key: string]: {
      description: string;
      tables: string[];
    }
  }
}

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description('Générateur Prisma Intelligent')
  .option('--input-schema <path>', 'Chemin vers le fichier de schéma JSON analysé', './reports/schema_analysis.json')
  .option('--type-mapping <path>', 'Chemin vers le fichier de mapping des types MySQL -> PostgreSQL', './config/type_mapping.json')
  .option('--table-classification <path>', 'Chemin vers le fichier de classification des tables', './config/table_classification.json')
  .option('--output-dir <path>', 'Répertoire de sortie', './reports/latest')
  .option('--multi-file', 'Génère des fichiers Prisma séparés par domaine fonctionnel', false)
  .option('--keep-snake-case', 'Conserve le snake_case pour les noms de champs', false)
  .parse(process.argv);

const options = program.opts();

/**
 * Classe principale du générateur Prisma intelligent
 */
class PrismaSmartGenerator {
  private schema: MySQLSchema;
  private typeMapping: TypeMapping;
  private tableClassification: TableClassification;
  private warnings: string[] = [];
  private modelMappings: Record<string, { 
    mysqlTable: string, 
    prismaModel: string, 
    postgresTable: string 
  }> = {};
  private domainModels: Record<string, string[]> = {};

  constructor(
    schemaPath: string,
    typeMappingPath: string,
    tableClassificationPath: string,
    private keepSnakeCase: boolean
  ) {
    try {
      this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      this.typeMapping = JSON.parse(fs.readFileSync(typeMappingPath, 'utf8'));
      this.tableClassification = JSON.parse(fs.readFileSync(tableClassificationPath, 'utf8'));
    } catch (error: any) {
      console.error(chalk.red(`Erreur lors du chargement des fichiers: ${error.message}`));
      if (error.code === 'ENOENT') {
        const missingFile = error.path;
        console.error(chalk.yellow(`Fichier non trouvé: ${missingFile}`));
        
        if (missingFile.includes('type_mapping.json')) {
          this.typeMapping = this.createDefaultTypeMapping();
          console.log(chalk.yellow('Utilisation d\'un mapping de types par défaut'));
        } else if (missingFile.includes('table_classification.json')) {
          this.tableClassification = this.createDefaultTableClassification();
          console.log(chalk.yellow('Utilisation d\'une classification de tables par défaut'));
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Crée un mapping de types par défaut si le fichier n'existe pas
   */
  private createDefaultTypeMapping(): TypeMapping {
    return {
      mysql: {
        "INT": {
          postgresql: "INTEGER",
          prisma: "Int",
          jsType: "number"
        },
        "BIGINT": {
          postgresql: "BIGINT",
          prisma: "BigInt",
          jsType: "bigint"
        },
        "TINYINT(1)": {
          postgresql: "BOOLEAN",
          prisma: "Boolean",
          jsType: "boolean"
        },
        "VARCHAR": {
          postgresql: "VARCHAR",
          prisma: "String",
          jsType: "string"
        },
        "TEXT": {
          postgresql: "TEXT",
          prisma: "String",
          jsType: "string"
        },
        "TIMESTAMP": {
          postgresql: "TIMESTAMP",
          prisma: "DateTime",
          jsType: "Date"
        },
        "DATE": {
          postgresql: "DATE",
          prisma: "DateTime",
          jsType: "Date"
        },
        "DECIMAL": {
          postgresql: "DECIMAL",
          prisma: "Decimal",
          jsType: "Decimal"
        },
        "ENUM": {
          postgresql: "TEXT",
          prisma: "String",
          jsType: "string"
        },
        "JSON": {
          postgresql: "JSONB",
          prisma: "Json",
          jsType: "object"
        }
      }
    };
  }

  /**
   * Crée une classification de tables par défaut si le fichier n'existe pas
   */
  private createDefaultTableClassification(): TableClassification {
    return {
      domains: {
        "user": {
          description: "Modèles liés aux utilisateurs et authentification",
          tables: []
        },
        "product": {
          description: "Modèles liés aux produits",
          tables: []
        },
        "order": {
          description: "Modèles liés aux commandes",
          tables: []
        },
        "content": {
          description: "Modèles liés au contenu",
          tables: []
        },
        "system": {
          description: "Modèles liés au système",
          tables: []
        }
      }
    };
  }

  /**
   * Génère tous les fichiers de sortie
   */
  async generate(outputDir: string, multiFile: boolean): Promise<void> {
    console.log(chalk.blue('🧬 Génération du schéma Prisma...'));

    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Générer le schéma Prisma
    const prismaSchema = this.generatePrismaSchema();

    // Écrire le schéma principal
    fs.writeFileSync(path.join(outputDir, 'suggested_schema.prisma'), prismaSchema);
    console.log(chalk.green('✅ Schéma Prisma généré: suggested_schema.prisma'));

    // Générer et écrire les modèles par domaine si demandé
    if (multiFile) {
      this.generateDomainSplitFiles(outputDir);
    }

    // Générer et écrire les fichiers additionnels
    this.generateMappingFile(outputDir);
    this.generateWarningsFile(outputDir);
    this.generateModuleSplitsFile(outputDir);

    console.log(chalk.green('✅ Génération terminée avec succès!'));
  }

  /**
   * Génère le schéma Prisma complet
   */
  private generatePrismaSchema(): string {
    // Générer l'en-tête
    let prismaSchema = this.generateHeader();

    // Collecter tous les enums
    const enums = this.collectEnums();
    
    // Générer les définitions d'enum
    Object.entries(enums).forEach(([enumName, values]) => {
      prismaSchema += this.generateEnum(enumName, values);
    });

    // Classer les tables par domaine
    this.classifyTables();

    // Générer les modèles pour chaque table
    Object.entries(this.schema.tables).forEach(([tableName, table]) => {
      const modelDefinition = this.generateModel(tableName, table);
      prismaSchema += modelDefinition;
    });

    // Générer les modèles pour les vues (commentés)
    Object.entries(this.schema.views || {}).forEach(([viewName, view]) => {
      const viewModelDefinition = this.generateViewModel(viewName, view);
      prismaSchema += viewModelDefinition;
    });

    return prismaSchema;
  }

  /**
   * Génère l'en-tête du schéma Prisma
   */
  private generateHeader(): string {
    return `// Schéma Prisma généré automatiquement par l'Agent 6 - Générateur Prisma Intelligent
// Date de génération: ${new Date().toISOString()}
// Pour plus d'informations: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  // Activer la prévisualisation des fonctionnalités PostgreSQL avancées
  previewFeatures = ["postgresqlExtensions", "relationJoins"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Extensions PostgreSQL recommandées
  extensions = [citext, pg_trgm]
}

`;
  }

  /**
   * Collecte tous les enums à définir dans le schéma Prisma
   */
  private collectEnums(): Record<string, string[]> {
    const enums: Record<string, string[]> = {};
    
    // Parcourir toutes les colonnes de type ENUM
    Object.entries(this.schema.tables).forEach(([tableName, table]) => {
      Object.entries(table.columns).forEach(([columnName, column]) => {
        if (column.type.toUpperCase() === 'ENUM') {
          // Extraire les valeurs d'enum
          const match = column.originalType.match(/ENUM\s*\(\s*(.+?)\s*\)/i);
          if (match) {
            const enumValues = match[1]
              .split(',')
              .map(value => value.trim().replace(/^['"]|['"]$/g, ''));
            
            // Créer un nom d'enum basé sur la table et la colonne
            const enumName = `${this.toPascalCase(tableName)}${this.toPascalCase(columnName)}`;
            enums[enumName] = enumValues;
            
            // Mettre à jour le type Prisma suggéré pour cette colonne
            if (this.schema.tables[tableName]?.columns[columnName]) {
              this.schema.tables[tableName].columns[columnName].suggestedPrismaType = enumName;
            }
          }
        }
      });
    });
    
    return enums;
  }

  /**
   * Génère une définition d'enum Prisma
   */
  private generateEnum(enumName: string, values: string[]): string {
    let enumDefinition = `enum ${enumName} {\n`;
    
    values.forEach(value => {
      // Convertir la valeur en constante valide pour Prisma
      const safeValue = this.toSafeEnumValue(value);
      enumDefinition += `  ${safeValue}\n`;
    });
    
    enumDefinition += '}\n\n';
    return enumDefinition;
  }

  /**
   * Convertit une valeur d'enum en valeur sécurisée pour Prisma
   */
  private toSafeEnumValue(value: string): string {
    // Remplacer les caractères non autorisés par des underscores
    let safeValue = value.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // S'assurer que la valeur commence par une lettre
    if (!/^[a-zA-Z]/.test(safeValue)) {
      safeValue = 'E_' + safeValue;
    }
    
    // Si la valeur est vide après nettoyage, utiliser une valeur par défaut
    if (!safeValue) {
      safeValue = 'EMPTY';
    }
    
    return safeValue;
  }

  /**
   * Classe les tables par domaine fonctionnel
   */
  private classifyTables(): void {
    // Initialiser les domaines
    Object.keys(this.tableClassification.domains).forEach(domain => {
      this.domainModels[domain] = [];
    });

    // Classer les tables explicitement définies
    Object.entries(this.tableClassification.domains).forEach(([domain, domainInfo]) => {
      domainInfo.tables.forEach(tableName => {
        if (this.schema.tables[tableName]) {
          this.domainModels[domain].push(this.toPascalCase(tableName));
        }
      });
    });

    // Tenter de classer automatiquement les tables non classées
    Object.keys(this.schema.tables).forEach(tableName => {
      const modelName = this.toPascalCase(tableName);
      
      // Vérifier si cette table est déjà classée
      const isClassified = Object.values(this.domainModels).some(models => 
        models.includes(modelName)
      );

      if (!isClassified) {
        // Essayer de deviner le domaine par le nom
        let assigned = false;
        
        // Règles de classification automatique
        if (tableName.match(/user|auth|permission|role|account|profile/i)) {
          this.domainModels['user'].push(modelName);
          assigned = true;
        } else if (tableName.match(/product|item|catalog|category|tag/i)) {
          this.domainModels['product'].push(modelName);
          assigned = true;
        } else if (tableName.match(/order|cart|checkout|payment|transaction|invoice/i)) {
          this.domainModels['order'].push(modelName);
          assigned = true;
        } else if (tableName.match(/post|article|comment|content|page|blog|media/i)) {
          this.domainModels['content'].push(modelName);
          assigned = true;
        } else if (tableName.match(/setting|config|log|stat|history|audit|system|temp|migration/i)) {
          this.domainModels['system'].push(modelName);
          assigned = true;
        }

        // Si non classé, mettre dans "system" par défaut
        if (!assigned) {
          this.domainModels['system'].push(modelName);
        }
      }
    });
  }

  /**
   * Génère un modèle Prisma pour une table
   */
  private generateModel(tableName: string, table: TableInfo): string {
    // Convertir le nom de la table en PascalCase pour le modèle Prisma
    const modelName = this.toPascalCase(tableName);
    
    // Stocker le mapping pour référence future
    this.modelMappings[modelName] = {
      mysqlTable: tableName,
      prismaModel: modelName,
      postgresTable: tableName
    };
    
    // Déterminer le domaine pour les commentaires
    const domain = this.findDomainForModel(modelName);
    
    let modelDefinition = `// Domaine: ${domain}\n`;
    
    // Ajouter un commentaire si disponible
    if (table.comment) {
      modelDefinition += `/// ${table.comment}\n`;
    }
    
    modelDefinition += `model ${modelName} {\n`;
    
    // Générer les champs du modèle
    Object.entries(table.columns).forEach(([columnName, column]) => {
      const field = this.generateField(columnName, column, table);
      modelDefinition += `  ${field}\n`;
    });
    
    // Ajouter les relations inversées manquantes
    const inverseRelations = this.generateInverseRelations(tableName, table);
    if (inverseRelations.length > 0) {
      modelDefinition += '\n  // Relations inversées\n';
      inverseRelations.forEach(relation => {
        modelDefinition += `  ${relation}\n`;
      });
    }
    
    // Ajouter les index
    const indexes = this.generateIndexes(table);
    if (indexes.length > 0) {
      modelDefinition += '\n  // Index et contraintes\n';
      indexes.forEach(index => {
        modelDefinition += `  ${index}\n`;
      });
    }
    
    // Ajouter la directive de mapping pour la table
    modelDefinition += `\n  @@map("${tableName}")\n`;
    
    modelDefinition += '}\n\n';
    return modelDefinition;
  }

  /**
   * Génère un modèle Prisma pour une vue (commenté)
   */
  private generateViewModel(viewName: string, view: ViewInfo): string {
    // Convertir le nom de la vue en PascalCase
    const modelName = this.toPascalCase(viewName);
    
    let modelDefinition = `// Modèle de Vue (désactivé par défaut)
// Pour activer, retirez les commentaires et utilisez l'option "relationMode = 'prisma'" dans le bloc generator
// model ${modelName} {\n`;
    
    // Générer les champs de la vue
    Object.entries(view.columns).forEach(([columnName, column]) => {
      // Pour les vues, tous les champs sont en lecture seule
      const fieldType = column.suggestedPrismaType || this.getPrismaType(column);
      const fieldName = this.keepSnakeCase ? columnName : this.toCamelCase(columnName);
      const nullable = column.nullable ? '?' : '';
      
      modelDefinition += `//   ${fieldName} ${fieldType}${nullable}\n`;
    });
    
    modelDefinition += `//   @@map("${viewName}")\n`;
    modelDefinition += `//   @@schema("public") // Ajustez si la vue est dans un schéma spécifique\n`;
    modelDefinition += `// }\n\n`;
    
    return modelDefinition;
  }

  /**
   * Génère un champ Prisma pour une colonne
   */
  private generateField(columnName: string, column: ColumnInfo, table: TableInfo): string {
    // Convertir le nom de la colonne en camelCase pour Prisma (ou conserver snake_case si demandé)
    const fieldName = this.keepSnakeCase ? columnName : this.toCamelCase(columnName);
    
    // Déterminer le type Prisma à utiliser
    let fieldType = column.suggestedPrismaType || this.getPrismaType(column);
    
    // Déterminer si c'est une clé étrangère et gérer la relation
    const { isForeignKey, relationInfo } = this.detectForeignKey(columnName, table);
    
    // Si c'est une clé étrangère, ajuster le type et préparer la relation
    let relation = '';
    if (isForeignKey && relationInfo) {
      const targetModelName = this.toPascalCase(relationInfo.targetTable);
      
      fieldType = targetModelName;
      relation = `@relation(fields: [${fieldName}Id], references: [id])`;
      
      // Ajouter le champ de l'ID de la clé étrangère
      const foreignKeyField = `${fieldName}Id ${this.getForeignKeyType(relationInfo.targetTable, relationInfo.targetColumn)}`;
      const foreignKeyMap = fieldName !== columnName ? ` @map("${columnName}")` : '';
      
      return `${fieldName} ${fieldType}${column.nullable ? '?' : ''} ${relation}\n  ${foreignKeyField}${foreignKeyMap}`;
    }
    
    // Si c'est une clé primaire, ajouter @id
    let attributes = '';
    if (column.primaryKey) {
      attributes += ' @id';
      
      // Si c'est auto-increment, ajouter @default(autoincrement())
      if (column.autoIncrement) {
        attributes += ' @default(autoincrement())';
      }
    }
    
    // Si c'est unique, ajouter @unique
    if (column.unique && !column.primaryKey) {
      attributes += ' @unique';
    }
    
    // Si c'est nullable, ajouter un point d'interrogation au type
    const nullable = column.nullable ? '?' : '';
    
    // Si une valeur par défaut est spécifiée
    if (column.defaultValue !== undefined && column.defaultValue !== null && !column.autoIncrement) {
      attributes += this.generateDefaultValue(column);
    }
    
    // Ajouter le type PostgreSQL approprié avec @db
    const dbType = this.getPostgreSQLType(column);
    if (dbType) {
      attributes += ` @db.${dbType}`;
    }
    
    // Ajouter la directive de mapping pour la colonne si le nom est différent
    if (fieldName !== columnName && !isForeignKey) {
      attributes += ` @map("${columnName}")`;
    }
    
    // Ajouter un commentaire si présent
    let comment = '';
    if (column.comment) {
      comment = ` /// ${column.comment}`;
    }
    
    return `${fieldName} ${fieldType}${nullable}${attributes}${comment}`;
  }

  /**
   * Détecte si une colonne est une clé étrangère (explicite ou implicite)
   */
  private detectForeignKey(columnName: string, table: TableInfo): { 
    isForeignKey: boolean; 
    relationInfo?: { 
      type: RelationType; 
      targetTable: string; 
      targetColumn: string; 
    } 
  } {
    // Vérifier les clés étrangères explicites
    const explicitFK = table.foreignKeys?.find(fk => 
      fk.columns.includes(columnName)
    );
    
    if (explicitFK) {
      return {
        isForeignKey: true,
        relationInfo: {
          type: RelationType.MANY_TO_ONE,
          targetTable: explicitFK.referencedTable,
          targetColumn: explicitFK.referencedColumns[explicitFK.columns.indexOf(columnName)]
        }
      };
    }
    
    // Vérifier les clés étrangères implicites (nom se terminant par _id)
    if (columnName.endsWith('_id')) {
      const possibleTargetTable = columnName.slice(0, -3); // Supprimer le suffixe "_id"
      
      // Vérifier si une table avec ce nom existe
      if (this.schema.tables[possibleTargetTable]) {
        // Vérifier si la table cible a une colonne "id"
        const targetTable = this.schema.tables[possibleTargetTable];
        const idColumn = Object.entries(targetTable.columns).find(([_, col]) => col.primaryKey);
        
        if (idColumn) {
          return {
            isForeignKey: true,
            relationInfo: {
              type: RelationType.MANY_TO_ONE,
              targetTable: possibleTargetTable,
              targetColumn: idColumn[0]
            }
          };
        }
      }
    }
    
    return { isForeignKey: false };
  }

  /**
   * Génère les relations inversées manquantes
   */
  private generateInverseRelations(tableName: string, table: TableInfo): string[] {
    const inverseRelations: string[] = [];
    
    // Pour chaque clé étrangère qui référence cette table
    Object.entries(this.schema.tables).forEach(([sourceTableName, sourceTable]) => {
      if (sourceTableName === tableName) return; // Ignorer la même table
      
      // Vérifier les clés étrangères explicites
      sourceTable.foreignKeys?.forEach(fk => {
        if (fk.referencedTable === tableName) {
          // C'est une relation inverse - cette table est référencée par une autre
          const sourceModelName = this.toPascalCase(sourceTableName);
          const relationFieldName = this.pluralize(this.keepSnakeCase ? sourceTableName : this.toCamelCase(sourceTableName));
          
          // Éviter les doublons de noms de champs
          if (Object.keys(table.columns).some(col => 
            (this.keepSnakeCase ? col : this.toCamelCase(col)) === relationFieldName
          )) {
            this.warnings.push(`Conflit de nom pour la relation inverse ${tableName} -> ${sourceTableName}: ${relationFieldName} existe déjà comme champ`);
            return;
          }
          
          inverseRelations.push(`${relationFieldName} ${sourceModelName}[] @relation("${sourceTableName}_${fk.name}")`);
        }
      });
      
      // Vérifier les clés étrangères implicites
      Object.entries(sourceTable.columns).forEach(([columnName, column]) => {
        if (columnName.endsWith('_id') && columnName.slice(0, -3) === tableName) {
          // C'est une relation inverse implicite
          const sourceModelName = this.toPascalCase(sourceTableName);
          const relationFieldName = this.pluralize(this.keepSnakeCase ? sourceTableName : this.toCamelCase(sourceTableName));
          
          // Éviter les doublons
          if (Object.keys(table.columns).some(col => 
            (this.keepSnakeCase ? col : this.toCamelCase(col)) === relationFieldName
          )) {
            return;
          }
          
          // Éviter les doublons avec les relations explicites
          if (inverseRelations.some(r => r.startsWith(relationFieldName))) {
            return;
          }
          
          inverseRelations.push(`${relationFieldName} ${sourceModelName}[] @relation("${sourceTableName}_${columnName}")`);
        }
      });
    });
    
    return inverseRelations;
  }

  /**
   * Génère les directives d'index pour une table
   */
  private generateIndexes(table: TableInfo): string[] {
    const indexes: string[] = [];
    
    table.indexes?.forEach(index => {
      // Ignorer l'index de clé primaire (déjà géré via @id)
      if (index.name === 'PRIMARY' || index.columns.every(col => {
        const column = table.columns[col];
        return column && column.primaryKey;
      })) {
        return;
      }
      
      // Transformer les noms de colonnes en camelCase si nécessaire
      const columnNames = index.columns.map(col => 
        this.keepSnakeCase ? col : this.toCamelCase(col)
      );
      
      const indexFields = columnNames.map(col => col).join(', ');
      
      if (index.unique) {
        if (columnNames.length === 1) {
          // Déjà géré dans generateField avec @unique
          return;
        }
        indexes.push(`@@unique([${indexFields}], name: "${index.name}")`);
      } else {
        indexes.push(`@@index([${indexFields}], name: "${index.name}")`);
      }
    });
    
    return indexes;
  }

  /**
   * Génère une directive @default pour une colonne
   */
  private generateDefaultValue(column: ColumnInfo): string {
    const defaultValue = column.defaultValue;
    
    if (defaultValue === null || defaultValue === undefined) {
      return '';
    }
    
    // Pour les timestamps automatiques
    if (defaultValue === 'CURRENT_TIMESTAMP' || defaultValue === 'NOW()') {
      return ' @default(now())';
    }
    
    // Pour les UUIDs
    if (defaultValue === 'UUID()' || defaultValue === 'uuid_generate_v4()') {
      return ' @default(uuid())';
    }
    
    // Pour les types numériques
    if (['Int', 'Float', 'Decimal', 'BigInt'].includes(column.suggestedPrismaType || '')) {
      // Valeurs spéciales
      if (defaultValue === '0' || defaultValue === 0) {
        return ' @default(0)';
      }
      return ` @default(${defaultValue})`;
    }
    
    // Pour les types booléens
    if (column.suggestedPrismaType === 'Boolean') {
      const boolValue = defaultValue === '1' || defaultValue.toLowerCase() === 'true';
      return ` @default(${boolValue})`;
    }
    
    // Pour les strings
    if (column.suggestedPrismaType === 'String') {
      return ` @default("${defaultValue.replace(/"/g, '\\"')}")`;
    }
    
    // Pour les autres types, entourer de guillemets
    return ` @default("${defaultValue}")`;
  }

  /**
   * Obtient le type Prisma pour une colonne
   */
  private getPrismaType(column: ColumnInfo): string {
    // Rechercher dans le mapping des types
    const baseType = column.type.toUpperCase().replace(/\(.+\)/, '').trim();
    
    // Cas spécial pour TINYINT(1) qui est généralement un booléen
    if (column.originalType.toUpperCase() === 'TINYINT(1)') {
      return 'Boolean';
    }
    
    const mappedType = Object.entries(this.typeMapping.mysql).find(([mysqlType, _]) => {
      return mysqlType === baseType || baseType.startsWith(mysqlType);
    });
    
    if (mappedType) {
      return mappedType[1].prisma;
    }
    
    // Type par défaut si non trouvé
    this.warnings.push(`Type non mappé: ${column.originalType} -> utilisation de String par défaut`);
    return 'String';
  }

  /**
   * Obtient le type PostgreSQL pour une colonne
   */
  private getPostgreSQLType(column: ColumnInfo): string {
    const baseType = column.type.toUpperCase().replace(/\(.+\)/, '').trim();
    
    // Extraire les paramètres (taille, précision, etc.)
    const match = column.originalType.match(/\((.+?)\)/);
    const params = match ? match[1] : '';
    
    switch (baseType) {
      case 'VARCHAR':
      case 'CHAR':
        return `VarChar(${params || '255'})`;
      case 'TEXT':
        return 'Text';
      case 'INT':
      case 'INTEGER':
        return 'Integer';
      case 'BIGINT':
        return 'BigInt';
      case 'DECIMAL':
      case 'NUMERIC':
        return `Decimal(${params || '10,2'})`;
      case 'FLOAT':
      case 'DOUBLE':
        return 'DoublePrecision';
      case 'BOOLEAN':
      case 'TINYINT': // TINYINT(1) en MySQL est souvent utilisé comme booléen
        if (column.originalType.toUpperCase() === 'TINYINT(1)') {
          return 'Boolean';
        }
        return 'SmallInt';
      case 'DATE':
        return 'Date';
      case 'TIMESTAMP':
      case 'DATETIME':
        return 'Timestamp(6)';
      case 'JSON':
      case 'JSONB':
        return 'JsonB';
      case 'ENUM':
        // Les ENUM MySQL sont généralement convertis en type TEXT dans PostgreSQL
        return 'Text';
      default:
        return '';
    }
  }

  /**
   * Obtient le type pour une clé étrangère
   */
  private getForeignKeyType(targetTable: string, targetColumn: string): string {
    if (!this.schema.tables[targetTable] || !this.schema.tables[targetTable].columns[targetColumn]) {
      return 'Int';
    }
    
    const column = this.schema.tables[targetTable].columns[targetColumn];
    return column.suggestedPrismaType || this.getPrismaType(column);
  }

  /**
   * Trouve le domaine fonctionnel d'un modèle
   */
  private findDomainForModel(modelName: string): string {
    for (const [domain, models] of Object.entries(this.domainModels)) {
      if (models.includes(modelName)) {
        return domain;
      }
    }
    return 'non-classé';
  }

  /**
   * Génère des fichiers Prisma séparés par domaine fonctionnel
   */
  private generateDomainSplitFiles(outputDir: string): void {
    console.log(chalk.blue('📦 Génération des fichiers par domaine...'));

    // Créer un fichier d'index qui importe tous les modèles
    let indexContent = `// Fichier d'index Prisma - importe tous les modèles par domaine
// Généré automatiquement par l'Agent 6 - Générateur Prisma Intelligent

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "relationJoins", "multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [citext, pg_trgm]
}

`;

    // Générer un fichier par domaine
    Object.entries(this.domainModels).forEach(([domain, models]) => {
      if (models.length === 0) return; // Ignorer les domaines vides
      
      // Créer le contenu du fichier de domaine
      let domainContent = `// Modèles Prisma du domaine: ${domain}
// Généré automatiquement par l'Agent 6 - Générateur Prisma Intelligent

`;

      // Ajouter les modèles à ce domaine
      models.forEach(modelName => {
        // Retrouver le nom de la table originale
        const tableName = Object.entries(this.modelMappings)
          .find(([prismaModel, _]) => prismaModel === modelName)?.[1].mysqlTable;
        
        if (tableName && this.schema.tables[tableName]) {
          domainContent += this.generateModel(tableName, this.schema.tables[tableName]);
        }
      });

      // Écrire le fichier de domaine
      const domainFileName = `${domain.toLowerCase()}.prisma`;
      fs.writeFileSync(path.join(outputDir, domainFileName), domainContent);
      console.log(chalk.green(`✅ Fichier de domaine généré: ${domainFileName}`));
      
      // Ajouter l'import au fichier d'index
      indexContent += `// Importer le domaine ${domain}\n`;
      indexContent += `import "${domainFileName}"\n\n`;
    });

    // Écrire le fichier d'index
    fs.writeFileSync(path.join(outputDir, 'index.prisma'), indexContent);
    console.log(chalk.green('✅ Fichier d\'index généré: index.prisma'));
  }

  /**
   * Génère le fichier de mapping
   */
  private generateMappingFile(outputDir: string): void {
    fs.writeFileSync(
      path.join(outputDir, 'prisma_model_map.json'),
      JSON.stringify(this.modelMappings, null, 2)
    );
    console.log(chalk.green('✅ Fichier de mapping généré: prisma_model_map.json'));
  }

  /**
   * Génère le fichier d'avertissements
   */
  private generateWarningsFile(outputDir: string): void {
    let content = `# Avertissements et Problèmes Potentiels

Ce fichier contient les avertissements et problèmes détectés lors de la génération du schéma Prisma.

## Points d'attention

${this.warnings.length > 0 
  ? this.warnings.map(w => `- ⚠️ ${w}`).join('\n') 
  : '- ✅ Aucun avertissement détecté'}

## Suggestions d'optimisation

- Vérifiez que les relations ont été correctement détectées et établies
- Assurez-vous que les types de données sont adaptés à vos besoins
- Examinez les valeurs par défaut pour confirmer qu'elles sont correctement transposées
- Validez les index et contraintes pour optimiser les performances

## Vues et Tables Temporaires

Les vues sont commentées dans le schéma. Pour les activer, retirez les commentaires et utilisez l'option appropriée.

`;

    fs.writeFileSync(path.join(outputDir, 'prisma_warnings.md'), content);
    console.log(chalk.green('✅ Fichier d\'avertissements généré: prisma_warnings.md'));
  }

  /**
   * Génère le fichier de suggestions de découpage en modules
   */
  private generateModuleSplitsFile(outputDir: string): void {
    let content = `# Suggestions de Découpage en Modules

Ce fichier propose une organisation modulaire du schéma Prisma pour une meilleure maintenabilité.

## Modules Fonctionnels

`;

    Object.entries(this.domainModels).forEach(([domain, models]) => {
      if (models.length === 0) return;
      
      content += `### Module ${domain.toUpperCase()}\n\n`;
      content += `Responsabilité: ${this.tableClassification.domains[domain]?.description || 'Non spécifiée'}\n\n`;
      content += `Modèles inclus:\n`;
      models.forEach(model => {
        content += `- ${model}\n`;
      });
      content += '\n';
    });

    content += `## Comment Utiliser le Multi-Fichiers

Pour utiliser Prisma avec plusieurs fichiers:

1. Activez la fonctionnalité multiSchema dans le générateur:
   \`\`\`prisma
   generator client {
     provider = "prisma-client-js"
     previewFeatures = ["multiSchema"]
   }
   \`\`\`

2. Importez les fichiers dans votre index.prisma:
   \`\`\`prisma
   import "./user.prisma"
   import "./product.prisma"
   // etc.
   \`\`\`

3. Exécutez la génération comme d'habitude:
   \`\`\`
   npx prisma generate
   \`\`\`
`;

    fs.writeFileSync(path.join(outputDir, 'module_splits.md'), content);
    console.log(chalk.green('✅ Fichier de découpage en modules généré: module_splits.md'));
  }

  /**
   * Convertit une chaîne en PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convertit une chaîne en camelCase
   */
  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  /**
   * Met au pluriel une chaîne
   */
  private pluralize(str: string): string {
    // Règles de pluralisation simplifiées
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
        str.endsWith('ch') || str.endsWith('sh')) {
      return str + 'es';
    } else if (str.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(str.charAt(str.length - 2).toLowerCase())) {
      return str.slice(0, -1) + 'ies';
    } else {
      return str + 's';
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(chalk.blue('🚀 Démarrage du Générateur Prisma Intelligent'));

    // Vérifier que les fichiers d'entrée existent
    if (!fs.existsSync(options.inputSchema)) {
      console.error(chalk.red(`❌ Erreur: Le fichier de schéma ${options.inputSchema} n'existe pas.`));
      console.log(chalk.yellow('💡 Utilisez l\'agent MySQL Analyzer pour générer ce fichier d\'abord.'));
      process.exit(1);
    }

    // Créer le générateur
    const generator = new PrismaSmartGenerator(
      options.inputSchema,
      options.typeMapping,
      options.tableClassification,
      options.keepSnakeCase
    );

    // Générer le schéma
    await generator.generate(options.outputDir, options.multiFile);

  } catch (error: any) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`❌ Erreur non gérée: ${error.message}`));
  console.error(error);
  process.exit(1);
});