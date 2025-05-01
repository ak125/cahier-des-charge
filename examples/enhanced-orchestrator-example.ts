import * as express from 'express';
import { TaskType, standardizedOrchestrator } from '../src/orchestration/standardized-orchestrator';

/**
 * Exemple d'utilisation de l'orchestrateur standardisé
 */
async function main() {
  console.log("🚀 Démarrage de l'exemple d'utilisation de l'orchestrateur standardisé");

  // Création de l'application Express pour n8n signals et le dashboard
  const app = express();
  app.use(express.json());

  // Configuration du tableau de bord unifié
  const dashboardPort = 3500;

  // Configurer un endpoint simple pour le tableau de bord
  app.get('/', (_req, res) => {
    res.send(`
      <html>
        <head>
          <title>Tableau de bord unifié d'orchestration</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .info { color: #3498db; }
          </style>
        </head>
        <body>
          <h1>Tableau de bord unifié d'orchestration</h1>
          <div class="card">
            <h2>Services disponibles</h2>
            <p>Interface Temporal: <a href="http://localhost:8088" target="_blank">http://localhost:8088</a></p>
            <p>Interface n8n: <a href="http://localhost:5678" target="_blank">http://localhost:5678</a></p>
          </div>
          <div class="card">
            <h2>API Documentation</h2>
            <p>Accès à l'API de l'orchestrateur standardisé: <span class="info">/api/tasks</span></p>
          </div>
        </body>
      </html>
    `);
  });

  // Démarrer le serveur de tableau de bord
  app.listen(dashboardPort, () => {
    console.log(`✅ Tableau de bord unifié disponible sur http://localhost:${dashboardPort}`);
  });

  // Configurer un endpoint pour les signaux n8n
  app.post('/n8n-signal/:signalType', express.json(), async (req, res) => {
    try {
      const { signalType } = req.params;
      console.log(`✅ Signal n8n reçu: ${signalType}`, req.body);
      // Traitement du signal...
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erreur lors du traitement du signal:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Démarrer le serveur d'écoute n8n
  const n8nPort = 3456;
  app.listen(n8nPort, () => {
    console.log(`✅ Serveur d'écoute des signaux n8n démarré sur http://localhost:${n8nPort}`);
  });

  console.log('✅ Configuration terminée');

  // Exemple de planification d'une tâche simple (BullMQ)
  try {
    // Tâche simple via BullMQ
    const simpleTaskId = await standardizedOrchestrator.scheduleTask(
      'transformation-queue',
      {
        sourceDir: '/path/to/source/code',
        metadata: {
          projectName: 'exemple-project',
          initiatedBy: 'system',
          priority: 'high',
        },
      },
      {
        taskType: TaskType.SIMPLE,
        priority: 1,
        attempts: 3,
      }
    );

    console.log('✅ Tâche simple planifiée:', simpleTaskId);

    // Workflow complexe via Temporal
    const complexTaskId = await standardizedOrchestrator.scheduleTask(
      'codeTransformation',
      {
        sourceDir: '/path/to/source/code',
        metadata: {
          projectName: 'exemple-project',
          initiatedBy: 'system',
          priority: 'high',
        },
      },
      {
        taskType: TaskType.COMPLEX,
        temporal: {
          workflowType: 'codeTransformationWorkflow',
          workflowArgs: ['/path/to/source/code'],
          taskQueue: 'mcp-task-queue',
          trackingQueue: 'transformation-queue', // Utiliser BullMQ pour suivre le workflow
        },
      }
    );

    console.log('✅ Workflow complexe planifié:', complexTaskId);

    // Démarrer un workflow qui échouera intentionnellement pour tester la gestion des erreurs
    console.log("🔄 Démarrage d'un workflow avec erreur (pour tester la reprise)...");
    await standardizedOrchestrator.scheduleTask(
      'failingWorkflow',
      {
        reason: 'test-error-handling',
        shouldFail: true,
      },
      {
        taskType: TaskType.COMPLEX,
        temporal: {
          workflowType: 'failingWorkflow',
          workflowArgs: ['will-fail'],
          taskQueue: 'mcp-task-queue',
          trackingQueue: 'transformation-queue',
        },
      }
    );
  } catch (error) {
    console.error('❌ Erreur lors du démarrage des workflows:', error);
  }

  console.log('\n🔍 Services disponibles:');
  console.log('- Tableau de bord unifié: http://localhost:3500');
  console.log('- Interface Temporal: http://localhost:8088');
  console.log('- Interface n8n: http://localhost:5678');
  console.log('- API pour signaux n8n: http://localhost:3456/n8n-signal/:signalType (POST)');
  console.log('\nAppuyez sur Ctrl+C pour arrêter...');
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt en cours...');
  process.exit(0);
});

// Démarrer l'application
main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
