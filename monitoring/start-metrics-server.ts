import { metricsService } from './services/metrics-service';

/**
 * Script de démarrage du serveur de métriques pour Prometheus
 * Ce script est utilisé pour exposer les métriques collectées par les agents MCP
 */

// Configuration
const PORT = process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : 3002;

// Message de démarrage
console.log('=============================================================');
console.log('🚀 Démarrage du serveur de métriques MCP pour Prometheus');
console.log(`📊 Les métriques seront disponibles sur http://localhost:${PORT}/metrics`);
console.log('=============================================================');

// Démarrer le serveur de métriques
metricsService.startMetricsServer(PORT);

// Gérer la fermeture propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur de métriques...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur de métriques...');
  process.exit(0);
});
