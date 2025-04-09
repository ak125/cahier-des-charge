#!/usr/bin/env node

/**
 * MySQL Analyzer + Optimizer
 * 
 * Analyse un schéma MySQL et génère une structure Prisma optimisée
 * avec détection de dette technique et suggestions d'améliorations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';

// Types pour les résultats de l'analyse
interface MySQLColumn {
  type: string;
  nullable: boolean;
  default?: string;
  isPrimary: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  comment?: string;
}

interface MySQLTable {
  columns: Record<string, MySQLColumn>;
  primaryKey?: string[];
  uniqueKeys?: Record<string, string[]>;
  foreignKeys?: Record<string, {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  }>;
  indexes?: Record<string, string[]>;
  engine?: string;
  comment?: string;
}

interface MySQLSchema {
  tables: Record<string, MySQLTable>;
}

interface PrismaField {
  prisma: string;
  originalType?: string;
  reason?: string;
}

interface PrismaMapping {
  [tableName: string]: Record<string, PrismaField>;
}

interface SQLIssue {
  type: 'no_primary_key' | 'implicit_relation' | 'type_issue' | 'missing_index' | 'naming_convention';
  table: string;
  column?: string;
  description: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

// Configuration du programme
program
  .name('mysql-analyzer+optimizer')
  .description('Analyze MySQL schema and generate optimized Prisma schema')
  .version('1.0.0')
  .requiredOption('-i, --input <path>', 'MySQL schema dump file path')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-c, --config <path>', 'Configuration file path', './mysql_type_converter.json')
  .option('--existing-prisma <path>', 'Path to existing Prisma schema for diff')
  .option('--classify', 'Classify tables by business domain', true)
  .option('--detect-debt', 'Detect SQL technical debt', true)
  .option('--verbose', 'Verbose output', false);

program.parse();
const options = program.opts();

// Point d'entrée principal
async function main() {
  try {
    console.log('🔍 MySQL Analyzer + Optimizer starting...');
    const startTime = Date.now();
    
    // 1. Vérifier l'existence du fichier d'entrée
    const sqlFilePath = path.resolve(options.input);
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Input SQL file not found: ${sqlFilePath}`);
    }
    
    // 2. Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.resolve(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 3. Charger le fichier de configuration
    const configPath = path.resolve(options.config);
    let typeConverter = {};
    if (fs.existsSync(configPath)) {
      typeConverter = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`✅ Loaded type converter config from ${configPath}`);
    } else {
      console.warn(`⚠️ Type converter config not found, using defaults: ${configPath}`);
      typeConverter = getDefaultTypeConverter();
    }
    
    // 4. Lire et parser le fichier SQL
    console.log(`🔍 Parsing SQL schema file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const mysqlSchema = parseMySQLSchema(sqlContent);
    console.log(`✅ Parsed SQL schema with ${Object.keys(mysqlSchema.tables).length} tables`);
    
    // 5. Générer le fichier mysql_schema_map.json
    const schemaMapPath = path.join(outputDir, 'mysql_schema_map.json');
    fs.writeFileSync(schemaMapPath, JSON.stringify(mysqlSchema, null, 2));
    console.log(`✅ Generated MySQL schema map: ${schemaMapPath}`);
    
    // 6. Classifier les tables (optionnel)
    let tableClassification = {};
    if (options.classify) {
      console.log('🔍 Classifying tables by business domain...');
      tableClassification = classifyTables(mysqlSchema);
      
      // Écrire la classification
      const classificationPath = path.join(outputDir, 'table_classification.json');
      fs.writeFileSync(classificationPath, JSON.stringify(tableClassification, null, 2));
      console.log(`✅ Generated table classification: ${classificationPath}`);
    }
    
    // 7. Détecter la dette technique SQL (optionnel)
    let sqlIssues: SQLIssue[] = [];
    if (options.detectDebt) {
      console.log('🔍 Detecting SQL technical debt...');
      sqlIssues = detectSQLTechnicalDebt(mysqlSchema);
      
      // Générer le rapport d'analyse SQL
      const sqlAnalysisPath = path.join(outputDir, 'sql_analysis.md');
      fs.writeFileSync(sqlAnalysisPath, generateSQLAnalysisReport(sqlIssues));
      console.log(`✅ Generated SQL analysis report: ${sqlAnalysisPath}`);
    }
    
    // 8. Générer le mapping MySQL vers Prisma
    console.log('🔍 Generating MySQL to Prisma mapping...');
    const prismaMapping = generatePrismaMapping(mysqlSchema, typeConverter);
    
    // Écrire le fichier de mapping
    const mappingPath = path.join(outputDir, 'mysql_to_prisma_map.json');
    fs.writeFileSync(mappingPath, JSON.stringify(prismaMapping, null, 2));
    console.log(`✅ Generated MySQL to Prisma mapping: ${mappingPath}`);
    
    // 9. Générer le schéma Prisma
    console.log('🔍 Generating Prisma schema...');
    const prismaSchema = generatePrismaSchema(prismaMapping, mysqlSchema);
    
    // Écrire le schéma Prisma
    const prismaSchemaPath = path.join(outputDir, 'prisma_models.suggestion.prisma');
    fs.writeFileSync(prismaSchemaPath, prismaSchema);
    console.log(`✅ Generated Prisma schema: ${prismaSchemaPath}`);
    
    // 10. Générer le diff si un schéma Prisma existant est fourni
    if (options.existingPrisma) {
      const existingPrismaPath = path.resolve(options.existingPrisma);
      if (fs.existsSync(existingPrismaPath)) {
        console.log(`🔍 Generating diff with existing Prisma schema: ${existingPrismaPath}`);
        const schemaDiff = generateSchemaDiff(
          fs.readFileSync(existingPrismaPath, 'utf8'),
          prismaSchema
        );
        
        // Écrire le diff
        const diffPath = path.join(outputDir, 'schema_migration_diff.json');
        fs.writeFileSync(diffPath, JSON.stringify(schemaDiff, null, 2));
        console.log(`✅ Generated schema migration diff: ${diffPath}`);
      } else {
        console.warn(`⚠️ Existing Prisma schema not found: ${existingPrismaPath}`);
      }
    }
    
    const endTime = Date.now();
    console.log(`✅ MySQL Analyzer + Optimizer completed in ${(endTime - startTime) / 1000}s`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Parse un schéma MySQL à partir d'un dump SQL
 */
