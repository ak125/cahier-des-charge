/**
 * API commune pour tous les agents MCP
 * Cette interface définit le contrat que tous les agents doivent respecter
 * Version 1.0 - Avril 2025
 */

import { EventEmitter } from 'events';

// Types de base pour les agents
export type AgentType = 'analyzer' | 'generator' | 'validator' | 'orchestrator';
export type AgentStatus = 'ready' | 'busy' | 'error' | 'stopped';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Interface pour les métadonnées d'un agent
export interface AgentMetadata {
  id: string; // Identifiant unique de l'agent
  type: AgentType; // Type d'agent
  name: string; // Nom lisible de l'agent
  version: string; // Version sémantique
  description: string; // Description de l'agent
  author?: string; // Auteur de l'agent
  tags?: string[]; // Tags pour classification
}

// Configuration de base pour un agent
export interface AgentConfig {
  maxRetries?: number; // Nombre maximal de tentatives en cas d'échec
  timeout?: number; // Timeout en millisecondes
  concurrency?: number; // Nombre d'exécutions parallèles autorisées
  logLevel?: LogLevel; // Niveau de logging
  [key: string]: any; // Configurations spécifiques additionnelles
}

// Contexte d'exécution pour un agent
export interface AgentContext {
  jobId: string; // ID unique du job
  correlationId?: string; // ID de corrélation pour suivre un flux de travail complet
  sourceFiles?: string[]; // Fichiers source à traiter
  targetFiles?: string[]; // Fichiers de destination
  workspaceRoot?: string; // Racine de l'espace de travail
  timestamp: number; // Horodatage de création du contexte
  environmentVars?: Record<string, string>; // Variables d'environnement nécessaires
  parameters?: Record<string, any>; // Paramètres spécifiques au job
  dryRun?: boolean; // Mode simulation sans modifications réelles
  parentContext?: AgentContext; // Contexte parent pour les sous-tâches
}

// Résultat d'exécution d'un agent
export interface AgentResult<T = any> {
  success: boolean; // Succès ou échec de l'exécution
  data?: T; // Données de résultat (typé)
  error?: Error | string; // Erreur en cas d'échec
  warnings?: string[]; // Avertissements non bloquants
  metrics?: {
    duration: number; // Durée d'exécution en ms
    startTime: number; // Timestamp de début
    endTime: number; // Timestamp de fin
    resourceUsage?: {
      // Utilisation des ressources
      memory?: number; // Mémoire en Mo
      cpu?: number; // CPU en %
    };
  };
  score?: number; // Score de qualité (0-100) si applicable
  artifacts?: {
    // Artifacts produits
    path: string; // Chemin de l'artifact
    type: string; // Type MIME ou description
    description?: string; // Description de l'artifact
  }[];
  logs?: Array<{
    // Logs détaillés de l'exécution
    level: LogLevel;
    message: string;
    timestamp: number;
  }>;
}

// Événements que les agents peuvent émettre
export enum AgentEvent {
  STARTED = 'started',
  PROGRESS = 'progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  WARNING = 'warning',
  METRIC = 'metric',
  LOG = 'log',
  STATUS_CHANGED = 'status_changed',
}

// Interface principale que chaque agent doit implémenter
export interface McpAgent<TResult = any, TConfig extends AgentConfig = AgentConfig> {
  // Propriétés requises
  readonly metadata: AgentMetadata;
  readonly status: AgentStatus;
  readonly events: EventEmitter;
  config: TConfig;

  // Méthodes principales
  initialize(): Promise<void>;
  execute(context: AgentContext): Promise<AgentResult<TResult>>;
  validate(context: AgentContext): Promise<boolean>;
  stop(): Promise<void>;

  // Méthodes de gestion du cycle de vie
  getStatus(): Promise<{ status: AgentStatus; details?: any }>;
  healthCheck(): Promise<boolean>;

