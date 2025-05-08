import { NativeConnection, Worker } from '@temporalio/worker';
import { standardizedOrchestrator } from '../orchestration/standardized-orchestrator';
import * as activities from './activities';

/**
 * Point d'entrée principal pour le worker Temporal
 * Il se connecte au serveur Temporal et enregistre les workflows et activités
 * Intégré à l'orchestrateur standardisé pour une meilleure gestion
 */
async function run() {
  try {
    console.log("Démarrage du worker Temporal via l'orchestrateur standardisé...");

    // Créer la connexion au serveur Temporal en utilisant le nom du service dans docker-compose
    const connection = await NativeConnection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'temporal-server:7233',
    });

    const worker = await Worker.create({
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue: 'DoDotmcp-task-queue',
      connection,
    });

    // Enregistrer le worker dans notre système de surveillance unifié
    // Cette étape est facultative mais recommandée pour la surveillance
    if (process.env.ENABLE_UNIFIED_MONITORING === 'true') {
      await registerWorkerInMonitoring(worker);
    }

    // Start accepting tasks
    await worker.run();
    console.log('Worker démarré avec succès');
  } catch (error) {
    console.error('Erreur lors du démarrage du worker:', error);
    process.exit(1);
  }
}

/**
 * Enregistre le worker dans notre système de surveillance unifié
 */
async function registerWorkerInMonitoring(worker: Worker) {
  try {
    // Utiliser l'orchestrateur standardisé pour enregistrer le worker
    await standardizedOrchestrator.scheduleTask(
      'worker-registration',
      {
        type: 'temporal',
        taskQueue: 'DoDotmcp-task-queue',
        timestamp: new Date().toISOString(),
        status: 'starting',
      },
      {
        taskType: 'SIMPLE',
        priority: 1,
      }
    );

    console.log('Worker enregistré dans le système de surveillance.');

    // S'abonner aux événements du worker pour les signaler
    worker.subscribeToWorkflowEvents('completed', async (event) => {
      await standardizedOrchestrator.scheduleTask(
        'workflow-completed',
        {
          workflowId: event.workflowExecution.workflowId,
          timestamp: new Date().toISOString(),
        },
        {
          taskType: 'SIMPLE',
          priority: 3,
        }
      );
    });
  } catch (error) {
    console.warn("Impossible d'enregistrer le worker dans la surveillance:", error);
    // Continuer malgré l'échec de l'enregistrement
  }
}

// Run the worker
run().catch((err) => {
  console.error('Erreur dans le worker:', err);
  process.exit(1);
});
