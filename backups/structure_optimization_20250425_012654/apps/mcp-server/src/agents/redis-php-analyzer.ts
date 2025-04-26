import { RedisService } from ../redis/redis.servicestructure-agent';
import { phpAnalyzerAgent } from @fafaDoDotmcp-agents/php-analyzer';

async function startRedisPhpAnalyzer() {
  const redis = new RedisService();

  await redis.consumeJob("php-analyzer", async (job) => {
    console.info(`🔎 Analyse démarrée : ${job.filePath}`);
    const result = await phpAnalyzerAgent.run(job);

    // Optionnel : Publier les résultats vers Redis pour archivage/cache
    await redis.publishJob('php-analyzer-results', {
      filePath: job.filePath,
      analysis: result,
      status: 'done',
      timestamp: new Date().toISOString(),
    });

    console.info(`✅ Analyse terminée : ${job.filePath}`);
  });
}

// Démarrage automatique si exécuté directement
if (require.main === module) {
  startRedisPhpAnalyzer().catch(err => {
    console.error('❌ Erreur agent Redis :', err);
    process.exit(1);
  });
}