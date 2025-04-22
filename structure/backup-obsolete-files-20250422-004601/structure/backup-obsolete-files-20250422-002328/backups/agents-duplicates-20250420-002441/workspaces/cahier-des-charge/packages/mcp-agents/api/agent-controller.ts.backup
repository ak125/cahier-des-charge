/**
 * Contrôleur API pour piloter le système d'agents
 * Fournit des endpoints pour exécuter, surveiller et gérer les agents
 */

import express, { Request, Response, NextFunction } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import { agentCommunication, AgentEventType, AgentMessage } from '../utils/agent-communication';
import { AgentRegistry } from '../core/agent-registry';
import { Logger } from '../utils/logger';

// Logger pour le contrôleur
const logger = new Logger('AgentController');

// Router Express pour les endpoints de l'API
const router = express.Router();

// Registre des agents
const agentRegistry = AgentRegistry.getInstance();

/**
 * Middleware pour capturer les erreurs
 */
const errorHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      logger.error(`Erreur API: ${error.message}`);
      
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * GET /agents - Liste tous les agents disponibles
 */
router.get('/agents', errorHandler(async (req: Request, res: Response) => {
  const agents = await agentRegistry.getAllAgents();
  
  res.json({
    success: true,
    count: agents.length,
    agents: agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      version: agent.version,
      description: agent.description,
      type: getAgentType(agent)
    }))
  });
}));

/**
 * GET /agents/:id - Récupère les détails d'un agent
 */
router.get('/agents/:id', errorHandler(async (req: Request, res: Response) => {
  const agentId = req.params.id;
  const agent = await agentRegistry.getAgent(agentId);
  
  if (!agent) {
    return res.status(404).json({
      success: false,
      error: `Agent non trouvé: ${agentId}`
    });
  }
  
  res.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      version: agent.version,
      description: agent.description,
      type: getAgentType(agent),
      config: agent.config,
      dependencies: agent.getDependencies ? agent.getDependencies() : []
    }
  });
}));

/**
 * POST /agents/:id/execute - Exécute un agent
 */
