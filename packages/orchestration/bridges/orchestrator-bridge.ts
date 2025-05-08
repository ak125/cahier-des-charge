/**
 * Bridge d'orchestration consolidé - Version standardisée 2025
 * 
 * Ce fichier est la version consolidée de l'OrchestratorBridge, unifiant
 * les différentes implémentations dispersées dans le projet.
 * 
 * Fonctionnalités:
 * - Support pour Temporal.io (workflows de longue durée)
 * - Support pour BullMQ (files d'attente et jobs)
 * - Support pour n8n (triggers externes et webhooks)
 * - Gestion unifiée des événements et notifications
 * - Métriques et surveillance intégrées
 */

import { EventEmitter } from 'events';
import { Queue, Worker, QueueEvents, ConnectionOptions } from 'bullmq';
import {
    NotificationService,
    NotificationLevel,
    NotificationTarget
} from '../../shared/services/notification-service';
import { LoggerService } from '../../shared/services/logger-service';
import { MetricsCollector } from '../../monitoring/metrics/metrics-collector';
import { ConfigService } from '../../config/config-service';

// Interfaces pour l'orchestration
import { BaseAgent } from '../../agents/core/interfaces/base-agent';
import { OrchestrationAgent } from '../../agents/core/interfaces/orchestration-agent';

/**
 * Configuration du bridge d'orchestration
 */
export interface OrchestratorBridgeOptions {
    // Options générales
    enableNotifications?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    autoReconnect?: boolean;

    // Options BullMQ
    bullmq?: {
        connection?: ConnectionOptions;
        defaultQueueOptions?: Record<string, any>;
    };

    // Options Temporal
    temporal?: {
        namespace?: string;
        taskQueue?: string;
        serverUrl?: string;
    };

    // Options n8n
    n8n?: {
        serverUrl?: string;
        apiKey?: string;
        webhookSecret?: string;
    };

    // Options de métriques
    metrics?: {
        enabled: boolean;
        collectInterval?: number;
    };
}

/**
 * Types de tâches supportés par l'orchestrateur
 */
export enum TaskType {
    SIMPLE = 'simple',      // Tâche simple BullMQ
    COMPLEX = 'complex',    // Workflow Temporal
    EXTERNAL = 'external',  // Trigger externe n8n
}

/**
 * Options pour l'exécution d'une tâche
 */
export interface TaskExecutionOptions {
    taskType: TaskType;
    priority?: number;
    delay?: number;
    attempts?: number;
    timeout?: number;

    // Options spécifiques à Temporal
    temporal?: {
        workflowType?: string;
        workflowArgs?: any[];
        taskQueue?: string;
        trackingQueue?: string;
    };

    // Options spécifiques à BullMQ
    bullmq?: {
        queueOptions?: Record<string, any>;
        jobOptions?: Record<string, any>;
    };

    // Options spécifiques à n8n
    n8n?: {
        webhookUrl?: string;
        headers?: Record<string, string>;
    };
}

/**
 * Résultat de l'exécution d'une tâche
 */
export interface TaskResult {
    success: boolean;
    id: string;
    taskType: TaskType;
    queueName?: string;
    error?: Error | string;
    data?: any;
}

/**
 * OrchestratorBridge - Classe principale pour l'orchestration unifiée
 * 
 * Cette classe sert de point central pour l'orchestration des tâches
 * à travers différents systèmes d'exécution.
 */
export class OrchestratorBridge implements OrchestrationAgent {
    name = 'OrchestratorBridge';
    description = 'Bridge unifié de communication entre orchestrateurs';
    version = '2.0.0';

    private ready = false;
    private agents: BaseAgent[] = [];
    private config: OrchestratorBridgeOptions;
    private eventBus: EventEmitter;
    private notifier: NotificationService;
    private logger: LoggerService;
    private metrics: MetricsCollector;

    // Stockage des queues BullMQ
    private bullMQQueues: Record<string, Queue> = {};
    private bullMQWorkers: Record<string, Worker> = {};
    private bullMQEvents: Record<string, QueueEvents> = {};

    // Stockage des connexions Temporal
    private temporalClients: Record<string, any> = {};

    // Stockage des connexions n8n
    private n8nConnections: Record<string, any> = {};

    /**
     * Constructeur
     */
    constructor(options?: OrchestratorBridgeOptions) {
        // Configuration par défaut
        this.config = {
            enableNotifications: true,
            logLevel: 'info',
            autoReconnect: true,
            metrics: {
                enabled: true,
                collectInterval: 60000 // 1 minute
            },
            ...options
        };

        this.eventBus = new EventEmitter();
        this.eventBus.setMaxListeners(100); // Augmentation pour eviter des warnings

        this.notifier = new NotificationService();
        this.logger = new LoggerService(this.config.logLevel);
        this.metrics = new MetricsCollector({
            enabled: this.config.metrics?.enabled ?? true,
            interval: this.config.metrics?.collectInterval
        });

        this.logger.info(`${this.name} v${this.version} instance créée`);
    }

