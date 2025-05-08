import { Logger } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { DoDotmcpVerifier } from '../../packagesDoDotmcp-agentsDoDotmcp-verifier';

/**
 * Worker BullMQ pour la vérification de fichiers générés par MCP
 * Ce worker traite les jobs de vérification mis en file d'attente
 */
async function startMcpVerifierWorker() {
  const logger = new Logger('MCP-Verifier-Worker');
  logger.log('🚀 Démarrage du worker MCP Verifier...');

  const worker = new Worker(
    'verification',
    async (job: Job) => {
      logger.log(`📋 Traitement du job ${job.id}: ${job.name}`);
      const { filePrefix, options } = job.data;

      try {
        logger.log(`🔍 Vérification des fichiers avec préfixe: ${filePrefix}`);

        // Appel de l'agent de vérification
        const result = awaitDoDotmcpVerifier.run({
          filePrefix,
          generateReport: true,
          addTags: true,
          typeCheck: true,
          ...options,
        });

        logger.log(`✅ Vérification terminée pour ${filePrefix}`);

        // Résultats pour BullMQ
        return {
          success: result.status === 'success',
          summary: result.summary,
          timestamp: new Date().toISOString(),
          jobId: job.id,
          endTime: new Date().toISOString(),
          executionTimeMs: new Date().getTime() - new Date(job.data.timestamp).getTime(),
        };
      } catch (error) {
        logger.error(`❌ Erreur lors de la vérification de ${filePrefix}: ${error.message}`);
        throw error; // BullMQ gèrera automatiquement les retry en fonction des paramètres
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      concurrency: parseInt(process.env.VERIFIER_WORKER_CONCURRENCY || '2'),
      limiter: {
        max: 5, // Maximum de 5 jobs par intervalle
        duration: 1000, // Intervalle de 1 seconde
      },
    }
  );

  // Configurer les écouteurs d'événements
  worker.on('completed', (job: Job, result: any) => {
    logger.log(`✨ Job ${job.id} terminé avec succès`);
  });

  worker.on('failed', (job: Job, error: Error) => {
    logger.error(`💥 Job ${job.id} a échoué: ${error.message}`);
  });

  worker.on('error', (err: Error) => {
    logger.error(`🔥 Erreur worker MCP Verifier: ${err.message}`);
  });

  logger.log('✅ Worker MCP Verifier démarré avec succès');
  return worker;
}

// Démarrage automatique si exécuté directement
if (require.main === module) {
  startMcpVerifierWorker().catch((err) => {
    console.error('❌ Erreur fatale du worker MCP Verifier:', err);
    process.exit(1);
  });
}

export { startMcpVerifierWorker };
