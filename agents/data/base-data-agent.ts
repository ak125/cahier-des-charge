/**
 * Agent de base pour la catégorie data
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { DataAgentOptions, DataResult } from './types';

/**
 * Classe de base pour tous les agents data
 */
export abstract class BaseDataAgent<
  TOptions extends DataAgentOptions = DataAgentOptions,
  TResult = any
> extends BaseAgent<TOptions, TResult> {
  constructor(options?: Partial<TOptions>) {
    super(options);
  }

  /**
   * Fonctions utilitaires spécifiques à la catégorie data
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processDataTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