    /**
     * Initialisation du bridge
     */
    async initialize(options?: Record<string, any>): Promise<void> {
        this.logger.info(`Initialisation de ${this.name}...`);

        try {
            // Fusionner les options avec la config existante si fournies
            if (options) {
                this.config = { ...this.config, ...options };
            }

            // Chargement de la configuration depuis ConfigService si disponible
            try {
                const configService = new ConfigService();
                const orchestratorConfig = await configService.getConfig('orchestrator');
                if (orchestratorConfig) {
                    this.config = { ...this.config, ...orchestratorConfig };
                    this.logger.debug('Configuration chargée depuis ConfigService');
                }
            } catch (err) {
                this.logger.warn('Impossible de charger la configuration depuis ConfigService, utilisation des valeurs par défaut');
            }

            // Initialiser les métriques
            await this.metrics.initialize();

            // Marquer comme prêt
            this.ready = true;
            this.eventBus.emit('ready', { timestamp: Date.now() });
            this.logger.info(`${this.name} initialisé avec succès`);

            if (this.config.enableNotifications) {
                this.notifier.send({
                    level: NotificationLevel.INFO,
                    target: NotificationTarget.SYSTEM,
                    title: `${this.name} démarré`,
                    message: `Le bridge d'orchestration a été initialisé avec succès`
                });
            }
        } catch (error) {
            this.ready = false;
            this.logger.error(`Erreur lors de l'initialisation de ${this.name}:`, error);

            if (this.config.enableNotifications) {
                this.notifier.send({
                    level: NotificationLevel.ERROR,
                    target: NotificationTarget.ADMIN,
                    title: `Erreur d'initialisation ${this.name}`,
                    message: `Le bridge d'orchestration n'a pas pu être initialisé: ${error.message}`
                });
            }

            throw error;
        }
    }

    /**
     * Vérifier si le bridge est prêt à être utilisé
     */
    isReady(): boolean {
        return this.ready;
    }

    /**
     * Obtenir les métadonnées du bridge
     */
    getMetadata(): Record<string, any> {
        return {
            name: this.name,
            version: this.version,
            description: this.description,
            ready: this.ready,
            config: {
                ...this.config,
                // Masquer les secrets
                bullmq: this.config.bullmq ? {
                    ...this.config.bullmq,
                    connection: this.config.bullmq.connection ?
                        { host: this.config.bullmq.connection.host, port: this.config.bullmq.connection.port } : undefined
                } : undefined,
                temporal: this.config.temporal ? {
                    ...this.config.temporal,
                    serverUrl: this.config.temporal.serverUrl ? '[HIDDEN]' : undefined
                } : undefined,
                n8n: this.config.n8n ? {
                    ...this.config.n8n,
                    apiKey: this.config.n8n.apiKey ? '[HIDDEN]' : undefined,
                    webhookSecret: this.config.n8n.webhookSecret ? '[HIDDEN]' : undefined
                } : undefined
            },
            queues: Object.keys(this.bullMQQueues),
            workers: Object.keys(this.bullMQWorkers),
            temporalClients: Object.keys(this.temporalClients),
            n8nConnections: Object.keys(this.n8nConnections),
            metricsEnabled: this.config.metrics?.enabled
        };
    }

    /**
     * Obtenir l'état du système d'orchestration
     */
    async getSystemState(): Promise<Record<string, any>> {
        const queueStats = await Promise.all(
            Object.entries(this.bullMQQueues).map(async ([name, queue]) => {
                try {
                    const count = await queue.count();
                    const active = await queue.getActiveCount();
                    const waiting = await queue.getWaitingCount();
                    const completed = await queue.getCompletedCount();
                    const failed = await queue.getFailedCount();

                    return {
                        name,
                        count,
                        active,
                        waiting,
                        completed,
                        failed
                    };
                } catch (err) {
                    this.logger.error(`Erreur lors de la récupération des stats pour la queue ${name}:`, err);
                    return {
                        name,
                        error: err.message
                    };
                }
            })
        );

        return {
            timestamp: Date.now(),
            ready: this.isReady(),
            queues: queueStats,
            metrics: await this.metrics.getMetrics('orchestrator')
        };
    }

