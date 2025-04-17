import { EventEmitter } from 'events';
import { CheckpointManager } from '../persistence/checkpoint-manager';
import { WorkflowCheckpoint, CheckpointStatus, JobStatus, WorkflowError } from '../persistence/types';
import { AdvancedRetryStrategy, AdvancedRetryConfig, ErrorType } from './advanced-retry-strategy';
import { createLogger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Événements émis par le coordinateur de migration
 */
export enum CoordinatorEvent {
  TASK_STARTED = 'task:started',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  TASK_RETRYING = 'task:retrying',
  CHECKPOINT_CREATED = 'checkpoint:created',
  WORKFLOW_COMPLETED = 'workflow:completed',
  WORKFLOW_FAILED = 'workflow:failed',
  ERROR = 'error'
}

/**
 * État d'exécution d'une tâche de migration
 */
export enum TaskExecutionState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

/**
 * Configuration d'un workflow de migration
 */
export interface MigrationWorkflowConfig {
  id: string;
  name: string;
  description?: string;
  totalSteps: number;
  checkpointFrequency?: number; // Fréquence des checkpoints en millisecondes
  retryConfig?: AdvancedRetryConfig;
  timeout?: number; // Timeout global en millisecondes
  priority?: number; // Priorité d'exécution (1-10)
}

/**
 * Tâche de migration avec gestion de l'état
 */
export interface MigrationTask<T = any, R = any> {
  id: string;
  name: string;
  step: number;
  execute: (input: T, context: TaskExecutionContext) => Promise<R>;
  input: T;
  output?: R;
  state: TaskExecutionState;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  retryCount?: number;
  dependsOn?: string[]; // IDs des tâches dont cette tâche dépend
  metadata?: Record<string, any>;
}

/**
 * Contexte d'exécution fourni aux tâches de migration
 */
export interface TaskExecutionContext {
  workflowId: string;
  taskId: string;
  step: number;
  totalSteps: number;
  createCheckpoint: (data: any) => Promise<void>;
  getLastCheckpoint: () => Promise<any>;
  logger: ReturnType<typeof createLogger>;
  abortSignal: AbortSignal;
}

/**
 * File d'attente prioritaire pour les workflows de migration
 */
export class WorkflowPriorityQueue {
  private queue: Array<{
    workflowId: string;
    priority: number;
    createdAt: Date;
  }> = [];
  private runningWorkflows: Set<string> = new Set();
  private maxConcurrentWorkflows: number;
  
  constructor(maxConcurrentWorkflows = 3) {
    this.maxConcurrentWorkflows = maxConcurrentWorkflows;
  }
  
  /**
   * Ajoute un workflow à la file d'attente
   */
  enqueue(workflowId: string, priority: number): void {
    this.queue.push({
      workflowId,
      priority,
      createdAt: new Date()
    });
    
    // Trier la file d'attente par priorité (plus élevée d'abord) puis par date de création (FIFO)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Priorité décroissante
      }
      return a.createdAt.getTime() - b.createdAt.getTime(); // FIFO pour même priorité
    });
  }
  
  /**
   * Récupère le prochain workflow à exécuter si possible
   */
  dequeue(): string | null {
    if (this.runningWorkflows.size >= this.maxConcurrentWorkflows) {
      return null; // Limite de concurrence atteinte
    }
    
    if (this.queue.length === 0) {
      return null; // File d'attente vide
    }
    
    const next = this.queue.shift()!;
    this.runningWorkflows.add(next.workflowId);
    return next.workflowId;
  }
  
  /**
   * Marque un workflow comme terminé et le retire des workflows en cours
   */
  markCompleted(workflowId: string): void {
    this.runningWorkflows.delete(workflowId);
  }
  
  /**
   * Vérifie si un nouveau workflow peut être démarré
   */
  canStartNewWorkflow(): boolean {
    return this.runningWorkflows.size < this.maxConcurrentWorkflows;
  }
  
  /**
   * Retourne le nombre de workflows en attente
   */
  get pendingCount(): number {
    return this.queue.length;
  }
  
  /**
   * Retourne le nombre de workflows en cours d'exécution
   */
  get runningCount(): number {
    return this.runningWorkflows.size;
  }
}

/**
 * Coordinateur de migration résilient
 * Gère l'exécution des workflows de migration avec checkpoints et reprise après échec
 */
