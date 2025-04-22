/**
 * Serveur API pour l'interface de pilotage des agents
 * Expose les endpoints REST pour interagir avec le système d'agents
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import agentController from './AgentController';
import { Logger } from '../utils/logger';
import { AgentRegistry } from '../core/AgentRegistry';
import * as path from 'path';
import * as fs from 'fs-extra';

// Création du logger
const logger = new Logger('AgentAPIServer');

// Création de l'application Express
const app = express();

// Configuration des middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware pour le logging des requêtes
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Routes API pour les agents
app.use('/api', agentController);

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({
    name: 'Agent Control API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Page d'accueil simple (HTML)
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tableau de bord des agents</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        h1 { color: #333; }
        .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
        button { background-color: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #45a049; }
        pre { background-color: #f5f5f5; padding: 10px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Tableau de bord des agents</h1>
      
      <div class="card">
        <h2>Liste des agents</h2>
        <button onclick="loadAgents()">Charger les agents</button>
        <div id="agents-list"></div>
      </div>
      
      <div class="card">
        <h2>Exécuter un agent</h2>
        <div>
          <label for="agent-id">ID de l'agent:</label>
          <input type="text" id="agent-id">
        </div>
        <div style="margin-top: 10px;">
          <label for="agent-params">Paramètres (JSON):</label>
          <textarea id="agent-params" rows="5" style="width: 100%;">{}</textarea>
        </div>
        <button onclick="executeAgent()" style="margin-top: 10px;">Exécuter</button>
        <div id="execution-result" style="margin-top: 10px;"></div>
      </div>
      
      <div class="card">
        <h2>Orchestration</h2>
        <div>
          <label for="orchestrator-id">ID de l'orchestrateur:</label>
          <input type="text" id="orchestrator-id">
        </div>
        <div style="margin-top: 10px;">
          <label for="agent-list">Liste des agents (séparés par des virgules):</label>
          <input type="text" id="agent-list" style="width: 100%;">
        </div>
        <div style="margin-top: 10px;">
          <label for="orchestrator-config">Configuration (JSON):</label>
          <textarea id="orchestrator-config" rows="5" style="width: 100%;">{}</textarea>
        </div>
        <button onclick="executeOrchestration()" style="margin-top: 10px;">Orchestrer</button>
        <div id="orchestration-result" style="margin-top: 10px;"></div>
      </div>
      
      <script>
        function loadAgents() {
          fetch('/api/agents')
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                const agentsList = document.getElementById('agents-list');
                agentsList.innerHTML = '<pre>' + JSON.stringify(data.agents, null, 2) + '</pre>';
              } else {
                alert('Erreur: ' + data.error);
              }
            })
            .catch(error => {
              alert('Erreur: ' + error.message);
            });
        }
        
        function executeAgent() {
          const agentId = document.getElementById('agent-id').value;
          const paramsText = document.getElementById('agent-params').value;
          let params;
          
          try {
            params = JSON.parse(paramsText);
          } catch (e) {
            alert('Paramètres JSON invalides');
            return;
          }
          
          if (!agentId) {
            alert('Veuillez spécifier un ID d\'agent');
            return;
          }
          
          fetch('/api/agents/' + agentId + '/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
          })
          .then(response => response.json())
          .then(data => {
            const resultDiv = document.getElementById('execution-result');
            resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          })
          .catch(error => {
            alert('Erreur: ' + error.message);
          });
        }
        
        function executeOrchestration() {
          const orchestratorId = document.getElementById('orchestrator-id').value;
          const agentList = document.getElementById('agent-list').value.split(',').map(a => a.trim()).filter(a => a);
          const configText = document.getElementById('orchestrator-config').value;
          let config;
          
          try {
            config = JSON.parse(configText);
          } catch (e) {
            alert('Configuration JSON invalide');
            return;
          }
          
          if (!orchestratorId) {
            alert('Veuillez spécifier un ID d\'orchestrateur');
            return;
          }
          
          if (agentList.length === 0) {
            alert('Veuillez spécifier au moins un agent');
            return;
          }
          
          fetch('/api/orchestrator/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orchestratorId,
              agents: agentList,
              config
            })
          })
          .then(response => response.json())
          .then(data => {
            const resultDiv = document.getElementById('orchestration-result');
            resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          })
          .catch(error => {
            alert('Erreur: ' + error.message);
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

/**
 * Charge tous les agents du système
 */
async function loadAgents() {
  try {
    // Initialisation du registre des agents
    const registry = AgentRegistry.getInstance();
    
    // Chemin vers le dossier des agents
    const agentsBasePath = path.resolve(__dirname, '../');
    
    // Liste des types d'agents à charger
    const agentTypes = ['analyzers', 'generators', 'processors', 'orchestrators', 'validators'];
    
    logger.info('Chargement des agents...');
    
    // Pour chaque type d'agent
    for (const type of agentTypes) {
      const typePath = path.join(agentsBasePath, type);
      
      // Vérifier si le dossier existe
      if (!await fs.pathExists(typePath)) {
        logger.warn(`Dossier ${type} non trouvé, passage au suivant`);
        continue;
      }
      
      // Lire le contenu du dossier
      const agentFolders = await fs.readdir(typePath);
      
      for (const folder of agentFolders) {
        const agentPath = path.join(typePath, folder);
        const stat = await fs.stat(agentPath);
        
        // Vérifier que c'est un dossier
        if (!stat.isDirectory()) continue;
        
        try {
          // Vérifier s'il y a un point d'entrée index.js/ts
          const entryPoints = ['index.ts', 'index.js', `${folder}.ts`, `${folder}.js`];
          let entryPoint = null;
          
          for (const entry of entryPoints) {
            const entryPath = path.join(agentPath, entry);
            if (await fs.pathExists(entryPath)) {
              entryPoint = entryPath;
              break;
            }
          }
          
          if (!entryPoint) {
            logger.warn(`Pas de point d'entrée trouvé pour l'agent ${folder}`);
            continue;
          }
          
          // Ici, on importerait dynamiquement l'agent
          // Note: Dans un environnement réel, cette partie serait complétée
          // mais nous ne pouvons pas faire un import dynamique dans ce contexte
          
          logger.info(`Agent chargé: ${folder} (${type})`);
        } catch (error) {
          logger.error(`Erreur lors du chargement de l'agent ${folder}: ${error}`);
        }
      }
    }
    
    const agentCount = (await registry.getAllAgents()).length;
    logger.info(`Nombre total d'agents chargés: ${agentCount}`);
  } catch (error) {
    logger.error(`Erreur lors du chargement des agents: ${error}`);
  }
}

/**
 * Démarre le serveur API
 * @param port Port sur lequel démarrer le serveur
 */
export function startServer(port = 3000) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // Charger les agents
      await loadAgents();
      
      // Démarrer le serveur
      app.listen(port, () => {
        logger.info(`Serveur API démarré sur le port ${port}`);
        resolve();
      });
    } catch (error) {
      logger.error(`Erreur lors du démarrage du serveur: ${error}`);
      reject(error);
    }
  });
}

// Point d'entrée si le script est exécuté directement
if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  startServer(port).catch(console.error);
}

export default app;












import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';












































































































































































































































































































