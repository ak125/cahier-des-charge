#!/usr/bin/env node
/**
 * export-csv.ts
 *
 * Script d'export CSV automatisé pour la migration MySQL → Supabase
 * Exporte les données des tables MySQL vers des fichiers CSV avec gestion des types
 *
 * Usage: npx ts-node export-csv.ts --config=./migration-config.json --output=./exports --tables="users products orders"
 */

import * as dotenv from 'dotenvstructure-agent';
import * as csv from 'fast-csvstructure-agent';
import * as fs from 'fsstructure-agent';
import * as mysql from 'mysql2/promisestructure-agent';
import * as path from 'pathstructure-agent';
import { program } from './commanderstructure-agent';

// Types
interface Config {
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  supabase: {
    url: string;
    key: string;
    db_host: string;
    db_port: number;
    db_user: string;
    db_password: string;
    db_name: string;
  };
  options: {
    batchSize: number;
    timezone: string;
    includeDeleted: boolean;
    dateFormat: string;
    exportNull: string;
    encodingOptions: any;
  };
  tables: Record<
    string,
    {
      include: boolean;
      keyColumn: string;
      skipColumns: string[];
      transformations: Record<string, string>;
    }
  >;
}

interface ColumnInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: any;
  Extra: string;
}

interface TableCount {
  tableName: string;
  rowCount: number;
  exportedCount: number;
  errors: number;
}

// Configuration du programme
program
  .version('1.0.0')
  .description('Exporte des tables MySQL vers des fichiers CSV')
  .requiredOption('--config <path>', 'Chemin vers le fichier de configuration')
  .option('--output <dir>', 'Répertoire de sortie pour les fichiers CSV', './exports')
  .option('--tables <list>', 'Liste des tables à exporter, séparées par des espaces')
  .option('--delimiter <char>', 'Délimiteur CSV', ',')
  .option('--include-headers', 'Inclure les noms de colonnes en première ligne', true)
  .option('--batch-size <size>', 'Nombre de lignes à traiter par lot', '1000')
  .option('--verbose', "Afficher des informations détaillées pendant l'export")
  .parse(process.argv);

const options = program.opts();

