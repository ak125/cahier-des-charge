/**
 * Orchestrateur Centralisé
 * 
 * Ce fichier implémente l'orchestrateur standardisé qui :
 * - Utilise Temporal pour les workflows complexes de longue durée
 * - Utilise BullMQ pour les jobs courts et simples
 * - Offre une interface unique et cohérente
 * 
 * IMPORTANT: Ce fichier remplace les implémentations précédentes fragmentées
 * et devient le point d'entrée unique pour l'orchestration.
 */

import { Connection, Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Client, Connection as TemporalConnection, WorkflowClient } from '@temporalio/client';
import { nanoid } from 'nanoid';
import {
    OrchestratorType,
    TaskDefinition,
    TaskOptions,
    TaskResult,
    TaskStatus
} from './orchestrator-adapter';
import { Logger } from ..@cahier-des-charge/coordination/src/utils/logger';

// Types de workflow pour la classification automatique
export enum WorkflowType {
    // Jobs courts (<5min) sans état complexe, traités par BullMQ
    SHORT_RUNNING = 'short_running',

    // Workflows complexes avec état durable, traités par Temporal
    LONG_RUNNING = 'long_running'
}

// Configuration de l'orchestrateur centralisé
export interface CentralizedOrchestratorConfig {
    // Configuration Redis pour BullMQ
    redis: {
        host: string;
        port: number;
    };

    // Configuration Temporal
    temporal: {
        address: string;
        namespace?: string;
    };

    // Options générales
    options?: {
        // Préfixes des noms de queues
        bullmqPrefix?: string;
        temporalTaskQueue?: string;

        // Configuration de journalisation
        logLevel?: string;
        enableDebug?: boolean;

        // Configuration de surveillance
        enableMetrics?: boolean;
        metricsPort?: number;
    };
}

/**
 * Orchestrateur centralisé qui répartit intelligemment les tâches
 * entre Temporal (workflows complexes) et BullMQ (jobs courts)
 */
export class CentralizedOrchestrator {
    // Services d'orchestration sous-jacents
    private bullmqConnection: Connection | null = null;
    private bullmqQueues: Map<string, Queue> = new Map();
    private temporalConnection: TemporalConnection | null = null;
    private temporalClient: WorkflowClient | null = null;

    // Configurations
    private readonly config: CentralizedOrchestratorConfig;
    private readonly logger: Logger;

    // Mapping des IDs de tâches pour faciliter la recherche
    private taskRegistry: Map<string, { type: OrchestratorType, queue?: string }> = new Map();

    constructor(config: CentralizedOrchestratorConfig) {
        this.config = config;
        this.logger = new Logger('CentralizedOrchestrator', {
            level: config.options?.logLevel || 'info',
            debug: config.options?.enableDebug || false
        });

        // Initialiser le registre des tâches depuis le stockage persistant
        // (Dans une implémentation réelle, on récupérerait depuis une DB)
        this.initTaskRegistry();
    }

    /**
     * Initialise le registre des tâches depuis le stockage persistant
     * (Peut être chargé depuis Redis/PostgreSQL dans une vraie implémentation)
     */
    private async initTaskRegistry(): Promise<void> {
        // Implémentation réelle: charger depuis une DB
        this.logger.debug('Initialisation du registre des tâches');
    }

    /**
     * Se connecte à BullMQ et Temporal
     */
    public async connect(): Promise<void> {
        await Promise.all([
            this.connectBullMQ(),
            this.connectTemporal()
        ]);

        this.logger.info('Orchestrateur centralisé connecté avec succès');
    }