  // Méthodes utilitaires
  getMetrics(): Promise<Record<string, any>>;
  clearCache?(): Promise<void>;
}

// Classe de base abstraite qui implémente les comportements communs
export abstract class BaseMcpAgent<TResult = any, TConfig extends AgentConfig = AgentConfig>
  implements McpAgent<TResult, TConfig>
{
  // Propriétés obligatoires à implémenter par les sous-classes
  abstract readonly metadata: AgentMetadata;

  // Propriétés avec implémentation par défaut
  readonly events = new EventEmitter();
  status: AgentStatus = 'ready';

  constructor(public config: TConfig) {
    // Validation de base de la configuration
    this.validateConfig();
  }

  // Méthode d'initialisation par défaut
  async initialize(): Promise<void> {
    this.status = 'ready';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
  }

  // Méthode abstraite que chaque agent doit implémenter
  abstract execute(context: AgentContext): Promise<AgentResult<TResult>>;

  // Validation de base du contexte
  async validate(context: AgentContext): Promise<boolean> {
    if (!context || !context.jobId) {
      return false;
    }
    return true;
  }

  // Arrêt de l'agent
  async stop(): Promise<void> {
    this.status = 'stopped';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
  }

  // Récupération du statut
  async getStatus(): Promise<{ status: AgentStatus; details?: any }> {
    return { status: this.status };
  }

  // Vérification de santé de base
  async healthCheck(): Promise<boolean> {
    return this.status === 'ready' || this.status === 'busy';
  }

  // Métriques de base
  async getMetrics(): Promise<Record<string, any>> {
    return {
      status: this.status,
      // Des métriques additionnelles peuvent être ajoutées
      // par les sous-classes
    };
  }

  // Utilitaires protégés pour les sous-classes
  protected log(level: LogLevel, message: string, data?: any): void {
    const logEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
    };

    this.events.emit(AgentEvent.LOG, logEntry);

    // Log dans console uniquement si le niveau est >= au niveau configuré
    const configuredLevel = this.config.logLevel || 'info';
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (levels[level] >= levels[configuredLevel]) {
      const consoleMethod =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : level === 'info'
              ? console.info
              : console.debug;

      consoleMethod(`[${this.metadata.name}] ${message}`, data);
    }
  }

  protected emitProgress(percent: number, message?: string): void {
    this.events.emit(AgentEvent.PROGRESS, { percent, message });
  }

  protected async executeWithMetrics(
    context: AgentContext,
    fn: () => Promise<any>
  ): Promise<AgentResult<TResult>> {
    // Initialisation des métriques
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    try {
      this.status = 'busy';
      this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
      this.events.emit(AgentEvent.STARTED, { context });

      // Exécuter la fonction
      const result = await fn();

      // Finaliser les métriques
      const endTime = Date.now();
      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      const metrics = {
        duration: endTime - startTime,
        startTime,
        endTime,
        resourceUsage: {
          memory: Math.round((finalMemory - initialMemory) * 100) / 100,
        },
      };

      // Créer et retourner le résultat complet
      const fullResult: AgentResult<TResult> = {
        ...result,
        metrics,
      };

      this.status = 'ready';
      this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
      this.events.emit(AgentEvent.COMPLETED, fullResult);

      return fullResult;
    } catch (error) {
      const endTime = Date.now();

      this.status = 'error';
      this.events.emit(AgentEvent.STATUS_CHANGED, this.status);

      const errorResult: AgentResult<TResult> = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: {
          duration: endTime - startTime,
          startTime,
          endTime,
        },
      };

      this.events.emit(AgentEvent.FAILED, errorResult);

      // Auto-reset to ready after error
      setTimeout(() => {
        if (this.status === 'error') {
          this.status = 'ready';
          this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
        }
      }, 5000);

      return errorResult;
    }
  }

  private validateConfig(): void {
    // On pourrait ajouter une validation plus robuste ici
    if (!this.config) {
      this.config = {} as TConfig;
    }
  }
}

import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';

import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
