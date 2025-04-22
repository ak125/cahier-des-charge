/**
 * Interface de base pour tous les agents MCP
 */
export interface McpAgent {
  /** Nom unique de l'agent */
  name: string;
  
  /** Version actuelle de l'agent */
  version: string;
  
  /** Description courte des fonctionnalités */
  description?: string;
  
  /** Initialisation de l'agent avec configuration */
  initialize?(config: Record<string, any>): Promise<void>;
  
  /** Méthode principale d'exécution de l'agent */
  execute(params: Record<string, any>): Promise<Record<string, any>>;
  
  /** Vérifie si l'agent est initialisé et prêt */
  isReady?(): boolean;
  
  /** Libère les ressources utilisées par l'agent */
  shutdown?(): Promise<void>;
  
  /** Retourne les métadonnées de l'agent */
  getMetadata?(): Record<string, any>;
}