    /**
     * Se connecte à BullMQ
     */
    private async connectBullMQ(): Promise<void> {
        if (this.bullmqConnection) {
            return;
        }

        try {
            this.bullmqConnection = new Connection({
                host: this.config.redis.host,
                port: this.config.redis.port
            });

            this.logger.debug('Connexion BullMQ établie');
        } catch (error) {
            this.logger.error(`Erreur de connexion à BullMQ: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Se connecte à Temporal
     */
    private async connectTemporal(): Promise<void> {
        if (this.temporalConnection) {
            return;
        }

        try {
            this.temporalConnection = await TemporalConnection.connect({
                address: this.config.temporal.address
            });

            this.temporalClient = new WorkflowClient({
                connection: this.temporalConnection,
                namespace: this.config.temporal.namespace
            });

            this.logger.debug('Connexion Temporal établie');
        } catch (error) {
            this.logger.error(`Erreur de connexion à Temporal: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Se déconnecte de BullMQ et Temporal
     */
    public async disconnect(): Promise<void> {
        await Promise.all([
            this.disconnectBullMQ(),
            this.disconnectTemporal()
        ]);

        this.logger.info('Orchestrateur centralisé déconnecté');
    }

    /**
     * Se déconnecte de BullMQ
     */
    private async disconnectBullMQ(): Promise<void> {
        if (!this.bullmqConnection) {
            return;
        }

        // Fermer toutes les files d'attente
        for (const queue of this.bullmqQueues.values()) {
            await queue.close();
        }
        this.bullmqQueues.clear();

        // Fermer la connexion
        await this.bullmqConnection.close();
        this.bullmqConnection = null;

        this.logger.debug('Déconnexion BullMQ effectuée');
    }

    /**
     * Se déconnecte de Temporal
     */
    private async disconnectTemporal(): Promise<void> {
        if (!this.temporalConnection) {
            return;
        }

        await this.temporalConnection.close();
        this.temporalConnection = null;
        this.temporalClient = null;

        this.logger.debug('Déconnexion Temporal effectuée');
    }

    /**
     * Vérifie si l'orchestrateur est connecté
     */
    public isConnected(): boolean {
        const bullmqConnected = this.bullmqConnection !== null;
        const temporalConnected = this.temporalConnection !== null && this.temporalClient !== null;

        return bullmqConnected && temporalConnected;
    }

    /**
     * Détermine automatiquement le type de workflow en fonction de la tâche
     */
    private determineWorkflowType(task: TaskDefinition): WorkflowType {
        // Critères pour déterminer si c'est un workflow complexe ou un job court

        // 1. Basé sur le nom de la tâche (convention de nommage)
        if (task.name.includes('workflow') ||
            task.name.includes('migration') ||
            task.name.includes('process')) {
            return WorkflowType.LONG_RUNNING;
        }

        // 2. Basé sur les options spécifiques
        if (task.options?.timeout && task.options.timeout > 5 * 60 * 1000) { // > 5 minutes
            return WorkflowType.LONG_RUNNING;
        }

        // 3. Basé sur les métadonnées explicites dans la charge utile
        if (task.payload && task.payload._workflowType === 'long_running') {
            return WorkflowType.LONG_RUNNING;
        }

        // Par défaut, considérer comme un job court
        return WorkflowType.SHORT_RUNNING;
    }

    /**
     * Planifie une tâche en utilisant l'orchestrateur approprié
     */
    public async scheduleTask(task: TaskDefinition, forceType?: WorkflowType): Promise<string> {
        if (!this.isConnected()) {
            await this.connect();
        }

        // Déterminer le type de workflow (ou utiliser celui imposé)
        const workflowType = forceType || this.determineWorkflowType(task);

        let taskId: string;

        if (workflowType === WorkflowType.LONG_RUNNING) {
            taskId = await this.scheduleTemporalWorkflow(task);
        } else {
            taskId = await this.scheduleBullMQJob(task);
        }

        return taskId;
    }

    /**
     * Planifie un workflow Temporal pour les tâches complexes
     */
    private async scheduleTemporalWorkflow(task: TaskDefinition): Promise<string> {
        if (!this.temporalClient) {
            throw new Error('Client Temporal non disponible');
        }

        const workflowId = `${task.name}-${nanoid()}`;
        const taskQueue = this.config.options?.temporalTaskQueue || 'default';

        try {
            const handle = await this.temporalClient.start(task.name, {
                args: [task.payload],
                taskQueue,
                workflowId,
                searchAttributes: {
                    StringTypeSearchAttribute: {
                        taskType: task.name
                    }
                }
            });

            // Enregistrer l'ID dans le registre pour pouvoir le retrouver
            this.taskRegistry.set(handle.workflowId, {
                type: OrchestratorType.TEMPORAL
            });

            this.logger.debug(`Workflow Temporal planifié: ${handle.workflowId}`);

            return handle.workflowId;
        } catch (error) {
            this.logger.error(`Erreur lors de la planification du workflow Temporal: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Planifie un job BullMQ pour les tâches courtes
     */
    private async scheduleBullMQJob(task: TaskDefinition): Promise<string> {
        if (!this.bullmqConnection) {
            throw new Error('Connexion BullMQ non disponible');
        }

        // Préfixer le nom de la queue si configuré
        const queueName = this.config.options?.bullmqPrefix
            ? `${this.config.options.bullmqPrefix}:${task.name}`
            : task.name;

        // Obtenir ou créer la file d'attente
        let queue = this.bullmqQueues.get(queueName);
        if (!queue) {
            queue = new Queue(queueName, {
                connection: this.bullmqConnection
            });
            this.bullmqQueues.set(queueName, queue);
        }

        // Convertir les options pour BullMQ
        const bullmqOptions: any = {};
        if (task.options) {
            if (task.options.priority) bullmqOptions.priority = task.options.priority;
            if (task.options.delay) bullmqOptions.delay = task.options.delay;
            if (task.options.attempts) bullmqOptions.attempts = task.options.attempts;
            if (task.options.timeout) bullmqOptions.timeout = task.options.timeout;
        }

        try {
            const job = await queue.add(task.name, task.payload, bullmqOptions);

            // Enregistrer l'ID dans le registre pour pouvoir le retrouver
            this.taskRegistry.set(job.id.toString(), {
                type: OrchestratorType.BULLMQ,
                queue: queueName
            });

            this.logger.debug(`Job BullMQ planifié: ${job.id} (${queueName})`);

            return job.id.toString();
        } catch (error) {
            this.logger.error(`Erreur lors de la planification du job BullMQ: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Récupère le statut d'une tâche
     */
    public async getTaskStatus(taskId: string): Promise<TaskResult> {
        if (!this.isConnected()) {
            await this.connect();
        }

        // Vérifier si la tâche est dans le registre pour savoir quel orchestrateur utiliser
        const registry = this.taskRegistry.get(taskId);

        if (registry) {
            if (registry.type === OrchestratorType.TEMPORAL) {
                return this.getTemporalWorkflowStatus(taskId);
            } else if (registry.type === OrchestratorType.BULLMQ && registry.queue) {
                return this.getBullMQJobStatus(taskId, registry.queue);
            }
        }

        // Si la tâche n'est pas dans le registre, essayer les deux orchestrateurs
        try {
            // Essayer d'abord BullMQ (pour les queues connues)
            for (const queueName of this.bullmqQueues.keys()) {
                try {
                    return await this.getBullMQJobStatus(taskId, queueName);
                } catch (_) {
                    // Ignorer les erreurs et continuer
                }
            }

            // Ensuite essayer Temporal
            return await this.getTemporalWorkflowStatus(taskId);
        } catch (error) {
            throw new Error(`Tâche non trouvée: ${taskId}`);
        }
    }

    /**
     * Récupère le statut d'un workflow Temporal
     */
    private async getTemporalWorkflowStatus(workflowId: string): Promise<TaskResult> {
        if (!this.temporalClient) {
            throw new Error('Client Temporal non disponible');
        }

        try {
            const handle = this.temporalClient.getHandle(workflowId);
            const description = await handle.describe();

            let status: TaskStatus;
            switch (description.status.name) {
                case 'COMPLETED':
                    status = TaskStatus.COMPLETED;
                    break;
                case 'FAILED':
                    status = TaskStatus.FAILED;
                    break;
                case 'CANCELED':
                    status = TaskStatus.CANCELLED;
                    break;
                case 'RUNNING':
                    status = TaskStatus.RUNNING;
                    break;
                default:
                    status = TaskStatus.PENDING;
            }

            // Dans une implémentation réelle, on récupérerait aussi le résultat/erreur

            return {
                id: workflowId,
                name: description.workflowType.name,
                status,
                source: OrchestratorType.TEMPORAL,
                createdAt: new Date(description.startTime.getTime()),
                updatedAt: description.closeTime ? new Date(description.closeTime.getTime()) : new Date(),
                startedAt: new Date(description.startTime.getTime()),
                completedAt: description.closeTime ? new Date(description.closeTime.getTime()) : undefined,
                duration: description.closeTime
                    ? description.closeTime.getTime() - description.startTime.getTime()
                    : undefined
            };
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération du statut Temporal: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Récupère le statut d'un job BullMQ
     */
    private async getBullMQJobStatus(jobId: string, queueName: string): Promise<TaskResult> {
        if (!this.bullmqConnection) {
            throw new Error('Connexion BullMQ non disponible');
        }

        let queue = this.bullmqQueues.get(queueName);
        if (!queue) {
            queue = new Queue(queueName, {
                connection: this.bullmqConnection
            });
            this.bullmqQueues.set(queueName, queue);
        }

        try {
            const job = await queue.getJob(jobId);
            if (!job) {
                throw new Error(`Job non trouvé: ${jobId}`);
            }

            let status = TaskStatus.PENDING;
            if (job.finishedOn) {
                status = job.returnvalue ? TaskStatus.COMPLETED : TaskStatus.FAILED;
            } else if (job.processedOn) {
                status = TaskStatus.RUNNING;
            }

            return {
                id: job.id.toString(),
                name: job.name,
                status,
                source: OrchestratorType.BULLMQ,
                result: job.returnvalue,
                error: job.failedReason,
                createdAt: new Date(job.timestamp),
                updatedAt: new Date(job.finishedOn || job.processedOn || job.timestamp),
                startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
                completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
                duration: job.finishedOn && job.processedOn
                    ? job.finishedOn - job.processedOn
                    : undefined
            };
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération du statut BullMQ: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Annule une tâche
     */
    public async cancelTask(taskId: string): Promise<boolean> {
        if (!this.isConnected()) {
            await this.connect();
        }

        // Vérifier si la tâche est dans le registre
        const registry = this.taskRegistry.get(taskId);

        if (registry) {
            if (registry.type === OrchestratorType.TEMPORAL) {
                return this.cancelTemporalWorkflow(taskId);
            } else if (registry.type === OrchestratorType.BULLMQ && registry.queue) {
                return this.cancelBullMQJob(taskId, registry.queue);
            }
        }

        // Si la tâche n'est pas dans le registre, essayer les deux orchestrateurs
        try {
            // Essayer d'abord BullMQ (pour les queues connues)
            for (const queueName of this.bullmqQueues.keys()) {
                try {
                    const result = await this.cancelBullMQJob(taskId, queueName);
                    if (result) {
                        return true;
                    }
                } catch (_) {
                    // Ignorer les erreurs et continuer
                }
            }

            // Ensuite essayer Temporal
            return await this.cancelTemporalWorkflow(taskId);
        } catch (_) {
            return false;
        }
    }

    /**
     * Annule un workflow Temporal
     */
    private async cancelTemporalWorkflow(workflowId: string): Promise<boolean> {
        if (!this.temporalClient) {
            throw new Error('Client Temporal non disponible');
        }

        try {
            const handle = this.temporalClient.getHandle(workflowId);
            await handle.cancel();
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Annule un job BullMQ
     */
    private async cancelBullMQJob(jobId: string, queueName: string): Promise<boolean> {
        if (!this.bullmqConnection) {
            throw new Error('Connexion BullMQ non disponible');
        }

        let queue = this.bullmqQueues.get(queueName);
        if (!queue) {
            queue = new Queue(queueName, {
                connection: this.bullmqConnection
            });
            this.bullmqQueues.set(queueName, queue);
        }

        try {
            const job = await queue.getJob(jobId);
            if (!job) {
                return false;
            }

            await job.remove();
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Liste toutes les tâches (de BullMQ et Temporal)
     */
    public async listTasks(filter?: Record<string, any>): Promise<TaskResult[]> {
        if (!this.isConnected()) {
            await this.connect();
        }

        // Récupérer les tâches des deux orchestrateurs
        const [bullmqTasks, temporalTasks] = await Promise.all([
            this.listBullMQJobs(filter),
            this.listTemporalWorkflows(filter)
        ]);

        // Combiner les résultats
        return [...bullmqTasks, ...temporalTasks];
    }

    /**
     * Liste les jobs BullMQ
     */
    private async listBullMQJobs(filter?: Record<string, any>): Promise<TaskResult[]> {
        if (!this.bullmqConnection) {
            throw new Error('Connexion BullMQ non disponible');
        }

        const tasks: TaskResult[] = [];

        for (const [queueName, queue] of this.bullmqQueues.entries()) {
            try {
                // Récupérer les tâches par état
                const states = ['waiting', 'active', 'delayed', 'completed', 'failed'];

                for (const state of states) {
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

                        tasks.push({
                            id: job.id.toString(),
                            name: job.name,
                            status,
                            source: OrchestratorType.BULLMQ,
                            result: job.returnvalue,
                            error: job.failedReason,
                            createdAt: new Date(job.timestamp),
                            updatedAt: new Date(job.finishedOn || job.processedOn || job.timestamp),
                            startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
                            completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
                            duration: job.finishedOn && job.processedOn
                                ? job.finishedOn - job.processedOn
                                : undefined
                        });
                    }
                }
            } catch (error) {
                this.logger.error(`Erreur lors de la liste des jobs BullMQ: ${(error as Error).message}`);
            }
        }

        // Appliquer les filtres si nécessaire
        if (filter) {
            return tasks.filter(task => {
                return Object.entries(filter).every(([key, value]) => {
                    return (task as any)[key] === value;
                });
            });
        }

        return tasks;
    }

    /**
     * Liste les workflows Temporal
     */
    private async listTemporalWorkflows(filter?: Record<string, any>): Promise<TaskResult[]> {
        if (!this.temporalClient) {
            throw new Error('Client Temporal non disponible');
        }

        try {
            // TODO: Dans une implémentation réelle, utiliser l'API de recherche Temporal
            // pour récupérer les workflows selon des critères
            // Pour l'instant, on retourne un tableau vide
            return [];
        } catch (error) {
            this.logger.error(`Erreur lors de la liste des workflows Temporal: ${(error as Error).message}`);
            return [];
        }
    }

    /**
     * Crée un worker pour traiter les tâches BullMQ
     */
    public createBullMQWorker(queueName: string, processor: (job: Job) => Promise<any>): Worker {
        if (!this.bullmqConnection) {
            throw new Error('Connexion BullMQ non disponible');
        }

        // Préfixer le nom de la queue si configuré
        const fullQueueName = this.config.options?.bullmqPrefix
            ? `${this.config.options.bullmqPrefix}:${queueName}`
            : queueName;

        try {
            const worker = new Worker(fullQueueName, processor, {
                connection: this.bullmqConnection
            });

            this.logger.info(`Worker BullMQ créé pour la file ${fullQueueName}`);

            return worker;
        } catch (error) {
            this.logger.error(`Erreur lors de la création du worker BullMQ: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Enregistre un worker Temporal (wrapper autour de l'API Temporal)
     * Dans une implémentation réelle, on utiliserait l'API Worker de Temporal
     */
    public registerTemporalWorker(taskQueue: string): void {
        if (!this.temporalConnection) {
            throw new Error('Connexion Temporal non disponible');
        }

        this.logger.info(`Worker Temporal enregistré pour la file ${taskQueue}`);

        // Dans une implémentation réelle:
        // import { Worker } from '@temporalio/worker';
        // const worker = await Worker.create({
        //   workflowsPath: require.resolve('./workflows'),
        //   activities: require('./activities'),
        //   taskQueue
        // });
        // await worker.run();
    }
}

// Exporter un singleton pour faciliter l'utilisation dans tout le projet
export const centralizedOrchestrator = new CentralizedOrchestrator({
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10)
    },
    temporal: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        namespace: process.env.TEMPORAL_NAMESPACE
    },
    options: {
        bullmqPrefix: process.env.BULLMQ_PREFIX || 'mcp',
        temporalTaskQueue: process.env.TEMPORAL_TASK_QUEUE || 'migration',
        logLevel: process.env.LOG_LEVEL || 'info',
        enableDebug: process.env.DEBUG === 'true',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT || '9464', 10)
    }
});
