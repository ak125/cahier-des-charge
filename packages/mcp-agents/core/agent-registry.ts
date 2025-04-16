/**
 * Registre des agents MCP
 * Service central pour l'enregistrement, la découverte et l'instanciation des agents
 */

import { EventEmitter } from 'events';
import { 
  McpAgent, 
  AgentConfig,
  AgentMetadata,
  AgentType
} from './types';
import { McpLogger } from './logging/logger';
import { McpMetricsCollector } from './metrics/metrics-collector';

export interface AgentRegistration {
  metadata: AgentMetadata;
  factory: AgentFactory;
  defaultConfig?: Partial<AgentConfig>;
  enabled: boolean;
}

export type AgentFactory = (config?: Partial<AgentConfig>) => McpAgent;

export class AgentRegistry {
  private static instance: AgentRegistry;

  private agents: Map<string, AgentRegistration> = new Map();
  private logger: McpLogger;
  private metrics: McpMetricsCollector;
  private events: EventEmitter = new EventEmitter();

  // Singleton
  private constructor() {
    this.logger = new McpLogger({ serviceName: 'mcp-agent-registry' });
    this.metrics = new McpMetricsCollector();
  }

  /**
   * Obtient l'instance unique du registre d'agents
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Initialise le registre d'agents
   */
  public async initialize(): Promise<void> {
    await this.logger.initialize();
    this.logger.info('Initialisation du registre des agents MCP');
    this.metrics.initialize();
  }

  /**
   * Enregistre un agent dans le registre
   */
  public registerAgent(
    metadata: AgentMetadata, 
    factory: AgentFactory, 
    defaultConfig?: Partial<AgentConfig>
  ): void {
    if (this.agents.has(metadata.id)) {
      this.logger.warn(`L'agent avec l'ID '${metadata.id}' est déjà enregistré et sera remplacé`);
    }

    this.agents.set(metadata.id, {
      metadata,
      factory,
      defaultConfig,
      enabled: true
    });

    this.logger.info(`Agent '${metadata.name}' (${metadata.id}) enregistré avec succès`);
    this.events.emit('agent-registered', metadata);
  }

  /**
   * Désenregistre un agent du registre
   */
  public unregisterAgent(agentId: string): boolean {
    if (!this.agents.has(agentId)) {
      this.logger.warn(`Tentative de désenregistrement d'un agent non existant: ${agentId}`);
      return false;
    }

    const agent = this.agents.get(agentId);
    this.agents.delete(agentId);

    this.logger.info(`Agent '${agent?.metadata.name}' (${agentId}) désenregistré`);
    this.events.emit('agent-unregistered', agentId);
    
    return true;
  }

  /**
   * Active ou désactive un agent
   */
  public setAgentEnabled(agentId: string, enabled: boolean): boolean {
    const registration = this.agents.get(agentId);
    if (!registration) {
      this.logger.warn(`Agent non trouvé: ${agentId}`);
      return false;
    }

    registration.enabled = enabled;
    this.logger.info(`Agent '${registration.metadata.name}' (${agentId}) ${enabled ? 'activé' : 'désactivé'}`);
    this.events.emit('agent-state-changed', { agentId, enabled });
    
    return true;
  }

  /**
   * Crée une instance d'agent
   */
  public createAgent<T extends McpAgent>(agentId: string, config?: Partial<AgentConfig>): T {
    const registration = this.agents.get(agentId);
    
    if (!registration) {
      throw new Error(`Agent non enregistré: ${agentId}`);
    }
    
    if (!registration.enabled) {
      throw new Error(`L'agent ${agentId} est désactivé`);
    }

    // Fusionner la configuration par défaut avec la configuration spécifiée
    const mergedConfig = {
      ...registration.defaultConfig,
      ...config
    };

    // Instancier l'agent
    const agent = registration.factory(mergedConfig) as T;

    // Surveiller les métriques de cet agent
    this.metrics.watchAgent(agentId, agent.events);

    this.logger.debug(`Agent '${registration.metadata.name}' (${agentId}) instancié`);
    
    return agent;
  }

  /**
   * Obtient les métadonnées d'un agent par son ID
   */
  public getAgentMetadata(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId)?.metadata;
  }

  /**
   * Liste tous les agents enregistrés
   */
  public listAgents(filter?: { 
    type?: AgentType;
    enabled?: boolean;
    tags?: string[];
  }): AgentMetadata[] {
    const results: AgentMetadata[] = [];

    for (const [_, registration] of this.agents.entries()) {
      // Appliquer les filtres si spécifiés
      if (filter) {
        if (filter.type && registration.metadata.type !== filter.type) {
          continue;
        }
        
        if (filter.enabled !== undefined && registration.enabled !== filter.enabled) {
          continue;
        }
        
        if (filter.tags && filter.tags.length > 0) {
          if (!registration.metadata.tags || 
              !filter.tags.some(tag => registration.metadata.tags?.includes(tag))) {
            continue;
          }
        }
      }
      
      results.push(registration.metadata);
    }

    return results;
  }

  /**
   * Vérifie si un agent est enregistré
   */
  public hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Vérifie si un agent est activé
   */
  public isAgentEnabled(agentId: string): boolean {
    const registration = this.agents.get(agentId);
    return registration ? registration.enabled : false;
  }

  /**
   * Trouve des agents par tags
   */
  public findAgentsByTags(tags: string[], matchAll: boolean = false): AgentMetadata[] {
    return this.listAgents().filter(agent => {
      if (!agent.tags || agent.tags.length === 0) {
        return false;
      }
      
      if (matchAll) {
        // Tous les tags doivent correspondre
        return tags.every(tag => agent.tags?.includes(tag));
      } else {
        // Au moins un tag doit correspondre
        return tags.some(tag => agent.tags?.includes(tag));
      }
    });
  }

  /**
   * S'abonne aux événements du registre
   */
  public on(event: 'agent-registered' | 'agent-unregistered' | 'agent-state-changed', 
            listener: (data: any) => void): void {
    this.events.on(event, listener);
  }

  /**
   * Obtient le collecteur de métriques
   */
  public getMetricsCollector(): McpMetricsCollector {
    return this.metrics;
  }

  /**
   * Charge dynamiquement les agents d'un répertoire
   */
  public async loadAgentsFromDirectory(directoryPath: string): Promise<number> {
    this.logger.info(`Chargement des agents depuis le répertoire: ${directoryPath}`);
    
    // Cette méthode devrait scanner le répertoire et charger dynamiquement les agents
    // Implémentation à compléter selon l'organisation de votre système de fichiers
    
    return 0;
  }

  /**
   * Réinitialise le registre (utilisé principalement pour les tests)
   */
  public reset(): void {
    this.agents.clear();
    this.logger.info('Registre des agents réinitialisé');
    this.events.emit('registry-reset', {});
  }
}