router.post('/agents/:id/execute', errorHandler(async (req: Request, res: Response) => {
  const agentId = req.params.id;
  const parameters = req.body || {};
  
  const agent = await agentRegistry.getAgent(agentId);
  
  if (!agent) {
    return res.status(404).json({
      success: false,
      error: `Agent non trouvé: ${agentId}`
    });
  }
  
  // Générer un ID de corrélation unique pour cette exécution
  const correlationId = `api-${agentId}-${Date.now()}`;
  
  // Créer une promesse pour attendre la réponse
  const responsePromise = new Promise((resolve, reject) => {
    // Configurer un timeout
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout lors de l'exécution de l'agent ${agentId}`));
      
      // Supprimer le listener pour éviter les fuites de mémoire
      agentCommunication.removeListener(AgentEventType.RESPONSE, correlationId);
    }, 30000); // 30s de timeout par défaut
    
    // Écouter la réponse de l'agent
    agentCommunication.once(AgentEventType.RESPONSE, correlationId, (message: AgentMessage) => {
      clearTimeout(timeout);
      resolve(message.payload);
    });
  });
  
  // Envoyer la requête à l'agent
  agentCommunication.sendMessage({
    type: AgentEventType.REQUEST,
    senderId: 'api-controller',
    targetId: agentId,
    correlationId,
    payload: parameters
  });
  
  // Attendre la réponse
  const result = await responsePromise;
  
  res.json({
    success: true,
    agentId,
    correlationId,
    result
  });
}));

/**
 * POST /agents/:id/configure - Configure un agent
 */
router.post('/agents/:id/configure', errorHandler(async (req: Request, res: Response) => {
  const agentId = req.params.id;
  const config = req.body || {};
  
  const agent = await agentRegistry.getAgent(agentId);
  
  if (!agent) {
    return res.status(404).json({
      success: false,
      error: `Agent non trouvé: ${agentId}`
    });
  }
  
  // Mettre à jour la configuration
  Object.assign(agent.config, config);
  
  res.json({
    success: true,
    agentId,
    config: agent.config
  });
}));

/**
 * POST /orchestrator/execute - Exécute un orchestrateur avec une liste d'agents
 */
router.post('/orchestrator/execute', errorHandler(async (req: Request, res: Response) => {
  const { orchestratorId, agents, config = {} } = req.body || {};
  
  if (!orchestratorId) {
    return res.status(400).json({
      success: false,
      error: 'ID d\'orchestrateur requis'
    });
  }
  
  if (!agents || !Array.isArray(agents) || agents.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Liste d\'agents requise'
    });
  }
  
  const orchestrator = await agentRegistry.getAgent(orchestratorId);
  
  if (!orchestrator) {
    return res.status(404).json({
      success: false,
      error: `Orchestrateur non trouvé: ${orchestratorId}`
    });
  }
  
  // Vérifier que c'est bien un orchestrateur
  if (getAgentType(orchestrator) !== 'orchestrator') {
    return res.status(400).json({
      success: false,
      error: `L'agent ${orchestratorId} n'est pas un orchestrateur`
    });
  }
  
  // Configurer l'orchestrateur
  Object.assign(orchestrator.config, config, {
    agentsToOrchestrate: agents
  });
  
  // Générer un ID de corrélation unique pour cette exécution
  const correlationId = `api-orch-${orchestratorId}-${Date.now()}`;
  
  // Créer une promesse pour attendre la réponse
  const responsePromise = new Promise((resolve, reject) => {
    // Configurer un timeout (plus long pour l'orchestration)
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout lors de l'exécution de l'orchestrateur ${orchestratorId}`));
      
      // Supprimer le listener pour éviter les fuites de mémoire
      agentCommunication.removeListener(AgentEventType.RESPONSE, correlationId);
    }, 300000); // 5min de timeout pour l'orchestration
    
    // Écouter la réponse de l'orchestrateur
    agentCommunication.once(AgentEventType.RESPONSE, correlationId, (message: AgentMessage) => {
      clearTimeout(timeout);
      resolve(message.payload);
    });
  });
  
  // Envoyer la requête à l'orchestrateur
  agentCommunication.sendMessage({
    type: AgentEventType.REQUEST,
    senderId: 'api-controller',
    targetId: orchestratorId,
    correlationId,
    payload: { action: 'orchestrate' }
  });
  
  // Attendre la réponse
  const result = await responsePromise;
  
  res.json({
    success: true,
    orchestratorId,
    correlationId,
    result
  });
}));

/**
 * GET /tasks - Liste les tâches en cours ou terminées
 */
router.get('/tasks', errorHandler(async (req: Request, res: Response) => {
  // Cette implémentation est simplifiée
  // Une vraie implémentation nécessiterait une base de données pour stocker les tâches
  
  res.json({
    success: true,
    message: 'Fonctionnalité non implémentée - nécessite un stockage persistant'
  });
}));

/**
 * GET /tasks/:id - Récupère le statut d'une tâche
 */
router.get('/tasks/:id', errorHandler(async (req: Request, res: Response) => {
  // Cette implémentation est simplifiée
  // Une vraie implémentation nécessiterait une base de données pour stocker les tâches
  
  res.json({
    success: true,
    message: 'Fonctionnalité non implémentée - nécessite un stockage persistant'
  });
}));

/**
 * Détermine le type d'un agent
 * @param agent Agent
 * @returns Type de l'agent
 */
function getAgentType(agent: any): 'analyzer' | 'processor' | 'generator' | 'orchestrator' | 'validator' | 'unknown' {
  const constructor = agent.constructor.name;
  
  if (constructor.includes('Analyzer') || agent.id.includes('analyzer')) {
    return 'analyzer';
  } else if (constructor.includes('Processor') || agent.id.includes('processor')) {
    return 'processor';
  } else if (constructor.includes('Generator') || agent.id.includes('generator')) {
    return 'generator';
  } else if (constructor.includes('Orchestrator') || agent.id.includes('orchestrator')) {
    return 'orchestrator';
  } else if (constructor.includes('Validator') || agent.id.includes('validator')) {
    return 'validator';
  } else {
    return 'unknown';
  }
}

export default router;