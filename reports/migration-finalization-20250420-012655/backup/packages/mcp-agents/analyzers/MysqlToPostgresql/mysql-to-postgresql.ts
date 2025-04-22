#!/usr/bin/env node
/**
 * mysql-to-postgresql.ts
 *
 * Agent qui convertit un schéma MySQL en schéma PostgreSQL compatible
 * en tenant compte des spécificités des deux systèmes.
 *
 * Usage : 
 *   ts-node mysql-to-postgresql.ts --input=dump.mysql.sql --output=dump.pg.sql --map=type_mapping.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import chalk from 'chalk';

// Types pour les mappings et les conversions
interface TypeMapping {
  mysql: string;
  postgresql: string;
  notes?: string;
}

interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKey?: string[];
  foreignKeys: ForeignKeyDefinition[];
  indexes: IndexDefinition[];
  comment?: string;
  engine?: string;
  charset?: string;
  collation?: string;
}

interface ColumnDefinition {
  name: string;
  mysqlType: string;
  postgresqlType?: string;
  nullable: boolean;
  defaultValue?: string;
  comment?: string;
  extra?: string;
  constraints?: string[];
}

interface ForeignKeyDefinition {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
  type?: string;
}

interface MigrationReport {
  tables: {
    total: number;
    converted: number;
    warnings: number;
    errors: number;
  };
  columns: {
    total: number;
    converted: number;
    warnings: number;
    errors: number;
    mappings: {
      [key: string]: {
        from: string;
        to: string;
        count: number;
      }
    }
  };
  warnings: string[];
  errors: string[];
}

// Configuration du programme
program
  .version('1.0.0')
  .description('Convertit un schéma MySQL en schéma PostgreSQL compatible')
  .requiredOption('--input <path>', 'Chemin vers le fichier SQL MySQL')
  .requiredOption('--output <path>', 'Chemin de sortie pour le fichier SQL PostgreSQL')
  .option('--map <path>', 'Chemin pour le fichier de mapping JSON')
  .option('--verbose', 'Afficher des informations détaillées pendant la conversion')
  .parse(process.argv);

const options = program.opts();

// Mappings par défaut des types MySQL vers PostgreSQL
const DEFAULT_TYPE_MAPPINGS: TypeMapping[] = [
  { mysql: 'tinyint\\(1\\)', postgresql: 'boolean', notes: 'Conversion de tinyint(1) en boolean' },
  { mysql: 'tinyint\\((\\d+)\\)(?: unsigned)?', postgresql: 'smallint', notes: 'Conversion de tinyint(N) en smallint' },
  { mysql: 'smallint(?: unsigned)?', postgresql: 'integer', notes: 'Conversion de smallint en integer' },
  { mysql: 'mediumint(?: unsigned)?', postgresql: 'integer', notes: 'Conversion de mediumint en integer' },
  { mysql: 'int(?: unsigned)?', postgresql: 'integer', notes: 'Conversion de int en integer' },
  { mysql: 'integer(?: unsigned)?', postgresql: 'integer', notes: 'Conversion de integer en integer' },
  { mysql: 'bigint(?: unsigned)?', postgresql: 'bigint', notes: 'Conversion de bigint en bigint' },
  { mysql: 'float', postgresql: 'real', notes: 'Conversion de float en real' },
  { mysql: 'double', postgresql: 'double precision', notes: 'Conversion de double en double precision' },
  { mysql: 'decimal\\((\\d+),(\\d+)\\)', postgresql: 'decimal($1,$2)', notes: 'Conversion de decimal en decimal' },
  { mysql: 'char\\((\\d+)\\)', postgresql: 'char($1)', notes: 'Conversion de char en char' },
  { mysql: 'varchar\\((\\d+)\\)', postgresql: 'varchar($1)', notes: 'Conversion de varchar en varchar' },
  { mysql: 'tinytext', postgresql: 'text', notes: 'Conversion de tinytext en text' },
  { mysql: 'text', postgresql: 'text', notes: 'Conversion de text en text' },
  { mysql: 'mediumtext', postgresql: 'text', notes: 'Conversion de mediumtext en text' },
  { mysql: 'longtext', postgresql: 'text', notes: 'Conversion de longtext en text' },
  { mysql: 'tinyblob', postgresql: 'bytea', notes: 'Conversion de tinyblob en bytea' },
  { mysql: 'blob', postgresql: 'bytea', notes: 'Conversion de blob en bytea' },
  { mysql: 'mediumblob', postgresql: 'bytea', notes: 'Conversion de mediumblob en bytea' },
  { mysql: 'longblob', postgresql: 'bytea', notes: 'Conversion de longblob en bytea' },
  { mysql: 'date', postgresql: 'date', notes: 'Conversion de date en date' },
  { mysql: 'time(?:\\(\\d+\\))?', postgresql: 'time', notes: 'Conversion de time en time' },
  { mysql: 'datetime(?:\\(\\d+\\))?', postgresql: 'timestamp', notes: 'Conversion de datetime en timestamp' },
  { mysql: 'timestamp(?:\\(\\d+\\))?', postgresql: 'timestamp', notes: 'Conversion de timestamp en timestamp' },
  { mysql: 'year', postgresql: 'integer', notes: 'Conversion de year en integer' },
  { mysql: 'enum\\((.+?)\\)', postgresql: 'text CHECK ($column IN ($1))', notes: 'Conversion de enum en text avec contrainte CHECK' },
  { mysql: 'set\\((.+?)\\)', postgresql: 'text', notes: 'Conversion de set en text' },
  { mysql: 'json', postgresql: 'jsonb', notes: 'Conversion de json en jsonb' },
  { mysql: 'point', postgresql: 'point', notes: 'Conversion de point en point' },
  { mysql: 'linestring', postgresql: 'path', notes: 'Conversion de linestring en path' },
  { mysql: 'polygon', postgresql: 'polygon', notes: 'Conversion de polygon en polygon' },
  { mysql: 'multipoint', postgresql: 'point[]', notes: 'Conversion de multipoint en point[]' },
  { mysql: 'multilinestring', postgresql: 'path[]', notes: 'Conversion de multilinestring en path[]' },
  { mysql: 'multipolygon', postgresql: 'polygon[]', notes: 'Conversion de multipolygon en polygon[]' },
  { mysql: 'geometrycollection', postgresql: 'geometry', notes: 'Conversion de geometrycollection en geometry (extension PostGIS nécessaire)' },
  { mysql: 'bit\\((\\d+)\\)', postgresql: 'bit($1)', notes: 'Conversion de bit en bit' }
];

// Mappings personnalisés depuis le fichier JSON s'il existe
let customTypeMappings: TypeMapping[] = [];
if (options.map && fs.existsSync(options.map)) {
  try {
    customTypeMappings = JSON.parse(fs.readFileSync(options.map, 'utf8'));
    console.log(chalk.blue(`📝 Chargement de ${customTypeMappings.length} mappings personnalisés depuis ${options.map}`));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du chargement du fichier de mapping: ${error.message}`));
    process.exit(1);
  }
}

// Combiner les mappings par défaut et personnalisés
const typeMappings = [...customTypeMappings, ...DEFAULT_TYPE_MAPPINGS];

// Fonction principale
async function main() {
  console.log(chalk.blue(`🚀 Démarrage de la conversion MySQL → PostgreSQL`));
  
  // Vérifier les chemins d'entrée et de sortie
  if (!fs.existsSync(options.input)) {
    console.error(chalk.red(`❌ Le fichier d'entrée n'existe pas: ${options.input}`));
    process.exit(1);
  }
  
  // Créer le répertoire de sortie s'il n'existe pas
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(chalk.blue(`📁 Création du répertoire de sortie: ${outputDir}`));
  }
  
  // Lire le fichier SQL MySQL
  console.log(chalk.blue(`📄 Lecture du fichier SQL MySQL: ${options.input}`));
  const mysqlDump = fs.readFileSync(options.input, 'utf8');
  
  // Initialiser le rapport de migration
  const report: MigrationReport = {
    tables: { total: 0, converted: 0, warnings: 0, errors: 0 },
    columns: { 
      total: 0, 
      converted: 0, 
      warnings: 0, 
      errors: 0,
      mappings: {}
    },
    warnings: [],
    errors: []
  };
  
  // Extraire les définitions de tables
  console.log(chalk.blue(`🔍 Extraction des définitions de tables...`));
  const tables = extractTableDefinitions(mysqlDump, report);
  
  // Convertir les types MySQL en types PostgreSQL
  console.log(chalk.blue(`🔄 Conversion des types de données...`));
  const convertedTables = convertTableDefinitions(tables, report);
  
  // Générer le script SQL PostgreSQL
  console.log(chalk.blue(`📝 Génération du script SQL PostgreSQL...`));
  const postgresqlDump = generatePostgreSQLDump(convertedTables, report);
  
  // Écrire le fichier SQL PostgreSQL
  fs.writeFileSync(options.output, postgresqlDump);
  console.log(chalk.green(`✅ Script SQL PostgreSQL généré: ${options.output}`));
  
  // Générer le fichier de mapping des types
  const mappingOutputFile = options.map || path.join(outputDir, 'type_mapping.json');
  
  // Créer un fichier de mapping enrichi avec les statistiques d'utilisation
  const mappingWithStats = Object.entries(report.columns.mappings).map(([key, value]) => ({
    mysql: value.from,
    postgresql: value.to,
    count: value.count,
    notes: `Utilisé ${value.count} fois dans la conversion`
  }));
  
  fs.writeFileSync(mappingOutputFile, JSON.stringify(mappingWithStats, null, 2));
  console.log(chalk.green(`✅ Fichier de mapping généré: ${mappingOutputFile}`));
  
  // Afficher le résumé de la conversion
  console.log(chalk.blue(`\n📊 Résumé de la conversion:`));
  console.log(`Tables: ${report.tables.converted}/${report.tables.total} converties (${report.tables.warnings} avertissements, ${report.tables.errors} erreurs)`);
  console.log(`Colonnes: ${report.columns.converted}/${report.columns.total} converties (${report.columns.warnings} avertissements, ${report.columns.errors} erreurs)`);
  
  // Afficher les avertissements
  if (report.warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️ Avertissements (${report.warnings.length}):`));
    report.warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)));
  }
  
  // Afficher les erreurs
  if (report.errors.length > 0) {
    console.log(chalk.red(`\n❌ Erreurs (${report.errors.length}):`));
    report.errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
  }
  
  console.log(chalk.green(`\n✅ Conversion terminée!`));
}

/**
 * Extrait les définitions de tables du dump MySQL
 */
