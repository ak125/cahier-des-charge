import { BaseAgent, AgentContext, AgentResult } from 'mcp-types/src/base-agent';

/**
 * Classe abstraite de base pour tous les agents
 * Implémente les fonctionnalités communes à tous les agents
 */
export abstract class AbstractBaseAgent implements BaseAgent {
    // Propriétés d'identification
    public id: string;
    public name: string;
    public type: string;
    public version: string;

    // Contexte d'exécution
    protected context: AgentContext;

    // État de l'agent
    protected initialized: boolean = false;

    /**
     * Constructeur de l'agent
     * @param id Identifiant unique de l'agent
     * @param name Nom de l'agent
     * @param type Type de l'agent
     * @param version Version de l'agent
     * @param context Contexte d'exécution de l'agent
     */
    constructor(
        id: string,
        name: string,
        type: string,
        version: string,
        context: AgentContext
    ) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.version = version;
        this.context = context;
    }

    /**
     * Initialise l'agent avec les options spécifiées
     * @param options Options d'initialisation (optionnelles)
     */
    public async initialize(options?: Record<string, any>): Promise<void> {
        if (this.context?.logger) {
            this.context.logger.info(`Initialisation de l'agent ${this.name} (${this.id})`);
        }

        try {
            await this.onInitialize(options);
            this.initialized = true;
        } catch (error) {
            if (this.context?.logger) {
                this.context.logger.error(`Erreur lors de l'initialisation de l'agent ${this.name}:`, error);
            }
            throw error;
        }
    }

    /**
     * Méthode abstraite à implémenter par les sous-classes pour l'initialisation spécifique
     * @param options Options d'initialisation
     */
    protected abstract onInitialize(options?: Record<string, any>): Promise<void>;

    /**
     * Vérifie si l'agent est prêt à être utilisé
     */
    public isReady(): boolean {
        return this.initialized;
    }

    /**
     * Arrête proprement l'agent et libère les ressources
     */
    public async shutdown(): Promise<void> {
        if (this.context?.logger) {
            this.context.logger.info(`Arrêt de l'agent ${this.name} (${this.id})`);
        }

        try {
            await this.onShutdown();
            this.initialized = false;
        } catch (error) {
            if (this.context?.logger) {
                this.context.logger.error(`Erreur lors de l'arrêt de l'agent ${this.name}:`, error);
            }
            throw error;
        }
    }

    /**
     * Méthode abstraite à implémenter par les sous-classes pour la libération spécifique des ressources
     */
    protected abstract onShutdown(): Promise<void>;

    /**
     * Retourne les métadonnées associées à l'agent
     */
    public getMetadata(): Record<string, any> {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            version: this.version,
            initialized: this.initialized
        };
    }

    /**
     * Crée un résultat standardisé pour les opérations de l'agent
     */
    protected createResult(success: boolean, data?: any, error?: string | Record<string, any>, metadata?: Record<string, any>): AgentResult {
        return {
            success,
            data,
            error,
            metadata: {
                ...metadata,
                agentId: this.id,
                timestamp: new Date().toISOString()
            }
        };
    }
}