import { AbstractOrchestratorAgent } from '../abstract-orchestrator';
import { Client as TemporalClient } from "@temporalio/client";
import { Queue, Worker, QueueEvents } from "bullmq";
import { Logger } from "@nestjs/common";
import axios from "axios";
import Redis from "ioredis";
import * as path from "path";
import * as fs from "fs";
import * as express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { MetricsService } from "./metrics-service";
import { WorkflowVersioner } from "../src/temporal/workflow-versioner";
import { 
  NotificationService, 
  NotificationChannel, 
  NotificationType,
  NotificationConfig 
} from "./notification-service";

/**
 * Configuration du pont d'orchestration
 */
export interface OrchestratorBridgeConfig {
  redisUrl: string;
  temporalAddress: string;
  n8nWebhookUrl: string;
  queueNames: string[];
  statusFilePath?: string;
  temporalUIAddress?: string;
  n8nUIAddress?: string;
  dashboardPort?: number;
  metricsEnabled?: boolean;
  metricsFilePath?: string;
  enableMetrics?: boolean;
  workflowVersionsPath?: string;
  enableWorkflowVersioning?: boolean;
  notification?: {
    enabled: boolean;
    config?: NotificationConfig;
  };
}

/**
 * OrchestratorBridge - Pont d'intégration entre Temporal.io, BullMQ et n8n
 * 
 * Cette classe permet une communication bidirectionnelle entre:
 * - Temporal.io pour les workflows de longue durée
 * - BullMQ pour les files d'attente et jobs distribués
 * - n8n pour les triggers externes et webhooks
 */
export class OrchestratorBridge extends AbstractOrchestratorAgent<any, any> {
  private readonly logger = new Logger('OrchestratorBridge');
  private temporalClient: TemporalClient;
  private redisClient: Redis;
  private bullMQQueues: Record<string, Queue> = {};
  private bullMQEvents: Record<string, QueueEvents> = {};
  private n8nWebhookUrl: string;
  private dashboardServer: any;
  private metricsService: MetricsService | null = null;
  private workflowVersioner: WorkflowVersioner | null = null;
  private notificationService: NotificationService | null = null;
  
  constructor(
    private readonly config: OrchestratorBridgeConfig
  ) {
    this.n8nWebhookUrl = config.n8nWebhookUrl;
    
    // Initialisation du service de métriques si activé
    if (config.enableMetrics) {
      this.metricsService = new MetricsService({
        metricsFilePath: config.metricsFilePath || path.join(process.cwd(), 'metrics.json'),
        autoSave: true,
        saveIntervalMs: 30000 // Sauvegarde toutes les 30 secondes
      });
    }
    
    // Initialisation du gestionnaire de versions si activé
    if (config.enableWorkflowVersioning) {
      this.workflowVersioner = new WorkflowVersioner({
        versionsFilePath: config.workflowVersionsPath || path.join(process.cwd(), 'workflow-versions.json')
      });
    }
    
    // Initialisation du service de notification si activé
    if (config.notification?.enabled) {
      // Configuration par défaut si aucune n'est fournie
      const defaultNotificationConfig: NotificationConfig = {
        channels: {
          [NotificationChannel.CONSOLE]: {},
          [NotificationChannel.FILE]: {
            filePath: path.join(process.cwd(), 'logs', 'notifications.log')
          }
        },
        defaults: {
          channels: [NotificationChannel.CONSOLE, NotificationChannel.FILE],
          type: NotificationType.INFO,
          throttleMs: 60000 // 1 minute
        }
      };
      
      this.notificationService = new NotificationService(
        config.notification.config || defaultNotificationConfig
      );
    }
  }
  
