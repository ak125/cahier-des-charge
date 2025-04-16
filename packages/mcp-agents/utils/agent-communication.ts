/**
 * Système de communication inter-agents
 * Facilite l'échange de données et l'invocation entre différents agents
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';
import { Agent, AgentResult } from '../core/interfaces/base-agent';

// Logger dédié à la communication inter-agents
const logger = new Logger('AgentCommunication');

/**
 * Type d'événements pour la communication entre agents
 */
export enum AgentEventType {
  STARTED = 'agent:started',
  COMPLETED = 'agent:completed',
  FAILED = 'agent:failed',
  PROGRESS = 'agent:progress',
  REQUEST = 'agent:request',
  RESPONSE = 'agent:response'
}

/**
 * Interface pour les messages échangés entre les agents
 */
export interface AgentMessage {
  id: string;               // Identifiant unique du message
  type: AgentEventType;     // Type d'événement
  senderId: string;         // ID de l'agent émetteur
  targetId?: string;        // ID de l'agent cible (optionnel)
  timestamp: number;        // Horodatage
  correlationId?: string;   // ID de corrélation pour les requêtes/réponses
  payload: any;             // Contenu du message
  metadata?: Record<string, any>; // Métadonnées additionnelles
}

/**
 * Interface pour la configuration de la communication
 */
export interface AgentCommunicationConfig {
  enableBroadcast: boolean;  // Activer la diffusion des messages à tous les agents
  logMessages: boolean;      // Journaliser les messages
  timeoutMs: number;         // Timeout pour les requêtes
  maxRetries: number;        // Nombre maximum de tentatives
  retryDelayMs: number;      // Délai entre les tentatives
}

/**
 * Classe singleton pour gérer la communication entre agents
 */
export class AgentCommunication {
  private static instance: AgentCommunication;
  private eventEmitter: EventEmitter;
  private registeredAgents: Map<string, Agent>;
  private messageHandlers: Map<string, Array<(message: AgentMessage) => void>>;
  private pendingRequests: Map<string, { 
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>;
  
  private config: AgentCommunicationConfig = {
    enableBroadcast: true,
    logMessages: true,
    timeoutMs: 30000,      // 30 secondes
    maxRetries: 3,
    retryDelayMs: 1000     // 1 seconde
  };
  
  /**
   * Constructeur privé (pattern singleton)
   */
  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100); // Augmenter le nombre max d'écouteurs
    this.registeredAgents = new Map();
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();
    