export class MigrationCoordinator extends EventEmitter {
  private checkpointManager: CheckpointManager;
  private logger = createLogger('MigrationCoordinator');
  private retryStrategies: Map<string, AdvancedRetryStrategy> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private runningWorkflows: Map<string, {
    config: MigrationWorkflowConfig,
    tasks: MigrationTask[],
    currentStep: number,
    checkpoint: WorkflowCheckpoint | null
  }> = new Map();
  private priorityQueue: WorkflowPriorityQueue;
  
  constructor(maxConcurrentWorkflows = 3) {
    super();
    this.checkpointManager = new CheckpointManager();
    this.priorityQueue = new WorkflowPriorityQueue(maxConcurrentWorkflows);
    
    // Écouter les événements pour gérer la file d'attente
    this.on(CoordinatorEvent.WORKFLOW_COMPLETED, ({ workflowId }) => {
      this.priorityQueue.markCompleted(workflowId);
      this.processQueue();
    });
    
    this.on(CoordinatorEvent.WORKFLOW_FAILED, ({ workflowId }) => {
      this.priorityQueue.markCompleted(workflowId);
      this.processQueue();
    });
  }

  /**
   * Initialise le coordinateur
   */
  async initialize(): Promise<void> {
    await this.checkpointManager.initialize();
    this.logger.info('Coordinateur de migration initialisé');
  }

  /**
   * Crée et démarre un nouveau workflow de migration
   * @param config Configuration du workflow
   * @param tasks Tâches à exécuter
   */
  async startWorkflow<T = any, R = any>(
    config: MigrationWorkflowConfig, 
    tasks: MigrationTask<T, R>[]
  ): Promise<string> {
    const workflowId = config.id || uuidv4();
    this.logger.info(`Préparation du workflow de migration ${config.name} (${workflowId})`);
    
    // Trier les tâches par étape
    tasks.sort((a, b) => a.step - b.step);
    
    // Créer une stratégie de retry pour ce workflow
    const retryConfig: AdvancedRetryConfig = config.retryConfig || {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      backoffCoefficient: 2,
      jitterMaxMs: 1000,
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 300000 // 5 minutes
      }
    };
    
    const retryStrategy = new AdvancedRetryStrategy(retryConfig);
    this.retryStrategies.set(workflowId, retryStrategy);
    
    // Créer un point de contrôle initial
    const initialCheckpoint = await this.checkpointManager.createCheckpoint(workflowId, {
      workflowName: config.name,
      description: config.description,
      totalSteps: config.totalSteps,
      startTime: new Date().toISOString(),
      priority: config.priority || 5
    });
    
    // Créer un controller d'abandon pour ce workflow
    const abortController = new AbortController();
    this.abortControllers.set(workflowId, abortController);
    
    // Stocker l'état du workflow
    this.runningWorkflows.set(workflowId, {
      config,
      tasks,
      currentStep: 0,
      checkpoint: initialCheckpoint
    });
    
    // Ajouter le workflow à la file d'attente prioritaire
    this.priorityQueue.enqueue(workflowId, config.priority || 5);
    
    // Traiter la file d'attente si possible
    this.processQueue();
    
