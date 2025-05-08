#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_USER = process.env.N8N_USER || 'admin';
const N8N_PASSWORD = process.env.N8N_PASSWORD || 'cahier-des-charges-migrator';
const AUTH_STRING = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');

// Fonction pour faire une requête HTTP
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${AUTH_STRING}`,
      },
    };

    const req = (N8N_PROTOCOL === 'https' ? https : http).request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (_e) {
            resolve(responseData);
          }
        } else {
          console.log(`Erreur HTTP ${res.statusCode}: ${responseData}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }

    req.end();
  });
}

// Fonction pour créer un workflow
async function createWorkflow(workflow) {
  try {
    console.log(`🔄 Importation du workflow: ${workflow.name || workflow.id}`);

    // Formater les données pour l'API n8n
    const data = {
      name: workflow.name || `Workflow ${workflow.id}`,
      nodes: workflow.nodes || [],
      connections: workflow.connections || {},
      active: workflow.active === true,
      settings: workflow.settings || {},
      tags: workflow.tags || [],
    };

    // Vérifier si le workflow existe déjà
    let existingWorkflows;
    try {
      existingWorkflows = await makeRequest('GET', '/rest/workflows');
    } catch (error) {
      console.log(`⚠️ Erreur lors de la récupération des workflows existants: ${error.message}`);
      existingWorkflows = { data: [] };
    }

    const existingWorkflow = (existingWorkflows.data || []).find(
      (w) => w.name === data.name || (workflow.id && w.name.includes(workflow.id))
    );

    if (existingWorkflow) {
      console.log(`📝 Mise à jour du workflow existant: ${data.name}`);
      await makeRequest('PUT', `/rest/workflows/${existingWorkflow.id}`, data);
      return { id: existingWorkflow.id, name: data.name };
    }
    console.log(`📝 Création d'un nouveau workflow: ${data.name}`);
    const result = await makeRequest('POST', '/rest/workflows', data);
    return { id: result.id, name: data.name };
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'importation du workflow ${workflow.name || workflow.id}: ${
        error.message
      }`
    );
    return null;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('📥 Importation des workflows dans n8n...');

    // Lire le fichier principal du pipeline
    const pipelineFile = path.resolve(__dirname, 'n8n.pipeline.clean.json');
    if (!fs.existsSync(pipelineFile)) {
      throw new Error(`Fichier ${pipelineFile} non trouvé`);
    }

    const pipelineData = JSON.parse(fs.readFileSync(pipelineFile, 'utf8'));

    // Importer les workflows du pipeline principal
    const importedWorkflows = [];
    if (pipelineData.workflows && Array.isArray(pipelineData.workflows)) {
      for (const workflow of pipelineData.workflows) {
        const result = await createWorkflow(workflow);
        if (result) {
          importedWorkflows.push(result);
        }
      }
    }

    // Lire et importer les workflows depuis le dossier workflows
    const workflowsDir = path.resolve(__dirname, 'workflows');
    if (fs.existsSync(workflowsDir)) {
      const files = fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(workflowsDir, file);
        console.log(`🔄 Traitement du fichier workflow: ${filePath}`);

        try {
          const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const result = await createWorkflow(workflowData);
          if (result) {
            importedWorkflows.push(result);
          }
        } catch (error) {
          console.error(`❌ Erreur lors du traitement du fichier ${file}: ${error.message}`);
        }
      }
    }

    console.log('✅ Importation des workflows terminée');
    console.log(`📊 ${importedWorkflows.length} workflows importés:`);
    importedWorkflows.forEach((w) => console.log(`   - ${w.name} (ID: ${w.id})`));

    // Écrire les IDs des workflows dans un fichier pour référence future
    fs.writeFileSync('workflow-ids.json', JSON.stringify(importedWorkflows, null, 2));

    return importedWorkflows;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main();
