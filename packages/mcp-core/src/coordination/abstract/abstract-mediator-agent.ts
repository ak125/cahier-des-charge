/**
 * abstract-mediator-agent.ts
 *
 * Classe abstraite pour les agents médiateurs dans la couche coordination
 */

import { AbstractCoordinationAgent, CoordinationOptions, ConnectionStatus } from './abstract-coordination-agent';
import { CoordinationResult } from 'mcp-types/src/layer-contracts';

/**
 * Options spécifiques pour les agents médiateurs
 */
export interface MediatorOptions extends CoordinationOptions {
    queueSize?: number;
    heartbeatInterval?: number;
    messageExpiration?: number; // en ms
}

/**
 * Résultat d'une opération de médiation
 */
export interface MediatorResult {
    success: boolean;
    data?: any;
    metadata?: Record<string, any>;
}

/**
 * Représentation d'un agent dans le système de médiation
 */
export interface Agent {
    id: string;
    name: string;
    type: string;
    version: string;
    capabilities: string[];
    metadata?: Record<string, any>;
    status: 'active' | 'inactive' | 'busy';
}

/**
 * Message envoyé entre agents
 */
export interface AgentMessage {
    id: string;
    senderId: string;
    recipientId: string | null;  // null pour broadcast
    type: string;
    content: any;
    timestamp: string;
    correlationId?: string;
    priority?: number;
    ttl?: number;
    metadata?: Record<string, any>;
}

/**
 * Résultat de communication entre agents
 */
export interface CommunicationResult {
    success: boolean;
    messageId: string;
    response?: any;
    error?: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

/**
 * Classe abstraite qui implémente l'interface MediatorAgent
 */
export abstract class AbstractMediatorAgent extends AbstractCoordinationAgent {
    /**
     * Registre des agents
     */
    protected agentRegistry: Map<string, Agent> = new Map();

    /**
     * File d'attente de messages
     */
    protected messageQueue: AgentMessage[] = [];

    /**
     * Crée une nouvelle instance de l'agent médiateur
     */
    constructor(id: string, name: string, version: string, options?: MediatorOptions) {
        super(id, name, 'mediator', version, options);
    }

    /**
     * Enregistre un agent auprès du médiateur
     */
    public async register(agent: Agent): Promise<void> {
        // Validation
        if (!agent || !agent.id) {
            throw new Error('Impossible d\'enregistrer un agent invalide');
        }

        // Vérifier si l'agent est déjà enregistré
        if (this.agentRegistry.has(agent.id)) {
            await this.updateAgentRegistration(agent);
        } else {
            await this.addAgentRegistration(agent);
        }
    }

    /**
     * Facilite la communication entre agents
     */
    public async communicate(fromAgent: string, toAgent: string, message: any): Promise<any> {
        // Validation
        if (!this.agentRegistry.has(fromAgent)) {
            throw new Error(`Agent source '${fromAgent}' non enregistré`);
        }

        if (!this.agentRegistry.has(toAgent)) {
            throw new Error(`Agent destinataire '${toAgent}' non enregistré`);
        }

        const sender = this.agentRegistry.get(fromAgent)!;
        const recipient = this.agentRegistry.get(toAgent)!;

        // Créer le message
        const agentMessage: AgentMessage = {
            id: this.generateMessageId(),
            senderId: fromAgent,
            recipientId: toAgent,
            type: typeof message === 'object' && message.type ? message.type : 'generic',
            content: message,
            timestamp: new Date().toISOString()
        };

        // Transmettre le message
        try {
            const result = await this.withRetry(() => this.deliverMessage(sender, recipient, agentMessage));
            return result;
        } catch (error) {
            throw new Error(`Échec de communication entre ${fromAgent} et ${toAgent}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Diffuse un message à tous les agents enregistrés
     */
    public async broadcast(message: any, filter?: (agent: Agent) => boolean): Promise<void> {
        // Créer le message
        const broadcastMessage: AgentMessage = {
            id: this.generateMessageId(),
            senderId: this.id,
            recipientId: null, // broadcast
            type: typeof message === 'object' && message.type ? message.type : 'broadcast',
            content: message,
            timestamp: new Date().toISOString()
        };

        // Filtrer les agents si nécessaire
        let recipients = Array.from(this.agentRegistry.values());

        if (filter && typeof filter === 'function') {
            recipients = recipients.filter(filter);
        }

        // Diffuser à tous les agents
        const deliveryPromises = recipients.map(agent => {
            return this.deliverBroadcast(agent, broadcastMessage).catch(error => {
                console.warn(`Échec d'envoi du broadcast à ${agent.id}: ${error instanceof Error ? error.message : String(error)}`);
            });
        });