    return workflowId;
  }

  /**
   * Exécute un workflow de migration avec gestion des reprises
   * @param workflowId ID du workflow
   */
  private async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.runningWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} non trouvé`);
    }
    
    const { config, tasks } = workflow;
    let currentStep = workflow.currentStep;
    let resumeData: any = null;
    
    try {
      // Vérifier s'il y a un checkpoint à reprendre
      const lastCheckpoint = await this.checkpointManager.getCheckpoint(workflowId);
      if (lastCheckpoint && lastCheckpoint.status === CheckpointStatus.RESUMING) {
        // Reprendre depuis le dernier checkpoint
        currentStep = lastCheckpoint.step;
        resumeData = lastCheckpoint.data;
        this.logger.info(`Reprise du workflow ${workflowId} depuis l'étape ${currentStep}`);
      }
      
      // Mettre à jour l'état du workflow
      this.runningWorkflows.set(workflowId, {
        ...workflow,
        currentStep,
        checkpoint: lastCheckpoint
      });
      
      // Créer un signal d'abandon
      const abortSignal = this.abortControllers.get(workflowId)?.signal;
      if (!abortSignal) {
        throw new Error(`Signal d'abandon non disponible pour le workflow ${workflowId}`);
      }
      
      // Exécuter les tâches séquentiellement
      let lastOutput: any = resumeData;
      for (let i = currentStep; i < tasks.length; i++) {
        if (abortSignal.aborted) {
          throw new Error('Workflow aborted');
        }
        
        const task = tasks[i];
        task.state = TaskExecutionState.RUNNING;
        task.startTime = new Date();
        
        try {
          // Créer le contexte d'exécution pour la tâche
          const context: TaskExecutionContext = {
            workflowId,
            taskId: task.id,
            step: task.step,
            totalSteps: config.totalSteps,
            createCheckpoint: async (data: any) => {
              await this.createCheckpoint(workflowId, task.step, data);
            },
            getLastCheckpoint: async () => {
              const checkpoint = await this.checkpointManager.getCheckpoint(workflowId);
              return checkpoint?.data || null;
            },
            logger: createLogger(`Task-${task.name}`),
            abortSignal
          };
          
          this.emit(CoordinatorEvent.TASK_STARTED, { workflowId, taskId: task.id, step: task.step });
          
          // Exécuter la tâche avec son entrée ou la sortie de la tâche précédente
          const input = task.input || lastOutput;
          const output = await task.execute(input, context);
          
          // Mettre à jour l'état de la tâche
          task.output = output;
          task.state = TaskExecutionState.COMPLETED;
          task.endTime = new Date();
          
          // Sauvegarder un checkpoint après chaque tâche
          await this.createCheckpoint(workflowId, task.step, { 
            taskOutput: output,
            taskId: task.id,
            taskName: task.name
          });
          
          this.emit(CoordinatorEvent.TASK_COMPLETED, { 
            workflowId, 
            taskId: task.id, 
            step: task.step,
            output 
          });
          
          // La sortie de cette tâche devient l'entrée de la suivante
          lastOutput = output;
          
          // Mettre à jour la progression
          await this.checkpointManager.updateProgress(
            workflowId,
            task.step,
            config.totalSteps,
            { lastTaskOutput: output }
          );
          
          // Mettre à jour l'état du workflow
          this.runningWorkflows.set(workflowId, {
            ...workflow,
            currentStep: task.step + 1,
          });
        } catch (error) {
          task.state = TaskExecutionState.FAILED;
          task.endTime = new Date();
          task.error = error instanceof Error ? error : new Error(String(error));
          task.retryCount = (task.retryCount || 0) + 1;
          
          const retryStrategy = this.retryStrategies.get(workflowId);
          if (!retryStrategy) {
            throw error;
          }
          
          // Récupérer le dernier checkpoint
          let checkpoint = await this.checkpointManager.getCheckpoint(workflowId);
          if (!checkpoint) {
            throw error;
          }
          
          // Marquer le checkpoint avec l'erreur
          checkpoint = await this.checkpointManager.markAsError(
            workflowId, 
            task.error,
            task.error.name
          );
          
          // Mettre à jour la stratégie de retry en fonction de l'erreur
          checkpoint = retryStrategy.updateRetryStrategy(checkpoint, task.error);
          await this.checkpointManager.saveCheckpoint(workflowId, checkpoint);
          
          // Vérifier si on peut réessayer
          if (retryStrategy.canRetry(checkpoint)) {
            task.state = TaskExecutionState.RETRYING;
            
            const nextRetryTime = new Date(checkpoint.metadata.retryStrategy.nextRetryTime);
            const delayMs = Math.max(0, nextRetryTime.getTime() - Date.now());
            
            this.emit(CoordinatorEvent.TASK_RETRYING, { 
              workflowId, 
              taskId: task.id, 
              step: task.step,
              error: task.error,
              retryCount: task.retryCount,
              delayMs
            });
            
            this.logger.info(
              `Réessai de la tâche ${task.name} (${task.id}) dans ${delayMs}ms ` +
              `(tentative ${task.retryCount}/${checkpoint.metadata.retryStrategy.maxAttempts})`
            );
            
            // Attendre le délai de retry
            await new Promise(resolve => setTimeout(resolve, delayMs));
            
            // Réduire l'index pour réexécuter cette tâche
            i--;
            continue;
          } else {
            // Plus de retry possible
            this.emit(CoordinatorEvent.TASK_FAILED, {
              workflowId,
              taskId: task.id,
              step: task.step,
              error: task.error,
              attempts: task.retryCount
            });
            
            // Propager l'erreur pour arrêter le workflow
            throw error;
          }
        }
      }
      
      // Toutes les tâches ont réussi, marquer le workflow comme terminé
      await this.checkpointManager.markAsCompleted(workflowId, {
        endTime: new Date().toISOString(),
        finalOutput: lastOutput,
      });
      
      this.emit(CoordinatorEvent.WORKFLOW_COMPLETED, {
        workflowId,
        output: lastOutput
      });
      
      this.logger.info(`Workflow ${workflowId} terminé avec succès`);
      
      // Nettoyer les ressources
      this.cleanup(workflowId);
    } catch (error) {
      this.logger.error(`Échec du workflow ${workflowId}:`, error);
      
      // Marquer le workflow comme échoué
      try {
        await this.checkpointManager.markAsError(
          workflowId,
          error instanceof Error ? error : new Error(String(error))
        );
      } catch (e) {
        this.logger.error(`Erreur lors du marquage de l'échec du workflow ${workflowId}:`, e);
      }
      
      this.emit(CoordinatorEvent.WORKFLOW_FAILED, {
        workflowId,
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      // Nettoyer les ressources
      this.cleanup(workflowId);
      
      // Propager l'erreur
      throw error;
    }
  }

  /**
   * Traite la file d'attente des workflows
   */
  private processQueue(): void {
    const nextWorkflowId = this.priorityQueue.dequeue();
    if (nextWorkflowId) {
      this.logger.info(`Démarrage du workflow ${nextWorkflowId} depuis la file d'attente`);
      this.executeWorkflow(nextWorkflowId).catch(error => {
        this.logger.error(`Erreur non gérée dans le workflow ${nextWorkflowId}:`, error);
        this.emit(CoordinatorEvent.ERROR, { workflowId: nextWorkflowId, error });
        this.priorityQueue.markCompleted(nextWorkflowId);
        this.processQueue(); // Essayer le prochain dans la file
      });
    }
  }

  /**
   * Crée un checkpoint pour un workflow
   * @param workflowId ID du workflow
   * @param step Étape actuelle
   * @param data Données à stocker
   */
  private async createCheckpoint(workflowId: string, step: number, data: any): Promise<WorkflowCheckpoint> {
    const workflow = this.runningWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} non trouvé`);
    }
    
    const checkpoint = await this.checkpointManager.updateProgress(
      workflowId,
      step,
      workflow.config.totalSteps,
      data
    );
    
    this.emit(CoordinatorEvent.CHECKPOINT_CREATED, {
      workflowId,
      step,
      checkpoint
    });
    
    return checkpoint;
  }

  /**
   * Arrête et annule un workflow en cours
   * @param workflowId ID du workflow à arrêter
   */
  async stopWorkflow(workflowId: string): Promise<void> {
    const abortController = this.abortControllers.get(workflowId);
    if (abortController) {
      abortController.abort();
      this.logger.info(`Workflow ${workflowId} abandonné`);
    } else {
      this.logger.warn(`Impossible d'arrêter le workflow ${workflowId}: non trouvé`);
    }
  }

  /**
   * Tente de reprendre un workflow échoué
   * @param workflowId ID du workflow à reprendre
   */
  async resumeWorkflow(workflowId: string): Promise<boolean> {
    try {
      const checkpoint = await this.checkpointManager.resumeWorkflow(workflowId);
      
      if (!checkpoint) {
        this.logger.warn(`Impossible de reprendre le workflow ${workflowId}: checkpoint non trouvé`);
        return false;
      }
      
      // Vérifier si le workflow est déjà en cours d'exécution
      if (this.runningWorkflows.has(workflowId)) {
        this.logger.warn(`Le workflow ${workflowId} est déjà en cours d'exécution`);
        return false;
      }
      
      // Récréer le controller d'abandon
      const abortController = new AbortController();
      this.abortControllers.set(workflowId, abortController);
      
      // Recréer la stratégie de retry
      const retryConfig: AdvancedRetryConfig = {
        maxAttempts: checkpoint.metadata?.retryStrategy?.maxAttempts || 5,
        initialDelayMs: checkpoint.metadata?.retryStrategy?.initialDelayMs || 1000,
        maxDelayMs: checkpoint.metadata?.retryStrategy?.maxDelayMs || 60000,
        backoffCoefficient: checkpoint.metadata?.retryStrategy?.backoffCoefficient || 2,
        jitterMaxMs: 1000
      };
      const retryStrategy = new AdvancedRetryStrategy(retryConfig);
      this.retryStrategies.set(workflowId, retryStrategy);
      
      // Récupérer les tâches du workflow (nécessiterait une implémentation de stockage persistant)
      // Pour l'exemple, nous allons simuler des tâches récupérées
      const tasks: MigrationTask[] = []; // À compléter avec les tâches récupérées
      
      // Simuler la configuration du workflow
      const config: MigrationWorkflowConfig = {
        id: workflowId,
        name: checkpoint.metadata?.workflowName || 'Workflow repris',
        totalSteps: checkpoint.totalSteps,
        checkpointFrequency: 30000, // 30 secondes
        retryConfig
      };
      
      // Stocker l'état du workflow
      this.runningWorkflows.set(workflowId, {
        config,
        tasks,
        currentStep: checkpoint.step,
        checkpoint
      });
      
      // Démarrer l'exécution du workflow en arrière-plan
      this.executeWorkflow(workflowId).catch(error => {
        this.logger.error(`Erreur non gérée dans le workflow ${workflowId}:`, error);
        this.emit(CoordinatorEvent.ERROR, { workflowId, error });
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de la reprise du workflow ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Récupère la liste des workflows actifs
   */
  getActiveWorkflows(): string[] {
    return Array.from(this.runningWorkflows.keys());
  }

  /**
   * Récupère l'état d'un workflow
   * @param workflowId ID du workflow
   */
  async getWorkflowStatus(workflowId: string): Promise<JobStatus | null> {
    const workflow = this.runningWorkflows.get(workflowId);
    if (workflow) {
      // Le workflow est actif
      return {
        state: 'RUNNING',
        progress: {
          current: workflow.currentStep,
          total: workflow.config.totalSteps,
          percentage: Math.round((workflow.currentStep / workflow.config.totalSteps) * 100)
        },
        timestamps: {
          started: new Date(workflow.checkpoint?.createdAt || Date.now()),
        }
      };
    }
    
    // Vérifier dans les checkpoints
    const checkpoint = await this.checkpointManager.getCheckpoint(workflowId);
    if (!checkpoint) {
      return null;
    }
    
    // Déterminer l'état en fonction du checkpoint
    let state: JobStatus['state'];
    switch (checkpoint.status) {
      case CheckpointStatus.COMPLETED:
        state = 'COMPLETED';
        break;
      case CheckpointStatus.FAILED:
        state = 'FAILED';
        break;
      case CheckpointStatus.RESUMING:
      case CheckpointStatus.IN_PROGRESS:
        state = 'RUNNING';
        break;
      default:
        state = 'PENDING';
    }
    
    const jobStatus: JobStatus = {
      state,
      progress: {
        current: checkpoint.step,
        total: checkpoint.totalSteps,
        percentage: checkpoint.progress
      },
      timestamps: {
        started: checkpoint.createdAt,
        updated: checkpoint.updatedAt
      }
    };
    
    if (state === 'COMPLETED') {
      jobStatus.timestamps.completed = new Date(checkpoint.data?.completedAt);
      jobStatus.result = checkpoint.data?.finalOutput;
    }
    
    if (state === 'FAILED') {
      const latestError = checkpoint.errors?.[checkpoint.errors.length - 1];
      if (latestError) {
        jobStatus.error = {
          message: latestError.message,
          code: latestError.name,
          details: {
            type: latestError.type,
            timestamp: latestError.timestamp
          }
        };
      }
    }
    
    return jobStatus;
  }

  /**
   * Récupère les workflows bloqués qui nécessitent une intervention
   * @param thresholdMinutes Seuil d'inactivité en minutes
   */
  async findStuckWorkflows(thresholdMinutes: number = 30): Promise<string[]> {
    const stuckCheckpoints = await this.checkpointManager.findStuckWorkflows(thresholdMinutes);
    return stuckCheckpoints.map(cp => cp.workflowId);
  }

  /**
   * Nettoie les ressources associées à un workflow
   * @param workflowId ID du workflow
   */
  private cleanup(workflowId: string): void {
    this.runningWorkflows.delete(workflowId);
    this.abortControllers.delete(workflowId);
    
    const retryStrategy = this.retryStrategies.get(workflowId);
    if (retryStrategy) {
      retryStrategy.close();
      this.retryStrategies.delete(workflowId);
    }
  }

  /**
   * Ferme le coordinateur et libère les ressources
   */
  async close(): Promise<void> {
    // Arrêter tous les workflows en cours
    for (const workflowId of this.abortControllers.keys()) {
      this.stopWorkflow(workflowId);
    }
    
    // Nettoyer les ressources
    this.runningWorkflows.clear();
    this.abortControllers.clear();
    
    // Fermer les stratégies de retry
    for (const strategy of this.retryStrategies.values()) {
      strategy.close();
    }
    this.retryStrategies.clear();
    
    this.logger.info('Coordinateur de migration fermé');
  }
}