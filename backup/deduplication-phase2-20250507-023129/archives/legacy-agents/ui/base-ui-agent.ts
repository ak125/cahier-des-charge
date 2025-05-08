/**
 * Agent de base pour la catégorie ui
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { UiAgentOptions, UiResult } from './types';

/**
 * Classe de base pour tous les agents ui
 */
export abstract class BaseUiAgent<
  TOptions extends UiAgentOptions = UiAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie ui
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processUiTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