  /**
   * Initialise la connexion aux différents systèmes
   */
  async initialize() {
    this.logger.log('🔄 Initialisation du pont d\'orchestration...');
    
    // Connexion à Temporal
    this.temporalClient = await TemporalClient.connect({
      address: this.config.temporalAddress,
    });
    this.logger.log('✅ Connecté à Temporal Server');
    
    // Connexion à Redis
    this.redisClient = new Redis(this.config.redisUrl);
    this.logger.log('✅ Connecté à Redis');
    
    // Initialisation des files d'attente BullMQ
    for (const queueName of this.config.queueNames) {
      this.bullMQQueues[queueName] = new Queue(queueName, {
        connection: { host: new URL(this.config.redisUrl).hostname }
      });
      
      // Événements BullMQ pour synchro avec Temporal et n8n
      this.bullMQEvents[queueName] = new QueueEvents(queueName, {
        connection: { host: new URL(this.config.redisUrl).hostname }
      });
      
      // Écoute des événements de complétion
      this.bullMQEvents[queueName].on('completed', async ({ jobId, returnvalue }) => {
        try {
          const job = await this.bullMQQueues[queueName].getJob(jobId);
          if (job) {
            // Publier statut vers n8n
            await this.notifyN8N('job.completed', {
              queueName,
              jobId,
              data: job.data,
              result: JSON.parse(returnvalue),
              timestamp: new Date().toISOString()
            });
            
            // Vérifier si un workflow Temporal est associé
            const temporalWorkflowId = job.data.temporalWorkflowId;
            if (temporalWorkflowId) {
              // Signaler au workflow Temporal
              const handle = this.temporalClient.workflow.getHandle(temporalWorkflowId);
              await handle.signal('bullMQJobCompleted', {
                queueName,
                jobId,
                result: JSON.parse(returnvalue)
              });
              this.logger.log(`✓ Signal envoyé au workflow Temporal ${temporalWorkflowId}`);
            }
            
            // Mise à jour du statut global
            await this.updateGlobalStatus({
              type: 'job.completed',
              queueName,
              jobId,
              timestamp: new Date().toISOString(),
              data: {
                result: JSON.parse(returnvalue),
                duration: job.finishedOn ? job.finishedOn - job.processedOn : undefined
              }
            });
            
            // Collecter des métriques
            if (this.metricsService) {
              this.metricsService.incrementCounter('jobs_completed_total', 1, { queue: queueName });
              
              // Mesurer le temps d'exécution
              if (job.finishedOn && job.processedOn) {
                const durationMs = job.finishedOn - job.processedOn;
                this.metricsService.observeHistogram('job_duration_milliseconds', durationMs, { 
                  queue: queueName,
                  job_type: job.name || 'unknown'
                });
              }
            }

            // Envoyer une notification de réussite
            if (this.notificationService && job.data.temporalWorkflowId) {
              await this.notificationService.success(
                `Job ${job.name || 'Unnamed'} #${jobId} terminé avec succès`,
                `Le job associé au workflow ${job.data.temporalWorkflowId} a été complété avec succès.`,
                {
                  metadata: {
                    queueName,
                    jobId,
                    workflowId: job.data.temporalWorkflowId,
                    duration: job.finishedOn && job.processedOn ? `${job.finishedOn - job.processedOn}ms` : 'N/A'
                  }
                }
              );
            }
          }
        } catch (error) {
          this.logger.error(`Erreur lors du traitement de la complétion du job ${jobId}`, error);
        }
      });
      
      // Écoute des événements d'échec
      this.bullMQEvents[queueName].on('failed', async ({ jobId, failedReason }) => {
        try {
          const job = await this.bullMQQueues[queueName].getJob(jobId);
          if (job) {
            // Publier statut vers n8n
            await this.notifyN8N('job.failed', {
              queueName,
              jobId,
              data: job.data,
              error: failedReason,
              timestamp: new Date().toISOString()
            });
            
            // Vérifier si un workflow Temporal est associé
            const temporalWorkflowId = job.data.temporalWorkflowId;
            if (temporalWorkflowId) {
              // Signaler au workflow Temporal
              const handle = this.temporalClient.workflow.getHandle(temporalWorkflowId);
              await handle.signal('bullMQJobFailed', {
                queueName,
                jobId,
                error: failedReason
              });
              this.logger.log(`✗ Signal d'échec envoyé au workflow Temporal ${temporalWorkflowId}`);
            }
            
            // Mise à jour du statut global
            await this.updateGlobalStatus({
              type: 'job.failed',
              queueName,
              jobId,
              timestamp: new Date().toISOString(),
              data: {
                error: failedReason,
                attempts: job.attemptsMade,
                duration: job.finishedOn ? job.finishedOn - job.processedOn : undefined
              }
            });
            
            // Collecter des métriques
            if (this.metricsService) {
              this.metricsService.incrementCounter('jobs_failed_total', 1, { queue: queueName });
              this.metricsService.incrementCounter('jobs_failed_by_type', 1, { 
                queue: queueName,
                job_type: job.name || 'unknown',
                error_type: this.categorizeError(failedReason)
              });
            }

            // Envoyer une notification d'échec
            if (this.notificationService) {
              const notificationType = job.attemptsMade >= job.opts.attempts
                ? NotificationType.ERROR
                : NotificationType.WARNING;
              
              await this.notificationService.notify({
                title: `Job ${job.name || 'Unnamed'} #${jobId} a échoué`,
                message: failedReason,
                type: notificationType,
                metadata: {
                  queueName,
                  jobId,
                  workflowId: job.data.temporalWorkflowId,
                  attempts: `${job.attemptsMade}/${job.opts.attempts || 1}`
                }
              });
            }
          }
        } catch (error) {
          this.logger.error(`Erreur lors du traitement de l'échec du job ${jobId}`, error);
        }
      });
      
      // Écouter les ajouts de jobs
      this.bullMQEvents[queueName].on('added', async ({ jobId }) => {
        if (this.metricsService) {
          this.metricsService.incrementCounter('jobs_added_total', 1, { queue: queueName });
          
          // Mettre à jour la jauge du nombre de jobs en attente
          try {
            const waitingCount = await this.bullMQQueues[queueName].getWaitingCount();
            this.metricsService.setGauge('jobs_waiting', waitingCount, { queue: queueName });
          } catch (error) {
            // Ignore les erreurs
          }
        }
      });
    }
    
    this.logger.log('✅ Pont d\'orchestration initialisé avec succès');
    return this;
  }
  
