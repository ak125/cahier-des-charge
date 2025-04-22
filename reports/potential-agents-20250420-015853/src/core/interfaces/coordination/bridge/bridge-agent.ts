/**
 * Pont d'intégration
 * 
 * Fait partie de la Couche de coordination - Communication entre les agents et intégration
 * Responsabilité: Faciliter la communication entre les agents, assurer l'interopérabilité et gérer les intégrations externes
 */

import { BaseAgent } from '../../../core/interfaces/BaseAgent';

export interface BridgeAgent extends BaseAgent {

  /**
   * Établit une connexion entre deux systèmes
   */
  connect(source: SystemEndpoint, target: SystemEndpoint): Promise<Connection>;

  /**
   * Transfère des données entre deux systèmes
   */
  transfer(connection: Connection, data: any): Promise<TransferResult>;
}

// Types utilisés par l'interface
export type BridgeOptions = Record<string, any>;
export interface BridgeResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
