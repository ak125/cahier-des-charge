/**
 * Agent de base pour la catégorie pipeline
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { PipelineAgentOptions, PipelineResult } from './types';

/**
 * Classe de base pour tous les agents pipeline
 */
export abstract class BasePipelineAgent<
  TOptions extends PipelineAgentOptions = PipelineAgentOptions,
  TResult = any
> extends BaseAgent<TOptions, TResult> {
  constructor(options?: Partial<TOptions>) {
    super(options);
  }

  /**
   * Fonctions utilitaires spécifiques à la catégorie pipeline
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processPipelineTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
