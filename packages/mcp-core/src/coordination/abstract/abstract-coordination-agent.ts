/**
 * abstract-coordination-agent.ts
 *
 * Classe abstraite de base pour les agents de la couche coordination
 */

import { AbstractBaseAgent } from '../../abstracts/abstract-base-agent';
import {
    CoordinationAgent,
    CoordinationResult,
    AdapterAgent
} from 'mcp-types/src/layer-contracts';

/**
 * Type pour les options de coordination
 */
export interface CoordinationOptions {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    serviceConfig?: Record<string, any>;
    [key: string]: any;
}

/**
 * Type pour l'état de connexion
 */
export interface ConnectionStatus {
    connected: boolean;
    services: Record<string, {
        connected: boolean;
        lastChecked: string;
        error?: string;
    }>;
    lastChecked: string;
}

/**
 * Classe abstraite qui implémente l'interface CoordinationAgent
 */
export abstract class AbstractCoordinationAgent extends AbstractBaseAgent implements CoordinationAgent {
    /**
     * Options de configuration pour l'agent de coordination
     */
    protected options: CoordinationOptions = {
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000
    };

    /**
     * Services pris en charge par cet agent
     */
    protected supportedServices: string[] = [];

    /**
     * État de connexion aux services
     */
    protected connectionState: ConnectionStatus = {
        connected: false,
        services: {},
        lastChecked: new Date().toISOString()
    };

    /**
     * Crée une nouvelle instance de l'agent de coordination
     */
    constructor(id: string, name: string, type: string, version: string, options?: CoordinationOptions) {
        super(id, name, type, version);

        if (options) {
            this.options = {
                ...this.options,
                ...options
            };
        }

        this.metadata.layer = 'coordination';
        this.metadata.supportedServices = this.supportedServices;
    }

    /**
     * Coordonne les interactions entre différentes sources et cibles
     */
    public abstract coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<CoordinationResult>;

    /**
     * Transforme des données pour les adapter au format attendu
     * (Optionnel selon l'interface CoordinationAgent)
     */
    public async transformData?(data: any, targetFormat: string): Promise<any> {
        // Implémentation par défaut à surcharger dans les sous-classes
        return data;
    }

    /**
     * Vérifie si l'agent peut gérer un type de service spécifique
     */
    public canHandle(serviceType: string): boolean {
        return this.supportedServices.includes(serviceType);
    }

    /**
     * Récupère les configurations de services prises en charge
     */
    public getSupportedServices(): string[] {
        return [...this.supportedServices];
    }

    /**
     * Vérifie l'état de connexion aux services externes
     */
    public async checkConnectionStatus(): Promise<ConnectionStatus> {
        try {
            const status = await this.checkConnections();

            // Mettre à jour l'état global de connexion
            this.connectionState = {
                connected: Object.values(status.services).every(service => service.connected),
                services: status.services,
                lastChecked: new Date().toISOString()
            };

            return this.connectionState;
        } catch (error) {
            this.connectionState = {
                connected: false,
                services: {},
                lastChecked: new Date().toISOString()
            };

            throw new Error(`Échec de vérification des connexions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Méthode d'initialisation spécifique
     */
    protected async onInitialize(options?: Record<string, any>): Promise<void> {
        // Mettre à jour les options si nécessaire
        if (options) {
            this.options = {
                ...this.options,
                ...options
            };
        }

        // Vérifier les connexions lors de l'initialisation
        try {
            await this.checkConnectionStatus();
        } catch (error) {
            // On permet l'initialisation même si les connexions échouent
            console.warn(`Avertissement lors de l'initialisation de l'agent ${this.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Méthode de fermeture spécifique
     */
    protected async onShutdown(): Promise<void> {
        // Fermer les connexions aux services externes
        await this.closeConnections();

        // Réinitialiser l'état de connexion
        this.connectionState = {
            connected: false,
            services: {},
            lastChecked: new Date().toISOString()
        };
    }

    /**
     * Vérifie les connexions aux services externes
     */
    protected abstract checkConnections(): Promise<ConnectionStatus>;

    /**
     * Ferme les connexions aux services externes
     */
    protected abstract closeConnections(): Promise<void>;

    /**
     * Crée un résultat de coordination réussi
     */
    protected createSuccessResult(data: any, message?: string, metadata?: Record<string, any>): CoordinationResult {
        return {
            success: true,
            data,
            message: message || 'Opération de coordination réussie',
            metadata: {
                timestamp: new Date().toISOString(),
                agentId: this.id,
                ...metadata
            }
        };
    }

    /**
     * Crée un résultat de coordination en échec
     */
    protected createErrorResult(error: Error | string, metadata?: Record<string, any>): CoordinationResult {
        const err = typeof error === 'string' ? new Error(error) : error;

        return {
            success: false,
            error: err,
            message: `Échec de coordination: ${err.message}`,
            metadata: {
                timestamp: new Date().toISOString(),
                agentId: this.id,
                errorName: err.name,
                ...metadata
            }
        };
    }

    /**
     * Exécute une opération avec gestion des tentatives
     */
    protected async withRetry<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= this.options.maxRetries!; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Ne pas attendre sur la dernière tentative
                if (attempt < this.options.maxRetries!) {
                    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
                }
            }
        }

        throw lastError || new Error('L\'opération a échoué après plusieurs tentatives');
    }
}