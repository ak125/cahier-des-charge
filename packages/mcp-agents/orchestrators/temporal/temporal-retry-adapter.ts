import { RetryPolicy, defineQuery, proxyActivities } from '@temporalio/workflow';
import { CheckpointManager } from '../persistence/checkpoint-manager';
import { WorkflowCheckpoint, CheckpointStatus, RetryStrategy } from '../persistence/types';

/**
 * Configuration des politiques de retry pour Temporal
 */
export enum RetryPolicyType {
  DEFAULT = 'default',
  CRITICAL = 'critical',
  RESOURCE_INTENSIVE = 'resource-intensive',
  LOW_PRIORITY = 'low-priority',
  PROGRESSIVE = 'progressive', // Politique avec progression graduelle
  AGGRESSIVE = 'aggressive',   // Politique avec retries rapides et fréquents
  CAUTIOUS = 'cautious',       // Politique avec retries plus espacés
  INTELLIGENT = 'intelligent', // Politique adaptative basée sur le type d'erreur
  PRIORITY_BASED = 'priority-based', // Politique basée sur la priorité du workflow
  RESOURCE_AWARE = 'resource-aware' // Politique qui prend en compte la charge du système
}

/**
 * Classification des erreurs pour déterminer la politique de retry appropriée
 */
export enum ErrorCategory {
  TRANSIENT = 'transient',           // Erreurs temporaires (réseau, timeout)
  RESOURCE_EXHAUSTION = 'resource',  // Limites de ressources, quotas
  VALIDATION = 'validation',         // Erreurs de validation
  DEPENDENCY = 'dependency',         // Erreurs liées aux dépendances
  FATAL = 'fatal',                   // Erreurs irrécupérables
  UNKNOWN = 'unknown',               // Autres erreurs
  RECOVERABLE = 'recoverable',       // Erreurs récupérables après intervention
  DATABASE = 'database',             // Erreurs spécifiques à la base de données
  CONCURRENCY = 'concurrency'        // Erreurs de concurrence et verrouillage
}

/**
 * Politiques de retry prédéfinies
 */
export const RETRY_POLICIES = {
  [RetryPolicyType.DEFAULT]: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '1m',
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['NonRetryableError', 'ValidationError'],
  },
  [RetryPolicyType.CRITICAL]: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumInterval: '2m',
    maximumAttempts: 5,
    nonRetryableErrorTypes: ['FatalError'],
  },
  [RetryPolicyType.RESOURCE_INTENSIVE]: {
    initialInterval: '5s',
    backoffCoefficient: 2.5,
    maximumInterval: '5m',
    maximumAttempts: 2,
    nonRetryableErrorTypes: ['ResourceExhaustionError', 'QuotaExceededError'],
  },
  [RetryPolicyType.LOW_PRIORITY]: {
    initialInterval: '30s',
    backoffCoefficient: 1.5,
    maximumInterval: '10m',
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['LowPriorityError'],
  },
  [RetryPolicyType.PROGRESSIVE]: {
    initialInterval: '500ms',
    backoffCoefficient: 3,
    maximumInterval: '15m',
    maximumAttempts: 10,
    nonRetryableErrorTypes: ['FatalError', 'ValidationError'],
  },
  [RetryPolicyType.AGGRESSIVE]: {
    initialInterval: '100ms',
    backoffCoefficient: 1.5,
    maximumInterval: '30s',
    maximumAttempts: 15,
    nonRetryableErrorTypes: ['FatalError'],
  },
  [RetryPolicyType.CAUTIOUS]: {
    initialInterval: '1m',
    backoffCoefficient: 2,
    maximumInterval: '30m',
    maximumAttempts: 5,
    nonRetryableErrorTypes: ['NonRetryableError', 'ValidationError', 'FatalError', 'ResourceExhaustionError'],
  },
};

/**
 * Adaptateur pour la gestion des retries avec Temporal
 */
export class TemporalRetryAdapter {
  private checkpointManager: CheckpointManager;
  