function extractTableDefinitions(mysqlDump: string, report: MigrationReport): TableDefinition[] {
  const tables: TableDefinition[] = [];
  
  // Regex pour extraire les blocs CREATE TABLE
  const createTableRegex = /CREATE\s+TABLE\s+(?:`([^`]+)`|([^\s(]+))\s*\(([^;]+)\)([^;]*);/gis;
  
  let match;
  while ((match = createTableRegex.exec(mysqlDump)) !== null) {
    try {
      const tableName = match[1] || match[2];
      const columnsDefinition = match[3];
      const tableOptions = match[4] || '';
      
      const tableDefinition: TableDefinition = {
        name: tableName,
        columns: [],
        foreignKeys: [],
        indexes: []
      };
      
      // Extraire les options de la table
      const engineMatch = tableOptions.match(/ENGINE\s*=\s*(\w+)/i);
      if (engineMatch) {
        tableDefinition.engine = engineMatch[1];
      }
      
      const charsetMatch = tableOptions.match(/DEFAULT\s+CHARSET\s*=\s*(\w+)/i);
      if (charsetMatch) {
        tableDefinition.charset = charsetMatch[1];
      }
      
      const collationMatch = tableOptions.match(/COLLATE\s*=\s*(\w+)/i);
      if (collationMatch) {
        tableDefinition.collation = collationMatch[1];
      }
      
      const commentMatch = tableOptions.match(/COMMENT\s*=\s*'([^']+)'/i);
      if (commentMatch) {
        tableDefinition.comment = commentMatch[1];
      }
      
      // Séparer les différentes définitions de colonnes, clés, etc.
      // Cette étape est compliquée car il faut tenir compte des parenthèses imbriquées
      const definitions = splitDefinitions(columnsDefinition);
      
      for (const definition of definitions) {
        const trimmedDef = definition.trim();
        
        // Primary Key
        if (trimmedDef.toUpperCase().startsWith('PRIMARY KEY')) {
          const primaryKeyColumns = extractColumnList(trimmedDef);
          tableDefinition.primaryKey = primaryKeyColumns;
          continue;
        }
        
        // Foreign Key
        if (trimmedDef.toUpperCase().includes('FOREIGN KEY')) {
          const foreignKey = extractForeignKey(trimmedDef);
          if (foreignKey) {
            tableDefinition.foreignKeys.push(foreignKey);
          }
          continue;
        }
        
        // Index
        if (trimmedDef.toUpperCase().startsWith('KEY') || 
            trimmedDef.toUpperCase().startsWith('INDEX') || 
            trimmedDef.toUpperCase().startsWith('UNIQUE KEY') || 
            trimmedDef.toUpperCase().startsWith('UNIQUE INDEX')) {
          const index = extractIndex(trimmedDef);
          if (index) {
            tableDefinition.indexes.push(index);
          }
          continue;
        }
        
        // Colonne
        const column = extractColumnDefinition(trimmedDef);
        if (column) {
          tableDefinition.columns.push(column);
          report.columns.total++;
        }
      }
      
      tables.push(tableDefinition);
      report.tables.total++;
      
      if (options.verbose) {
        console.log(chalk.blue(`  Table extraite: ${tableName} (${tableDefinition.columns.length} colonnes)`));
      }
    } catch (error) {
      report.tables.errors++;
      report.errors.push(`Erreur lors de l'extraction de la table: ${error.message}`);
      if (options.verbose) {
        console.error(chalk.red(`  ❌ Erreur lors de l'extraction d'une table: ${error.message}`));
      }
    }
  }
  
  console.log(chalk.green(`✅ ${tables.length} tables extraites du dump MySQL`));
  
  return tables;
}

