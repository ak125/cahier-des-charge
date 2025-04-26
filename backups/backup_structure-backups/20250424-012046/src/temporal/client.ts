import { Client } from @temporalio/clientstructure-agent';

/**
 * Client Temporal pour soumettre des workflows
 * 
 * Ce script permet de soumettre des workflows au worker Temporal
 */
async function run() {
  try {
    console.log('Connexion au serveur Temporal...');
    
    // Connexion au serveur Temporal
    const client = new Client({
      connection: {
        address: 'temporal-server:7233',
      },
    });
    
    // Démarrer le workflow
    const sourceDir = process.argv[2] || '/default/source/dir';
    const workflowType = process.argv[3] || 'codeTransformationWorkflow';
    
    console.log(`Démarrage du workflow ${workflowType} pour le dossier ${sourceDir}`);
    
    const handle = await client.workflow.start(workflowType, {
      args: [sourceDir],
      taskQueue: DoDotmcp-task-queue',
      workflowId: `${workflowType}-${Date.now()}`,
    });
    
    console.log(`Workflow démarré avec ID: ${handle.workflowId}`);
    console.log('En attente du résultat...');
    
    // Attendre le résultat
    const result = await handle.result();
    console.log('Résultat du workflow:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du workflow:', error);
    process.exit(1);
  }
}

// Exécuter le client
run().catch((err) => {
  console.error('Erreur dans le client:', err);
  process.exit(1);
});