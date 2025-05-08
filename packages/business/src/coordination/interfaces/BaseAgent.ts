/**
 * Interface de base pour tous les agents du système
 * Cette interface définit les méthodes fondamentales que tout agent doit implémenter
 */
export interface BaseAgent {
    /**
     * Initialise l'agent avec les options spécifiées
     * @param options Options d'initialisation (optionnelles)
     */
    initialize(options?: Record<string, any>): Promise<void>;

    /**
     * Vérifie si l'agent est prêt à être utilisé
     */
    isReady(): boolean;

    /**
     * Arrête proprement l'agent et libère les ressources
     */
    shutdown(): Promise<void>;

    /**
     * Retourne les métadonnées associées à l'agent
     */
    getMetadata(): Record<string, any>;
}