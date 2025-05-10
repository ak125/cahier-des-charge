/**
 * Interface de base pour tous les agents du système
 * Cette interface définit les méthodes fondamentales que tout agent doit implémenter
 * conforme au document d'architecture à trois couches
 */
export interface BaseAgent {
    // Propriétés d'identification
    id: string;
    name: string;
    type: string;
    version: string;

    // Méthodes du cycle de vie
    initialize(options?: Record<string, any>): Promise<void>;
    isReady(): boolean;
    shutdown(): Promise<void>;

    // Métadonnées
    getMetadata(): Record<string, any>;
}

/**
 * Contexte d'exécution partagé entre les agents
 */
export interface AgentContext {
    logger: any;
    config: Record<string, any>;
    services?: Record<string, any>;
}