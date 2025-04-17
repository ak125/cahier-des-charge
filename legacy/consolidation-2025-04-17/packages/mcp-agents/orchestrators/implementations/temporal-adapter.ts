import { Connection, Client } from '@temporalio/client';
import { WorkflowClient } from '@temporalio/client';
import { 
  OrchestrationAdapter, 
  ValidationResult, 
  OrchestratorCapabilities 
} from '../three-layer/adapter-layer';
import { 
  OrchestrationAbstraction,
  WorkflowDefinition, 
  ExecutionOptions, 
  ExecutionResult, 
  TaskOptions, 
  JobStatus, 
  EventCallback 
} from '../three-layer/abstraction-layer';
import { CheckpointManager, MigrationCheckpoint } from '../persistence/checkpoint-manager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration avancée pour les politiques de retry
 */
export interface RetryPolicyConfig {
  initialInterval?: number;        // Intervalle initial en millisecondes
  backoffCoefficient?: number;     // Coefficient de multiplication pour le backoff exponentiel
  maximumInterval?: number;        // Intervalle maximum en millisecondes
  maximumAttempts?: number;        // Nombre maximum de tentatives
  nonRetryableErrorTypes?: string[]; // Types d'erreurs non récupérables
}

/**
 * Configuration avancée pour les stratégies de retry
 */
export interface EnhancedRetryOptions {
  maxAttempts: number;
  initialIntervalMs: number;
  maximumIntervalMs: number;
  backoffCoefficient: number;
  maximumAttempts?: number;
  nonRetryableErrorTypes?: string[];
  criticalityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Options d'exécution étendues avec la gestion des points de contrôle
 */
export interface EnhancedExecutionOptions extends ExecutionOptions {
  checkpointing?: {
    enabled: boolean;
    intervalSeconds?: number;
  };
  retry?: RetryPolicyConfig;
  priority?: number; // 0-100, où 100 est la priorité la plus élevée
  resumeFromCheckpoint?: boolean;
}

/**
 * Configuration pour l'exécution améliorée d'un workflow
 */
export interface EnhancedExecutionOptions {
  executionId?: string;
  priority?: number; // 0-100, où 100 est la priorité la plus élevée
  resumeFromCheckpoint?: boolean;
  checkpointing?: {
    enabled: boolean;
    intervalSeconds?: number;
    persistenceLevel?: 'MEMORY' | 'DISK' | 'DATABASE';
  };
  retry?: EnhancedRetryOptions;
  resourceConstraints?: {
    memoryLimitMB?: number;
    cpuLimit?: number;
    timeoutSeconds?: number;
  };
  loadBalancingKey?: string; // Pour la répartition intelligente des charges
}

/**
 * Adaptateur d'orchestration pour Temporal Workflow Engine avec résilience améliorée
 */
export class TemporalAdapter implements OrchestrationAdapter {
  readonly name = 'Temporal';
  readonly version: string;
  private client: WorkflowClient;
  private connection: Connection;
  private errorHandlers: Array<(error: any) => Promise<boolean>> = [];
  private checkpointManager?: CheckpointManager;
  
  readonly capabilities: OrchestratorCapabilities = {
    parallelExecution: true,
    childWorkflows: true,
    signalWorkflows: true,
    continuedExecution: true,
    stateQueries: true,
    versioning: true,
    localActivities: true,
    searchAttributes: true,
    retryPolicies: true,
    timeouts: true,
  };

  constructor(config: {
    address: string;
    namespace: string;
    clientOptions?: any;
    version?: string;
    checkpointConfig?: {
      dbPath: string;
      checkpointInterval?: number;
    };
  }) {
    this.version = config.version || '1.0.0';
    
    // Initialiser le gestionnaire de points de contrôle si configuré
    if (config.checkpointConfig) {
      this.checkpointManager = new CheckpointManager(config.checkpointConfig);
    }
  }

  async initialize(): Promise<void> {
    this.connection = await Connection.connect({
      address: 'localhost:7233', // Adresse par défaut de Temporal
    });
    
    this.client = new Client({
      connection: this.connection,
      namespace: 'default', // Espace de noms par défaut
    });
    
    // Initialiser le gestionnaire de points de contrôle si disponible
    if (this.checkpointManager) {
      await this.checkpointManager.initialize();
    }
    
    console.log(`Adaptateur Temporal initialisé (version: ${this.version})`);
  }

