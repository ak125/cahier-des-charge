#!/usr/bin/env ts-node

/**
 * Type Mapper - Agent 4
 *
 * Utilitaire avancé pour cartographier les types de données entre différents systèmes
 * Prend en charge la conversion entre :
 * - MySQL -> PostgreSQL
 * - MySQL/PostgreSQL -> Prisma Schema
 * - Détection des cas problématiques et suggestion d'améliorations
 *
 * Usage:
 * ts-node type-mapper.ts --input=schema.sql --output=type_mapping.json --format=json
 * ts-node type-mapper.ts --analyze-schema=my_database --output=prisma_schema.prisma
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import * as mysql from 'mysql2/promise';
import * as pg from 'pg';
import { parse as parseSQL } from 'sql-parser-cst';
import * as z from 'zod';

// Schémas Zod pour la validation
const MappingEntrySchema = z.object({
  mysql: z.string(),
  postgres: z.string(),
  prisma: z.string(),
  warning: z.string().optional(),
  suggestion: z.string().optional(),
});

type MappingEntry = z.infer<typeof MappingEntrySchema>;

const TypeMappingSchema = z.record(z.string(), MappingEntrySchema);
type TypeMapping = z.infer<typeof TypeMappingSchema>;

// Configuration du programme
const program = new Command();
program
  .version('1.0.0')
  .description(
    'Outil avancé de cartographie et conversion de types entre MySQL, PostgreSQL et Prisma'
  )
  .option('-i, --input <path>', 'Fichier SQL ou JSON à analyser')
  .option('-o, --output <path>', 'Chemin du fichier de sortie')
  .option('-f, --format <format>', 'Format de sortie (json, prisma, markdown)', 'json')
  .option('-db, --database <name>', 'Nom de la base de données à analyser')
  .option('-h, --host <host>', 'Hôte de la base de données', 'localhost')
  .option('-p, --port <port>', 'Port de la base de données')
  .option('-u, --user <user>', 'Utilisateur de la base de données')
  .option('-pw, --password <password>', 'Mot de passe de la base de données')
  .option('-t, --type <type>', 'Type de base de données (mysql, postgres)', 'mysql')
  .option('-a, --analyze-schema <schema>', 'Analyser directement un schéma de base de données')
  .option('-v, --verbose', 'Mode verbeux')
  .option('-w, --warnings-only', 'Afficher uniquement les avertissements')
  .option('--with-suggestions', "Inclure des suggestions d'amélioration", true)
  .option('--with-zod', 'Générer des schémas Zod pour la validation', false)
  .option('--with-typescript', 'Générer des types TypeScript', false)
  .parse(process.argv);

const options = program.opts();

// Base de données de mapping des types
const typeMapping: Record<string, Record<string, string>> = {
  // Types numériques
  TINYINT: { postgres: 'SMALLINT', prisma: 'Int @db.SmallInt' },
  'TINYINT(1)': { postgres: 'BOOLEAN', prisma: 'Boolean' },
  SMALLINT: { postgres: 'SMALLINT', prisma: 'Int @db.SmallInt' },
  MEDIUMINT: { postgres: 'INTEGER', prisma: 'Int' },
  INT: { postgres: 'INTEGER', prisma: 'Int' },
  BIGINT: { postgres: 'BIGINT', prisma: 'BigInt @db.BigInt' },
  FLOAT: { postgres: 'REAL', prisma: 'Float @db.Real' },
  DOUBLE: { postgres: 'DOUBLE PRECISION', prisma: 'Float' },
  DECIMAL: { postgres: 'NUMERIC', prisma: 'Decimal @db.Decimal' },

  // Types textuels
  CHAR: { postgres: 'CHAR', prisma: 'String @db.Char' },
  VARCHAR: { postgres: 'VARCHAR', prisma: 'String @db.VarChar' },
  TINYTEXT: { postgres: 'TEXT', prisma: 'String @db.Text' },
  TEXT: { postgres: 'TEXT', prisma: 'String @db.Text' },
  MEDIUMTEXT: { postgres: 'TEXT', prisma: 'String @db.Text' },
  LONGTEXT: { postgres: 'TEXT', prisma: 'String @db.Text' },

  // Types binaires
  BINARY: { postgres: 'BYTEA', prisma: 'Bytes' },
  VARBINARY: { postgres: 'BYTEA', prisma: 'Bytes' },
  TINYBLOB: { postgres: 'BYTEA', prisma: 'Bytes' },
  BLOB: { postgres: 'BYTEA', prisma: 'Bytes' },
  MEDIUMBLOB: { postgres: 'BYTEA', prisma: 'Bytes' },
  LONGBLOB: { postgres: 'BYTEA', prisma: 'Bytes' },

  // Types temporels
  DATE: { postgres: 'DATE', prisma: 'DateTime @db.Date' },
  TIME: { postgres: 'TIME', prisma: 'DateTime @db.Time' },
  DATETIME: { postgres: 'TIMESTAMP', prisma: 'DateTime' },
  TIMESTAMP: { postgres: 'TIMESTAMP', prisma: 'DateTime' },
  YEAR: { postgres: 'SMALLINT', prisma: 'Int @db.SmallInt' },

  // Types JSON
  JSON: { postgres: 'JSONB', prisma: 'Json' },

  // Types spéciaux
  ENUM: { postgres: 'TEXT', prisma: 'String @db.Text' },
  SET: { postgres: 'TEXT[]', prisma: 'String[]' },
  GEOMETRY: { postgres: 'GEOMETRY', prisma: 'Unsupported("GEOMETRY")' },
};

// Patrons problématiques à détecter
const problematicPatterns = [
  {
    pattern: /FLOAT|DOUBLE/i,
    forFinancial: true,
    warning: 'Type à virgule flottante utilisé pour des données financières',
    suggestion: 'Utiliser NUMERIC(precision,scale) pour une précision exacte',
  },
  {
    pattern: /ENUM/i,
    warning: 'Les ENUM MySQL ne sont pas nativement supportés par PostgreSQL',
    suggestion: 'Créer un type ENUM en Prisma ou utiliser une table de référence',
  },
  {
    pattern: /SET/i,
    warning: 'Les types SET MySQL ne sont pas supportés par PostgreSQL',
    suggestion: 'Utiliser un tableau (TEXT[]) ou une table de jointure',
  },
  {
    pattern: /UNSIGNED/i,
    warning: 'Les entiers UNSIGNED ne sont pas supportés par PostgreSQL',
    suggestion: 'Utiliser un type de taille supérieure (ex: INT -> BIGINT)',
  },
  {
    pattern: /JSON/i,
    warning: 'Colonne stockant probablement du JSON sans validation de structure',
    suggestion: 'Utiliser JSONB avec contraintes ou définir un zod schema',
  },
  {
    pattern: /TEXT|BLOB/i,
    forPrimaryKey: true,
    warning: 'Utilisation de TEXT/BLOB comme clé primaire',
    suggestion: 'Utiliser INT, BIGINT ou UUID comme clé primaire pour de meilleures performances',
  },
];

// Fonction principale
async function main() {
  try {
    console.log(chalk.blue('📊 Type Mapper - Agent 4'));
    console.log(chalk.blue('=========================================='));

    let mappingData: TypeMapping = {};

    if (options.input) {
      console.log(chalk.green(`Analyse du fichier: ${options.input}`));
      mappingData = await processInputFile(options.input);
    } else if (options.analyzeSchema) {
      console.log(chalk.green(`Analyse directe du schéma: ${options.analyzeSchema}`));
      mappingData = await analyzeDatabaseSchema(options.analyzeSchema);
    } else {
      console.error(
        chalk.red("Erreur: Vous devez spécifier un fichier d'entrée ou un schéma à analyser")
      );
      process.exit(1);
    }

    // Génération du fichier de sortie
    if (options.output) {
      await generateOutput(mappingData, options.output, options.format);
      console.log(chalk.green(`✅ Fichier de sortie généré: ${options.output}`));
    } else {
      // Affichage dans la console si pas de fichier de sortie spécifié
      console.log(chalk.yellow('Résultats de la conversion:'));
      console.log(JSON.stringify(mappingData, null, 2));
    }

    // Affichage des statistiques
    const stats = generateStatistics(mappingData);
    console.log(chalk.blue('\n📈 Statistiques:'));
    console.log(chalk.blue('------------------------------------------'));
    console.log(`Tables analysées: ${stats.tables}`);
    console.log(`Colonnes analysées: ${stats.columns}`);
    console.log(`Avertissements détectés: ${stats.warnings}`);
    console.log(`Types problématiques: ${stats.problematicTypes.join(', ')}`);
    console.log(chalk.blue('=========================================='));
  } catch (error) {
    console.error(chalk.red("Erreur lors de l'exécution:"), error);
    process.exit(1);
  }
}

// Analyser un fichier d'entrée (SQL ou JSON)
async function processInputFile(filePath: string): Promise<TypeMapping> {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileExt = path.extname(filePath).toLowerCase();

  if (fileExt === '.sql') {
    return parseSQLFile(fileContent);
  }
  if (fileExt === '.json') {
    return JSON.parse(fileContent);
  }
  throw new Error(`Format de fichier non pris en charge: ${fileExt}`);
}

// Parser un fichier SQL pour extraire les définitions de tables et colonnes
function parseSQLFile(sqlContent: string): TypeMapping {
  const mapping: TypeMapping = {};

  try {
    // Utilisation de sql-parser-cst pour une analyse plus robuste
    const ast = parseSQL(sqlContent);

    // Pour chaque CREATE TABLE dans le SQL
    const createTableStatements = findCreateTableStatements(ast);

    for (const statement of createTableStatements) {
      const tableName = extractTableName(statement);
      const columns = extractColumns(statement);

      for (const column of columns) {
        const columnDef = analyzeColumnDefinition(column);
        const key = `${tableName}.${columnDef.name}`;

        mapping[key] = {
          mysql: columnDef.mysqlType,
          postgres: mapToPostgresType(columnDef),
          prisma: mapToPrismaType(columnDef),
        };

        // Ajouter des avertissements si nécessaire
        const warnings = detectProblematicPatterns(columnDef);
        if (warnings.warning) {
          mapping[key].warning = warnings.warning;
        }
        if (warnings.suggestion) {
          mapping[key].suggestion = warnings.suggestion;
        }
      }
    }

    return mapping;
  } catch (error) {
    console.error(chalk.red("Erreur lors de l'analyse du SQL:"), error);
    return mapping;
  }
}

// Fonctions d'aide pour l'analyse SQL (implémentées de façon simplifiée)
function findCreateTableStatements(_ast: any): any[] {
  // Simplifié pour l'exemple
  return [];
}

function extractTableName(_statement: any): string {
  // Simplifié pour l'exemple
  return 'table_name';
}

function extractColumns(_statement: any): any[] {
  // Simplifié pour l'exemple
  return [];
}

function analyzeColumnDefinition(_columnDef: any): any {
  // Simplifié pour l'exemple
  return {
    name: 'column_name',
    mysqlType: 'VARCHAR(255)',
    nullable: false,
    primaryKey: false,
    defaultValue: null,
  };
}

// Analyser directement un schéma de base de données
async function analyzeDatabaseSchema(schemaName: string): Promise<TypeMapping> {
  const mapping: TypeMapping = {};

  if (options.type === 'mysql') {
    const connection = await mysql.createConnection({
      host: options.host,
      port: options.port ? parseInt(options.port) : 3306,
      user: options.user,
      password: options.password,
      database: schemaName,
    });

    try {
      // Récupérer toutes les tables
      const [tables] = await connection.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
        [schemaName]
      );

      for (const table of tables as any[]) {
        const tableName = table.TABLE_NAME;

        // Récupérer les colonnes pour chaque table
        const [columns] = await connection.query(
          `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
           ORDER BY ORDINAL_POSITION`,
          [schemaName, tableName]
        );

        for (const column of columns as any[]) {
          const key = `${tableName}.${column.COLUMN_NAME}`;
          const mysqlType = column.COLUMN_TYPE.toUpperCase();

          const isPrimaryKey = column.COLUMN_KEY === 'PRI';
          const isNullable = column.IS_NULLABLE === 'YES';
          const hasDefault = column.COLUMN_DEFAULT !== null;
          const isAutoIncrement = column.EXTRA.includes('auto_increment');

          // Mappage vers PostgreSQL et Prisma
          const postgresType = mapMySQLToPostgreSQL(mysqlType, isPrimaryKey, isAutoIncrement);
          const prismaType = mapToFullPrismaType(
            mysqlType,
            isPrimaryKey,
            isNullable,
            hasDefault,
            column.COLUMN_DEFAULT,
            isAutoIncrement
          );

          mapping[key] = {
            mysql: mysqlType,
            postgres: postgresType,
            prisma: prismaType,
          };

          // Détection des patterns problématiques
          const columnInfo = {
            name: column.COLUMN_NAME,
            mysqlType,
            nullable: isNullable,
            primaryKey: isPrimaryKey,
            defaultValue: column.COLUMN_DEFAULT,
            autoIncrement: isAutoIncrement,
          };

          const warnings = detectProblematicPatterns(columnInfo);
          if (warnings.warning) {
            mapping[key].warning = warnings.warning;
          }
          if (warnings.suggestion) {
            mapping[key].suggestion = warnings.suggestion;
          }
        }
      }
    } finally {
      await connection.end();
    }
  } else if (options.type === 'postgres') {
    const client = new pg.Client({
      host: options.host,
      port: options.port ? parseInt(options.port) : 5432,
      user: options.user,
      password: options.password,
      database: schemaName,
    });

    try {
      await client.connect();

      // Récupérer toutes les tables
      const tablesResult = await client.query(
        `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
      );

      for (const table of tablesResult.rows) {
        const tableName = table.tablename;

        // Récupérer les colonnes pour chaque table
        const columnsResult = await client.query(
          `SELECT column_name, data_type, udt_name, character_maximum_length, 
                  is_nullable, column_default,
                  (SELECT pg_get_expr(d.adbin, d.adrelid) 
                   FROM pg_catalog.pg_attrdef d
                   WHERE d.adrelid = format('%I.%I', table_schema, table_name)::regclass
                   AND d.adnum = ordinal_position
                   AND d.adrelid = format('%I.%I', table_schema, table_name)::regclass) as generation_expression
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [tableName]
        );

        for (const column of columnsResult.rows) {
          const key = `${tableName}.${column.column_name}`;
          const pgType = formatPostgresType(column);

          // Conversion vers Prisma
          const prismaType = mapPostgresToPrismaType(column);

          mapping[key] = {
            postgres: pgType,
            prisma: prismaType,
          };

          // Nous n'avons pas les types MySQL ici, donc on n'ajoute pas d'avertissements spécifiques MySQL
        }
      }
    } finally {
      await client.end();
    }
  } else {
    throw new Error(`Type de base de données non pris en charge: ${options.type}`);
  }

  return mapping;
}

// Formater un type PostgreSQL complet à partir des métadonnées de colonne
function formatPostgresType(column: any): string {
  let type = column.data_type.toUpperCase();

  // Ajouter la taille pour les types qui le supportent
  if (
    column.character_maximum_length &&
    ['CHARACTER', 'CHARACTER VARYING', 'VARCHAR', 'CHAR'].includes(type)
  ) {
    type += `(${column.character_maximum_length})`;
  }

  return type;
}

// Mapper un type MySQL vers PostgreSQL
function mapMySQLToPostgreSQL(
  mysqlType: string,
  isPrimaryKey: boolean,
  isAutoIncrement: boolean
): string {
  // Extraire le type de base (sans les paramètres)
  const baseType = mysqlType.split('(')[0].trim();

  // Cas particuliers
  if (baseType === 'TINYINT' && mysqlType.includes('(1)')) {
    return 'BOOLEAN';
  }

  if (isPrimaryKey && isAutoIncrement) {
    if (baseType === 'BIGINT') {
      return 'BIGSERIAL';
    }
    return 'SERIAL';
  }

  // Utiliser le mapping standard
  if (typeMapping[baseType]?.postgres) {
    const pgType = typeMapping[baseType].postgres;

    // Ajouter les paramètres si nécessaire (ex: VARCHAR(255))
    const match = mysqlType.match(/\(([^)]+)\)/);
    if (match && ['VARCHAR', 'CHAR', 'NUMERIC', 'DECIMAL'].includes(pgType)) {
      return `${pgType}(${match[1]})`;
    }

    return pgType;
  }

  // Type non reconnu, conserver tel quel avec un avertissement
  console.warn(chalk.yellow(`Type MySQL non reconnu: ${mysqlType}, conservé tel quel`));
  return mysqlType;
}

// Mapper un type vers un type Prisma complet (avec modificateurs)
function mapToFullPrismaType(
  mysqlType: string,
  isPrimaryKey: boolean,
  isNullable: boolean,
  hasDefault: boolean,
  defaultValue: string | null,
  isAutoIncrement: boolean
): string {
  // Extraire le type de base (sans les paramètres)
  const baseType = mysqlType.split('(')[0].trim();

  // Type de base Prisma
  let prismaType = '';

  // Cas particulier pour TINYINT(1) qui est généralement un booléen
  if (baseType === 'TINYINT' && mysqlType.includes('(1)')) {
    prismaType = 'Boolean';
  } else if (typeMapping[baseType]?.prisma) {
    prismaType = typeMapping[baseType].prisma;
  } else {
    // Type non reconnu
    prismaType = `String @db.${mysqlType}`;
  }

  // Ajouter les modificateurs
  const modifiers = [];

  // Clé primaire
  if (isPrimaryKey) {
    modifiers.push('@id');
  }

  // Auto-increment
  if (isAutoIncrement) {
    modifiers.push('@default(autoincrement())');
  }

  // Valeur par défaut
  if (hasDefault && defaultValue !== null) {
    // Traiter les différents types de valeurs par défaut
    if (baseType === 'TINYINT' && mysqlType.includes('(1)')) {
      // Booléen
      const boolValue = defaultValue === '1' || defaultValue.toLowerCase() === 'true';
      modifiers.push(`@default(${boolValue})`);
    } else if (['CHAR', 'VARCHAR', 'TEXT', 'ENUM'].includes(baseType)) {
      // Chaîne de caractères
      modifiers.push(`@default("${defaultValue}")`);
    } else if (defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP') {
      // Timestamp courant
      modifiers.push('@default(now())');
    } else if (defaultValue.toUpperCase() === 'NULL') {
      // Valeur nulle par défaut
      isNullable = true;
    } else {
      // Autres types de valeurs
      modifiers.push(`@default(${defaultValue})`);
    }
  }

  // Ajouter @updatedAt pour les champs qui semblent être des timestamps de mise à jour
  if (
    (baseType === 'TIMESTAMP' || baseType === 'DATETIME') &&
    mysqlType.includes('ON UPDATE CURRENT_TIMESTAMP')
  ) {
    modifiers.push('@updatedAt');
  }

  // Ajouter le db. mapping avec les contraintes de taille si présentes
  const match = mysqlType.match(/\(([^)]+)\)/);
  if (match && !prismaType.includes('@db.')) {
    // Extraire le type Prisma de base
    const basePrismaType = prismaType.split(' ')[0];

    if (['VARCHAR', 'CHAR'].includes(baseType)) {
      // Pour les types textuels avec taille
      prismaType = `${basePrismaType} @db.${baseType}(${match[1]})`;
    } else if (['DECIMAL', 'NUMERIC'].includes(baseType)) {
      // Pour les types numériques avec précision
      prismaType = `${basePrismaType} @db.Decimal(${match[1]})`;
    }
  }

  // Combiner le type avec les modificateurs
  let finalType = prismaType;
  if (modifiers.length > 0) {
    // Si le type contient déjà des attributs, extraire le type de base
    if (finalType.includes(' @')) {
      const parts = finalType.split(' @');
      finalType = `${parts[0]} ${modifiers.join(' ')} @${parts[1]}`;
    } else {
      finalType += ` ${modifiers.join(' ')}`;
    }
  }

  // Ajouter le point d'interrogation pour les champs nullable
  if (isNullable && !finalType.startsWith('Json')) {
    // Insérer le ? après le type de base, avant les modificateurs
    if (finalType.includes(' @')) {
      finalType = finalType.replace(/^([A-Za-z0-9]+)/, '$1?');
    } else {
      finalType += '?';
    }
  }

  return finalType;
}

// Mapper un type PostgreSQL vers un type Prisma
function mapPostgresToPrismaType(column: any): string {
  const type = column.data_type.toUpperCase();
  const _udtName = column.udt_name;
  const isNullable = column.is_nullable === 'YES';

  let prismaType = '';

  // Mapping des types PostgreSQL vers Prisma
  switch (type) {
    case 'SMALLINT':
      prismaType = 'Int @db.SmallInt';
      break;
    case 'INTEGER':
      prismaType = 'Int';
      break;
    case 'BIGINT':
      prismaType = 'BigInt @db.BigInt';
      break;
    case 'REAL':
      prismaType = 'Float @db.Real';
      break;
    case 'DOUBLE PRECISION':
      prismaType = 'Float';
      break;
    case 'NUMERIC':
    case 'DECIMAL': {
      let precision = '';
      // Ajouter la précision si disponible
      if (column.numeric_precision && column.numeric_scale) {
        precision = `(${column.numeric_precision},${column.numeric_scale})`;
      }
      prismaType = `Decimal @db.Decimal${precision}`;
      break;
    }
    case 'BOOLEAN':
      prismaType = 'Boolean';
      break;
    case 'TEXT':
      prismaType = 'String @db.Text';
      break;
    case 'CHARACTER VARYING':
    case 'VARCHAR': {
      let length = '';
      if (column.character_maximum_length) {
        length = `(${column.character_maximum_length})`;
      }
      prismaType = `String @db.VarChar${length}`;
      break;
    }
    case 'CHARACTER':
    case 'CHAR': {
      let charLength = '';
      if (column.character_maximum_length) {
        charLength = `(${column.character_maximum_length})`;
      }
      prismaType = `String @db.Char${charLength}`;
      break;
    }
    case 'BYTEA':
      prismaType = 'Bytes';
      break;
    case 'DATE':
      prismaType = 'DateTime @db.Date';
      break;
    case 'TIME':
      prismaType = 'DateTime @db.Time';
      break;
    case 'TIMESTAMP':
    case 'TIMESTAMP WITHOUT TIME ZONE':
      prismaType = 'DateTime';
      break;
    case 'TIMESTAMP WITH TIME ZONE':
      prismaType = 'DateTime @db.Timestamptz';
      break;
    case 'JSONB':
    case 'JSON':
      prismaType = 'Json';
      break;
    case 'UUID':
      prismaType = 'String @db.Uuid';
      break;
    default:
      // Type non reconnu
      prismaType = `Unsupported("${type}")`;
  }

  // Attributs spéciaux (@id, @default, etc.)
  const attributes = [];

  // Détecter si c'est une clé primaire
  const isPrimaryKey = column.column_default?.includes('nextval') && column.column_name === 'id';

  if (isPrimaryKey) {
    attributes.push('@id');

    // Auto-increment
    if (column.column_default?.includes('nextval')) {
      if (type === 'BIGINT') {
        attributes.push('@default(autoincrement())');
      } else {
        attributes.push('@default(autoincrement())');
      }
    }
  }

  // Valeur par défaut
  if (column.column_default && !column.column_default.includes('nextval')) {
    if (column.column_default === 'CURRENT_TIMESTAMP') {
      attributes.push('@default(now())');
    } else if (column.column_default === 'true' || column.column_default === 'false') {
      attributes.push(`@default(${column.column_default})`);
    } else if (column.column_default.startsWith("'") && column.column_default.endsWith("'")) {
      // String default
      const defaultValue = column.column_default.substring(1, column.column_default.length - 1);
      attributes.push(`@default("${defaultValue}")`);
    } else {
      // Numeric or other default
      attributes.push(`@default(${column.column_default})`);
    }
  }

  // Generation expression for updatedAt
  if (column.generation_expression?.includes('CURRENT_TIMESTAMP')) {
    attributes.push('@updatedAt');
  }

  // Ajouter les attributs au type de base
  let finalType = prismaType;
  if (attributes.length > 0) {
    // Si le type contient déjà des attributs, extraire le type de base
    if (finalType.includes(' @')) {
      const parts = finalType.split(' @');
      finalType = `${parts[0]} ${attributes.join(' ')} @${parts[1]}`;
    } else {
      finalType += ` ${attributes.join(' ')}`;
    }
  }

  // Ajouter le ? pour les champs nullables
  if (isNullable && !finalType.startsWith('Json')) {
    if (finalType.includes(' @')) {
      finalType = finalType.replace(/^([A-Za-z0-9]+)/, '$1?');
    } else {
      finalType += '?';
    }
  }

  return finalType;
}

// Mapper un type vers PostgreSQL en fonction d'une définition de colonne
function mapToPostgresType(_columnDef: any): string {
  // Implémentation simplifiée
  return 'TEXT';
}

// Mapper un type vers Prisma en fonction d'une définition de colonne
function mapToPrismaType(_columnDef: any): string {
  // Implémentation simplifiée
  return 'String';
}

// Détecter les patterns problématiques dans une définition de colonne
function detectProblematicPatterns(columnDef: any): { warning?: string; suggestion?: string } {
  const result: { warning?: string; suggestion?: string } = {};

  for (const pattern of problematicPatterns) {
    // Vérifier si le pattern s'applique à cette colonne
    if (pattern.pattern.test(columnDef.mysqlType)) {
      // Vérifier les conditions spéciales
      if (pattern.forPrimaryKey && !columnDef.primaryKey) continue;
      if (pattern.forFinancial && !isLikelyFinancialColumn(columnDef.name)) continue;

      // Ajouter l'avertissement et la suggestion
      result.warning = pattern.warning;
      result.suggestion = pattern.suggestion;
      break;
    }
  }

  return result;
}

// Vérifier si une colonne est probablement financière
function isLikelyFinancialColumn(columnName: string): boolean {
  const financialTerms = [
    'price',
    'amount',
    'cost',
    'fee',
    'tax',
    'salary',
    'budget',
    'balance',
    'payment',
    'total',
  ];
  const lowerName = columnName.toLowerCase();

  return financialTerms.some((term) => lowerName.includes(term));
}

// Générer un fichier de sortie dans le format demandé
async function generateOutput(
  mappingData: TypeMapping,
  outputPath: string,
  format: string
): Promise<void> {
  if (format === 'json') {
    fs.writeFileSync(outputPath, JSON.stringify(mappingData, null, 2));
  } else if (format === 'prisma') {
    const prismaSchema = generatePrismaSchema(mappingData);
    fs.writeFileSync(outputPath, prismaSchema);
  } else if (format === 'markdown') {
    const markdown = generateMarkdownReport(mappingData);
    fs.writeFileSync(outputPath, markdown);
  } else {
    throw new Error(`Format de sortie non pris en charge: ${format}`);
  }
}

// Générer un schéma Prisma à partir des données de mapping
function generatePrismaSchema(mappingData: TypeMapping): string {
  let schema = `// Schéma Prisma généré automatiquement par Type Mapper
// Généré le ${new Date().toISOString()}
// ATTENTION: Ce schéma peut nécessiter des ajustements manuels

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

`;

  // Organiser les colonnes par table
  const tableMap: Record<string, Record<string, MappingEntry>> = {};

  for (const [key, entry] of Object.entries(mappingData)) {
    const [tableName, columnName] = key.split('.');

    if (!tableMap[tableName]) {
      tableMap[tableName] = {};
    }

    tableMap[tableName][columnName] = entry;
  }

  // Générer un modèle Prisma pour chaque table
  for (const [tableName, columns] of Object.entries(tableMap)) {
    // Convertir le nom de table en PascalCase pour le modèle Prisma
    const modelName = tableName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    schema += `model ${modelName} {\n`;

    // Ajouter chaque colonne
    for (const [columnName, entry] of Object.entries(columns)) {
      let line = `  ${columnName} ${entry.prisma}`;

      // Ajouter des commentaires pour les avertissements
      if (entry.warning) {
        line += ` // ${entry.warning}`;
        if (entry.suggestion) {
          line += ` - ${entry.suggestion}`;
        }
      }

      schema += `${line}\n`;
    }

    // Ajouter une relation @@map pour lier au nom de table original
    schema += `\n  @@map("${tableName}")\n`;
    schema += '}\n\n';
  }

  return schema;
}

// Générer un rapport Markdown à partir des données de mapping
function generateMarkdownReport(mappingData: TypeMapping): string {
  let markdown = `# Rapport de Mapping de Types MySQL -> PostgreSQL -> Prisma
  
Généré le ${new Date().toLocaleDateString()}

## Vue d'ensemble

Ce rapport présente le mapping des types de données depuis MySQL vers PostgreSQL et Prisma, 
avec des mises en évidence des patrons problématiques nécessitant une attention particulière.

`;

  // Organiser les colonnes par table
  const tableMap: Record<string, Record<string, MappingEntry>> = {};

  for (const [key, entry] of Object.entries(mappingData)) {
    const [tableName, columnName] = key.split('.');

    if (!tableMap[tableName]) {
      tableMap[tableName] = {};
    }

    tableMap[tableName][columnName] = entry;
  }

  // Ajouter une section pour chaque table
  for (const [tableName, columns] of Object.entries(tableMap)) {
    markdown += `## Table: ${tableName}\n\n`;
    markdown += '| Colonne | Type MySQL | Type PostgreSQL | Type Prisma | Problèmes potentiels |\n';
    markdown += '|---------|------------|-----------------|-------------|---------------------|\n';

    for (const [columnName, entry] of Object.entries(columns)) {
      const issues = entry.warning
        ? `⚠️ ${entry.warning}${entry.suggestion ? `<br />✅ ${entry.suggestion}` : ''}`
        : '';

      markdown += `| ${columnName} | ${entry.mysql} | ${entry.postgres} | ${entry.prisma} | ${issues} |\n`;
    }

    markdown += '\n';
  }

  // Ajouter les statistiques
  const stats = generateStatistics(mappingData);

  markdown += '## Résumé des problèmes détectés\n\n';
  markdown += `- **Tables analysées**: ${stats.tables}\n`;
  markdown += `- **Colonnes analysées**: ${stats.columns}\n`;
  markdown += `- **Avertissements détectés**: ${stats.warnings}\n\n`;

  if (stats.problematicTypes.length > 0) {
    markdown += '### Types problématiques fréquents\n\n';
    for (const typeProblem of stats.problematicByType) {
      markdown += `- **${typeProblem.type}**: ${typeProblem.count} occurrences - ${typeProblem.warning}\n`;
    }
  }

  return markdown;
}

// Générer des statistiques à partir des données de mapping
function generateStatistics(mappingData: TypeMapping): any {
  const tables = new Set();
  let columns = 0;
  let warnings = 0;
  const problematicTypes = new Set<string>();
  const typeWarnings: Record<string, { count: number; warning: string }> = {};

  for (const [key, entry] of Object.entries(mappingData)) {
    const [tableName] = key.split('.');
    tables.add(tableName);
    columns++;

    if (entry.warning) {
      warnings++;

      // Collecter les types problématiques
      const mysqlType = entry.mysql.split('(')[0].trim();
      problematicTypes.add(mysqlType);

      // Compter les occurrences par type et avertissement
      const warningKey = `${mysqlType}:${entry.warning}`;
      if (!typeWarnings[warningKey]) {
        typeWarnings[warningKey] = { count: 0, warning: entry.warning };
      }
      typeWarnings[warningKey].count++;
    }
  }

  // Trier les problèmes par fréquence
  const problematicByType = Object.entries(typeWarnings)
    .map(([key, value]) => ({
      type: key.split(':')[0],
      count: value.count,
      warning: value.warning,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    tables: tables.size,
    columns,
    warnings,
    problematicTypes: Array.from(problematicTypes),
    problematicByType,
  };
}

// Lancer le programme
main();
