/**
 * Abstract Scheduler Agent
 * 
 * Classe abstraite pour les agents de planification de la couche orchestration.
 * Étend la classe AbstractOrchestrationAgent et implémente l'interface SchedulerAgent.
 */

import { SchedulerAgent, AgentResult } from 'mcp-types';
import { AbstractOrchestrationAgent } from './abstract-orchestration-agent';

/**
 * Type pour représenter une tâche planifiée
 */
export interface ScheduledTask {
  id: string;
  target: string;
  schedule: string;
  inputs: Record<string, any>;
  nextExecutionTime: string;
  lastExecutionTime?: string;
  lastExecutionResult?: {
    success: boolean;
    message?: string;
    error?: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Classe abstraite pour les agents de planification
 */
export abstract class AbstractSchedulerAgent extends AbstractOrchestrationAgent implements SchedulerAgent {

  /**
   * Map des tâches planifiées
   */
  protected scheduledTasks: Map<string, ScheduledTask> = new Map();

  /**
   * Constructeur de la classe AbstractSchedulerAgent
   * @param id Identifiant unique de l'agent
   * @param name Nom descriptif de l'agent
   * @param version Version de l'agent
   * @param options Options de configuration de l'agent
   */
  constructor(
    id: string,
    name: string,
    version: string,
    options?: Record<string, any>
  ) {
    super(id, name, version, options);
    this.type = 'scheduler';
  }

  /**
   * Planifie l'exécution d'un agent ou d'un workflow
   * @param target Agent ou workflow à planifier
   * @param schedule Expression cron ou timing de planification
   * @param inputs Données d'entrée pour l'exécution planifiée
   */
  public abstract schedule(target: string, schedule: string, inputs: Record<string, any>): Promise<string>;

  /**
   * Annule une tâche planifiée
   * @param scheduleId Identifiant de la planification
   */
  public abstract cancelSchedule(scheduleId: string): Promise<boolean>;

  /**
   * Démarre l'orchestration d'un workflow ou d'un processus
   * @param workflow Identifiant ou définition du workflow à orchestrer
   * @param context Contexte d'exécution incluant les paramètres nécessaires
   */
  public async orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult> {
    try {
      // Pour l'agent de planification, l'orchestration consiste à configurer une planification
      let target: string;
      let schedule: string;
      let inputs: Record<string, any>;

      if (typeof workflow === 'string') {
        // Si c'est une chaîne, on la considère comme l'identifiant de la cible
        target = workflow;
        schedule = context.schedule || '* * * * *'; // Par défaut, chaque minute
        inputs = context.inputs || {};
      } else {
        // Si c'est un objet, on extrait les paramètres de planification
        const workflowObj = workflow as Record<string, any>;
        target = workflowObj.target || workflowObj.id;
        schedule = workflowObj.schedule || context.schedule || '* * * * *';
        inputs = workflowObj.inputs || context.inputs || {};
      }

      // Planifier l'exécution
      const scheduleId = await this.schedule(target, schedule, inputs);

      return this.createSuccessResult({
        scheduleId,
        target,
        schedule,
        status: 'scheduled'
      }, "Exécution planifiée avec succès");

    } catch (error) {
      return this.createErrorResult(error, { operation: 'orchestrate-schedule' });
    }
  }

  /**
   * Vérifie si une expression cron est valide
   * @param cronExpression Expression cron à valider
   * @returns true si l'expression est valide, false sinon
   */
  protected validateCronExpression(cronExpression: string): boolean {
    // Validation d'une expression cron basique (5 ou 6 segments)
    const segments = cronExpression.trim().split(/\s+/);

    if (segments.length < 5 || segments.length > 6) {
      return false;
    }

    // Validation de base des segments (pourrait être améliorée pour une validation plus complète)
    const validationPatterns = [
      /^(\*|([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?(,([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?)*|\*\/([0-9]|[1-5][0-9]))$/, // Minutes: 0-59
      /^(\*|([0-9]|1[0-9]|2[0-3])(-([0-9]|1[0-9]|2[0-3]))?(,([0-9]|1[0-9]|2[0-3])(-([0-9]|1[0-9]|2[0-3]))?)*|\*\/([0-9]|1[0-9]|2[0-3]))$/, // Heures: 0-23
      /^(\*|([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?(,([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?)*|\*\/([1-9]|[12][0-9]|3[01]))$/, // Jours du mois: 1-31
      /^(\*|([1-9]|1[0-2])(-([1-9]|1[0-2]))?(,([1-9]|1[0-2])(-([1-9]|1[0-2]))?)*|\*\/([1-9]|1[0-2]))$/, // Mois: 1-12
      /^(\*|[0-6](-[0-6])?(,[0-6](-[0-6])?)*|\*\/[0-6])$/ // Jours de la semaine: 0-6
    ];

    // Si 6 segments, le dernier est l'année (optionnel)
    if (segments.length === 6) {
      validationPatterns.push(/^(\*|20[0-9]{2}(-20[0-9]{2})?(,20[0-9]{2}(-20[0-9]{2})?)*|\*\/[1-9][0-9]*)$/); // Années: 2000-2099
    }

    for (let i = 0; i < segments.length; i++) {
      if (!validationPatterns[i].test(segments[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calcule la prochaine date d'exécution pour une expression cron
   * @param cronExpression Expression cron
   * @returns Date au format ISO ou null si l'expression est invalide
   */
  protected abstract calculateNextExecutionTime(cronExpression: string): string | null;

  /**
   * Récupère une tâche planifiée par son ID
   * @param scheduleId ID de la tâche
   * @returns La tâche planifiée ou null si non trouvée
   */
  protected getScheduledTask(scheduleId: string): ScheduledTask | null {
    return this.scheduledTasks.get(scheduleId) || null;
  }

  /**
   * Met à jour le statut d'une tâche planifiée
   * @param scheduleId ID de la tâche
   * @param status Nouveau statut
   * @param metadata Métadonnées additionnelles
   */
  protected updateTaskStatus(scheduleId: string, status: 'active' | 'paused' | 'completed' | 'error', metadata?: Record<string, any>): boolean {
    const task = this.scheduledTasks.get(scheduleId);
    if (!task) return false;

    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (metadata) {
      task.metadata = {
        ...(task.metadata || {}),
        ...metadata
      };
    }

    this.scheduledTasks.set(scheduleId, task);

    // Émettre un événement pour le changement de statut
    this.emit('scheduler:task-status-change', {
      scheduleId,
      status,
      timestamp: task.updatedAt,
      metadata: task.metadata
    });

    return true;
  }

  /**
   * Enregistre le résultat d'exécution d'une tâche planifiée
   * @param scheduleId ID de la tâche
   * @param success Indicateur de succès
   * @param resultDetails Détails du résultat
   */
  protected recordTaskExecution(scheduleId: string, success: boolean, resultDetails?: Record<string, any>): boolean {
    const task = this.scheduledTasks.get(scheduleId);
    if (!task) return false;

    const now = new Date().toISOString();

    task.lastExecutionTime = now;
    task.lastExecutionResult = {
      success,
      message: resultDetails?.message,
      error: success ? undefined : (resultDetails?.error || 'Unknown error')
    };

    // Calculer la prochaine date d'exécution
    const nextTime = this.calculateNextExecutionTime(task.schedule);
    if (nextTime) {
      task.nextExecutionTime = nextTime;
    } else {
      // Si pas de prochaine exécution, marquer comme terminé
      task.status = 'completed';
    }

    task.updatedAt = now;
    this.scheduledTasks.set(scheduleId, task);

    // Émettre un événement pour l'exécution
    this.emit('scheduler:task-executed', {
      scheduleId,
      success,
      executionTime: now,
      nextExecutionTime: task.nextExecutionTime,
      result: task.lastExecutionResult
    });

    return true;
  }

  /**
   * Nettoie les tâches terminées ou en erreur ayant dépassé un âge donné
   * @param maxAgeMs Âge maximum en millisecondes (par défaut: 7 jours)
   */
  protected cleanupOldTasks(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const now = new Date();

    this.scheduledTasks.forEach((task, id) => {
      if (task.status === 'completed' || task.status === 'error') {
        const lastUpdated = new Date(task.updatedAt);
        const ageMs = now.getTime() - lastUpdated.getTime();

        if (ageMs > maxAgeMs) {
          // Émettre un événement avant suppression
          this.emit('scheduler:task-cleanup', {
            scheduleId: id,
            status: task.status,
            lastUpdated: task.updatedAt,
            reason: 'age-limit-exceeded'
          });

          this.scheduledTasks.delete(id);
        }
      }
    });
  }

  /**
   * Génère un ID unique pour une tâche planifiée
   * @returns Un identifiant unique
   */
  protected generateScheduleId(): string {
    return `sch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}