/**
 * data-verifier.ts
 * 
 * Agent de vérification automatique pour valider la migration MySQL → Supabase
 * Compare les données entre les deux bases et génère un rapport détaillé des différences
 * 
 * Usage: npx ts-node data-verifier.ts --config=./migration-config.json --tables="users products" --output=./report.json
 */

import * as fs from 'fs';
import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { program } from 'commander';
import * as crypto from 'crypto';

// Configuration des options en ligne de commande
program
  .version('1.0.0')
  .description('Vérifie l\'intégrité des données après migration MySQL → Supabase')
  .requiredOption('--config <path>', 'Chemin vers le fichier de configuration')
  .option('--output <path>', 'Chemin du fichier de rapport de sortie', './migration_report.json')
  .option('--tables <list>', 'Liste des tables à vérifier, séparées par des espaces')
  .option('--sample-size <size>', 'Nombre d\'enregistrements à vérifier par table (0 = tous)', '1000')
  .option('--check-count-only', 'Vérifier uniquement le nombre d\'enregistrements', false)
  .option('--verbose', 'Afficher des informations détaillées')
  .parse(process.argv);

const options = program.opts();

// Types pour les configurations et résultats
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
  tables: Record<string, {
    keyColumn: string;
    skipValidation?: boolean;
    skipColumns?: string[];
    importantColumns?: string[];
  }>;
}

interface TableVerificationResult {
  tableName: string;
  status: 'success' | 'warning' | 'error';
  mysqlCount: number;
  postgresCount: number;
  countMatch: boolean;
  sampleSize: number;
  mismatchedRecords: number;
  mismatchDetails: MismatchDetail[];
  verificationTime: number;
}

interface MismatchDetail {
  key: string | number;
  keyColumn: string;
  mismatches: {
    column: string;
    mysqlValue: any;
    postgresValue: any;
  }[];
}

interface VerificationReport {
  timestamp: string;
  config: {
    mysql: {
      host: string;
      database: string;
    };
    postgres: {
      host: string;
      database: string;
    };
  };
  summary: {
    tablesChecked: number;
    tablesMatched: number;
    tablesWithCountMismatch: number;
    tablesWithDataMismatch: number;
    recordsChecked: number;
    mismatchedRecords: number;
  };
  tableResults: TableVerificationResult[];
  problems: {
    severity: 'warning' | 'error';
    tableName: string;
    message: string;
    details?: any;
  }[];
  executionTimeMs: number;
}

