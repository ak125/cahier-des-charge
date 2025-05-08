/**
 * base-memo-agent.ts
 * 
 * Classe abstraite pour les agents avec capacités de mémoire
 * Étend l'agent de base et implémente l'interface MemoAgent
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from '../interfaces/base-agent';
import { MemoAgent } from '../interfaces/memo-agent';
import { MemoManager, MemoManagerOptions, MemoData, MemoResult } from '../memo/memo-manager';

/**
 * Options pour initialiser un agent avec mémoire
 */
export interface MemoAgentOptions {
    /**
     * Identifiant de l'agent (généré automatiquement si non fourni)
     */
    id?: string;

    /**
     * Nom lisible de l'agent
     */
    name: string;

    /**
     * Type d'agent
     */
    type: string;

    /**
     * Version de l'agent
     */
    version: string;

    /**
     * Configuration de la mémoire
     */
    memory?: MemoManagerOptions;

    /**
     * Activer la mémoire automatiquement à l'initialisation
     */
    autoInitMemory?: boolean;

    /**
     * Options supplémentaires pour l'agent spécifique
     */
    [key: string]: any;
}

/**
 * Classe abstraite de base pour tous les agents avec mémoire
 */
export abstract class BaseMemoAgent implements BaseAgent, MemoAgent {
    // Propriétés de l'agent
    public id: string;
    public name: string;
    public type: string;
    public version: string;

    // État interne de l'agent
    protected options: MemoAgentOptions;
    protected initialized: boolean = false;
    protected memoryInitialized: boolean = false;
    protected metadata: Record<string, any> = {};

    // Gestionnaire de mémoire
    protected memoryManager: MemoManager;

    /**
     * Constructeur de l'agent avec mémoire
     */
    constructor(options: MemoAgentOptions) {
        this.id = options.id || uuidv4();
        this.name = options.name;
        this.type = options.type;
        this.version = options.version;
        this.options = { ...options };

        // Créer le gestionnaire de mémoire avec l'ID de l'agent
        this.memoryManager = new MemoManager(this.id, options.memory);

        // Initialiser les métadonnées de base
        this.metadata = {
            createdAt: new Date().toISOString(),
            type: this.type,
            version: this.version,
        };
    }

    /**
     * Initialise l'agent avec ses options spécifiques
     */
    async initialize(options?: Record<string, any>): Promise<void> {
        if (this.initialized) {
            return;
        }

        // Fusionner les options fournies avec les options existantes
        if (options) {
            this.options = {
                ...this.options,
                ...options,
            };
        }

        // Initialiser la mémoire si demandé
        if (this.options.autoInitMemory !== false) {
            await this.initializeMemory();
        }

        this.initialized = true;
    }

    /**
     * Vérifie si l'agent est prêt à être utilisé
     */
    isReady(): boolean {
        return this.initialized;
    }

    /**
     * Récupère les métadonnées de l'agent
     */
    getMetadata(): Record<string, any> {
        return {
            ...this.metadata,
            hasMemory: this.memoryInitialized
        };
    }

    /**
     * Arrête et nettoie l'agent
     */
    async shutdown(): Promise<void> {
        if (this.memoryInitialized) {
            await this.memoryManager.close();
            this.memoryInitialized = false;
        }

        this.initialized = false;
    }

    /**
     * Initialise la mémoire de l'agent
     */
    async initializeMemory(): Promise<boolean> {
        if (this.memoryInitialized) {
            return true;
        }

        try {
            const success = await this.memoryManager.initialize();
            this.memoryInitialized = success;
            return success;
        } catch (error) {
            console.error(`Erreur lors de l'initialisation de la mémoire pour l'agent ${this.id}:`, error);
            return false;
        }
    }

    /**
     * Vérifie que la mémoire est initialisée
     */
    private checkMemoryInitialized(): void {
        if (!this.memoryInitialized) {
            throw new Error(`La mémoire de l'agent ${this.id} n'est pas initialisée. Appelez initializeMemory() d'abord.`);
        }
    }

    /**
     * Stocke une information en mémoire
     */
    async remember<T>(key: string, data: MemoData<T>): Promise<string> {
        this.checkMemoryInitialized();
        return await this.memoryManager.remember(key, data);
    }

    /**
     * Récupère une information depuis la mémoire
     */
    async recall<T>(key: string): Promise<MemoResult<T>> {
        this.checkMemoryInitialized();
        return await this.memoryManager.recall(key);
    }

    /**
     * Recherche des informations correspondant à une requête
     */
    async searchMemory<T>(query: Record<string, any>): Promise<MemoResult<T>[]> {
        this.checkMemoryInitialized();
        return await this.memoryManager.search(query);
    }

    /**
     * Recherche des informations sémantiquement similaires
     */
    async findSimilar<T>(embeddings: number[]): Promise<MemoResult<T>[]> {
        this.checkMemoryInitialized();
        return await this.memoryManager.findSimilar(embeddings);
    }

    /**
     * Supprime une information de la mémoire
     */
    async forget(key: string): Promise<boolean> {
        this.checkMemoryInitialized();
        return await this.memoryManager.forget(key);
    }

    /**
     * Nettoie les mémoires expirées
     */
    async cleanupMemory(): Promise<{ shortTerm: number; longTerm: number }> {
        this.checkMemoryInitialized();
        return await this.memoryManager.cleanup();
    }

    /**
     * Obtient un rapport des traces pour une exécution spécifique
     */
    async getMemoryTraceReport(runId: string): Promise<string | null> {
        this.checkMemoryInitialized();
        return await this.memoryManager.getRunReport(runId);
    }
}