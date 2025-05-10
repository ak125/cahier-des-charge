/**
 * Orchestrateur Standardisé
 *
 * Module central pour la rationalisation et l'unification des orchestrateurs avec des rôles clairement définis:
 * - Temporal: exclusivement pour les workflows complexes nécessitant un état persistant et une gestion avancée du cycle de vie
 * - BullMQ: exclusivement pour les tâches simples et files d'attente rapides
 * - n8n: exclusivement pour les intégrations externes (webhooks, API tierces)
 */

import { TaskDefinition, TaskResult, TaskStatus } from './orchestrator-adapter';
import { unifiedOrchestrator } from './unified-orchestrator';

/**
 * Types de tâches que notre système peut gérer
 */
export enum TaskType {
  RAPID_QUEUE = 'rapid_queue',   // Tâche simple et rapide gérée exclusivement par BullMQ
  COMPLEX_WORKFLOW = 'complex_workflow', // Workflow complexe géré exclusivement par Temporal
  EXTERNAL_INTEGRATION = 'external_integration', // Intégration externe via n8n exclusivement
}

/**
 * Options pour la configuration du workflow Temporal (workflows complexes uniquement)
 */
export interface TemporalWorkflowOptions {
  workflowType: string;
  workflowArgs: any[];
  workflowId?: string;
  taskQueue: string;
  historyRetention?: string;  // Par exemple, '30d' pour 30 jours de conservation
}

/**
 * Options pour la configuration des files BullMQ (tâches rapides uniquement)
 */
export interface BullMQOptions {
  queueName: string;
  jobId?: string;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

/**
 * Options pour la configuration des intégrations n8n (intégrations externes uniquement)
 */
export interface N8nIntegrationOptions {
  workflowId: string;
  webhookUrl?: string;
  credentials?: Record<string, any>;
  integrationSource?: 'github' | 'gitlab' | 'jenkins' | 'jira' | 'slack' | 'other';
}

/**
 * Interface principale de l'orchestrateur standardisé
 */
export interface StandardizedTaskOptions {
  delay?: number;
  timeout?: number;
  taskType: TaskType;
  // Options spécifiques selon le type de tâche
  temporal?: TemporalWorkflowOptions;
  bullmq?: BullMQOptions;
  n8n?: N8nIntegrationOptions;
}

/**
 * Classe d'orchestration standardisée et unifiée
 * Point d'entrée unique pour toutes les tâches d'orchestration
 * avec séparation claire des responsabilités
 */
export class StandardizedOrchestrator {
  /**
   * Planifie une tâche en utilisant l'orchestrateur approprié selon le type
   */
  async scheduleTask(
    taskName: string,
    payload: any,
    options: StandardizedTaskOptions
  ): Promise<string> {
    switch (options.taskType) {
      case TaskType.RAPID_QUEUE:
        // Utiliser BullMQ exclusivement pour les files d'attente rapides
        return this.scheduleRapidQueueTask(taskName, payload, options);

      case TaskType.COMPLEX_WORKFLOW:
        // Utiliser Temporal exclusivement pour les workflows complexes
        return this.scheduleComplexWorkflow(taskName, payload, options);

      case TaskType.EXTERNAL_INTEGRATION:
        // Utiliser n8n exclusivement pour les intégrations externes
        return this.scheduleExternalIntegration(taskName, payload, options);

      default:
        throw new Error(`Type de tâche non supporté: ${options.taskType}`);
    }
  }

  /**
   * Planifie une tâche rapide avec BullMQ
   * BullMQ est optimisé pour le traitement rapide et efficace des files d'attente
   */
  private async scheduleRapidQueueTask(
    taskName: string,
    payload: any,
    options: StandardizedTaskOptions
  ): Promise<string> {
    if (!options.bullmq) {
      throw new Error('Les options BullMQ sont requises pour les tâches de file rapide');
    }

    const { queueName, jobId, priority, attempts, backoff } = options.bullmq;

    // Utiliser notre adaptateur standardisé pour BullMQ
    const { bullmqAdapter } = await import('./adapters/standardized-bullmq-adapter');

    // Préparer les options du job
    const jobOptions: any = {
      queueName,
      priority,
      delay: options.delay,
      attempts: attempts || 3,
      jobId,
      backoff: backoff ? {
        type: backoff.type,
        delay: backoff.delay
      } : undefined
    };

    // Ajouter le job à la file d'attente
    const jobId2 = await bullmqAdapter.addJob(taskName, payload, jobOptions);

    console.log(`Tâche rapide ajoutée: ${jobId2} (file: ${queueName})`);

    return jobId2;
  }

