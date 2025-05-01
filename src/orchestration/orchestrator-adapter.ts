/**
 * Adaptateur unifié pour les orchestrateurs
 *
 * Ce module fournit une abstraction commune pour interagir avec différents
 * orchestrateurs (BullMQ, Temporal, n8n) à travers une interface unifiée.
 *
 * RECOMMANDATION DE SIMPLIFICATION :
 * ---------------------------------
 * Pour réduire la complexité de maintenance, il est recommandé de :
 * 1. Choisir BullMQ comme orchestrateur principal par défaut (le plus simple à déployer)
 * 2. Implémenter complètement cet orchestrateur uniquement
 * 3. Conserver l'interface abstraite pour permettre des migrations futures
 * 4. Désactiver temporairement les adaptateurs Temporal et n8n
 *
 * Cette approche permet de :
 * - Simplifier la maintenance
 * - Réduire les risques d'incohérence
 * - Faciliter les tests
 * - Garder une porte ouverte pour d'éventuelles migrations
 */

import { Client, Connection as TemporalConnection, WorkflowClient } from '@temporalio/client';
import axios from 'axios';
import { Connection, Job, Queue, QueueEvents, Worker } from 'bullmq';

/**
 * Types d'orchestrateurs supportés
 */
export enum OrchestratorType {
  BULLMQ = 'bullmq',
  TEMPORAL = 'temporal', // Conserver pour compatibilité future
  N8N = 'n8n', // Conserver pour compatibilité future
}

/**
 * Statut commun des tâches pour tous les orchestrateurs
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Configuration commune pour un orchestrateur
 */
export interface OrchestratorConfig {
  type: OrchestratorType;
  connectionString: string;
  options?: Record<string, any>;
}

/**
 * Options pour la planification d'une tâche
 */
export interface TaskOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Définition d'une tâche à planifier
 */
export interface TaskDefinition {
  name: string;
  payload: any;
  options?: TaskOptions;
}

/**
 * Résultat d'une tâche
 */
export interface TaskResult {
  id: string;
  name: string;
  status: TaskStatus;
  source: OrchestratorType;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

/**
 * Interface commune pour tous les orchestrateurs
 */
export interface Orchestrator {
  type: OrchestratorType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  scheduleTask(task: TaskDefinition): Promise<string>;
  getTaskStatus(taskId: string): Promise<TaskResult>;
  cancelTask(taskId: string): Promise<boolean>;
  listTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
}

/**
 * Adaptateur BullMQ
 */
export class BullMQOrchestrator implements Orchestrator {
  type = OrchestratorType.BULLMQ;
  private connection: Connection | null = null;
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private connectionString: string;
  private options: Record<string, any>;

