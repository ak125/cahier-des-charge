/**
 * Couche d'orchestration - Gestion des workflows et coordination de haut niveau
 * 
 * Responsabilité: Gérer le cycle de vie des workflows, coordonner l'exécution des agents, et assurer la fiabilité du système
 */

import { BaseAgent } from '../base-agent';

/**
 * Agent responsable de la coordination et du séquencement des workflows
 */
export interface OrchestratorAgent extends BaseAgent {
  /**
   * Démarre un workflow avec les entrées spécifiées
   *
   * @param workflowDefinition La définition du workflow à exécuter
   * @param input Les données d'entrée pour le workflow
   * @returns L'identifiant du workflow démarré
   */
  startWorkflow(workflowDefinition: WorkflowDefinition, input: Record<string, any>): Promise<string>;

  /**
   * Obtient l'état actuel d'un workflow
   *
   * @param workflowId L'identifiant du workflow
   * @returns L'état actuel du workflow
   */
  getStatus(workflowId: string): Promise<WorkflowStatus>;

  /**
   * Annule un workflow en cours d'exécution
   *
   * @param workflowId L'identifiant du workflow
   * @param reason La raison de l'annulation
   * @returns Vrai si le workflow a bien été annulé
   */
  cancelWorkflow(workflowId: string, reason?: string): Promise<boolean>;

}

/**
 * Agent responsable de la planification et de l'exécution périodique des tâches
 */
export interface SchedulerAgent extends BaseAgent {
  /**
   * Planifie une tâche pour une exécution future
   *
   * @param task La définition de la tâche à planifier
   * @param scheduleOptions Les options de planification (cron, délai, etc.)
   * @returns L'identifiant de la tâche planifiée
   */
  schedule(task: TaskDefinition, scheduleOptions: ScheduleOptions): Promise<string>;

  /**
   * Annule une tâche planifiée
   *
   * @param taskId L'identifiant de la tâche planifiée
   * @returns Vrai si la tâche planifiée a bien été annulée
   */
  cancelScheduledTask(taskId: string): Promise<boolean>;

  /**
   * Obtient la liste des tâches planifiées
   *
   * @returns La liste des tâches planifiées
   */
  getScheduledTasks(): Promise<ScheduledTask[]>;

}

/**
 * Agent responsable de la surveillance et du reporting des performances et des erreurs système
 */
export interface MonitorAgent extends BaseAgent {
  /**
   * Démarre la surveillance d'un composant ou d'un processus
   *
   * @param target La cible à surveiller
   * @param options Les options de surveillance
   * @returns L'identifiant de la session de surveillance
   */
  startMonitoring(target: MonitoringTarget, options?: MonitoringOptions): Promise<string>;

  /**
   * Arrête la surveillance
   *
   * @param monitoringId L'identifiant de la session de surveillance
   * @returns Une promesse qui se résout lorsque la surveillance est arrêtée
   */
  stopMonitoring(monitoringId: string): Promise<void>;

  /**
   * Récupère les métriques de surveillance
   *
   * @param monitoringId L'identifiant de la session de surveillance
   * @param timeRange La plage de temps pour laquelle récupérer les métriques
   * @returns Les données de métriques collectées
   */
  getMetrics(monitoringId: string, timeRange?: TimeRange): Promise<MetricsData>;

}