    logger.info('Système de communication inter-agents initialisé');
  }
  
  /**
   * Obtenir l'instance unique du système de communication
   */
  public static getInstance(): AgentCommunication {
    if (!AgentCommunication.instance) {
      AgentCommunication.instance = new AgentCommunication();
    }
    return AgentCommunication.instance;
  }
  
  /**
   * Configure le système de communication
   * @param config Options de configuration
   */
  public configure(config: Partial<AgentCommunicationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Configuration mise à jour', this.config);
  }
  
  /**
   * Enregistre un agent dans le système de communication
   * @param agent Agent à enregistrer
   */
  public registerAgent(agent: Agent): void {
    if (!agent.id) {
      throw new Error("L'agent doit avoir un ID pour être enregistré");
    }
    
    this.registeredAgents.set(agent.id, agent);
    logger.debug(`Agent ${agent.id} enregistré dans le système de communication`);
  }
  
  /**
   * Désenregistre un agent du système de communication
   * @param agentId ID de l'agent à désenregistrer
   */
  public unregisterAgent(agentId: string): void {
    if (this.registeredAgents.has(agentId)) {
      this.registeredAgents.delete(agentId);
      logger.debug(`Agent ${agentId} désenregistré du système de communication`);
    }
  }
  
  /**
   * Envoie un message à un agent spécifique
   * @param message Message à envoyer
   */
  public sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): void {
    const fullMessage: AgentMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now()
    };
    
    if (this.config.logMessages) {
      logger.debug(`Message envoyé: ${fullMessage.type}`, { 
        from: fullMessage.senderId,
        to: fullMessage.targetId || 'broadcast',
        correlationId: fullMessage.correlationId
      });
    }
    
    // Diffuser à tous les agents si broadcast est activé et qu'aucun targetId n'est spécifié
    if (!fullMessage.targetId && this.config.enableBroadcast) {
      this.eventEmitter.emit(fullMessage.type, fullMessage);
    } 
    // Sinon, envoyer à l'agent cible
    else if (fullMessage.targetId) {
      this.eventEmitter.emit(`${fullMessage.type}:${fullMessage.targetId}`, fullMessage);
    }
  }
  
  /**
   * Envoie une requête à un agent et attend sa réponse
   * @param targetId ID de l'agent cible
   * @param payload Données de la requête
   * @param metadata Métadonnées additionnelles (optionnel)
   * @param senderId ID de l'agent émetteur (optionnel)
   * @returns Promise avec la réponse
   */
  public async sendRequest<T = any>(
    targetId: string,
    payload: any,
    metadata?: Record<string, any>,
    senderId: string = 'system'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Vérifier si l'agent cible est enregistré
      if (targetId !== 'broadcast' && !this.registeredAgents.has(targetId)) {
        return reject(new Error(`Agent cible ${targetId} non enregistré`));
      }
      
      const correlationId = this.generateCorrelationId();
      
      // Créer un timeout pour la requête
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(correlationId)) {
          this.pendingRequests.delete(correlationId);
          reject(new Error(`Timeout de la requête pour l'agent ${targetId}`));
        }
      }, this.config.timeoutMs);
      
      // Stocker la requête en attente
      this.pendingRequests.set(correlationId, {
        resolve,
        reject,
        timeout
      });
      
      // Enregistrer un handler temporaire pour la réponse
      const responseHandler = (message: AgentMessage) => {
        if (message.correlationId === correlationId) {
          const request = this.pendingRequests.get(correlationId);
          if (request) {
            clearTimeout(request.timeout);
            this.pendingRequests.delete(correlationId);
            
            // Supprimer le listener après traitement
            this.eventEmitter.off(`${AgentEventType.RESPONSE}:${senderId}`, responseHandler);
            
            // Résoudre avec les données de la réponse
            resolve(message.payload);
          }
        }
      };
      
      // Écouter la réponse
      this.eventEmitter.once(`${AgentEventType.RESPONSE}:${senderId}`, responseHandler);
      
      // Envoyer la requête
      this.sendMessage({
        type: AgentEventType.REQUEST,
        senderId,
        targetId,
        correlationId,
        payload,
        metadata
      });
    });
  }
  
  /**
   * Enregistre un handler pour un type d'événement
   * @param eventType Type d'événement
   * @param agentId ID de l'agent (optionnel)
   * @param handler Fonction de traitement
   */
  public on(
    eventType: AgentEventType,
    agentIdOrHandler: string | ((message: AgentMessage) => void),
    handler?: (message: AgentMessage) => void
  ): void {
    let agentId: string | undefined;
    let actualHandler: (message: AgentMessage) => void;
    
    // Déterminer si le second paramètre est un ID d'agent ou un handler
    if (typeof agentIdOrHandler === 'string') {
      agentId = agentIdOrHandler;
      actualHandler = handler!;
    } else {
      actualHandler = agentIdOrHandler;
    }
    
    // Créer l'événement avec ou sans agentId
    const eventName = agentId ? `${eventType}:${agentId}` : eventType;
    
    // Enregistrer le handler
    this.eventEmitter.on(eventName, actualHandler);
    
    // Stocker le handler pour la désinscription ultérieure
    const handlerList = this.messageHandlers.get(eventName) || [];
    handlerList.push(actualHandler);
    this.messageHandlers.set(eventName, handlerList);
    
    logger.debug(`Handler enregistré pour l'événement ${eventName}`);
  }
  
  /**
   * Supprime un handler pour un type d'événement
   * @param eventType Type d'événement
   * @param agentId ID de l'agent (optionnel)
   * @param handler Fonction de traitement à supprimer
   */
  public off(
    eventType: AgentEventType,
    agentIdOrHandler: string | ((message: AgentMessage) => void),
    handler?: (message: AgentMessage) => void
  ): void {
    let agentId: string | undefined;
    let actualHandler: (message: AgentMessage) => void;
    
    // Déterminer si le second paramètre est un ID d'agent ou un handler
    if (typeof agentIdOrHandler === 'string') {
      agentId = agentIdOrHandler;
      actualHandler = handler!;
    } else {
      actualHandler = agentIdOrHandler;
    }
    
    // Créer l'événement avec ou sans agentId
    const eventName = agentId ? `${eventType}:${agentId}` : eventType;
    
    // Supprimer le handler
    this.eventEmitter.off(eventName, actualHandler);
    
    // Mettre à jour la liste des handlers
    const handlerList = this.messageHandlers.get(eventName) || [];
    const index = handlerList.indexOf(actualHandler);
    if (index !== -1) {
      handlerList.splice(index, 1);
      this.messageHandlers.set(eventName, handlerList);
    }
    
    logger.debug(`Handler supprimé pour l'événement ${eventName}`);
  }
  
  /**
   * Supprime tous les handlers pour un agent
   * @param agentId ID de l'agent
   */
  public removeAllHandlers(agentId: string): void {
    // Parcourir tous les types d'événements
    Object.values(AgentEventType).forEach(eventType => {
      const eventName = `${eventType}:${agentId}`;
      
      // Récupérer tous les handlers pour cet événement
      const handlerList = this.messageHandlers.get(eventName) || [];
      
      // Supprimer chaque handler
      handlerList.forEach(handler => {
        this.eventEmitter.off(eventName, handler);
      });
      
      // Vider la liste
      this.messageHandlers.set(eventName, []);
    });
    
    logger.debug(`Tous les handlers pour l'agent ${agentId} ont été supprimés`);
  }
  
  /**
   * Crée un ID unique pour un message
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Crée un ID de corrélation unique
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Exécute un agent et attend son résultat
   * @param targetAgentId ID de l'agent à exécuter
   * @param params Paramètres pour l'agent (optionnel)
   * @returns Résultat de l'exécution de l'agent
   */
  public async executeAgent(targetAgentId: string, params?: any): Promise<AgentResult> {
    logger.info(`Exécution de l'agent ${targetAgentId}`);
    
    const agent = this.registeredAgents.get(targetAgentId);
    
    if (!agent) {
      throw new Error(`Agent ${targetAgentId} non trouvé`);
    }
    
    // Diffuser un événement début d'exécution
    this.sendMessage({
      type: AgentEventType.STARTED,
      senderId: 'system',
      targetId: 'broadcast',
      payload: {
        agentId: targetAgentId,
        params
      }
    });
    
    try {
      // Exécuter l'agent
      const result = await agent.process();
      
      // Diffuser un événement fin d'exécution réussie
      this.sendMessage({
        type: AgentEventType.COMPLETED,
        senderId: 'system',
        targetId: 'broadcast',
        payload: {
          agentId: targetAgentId,
          result
        }
      });
      
      return result;
    } catch (error: any) {
      // Diffuser un événement d'échec
      this.sendMessage({
        type: AgentEventType.FAILED,
        senderId: 'system',
        targetId: 'broadcast',
        payload: {
          agentId: targetAgentId,
          error: {
            message: error.message,
            stack: error.stack
          }
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Exécute une chaîne d'agents en séquence
   * @param agentIds Liste des IDs d'agents à exécuter dans l'ordre
   * @param initialParams Paramètres initiaux
   * @returns Résultat du dernier agent de la chaîne
   */
  public async executeAgentChain(agentIds: string[], initialParams?: any): Promise<AgentResult> {
    logger.info(`Exécution de la chaîne d'agents: ${agentIds.join(' -> ')}`);
    
    let lastResult: AgentResult | undefined = undefined;
    let currentParams = initialParams;
    
    for (const agentId of agentIds) {
      try {
        lastResult = await this.executeAgent(agentId, currentParams);
        
        // Utiliser le résultat comme paramètre pour l'agent suivant
        currentParams = {
          previousResult: lastResult,
          ...currentParams
        };
      } catch (error: any) {
        logger.error(`Erreur dans la chaîne d'agents à l'étape ${agentId}: ${error.message}`);
        throw error;
      }
    }
    
    return lastResult!;
  }
}

// Exporter une instance par défaut
export const agentCommunication = AgentCommunication.getInstance();