  async validateWorkflowDefinition(workflowDefinition: WorkflowDefinition): Promise<ValidationResult> {
    // Vérification de la présence des propriétés requises pour Temporal
    const errors: string[] = [];
    
    if (!workflowDefinition.id) {
      errors.push('L\'identifiant du workflow est requis');
    }
    
    if (!workflowDefinition.implementation || typeof workflowDefinition.implementation !== 'object') {
      errors.push('L\'implémentation du workflow est requise et doit être un objet');
    }
    
    // Vérification que l'implémentation contient les propriétés spécifiques à Temporal
    const impl = workflowDefinition.implementation || {};
    if (!impl.workflowType) {
      errors.push('Le type de workflow (workflowType) est requis pour Temporal');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async registerWorkflow(workflowDefinition: WorkflowDefinition): Promise<void> {
    // Pour Temporal, l'enregistrement des workflows se fait côté worker
    // Nous stockons simplement une référence au workflow pour la validation future
    console.log(`Workflow "${workflowDefinition.name}" (${workflowDefinition.id}) enregistré`);
  }

  /**
   * Crée une politique de retry à partir de la configuration fournie
   */
  private createRetryPolicy(config?: RetryPolicyConfig): any {
    const defaultPolicy = {
      initialInterval: 1000,        // 1 seconde
      backoffCoefficient: 2,        // Multiplication par 2 à chaque tentative
      maximumInterval: 60000,       // 1 minute maximum
      maximumAttempts: 10,          // 10 tentatives maximum
    };
    
    const policy = {
      ...defaultPolicy,
      ...(config || {})
    };
    
    return {
      initialIntervalInMilliseconds: policy.initialInterval,
      backoffCoefficient: policy.backoffCoefficient,
      maximumIntervalInMilliseconds: policy.maximumInterval,
      maximumAttempts: policy.maximumAttempts,
      nonRetryableErrorTypes: policy.nonRetryableErrorTypes || [],
    };
  }

  /**
   * Crée une politique de retry avancée en fonction des options
   */
  private createRetryPolicy(options?: EnhancedRetryOptions): temporal.RetryPolicy {
    const defaultOptions: EnhancedRetryOptions = {
      maxAttempts: 5,
      initialIntervalMs: 1000,
      maximumIntervalMs: 60000, // 1 minute maximum
      backoffCoefficient: 2,
    };

    const retryOptions = options || defaultOptions;
    
    // Ajuster les paramètres en fonction du niveau de criticité
    if (retryOptions.criticalityLevel) {
      switch (retryOptions.criticalityLevel) {
        case 'LOW':
          retryOptions.maxAttempts = Math.min(retryOptions.maxAttempts, 3);
          retryOptions.maximumIntervalMs = Math.min(retryOptions.maximumIntervalMs || 60000, 30000);
          break;
        case 'MEDIUM':
          // Utiliser les valeurs par défaut
          break;
        case 'HIGH':
          retryOptions.maxAttempts = Math.max(retryOptions.maxAttempts, 7);
          retryOptions.maximumIntervalMs = Math.max(retryOptions.maximumIntervalMs || 60000, 120000);
          break;
        case 'CRITICAL':
          retryOptions.maxAttempts = Math.max(retryOptions.maxAttempts, 10);
          retryOptions.maximumIntervalMs = Math.max(retryOptions.maximumIntervalMs || 60000, 300000);
          retryOptions.backoffCoefficient = Math.min(retryOptions.backoffCoefficient, 1.5); // Croissance plus lente pour plus de tentatives
          break;
      }
    }

    return {
      maximumAttempts: retryOptions.maximumAttempts || retryOptions.maxAttempts,
      initialInterval: ms(retryOptions.initialIntervalMs),
      maximumInterval: ms(retryOptions.maximumIntervalMs),
      backoffCoefficient: retryOptions.backoffCoefficient,
      nonRetryableErrorTypes: retryOptions.nonRetryableErrorTypes || [],
    };
  }

  /**
   * Exécute un workflow avec des fonctionnalités de résilience améliorées
   */
  async executeWorkflow(
    workflowId: string, 
    input: any, 
    options?: EnhancedExecutionOptions
  ): Promise<ExecutionResult> {
    const enhancedOptions = options || {};
    let executionId = enhancedOptions.executionId || `${workflowId}-${Date.now()}`;
    let lastCheckpoint: MigrationCheckpoint | null = null;
    
    // Vérifier s'il y a un point de contrôle à reprendre
    if (enhancedOptions.resumeFromCheckpoint && this.checkpointManager) {
      lastCheckpoint = await this.checkpointManager.getLastCheckpoint(executionId);
      
      if (lastCheckpoint) {
        // Analyser l'échec précédent pour ajuster la stratégie de reprise
        if (lastCheckpoint.status === 'failed' && lastCheckpoint.metadata?.lastError) {
          // Analyser le type d'erreur pour déterminer la meilleure stratégie
          const errorType = this.analyzeErrorType(lastCheckpoint.metadata.lastError);
          
          // Ajuster les options de retry en fonction du type d'erreur
          if (!enhancedOptions.retry) {
            enhancedOptions.retry = {
              maxAttempts: 5,
              initialIntervalMs: 1000,
              maximumIntervalMs: 60000,
              backoffCoefficient: 2,
            };
          }
          
          if (errorType.includes('transient') || errorType.includes('connection')) {
            // Pour les erreurs transitoires, augmenter le délai initial mais limiter le nombre de tentatives
            enhancedOptions.retry.initialIntervalMs = Math.min(5000, enhancedOptions.retry.initialIntervalMs * 2);
          } else if (errorType.includes('resource')) {
            // Pour les erreurs de ressources, attendre plus longtemps entre les tentatives
            enhancedOptions.retry.maximumIntervalMs = Math.min(300000, enhancedOptions.retry.maximumIntervalMs * 1.5);
            enhancedOptions.retry.backoffCoefficient = Math.min(3, enhancedOptions.retry.backoffCoefficient * 1.2);
          }
        }
        
        console.log(`Reprise du workflow ${executionId} depuis le point de contrôle ${lastCheckpoint.step}`);
        // Fusionner les données du point de contrôle avec l'input
        input = {
          ...input,
          _checkpoint: {
            step: lastCheckpoint.step,
            data: lastCheckpoint.data,
            timestamp: lastCheckpoint.timestamp,
            retryCount: (lastCheckpoint.metadata?.attemptCount || 0) + 1,
            errorHistory: lastCheckpoint.metadata?.lastError 
              ? [...(input._checkpoint?.errorHistory || []), lastCheckpoint.metadata.lastError]
              : (input._checkpoint?.errorHistory || [])
          }
        };
      }
    }
    
    // Créer la politique de retry
    const retryPolicy = this.createRetryPolicy(enhancedOptions.retry);
    
    // Configurer les options de workflow pour Temporal
    const workflowOptions: any = {
      taskQueue: enhancedOptions.taskQueue || 'default',
      workflowId: executionId,
      workflowRunTimeout: enhancedOptions.timeout ? `${enhancedOptions.timeout}ms` : undefined,
      args: [input],
      retryPolicy,
    };
    
    // Ajouter les attributs de recherche pour la priorité si spécifiée
    if (enhancedOptions.priority !== undefined) {
      workflowOptions.searchAttributes = {
        ...workflowOptions.searchAttributes,
        CustomIntField: [enhancedOptions.priority]  // CustomIntField est utilisé pour stocker la priorité
      };
    }
    
    // Configurer les mémos pour le point de contrôle si activé
    if (enhancedOptions.checkpointing?.enabled) {
      workflowOptions.memo = {
        checkpointingEnabled: true,
        checkpointInterval: enhancedOptions.checkpointing.intervalSeconds || 60, // 1 minute par défaut
        persistenceLevel: enhancedOptions.checkpointing.persistenceLevel || 'DATABASE'
      };
    }
    
    try {
      const handle = await this.client.start(
        workflowId,
        workflowOptions
      );
      
      // Enregistrer un point de contrôle initial si le checkpointing est activé
      if (enhancedOptions.checkpointing?.enabled && this.checkpointManager && !lastCheckpoint) {
        const initialCheckpoint: MigrationCheckpoint = {
          id: uuidv4(),
          workflowId: executionId,
          timestamp: new Date().toISOString(),
          step: 'start',
          status: 'in_progress',
          data: input,
          metadata: {
            attemptCount: 0,
            retryStrategy: enhancedOptions.retry ? {
              maxAttempts: enhancedOptions.retry.maxAttempts,
              initialDelayMs: enhancedOptions.retry.initialIntervalMs,
              maxDelayMs: enhancedOptions.retry.maximumIntervalMs,
              backoffCoefficient: enhancedOptions.retry.backoffCoefficient,
              currentAttempt: 0,
              lastAttemptTime: new Date().toISOString(),
            } : undefined
          }
        };
        
        await this.checkpointManager.saveCheckpoint(initialCheckpoint);
      }
      
      return {
        jobId: handle.workflowId,
        status: {
          state: 'RUNNING',
          timestamps: {
            created: new Date()
          }
        },
        trackingUrl: `http://localhost:8088/workflows/${handle.namespace}/${handle.workflowId}`,
        context: {
          namespace: handle.namespace,
          runId: handle.runId,
          withCheckpointing: enhancedOptions.checkpointing?.enabled || false
        }
      };
    } catch (error) {
      console.error(`Erreur lors du démarrage du workflow ${workflowId}:`, error);
      
      // Sauvegarder l'échec dans un point de contrôle si le checkpointing est activé
      if (enhancedOptions.checkpointing?.enabled && this.checkpointManager) {
        const failedCheckpoint: MigrationCheckpoint = {
          id: uuidv4(),
          workflowId: executionId,
          timestamp: new Date().toISOString(),
          step: lastCheckpoint?.step || 'start',
          status: 'failed',
          data: input,
          metadata: {
            attemptCount: (lastCheckpoint?.metadata?.attemptCount || 0) + 1,
            lastError: error.message || String(error),
            retryStrategy: lastCheckpoint?.metadata?.retryStrategy || (enhancedOptions.retry ? {
              maxAttempts: enhancedOptions.retry.maxAttempts,
              initialDelayMs: enhancedOptions.retry.initialIntervalMs,
              maxDelayMs: enhancedOptions.retry.maximumIntervalMs,
              backoffCoefficient: enhancedOptions.retry.backoffCoefficient,
              currentAttempt: 1,
              lastAttemptTime: new Date().toISOString(),
            } : undefined)
          }
        };
        
        await this.checkpointManager.saveCheckpoint(failedCheckpoint);
      }
      
      // Tenter de gérer l'erreur avec les gestionnaires enregistrés
      for (const handler of this.errorHandlers) {
        const handled = await handler(error);
        if (handled) {
          break;
        }
      }
      
      throw error;
    }
  }

  async submitTask(taskType: string, taskData: any, options?: TaskOptions): Promise<string> {
    // Dans Temporal, les tâches sont exécutées comme des activités
    // Nous simulons ici une soumission d'activité
    const taskId = `${taskType}-${Date.now()}`;
    
    // Logique pour soumettre l'activité à Temporal
    // En réalité, cela serait fait via une activité dans un workflow
    
    return taskId;
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const handle = this.client.getHandle(jobId);
    const description = await handle.describe();
    
    // Conversion de l'état Temporal vers notre modèle générique
    let state: JobStatus['state'];
    switch (description.status.name) {
      case 'COMPLETED':
        state = 'COMPLETED';
        break;
      case 'RUNNING':
        state = 'RUNNING';
        break;
      case 'FAILED':
        state = 'FAILED';
        break;
      case 'CANCELED':
        state = 'CANCELLED';
        break;
      case 'TIMED_OUT':
        state = 'TIMED_OUT';
        break;
      default:
        state = 'PENDING';
    }
    
    const result: JobStatus = {
      state,
      timestamps: {
        created: new Date(description.startTime),
        started: new Date(description.executionTime || description.startTime),
      }
    };
    
    if (description.status.name === 'COMPLETED') {
      result.timestamps.completed = new Date(description.closeTime);
      // Récupération du résultat (nécessiterait un appel supplémentaire)
    }
    
    if (description.status.name === 'FAILED') {
      result.timestamps.completed = new Date(description.closeTime);
      result.error = {
        message: description.status.failure?.message || 'Unknown error',
        code: description.status.failure?.cause?.message,
        details: description.status.failure
      };
    }
    
    return result;
  }

  /**
   * Sauvegarde un point de contrôle pour un workflow en cours
   */
  async saveWorkflowCheckpoint(workflowId: string, step: string, data: any, metadata?: any): Promise<void> {
    if (!this.checkpointManager) {
      console.warn(`Impossible de sauvegarder le point de contrôle pour ${workflowId}: CheckpointManager non initialisé`);
      return;
    }
    
    const checkpoint: MigrationCheckpoint = {
      id: uuidv4(),
      workflowId,
      timestamp: new Date().toISOString(),
      step,
      status: 'in_progress',
      data,
      metadata: {
        attemptCount: (metadata?.attemptCount || 0) + 1,
        ...metadata
      }
    };
    
    await this.checkpointManager.saveCheckpoint(checkpoint);
  }

  /**
   * Récupère le dernier point de contrôle pour un workflow
   */
  async getLastWorkflowCheckpoint(workflowId: string): Promise<MigrationCheckpoint | null> {
    if (!this.checkpointManager) {
      console.warn(`Impossible de récupérer le point de contrôle pour ${workflowId}: CheckpointManager non initialisé`);
      return null;
    }
    
    return this.checkpointManager.getLastCheckpoint(workflowId);
  }

  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const handle = this.client.getHandle(jobId);
      await handle.cancel();
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'annulation du job ${jobId}:`, error);
      return false;
    }
  }

