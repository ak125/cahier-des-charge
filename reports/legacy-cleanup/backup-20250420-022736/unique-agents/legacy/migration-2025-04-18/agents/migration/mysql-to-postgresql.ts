#!/usr/bin/env node
/**
 * mysql-to-postgresql.ts
 * 
 * Agent avancé pour la conversion de schémas MySQL vers PostgreSQL
 * avec un ensemble complet de règles de conversion basées sur les meilleures pratiques
 * 
 * Utilisation:
 *   ts-node agents/migration/mysql-to-postgresql.ts --input=dump.mysql.sql --output=dump.pg.sql --rules=config/migration/custom-rules.json
 * 
 * @author MCP Migration Team
 * @version 1.3.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as mysql from 'mysql2/promise';
import { Client } from 'pg';

// Types pour la migration
interface MigrationRule {
  name: string;
  description: string;
  mysqlPattern: string;
  postgresqlReplacement: string;
  priority: number;
  category: 'TYPE' | 'CONSTRAINT' | 'INDEX' | 'FUNCTION' | 'SYNTAX' | 'SEQUENCE' | 'OTHER';
  requiresManualReview?: boolean;
  complexTransformation?: boolean;
  samples?: { mysql: string; postgresql: string }[];
}

interface MigrationConfig {
  rules: MigrationRule[];
  options: {
    convertEnumsToTypes: boolean;
    preserveIdentifierCase: boolean;
    useNativeUUID: boolean;
    createExtensions: boolean;
    jsonToJsonb: boolean;
    createComments: boolean;
    enableRowLevelSecurity: boolean;
    addTimestampTriggers: boolean;
  };
  extensions: string[];
  preScripts: string[];
  postScripts: string[];
}

interface MigrationStats {
  startTime: Date;
  endTime?: Date;
  tablesProcessed: number;
  columnsProcessed: number;
  tablesMigrated: number;
  columnsMigrated: number;
  rulesApplied: Record<string, number>;
  warnings: string[];
  errors: string[];
  summary: {
    success: boolean;
    totalDuration?: number;
    successRate?: number;
    complexityScore?: number;
  };
}

// Configuration du programme
program
  .version('1.3.0')
  .description('Convertit un schéma MySQL en schéma PostgreSQL compatible avec les meilleures pratiques')
  .requiredOption('--input <path>', 'Chemin vers le fichier SQL MySQL ou URI de connexion à la base')
  .requiredOption('--output <path>', 'Chemin de sortie pour le fichier SQL PostgreSQL')
  .option('--rules <path>', 'Chemin vers un fichier de règles de conversion personnalisées (JSON)')
  .option('--config <path>', 'Chemin vers un fichier de configuration de migration (JSON)')
  .option('--direct-db', 'Connecte directement aux bases de données plutôt que de lire/écrire des fichiers')
  .option('--mysql-uri <uri>', 'URI de connexion MySQL (mysql://user:pass@host:port/database)')
  .option('--pg-uri <uri>', 'URI de connexion PostgreSQL (postgresql://user:pass@host:port/database)')
  .option('--schema-only', 'Migrer seulement le schéma, pas les données')
  .option('--batch-size <size>', 'Nombre de lignes à traiter par lot lors de la migration de données', '10000')
  .option('--verbose', 'Afficher des informations détaillées pendant la conversion')
  .option('--analyze', 'Analyser le schéma et les données avant la migration et produire un rapport')
  .option('--apply', 'Appliquer directement le SQL généré à la base PostgreSQL cible')
  .option('--validate', 'Valider la structure après migration')
  .parse(process.argv);

const options = program.opts();

// Règles par défaut pour la conversion des types MySQL vers PostgreSQL
// Ces règles sont classées par priorité, les plus spécifiques d'abord
const DEFAULT_MIGRATION_RULES: MigrationRule[] = [
  // Types numériques
  {
    name: 'bool_conversion',
    description: 'Conversion des TINYINT(1) en BOOLEAN',
    mysqlPattern: '(?:TINY)?INT\\s*\\(\\s*1\\s*\\)(?: UNSIGNED)?',
    postgresqlReplacement: 'BOOLEAN',
    priority: 100,
    category: 'TYPE',
    samples: { 
      mysql: 'TINYINT(1) DEFAULT 0',
      postgresql: 'BOOLEAN DEFAULT FALSE'
    }
  },
  {
    name: 'unsigned_tinyint',
    description: 'Conversion des TINYINT UNSIGNED en SMALLINT',
    mysqlPattern: 'TINYINT\\s*(?:\\(\\s*\\d+\\s*\\))?(?: UNSIGNED)',
    postgresqlReplacement: 'SMALLINT',
    priority: 95,
    category: 'TYPE'
  },
  {
    name: 'unsigned_smallint',
    description: 'Conversion des SMALLINT UNSIGNED en INTEGER',
    mysqlPattern: 'SMALLINT(?: UNSIGNED)',
    postgresqlReplacement: 'INTEGER',
    priority: 90,
    category: 'TYPE'
  },
  {
    name: 'unsigned_mediumint',
    description: 'Conversion des MEDIUMINT UNSIGNED en INTEGER',
    mysqlPattern: 'MEDIUMINT(?: UNSIGNED)',
    postgresqlReplacement: 'INTEGER',
    priority: 85,
    category: 'TYPE'
  },
  {
    name: 'unsigned_int',
    description: 'Conversion des INT UNSIGNED en BIGINT',
    mysqlPattern: 'INT(?:EGER)?(?: UNSIGNED)',
    postgresqlReplacement: 'BIGINT',
    priority: 80,
    category: 'TYPE'
  },
  {
    name: 'unsigned_bigint',
    description: 'Conversion des BIGINT UNSIGNED en NUMERIC(20)',
    mysqlPattern: 'BIGINT(?: UNSIGNED)',
    postgresqlReplacement: 'NUMERIC(20)',
    priority: 75,
    category: 'TYPE'
  },
  {
    name: 'signed_tinyint',
    description: 'Conversion des TINYINT en SMALLINT',
    mysqlPattern: 'TINYINT(?:\\(\\d+\\))?(?! UNSIGNED)',
    postgresqlReplacement: 'SMALLINT',
    priority: 70,
    category: 'TYPE'
  },
  {
    name: 'signed_mediumint',
    description: 'Conversion des MEDIUMINT en INTEGER',
    mysqlPattern: 'MEDIUMINT(?! UNSIGNED)',
    postgresqlReplacement: 'INTEGER',
    priority: 65,
    category: 'TYPE'
  },
  {
    name: 'signed_int',
    description: 'Conversion des INT/INTEGER en INTEGER',
    mysqlPattern: 'INT(?:EGER)?(?! UNSIGNED)',
    postgresqlReplacement: 'INTEGER',
    priority: 60,
    category: 'TYPE'
  },
  {
    name: 'signed_bigint',
    description: 'Conversion des BIGINT en BIGINT',
    mysqlPattern: 'BIGINT(?! UNSIGNED)',
    postgresqlReplacement: 'BIGINT',
    priority: 55,
    category: 'TYPE'
  },
  
  // Types décimaux
  {
    name: 'decimal',
    description: 'Conversion des DECIMAL en NUMERIC',
    mysqlPattern: 'DECIMAL\\(\\s*(\\d+)\\s*(?:,\\s*(\\d+)\\s*)?\\)',
    postgresqlReplacement: 'NUMERIC($1${if:$2:,$2:})',
    priority: 50,
    category: 'TYPE'
  },
  {
    name: 'float_double',
    description: 'Conversion des FLOAT/DOUBLE en standards PostgreSQL',
    mysqlPattern: 'FLOAT|DOUBLE(?:\\s+PRECISION)?',
    postgresqlReplacement: 'DOUBLE PRECISION',
    priority: 45,
    category: 'TYPE'
  },
  
  // Types caractères
  {
    name: 'char',
    description: 'Conversion des CHAR en CHAR',
    mysqlPattern: 'CHAR\\(\\s*(\\d+)\\s*\\)',
    postgresqlReplacement: 'CHAR($1)',
    priority: 40,
    category: 'TYPE'
  },
  {
    name: 'varchar',
    description: 'Conversion des VARCHAR en VARCHAR',
    mysqlPattern: 'VARCHAR\\(\\s*(\\d+)\\s*\\)',
    postgresqlReplacement: 'VARCHAR($1)',
    priority: 35,
    category: 'TYPE'
  },
  {
    name: 'text_types',
    description: 'Conversion des types TEXT en TEXT',
    mysqlPattern: '(?:TINY|MEDIUM|LONG)?TEXT',
    postgresqlReplacement: 'TEXT',
    priority: 30,
    category: 'TYPE'
  },
  
  // Types binaires
  {
    name: 'binary_types',
    description: 'Conversion des types BINARY en BYTEA',
    mysqlPattern: '(?:TINY|MEDIUM|LONG)?BLOB|BINARY\\(\\s*\\d+\\s*\\)|VARBINARY\\(\\s*\\d+\\s*\\)',
    postgresqlReplacement: 'BYTEA',
    priority: 25,
    category: 'TYPE'
  },
  
  // Types date et heure
  {
    name: 'datetime',
    description: 'Conversion des DATETIME en TIMESTAMP',
    mysqlPattern: 'DATETIME(?:\\(\\s*\\d+\\s*\\))?',
    postgresqlReplacement: 'TIMESTAMP',
    priority: 20,
    category: 'TYPE'
  },
  {
    name: 'timestamp',
    description: 'Conversion des TIMESTAMP en TIMESTAMP',
    mysqlPattern: 'TIMESTAMP(?:\\(\\s*\\d+\\s*\\))?',
    postgresqlReplacement: 'TIMESTAMP',
    priority: 19,
    category: 'TYPE'
  },
  {
    name: 'date',
    description: 'Conversion des DATE en DATE',
    mysqlPattern: 'DATE',
    postgresqlReplacement: 'DATE',
    priority: 18,
    category: 'TYPE'
  },
  {
    name: 'time',
    description: 'Conversion des TIME en TIME',
    mysqlPattern: 'TIME(?:\\(\\s*\\d+\\s*\\))?',
    postgresqlReplacement: 'TIME',
    priority: 17,
    category: 'TYPE'
  },
  {
    name: 'year',
    description: 'Conversion des YEAR en SMALLINT',
    mysqlPattern: 'YEAR(?:\\(\\s*\\d+\\s*\\))?',
    postgresqlReplacement: 'SMALLINT',
    priority: 16,
    category: 'TYPE'
  },
  
  // Types JSON
  {
    name: 'json',
    description: 'Conversion des JSON en JSONB',
    mysqlPattern: 'JSON',
    postgresqlReplacement: 'JSONB',
    priority: 15,
    category: 'TYPE'
  },
  
  // Types géométriques
  {
    name: 'geometry',
    description: 'Conversion des types géométriques en PostGIS',
    mysqlPattern: 'GEOMETRY|POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION',
    postgresqlReplacement: 'GEOMETRY',
    priority: 10,
    category: 'TYPE',
    requiresManualReview: true
  },
  
  // ENUM et SET
  {
    name: 'enum',
    description: 'Conversion des ENUM en types ENUM PostgreSQL',
    mysqlPattern: 'ENUM\\((.+?)\\)',
    postgresqlReplacement: '${enumType}',
    priority: 5,
    category: 'TYPE',
    complexTransformation: true
  },
  {
    name: 'set',
    description: 'Conversion des SET en type TEXT avec contrainte CHECK',
    mysqlPattern: 'SET\\((.+?)\\)',
    postgresqlReplacement: 'TEXT',
    priority: 4,
    category: 'TYPE',
    complexTransformation: true
  },
  
  // Valeurs par défaut
  {
    name: 'current_timestamp',
    description: 'Conversion de CURRENT_TIMESTAMP',
    mysqlPattern: 'DEFAULT\\s+CURRENT_TIMESTAMP(?:\\(\\s*\\d+\\s*\\))?',
    postgresqlReplacement: 'DEFAULT CURRENT_TIMESTAMP',
    priority: 3,
    category: 'SYNTAX'
  },
  {
    name: 'boolean_defaults',
    description: 'Conversion des défaults booléens',
    mysqlPattern: 'DEFAULT\\s+([01])',
    postgresqlReplacement: 'DEFAULT ${if:$1==0:FALSE:TRUE}',
    priority: 2,
    category: 'SYNTAX'
  },
  
  // Auto-increment
  {
    name: 'auto_increment',
    description: 'Conversion de AUTO_INCREMENT en SERIAL',
    mysqlPattern: '(INT|BIGINT)(?:\\(\\d+\\))?(?:\\s+UNSIGNED)?\\s+(?:NOT\\s+NULL\\s+)?(?:PRIMARY\\s+KEY\\s+)?AUTO_INCREMENT',
    postgresqlReplacement: '${if:$1==BIGINT:BIGSERIAL:SERIAL} NOT NULL',
    priority: 1,
    category: 'SEQUENCE'
  }
];

// Configuration par défaut
const DEFAULT_CONFIG: MigrationConfig = {
  rules: DEFAULT_MIGRATION_RULES,
  options: {
    convertEnumsToTypes: true,
    preserveIdentifierCase: false,
    useNativeUUID: true,
    createExtensions: true,
    jsonToJsonb: true,
    createComments: true,
    enableRowLevelSecurity: false,
    addTimestampTriggers: true
  },
  extensions: [
    'uuid-ossp',    // Pour la gestion des UUID
    'pg_trgm',      // Pour la recherche par similarité de texte
    'btree_gin',    // Pour les index GIN sur les types non-textuels
    'unaccent'      // Pour la recherche insensible aux accents
  ],
  preScripts: [],
  postScripts: []
};

// Fonction principale
async function main() {
  console.log(chalk.blue(`🚀 Démarrage de la conversion MySQL → PostgreSQL avec règles personnalisées`));
  
  // Initialiser les statistiques de migration
  const stats: MigrationStats = {
    startTime: new Date(),
    tablesProcessed: 0,
    columnsProcessed: 0,
    tablesMigrated: 0,
    columnsMigrated: 0,
    rulesApplied: {},
    warnings: [],
    errors: [],
    summary: {
      success: false
    }
  };
  
  try {
    // Charger la configuration et les règles personnalisées
    const config = loadConfiguration(options.config);
    
    // Charger des règles personnalisées supplémentaires si spécifiées
    if (options.rules) {
      if (fs.existsSync(options.rules)) {
        try {
          const customRules = JSON.parse(fs.readFileSync(options.rules, 'utf8'));
          if (Array.isArray(customRules)) {
            console.log(chalk.blue(`📝 Chargement de ${customRules.length} règles personnalisées depuis ${options.rules}`));
            config.rules = [...customRules, ...config.rules];
          } else {
            console.warn(chalk.yellow(`⚠️ Format invalide dans le fichier de règles: ${options.rules}`));
          }
        } catch (error) {
          console.error(chalk.red(`❌ Erreur lors du chargement des règles personnalisées: ${error.message}`));
        }
      } else {
        console.warn(chalk.yellow(`⚠️ Fichier de règles personnalisées non trouvé: ${options.rules}`));
      }
    }
    
    // Trier les règles par priorité (les plus prioritaires d'abord)
    config.rules.sort((a, b) => b.priority - a.priority);
    
    // Afficher les informations de configuration
    if (options.verbose) {
      console.log(chalk.blue(`ℹ️ Configuration chargée:`));
      console.log(`  - ${config.rules.length} règles de conversion`);
      console.log(`  - ${config.extensions.length} extensions PostgreSQL`);
      console.log(`  - ${config.preScripts.length} scripts pré-migration`);
      console.log(`  - ${config.postScripts.length} scripts post-migration`);
    }
    
    let sqlOutput = '';
    
    // Mode direct DB ou fichier
    if (options.directDb) {
      console.log(chalk.blue(`🔌 Mode connexion directe aux bases de données activé`));
      
      // Connexion aux bases de données et migration directe
      const mysqlUri = options.mysqlUri || process.env.MYSQL_URI;
      const pgUri = options.pgUri || process.env.PG_URI;
      
      if (!mysqlUri || !pgUri) {
        throw new Error('URIs de connexion MySQL et PostgreSQL requises en mode direct-db');
      }
      
      await migrateDirectly(mysqlUri, pgUri, config, stats, options.schemaOnly, parseInt(options.batchSize, 10));
    } else {
      console.log(chalk.blue(`📄 Mode fichier activé`));
      
      // Vérifier les chemins d'entrée et de sortie
      if (!fs.existsSync(options.input)) {
        throw new Error(`Le fichier d'entrée n'existe pas: ${options.input}`);
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
      
      // Convertir le dump MySQL en PostgreSQL
      sqlOutput = await convertMySQLDump(mysqlDump, config, stats);
      
      // Écrire le fichier SQL PostgreSQL
      fs.writeFileSync(options.output, sqlOutput);
      console.log(chalk.green(`✅ Script SQL PostgreSQL généré: ${options.output}`));
      
      // Appliquer directement le SQL généré si demandé
      if (options.apply) {
        await applyGeneratedSQL(options.output, options.pgUri || process.env.PG_URI, stats);
      }
    }
    
    // Valider la migration si demandé
    if (options.validate) {
      await validateMigration(options.pgUri || process.env.PG_URI, stats);
    }
    
    // Finaliser les statistiques
    stats.endTime = new Date();
    stats.summary.totalDuration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
    stats.summary.successRate = stats.tablesMigrated / (stats.tablesProcessed || 1);
    stats.summary.success = stats.errors.length === 0;
    
    // Enregistrer les statistiques de migration
    const statsFile = `${path.dirname(options.output)}/migration-stats-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(chalk.blue(`📊 Statistiques de migration enregistrées: ${statsFile}`));
    
    // Afficher le résumé de la migration
    displayMigrationSummary(stats);
    
    console.log(chalk.green(`\n✅ Conversion terminée!`));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la migration: ${error.message}`));
    stats.errors.push(`Erreur globale: ${error.message}`);
    stats.summary.success = false;
    
    // Enregistrer les statistiques même en cas d'erreur
    const statsFile = `${path.dirname(options.output)}/migration-stats-error-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    
    process.exit(1);
  }
}

/**
 * Charge la configuration de migration
 */
