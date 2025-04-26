/**
 * Agent de base pour la catégorie workers
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { WorkersAgentOptions, WorkersResult } from './types';

/**
 * Classe de base pour tous les agents workers
 */
export abstract class BaseWorkersAgent<
  TOptions extends WorkersAgentOptions = WorkersAgentOptions,
  TResult = any
> extends BaseAgent<TOptions, TResult> {
  constructor(options?: Partial<TOptions>) {
    super(options);
  }

  /**
   * Fonctions utilitaires spécifiques à la catégorie workers
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processWorkersTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
