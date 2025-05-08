/**
 * Worker Temporal pour le Pipeline de Migration IA
 * 
 * Ce worker exécute les workflows et activités du pipeline de migration IA
 */

import { Worker } from '@temporalio/worker';
import * as activities from '../activities/ai-pipeline';
import { Connection } from '@temporalio/client';
import { env } from 'process';

// Configuration du worker
const taskQueue = 'ai-pipeline-task-queue';

async function run() {
    console.log('Starting AI Pipeline Temporal Worker...');

    try {
        // Créer une connexion au serveur Temporal
        const connection = await Connection.connect({
            address: env.TEMPORAL_ADDRESS || 'localhost:7233',
        });

        // Créer et démarrer le worker
        const worker = await Worker.create({
            connection,
            workflowsPath: require.resolve('../workflows/ai-pipeline-workflow'),
            activities,
            taskQueue,
        });

        console.log(`Worker connected to Temporal server at ${env.TEMPORAL_ADDRESS || 'localhost:7233'}`);
        console.log(`Registered workflows: ${Object.keys(require('../workflows/ai-pipeline-workflow'))}`);
        console.log(`Registered activities: ${Object.keys(activities)}`);

        await worker.run();

        // Cette ligne ne sera jamais atteinte car worker.run() ne retourne pas
        // sauf en cas d'erreur ou d'arrêt du worker
    } catch (error) {
        console.error(`Worker error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

// Exécuter le worker
run().catch((err) => {
    console.error(`Fatal error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});