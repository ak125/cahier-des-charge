import { Injectable } from '@nestjs/common';
import {
  StandardizedTaskOptions,
  TaskType,
  standardizedOrchestrator,
} from './standardized-orchestrator';

/**
 * Service NestJS pour l'orchestrateur standardisé
 * Fournit une interface injectable pour l'orchestrateur standardisé
 */
@Injectable()
export class StandardizedOrchestratorService {
  /**
   * Planifie une tâche standardisée
   * @param taskName Le nom de la tâche à planifier
   * @param payload Les données à fournir à la tâche
   * @param options Options de configuration de la tâche
   * @returns Un identifiant unique pour la tâche planifiée
   */
  async scheduleTask(
    taskName: string,
    payload: any,
    options: StandardizedTaskOptions
  ): Promise<string> {
    return standardizedOrchestrator.scheduleTask(taskName, payload, options);
  }

  /**
   * Planifie une tâche simple via BullMQ (helper)
   */
  async scheduleSimpleTask(
    taskName: string,
    payload: any,
    options: Omit<StandardizedTaskOptions, 'taskType'>
  ): Promise<string> {
    return standardizedOrchestrator.scheduleTask(taskName, payload, {
      ...options,
      taskType: TaskType.SIMPLE,
    });
  }

  /**
   * Planifie un workflow complexe via Temporal (helper)
   */
  async scheduleComplexWorkflow(
    taskName: string,
    payload: any,
    options: Omit<StandardizedTaskOptions, 'taskType'> & {
      temporal: NonNullable<StandardizedTaskOptions['temporal']>;
    }
  ): Promise<string> {
    return standardizedOrchestrator.scheduleTask(taskName, payload, {
      ...options,
      taskType: TaskType.COMPLEX,
    });
  }

  /**
   * Planifie une intégration externe via n8n (helper)
   */
  async scheduleExternalIntegration(
    taskName: string,
    payload: any,
    options: Omit<StandardizedTaskOptions, 'taskType'> & {
      n8n: NonNullable<StandardizedTaskOptions['n8n']>;
    }
  ): Promise<string> {
    return standardizedOrchestrator.scheduleTask(taskName, payload, {
      ...options,
      taskType: TaskType.INTEGRATION,
    });
  }

  /**
   * Récupère le statut d'une tâche
   * @param taskId L'identifiant de la tâche
   */
  async getTaskStatus(taskId: string) {
    return standardizedOrchestrator.getTaskStatus(taskId);
  }

  /**
   * Annule une tâche
   * @param taskId L'identifiant de la tâche à annuler
   */
  async cancelTask(taskId: string): Promise<boolean> {
    return standardizedOrchestrator.cancelTask(taskId);
  }
}
