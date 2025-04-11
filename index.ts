import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

// Import des types d'agents
import { Agent, AgentContext, AgentResponse } from './types/agent';

// Création du logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: path.join(__dirname, 'logs', 'app.log')
    })
  ]
});

// Configuration
let config;
try {
  config = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'config/mcp-server-config.json'), 'utf8')
  );
} catch (error) {
  logger.warn('Fichier de configuration non trouvé, utilisation des paramètres par défaut');
  config = {
    server: {
      port: process.env.PORT || 3000,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    },
    version: '1.0.0',
    agentCategories: ['analysis', 'core', 'migration', 'quality']
  };
}

const app = express();
const PORT = config.server.port || 3000;

// Middleware
app.use(json());
app.use(cors(config.server.cors));

// Structure pour organiser les agents par catégorie
interface AgentRegistry {
  [category: string]: {
    [id: string]: Agent;
  };
}

// Registre des agents
const agentRegistry: AgentRegistry = {};

// Charger tous les agents par catégorie
const loadAgents = async () => {
  const categories = config.agentCategories || ['analysis', 'core', 'migration', 'quality'];
  
  for (const category of categories) {
    const categoryDir = path.resolve(__dirname, `agents/${category}`);
    
    if (!fs.existsSync(categoryDir)) {
      logger.warn(`Répertoire d'agents ${category} introuvable`);
      continue;
    }
    
    // Initialiser la catégorie dans le registre
    agentRegistry[category] = {};
    
    const files = fs.readdirSync(categoryDir);
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        try {
          const filePath = path.join(categoryDir, file);
          logger.debug(`Chargement de l'agent depuis ${filePath}`);
          
          // Importation dynamique du module
          const agentModule = await import(filePath);
          
          // Recherche de l'exportation d'agent (classe ou objet)
          const AgentClass = Object.values(agentModule).find(
            (exp: any) => typeof exp === 'function' || 
                         (typeof exp === 'object' && exp !== null && 'process' in exp)
          );
          
          if (AgentClass) {
            let agent: Agent;
            
            // Si c'est une classe, l'instancier
            if (typeof AgentClass === 'function') {
              agent = new (AgentClass as any)();
            } else {
              // Sinon c'est déjà un objet agent
              agent = AgentClass as Agent;
            }
            
            if (agent && agent.id) {
              agentRegistry[category][agent.id] = agent;
              logger.info(`Agent chargé: ${category}/${agent.id} (${agent.name || 'Sans nom'})`);
            } else {
              logger.warn(`Agent invalide dans ${file}: ID ou interface manquant`);
            }
          } else {
            logger.warn(`Aucun agent trouvé dans ${file}`);
          }
        } catch (error) {
          logger.error(`Échec du chargement de l'agent depuis ${file}:`, error);
        }
      }
    }
  }
};

// Fonctions utilitaires pour le registre d'agents
const getAllAgents = (): Agent[] => {
  const allAgents: Agent[] = [];
  
  for (const category in agentRegistry) {
    for (const agentId in agentRegistry[category]) {
      allAgents.push(agentRegistry[category][agentId]);
    }
  }
  
  return allAgents;
};

const getAgentByPath = (category: string, agentId: string): Agent | undefined => {
  return agentRegistry[category]?.[agentId];
};

const getAgentCount = (): number => {
  let count = 0;
  
  for (const category in agentRegistry) {
    count += Object.keys(agentRegistry[category]).length;
  }
  
  return count;
};

// API endpoints
app.get('/api/agents', (req, res) => {
  const result: any = {};
  
  for (const category in agentRegistry) {
    result[category] = Object.values(agentRegistry[category]).map(
      ({ id, name, description, capabilities }) => ({
        id,
        name,
        description,
        capabilities
      })
    );
  }
  
  res.json(result);
});

app.get('/api/agents/:category', (req, res) => {
  const { category } = req.params;
  
  if (!agentRegistry[category]) {
    return res.status(404).json({ 
      error: `Catégorie d'agents ${category} introuvable` 
    });
  }
  
  const agentList = Object.values(agentRegistry[category]).map(
    ({ id, name, description, capabilities }) => ({
      id,
      name,
      description,
      capabilities
    })
  );
  
  res.json(agentList);
});

app.post('/api/agents/:category/:agentId', async (req, res) => {
  const { category, agentId } = req.params;
  const context: AgentContext = req.body;
  
  const agent = getAgentByPath(category, agentId);
  
  if (!agent) {
    return res.status(404).json({ 
      error: `Agent ${category}/${agentId} introuvable` 
    });
  }
  
  try {
    logger.info(`Traitement de la requête par l'agent ${category}/${agentId}`);
    const response: AgentResponse = await agent.process(context);
    logger.debug(`Réponse de l'agent ${category}/${agentId}:`, response);
    res.json(response);
  } catch (error) {