  /**
   * Planifie un workflow complexe avec Temporal
   * Temporal est utilisé exclusivement pour gérer les workflows complexes avec état persistant
   */
  private async scheduleComplexWorkflow(
    taskName: string,
    payload: any,
    options: StandardizedTaskOptions
  ): Promise<string> {
    if (!options.temporal) {
      throw new Error('Les options Temporal sont requises pour les workflows complexes');
    }

    const { workflowType, workflowArgs, workflowId, taskQueue, historyRetention } = options.temporal;

    // Utiliser notre adaptateur standardisé pour Temporal
    const { temporalAdapter } = await import('./adapters/standardized-temporal-adapter');
    await temporalAdapter.initialize();

    // Préparer les options du workflow
    const startOptions = {
      workflowId: workflowId || undefined,
      taskQueue,
      ...(historyRetention ? { workflowExecutionTimeout: historyRetention } : {})
    };

    // Démarrer le workflow et récupérer son ID
    const result = await temporalAdapter.startWorkflow(
      workflowType,
      workflowArgs,
      startOptions
    );

    // Enregistrer des métriques ou des journaux pour le suivi
    console.log(`Workflow complexe démarré: ${result.workflowId}`);

    return result.workflowId;
  }

  /**
   * Planifie une intégration externe exclusivement via n8n
   * n8n est utilisé uniquement pour les intégrations avec des systèmes externes
   */
  private async scheduleExternalIntegration(
    taskName: string,
    payload: any,
    options: StandardizedTaskOptions
  ): Promise<string> {
    if (!options.n8n) {
      throw new Error('Les options n8n sont requises pour les intégrations externes');
    }

    // Import dynamique du client n8n
    const { n8nClient } = await import('./n8n-client');

    // Exécuter le workflow n8n approprié avec les données
    const integrationId = await n8nClient.triggerWorkflow({
      workflowId: options.n8n.workflowId,
      payload: {
        ...payload,
        taskName,
        source: options.n8n.integrationSource || 'mcp',
        timestamp: new Date().toISOString(),
      },
      webhookUrl: options.n8n.webhookUrl,
      credentials: options.n8n.credentials,
    });

    // Journalisation de l'intégration externe
    console.log(`Intégration externe démarrée: ${integrationId} (${options.n8n.integrationSource || 'générique'})`);

    return integrationId;
  }

  /**
   * Récupère le statut d'une tâche, quelle que soit son type,
   * en interrogeant l'orchestrateur approprié
   */
  async getTaskStatus(taskId: string, taskType?: TaskType): Promise<TaskResult> {
    // Si le type est spécifié, nous interrogeons directement le bon orchestrateur
    if (taskType) {
      switch (taskType) {
        case TaskType.RAPID_QUEUE:
          return await unifiedOrchestrator.getTaskStatus(taskId);

        case TaskType.COMPLEX_WORKFLOW:
          return await this.getTemporalWorkflowStatus(taskId);

        case TaskType.EXTERNAL_INTEGRATION:
          return await this.getN8nIntegrationStatus(taskId);

        default:
          throw new Error(`Type de tâche non supporté: ${taskType}`);
      }
    }

    // Si type non spécifié, nous essayons de façon séquentielle les différents orchestrateurs
    try {
      // Essayer d'abord BullMQ pour les tâches rapides
      return await unifiedOrchestrator.getTaskStatus(taskId);
    } catch (_error) {
      try {
        // Si pas trouvé dans BullMQ, essayer Temporal pour les workflows complexes
        return await this.getTemporalWorkflowStatus(taskId);
      } catch (_temporalError) {
        try {
          // Enfin, essayer n8n pour les intégrations externes
          return await this.getN8nIntegrationStatus(taskId);
        } catch (_n8nError) {
          throw new Error(`Tâche non trouvée: ${taskId}`);
        }
      }
    }
  }

