/**
 * Interface de base pour tous les agents MCP
 * Date: 16 avril 2025
 */

export interface AgentContext {
  getConfig<T>(): T;
  logger: {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
  };
}

export interface FileContent {
  path: string;
  content: string;
}

export interface AgentResult {
  success: boolean;
  message?: string;
  data?: any;
  errors?: Error[];
  warnings?: string[];
  artifacts?: string[];
  metrics?: Record<string, any>;
  executionTimeMs?: number;
  timestamp?: string;
}

export interface MCPAgent<TConfig = any> {
  /**
   * Identifiant unique de l'agent
   */
  id: string;
  
  /**
   * Nom convivial de l'agent
   */
  name: string;
  
  /**
   * Version de l'agent
   */
  version: string;
  
  /**
   * Description des fonctionnalités de l'agent
   */
  description: string;
  
  /**
   * Initialise l'agent avec le contexte d'exécution
   */
  initialize(context: AgentContext): Promise<void>;
  
  /**
   * Exécute l'agent et retourne le résultat
   */
  execute(context: AgentContext): Promise<void>;
  
  /**
   * Nettoie les ressources utilisées par l'agent
   */
  cleanup?(): Promise<void>;
  
  /**
   * Retourne les dépendances de l'agent
   */
  getDependencies?(): string[];
  
  /**
   * Traite la demande d'exécution et retourne le résultat
   */
  process?(): Promise<AgentResult>;
  
  /**
   * Gère une action spécifique demandée à l'agent
   */
  handleAction?(action: string, payload?: any): Promise<any>;
}