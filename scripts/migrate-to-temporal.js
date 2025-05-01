#!/usr/bin/env node

/**
 * Script de migration de BullMQ vers Temporal
 *
 * Ce script analyse les jobs BullMQ existants et les migre vers Temporal
 * en utilisant l'adaptateur d'orchestration unifié.
 */

const { execSync } = require('child_process');
const _path = require('path');
const fs = require('fs');
const { Redis } = require('ioredis');
const {
  BullMQAdapter,
  TemporalAdapter,
  OrchestratorType,
  orchestrationService,
} = require('../src/orchestration/orchestrator-adapter');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const QUEUE_PREFIX = process.env.QUEUE_PREFIX || 'migration';

// Fonctions d'aide
async function connectToRedis() {
  try {
    console.log('Connexion à Redis...');
    const redis = new Redis(REDIS_URI);
    await redis.ping();
    console.log('Connecté à Redis ✓');
    return redis;
  } catch (error) {
    console.error('Erreur de connexion à Redis:', error);
    process.exit(1);
  }
}

async function getBullMQQueues(redis) {
  // Recherche toutes les clés Redis commençant par le préfixe des queues BullMQ
  const keys = await redis.keys(`${QUEUE_PREFIX}:*`);

  // Extraire les noms de queues uniques
  const queueSet = new Set();
  keys.forEach((key) => {
    const parts = key.split(':');
    if (parts.length >= 2) {
      queueSet.add(parts[1]);
    }
  });

  return Array.from(queueSet);
}

async function getJobsInQueue(redis, queueName) {
  // Récupérer les IDs de jobs actifs, en attente et retardés
  const waitingJobs = await redis.lrange(`${QUEUE_PREFIX}:${queueName}:wait`, 0, -1);
  const activeJobs = await redis.lrange(`${QUEUE_PREFIX}:${queueName}:active`, 0, -1);
  const delayedJobs = await redis.zrange(`${QUEUE_PREFIX}:${queueName}:delayed`, 0, -1);

  // Combiner tous les IDs
  const jobIds = [...new Set([...waitingJobs, ...activeJobs, ...delayedJobs])];

  // Récupérer les détails des jobs
  const jobs = [];
  for (const jobId of jobIds) {
    const jobData = await redis.hgetall(`${QUEUE_PREFIX}:${queueName}:${jobId}`);
    if (jobData?.data) {
      try {
        const data = JSON.parse(jobData.data);
        jobs.push({
          id: jobId,
          name: jobData.name || queueName,
          data,
          opts: jobData.opts ? JSON.parse(jobData.opts) : {},
          timestamp: parseInt(jobData.timestamp) || Date.now(),
        });
      } catch (error) {
        console.error(`Erreur lors du parsing des données du job ${jobId}:`, error);
      }
    }
  }

  return jobs;
}

async function migrateJobsToTemporal(jobs, queueName) {
  // Configurer les orchestrateurs
  await orchestrationService.registerOrchestrator({
    type: OrchestratorType.BULLMQ,
    connectionString: REDIS_URI,
  });

  await orchestrationService.registerOrchestrator({
    type: OrchestratorType.TEMPORAL,
    connectionString: TEMPORAL_ADDRESS,
  });

  await orchestrationService.connectAll();

  console.log(`Migration de ${jobs.length} jobs de la queue "${queueName}" vers Temporal...`);

  let migratedCount = 0;
  let failedCount = 0;

  for (const job of jobs) {
    try {
      if (DRY_RUN) {
        console.log(`[DRY RUN] Job ${job.id} serait migré vers Temporal`);
        migratedCount++;
        continue;
      }

      const newTaskId = await orchestrationService.migrateTask(
        job.id,
        OrchestratorType.BULLMQ,
        OrchestratorType.TEMPORAL
      );

      if (newTaskId) {
        console.log(`Job ${job.id} migré avec succès vers Temporal avec l'ID ${newTaskId}`);
        migratedCount++;
      } else {
        console.log(`Job ${job.id} n'a pas besoin d'être migré (déjà terminé ou en erreur)`);
      }
    } catch (error) {
      console.error(`Échec de la migration du job ${job.id}:`, error);
      failedCount++;
    }
  }

  await orchestrationService.disconnectAll();

  return { migratedCount, failedCount };
}

