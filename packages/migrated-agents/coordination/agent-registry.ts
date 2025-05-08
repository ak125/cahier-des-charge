import { AgentResult } from 'mcp-types';
import { AbstractRegistryAgent, Agent, AgentCriteria } from '@workspaces/cahier-des-charge/packages/mcp-core/src/coordination/abstract/abstract-registry-agent';

/**
 * Agent de registre concret qui étend la classe abstraite AbstractRegistryAgent
 */
export class AgentRegistryManager extends AbstractRegistryAgent {
  // Stockage simulé des agents (dans un cas réel, cela pourrait être une base de données)
  private registeredAgents: Map<string, Agent> = new Map();

  constructor() {
    super(
      'registry-agent-001',
      'Agent Registry Manager',
      '1.0.0',
      {
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        autoRefresh: true,
        refreshInterval: 60000, // 1 minute
        validation: true
      }
    );
  }

  /**
   * Enregistre un agent dans le registre
   */
  public async register(agentId: string, metadata: Record<string, any>): Promise<string> {
    console.log(`Enregistrement de l'agent ${agentId}`);

    // Vérifier si l'agent existe déjà
    if (this.registeredAgents.has(agentId)) {
      // Mettre à jour les métadonnées de l'agent existant
      const existingAgent = this.registeredAgents.get(agentId)!;

      const updatedAgent: Agent = {
        ...existingAgent,
        ...metadata,
        lastSeen: new Date().toISOString()
      };

      this.registeredAgents.set(agentId, updatedAgent);
      this.agentsCache.set(agentId, updatedAgent);

      console.log(`Agent ${agentId} mis à jour`);
      return agentId;
    }

    // Créer un nouvel agent
    const newAgent: Agent = {
      id: agentId,
      name: metadata.name || `Agent-${agentId}`,
      type: metadata.type || 'generic',
      version: metadata.version || '1.0.0',
      capabilities: metadata.capabilities || [],
      endpoint: metadata.endpoint,
      metadata: { ...metadata },
      status: 'active',
      lastSeen: new Date().toISOString()
    };

    // Enregistrer l'agent
    this.registeredAgents.set(agentId, newAgent);
    this.agentsCache.set(agentId, newAgent);

    console.log(`Agent ${agentId} enregistré avec succès`);
    this.emit('agent:registered', { agentId, agent: newAgent });

    return agentId;
  }

  /**
   * Recherche des agents selon des critères
   */
  public async discover(criteria: Record<string, any>): Promise<Record<string, any>[]> {
    console.log(`Recherche d'agents avec les critères: ${JSON.stringify(criteria)}`);

    // Convertir les critères au format AgentCriteria
    const typedCriteria: AgentCriteria = {
      type: criteria.type,
      capability: criteria.capability,
      status: criteria.status as 'active' | 'inactive' | 'error',
      name: criteria.name,
      version: criteria.version,
      metadata: criteria.metadata
    };

    // Filtrer les agents selon les critères
    const agents = Array.from(this.registeredAgents.values());
    const filteredAgents = agents.filter(agent => this.matchesCriteria(agent, typedCriteria));

    console.log(`${filteredAgents.length} agent(s) trouvé(s)`);
    return filteredAgents;
  }