  constructor(connectionString: string, options: Record<string, any> = {}) {
    this.connectionString = connectionString;
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    const [host, port] = this.connectionString.split(':');
    this.connection = new Connection({
      host: host || 'localhost',
      port: port ? parseInt(port, 10) : 6379,
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    // Fermer toutes les files d'attente
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();

    // Fermer tous les écouteurs d'événements
    for (const queueEvent of this.queueEvents.values()) {
      await queueEvent.close();
    }
    this.queueEvents.clear();
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async scheduleTask(task: TaskDefinition): Promise<string> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Obtenir ou créer la file d'attente
    let queue = this.queues.get(task.name);
    if (!queue) {
      queue = new Queue(task.name, {
        connection: this.connection as any,
        ...this.options,
      });
      this.queues.set(task.name, queue);
    }

    // Convertir les options BullMQ
    const bullmqOptions: any = {};
    if (task.options) {
      if (task.options.priority) bullmqOptions.priority = task.options.priority;
      if (task.options.delay) bullmqOptions.delay = task.options.delay;
      if (task.options.attempts) bullmqOptions.attempts = task.options.attempts;
    }

    // Ajouter la tâche à la file d'attente
    const job = await queue.add(task.name, task.payload, bullmqOptions);
    return job.id.toString();
  }

  async getTaskStatus(taskId: string): Promise<TaskResult> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Pour BullMQ, nous devons chercher dans toutes les files d'attente
    // Dans une implémentation réelle, nous aurions une table de correspondance
    // entre les IDs de tâches et les files d'attente ou nous aurions un format d'ID spécifique
    // qui inclut le nom de la file d'attente

    // Approche simplifiée pour cette démonstration
    for (const [queueName, queue] of this.queues.entries()) {
      try {
        const job = await queue.getJob(taskId);
        if (job) {
          let status = TaskStatus.PENDING;
          if (job.finishedOn) {
            status = job.returnvalue ? TaskStatus.COMPLETED : TaskStatus.FAILED;
          } else if (job.processedOn) {
            status = TaskStatus.RUNNING;
          }

          return {
            id: job.id.toString(),
            name: queueName,
            status,
            source: this.type,
            result: job.returnvalue,
            error: job.failedReason,
            createdAt: new Date(job.timestamp),
            updatedAt: new Date(job.finishedOn || job.processedOn || job.timestamp),
            startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
            completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
            duration:
              job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : undefined,
          };
        }
      } catch (_error) {
        // Ignorer les erreurs lors de la recherche dans cette file d'attente
      }
    }

    throw new Error(`Tâche non trouvée: ${taskId}`);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Comme pour getTaskStatus, nous devons chercher dans toutes les files d'attente
    for (const queue of this.queues.values()) {
      try {
        const job = await queue.getJob(taskId);
        if (job) {
          const result = await job.remove();
          return !!result;
        }
      } catch (_error) {
        // Ignorer les erreurs lors de la recherche dans cette file d'attente
      }
    }

    return false;
  }

  async listTasks(filter?: Record<string, any>): Promise<TaskResult[]> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const result: TaskResult[] = [];

    for (const [queueName, queue] of this.queues.entries()) {
      try {
        // Récupérer les tâches en attente
        const waitingJobs = await queue.getJobs(['waiting', 'delayed'], 0, 100);
        for (const job of waitingJobs) {
          result.push({
            id: job.id.toString(),
            name: queueName,
            status: TaskStatus.PENDING,
            source: this.type,
            createdAt: new Date(job.timestamp),
            updatedAt: new Date(job.timestamp),
          });
        }

        // Récupérer les tâches actives
        const activeJobs = await queue.getJobs(['active'], 0, 100);
        for (const job of activeJobs) {
          result.push({
            id: job.id.toString(),
            name: queueName,
            status: TaskStatus.RUNNING,
            source: this.type,
            createdAt: new Date(job.timestamp),
            updatedAt: new Date(job.processedOn || job.timestamp),
            startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
          });
        }

        // Récupérer les tâches terminées
        const completedJobs = await queue.getJobs(['completed'], 0, 100);
        for (const job of completedJobs) {
          result.push({
            id: job.id.toString(),
            name: queueName,
            status: TaskStatus.COMPLETED,
            source: this.type,
            result: job.returnvalue,
            createdAt: new Date(job.timestamp),
            updatedAt: new Date(job.finishedOn || job.timestamp),
            startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
            completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
            duration:
              job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : undefined,
          });
        }

        // Récupérer les tâches échouées
        const failedJobs = await queue.getJobs(['failed'], 0, 100);
        for (const job of failedJobs) {
          result.push({
            id: job.id.toString(),
            name: queueName,
            status: TaskStatus.FAILED,
            source: this.type,
            error: job.failedReason,
            createdAt: new Date(job.timestamp),
            updatedAt: new Date(job.finishedOn || job.timestamp),
            startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
            completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
            duration:
              job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : undefined,
          });
        }
      } catch (error) {
        console.error(
          `Erreur lors de la récupération des tâches pour la file ${queueName}:`,
          error
        );
      }
    }

    // Appliquer les filtres si nécessaire
    if (filter) {
      return result.filter((task) => {
        return Object.entries(filter).every(([key, value]) => {
          return (task as any)[key] === value;
        });
      });
    }

    return result;
  }
}

/**
 * Adaptateur Temporal
 */
export class TemporalOrchestrator implements Orchestrator {
  type = OrchestratorType.TEMPORAL;
  private connection: TemporalConnection | null = null;
  private client: WorkflowClient | null = null;
  private connectionString: string;
  private options: Record<string, any>;

