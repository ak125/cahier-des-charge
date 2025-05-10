import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de planification dans la couche d'orchestration
 * Responsable de la planification et de l'exécution programmée des tâches
 */
export interface SchedulerAgent extends BaseAgent {
  /**
   * Planifie une tâche pour une exécution future
   * @param taskId Identifiant de la tâche
   * @param cronExpression Expression cron définissant la planification
   * @param taskData Données nécessaires pour l'exécution de la tâche
   */
  scheduleTask(taskId: string, cronExpression: string, taskData: Record<string, any>): Promise<AgentResult>;

  /**
   * Annule une tâche planifiée
   * @param taskId Identifiant de la tâche à annuler
   */
  cancelTask(taskId: string): Promise<AgentResult>;

  /**
   * Récupère le statut d'une tâche planifiée
   * @param taskId Identifiant de la tâche
   */
  getTaskStatus(taskId: string): Promise<Record<string, any>>;
}