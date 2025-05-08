/**
 * Service de monitoring pour les orchestrateurs standardisés
 * 
 * Ce module fournit des outils pour surveiller les exécutions des workflows
 * dans Temporal.io et BullMQ, permettant de suivre la progression de la migration
 * depuis n8n et d'assurer la fiabilité des nouveaux orchestrateurs.
 */

import { Connection, WorkflowClient } from '@temporalio/client';
import { Queue, QueueEvents } from 'bullmq';
import * as prometheus from 'prom-client';
// Importations correctes des clients
import redisClient from '../queue/client';
import { getTemporalClient } from '../src/orchestration/temporal-client';

// Initialiser les métriques Prometheus
prometheus.collectDefaultMetrics();

// Métriques pour Temporal
const temporalWorkflowsTotal = new prometheus.Counter({
    name: 'temporal_workflows_total',
    help: 'Nombre total de workflows Temporal démarrés',
    labelNames: ['workflow_type', 'migrated_from_n8n'] as const
});

const temporalWorkflowDuration = new prometheus.Histogram({
    name: 'temporal_workflow_duration_seconds',
    help: 'Durée d\'exécution des workflows Temporal',
    labelNames: ['workflow_type', 'status', 'migrated_from_n8n'] as const,
    buckets: [1, 5, 15, 30, 60, 300, 900, 1800, 3600, 7200, 14400]
});

const temporalWorkflowStatus = new prometheus.Counter({
    name: 'temporal_workflow_status_total',
    help: 'Nombre de workflows par statut',
    labelNames: ['workflow_type', 'status', 'migrated_from_n8n'] as const
});

// Métriques pour BullMQ
const bullmqJobsTotal = new prometheus.Counter({
    name: 'bullmq_jobs_total',
    help: 'Nombre total de jobs BullMQ ajoutés',
    labelNames: ['queue', 'job_type', 'migrated_from_n8n'] as const
});

const bullmqJobDuration = new prometheus.Histogram({
    name: 'bullmq_job_duration_seconds',
    help: 'Durée d\'exécution des jobs BullMQ',
    labelNames: ['queue', 'job_type', 'status', 'migrated_from_n8n'] as const,
    buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300]
});

const bullmqJobStatus = new prometheus.Counter({
    name: 'bullmq_job_status_total',
    help: 'Nombre de jobs par statut',
    labelNames: ['queue', 'job_type', 'status', 'migrated_from_n8n'] as const
});

/**
 * Classe pour le monitoring des workflows Temporal
 */
export class TemporalMonitoring {
    private client: WorkflowClient | null = null;

    constructor() {
        // Le client sera initialisé lors de la première utilisation
    }

    /**
     * Initialise le client Temporal si nécessaire
     */
    private async ensureClient(): Promise<WorkflowClient> {
        if (!this.client) {
            const client = await getTemporalClient();
            this.client = client.workflow;
        }
        return this.client;
    }

    /**
     * Enregistrer le démarrage d'un workflow
     */
    public async trackWorkflowStart(workflowType: string, workflowId: string, migratedFromN8n: boolean = false): Promise<void> {
        await this.ensureClient();

        temporalWorkflowsTotal.inc({
            workflow_type: workflowType,
            migrated_from_n8n: migratedFromN8n.toString()
        });

        console.log(`[Temporal Monitoring] Workflow démarré: ${workflowType} (ID: ${workflowId})`);
    }

    /**
     * Enregistrer la complétion d'un workflow
     */
    public async trackWorkflowCompletion(
        workflowType: string,
        workflowId: string,
        status: 'completed' | 'failed' | 'canceled' | 'terminated',
        durationSeconds: number,
        migratedFromN8n: boolean = false
    ): Promise<void> {
        await this.ensureClient();

        temporalWorkflowStatus.inc({
            workflow_type: workflowType,
            status,
            migrated_from_n8n: migratedFromN8n.toString()
        });

        temporalWorkflowDuration.observe(
            {
                workflow_type: workflowType,
                status,
                migrated_from_n8n: migratedFromN8n.toString()
            },
            durationSeconds
        );

        console.log(`[Temporal Monitoring] Workflow terminé: ${workflowType} (ID: ${workflowId}), statut: ${status}, durée: ${durationSeconds}s`);
    }

    /**
     * Configurer des écouteurs d'événements pour suivre automatiquement les métriques
     */
    public async setupEventListeners(): Promise<void> {
        // Cette implémentation nécessiterait un accès direct à Temporal,
        // généralement via l'intercommunication gRPC ou un subscription service.
        // Pour plus de détails, voir la documentation Temporal.
        console.log('[Temporal Monitoring] Configuration des écouteurs d\'événements...');
    }
}

/**
 * Classe pour le monitoring des jobs BullMQ
 */
export class BullMQMonitoring {
    private queues: Map<string, { queue: Queue, events: QueueEvents }> = new Map();