  constructor(connectionString: string, options: Record<string, any> = {}) {
    this.connectionString = connectionString;
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    this.connection = await TemporalConnection.connect({
      address: this.connectionString,
    });
    this.client = new WorkflowClient({
      connection: this.connection,
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.client !== null;
  }

  async scheduleTask(task: TaskDefinition): Promise<string> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Dans une implémentation réelle, nous utiliserions l'API Temporal pour démarrer un workflow
    // Cette méthode est un placeholder pour la démonstration
    // Le code réel ressemblerait à quelque chose comme :

    /*
        const handle = await this.client!.start(task.name, {
          taskQueue: 'default',
          workflowId: `${task.name}-${Date.now()}`,
          args: [task.payload]
        });
        return handle.workflowId;
        */

    // Pour cette démonstration, nous simulons un ID de tâche Temporal
    return `temporal-${task.name}-${Date.now()}`;
  }

  async getTaskStatus(taskId: string): Promise<TaskResult> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Dans une implémentation réelle, nous utiliserions l'API Temporal pour obtenir l'état du workflow
    // Cette méthode est un placeholder pour la démonstration

    // Simuler un résultat
    const isPending = taskId.includes('pending');
    const isRunning = taskId.includes('running');
    const isFailed = taskId.includes('failed');

    let status = TaskStatus.COMPLETED;
    if (isPending) status = TaskStatus.PENDING;
    if (isRunning) status = TaskStatus.RUNNING;
    if (isFailed) status = TaskStatus.FAILED;

    const now = Date.now();
    const createdAt = new Date(now - 60000); // 1 minute avant
    const startedAt = isPending ? undefined : new Date(now - 30000); // 30 secondes avant
    const completedAt = isRunning || isPending ? undefined : new Date(); // maintenant

    return {
      id: taskId,
      name: taskId.split('-')[1] || 'unknown',
      status,
      source: this.type,
      result: isFailed ? undefined : { success: true },
      error: isFailed ? 'Échec simulé' : undefined,
      createdAt,
      updatedAt: new Date(),
      startedAt,
      completedAt,
      duration: startedAt && completedAt ? completedAt.getTime() - startedAt.getTime() : undefined,
    };
  }

  async cancelTask(_taskId: string): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Dans une implémentation réelle, nous utiliserions l'API Temporal pour annuler le workflow
    // Cette méthode est un placeholder pour la démonstration

    /*
        try {
          const handle = this.client!.getHandle(taskId);
          await handle.cancel();
          return true;
        } catch (error) {
          return false;
        }
        */

    return true; // Simuler une annulation réussie
  }

  async listTasks(filter?: Record<string, any>): Promise<TaskResult[]> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Dans une implémentation réelle, nous utiliserions l'API Temporal pour lister les workflows
    // Cette méthode est un placeholder pour la démonstration

    const result: TaskResult[] = [];

    // Simuler quelques tâches pour la démonstration
    const now = Date.now();
    const taskTypes = ['dataProcessing', 'emailSender', 'reportGenerator'];

    for (let i = 0; i < 5; i++) {
      const taskType = taskTypes[i % taskTypes.length];
      const status =
        i % 4 === 0
          ? TaskStatus.PENDING
          : i % 4 === 1
            ? TaskStatus.RUNNING
            : i % 4 === 2
              ? TaskStatus.COMPLETED
              : TaskStatus.FAILED;

      const createdAt = new Date(now - (i + 1) * 60000);
      const startedAt = status === TaskStatus.PENDING ? undefined : new Date(now - (i + 1) * 30000);
      const completedAt =
        status === TaskStatus.PENDING || status === TaskStatus.RUNNING
          ? undefined
          : new Date(now - i * 10000);

      result.push({
        id: `temporal-${taskType}-${i}`,
        name: taskType,
        status,
        source: this.type,
        result: status === TaskStatus.COMPLETED ? { success: true } : undefined,
        error: status === TaskStatus.FAILED ? 'Erreur simulée' : undefined,
        createdAt,
        updatedAt: completedAt || startedAt || createdAt,
        startedAt,
        completedAt,
        duration:
          startedAt && completedAt ? completedAt.getTime() - startedAt.getTime() : undefined,
      });
    }

    // Appliquer les filtres si nécessaire
    if (filter) {
      return result.filter((task) => {
        return Object.entries(filter).every(([key, value]) => {
          return (task as any)[key] === value;
        });
      });
    }

    return result;
  }
}

/**
 * Adaptateur n8n
 */
export class N8nOrchestrator implements Orchestrator {
  type = OrchestratorType.N8N;
  private apiUrl: string;
  private apiKey: string;
  private options: Record<string, any>;
  private isConnectedFlag = false;