function parseMySQLSchema(sqlContent: string): MySQLSchema {
  // Cette fonction serait implémentée avec une analyse approfondie du SQL
  // Pour l'exemple, nous retournons une structure simplifiée
  
  const schema: MySQLSchema = { tables: {} };
  
  // Analyse des CREATE TABLE
  const createTableRegex = /CREATE\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE\s*=\s*([a-zA-Z0-9_]+))?[\s\S]*?(?:COMMENT\s*=\s*'([^']*)')?/g;
  
  let match;
  while ((match = createTableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const tableContent = match[2];
    const engine = match[3];
    const comment = match[4];
    
    const table: MySQLTable = {
      columns: {},
      primaryKey: undefined,
      uniqueKeys: {},
      foreignKeys: {},
      indexes: {},
      engine,
      comment
    };
    
    // Analyse des colonnes et contraintes
    // Note: Ceci est simplifié et devrait être plus robuste dans une implémentation réelle
    const lines = tableContent.split(',\n').map(line => line.trim());
    
    for (const line of lines) {
      // Détection de colonne
      const columnMatch = line.match(/^`?([a-zA-Z0-9_]+)`?\s+([A-Za-z0-9()]+)\s*(.*)/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        const columnType = columnMatch[2];
        const columnOptions = columnMatch[3];
        
        // Analyse des options de colonne
        const isNullable = !columnOptions.includes('NOT NULL');
        const isPrimary = columnOptions.includes('PRIMARY KEY');
        const isUnique = columnOptions.includes('UNIQUE');
        const isAutoIncrement = columnOptions.includes('AUTO_INCREMENT');
        
        // Recherche d'une valeur par défaut
        let defaultValue;
        const defaultMatch = columnOptions.match(/DEFAULT\s+([^,\s]+)/);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }
        
        // Recherche d'un commentaire
        let comment;
        const commentMatch = columnOptions.match(/COMMENT\s+'([^']+)'/);
        if (commentMatch) {
          comment = commentMatch[1];
        }
        
        table.columns[columnName] = {
          type: columnType,
          nullable: isNullable,
          default: defaultValue,
          isPrimary,
          isUnique,
          isAutoIncrement,
          comment
        };
        
        if (isPrimary) {
          table.primaryKey = [columnName];
        }
      }
      
      // Détection de clé primaire
      const primaryKeyMatch = line.match(/PRIMARY\s+KEY\s+\(([^)]+)\)/i);
      if (primaryKeyMatch) {
        table.primaryKey = primaryKeyMatch[1]
          .split(',')
          .map(col => col.trim().replace(/^`|`$/g, ''));
      }
      
      // Détection de clé étrangère
      const foreignKeyMatch = line.match(/FOREIGN\s+KEY\s+\(`?([a-zA-Z0-9_]+)`?\)\s+REFERENCES\s+`?([a-zA-Z0-9_]+)`?\s*\(`?([a-zA-Z0-9_]+)`?\)/i);
      if (foreignKeyMatch) {
        const columnName = foreignKeyMatch[1];
        const refTable = foreignKeyMatch[2];
        const refColumn = foreignKeyMatch[3];
        
        table.foreignKeys = table.foreignKeys || {};
        table.foreignKeys[columnName] = {
          table: refTable,
          column: refColumn
        };
        
        // Détection des options ON DELETE/UPDATE
        const onDeleteMatch = line.match(/ON\s+DELETE\s+([A-Z\s]+)/i);
        if (onDeleteMatch) {
          table.foreignKeys[columnName].onDelete = onDeleteMatch[1].trim();
        }
        
        const onUpdateMatch = line.match(/ON\s+UPDATE\s+([A-Z\s]+)/i);
        if (onUpdateMatch) {
          table.foreignKeys[columnName].onUpdate = onUpdateMatch[1].trim();
        }
      }
    }
    
    schema.tables[tableName] = table;
  }
  
  return schema;
}

