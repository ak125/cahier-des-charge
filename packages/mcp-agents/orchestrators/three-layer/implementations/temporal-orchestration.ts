/**
 * Implémentation de la couche d'orchestration basée sur Temporal
 * 
 * Cette implémentation utilise Temporal.io comme moteur d'orchestration sous-jacent
 * pour gérer l'exécution des workflows et la coordination des tâches.
 */

import { Connection, Client } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { WorkflowClient } from '@temporalio/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  OrchestrationAbstraction,
  WorkflowDefinition,
  ExecutionOptions,
  TaskOptions,
  ExecutionResult,
  JobStatus
} from '../abstraction-layer';

/**
 * Options de configuration pour l'orchestrateur Temporal
 */
interface TemporalOrchestratorOptions {
  /**
   * URL du serveur Temporal
   */
  serverUrl: string;

  /**
   * Namespace Temporal
   */
  namespace: string;

  /**
   * Chemin vers les implémentations des workflows Temporal
   */
  workflowsPath: string;

  /**
   * Chemin vers les implémentations des activités Temporal
   */
  activitiesPath: string;

  /**
   * Liste des files d'attente de tâches à surveiller
   */
  taskQueues: string[];

  /**
   * Options de connexion additionnelles
   */
  connectionOptions?: any;
}

/**
 * Implémentation de l'orchestration basée sur Temporal
 */
export class TemporalOrchestrator implements OrchestrationAbstraction {
  private client: Client;
  private workers: Worker[] = [];
  private options: TemporalOrchestratorOptions;
  private workflowRegistry: Map<string, any> = new Map();
  private initialized: boolean = false;

  constructor(options: TemporalOrchestratorOptions) {
    this.options = options;
  }