/**
 * Sépare les définitions de colonnes, clés, etc. en tenant compte des parenthèses imbriquées
 */
function splitDefinitions(columnsDefinition: string): string[] {
  const definitions: string[] = [];
  let currentDefinition = '';
  let parenthesesCount = 0;
  let inString = false;
  
  for (let i = 0; i < columnsDefinition.length; i++) {
    const char = columnsDefinition[i];
    
    // Gestion des chaînes de caractères
    if (char === "'" && (i === 0 || columnsDefinition[i - 1] !== '\\')) {
      inString = !inString;
    }
    
    // Compter les parenthèses seulement si nous ne sommes pas dans une chaîne
    if (!inString) {
      if (char === '(') {
        parenthesesCount++;
      } else if (char === ')') {
        parenthesesCount--;
      }
    }
    
    // Si nous trouvons une virgule au niveau supérieur, c'est un séparateur de définition
    if (char === ',' && parenthesesCount === 0 && !inString) {
      definitions.push(currentDefinition.trim());
      currentDefinition = '';
    } else {
      currentDefinition += char;
    }
  }
  
  // Ajouter la dernière définition
  if (currentDefinition.trim()) {
    definitions.push(currentDefinition.trim());
  }
  
  return definitions;
}

/**
 * Extrait la liste des colonnes entre parenthèses (pour PRIMARY KEY, etc.)
 */