        // Attendre toutes les diffusions
        await Promise.all(deliveryPromises);
    }

    /**
     * Coordonne la communication entre différents agents
     */
    public async coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<CoordinationResult> {
        try {
            // Validation des entrées
            if (!sources || sources.length === 0) {
                return this.createErrorResult('Aucun agent source spécifié pour la communication');
            }

            if (!targets || targets.length === 0) {
                return this.createErrorResult('Aucun agent cible spécifié pour la communication');
            }

            // Résultats pour chaque paire source-cible
            const results: Record<string, CommunicationResult> = {};
            let failedCount = 0;

            // Pour chaque paire source-cible
            for (const sourceId of sources) {
                for (const targetId of targets) {
                    try {
                        const response = await this.withRetry(() => this.communicate(sourceId, targetId, data));

                        // Stocker le résultat
                        const key = `${sourceId}:${targetId}`;
                        results[key] = {
                            success: true,
                            messageId: this.generateMessageId(),
                            response,
                            timestamp: new Date().toISOString()
                        };
                    } catch (error) {
                        const key = `${sourceId}:${targetId}`;
                        results[key] = {
                            success: false,
                            messageId: this.generateMessageId(),
                            error: error instanceof Error ? error.message : String(error),
                            timestamp: new Date().toISOString()
                        };
                        failedCount++;
                    }
                }
            }

            // Créer le résultat final
            const totalCommunications = sources.length * targets.length;
            if (failedCount === 0) {
                return this.createSuccessResult(results, `Toutes les communications (${totalCommunications}) ont réussi`);
            } else if (failedCount < totalCommunications) {
                return this.createSuccessResult(results, `Certaines communications ont échoué: ${failedCount}/${totalCommunications} échecs`);
            } else {
                return this.createErrorResult(`Toutes les communications ont échoué (${totalCommunications})`, { results });
            }
        } catch (error) {
            return this.createErrorResult(error);
        }
    }

    /**
     * Vérifie les connexions aux agents enregistrés
     */
    protected async checkConnections(): Promise<ConnectionStatus> {
        const services: Record<string, { connected: boolean, lastChecked: string, error?: string }> = {};
        let allConnected = true;

        // Vérifier l'état de tous les agents enregistrés
        for (const [agentId, agent] of this.agentRegistry.entries()) {
            try {
                const isConnected = await this.checkAgentConnection(agent);
                services[agentId] = {
                    connected: isConnected,
                    lastChecked: new Date().toISOString()
                };

                if (!isConnected) {
                    allConnected = false;
                }
            } catch (error) {
                services[agentId] = {
                    connected: false,
                    lastChecked: new Date().toISOString(),
                    error: error instanceof Error ? error.message : String(error)
                };
                allConnected = false;
            }
        }

        return {
            connected: allConnected,
            services,
            lastChecked: new Date().toISOString()
        };
    }

    /**
     * Ferme les connexions aux services externes
     */
    protected async closeConnections(): Promise<void> {
        const agents = Array.from(this.agentRegistry.values());
        for (const agent of agents) {
            try {
                await this.disconnectAgent(agent);
            } catch (error) {
                console.error(`Erreur lors de la déconnexion de l'agent ${agent.id}:`, error);
            }
        }
        this.agentRegistry.clear();
        this.messageQueue = [];
    }

    /**
     * Génère un identifiant unique pour un message
     */
    protected generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Ajoute un nouvel agent au registre
     */
    protected abstract addAgentRegistration(agent: Agent): Promise<void>;

    /**
     * Met à jour l'enregistrement d'un agent existant
     */
    protected abstract updateAgentRegistration(agent: Agent): Promise<void>;

    /**
     * Vérifie la connexion avec un agent
     */
    protected abstract checkAgentConnection(agent: Agent): Promise<boolean>;

    /**
     * Déconnecte un agent
     */
    protected abstract disconnectAgent(agent: Agent): Promise<void>;

    /**
     * Délivre un message à un agent spécifique
     */
    protected abstract deliverMessage(sender: Agent, recipient: Agent, message: AgentMessage): Promise<any>;

    /**
     * Délivre un message de diffusion à un agent
     */
    protected abstract deliverBroadcast(recipient: Agent, message: AgentMessage): Promise<void>;

    /**
     * Crée un résultat de médiation réussi
     */
    protected createMediatorResult(data: any, metadata?: Record<string, any>): MediatorResult {
        return {
            success: true,
            data,
            metadata: {
                timestamp: new Date().toISOString(),
                agentId: this.id,
                ...metadata
            }
        };
    }
}