import { Client, Connection, WorkflowClient } from '@temporalio/client';
import { WorkflowExecutionDescription } from '@temporalio/common';
import { AbstractOrchestratorAgent } from '../abstract-orchestrator';
import {
  ActivityOptions,
  OrchestrationAbstraction,
  WorkflowExecutionOptions,
  WorkflowInstance,
  WorkflowStatus,
} from '../three-layer/AbstractionLayer';
import {
  ErrorHandler,
  HealthStatus,
  OrchestrationAdapter,
  OrchestratorCapabilities,
  ValidationResult,
  WorkflowDefinition,
} from '../three-layer/AdapterLayer';

/**
 * Adaptateur pour le système d'orchestration Temporal.io
 */
export class TemporalAdapter
  extends AbstractOrchestratorAgent<any, any>
  implements OrchestrationAdapter
{
  readonly name = 'Temporal.io';
  readonly version = '1.0.0';
  readonly capabilities: OrchestratorCapabilities = {
    parallelExecution: true,
    childWorkflows: true,
    signaling: true,
    longRunning: true,
    versioning: true,
    retry: true,
    compensation: true,
    monitoring: true,
    metrics: true,
  };

  private errorHandler: ErrorHandler | null = null;
  private client: WorkflowClient;
  private connection: Connection;

  constructor(config: {
    address?: string;
    namespace?: string;
    tls?: boolean;
    connectionOptions?: any;
  }) {
    // Initialisation du client Temporal.io avec la configuration
    this.initializeClient(config);
    console.info(`Adaptateur Temporal.io ${this.version} initialisé`);
  }

  /**
   * Initialise le client Temporal.io avec la configuration fournie
   */
  private async initializeClient(config: {
    address?: string;
    namespace?: string;
    tls?: boolean;
    connectionOptions?: any;
  }) {
    try {
      // Création de la connexion Temporal.io
      this.connection = await Connection.connect({
        address: config.address || 'localhost:7233',
        tls: config.tls ? {} : undefined,
        ...config.connectionOptions,
      });

      // Création du client Temporal.io
      this.client = new Client({
        connection: this.connection,
        namespace: config.namespace || 'default',
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation du client Temporal.io:", error);
      if (this.errorHandler) {
        this.errorHandler.handleError('connection', error);
      }
    }
  }

  /**
   * Valide si une définition de workflow est compatible avec Temporal.io
   */
  async validateWorkflowDefinition(
    workflowDefinition: WorkflowDefinition
  ): Promise<ValidationResult> {
    try {
      // Validation de la définition selon les contraintes de Temporal.io
      const errors: string[] = [];

      // Vérification des contraintes spécifiques à Temporal
      if (!workflowDefinition.id) {
        errors.push("L'ID du workflow est requis pour Temporal.io");
      }

      if (workflowDefinition.activities.length === 0) {
        errors.push('Le workflow doit contenir au moins une activité');
      }

      // Vérifier que les activités ont des noms uniques
      const activityNames = workflowDefinition.activities.map((a) => a.name);
      if (new Set(activityNames).size !== activityNames.length) {
        errors.push('Les noms des activités doivent être uniques dans Temporal.io');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('validation', error);
      }
      return {
        valid: false,
        errors: [`Erreur de validation: ${error.message}`],
      };
    }
  }

  /**
   * Convertit un workflow générique en format natif de Temporal.io
   */
  convertToNativeFormat(genericDefinition: WorkflowDefinition): any {
    // Conversion du format générique au format Temporal.io
    return {
      workflowId: genericDefinition.id,
      taskQueue: genericDefinition.queue || 'default',
      workflowExecutionTimeout: genericDefinition.timeout
        ? `${genericDefinition.timeout}s`
        : undefined,
      activities: genericDefinition.activities.map((activity) => ({
        name: activity.name,
        taskQueue: activity.queue || 'default',
        retryPolicy: activity.retryPolicy
          ? {
              maximumAttempts: activity.retryPolicy.maxAttempts || 3,
              initialInterval: activity.retryPolicy.initialDelay || 1,
            }
          : undefined,
        input: activity.input,
      })),
      signals: genericDefinition.signals || [],
      queries: genericDefinition.queries || [],
    };
  }

  /**
   * Convertit un workflow au format natif de Temporal.io en format générique
   */
  convertFromNativeFormat(nativeDefinition: any): WorkflowDefinition {
    // Conversion du format Temporal.io au format générique
    return {
      id: nativeDefinition.workflowId,
      name: nativeDefinition.workflowId,
      description: nativeDefinition.description || '',
      version: nativeDefinition.version || '1.0.0',
      queue: nativeDefinition.taskQueue || 'default',
      timeout: nativeDefinition.workflowExecutionTimeout
        ? parseInt(nativeDefinition.workflowExecutionTimeout.replace('s', ''))
        : undefined,
      activities: (nativeDefinition.activities || []).map((activity) => ({
        name: activity.name,
        description: activity.description || '',
        type: 'task',
        queue: activity.taskQueue || 'default',
        retryPolicy: activity.retryPolicy
          ? {
              maxAttempts: activity.retryPolicy.maximumAttempts || 3,
              initialDelay: activity.retryPolicy.initialInterval || 1,
            }
          : undefined,
        input: activity.input || {},
      })),
      signals: nativeDefinition.signals || [],
      queries: nativeDefinition.queries || [],
    };
  }

  /**
   * Enregistre un gestionnaire d'erreurs
   */
  registerErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  /**
   * Vérifie l'état de santé de la connexion à Temporal.io
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      // Utilisation de l'API de santé du SDK officiel
      const response = await this.client.workflowService.healthCheck();
      return {
        healthy: response.ok === true,
        details: {
          service: 'Temporal.io',
          status: response.ok ? 'connected' : 'disconnected',
        },
      };
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('connection', error);
      }
      return {
        healthy: false,
        details: {
          service: 'Temporal.io',
          status: 'error',
          message: error.message,
        },
      };
    }
  }

  // Implémentation des méthodes de OrchestrationAbstraction

  async startWorkflow(
    definition: WorkflowDefinition,
    input: any,
    options?: WorkflowExecutionOptions
  ): Promise<WorkflowInstance> {
    try {
      const temporalDefinition = this.convertToNativeFormat(definition);

      // Utilisation du SDK officiel pour démarrer un workflow
      const handle = await this.client.workflow.start(temporalDefinition.workflowId, {
        taskQueue: temporalDefinition.taskQueue,
        workflowId: temporalDefinition.workflowId,
        args: [input],
        workflowExecutionTimeout: temporalDefinition.workflowExecutionTimeout,
        ...(options?.version ? { workflowIdReusePolicy: options.version } : {}),
        ...(options?.searchAttributes ? { searchAttributes: options.searchAttributes } : {}),
      });

      return {
        id: handle.workflowId,
        status: WorkflowStatus.RUNNING,
        startTime: new Date(),
        definition: definition,
        handle: handle,
      };
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('execution', error);
      }
      throw new Error(`Erreur lors du démarrage du workflow: ${error.message}`);
    }
  }

  async getWorkflowStatus(instanceId: string): Promise<WorkflowStatus> {
    try {
      // Récupération du workflow par son ID
      const handle = this.client.workflow.getHandle(instanceId);
      const description = await handle.describe();

      // Mappage des statuts Temporal vers statuts génériques
      return this.mapTemporalStatusToGeneric(description.status.name);
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('status', error);
      }
      throw new Error(`Erreur lors de la récupération du statut: ${error.message}`);
    }
  }

  /**
   * Mappe un statut Temporal.io vers un statut générique
   */
  private mapTemporalStatusToGeneric(temporalStatus: string): WorkflowStatus {
    switch (temporalStatus) {
      case 'RUNNING':
        return WorkflowStatus.RUNNING;
      case 'COMPLETED':
        return WorkflowStatus.COMPLETED;
      case 'FAILED':
        return WorkflowStatus.FAILED;
      case 'TIMED_OUT':
        return WorkflowStatus.TIMED_OUT;
      case 'CANCELED':
        return WorkflowStatus.CANCELLED;
      case 'TERMINATED':
        return WorkflowStatus.CANCELLED;
      case 'CONTINUED_AS_NEW':
        return WorkflowStatus.RUNNING;
      default:
        return WorkflowStatus.UNKNOWN;
    }
  }

  async terminateWorkflow(instanceId: string, reason?: string): Promise<void> {
    try {
      // Terminaison du workflow par son ID
      const handle = this.client.workflow.getHandle(instanceId);
      await handle.terminate(reason || "Terminé par l'API");
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('termination', error);
      }
      throw new Error(`Erreur lors de la terminaison du workflow: ${error.message}`);
    }
  }

  async signalWorkflow(instanceId: string, signalName: string, payload?: any): Promise<void> {
    try {
      // Envoi d'un signal au workflow
      const handle = this.client.workflow.getHandle(instanceId);
      await handle.signal(signalName, payload);
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('signaling', error);
      }
      throw new Error(`Erreur lors de l'envoi du signal au workflow: ${error.message}`);
    }
  }

  async queryWorkflow(instanceId: string, queryName: string, args?: any[]): Promise<any> {
    try {
      // Interrogation du workflow
      const handle = this.client.workflow.getHandle(instanceId);
      return await handle.query(queryName, ...(args || []));
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('querying', error);
      }
      throw new Error(`Erreur lors de l'interrogation du workflow: ${error.message}`);
    }
  }

  /**
   * Récupère l'historique d'exécution d'un workflow
   */
  async getWorkflowHistory(instanceId: string): Promise<any> {
    try {
      const handle = this.client.workflow.getHandle(instanceId);
      const history = await handle.fetchHistory();
      return history;
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('history', error);
      }
      throw new Error(
        `Erreur lors de la récupération de l'historique du workflow: ${error.message}`
      );
    }
  }

  /**
   * Réinitialise un workflow échoué
   */
  async resetWorkflow(instanceId: string, reason?: string): Promise<WorkflowInstance> {
    try {
      const handle = this.client.workflow.getHandle(instanceId);
      const resetHandle = await handle.reset({
        reason: reason || "Réinitialisé par l'API",
      });

      // Récupération des informations sur le workflow réinitialisé
      const description = await resetHandle.describe();

      return {
        id: resetHandle.workflowId,
        status: this.mapTemporalStatusToGeneric(description.status.name),
        startTime: new Date(description.startTime),
        definition: await this.getWorkflowDefinition(instanceId),
        handle: resetHandle,
      };
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('reset', error);
      }
      throw new Error(`Erreur lors de la réinitialisation du workflow: ${error.message}`);
    }
  }

  /**
   * Récupère la définition d'un workflow à partir de son ID
   */
  private async getWorkflowDefinition(instanceId: string): Promise<WorkflowDefinition> {
    try {
      const handle = this.client.workflow.getHandle(instanceId);
      const description = await handle.describe();

      // Construction de la définition à partir des informations disponibles
      // Cette implémentation est simplifiée et pourrait être améliorée
      return {
        id: description.workflowId,
        name: description.workflowType.name,
        description: '',
        version: '1.0.0',
        queue: description.taskQueue,
        timeout: description.executionTimeout
          ? parseInt(description.executionTimeout.replace('s', ''))
          : undefined,
        activities: [], // Les activités ne sont pas directement accessibles via l'API
      };
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError('definition', error);
      }
      throw new Error(
        `Erreur lors de la récupération de la définition du workflow: ${error.message}`
      );
    }
  }
}
