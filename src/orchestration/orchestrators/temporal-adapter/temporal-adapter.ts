import { AbstractOrchestratorAgent } from '../abstract-orchestrator';
import { 
  OrchestrationAdapter,
  OrchestratorCapabilities,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../adapter-layer';
import {
  WorkflowDefinition,
  ExecutionOptions,
  ExecutionResult,
  TaskOptions,
  JobStatus,
  HealthStatus,
  ErrorHandler
} from '../abstraction-layer';
import { 
  Connection, 
  Client, 
  WorkflowClient, 
  WorkflowHandle,
  WorkflowExecutionDescription,
  ScheduleClient,
  ScheduleOptions,
  ScheduleOverlapPolicy
} from '@temporalio/client';
import { 
  NativeConnection, 
  Worker, 
  WorkerOptions, 
  bundleWorkflowCode 
} from '@temporalio/worker';
import { 
  proxyActivities, 
  ActivityOptions, 
  ApplicationFailure 
} from '@temporalio/workflow';
import { RetryOptions } from '@temporalio/common';

/**
 * Adaptateur pour le système d'orchestration Temporal.io
 */
export class TemporalAdapter extends AbstractOrchestratorAgent<any, any> implements OrchestrationAdapter {
  private client: Client;
  private connection: Connection;
  private workflowClient: WorkflowClient;
  private scheduleClient: ScheduleClient;
  private worker: Worker;
  private errorHandler?: ErrorHandler;

  readonly name: string = 'Temporal.io';
  readonly version: string = '1.1.0'; // Version mise à jour
  
  readonly capabilities: OrchestratorCapabilities = {
    durableWorkflows: true,
    workflowRecovery: true,
    parallelExecution: true,
    subWorkflows: true,
    signaling: true,
    distributedTransactions: true,
    scheduling: true,
    versioning: true,
    'childWorkflows': true,
    'localActivities': true,
    'sideEffects': true,
    'continueAsNew': true
  };

  /**
   * Constructeur pour l'adaptateur Temporal
   * @param connectionOptions Options de connexion à Temporal
   */
  constructor(private connectionOptions: {
    address: string;
    namespace?: string;
    taskQueue: string;
    workerOptions?: WorkerOptions;
    retryOptions?: RetryOptions;
  }) {}

  /**
   * Initialise la connexion à Temporal
   */
  protected async initializeInternal(): Promise<void> {
  protected async cleanupInternal(): Promise<void> {
    // Nettoyage des ressources
  }

    try {
      // Connexion au serveur Temporal
      this.connection = await NativeConnection.connect({
        address: this.connectionOptions.address
      });
      
      // Création du client Temporal
      this.client = new Client({
        connection: this.connection,
        namespace: this.connectionOptions.namespace || 'default'
      });
      
      // Initialisation des clients spécifiques
      this.workflowClient = this.client.workflow;
      this.scheduleClient = this.client.schedule;
      
      // Configuration du worker avec options avancées
      const workerOptions: WorkerOptions = {
        connection: this.connection,
        taskQueue: this.connectionOptions.taskQueue,
        workflowsPath: require.resolve('./temporal-workflows'),
        ...this.connectionOptions.workerOptions
      };
      
      // Bundle le code des workflows pour optimisation
      const bundledCode = await bundleWorkflowCode({
        workflowsPath: workerOptions.workflowsPath
      });
      
      // Création et démarrage du worker
      this.worker = await Worker.create({
        ...workerOptions,
        bundler: {
          code: bundledCode
        }
      });

      // Démarrer le worker en arrière-plan
      await this.worker.run();
      
      console.log(`Adaptateur Temporal initialisé avec succès. Connecté à ${this.connectionOptions.address}, namespace: ${this.connectionOptions.namespace || 'default'}`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Temporal:', error);
      throw new Error(`Échec de l'initialisation de l'adaptateur Temporal: ${error.message}`);
    }
  }

  /**
   * Termine proprement la connexion à Temporal
   */
  async shutdown(): Promise<void> {
    try {
      // Arrêt du worker
      if (this.worker) {
        await this.worker.shutdown();
      }
      
      // Fermeture de la connexion
      await this.connection?.close();
      
      console.log('Adaptateur Temporal arrêté avec succès');
    } catch (error) {
      console.error('Erreur lors de la fermeture de la connexion Temporal:', error);
    }
  }

  /**
   * Déploie un workflow dans Temporal
   */
  async deployWorkflow(workflowDefinition: WorkflowDefinition): Promise<string> {
    // Valider d'abord la définition du workflow
    const validationResult = await this.validateWorkflowDefinition(workflowDefinition);
    if (!validationResult.isValid) {
      throw new Error(`Workflow invalide: ${JSON.stringify(validationResult.errors)}`);
    }

    // Dans Temporal, le déploiement se fait simplement en enregistrant le workflow
    // avec les métadonnées associées
    try {
      // Convertir au format natif de Temporal si nécessaire
      const temporalWorkflow = this.convertToNativeFormat(workflowDefinition);
      
      // Temporal n'a pas de concept strict de "déploiement", 
      // mais on peut stocker les métadonnées dans un système externe si nécessaire
      
      return workflowDefinition.id;
    } catch (error) {
      console.error(`Erreur lors du déploiement du workflow ${workflowDefinition.id}:`, error);
      throw new Error(`Échec du déploiement: ${error.message}`);
    }
  }

  /**
   * Exécute un workflow déployé avec support complet des options du SDK
   */
  async executeWorkflow(workflowId: string, input?: any, options?: ExecutionOptions): Promise<ExecutionResult> {
    try {
      const startTime = new Date();
      
      // Configuration des options d'exécution avec les valeurs par défaut
      const execOptions = {
        taskQueue: this.connectionOptions.taskQueue,
        workflowId: `${workflowId}-${Date.now()}`, // ID unique
        retry: this.connectionOptions.retryOptions,
        workflowRunTimeout: options?.timeout,
        ...options?.native
      };
      
      // Exécution du workflow
      const handle = await this.workflowClient.start(workflowId, {
        args: [input],
        ...execOptions
      });
      
      // Attendre la fin de l'exécution si demandé
      let result;
      if (!options?.detached) {
        result = await handle.result();
      }
      
      const endTime = new Date();
      
      return {
        id: handle.workflowId,
        status: JobStatus.COMPLETED,
        output: result,
        startTime,
        endTime
      };
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler({
          workflowId,
          error,
          timestamp: new Date()
        });
      }
      
      // Gestion intelligente des erreurs par type
      let status = JobStatus.FAILED;
      if (error instanceof ApplicationFailure) {
        if (error.type === 'Cancelled') {
          status = JobStatus.CANCELED;
        } else if (error.type === 'Timeout') {
          status = JobStatus.TIMEOUT;
        }
      }
      
      return {
        id: workflowId,
        status,
        error: error.message,
        startTime: new Date(),
        endTime: new Date()
      };
    }
  }

  /**
   * Exécute un sous-workflow (child workflow) à partir d'un workflow parent
   * @param parentWorkflowId ID du workflow parent
   * @param childWorkflowId ID du workflow enfant à exécuter
   * @param input Paramètres d'entrée pour le workflow enfant
   * @param options Options d'exécution spécifiques
   * @returns ID d'exécution du workflow enfant
   */
  async executeChildWorkflow(
    parentWorkflowId: string,
    childWorkflowId: string,
    input?: any,
    options?: {
      childWorkflowId?: string,
      parentClosePolicy?: 'PARENT_CLOSE_POLICY_TERMINATE' | 'PARENT_CLOSE_POLICY_ABANDON' | 'PARENT_CLOSE_POLICY_REQUEST_CANCEL',
      cancellationType?: 'TRY_CANCEL' | 'WAIT_CANCELLATION_COMPLETED' | 'ABANDON',
    }
  ): Promise<string> {
    try {
      // Vérifier d'abord que le workflow parent existe et est en cours d'exécution
      const parentHandle = this.workflowClient.getHandle(parentWorkflowId);
      const parentDesc = await parentHandle.describe();
      
      if (parentDesc.status.name !== 'RUNNING') {
        throw new Error(`Le workflow parent ${parentWorkflowId} n'est pas en exécution (statut: ${parentDesc.status.name})`);
      }
      
      // Configurer les options pour le workflow enfant
      const childId = options?.childWorkflowId || `${childWorkflowId}-child-of-${parentWorkflowId}-${Date.now()}`;
      
      // Signaler au workflow parent de démarrer un workflow enfant
      // Note: Ceci nécessite que le workflow parent implémente la logique pour démarrer un workflow enfant
      await parentHandle.signal('startChildWorkflow', {
        workflowType: childWorkflowId,
        workflowId: childId,
        args: [input],
        parentClosePolicy: options?.parentClosePolicy || 'PARENT_CLOSE_POLICY_TERMINATE',
        cancellationType: options?.cancellationType || 'TRY_CANCEL',
      });
      
      return childId;
    } catch (error) {
      console.error(`Erreur lors de l'exécution du workflow enfant ${childWorkflowId} depuis ${parentWorkflowId}:`, error);
      throw new Error(`Échec de l'exécution du workflow enfant: ${error.message}`);
    }
  }

  /**
   * Réinitialise un workflow échoué ou terminé à un point spécifique
   * @param workflowId ID du workflow à réinitialiser
   * @param resetType Type de réinitialisation à effectuer
   * @param options Options supplémentaires pour la réinitialisation
   * @returns Nouvel ID du workflow réinitialisé
   */
  async resetWorkflow(
    workflowId: string,
    resetType: 'LastWorkflowTask' | 'LastContinuedAsNew' | 'FirstWorkflowTask' | 'EventId',
    options?: {
      reason?: string,
      eventId?: number,
      historyEventId?: number,
      skipSignalReapply?: boolean
    }
  ): Promise<string> {
    try {
      const handle = this.workflowClient.getHandle(workflowId);
      
      // Configuration des options de réinitialisation
      const resetOptions: any = {
        reason: options?.reason || `Réinitialisé à ${resetType}`,
      };
      
      // Configuration spécifique selon le type de réinitialisation
      switch (resetType) {
        case 'LastWorkflowTask':
          resetOptions.resetReapplyType = 'ResetReapplyType.SIGNAL_ONLY';
          resetOptions.skipSignalReapply = options?.skipSignalReapply === true;
          break;
        case 'EventId':
          if (options?.eventId === undefined && options?.historyEventId === undefined) {
            throw new Error('Un eventId ou historyEventId doit être spécifié pour une réinitialisation de type EventId');
          }
          resetOptions.eventId = options?.eventId || options?.historyEventId;
          break;
      }
      
      // Effectuer la réinitialisation
      const newExecutionHandle = await handle.reset(resetOptions);
      
      // Retourner le nouvel ID d'exécution
      return newExecutionHandle.workflowId;
    } catch (error) {
      console.error(`Erreur lors de la réinitialisation du workflow ${workflowId}:`, error);
      throw new Error(`Échec de la réinitialisation du workflow: ${error.message}`);
    }
  }

  /**
   * Obtient le statut d'exécution d'un workflow avec des informations détaillées
   */
  async getExecutionStatus(executionId: string): Promise<JobStatus> {
    try {
      const handle = this.workflowClient.getHandle(executionId);
      const description = await handle.describe();
      
      return this.mapTemporalStatusToJobStatus(description.status.name);
    } catch (error) {
      console.error(`Erreur lors de la récupération du statut pour ${executionId}:`, error);
      return JobStatus.UNKNOWN;
    }
  }
  
  /**
   * Obtient des informations détaillées sur une exécution de workflow
   */
  async getExecutionDetails(executionId: string): Promise<WorkflowExecutionDescription> {
    try {
      const handle = this.workflowClient.getHandle(executionId);
      return await handle.describe();
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails pour ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Annule l'exécution d'un workflow en cours avec raison
   */
  async cancelExecution(executionId: string, reason?: string): Promise<boolean> {
    try {
      const handle = this.workflowClient.getHandle(executionId);
      await handle.cancel(reason);
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'annulation du workflow ${executionId}:`, error);
      return false;
    }
  }
  
  /**
   * Termine l'exécution d'un workflow avec un résultat spécifique
   */
  async terminateExecution(executionId: string, reason: string, result?: any): Promise<boolean> {
    try {
      const handle = this.workflowClient.getHandle(executionId);
      await handle.terminate({
        reason,
        details: result
      });
      return true;
    } catch (error) {
      console.error(`Erreur lors de la terminaison du workflow ${executionId}:`, error);
      return false;
    }
  }

  /**
   * Envoie un signal à un workflow en cours d'exécution
   */
  async signalWorkflow(executionId: string, signalName: string, payload?: any): Promise<boolean> {
    try {
      const handle = this.workflowClient.getHandle(executionId);
      await handle.signal(signalName, payload);
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'envoi du signal ${signalName} au workflow ${executionId}:`, error);
      return false;
    }
  }

  /**
   * Planifie l'exécution d'un workflow avec les fonctionnalités complètes de scheduling
   */
  async scheduleWorkflow(
    workflowId: string, 
    cronExpression: string, 
    input?: any, 
    options?: TaskOptions
  ): Promise<string> {
    try {
      // Générer un ID unique pour le schedule
      const scheduleId = `schedule-${workflowId}-${Date.now()}`;
      
      // Options de planification avancées
      const scheduleOptions: ScheduleOptions = {
        spec: {
          cron: cronExpression
        },
        action: {
          type: 'startWorkflow',
          workflowType: workflowId,
          taskQueue: this.connectionOptions.taskQueue,
          args: [input],
          workflowId: `${workflowId}-scheduled-${Date.now()}`
        },
        policies: {
          overlap: options?.allowOverlap ? 
            ScheduleOverlapPolicy.ALLOW_ALL : 
            ScheduleOverlapPolicy.SKIP
        },
        state: {
          paused: options?.paused || false,
          note: options?.note
        }
      };
      
      // Créer la planification
      await this.scheduleClient.create(scheduleId, scheduleOptions);
      
      return scheduleId;
    } catch (error) {
      console.error(`Erreur lors de la planification du workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les informations d'une planification
   */
  async getScheduleInfo(scheduleId: string): Promise<any> {
    try {
      const handle = this.scheduleClient.getHandle(scheduleId);
      return await handle.describe();
    } catch (error) {
      console.error(`Erreur lors de la récupération des informations pour la planification ${scheduleId}:`, error);
      throw error;
    }
  }
  
  /**
   * Pause une planification existante
   */
  async pauseSchedule(scheduleId: string, note?: string): Promise<boolean> {
    try {
      const handle = this.scheduleClient.getHandle(scheduleId);
      await handle.pause(note);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise en pause de la planification ${scheduleId}:`, error);
      return false;
    }
  }
  
  /**
   * Reprend une planification mise en pause
   */
  async unpauseSchedule(scheduleId: string, note?: string): Promise<boolean> {
    try {
      const handle = this.scheduleClient.getHandle(scheduleId);
      await handle.unpause(note);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la reprise de la planification ${scheduleId}:`, error);
      return false;
    }
  }

  /**
   * Valide une définition de workflow
   */
  async validateWorkflowDefinition(workflowDefinition: WorkflowDefinition): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Vérifier que les champs obligatoires sont présents
    if (!workflowDefinition.id) {
      errors.push({
        code: 'MISSING_ID',
        message: 'L\'identifiant du workflow est requis'
      });
    }
    
    if (!workflowDefinition.tasks || workflowDefinition.tasks.length === 0) {
      errors.push({
        code: 'NO_TASKS',
        message: 'Le workflow doit contenir au moins une tâche'
      });
    }
    
    // Vérifier les dépendances entre les tâches
    if (workflowDefinition.tasks) {
      const taskIds = new Set(workflowDefinition.tasks.map(task => task.id));
      
      for (const task of workflowDefinition.tasks) {
        if (task.dependencies) {
          for (const dep of task.dependencies) {
            if (!taskIds.has(dep)) {
              errors.push({
                code: 'INVALID_DEPENDENCY',
                message: `La tâche ${task.id} dépend d'une tâche inexistante: ${dep}`,
                path: `tasks[${task.id}].dependencies`
              });
            }
          }
        }
      }
    }
    
    // Vérifier la présence de cycles dans les dépendances
    if (workflowDefinition.tasks && errors.length === 0) {
      const hasCycle = this.checkForCycles(workflowDefinition.tasks);
      if (hasCycle) {
        errors.push({
          code: 'CYCLIC_DEPENDENCY',
          message: 'Le workflow contient des dépendances cycliques'
        });
      }
    }
    
    // Vérifications spécifiques à Temporal
    if (workflowDefinition.id && !this.isValidTemporalIdentifier(workflowDefinition.id)) {
      warnings.push({
        code: 'INVALID_TEMPORAL_ID',
        message: 'L\'ID du workflow n\'est pas conforme aux bonnes pratiques Temporal (lettres, chiffres, tirets)'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Convertit un format de workflow générique vers le format Temporal
   */
  convertToNativeFormat(genericDefinition: WorkflowDefinition): any {
    // Conversion d'un format générique vers le format spécifique de Temporal
    const temporalWorkflow = {
      id: genericDefinition.id,
      taskQueue: this.connectionOptions.taskQueue,
      workflowType: genericDefinition.id,
      args: [genericDefinition],
      retry: this.connectionOptions.retryOptions,
      searchAttributes: {
        CustomStringField: genericDefinition.name || genericDefinition.id,
        CustomKeywordField: ['workflow', genericDefinition.version || '1.0.0'],
        CustomBoolField: true
      },
      memo: {
        description: genericDefinition.description || '',
        version: genericDefinition.version || '1.0.0',
        tags: genericDefinition.tags || []
      }
    };
    
    return temporalWorkflow;
  }

  /**
   * Convertit un format de workflow Temporal vers le format générique
   */
  convertFromNativeFormat(nativeDefinition: any): WorkflowDefinition {
    // Conversion du format spécifique de Temporal vers notre format générique
    const genericWorkflow: WorkflowDefinition = {
      id: nativeDefinition.id || nativeDefinition.workflowId || nativeDefinition.workflowType,
      name: nativeDefinition.memo?.description || nativeDefinition.workflowType,
      description: nativeDefinition.memo?.description || '',
      version: nativeDefinition.memo?.version || '1.0.0',
      tasks: [],
      tags: nativeDefinition.memo?.tags || []
    };
    
    // Si des tâches sont disponibles dans les arguments, les extraire
    if (nativeDefinition.args && nativeDefinition.args.length > 0 && nativeDefinition.args[0].tasks) {
      genericWorkflow.tasks = nativeDefinition.args[0].tasks;
    }
    
    return genericWorkflow;
  }

  /**
   * Vérifie l'état de santé de la connexion Temporal
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      // Vérifier si la connexion est active en effectuant une opération simple
      await this.workflowClient.describe({
        workflowId: 'health-check-dummy-id'
      }).catch(() => {
        // On s'attend à ce que cette opération échoue si l'ID n'existe pas,
        // mais cela confirme que la connexion fonctionne
      });
      
      return {
        status: 'healthy',
        details: {
          address: this.connectionOptions.address,
          namespace: this.connectionOptions.namespace || 'default'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Enregistre un gestionnaire d'erreurs
   */
  registerErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  /**
   * Enregistre une activité locale pour les tâches rapides et efficaces
   * @param name Nom de l'activité
   * @param implementation Fonction d'implémentation de l'activité
   * @param options Options spécifiques pour l'activité locale
   */
  async registerLocalActivity(
    name: string,
    implementation: (...args: any[]) => Promise<any> | any,
    options?: {
      startToCloseTimeout?: string;
      scheduleToCloseTimeout?: string;
      cancellationType?: 'WAIT_CANCELLATION_COMPLETED' | 'TRY_CANCEL' | 'ABANDON';
      retryPolicy?: {
        maximumAttempts?: number;
        initialInterval?: number;
        maximumInterval?: number;
        backoffCoefficient?: number;
        nonRetryableErrorTypes?: string[];
      };
    }
  ): Promise<void> {
    try {
      // Enregistrer une activité avec configuration spéciale pour les activités locales
      const activityOptions = {
        startToCloseTimeout: options?.startToCloseTimeout || '5s',
        scheduleToCloseTimeout: options?.scheduleToCloseTimeout,
        cancellationType: options?.cancellationType,
        retry: options?.retryPolicy ? {
          maximumAttempts: options.retryPolicy.maximumAttempts || 3,
          initialInterval: options.retryPolicy.initialInterval || 100,
          maximumInterval: options.retryPolicy.maximumInterval,
          backoffCoefficient: options.retryPolicy.backoffCoefficient || 2.0,
          nonRetryableErrorTypes: options.retryPolicy.nonRetryableErrorTypes
        } : undefined,
        // Marquer spécifiquement comme activité locale
        local: true
      };

      // Recréer le worker avec la nouvelle activité
      if (this.worker) {
        // Arrêter le worker existant
        await this.worker.shutdown();
        
        // Récupérer les options existantes du worker
        const existingOptions = {
          ...this.worker.options
        };
        
        // Ajouter la nouvelle activité aux activités existantes
        const activities = {
          ...existingOptions.activities || {},
          [name]: {
            fn: implementation,
            options: activityOptions
          }
        };
        
        // Recréer le worker avec les activités mises à jour
        this.worker = await Worker.create({
          ...existingOptions,
          activities
        });
        
        // Redémarrer le worker
        await this.worker.run();
      }
      
      console.log(`Activité locale '${name}' enregistrée avec succès`);
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de l'activité locale '${name}':`, error);
      throw new Error(`Échec de l'enregistrement de l'activité locale: ${error.message}`);
    }
  }

  /**
   * Exécute une opération par lot sur plusieurs workflows
   * @param operation Type d'opération (signal, terminate, cancel)
   * @param workflowIds Liste des IDs de workflow sur lesquels effectuer l'opération
   * @param options Options spécifiques selon le type d'opération
   * @returns Résultats de l'opération par lot
   */
  async executeBatchOperation(
    operation: 'signal' | 'terminate' | 'cancel' | 'reset',
    workflowIds: string[],
    options?: {
      signal?: {
        name: string;
        args?: any[];
      };
      terminate?: {
        reason: string;
        details?: any;
      };
      reset?: {
        reason: string;
        resetType: 'LastWorkflowTask' | 'LastContinuedAsNew' | 'FirstWorkflowTask';
      };
      concurrency?: number;  // Nombre d'opérations à exécuter en parallèle
    }
  ): Promise<{ 
    successful: string[]; 
    failed: Array<{ id: string, error: string }> 
  }> {
    // Résultats de l'opération
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ id: string, error: string }>
    };
    
    // Déterminer la concurrence maximale
    const concurrency = options?.concurrency || 10;
    
    // Diviser les workflows en lots pour le traitement parallèle
    const batches: string[][] = [];
    for (let i = 0; i < workflowIds.length; i += concurrency) {
      batches.push(workflowIds.slice(i, i + concurrency));
    }
    
    // Traiter chaque lot en séquence
    for (const batch of batches) {
      // Traiter tous les workflows dans le lot en parallèle
      const batchPromises = batch.map(async (workflowId) => {
        try {
          const handle = this.workflowClient.getHandle(workflowId);
          
          switch (operation) {
            case 'signal':
              if (!options?.signal?.name) {
                throw new Error('Le nom du signal est requis');
              }
              await handle.signal(options.signal.name, ...(options.signal.args || []));
              break;
              
            case 'terminate':
              await handle.terminate({
                reason: options?.terminate?.reason || 'Terminaison par lot',
                details: options?.terminate?.details
              });
              break;
              
            case 'cancel':
              await handle.cancel();
              break;
              
            case 'reset':
              if (!options?.reset) {
                throw new Error('Les options de réinitialisation sont requises');
              }
              
              await handle.reset({
                reason: options.reset.reason || 'Réinitialisation par lot',
                resetReapplyType: options.reset.resetType === 'LastWorkflowTask' ? 'ResetReapplyType.SIGNAL_ONLY' :
                                  options.reset.resetType === 'LastContinuedAsNew' ? 'ResetReapplyType.NONE' :
                                  'ResetReapplyType.SIGNAL_ONLY'
              });
              break;
              
            default:
              throw new Error(`Opération non supportée: ${operation}`);
          }
          
          // Si on arrive ici, l'opération a réussi
          return { success: true, id: workflowId };
        } catch (error) {
          // L'opération a échoué
          return { 
            success: false, 
            id: workflowId, 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      });
      
      // Attendre que toutes les opérations du lot soient terminées
      const batchResults = await Promise.all(batchPromises);
      
      // Traiter les résultats
      for (const result of batchResults) {
        if (result.success) {
          results.successful.push(result.id);
        } else {
          results.failed.push({ id: result.id, error: (result as any).error });
        }
      }
    }
    
    return results;
  }

  /**
   * Vérifie si un identifiant est valide pour Temporal
   */
  private isValidTemporalIdentifier(id: string): boolean {
    // Les identifiants Temporal doivent suivre certaines règles
    return /^[a-zA-Z0-9-_]+$/.test(id);
  }

  /**
   * Mappe les statuts Temporal vers les statuts JobStatus
   */
  private mapTemporalStatusToJobStatus(temporalStatus: string): JobStatus {
    switch (temporalStatus) {
      case 'COMPLETED':
        return JobStatus.COMPLETED;
      case 'FAILED':
        return JobStatus.FAILED;
      case 'CANCELED':
        return JobStatus.CANCELED;
      case 'TERMINATED':
        return JobStatus.TERMINATED;
      case 'CONTINUED_AS_NEW':
      case 'RUNNING':
        return JobStatus.RUNNING;
      case 'TIMED_OUT':
        return JobStatus.TIMEOUT;
      default:
        return JobStatus.UNKNOWN;
    }
  }

  /**
   * Vérifie la présence de cycles dans les dépendances des tâches
   */
  private checkForCycles(tasks: any[]): boolean {
    // Implémentation de la détection de cycle avec l'algorithme DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycleFromNode = (taskId: string): boolean => {
      // Si déjà dans la pile de récursion, cycle détecté
      if (recursionStack.has(taskId)) return true;
      
      // Si déjà visité et pas de cycle détecté, on peut sauter
      if (visited.has(taskId)) return false;
      
      // Marquer comme visité et ajouter à la pile de récursion
      visited.add(taskId);
      recursionStack.add(taskId);
      
      // Trouver la tâche actuelle
      const currentTask = tasks.find(t => t.id === taskId);
      if (currentTask && currentTask.dependencies) {
        for (const dep of currentTask.dependencies) {
          if (hasCycleFromNode(dep)) return true;
        }
      }
      
      // Retirer de la pile de récursion
      recursionStack.delete(taskId);
      return false;
    };
    
    // Vérifier chaque tâche
    for (const task of tasks) {
      if (!visited.has(task.id) && hasCycleFromNode(task.id)) {
        return true;
      }
    }
    
    return false;
  }
}