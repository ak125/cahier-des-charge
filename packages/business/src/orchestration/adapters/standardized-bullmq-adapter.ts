/**
 * Adaptateur BullMQ standardisé pour l'orchestrateur unifié
 * 
 * Cette implémentation fournit une interface standardisée pour utiliser BullMQ
 * pour les tâches simples et rapides, avec une configuration optimisée.
 */

import {
    Queue,
    Worker,
    QueueEvents,
    Job,
    QueueScheduler,
    ConnectionOptions,
    JobsOptions,
    QueueOptions,
    WorkerOptions
} from 'bullmq';

/**
 * Options pour la configuration de l'adaptateur BullMQ
 */
export interface BullMQAdapterOptions {
    /** Configuration de la connexion Redis */
    connection?: ConnectionOptions;
    /** Nom de la file d'attente par défaut */
    defaultQueueName?: string;
    /** Options de la file d'attente par défaut */
    defaultQueueOptions?: QueueOptions;
    /** Options du worker par défaut */
    defaultWorkerOptions?: WorkerOptions;
    /** Options des jobs par défaut */
    defaultJobOptions?: JobsOptions;
    /** Activer le nettoyage automatique des jobs terminés */
    enableAutoCleanup?: boolean;
}

/**
 * Options pour ajouter un job à la file d'attente
 */
export interface AddJobOptions extends JobsOptions {
    /** Nom de la file d'attente spécifique */
    queueName?: string;
}

/**
 * Options pour enregistrer un processeur de jobs
 */
export interface RegisterProcessorOptions {
    /** Nombre maximal de jobs à traiter simultanément */
    concurrency?: number;
    /** Activer les métriques de performance */
    enableMetrics?: boolean;
    /** Désactiver la récupération automatique des jobs interrompus */
    disableJobRecovery?: boolean;
}

/**
 * Résultat du traitement d'un job
 */
export interface JobResult<T = unknown> {
    /** ID du job */
    jobId: string;
    /** Nom de la file d'attente */
    queueName: string;
    /** Résultat du traitement */
    result?: T;
    /** Statut du job */
    status: 'completed' | 'failed' | 'waiting' | 'active' | 'delayed' | 'paused' | 'unknown';
    /** Erreur en cas d'échec */
    error?: Error;
    /** Progression du job (0-100) */
    progress?: number;
    /** Horodatage de création */
    createdAt?: Date;
    /** Horodatage de fin */
    finishedAt?: Date;
    /** Nombre de tentatives effectuées */
    attemptsMade?: number;
}

/**
 * Adaptateur standardisé pour BullMQ
 */
export class StandardizedBullMQAdapter {
    private readonly queues: Map<string, Queue> = new Map();
    private readonly workers: Map<string, Worker> = new Map();
    private readonly events: Map<string, QueueEvents> = new Map();
    private readonly schedulers: Map<string, QueueScheduler> = new Map();
    private readonly options: BullMQAdapterOptions;
    private readonly logger: Console;

    /**
     * Constructeur de l'adaptateur BullMQ standardisé
     * @param options Options de configuration
     * @param logger Logger (console par défaut)
     */
    constructor(options: BullMQAdapterOptions = {}, logger: Console = console) {
        this.options = {
            defaultQueueName: options.defaultQueueName || 'default',
            connection: options.connection || {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                username: process.env.REDIS_USERNAME,
                password: process.env.REDIS_PASSWORD
            },
            defaultQueueOptions: options.defaultQueueOptions || {},
            defaultWorkerOptions: options.defaultWorkerOptions || {},
            defaultJobOptions: options.defaultJobOptions || {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: true,
                removeOnFail: false
            },
            enableAutoCleanup: options.enableAutoCleanup ?? true
        };

        this.logger = logger;

        // Créer la file d'attente par défaut
        this.getOrCreateQueue(this.options.defaultQueueName!);
    }