function loadConfiguration(configPath?: string): MigrationConfig {
  // Commencer avec la configuration par défaut
  const config = { ...DEFAULT_CONFIG, rules: [...DEFAULT_MIGRATION_RULES] };
  
  // Charger la configuration personnalisée si spécifiée
  if (configPath && fs.existsSync(configPath)) {
    try {
      const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Fusionner les options
      if (customConfig.options) {
        config.options = { ...config.options, ...customConfig.options };
      }
      
      // Remplacer les extensions si spécifiées
      if (customConfig.extensions) {
        config.extensions = customConfig.extensions;
      }
      
      // Ajouter les scripts pré/post migration
      if (customConfig.preScripts) {
        config.preScripts = customConfig.preScripts;
      }
      
      if (customConfig.postScripts) {
        config.postScripts = customConfig.postScripts;
      }
      
      // Charger les règles personnalisées
      if (customConfig.rules && Array.isArray(customConfig.rules)) {
        // Remplacer une règle existante ou ajouter une nouvelle règle
        for (const customRule of customConfig.rules) {
          const existingRuleIndex = config.rules.findIndex(r => r.name === customRule.name);
          if (existingRuleIndex >= 0) {
            config.rules[existingRuleIndex] = customRule;
          } else {
            config.rules.push(customRule);
          }
        }
      }
      
      console.log(chalk.blue(`📝 Configuration personnalisée chargée depuis ${configPath}`));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du chargement de la configuration: ${error.message}`));
      console.error(chalk.yellow(`⚠️ Utilisation de la configuration par défaut`));
    }
  } else if (configPath) {
    console.warn(chalk.yellow(`⚠️ Fichier de configuration non trouvé: ${configPath}`));
    console.warn(chalk.yellow(`⚠️ Utilisation de la configuration par défaut`));
  }
  
  return config;
}

/**
 * Convertit un dump MySQL en script PostgreSQL
 */
async function convertMySQLDump(mysqlDump: string, config: MigrationConfig, stats: MigrationStats): Promise<string> {
  let pgOutput = '';
  
  // En-tête
  pgOutput += `--\n`;
  pgOutput += `-- Script PostgreSQL généré par mysql-to-postgresql\n`;
  pgOutput += `-- Date: ${new Date().toISOString()}\n`;
  pgOutput += `-- Version: 1.3.0\n`;
  pgOutput += `--\n\n`;
  
  // Transaction
  pgOutput += `BEGIN;\n\n`;
  
  // Créer les extensions
  if (config.options.createExtensions && config.extensions.length > 0) {
    pgOutput += `-- Extensions PostgreSQL\n`;
    
    for (const extension of config.extensions) {
      pgOutput += `CREATE EXTENSION IF NOT EXISTS "${extension}";\n`;
    }
    
    pgOutput += `\n`;
  }
  
  // Scripts pré-migration
  if (config.preScripts.length > 0) {
    pgOutput += `-- Scripts pré-migration\n`;
    
    for (const script of config.preScripts) {
      pgOutput += `${script}\n`;
    }
    
    pgOutput += `\n`;
  }
  
  // Extraire et convertir les ENUMs
  const enumTypes = extractEnumTypes(mysqlDump, config);
  
  if (Object.keys(enumTypes).length > 0) {
    pgOutput += `-- Types ENUM convertis\n`;
    
    for (const [typeName, values] of Object.entries(enumTypes)) {
      pgOutput += `CREATE TYPE "${typeName}" AS ENUM (${values});\n`;
    }
    
    pgOutput += `\n`;
  }
  
  // Extraire et convertir les tables
  const tables = extractTables(mysqlDump);
  
  for (const table of tables) {
    stats.tablesProcessed++;
    
    try {
      // Convertir la table
      const convertedTable = convertTable(table, config, enumTypes, stats);
      pgOutput += convertedTable;
      stats.tablesMigrated++;
      
      if (options.verbose) {
        console.log(chalk.green(`✅ Table convertie: ${table.name}`));
      }
    } catch (error) {
      stats.errors.push(`Erreur lors de la conversion de la table ${table.name}: ${error.message}`);
      if (options.verbose) {
        console.error(chalk.red(`❌ Erreur lors de la conversion de la table ${table.name}: ${error.message}`));
      }
    }
  }
  
  // Scripts post-migration
  if (config.postScripts.length > 0) {
    pgOutput += `-- Scripts post-migration\n`;
    
    for (const script of config.postScripts) {
      pgOutput += `${script}\n`;
    }
    
    pgOutput += `\n`;
  }
  
  // Fin de la transaction
  pgOutput += `COMMIT;\n`;
  
  return pgOutput;
}

/**
 * Extrait les types ENUM des tables MySQL
 */
function extractEnumTypes(mysqlDump: string, config: MigrationConfig): Record<string, string> {
  const enumTypes: Record<string, string> = {};
  
  if (!config.options.convertEnumsToTypes) {
    return enumTypes;
  }
  
  // Regex pour trouver les colonnes ENUM
  const tableRegex = /CREATE TABLE\s+`?(\w+)`?\s*\(([\s\S]+?)\)\s*(?:ENGINE|$)/gi;
  const enumRegex = /`?(\w+)`?\s+ENUM\(([^)]+)\)/gi;
  
  let tableMatch;
  while ((tableMatch = tableRegex.exec(mysqlDump)) !== null) {
    const tableName = tableMatch[1];
    const tableContent = tableMatch[2];
    
    let enumMatch;
    while ((enumMatch = enumRegex.exec(tableContent)) !== null) {
      const columnName = enumMatch[1];
      const enumValues = enumMatch[2];
      
      const typeName = `${tableName}_${columnName}_enum`;
      enumTypes[typeName] = enumValues;
    }
  }
  
  return enumTypes;
}

/**
 * Extrait les définitions de tables du dump MySQL
 */
function extractTables(mysqlDump: string): { name: string; content: string }[] {
  const tables: { name: string; content: string }[] = [];
  
  // Regex pour extraire les blocs CREATE TABLE
  const createTableRegex = /CREATE\s+TABLE\s+`?(\w+)`?\s*\(([\s\S]+?)\)\s*(?:ENGINE|$)[^;]*;/gi;
  
  let match;
  while ((match = createTableRegex.exec(mysqlDump)) !== null) {
    const tableName = match[1];
    const tableContent = match[2];
    
    tables.push({
      name: tableName,
      content: tableContent
    });
  }
  
  return tables;
}

/**
 * Convertit une table MySQL en table PostgreSQL
 */
function convertTable(table: { name: string; content: string }, config: MigrationConfig, enumTypes: Record<string, string>, stats: MigrationStats): string {
  let pgTable = `-- Table: ${table.name}\n`;
  pgTable += `CREATE TABLE "${table.name}" (\n`;
  
  // Séparer les lignes de définition de colonne
  const lines = table.content.split(',\n').map(line => line.trim());
  
  const columns = [];
  const constraints = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('PRIMARY KEY') || 
        line.trim().startsWith('UNIQUE KEY') || 
        line.trim().startsWith('FOREIGN KEY') ||
        line.trim().startsWith('CONSTRAINT')) {
      constraints.push(convertConstraint(line, config, stats));
    } else {
      stats.columnsProcessed++;
      columns.push(convertColumn(line, table.name, config, enumTypes, stats));
      stats.columnsMigrated++;
    }
  }
  
  // Ajouter les colonnes et contraintes
  pgTable += `  ${[...columns, ...constraints].join(',\n  ')}\n`;
  pgTable += `);\n\n`;
  
  // Ajouter des triggers de timestamp si configuré
  if (config.options.addTimestampTriggers) {
    // Vérifier si la table a des colonnes created_at et updated_at
    const hasCreatedAt = columns.some(col => col.toLowerCase().includes('created_at'));
    const hasUpdatedAt = columns.some(col => col.toLowerCase().includes('updated_at'));
    
    if (hasCreatedAt && hasUpdatedAt) {
      pgTable += addTimestampTriggers(table.name);
    }
  }
  
  // Activer la sécurité au niveau des lignes si configuré
  if (config.options.enableRowLevelSecurity) {
    pgTable += `ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;\n\n`;
  }
  
  return pgTable;
}

/**
 * Convertit une colonne MySQL en colonne PostgreSQL
 */
function convertColumn(columnLine: string, tableName: string, config: MigrationConfig, enumTypes: Record<string, string>, stats: MigrationStats): string {
  // `column_name` type [NOT NULL] [DEFAULT value] [AUTO_INCREMENT]
  const parts = columnLine.match(/^`?(\w+)`?\s+(.+)$/);
  
  if (!parts) {
    stats.warnings.push(`Définition de colonne invalide: ${columnLine}`);
    return columnLine; // Retourner tel quel si la regex ne correspond pas
  }
  
  const columnName = parts[1];
  let columnDef = parts[2];
  
  // Appliquer les règles de conversion dans l'ordre de priorité
  for (const rule of config.rules) {
    const regex = new RegExp(rule.mysqlPattern, 'i');
    
    if (regex.test(columnDef)) {
      // Incrémenter le compteur de règles appliquées
      stats.rulesApplied[rule.name] = (stats.rulesApplied[rule.name] || 0) + 1;
      
      if (rule.complexTransformation) {
        // Traitement spécial pour les transformations complexes
        if (rule.name === 'enum' && config.options.convertEnumsToTypes) {
          const typeName = `${tableName}_${columnName}_enum`;
          if (enumTypes[typeName]) {
            columnDef = columnDef.replace(regex, typeName);
          } else {
            // Fallback vers une contrainte CHECK si le type ENUM n'a pas été trouvé
            const enumMatch = columnDef.match(/ENUM\(([^)]+)\)/i);
            if (enumMatch) {
              columnDef = columnDef.replace(regex, `TEXT CHECK ("${columnName}" IN (${enumMatch[1]}))`);
            } else {
              columnDef = columnDef.replace(regex, 'TEXT');
            }
          }
        } else if (rule.name === 'set') {
          // Convertir SET en TEXT avec une contrainte CHECK
          const setMatch = columnDef.match(/SET\(([^)]+)\)/i);
          if (setMatch) {
            columnDef = columnDef.replace(regex, `TEXT`);
            // Une contrainte CHECK plus complexe pourrait être ajoutée ici si nécessaire
          } else {
            columnDef = columnDef.replace(regex, 'TEXT');
          }
        }
      } else {
        // Transformation standard
        let replacement = rule.postgresqlReplacement;
        
        // Remplacer les variables dans la chaîne de remplacement
        const matches = columnDef.match(regex);
        if (matches && matches.length > 1) {
          for (let i = 1; i < matches.length; i++) {
            const placeholder = new RegExp(`\\$${i}`, 'g');
            replacement = replacement.replace(placeholder, matches[i]);
          }
        }
        
        // Traiter les expressions conditionnelles ${if:condition:true:false}
        const ifRegex = /\${if:([^:]+):([^:]+)(?::([^}]+))?}/g;
        replacement = replacement.replace(ifRegex, (match, condition, trueValue, falseValue = '') => {
          try {
            // Évaluer la condition
            const result = eval(condition);
            return result ? trueValue : falseValue;
          } catch (error) {
            return trueValue; // Par défaut, retourner la valeur true en cas d'erreur
          }
        });
        
        // Substituer le nom de colonne si nécessaire
        replacement = replacement.replace(/\${column}/g, columnName);
        
        // Substituer le type enum si applicable
        replacement = replacement.replace(/\${enumType}/g, `${tableName}_${columnName}_enum`);
        
        columnDef = columnDef.replace(regex, replacement);
      }
      
      // Enregistrer si la règle nécessite une révision manuelle
      if (rule.requiresManualReview) {
        stats.warnings.push(`La colonne ${tableName}.${columnName} utilise le type ${rule.name} qui nécessite une révision manuelle`);
      }
      
      // On sort après avoir appliqué la première règle qui correspond
      break;
    }
  }
  
  // Vérifier si la colonne est NOT NULL
  const isNotNull = / NOT NULL/i.test(columnDef);
  
  // Gérer AUTO_INCREMENT après avoir appliqué les règles
  // (peut-être déjà transformé par une règle, mais on vérifie quand même)
  if (/ AUTO_INCREMENT/i.test(columnDef)) {
    if (/ BIGINT/i.test(columnDef)) {
      columnDef = 'BIGSERIAL' + (isNotNull ? ' NOT NULL' : '');
    } else {
      columnDef = 'SERIAL' + (isNotNull ? ' NOT NULL' : '');
    }
  }
  
  // Formater la colonne
  return `"${columnName}" ${columnDef}`;
}

/**
 * Convertit une contrainte MySQL en contrainte PostgreSQL
 */
function convertConstraint(constraintLine: string, config: MigrationConfig, stats: MigrationStats): string {
  if (constraintLine.trim().startsWith('PRIMARY KEY')) {
    // PRIMARY KEY (`id`)
    const match = constraintLine.match(/PRIMARY\s+KEY\s+\(([^)]+)\)/i);
    if (match) {
      const columns = match[1].split(',')
        .map(col => `"${col.trim().replace(/`/g, '')}"`)
        .join(', ');
      return `PRIMARY KEY (${columns})`;
    }
  } else if (constraintLine.trim().startsWith('UNIQUE KEY')) {
    // UNIQUE KEY `idx_name` (`column`)
    const match = constraintLine.match(/UNIQUE\s+KEY\s+`?(\w+)`?\s+\(([^)]+)\)/i);
    if (match) {
      const indexName = match[1];
      const columns = match[2].split(',')
        .map(col => `"${col.trim().replace(/`/g, '')}"`)
        .join(', ');
      return `CONSTRAINT "${indexName}" UNIQUE (${columns})`;
    }
  } else if (constraintLine.trim().startsWith('FOREIGN KEY')) {
    // FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    const match = constraintLine.match(/FOREIGN\s+KEY\s+\(([^)]+)\)\s+REFERENCES\s+`?(\w+)`?\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
    if (match) {
      const columns = match[1].split(',')
        .map(col => `"${col.trim().replace(/`/g, '')}"`)
        .join(', ');
      const refTable = match[2];
      const refColumns = match[3].split(',')
        .map(col => `"${col.trim().replace(/`/g, '')}"`)
        .join(', ');
      
      let constraint = `FOREIGN KEY (${columns}) REFERENCES "${refTable}" (${refColumns})`;
      
      if (match[4]) { // ON DELETE
        constraint += ` ON DELETE ${match[4]}`;
      }
      
      if (match[5]) { // ON UPDATE
        constraint += ` ON UPDATE ${match[5]}`;
      }
      
      return constraint;
    }
  } else if (constraintLine.trim().startsWith('CONSTRAINT')) {
    // CONSTRAINT `fk_name` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    const match = constraintLine.match(/CONSTRAINT\s+`?(\w+)`?\s+FOREIGN\s+KEY\s+\(([^)]+)\)\s+REFERENCES\s+`?(\w+)`?\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
    if (match) {
      const constraintName = match[1];
      const columns = match[2].split(',')
        .map(col => `"${col.trim().replace(/`/g, '')}"`)
        .join(', ');
      const refTable = match[3];
      const refColumns = match[4].split(',')
        .map(col => `"${col.trim().replace(/`/g, '')}"`)
        .join(', ');
      
      let constraint = `CONSTRAINT "${constraintName}" FOREIGN KEY (${columns}) REFERENCES "${refTable}" (${refColumns})`;
      
      if (match[5]) { // ON DELETE
        constraint += ` ON DELETE ${match[5]}`;
      }
      
      if (match[6]) { // ON UPDATE
        constraint += ` ON UPDATE ${match[6]}`;
      }
      
      return constraint;
    }
  }
  
  // Si aucune conversion n'a pu être appliquée, ajouter un avertissement
  stats.warnings.push(`Contrainte non convertie: ${constraintLine}`);
  return constraintLine; // Retourner tel quel si aucune conversion n'a pu être appliquée
}

/**
 * Crée les triggers pour la mise à jour automatique des timestamps
 */
function addTimestampTriggers(tableName: string): string {
  const functionName = `update_${tableName}_updated_at`;
  
  let sql = `-- Trigger de mise à jour automatique des timestamps pour ${tableName}\n`;
  sql += `CREATE OR REPLACE FUNCTION ${functionName}()\n`;
  sql += `RETURNS TRIGGER AS $$\n`;
  sql += `BEGIN\n`;
  sql += `    NEW.updated_at = NOW();\n`;
  sql += `    RETURN NEW;\n`;
  sql += `END;\n`;
  sql += `$$ LANGUAGE plpgsql;\n\n`;
  
  sql += `DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON "${tableName}";\n`;
  sql += `CREATE TRIGGER update_${tableName}_updated_at\n`;
  sql += `    BEFORE UPDATE ON "${tableName}"\n`;
  sql += `    FOR EACH ROW\n`;
  sql += `    EXECUTE FUNCTION ${functionName}();\n\n`;
  
  return sql;
}

/**
 * Migre directement une base MySQL vers PostgreSQL sans passer par des fichiers
 */
async function migrateDirectly(
  mysqlUri: string,
  pgUri: string,
  config: MigrationConfig,
  stats: MigrationStats,
  schemaOnly: boolean = false,
  batchSize: number = 10000
): Promise<void> {
  console.log(chalk.blue(`🔄 Démarrage de la migration directe de MySQL vers PostgreSQL`));
  
  // Connexion à MySQL
  console.log(chalk.blue(`🔌 Connexion à MySQL...`));
  const mysqlConnection = await mysql.createConnection(mysqlUri);
  
  // Connexion à PostgreSQL
  console.log(chalk.blue(`🔌 Connexion à PostgreSQL...`));
  const pgClient = new Client({ connectionString: pgUri });
  await pgClient.connect();
  
  try {
    // Début de la transaction PostgreSQL
    await pgClient.query('BEGIN');
    
    // Créer les extensions
    if (config.options.createExtensions && config.extensions.length > 0) {
      console.log(chalk.blue(`🔄 Création des extensions PostgreSQL...`));
      
      for (const extension of config.extensions) {
        await pgClient.query(`CREATE EXTENSION IF NOT EXISTS "${extension}"`);
      }
    }
    
    // Exécuter les scripts pré-migration
    if (config.preScripts.length > 0) {
      console.log(chalk.blue(`🔄 Exécution des scripts pré-migration...`));
      
      for (const script of config.preScripts) {
        await pgClient.query(script);
      }
    }
    
    // Récupérer la liste des tables MySQL
    console.log(chalk.blue(`🔍 Récupération de la liste des tables MySQL...`));
    const [tables] = await mysqlConnection.query('SHOW TABLES');
    
    // Pour chaque table
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0] as string;
      stats.tablesProcessed++;
      
      try {
        console.log(chalk.blue(`🔄 Migration de la table: ${tableName}`));
        
        // Récupérer la structure de la table
        const [tableCreate] = await mysqlConnection.query(`SHOW CREATE TABLE \`${tableName}\``);
        const createTableSql = (tableCreate[0] as any)['Create Table'];
        
        // Convertir la structure en PostgreSQL
        // (On utilise une version simplifiée ici, dans une implémentation réelle,
        // cette partie serait plus complexe et utiliserait les règles de conversion)
        const pgCreateTableSql = await convertCreateTableStatement(createTableSql, config, stats);
        
        // Créer la table dans PostgreSQL
        await pgClient.query(pgCreateTableSql);
        
        // Si on ne migre pas seulement le schéma, migrer aussi les données
        if (!schemaOnly) {
          await migrateTableData(mysqlConnection, pgClient, tableName, batchSize, stats);
        }
        
        stats.tablesMigrated++;
      } catch (error) {
        stats.errors.push(`Erreur lors de la migration de la table ${tableName}: ${error.message}`);
        console.error(chalk.red(`❌ Erreur lors de la migration de la table ${tableName}: ${error.message}`));
      }
    }
    
    // Exécuter les scripts post-migration
    if (config.postScripts.length > 0) {
      console.log(chalk.blue(`🔄 Exécution des scripts post-migration...`));
      
      for (const script of config.postScripts) {
        await pgClient.query(script);
      }
    }
    
    // Valider la transaction
    await pgClient.query('COMMIT');
    
    console.log(chalk.green(`✅ Migration directe terminée avec succès!`));
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await pgClient.query('ROLLBACK');
    
    console.error(chalk.red(`❌ Erreur lors de la migration directe: ${error.message}`));
    stats.errors.push(`Erreur lors de la migration directe: ${error.message}`);
    throw error;
  } finally {
    // Fermer les connexions
    await mysqlConnection.end();
    await pgClient.end();
  }
}

