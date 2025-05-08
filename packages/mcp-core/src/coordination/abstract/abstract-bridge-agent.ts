/**
 * abstract-bridge-agent.ts
 *
 * Classe abstraite pour les agents pont dans la couche coordination
 */

import { AbstractCoordinationAgent, CoordinationOptions } from './abstract-coordination-agent';
import { BridgeAgent, CoordinationResult } from 'mcp-types/src/layer-contracts';

/**
 * Options spécifiques pour les agents pont
 */
export interface BridgeOptions extends CoordinationOptions {
    bufferSize?: number;
    transactionTimeout?: number;
}

/**
 * Point de terminaison d'un système
 */
export interface SystemEndpoint {
    id: string;
    type: string;
    uri: string;
    credentials?: Record<string, any>;
    options?: Record<string, any>;
}

/**
 * Connexion entre deux systèmes
 */
export interface Connection {
    id: string;
    source: SystemEndpoint;
    target: SystemEndpoint;
    status: 'active' | 'inactive' | 'error';
    error?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

/**
 * Résultat d'un transfert de données
 */
export interface TransferResult {
    success: boolean;
    data?: any;
    error?: string;
    bytesTransferred?: number;
    itemsTransferred?: number;
    startTime: string;
    endTime: string;
    duration: number;
    metadata?: Record<string, any>;
}

/**
 * Résultat d'une opération de pont
 */
export interface BridgeResult {
    success: boolean;
    data?: any;
    metadata?: Record<string, any>;
}

/**
 * Classe abstraite qui implémente l'interface BridgeAgent
 */
export abstract class AbstractBridgeAgent extends AbstractCoordinationAgent implements BridgeAgent {
    /**
     * Connexions actives gérées par cet agent
     */
    protected activeConnections: Map<string, Connection> = new Map();

    /**
     * Types de systèmes pris en charge par ce pont
     */
    protected supportedSystemTypes: string[] = [];

    /**
     * Crée une nouvelle instance de l'agent pont
     */
    constructor(id: string, name: string, version: string, options?: BridgeOptions) {
        super(id, name, 'bridge', version, options);
        this.metadata.supportedSystemTypes = this.supportedSystemTypes;
    }

    /**
     * Établit un pont entre deux systèmes
     */
    public async bridge(sourceSystem: string, targetSystem: string, config: Record<string, any>): Promise<CoordinationResult> {
        try {
            // Vérifier que les systèmes sont pris en charge
            const sourceEndpoint = await this.resolveSystemEndpoint(sourceSystem);
            const targetEndpoint = await this.resolveSystemEndpoint(targetSystem);

            // Établir la connexion
            const connection = await this.connect(sourceEndpoint, targetEndpoint);

            // Stocker la connexion active
            this.activeConnections.set(connection.id, connection);

            return this.createSuccessResult(
                { connectionId: connection.id },
                `Pont établi avec succès entre ${sourceSystem} et ${targetSystem}`,
                { connection: { ...connection, credentials: undefined } }
            );
        } catch (error) {
            return this.createErrorResult(
                `Échec de l'établissement du pont: ${error instanceof Error ? error.message : String(error)}`,
                { sourceSystem, targetSystem }
            );
        }
    }

    /**
     * Synchronise les données entre deux systèmes
     */
    public abstract synchronize(source: string, target: string, dataTypes: string[]): Promise<boolean>;

    /**
     * Établit une connexion entre deux systèmes
     */
    public abstract connect(source: SystemEndpoint, target: SystemEndpoint): Promise<Connection>;

    /**
     * Transfère des données entre deux systèmes
     */
    public abstract transfer(connection: Connection, data: any): Promise<TransferResult>;

