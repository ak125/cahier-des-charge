/**
 * Utilitaires pour les agents
 * Fonctions communes utilisées par tous les agents
 */

import { AgentResult } from '../orchestration/types.ts';

/**
 * Mesure le temps d'exécution d'une fonction
 * @param fn Fonction à mesurer
 * @returns Résultat et durée d'exécution
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}

/**
 * Exécute une fonction avec un nombre de tentatives maximum
 * @param fn Fonction à exécuter
 * @param retries Nombre de tentatives
 * @param delay Délai entre les tentatives (en ms)
 * @returns Résultat de la fonction
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Crée un résultat d'agent réussi
 * @param data Données du résultat
 * @param duration Durée d'exécution
 * @returns Résultat d'agent
 */
export function createSuccessResult<T>(data: T, duration?: number): AgentResult<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
    duration,
  };
}

/**
 * Crée un résultat d'agent en échec
 * @param error Erreur
 * @param duration Durée d'exécution
 * @returns Résultat d'agent
 */
export function createErrorResult(error: Error | string, duration?: number): AgentResult<never> {
  return {
    success: false,
    error,
    timestamp: Date.now(),
    duration,
  };
}

/**
 * Transforme une fonction standard en une fonction compatible avec l'API des agents
 * @param fn Fonction à transformer
 * @returns Fonction compatible avec l'API des agents
 */
export function toAgentFunction<TParams extends any[], TResult>(
  fn: (...args: TParams) => Promise<TResult>
): (...args: TParams) => Promise<AgentResult<TResult>> {
  return async (...args: TParams): Promise<AgentResult<TResult>> => {
    try {
      const { result, duration } = await measureExecutionTime(() => fn(...args));
      return createSuccessResult(result, duration);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error : String(error));
    }
  };
}