  /**
   * Démarre un workflow Temporal et crée un job BullMQ associé
   */
  async startTemporalWorkflowWithBullMQTracking(options: {
    workflowType: string;
    workflowArgs: any[];
    workflowId?: string;
    taskQueue: string;
    bullMQQueue: string;
    bullMQJobData: any;
    notifyN8N?: boolean;
  }) {
    const { workflowType, workflowArgs, taskQueue, bullMQQueue, bullMQJobData, notifyN8N = true } = options;
    
    const workflowId = options.workflowId || `${workflowType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    this.logger.log(`🚀 Démarrage du workflow ${workflowType} avec ID ${workflowId}`);
    
    try {
      // Démarrer le workflow Temporal
      const handle = await this.temporalClient.workflow.start(workflowType, {
        args: workflowArgs,
        taskQueue,
        workflowId,
      });
      
      // Collecter des métriques
      if (this.metricsService) {
        this.metricsService.incrementCounter('workflows_started_total', 1, { 
          workflow_type: workflowType,
          task_queue: taskQueue
        });
      }
      
      // Créer un job BullMQ pour suivre le workflow
      const jobData = {
        ...bullMQJobData,
        temporalWorkflowId: workflowId,
        temporalRunId: handle.firstExecutionRunId,
        startTime: new Date().toISOString()
      };
      
      const job = await this.bullMQQueues[bullMQQueue].add(
        `track-${workflowType}`, 
        jobData, 
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      );
      
      // Notifier n8n si demandé
      if (notifyN8N) {
        await this.notifyN8N('workflow.started', {
          workflowType,
          workflowId,
          runId: handle.firstExecutionRunId,
          bullMQJobId: job.id,
          timestamp: new Date().toISOString(),
          data: jobData
        });
      }
      
      // Mise à jour du statut global
      await this.updateGlobalStatus({
        type: 'workflow.started',
        workflowId,
        workflowType,
        timestamp: new Date().toISOString(),
        data: {
          runId: handle.firstExecutionRunId,
          bullMQJobId: job.id,
          taskQueue
        }
      });

      // Notifier le démarrage d'un workflow
      if (this.notificationService) {
        await this.notificationService.info(
          `Workflow ${workflowType} démarré`,
          `Un nouveau workflow ${workflowType} avec ID ${workflowId} a été démarré.`,
          {
            metadata: {
              workflowId,
              runId: handle.firstExecutionRunId,
              bullMQJobId: job.id,
              taskQueue
            }
          }
        );
      }
      
      return {
        workflowId,
        runId: handle.firstExecutionRunId,
        bullMQJobId: job.id
      };
    } catch (error) {
      // Collecter des métriques sur les erreurs
      if (this.metricsService) {
        this.metricsService.incrementCounter('workflows_start_failed_total', 1, { 
          workflow_type: workflowType,
          task_queue: taskQueue,
          error_type: this.categorizeError(error.message)
        });
      }
      
      this.logger.error(`Erreur lors du démarrage du workflow ${workflowType}`, error);

      // Notifier l'échec de démarrage
      if (this.notificationService) {
        await this.notificationService.error(
          `Échec du démarrage du workflow ${workflowType}`,
          error.message,
          {
            metadata: {
              workflowType,
              taskQueue,
              error: error.stack
            }
          }
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Démarre un workflow Temporal avec une version spécifique et crée un job BullMQ associé
   */
  async startVersionedWorkflow(options: {
    workflowType: string;
    workflowArgs: any[];
    workflowVersion?: string;
    workflowId?: string;
    taskQueue?: string;
    bullMQQueue: string;
    bullMQJobData: any;
    notifyN8N?: boolean;
  }) {
    const { 
      workflowType, 
      workflowArgs, 
      workflowVersion = 'latest',
      bullMQQueue, 
      bullMQJobData, 
      notifyN8N = true 
    } = options;
    
    if (!this.workflowVersioner) {
      throw new Error("Le système de versionnement des workflows n'est pas activé. Utilisez enableWorkflowVersioning: true dans la configuration.");
    }
    
    // Déterminer la file d'attente à utiliser pour la version spécifiée
    const taskQueue = options.taskQueue || this.workflowVersioner.getTaskQueueForVersion(workflowType, workflowVersion);
    
    if (!taskQueue) {
      throw new Error(`Aucune file d'attente trouvée pour le workflow ${workflowType} version ${workflowVersion}`);
    }
    
    const workflowId = options.workflowId || `${workflowType}-v${workflowVersion}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    this.logger.log(`🚀 Démarrage du workflow ${workflowType} version ${workflowVersion} avec ID ${workflowId}`);
    
    try {
      // Obtenir la version exacte si 'latest' est spécifié
      let actualVersion = workflowVersion;
      let buildId: string | undefined;
      
      if (workflowVersion === 'latest') {
        const latestVersion = this.workflowVersioner.getLatestVersion(workflowType);
        if (!latestVersion) {
          throw new Error(`Aucune version trouvée pour le workflow ${workflowType}`);
        }
        actualVersion = latestVersion.version;
        buildId = latestVersion.buildId;
      } else {
        const specificVersion = this.workflowVersioner.getVersion(workflowType, workflowVersion);
        if (!specificVersion) {
          throw new Error(`Version ${workflowVersion} non trouvée pour le workflow ${workflowType}`);
        }
        buildId = specificVersion.buildId;
      }
      
      // Démarrer le workflow Temporal avec la version spécifiée
      const handle = await this.temporalClient.workflow.start(workflowType, {
        args: workflowArgs,
        taskQueue,
        workflowId,
        ...(buildId ? { buildId } : {})
      });
      
      // Collecter des métriques
      if (this.metricsService) {
        this.metricsService.incrementCounter('workflows_started_total', 1, { 
          workflow_type: workflowType,
          workflow_version: actualVersion,
          task_queue: taskQueue
        });
      }
      
      // Créer un job BullMQ pour suivre le workflow
      const jobData = {
        ...bullMQJobData,
        temporalWorkflowId: workflowId,
        temporalRunId: handle.firstExecutionRunId,
        startTime: new Date().toISOString(),
        workflowVersion: actualVersion
      };
      
      const job = await this.bullMQQueues[bullMQQueue].add(
        `track-${workflowType}-v${actualVersion}`, 
        jobData, 
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      );
      
      // Notifier n8n si demandé
      if (notifyN8N) {
        await this.notifyN8N('workflow.started', {
          workflowType,
          workflowId,
          runId: handle.firstExecutionRunId,
          bullMQJobId: job.id,
          workflowVersion: actualVersion,
          timestamp: new Date().toISOString(),
          data: jobData
        });
      }
      
      // Mise à jour du statut global
      await this.updateGlobalStatus({
        type: 'workflow.started',
        workflowId,
        workflowType,
        workflowVersion: actualVersion,
        timestamp: new Date().toISOString(),
        data: {
          runId: handle.firstExecutionRunId,
          bullMQJobId: job.id,
          taskQueue,
          buildId
        }
      });
      
      return {
        workflowId,
        runId: handle.firstExecutionRunId,
        bullMQJobId: job.id,
        workflowVersion: actualVersion,
        taskQueue
      };
    } catch (error) {
      // Collecter des métriques sur les erreurs
      if (this.metricsService) {
        this.metricsService.incrementCounter('workflows_start_failed_total', 1, { 
          workflow_type: workflowType,
          workflow_version: workflowVersion,
          task_queue: taskQueue || 'unknown',
          error_type: this.categorizeError(error.message)
        });
      }
      
      this.logger.error(`Erreur lors du démarrage du workflow ${workflowType} version ${workflowVersion}`, error);
      throw error;
    }
  }
  
  /**
   * Gère les erreurs de workflow Temporal avec différentes stratégies de reprise
   * @param options Options de gestion des erreurs
   */
  async setupTemporalErrorHandling(options: {
    taskQueue: string;
    retryOptions?: {
      maxAttempts: number;
      initialInterval: number; // en ms
      backoffCoefficient: number;
      maximumInterval?: number; // en ms
      nonRetryableErrors?: string[];
    };
    notifyOnFailure?: boolean;
  }) {
    const { taskQueue, retryOptions, notifyOnFailure = true } = options;
    
    // Paramètres par défaut pour les reprises
    const defaultRetryOptions = {
      maxAttempts: 3,
      initialInterval: 1000, // 1 seconde
      backoffCoefficient: 2, // augmentation exponentielle
      maximumInterval: 60000, // 1 minute maximum
      nonRetryableErrors: ['ValidationError', 'ConfigurationError']
    };
    
    const finalRetryOptions = { ...defaultRetryOptions, ...retryOptions };
    
    // Créer un worker spécial pour surveiller les échecs de workflow
    const failureMonitorHandle = await this.temporalClient.workflow.getHandle('__failureMonitor__');
    
    // Créer un worker pour observer les événements Temporal
    this.logger.log(`🔍 Configuration de la gestion des erreurs pour la file d'attente "${taskQueue}"`);

