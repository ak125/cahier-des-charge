/**
 * abstract-adapter-agent.ts
 *
 * Classe abstraite pour les agents adaptateurs dans la couche coordination
 */

import { AbstractCoordinationAgent, CoordinationOptions } from './abstract-coordination-agent';
import { AdapterAgent, CoordinationResult } from 'mcp-types/src/layer-contracts';

/**
 * Options spécifiques pour les agents adaptateurs
 */
export interface AdapterOptions extends CoordinationOptions {
    formatOptions?: Record<string, any>;
    clientConfig?: Record<string, any>;
}

/**
 * Résultat d'une opération d'adaptation
 */
export interface AdapterResult {
    success: boolean;
    data: any;
    metadata?: Record<string, any>;
}

/**
 * Classe abstraite qui implémente l'interface AdapterAgent
 */
export abstract class AbstractAdapterAgent extends AbstractCoordinationAgent implements AdapterAgent {
    /**
     * Cache des clients de services
     */
    protected clientsCache: Map<string, any> = new Map();

    /**
     * Formats pris en charge par cet adaptateur
     */
    protected supportedFormats: string[] = [];

    /**
     * Crée une nouvelle instance de l'agent adaptateur
     */
    constructor(id: string, name: string, version: string, options?: AdapterOptions) {
        super(id, name, 'adapter', version, options);
        this.metadata.supportedFormats = this.supportedFormats;
    }

    /**
     * Adapte les données pour un format spécifique
     */
    public abstract adapt(data: any, sourceFormat: string, targetFormat: string): Promise<any>;

    /**
     * Vérifie la compatibilité entre deux formats
     */
    public abstract checkCompatibility(sourceFormat: string, targetFormat: string): Promise<boolean>;

    /**
     * Obtient un client pour un service externe
     */
    public async getClient(serviceName: string): Promise<any> {
        // Vérifier si le service est pris en charge
        if (!this.canHandle(serviceName)) {
            throw new Error(`Le service '${serviceName}' n'est pas pris en charge par cet adaptateur`);
        }

        // Utiliser le client en cache s'il existe
        if (this.clientsCache.has(serviceName)) {
            return this.clientsCache.get(serviceName);
        }

        // Créer un nouveau client
        try {
            const client = await this.createServiceClient(serviceName);
            this.clientsCache.set(serviceName, client);
            return client;
        } catch (error) {
            throw new Error(`Échec de création du client pour '${serviceName}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Coordonne l'adaptation de données entre différentes sources et cibles
     */
    public async coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<CoordinationResult> {
        try {
            // Validation des entrées
            if (!sources || sources.length === 0) {
                return this.createErrorResult('Aucune source spécifiée pour l\'adaptation');
            }

            if (!targets || targets.length === 0) {
                return this.createErrorResult('Aucune cible spécifiée pour l\'adaptation');
            }

            if (!data) {
                return this.createErrorResult('Aucune donnée fournie pour l\'adaptation');
            }

            // Adapter les données pour chaque format cible
            const results: Record<string, any> = {};

            // On utilise le premier format source
            const sourceFormat = sources[0];

            for (const targetFormat of targets) {
                try {
                    // Vérifier la compatibilité
                    const isCompatible = await this.checkCompatibility(sourceFormat, targetFormat);
                    if (!isCompatible) {
                        return this.createErrorResult(`Formats incompatibles: ${sourceFormat} -> ${targetFormat}`);
                    }

                    results[targetFormat] = await this.withRetry(() => this.adapt(data, sourceFormat, targetFormat));
                } catch (error) {
                    return this.createErrorResult(`Échec d'adaptation vers ${targetFormat}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            // Créer le résultat final
            return this.createSuccessResult(results, `Données adaptées avec succès pour ${targets.length} format(s)`, {
                sourceFormats: sources,
                targetFormats: targets
            });
        } catch (error) {
            return this.createErrorResult(error);
        }
    }

    /**
     * Crée un résultat d'adaptation réussi
     */
    protected createAdapterResult(data: any, metadata?: Record<string, any>): AdapterResult {
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
     * Crée un client pour un service spécifique
     */
    protected abstract createServiceClient(serviceName: string): Promise<any>;
}