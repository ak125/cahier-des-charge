import { Worker } from '@temporalio/worker';
import * as activities from '../activities/php-migration-pipeline';
import { phpToNestjsRemixMigrationWorkflow } from '../workflows/php-migration-pipeline/migration-pipeline.workflow';

/**
 * Worker Temporal pour le pipeline de migration PHP → NestJS/Remix
 */
async function run() {
    console.log('Démarrage du worker pour le pipeline de migration PHP → NestJS/Remix...');

    try {
        const worker = await Worker.create({
            workflowsPath: require.resolve('../workflows/php-migration-pipeline/migration-pipeline.workflow'),
            activities,
            taskQueue: 'php-migration-queue',
        });

        // Enregistrer le workflow
        worker.registerWorkflow(phpToNestjsRemixMigrationWorkflow);

        // Démarrer le worker
        await worker.run();
    } catch (error) {
        console.error('Erreur lors du démarrage du worker de migration PHP:', error);
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