    // Mettre en place une routine pour vérifier périodiquement les workflows échoués
    setInterval(async () => {
      try {
        // Recherche des workflows en échec dans la file d'attente spécifiée
        const failedWorkflows = await this.temporalClient.workflow.list({
          query: `TaskQueue='${taskQueue}' AND ExecutionStatus='Failed'`
        });
        
        for await (const workflow of failedWorkflows) {
          // Vérifier si le workflow a déjà été traité
          if (await this.isWorkflowAlreadyHandled(workflow.execution.workflowId)) {
            continue;
          }
          
          // Obtenir les détails de l'échec
          const description = await this.temporalClient.workflow.describe(workflow.execution);
          this.logger.warn(`❌ Workflow en échec détecté: ${workflow.execution.workflowId}`, {
            workflowId: workflow.execution.workflowId,
            taskQueue,
            error: description.status.failure?.message || 'Erreur inconnue'
          });
          
          // Vérifier si on doit réessayer
          const failureType = this.getFailureType(description.status.failure);
          const shouldRetry = !finalRetryOptions.nonRetryableErrors.includes(failureType);
          
          if (shouldRetry && description.status.historyLength < finalRetryOptions.maxAttempts) {
            // Calculer le délai de reprise
            const attempt = description.status.historyLength;
            const delayMs = Math.min(
              finalRetryOptions.initialInterval * Math.pow(finalRetryOptions.backoffCoefficient, attempt - 1),
              finalRetryOptions.maximumInterval || Number.MAX_SAFE_INTEGER
            );
            
            this.logger.log(`⏱️ Programmation d'une reprise du workflow ${workflow.execution.workflowId} dans ${delayMs}ms (tentative ${attempt})`);
            
            // Programmer la reprise
            setTimeout(async () => {
              try {
                // Redémarrer le workflow avec les mêmes arguments
                const handle = await this.temporalClient.workflow.start(workflow.type.name, {
                  taskQueue,
                  workflowId: `retry-${workflow.execution.workflowId}-${Date.now()}`,
                  memo: {
                    originalWorkflowId: workflow.execution.workflowId,
                    retryAttempt: attempt,
                    retryReason: description.status.failure?.message
                  }
                });
                
                this.logger.log(`🔄 Workflow ${workflow.type.name} redémarré avec ID ${handle.workflowId}`);
                
                // Mise à jour du statut global
                await this.updateGlobalStatus({
                  type: 'workflow.retry',
                  workflowId: handle.workflowId,
                  originalWorkflowId: workflow.execution.workflowId,
                  workflowType: workflow.type.name,
                  timestamp: new Date().toISOString(),
                  data: {
                    attempt,
                    reason: description.status.failure?.message,
                    delay: delayMs
                  }
                });
              } catch (error) {
                this.logger.error(`Erreur lors de la reprise du workflow ${workflow.execution.workflowId}`, error);
              }
            }, delayMs);

            // Notifier la reprise planifiée
            if (this.notificationService) {
              await this.notificationService.warning(
                `Reprise planifiée pour workflow en échec`,
                `Le workflow ${workflow.execution.workflowId} sera repris dans ${delayMs}ms (tentative ${attempt})`,
                {
                  metadata: {
                    workflowId: workflow.execution.workflowId,
                    workflowType: workflow.type.name,
                    error: description.status.failure?.message,
                    attempt: attempt,
                    maxAttempts: finalRetryOptions.maxAttempts
                  }
                }
              );
            }
          } else {
            this.logger.warn(`❌ Le workflow ${workflow.execution.workflowId} ne sera pas repris:`, {
              reason: !shouldRetry ? `Type d'erreur non repris: ${failureType}` : `Nombre maximum de tentatives atteint: ${finalRetryOptions.maxAttempts}`
            });
            
            // Envoyer une notification finale d'échec
            if (notifyOnFailure) {
              await this.notifyN8N('workflow.failure', {
                workflowId: workflow.execution.workflowId,
                workflowType: workflow.type.name,
                timestamp: new Date().toISOString(),
                error: description.status.failure?.message,
                stackTrace: description.status.failure?.stackTrace,
                attempts: description.status.historyLength,
                finalFailure: true
              });
            }
            
            // Mise à jour du statut global pour un échec final
            await this.updateGlobalStatus({
              type: 'workflow.finalFailure',
              workflowId: workflow.execution.workflowId,
              workflowType: workflow.type.name,
              timestamp: new Date().toISOString(),
              data: {
                error: description.status.failure?.message,
                attempts: description.status.historyLength
              }
            });

            // Notifier l'échec définitif
            if (this.notificationService) {
              await this.notificationService.critical(
                `Échec définitif du workflow ${workflow.execution.workflowId}`,
                `Le workflow ${workflow.type.name} a échoué de manière définitive après ${description.status.historyLength} tentatives.`,
                {
                  metadata: {
                    workflowId: workflow.execution.workflowId,
                    workflowType: workflow.type.name,
                    error: description.status.failure?.message,
                    stackTrace: description.status.failure?.stackTrace,
                    attempts: description.status.historyLength,
                    reason: !shouldRetry 
                      ? `Type d'erreur non repris: ${failureType}` 
                      : `Nombre maximum de tentatives atteint: ${finalRetryOptions.maxAttempts}`
                  }
                }
              );
            }
          }
          
          // Marquer le workflow comme traité
          await this.markWorkflowAsHandled(workflow.execution.workflowId);
        }
      } catch (error) {
        this.logger.error('Erreur lors de la surveillance des workflows en échec', error);
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    this.logger.log(`✅ Gestion des erreurs configurée pour la file d'attente "${taskQueue}"`);
  }
  
  /**
   * Vérifie si un workflow a déjà été traité par le mécanisme de gestion des erreurs
   * @param workflowId L'ID du workflow à vérifier
   * @returns true si le workflow a déjà été traité, false sinon
   */
  private async isWorkflowAlreadyHandled(workflowId: string): Promise<boolean> {
    const key = `handled:${workflowId}`;
    const result = await this.redisClient.get(key);
    return result === '1';
  }
  
  /**
   * Marque un workflow comme traité par le mécanisme de gestion des erreurs
   * @param workflowId L'ID du workflow à marquer
   */
  private async markWorkflowAsHandled(workflowId: string): Promise<void> {
    const key = `handled:${workflowId}`;
    // Expiration après 24 heures pour nettoyer la base Redis
    await this.redisClient.set(key, '1', 'EX', 86400);
  }
  
  /**
   * Extrait le type d'erreur d'un objet failure Temporal
   * @param failure L'objet failure de Temporal
   * @returns Le type d'erreur sous forme de chaîne
   */
  private getFailureType(failure: any): string {
    if (!failure) return 'UnknownError';
    
    // Tenter d'extraire le type d'erreur depuis le message
    const errorTypeMatch = failure.message?.match(/^([A-Za-z]+Error):/);
    if (errorTypeMatch) return errorTypeMatch[1];
    
    // Fallback sur le type d'application
    return failure.applicationFailureInfo?.type || 'ApplicationError';
  }
  
  /**
   * Envoie une notification à n8n via un webhook
   */
  private async notifyN8N(event: string, payload: any) {
    if (!this.n8nWebhookUrl) return;
    
    try {
      await axios.post(`${this.n8nWebhookUrl}/${event}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      this.logger.log(`📤 Notification n8n envoyée: ${event}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la notification n8n (${event})`, error);
    }
  }
  
  /**
   * Écoute les signaux de n8n et les transmet à Temporal/BullMQ
   */
  async listenToN8NSignals(webHandler: any, port: number = 3456) {
    // Configurer un mini serveur pour recevoir des signaux de n8n
    webHandler.post('/n8n-signal/:signalType', async (req: any, res: any) => {
      const { signalType } = req.params;
      const payload = req.body;
      
      this.logger.log(`📥 Signal n8n reçu: ${signalType}`);
      
      try {
        if (payload.workflowId) {
          // Signal vers Temporal
          const handle = this.temporalClient.workflow.getHandle(payload.workflowId);
          await handle.signal(signalType, payload);
          this.logger.log(`✓ Signal transmis au workflow Temporal ${payload.workflowId}`);
        }
        
        if (payload.bullMQQueue && payload.jobData) {
          // Création d'un job BullMQ
          const queue = this.bullMQQueues[payload.bullMQQueue];
          if (queue) {
            const job = await queue.add(signalType, payload.jobData);
            this.logger.log(`✓ Job créé dans la file BullMQ ${payload.bullMQQueue}: ${job.id}`);
          }
        }
        
        // Mise à jour du statut global
        await this.updateGlobalStatus({
          type: 'n8n.signal',
          signalType,
          timestamp: new Date().toISOString(),
          data: payload
        });
        
        res.status(200).json({ success: true, message: 'Signal traité avec succès' });
      } catch (error) {
        this.logger.error(`Erreur lors du traitement du signal n8n ${signalType}`, error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Démarrer le serveur
    webHandler.listen(port, () => {
      this.logger.log(`🚀 Serveur d'écoute des signaux n8n démarré sur le port ${port}`);
    });
  }
  
  /**
   * Crée et démarre un tableau de bord unifié pour monitorer Temporal, BullMQ et n8n
   * @param port Port d'écoute du serveur web
   * @returns L'instance du serveur web
   */
  async createDashboardServer(port: number = 3500): Promise<any> {
    const app = express();
    
    // Configuration du tableau de bord BullMQ
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/bull-dashboard');
    
    const bullBoard = createBullBoard({
      queues: Object.values(this.bullMQQueues).map(queue => new BullMQAdapter(queue)),
      serverAdapter
    });
    
    app.use('/bull-dashboard', serverAdapter.getRouter());
    
    // Page d'accueil avec liens vers les différents tableaux de bord
    app.get('/', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Tableau de bord d'orchestration</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              h1 { color: #333; }
              .dashboard-container { display: flex; flex-wrap: wrap; gap: 20px; }
              .dashboard-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; width: 300px; }
              .dashboard-card h2 { margin-top: 0; color: #0066cc; }
              .button { display: inline-block; background: #0066cc; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 10px; }
              .stats { margin-top: 20px; background: #f5f5f5; padding: 15px; border-radius: 8px; }
            </style>
          </head>
          <body>
            <h1>Tableau de bord d'orchestration unifié</h1>
            <div class="dashboard-container">
              <div class="dashboard-card">
                <h2>BullMQ</h2>
                <p>Gestion des files d'attente et des tâches distribuées</p>
                <a class="button" href="/bull-dashboard">Ouvrir BullMQ Dashboard</a>
              </div>
              <div class="dashboard-card">
                <h2>Temporal</h2>
                <p>Gestion des workflows durables de longue durée</p>
                <a class="button" href="${this.config.temporalUIAddress || 'http://localhost:8088'}" target="_blank">Ouvrir Temporal UI</a>
              </div>
              <div class="dashboard-card">
                <h2>n8n</h2>
                <p>Automatisation et orchestration des workflows</p>
                <a class="button" href="${this.config.n8nUIAddress || 'http://localhost:5678'}" target="_blank">Ouvrir n8n</a>
              </div>
            </div>
            
            <div class="stats">
              <h2>Statistiques globales</h2>
              <div id="stats">Chargement des statistiques...</div>
            </div>
            
            <script>
              // Charger les statistiques via AJAX
              async function loadStats() {
                const response = await fetch('/api/statistics');
                const stats = await response.json();
                document.getElementById('stats').innerHTML = \`
                  <ul>
                    <li>Workflows démarrés: \${stats.workflowsStarted}</li>
                    <li>Workflows terminés: \${stats.workflowsCompleted}</li>
                    <li>Workflows en échec: \${stats.workflowsFailed}</li>
                    <li>Jobs traités: \${stats.jobsProcessed}</li>
                    <li>Jobs terminés: \${stats.jobsCompleted}</li>
                    <li>Jobs en échec: \${stats.jobsFailed}</li>
                    <li>Dernière mise à jour: \${new Date(stats.lastUpdated).toLocaleString()}</li>
                  </ul>
                \`;
              }
              
              // Charger les statistiques toutes les 5 secondes
              loadStats();
              setInterval(loadStats, 5000);
            </script>
          </body>
        </html>
      `);
    });
    
    // API pour récupérer les statistiques
    app.get('/api/statistics', (req, res) => {
      if (!this.config.statusFilePath || !fs.existsSync(this.config.statusFilePath)) {
        return res.json({
          workflowsStarted: 0,
          workflowsCompleted: 0,
          workflowsFailed: 0,
          jobsProcessed: 0,
          jobsCompleted: 0,
          jobsFailed: 0,
          lastUpdated: new Date().toISOString()
        });
      }
      
      const statusData = JSON.parse(fs.readFileSync(this.config.statusFilePath, 'utf8'));
      res.json(statusData.statistics || {
        workflowsStarted: 0,
        workflowsCompleted: 0,
        workflowsFailed: 0,
        jobsProcessed: 0,
        jobsCompleted: 0,
        jobsFailed: 0,
        lastUpdated: new Date().toISOString()
      });
    });
    
    // API pour récupérer les événements récents
    app.get('/api/events', (req, res) => {
      if (!this.config.statusFilePath || !fs.existsSync(this.config.statusFilePath)) {
        return res.json([]);
      }
      
      const statusData = JSON.parse(fs.readFileSync(this.config.statusFilePath, 'utf8'));
      res.json(statusData.events || []);
    });
    
    // API pour récupérer les versions des workflows
    app.get('/api/workflow-versions', (req, res) => {
      if (!this.workflowVersioner) {
        return res.json({});
      }
      
      const result: Record<string, any> = {};
      const workflowTypes = Object.keys(this.workflowVersioner['versions']);
      
      workflowTypes.forEach(workflowType => {
        result[workflowType] = this.workflowVersioner?.getAllVersions(workflowType);
      });
      
      res.json(result);
    });
    
    // API pour récupérer les versions d'un workflow spécifique
    app.get('/api/workflow-versions/:workflowType', (req, res) => {
      if (!this.workflowVersioner) {
        return res.json([]);
      }
      
      const { workflowType } = req.params;
      const versions = this.workflowVersioner.getAllVersions(workflowType);
      
      res.json(versions);
    });
    
    // Exposer les métriques si le service est activé
    if (this.metricsService) {
      this.exposeMetricsEndpoint(app);
    }
    
    // Démarrer le serveur
    this.dashboardServer = app.listen(port, () => {
      this.logger.log(`🚀 Tableau de bord d'orchestration démarré sur http://localhost:${port}`);
    });
    
    return this.dashboardServer;
  }
  
  /**
   * Enregistre une nouvelle version d'un workflow
   */
  registerWorkflowVersion(
    workflowType: string,
    version: string,
    taskQueue: string,
    buildId: string,
    compatibleWith: string[] = [],
    metadata: Record<string, any> = {}
  ): void {
    if (!this.workflowVersioner) {
      throw new Error("Le système de versionnement des workflows n'est pas activé");
    }
    
    try {
      this.workflowVersioner.registerVersion(
        workflowType,
        version,
        taskQueue,
        buildId,
        compatibleWith,
        metadata
      );
      
      this.logger.log(`✅ Version ${version} enregistrée pour le workflow ${workflowType}`);
      
      // Exposer les versions dans le tableau de bord si disponible
      if (this.dashboardServer) {
        this.logger.log(`ℹ️ Le tableau de bord a été mis à jour avec la nouvelle version du workflow`);
      }

      // Notifier l'enregistrement d'une nouvelle version
      if (this.notificationService) {
        this.notificationService.success(
          `Nouvelle version ${version} pour ${workflowType}`,
          `Une nouvelle version du workflow ${workflowType} a été enregistrée.`,
          {
            metadata: {
              workflowType,
              version,
              taskQueue,
              buildId,
              compatibleWith: compatibleWith || []
            }
          }
        );
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'enregistrement de la version ${version} du workflow ${workflowType}`, error);
      
      // Notifier l'échec d'enregistrement
      if (this.notificationService) {
        this.notificationService.error(
          `Échec de l'enregistrement de la version ${version} de ${workflowType}`,
          error.message,
          {
            metadata: {
              workflowType,
              version,
              taskQueue,
              error: error.stack
            }
          }
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Récupère toutes les versions d'un workflow
   */
  getWorkflowVersions(workflowType: string): any[] {
    if (!this.workflowVersioner) {
      throw new Error("Le système de versionnement des workflows n'est pas activé");
    }
    
    return this.workflowVersioner.getAllVersions(workflowType);
  }
  
  /**
   * Met à jour le fichier de statut global
   */
  private async updateGlobalStatus(statusUpdate: any) {
    if (!this.config.statusFilePath) return;
    
    try {
      // Lire le fichier status.json actuel
      let statusData = { events: [] };
      
      if (fs.existsSync(this.config.statusFilePath)) {
        const fileContent = fs.readFileSync(this.config.statusFilePath, 'utf8');
        statusData = JSON.parse(fileContent);
      }
      
      // Ajouter l'événement au début pour avoir les plus récents en premier
      statusData.events.unshift({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...statusUpdate
      });
      
      // Limiter à 1000 événements max
      if (statusData.events.length > 1000) {
        statusData.events = statusData.events.slice(0, 1000);
      }
      
      // Mettre à jour les statistiques globales
      this.updateStatusStatistics(statusData);
      
      // Écrire dans le fichier
      fs.writeFileSync(this.config.statusFilePath, JSON.stringify(statusData, null, 2));
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du fichier de statut', error);
    }
  }
  
  /**
   * Met à jour les statistiques dans l'objet de statut
   */
  private updateStatusStatistics(statusData: any) {
    if (!statusData.statistics) {
      statusData.statistics = {
        workflowsStarted: 0,
        workflowsCompleted: 0,
        workflowsFailed: 0,
        jobsProcessed: 0,
        jobsCompleted: 0,
        jobsFailed: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Mettre à jour les compteurs selon le dernier événement
    const lastEvent = statusData.events[0];
    
    if (lastEvent.type === 'workflow.started') {
      statusData.statistics.workflowsStarted++;
    } else if (lastEvent.type === 'workflow.completed') {
      statusData.statistics.workflowsCompleted++;
    } else if (lastEvent.type === 'workflow.failed') {
      statusData.statistics.workflowsFailed++;
    } else if (lastEvent.type === 'job.completed') {
      statusData.statistics.jobsCompleted++;
      statusData.statistics.jobsProcessed++;
    } else if (lastEvent.type === 'job.failed') {
      statusData.statistics.jobsFailed++;
      statusData.statistics.jobsProcessed++;
    }
    
    statusData.statistics.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Expose les métriques au format Prometheus
   */
  exposeMetricsEndpoint(app: any, path: string = '/metrics'): void {
    if (!this.metricsService) {
      this.logger.warn('Service de métriques non activé, impossible d\'exposer les métriques');
      return;
    }
    
    app.get(path, (req: any, res: any) => {
      res.set('Content-Type', 'text/plain');
      res.send(this.metricsService.getPrometheusFormat());
    });
    
    this.logger.log(`✅ Endpoint de métriques exposé sur ${path}`);
  }
  
  /**
   * Catégorise un message d'erreur en type d'erreur général
   * @param errorMessage Message d'erreur à catégoriser
   */
  private categorizeError(errorMessage: string): string {
    if (!errorMessage) return 'unknown';
    
    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('connection')) return 'connection';
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) return 'permission';
    if (errorMessage.includes('not found')) return 'not_found';
    if (errorMessage.includes('validation')) return 'validation';
    
    return 'other';
  }
  
  /**
   * Termine proprement les connexions
   */
  async shutdown() {
    this.logger.log('🛑 Arrêt du pont d\'orchestration...');
    
    // Fermer le service de métriques
    if (this.metricsService) {
      this.metricsService.shutdown();
      this.logger.log('✓ Service de métriques arrêté');
    }
    
    // Fermer le serveur de tableau de bord s'il existe
    if (this.dashboardServer) {
      await new Promise((resolve) => {
        this.dashboardServer.close(resolve);
      });
      this.logger.log('✓ Serveur du tableau de bord fermé');
    }
    
    // Fermer les connexions BullMQ
    for (const [name, queue] of Object.entries(this.bullMQQueues)) {
      await queue.close();
      this.logger.log(`✓ File d'attente ${name} fermée`);
    }
    
    for (const [name, events] of Object.entries(this.bullMQEvents)) {
      await events.close();
      this.logger.log(`✓ Événements ${name} fermés`);
    }
    
    // Fermer Redis
    await this.redisClient.quit();
    this.logger.log('✓ Connexion Redis fermée');
    
    this.logger.log('✓ Pont d\'orchestration arrêté avec succès');
  }

  /**
   * Configure les alertes automatiques basées sur les métriques
   * @param thresholds Seuils pour les alertes
   */
  setupAutomaticAlerts(thresholds: {
    maxJobWaitTime?: number;  // En millisecondes
    maxJobsInQueue?: number;
    maxFailureRate?: number;  // En pourcentage (0-100)
    minWorkerCount?: number;
  } = {}): void {
    if (!this.notificationService) {
      this.logger.warn('Service de notification non activé, impossible de configurer les alertes automatiques');
      return;
    }
    
    // Valeurs par défaut pour les seuils
    const defaults = {
      maxJobWaitTime: 300000,   // 5 minutes
      maxJobsInQueue: 100,
      maxFailureRate: 10,       // 10%
      minWorkerCount: 1
    };
    
    const alertConfig = { ...defaults, ...thresholds };
    
    // Vérifier périodiquement les métriques pour générer des alertes
    setInterval(async () => {
      try {
        // Vérifier pour chaque queue
        for (const queueName of this.config.queueNames) {
          const queue = this.bullMQQueues[queueName];
          if (!queue) continue;
          
          // 1. Vérifier le nombre de jobs en attente
          const waitingCount = await queue.getWaitingCount();
          if (waitingCount > alertConfig.maxJobsInQueue) {
            await this.notificationService.warning(
              `File d'attente ${queueName} surchargée`,
              `Il y a ${waitingCount} jobs en attente dans la file ${queueName}, ce qui dépasse le seuil de ${alertConfig.maxJobsInQueue}.`,
              {
                metadata: {
                  queueName,
                  waitingCount,
                  threshold: alertConfig.maxJobsInQueue
                }
              }
            );
          }
          
          // 2. Vérifier le temps d'attente des jobs
          const waiting = await queue.getJobs(['waiting'], 0, 1, true);
          if (waiting.length > 0) {
            const oldestJob = waiting[0];
            const waitTime = Date.now() - oldestJob.timestamp;
            if (waitTime > alertConfig.maxJobWaitTime) {
              await this.notificationService.warning(
                `Temps d'attente excessif dans ${queueName}`,
                `Le job le plus ancien attend depuis ${waitTime / 1000} secondes, ce qui dépasse le seuil de ${alertConfig.maxJobWaitTime / 1000} secondes.`,
                {
                  metadata: {
                    queueName,
                    jobId: oldestJob.id,
                    waitTime: `${waitTime / 1000} secondes`,
                    threshold: `${alertConfig.maxJobWaitTime / 1000} secondes`
                  }
                }
              );
            }
          }
          
          // 3. Vérifier le taux d'échec
          const failedCount = await queue.getFailedCount();
          const completedCount = await queue.getCompletedCount();
          const totalProcessed = failedCount + completedCount;
          
          if (totalProcessed > 0) {
            const failureRate = (failedCount / totalProcessed) * 100;
            if (failureRate > alertConfig.maxFailureRate) {
              await this.notificationService.error(
                `Taux d'échec élevé dans ${queueName}`,
                `Le taux d'échec dans la file ${queueName} est de ${failureRate.toFixed(2)}%, ce qui dépasse le seuil de ${alertConfig.maxFailureRate}%.`,
                {
                  metadata: {
                    queueName,
                    failureRate: `${failureRate.toFixed(2)}%`,
                    failedCount,
                    completedCount,
                    threshold: `${alertConfig.maxFailureRate}%`
                  }
                }
              );
            }
          }
        }
        
        // 4. Vérifier les workflows Temporal (si le client est disponible)
        if (this.temporalClient) {
          try {
            // Vérifier les workflows avec timeout
            const timedOutWorkflows = await this.temporalClient.workflow.list({
              query: 'ExecutionStatus=\'TimedOut\'',
              pageSize: 10
            });
            
            let timedOutCount = 0;
            for await (const wf of timedOutWorkflows) {
              timedOutCount++;
              if (timedOutCount <= 5) { // Limiter les notifications pour éviter le spam
                await this.notificationService.error(
                  `Workflow ${wf.execution.workflowId} a expiré`,
                  `Le workflow ${wf.type.name} avec ID ${wf.execution.workflowId} a expiré.`,
                  {
                    metadata: {
                      workflowId: wf.execution.workflowId,
                      workflowType: wf.type.name,
                      runId: wf.execution.runId
                    }
                  }
                );
              }
            }
            
            if (timedOutCount > 5) {
              await this.notificationService.warning(
                `Plusieurs workflows ont expiré`,
                `${timedOutCount} workflows ont expiré. Vérifiez l'interface Temporal pour plus de détails.`
              );
            }
          } catch (err) {
            this.logger.error('Erreur lors de la vérification des workflows expirés', err);
          }
        }
      } catch (error) {
        this.logger.error('Erreur lors de la vérification des métriques pour les alertes', error);
      }
    }, 60000); // Vérifier toutes les minutes
    
    this.logger.log('✅ Alertes automatiques configurées');
  }
}

// Crée et exporte une fonction pour initialiser facilement le pont
export async function createOrchestratorBridge(config: OrchestratorBridgeConfig) {
  const bridge = new OrchestratorBridge(config);
  return await bridge.initialize();
}

export default OrchestratorBridge;