// Fonction principale
async function main() {
  try {
    console.log("🚀 Démarrage de l'export CSV des tables MySQL");

    // Charger les variables d'environnement
    dotenv.config();

    // Charger la configuration
    const configPath = options.config;
    console.log(`📄 Lecture de la configuration depuis ${configPath}`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Le fichier de configuration n'existe pas: ${configPath}`);
    }

    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = options.output;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Création du répertoire de sortie: ${outputDir}`);
    }

    // Récupérer les informations de connexion MySQL
    const mysqlConfig = {
      host: config.mysql.host || process.env.MYSQL_HOST || 'localhost',
      port: config.mysql.port || parseInt(process.env.MYSQL_PORT || '3306'),
      user: config.mysql.user || process.env.MYSQL_USER || 'root',
      password: config.mysql.password || process.env.MYSQL_PASSWORD || '',
      database: config.mysql.database || process.env.MYSQL_DATABASE || '',
      timezone: config.options?.timezone || '+00:00',
      multipleStatements: true,
    };

    console.log(
      `🔌 Connexion à MySQL: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`
    );

    // Créer la connexion MySQL
    const connection = await mysql.createConnection(mysqlConfig);

    // Déterminer les tables à exporter
    let tablesToExport: string[] = [];

    if (options.tables) {
      tablesToExport = options.tables.split(' ').filter((t) => t.trim());
      console.log(`📋 Tables spécifiées en ligne de commande: ${tablesToExport.join(', ')}`);
    } else if (config.tables) {
      tablesToExport = Object.keys(config.tables).filter((t) => config.tables[t].include !== false);
      console.log(
        `📋 Tables spécifiées dans le fichier de configuration: ${tablesToExport.join(', ')}`
      );
    } else {
      // Récupérer toutes les tables de la base de données
      const [rows] = await connection.query('SHOW TABLES');
      tablesToExport = (rows as any[]).map((row) => Object.values(row)[0] as string);
      console.log(`📋 Toutes les tables détectées: ${tablesToExport.join(', ')}`);
    }

    if (tablesToExport.length === 0) {
      throw new Error('Aucune table à exporter');
    }

    // Statistiques d'export
    const stats: TableCount[] = [];

    // Exporter chaque table
    for (const tableName of tablesToExport) {
      const tableConfig = config.tables?.[tableName] || {};
      const skipColumns = tableConfig.skipColumns || [];

      console.log(`\n🔄 Export de la table: ${tableName}`);

      // Récupérer les informations sur les colonnes
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
      const columnInfos = columns as ColumnInfo[];

      // Filtrer les colonnes à exclure
      const includedColumns = columnInfos
        .filter((col) => !skipColumns.includes(col.Field))
        .map((col) => col.Field);

      // Compter le nombre total de lignes
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );
      const totalRows = (countResult as any[])[0].count;
      console.log(`📊 Nombre total de lignes: ${totalRows}`);

      // Créer le flux d'écriture CSV
      const csvFilePath = path.join(outputDir, `${tableName}.csv`);
      const csvStream = csv.format({
        headers: options.includeHeaders,
        delimiter: options.delimiter,
      });
      const writeStream = fs.createWriteStream(csvFilePath);

      // Pipe vers le fichier
      csvStream.pipe(writeStream);

      // Si on inclut les en-têtes, on les ajoute
      if (options.includeHeaders) {
        csvStream.write(includedColumns);
      }

      // Variables pour le batch processing
      const batchSize = parseInt(options.batchSize) || 1000;
      let offset = 0;
      let exportedCount = 0;
      let errorCount = 0;

      // Exporter les données par lots
      while (true) {
        try {
          const query = `SELECT ${includedColumns.map((col) => `\`${col}\``).join(', ')} 
                        FROM \`${tableName}\` 
                        LIMIT ${offset}, ${batchSize}`;

          const [rows] = await connection.query(query);
          const rowsArray = rows as any[];

          if (rowsArray.length === 0) {
            break; // Plus de données à exporter
          }

          // Transformer et exporter chaque ligne
          for (const row of rowsArray) {
            try {
              // Appliquer les transformations spécifiques à cette table
              const transformedRow = transformRow(row, tableConfig.transformations || {});

              // Écrire la ligne dans le CSV
              csvStream.write(transformedRow);
              exportedCount++;
            } catch (err) {
              console.error(`Erreur lors de la transformation d'une ligne: ${err}`);
              errorCount++;
            }
          }

          // Mettre à jour l'offset pour le prochain lot
          offset += rowsArray.length;
          console.log(
            `🔄 Exportation en cours: ${Math.min(offset, totalRows)}/${totalRows} lignes`
          );
        } catch (err) {
          console.error(
            `Erreur lors de l'exportation du lot à partir de l'offset ${offset}: ${err}`
          );
          errorCount++;
          // Continuer avec le prochain lot
          offset += batchSize;
        }
      }

      // Fermer le flux CSV
      csvStream.end();

      // Attendre que l'écriture soit terminée
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => {
          console.log(
            `✅ Export terminé pour la table ${tableName}: ${exportedCount} lignes exportées, ${errorCount} erreurs`
          );
          stats.push({
            tableName,
            rowCount: totalRows,
            exportedCount,
            errors: errorCount,
          });
          resolve();
        });
        writeStream.on('error', reject);
      });
    }

    // Fermer la connexion MySQL
    await connection.end();

    // Générer un rapport d'export
    const reportPath = path.join(outputDir, '_export_report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          config: {
            mysql: {
              host: mysqlConfig.host,
              database: mysqlConfig.database,
            },
          },
          stats,
          totalExported: stats.reduce((sum, stat) => sum + stat.exportedCount, 0),
          totalErrors: stats.reduce((sum, stat) => sum + stat.errors, 0),
        },
        null,
        2
      )
    );

    console.log(`\n📊 Rapport d'export généré: ${reportPath}`);

    // Afficher un résumé
    console.log('\n✅ Export CSV terminé');
    console.log('📊 Résumé:');
    for (const stat of stats) {
      console.log(
        `   ${stat.tableName}: ${stat.exportedCount}/${stat.rowCount} lignes exportées, ${stat.errors} erreurs`
      );
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'export: ${error}`);
    process.exit(1);
  }
}

/**
 * Transforme une ligne de données en fonction des règles de transformation
 */
function transformRow(row: any, transformations: Record<string, string>): any {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    if (key in transformations) {
      // Appliquer une transformation spécifique
      const transform = transformations[key];

      if (transform === 'json_stringify' && value !== null) {
        result[key] = JSON.stringify(value);
      } else if (transform === 'boolean' && value !== null) {
        result[key] = value ? 'true' : 'false';
      } else if (transform === 'date_iso' && value instanceof Date) {
        result[key] = value.toISOString();
      } else if (transform === 'null_to_empty' && value === null) {
        result[key] = '';
      } else if (transform.startsWith('default:') && value === null) {
        result[key] = transform.substring(8);
      } else {
        // Transformation non reconnue ou valeur null, on garde la valeur d'origine
        result[key] = value;
      }
    } else {
      // Pas de transformation, on garde la valeur d'origine
      result[key] = value;
    }

    // Gestion spéciale des valeurs null
    if (result[key] === null) {
      result[key] = ''; // Ou une autre valeur par défaut
    }
  }

  return result;
}

// Exécuter la fonction principale
main().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
