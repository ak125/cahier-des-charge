import { createOrchestratorBridge } from '../agents/integration/OrchestratorBridge';
import * as express from 'express';

/**
 * Exemple d'utilisation des fonctionnalités étendues de l'OrchestratorBridge
 */
async function main() {
  console.log('🚀 Démarrage de l'exemple d\'utilisation avancée de OrchestratorBridge');
  
  // Création de l'application Express pourDotn8N signals et le dashboard
  const app = express();
  app.use(express.json());
  
  // Initialisation du pont d'orchestration avec configuration complète
  const bridge = await createOrchestratorBridge({
    redisUrl: 'redis://localhost:6379',
    temporalAddress: 'localhost:7233',
   Dotn8NWebhookUrl: 'http://localhost:5678/webhook',
    queueNames: [DoDotmcp-queue', 'transformation-queue', 'validation-queue'],
    statusFilePath: './status.json',
    // Ces propriétés seront ignorées par la fonction createOrchestratorBridge
    // mais seront utilisées par notre code étendu
    temporalUIAddress: 'http://localhost:8088',
   Dotn8NUIAddress: 'http://localhost:5678',
  });
  
  // Configuration du tableau de bord unifié (nouvelle fonctionnalité)
  await bridge.createDashboardServer(3500);
  console.log('✅ Tableau de bord unifié disponible sur http://localhost:3500');
  
  // Configuration de la gestion automatique des erreurs pour Temporal (nouvelle fonctionnalité)
  await bridge.setupTemporalErrorHandling({
    taskQueue: DoDotmcp-task-queue',
    retryOptions: {
      maxAttempts: 5,
      initialInterval: 5000,  // 5 secondes
      backoffCoefficient: 1.5,
      maximumInterval: 300000,  // 5 minutes maximum
      nonRetryableErrors: ['ValidationError', 'ConfigurationError', 'AuthorizationError']
    },
    notifyOnFailure: true
  });
  console.log('✅ Gestion des erreurs Temporal configurée');
  
  // Configuration de l'écoute des signauxDotn8N
  await bridge.listenToN8NSignals(app, 3456);
  console.log('✅ Serveur d\'écoute des signauxDotn8N démarré sur http://localhost:3456');
  
  // Exemple de démarrage d'un workflow avec suivi BullMQ
  try {
    const result = await bridge.startTemporalWorkflowWithBullMQTracking({
      workflowType: 'codeTransformationWorkflow',
      workflowArgs: ['/path/to/source/code'],
      taskQueue: DoDotmcp-task-queue',
      bullMQQueue: 'transformation-queue',
      bullMQJobData: {
        sourceDir: '/path/to/source/code',
        metadata: {
          projectName: 'exemple-project',
          initiatedBy: 'system',
          priority: 'high'
        }
      }
    });
    
    console.log('✅ Workflow démarré:', result);
    
    // Démarrer un workflow qui échouera intentionnellement pour tester la gestion des erreurs
    console.log('🔄 Démarrage d\'un workflow avec erreur (pour tester la reprise)...');
    await bridge.startTemporalWorkflowWithBullMQTracking({
      workflowType: 'failingWorkflow',
      workflowArgs: ['will-fail'],
      taskQueue: DoDotmcp-task-queue',
      bullMQQueue: 'transformation-queue',
      bullMQJobData: {
        reason: 'test-error-handling',
        shouldFail: true
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage des workflows:', error);
  }
  
  console.log('\n🔍 Services disponibles:');
  console.log('- Tableau de bord unifié: http://localhost:3500');
  console.log('- Interface Temporal: http://localhost:8088');
  console.log('- InterfaceDotn8N: http://localhost:5678');
  console.log('- API pour signauxDotn8N: http://localhost:3456Dotn8N-signal/:signalType (POST)');
  console.log('\nAppuyez sur Ctrl+C pour arrêter...');
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt en cours...');
  process.exit(0);
});

// Démarrer l'application
main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});