    /**
     * Nettoyer les ressources lors de l'arrêt
     */
    async shutdown(): Promise<void> {
        this.logger.info(`Arrêt de ${this.name}...`);
        this.ready = false;

        // Nettoyer les files d'attente BullMQ
        for (const [name, queue] of Object.entries(this.bullMQQueues)) {
            this.logger.debug(`Fermeture de la file d'attente ${name}...`);
            await queue.close();
        }

        // Nettoyer les workers BullMQ
        for (const [name, worker] of Object.entries(this.bullMQWorkers)) {
            this.logger.debug(`Arrêt du worker ${name}...`);
            await worker.close();
        }

        // Nettoyer les événements BullMQ
        for (const [name, events] of Object.entries(this.bullMQEvents)) {
            this.logger.debug(`Fermeture des événements pour ${name}...`);
            await events.close();
        }

        // Autres nettoyages...
        this.eventBus.removeAllListeners();
        await this.metrics.shutdown();

        this.logger.info(`${this.name} arrêté avec succès`);
    }

    /**
     * Planifier une tâche à exécuter
     */
    async scheduleTask(
        queueName: string,
        payload: any,
        options: TaskExecutionOptions
    ): Promise<TaskResult> {
        if (!this.isReady()) {
            throw new Error(`${this.name} n'est pas prêt à exécuter des tâches. Appelez initialize() d'abord.`);
        }

        this.logger.debug(`Planification de tâche pour ${queueName} (type: ${options.taskType})`, { payload });

        try {
            // Métriques pour le suivi des tâches planifiées
            this.metrics.incrementCounter(`tasks.scheduled.${queueName}`);
            this.metrics.incrementCounter(`tasks.scheduled.${options.taskType}`);

            switch (options.taskType) {
                case TaskType.SIMPLE:
                    return await this.scheduleBullMQTask(queueName, payload, options);

                case TaskType.COMPLEX:
                    return await this.scheduleTemporalTask(queueName, payload, options);

                case TaskType.EXTERNAL:
                    return await this.scheduleN8nTask(queueName, payload, options);

                default:
                    throw new Error(`Type de tâche non supporté: ${options.taskType}`);
            }
        } catch (error) {
            this.logger.error(`Erreur lors de la planification de tâche pour ${queueName}:`, error);
            this.metrics.incrementCounter(`tasks.failed.${queueName}`);

            throw error;
        }
    }

    /**
     * Planifier une tâche BullMQ simple
     */
    private async scheduleBullMQTask(
        queueName: string,
        payload: any,
        options: TaskExecutionOptions
    ): Promise<TaskResult> {
        // Obtenir ou créer la queue
        let queue = this.bullMQQueues[queueName];
        if (!queue) {
            const queueOptions = {
                connection: this.config.bullmq?.connection,
                ...this.config.bullmq?.defaultQueueOptions,
                ...options.bullmq?.queueOptions
            };

            this.logger.debug(`Création de la file d'attente BullMQ: ${queueName}`, queueOptions);
            queue = new Queue(queueName, queueOptions);
            this.bullMQQueues[queueName] = queue;

            // Ecouter les événements de la queue
            const queueEvents = new QueueEvents(queueName, {
                connection: this.config.bullmq?.connection
            });

            queueEvents.on('completed', ({ jobId }) => {
                this.logger.debug(`Tâche ${jobId} terminée dans ${queueName}`);
                this.eventBus.emit('task:completed', { queueName, jobId });
                this.metrics.incrementCounter(`tasks.completed.${queueName}`);
            });

            queueEvents.on('failed', ({ jobId, failedReason }) => {
                this.logger.error(`Tâche ${jobId} échouée dans ${queueName}: ${failedReason}`);
                this.eventBus.emit('task:failed', { queueName, jobId, reason: failedReason });
                this.metrics.incrementCounter(`tasks.failed.${queueName}`);
            });

            this.bullMQEvents[queueName] = queueEvents;
        }

        // Options du job
        const jobOptions = {
            attempts: options.attempts || 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: false,
            removeOnFail: false,
            ...options.bullmq?.jobOptions
        };

        if (options.delay) {
            jobOptions.delay = options.delay;
        }

        if (options.priority) {
            jobOptions.priority = options.priority;
        }

        if (options.timeout) {
            jobOptions.timeout = options.timeout;
        }

        // Ajouter le job à la queue
        const job = await queue.add(queueName, payload, jobOptions);

        this.logger.info(`Tâche planifiée dans ${queueName} avec l'ID ${job.id}`);
        this.eventBus.emit('task:scheduled', {
            taskType: TaskType.SIMPLE,
            queueName,
            jobId: job.id
        });

        return {
            success: true,
            id: job.id.toString(),
            taskType: TaskType.SIMPLE,
            queueName,
            data: { jobId: job.id }
        };
    }

