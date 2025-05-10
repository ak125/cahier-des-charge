/**
 * Exemple d'utilisation de l'orchestrateur standardisé
 *
 * Ce fichier montre comment utiliser efficacement l'orchestrateur standardisé
 * pour les tâches simples (BullMQ) et les workflows complexes (Temporal).
 */

import { TaskType, standardizedOrchestrator } from '../src/orchestration/standardized-orchestrator';

async function main() {
  try {
    console.log("🚀 Démonstration de l'orchestrateur standardisé");

    // Exemple 1: Tâche simple avec BullMQ
    console.log("\n📋 Exemple 1: Planification d'une tâche simple avec BullMQ");
    const simpleTaskId = await standardizedOrchestrator.scheduleTask(
      'send-notification',
      {
        recipient: 'user@example.com',
        subject: 'Test de notification',
        body: "Ceci est un test de notification envoyé via l'orchestrateur standardisé",
      },
      {
        taskType: TaskType.SIMPLE,
        priority: 1,
        attempts: 3,
      }
    );
    console.log(`✅ Tâche simple planifiée avec l'ID: ${simpleTaskId}`);

    // Exemple 2: Workflow complexe avec Temporal
    console.log("\n📋 Exemple 2: Planification d'un workflow complexe avec Temporal");
    const complexTaskId = await standardizedOrchestrator.scheduleTask(
      'code-migration',
      {
        sourceDirectory: '/path/to/source',
        targetDirectory: '/path/to/target',
        options: {
          ignoreFiles: ['node_modules', '.git'],
          transformations: ['php-to-typescript'],
        },
      },
      {
        taskType: TaskType.COMPLEX,
        temporal: {
          workflowType: 'migrationWorkflow',
          workflowArgs: ['/path/to/source', '/path/to/target'],
          taskQueue: 'migration-queue',
          trackingQueue: 'migration-tracking', // Utiliser BullMQ pour suivre le workflow Temporal
        },
      }
    );
    console.log(`✅ Workflow complexe planifié avec l'ID: ${complexTaskId}`);

    // Exemple 3: Interroger le statut d'une tâche
    console.log(
      "\n📋 Exemple 3: Interrogation du statut d'une tâche (non exécuté ici pour éviter les erreurs)"
    );
    console.log(
      `Pour obtenir le statut d'une tâche: await standardizedOrchestrator.getTaskStatus('task-id')`
    );

    // Exemple 4: Annuler une tâche
    console.log("\n📋 Exemple 4: Annulation d'une tâche (non exécuté ici pour éviter les erreurs)");
    console.log(`Pour annuler une tâche: await standardizedOrchestrator.cancelTask('task-id')`);

    console.log('\n✅ Démonstration terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error);
  }
}

// Exécuter la démonstration si ce fichier est exécuté directement
if (require.main === module) {
  main().catch(console.error);
}