function extractColumnList(definition: string): string[] {
  const match = definition.match(/\(([^)]+)\)/);
  if (!match) return [];
  
  return match[1].split(',')
                .map(col => col.trim().replace(/^`|`$/g, ''));
}

/**
 * Extrait la définition d'une clé étrangère
 */
function extractForeignKey(definition: string): ForeignKeyDefinition | null {
  // CONSTRAINT `fk_name` FOREIGN KEY (`col1`, `col2`) REFERENCES `ref_table` (`ref_col1`, `ref_col2`) ON DELETE CASCADE ON UPDATE CASCADE
  const constraintMatch = definition.match(/CONSTRAINT\s+`?(\w+)`?\s+FOREIGN\s+KEY\s+\(([^)]+)\)\s+REFERENCES\s+`?(\w+)`?\s*\(([^)]+)\)(.*)$/i);
  
  if (!constraintMatch) return null;
  
  const fkName = constraintMatch[1];
  const columns = constraintMatch[2].split(',').map(col => col.trim().replace(/^`|`$/g, ''));
  const referencedTable = constraintMatch[3];
  const referencedColumns = constraintMatch[4].split(',').map(col => col.trim().replace(/^`|`$/g, ''));
  const options = constraintMatch[5] || '';
  
  const onDeleteMatch = options.match(/ON\s+DELETE\s+(\w+(\s+\w+)?)/i);
  const onUpdateMatch = options.match(/ON\s+UPDATE\s+(\w+(\s+\w+)?)/i);
  
  return {
    name: fkName,
    columns,
    referencedTable,
    referencedColumns,
    onDelete: onDeleteMatch ? onDeleteMatch[1] : undefined,
    onUpdate: onUpdateMatch ? onUpdateMatch[1] : undefined
  };
}

