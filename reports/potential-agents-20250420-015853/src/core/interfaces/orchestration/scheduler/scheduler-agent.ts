/**
 * Planificateur de tâches
 * 
 * Fait partie de la Couche d'orchestration - Gestion des workflows et coordination de haut niveau
 * Responsabilité: Gérer le cycle de vie des workflows, coordonner l'exécution des agents, et assurer la fiabilité du système
 */

import { BaseAgent } from '../../../core/interfaces/BaseAgent';

export interface SchedulerAgent extends BaseAgent {

  /**
   * Planifie une tâche à exécuter
   */
  schedule(task: Task, options: ScheduleOptions): Promise<string>;

  /**
   * Annule une tâche planifiée
   */
  cancelSchedule(scheduleId: string): Promise<boolean>;
}

// Types utilisés par l'interface
export type SchedulerOptions = Record<string, any>;
export interface SchedulerResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
