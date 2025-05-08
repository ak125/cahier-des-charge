/**
 * Agent de base pour la catégorie monitoring
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { MonitoringAgentOptions, MonitoringResult } from './types';

/**
 * Classe de base pour tous les agents monitoring
 */
export abstract class BaseMonitoringAgent<
  TOptions extends MonitoringAgentOptions = MonitoringAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie monitoring
   */

  /**
   * Vérifier l'état d'une ressource
   */
  protected async checkStatus(resourceId: string): Promise<boolean> {
    this.log('info', `Vérification du statut de ${resourceId}`);
    // Logique de vérification à implémenter
    return true;
  }
}
