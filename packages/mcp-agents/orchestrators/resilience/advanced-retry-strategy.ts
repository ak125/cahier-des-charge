import { WorkflowCheckpoint, CheckpointStatus, WorkflowError } from '../persistence/types';
import { createLogger } from '../../utils/logger';

/**
 * Catégories d'erreurs pour la stratégie de retry
 */
export enum ErrorType {
  // Erreurs temporaires qui peuvent se résoudre automatiquement
  TRANSIENT = 'transient',
  // Erreurs liées aux ressources (mémoire, CPU, disque)
  RESOURCE = 'resource',
  // Erreurs de dépendances externes
  DEPENDENCY = 'dependency',
  // Erreurs de base de données
  DATABASE = 'database',
  // Erreurs de concurrence
  CONCURRENCY = 'concurrency',
  // Erreurs de validation des données
  VALIDATION = 'validation',
  // Erreurs fatales qui ne peuvent pas être résolues par un retry
  FATAL = 'fatal',
  // Erreurs non classifiées
  UNKNOWN = 'unknown'
}

/**
 * Configuration du disjoncteur
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;       // Nombre d'échecs consécutifs avant ouverture
  resetTimeoutMs: number;         // Délai avant tentative de fermeture
  halfOpenSuccessThreshold?: number; // Nombre de succès nécessaires en état semi-ouvert
}

/**
 * Configuration de la stratégie de retry avancée
 */
export interface AdvancedRetryConfig {
  maxAttempts: number;           // Nombre maximum de tentatives
  initialDelayMs: number;        // Délai initial entre les tentatives
  maxDelayMs: number;            // Délai maximum entre les tentatives
  backoffCoefficient: number;    // Coefficient d'augmentation du délai
  jitterMaxMs?: number;          // Variation aléatoire maximale du délai
  timeoutMs?: number;            // Timeout global pour toutes les tentatives
  errorCategories?: Partial<Record<ErrorType, boolean>>; // Types d'erreurs qui déclenchent un retry
  circuitBreaker?: CircuitBreakerConfig; // Configuration du disjoncteur
}

/**
 * État du disjoncteur
 */
export enum CircuitState {
  CLOSED = 'closed',     // Circuit fermé, les opérations sont autorisées
  OPEN = 'open',         // Circuit ouvert, les opérations sont bloquées
  HALF_OPEN = 'half-open' // Circuit semi-ouvert, certaines opérations sont autorisées pour tester
}

/**
 * Interface pour les métriques de retry
 */
export interface RetryMetrics {
  attempts: number;           // Nombre de tentatives effectuées
  successes: number;          // Nombre de succès
  failures: number;           // Nombre d'échecs
  consecutiveFailures: number; // Nombre d'échecs consécutifs
  lastAttemptTime?: Date;     // Heure de la dernière tentative
  totalDurationMs: number;    // Durée totale depuis la première tentative
}

/**
 * Stratégie de retry avancée avec classification des erreurs et disjoncteur
 */
export class AdvancedRetryStrategy {
  private config: AdvancedRetryConfig;
  private logger = createLogger('AdvancedRetryStrategy');
  private circuitState: CircuitState = CircuitState.CLOSED;
  private lastStateChangeTime: Date = new Date();
  private metrics: RetryMetrics = {
    attempts: 0,
    successes: 0,
    failures: 0,
    consecutiveFailures: 0,
    totalDurationMs: 0
  };
  
  constructor(config: AdvancedRetryConfig) {
    // Valeurs par défaut
    this.config = {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      backoffCoefficient: 2,
      jitterMaxMs: 1000,
      errorCategories: {
        [ErrorType.TRANSIENT]: true,
        [ErrorType.RESOURCE]: true,
        [ErrorType.DEPENDENCY]: true,
        [ErrorType.DATABASE]: true,
        [ErrorType.CONCURRENCY]: true,
        [ErrorType.VALIDATION]: false,
        [ErrorType.FATAL]: false,
        [ErrorType.UNKNOWN]: true
      },
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 60000, // 1 minute
        halfOpenSuccessThreshold: 1
      },
      ...config
    };
    
