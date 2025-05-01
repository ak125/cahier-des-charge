/**
 * mysql-to-pg.ts
 *
 * Agent de conversion des types MySQL vers PostgreSQL pour la migration
 * Analyse les schémas MySQL et génère un mapping automatique vers PostgreSQL
 *
 * Usage: npx ts-node mysql-to-pg.ts --host=localhost --port=3306 --user=root --password=secret --database=mydb --output=./schema_map.json
 */

import * as fs from 'fs';
import { program } from 'commander';
import * as mysql from 'mysql2/promise';

// Types
interface ColumnInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: any;
  Extra: string;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey?: string[];
  uniqueKeys: { name: string; columns: string[] }[];
  foreignKeys: {
    name: string;
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
  }[];
}

interface TypeMapping {
  mysqlType: string;
  postgresType: string;
  rule: string;
  description: string;
}

interface SchemaMap {
  generated: string;
  config: {
    source: {
      host: string;
      database: string;
    };
  };
  tables: {
    [tableName: string]: {
      name: string;
      postgresName: string;
      primaryKey?: string[];
      columns: {
        [columnName: string]: {
          name: string;
          postgresName: string;
          mysqlType: string;
          postgresType: string;
          nullable: boolean;
          defaultValue?: string;
          transformRule?: string;
          comment?: string;
        };
      };
      uniqueConstraints: {
        name: string;
        columns: string[];
      }[];
      foreignKeys: {
        name: string;
        columns: string[];
        referencedTable: string;
        referencedColumns: string[];
      }[];
    };
  };
  typeMappings: TypeMapping[];
  issues: {
    severity: 'info' | 'warning' | 'error';
    table: string;
    column?: string;
    message: string;
    suggestion?: string;
  }[];
}

// Configuration des options en ligne de commande
program
  .version('1.0.0')
  .description('Convertit les types MySQL vers PostgreSQL')
  .option('--host <host>', 'Hôte MySQL', 'localhost')
  .option('--port <port>', 'Port MySQL', '3306')
  .option('--user <user>', 'Utilisateur MySQL', 'root')
  .option('--password <password>', 'Mot de passe MySQL', '')
  .option('--database <database>', 'Base de données MySQL', '')
  .option('--output <path>', 'Fichier de sortie pour le mapping', './schema_map.json')
  .option('--include-tables <list>', 'Liste de tables à inclure (séparées par des espaces)')
  .option('--exclude-tables <list>', 'Liste de tables à exclure (séparées par des espaces)')
  .option('--verbose', 'Afficher des informations détaillées')
  .parse(process.argv);

const options = program.opts();

