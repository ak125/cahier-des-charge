/**
 * Agent de base pour la catégorie seo
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { SeoAgentOptions, SeoResult } from './types';

/**
 * Classe de base pour tous les agents seo
 */
export abstract class BaseSeoAgent<
  TOptions extends SeoAgentOptions = SeoAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie seo
   */

  /**
   * Optimiser le contenu pour le référencement
   */
  protected optimizeContent(_content: string, _keywords: string[]): string {
    // Implémentation par défaut
    return _content;
  }
}