  constructor() {
    this.checkpointManager = new CheckpointManager();
  }

  /**
   * Obtient la politique de retry Temporal en fonction du type d'activité
   * @param policyType Type de politique de retry
   * @param customOptions Options personnalisées
   */
  getRetryPolicy(policyType: RetryPolicyType = RetryPolicyType.DEFAULT, customOptions: Partial<RetryPolicy> = {}): RetryPolicy {
    const basePolicy = RETRY_POLICIES[policyType];
    return {
      ...basePolicy,
      ...customOptions,
    };
  }

  /**
   * Configure les activités avec des politiques de retry adaptées
   * @param activities Activités à configurer
   * @param policyType Type de politique par défaut
   */
  configureActivityRetries<T>(activities: T, policyType: RetryPolicyType = RetryPolicyType.DEFAULT): T {
    return proxyActivities<T>({
      startToCloseTimeout: '10m',
      retry: this.getRetryPolicy(policyType),
    });
  }

  /**
   * Adapte les retries en fonction des métadonnées du checkpoint
   * @param checkpoint Point de contrôle avec métadonnées
   */
  adaptRetryFromCheckpoint(checkpoint: WorkflowCheckpoint): RetryPolicy {
    const { metadata } = checkpoint;
    if (!metadata?.retryStrategy) {
      return this.getRetryPolicy();
    }

    const { retryStrategy } = metadata;
    const retryPolicy: RetryPolicy = {
      initialInterval: `${retryStrategy.initialDelayMs}ms`,
      backoffCoefficient: retryStrategy.backoffCoefficient,
      maximumInterval: `${retryStrategy.maxDelayMs}ms`,
      maximumAttempts: retryStrategy.maxAttempts,
    };

    // Adapter les types d'erreurs non-retryables
    if (retryStrategy.errorCategories.nonRetryable) {
      retryPolicy.nonRetryableErrorTypes = ['NonRetryableError', 'ValidationError'];
    }

    return retryPolicy;
  }

  /**
   * Crée une query Temporal pour exposer l'état du checkpoint
   */
  createCheckpointQuery() {
    return defineQuery<WorkflowCheckpoint | null>('getCheckpointState');
  }

  /**
   * Gère une erreur d'activité et met à jour le checkpoint
   * @param error Erreur survenue
   * @param checkpoint Point de contrôle actuel
   */
  async handleActivityError(error: Error, checkpoint: WorkflowCheckpoint): Promise<{ shouldRetry: boolean; updatedCheckpoint: WorkflowCheckpoint }> {
    // Déterminer le type d'erreur
    const errorType = this.categorizeError(error);
    
    // Mettre à jour la stratégie de retry
    const updatedCheckpoint = this.checkpointManager.calculateRetryStrategy(checkpoint, errorType);
    
    // Sauvegarder le checkpoint mis à jour
    await this.checkpointManager.saveCheckpoint(checkpoint.workflowId, {
      ...updatedCheckpoint,
      status: CheckpointStatus.FAILED,
    });
    
    // Déterminer s'il faut réessayer
    const shouldRetry = this.checkpointManager.canResume(updatedCheckpoint);
    
    // Si on va réessayer, mettre à jour le statut
    if (shouldRetry) {
      await this.checkpointManager.saveCheckpoint(checkpoint.workflowId, {
        ...updatedCheckpoint,
        status: CheckpointStatus.RETRYING,
      });
    }
    
    return { shouldRetry, updatedCheckpoint };
  }

  /**
   * Catégorise une erreur pour déterminer la stratégie de retry appropriée
   * @param error Erreur à catégoriser
   */
  private categorizeError(error: Error): string {
    const errorName = error.name;
    const errorMessage = error.message.toLowerCase();
    
    if (errorName === 'NetworkError' || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return 'transient';
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('resource')) {
      return 'resource';
    }
    
    if (errorName === 'ValidationError' || errorName.includes('Fatal')) {
      return 'fatal';
    }
    
    return 'unknown';
  }
}