  constructor(connectionString: string, options: Record<string, any> = {}) {
    // Le format de la connectionString est attendu comme `http(s)://hostname:port`
    this.apiUrl = connectionString;
    this.apiKey = options.apiKey || '';
    this.options = options;
  }

  async connect(): Promise<void> {
    // Vérifier que l'API est accessible
    try {
      const response = await axios.get(`${this.apiUrl}/healthz`, {
        headers: this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {},
      });

      if (response.status === 200) {
        this.isConnectedFlag = true;
      } else {
        throw new Error(`Échec de connexion à n8n: ${response.statusText}`);
      }
    } catch (error) {
      this.isConnectedFlag = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async scheduleTask(task: TaskDefinition): Promise<string> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Dans n8n, on déclenche un workflow avec des paramètres
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/workflows/trigger`,
        {
          workflowId: task.name,
          data: task.payload,
        },
        {
          headers: this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {},
        }
      );

      if (response.status === 200) {
        return response.data.executionId;
      }
      throw new Error(`Échec du déclenchement du workflow: ${response.statusText}`);
    } catch (error) {
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskResult> {
    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/executions/${taskId}`, {
        headers: this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {},
      });

      if (response.status === 200) {
        const execution = response.data;

        let status = TaskStatus.PENDING;
        if (execution.finished === true) {
          status = execution.status === 'error' ? TaskStatus.FAILED : TaskStatus.COMPLETED;
        } else if (execution.status === 'running') {
          status = TaskStatus.RUNNING;
        }

        return {
          id: execution.id,
          name: execution.workflowId,
          status,
          source: this.type,
          result: execution.data,
          error: execution.status === 'error' ? execution.error : undefined,
          createdAt: new Date(execution.startedAt),
          updatedAt: new Date(execution.finishedAt || execution.startedAt),
          startedAt: new Date(execution.startedAt),
          completedAt: execution.finishedAt ? new Date(execution.finishedAt) : undefined,
          duration: execution.finishedAt
            ? new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()
            : undefined,
        };
      }
      throw new Error(`Échec de récupération de l'exécution: ${response.statusText}`);
    } catch (error) {
      throw error;
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/executions/${taskId}/stop`,
        {},
        {
          headers: this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {},
        }
      );

      return response.status === 200;
    } catch (_error) {
      return false;
    }
  }

  async listTasks(filter?: Record<string, any>): Promise<TaskResult[]> {
    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/executions`, {
        params: {
          limit: 100,
          ...filter,
        },
        headers: this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {},
      });

      if (response.status === 200) {
        const executions = response.data.data;

        return executions.map((execution: any) => {
          let status = TaskStatus.PENDING;
          if (execution.finished === true) {
            status = execution.status === 'error' ? TaskStatus.FAILED : TaskStatus.COMPLETED;
          } else if (execution.status === 'running') {
            status = TaskStatus.RUNNING;
          }

          return {
            id: execution.id,
            name: execution.workflowId,
            status,
            source: this.type,
            result: execution.data,
            error: execution.status === 'error' ? execution.error : undefined,
            createdAt: new Date(execution.startedAt),
            updatedAt: new Date(execution.finishedAt || execution.startedAt),
            startedAt: new Date(execution.startedAt),
            completedAt: execution.finishedAt ? new Date(execution.finishedAt) : undefined,
            duration: execution.finishedAt
              ? new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()
              : undefined,
          };
        });
      }
      throw new Error(`Échec de récupération des exécutions: ${response.statusText}`);
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Service d'orchestration qui gère tous les orchestrateurs
 */
class OrchestrationService {
  private orchestrators: Map<OrchestratorType, Orchestrator> = new Map();
  private preferredOrchestrator: OrchestratorType | null = null;

  /**
   * Enregistre un orchestrateur
   */
  async registerOrchestrator(config: OrchestratorConfig): Promise<void> {
    let orchestrator: Orchestrator;

    switch (config.type) {
      case OrchestratorType.BULLMQ:
        orchestrator = new BullMQOrchestrator(config.connectionString, config.options);
        break;
      case OrchestratorType.TEMPORAL:
        orchestrator = new TemporalOrchestrator(config.connectionString, config.options);
        break;
      case OrchestratorType.N8N:
        orchestrator = new N8nOrchestrator(config.connectionString, config.options);
        break;
      default:
        throw new Error(`Type d'orchestrateur non supporté: ${config.type}`);
    }

    // Connecter l'orchestrateur
    await orchestrator.connect();

    // Enregistrer l'orchestrateur
    this.orchestrators.set(config.type, orchestrator);

    // Si c'est le premier orchestrateur enregistré, le définir comme préféré
    if (!this.preferredOrchestrator) {
      this.preferredOrchestrator = config.type;
    }
  }