// Fonction principale
async function main() {
  console.log('🔍 Démarrage de la vérification des données MySQL → Supabase');
  
  const startTime = Date.now();
  
  try {
    // Charger la configuration
    const configPath = options.config;
    console.log(`📄 Lecture de la configuration depuis ${configPath}`);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Le fichier de configuration n'existe pas: ${configPath}`);
    }
    
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Initialiser le rapport
    const report: VerificationReport = {
      timestamp: new Date().toISOString(),
      config: {
        mysql: {
          host: config.mysql.host,
          database: config.mysql.database
        },
        postgres: {
          host: config.supabase.db_host,
          database: config.supabase.db_name
        }
      },
      summary: {
        tablesChecked: 0,
        tablesMatched: 0,
        tablesWithCountMismatch: 0,
        tablesWithDataMismatch: 0,
        recordsChecked: 0,
        mismatchedRecords: 0
      },
      tableResults: [],
      problems: [],
      executionTimeMs: 0
    };
    
    // Créer les connexions aux bases de données
    const mysqlConnection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database
    });
    
    const pgPool = new Pool({
      host: config.supabase.db_host,
      port: config.supabase.db_port,
      user: config.supabase.db_user,
      password: config.supabase.db_password,
      database: config.supabase.db_name,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log(`🔌 Connexions établies avec MySQL et PostgreSQL (Supabase)`);
    
    // Déterminer les tables à vérifier
    let tablesToVerify: string[] = [];
    
    if (options.tables) {
      tablesToVerify = options.tables.split(' ').filter(t => t.trim());
      console.log(`📋 Tables spécifiées en ligne de commande: ${tablesToVerify.join(', ')}`);
    } else if (config.tables) {
      tablesToVerify = Object.keys(config.tables).filter(t => !config.tables[t].skipValidation);
      console.log(`📋 Tables spécifiées dans le fichier de configuration: ${tablesToVerify.join(', ')}`);
    } else {
      // Récupérer toutes les tables de la base de données MySQL
      const [rows] = await mysqlConnection.query('SHOW TABLES');
      tablesToVerify = (rows as any[]).map(row => Object.values(row)[0] as string);
      console.log(`📋 Toutes les tables détectées: ${tablesToVerify.join(', ')}`);
    }
    
    if (tablesToVerify.length === 0) {
      throw new Error('Aucune table à vérifier');
    }
    
    // Vérifier chaque table
    for (const tableName of tablesToVerify) {
      console.log(`\n🔄 Vérification de la table: ${tableName}`);
      
      const tableStartTime = Date.now();
      const tableConfig = config.tables?.[tableName] || {};
      const skipColumns = tableConfig.skipColumns || [];
      const keyColumn = tableConfig.keyColumn || 'id';
      const importantColumns = tableConfig.importantColumns || [];
      
      // Résultat initial pour cette table
      const tableResult: TableVerificationResult = {
        tableName,
        status: 'success',
        mysqlCount: 0,
        postgresCount: 0,
        countMatch: false,
        sampleSize: 0,
        mismatchedRecords: 0,
        mismatchDetails: [],
        verificationTime: 0
      };
      
      try {
        // 1. Vérifier le nombre d'enregistrements dans les deux bases
        console.log(`🔢 Vérification du nombre d'enregistrements...`);
        
        const [mysqlCountResult] = await mysqlConnection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const mysqlCount = (mysqlCountResult as any[])[0].count;
        
        const pgCountResult = await pgPool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const postgresCount = parseInt(pgCountResult.rows[0].count);
        
        tableResult.mysqlCount = mysqlCount;
        tableResult.postgresCount = postgresCount;
        tableResult.countMatch = mysqlCount === postgresCount;
        
        console.log(`📊 MySQL: ${mysqlCount} enregistrements, PostgreSQL: ${postgresCount} enregistrements`);
        
        if (!tableResult.countMatch) {
          console.log(`⚠️ Différence dans le nombre d'enregistrements: ${Math.abs(mysqlCount - postgresCount)}`);
          tableResult.status = 'warning';
          report.summary.tablesWithCountMismatch++;
          
          report.problems.push({
            severity: 'warning',
            tableName,
            message: `Différence dans le nombre d'enregistrements: MySQL=${mysqlCount}, PostgreSQL=${postgresCount}`,
            details: {
              difference: mysqlCount - postgresCount,
              percentageDifference: (Math.abs(mysqlCount - postgresCount) / Math.max(mysqlCount, 1)) * 100
            }
          });
        }
        
        // Si on vérifie uniquement le nombre d'enregistrements, on s'arrête là
        if (options.checkCountOnly) {
          console.log(`✅ Vérification des comptages terminée pour ${tableName}`);
          continue;
        }
        
        // 2. Récupérer les colonnes des tables
        const [mysqlColumns] = await mysqlConnection.query(`DESCRIBE \`${tableName}\``);
        const pgColumnsResult = await pgPool.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        // Extraire les noms de colonnes valides (présentes dans les deux tables et non exclues)
        const mysqlColumnNames = (mysqlColumns as any[]).map(col => col.Field);
        const pgColumnNames = pgColumnsResult.rows.map(col => col.column_name);
        
        const commonColumns = mysqlColumnNames
          .filter(col => pgColumnNames.includes(col) && !skipColumns.includes(col));
        
        if (commonColumns.length === 0) {
          console.warn(`⚠️ Aucune colonne commune trouvée pour la table ${tableName}`);
          tableResult.status = 'error';
          report.problems.push({
            severity: 'error',
            tableName,
            message: 'Aucune colonne commune trouvée entre MySQL et PostgreSQL'
          });
          continue;
        }
        
        // 3. Déterminer la taille de l'échantillon
        const sampleSize = options.sampleSize ? parseInt(options.sampleSize) : 1000;
        tableResult.sampleSize = sampleSize === 0 ? mysqlCount : Math.min(sampleSize, mysqlCount);
        
        // 4. Récupérer les données à vérifier
        console.log(`🔍 Vérification des données (échantillon de ${tableResult.sampleSize} enregistrements)...`);
        
        const sampleQuery = sampleSize === 0
          ? `SELECT ${commonColumns.map(col => `\`${col}\``).join(', ')} FROM \`${tableName}\``
          : `SELECT ${commonColumns.map(col => `\`${col}\``).join(', ')} FROM \`${tableName}\` LIMIT ${sampleSize}`;
        
        const [mysqlRecords] = await mysqlConnection.query(sampleQuery);
        
        // 5. Vérifier chaque enregistrement
        let checkedCount = 0;
        
        for (const mysqlRecord of (mysqlRecords as any[])) {
          checkedCount++;
          if (options.verbose && checkedCount % 100 === 0) {
            console.log(`  Progression: ${checkedCount}/${tableResult.sampleSize} enregistrements vérifiés`);
          }
          
          // Récupérer la valeur de la clé primaire
          const keyValue = mysqlRecord[keyColumn];
          if (keyValue === undefined) {
            console.warn(`⚠️ Colonne clé "${keyColumn}" introuvable dans l'enregistrement MySQL`);
            continue;
          }
          
          // Récupérer l'enregistrement correspondant dans PostgreSQL
          const pgRecordResult = await pgPool.query(
            `SELECT ${commonColumns.map(col => `"${col}"`).join(', ')} FROM "${tableName}" WHERE "${keyColumn}" = $1 LIMIT 1`,
            [keyValue]
          );
          
          if (pgRecordResult.rows.length === 0) {
            // Enregistrement non trouvé dans PostgreSQL
            tableResult.mismatchedRecords++;
            tableResult.mismatchDetails.push({
              key: keyValue,
              keyColumn,
              mismatches: [{
                column: '_entire_record_',
                mysqlValue: 'exists',
                postgresValue: 'missing'
              }]
            });
            
            // Limiter le nombre de détails pour éviter les rapports trop volumineux
            if (tableResult.mismatchDetails.length >= 100) {
              console.warn(`⚠️ Trop de différences trouvées, arrêt de la collecte des détails`);
              break;
            }
            
            continue;
          }
          
          const pgRecord = pgRecordResult.rows[0];
          
          // Comparer les valeurs des colonnes
          const columnMismatches = [];
          
          for (const column of commonColumns) {
            let mysqlValue = mysqlRecord[column];
            let pgValue = pgRecord[column];
            
            // Normaliser les valeurs pour la comparaison
            [mysqlValue, pgValue] = normalizeValues(mysqlValue, pgValue);
            
            if (!compareValues(mysqlValue, pgValue)) {
              columnMismatches.push({
                column,
                mysqlValue,
                postgresValue: pgValue
              });
            }
          }
          
          if (columnMismatches.length > 0) {
            tableResult.mismatchedRecords++;
            
            // Ne conserver que les différences sur les colonnes importantes si spécifiées
            const filteredMismatches = importantColumns.length > 0
              ? columnMismatches.filter(m => importantColumns.includes(m.column))
              : columnMismatches;
            
            if (filteredMismatches.length > 0) {
              tableResult.mismatchDetails.push({
                key: keyValue,
                keyColumn,
                mismatches: filteredMismatches
              });
              
              // Limiter le nombre de détails
              if (tableResult.mismatchDetails.length >= 100) {
                console.warn(`⚠️ Trop de différences trouvées, arrêt de la collecte des détails`);
                break;
              }
            }
          }
          
          // Mise à jour des statistiques
          report.summary.recordsChecked++;
        }
        
        // Finaliser le résultat de la table
        if (tableResult.mismatchedRecords > 0) {
          const mismatchPercentage = (tableResult.mismatchedRecords / checkedCount) * 100;
          console.log(`⚠️ ${tableResult.mismatchedRecords} enregistrements (${mismatchPercentage.toFixed(2)}%) présentent des différences`);
          
          if (mismatchPercentage > 5) {
            tableResult.status = 'error';
            report.summary.tablesWithDataMismatch++;
            
            report.problems.push({
              severity: 'error',
              tableName,
              message: `${tableResult.mismatchedRecords} enregistrements (${mismatchPercentage.toFixed(2)}%) présentent des différences`,
              details: {
                mismatchedRecords: tableResult.mismatchedRecords,
                checkedRecords: checkedCount,
                mismatchPercentage
              }
            });
          } else {
            tableResult.status = 'warning';
            report.problems.push({
              severity: 'warning',
              tableName,
              message: `Différences mineures: ${tableResult.mismatchedRecords} enregistrements (${mismatchPercentage.toFixed(2)}%)`,
              details: {
                mismatchedRecords: tableResult.mismatchedRecords,
                checkedRecords: checkedCount,
                mismatchPercentage
              }
            });
          }
          
          report.summary.mismatchedRecords += tableResult.mismatchedRecords;
        } else {
          console.log(`✅ Aucune différence trouvée pour ${checkedCount} enregistrements vérifiés`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la vérification de la table ${tableName}: ${error}`);
        tableResult.status = 'error';
        
        report.problems.push({
          severity: 'error',
          tableName,
          message: `Erreur lors de la vérification: ${error.message}`
        });
      }
      
      // Calculer le temps d'exécution pour cette table
      tableResult.verificationTime = Date.now() - tableStartTime;
      report.tableResults.push(tableResult);
      
      // Mise à jour des statistiques générales
      report.summary.tablesChecked++;
      if (tableResult.status === 'success') {
        report.summary.tablesMatched++;
      }
      
      console.log(`✅ Vérification de la table ${tableName} terminée en ${tableResult.verificationTime / 1000} secondes`);
    }
    
    // Fermer les connexions
    await mysqlConnection.end();
    await pgPool.end();
    
    // Finaliser le rapport
    report.executionTimeMs = Date.now() - startTime;
    
    // Écrire le rapport dans un fichier
    const outputPath = options.output;
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Rapport de vérification généré: ${outputPath}`);
    console.log(`🕒 Temps total d'exécution: ${report.executionTimeMs / 1000} secondes`);
    
    // Afficher un résumé
    console.log('\n📋 Résumé de la vérification:');
    console.log(`- Tables vérifiées: ${report.summary.tablesChecked}`);
    console.log(`- Tables sans différence: ${report.summary.tablesMatched}`);
    console.log(`- Tables avec différence de comptage: ${report.summary.tablesWithCountMismatch}`);
    console.log(`- Tables avec différence de données: ${report.summary.tablesWithDataMismatch}`);
    console.log(`- Enregistrements vérifiés: ${report.summary.recordsChecked}`);
    console.log(`- Enregistrements avec différences: ${report.summary.mismatchedRecords}`);
    
    // Afficher les problèmes trouvés
    if (report.problems.length > 0) {
      console.log('\n⚠️ Problèmes détectés:');
      for (const problem of report.problems) {
        const icon = problem.severity === 'error' ? '❌' : '⚠️';
        console.log(`${icon} ${problem.tableName}: ${problem.message}`);
      }
    } else {
      console.log('\n✅ Aucun problème détecté!');
    }
    
    // Retourner avec un code d'erreur si des problèmes critiques ont été trouvés
    const criticalProblems = report.problems.filter(p => p.severity === 'error');
    if (criticalProblems.length > 0) {
      console.error(`\n❌ ${criticalProblems.length} problèmes critiques détectés`);
      process.exit(1);
    }
    
    console.log('\n✅ Vérification des données terminée avec succès');
    
  } catch (error) {
    console.error(`❌ Erreur globale lors de la vérification: ${error}`);
    process.exit(1);
  }
}

