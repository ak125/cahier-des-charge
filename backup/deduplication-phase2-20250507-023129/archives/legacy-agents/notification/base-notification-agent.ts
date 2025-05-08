/**
 * Agent de base pour la catégorie notification
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { NotificationAgentOptions, NotificationResult } from './types';

/**
 * Classe de base pour tous les agents notification
 */
export abstract class BaseNotificationAgent<
  TOptions extends NotificationAgentOptions = NotificationAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie notification
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processNotificationTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