/**
 * Convertit une instruction CREATE TABLE MySQL en PostgreSQL
 * Fonction simplifiée, serait plus complexe dans une implémentation réelle
 */
async function convertCreateTableStatement(createTableSql: string, config: MigrationConfig, stats: MigrationStats): Promise<string> {
  // Extraire le nom de la table
  const tableNameMatch = createTableSql.match(/CREATE\s+TABLE\s+`?(\w+)`?/i);
  if (!tableNameMatch) throw new Error('Nom de table non trouvé dans la requête CREATE TABLE');
  
  const tableName = tableNameMatch[1];
  
  // Extraire le contenu entre parenthèses
  const contentMatch = createTableSql.match(/\(([\s\S]+)\)\s*(?:ENGINE|$)/i);
  if (!contentMatch) throw new Error('Contenu de table non trouvé dans la requête CREATE TABLE');
  
  const tableContent = contentMatch[1];
  
  // Convertir la table en utilisant la fonction de conversion
  return convertTable({ name: tableName, content: tableContent }, config, {}, stats);
}

/**
 * Migre les données d'une table MySQL vers PostgreSQL
 */
async function migrateTableData(
  mysqlConnection: mysql.Connection,
  pgClient: Client,
  tableName: string,
  batchSize: number,
  stats: MigrationStats
): Promise<void> {
  console.log(chalk.blue(`📊 Migration des données de la table: ${tableName}`));
  
  // Récupérer le nombre total de lignes
  const [countResult] = await mysqlConnection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
  const totalRows = (countResult[0] as any).count;
  
  console.log(chalk.blue(`📊 Total de lignes à migrer: ${totalRows}`));
  
  // Récupérer la liste des colonnes
  const [columns] = await mysqlConnection.query(`SHOW COLUMNS FROM \`${tableName}\``);
  const columnNames = (columns as any[]).map(col => col.Field);
  
  // Migrer les données par lots
  let offset = 0;
  while (offset < totalRows) {
    const [rows] = await mysqlConnection.query(`SELECT * FROM \`${tableName}\` LIMIT ${offset}, ${batchSize}`);
    
    if ((rows as any[]).length === 0) break;
    
    // Construire les requêtes d'insertion PostgreSQL
    for (const row of rows as any[]) {
      const values = columnNames.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (typeof value === 'number') return value;
        if (typeof value === 'object' && value instanceof Date) {
          return `'${value.toISOString()}'`;
        }
        if (typeof value === 'object') {
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        }
        return `'${String(value).replace(/'/g, "''")}'`;
      });
      
      const insertQuery = `INSERT INTO "${tableName}" ("${columnNames.join('", "')}") VALUES (${values.join(', ')})`;
      
      try {
        await pgClient.query(insertQuery);
      } catch (error) {
        stats.errors.push(`Erreur lors de l'insertion dans ${tableName}: ${error.message}`);
        console.error(chalk.red(`❌ Erreur lors de l'insertion: ${error.message}`));
      }
    }
    
    offset += batchSize;
    console.log(chalk.blue(`📊 Lignes migrées: ${Math.min(offset, totalRows)}/${totalRows}`));
  }
  
  console.log(chalk.green(`✅ Migration des données de ${tableName} terminée`));
}

