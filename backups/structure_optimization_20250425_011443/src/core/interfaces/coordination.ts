/**
 * coordination.ts
 * 
 * Interfaces pour la couche coordination de l'architecture MCP OS en 3 couches
 * 
 * Cette couche est responsable de:
 * - Coordonner la communication entre agents
 * - Gérer les événements et les messages
 * - Fournir des adaptateurs pour l'intégration
 * - Servir de pont entre les couches business et orchestration
 */

import { 
  BaseAgent, 
  ServiceInfo, 
  DiscoveryCriteria, 
  ConnectionConfig,
  TransferResult
} from ./BaseAgentstructure-agent';

/**
 * Interface de base pour tous les agents de coordination
 */
export interface CoordinationAgent extends BaseAgent {
  /**
   * Vérifie la connexion avec un service
   */
  checkConnection(serviceId: string): Promise<boolean>;
}

/**
 * Interface pour les agents de communication
 */
export interface MessageBrokerAgent extends CoordinationAgent {
  /**
   * Publie un message sur un sujet/canal
   */
  publish(topic: string, message: any, options?: Record<string, any>): Promise<boolean>;
  
  /**
   * S'abonne à un sujet/canal
   */
  subscribe(topic: string, callback: (message: any) => void): Promise<string>;
  
  /**
   * Se désabonne d'un sujet/canal
   */
  unsubscribe(subscriptionId: string): Promise<boolean>;
  
  /**
   * Récupère les sujets/canaux disponibles
   */
  listTopics(): Promise<string[]>;
  
  /**
   * Envoie un message et attend une réponse (pattern requête/réponse)
   */
  request(topic: string, message: any, timeout?: number): Promise<any>;
}

/**
 * Interface pour les agents de découverte de services
 */
export interface ServiceDiscoveryAgent extends CoordinationAgent {
  /**
   * Enregistre un nouveau service
   */
  registerService(service: ServiceInfo): Promise<boolean>;
  
  /**
   * Désenregistre un service
   */
  unregisterService(serviceId: string): Promise<boolean>;
  
  /**
   * Découvre des services selon des critères
   */
  discoverServices(criteria: DiscoveryCriteria): Promise<ServiceInfo[]>;
  
  /**
   * Récupère les informations d'un service spécifique
   */
  getServiceInfo(serviceId: string): Promise<ServiceInfo>;
  
  /**
   * Met à jour les informations d'un service
   */
  updateServiceInfo(serviceId: string, updatedInfo: Partial<ServiceInfo>): Promise<boolean>;
}

/**
 * Interface pour les agents d'événements
 */
export interface EventManagerAgent extends CoordinationAgent {
  /**
   * Émet un événement
   */
  emitEvent(eventName: string, data: any): Promise<boolean>;
  
  /**
   * S'abonne à un événement
   */
  addEventListener(eventName: string, listener: (data: any) => void): Promise<string>;
  
  /**
   * Se désabonne d'un événement
   */
  removeEventListener(listenerId: string): Promise<boolean>;
  
  /**
   * Liste les types d'événements disponibles
   */
  listEventTypes(): Promise<string[]>;
  
  /**
   * Récupère l'historique des événements
   */
  getEventHistory(eventName?: string, limit?: number): Promise<Record<string, any>[]>;
}

/**
 * Interface pour les agents de pont (bridge)
 */
export interface BridgeAgent extends CoordinationAgent {
  /**
   * Configure une connexion source
   */
  configureSourceConnection(config: ConnectionConfig): Promise<boolean>;
  
  /**
   * Configure une connexion destination
   */
  configureTargetConnection(config: ConnectionConfig): Promise<boolean>;
  
  /**
   * Transfère des données de la source vers la destination
   */
  transfer(options?: Record<string, any>): Promise<TransferResult>;
  
  /**
   * Transforme les données pendant le transfert
   */
  transform?(data: any, transformationOptions?: Record<string, any>): Promise<any>;
  
  /**
   * Récupère les statistiques de transfert
   */
  getTransferStats(): Promise<Record<string, any>>;
}

/**
 * Interface pour les agents adaptateurs
 */
export interface AdapterAgent extends CoordinationAgent {
  /**
   * Configure une connexion au système externe
   */
  configureConnection(config: ConnectionConfig): Promise<boolean>;
  
  /**
   * Exécute une opération sur le système externe
   */
  executeOperation(operation: string, params?: any): Promise<any>;
  
  /**
   * Récupère les opérations disponibles
   */
  listAvailableOperations(): Promise<string[]>;
  
  /**
   * Synchronise les données avec le système externe
   */
  sync(direction: 'pull' | 'push' | 'bidirectional', options?: Record<string, any>): Promise<Record<string, any>>;
}