    this.logger.debug('Stratégie de retry initialisée avec la configuration:', this.config);
  }
  
  /**
   * Détermine si une autre tentative doit être effectuée
   * @param checkpoint Point de contrôle actuel
   */
  canRetry(checkpoint: WorkflowCheckpoint): boolean {
    // Vérifier si le circuit est ouvert (disjoncteur)
    if (this.circuitState === CircuitState.OPEN) {
      const elapsedMs = Date.now() - this.lastStateChangeTime.getTime();
      
      // Si le délai de reset est écoulé, passer en état semi-ouvert
      if (elapsedMs >= this.config.circuitBreaker!.resetTimeoutMs) {
        this.logger.info('Circuit passé de OPEN à HALF_OPEN après la période de refroidissement');
        this.circuitState = CircuitState.HALF_OPEN;
      } else {
        // Le circuit est encore ouvert, pas de retry
        this.logger.debug('Retry bloqué: circuit ouvert');
        return false;
      }
    }
    
    // Vérifier la stratégie de retry dans le checkpoint
    const retryStrategy = checkpoint.metadata?.retryStrategy;
    if (!retryStrategy) {
      this.logger.warn('Pas de stratégie de retry dans le checkpoint');
      return false;
    }
    
    // Vérifier le nombre maximal de tentatives
    if (retryStrategy.attempts >= this.config.maxAttempts) {
      this.logger.debug(`Nombre maximum de tentatives atteint: ${retryStrategy.attempts}/${this.config.maxAttempts}`);
      return false;
    }
    
    // Vérifier le timeout global
    if (this.config.timeoutMs) {
      const firstAttemptTime = new Date(retryStrategy.firstAttemptTime).getTime();
      const elapsedMs = Date.now() - firstAttemptTime;
      
      if (elapsedMs >= this.config.timeoutMs) {
        this.logger.debug(`Timeout global dépassé: ${elapsedMs}ms / ${this.config.timeoutMs}ms`);
        return false;
      }
    }
    
    // Vérifier si l'erreur est retriable
    if (checkpoint.errors && checkpoint.errors.length > 0) {
      const lastError = checkpoint.errors[checkpoint.errors.length - 1];
      const errorType = lastError.type || ErrorType.UNKNOWN;
      
      const shouldRetry = this.config.errorCategories?.[errorType as ErrorType];
      if (shouldRetry === false) {
        this.logger.debug(`Erreur non retriable: ${errorType}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Classifie une erreur par type
   * @param error Erreur à classifier
   */
  classifyError(error: Error): ErrorType {
    // Classification par nom d'erreur
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();
    
    // Erreurs de connexion / réseau
    if (
      errorName.includes('connection') ||
      errorName.includes('network') ||
      errorName.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset')
    ) {
      return ErrorType.DEPENDENCY;
    }
    
    // Erreurs de base de données
    if (
      errorName.includes('sql') ||
      errorName.includes('db') ||
      errorName.includes('database') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('database') ||
      errorMessage.includes('query')
    ) {
      return ErrorType.DATABASE;
    }
    
    // Erreurs de ressources
    if (
      errorName.includes('memory') ||
      errorName.includes('cpu') ||
      errorName.includes('disk') ||
      errorMessage.includes('memory') ||
      errorMessage.includes('out of') ||
      errorMessage.includes('resource')
    ) {
      return ErrorType.RESOURCE;
    }
    
    // Erreurs de validation
    if (
      errorName.includes('validation') ||
      errorName.includes('invalid') ||
      errorName.includes('syntax') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('required')
    ) {
      return ErrorType.VALIDATION;
    }
    
    // Erreurs de concurrence
    if (
      errorName.includes('lock') ||
      errorName.includes('conflict') ||
      errorName.includes('concurrent') ||
      errorMessage.includes('lock') ||
      errorMessage.includes('conflict') ||
      errorMessage.includes('already exists')
    ) {
      return ErrorType.CONCURRENCY;
    }
    
    // Erreurs fatales
    if (
      errorName.includes('fatal') ||
      errorName.includes('critical') ||
      errorMessage.includes('fatal') ||
      errorMessage.includes('unrecoverable')
    ) {
      return ErrorType.FATAL;
    }
    
    // Par défaut: erreur transitoire
    return ErrorType.TRANSIENT;
  }
  
  /**
   * Met à jour la stratégie de retry dans le checkpoint
   * @param checkpoint Point de contrôle à mettre à jour
   * @param error Erreur rencontrée
   */
  updateRetryStrategy(checkpoint: WorkflowCheckpoint, error: Error): WorkflowCheckpoint {
    // Initialiser les métadonnées si nécessaires
    if (!checkpoint.metadata) {
      checkpoint.metadata = {};
    }
    
    // Initialiser ou récupérer la stratégie de retry
    let retryStrategy = checkpoint.metadata.retryStrategy || {
      attempts: 0,
      firstAttemptTime: new Date().toISOString(),
      maxAttempts: this.config.maxAttempts
    };
    
    // Mettre à jour les compteurs
    retryStrategy.attempts++;
    this.metrics.attempts = retryStrategy.attempts;
    this.metrics.failures++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastAttemptTime = new Date();
    
    // Classifier l'erreur
    const errorType = this.classifyError(error);
    
    // Si on a rencontré une erreur non retriable, marquer la tentative comme fatale
    if (this.config.errorCategories?.[errorType] === false) {
      retryStrategy.isFatal = true;
      this.logger.warn(`Erreur fatale rencontrée (${errorType}), pas de retry`);
    }
    
    // Mettre à jour la gestion du circuit
    if (this.metrics.consecutiveFailures >= (this.config.circuitBreaker?.failureThreshold || 3)) {
      if (this.circuitState === CircuitState.CLOSED) {
        this.circuitState = CircuitState.OPEN;
        this.lastStateChangeTime = new Date();
        retryStrategy.circuitState = CircuitState.OPEN;
        retryStrategy.circuitOpenTime = new Date().toISOString();
        this.logger.warn(
          `Circuit ouvert après ${this.metrics.consecutiveFailures} échecs consécutifs`
        );
      }
    }
    
    // Calculer le délai pour la prochaine tentative
    const baseDelayMs = Math.min(
      this.config.initialDelayMs * Math.pow(this.config.backoffCoefficient, retryStrategy.attempts - 1),
      this.config.maxDelayMs
    );
    
    // Ajouter un jitter (variation aléatoire) pour éviter les tempêtes de requêtes
    const jitterMs = this.config.jitterMaxMs 
      ? Math.floor(Math.random() * this.config.jitterMaxMs) 
      : 0;
    
    const delayMs = baseDelayMs + jitterMs;
    retryStrategy.nextRetryTime = new Date(Date.now() + delayMs).toISOString();
    retryStrategy.currentDelayMs = delayMs;
    retryStrategy.errorType = errorType;
    
    this.logger.debug(
      `Prochaine tentative dans ${delayMs}ms (${new Date(retryStrategy.nextRetryTime).toLocaleString()}), ` +
      `erreur de type ${errorType}`
    );
    
    // Sauvegarder la stratégie dans le checkpoint
    checkpoint.metadata.retryStrategy = retryStrategy;
    return checkpoint;
  }
  
  /**
   * Enregistre un succès après une reprise
   */
  recordSuccess(): void {
    this.metrics.successes++;
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastAttemptTime = new Date();
    
    // Si le circuit était semi-ouvert, vérifier s'il faut le fermer
    if (this.circuitState === CircuitState.HALF_OPEN) {
      const threshold = this.config.circuitBreaker?.halfOpenSuccessThreshold || 1;
      if (this.metrics.successes >= threshold) {
        this.circuitState = CircuitState.CLOSED;
        this.lastStateChangeTime = new Date();
        this.logger.info('Circuit fermé après un succès en état semi-ouvert');
      }
    }
  }
  
  /**
   * Réinitialise les métriques de retry
   */
  resetMetrics(): void {
    this.metrics = {
      attempts: 0,
      successes: 0,
      failures: 0,
      consecutiveFailures: 0,
      totalDurationMs: 0
    };
  }
  
  /**
   * Nettoie les ressources utilisées
   */
  close(): void {
    // Rien à nettoyer pour l'instant
    this.logger.debug('Stratégie de retry fermée');
  }
}