import { Connection, WorkflowClient } from '@temporalio/client';
import { MigrationCoordinator, MigrationWorkflowConfig, MigrationTask } from '../resilience/migration-coordinator';
import { AdvancedRetryConfig, ErrorType } from '../resilience/advanced-retry-strategy';
import { WorkflowCheckpoint, CheckpointStatus } from '../persistence/types';
import { createLogger } from '../../utils/logger';

/**
 * Configuration de l'adaptateur Temporal amélioré
 */
export interface EnhancedTemporalAdapterConfig {
  namespace: string;
  address: string;
  taskQueue: string;
  identity?: string;
  connectionTimeout?: number;
  retryConfig?: AdvancedRetryConfig;
}

/**
 * Options pour l'exécution d'un workflow Temporal
 */
export interface TemporalWorkflowOptions {
  workflowId: string;
  taskQueue?: string;
  retry?: AdvancedRetryConfig;
  timeout?: number;
  workflowName?: string;
  priorityLevel?: 'HIGH' | 'NORMAL' | 'LOW';
  persistenceLevel?: 'FULL' | 'CHECKPOINT_ONLY' | 'MINIMAL';
}

/**
 * Adaptateur Temporal amélioré avec gestion avancée des checkpoints
 */
export class EnhancedTemporalAdapter {
  private connection: Connection;
  private client: WorkflowClient;
  private coordinator: MigrationCoordinator;
  private logger = createLogger('EnhancedTemporalAdapter');
  private config: EnhancedTemporalAdapterConfig;
  
  constructor(config: EnhancedTemporalAdapterConfig) {
    this.config = config;
    this.coordinator = new MigrationCoordinator();
  }
  
  /**
   * Initialise l'adaptateur et établit la connexion avec Temporal
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initialisation de l\'adaptateur Temporal amélioré...');
      
      // Initialiser le coordinateur
      await this.coordinator.initialize();
      
      // Établir la connexion avec Temporal
      this.connection = await Connection.connect({
        address: this.config.address,
        tls: process.env.TEMPORAL_TLS_ENABLED === 'true' ? {} : undefined
      });
      
      // Créer le client Temporal
      this.client = new WorkflowClient({
        connection: this.connection,
        namespace: this.config.namespace,
        identity: this.config.identity || 'enhanced-temporal-adapter'
      });
      
      this.logger.info('Adaptateur Temporal amélioré initialisé avec succès');
      
      // Configurer les écouteurs d'événements du coordinateur
      this.setupEventListeners();
    } catch (error) {
      this.logger.error('Échec de l\'initialisation de l\'adaptateur Temporal:', error);
      throw error;
    }
  }
  
  /**
   * Configure les écouteurs d'événements du coordinateur
   */
  private setupEventListeners(): void {
    const { coordinator } = this;
    
    // Écouter les événements émis par le coordinateur
    coordinator.on('task:started', ({ workflowId, taskId, step }) => {
      this.logger.info(`Tâche démarrée: ${taskId} (étape ${step}) du workflow ${workflowId}`);
      // Ici, on pourrait publier l'événement dans Temporal pour le monitoring
    });
    
    coordinator.on('task:completed', ({ workflowId, taskId, step }) => {
      this.logger.info(`Tâche terminée: ${taskId} (étape ${step}) du workflow ${workflowId}`);
    });
    
    coordinator.on('task:failed', ({ workflowId, taskId, error, attempts }) => {
      this.logger.warn(`Tâche échouée: ${taskId} du workflow ${workflowId} après ${attempts} tentatives`);
    });
    
    coordinator.on('task:retrying', ({ workflowId, taskId, retryCount, delayMs }) => {
      this.logger.info(`Réessai de la tâche: ${taskId} du workflow ${workflowId} (tentative ${retryCount}, délai ${delayMs}ms)`);
    });
    
    coordinator.on('checkpoint:created', ({ workflowId, step }) => {
      this.logger.debug(`Checkpoint créé pour le workflow ${workflowId} à l'étape ${step}`);
    });
    
    coordinator.on('workflow:completed', ({ workflowId }) => {
      this.logger.info(`Workflow ${workflowId} terminé avec succès`);
    });
    
    coordinator.on('workflow:failed', ({ workflowId, error }) => {
      this.logger.error(`Workflow ${workflowId} échoué:`, error);
    });
  }
  
