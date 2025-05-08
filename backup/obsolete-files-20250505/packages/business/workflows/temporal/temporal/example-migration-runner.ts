/**
 * example-migration-runner.ts
 * 
 * Exemple d'utilisation de l'orchestrateur standardisé pour planifier
 * et suivre un workflow de migration PHP vers NestJS
 */

import { scheduleTask, temporal, bullmq, n8n, StandardizedOrchestratorService } from '../../orchestrators';
// Mise à jour pour utiliser le chemin standardisé
import type { MigrationInput } from '../../temporal/workflows/php-migration.workflow';

/**
 * Fonction principale qui démontre l'utilisation de l'orchestrateur standardisé
 * pour la migration PHP vers NestJS
 */
async function runPhpMigrationExample() {
    console.log('🚀 Démarrage de l'exemple de migration PHP vers NestJS');

  // 1. Création de la description de la tâche de migration
  const migrationTask = {
        id: `php-migration-${Date.now()}`,
        type: 'PhpToNestJsMigration', // Correspond au nom du workflow défini dans le chemin standardisé
        isComplex: true, // Forcer l'utilisation de Temporal pour cette tâche complexe
        tags: ['php', 'migration', 'nestjs', 'critical', 'stateful'],
        retry: {
            maxAttempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        },
        data: <MigrationInput>{
            projectId: 'example-php-project',
            sourceDir: '/path/to/legacy/php/code',
            targetORM: 'prisma',
            analysisOptions: {
                analysisDepth: 'deep',
                detectFrameworks: true,
                analyzeDependencies: true
            },
            nestOptions: {
                architecture: 'modular',
                includeTests: true,
                includeSwagger: true
            },
            autoRetry: true
        }
    };

    console.log('📋 Tâche de migration configurée:', JSON.stringify(migrationTask, null, 2));

    try {
        // 2. Utilisation de l'orchestrateur standardisé pour planifier la tâche
        // L'orchestrateur va automatiquement router vers Temporal car isComplex = true
        console.log('⏳ Planification du workflow de migration via l\'orchestrateur standardisé...');
        const taskId = await scheduleTask(migrationTask);
        console.log(`✅ Workflow planifié avec succès! ID: ${taskId}`);

        // 3. Simulation de la vérification du statut après un délai
        console.log('⏳ Attente de 5 secondes avant de vérifier le statut...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Création d'un orchestrateur standardisé pour accéder aux méthodes avancées
        const orchestrator = new StandardizedOrchestratorService();

        // 5. Vérification du statut du workflow
        console.log('🔍 Vérification du statut du workflow...');
        const status = await orchestrator.getTaskStatus(taskId, 'TEMPORAL');
        console.log('📊 Statut actuel:', status);

        // 6. Démonstration d'envoi de notification via BullMQ (tâche simple)
        console.log('📨 Envoi d\'une notification sur l\'avancement via BullMQ...');
        const notificationTaskId = await orchestrator.scheduleSimpleTask('sendNotification', {
            channel: 'slack',
            message: `Migration PHP en cours. ID: ${taskId}, Statut: ${status.status}`,
            recipients: ['#dev-team']
        });
        console.log(`✅ Notification envoyée. ID: ${notificationTaskId}`);

        // 7. Exemple d'intégration externe via n8n
        console.log('🔄 Mise à jour du tableau Kanban via n8n...');
        const n8nTaskId = await orchestrator.scheduleExternalIntegration('update-kanban-board', {
            boardId: 'DEV-123',
            cardId: 'MIGRATION-456',
            newStatus: 'IN_PROGRESS',
            taskId: taskId
        });
        console.log(`✅ Mise à jour du tableau Kanban planifiée. ID: ${n8nTaskId}`);

        console.log('\n🎉 Démonstration terminée! Le workflow de migration PHP→NestJS est en cours d\'exécution.');
        console.log('📝 Résumé:');
        console.log(`- Workflow Temporal (complexe): ${taskId}`);
        console.log(`- Tâche BullMQ (simple): ${notificationTaskId}`);
        console.log(`- Intégration n8n (externe): ${n8nTaskId}`);
    } catch (error) {
        console.error('❌ Erreur lors de la planification du workflow de migration:', error);
    }
}

/**
 * Fonction d'exemple montrant comment annuler un workflow en cours
 */
async function cancelWorkflowExample(workflowId: string) {
    console.log(`🛑 Tentative d'annulation du workflow: ${workflowId}`);

    const orchestrator = new StandardizedOrchestratorService();
    const success = await orchestrator.cancelTask(workflowId, 'TEMPORAL');

    if (success) {
        console.log(`✅ Workflow ${workflowId} annulé avec succès`);

        // Envoyer une notification d'annulation via BullMQ
        await orchestrator.scheduleSimpleTask('sendNotification', {
            channel: 'email',
            subject: 'Migration PHP annulée',
            message: `La migration avec l'ID ${workflowId} a été annulée manuellement`,
            recipients: ['admin@example.com']
        });
    } else {
        console.error(`❌ Échec de l'annulation du workflow ${workflowId}`);
    }
}

// Exécuter l'exemple si ce script est appelé directement
if (require.main === module) {
    runPhpMigrationExample().catch(console.error);
}

// Exporter les fonctions d'exemple pour une utilisation externe
export { runPhpMigrationExample, cancelWorkflowExample };