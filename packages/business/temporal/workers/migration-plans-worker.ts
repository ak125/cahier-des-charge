import { Worker } from '@temporalio/worker';
import * as activities from '../activities/migration-plans';
import { generateMigrationPlansWorkflow } from '../workflows/migration-plans/generate-migration-plans.workflow';

/**
 * Worker Temporal pour l'exécution du workflow de génération des plans de migration
 */
async function run() {
    console.log('Démarrage du worker pour les plans de migration...');

    try {
        const worker = await Worker.create({
            workflowsPath: require.resolve('../workflows/migration-plans/generate-migration-plans.workflow'),
            activities,
            taskQueue: 'migration-plans-queue',
        });

        // Enregistrer le workflow
        worker.registerWorkflow(generateMigrationPlansWorkflow);

        // Démarrer le worker
        await worker.run();
    } catch (error) {
        console.error('Erreur lors du démarrage du worker:', error);
        process.exit(1);
    }
}

// Démarrer le worker si ce script est exécuté directement
if (require.main === module) {
    run().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

export default run;