/**
 * Applique le SQL généré à une base PostgreSQL
 */
async function applyGeneratedSQL(sqlFilePath: string, pgUri: string | undefined, stats: MigrationStats): Promise<void> {
  if (!pgUri) {
    stats.errors.push('URI PostgreSQL non spécifiée pour l\'application du SQL');
    throw new Error('URI PostgreSQL requise pour appliquer le SQL');
  }
  
  console.log(chalk.blue(`🔄 Application du SQL généré à la base PostgreSQL...`));
  
  try {
    execSync(`psql "${pgUri}" -f "${sqlFilePath}"`, { stdio: 'inherit' });
    console.log(chalk.green(`✅ SQL appliqué avec succès!`));
  } catch (error) {
    stats.errors.push(`Erreur lors de l'application du SQL: ${error.message}`);
    console.error(chalk.red(`❌ Erreur lors de l'application du SQL: ${error.message}`));
    throw error;
  }
}

/**
 * Valide la migration en vérifiant l'intégrité des données
 */
async function validateMigration(pgUri: string | undefined, stats: MigrationStats): Promise<void> {
  if (!pgUri) {
    stats.warnings.push('URI PostgreSQL non spécifiée pour la validation');
    console.warn(chalk.yellow(`⚠️ Validation ignorée: URI PostgreSQL non spécifiée`));
    return;
  }
  
  console.log(chalk.blue(`🔍 Validation de la migration...`));
  
  try {
    // Connexion à PostgreSQL
    const pgClient = new Client({ connectionString: pgUri });
    await pgClient.connect();
    
    // Vérifier la présence des tables
    const tablesRes = await pgClient.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log(chalk.blue(`📊 Tables PostgreSQL trouvées: ${tablesRes.rows.length}`));
    
    // Vérifier les contraintes
    const constraintsRes = await pgClient.query(`
      SELECT conname, contype, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY conrelid::regclass::text, contype
    `);
    
    console.log(chalk.blue(`📊 Contraintes PostgreSQL trouvées: ${constraintsRes.rows.length}`));
    
    // Autres vérifications pourraient être ajoutées ici
    
    await pgClient.end();
    
    console.log(chalk.green(`✅ Validation de la migration terminée avec succès!`));
  } catch (error) {
    stats.errors.push(`Erreur lors de la validation: ${error.message}`);
    console.error(chalk.red(`❌ Erreur lors de la validation: ${error.message}`));
  }
}