/**
 * Retourne le convertisseur de types par défaut
 */
function getDefaultTypeConverter(): Record<string, any> {
  return {
    "typeMapping": {
      "INT": "Int",
      "BIGINT": "BigInt",
      "SMALLINT": "Int",
      "TINYINT(1)": "Boolean",
      "TINYINT": "Int",
      "DECIMAL": "Decimal",
      "FLOAT": "Float",
      "DOUBLE": "Float",
      "VARCHAR": "String",
      "CHAR": "String",
      "TEXT": "String",
      "MEDIUMTEXT": "String",
      "LONGTEXT": "String",
      "JSON": "Json",
      "DATETIME": "DateTime",
      "TIMESTAMP": "DateTime",
      "DATE": "DateTime",
      "TIME": "String",
      "ENUM": "String",
      "SET": "String",
      "BLOB": "Bytes",
      "MEDIUMBLOB": "Bytes",
      "LONGBLOB": "Bytes"
    },
    "defaultAttributes": {
      "primaryKey": "@id",
      "autoIncrement": "@default(autoincrement())",
      "now": "@default(now())",
      "uuid": "@default(uuid())"
    },
    "namingConvention": {
      "table": "PascalCase",
      "column": "camelCase",
      "relationField": "camelCase"
    }
  };
}

/**
 * Classifie les tables par domaine métier
 */
