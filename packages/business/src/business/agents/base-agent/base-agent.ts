/**
import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent';
 * Classe de base pour les agents MCP
 * Implémente l'architecture à trois couches et fournit les fonctionnalités communes
 */

import { EventEmitter } from 'events';
import { McpLogger } from './logging/logger';
import {
  AgentConfig,
  AgentContext,
  AgentEvent,
  AgentMetadata,
  AgentResult,
  AgentStatus,
  LogLevel,
  McpAgent
} from './types';

import { BaseAgent } from '@workspaces/migration-ai-pipeline/src/core/interfaces/base-agent';

/**
 * Classe de base pour tous les agents MCP
 * @template TResult Type du résultat de l'agent
 * @template TConfig Type de la configuration de l'agent
 */
export abstract class BaseMcpAgent implements BaseAgent<TResult = any, TConfig extends AgentConfig = AgentConfig> implements McpAgent < TResult > {
  // Métadonnées de l'agent (à définir par les classes enfants)
  abstract readonly metadata: AgentMetadata;

  // Propriétés protégées
  protected config: TConfig;
  protected events: EventEmitter = new EventEmitter();
  protected status: AgentStatus = AgentStatus.IDLE;
  protected lastResult?: AgentResult<TResult>;
  protected startTime = 0;
  protected lastError?: Error;
  protected retryCount = 0;

  /**
   * Constructeur de l'agent de base
   * @param config Configuration de l'agent
   */
  constructor(config: TConfig) {
    this.config = config;
  }

  /**
   * Initialise l'agent
   * Cette méthode est appelée avant la première exécution de l'agent
   */
  async initialize(): Promise<void> {
    this.log('debug', 'Initializing agent');
    this.status = AgentStatus.IDLE;
  }

  /**
   * Valide le contexte d'exécution
   * @param context Contexte d'exécution à valider
   * @returns true si le contexte est valide, false sinon
   */
  async validate(context: AgentContext): Promise<boolean> {
    try {
      return await this.validateAgentContext(context);
    } catch (error) {
      this.log('error', 'Error validating context', error);
      return false;
    }
  }

  /**
   * Méthode abstraite à implémenter par les agents spécifiques pour valider le contexte
   * @param context Contexte d'exécution à valider
   */
  protected async validateAgentContext(_context: AgentContext): Promise<boolean> {
    return true;
  }

  /**
   * Exécute l'agent avec mesure des performances
   * Entoure l'exécution avec la collecte de métriques
   * @param context Contexte d'exécution
   * @param executor Fonction d'exécution réelle
   */
  protected async executeWithMetrics(
    context: AgentContext,
    executor: () => Promise<AgentResult<TResult>>
  ): Promise<AgentResult<TResult>> {
    // Métriques de début d'exécution
    this.startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    this.status = AgentStatus.RUNNING;

    this.emitEvent(AgentEvent.STARTED, { context });

    try {
      // Exécuter le travail réel
      const result = await executor();

      // Métriques de fin d'exécution
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const duration = endTime - this.startTime;

      // Enrichir le résultat avec les métriques
      const enrichedResult: AgentResult<TResult> = {
        ...result,
        jobId: context.jobId || `job-${this.metadata.id}-${Date.now()}`,
        metrics: {
          startTime: this.startTime,
          endTime,
          duration,
          resourceUsage: {
            memory: endMemory - startMemory
          }
        }
      };

      this.lastResult = enrichedResult;
      this.status = result.success ? AgentStatus.COMPLETED : AgentStatus.FAILED;

      // Émettre l'événement approprié
      if (result.success) {
        this.emitEvent(AgentEvent.COMPLETED, enrichedResult);
      } else {
        this.emitEvent(AgentEvent.FAILED, enrichedResult);
      }

      return enrichedResult;
    } catch (error) {
      // En cas d'erreur inattendue
      const endTime = Date.now();
      const duration = endTime - this.startTime;

      this.status = AgentStatus.FAILED;
      this.lastError = error instanceof Error ? error : new Error(String(error));

      const errorResult: AgentResult<TResult> = {
        success: false,
        error: this.lastError,
        jobId: context.jobId || `job-${this.metadata.id}-${Date.now()}`,
        metrics: {
          startTime: this.startTime,
          endTime,
          duration
        }
      };

      this.lastResult = errorResult;
      this.emitEvent(AgentEvent.FAILED, errorResult);

      return errorResult;
    }
  }

  /**
   * Méthode abstraite d'exécution de l'agent que chaque agent spécifique doit implémenter
   * @param context Contexte d'exécution
   */
  abstract execute(context: AgentContext): Promise<AgentResult<TResult>>;

  /**
   * Exécute l'agent avec gestion des erreurs et des retries
   * @param context Contexte d'exécution
   */
  async run(context: AgentContext): Promise<AgentResult<TResult>> {
    // Réinitialiser le compteur de retry
    this.retryCount = 0;

    // Exécuter avec gestion des retries
    return this.runWithRetries(context);
  }

