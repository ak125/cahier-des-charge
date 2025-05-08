/**
 * Agent de base pour la catégorie utils
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { UtilsAgentOptions, UtilsResult } from './types';

/**
 * Classe de base pour tous les agents utils
 */
export abstract class BaseUtilsAgent<
  TOptions extends UtilsAgentOptions = UtilsAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie utils
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processUtilsTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