function classifyTables(schema: MySQLSchema): Record<string, string[]> {
  const classification: Record<string, string[]> = {
    ecommerce: [],
    users: [],
    seo: [],
    stats: [],
    config: [],
    other: []
  };
  
  // Patterns de classification
  const patterns = {
    ecommerce: /(?:product|order|cart|basket|customer|shipping|payment|invoice|catalog)/i,
    users: /(?:user|member|account|auth|permission|role|profile)/i,
    seo: /(?:seo|meta|redirect|slug|url|sitemap)/i,
    stats: /(?:stat|analytics|log|counter|tracking)/i,
    config: /(?:config|setting|parameter|variable)/i
  };
  
  // Classifier chaque table
  for (const tableName of Object.keys(schema.tables)) {
    let classified = false;
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(tableName)) {
        classification[category].push(tableName);
        classified = true;
        break;
      }
    }
    
    if (!classified) {
      classification.other.push(tableName);
    }
  }
  
  return classification;
}

/**
 * Détecte la dette technique SQL
 */
function detectSQLTechnicalDebt(schema: MySQLSchema): SQLIssue[] {
  const issues: SQLIssue[] = [];
  
  // Parcourir toutes les tables
  for (const [tableName, table] of Object.entries(schema.tables)) {
    // Vérifier la présence d'une clé primaire
    if (!table.primaryKey || table.primaryKey.length === 0) {
      issues.push({
        type: 'no_primary_key',
        table: tableName,
        description: `La table ${tableName} n'a pas de clé primaire définie`,
        suggestion: 'Ajouter une clé primaire, idéalement un ID auto-incrémenté',
        severity: 'high'
      });
    }
    
    // Vérifier les relations implicites (colonnes *_id sans FK)
    for (const [columnName, column] of Object.entries(table.columns)) {
      if (columnName.endsWith('_id') && columnName !== 'id') {
        const hasForeignKey = table.foreignKeys && 
                              Object.keys(table.foreignKeys).includes(columnName);
        
        if (!hasForeignKey) {
          issues.push({
            type: 'implicit_relation',
            table: tableName,
            column: columnName,
            description: `Relation implicite détectée: ${tableName}.${columnName} semble être une clé étrangère mais n'est pas déclarée comme telle`,
            suggestion: `Ajouter une contrainte de clé étrangère pour ${columnName}`,
            severity: 'medium'
          });
        }
      }
      
      // Vérifier les problèmes de typage
      if (column.type === 'TEXT' && !column.comment?.includes('long')) {
        issues.push({
          type: 'type_issue',
          table: tableName,
          column: columnName,
          description: `Le type TEXT pour ${tableName}.${columnName} est potentiellement surdimensionné`,
          suggestion: 'Envisager d\'utiliser VARCHAR(255) ou VARCHAR(512) si le contenu est généralement court',
          severity: 'low'
        });
      }
      
      if (column.type.startsWith('VARCHAR') && column.type.includes('9999')) {
        issues.push({
          type: 'type_issue',
          table: tableName,
          column: columnName,
          description: `VARCHAR excessivement large pour ${tableName}.${columnName}`,
          suggestion: 'Réduire la taille maximale à une valeur plus appropriée',
          severity: 'low'
        });
      }
    }
  }
  
  return issues;
}

/**
 * Génère un rapport d'analyse SQL au format Markdown
 */
