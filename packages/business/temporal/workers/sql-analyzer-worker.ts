/**
 * Worker Temporal pour SQL Analyzer & Prisma Builder
 * 
 * Ce worker exécute les activités du workflow SQL Analyzer & Prisma Builder
 * qui remplace le workflow n8n "SQL Analyzer & Prisma Builder Workflow"
 */

import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from '../activities/sql-analyzer-activities';

/**
 * Démarre le worker Temporal pour le SQL Analyzer
 */
async function runWorker() {
    // Se connecter au serveur Temporal
    const connection = await NativeConnection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    // Créer un worker pour la file d'attente SQL Analyzer
    const worker = await Worker.create({
        connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        taskQueue: 'sql-analyzer-queue',
        workflowsPath: require.resolve('../workflows/sql-analyzer-workflow'),
        activities,
    });

    // Surveiller les erreurs du worker
    worker.on('error', (err) => {
        console.error('Worker error:', err);
    });

    console.log('SQL Analyzer worker connected to Temporal server');
    console.log(`Worker namespace: ${worker.options.namespace}`);
    console.log(`Worker task queue: ${worker.options.taskQueue}`);
    console.log('Workflows registered:', Object.keys(worker.getRegisteredWorkflows()));
    console.log('Activities registered:', Object.keys(activities));

    // Démarrer le worker
    await worker.run();
}

// Exécuter le worker (pour une utilisation directe avec node)
if (require.main === module) {
    runWorker().catch((err) => {
        console.error('Worker failed to start:', err);
        process.exit(1);
    });
}

export default runWorker;