/**
 * Normalise les valeurs pour la comparaison
 */
function normalizeValues(mysqlValue: any, pgValue: any): [any, any] {
  // Cas des dates
  if (mysqlValue instanceof Date && pgValue) {
    return [
      mysqlValue.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''),
      typeof pgValue === 'string' ? pgValue.replace('T', ' ').replace(/\.\d+Z$/, '') : pgValue
    ];
  }
  
  // Cas des buffers (blobs)
  if (Buffer.isBuffer(mysqlValue)) {
    return [
      mysqlValue.toString('base64'),
      typeof pgValue === 'string' ? pgValue : Buffer.from(pgValue).toString('base64')
    ];
  }
  
  // Cas des booléens
  if (typeof mysqlValue === 'number' && typeof pgValue === 'boolean') {
    return [(mysqlValue === 1), pgValue];
  }
  
  // Cas des valeurs nulles
  if (mysqlValue === null && pgValue === '' || mysqlValue === '' && pgValue === null) {
    return [null, null];
  }
  
  // Cas des nombres
  if (typeof mysqlValue === 'number' && typeof pgValue === 'string') {
    const parsedPg = parseFloat(pgValue);
    if (!isNaN(parsedPg)) {
      return [mysqlValue, parsedPg];
    }
  }
  
  // Par défaut, retourner les valeurs d'origine
  return [mysqlValue, pgValue];
}