function generateSQLAnalysisReport(issues: SQLIssue[]): string {
  let markdown = '## Audit Technique MySQL\n\n';
  
  // Regrouper les problèmes par sévérité
  const groupedIssues = {
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low')
  };
  
  // Section des problèmes critiques
  if (groupedIssues.high.length > 0) {
    markdown += '### 🔴 Problèmes critiques :\n';
    
    for (const issue of groupedIssues.high) {
      const location = issue.column ? `\`${issue.table}.${issue.column}\`` : `\`${issue.table}\``;
      markdown += `- ${location} : ${issue.description}\n`;
      markdown += `  - **Suggestion** : ${issue.suggestion}\n\n`;
    }
  }
  
  // Section des problèmes moyens
  if (groupedIssues.medium.length > 0) {
    markdown += '### 🟠 Problèmes modérés :\n';
    
    for (const issue of groupedIssues.medium) {
      const location = issue.column ? `\`${issue.table}.${issue.column}\`` : `\`${issue.table}\``;
      markdown += `- ${location} : ${issue.description}\n`;
      markdown += `  - **Suggestion** : ${issue.suggestion}\n\n`;
    }
  }
  
  // Section des problèmes mineurs
  if (groupedIssues.low.length > 0) {
    markdown += '### 🟡 Optimisations suggérées :\n';
    
    for (const issue of groupedIssues.low) {
      const location = issue.column ? `\`${issue.table}.${issue.column}\`` : `\`${issue.table}\``;
      markdown += `- ${location} : ${issue.description}\n`;
      markdown += `  - **Suggestion** : ${issue.suggestion}\n\n`;
    }
  }
  
  // Résumé des améliorations générales
  markdown += '### Suggestions générales :\n';
  markdown += '- Remplacer `ENUM` par `VARCHAR` pour une meilleure compatibilité\n';
  markdown += '- Remplacer `TINYINT(1)` par `BOOLEAN` pour plus de clarté\n';
  markdown += '- Convertir `DATETIME DEFAULT 0` en `TIMESTAMP DEFAULT now()`\n';
  markdown += '- Ajouter des index sur les colonnes fréquemment utilisées dans les clauses WHERE\n';
  markdown += '- Standardiser les conventions de nommage (snake_case ou camelCase)\n';
  
  return markdown;
}

/**
 * Génère un mapping MySQL vers Prisma
 */
