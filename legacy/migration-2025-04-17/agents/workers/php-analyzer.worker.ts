import { Worker, Job } from 'bullmq';
import { phpAnalyzerAgent } from '@fafaDoDotmcp-agents/php-analyzer';
import { Logger } from '@nestjs/common';

/**
 * Worker BullMQ pour l'analyse des fichiers PHP
 * Ce worker traite les jobs d'analyse PHP mis en file d'attente
 */
async function startPhpAnalyzerWorker() {
  const logger = new Logger('PhpAnalyzerWorker');
  
  logger.log('🚀 Démarrage du worker PHP Analyzer');
  
  const worker = new Worker('php-analyzer', async (job: Job) => {
    logger.log(`📝 Traitement du job #${job.id}: ${job.data.filePath}`);
    
    try {
      // Exécuter l'analyse PHP avec l'agent MCP
      const result = await phpAnalyzerAgent.run({
        filePath: job.data.filePath,
        jobId: job.id,
        ...job.data.metadata
      });
      
      logger.log(`✅ Analyse terminée pour: ${job.data.filePath}`);
      
      // Retourner le résultat qui sera stocké dans Redis
      return {
        result,
        performance: {
          startTime: job.data.timestamp,
          endTime: new Date().toISOString(),
          executionTimeMs: new Date().getTime() - new Date(job.data.timestamp).getTime()
        }
      };
    } catch (error) {
      logger.error(`❌ Erreur lors de l'analyse de ${job.data.filePath}: ${error.message}`);
      throw error; // BullMQ gèrera automatiquement les retry en fonction des paramètres
    }
  }, {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: parseInt(process.env.PHP_WORKER_CONCURRENCY || '2'),
    limiter: {
      max: 5, // Maximum de 5 jobs par intervalle
      duration: 1000, // Intervalle de 1 seconde
    },
  });
  
  // Gestion des événements du worker
  worker.on('completed', (job: Job, result: any) => {
    logger.log(`✨ Job #${job.id} terminé avec succès (fichier: ${job.data.filePath})`);
    // Ici, vous pourriez publier un événement ou mettre à jour une base de données
  });
  
  worker.on('failed', (job: Job, error: Error) => {
    logger.error(`💥 Job #${job.id} échoué (fichier: ${job.data.filePath}): ${error.message}`);
    // Ici, vous pourriez déclencher une alerte ou enregistrer l'échec
  });
  
  worker.on('error', (error: Error) => {
    logger.error(`🔥 Erreur générale du worker: ${error.message}`);
  });
  
  // Gestion de l'arrêt propre du worker
  process.on('SIGINT', async () => {
    logger.log('📥 Signal SIGINT reçu - Arrêt du worker...');
    await worker.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.log('📥 Signal SIGTERM reçu - Arrêt du worker...');
    await worker.close();
    process.exit(0);
  });
  
  logger.log(`✅ Worker PHP Analyzer prêt (concurrence: ${worker.concurrency})`);
  
  return worker;
}

// Démarrage automatique si exécuté directement
if (require.main === module) {
  startPhpAnalyzerWorker().catch(err => {
    console.error('❌ Erreur fatale du worker PHP Analyzer:', err);
    process.exit(1);
  });
}

export { startPhpAnalyzerWorker };