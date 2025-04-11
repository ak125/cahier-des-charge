#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Vérifier si fetch est disponible nativement ou importer un polyfill
let fetch;
try {
  fetch = global.fetch;
} catch (e) {
  // Pour Node.js < v18, utiliser un polyfill
  const nodeFetch = require('node-fetch');
  fetch = nodeFetch;
  if (!fetch) {
    console.error("❌ Erreur: fetch n'est pas disponible. Pour Node.js < v18, installez node-fetch avec: npm install node-fetch");
    console.error("Vous pouvez également passer à Node.js v18+ qui a fetch intégré nativement.");
    process.exit(1);
  }
}

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_API_URL = process.env.N8N_API_URL || `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}`;
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const N8N_EMAIL = process.env.N8N_EMAIL || 'automecanik.seo@gmail.com';
const N8N_PASSWORD = process.env.N8N_PASSWORD || '63@Amg2025';

// Variables globales
let sessionCookie = null;

// Chemins des dossiers d'agents
const AGENT_PATHS = {
  migration: path.resolve(__dirname, 'agents/migration'),
  analysis: path.resolve(__dirname, 'agents/analysis'),
  core: path.resolve(__dirname, 'agents/core'),
  quality: path.resolve(__dirname, 'agents/quality')
};

// Fonction pour faire une requête HTTP
async function makeRequest(method, endpoint, data = null, apiKey = null) {
  const url = `${N8N_API_URL}${endpoint}`;
  console.log(`🔄 Requête ${method} vers ${url}`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (apiKey) {
    headers['X-N8N-API-KEY'] = apiKey;
  }
  
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include'
    });
    
    // Capturer le cookie de session si présent
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie;
    }
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`Erreur HTTP ${error.message}`);
    throw error;
  }
}

// Fonction pour s'authentifier à n8n
async function authenticate() {
  try {
    console.log('🔑 Tentative d\'authentification auprès de n8n...');
    
    // Vérifier si l'authentification est désactivée
    try {
      console.log('🔍 Vérification si l\'authentification est désactivée...');
      // Tester si on peut accéder aux workflows sans authentification
      const testResponse = await makeRequest('GET', '/api/v1/workflows');
      console.log('✅ Authentification désactivée, accès direct autorisé');
      return { type: 'none', token: null };
    } catch (noAuthError) {
      console.log('⚠️ L\'authentification est activée, essai d\'autres méthodes...');
    }
    
    // Essayer d'utiliser la clé API si fournie
    if (N8N_API_KEY) {
      console.log('🔑 Utilisation de la clé API fournie');
      // Tester la validité de la clé API avec une requête
      try {
        await makeRequest('GET', '/api/v1/workflows', null, N8N_API_KEY);
        console.log('✅ Clé API valide');
        return { type: 'apiKey', token: N8N_API_KEY };
      } catch (apiError) {
        console.warn(`⚠️ La clé API ne semble pas fonctionner: ${apiError.message}`);
        console.log('🔄 Essai d\'authentification par identifiants...');
      }
    }
    
    // Essayer plusieurs endpoints d'authentification (différentes versions de n8n)
    const authEndpoints = [
      { version: 'v1.88.0+', path: '/api/v1/auth/login' },
      { version: 'v0.214.0+', path: '/api/v1/login' },
      { version: 'Ancienne', path: '/rest/login' }
    ];
    
    const loginData = {
      email: N8N_EMAIL,
      password: N8N_PASSWORD
    };
    
    for (const endpoint of authEndpoints) {
      try {
        console.log(`🔑 Tentative d'authentification avec n8n ${endpoint.version}...`);
        const authResponse = await makeRequest('POST', endpoint.path, loginData);
        
        if (authResponse && authResponse.token) {
          console.log(`✅ Authentification réussie avec n8n ${endpoint.version} (JWT)`);
          return { type: 'jwt', token: authResponse.token };
        }
        
        if (sessionCookie) {
          console.log(`✅ Authentification réussie avec n8n ${endpoint.version} (Cookie)`);
          return { type: 'cookie', token: sessionCookie };
        }
      } catch (error) {
        console.warn(`⚠️ Échec de l'authentification n8n ${endpoint.version}: ${error.message}`);
      }
    }
    
    // Essayer le endpoint de la dernière version
    try {
      console.log('🔑 Tentative d\'authentification avec n8n dernière version...');
      const authResponse = await makeRequest('POST', '/api/v1/users/login', loginData);
      
      if (authResponse && authResponse.token) {
        console.log('✅ Authentification réussie avec n8n dernière version (JWT)');
        return { type: 'jwt', token: authResponse.token };
      }
      
      if (sessionCookie) {
        console.log('✅ Authentification réussie avec n8n dernière version (Cookie)');
        return { type: 'cookie', token: sessionCookie };
      }
    } catch (error) {
      console.warn(`⚠️ Échec de l'authentification n8n dernière version: ${error.message}`);
    }
    
    // Si un cookie est disponible, l'utiliser comme dernier recours
    if (sessionCookie) {
      console.log('✅ Cookie de session disponible, utilisation comme authentification');
      return { type: 'cookie', token: sessionCookie };
    }
    
    throw new Error('Échec de l\'authentification : aucune méthode n\'a fonctionné. Assurez-vous que n8n est configuré correctement et qu\'une clé API valide est fournie.');
  } catch (error) {
    console.error(`❌ Erreur d'authentification: ${error.message}`);
    throw error;
  }
}

