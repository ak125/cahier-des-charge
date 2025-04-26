/**
 * Agent de base pour la catégorie integration
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { IntegrationAgentOptions, IntegrationResult } from './types';

/**
 * Classe de base pour tous les agents integration
 */
export abstract class BaseIntegrationAgent<
  TOptions extends IntegrationAgentOptions = IntegrationAgentOptions,
  TResult = any
> extends BaseAgent<TOptions, TResult> {
  constructor(options?: Partial<TOptions>) {
    super(options);
  }

  /**
   * Fonctions utilitaires spécifiques à la catégorie integration
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processIntegrationTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