/**
 * Affiche un résumé de la migration
 */
function displayMigrationSummary(stats: MigrationStats): void {
  console.log(chalk.blue(`\n📊 Résumé de la migration:`));
  
  console.log(`Duration: ${stats.summary.totalDuration?.toFixed(2)} secondes`);
  console.log(`Tables: ${stats.tablesMigrated}/${stats.tablesProcessed} migrées (${(stats.summary.successRate || 0) * 100}%)`);
  console.log(`Colonnes: ${stats.columnsMigrated}/${stats.columnsProcessed} migrées`);
  
  console.log(chalk.blue(`\n📊 Règles appliquées:`));
  for (const [ruleName, count] of Object.entries(stats.rulesApplied).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${ruleName}: ${count} fois`);
  }
  
  if (stats.warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️ Avertissements (${stats.warnings.length}):`));
    for (const warning of stats.warnings.slice(0, 10)) { // Limiter l'affichage aux 10 premiers avertissements
      console.log(chalk.yellow(`  - ${warning}`));
    }
    if (stats.warnings.length > 10) {
      console.log(chalk.yellow(`  ... et ${stats.warnings.length - 10} avertissements supplémentaires`));
    }
  }
  
  if (stats.errors.length > 0) {
    console.log(chalk.red(`\n❌ Erreurs (${stats.errors.length}):`));
    for (const error of stats.errors.slice(0, 10)) { // Limiter l'affichage aux 10 premières erreurs
      console.log(chalk.red(`  - ${error}`));
    }
    if (stats.errors.length > 10) {
      console.log(chalk.red(`  ... et ${stats.errors.length - 10} erreurs supplémentaires`));
    }
  }
  
  console.log(chalk.blue(`\n📝 Recommandations:`));
  
  if (stats.warnings.length > 0 || stats.errors.length > 0) {
    console.log(`  - Examinez les avertissements et erreurs pour identifier les problèmes potentiels`);
  }
  
  if (stats.rulesApplied['enum'] > 0) {
    console.log(`  - Vérifiez que les types ENUM ont été correctement convertis`);
  }
  
  if (stats.rulesApplied['geometry'] > 0) {
    console.log(`  - Assurez-vous que l'extension PostGIS est activée pour les types géométriques`);
  }
  
  if (stats.summary.success) {
    console.log(chalk.green(`\n✅ Migration réussie!`));
  } else {
    console.log(chalk.yellow(`\n⚠️ Migration terminée avec des problèmes. Veuillez examiner les erreurs.`));
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`❌ Erreur fatale: ${error.message}`));
  console.error(error);
  process.exit(1);
});