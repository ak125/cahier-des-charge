/**
 * BullMQ Orchestrator
 * 
 * Ce module fournit une abstraction pour utiliser BullMQ comme orchestrateur
 * pour les tâches simples, rapides et sans état comme les notifications,
 * les logs, ou les opérations non critiques.
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { TaskDescription, SimpleTaskOptions } from './types';

/**
 * Options de configuration pour l'orchestrateur BullMQ
 */
interface BullMQOrchestratorOptions {
    connection?: {
        host: string;
        port: number;
    };
    defaultQueueName?: string;
}

/**
 * Classe pour orchestrer des tâches simples avec BullMQ
 */
export class BullMQOrchestrator {
    private connection: { host: string; port: number };
    private queues: Map<string, Queue> = new Map();
    private workers: Map<string, Worker> = new Map();
    private events: Map<string, QueueEvents> = new Map();
    private defaultQueueName: string;

    constructor(options: BullMQOrchestratorOptions = {}) {
        this.connection = options.connection || { host: 'localhost', port: 6379 };
        this.defaultQueueName = options.defaultQueueName || 'default';

        // Créer la queue par défaut
        this.getOrCreateQueue(this.defaultQueueName);
    }

    /**
     * Obtient ou crée une queue BullMQ
     * 
     * @param queueName - Nom de la queue à obtenir ou créer
     * @returns La queue BullMQ
     */
    private getOrCreateQueue(queueName: string): Queue {
        if (!this.queues.has(queueName)) {
            const queue = new Queue(queueName, {
                connection: this.connection
            });
            this.queues.set(queueName, queue);

            // Créer un QueueEvents pour cette queue
            const queueEvents = new QueueEvents(queueName, {
                connection: this.connection
            });
            this.events.set(queueName, queueEvents);
        }

        return this.queues.get(queueName)!;
    }

    /**
     * Enregistre un processeur pour une queue spécifique
     * 
     * @param queueName - Nom de la queue à traiter
     * @param processor - Fonction qui traite les jobs de la queue
     */
    registerProcessor(queueName: string, processor: (job: Job) => Promise<any>): void {
        if (this.workers.has(queueName)) {
            this.workers.get(queueName)!.close();
        }

        const worker = new Worker(queueName, processor, {
            connection: this.connection,
            autorun: true
        });

        this.workers.set(queueName, worker);

        worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed in queue ${queueName}`);
        });

        worker.on('failed', (job, error) => {
            console.error(`Job ${job?.id} failed in queue ${queueName}:`, error);
        });
    }

    /**
     * Planifie une tâche simple via BullMQ
     * 
     * @param taskType - Type de tâche à exécuter
     * @param data - Données pour la tâche
     * @param options - Options pour la tâche
     * @returns L'ID du job planifié
     */
    async scheduleTask(taskType: string, data: any, options: SimpleTaskOptions = {}): Promise<string> {
        try {
            const queueName = options.queue || this.defaultQueueName;
            const queue = this.getOrCreateQueue(queueName);

            const job = await queue.add(taskType, data, {
                priority: options.priority,
                delay: options.delay,
                attempts: options.retry?.maxAttempts || 1,
                backoff: options.retry?.backoff || { type: 'exponential', delay: 1000 },
                removeOnComplete: options.removeOnComplete ?? true,
                removeOnFail: options.removeOnFail ?? false,
                jobId: options.jobId || undefined
            });

            console.log(`Job ajouté à la queue ${queueName} avec l'ID: ${job.id}`);
            return job.id!.toString();
        } catch (error) {
            console.error(`Erreur lors de la planification de la tâche BullMQ: ${error}`);
            throw error;
        }
    }

    /**
     * Récupère le statut d'une tâche
     * 
     * @param jobId - L'ID du job à vérifier
     * @param queueName - Nom de la queue contenant le job
     * @returns Le statut actuel du job
     */
    async getTaskStatus(jobId: string, queueName?: string): Promise<any> {
        try {
            const queue = this.getOrCreateQueue(queueName || this.defaultQueueName);
            const job = await queue.getJob(jobId);

            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }

            const state = await job.getState();

            return {
                id: job.id,
                status: state,
                data: job.data,
                progress: job.progress,
                attemptsMade: job.attemptsMade,
                timestamp: job.timestamp,
                source: 'BULLMQ'
            };
        } catch (error) {
            console.error(`Erreur lors de la récupération du statut du job: ${error}`);
            throw error;
        }
    }

    /**
     * Annule une tâche en cours ou en attente
     * 
     * @param jobId - L'ID du job à annuler
     * @param queueName - Nom de la queue contenant le job
     * @returns true si le job a été annulé avec succès
     */
    async cancelTask(jobId: string, queueName?: string): Promise<boolean> {
        try {
            const queue = this.getOrCreateQueue(queueName || this.defaultQueueName);
            const job = await queue.getJob(jobId);

            if (!job) {
                return false;
            }

            await job.remove();
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'annulation du job: ${error}`);
            return false;
        }
    }

    /**
     * Planifie une tâche selon la description fournie
     * Adapte les paramètres de la tâche au format BullMQ
     * 
     * @param task - Description de la tâche à planifier
     * @returns L'ID de la tâche planifiée
     */
    async schedule(task: TaskDescription): Promise<string> {
        try {
            // Configurer les options de tâche en fonction des attributs de la tâche
            const options: SimpleTaskOptions = {
                jobId: task.id,
                queue: task.queue,
                priority: task.priority,
                delay: task.delay,
                retry: task.retry,
                removeOnComplete: true,
                removeOnFail: false,
            };

            return this.scheduleTask(
                task.type,
                task.data || {},
                options
            );
        } catch (error) {
            console.error(`Erreur lors de la planification de la tâche via BullMQ: ${error}`);
            throw error;
        }
    }
}

// Export singleton instance avec configuration par défaut
export const bullmq = new BullMQOrchestrator();