  /**
   * Initialise la connexion à Temporal et démarre les workers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Établir la connexion à Temporal
      const connection = await Connection.connect({
        address: this.options.serverUrl,
        // Ajouter d'autres options de connexion si nécessaire
        ...this.options.connectionOptions
      });

      // Créer le client Temporal
      this.client = new Client({
        connection,
        namespace: this.options.namespace
      });

      // Démarrer les workers pour chaque file d'attente de tâches
      for (const queue of this.options.taskQueues) {
        const worker = await Worker.create({
          workflowsPath: this.options.workflowsPath,
          activitiesPath: this.options.activitiesPath,
          taskQueue: queue,
          namespace: this.options.namespace,
          connection
        });

        // Démarrer le worker
        await worker.run();
        this.workers.push(worker);
        console.log(`Worker started for task queue: ${queue}`);
      }

      this.initialized = true;
      console.log('Temporal orchestrator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Temporal orchestrator:', error);
      throw new Error(`Orchestrator initialization failed: ${error.message}`);
    }
  }

  /**
   * Enregistre un workflow dans l'orchestrateur
   */
  async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    try {
      // Nous ne avons pas besoin d'enregistrer explicitement les workflows avec Temporal
      // car ils sont automatiquement chargés à partir du chemin spécifié
      // Mais nous gardons une référence pour notre suivi interne
      this.workflowRegistry.set(workflow.id, {
        ...workflow,
        registeredAt: new Date()
      });

      console.log(`Workflow ${workflow.id} registered successfully`);
    } catch (error) {
      console.error(`Failed to register workflow ${workflow.id}:`, error);
      throw new Error(`Workflow registration failed: ${error.message}`);
    }
  }

  /**
   * Exécute un workflow enregistré
   */
  async executeWorkflow(workflowId: string, options: ExecutionOptions): Promise<ExecutionResult> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    try {
      const workflow = this.workflowRegistry.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not registered`);
      }

      // Créer un ID d'exécution unique si non fourni
      const executionId = options.executionId || `${workflowId}-${uuidv4()}`;

      // Créer un client de workflow Temporal
      const workflowClient = this.client.workflow.getHandle(executionId, workflowId);

      // Démarrer le workflow
      await this.client.workflow.start(workflow.workflowName, {
        taskQueue: options.taskQueue || this.options.taskQueues[0],
        workflowId: executionId,
        args: [options.input]
      });

      return {
        executionId,
        status: 'RUNNING',
        startTime: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to execute workflow ${workflowId}:`, error);
      throw new Error(`Workflow execution failed: ${error.message}`);
    }
  }

  /**
   * Soumet une tâche pour exécution
   */
  async submitTask(taskType: string, options: TaskOptions): Promise<string> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    try {
      // Générer un ID de tâche
      const taskId = options.taskId || `task-${uuidv4()}`;

      // Pour exécuter une tâche individuelle, nous utilisons une activité Temporal
      // Normalement, cela serait fait dans le contexte d'un workflow
      // Mais nous pouvons aussi utiliser un workflow "adhoc" pour exécuter une seule activité
      await this.client.workflow.start('executeTaskWorkflow', {
        taskQueue: options.taskQueue || this.options.taskQueues[0],
        workflowId: taskId,
        args: [taskType, options.input, options]
      });

      return taskId;
    } catch (error) {
      console.error(`Failed to submit task ${taskType}:`, error);
      throw new Error(`Task submission failed: ${error.message}`);
    }
  }

  /**
   * Obtient le statut d'un job (workflow ou tâche)
   */
  async getJobStatus(executionId: string): Promise<JobStatus> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    try {
      // Obtenir le handle du workflow
      const workflowHandle = this.client.workflow.getHandle(executionId);
      
      // Récupérer la description du workflow
      const description = await workflowHandle.describe();

      // Convertir l'état Temporal en état de notre système
      let status: JobStatus['status'];
      switch (description.status.name) {
        case 'COMPLETED':
          status = 'COMPLETED';
          break;
        case 'FAILED':
          status = 'FAILED';
          break;
        case 'CANCELED':
          status = 'CANCELLED';
          break;
        case 'TERMINATED':
          status = 'TERMINATED';
          break;
        case 'CONTINUED_AS_NEW':
        case 'TIMED_OUT':
          status = 'FAILED';
          break;
        default:
          status = 'RUNNING';
      }

      return {
        executionId,
        status,
        startTime: description.startTime.toISOString(),
        endTime: description.closeTime ? description.closeTime.toISOString() : undefined,
        error: description.status.name === 'FAILED' ? description.status.failure : undefined
      };
    } catch (error) {
      console.error(`Failed to get job status for ${executionId}:`, error);
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * Annule un job en cours d'exécution
   */
  async cancelJob(executionId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    try {
      // Obtenir le handle du workflow
      const workflowHandle = this.client.workflow.getHandle(executionId);
      
      // Annuler le workflow
      await workflowHandle.cancel();
      
      return true;
    } catch (error) {
      console.error(`Failed to cancel job ${executionId}:`, error);
      throw new Error(`Job cancellation failed: ${error.message}`);
    }
  }

  /**
   * Signale un événement à un workflow en cours d'exécution
   */
  async signalWorkflow(executionId: string, signalName: string, payload: any): Promise<void> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    try {
      // Obtenir le handle du workflow
      const workflowHandle = this.client.workflow.getHandle(executionId);
      
      // Envoyer le signal au workflow
      await workflowHandle.signal(signalName, payload);
    } catch (error) {
      console.error(`Failed to signal workflow ${executionId}:`, error);
      throw new Error(`Workflow signaling failed: ${error.message}`);
    }
  }

  /**
   * Récupère le résultat d'un workflow
   */
  async getWorkflowResult(executionId: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    try {
      // Obtenir le handle du workflow
      const workflowHandle = this.client.workflow.getHandle(executionId);
      
      // Attendre et récupérer le résultat du workflow
      return await workflowHandle.result();
    } catch (error) {
      console.error(`Failed to get workflow result for ${executionId}:`, error);
      throw new Error(`Failed to get workflow result: ${error.message}`);
    }
  }

  /**
   * Ferme proprement l'orchestrateur
   */
  async shutdown(): Promise<void> {
    // Arrêter tous les workers
    for (const worker of this.workers) {
      await worker.shutdown();
    }
    
    this.workers = [];
    this.initialized = false;
    console.log('Temporal orchestrator shut down successfully');
  }
}