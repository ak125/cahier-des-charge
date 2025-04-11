#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';

// Utilisation d'un token JWT pour l'authentification
const JWT_TOKEN = process.env.N8N_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYTUyMDlhNy00MjZkLTQyODctYjZiNi0yMzAwNWVhZDM0YjkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ0MzI2MzA4fQ.gpWfP0WtHe1ke7OppwbWxvUzAqgCai8ftijuGHu5EJM';

// Fonction pour faire une requête HTTP
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}${endpoint}`;
    console.log(`🔄 Requête ${method} vers ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
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

// Fonction pour vérifier la connectivité avec n8n et l'authentification
async function testConnection() {
  try {
    console.log('🔍 Test de connexion à n8n...');
    // Utilisez l'API /rest/workflows au lieu de /rest/me pour vérifier la connexion
    const result = await makeRequest('GET', '/rest/workflows');
    console.log(`✅ Connexion réussie! ${result.data ? result.data.length : 0} workflows existants trouvés.`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur de connexion à n8n: ${error.message}`);
    console.error('⚠️ Vérifiez que n8n est en cours d\'exécution et que le token JWT est valide.');
    return false;
  }
}

// Fonction pour créer un workflow
async function createWorkflow(workflow) {
  try {
    console.log(`🔄 Importation du workflow: ${workflow.name || workflow.id || 'sans nom'}`);
    
    // Nettoyer et formater les données pour l'API n8n
    const data = {
      name: workflow.name || `Workflow ${workflow.id || new Date().getTime()}`,
      nodes: workflow.nodes || [],
      connections: workflow.connections || {},
      active: workflow.active === true,
      settings: workflow.settings || {},
      tags: workflow.tags || []
    };

    // Vérifier si le workflow existe déjà
    let existingWorkflows;
    try {
      existingWorkflows = await makeRequest('GET', '/rest/workflows');
    } catch (error) {
      console.log(`⚠️ Erreur lors de la récupération des workflows existants: ${error.message}`);
      existingWorkflows = { data: [] };
    }
    
    const existingWorkflow = (existingWorkflows.data || []).find(w => 
      w.name === data.name || (workflow.id && w.name.includes(workflow.id))
    );

    if (existingWorkflow) {
      console.log(`📝 Mise à jour du workflow existant: ${data.name} (ID: ${existingWorkflow.id})`);
      await makeRequest('PUT', `/rest/workflows/${existingWorkflow.id}`, data);
      return { id: existingWorkflow.id, name: data.name };
    } else {
      console.log(`📝 Création d'un nouveau workflow: ${data.name}`);
      const result = await makeRequest('POST', '/rest/workflows', data);
      return { id: result.id, name: data.name };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'importation du workflow ${workflow.name || workflow.id || 'sans nom'}: ${error.message}`);
    return null;
  }
}

// Fonction pour nettoyer un fichier JSON malformé
function cleanJsonFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Tentative de parse
    try {
      JSON.parse(content);
      return true; // Le fichier est déjà valide
    } catch (e) {
      console.log(`⚠️ Fichier JSON malformé détecté: ${filePath}`);
      console.log(`   Erreur: ${e.message}`);
      
      // Tentative de nettoyage basique
      try {
        // Supprimer les caractères non-imprimables
        content = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        
        // Vérifier et fermer les accolades/crochets manquants
        let openBraces = (content.match(/{/g) || []).length;
        let closeBraces = (content.match(/}/g) || []).length;
        let openBrackets = (content.match(/\[/g) || []).length;
        let closeBrackets = (content.match(/\]/g) || []).length;
        
        while (openBraces > closeBraces) {
          content += '}';
          closeBraces++;
        }
        
        while (openBrackets > closeBrackets) {
          content += ']';
          closeBrackets++;
        }
        
        // Teste si le JSON est valide après nettoyage
        JSON.parse(content);
        
        // Sauvegarde du fichier nettoyé
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fichier JSON nettoyé et sauvegardé: ${filePath}`);
        return true;
      } catch (e2) {
        console.error(`❌ Impossible de corriger le fichier JSON: ${e2.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('📥 Importation des workflows dans n8n...');
    
    // Tester la connexion à n8n
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Impossible de se connecter à n8n. Vérifiez la connexion et les identifiants.');
      process.exit(1);
    }
    
    // Lire le fichier principal du pipeline
    const pipelineFile = path.resolve(__dirname, 'n8n.pipeline.clean.json');
    if (!fs.existsSync(pipelineFile)) {
      throw new Error(`Fichier ${pipelineFile} non trouvé`);
    }
    
    // Nettoyer le fichier JSON si nécessaire
    if (!cleanJsonFile(pipelineFile)) {
      throw new Error(`Impossible de nettoyer le fichier ${pipelineFile}`);
    }
    
    const pipelineData = JSON.parse(fs.readFileSync(pipelineFile, 'utf8'));
    
    // Importer les workflows du pipeline principal
    const importedWorkflows = [];
    if (pipelineData.workflows && Array.isArray(pipelineData.workflows)) {
      console.log(`📊 ${pipelineData.workflows.length} workflows trouvés dans le fichier pipeline`);
      for (const workflow of pipelineData.workflows) {
        const result = await createWorkflow(workflow);
        if (result) {
          importedWorkflows.push(result);
        }
      }
    } else {
      console.log('⚠️ Aucun workflow trouvé dans le fichier pipeline ou format incorrect');
    }
    
    // Lire et importer les workflows depuis le dossier workflows
    const workflowsDir = path.resolve(__dirname, 'workflows');
    if (fs.existsSync(workflowsDir)) {
      const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.json'));
      console.log(`📊 ${files.length} fichiers de workflow trouvés dans le dossier ${workflowsDir}`);
      
      for (const file of files) {
        const filePath = path.join(workflowsDir, file);
        console.log(`🔄 Traitement du fichier workflow: ${filePath}`);
        
        // Nettoyer le fichier JSON si nécessaire
        if (!cleanJsonFile(filePath)) {
          console.error(`⚠️ Ignoré fichier workflow invalide: ${file}`);
          continue;
        }
        
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
    } else {
      console.log(`⚠️ Répertoire ${workflowsDir} non trouvé`);
    }
    
    // Importer les workflows de configuration
    const configDir = path.resolve(__dirname, 'config');
    if (fs.existsSync(configDir)) {
      const files = fs.readdirSync(configDir).filter(f => f.endsWith('.json') && f.includes('n8n'));
      console.log(`📊 ${files.length} fichiers de configuration n8n trouvés dans le dossier ${configDir}`);
      
      for (const file of files) {
        const filePath = path.join(configDir, file);
        console.log(`🔄 Traitement du fichier config workflow: ${filePath}`);
        
        // Nettoyer le fichier JSON si nécessaire
        if (!cleanJsonFile(filePath)) {
          console.error(`⚠️ Ignoré fichier config workflow invalide: ${file}`);
          continue;
        }
        
        try {
          const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          // Gérer différents formats possibles
          if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
            // C'est déjà un format de workflow
            const result = await createWorkflow(workflowData);
            if (result) {
              importedWorkflows.push(result);
            }
          } else if (workflowData.workflows && Array.isArray(workflowData.workflows)) {
            // C'est un tableau de workflows
            for (const workflow of workflowData.workflows) {
              const result = await createWorkflow(workflow);
              if (result) {
                importedWorkflows.push(result);
              }
            }
          } else if (workflowData.data && workflowData.data.workflows) {
            // Format d'exportation n8n
            for (const workflow of workflowData.data.workflows) {
              const result = await createWorkflow(workflow);
              if (result) {
                importedWorkflows.push(result);
              }
            }
          } else {
            console.warn(`⚠️ Format inconnu dans ${file}, tentative d'importation directe...`);
            const result = await createWorkflow(workflowData);
            if (result) {
              importedWorkflows.push(result);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur lors du traitement du fichier ${file}: ${error.message}`);
        }
      }
    } else {
      console.log(`⚠️ Répertoire ${configDir} non trouvé`);
    }
    
    console.log('✅ Importation des workflows terminée');
    console.log(`📊 ${importedWorkflows.length} workflows importés:`);
    importedWorkflows.forEach(w => console.log(`   - ${w.name} (ID: ${w.id})`));
    
    // Écrire les IDs des workflows dans un fichier pour référence future
    fs.writeFileSync('workflow-ids.json', JSON.stringify(importedWorkflows, null, 2));
    
    console.log('✅ IDs des workflows sauvegardés dans workflow-ids.json');
    
    return importedWorkflows;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main();