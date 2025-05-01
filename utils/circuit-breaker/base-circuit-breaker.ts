/**
 * Interface de base pour le circuit breaker
 * Définit les méthodes communes à tous les circuit breakers
 */
import { EventEmitter } from 'events';

export enum CircuitState {
  CLOSED = 'closed', // Circuit fermé = fonctionnement normal
  OPEN = 'open', // Circuit ouvert = blocage des requêtes
  HALF_OPEN = 'half-open', // Circuit semi-ouvert = test de rétablissement
}

export enum CircuitEvent {
  STATE_CHANGE = 'state-change',
  SUCCESS = 'success',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
  REJECTED = 'rejected',
  FALLBACK_SUCCESS = 'fallback-success',
  FALLBACK_FAILURE = 'fallback-failure',
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Nombre d'échecs avant ouverture du circuit
  resetTimeout: number; // Temps en ms avant passage en semi-ouvert
  monitorInterval?: number; // Intervalle pour le monitoring
  maxRetries?: number; // Nombre maximum de tentatives
  timeout?: number; // Délai d'attente max en ms
  volumeThreshold?: number; // Nombre min de requêtes avant déclenchement
  errorPercentageThreshold?: number; // Pourcentage d'erreur déclenchant l'ouverture
  enabled?: boolean; // Circuit breaker actif ou non
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  rejected: number;
  lastFailureTime?: Date;
  lastFailureReason?: string;
  lastSuccessTime?: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalRequests: number;
  errorRate: number;
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  fallbackUsed?: boolean;
  circuitState: CircuitState;
  duration: number;
  traceId?: string;
}

export abstract class BaseCircuitBreaker extends EventEmitter {
  protected state: CircuitState = CircuitState.CLOSED;
  protected stats: CircuitBreakerStats;
  protected options: CircuitBreakerOptions;
  protected resetTimer: NodeJS.Timeout | null = null;

  constructor(options: CircuitBreakerOptions) {
    super();
    this.options = {
      enabled: true,
      monitorInterval: 10000,
      maxRetries: 3,
      timeout: 30000,
      volumeThreshold: 5,
      errorPercentageThreshold: 50,
      ...options,
    };

    this.stats = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      rejected: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalRequests: 0,
      errorRate: 0,
    };
  }

  /**
   * Exécute la fonction protégée par le circuit breaker
   * @param fn Fonction à exécuter
   * @param fallback Fonction de repli en cas d'échec (optionnelle)
   * @param context Contexte d'exécution (pour logging, traçabilité, etc.)
   */
  public abstract execute<T>(
    fn: () => Promise<T>,
    fallback?: (error: Error, context?: any) => Promise<T>,
    context?: any
  ): Promise<CircuitBreakerResult<T>>;

  /**
   * Force l'ouverture du circuit
   */
  public abstract forceOpen(): void;

  /**
   * Force la fermeture du circuit
   */
  public abstract forceClose(): void;

  /**
   * Récupère les statistiques actuelles
   */
  public getStats(): CircuitBreakerStats {
    return { ...this.stats };
  }

  /**
   * Récupère l'état actuel du circuit
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Réinitialise les statistiques
   */
  public resetStats(): void {
    this.stats = {
      state: this.state,
      failures: 0,
      successes: 0,
      rejected: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalRequests: 0,
      errorRate: 0,
    };
  }

  /**
   * Vérifie si le circuit est ouvert
   */
  public isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Vérifie si le circuit est fermé
   */
  public isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Vérifie si le circuit est semi-ouvert
   */
  public isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }

  /**
   * Méthode protégée pour transition d'état
   * @param newState Nouvel état du circuit
   * @param reason Raison du changement d'état
   */
  protected transitionState(newState: CircuitState, reason: string): void {
    if (this.state === newState) return;

    const previousState = this.state;
    this.state = newState;
    this.stats.state = newState;

    this.emit(CircuitEvent.STATE_CHANGE, {
      from: previousState,
      to: newState,
      reason,
      time: new Date(),
      stats: this.getStats(),
    });
  }
}
