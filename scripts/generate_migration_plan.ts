#!/usr/bin/env node
/**
 * generate_migration_plan.ts
 * 
 * Script d'intégration pour lancer l'Agent 7 (Planificateur de Migration SQL + Prisma)
 * depuis n8n ou via la ligne de commande.
 * 
 * Usage: 
 *   ts-node scripts/generate_migration_plan.ts [options]
 *   
 * Options:
 *   --schema-raw=<path>      Chemin vers schema_raw.json
 *   --prisma-schema=<path>   Chemin vers suggested_schema.prisma
 *   --php-sql-links=<path>   Chemin vers php_sql_links.json
 *   --output-dir=<path>      Répertoire de sortie
 *   --notify-webhook=<url>   Webhook à notifier une fois le plan généré
 */

import { SQLPrismaMigrationPlanner } from '../agents/migration/sql-prisma-migration-planner';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { program } from 'commander';

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description('Générateur de Plan de Migration SQL → Prisma')
  .option('--schema-raw <path>', 'Chemin vers le fichier schema_raw.json', './reports/schema_raw.json')
  .option('--prisma-schema <path>', 'Chemin vers suggested_schema.prisma', './reports/suggested_schema.prisma')
  .option('--php-sql-links <path>', 'Chemin vers php_sql_links.json', './reports/php_sql_links.json')
  .option('--output-dir <path>', 'Répertoire de sortie', './reports/migration-plan')
  .option('--notify-webhook <url>', 'Webhook pour notification à la fin')
  .parse(process.argv);

const options = program.opts();

/**
 * Fonction principale exécutant le générateur de plan et gérant les notifications
 */
async function generateMigrationPlan() {
  console.log('🚀 Démarrage de la génération du plan de migration SQL → Prisma');
  
  try {
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }
    
    console.log('📊 Analyse des schémas et génération du plan...');
    
    // Initialiser le planificateur de migration
    const planner = new SQLPrismaMigrationPlanner(
      options.schemaRaw,
      options.prismaSchema,
      options.phpSqlLinks,
      options.outputDir
    );
    
    // Générer le plan de migration
    planner.generateMigrationPlan();
    
    console.log('✅ Plan de migration généré avec succès !');
    console.log(`📁 Fichiers enregistrés dans ${options.outputDir}:`);
    console.log('  - migration_plan.md');
    console.log('  - prisma_tasks.json');
    console.log('  - table_migration_status.json');
    console.log('  - migration_dependency_graph.json');
    console.log('  - migration_checklist.md');
    
    // Envoyer une notification si un webhook est spécifié
    if (options.notifyWebhook) {
      console.log('🔔 Envoi de la notification...');
      
      try {
        // Charger les tâches générées pour les envoyer dans la notification
        const tasksPath = path.join(options.outputDir, 'prisma_tasks.json');
        const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
        
        // Statistiques pour la notification
        const stats = {
          totalTables: Object.keys(tasks).length,
          criticalTables: tasks.filter(task => task.critical).length,
          pendingTasks: tasks.filter(task => task.status === 'pending').length,
          blockedTasks: tasks.filter(task => task.status === 'blocked').length
        };
        
        // Envoyer les données au webhook
        await axios.post(options.notifyWebhook, {
          success: true,
          message: 'Plan de migration généré avec succès',
          outputDir: options.outputDir,
          stats,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Notification envoyée avec succès');
      } catch (error) {
        console.error(`❌ Erreur lors de l'envoi de la notification: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de la génération du plan de migration: ${error.message}`);
    
    // Notifier l'erreur si un webhook est spécifié
    if (options.notifyWebhook) {
      try {
        await axios.post(options.notifyWebhook, {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (notifyError) {
        console.error(`❌ Erreur lors de la notification d'échec: ${notifyError.message}`);
      }
    }
    
    process.exit(1);
  }
}

// Exécuter la fonction principale
generateMigrationPlan();