  /**
   * Exécute l'agent avec gestion des retries
   * @param context Contexte d'exécution
   */
  private async runWithRetries(context: AgentContext): Promise<AgentResult<TResult>> {
    try {
      // Exécuter l'agent
      const result = await this.execute(context);

      // Si succès, réinitialiser le compteur de retry
      this.retryCount = 0;

      return result;
    } catch (error) {
      // En cas d'erreur, gérer les retries si configuré
      this.lastError = error instanceof Error ? error : new Error(String(error));
      this.log('error', `Error executing agent: ${this.lastError.message}`, this.lastError);

      // Vérifier si on peut réessayer
      if (this.retryCount < (this.config.maxRetries || 0)) {
        this.retryCount++;
        this.log('info', `Retrying execution (${this.retryCount}/${this.config.maxRetries})`);
        this.status = AgentStatus.RETRYING;
        this.emitEvent(AgentEvent.RETRYING, { retryCount: this.retryCount, maxRetries: this.config.maxRetries, error: this.lastError });

        // Attendre avant de réessayer (avec backoff exponentiel)
        const delayMs = this.calculateBackoff(this.retryCount);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Réessayer
        return this.runWithRetries(context);
      }

      // Si on a épuisé les retries, retourner l'erreur
      const errorResult: AgentResult<TResult> = {
        success: false,
        error: this.lastError,
        jobId: context.jobId || `job-${this.metadata.id}-${Date.now()}`
      };

      this.status = AgentStatus.FAILED;
      this.lastResult = errorResult;
      this.emitEvent(AgentEvent.FAILED, errorResult);

      return errorResult;
    }
  }

  /**
   * Calcule le délai de backoff exponentiel pour les retries
   * @param retryCount Numéro de la tentative actuelle
   * @returns Délai en ms
   */
  private calculateBackoff(retryCount: number): number {
    // Backoff exponentiel avec jitter aléatoire
    const baseDelay = 1000; // 1 seconde
    const maxDelay = 30000; // 30 secondes
    const expBackoff = Math.min(maxDelay, baseDelay * 2 ** (retryCount - 1));
    const jitter = Math.random() * 0.3 * expBackoff; // 30% de jitter max

    return Math.floor(expBackoff + jitter);
  }

  /**
   * Annule l'exécution en cours
   */
  cancel(): void {
    if (this.status === AgentStatus.RUNNING || this.status === AgentStatus.RETRYING) {
      this.log('info', 'Cancelling agent execution');
      this.status = AgentStatus.CANCELLED;
      this.emitEvent(AgentEvent.CANCELLED, {});
    }
  }

  /**
   * Obtient l'état actuel de l'agent
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Obtient le dernier résultat de l'exécution
   */
  getLastResult(): AgentResult<TResult> | undefined {
    return this.lastResult;
  }

  /**
   * Obtient les métriques d'exécution
   */
  getMetrics(): any {
    if (!this.lastResult?.metrics) {
      return {
        executions: 0,
        avgDuration: 0,
        lastExecution: null,
        successRate: 0
      };
    }

    // Dans une implémentation réelle, on pourrait stocker l'historique des exécutions
    // et calculer des métriques plus avancées

    return {
      executions: 1,
      avgDuration: this.lastResult.metrics.duration,
      lastExecution: this.lastResult.metrics.endTime,
      successRate: this.lastResult.success ? 100 : 0
    };
  }

  /**
   * Obtient l'émetteur d'événements de l'agent
   */
  get events(): EventEmitter {
    return this.events;
  }

  /**
   * Émet un événement
   * @param event Type d'événement
   * @param data Données associées à l'événement
   */
  protected emitEvent(event: AgentEvent, data: any): void {
    this.events.emit(event, {
      ...data,
      agentId: this.metadata.id,
      timestamp: Date.now()
    });
  }

  /**
   * Émet un événement de progression
   * @param percent Pourcentage de progression (0-100)
   * @param message Message décrivant la progression
   */
  protected emitProgress(percent: number, message: string): void {
    const progress = {
      percent: Math.min(100, Math.max(0, percent)),
      message,
      timestamp: Date.now()
    };

    this.emitEvent(AgentEvent.PROGRESS, progress);
  }

  /**
   * Journalise un message
   * @param level Niveau de log
   * @param message Message à logger
   * @param context Contexte additionnel (optionnel)
   */
  protected log(level: LogLevel, message: string, context?: any): void {
    // Vérifier si le niveau est suffisant pour logger
    const logLevels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    const configLevel = this.config.logLevel || 'info';

    if (logLevels[level] >= logLevels[configLevel]) {
      // Log format: [AgentID] Message
      const logMessage = `[${this.metadata.id}] ${message}`;

      // Dans une implémentation réelle, on utiliserait un vrai logger
      console[level](logMessage, context ? context : '');

      // Émettre un événement de log
      this.emitEvent(AgentEvent.LOG, { level, message: logMessage, context });
    }
  }
}

/**
 * Exemple d'exports spécifiques à l'implémentation qui seront utilisés par les agents
 */
export { AgentStatus } from './types';
export type { AgentContext, AgentResult, AgentConfig, AgentMetadata } from './types';