/**
 * Extrait la définition d'un index
 */
function extractIndex(definition: string): IndexDefinition | null {
  let unique = false;
  let type: string | undefined;
  let name: string;
  let columns: string[];
  
  if (definition.toUpperCase().startsWith('UNIQUE')) {
    unique = true;
    definition = definition.substring(6).trim();
  }
  
  // KEY `idx_name` (`col1`, `col2`) USING BTREE
  // ou INDEX `idx_name` (`col1`, `col2`) USING BTREE
  const match = definition.match(/(?:KEY|INDEX)\s+`?(\w+)`?\s+\(([^)]+)\)(?:\s+USING\s+(\w+))?/i);
  
  if (!match) return null;
  
  name = match[1];
  columns = match[2].split(',').map(col => col.trim().replace(/^`|`$/g, ''));
  if (match[3]) {
    type = match[3].toUpperCase();
  }
  
  return { name, columns, unique, type };
}

/**
 * Extrait la définition d'une colonne
 */
function extractColumnDefinition(definition: string): ColumnDefinition | null {
  // `column_name` type [NOT NULL] [DEFAULT value] [AUTO_INCREMENT] [COMMENT 'text'] [,]
  const match = definition.match(/`?(\w+)`?\s+([^,]+)$/i);
  
  if (!match) return null;
  
  const name = match[1];
  const typeAndOptions = match[2].trim();
  
  // Déterminer le type MySQL
  let mysqlType = '';
  const typeMatch = typeAndOptions.match(/^([a-z]+(?:\s*\([^)]*\))?)/i);
  if (typeMatch) {
    mysqlType = typeMatch[1].trim();
  }
  
  // Vérifier si la colonne est nullable
  const nullable = !typeAndOptions.toUpperCase().includes('NOT NULL');
  
  // Extraire la valeur par défaut
  let defaultValue: string | undefined;
  const defaultMatch = typeAndOptions.match(/DEFAULT\s+('(?:[^'\\]|\\.)*'|\w+)/i);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  }
  
  // Extraire le commentaire
  let comment: string | undefined;
  const commentMatch = typeAndOptions.match(/COMMENT\s+('(?:[^'\\]|\\.)*')/i);
  if (commentMatch) {
    comment = commentMatch[1].substring(1, commentMatch[1].length - 1);
  }
  
  // Extraire les options supplémentaires (AUTO_INCREMENT, etc.)
  let extra: string | undefined;
  if (typeAndOptions.toUpperCase().includes('AUTO_INCREMENT')) {
    extra = 'AUTO_INCREMENT';
  }
  
  return {
    name,
    mysqlType,
    nullable,
    defaultValue,
    comment,
    extra
  };
}

/**
 * Convertit les définitions de tables MySQL en définitions PostgreSQL
 */
function convertTableDefinitions(tables: TableDefinition[], report: MigrationReport): TableDefinition[] {
  const convertedTables = tables.map(table => {
    try {
      // Copier la table
      const convertedTable: TableDefinition = {
        ...table,
        columns: []
      };
      
      // Convertir chaque colonne
      for (const column of table.columns) {
        const convertedColumn = convertColumnDefinition(column, report);
        convertedTable.columns.push(convertedColumn);
      }
      
      report.tables.converted++;
      return convertedTable;
    } catch (error) {
      report.tables.errors++;
      report.errors.push(`Erreur lors de la conversion de la table ${table.name}: ${error.message}`);
      return table; // Retourner la table originale en cas d'erreur
    }
  });
  
  return convertedTables;
}

/**
 * Convertit une définition de colonne MySQL en définition PostgreSQL
 */
