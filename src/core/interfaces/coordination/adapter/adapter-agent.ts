/**
 * Adaptateur pour services externes
 *
 * Fait partie de la Couche de coordination - Communication entre les agents et intégration
 * Responsabilité: Faciliter la communication entre les agents, assurer l'interopérabilité et gérer les intégrations externes
 */

import { BaseAgent } from '../../../core/interfaces/BaseAgent';

export interface AdapterAgent extends BaseAgent {
  /**
   * Adapte les données pour un format spécifique
   */
  adapt(data: any, targetFormat: string): Promise<any>;

  /**
   * Obtient un client pour un service externe
   */
  getClient(serviceName: string): Promise<any>;
}

// Types utilisés par l'interface
export type AdapterOptions = Record<string, any>;
export interface AdapterResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