    /**
     * Ajouter une file d'attente à surveiller
     */
    public trackQueue(queueName: string): void {
        if (this.queues.has(queueName)) {
            return;
        }

        // Configuration par défaut pour Redis - éviter d'accéder aux propriétés privées de redisClient
        const connectionOptions = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10)
        };

        const queue = new Queue(queueName, { connection: connectionOptions });
        const queueEvents = new QueueEvents(queueName, { connection: connectionOptions });

        // Écouter les événements de jobs
        queueEvents.on('completed', async ({ jobId, returnvalue }) => {
            const job = await queue.getJob(jobId);
            if (job) {
                const jobType = job.name;
                const processingTime = job.processedOn ? (job.finishedOn! - job.processedOn) / 1000 : 0;
                const migratedFromN8n = job.data?._migratedFromN8n || false;

                bullmqJobStatus.inc({
                    queue: queueName,
                    job_type: jobType,
                    status: 'completed',
                    migrated_from_n8n: migratedFromN8n.toString()
                });

                bullmqJobDuration.observe(
                    {
                        queue: queueName,
                        job_type: jobType,
                        status: 'completed',
                        migrated_from_n8n: migratedFromN8n.toString()
                    },
                    processingTime
                );

                console.log(`[BullMQ Monitoring] Job complété: ${jobType} (ID: ${jobId}), durée: ${processingTime}s`);
            }
        });

        queueEvents.on('failed', async ({ jobId, failedReason }) => {
            const job = await queue.getJob(jobId);
            if (job) {
                const jobType = job.name;
                const processingTime = job.processedOn ? (job.finishedOn! - job.processedOn) / 1000 : 0;
                const migratedFromN8n = job.data?._migratedFromN8n || false;

                bullmqJobStatus.inc({
                    queue: queueName,
                    job_type: jobType,
                    status: 'failed',
                    migrated_from_n8n: migratedFromN8n.toString()
                });

                bullmqJobDuration.observe(
                    {
                        queue: queueName,
                        job_type: jobType,
                        status: 'failed',
                        migrated_from_n8n: migratedFromN8n.toString()
                    },
                    processingTime
                );

                console.log(`[BullMQ Monitoring] Job échoué: ${jobType} (ID: ${jobId}), raison: ${failedReason}, durée: ${processingTime}s`);
            }
        });

        this.queues.set(queueName, { queue, events: queueEvents });
        console.log(`[BullMQ Monitoring] File d'attente configurée pour le monitoring: ${queueName}`);
    }

    /**
     * Enregistrer l'ajout d'un job
     */
    public trackJobAdd(queueName: string, jobType: string, jobId: string, migratedFromN8n: boolean = false): void {
        bullmqJobsTotal.inc({
            queue: queueName,
            job_type: jobType,
            migrated_from_n8n: migratedFromN8n.toString()
        });

        console.log(`[BullMQ Monitoring] Job ajouté: ${jobType} dans ${queueName} (ID: ${jobId})`);
    }
}

/**
 * Service central de monitoring pour les orchestrateurs
 */
export class OrchestratorMonitoring {
    public temporal: TemporalMonitoring;
    public bullmq: BullMQMonitoring;

    constructor() {
        this.temporal = new TemporalMonitoring();
        this.bullmq = new BullMQMonitoring();
    }

    /**
     * Initialiser le monitoring pour tous les orchestrateurs
     */
    public async initialize(options: {
        queues?: string[];
        setupTemporalListeners?: boolean;
    } = {}): Promise<void> {
        // Initialiser le monitoring BullMQ pour les files spécifiées
        if (options.queues && options.queues.length > 0) {
            for (const queue of options.queues) {
                this.bullmq.trackQueue(queue);
            }
        }

        // Configurer les écouteurs d'événements Temporal si demandé
        if (options.setupTemporalListeners) {
            await this.temporal.setupEventListeners();
        }

        console.log('[Orchestrator Monitoring] Monitoring initialisé');
    }

    /**
     * Exposer les métriques Prometheus 
     */
    public getMetrics(): Promise<string> {
        return prometheus.register.metrics();
    }

    /**
     * Générer un rapport de migration
     */
    public async generateMigrationReport(): Promise<{
        temporal: {
            totalWorkflows: number;
            migratedFromN8n: number;
            successRate: number;
        };
        bullmq: {
            totalJobs: number;
            migratedFromN8n: number;
            successRate: number;
        };
        timestamp: string;
    }> {
        // Dans une implémentation réelle, ces données seraient obtenues à partir des métriques
        // Pour cet exemple, nous retournons des données fictives
        return {
            temporal: {
                totalWorkflows: 243,
                migratedFromN8n: 156,
                successRate: 98.2
            },
            bullmq: {
                totalJobs: 1875,
                migratedFromN8n: 943,
                successRate: 99.5
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Exporter une instance par défaut du monitoring
export const orchestratorMonitoring = new OrchestratorMonitoring();

/**
 * UTILISATION
 * 
 * // Initialiser le monitoring pour les orchestrateurs standardisés
 * await orchestratorMonitoring.initialize({
 *   queues: ['notifications', 'data-processing', 'reports'],
 *   setupTemporalListeners: true
 * });
 * 
 * // Pour BullMQ: suivre l'ajout d'un job
 * orchestratorMonitoring.bullmq.trackJobAdd('notifications', 'send-email', jobId, true);
 * 
 * // Pour Temporal: suivre le démarrage d'un workflow
 * orchestratorMonitoring.temporal.trackWorkflowStart('CodeAnalysisWorkflow', workflowId, true);
 * 
 * // Pour Temporal: suivre la complétion d'un workflow
 * orchestratorMonitoring.temporal.trackWorkflowCompletion(
 *   'CodeAnalysisWorkflow', 
 *   workflowId, 
 *   'completed', 
 *   120, // durée en secondes
 *   true  // migré depuis n8n
 * );
 * 
 * // Générer un rapport de migration
 * const report = await orchestratorMonitoring.generateMigrationReport();
 */