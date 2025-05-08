/**
 * abstract-registry-agent.ts
 *
 * Classe abstraite pour les agents de registre dans la couche coordination
 */

import { AbstractCoordinationAgent, CoordinationOptions } from './abstract-coordination-agent';
import { RegistryAgent, CoordinationResult } from 'mcp-types/src/layer-contracts';

/**
 * Options spécifiques pour les agents de registre
 */
export interface RegistryOptions extends CoordinationOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
    validation?: boolean;
}

/**
 * Définition d'un agent pour le registre
 */
export interface Agent {
    id: string;
    name: string;
    type: string;
    version: string;
    capabilities: string[];
    endpoint?: string;
    metadata?: Record<string, any>;
    status?: 'active' | 'inactive' | 'error';
    lastSeen?: string;
}

/**
 * Critères de recherche pour les agents
 */
export interface AgentCriteria {
    type?: string | string[];
    capability?: string | string[];
    status?: 'active' | 'inactive' | 'error';
    name?: string;
    version?: string;
    metadata?: Record<string, any>;
}

/**
 * Classe abstraite qui implémente l'interface RegistryAgent
 */
export abstract class AbstractRegistryAgent extends AbstractCoordinationAgent implements RegistryAgent {
    /**
     * Cache local des agents
     */
    protected agentsCache: Map<string, Agent> = new Map();

    /**
     * Intervalle de rafraîchissement du cache
     */
    protected refreshIntervalId: NodeJS.Timeout | null = null;

    /**
     * Crée une nouvelle instance de l'agent de registre
     */
    constructor(id: string, name: string, version: string, options?: RegistryOptions) {
        super(id, name, 'registry', version, options);

        // Configurer le rafraîchissement automatique si nécessaire
        const registryOptions = options as RegistryOptions;
        if (registryOptions?.autoRefresh && registryOptions?.refreshInterval) {
            this.startAutoRefresh(registryOptions.refreshInterval);
        }
    }

    /**
     * Enregistre un agent dans le registre
     */
    public abstract register(agent: string, metadata: Record<string, any>): Promise<string>;

    /**
     * Recherche des agents dans le registre
     */
    public abstract discover(criteria: Record<string, any>): Promise<Record<string, any>[]>;

    /**
     * Coordonne la communication entre agents
     */
    public async coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<CoordinationResult> {
        try {
            // Validation des entrées
            if (!sources || sources.length === 0) {
                return this.createErrorResult('Aucun agent source spécifié');
            }

            if (!targets || targets.length === 0) {
                return this.createErrorResult('Aucun agent cible spécifié');
            }

            const operation = data.operation || 'default';
            const payload = data.payload || {};

            // Vérifier que les agents existent
            const sourceAgents: Agent[] = [];
            const targetAgents: Agent[] = [];

            for (const sourceId of sources) {
                try {
                    const agent = await this.getAgentById(sourceId);
                    if (agent) {
                        sourceAgents.push(agent);
                    } else {
                        return this.createErrorResult(`Agent source non trouvé: ${sourceId}`);
                    }
                } catch (error) {
                    return this.createErrorResult(`Erreur lors de la recherche de l'agent source ${sourceId}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            for (const targetId of targets) {
                try {
                    const agent = await this.getAgentById(targetId);
                    if (agent) {
                        targetAgents.push(agent);
                    } else {
                        return this.createErrorResult(`Agent cible non trouvé: ${targetId}`);
                    }
                } catch (error) {
                    return this.createErrorResult(`Erreur lors de la recherche de l'agent cible ${targetId}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            // Coordonner la communication entre agents
            const results = await this.coordinateAgents(sourceAgents, targetAgents, operation, payload);

            return this.createSuccessResult(results, `Coordination réussie entre ${sourceAgents.length} sources et ${targetAgents.length} cibles`);
        } catch (error) {
            return this.createErrorResult(error);
        }
    }

    /**
     * Démarre le rafraîchissement automatique du cache
     */
    protected startAutoRefresh(interval: number): void {
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId);
        }

        this.refreshIntervalId = setInterval(() => {
            this.refreshCache().catch(error => {
                console.error(`Erreur lors du rafraîchissement du cache: ${error instanceof Error ? error.message : String(error)}`);
            });
        }, interval);
    }

    /**
     * Arrête le rafraîchissement automatique du cache
     */
    protected stopAutoRefresh(): void {
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId);
            this.refreshIntervalId = null;
        }
    }

    /**
     * Rafraîchit le cache local des agents
     */
    protected abstract refreshCache(): Promise<void>;

    /**
     * Obtient un agent par son identifiant
     */
    protected abstract getAgentById(agentId: string): Promise<Agent | null>;

    /**
     * Vérifie les connexions aux services externes
     */
    protected async checkConnections(): Promise<ConnectionStatus> {
        // Par défaut, considérer le service comme connecté si nous pouvons accéder au registre
        let connected = false;

        try {
            connected = await this.isRegistryAvailable();
        } catch (error) {
            connected = false;
        }

        return {
            connected,
            services: {
                registry: {
                    connected,
                    lastChecked: new Date().toISOString(),
                    error: connected ? undefined : 'Le registre est inaccessible'
                }
            },
            lastChecked: new Date().toISOString()
        };
    }

    /**
     * Ferme les connexions aux services externes
     */
    protected async closeConnections(): Promise<void> {
        this.stopAutoRefresh();
        this.agentsCache.clear();
    }

    /**
     * Verifie si le registre est disponible
     */
    protected abstract isRegistryAvailable(): Promise<boolean>;

    /**
     * Coordonne les opérations entre agents
     */
    protected abstract coordinateAgents(
        sourceAgents: Agent[],
        targetAgents: Agent[],
        operation: string,
        payload: any
    ): Promise<Record<string, any>>;
}