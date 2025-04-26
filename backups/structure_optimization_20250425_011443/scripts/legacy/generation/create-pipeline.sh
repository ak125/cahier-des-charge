#!/bin/bash
# create-pipeline.sh - Script pour créer et exécuter le pipeline de migration
# Date: 10 avril 2025

echo "🚀 Création du pipeline de migration..."

# Vérifier si n8n est en cours d'exécution
n8n_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678)

if [ "$n8n_status" != "200" ] && [ "$n8n_status" != "401" ]; then
  echo "⚠️ n8n ne semble pas être en cours d'exécution (code HTTP: $n8n_status)"
  echo "🔄 Démarrage de n8n..."
  
  # Vérifier si docker-compose.n8n.yml existe
  if [ ! -f "docker-compose.n8n.yml" ]; then
    echo "❌ Le fichier docker-compose.n8n.yml n'existe pas. Création d'un fichier par défaut..."
    
    cat > docker-compose.n8n.yml << 'EOF'
version: '3'

services:
  n8n:
    image: n8nio/n8n:0.236.0
    container_name: migration-n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=cahier-des-charges-migrator
      - N8N_HOST=${N8N_HOST:-localhost}
      - N8N_PORT=${N8N_PORT:-5678}
      - N8N_PROTOCOL=${N8N_PROTOCOL:-http}
      - NODE_ENV=production
      - WEBHOOK_URL=http://${N8N_HOST:-localhost}:${N8N_PORT:-5678}/
      - EXECUTIONS_PROCESS=main
      - DB_TYPE=sqlite
      - DB_SQLITE_PATH=/tmp/n8n.db
      - N8N_PUSH_BACKEND=websocket
      - N8N_LOG_LEVEL=debug
      - NODE_TLS_REJECT_UNAUTHORIZED=0
      - GENERIC_TIMEZONE=Europe/Paris
      - N8N_SKIP_OWNERSHIP_CHECK=true
      - N8N_USER_FOLDER=/tmp/n8n
    command: n8n start
EOF
  fi
  
  # Démarrer n8n
  docker-compose -f docker-compose.n8n.yml down 2>/dev/null
  docker-compose -f docker-compose.n8n.yml up -d
  
  # Attendre que n8n soit prêt
  echo "⏳ Attente du démarrage de n8n..."
  attempts=0
  max_attempts=30
  
  while [ $attempts -lt $max_attempts ]; do
    status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678)
    if [ "$status" = "200" ] || [ "$status" = "401" ]; then
      echo "✅ n8n est prêt!"
      break
    fi
    
    attempts=$((attempts+1))
    echo "⏳ Attente de n8n... ($attempts/$max_attempts)"
    sleep 2
  done
  
  if [ $attempts -eq $max_attempts ]; then
    echo "❌ n8n n'a pas démarré dans le temps imparti."
    exit 1
  fi
fi

# Création du dossier reports si nécessaire
mkdir -p reports/analysis
mkdir -p reports/migration
mkdir -p reports/validation

echo "📋 Création des workflows du pipeline..."

# Fonction pour nettoyer le JSON (supprimer les commentaires)
function clean_json {
  local input_file=$1
  local output_file=$2
  
  # Supprimer les commentaires de type //
  sed -e 's|//.*$||g' "$input_file" | \
  # Supprimer les commentaires multi-lignes /* */
  sed -e 's|/\*.*\*/||g' | \
  # Supprimer les lignes vides
  grep -v '^[[:space:]]*$' > "$output_file"
  
  # Vérifier que le JSON est valide
  if ! jq . "$output_file" > /dev/null 2>&1; then
    echo "⚠️ Le fichier $output_file contient du JSON invalide. Correction..."
    # Si jq échoue, essayer une approche plus simple
    cat "$input_file" | grep -v '//' > "$output_file"
  fi
}

# Nettoyer le fichier n8n.pipeline.json
clean_json "n8n.pipeline.json" "n8n.pipeline.clean.json"

# Récupérer les workflows depuis les fichiers config/*.n8n.json
config_files=$(find config -name "*.n8n.json" -type f)
for config_file in $config_files; do
  filename=$(basename "$config_file")
  output_file="workflows/${filename%.n8n.json}.json"
  mkdir -p workflows
  
  echo "🔄 Traitement du fichier $config_file..."
  clean_json "$config_file" "$output_file"
done

# Créer un script Node.js pour importer les workflows dans n8n
cat > import-workflows.js << 'EOF'
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
      console.log(`📝 Mise à jour du workflow existant: ${data.name}`);
      await makeRequest('PUT', `/rest/workflows/${existingWorkflow.id}`, data);
      return { id: existingWorkflow.id, name: data.name };
    } else {
      console.log(`📝 Création d'un nouveau workflow: ${data.name}`);
      const result = await makeRequest('POST', '/rest/workflows', data);
      return { id: result.id, name: data.name };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'importation du workflow ${workflow.name || workflow.id}: ${error.message}`);
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
      const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.json'));
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
    importedWorkflows.forEach(w => console.log(`   - ${w.name} (ID: ${w.id})`));
    
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
EOF

# Rendre le script exécutable
chmod +x import-workflows.js

# Exécuter le script d'importation des workflows
echo "📥 Importation des workflows dans n8n..."
node import-workflows.js

# Vérifier si l'importation a réussi
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de l'importation des workflows dans n8n."
  exit 1
fi

# Créer un script pour exécuter le pipeline de migration
cat > run-pipeline.js << 'EOF'
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
EOF

# Rendre le script exécutable
chmod +x run-pipeline.js

echo "🚀 Exécution du pipeline de migration..."
node run-pipeline.js

echo "✅ Pipeline de migration terminé!"