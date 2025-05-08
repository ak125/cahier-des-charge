/**
 * Orchestrateur Unifié
 *
 * Ce module fournit une implémentation simplifiée qui utilise BullMQ comme
 * orchestrateur principal tout en gardant une interface adaptative pour
 * faciliter d'éventuelles migrations futures.
 */

import { Connection, Job, Queue, QueueEvents, Worker } from 'bullmq';
import {
  Orchestrator,
  OrchestratorType,
  TaskDefinition,
  TaskOptions,
  TaskResult,
  TaskStatus,
} from './orchestrator-adapter';

/**
 * Configuration de l'orchestrateur unifié
 */
export interface UnifiedOrchestratorConfig {
  connectionString: string;
  options?: Record<string, any>;
  /**
   * Mode de migration - quand 'true', toutes les opérations sont enregistrées pour
   * pouvoir être migrées ultérieurement vers un autre orchestrateur
   */
  migrationMode?: boolean;
}

/**
 * Orchestrateur unifié utilisant BullMQ comme moteur principal
 */
export class UnifiedOrchestrator implements Orchestrator {
  type = OrchestratorType.BULLMQ; // Utilise BullMQ par défaut
  private connection: Connection | null = null;
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private connectionString: string;
  private options: Record<string, any>;
  private migrationMode: boolean;

  constructor(config: UnifiedOrchestratorConfig) {
    this.connectionString = config.connectionString;
    this.options = config.options || {};
    this.migrationMode = config.migrationMode || false;
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    // Extraction de l'hôte et du port depuis la chaîne de connexion
    const [host, port] = this.connectionString.split(':');
    this.connection = new Connection({
      host: host || 'localhost',
      port: port ? parseInt(port, 10) : 6379,
    });

    // Journaliser la connexion si en mode migration
    if (this.migrationMode) {
      console.log(`[Migration] Connexion à l'orchestrateur BullMQ: ${this.connectionString}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
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

    // Fermer la connexion
    await this.connection.close();
    this.connection = null;

    // Journaliser la déconnexion si en mode migration
    if (this.migrationMode) {
      console.log(`[Migration] Déconnexion de l'orchestrateur BullMQ`);
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Récupère une instance de Queue BullMQ sous-jacente par son nom
   * REMARQUE : Cette méthode est une exception à notre règle d'abstraction
   * et ne devrait être utilisée que pour des cas spécifiques comme le tableau de bord
   * @param queueName Nom de la file d'attente
   * @returns Instance Queue BullMQ ou null si non trouvée
   */
  async getUnderlyingQueue(queueName: string): Promise<Queue | null> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Si la queue existe déjà dans notre map, la retourner
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName) || null;
    }

    // Si la queue n'existe pas, la créer avec les options par défaut
    // Note: Normalement, une queue est créée lors de l'appel à scheduleTask
    // Cette création ici est uniquement pour permettre la visualisation dans le tableau de bord
    const queue = new Queue(queueName, {
      connection: this.connection as any,
      ...this.options,
    });
    this.queues.set(queueName, queue);

    // Journaliser si en mode migration
    if (this.migrationMode) {
      console.log(`[Migration] Queue créée pour visualisation: ${queueName}`);
    }

    return queue;
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

      // Créer un écouteur d'événements pour cette file si en mode migration
      if (this.migrationMode) {
        const queueEvents = new QueueEvents(task.name, {
          connection: this.connection as any,
        });
        this.queueEvents.set(task.name, queueEvents);

        queueEvents.on('completed', ({ jobId, returnvalue }) => {
          console.log(`[Migration] Tâche ${jobId} terminée avec succès`, returnvalue);
        });

        queueEvents.on('failed', ({ jobId, failedReason }) => {
          console.log(`[Migration] Tâche ${jobId} échouée: ${failedReason}`);
        });
      }
    }

    // Convertir les options BullMQ
    const bullmqOptions: any = {};
    if (task.options) {
      if (task.options.priority) bullmqOptions.priority = task.options.priority;
      if (task.options.delay) bullmqOptions.delay = task.options.delay;
      if (task.options.attempts) bullmqOptions.attempts = task.options.attempts;
      if (task.options.timeout) bullmqOptions.timeout = task.options.timeout;
    }

    // Ajouter la tâche à la file d'attente
    const job = await queue.add(task.name, task.payload, bullmqOptions);

    // Journaliser si en mode migration
    if (this.migrationMode) {
      console.log(`[Migration] Tâche planifiée: ${job.id} (${task.name})`, task.payload);
    }

    return job.id.toString();
  }

  async getTaskStatus(taskId: string): Promise<TaskResult> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Pour BullMQ, nous devons chercher dans toutes les files d'attente
    // Dans une implémentation réelle, nous aurions une table de correspondance
    // entre les IDs de tâches et les files d'attente
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

          const result = {
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

          // Journaliser si en mode migration
          if (this.migrationMode) {
            console.log(`[Migration] Statut de la tâche ${taskId}: ${status}`);
          }

          return result;
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

    // Chercher dans toutes les files d'attente
    for (const queue of this.queues.values()) {
      try {
        const job = await queue.getJob(taskId);
        if (job) {
          const result = await job.remove();

          // Journaliser si en mode migration
          if (this.migrationMode) {
            console.log(`[Migration] Tâche ${taskId} annulée`);
          }

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
        // Récupérer les tâches par état
        const taskStates = ['waiting', 'active', 'delayed', 'completed', 'failed'];

        for (const state of taskStates) {
          const jobs = await queue.getJobs([state], 0, 100);

          for (const job of jobs) {
            let status: TaskStatus;
            switch (state) {
              case 'waiting':
              case 'delayed':
                status = TaskStatus.PENDING;
                break;
              case 'active':
                status = TaskStatus.RUNNING;
                break;
              case 'completed':
                status = TaskStatus.COMPLETED;
                break;
              case 'failed':
                status = TaskStatus.FAILED;
                break;
              default:
                status = TaskStatus.PENDING;
            }

            result.push({
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
            });
          }
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

    // Journaliser si en mode migration
    if (this.migrationMode) {
      console.log(`[Migration] Liste des tâches récupérée: ${result.length} tâches`);
    }

    return result;
  }

  /**
   * Crée un worker pour traiter les tâches d'une file d'attente spécifique
   * @param queueName Nom de la file d'attente
   * @param processor Fonction de traitement des tâches
   */
  createWorker(queueName: string, processor: (job: Job) => Promise<any>): Worker {
    if (!this.isConnected()) {
      throw new Error("La connexion n'est pas établie");
    }

    const worker = new Worker(queueName, processor, {
      connection: this.connection as any,
      ...this.options,
    });

    // Journaliser si en mode migration
    if (this.migrationMode) {
      worker.on('completed', (job) => {
        console.log(`[Migration] Worker: Tâche ${job.id} terminée avec succès`);
      });

      worker.on('failed', (job, error) => {
        console.log(`[Migration] Worker: Tâche ${job?.id} échouée: ${error.message}`);
      });
    }

    return worker;
  }
}

// Exporter un singleton pour faciliter l'utilisation dans tout le projet
export const unifiedOrchestrator = new UnifiedOrchestrator({
  connectionString: process.env.REDIS_URL || 'localhost:6379',
  options: {
    removeOnComplete: 1000, // Garder 1000 tâches complétées
    removeOnFail: 5000, // Garder 5000 tâches échouées
  },
  migrationMode: process.env.MIGRATION_MODE === 'true',
});
