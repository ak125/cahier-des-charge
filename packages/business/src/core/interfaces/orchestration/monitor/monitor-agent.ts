/**
 * Moniteur d'exécution
 *
 * Fait partie de la Couche d'orchestration - Gestion des workflows et coordination de haut niveau
 * Responsabilité: Gérer le cycle de vie des workflows, coordonner l'exécution des agents, et assurer la fiabilité du système
 */

import { BaseAgent } from '../../../core/interfaces/base-agent';

export interface MonitorAgent extends BaseAgent {
  /**
   * Suit l'exécution d'un workflow
   */
  trackExecution(workflowId: string): Promise<void>;

  /**
   * Obtient les métriques d'exécution
   */
  getMetrics(timeframe: TimeRange): Promise<ExecutionMetrics>;
}

// Types utilisés par l'interface
export type MonitorOptions = Record<string, any>;
export interface MonitorResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