// Vérification et authentification à n8n
async function authenticateToN8n() {
  try {
    console.log("🔍 Vérification de l'accessibilité de l'API n8n...");
    
    // Vérifier si n8n est accessible
    try {
      const healthResponse = await makeRequest('GET', '/healthz');
      console.log(`📊 Statut de santé n8n: ${JSON.stringify(healthResponse)}`);
      console.log("✅ API n8n accessible!");
    } catch (error) {
      throw new Error(`n8n ne semble pas être en fonctionnement: ${error.message}`);
    }
    
    console.log("🔑 Tentative d'authentification auprès de n8n...");
    
    // Méthode 1: Essayer avec la clé API si fournie
    if (N8N_API_KEY) {
      console.log("🔑 Utilisation de la clé API fournie");
      try {
        await makeRequest('GET', '/api/v1/workflows', null, N8N_API_KEY);
        console.log("✅ Authentification par clé API réussie!");
        return N8N_API_KEY;
      } catch (error) {
        console.warn(`⚠️ La clé API ne semble pas fonctionner: ${error.message}`);
      }
    }
    
    // Méthode 2: Essayer avec l'authentification sans clé (si N8N_BASIC_AUTH_ACTIVE=false dans la config)
    try {
      console.log("🔑 Tentative d'accès sans authentification (si N8N_BASIC_AUTH_ACTIVE=false)");
      const response = await makeRequest('GET', '/api/v1/workflows');
      console.log("✅ Accès sans authentification réussi! Le serveur n8n ne nécessite pas d'authentification.");
      return null; // Aucune clé n'est nécessaire
    } catch (noAuthError) {
      console.warn(`⚠️ L'accès sans authentification a échoué: ${noAuthError.message}`);
    }
    
    console.log("🔄 Essai d'authentification par identifiants...");
    
    // Méthode 3: Pour n8n v1.88.0+, utiliser l'API REST 
    try {
      console.log("🔑 Tentative d'authentification avec n8n v1.88.0+...");
      const authData = {
        email: N8N_EMAIL,
        password: N8N_PASSWORD
      };
      
      // Essayer d'abord l'endpoint moderne
      try {
        const loginResponse = await makeRequest('POST', '/api/v1/auth/login', authData);
        console.log("✅ Authentification n8n v1.88.0+ réussie!");
        
        // À partir de n8n 1.0, une clé API est générée et renvoyée lors de la connexion
        if (loginResponse && loginResponse.data && loginResponse.data.apiKey) {
          console.log("🔑 Clé API récupérée du login");
          return loginResponse.data.apiKey;
        }
        
        return true; // Authentifié par cookie de session
      } catch (error) {
        if (error.message.includes('404')) {
          console.warn(`⚠️ Échec de l'authentification n8n v1.88.0+: ${error.message}`);
        } else {
          throw error; // Rethrow en cas d'erreur autre que 404
        }
      }
      
      // Tentative avec l'ancien endpoint pour les versions antérieures
      try {
        const loginResponse = await makeRequest('POST', '/rest/login', { email: N8N_EMAIL, password: N8N_PASSWORD });
        console.log("✅ Authentification n8n (version antérieure) réussie!");
        return true; // Authentifié par cookie de session
      } catch (oldLoginError) {
        console.warn(`⚠️ Échec de l'authentification (version antérieure): ${oldLoginError.message}`);
      }
      
    } catch (authError) {
      console.warn(`⚠️ Toutes les méthodes d'authentification ont échoué: ${authError.message}`);
    }
    
    // Si on arrive ici, rien n'a fonctionné
    throw new Error("Échec de l'authentification : aucune méthode n'a fonctionné. Assurez-vous que n8n est configuré correctement et qu'une clé API valide est fournie.");
  } catch (error) {
    throw new Error(`Échec de l'authentification : ${error.message}`);
  }
}

