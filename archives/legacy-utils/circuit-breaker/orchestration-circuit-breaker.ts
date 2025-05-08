/**
 * Circuit breaker spécialisé pour la couche d'orchestration
 * Stratégie principale : isoler les workflows défaillants
 */
import { Logger } from '@nestjs/common';
import { configManager } from '../../config/core/unified-config';
import { TraceabilityService } from '../traceability/traceability-service';
import {
  BaseCircuitBreaker,
  CircuitBreakerOptions,
  CircuitBreakerResult,
  CircuitEvent,
  CircuitState,
} from './base-circuit-breaker';

// Type spécifique pour le contexte d'orchestration
export interface OrchestrationContext {
  workflowId?: string;
  workflowName?: string;
  nodeId?: string;
  queueName?: string;
  scriptPath?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export class OrchestrationCircuitBreaker extends BaseCircuitBreaker {
  private workflowRegistry: Map<
    string,
    {
      state: CircuitState;
      failureCount: number;
      lastFailure?: Date;
    }
  >;
  private logger: Logger;
  private traceabilityService: TraceabilityService;

  constructor(options: CircuitBreakerOptions, traceabilityService?: TraceabilityService) {
    super(options);
    this.logger = new Logger('OrchestrationCircuitBreaker');
    this.workflowRegistry = new Map();
    this.traceabilityService =
      traceabilityService ||
      new TraceabilityService({
        layer: 'orchestration',
        enabled: true,
        idFormat: 'mcp-{timestamp}-orchestration-{random}',
        storageStrategy: 'database',
      });
  }

  /**
   * Exécute une fonction de workflow avec protection par circuit breaker
   */
  public async execute<T>(
    fn: () => Promise<T>,
    fallback?: (error: Error, context?: OrchestrationContext) => Promise<T>,
    context?: OrchestrationContext
  ): Promise<CircuitBreakerResult<T>> {
    if (!this.options.enabled) {
      const result = await fn();
      return {
        success: true,
        result,
        circuitState: this.state,
        duration: 0,
      };
    }

    // Générer un ID de traçabilité
    const traceId = await this.traceabilityService.generateTraceId();
    const startTime = Date.now();

    // Vérifie si ce workflow spécifique est isolé
    if (context?.workflowId && this.isWorkflowIsolated(context.workflowId)) {
      this.stats.rejected++;
      this.emit(CircuitEvent.REJECTED, {
        reason: `Workflow ${context.workflowId} is currently isolated due to failures`,
        context,
        time: new Date(),
        traceId,
      });

      if (fallback) {
        try {
          const fallbackResult = await fallback(
            new Error(`Circuit open for workflow: ${context.workflowId}`),
            context
          );

          const duration = Date.now() - startTime;
          this.emit(CircuitEvent.FALLBACK_SUCCESS, {
            duration,
            context,
            time: new Date(),
            traceId,
          });

          return {
            success: true,
            result: fallbackResult,
            fallbackUsed: true,
            circuitState: this.state,
            duration,
            traceId,
          };
        } catch (fallbackError) {
          const duration = Date.now() - startTime;
          this.emit(CircuitEvent.FALLBACK_FAILURE, {
            error: fallbackError,
            duration,
            context,
            time: new Date(),
            traceId,
          });

          return {
            success: false,
            error: fallbackError as Error,
            fallbackUsed: true,
            circuitState: this.state,
            duration,
            traceId,
          };
        }
      }

      const duration = Date.now() - startTime;
      return {
        success: false,
        error: new Error(`Circuit open for workflow: ${context?.workflowId}`),
        circuitState: this.state,
        duration,
        traceId,
      };
    }

    // Vérifie l'état général du circuit
    if (this.isOpen()) {
      if (fallback) {
        try {
          const fallbackResult = await fallback(new Error('Circuit is OPEN'), context);

          const duration = Date.now() - startTime;

          return {
            success: true,
            result: fallbackResult,
            fallbackUsed: true,
            circuitState: this.state,
            duration,
            traceId,
          };
        } catch (fallbackError) {
          const duration = Date.now() - startTime;

          return {
            success: false,
            error: fallbackError as Error,
            fallbackUsed: true,
            circuitState: this.state,
            duration,
            traceId,
          };
        }
      }

      const duration = Date.now() - startTime;
      return {
        success: false,
        error: new Error('Circuit is OPEN'),
        circuitState: this.state,
        duration,
        traceId,
      };
    }

    // Journaliser le début de l'exécution
    await this.traceabilityService.logTrace({
      traceId,
      event: 'orchestration:workflow:start',
      context: {
        ...context,
        circuitState: this.state,
      },
      timestamp: new Date(),
    });

    // Essaie d'exécuter la fonction protégée
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Execution timed out after ${this.options.timeout}ms`)),
            this.options.timeout
          )
        ),
      ]);

      const duration = Date.now() - startTime;
      this.handleSuccess(context);

      // Journaliser le succès
      await this.traceabilityService.logTrace({
        traceId,
        event: 'orchestration:workflow:success',
        context: {
          ...context,
          duration,
          circuitState: this.state,
        },
        timestamp: new Date(),
      });

      return {
        success: true,
        result,
        circuitState: this.state,
        duration,
        traceId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleFailure(error as Error, context);

      // Journaliser l'échec
      await this.traceabilityService.logTrace({
        traceId,
        event: 'orchestration:workflow:failure',
        context: {
          ...context,
          error: (error as Error).message,
          duration,
          circuitState: this.state,
        },
        timestamp: new Date(),
      });

      // Essayer le fallback si disponible
      if (fallback) {
        try {
          const fallbackResult = await fallback(error as Error, context);

          this.emit(CircuitEvent.FALLBACK_SUCCESS, {
            duration,
            context,
            time: new Date(),
            traceId,
          });

          return {
            success: true,
            result: fallbackResult,
            fallbackUsed: true,
            circuitState: this.state,
            duration,
            traceId,
          };
        } catch (fallbackError) {
          this.emit(CircuitEvent.FALLBACK_FAILURE, {
            error: fallbackError,
            duration,
            context,
            time: new Date(),
            traceId,
          });

          return {
            success: false,
            error: fallbackError as Error,
            fallbackUsed: true,
            circuitState: this.state,
            duration,
            traceId,
          };
        }
      }

      return {
        success: false,
        error: error as Error,
        circuitState: this.state,
        duration,
        traceId,
      };
    }
  }

  /**
   * Force l'ouverture du circuit pour tous les workflows
   */
  public forceOpen(): void {
    this.transitionState(CircuitState.OPEN, 'Forced open by system');
    this.logger.warn('Circuit breaker forced OPEN for all workflows');
  }

  /**
   * Force la fermeture du circuit pour tous les workflows
   */
  public forceClose(): void {
    this.transitionState(CircuitState.CLOSED, 'Forced closed by system');

    // Réinitialiser également tous les workflows isolés
    for (const [workflowId, _] of this.workflowRegistry) {
      this.resetWorkflowState(workflowId);
    }

    this.logger.log('Circuit breaker forced CLOSED for all workflows');
  }

  /**
   * Isole spécifiquement un workflow problématique
   * @param workflowId ID du workflow à isoler
   * @param reason Raison de l'isolation
   */
  public isolateWorkflow(workflowId: string, reason: string): void {
    const workflowState = this.workflowRegistry.get(workflowId) || {
      state: CircuitState.CLOSED,
      failureCount: 0,
    };

    workflowState.state = CircuitState.OPEN;
    workflowState.lastFailure = new Date();
    this.workflowRegistry.set(workflowId, workflowState);

    this.logger.warn(`Isolated workflow ${workflowId}: ${reason}`);

    // Programmer la réintroduction automatique
    setTimeout(() => {
      this.testWorkflow(workflowId);
    }, this.options.resetTimeout);
  }

  /**
   * Vérifie si un workflow spécifique est isolé
   */
  public isWorkflowIsolated(workflowId: string): boolean {
    const workflowState = this.workflowRegistry.get(workflowId);
    return workflowState?.state === CircuitState.OPEN;
  }

  /**
   * Passe un workflow en mode test (half-open)
   */
  private testWorkflow(workflowId: string): void {
    const workflowState = this.workflowRegistry.get(workflowId);
    if (workflowState && workflowState.state === CircuitState.OPEN) {
      workflowState.state = CircuitState.HALF_OPEN;
      this.workflowRegistry.set(workflowId, workflowState);
      this.logger.log(`Workflow ${workflowId} is now in test mode (HALF_OPEN)`);
    }
  }

  /**
   * Réinitialise l'état d'un workflow
   */
  public resetWorkflowState(workflowId: string): void {
    this.workflowRegistry.set(workflowId, {
      state: CircuitState.CLOSED,
      failureCount: 0,
    });
    this.logger.log(`Workflow ${workflowId} state has been reset`);
  }

  /**
   * Traite un succès d'exécution
   */
  private handleSuccess(context?: OrchestrationContext): void {
    this.stats.successes++;
    this.stats.consecutiveSuccesses++;
    this.stats.consecutiveFailures = 0;
    this.stats.lastSuccessTime = new Date();
    this.stats.totalRequests++;
    this.stats.errorRate = (this.stats.failures / this.stats.totalRequests) * 100;

    // Si nous étions en test (half-open), refermer le circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionState(CircuitState.CLOSED, 'Successful execution in half-open state');
    }

    // Si c'est un workflow spécifique en test, le réinitialiser
    if (context?.workflowId) {
      const workflowState = this.workflowRegistry.get(context.workflowId);
      if (workflowState && workflowState.state === CircuitState.HALF_OPEN) {
        this.resetWorkflowState(context.workflowId);
      }
    }

    this.emit(CircuitEvent.SUCCESS, {
      context,
      time: new Date(),
    });
  }

  /**
   * Traite un échec d'exécution
   */
  private handleFailure(error: Error, context?: OrchestrationContext): void {
    this.stats.failures++;
    this.stats.consecutiveFailures++;
    this.stats.consecutiveSuccesses = 0;
    this.stats.lastFailureTime = new Date();
    this.stats.lastFailureReason = error.message;
    this.stats.totalRequests++;
    this.stats.errorRate = (this.stats.failures / this.stats.totalRequests) * 100;

    this.emit(CircuitEvent.FAILURE, {
      error,
      context,
      time: new Date(),
    });

    // Traitement spécifique pour un workflow
    if (context?.workflowId) {
      this.handleWorkflowFailure(context.workflowId, error);
    }

    // Vérifier si le seuil général d'erreurs est atteint
    if (this.shouldTripCircuit()) {
      this.transitionState(
        CircuitState.OPEN,
        `Failure threshold reached: ${this.stats.consecutiveFailures} consecutive failures`
      );

      // Programmer la réouverture du circuit
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }

      this.resetTimer = setTimeout(() => {
        this.transitionState(CircuitState.HALF_OPEN, 'Reset timeout elapsed, testing circuit');
      }, this.options.resetTimeout);
    }
  }

  /**
   * Traite un échec spécifique à un workflow
   */
  private handleWorkflowFailure(workflowId: string, _error: Error): void {
    const workflowState = this.workflowRegistry.get(workflowId) || {
      state: CircuitState.CLOSED,
      failureCount: 0,
    };

    workflowState.failureCount++;
    workflowState.lastFailure = new Date();

    // Vérifier si le workflow doit être isolé
    if (
      workflowState.state === CircuitState.CLOSED &&
      workflowState.failureCount >= this.options.failureThreshold
    ) {
      this.isolateWorkflow(
        workflowId,
        `Failure threshold reached: ${workflowState.failureCount} failures`
      );
    }

    this.workflowRegistry.set(workflowId, workflowState);
  }

  /**
   * Détermine si le circuit doit être déclenché
   */
  private shouldTripCircuit(): boolean {
    // Ne déclencher que si le volume minimum est atteint
    if (this.stats.totalRequests < (this.options.volumeThreshold || 0)) {
      return false;
    }

    // Vérifier le nombre d'échecs consécutifs
    if (this.stats.consecutiveFailures >= this.options.failureThreshold) {
      return true;
    }

    // Vérifier le pourcentage d'erreur
    if (this.stats.errorRate >= (this.options.errorPercentageThreshold || 50)) {
      return true;
    }

    return false;
  }
}

// Singleton pour accéder au circuit breaker d'orchestration
let orchestrationCircuitBreakerInstance: OrchestrationCircuitBreaker | null = null;

export function getOrchestrationCircuitBreaker(): OrchestrationCircuitBreaker {
  if (!orchestrationCircuitBreakerInstance) {
    // Charger la configuration depuis le système de configuration unifié
    const config = configManager.getConfig();

    orchestrationCircuitBreakerInstance = new OrchestrationCircuitBreaker({
      failureThreshold: config.circuitBreaker.failureThreshold,
      resetTimeout: config.circuitBreaker.resetTimeout,
      enabled: config.circuitBreaker.enabled,
    });
  }

  return orchestrationCircuitBreakerInstance;
}
