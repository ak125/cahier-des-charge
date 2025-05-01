/**
 * Agent de base pour la catégorie migration
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { MigrationAgentOptions, MigrationResult } from './types';

/**
 * Classe de base pour tous les agents migration
 */
export abstract class BaseMigrationAgent<
  TOptions extends MigrationAgentOptions = MigrationAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie migration
   */

  /**
   * Migrer des données d'un format à un autre
   */
  protected async migrateData<T, U>(source: T, transformer: (data: T) => U): Promise<U> {
    this.log('info', 'Début de la migration des données');
    // Logique de migration à implémenter
    return transformer(source);
  }
}