// Règles de mapping par défaut des types MySQL vers PostgreSQL
const DEFAULT_TYPE_MAPPINGS: TypeMapping[] = [
  {
    mysqlType: 'tinyint\\(1\\)',
    postgresType: 'boolean',
    rule: 'direct',
    description: 'tinyint(1) -> boolean',
  },
  {
    mysqlType: 'tinyint(\\d*)',
    postgresType: 'smallint',
    rule: 'direct',
    description: 'tinyint -> smallint',
  },
  {
    mysqlType: 'tinyint(\\d*) unsigned',
    postgresType: 'smallint',
    rule: 'direct',
    description: 'tinyint unsigned -> smallint',
  },
  {
    mysqlType: 'smallint(\\d*)',
    postgresType: 'smallint',
    rule: 'direct',
    description: 'smallint -> smallint',
  },
  {
    mysqlType: 'smallint(\\d*) unsigned',
    postgresType: 'integer',
    rule: 'direct',
    description: 'smallint unsigned -> integer',
  },
  {
    mysqlType: 'mediumint(\\d*)',
    postgresType: 'integer',
    rule: 'direct',
    description: 'mediumint -> integer',
  },
  {
    mysqlType: 'mediumint(\\d*) unsigned',
    postgresType: 'integer',
    rule: 'direct',
    description: 'mediumint unsigned -> integer',
  },
  {
    mysqlType: 'int(\\d*)',
    postgresType: 'integer',
    rule: 'direct',
    description: 'int -> integer',
  },
  {
    mysqlType: 'int(\\d*) unsigned',
    postgresType: 'bigint',
    rule: 'direct',
    description: 'int unsigned -> bigint',
  },
  {
    mysqlType: 'integer(\\d*)',
    postgresType: 'integer',
    rule: 'direct',
    description: 'integer -> integer',
  },
  {
    mysqlType: 'integer(\\d*) unsigned',
    postgresType: 'bigint',
    rule: 'direct',
    description: 'integer unsigned -> bigint',
  },
  {
    mysqlType: 'bigint(\\d*)',
    postgresType: 'bigint',
    rule: 'direct',
    description: 'bigint -> bigint',
  },
  {
    mysqlType: 'bigint(\\d*) unsigned',
    postgresType: 'numeric(20)',
    rule: 'direct',
    description: 'bigint unsigned -> numeric(20)',
  },
  { mysqlType: 'float', postgresType: 'real', rule: 'direct', description: 'float -> real' },
  {
    mysqlType: 'double',
    postgresType: 'double precision',
    rule: 'direct',
    description: 'double -> double precision',
  },
  {
    mysqlType: 'decimal\\((\\d+),(\\d+)\\)',
    postgresType: 'decimal($1,$2)',
    rule: 'parameterized',
    description: 'decimal(p,s) -> decimal(p,s)',
  },
  {
    mysqlType: 'decimal\\((\\d+)\\)',
    postgresType: 'decimal($1,0)',
    rule: 'parameterized',
    description: 'decimal(p) -> decimal(p,0)',
  },
  {
    mysqlType: 'numeric\\((\\d+),(\\d+)\\)',
    postgresType: 'numeric($1,$2)',
    rule: 'parameterized',
    description: 'numeric(p,s) -> numeric(p,s)',
  },
  {
    mysqlType: 'numeric\\((\\d+)\\)',
    postgresType: 'numeric($1,0)',
    rule: 'parameterized',
    description: 'numeric(p) -> numeric(p,0)',
  },
  { mysqlType: 'date', postgresType: 'date', rule: 'direct', description: 'date -> date' },
  { mysqlType: 'time', postgresType: 'time', rule: 'direct', description: 'time -> time' },
  {
    mysqlType: 'datetime',
    postgresType: 'timestamp',
    rule: 'direct',
    description: 'datetime -> timestamp',
  },
  {
    mysqlType: 'timestamp',
    postgresType: 'timestamp',
    rule: 'direct',
    description: 'timestamp -> timestamp',
  },
  { mysqlType: 'year', postgresType: 'smallint', rule: 'direct', description: 'year -> smallint' },
  {
    mysqlType: 'char\\((\\d+)\\)',
    postgresType: 'char($1)',
    rule: 'parameterized',
    description: 'char(n) -> char(n)',
  },
  {
    mysqlType: 'varchar\\((\\d+)\\)',
    postgresType: 'varchar($1)',
    rule: 'parameterized',
    description: 'varchar(n) -> varchar(n)',
  },
  { mysqlType: 'tinytext', postgresType: 'text', rule: 'direct', description: 'tinytext -> text' },
  { mysqlType: 'text', postgresType: 'text', rule: 'direct', description: 'text -> text' },
  {
    mysqlType: 'mediumtext',
    postgresType: 'text',
    rule: 'direct',
    description: 'mediumtext -> text',
  },
  { mysqlType: 'longtext', postgresType: 'text', rule: 'direct', description: 'longtext -> text' },
  {
    mysqlType: 'binary\\((\\d+)\\)',
    postgresType: 'bytea',
    rule: 'direct',
    description: 'binary(n) -> bytea',
  },
  {
    mysqlType: 'varbinary\\((\\d+)\\)',
    postgresType: 'bytea',
    rule: 'direct',
    description: 'varbinary(n) -> bytea',
  },
  {
    mysqlType: 'tinyblob',
    postgresType: 'bytea',
    rule: 'direct',
    description: 'tinyblob -> bytea',
  },
  { mysqlType: 'blob', postgresType: 'bytea', rule: 'direct', description: 'blob -> bytea' },
  {
    mysqlType: 'mediumblob',
    postgresType: 'bytea',
    rule: 'direct',
    description: 'mediumblob -> bytea',
  },
  {
    mysqlType: 'longblob',
    postgresType: 'bytea',
    rule: 'direct',
    description: 'longblob -> bytea',
  },
  {
    mysqlType: 'enum\\((.+)\\)',
    postgresType: 'text CHECK (column_name IN ($1))',
    rule: 'enum_to_check',
    description: 'enum -> text avec CHECK',
  },
  {
    mysqlType: 'set\\((.+)\\)',
    postgresType: 'text[]',
    rule: 'set_to_array',
    description: 'set -> text[]',
  },
  { mysqlType: 'json', postgresType: 'jsonb', rule: 'direct', description: 'json -> jsonb' },
  {
    mysqlType: 'bit\\((\\d+)\\)',
    postgresType: 'bit($1)',
    rule: 'parameterized',
    description: 'bit(n) -> bit(n)',
  },
  {
    mysqlType: 'geometry',
    postgresType: 'geometry',
    rule: 'direct',
    description: 'geometry -> geometry (requires PostGIS)',
  },
  { mysqlType: 'point', postgresType: 'point', rule: 'direct', description: 'point -> point' },
  {
    mysqlType: 'linestring',
    postgresType: 'path',
    rule: 'direct',
    description: 'linestring -> path',
  },
  {
    mysqlType: 'polygon',
    postgresType: 'polygon',
    rule: 'direct',
    description: 'polygon -> polygon',
  },
  {
    mysqlType: 'multipoint',
    postgresType: 'point[]',
    rule: 'direct',
    description: 'multipoint -> point[]',
  },
  {
    mysqlType: 'multilinestring',
    postgresType: 'path[]',
    rule: 'direct',
    description: 'multilinestring -> path[]',
  },
  {
    mysqlType: 'multipolygon',
    postgresType: 'polygon[]',
    rule: 'direct',
    description: 'multipolygon -> polygon[]',
  },
  {
    mysqlType: 'geometrycollection',
    postgresType: 'geometry',
    rule: 'direct',
    description: 'geometrycollection -> geometry (requires PostGIS)',
  },
  {
    mysqlType: '.*',
    postgresType: 'text',
    rule: 'fallback',
    description: 'type inconnu -> text (fallback)',
  },
];