function convertColumnDefinition(column: ColumnDefinition, report: MigrationReport): ColumnDefinition {
  const convertedColumn = { ...column };
  
  // Convertir le type MySQL en type PostgreSQL
  for (const mapping of typeMappings) {
    const regex = new RegExp(`^${mapping.mysql}$`, 'i');
    if (regex.test(column.mysqlType)) {
      // Extraire les valeurs capturées dans les groupes regex
      const matches = column.mysqlType.match(regex);
      
      // Remplacer les références aux groupes capturés ($1, $2, etc.) si nécessaire
      let postgresqlType = mapping.postgresql;
      if (matches && matches.length > 1) {
        for (let i = 1; i < matches.length; i++) {
          const placeholder = new RegExp(`\\$${i}`, 'g');
          let replacement = matches[i];
          
          // Pour les ENUM, formater correctement la liste des valeurs
          if (mapping.mysql.includes('enum') && i === 1) {
            replacement = matches[i]
              .split(',')
              .map(val => val.trim())
              .join(', ');
          }
          
          postgresqlType = postgresqlType.replace(placeholder, replacement);
        }
      }
      
      // Remplacer $column par le nom de la colonne (pour les CHECK constraints)
      postgresqlType = postgresqlType.replace(/\$column/g, convertedColumn.name);
      
      convertedColumn.postgresqlType = postgresqlType;
      
      // Stocker les statistiques d'utilisation du mapping
      const key = `${column.mysqlType} -> ${postgresqlType}`;
      if (!report.columns.mappings[key]) {
        report.columns.mappings[key] = {
          from: column.mysqlType,
          to: postgresqlType,
          count: 0
        };
      }
      report.columns.mappings[key].count++;
      
      break;
    }
  }
  
  // Si aucun mapping n'a été trouvé, utiliser "text" comme type par défaut et ajouter un avertissement
  if (!convertedColumn.postgresqlType) {
    convertedColumn.postgresqlType = 'text';
    const warning = `Type non reconnu pour la colonne ${column.name}: ${column.mysqlType} (converti en text)`;
    report.warnings.push(warning);
    report.columns.warnings++;
    
    if (options.verbose) {
      console.log(chalk.yellow(`  ⚠️ ${warning}`));
    }
  } else {
    report.columns.converted++;
  }
  
  // Gérer les valeurs par défaut
  if (convertedColumn.defaultValue) {
    // Adapter les valeurs par défaut spécifiques à MySQL
    if (convertedColumn.defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP') {
      convertedColumn.defaultValue = 'CURRENT_TIMESTAMP';
    } else if (convertedColumn.defaultValue.toUpperCase() === 'NULL' && !convertedColumn.nullable) {
      // Supprimer DEFAULT NULL pour les colonnes NOT NULL en PostgreSQL
      delete convertedColumn.defaultValue;
    }
  }
  
  // Gérer les séquences pour les colonnes AUTO_INCREMENT
  if (convertedColumn.extra === 'AUTO_INCREMENT') {
    // Utiliser SERIAL ou BIGSERIAL en fonction du type
    if (column.mysqlType.toLowerCase().includes('bigint')) {
      convertedColumn.postgresqlType = 'BIGSERIAL';
    } else {
      convertedColumn.postgresqlType = 'SERIAL';
    }
    
    // Supprimer l'option AUTO_INCREMENT car elle est implicite avec SERIAL
    delete convertedColumn.extra;
    
    // Supprimer la valeur par défaut car elle est gérée par la séquence
    delete convertedColumn.defaultValue;
  }
  
  return convertedColumn;
}

/**
 * Génère le script SQL PostgreSQL
 */