  /**
   * Désenregistre un orchestrateur
   */
  async unregisterOrchestrator(type: OrchestratorType): Promise<void> {
    const orchestrator = this.orchestrators.get(type);
    if (orchestrator) {
      await orchestrator.disconnect();
      this.orchestrators.delete(type);

      // Si c'était l'orchestrateur préféré, en choisir un autre
      if (this.preferredOrchestrator === type) {
        const first = this.orchestrators.keys().next().value;
        this.preferredOrchestrator = first || null;
      }
    }
  }

  /**
   * Définit l'orchestrateur préféré
   */
  setPreferredOrchestrator(type: OrchestratorType): void {
    if (this.orchestrators.has(type)) {
      this.preferredOrchestrator = type;
    } else {
      throw new Error(`Orchestrateur non enregistré: ${type}`);
    }
  }

  /**
   * Obtient l'orchestrateur préféré
   */
  getPreferredOrchestrator(): Orchestrator | null {
    if (!this.preferredOrchestrator) {
      return null;
    }
    return this.orchestrators.get(this.preferredOrchestrator) || null;
  }

  /**
   * Obtient un orchestrateur par type
   */
  getOrchestratorByType(type: OrchestratorType): Orchestrator | null {
    return this.orchestrators.get(type) || null;
  }

  /**
   * Planifie une tâche avec l'orchestrateur préféré
   */
  async scheduleTask(task: TaskDefinition): Promise<string> {
    const orchestrator = this.getPreferredOrchestrator();
    if (!orchestrator) {
      throw new Error('Aucun orchestrateur disponible');
    }
    return await orchestrator.scheduleTask(task);
  }

  /**
   * Planifie une tâche avec un orchestrateur spécifique
   */
  async scheduleTaskWith(type: OrchestratorType, task: TaskDefinition): Promise<string> {
    const orchestrator = this.getOrchestratorByType(type);
    if (!orchestrator) {
      throw new Error(`Orchestrateur ${type} non disponible`);
    }
    return await orchestrator.scheduleTask(task);
  }

  /**
   * Obtient le statut d'une tâche
   * Cette méthode essaie de trouver la tâche dans tous les orchestrateurs enregistrés
   */
  async getTaskStatus(taskId: string): Promise<TaskResult> {
    const errors: Error[] = [];

    // Essayer chaque orchestrateur
    for (const orchestrator of this.orchestrators.values()) {
      try {
        return await orchestrator.getTaskStatus(taskId);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // Si aucun orchestrateur n'a trouvé la tâche
    throw new Error(
      `Tâche non trouvée: ${taskId}. Erreurs: ${errors.map((e) => e.message).join(', ')}`
    );
  }

  /**
   * Annule une tâche
   * Cette méthode essaie d'annuler la tâche dans tous les orchestrateurs enregistrés
   */
  async cancelTask(taskId: string): Promise<boolean> {
    // Essayer chaque orchestrateur
    for (const orchestrator of this.orchestrators.values()) {
      try {
        const result = await orchestrator.cancelTask(taskId);
        if (result) {
          return true;
        }
      } catch (_error) {
        // Ignorer les erreurs et passer à l'orchestrateur suivant
      }
    }

    return false;
  }

  /**
   * Liste toutes les tâches de tous les orchestrateurs
   */
  async listAllTasks(filter?: Record<string, any>): Promise<TaskResult[]> {
    const allTasks: TaskResult[] = [];

    // Récupérer les tâches de chaque orchestrateur
    for (const orchestrator of this.orchestrators.values()) {
      try {
        const tasks = await orchestrator.listTasks(filter);
        allTasks.push(...tasks);
      } catch (error) {
        console.error(`Erreur lors de la récupération des tâches de ${orchestrator.type}:`, error);
      }
    }

    return allTasks;
  }
}

// Exporter un singleton pour faciliter l'utilisation dans tout le projet
export const orchestrationService = new OrchestrationService();