    /**
     * Initialise l'adaptateur BullMQ
     */
    async initialize(): Promise<void> {
        try {
            this.logger.info('Initialisation de l\'adaptateur BullMQ...');

            // Vérifier la connexion à Redis en créant une file temporaire
            const healthCheckQueue = new Queue('healthcheck', {
                connection: this.options.connection,
                defaultJobOptions: {
                    removeOnComplete: true
                }
            });

            await healthCheckQueue.add('ping', { timestamp: Date.now() });
            await healthCheckQueue.close();

            this.logger.info('Adaptateur BullMQ initialisé avec succès');
        } catch (error) {
            this.logger.error('Échec de l\'initialisation de l\'adaptateur BullMQ:', error);
            throw new Error(`Impossible d'initialiser l'adaptateur BullMQ: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Ferme toutes les connexions BullMQ
     */
    async close(): Promise<void> {
        this.logger.info('Fermeture de l\'adaptateur BullMQ...');

        // Fermer tous les workers
        for (const [name, worker] of this.workers.entries()) {
            this.logger.debug(`Fermeture du worker ${name}...`);
            await worker.close();
        }
        this.workers.clear();

        // Fermer tous les QueueEvents
        for (const [name, events] of this.events.entries()) {
            this.logger.debug(`Fermeture des événements pour la file ${name}...`);
            await events.close();
        }
        this.events.clear();

        // Fermer tous les schedulers
        for (const [name, scheduler] of this.schedulers.entries()) {
            this.logger.debug(`Fermeture du scheduler pour la file ${name}...`);
            await scheduler.close();
        }
        this.schedulers.clear();

        // Fermer toutes les files d'attente
        for (const [name, queue] of this.queues.entries()) {
            this.logger.debug(`Fermeture de la file ${name}...`);
            await queue.close();
        }
        this.queues.clear();

        this.logger.info('Adaptateur BullMQ fermé avec succès');
    }

    /**
     * Obtient ou crée une file d'attente BullMQ
     * @param queueName Nom de la file d'attente
     * @returns File d'attente BullMQ
     */
    private getOrCreateQueue(queueName: string): Queue {
        if (!this.queues.has(queueName)) {
            this.logger.debug(`Création de la file d'attente "${queueName}"...`);

            const queue = new Queue(queueName, {
                connection: this.options.connection,
                defaultJobOptions: this.options.defaultJobOptions,
                ...this.options.defaultQueueOptions
            });

            this.queues.set(queueName, queue);

            // Créer des événements pour cette file
            const queueEvents = new QueueEvents(queueName, {
                connection: this.options.connection
            });

            this.events.set(queueName, queueEvents);

            // Configurer les écouteurs d'événements par défaut
            queueEvents.on('completed', ({ jobId }) => {
                this.logger.debug(`Job ${jobId} terminé dans la file ${queueName}`);
            });

            queueEvents.on('failed', ({ jobId, failedReason }) => {
                this.logger.error(`Job ${jobId} échoué dans la file ${queueName}: ${failedReason}`);
            });

            queueEvents.on('stalled', ({ jobId }) => {
                this.logger.warn(`Job ${jobId} bloqué dans la file ${queueName}`);
            });

            // Créer un scheduler pour cette file
            if (this.options.enableAutoCleanup) {
                const scheduler = new QueueScheduler(queueName, {
                    connection: this.options.connection
                });

                this.schedulers.set(queueName, scheduler);
            }
        }

        return this.queues.get(queueName)!;
    }

    /**
     * Ajoute un job à la file d'attente
     * @param jobType Type/nom du job
     * @param data Données du job
     * @param options Options du job
     * @returns ID du job créé
     */
    async addJob<T>(jobType: string, data: T, options: AddJobOptions = {}): Promise<string> {
        const queueName = options.queueName || this.options.defaultQueueName!;
        const queue = this.getOrCreateQueue(queueName);

        try {
            const jobOptions: JobsOptions = {
                ...this.options.defaultJobOptions,
                ...options
            };

            this.logger.debug(`Ajout d'un job "${jobType}" à la file ${queueName}...`);

            const job = await queue.add(jobType, data, jobOptions);

            this.logger.info(`Job "${jobType}" ajouté à la file ${queueName} avec ID: ${job.id}`);

            return job.id!.toString();
        } catch (error) {
            this.logger.error(`Échec de l'ajout du job "${jobType}" à la file ${queueName}:`, error);
            throw new Error(`Impossible d'ajouter le job à la file d'attente: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Enregistre un processeur pour une file spécifique
     * @param queueName Nom de la file d'attente
     * @param processor Fonction qui traite les jobs de la file
     * @param options Options du processeur
     */
    registerProcessor<T, R>(
        queueName: string,
        processor: (job: Job<T>) => Promise<R>,
        options: RegisterProcessorOptions = {}
    ): void {
        // Fermer un worker existant si présent
        if (this.workers.has(queueName)) {
            this.logger.debug(`Fermeture du worker existant pour la file ${queueName}...`);
            this.workers.get(queueName)!.close().catch(err => {
                this.logger.error(`Erreur lors de la fermeture du worker pour la file ${queueName}:`, err);
            });
            this.workers.delete(queueName);
        }

        // S'assurer que la file existe
        this.getOrCreateQueue(queueName);

        // Créer un nouveau worker
        this.logger.debug(`Création d'un worker pour la file ${queueName}...`);

        const worker = new Worker(
            queueName,
            async (job) => {
                try {
                    this.logger.debug(`Traitement du job ${job.id} de type ${job.name} dans la file ${queueName}...`);

                    // Exécuter le processeur fourni
                    const result = await processor(job);

                    this.logger.debug(`Job ${job.id} traité avec succès dans la file ${queueName}`);

                    return result;
                } catch (error) {
                    this.logger.error(`Erreur lors du traitement du job ${job.id} dans la file ${queueName}:`, error);
                    throw error;
                }
            },
            {
                connection: this.options.connection,
                concurrency: options.concurrency || 1,
                autorun: true,
                metrics: options.enableMetrics ?? true,
                skipStalledCheck: options.disableJobRecovery ?? false,
                ...this.options.defaultWorkerOptions
            }
        );

        // Configurer les écouteurs d'événements du worker
        worker.on('completed', (job) => {
            this.logger.debug(`Job ${job.id} complété dans la file ${queueName}`);
        });

        worker.on('failed', (job, error) => {
            this.logger.error(`Job ${job?.id} échoué dans la file ${queueName}:`, error);
        });

        worker.on('error', (error) => {
            this.logger.error(`Erreur générale du worker pour la file ${queueName}:`, error);
        });

        // Stocker le worker
        this.workers.set(queueName, worker);

        this.logger.info(`Worker enregistré pour la file ${queueName}`);
    }

    /**
     * Récupère le statut d'un job
     * @param jobId ID du job
     * @param queueName Nom de la file d'attente (optionnel)
     * @returns Statut et informations sur le job
     */
    async getJobStatus<T = unknown, R = unknown>(jobId: string, queueName?: string): Promise<JobResult<R>> {
        // Si aucune file spécifiée, rechercher dans toutes les files
        if (!queueName) {
            for (const [name, queue] of this.queues.entries()) {
                try {
                    const job = await queue.getJob(jobId);
                    if (job) {
                        return this.buildJobResult(job, name);
                    }
                } catch (error) {
                    this.logger.debug(`Erreur lors de la recherche du job ${jobId} dans la file ${name}:`, error);
                    // Continuer avec la file suivante
                }
            }

            throw new Error(`Job ${jobId} non trouvé dans aucune file d'attente`);
        }

        // Rechercher dans la file spécifiée
        try {
            const queue = this.getOrCreateQueue(queueName);
            const job = await queue.getJob(jobId);

            if (!job) {
                throw new Error(`Job ${jobId} non trouvé dans la file ${queueName}`);
            }

            return this.buildJobResult(job, queueName);
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération du statut du job ${jobId} dans la file ${queueName}:`, error);
            throw error;
        }
    }

    /**
     * Construit un objet JobResult à partir d'un job BullMQ
     * @param job Job BullMQ
     * @param queueName Nom de la file d'attente
     * @returns Résultat standardisé du job
     */
    private async buildJobResult<T = unknown, R = unknown>(job: Job<T, R>, queueName: string): Promise<JobResult<R>> {
        const state = await job.getState();

        const result: JobResult<R> = {
            jobId: job.id!,
            queueName,
            status: state as 'completed' | 'failed' | 'waiting' | 'active' | 'delayed' | 'paused' | 'unknown',
            result: job.returnvalue as R | undefined,
            progress: job.progress,
            createdAt: job.timestamp ? new Date(job.timestamp) : undefined,
            finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
            attemptsMade: job.attemptsMade
        };

        if (state === 'failed' && job.failedReason) {
            result.error = new Error(job.failedReason);
        }

        return result;
    }

    /**
     * Annule et supprime un job
     * @param jobId ID du job
     * @param queueName Nom de la file d'attente (optionnel)
     * @returns true si le job a été annulé avec succès
     */
    async removeJob(jobId: string, queueName?: string): Promise<boolean> {
        // Si aucune file spécifiée, rechercher dans toutes les files
        if (!queueName) {
            for (const [name, queue] of this.queues.entries()) {
                try {
                    const job = await queue.getJob(jobId);
                    if (job) {
                        await job.remove();
                        this.logger.info(`Job ${jobId} supprimé de la file ${name}`);
                        return true;
                    }
                } catch (error) {
                    this.logger.debug(`Erreur lors de la recherche du job ${jobId} dans la file ${name}:`, error);
                    // Continuer avec la file suivante
                }
            }

            this.logger.warn(`Tentative de suppression d'un job inexistant: ${jobId}`);
            return false;
        }

        // Supprimer de la file spécifiée
        try {
            const queue = this.getOrCreateQueue(queueName);
            const job = await queue.getJob(jobId);

            if (!job) {
                this.logger.warn(`Tentative de suppression d'un job inexistant: ${jobId} dans la file ${queueName}`);
                return false;
            }

            await job.remove();
            this.logger.info(`Job ${jobId} supprimé de la file ${queueName}`);
            return true;
        } catch (error) {
            this.logger.error(`Erreur lors de la suppression du job ${jobId} de la file ${queueName}:`, error);
            return false;
        }
    }

    /**
     * Récupère les métriques d'une file d'attente
     * @param queueName Nom de la file d'attente
     */
    async getQueueMetrics(queueName: string): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: number;
    }> {
        try {
            const queue = this.getOrCreateQueue(queueName);

            const [
                waiting,
                active,
                completed,
                failed,
                delayed,
                paused
            ] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount(),
                queue.getPausedCount()
            ]);

            return {
                waiting,
                active,
                completed,
                failed,
                delayed,
                paused
            };
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération des métriques de la file ${queueName}:`, error);
            throw error;
        }
    }
}

// Export d'une instance singleton
const defaultBullMQAdapter = new StandardizedBullMQAdapter({
    defaultQueueName: process.env.BULLMQ_DEFAULT_QUEUE || 'default',
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD
    },
    enableAutoCleanup: true
});

export { defaultBullMQAdapter as bullmqAdapter, StandardizedBullMQAdapter };