  /**
   * Vérifie si un agent correspond aux critères spécifiés
   */
  private matchesCriteria(agent: Agent, criteria: AgentCriteria): boolean {
    // Vérifier le type
    if (criteria.type) {
      const types = Array.isArray(criteria.type) ? criteria.type : [criteria.type];
      if (!types.includes(agent.type)) {
        return false;
      }
    }

    // Vérifier les capacités
    if (criteria.capability) {
      const capabilities = Array.isArray(criteria.capability)
        ? criteria.capability
        : [criteria.capability];

      if (!capabilities.some(cap => agent.capabilities.includes(cap))) {
        return false;
      }
    }

    // Vérifier le statut
    if (criteria.status && agent.status !== criteria.status) {
      return false;
    }

    // Vérifier le nom
    if (criteria.name && !agent.name.includes(criteria.name)) {
      return false;
    }

    // Vérifier la version
    if (criteria.version && agent.version !== criteria.version) {
      return false;
    }

    // Vérifier les métadonnées
    if (criteria.metadata) {
      for (const [key, value] of Object.entries(criteria.metadata)) {
        if (!agent.metadata || agent.metadata[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Rafraîchit le cache local des agents
   */
  protected async refreshCache(): Promise<void> {
    console.log('Rafraîchissement du cache d\'agents');

    // Dans un cas réel, cela pourrait interroger une base de données ou un service distant
    // Ici, nous copions simplement depuis notre stockage local
    this.agentsCache.clear();

    for (const [agentId, agent] of this.registeredAgents.entries()) {
      this.agentsCache.set(agentId, { ...agent });
    }

    console.log(`Cache rafraîchi avec ${this.agentsCache.size} agents`);
  }

  /**
   * Obtient un agent par son identifiant
   */
  protected async getAgentById(agentId: string): Promise<Agent | null> {
    // Vérifier d'abord dans le cache
    if (this.agentsCache.has(agentId)) {
      return this.agentsCache.get(agentId) || null;
    }

    // Vérifier dans le stockage principal
    if (this.registeredAgents.has(agentId)) {
      const agent = this.registeredAgents.get(agentId)!;
      this.agentsCache.set(agentId, agent);
      return agent;
    }

    return null;
  }

  /**
   * Vérifie si le registre est disponible
   */
  protected async isRegistryAvailable(): Promise<boolean> {
    // Dans un cas réel, cela pourrait vérifier la connexion à une base de données
    // ou à un service distant

    // Simuler une vérification
    await new Promise(resolve => setTimeout(resolve, 50));

    return true;
  }

  /**
   * Coordonne les opérations entre agents
   */
  protected async coordinateAgents(
    sourceAgents: Agent[],
    targetAgents: Agent[],
    operation: string,
    payload: any
  ): Promise<Record<string, any>> {
    console.log(`Coordination de l'opération "${operation}" entre ${sourceAgents.length} source(s) et ${targetAgents.length} cible(s)`);

    const results: Record<string, any> = {};

    for (const sourceAgent of sourceAgents) {
      for (const targetAgent of targetAgents) {
        const key = `${sourceAgent.id}:${targetAgent.id}`;

        try {
          console.log(`Coordination entre ${sourceAgent.id} et ${targetAgent.id}`);

          // Simuler la coordination entre agents
          await new Promise(resolve => setTimeout(resolve, 100));

          // Dans un cas réel, cela pourrait appeler les endpoints des agents
          // ou utiliser un mécanisme de messagerie pour établir la communication

          results[key] = {
            success: true,
            timestamp: new Date().toISOString(),
            operation,
            sourceAgent: sourceAgent.id,
            targetAgent: targetAgent.id,
            result: { status: 'completed', payload: { processed: true } }
          };
        } catch (error) {
          results[key] = {
            success: false,
            timestamp: new Date().toISOString(),
            operation,
            sourceAgent: sourceAgent.id,
            targetAgent: targetAgent.id,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    }

    return results;
  }

  /**
   * Initialisation spécifique de l'agent
   */
  protected async onInitialize(options?: Record<string, any>): Promise<void> {
    console.log(`Initialisation de l'agent de registre ${this.name} (${this.id})`);

    // Précharger quelques agents de test pour la démonstration
    const testAgents = [
      {
        id: 'test-agent-1',
        name: 'Agent de test 1',
        type: 'analyzer',
        version: '1.0.0',
        capabilities: ['text-analysis', 'sentiment-detection'],
        endpoint: 'http://localhost:3000/agents/test-agent-1',
        status: 'active',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'test-agent-2',
        name: 'Agent de test 2',
        type: 'generator',
        version: '1.0.0',
        capabilities: ['code-generation', 'document-generation'],
        endpoint: 'http://localhost:3000/agents/test-agent-2',
        status: 'active',
        lastSeen: new Date().toISOString()
      }
    ];

    for (const agent of testAgents) {
      this.registeredAgents.set(agent.id, agent as Agent);
    }

    // Initialiser le cache
    await this.refreshCache();

    // Configuration supplémentaire si nécessaire
    if (options) {
      if (options.loadFromStorage) {
        // Simuler le chargement depuis un stockage persistant
        console.log('Chargement des agents depuis le stockage');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  /**
   * Nettoyage lors de l'arrêt de l'agent
   */
  protected async onShutdown(): Promise<void> {
    console.log(`Arrêt de l'agent de registre ${this.name} (${this.id})`);

    // Sauvegarder l'état si nécessaire
    console.log('Sauvegarde de l\'état du registre');

    // Vider les collections
    this.registeredAgents.clear();

    // L'appel à closeConnections() et l'arrêt du rafraîchissement automatique 
    // sont déjà gérés dans la classe abstraite
  }
}
