import { WorkflowCheckpoint, CheckpointStatus } from '../persistence/types';
import { CheckpointManager } from '../persistence/checkpoint-manager';
import { SystemMonitor } from './system-monitor';
import { createLogger } from '../../utils/logger';

/**
 * Configuration pour l'ordonnanceur
 */
export interface SchedulerConfig {
  maxConcurrentWorkflows: number;       // Nombre maximum de workflows en parallèle
  maxConcurrentPerPriority: number;     // Nombre maximum de workflows par niveau de priorité
  priorityLevels: number;               // Nombre de niveaux de priorité (généralement 1-10)
  resourceThresholds: {                 // Seuils pour l'ajustement dynamique
    cpu: number;                        // Pourcentage d'utilisation CPU max (0-100)
    memory: number;                     // Pourcentage d'utilisation mémoire max (0-100)
    loadAverage: number;                // Charge système maximale
  };
  dynamicAdjustment: boolean;           // Activer l'ajustement dynamique
}

/**
 * Interface pour les tâches à planifier
 */
export interface SchedulableTask {
  id: string;
  workflowId: string;
  priority: number;
  resourceRequirements?: {
    cpu?: number;      // En unités relatives (1 = 1 cœur)
    memory?: number;   // En Mo
  };
  dependencies?: string[];
  execute: () => Promise<any>;
}

/**
 * État d'exécution d'une tâche
 */
export interface TaskExecutionState {
  taskId: string;
  workflowId: string;
  status: 'waiting' | 'running' | 'completed' | 'failed';
  priority: number;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
}

/**
 * Ordonnanceur intelligent avec gestion des priorités
 * Adapte dynamiquement le parallélisme en fonction des ressources système
 */
export class PriorityScheduler {
  private checkpointManager: CheckpointManager;
  private systemMonitor: SystemMonitor;
  private logger = createLogger('PriorityScheduler');
  private config: SchedulerConfig;
  private runningTasks: Map<string, TaskExecutionState> = new Map();
  private waitingTasks: SchedulableTask[] = [];
  private completedTasks: Map<string, TaskExecutionState> = new Map();
  private workflowPriorities: Map<string, number> = new Map();
  private adjustmentInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.checkpointManager = new CheckpointManager();
    this.systemMonitor = new SystemMonitor();
    
    // Configuration par défaut
    this.config = {
      maxConcurrentWorkflows: 5,
      maxConcurrentPerPriority: 2,
      priorityLevels: 10,
      resourceThresholds: {
        cpu: 80,
        memory: 85,
        loadAverage: 3
      },
      dynamicAdjustment: true,
      ...config
    };
    
