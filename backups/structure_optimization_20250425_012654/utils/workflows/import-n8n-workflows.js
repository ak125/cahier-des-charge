const fs = require(fsstructure-agent');
const path = require(pathstructure-agent');
const axios = require(axiosstructure-agent');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_USER = process.env.N8N_BASIC_AUTH_USER || 'admin@example.com';  // Email au lieu du nom
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD || 'cahier-des-charges-migrator';
const API_KEY = process.env.N8N_API_KEY || '';  // Pour l'authentification par API key si configurée

const n8nUrl = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}`;

// Fonction pour obtenir un jeton d'authentification
async function getAuthToken() {
  try {
    // Essayer d'authentifier via le endpoint /login
    const loginResponse = await axios.post(`${n8nUrl}/api/login`, {
      email: N8N_USER,
      password: N8N_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      console.log('✅ Authentification réussie via /api/login');
      return { type: 'Bearer', token: loginResponse.data.token };
    }
  } catch (loginError) {
    console.log('⚠️ Impossible de s\'authentifier via /api/login:', loginError.message);
    
    try {
      // Essayer l'authentification via /rest/login comme alternative
      const restLoginResponse = await axios.post(`${n8nUrl}/rest/login`, {
        email: N8N_USER,
        password: N8N_PASSWORD
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (restLoginResponse.data && restLoginResponse.data.token) {
        console.log('✅ Authentification réussie via /rest/login');
        return { type: 'Bearer', token: restLoginResponse.data.token };
      }
    } catch (restLoginError) {
      console.log('⚠️ Impossible de s\'authentifier via /rest/login:', restLoginError.message);
    }
  }
  
  // Si aucune des tentatives précédentes n'a fonctionné, utiliser l'authentification basique
  console.log('⚠️ Tentative avec authentification basique comme fallback');
  const authString = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');
  return { type: 'Basic', token: authString };
}

// Lire le fichier principal des workflows
async function importWorkflows() {
  console.log('📥 Importation des workflows n8n...');
  
  try {
    // Obtenir le jeton d'authentification
    const auth = await getAuthToken();
    
    // Lire le fichier principal des workflows
    const mainPipelinePath = path.resolve(__dirname, '../../n8n.pipeline.json');
    const configDir = path.resolve(__dirname, '../../config');
    
    if (fs.existsSync(mainPipelinePath)) {
      console.log(`Importation du pipeline principal: ${mainPipelinePath}`);
      const pipelineData = JSON.parse(fs.readFileSync(mainPipelinePath, 'utf8'));
      
      // Importer chaque workflow
      if (pipelineData.workflows && Array.isArray(pipelineData.workflows)) {
        for (const workflow of pipelineData.workflows) {
          await importWorkflow(workflow, 'pipeline principal', auth);
        }
      }
    }
    
    // Vérifier si le dossier config existe
    if (fs.existsSync(configDir)) {
      // Lire les fichiers de workflow dans le dossier config
      const n8nConfigFiles = fs.readdirSync(configDir)
        .filter(file => file.includes('.n8n.') && file.endsWith('.json'));
      
      for (const configFile of n8nConfigFiles) {
        const filePath = path.join(configDir, configFile);
        console.log(`Importation du workflow de configuration: ${filePath}`);
        
        try {
          const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          await importWorkflow(workflowData, configFile, auth);
        } catch (err) {
          console.error(`❌ Erreur lors de la lecture/importation du fichier ${configFile}:`, err.message);
        }
      }
    } else {
      console.log('⚠️ Répertoire config/ non trouvé, ignoré');
    }
    
    console.log('✅ Importation des workflows terminée!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation des workflows:', error.message);
    if (error.response) {
      console.error('Détails de la réponse:', error.response.data);
    }
    process.exit(1);
  }
}

// Importer un workflow dans n8n
async function importWorkflow(workflow, source, auth) {
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
    
    // Choisir le endpoint approprié selon la version de n8n
    let endpoint = `${n8nUrl}/rest/workflows`;
    
    // Essayer d'abord avec le nouvel endpoint
    try {
      const response = await axios.post(endpoint, apiData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${auth.type} ${auth.token}`
        }
      });
      
      console.log(`✅ Workflow "${workflowName}" importé avec succès!`);
      return;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Si 404, essayer avec l'ancien endpoint
        endpoint = `${n8nUrl}/workflows`;
        console.log(`⚠️ Endpoint /rest/workflows non trouvé, essai avec ${endpoint}`);
      } else {
        throw error;
      }
    }
    
    // Essayer avec l'ancien endpoint si nécessaire
    const response = await axios.post(endpoint, apiData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${auth.type} ${auth.token}`
      }
    });
    
    console.log(`✅ Workflow "${workflowName}" importé avec succès!`);
  } catch (error) {
    if (error.response) {
      if (error.response.status === 409) {
        console.warn(`⚠️ Le workflow "${workflow.name || 'sans nom'}" existe déjà dans n8n.`);
      } else {
        console.error(`❌ Erreur lors de l'importation du workflow (${error.response.status}):`, error.message);
        if (error.response.data) {
          console.error('Détails:', JSON.stringify(error.response.data).substring(0, 200));
        }
      }
    } else {
      console.error(`❌ Erreur lors de l'importation du workflow:`, error.message);
    }
  }
}

// Exécuter l'importation
importWorkflows();