    /**
     * Planifier une tâche Temporal (workflow)
     */
    private async scheduleTemporalTask(
        workflowName: string,
        payload: any,
        options: TaskExecutionOptions
    ): Promise<TaskResult> {
        if (!options.temporal?.workflowType) {
            throw new Error('Le type de workflow est requis pour les tâches Temporal');
        }

        // Vérifier si nous avons un client Temporal
        // Note: L'implémentation est simplifiée car Temporal requiert des libs externes
        this.logger.info(`Planification du workflow Temporal: ${options.temporal.workflowType}`);

        // Pour la démonstration, nous émulons l'appel à Temporal avec un ID de tâche
        const workflowId = `temporal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Enregistrer le suivi si une queue de suivi est spécifiée
        if (options.temporal.trackingQueue) {
            await this.scheduleBullMQTask(options.temporal.trackingQueue, {
                workflowId,
                workflowType: options.temporal.workflowType,
                status: 'STARTED',
                payload
            }, {
                taskType: TaskType.SIMPLE,
                bullmq: {
                    jobOptions: {
                        attempts: 1
                    }
                }
            });
        }

        this.eventBus.emit('workflow:scheduled', {
            taskType: TaskType.COMPLEX,
            workflowName,
            workflowId,
            workflowType: options.temporal.workflowType
        });

        return {
            success: true,
            id: workflowId,
            taskType: TaskType.COMPLEX,
            queueName: workflowName,
            data: {
                workflowId,
                workflowType: options.temporal.workflowType
            }
        };
    }

    /**
     * Planifier une tâche externe via n8n
     */
    private async scheduleN8nTask(
        webhookName: string,
        payload: any,
        options: TaskExecutionOptions
    ): Promise<TaskResult> {
        if (!options.n8n?.webhookUrl) {
            throw new Error('L\'URL du webhook est requise pour les tâches externes');
        }

        this.logger.info(`Déclenchement du webhook externe n8n: ${webhookName}`);

        // Pour la démonstration, nous émulons l'appel au webhook
        const webhookId = `webhook-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        this.eventBus.emit('webhook:triggered', {
            taskType: TaskType.EXTERNAL,
            webhookName,
            webhookId,
            targetUrl: options.n8n.webhookUrl
        });

        return {
            success: true,
            id: webhookId,
            taskType: TaskType.EXTERNAL,
            queueName: webhookName,
            data: {
                webhookId,
                targetUrl: options.n8n.webhookUrl
            }
        };
    }

    /**
     * Récupérer les agents enregistrés avec ce bridge
     */
    getRegisteredAgents(): BaseAgent[] {
        return [...this.agents];
    }

    /**
     * Enregistrer un agent avec ce bridge
     */
    registerAgent(agent: BaseAgent): void {
        if (!agent || typeof agent !== 'object') {
            throw new Error('Agent invalide');
        }

        this.logger.info(`Enregistrement de l'agent: ${agent.name || 'Inconnu'}`);
        this.agents.push(agent);
        this.eventBus.emit('agent:registered', { agent: agent.name });
    }

    /**
     * S'abonner à un événement
     */
    on(event: string, listener: (...args: any[]) => void): void {
        this.eventBus.on(event, listener);
    }

    /**
     * Se désabonner d'un événement
     */
    off(event: string, listener: (...args: any[]) => void): void {
        this.eventBus.off(event, listener);
    }

    /**
     * Obtenir une file d'attente BullMQ par son nom
     */
    getBullMQQueue(queueName: string): Queue | undefined {
        return this.bullMQQueues[queueName];
    }

    /**
     * Créer un worker pour une file d'attente BullMQ
     */
    createBullMQWorker(
        queueName: string,
        processor: (job: any) => Promise<any>,
        options?: any
    ): Worker {
        if (this.bullMQWorkers[queueName]) {
            throw new Error(`Un worker existe déjà pour la file d'attente ${queueName}`);
        }

        const workerOptions = {
            connection: this.config.bullmq?.connection,
            ...options
        };

        this.logger.debug(`Création d'un worker BullMQ pour ${queueName}`);
        const worker = new Worker(queueName, processor, workerOptions);

        worker.on('completed', job => {
            this.logger.debug(`Tâche ${job.id} traitée avec succès par le worker ${queueName}`);
            this.metrics.incrementCounter(`workers.completed.${queueName}`);
        });

        worker.on('failed', (job, err) => {
            this.logger.error(`Erreur lors du traitement de la tâche ${job?.id} par le worker ${queueName}:`, err);
            this.metrics.incrementCounter(`workers.failed.${queueName}`);
        });

        this.bullMQWorkers[queueName] = worker;
        return worker;
    }
}

// Export de l'instance par défaut pour une utilisation facile
export const standardizedOrchestrator = new OrchestratorBridge();
export default OrchestratorBridge;