  /**
   * Exécute un workflow avec persistance avancée des checkpoints
   * @param workflowType Type du workflow Temporal
   * @param params Paramètres du workflow
   * @param options Options d'exécution
   */
  async executeWorkflow<T, R>(
    workflowType: string,
    params: T,
    options: TemporalWorkflowOptions
  ): Promise<string> {
    try {
      const workflowId = options.workflowId;
      const taskQueue = options.taskQueue || this.config.taskQueue;
      
      this.logger.info(`Démarrage du workflow ${workflowType} (${workflowId})`);
      
      // Configurer la stratégie de retry pour ce workflow
      const retryConfig: AdvancedRetryConfig = options.retry || this.config.retryConfig || {
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffCoefficient: 2,
        jitterMaxMs: 1000,
        errorCategories: {
          [ErrorType.TRANSIENT]: true,
          [ErrorType.RESOURCE]: true,
          [ErrorType.DEPENDENCY]: true,
          [ErrorType.DATABASE]: true,
          [ErrorType.CONCURRENCY]: true,
          [ErrorType.VALIDATION]: false,
          [ErrorType.FATAL]: false,
        }
      };
      
      // Convertir la priorité en nombre pour le coordinateur
      let priority = 5; // Par défaut: normal
      if (options.priorityLevel === 'HIGH') priority = 8;
      else if (options.priorityLevel === 'LOW') priority = 3;
      
      // Créer les tâches pour le workflow
      const tasks: MigrationTask[] = [{
        id: `${workflowId}-task-1`,
        name: workflowType,
        step: 0,
        execute: async (input, context) => {
          // Lancer le workflow dans Temporal
          const handle = await this.client.start(workflowType, input, {
            taskQueue,
            workflowId: context.workflowId,
            retryPolicy: {
              maximumAttempts: retryConfig.maxAttempts,
              initialInterval: `${retryConfig.initialDelayMs}ms`,
              maximumInterval: `${retryConfig.maxDelayMs}ms`,
              backoffCoefficient: retryConfig.backoffCoefficient
            }
          });
          
          // Créer des checkpoints intermédiaires si nécessaire
          if (options.persistenceLevel === 'FULL') {
            // Mettre en place un polling périodique pour créer des checkpoints
            const checkpointInterval = setInterval(async () => {
              try {
                if (context.abortSignal.aborted) {
                  clearInterval(checkpointInterval);
                  return;
                }
                
                // Récupérer l'état actuel du workflow depuis Temporal
                const description = await handle.describe();
                
                // Créer un checkpoint avec l'état actuel
                await context.createCheckpoint({
                  temporalStatus: description.status.name,
                  lastUpdateTime: new Date().toISOString(),
                  workflowType: description.workflowType.name,
                  runId: description.execution.runId
                });
              } catch (error) {
                context.logger.warn('Échec de création d\'un checkpoint intermédiaire:', error);
              }
            }, 30000); // Toutes les 30 secondes
            
            // S'assurer qu'on nettoie l'intervalle à la fin
            context.abortSignal.addEventListener('abort', () => {
              clearInterval(checkpointInterval);
            });
          }
          
          // Attendre la fin du workflow
          return await handle.result();
        },
        input: params,
        state: 'PENDING'
      }];
      
      // Configurer le workflow pour le coordinateur
      const workflowConfig: MigrationWorkflowConfig = {
        id: workflowId,
        name: options.workflowName || workflowType,
        totalSteps: 1,
        retryConfig,
        timeout: options.timeout,
        priority
      };
      
      // Démarrer le workflow via le coordinateur
      return await this.coordinator.startWorkflow(workflowConfig, tasks);
    } catch (error) {
      this.logger.error(`Échec du lancement du workflow ${workflowType}:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère l'état actuel d'un workflow
   * @param workflowId ID du workflow
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    try {
      // Récupérer l'état depuis le coordinateur
      const status = await this.coordinator.getWorkflowStatus(workflowId);
      
      // Si le workflow est actif dans le coordinateur, retourner son état
      if (status) {
        return status;
      }
      
      // Sinon, essayer de récupérer l'état depuis Temporal
      try {
        const handle = this.client.getHandle(workflowId);
        const description = await handle.describe();
        
        return {
          state: description.status.name,
          runId: description.execution.runId,
          workflowType: description.workflowType.name,
          startTime: description.startTime,
          closeTime: description.closeTime,
          historyLength: description.historyLength
        };
      } catch (error) {
        // Le workflow n'existe peut-être pas dans Temporal
        return null;
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération de l'état du workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  /**
   * Reprend un workflow échoué
   * @param workflowId ID du workflow à reprendre
   */
  async resumeWorkflow(workflowId: string): Promise<boolean> {
    try {
      // Essayer de reprendre via le coordinateur
      const resumed = await this.coordinator.resumeWorkflow(workflowId);
      
      if (resumed) {
        this.logger.info(`Workflow ${workflowId} repris avec succès`);
        return true;
      }
      
      // Si échec via le coordinateur, essayer de récupérer le workflow via Temporal
      try {
        const handle = this.client.getHandle(workflowId);
        await handle.terminate('Workflow terminated for restart');
        
        // Récupérer les détails du workflow
        const description = await handle.describe().catch(() => null);
        if (!description) {
          this.logger.warn(`Impossible de récupérer les détails du workflow ${workflowId}`);
          return false;
        }
        
        // TODO: Implémenter la logique pour relancer le workflow dans Temporal
        this.logger.info(`Besoin d'une intervention manuelle pour reprendre le workflow ${workflowId}`);
        return false;
      } catch (error) {
        this.logger.error(`Échec de la reprise du workflow ${workflowId} via Temporal:`, error);
        return false;
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la reprise du workflow ${workflowId}:`, error);
      return false;
    }
  }
  
  /**
   * Arrête un workflow en cours d'exécution
   * @param workflowId ID du workflow à arrêter
   * @param reason Raison de l'arrêt
   */
  async stopWorkflow(workflowId: string, reason: string = 'Workflow stopped manually'): Promise<boolean> {
    try {
      // Arrêter le workflow dans le coordinateur
      await this.coordinator.stopWorkflow(workflowId);
      
      // Arrêter aussi le workflow dans Temporal
      try {
        const handle = this.client.getHandle(workflowId);
        await handle.terminate(reason);
      } catch (error) {
        // Ignorer les erreurs si le workflow n'existe pas dans Temporal
        this.logger.debug(`Erreur lors de l'arrêt du workflow ${workflowId} dans Temporal:`, error);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Échec de l'arrêt du workflow ${workflowId}:`, error);
      return false;
    }
  }
  
  /**
   * Recherche les workflows bloqués qui nécessitent une intervention
   */
  async findStuckWorkflows(): Promise<string[]> {
    try {
      return await this.coordinator.findStuckWorkflows();
    } catch (error) {
      this.logger.error('Erreur lors de la recherche des workflows bloqués:', error);
      return [];
    }
  }
  
  /**
   * Signale un événement à un workflow en cours d'exécution
   * @param workflowId ID du workflow
   * @param signalName Nom du signal
   * @param payload Données du signal
   */
  async signalWorkflow(workflowId: string, signalName: string, payload?: any): Promise<boolean> {
    try {
      const handle = this.client.getHandle(workflowId);
      await handle.signal(signalName, payload);
      this.logger.info(`Signal ${signalName} envoyé au workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.error(`Échec de l'envoi du signal ${signalName} au workflow ${workflowId}:`, error);
      return false;
    }
  }
  
  /**
   * Ferme l'adaptateur et libère les ressources
   */
  async close(): Promise<void> {
    try {
      // Fermer le coordinateur
      await this.coordinator.close();
      
      // Fermer la connexion Temporal
      if (this.connection) {
        await this.connection.close();
      }
      
      this.logger.info('Adaptateur Temporal fermé');
    } catch (error) {
      this.logger.error('Erreur lors de la fermeture de l\'adaptateur Temporal:', error);
    }
  }
}