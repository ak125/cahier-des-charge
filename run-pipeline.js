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
        'Authorization': `Basic ${AUTH_STRING}`
      }
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
          } catch (e) {
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

// Exécuter un workflow
async function executeWorkflow(workflowId, runData = {}) {
  try {
    console.log(`🚀 Exécution du workflow (ID: ${workflowId})...`);
    
    const data = {
      workflowData: { id: workflowId },
      runData
    };
    
    const result = await makeRequest('POST', `/rest/workflows/${workflowId}/execute`, data);
    return result;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du workflow: ${error.message}`);
    return null;
  }
}

// Vérifier l'état d'une exécution
async function checkExecutionStatus(executionId) {
  try {
    console.log(`🔍 Vérification de l'état de l'exécution (ID: ${executionId})...`);
    
    const result = await makeRequest('GET', `/rest/executions/${executionId}`);
    return result;
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de l'état: ${error.message}`);
    return null;
  }
}

// Attendre la fin d'une exécution
async function waitForExecution(executionId, timeout = 300000, interval = 5000) {
  console.log(`⏳ Attente de la fin de l'exécution (ID: ${executionId})...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const status = await checkExecutionStatus(executionId);
    
    if (!status) {
      console.warn(`⚠️ Impossible de récupérer l'état de l'exécution ${executionId}`);
      return null;
    }
    
    if (status.finished) {
      console.log(`✅ Exécution ${executionId} terminée avec statut: ${status.status}`);
      return status;
    }
    
    // Attendre avant la prochaine vérification
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  console.warn(`⚠️ Délai d'attente dépassé pour l'exécution ${executionId}`);
  return null;
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Exécution du pipeline de migration...');
    
    // Lire le fichier de configuration de migration
    const configFile = path.resolve(__dirname, 'migration-config.json');
    if (!fs.existsSync(configFile)) {
      throw new Error(`Fichier de configuration ${configFile} non trouvé`);
    }
    
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    
    // Lire les IDs des workflows importés
    const workflowIdsFile = path.resolve(__dirname, 'workflow-ids.json');
    if (!fs.existsSync(workflowIdsFile)) {
      throw new Error(`Fichier des IDs de workflow ${workflowIdsFile} non trouvé`);
    }
    
    const workflowIds = JSON.parse(fs.readFileSync(workflowIdsFile, 'utf8'));
    
    // Exécuter les étapes de migration
    const results = [];
    for (const step of config.migrationSteps) {
      console.log(`\n📋 Étape: ${step.name}`);
      console.log(`   ${step.description}`);
      
      // Déterminer les workflows à exécuter pour cette étape
      const stepWorkflows = [];
      
      // Correspondance basée sur les agents
      for (const agent of step.agents) {
        const matchingWorkflows = workflowIds.filter(w => 
          w.name.toLowerCase().includes(agent.split('/').pop().toLowerCase())
        );
        
        for (const workflow of matchingWorkflows) {
          if (!stepWorkflows.some(w => w.id === workflow.id)) {
            stepWorkflows.push(workflow);
          }
        }
      }
      
      // Si aucun workflow n'est trouvé, utiliser le workflow "php-analyzer" par défaut
      if (stepWorkflows.length === 0) {
        const defaultWorkflow = workflowIds.find(w => 
          w.name.toLowerCase().includes('php') && w.name.toLowerCase().includes('analyzer')
        );
        
        if (defaultWorkflow) {
          stepWorkflows.push(defaultWorkflow);
        }
      }
      
      console.log(`   Workflows à exécuter: ${stepWorkflows.map(w => w.name).join(', ') || 'Aucun'}`);
      
      // Exécuter chaque workflow pour cette étape
      for (const workflow of stepWorkflows) {
        console.log(`\n🔄 Exécution du workflow: ${workflow.name}`);
        
        const runData = {
          step: step.name,
          agents: step.agents,
          sourcePath: config.cahierDesChargesPath || '/workspaces/cahier-des-charge/docs/cahier-des-charges',
          targetPath: config.outputDir || './reports',
          options: {
            parallel: config.parallel || false,
            verbose: config.verbose || false,
            autoFix: config.autoFix || false,
            validateWithCahierDesCharges: config.validateWithCahierDesCharges || true
          }
        };
        
        const execution = await executeWorkflow(workflow.id, runData);
        
        if (execution && execution.executionId) {
          const status = await waitForExecution(execution.executionId);
          results.push({
            step: step.name,
            workflow: workflow.name,
            executionId: execution.executionId,
            status: status ? status.status : 'unknown'
          });
        } else {
          console.warn(`⚠️ L'exécution du workflow ${workflow.name} a échoué`);
          results.push({
            step: step.name,
            workflow: workflow.name,
            status: 'failed_to_start'
          });
        }
      }
    }
    
    // Afficher le résumé
    console.log('\n📊 Résumé du pipeline de migration:');
    for (const result of results) {
      const statusEmoji = result.status === 'success' ? '✅' : 
                         result.status === 'error' ? '❌' : '⚠️';
      
      console.log(`${statusEmoji} Étape: ${result.step}`);
      console.log(`   Workflow: ${result.workflow}`);
      console.log(`   Statut: ${result.status}`);
      if (result.executionId) {
        console.log(`   ID d'exécution: ${result.executionId}`);
        console.log(`   Détails: http://localhost:5678/execution/${result.executionId}`);
      }
      console.log('');
    }
    
    // Écrire les résultats dans un fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFile = `migration-results-${timestamp}.json`;
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
    
    console.log(`✅ Pipeline de migration terminé. Résultats enregistrés dans ${resultFile}`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main();