  /**
   * Récupère le statut d'un workflow Temporal
   */
  private async getTemporalWorkflowStatus(workflowId: string): Promise<TaskResult> {
    // Utiliser notre adaptateur standardisé pour Temporal
    const { temporalAdapter } = await import('./adapters/standardized-temporal-adapter');
    await temporalAdapter.initialize();

    // Récupérer le statut du workflow via l'adaptateur
    const workflowStatus = await temporalAdapter.getWorkflowStatus(workflowId);

    // Mapper le statut Temporal vers notre format TaskStatus
    let status: TaskStatus;
    switch (workflowStatus.status) {
      case 'COMPLETED':
        status = TaskStatus.COMPLETED;
        break;
      case 'FAILED':
        status = TaskStatus.FAILED;
        break;
      case 'RUNNING':
        status = TaskStatus.RUNNING;
        break;
      case 'CANCELED':
        status = TaskStatus.CANCELED;
        break;
      case 'TERMINATED':
        status = TaskStatus.TERMINATED;
        break;
      case 'TIMED_OUT':
        status = TaskStatus.TIMED_OUT;
        break;
      default:
        status = TaskStatus.PENDING;
    }

    // Récupérer le résultat si le workflow est terminé
    let result, error;
    if (status === TaskStatus.COMPLETED) {
      const resultData = await temporalAdapter.getWorkflowResult(workflowId);
      result = resultData.result;
    } else if (status === TaskStatus.FAILED) {
      const resultData = await temporalAdapter.getWorkflowResult(workflowId);
      error = resultData.error;
    }

    // Construire et retourner le résultat standardisé
    return {
      id: workflowId,
      name: workflowStatus.workflowId.split('-')[0],  // Extraction du nom du workflow à partir de l'ID
      status,
      source: 'TEMPORAL',
      createdAt: new Date(), // L'adaptateur devrait fournir ces informations dans une future mise à jour
      updatedAt: new Date(),
      startedAt: new Date(),
      completedAt: status !== TaskStatus.RUNNING ? new Date() : undefined,
      result,
      error
    };
  }

  // Les méthodes fetchTemporalResult et fetchTemporalError sont maintenant gérées par l'adaptateur standardisé

  /**
   * Récupère le statut d'une intégration n8n
   */
  private async getN8nIntegrationStatus(integrationId: string): Promise<TaskResult> {
    const { n8nClient } = await import('./n8n-client');
    const status = await n8nClient.getWorkflowStatus(integrationId);

    return {
      id: integrationId,
      name: status.name || 'n8n-integration',
      status: this.mapN8nStatusToTaskStatus(status.status),
      source: 'N8N',
      createdAt: new Date(status.startedAt),
      updatedAt: new Date(status.lastUpdated),
      startedAt: new Date(status.startedAt),
      completedAt: status.finishedAt ? new Date(status.finishedAt) : undefined,
      result: status.result,
      error: status.error
    };
  }

  /**
   * Mappe les statuts n8n vers notre format standardisé
   */
  private mapN8nStatusToTaskStatus(n8nStatus: string): TaskStatus {
    switch (n8nStatus.toLowerCase()) {
      case 'success':
      case 'completed':
        return TaskStatus.COMPLETED;
      case 'error':
      case 'failed':
        return TaskStatus.FAILED;
      case 'running':
        return TaskStatus.RUNNING;
      case 'waiting':
        return TaskStatus.PENDING;
      case 'canceled':
        return TaskStatus.CANCELED;
      case 'timeout':
        return TaskStatus.TIMED_OUT;
      default:
        return TaskStatus.PENDING;
    }
  }

  /**
   * Annule une tâche, quel que soit son type
   */
  async cancelTask(taskId: string, taskType?: TaskType): Promise<boolean> {
    // Si le type est spécifié, nous ciblons directement le bon orchestrateur
    if (taskType) {
      switch (taskType) {
        case TaskType.RAPID_QUEUE:
          return await unifiedOrchestrator.cancelTask(taskId);

        case TaskType.COMPLEX_WORKFLOW:
          return await this.cancelTemporalWorkflow(taskId);

        case TaskType.EXTERNAL_INTEGRATION:
          return await this.cancelN8nIntegration(taskId);

        default:
          throw new Error(`Type de tâche non supporté: ${taskType}`);
      }
    }

    // Si type non spécifié, nous essayons de façon séquentielle les différents orchestrateurs
    try {
      // Essayer d'abord BullMQ
      return await unifiedOrchestrator.cancelTask(taskId);
    } catch (_error) {
      try {
        // Si pas trouvé dans BullMQ, essayer Temporal
        return await this.cancelTemporalWorkflow(taskId);
      } catch (_temporalError) {
        try {
          // Enfin, essayer n8n
          return await this.cancelN8nIntegration(taskId);
        } catch (_n8nError) {
          return false;
        }
      }
    }
  }

  /**
   * Annule un workflow Temporal
   */
  private async cancelTemporalWorkflow(workflowId: string): Promise<boolean> {
    // Utiliser notre adaptateur standardisé pour Temporal
    const { temporalAdapter } = await import('./adapters/standardized-temporal-adapter');
    await temporalAdapter.initialize();

    // Annuler le workflow via l'adaptateur
    return temporalAdapter.cancelWorkflow(workflowId, 'Annulation via orchestrateur standardisé');
  }

  /**
   * Annule une intégration n8n
   */
  private async cancelN8nIntegration(integrationId: string): Promise<boolean> {
    const { n8nClient } = await import('./n8n-client');
    return await n8nClient.stopWorkflow(integrationId);
  }
}

// Exporter un singleton pour faciliter l'utilisation
export const standardizedOrchestrator = new StandardizedOrchestrator();
