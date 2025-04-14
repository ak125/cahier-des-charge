import { BullMqOrchestrator } from './bullmq-orchestrator';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Exemple d'une migration automatisée de PHP vers Remix utilisant BullMQ
 * Ce script montre comment utiliser l'orchestrateur BullMQ pour gérer le processus de migration
 */
async function runPhpToRemixMigration() {
  const logger = new Logger('PhpToRemixMigration');
  logger.log('🚀 Démarrage du processus de migration PHP vers Remix...');

  // Initialiser l'orchestrateur BullMQ
  const orchestrator = new BullMqOrchestrator();
  await orchestrator.initialize();

  try {
    // Configuration de la migration
    const sourceDir = process.env.PHP_SOURCE_DIR || '/legacy/www';
    const targetDir = process.env.REMIX_TARGET_DIR || '/app/routes';
    const batchId = `migration-${Date.now()}`;

    logger.log(`📂 Source: ${sourceDir}`);
    logger.log(`📂 Cible: ${targetDir}`);
    logger.log(`🔑 ID du lot: ${batchId}`);

    // 1. Analyse des fichiers PHP source
    logger.log('🔍 Analyse des fichiers PHP source...');
    const analysisResult = await orchestrator.queues['orchestrator'].add('analyze-directory', {
      action: 'analyze-directory',
      params: {
        directory: sourceDir,
        options: {
          batchId,
          priority: 10,
          attempts: 3
        }
      }
    }, {
      priority: 10,
      attempts: 1
    });

    logger.log(`✅ Job d'analyse créé: ${analysisResult.id}`);

    // 2. Créer un workflow de migration pour chaque fichier PHP
    logger.log('🔄 Création du workflow de migration...');

    // Simuler une liste de fichiers PHP (normalement fournie par l'analyse)
    const phpFiles = [
      { path: `${sourceDir}/index.php`, route: '/' },
      { path: `${sourceDir}/about.php`, route: '/about' },
      { path: `${sourceDir}/products/list.php`, route: '/products' },
      { path: `${sourceDir}/products/details.php`, route: '/products/$id' },
      { path: `${sourceDir}/contact.php`, route: '/contact' }
    ];

    // Créer un flow de migration avec des dépendances
    const migrationChildren = [];

    // Étape 1: Analyser chaque fichier PHP en profondeur
    for (const file of phpFiles) {
      migrationChildren.push({
        name: `analyze-php:${path.basename(file.path)}`,
        queueName: 'php-analyzer',
        data: {
          filePath: file.path,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'migration-workflow',
            batchId,
            targetRoute: file.route
          }
        },
        opts: { priority: 5 }
      });
    }

    // Étape 2: Pour chaque fichier PHP, créer un job de migration
    const migrationJobs = phpFiles.map(file => ({
      name: `migrate:${path.basename(file.path)}`,
      queueName: 'migration',
      data: {
        source: file.path,
        target: `${targetDir}${file.route === '/' ? '/index' : file.route}.tsx`,
        type: 'route',
        timestamp: new Date().toISOString(),
        params: {
          routePath: file.route,
          createLoader: true,
          createAction: file.path.includes('contact.php')
        }
      },
      opts: { priority: 3 },
      children: []
    }));

    migrationChildren.push(...migrationJobs);

    // Étape 3: Job final pour la génération du rapport
    migrationChildren.push({
      name: 'generate-report',
      queueName: 'orchestrator',
      data: {
        action: 'generate-migration-report',
        params: {
          batchId,
          outputPath: `./reports/migration-report-${batchId}.json`
        }
      },
      opts: { priority: 1 },
      children: migrationJobs.map(job => ({ name: job.name, queueName: job.queueName }))
    });

    // Ajouter le workflow complet à la file d'attente
    const migrationFlow = await orchestrator.flowProducer.add({
      name: 'php-to-remix-migration',
      queueName: 'orchestrator',
      data: {
        action: 'php-to-remix-migration-started',
        params: {
          batchId,
          fileCount: phpFiles.length,
          timestamp: new Date().toISOString()
        }
      },
      children: [
        {
          name: 'migration-batch',
          queueName: 'orchestrator',
          data: {
            action: 'migration-batch',
            params: {
              batchId,
              fileCount: phpFiles.length,
              timestamp: new Date().toISOString()
            }
          },
          children: migrationChildren
        }
      ]
    });

    logger.log(`✅ Workflow de migration créé: ${migrationFlow.job.id}`);
    logger.log('⏳ La migration est en cours de traitement en arrière-plan...');
    logger.log('📊 Vous pouvez suivre la progression dans le dashboard Bull Board: http://localhost:3030/queues');

    // Attendre un moment avant de fermer l'orchestrateur (en situation réelle, vous n'attendriez pas)
    logger.log('⏱️ Attente de 5 secondes pour la démonstration...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    logger.error(`❌ Erreur lors de la migration: ${error.message}`);
    throw error;
  } finally {
    // Fermer proprement l'orchestrateur
    logger.log('🛑 Fermeture de l\'orchestrateur...');
    await orchestrator.shutdown();
    logger.log('✅ Orchestrateur fermé');
  }
}

// Exécuter la migration si ce fichier est exécuté directement
if (require.main === module) {
  runPhpToRemixMigration().catch(err => {
    console.error('❌ Erreur fatale lors de la migration:', err);
    process.exit(1);
  });
}

export { runPhpToRemixMigration };