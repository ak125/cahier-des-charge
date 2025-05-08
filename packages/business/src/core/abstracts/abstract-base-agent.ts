/**
 * abstract-base-agent.ts
 *
 * Classe abstraite de base pour tous les agents dans l'architecture MCP OS en 3 couches
 */

import { EventEmitter } from 'events';
import { BaseAgent } from '../interfaces/base-agent';

/**
 * Classe abstraite qui implémente l'interface BaseAgent
 */
export abstract class AbstractBaseAgent implements BaseAgent {
    /**
     * Identifiant unique de l'agent
     */
    public id: string;

    /**
     * Nom lisible de l'agent
     */
    public name: string;

    /**
     * Type d'agent (e.g., orchestrator, analyzer, generator, etc.)
     */
    public type: string;

    /**
     * Version de l'agent
     */
    public version: string;

    /**
     * Emetteur d'événements pour les communications asynchrones
     */
    protected eventEmitter: EventEmitter;

    /**
     * Indique si l'agent a été initialisé
     */
    protected isInitialized: boolean = false;

    /**
     * Stocke les métadonnées de l'agent
     */
    protected metadata: Record<string, any> = {};

    /**
     * Crée une nouvelle instance de l'agent
     */
    constructor(id: string, name: string, type: string, version: string) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.version = version;
        this.eventEmitter = new EventEmitter();
        this.metadata = {
            createdAt: new Date().toISOString(),
            type: this.type,
            version: this.version
        };
    }

    /**
     * Initialise l'agent avec des options spécifiques
     */
    public async initialize(options?: Record<string, any>): Promise<void> {
        // Validation de base
        if (this.isInitialized) {
            throw new Error(`Agent ${this.id} est déjà initialisé`);
        }

        try {
            // Méthode spécifique à implémenter dans les sous-classes
            await this.onInitialize(options);
            this.isInitialized = true;
        } catch (error) {
            throw new Error(`Échec d'initialisation de l'agent ${this.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Vérifie si l'agent est prêt à être utilisé
     */
    public isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Arrête et nettoie l'agent
     */
    public async shutdown(): Promise<void> {
        if (!this.isInitialized) {
            return;
        }

        try {
            // Méthode spécifique à implémenter dans les sous-classes
            await this.onShutdown();
            this.isInitialized = false;
            this.eventEmitter.removeAllListeners();
        } catch (error) {
            throw new Error(`Échec de l'arrêt de l'agent ${this.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Récupère les métadonnées de l'agent
     */
    public getMetadata(): Record<string, any> {
        return { ...this.metadata };
    }

    /**
     * S'abonne à un événement de l'agent
     */
    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    /**
     * Émet un événement
     */
    protected emit(event: string, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    /**
     * Méthode à implémenter pour l'initialisation spécifique
     */
    protected abstract onInitialize(options?: Record<string, any>): Promise<void>;

    /**
     * Méthode à implémenter pour la fermeture spécifique
     */
    protected abstract onShutdown(): Promise<void>;
}