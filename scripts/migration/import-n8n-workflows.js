const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_USER = process.env.N8N_BASIC_AUTH_USER || 'admin';
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD || 'cahier-des-charges-migrator';

const n8nUrl = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}`;
const authString = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');

// Lire le fichier principal des workflows
async function importWorkflows() {
  console.log('📥 Importation des workflows n8n...');
  
  try {
    // Lire le fichier principal des workflows
    const mainPipelinePath = path.resolve(__dirname, '../../n8n.pipeline.json');
    const configDir = path.resolve(__dirname, '../../config');
    
    if (fs.existsSync(mainPipelinePath)) {
      console.log(`Importation du pipeline principal: ${mainPipelinePath}`);
      const pipelineData = JSON.parse(fs.readFileSync(mainPipelinePath, 'utf8'));
      
      // Importer chaque workflow
      if (pipelineData.workflows && Array.isArray(pipelineData.workflows)) {
        for (const workflow of pipelineData.workflows) {
          await importWorkflow(workflow, 'pipeline principal');
        }
      }
    }
    
    // Lire les fichiers de workflow dans le dossier config
    const n8nConfigFiles = fs.readdirSync(configDir)
      .filter(file => file.includes('.n8n.') && file.endsWith('.json'));
    
    for (const configFile of n8nConfigFiles) {
      const filePath = path.join(configDir, configFile);
      console.log(`Importation du workflow de configuration: ${filePath}`);
      
      try {
        const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await importWorkflow(workflowData, configFile);
      } catch (err) {
        console.error(`❌ Erreur lors de la lecture/importation du fichier ${configFile}:`, err.message);
      }
    }
    
    console.log('✅ Importation des workflows terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation des workflows:', error.message);
    process.exit(1);
  }
}

// Importer un workflow dans n8n
async function importWorkflow(workflow, source) {
  try {
    const workflowName = workflow.name || (workflow.id ? `Workflow ${workflow.id}` : 'Sans nom');
    console.log(`🔄 Importation du workflow: ${workflowName} depuis ${source}`);
    
    // Préparer les données pour l'API n8n
    const apiData = {
      name: workflowName,
      nodes: workflow.nodes || [],
      connections: workflow.connections || {},
      active: workflow.active || false,
      settings: workflow.settings || {},
      tags: workflow.tags || [],
    };
    
    // Envoyer à l'API n8n
    const response = await axios.post(`${n8nUrl}/rest/workflows`, apiData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      }
    });
    
    if (response.status === 200) {
      console.log(`✅ Workflow "${workflowName}" importé avec succès!`);
    } else {
      console.warn(`⚠️ Importation du workflow "${workflowName}" a retourné un statut inattendu:`, response.status);
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.warn(`⚠️ Le workflow "${workflow.name || 'sans nom'}" existe déjà dans n8n.`);
    } else {
      console.error(`❌ Erreur lors de l'importation du workflow:`, error.message);
    }
  }
}

// Exécuter l'importation
importWorkflows();
