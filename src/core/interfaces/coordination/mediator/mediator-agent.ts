/**
 * Médiateur entre agents
 * 
 * Fait partie de la Couche de coordination - Communication entre les agents et intégration
 * Responsabilité: Faciliter la communication entre les agents, assurer l'interopérabilité et gérer les intégrations externes
 */

import { BaseAgent } from '../../../core/interfaces/base-agent';

export interface MediatorAgent extends BaseAgent {

  /**
   * Enregistre un agent auprès du médiateur
   */
  register(agent: Agent): Promise<void>;

  /**
   * Facilite la communication entre agents
   */
  communicate(fromAgent: string, toAgent: string, message: any): Promise<any>;

  /**
   * Diffuse un message à tous les agents enregistrés
   */
  broadcast(message: any, filter?: (agent: Agent) => boolean): Promise<void>;
}

// Types utilisés par l'interface
export type MediatorOptions = Record<string, any>;
export interface MediatorResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
