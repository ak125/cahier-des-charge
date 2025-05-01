/**
 * Orchestrateur de workflows
 *
 * Fait partie de la Couche d'orchestration - Gestion des workflows et coordination de haut niveau
 * Responsabilité: Gérer le cycle de vie des workflows, coordonner l'exécution des agents, et assurer la fiabilité du système
 */

import { BaseAgent } from '../../../core/interfaces/BaseAgent';

export interface OrchestratorAgent extends BaseAgent {
  /**
   * Démarre un nouveau workflow
   */
  startWorkflow(
    workflowDefinition: WorkflowDefinition,
    input: Record<string, any>
  ): Promise<WorkflowExecution>;

  /**
   * Obtient le statut d'un workflow
   */
  getStatus(workflowId: string): Promise<WorkflowStatus>;

  /**
   * Annule un workflow en cours
   */
  cancelWorkflow(workflowId: string, reason?: string): Promise<boolean>;
}

// Types utilisés par l'interface
export type OrchestratorOptions = Record<string, any>;
export interface OrchestratorResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
