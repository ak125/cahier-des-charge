/**
 * Agent de base pour la catégorie audit
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { AuditAgentOptions, AuditResult } from './types';

/**
 * Classe de base pour tous les agents audit
 */
export abstract class BaseAuditAgent<
  TOptions extends AuditAgentOptions = AuditAgentOptions,
  TResult = any
> extends BaseAgent<TOptions, TResult> {
  constructor(options?: Partial<TOptions>) {
    super(options);
  }

  /**
   * Fonctions utilitaires spécifiques à la catégorie audit
   */

  /**
   * Auditer une ressource et retourner les problèmes détectés
   */
  protected async auditResource(resourcePath: string): Promise<string[]> {
    this.log('info', `Audit de la ressource ${resourcePath}`);
    // Logique d'audit à implémenter
    return [];
  }
}
