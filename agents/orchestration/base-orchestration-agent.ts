/**
 * Agent de base pour la catégorie orchestration
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { OrchestrationAgentOptions, OrchestrationResult } from './types';

/**
 * Classe de base pour tous les agents orchestration
 */
export abstract class BaseOrchestrationAgent<
  TOptions extends OrchestrationAgentOptions = OrchestrationAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie orchestration
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processOrchestrationTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