// Fonction principale
async function main() {
  console.log('🚀 Démarrage de la conversion des types MySQL vers PostgreSQL');

  try {
    // Extraire les options de ligne de commande
    const host = options.host;
    const port = parseInt(options.port);
    const user = options.user;
    const password = options.password;
    const database = options.database;
    const outputPath = options.output;
    const verbose = options.verbose;

    if (!database) {
      throw new Error('Vous devez spécifier une base de données');
    }

    console.log(`🔌 Connexion à MySQL: ${host}:${port}/${database}`);

    // Créer la connexion MySQL
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true,
    });

    // Initialiser le mapping de schéma
    const schemaMap: SchemaMap = {
      generated: new Date().toISOString(),
      config: {
        source: {
          host,
          database,
        },
      },
      tables: {},
      typeMappings: DEFAULT_TYPE_MAPPINGS,
      issues: [],
    };

    // Récupérer les tables à inclure/exclure
    let includeTables: string[] = [];
    let excludeTables: string[] = [];

    if (options.includeTables) {
      includeTables = options.includeTables.split(' ').filter((t) => t.trim());
      console.log(`📋 Tables à inclure: ${includeTables.join(', ')}`);
    }

    if (options.excludeTables) {
      excludeTables = options.excludeTables.split(' ').filter((t) => t.trim());
      console.log(`🚫 Tables à exclure: ${excludeTables.join(', ')}`);
    }

    // Récupérer la liste des tables
    const [tablesResult] = await connection.query('SHOW TABLES');
    const allTables = (tablesResult as any[]).map((row) => Object.values(row)[0] as string);

    // Filtrer les tables selon les options d'inclusion/exclusion
    const tables = allTables.filter((table) => {
      if (includeTables.length > 0 && !includeTables.includes(table)) {
        return false;
      }
      if (excludeTables.length > 0 && excludeTables.includes(table)) {
        return false;
      }
      return true;
    });

    console.log(`📊 ${tables.length} tables trouvées`);

    // Analyser chaque table
    for (const tableName of tables) {
      if (verbose) {
        console.log(`🔍 Analyse de la table ${tableName}...`);
      }

      const tableInfo = await analyzeTable(connection, tableName);

      // Créer le mapping pour cette table
      schemaMap.tables[tableName] = {
        name: tableName,
        postgresName: tableName.toLowerCase(),
        primaryKey: tableInfo.primaryKey,
        columns: {},
        uniqueConstraints: tableInfo.uniqueKeys,
        foreignKeys: tableInfo.foreignKeys,
      };

      // Traiter chaque colonne
      for (const column of tableInfo.columns) {
        // Déterminer le type PostgreSQL correspondant
        const { postgresType, transformRule, issue } = mapMySQLTypeToPostgreSQL(
          column.Type,
          column.Field
        );

        // Ajouter la colonne au mapping
        schemaMap.tables[tableName].columns[column.Field] = {
          name: column.Field,
          postgresName: column.Field.toLowerCase(),
          mysqlType: column.Type,
          postgresType,
          nullable: column.Null === 'YES',
          defaultValue: column.Default !== null ? String(column.Default) : undefined,
          transformRule,
        };

        // Enregistrer les éventuels problèmes
        if (issue) {
          schemaMap.issues.push({
            severity: issue.severity,
            table: tableName,
            column: column.Field,
            message: issue.message,
            suggestion: issue.suggestion,
          });
        }

        // Vérifier les colonnes AUTO_INCREMENT
        if (column.Extra.includes('auto_increment')) {
          schemaMap.tables[tableName].columns[column.Field].postgresType = column.Type.includes(
            'bigint'
          )
            ? 'BIGSERIAL'
            : 'SERIAL';

          schemaMap.tables[tableName].columns[column.Field].transformRule =
            'auto_increment_to_serial';
        }
      }
    }

    // Fermer la connexion MySQL
    await connection.end();

    // Écrire le mapping dans un fichier JSON
    fs.writeFileSync(outputPath, JSON.stringify(schemaMap, null, 2));

    console.log(`✅ Mapping généré avec succès: ${outputPath}`);
    console.log(`📊 ${Object.keys(schemaMap.tables).length} tables mappées`);
    console.log(`⚠️ ${schemaMap.issues.length} problèmes détectés`);

    // Afficher les problèmes si demandé
    if (verbose && schemaMap.issues.length > 0) {
      console.log('\nProblèmes détectés:');

      for (const issue of schemaMap.issues) {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(
          `${icon} [${issue.table}${issue.column ? `.${issue.column}` : ''}] ${issue.message}`
        );
        if (issue.suggestion) {
          console.log(`   Suggestion: ${issue.suggestion}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Analyse une table MySQL et retourne ses informations de structure
 */
async function analyzeTable(connection: mysql.Connection, tableName: string): Promise<TableInfo> {
  // Récupérer les informations des colonnes
  const [columnsResult] = await connection.query(`DESCRIBE \`${tableName}\``);
  const columns = columnsResult as ColumnInfo[];

  // Récupérer la clé primaire
  const primaryKeyColumns = columns.filter((col) => col.Key === 'PRI').map((col) => col.Field);

  // Récupérer les clés uniques
  const [uniqueKeysResult] = await connection.query(
    `
    SELECT 
      INDEX_NAME as name,
      COLUMN_NAME as column_name
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND NON_UNIQUE = 0
      AND INDEX_NAME != 'PRIMARY'
    ORDER BY INDEX_NAME, SEQ_IN_INDEX
  `,
    [tableName]
  );

  // Regrouper les colonnes par nom d'index
  const uniqueKeyMap = {};
  for (const row of uniqueKeysResult as any[]) {
    const name = row.name;
    const column = row.column_name;

    if (!uniqueKeyMap[name]) {
      uniqueKeyMap[name] = { name, columns: [] };
    }

    uniqueKeyMap[name].columns.push(column);
  }

  const uniqueKeys = Object.values(uniqueKeyMap);

  // Récupérer les clés étrangères
  const [foreignKeysResult] = await connection.query(
    `
    SELECT 
      CONSTRAINT_NAME as name,
      COLUMN_NAME as column_name,
      REFERENCED_TABLE_NAME as referenced_table,
      REFERENCED_COLUMN_NAME as referenced_column
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION
  `,
    [tableName]
  );

  // Regrouper les colonnes par nom de contrainte
  const foreignKeyMap = {};
  for (const row of foreignKeysResult as any[]) {
    const name = row.name;
    const column = row.column_name;
    const referencedTable = row.referenced_table;
    const referencedColumn = row.referenced_column;

    if (!foreignKeyMap[name]) {
      foreignKeyMap[name] = {
        name,
        columns: [],
        referencedTable,
        referencedColumns: [],
      };
    }

    foreignKeyMap[name].columns.push(column);
    foreignKeyMap[name].referencedColumns.push(referencedColumn);
  }

  const foreignKeys = Object.values(foreignKeyMap);

  return {
    name: tableName,
    columns,
    primaryKey: primaryKeyColumns.length > 0 ? primaryKeyColumns : undefined,
    uniqueKeys,
    foreignKeys,
  };
}

/**
 * Mappe un type MySQL vers un type PostgreSQL équivalent
 */
function mapMySQLTypeToPostgreSQL(
  mysqlType: string,
  columnName: string
): {
  postgresType: string;
  transformRule?: string;
  issue?: {
    severity: 'info' | 'warning' | 'error';
    message: string;
    suggestion?: string;
  };
} {
  // Nettoyer le type MySQL
  const cleanMySQLType = mysqlType.trim().toLowerCase();

  // Parcourir les règles de mapping
  for (const mapping of DEFAULT_TYPE_MAPPINGS) {
    const regex = new RegExp(`^${mapping.mysqlType}$`, 'i');
    const match = cleanMySQLType.match(regex);

    if (match) {
      // Type trouvé dans les mappings
      let postgresType = mapping.postgresType;
      let transformRule;
      let issue;

      // Traitement spécial pour les types paramétrés
      if (mapping.rule === 'parameterized' && match.length > 1) {
        // Remplacer les placeholders $1, $2, etc. par les valeurs capturées
        for (let i = 1; i < match.length; i++) {
          postgresType = postgresType.replace(`$${i}`, match[i]);
        }
      }

      // Traitement spécial pour les ENUMs
      else if (mapping.rule === 'enum_to_check' && match.length > 1) {
        // Extraire les valeurs d'enum
        const enumValues = match[1]
          .split(',')
          .map((val) => val.trim().replace(/^'|'$/g, ''))
          .map((val) => `'${val}'`)
          .join(', ');

        postgresType = `text CHECK (${columnName} IN (${enumValues}))`;
        transformRule = 'enum_to_check';

        issue = {
          severity: 'warning',
          message: `ENUM converti en TEXT avec contrainte CHECK`,
          suggestion: `Considérer l'utilisation d'un type ENUM personnalisé en PostgreSQL`,
        };
      }

      // Traitement spécial pour les SETs
      else if (mapping.rule === 'set_to_array' && match.length > 1) {
        transformRule = 'set_to_array';

        issue = {
          severity: 'warning',
          message: `SET converti en tableau TEXT[]`,
          suggestion: `Des adaptations d'application peuvent être nécessaires pour gérer les tableaux`,
        };
      }

      // Si c'est le fallback (type inconnu)
      else if (mapping.rule === 'fallback') {
        issue = {
          severity: 'error',
          message: `Type MySQL non reconnu: ${cleanMySQLType}`,
          suggestion: `Converti en TEXT par défaut, vérifier manuellement`,
        };
      }

      return { postgresType, transformRule, issue };
    }
  }

  // Si aucun mapping n'est trouvé, utiliser text par défaut
  return {
    postgresType: 'text',
    issue: {
      severity: 'error',
      message: `Type MySQL non reconnu: ${cleanMySQLType}`,
      suggestion: `Converti en TEXT par défaut, vérifier manuellement`,
    },
  };
}

// Exécuter la fonction principale
main().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