    this.logger.info('Priority scheduler initialized with config:', this.config);
  }

  /**
   * Démarre l'ordonnanceur
   */
  async start(): Promise<void> {
    await this.checkpointManager.initialize();
    await this.systemMonitor.start();
    
    // Configurer l'ajustement dynamique
    if (this.config.dynamicAdjustment) {
      this.startDynamicAdjustment();
    }
    
    this.logger.info('Priority scheduler started');
  }

  /**
   * Soumet une tâche pour exécution
   * @param task Tâche à exécuter
   */
  async scheduleTask(task: SchedulableTask): Promise<string> {
    // Sauvegarder la priorité du workflow
    this.workflowPriorities.set(task.workflowId, task.priority);
    
    // Ajouter la tâche à la file d'attente
    this.waitingTasks.push(task);
    
    // Trier les tâches par priorité (décroissante)
    this.waitingTasks.sort((a, b) => b.priority - a.priority);
    
    this.logger.info(`Task ${task.id} from workflow ${task.workflowId} scheduled with priority ${task.priority}`);
    
    // Démarrer le traitement des tâches
    this.processTasks();
    
    return task.id;
  }

  /**
   * Traite les tâches en attente en fonction des priorités et ressources disponibles
   */
  private async processTasks(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Vérifier si on peut exécuter plus de tâches
      while (this.canScheduleMoreTasks()) {
        // Récupérer la prochaine tâche éligible
        const nextTask = this.getNextEligibleTask();
        
        if (!nextTask) {
          break;
        }
        
        // Créer l'état d'exécution
        const executionState: TaskExecutionState = {
          taskId: nextTask.id,
          workflowId: nextTask.workflowId,
          status: 'running',
          priority: nextTask.priority,
          startTime: new Date()
        };
        
        // Ajouter aux tâches en cours d'exécution
        this.runningTasks.set(nextTask.id, executionState);
        
        // Supprimer de la liste d'attente
        this.waitingTasks = this.waitingTasks.filter(t => t.id !== nextTask.id);
        
        this.logger.info(`Starting task ${nextTask.id} (workflow ${nextTask.workflowId})`);
        
        // Exécuter la tâche de façon asynchrone
        this.executeTask(nextTask, executionState);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Exécute une tâche et gère son état
   * @param task Tâche à exécuter
   * @param state État d'exécution associé
   */
  private async executeTask(task: SchedulableTask, state: TaskExecutionState): Promise<void> {
    try {
      await task.execute();
      
      // Marquer comme terminée
      state.status = 'completed';
      state.endTime = new Date();
      
      this.logger.info(`Task ${task.id} completed successfully`);
    } catch (error) {
      state.status = 'failed';
      state.endTime = new Date();
      state.error = error as Error;
      
      this.logger.error(`Task ${task.id} failed:`, error);
    } finally {
      // Déplacer vers les tâches complétées
      this.runningTasks.delete(task.id);
      this.completedTasks.set(task.id, state);
      
      // Traiter les tâches suivantes
      this.processTasks();
    }
  }

  /**
   * Vérifie si d'autres tâches peuvent être planifiées
   */
  private canScheduleMoreTasks(): boolean {
    // Vérifier le nombre total de tâches en cours
    if (this.runningTasks.size >= this.config.maxConcurrentWorkflows) {
      return false;
    }
    
    // Vérifier les ressources système
    const systemMetrics = this.systemMonitor.getCurrentMetrics();
    
    if (systemMetrics.cpuUsagePercent > this.config.resourceThresholds.cpu ||
        systemMetrics.memoryUsagePercent > this.config.resourceThresholds.memory ||
        systemMetrics.loadAverage > this.config.resourceThresholds.loadAverage) {
      this.logger.warn('System resources exceeded thresholds, pausing task scheduling');
      return false;
    }
    
    return true;
  }

  /**
   * Récupère la prochaine tâche éligible à l'exécution
   */
  private getNextEligibleTask(): SchedulableTask | null {
    if (this.waitingTasks.length === 0) {
      return null;
    }
    
    // Compter les tâches en cours par niveau de priorité
    const tasksByPriority: Map<number, number> = new Map();
    
    for (const [, task] of this.runningTasks) {
      const count = tasksByPriority.get(task.priority) || 0;
      tasksByPriority.set(task.priority, count + 1);
    }
    
    // Trouver la prochaine tâche qui respecte les contraintes de parallélisme par priorité
    for (const task of this.waitingTasks) {
      const runningWithSamePriority = tasksByPriority.get(task.priority) || 0;
      
      if (runningWithSamePriority < this.config.maxConcurrentPerPriority) {
        // Vérifier les dépendances
        if (task.dependencies && task.dependencies.length > 0) {
          const allDependenciesCompleted = task.dependencies.every(depId => 
            this.completedTasks.has(depId) && 
            this.completedTasks.get(depId)?.status === 'completed'
          );
          
          if (!allDependenciesCompleted) {
            continue;
          }
        }
        
        return task;
      }
    }
    
    return null;
  }

  /**
   * Démarre l'ajustement dynamique des ressources
   */
  private startDynamicAdjustment(): void {
    const ADJUSTMENT_INTERVAL_MS = 30000; // 30 secondes
    
    this.adjustmentInterval = setInterval(() => {
      this.adjustResourceAllocation();
    }, ADJUSTMENT_INTERVAL_MS);
  }

  /**
   * Ajuste dynamiquement l'allocation des ressources en fonction de la charge du système
   */
  private async adjustResourceAllocation(): Promise<void> {
    const metrics = this.systemMonitor.getCurrentMetrics();
    
    // Calculer le ratio d'utilisation des ressources
    const cpuRatio = metrics.cpuUsagePercent / this.config.resourceThresholds.cpu;
    const memoryRatio = metrics.memoryUsagePercent / this.config.resourceThresholds.memory;
    const loadRatio = metrics.loadAverage / this.config.resourceThresholds.loadAverage;
    
    // Utiliser le ratio le plus élevé pour l'ajustement
    const utilizationRatio = Math.max(cpuRatio, memoryRatio, loadRatio);
    
    if (utilizationRatio > 0.9) {
      // Réduire le parallélisme car on approche des limites
      this.config.maxConcurrentWorkflows = Math.max(1, this.config.maxConcurrentWorkflows - 1);
      this.logger.warn(`System load high (${utilizationRatio.toFixed(2)}), reducing concurrency to ${this.config.maxConcurrentWorkflows}`);
    } else if (utilizationRatio < 0.7 && this.waitingTasks.length > 0) {
      // Augmenter le parallélisme car il y a des ressources disponibles et des tâches en attente
      this.config.maxConcurrentWorkflows += 1;
      this.logger.info(`System load acceptable (${utilizationRatio.toFixed(2)}), increasing concurrency to ${this.config.maxConcurrentWorkflows}`);
    }
  }

  /**
   * Arrête l'ordonnanceur
   */
  async stop(): Promise<void> {
    if (this.adjustmentInterval) {
      clearInterval(this.adjustmentInterval);
      this.adjustmentInterval = null;
    }
    
    await this.systemMonitor.stop();
    
    this.logger.info('Priority scheduler stopped');
  }

  /**
   * Récupère l'état actuel de l'ordonnanceur
   */
  getSchedulerStatus(): any {
    return {
      waitingTasks: this.waitingTasks.length,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.size,
      config: this.config,
      systemMetrics: this.systemMonitor.getCurrentMetrics()
    };
  }

  /**
   * Réinitialise tous les workflows qui ont été interrompus
   */
  async recoverInterruptedWorkflows(): Promise<number> {
    // Récupérer les workflows en cours d'exécution qui ont été interrompus
    const interruptedWorkflows = await this.checkpointManager.findStuckWorkflows();
    
    let recoveredCount = 0;
    
    for (const checkpoint of interruptedWorkflows) {
      try {
        // Tenter de reprendre le workflow
        const resumed = await this.checkpointManager.resumeWorkflow(checkpoint.workflowId);
        
        if (resumed) {
          recoveredCount++;
          this.logger.info(`Recovered workflow ${checkpoint.workflowId} at step ${resumed.step}/${resumed.totalSteps}`);
        }
      } catch (error) {
        this.logger.error(`Failed to recover workflow ${checkpoint.workflowId}:`, error);
      }
    }
    
    return recoveredCount;
  }
}