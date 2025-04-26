/**
 * Agent de base pour la catégorie api
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { ApiAgentOptions, ApiResult } from './types';

/**
 * Classe de base pour tous les agents api
 */
export abstract class BaseApiAgent<
  TOptions extends ApiAgentOptions = ApiAgentOptions,
  TResult = any
> extends BaseAgent<TOptions, TResult> {
  constructor(options?: Partial<TOptions>) {
    super(options);
  }

  /**
   * Fonctions utilitaires spécifiques à la catégorie api
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processApiTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