  async subscribeToEvents(entityId: string, eventType: string, callback: EventCallback): Promise<void> {
    // Temporal utilise des signaux pour la communication
    // Cette implémentation est une simplification
    console.log(`Abonnement aux événements ${eventType} pour ${entityId}`);
    
    // Dans une implémentation réelle, nous créerions un worker qui écoute les signaux
  }

  async close(): Promise<void> {
    if (this.checkpointManager) {
      await this.checkpointManager.close();
    }
    
    await this.connection.close();
    console.log('Adaptateur Temporal fermé');
  }

  async convertToNativeFormat(genericDefinition: WorkflowDefinition): Promise<any> {
    // Conversion d'une définition générique en format Temporal
    const implementation = genericDefinition.implementation || {};
    
    // Extraire les paramètres de retry s'ils existent
    const retryPolicy = this.createRetryPolicy(implementation.retryPolicy);
    
    return {
      workflowType: implementation.workflowType,
      workflowId: genericDefinition.id,
      taskQueue: implementation.taskQueue || 'default',
      retryPolicy,
      priority: implementation.priority,
      // Autres propriétés spécifiques à Temporal
    };
  }

  convertFromNativeFormat(nativeDefinition: any): WorkflowDefinition {
    // Conversion d'une définition Temporal en format générique
    return {
      id: nativeDefinition.workflowId,
      name: nativeDefinition.workflowType,
      implementation: {
        workflowType: nativeDefinition.workflowType,
        taskQueue: nativeDefinition.taskQueue,
        priority: nativeDefinition.searchAttributes?.CustomIntField?.[0],
        retryPolicy: nativeDefinition.retryPolicy ? {
          initialInterval: nativeDefinition.retryPolicy.initialIntervalInMilliseconds,
          backoffCoefficient: nativeDefinition.retryPolicy.backoffCoefficient,
          maximumInterval: nativeDefinition.retryPolicy.maximumIntervalInMilliseconds,
          maximumAttempts: nativeDefinition.retryPolicy.maximumAttempts,
          nonRetryableErrorTypes: nativeDefinition.retryPolicy.nonRetryableErrorTypes,
        } : undefined,
        // Autres propriétés spécifiques
      },
      metadata: {
        source: 'temporal',
        // Autres métadonnées
      }
    };
  }

