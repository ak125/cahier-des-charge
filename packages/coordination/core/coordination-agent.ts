import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de coordination
 * Responsable de la coordination entre différents agents et services
 */
export interface CoordinationAgent extends BaseAgent {
  /**
   * Coordonne l'exécution d'une série d'actions entre différents agents
   * @param actionPlan Plan des actions à coordonner
   * @param context Contexte d'exécution partagé
   */
  coordinate(actionPlan: Record<string, any>[], context: Record<string, any>): Promise<AgentResult>;

  /**
   * Récupère l'état actuel d'une coordination en cours
   * @param coordinationId Identifiant de la coordination
   */
  getCoordinationStatus(coordinationId: string): Promise<Record<string, any>>;
}