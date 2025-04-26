import { Worker, NativeConnection } from @temporalio/workerstructure-agent';
import * as activities from ./activitiesstructure-agent';

/**
 * This is the main entry point for the Temporal worker
 * It connects to the Temporal server and registers the workflows and activities
 */
async function run() {
  try {
    console.log('Starting Temporal worker...');
    
    // Créer la connexion au serveur Temporal en utilisant le nom du service dans docker-compose
    const connection = await NativeConnection.connect({
      address: 'temporal-server:7233',
    });
    
    const worker = await Worker.create({
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue: DoDotmcp-task-queue',
      connection,
    });

    // Start accepting tasks
    await worker.run();
    console.log('Worker started successfully');
  } catch (error) {
    console.error('Error starting worker:', error);
    process.exit(1);
  }
}

// Run the worker
run().catch((err) => {
  console.error('Error in worker:', err);
  process.exit(1);
});