async function updateApplicationCode() {
  console.log('\nMise à jour des imports dans le code application...');

  if (DRY_RUN) {
    console.log("[DRY RUN] Le code de l'application serait mis à jour pour utiliser Temporal");
    return { total: 0, updated: 0 };
  }

  try {
    // Rechercher les fichiers JS/TS utilisant BullMQ
    const findCmd =
      'find . -type f -name "*.js" -o -name "*.ts" | grep -v node_modules | xargs grep -l "bullmq\\|@nestjs/bullmq" || true';
    const files = execSync(findCmd, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);

    if (!files.length) {
      console.log('Aucun fichier utilisant BullMQ trouvé.');
      return { total: 0, updated: 0 };
    }

    console.log(`${files.length} fichiers trouvés utilisant BullMQ.`);
    let updatedFiles = 0;

    for (const file of files) {
      if (!fs.existsSync(file)) continue;

      let content = fs.readFileSync(file, 'utf-8');
      const origContent = content;

      // Remplacer les imports BullMQ par des imports d'adaptateur d'orchestration
      content = content.replace(
        /import\s+{([^}]*)}\s+from\s+['"]bullmq['"]/g,
        `import { orchestrationService, OrchestratorType } from '../src/orchestration/orchestrator-adapter';`
      );

      content = content.replace(
        /import\s+{([^}]*)}\s+from\s+['"]@nestjs\/bullmq['"]/g,
        `import { orchestrationService, OrchestratorType } from '../src/orchestration/orchestrator-adapter';`
      );

      // Remplacer les utilisations de Queue.add
      content = content.replace(
        /(\w+)\.add\(\s*['"]?(\w+)['"]?,\s*({[^}]*}|\w+)/g,
        `orchestrationService.scheduleTask({ name: '$2', payload: $3 })`
      );

      // Si le contenu a été modifié, enregistrer le fichier
      if (content !== origContent) {
        fs.writeFileSync(file, content);
        console.log(`Fichier mis à jour: ${file}`);
        updatedFiles++;
      }
    }

    return { total: files.length, updated: updatedFiles };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du code:', error);
    return { total: 0, updated: 0 };
  }
}

// Fonction principale
async function main() {
  console.log('🔄 Migration des jobs BullMQ vers Temporal');
  console.log('==========================================');

  if (DRY_RUN) {
    console.log('Mode "dry run" activé - aucune modification ne sera effectuée\n');
  }

  const redis = await connectToRedis();

  // Récupérer toutes les queues BullMQ
  const queues = await getBullMQQueues(redis);
  console.log(`${queues.length} queues BullMQ trouvées: ${queues.join(', ')}\n`);

  let totalJobsMigrated = 0;
  let totalJobsFailed = 0;

  // Migrer chaque queue une par une
  for (const queueName of queues) {
    console.log(`\nTraitement de la queue: ${queueName}`);
    const jobs = await getJobsInQueue(redis, queueName);
    console.log(`${jobs.length} jobs trouvés dans la queue "${queueName}"`);

    if (jobs.length > 0) {
      const { migratedCount, failedCount } = await migrateJobsToTemporal(jobs, queueName);
      totalJobsMigrated += migratedCount;
      totalJobsFailed += failedCount;
    }
  }

  // Mettre à jour le code de l'application
  const { total, updated } = await updateApplicationCode();

  // Résumé
  console.log('\n=== Résumé de la migration ===');
  console.log(`Queues traitées: ${queues.length}`);
  console.log(`Jobs migrés: ${totalJobsMigrated}`);
  console.log(`Jobs en échec: ${totalJobsFailed}`);
  console.log(`Fichiers mis à jour: ${updated}/${total}`);

  if (DRY_RUN) {
    console.log("\n⚠️ Ceci était un dry run, aucune modification n'a été effectuée.");
    console.log('Pour exécuter la migration réelle, lancez le script sans --dry-run');
  } else if (totalJobsFailed === 0) {
    console.log('\n✅ Migration terminée avec succès!');
  } else {
    console.log('\n⚠️ Migration terminée avec des avertissements.');
  }

  // Fermer la connexion Redis
  await redis.quit();
}

main().catch((error) => {
  console.error('Erreur lors de la migration:', error);
  process.exit(1);
});