// Fonction pour vérifier l'accessibilité de n8n
async function checkN8nAccess() {
  try {
    console.log('🔍 Vérification de l\'accessibilité de l\'API n8n...');
    const healthData = await makeRequest('GET', '/healthz');
    console.log(`📊 Statut de santé n8n: ${JSON.stringify(healthData)}`);
    
    if (healthData && healthData.status === 'ok') {
      console.log('✅ API n8n accessible!');
      await authenticateToN8n();
      return true;
    } else {
      throw new Error(`État de santé n8n inattendu: ${JSON.stringify(healthData)}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de l'accès à n8n: ${error.message}`);
    throw error;
  }
}

// Fonction pour lire le contenu d'un fichier agent TypeScript
function readAgentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const type = path.dirname(filePath).includes('migration') ? 'migration' : 
                path.dirname(filePath).includes('analysis') ? 'analysis' : 
                path.dirname(filePath).includes('quality') ? 'quality' : 'core';
    
    console.log(`📄 Lecture de l'agent ${fileName} (type: ${type})`);
    
    return {
      name: fileName,
      type,
      content,
      filePath
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
    return null;
  }
}

// Fonction pour convertir un agent en nœud n8n
function convertAgentToN8nNode(agent) {
  try {
    const name = agent.name.replace('.ts', '');
    console.log(`🔄 Conversion de l'agent ${name} en nœud n8n`);
    
    // Extraire les paramètres et la description de l'agent
    const description = agent.content.match(/\/\*\*([\s\S]*?)\*\//)?.[1]?.trim() || `Agent ${name}`;
    
    // Vérifier si l'agent a la structure attendue
    if (!agent.content.includes('class') && !agent.content.includes('function')) {
      console.warn(`⚠️ Structure de nœud incomplète pour ${name}`);
    }
    
    // Créer le nœud n8n
    return {
      displayName: name,
      name: `agent_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      type: 'n8n-nodes-base.function',
      parameters: {
        functionCode: agent.content,
        description: description
      },
      typeVersion: 1,
      position: [0, 0]
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la conversion de l'agent ${agent.name}: ${error.message}`);
    return null;
  }
}

// Fonction pour créer un workflow n8n à partir d'un agent
function createAgentWorkflow(agent, node) {
  try {
    const name = agent.name.replace('.ts', '');
    console.log(`📝 Création du workflow pour l'agent ${name}`);
    
    return {
      name: `Agent: ${name}`,
      nodes: [
        {
          ...node,
          position: [280, 300]
        },
        {
          id: 'start',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          typeVersion: 1,
          position: [100, 300]
        }
      ],
      connections: {
        Start: {
          main: [
            [
              {
                node: node.name,
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      },
      active: false,
      settings: {},
      tags: [agent.type, 'agent'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la création du workflow pour l'agent ${agent.name}: ${error.message}`);
    return null;
  }
}

// Fonction pour créer un pipeline intégrant tous les agents
function createPipeline(agents, nodes) {
  try {
    console.log('🔄 Création du pipeline de migration complet');
    
    // Trier les agents par type
    const migrationAgents = agents.filter(a => a.type === 'migration');
    const analysisAgents = agents.filter(a => a.type === 'analysis');
    const coreAgents = agents.filter(a => a.type === 'core');
    const qualityAgents = agents.filter(a => a.type === 'quality');
    
    // Créer les nœuds pour le pipeline
    const pipelineNodes = [];
    const connections = {};
    
    // Nœud de début
    pipelineNodes.push({
      id: 'start',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      typeVersion: 1,
      position: [100, 300]
    });
    
    // Ajouter les agents dans l'ordre: core -> analysis -> migration -> quality
    let xPosition = 300;
    const yPosition = 300;
    let previousNodeName = 'Start';
    
    // Fonction pour ajouter un groupe d'agents
    const addAgentGroup = (agentList, groupName, startY) => {
      if (agentList.length === 0) return previousNodeName;
      
      console.log(`📝 Ajout du groupe d'agents ${groupName} au pipeline`);
      
      // Ajouter un nœud de groupe si nécessaire
      const groupNodeName = `${groupName}Group`;
      pipelineNodes.push({
        name: groupNodeName,
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [xPosition, startY - 100]
      });
      
      // Connecter le groupe au nœud précédent
      connections[previousNodeName] = {
        main: [
          [
            {
              node: groupNodeName,
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      
      // Ajouter les agents du groupe
      let lastNodeName = groupNodeName;
      agentList.forEach((agent, index) => {
        const node = nodes.find(n => n.displayName === agent.name.replace('.ts', ''));
        if (node) {
          const nodeName = node.name;
          pipelineNodes.push({
            ...node,
            position: [xPosition, startY + index * 150]
          });
          
          // Connecter au nœud précédent
          connections[lastNodeName] = {
            main: [
              [
                {
                  node: nodeName,
                  type: 'main',
                  index: 0
                }
              ]
            ]
          };
          
          lastNodeName = nodeName;
        }
      });
      
      xPosition += 400;
      return lastNodeName;
    };
    
    // Ajouter les groupes d'agents dans l'ordre
    previousNodeName = addAgentGroup(coreAgents, 'Core', yPosition);
    previousNodeName = addAgentGroup(analysisAgents, 'Analysis', yPosition);
    previousNodeName = addAgentGroup(migrationAgents, 'Migration', yPosition);
    previousNodeName = addAgentGroup(qualityAgents, 'Quality', yPosition);
    
    // Créer le workflow de pipeline
    return {
      name: 'Pipeline de Migration Complet',
      nodes: pipelineNodes,
      connections,
      active: false,
      settings: {},
      tags: ['pipeline', 'migration'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la création du pipeline: ${error.message}`);
    return null;
  }
}

// Fonction pour créer un workflow dans n8n
async function createWorkflow(workflow, authToken) {
  try {
    console.log(`🔄 Création du workflow: ${workflow.name}`);
    
    // Préparation des données du workflow
    const workflowData = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      active: workflow.active,
      settings: workflow.settings,
      tags: workflow.tags
    };
    
    // Utiliser le type d'authentification plutôt que de vérifier '='
    const isApiKey = authToken.type === 'apiKey';
    const response = await makeRequest(
      'POST', 
      '/api/v1/workflows', 
      workflowData, 
      isApiKey ? authToken.token : null, 
      !isApiKey ? authToken.token : null
    );
    
    console.log(`✅ Workflow ${workflow.name} créé avec l'ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur lors de la création du workflow ${workflow.name}: ${error.message}`);
    return null;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Démarrage de l\'importation des agents dans n8n...');
    
    // Vérifier l'accès à n8n et s'authentifier
    const authToken = await checkN8nAccess();
    
    // Lire les agents depuis les dossiers
    const agents = [];
    for (const [type, dirPath] of Object.entries(AGENT_PATHS)) {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
                       .filter(f => f.endsWith('.ts'))
                       .map(f => path.join(dirPath, f));
        
        for (const file of files) {
          const agent = readAgentFile(file);
          if (agent) {
            agents.push(agent);
          }
        }
      } else {
        console.log(`⚠️ Répertoire ${dirPath} non trouvé`);
      }
    }
    
    console.log(`📁 ${agents.length} agents trouvés`);
    
    // Convertir les agents en nœuds n8n
    const n8nNodes = agents.map(agent => convertAgentToN8nNode(agent)).filter(Boolean);
    
    console.log(`🔧 ${n8nNodes.length} nœuds n8n créés`);
    
    // Créer un workflow pour chaque agent
    const agentWorkflows = agents.map(agent => {
      const node = n8nNodes.find(n => n.displayName === agent.name.replace('.ts', ''));
      return createAgentWorkflow(agent, node);
    });
    
    console.log(`📝 ${agentWorkflows.length} workflows d'agents créés`);
    
    // Créer un pipeline intégrant tous les agents
    const pipeline = createPipeline(agents, n8nNodes);
    
    console.log('🔄 Pipeline complet créé');
    
    // Télécharger les workflows sur n8n
    console.log('🔄 Téléchargement des workflows sur n8n...');
    
    const createdWorkflows = [];
    
    // Créer les workflows des agents
    for (const workflow of agentWorkflows) {
      const result = await createWorkflow(workflow, authToken);
      if (result) {
        createdWorkflows.push(result);
      }
    }
    
    // Créer le pipeline
    const pipelineResult = await createWorkflow(pipeline, authToken);
    
    if (pipelineResult) {
      createdWorkflows.push(pipelineResult);
    }
    
    console.log(`✅ ${createdWorkflows.length} workflows créés dans n8n`);
    console.log('✅ Importation terminée');
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'importation des agents: ${error.message}`);
    process.exit(1);
  }
}

// Démarrer le script
main();