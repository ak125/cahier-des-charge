/**
 * Agent de base pour la catégorie quality
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { QualityAgentOptions, QualityResult } from './types';

/**
 * Classe de base pour tous les agents quality
 */
export abstract class BaseQualityAgent<
  TOptions extends QualityAgentOptions = QualityAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie quality
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processQualityTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