function generatePrismaMapping(
  schema: MySQLSchema,
  typeConverter: any
): PrismaMapping {
  const mapping: PrismaMapping = {};
  
  // Règles de conversion des noms de table
  function convertTableName(name: string): string {
    // Exemple simple: AUTO_PANIER -> Panier
    if (name.includes('_')) {
      return name
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
    }
    
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Règles de conversion des noms de colonne
  function convertColumnName(name: string): string {
    // snake_case -> camelCase
    if (name.includes('_')) {
      return name
        .split('_')
        .map((part, index) => {
          if (index === 0) return part.toLowerCase();
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('');
    }
    
    return name.toLowerCase();
  }
  
  // Convertir le type MySQL en type Prisma
  function convertType(mysqlType: string, column: MySQLColumn): string {
    // Extraire le type de base (sans taille)
    const baseType = mysqlType.split('(')[0].toUpperCase();
    
    // Cas spécial pour TINYINT(1) -> Boolean
    if (mysqlType.toUpperCase() === 'TINYINT(1)') {
      return 'Boolean';
    }
    
    // Utiliser le mapping défini dans le convertisseur
    return typeConverter.typeMapping[baseType] || 'String';
  }
  
  // Générer les attributs Prisma
  function generateAttributes(
    columnName: string,
    column: MySQLColumn,
    table: MySQLTable
  ): string[] {
    const attributes: string[] = [];
    
    // Gérer la clé primaire
    if (column.isPrimary || 
        (table.primaryKey && table.primaryKey.includes(columnName))) {
      attributes.push('@id');
    }
    
    // Gérer l'auto-incrément
    if (column.isAutoIncrement) {
      attributes.push('@default(autoincrement())');
    }
    
    // Gérer les valeurs par défaut
    if (column.default) {
      if (column.default === 'CURRENT_TIMESTAMP') {
        attributes.push('@default(now())');
      } else if (column.default === 'NULL') {
        // Ne rien ajouter pour NULL
      } else if (column.type === 'DATETIME' || column.type === 'TIMESTAMP') {
        // Pour les dates, utiliser now() si applicable
        attributes.push('@default(now())');
      } else {
        // Autres valeurs par défaut
        attributes.push(`@default(${column.default})`);
      }
    }
    
    // Gérer les champs uniques
    if (column.isUnique) {
      attributes.push('@unique');
    }
    
    // Ajouter @map si le nom de colonne change
    const originalName = columnName;
    const camelCaseName = convertColumnName(columnName);
    if (camelCaseName !== originalName) {
      attributes.push(`@map("${originalName}")`);
    }
    
    return attributes;
  }
  
  // Parcourir toutes les tables
  for (const [tableName, table] of Object.entries(schema.tables)) {
    mapping[tableName] = {};
    
    // Convertir les colonnes
    for (const [columnName, column] of Object.entries(table.columns)) {
      const prismaType = convertType(column.type, column);
      const attributes = generateAttributes(columnName, column, table);
      
      const prismaField: PrismaField = {
        prisma: `${prismaType}${column.nullable ? '?' : ''} ${attributes.join(' ')}`,
        originalType: column.type
      };
      
      // Ajouter une raison si le type est converti
      if (prismaType !== column.type) {
        prismaField.reason = `Conversion de ${column.type} vers ${prismaType}`;
      }
      
      mapping[tableName][columnName] = prismaField;
    }
    
    // Gérer les relations
    if (table.foreignKeys) {
      for (const [columnName, fk] of Object.entries(table.foreignKeys)) {
        const targetTable = convertTableName(fk.table);
        const relationField = convertColumnName(columnName);
        const camelCaseTargetTable = targetTable.charAt(0).toLowerCase() + targetTable.slice(1);
        
        // Ajouter les champs de relation
        mapping[tableName][columnName] = {
          prisma: `${targetTable} @relation(fields: [${relationField}], references: [id])`,
          reason: `Relation vers ${targetTable}`
        };
        
        // Ajouter le champ de jointure
        const joinFieldName = relationField !== columnName ? relationField : columnName;
        mapping[tableName][joinFieldName] = {
          prisma: 'Int',
          reason: 'Champ de jointure'
        };
      }
    }
  }
  
  return mapping;
}

/**
 * Génère un schéma Prisma à partir du mapping
 */
function generatePrismaSchema(
  mapping: PrismaMapping,
  mysqlSchema: MySQLSchema
): string {
  let prismaSchema = `// Schema Prisma généré à partir de MySQL
// Généré le ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
  
  // Fonction de conversion des noms de table
  function convertTableName(name: string): string {
    // Exemple simple: AUTO_PANIER -> Panier
    if (name.includes('_')) {
      return name
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
    }
    
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Fonction de conversion des noms de colonne
  function convertColumnName(name: string): string {
    // snake_case -> camelCase
    if (name.includes('_')) {
      return name
        .split('_')
        .map((part, index) => {
          if (index === 0) return part.toLowerCase();
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('');
    }
    
    return name.toLowerCase();
  }
  
  // Générer les modèles Prisma
  for (const [tableName, columns] of Object.entries(mapping)) {
    const modelName = convertTableName(tableName);
    
    prismaSchema += `model ${modelName} {\n`;
    
    // Ajouter les champs
    for (const [columnName, field] of Object.entries(columns)) {
      const fieldName = convertColumnName(columnName);
      prismaSchema += `  ${fieldName} ${field.prisma}\n`;
    }
    
    // Ajouter le mapping de table si le nom est modifié
    if (modelName.toLowerCase() !== tableName.toLowerCase()) {
      prismaSchema += `\n  @@map("${tableName}")\n`;
    }
    
    prismaSchema += `}\n\n`;
  }
  
  return prismaSchema;
}

/**
 * Génère un diff entre un schéma Prisma existant et le nouveau
 */
function generateSchemaDiff(
  existingSchema: string,
  newSchema: string
): any {
  // Cette fonction serait implémentée pour comparer les schémas
  // Pour l'exemple, nous retournons une structure simplifiée
  
  return {
    "metadata": {
      "source": "mysql.sql",
      "target": "schema.prisma",
      "generatedAt": new Date().toISOString(),
      "agent": "mysql-analyzer+optimizer"
    },
    "tables": {
      // Exemple simplifié
      "AUTO_PANIER": {
        "status": "modified",
        "changes": {
          "columns": {
            "created_at": {
              "type": "DATETIME → DateTime",
              "mappedTo": "createdAt",
              "note": "conversion automatique"
            }
          }
        }
      }
    }
  };
}

// Exécuter le programme
if (require.main === module) {
  main();
}