function generatePostgreSQLDump(tables: TableDefinition[], report: MigrationReport): string {
  let postgresqlDump = `-- PostgreSQL dump généré par mysql-to-postgresql.ts\n`;
  postgresqlDump += `-- Date de génération: ${new Date().toISOString()}\n\n`;
  
  // Ajouter un avertissement si des erreurs ont été rencontrées
  if (report.errors.length > 0) {
    postgresqlDump += `-- ATTENTION: ${report.errors.length} erreurs ont été rencontrées lors de la conversion.\n`;
    postgresqlDump += `-- Veuillez vérifier manuellement ce script avant de l'exécuter.\n\n`;
  }
  
  postgresqlDump += `BEGIN;\n\n`;
  
  // Création des types d'énumération pour les colonnes ENUM converties
  const enumTypes = new Set<string>();
  tables.forEach(table => {
    table.columns.forEach(column => {
      if (column.postgresqlType?.includes('CHECK') && column.postgresqlType?.includes('IN')) {
        const enumTypeName = `${table.name}_${column.name}_enum`;
        const valuesMatch = column.postgresqlType.match(/IN\s*\(([^)]+)\)/);
        if (valuesMatch) {
          const enumValues = valuesMatch[1].trim();
          enumTypes.add(`CREATE TYPE ${enumTypeName} AS ENUM (${enumValues});\n`);
        }
      }
    });
  });
  
  // Ajouter les types d'énumération au script
  if (enumTypes.size > 0) {
    postgresqlDump += `-- Types d'énumération\n`;
    enumTypes.forEach(enumType => {
      postgresqlDump += enumType;
    });
    postgresqlDump += `\n`;
  }
  
  // Création des tables
  for (const table of tables) {
    postgresqlDump += `-- Table: ${table.name}\n`;
    
    if (table.comment) {
      postgresqlDump += `-- Commentaire: ${table.comment}\n`;
    }
    
    postgresqlDump += `CREATE TABLE "${table.name}" (\n`;
    
    // Colonnes
    const columnDefs = table.columns.map(column => {
      let columnDef = `  "${column.name}" ${column.postgresqlType}`;
      
      if (!column.nullable) {
        columnDef += ` NOT NULL`;
      }
      
      if (column.defaultValue !== undefined) {
        columnDef += ` DEFAULT ${column.defaultValue}`;
      }
      
      if (column.constraints && column.constraints.length > 0) {
        columnDef += ` ${column.constraints.join(' ')}`;
      }
      
      return columnDef;
    });
    
    // Clé primaire
    if (table.primaryKey && table.primaryKey.length > 0) {
      const primaryKeyColumns = table.primaryKey.map(col => `"${col}"`).join(', ');
      columnDefs.push(`  PRIMARY KEY (${primaryKeyColumns})`);
    }
    
    postgresqlDump += columnDefs.join(',\n');
    postgresqlDump += `\n);\n\n`;
    
    // Commentaires sur les colonnes
    for (const column of table.columns) {
      if (column.comment) {
        postgresqlDump += `COMMENT ON COLUMN "${table.name}"."${column.name}" IS '${column.comment.replace(/'/g, "''")}';\n`;
      }
    }
    
    // Commentaire sur la table
    if (table.comment) {
      postgresqlDump += `COMMENT ON TABLE "${table.name}" IS '${table.comment.replace(/'/g, "''")}';\n`;
    }
    
    // Index
    if (table.indexes.length > 0) {
      postgresqlDump += `\n-- Index pour la table "${table.name}"\n`;
      
      for (const index of table.indexes) {
        const uniqueStr = index.unique ? 'UNIQUE ' : '';
        const columns = index.columns.map(col => `"${col}"`).join(', ');
        
        // Déterminer le type d'index (BTREE est le défaut en PostgreSQL, donc on ne le spécifie pas)
        let usingClause = '';
        if (index.type && index.type !== 'BTREE') {
          if (index.type === 'HASH') {
            usingClause = ' USING HASH';
          } else if (index.type === 'GIST') {
            usingClause = ' USING GIST';
          } else if (index.type === 'GIN') {
            usingClause = ' USING GIN';
          }
          // Autres types d'index non supportés directement
        }
        
        postgresqlDump += `CREATE ${uniqueStr}INDEX "${index.name}" ON "${table.name}" (${columns})${usingClause};\n`;
      }
    }
    
    postgresqlDump += `\n`;
  }
  
  // Clés étrangères (créées après toutes les tables pour éviter les problèmes de référence)
  postgresqlDump += `-- Clés étrangères\n`;
  
  for (const table of tables) {
    if (table.foreignKeys.length > 0) {
      for (const fk of table.foreignKeys) {
        const columns = fk.columns.map(col => `"${col}"`).join(', ');
        const referencedColumns = fk.referencedColumns.map(col => `"${col}"`).join(', ');
        
        postgresqlDump += `ALTER TABLE "${table.name}" ADD CONSTRAINT "${fk.name}" `;
        postgresqlDump += `FOREIGN KEY (${columns}) REFERENCES "${fk.referencedTable}" (${referencedColumns})`;
        
        if (fk.onDelete) {
          postgresqlDump += ` ON DELETE ${fk.onDelete}`;
        }
        
        if (fk.onUpdate) {
          postgresqlDump += ` ON UPDATE ${fk.onUpdate}`;
        }
        
        postgresqlDump += `;\n`;
      }
    }
  }
  
  postgresqlDump += `\nCOMMIT;\n`;
  
  return postgresqlDump;
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`❌ Erreur inattendue: ${error.message}`));
  console.error(error);
  process.exit(1);
});