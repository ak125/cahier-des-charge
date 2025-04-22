/**
 * Types et interfaces pour les agents MCP
 */

import { EventEmitter } from 'events';

/**
 * Types d'agents MCP
 */
export type AgentType = 
  | 'analyzer'      // Agents qui analysent le code, les données ou la configuration
  | 'transformer'   // Agents qui transforment le code ou les données
  | 'generator'     // Agents qui génèrent du nouveau code ou contenu
  | 'validator'     // Agents qui valident le code, la structure ou les données
  | 'orchestrator'  // Agents qui orchestrent d'autres agents
  | 'monitor'       // Agents qui surveillent les systèmes ou processus
  | 'connector'     // Agents qui connectent différents systèmes
  | 'custom';       // Type personnalisé pour les agents spécifiques

/**
 * Niveaux de log supportés
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Types d'événements émis par les agents
 */
export enum AgentEvent {
  STARTED = 'agent:started',
  COMPLETED = 'agent:completed',
  FAILED = 'agent:failed',
  PROGRESS = 'agent:progress',
  LOG = 'agent:log',
  RETRYING = 'agent:retrying',
  CANCELLED = 'agent:cancelled',
  STATE_CHANGED = 'agent:state-changed'
}

/**
 * États possibles d'un agent
 */
export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

/**
 * Métadonnées d'un agent
 */
export interface AgentMetadata {
  /**
   * Identifiant unique de l'agent
   */
  id: string;
  
  /**
   * Nom descriptif de l'agent
   */
  name: string;
  
  /**
   * Type de l'agent
   */
  type: AgentType;
  
  /**
   * Version de l'agent
   */
  version: string;
  
  /**
   * Description de l'agent
   */
  description: string;
  
  /**
   * Auteur de l'agent
   */
  author?: string;
  
  /**
   * Tags associés à l'agent pour la catégorisation et la recherche
   */
  tags?: string[];
  
  /**
   * Dépendances de l'agent (autres agents, bibliothèques, etc.)
   */
  dependencies?: string[];
  
  /**
   * URL de la documentation de l'agent
   */
  documentation?: string;
}

/**
 * Configuration de base commune à tous les agents
 */
export interface AgentConfig {
  /**
   * Niveau de log
   */
  logLevel?: LogLevel;
  
  /**
   * Nombre de tentatives en cas d'échec
   */
  maxRetries?: number;
  
  /**
   * Délai avant expiration en millisecondes
   */
  timeout?: number;
  
  /**
   * Nombre d'opérations concurrentes maximales
   */
  concurrency?: number;
  
  /**
   * Variables d'environnement spécifiques à l'agent
   */
  env?: Record<string, string>;
  
  /**
   * Configuration additionnelle spécifique à chaque agent
   */
  [key: string]: any;
}

/**
 * Contexte d'exécution passé à un agent
 */
export interface AgentContext {
  /**
   * Identifiant unique du job
   */
  jobId?: string;
  
  /**
   * Identifiant de l'utilisateur qui a initié le job
   */
  userId?: string;
  
  /**
   * Répertoire racine de l'espace de travail
   */
  workspaceRoot?: string;
  
  /**
   * Répertoire de sortie
   */
  outputDirectory?: string;
  
  /**
   * Fichiers source à traiter
   */
  sourceFiles?: string[];
  
  /**
   * Données d'entrée pour l'agent
   */
  input?: any;
  
  /**
   * Configuration spécifique au job
   */
  config?: Record<string, any>;
  
  /**
   * Résultats des agents précédents dans le pipeline
   */
  previousResults?: Record<string, any>;
  
  /**
   * Variables d'environnement pour l'exécution
   */
  env?: Record<string, string>;
  
  /**
   * Métadonnées additionnelles
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat d'exécution d'un agent
 */
export interface AgentResult<T = any> {
  /**
   * Indique si l'exécution a réussi
   */
  success: boolean;
  
  /**
   * Données produites par l'agent (si succès)
   */
  data?: T;
  
  /**
   * Erreur survenue pendant l'exécution (si échec)
   */
  error?: Error;
  
  /**
   * ID unique du job
   */
  jobId?: string;
  
  /**
   * Métriques d'exécution
   */
  metrics?: {
    startTime: number;
    endTime: number;
    duration: number;
    resourceUsage?: {
      memory: number;
      cpu?: number;
    };
  };
  
  /**
   * Fichiers générés ou modifiés pendant l'exécution
   */
  files?: Array<{
    path: string;
    size: number;
    hash?: string;
  }>;
  
  /**
   * Warnings rencontrés pendant l'exécution
   */
  warnings?: string[];
  
  /**
   * Actions recommandées suite à l'exécution
   */
  recommendations?: string[];
}

/**
 * Interface que tous les agents MCP doivent implémenter
 */
export interface McpAgent<TResult = any> {
  /**
   * Métadonnées de l'agent
   */
  readonly metadata: AgentMetadata;
  
  /**
   * Émetteur d'événements
   */
  readonly events: EventEmitter;
  
  /**
   * Initialise l'agent
   */
  initialize(): Promise<void>;
  
  /**
   * Valide le contexte d'exécution
   * @param context Contexte à valider
   */
  validate(context: AgentContext): Promise<boolean>;
  
  /**
   * Exécute l'agent
   * @param context Contexte d'exécution
   */
  execute(context: AgentContext): Promise<AgentResult<TResult>>;
  
  /**
   * Exécute l'agent avec gestion des erreurs et des retries
   * @param context Contexte d'exécution
   */
  run(context: AgentContext): Promise<AgentResult<TResult>>;
  
  /**
   * Annule l'exécution en cours
   */
  cancel(): void;
  
  /**
   * Obtient l'état actuel de l'agent
   */
  getStatus(): AgentStatus;
  
  /**
   * Obtient le dernier résultat de l'exécution
   */
  getLastResult(): AgentResult<TResult> | undefined;
  
  /**
   * Obtient les métriques d'exécution
   */
  getMetrics(): any;
}