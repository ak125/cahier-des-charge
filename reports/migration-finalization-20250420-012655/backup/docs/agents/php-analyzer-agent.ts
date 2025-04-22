import { RedisService } from '../../../apps/backend/src/redis/redis.service';
import axios from 'axios';
import { phpAnalyzerAgent } from '@fafaDoDotmcp-agents/php-analyzer';
import { Logger } from '@nestjs/common';

/**
 * Agent MCP Redis PHP Analyzer
 * Cet agent analyse les fichiers PHP et met à jour le statut du job via l'API
 */
async function startRedisPhpAnalyzerAgent() {
  const logger = new Logger('RedisPhpAnalyzerAgent');
  const redis = new RedisService();
  const API_BASE_URL = process.env.API_BASE_URL || 'http://backend:3333';

  logger.log('🚀 Démarrage de l\'agent PHP Analyzer');

  // S'abonner au canal Redis pour les nouveaux jobs
  await redis.consumeJob('php-analyzer', async (job) => {
    try {
      logger.log(`📥 Job reçu: ${job.jobId} - Fichier: ${job.filePath}`);
      
      // Mettre à jour le statut du job en "processing"
      await updateJobStatus(job.jobId, 'processing');
      
      // Exécuter l'analyse PHP avec l'agent MCP
      logger.log(`🔍 Analyse du fichier: ${job.filePath}`);
      const analysisResult = await phpAnalyzerAgent.run({
        filePath: job.filePath,
        jobId: job.jobId,
        ...job.options
      });
      
      // Enregistrer les résultats en base de données via l'API
      await updateJobStatus(job.jobId, 'done', analysisResult);
      
      logger.log(`✅ Analyse terminée avec succès pour le job: ${job.jobId}`);
      
      // Publier le résultat pour d'autres consommateurs potentiels
      await redis.publishJob('php-analyzer-results', {
        jobId: job.jobId,
        filePath: job.filePath,
        status: 'done',
        result: analysisResult,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`❌ Erreur lors du traitement du job ${job.jobId}: ${error.message}`);
      
      // Enregistrer l'erreur
      await updateJobStatus(job.jobId, 'failed', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Republier le job en cas d'erreur (optionnel, à commenter si non souhaité)
      // await redis.publishJob('php-analyzer-retry', job);
    }
  });
  
  /**
   * Met à jour le statut d'un job via l'API REST
   */
  async function updateJobStatus(jobId: string, status: string, result?: any) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/jobs/${jobId}/status`, {
        status,
        result
      });
      logger.log(`📤 Statut mis à jour pour le job ${jobId}: ${status}`);
      return response.data;
    } catch (error) {
      logger.error(`❌ Erreur lors de la mise à jour du statut du job ${jobId}: ${error.message}`);
      throw error;
    }
  }
}

// Démarrage automatique si exécuté directement
if (require.main === module) {
  startRedisPhpAnalyzerAgent().catch(err => {
    console.error('❌ Erreur fatale de l\'agent Redis PHP Analyzer:', err);
    process.exit(1);
  });
}

export { startRedisPhpAnalyzerAgent };