  async registerErrorHandler(handler: (error: any) => Promise<boolean>): Promise<void> {
    this.errorHandlers.push(handler);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Vérification simple de la connexion
      await this.client.service.workflowService.getSystemInfo();
      return true;
    } catch (error) {
      console.error('Échec de la vérification de santé Temporal:', error);
      return false;
    }
  }

  /**
   * Analyse le type d'erreur pour déterminer la meilleure stratégie de reprise
   */
  private analyzeErrorType(errorMessage: string): string[] {
    const errorTypes: string[] = [];
    
    // Erreurs de connexion ou réseau
    if (errorMessage.includes('connection') || 
        errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT')) {
      errorTypes.push('transient', 'connection');
    }
    
    // Erreurs liées aux ressources
    if (errorMessage.includes('memory') || 
        errorMessage.includes('cpu') || 
        errorMessage.includes('resource') ||
        errorMessage.includes('out of memory') ||
        errorMessage.includes('load')) {
      errorTypes.push('resource');
    }
    
    // Erreurs d'autorisation
    if (errorMessage.includes('permission') || 
        errorMessage.includes('unauthorized') || 
        errorMessage.includes('forbidden') ||
        errorMessage.includes('auth')) {
      errorTypes.push('permission');
    }
    
    // Erreurs de données
    if (errorMessage.includes('data') || 
        errorMessage.includes('validation') || 
        errorMessage.includes('schema') ||
        errorMessage.includes('parse')) {
      errorTypes.push('data');
    }
    
    // Par défaut, considérer comme erreur générique
    if (errorTypes.length === 0) {
      errorTypes.push('generic');
    }
    
    return errorTypes;
  }
}