    /**
     * Coordonne le transfert de données entre différentes sources et cibles
     */
    public async coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<CoordinationResult> {
        try {
            // Validation des entrées
            if (!sources || sources.length === 0) {
                return this.createErrorResult('Aucune source spécifiée pour le transfert');
            }

            if (!targets || targets.length === 0) {
                return this.createErrorResult('Aucune cible spécifiée pour le transfert');
            }

            if (!data) {
                return this.createErrorResult('Aucune donnée fournie pour le transfert');
            }

            // Résultats pour chaque paire source-cible
            const results: Record<string, TransferResult> = {};
            let failedCount = 0;

            // Pour chaque paire source-cible
            for (const source of sources) {
                for (const target of targets) {
                    try {
                        // Identifier les points de terminaison
                        const sourceEndpoint = await this.resolveSystemEndpoint(source);
                        const targetEndpoint = await this.resolveSystemEndpoint(target);

                        // Établir la connexion
                        const connection = await this.withRetry(() => this.connect(sourceEndpoint, targetEndpoint));

                        // Effectuer le transfert
                        const transferResult = await this.withRetry(() => this.transfer(connection, data));

                        // Stocker le résultat
                        const key = `${source}:${target}`;
                        results[key] = transferResult;

                        if (!transferResult.success) {
                            failedCount++;
                        }
                    } catch (error) {
                        const key = `${source}:${target}`;
                        results[key] = {
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                            startTime: new Date().toISOString(),
                            endTime: new Date().toISOString(),
                            duration: 0
                        };
                        failedCount++;
                    }
                }
            }

            // Créer le résultat final
            const totalTransfers = sources.length * targets.length;
            if (failedCount === 0) {
                return this.createSuccessResult(results, `Tous les transferts (${totalTransfers}) ont réussi`);
            } else if (failedCount < totalTransfers) {
                return this.createSuccessResult(results, `Certains transferts ont échoué: ${failedCount}/${totalTransfers} échecs`);
            } else {
                return this.createErrorResult(`Tous les transferts ont échoué (${totalTransfers})`, { results });
            }
        } catch (error) {
            return this.createErrorResult(error);
        }
    }

    /**
     * Ferme une connexion spécifique
     */
    protected async closeConnection(connectionId: string): Promise<void> {
        const connection = this.activeConnections.get(connectionId);

        if (connection) {
            try {
                await this.onCloseConnection(connection);
                this.activeConnections.delete(connectionId);
            } catch (error) {
                console.error(`Erreur lors de la fermeture de la connexion ${connectionId}:`, error);
            }
        }
    }

    /**
     * Résout un identifiant de système en point de terminaison
     */
    protected abstract resolveSystemEndpoint(systemId: string): Promise<SystemEndpoint>;

    /**
     * Logique spécifique pour fermer une connexion
     */
    protected abstract onCloseConnection(connection: Connection): Promise<void>;

    /**
     * Crée un résultat de pont réussi
     */
    protected createBridgeResult(data: any, metadata?: Record<string, any>): BridgeResult {
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

    /**
     * Vérifie les connexions aux services externes
     */
    protected async checkConnections(): Promise<ConnectionStatus> {
        const services: Record<string, { connected: boolean; lastChecked: string; error?: string }> = {};

        for (const [connectionId, connection] of this.activeConnections.entries()) {
            try {
                // Vérifier si la connexion est toujours valide
                const isValid = await this.validateConnection(connection);
                services[connectionId] = {
                    connected: isValid,
                    lastChecked: new Date().toISOString()
                };

                if (!isValid) {
                    services[connectionId].error = 'Connexion invalide ou expirée';
                }
            } catch (error) {
                services[connectionId] = {
                    connected: false,
                    lastChecked: new Date().toISOString(),
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }

        return {
            connected: Object.values(services).every(s => s.connected),
            services,
            lastChecked: new Date().toISOString()
        };
    }

    /**
     * Ferme toutes les connexions actives
     */
    protected async closeConnections(): Promise<void> {
        const connectionIds = Array.from(this.activeConnections.keys());

        for (const connectionId of connectionIds) {
            await this.closeConnection(connectionId);
        }
    }

    /**
     * Valide si une connexion est toujours active
     */
    protected abstract validateConnection(connection: Connection): Promise<boolean>;
}