/**
 * Compare deux valeurs avec gestion des types différents
 */
function compareValues(value1: any, value2: any): boolean {
  // Si les deux valeurs sont nulles ou undefined, elles sont égales
  if (value1 == null && value2 == null) {
    return true;
  }
  
  // Si une seule des valeurs est nulle ou undefined, elles sont différentes
  if (value1 == null || value2 == null) {
    return false;
  }
  
  // Si les types sont différents, essayer de convertir
  if (typeof value1 !== typeof value2) {
    // Booléen vs nombre (0/1)
    if (typeof value1 === 'boolean' && typeof value2 === 'number') {
      return value1 === (value2 !== 0);
    }
    if (typeof value1 === 'number' && typeof value2 === 'boolean') {
      return (value1 !== 0) === value2;
    }
    
    // Nombre vs chaîne
    if (typeof value1 === 'number' && typeof value2 === 'string') {
      return value1 === parseFloat(value2);
    }
    if (typeof value1 === 'string' && typeof value2 === 'number') {
      return parseFloat(value1) === value2;
    }
    
    // Conversion en chaîne pour les dates
    if (
      (value1 instanceof Date || typeof value1 === 'string') &&
      (value2 instanceof Date || typeof value2 === 'string')
    ) {
      const str1 = value1 instanceof Date ? value1.toISOString() : value1;
      const str2 = value2 instanceof Date ? value2.toISOString() : value2;
      return str1.replace('T', ' ').replace(/\.\d+Z$/, '') === str2.replace('T', ' ').replace(/\.\d+Z$/, '');
    }
  }
  
  // Pour les chaînes, faire une comparaison insensible à la casse
  if (typeof value1 === 'string' && typeof value2 === 'string') {
    return value1.trim().toLowerCase() === value2.trim().toLowerCase();
  }
  
  // Pour les objets et tableaux, comparer leur représentation JSON
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }
  
  // Comparaison directe pour les autres types
  return value1 === value2;
}

// Fonction utilitaire pour calculer un hash des données (pour la comparaison)
function calculateHash(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('md5').update(str).digest('hex');
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});