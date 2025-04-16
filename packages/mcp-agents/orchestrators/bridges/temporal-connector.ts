import { AbstractOrchestratorAgent } from '../abstract-orchestrator';
/**
 * Connecteur d'orchestration pour Temporal.io
 * 
 * Implémentation de l'interface OrchestrationConnector pour Temporal.io.
 * Ce connecteur permet d'intégrer des workflows Temporal pour l'orchestration de longue durée.
 */

import { EventEmitter } from 'events';
import {
  OrchestrationConnector,
  OrchestrationConnectorConfig,
  OrchestrationJob,
  WorkflowDefinition,
  ExecutionResult
} from '../interfaces/orchestration-connector';

// Import du SDK officiel de Temporal.io
import { Connection, Client, WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { WorkflowExecutionStatus } from '@temporalio/common';

/**
 * Configuration spécifique pour le connecteur Temporal
 */
interface TemporalConnectorConfig extends OrchestrationConnectorConfig {
  namespace?: string;
  address?: string;
  taskQueue: string;
  workflowDuration?: number; // durée maximale d'exécution en ms
}

/**
 * Adaptateur d'orchestration basé sur Temporal.io
 */
export class TemporalConnector extends AbstractOrchestratorAgent<any, any> implements OrchestrationConnector {
  private config: TemporalConnectorConfig;
  private client: WorkflowClient | null = null;
  private worker: Worker | null = null;
  private workflows: Map<string, any> = new Map();
  private activities: Map<string, any> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private isInitialized: boolean = false;

  constructor(config: TemporalConnectorConfig) {
    this.config = {
      ...config,
      namespace: config.namespace || 'default',
      address: config.address || 'localhost:7233',
      workflowDuration: config.workflowDuration || 24 * 60 * 60 * 1000 // 24h par défaut
    };
  }

  /**
   * Initialise la connexion avec le serveur Temporal
   */
  public protected async initializeInternal(): Promise<void> {
  protected async cleanupInternal(): Promise<void> {
    // Nettoyage des ressources
  }

    try {
      // Création de la connexion à Temporal Server
      const connection = await Connection.connect({
        address: this.config.address,
      });

      // Création du client Temporal
      this.client = new Client({
        connection,
        namespace: this.config.namespace,
      });

      // Configuration réussie
      this.isInitialized = true;
      console.log(`Connecteur Temporal.io initialisé sur ${this.config.address}, namespace: ${this.config.namespace}`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du connecteur Temporal:', error);
      throw new Error(`Échec de l'initialisation du connecteur Temporal: ${error}`);
    }
  }

  /**
   * Enregistre un workflow dans Temporal
   */
  public async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      // Stockage local de la définition du workflow
      this.workflows.set(workflow.name, workflow.implementation);

      // Enregistrement des activités associées
      if (workflow.activities) {
        for (const activity of workflow.activities) {
          this.activities.set(activity.name, activity.implementation);
        }
      }

      // Création du worker si nécessaire
      if (!this.worker) {
        this.worker = await Worker.create({
          workflowsPath: require.resolve('./temporal-workflow-wrappers'),
          activities: Object.fromEntries(this.activities),
          taskQueue: this.config.taskQueue,
        });

        // Démarrage du worker
        await this.worker.run();
      }

      console.log(`Workflow '${workflow.name}' enregistré avec succès dans Temporal`);
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement du workflow '${workflow.name}':`, error);
      throw new Error(`Échec de l'enregistrement du workflow '${workflow.name}': ${error}`);
    }
  }

  /**
   * Enregistre une activité locale pour les opérations rapides et efficaces
   * @param name Nom de l'activité
   * @param implementation Implémentation de l'activité 
   * @param options Options spécifiques pour l'activité locale
   */
  public registerLocalActivity(
    name: string,
    implementation: (...args: any[]) => Promise<any> | any,
    options?: {
      startToCloseTimeout?: string;
      scheduleToCloseTimeout?: string;
      cancellationType?: 'WAIT_CANCELLATION_COMPLETED' | 'TRY_CANCEL' | 'ABANDON';
      retryPolicy?: {
        maximumAttempts?: number;
        initialInterval?: number; // en ms
        maximumInterval?: number; // en ms
        backoffCoefficient?: number;
        nonRetryableErrorTypes?: string[];
      };
    }
  ): void {
    if (!this.isInitialized) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      // Enregistrer l'activité avec l'option "local" activée
      this.activities.set(name, {
        implementation,
        localOptions: {
          startToCloseTimeout: options?.startToCloseTimeout || '5s',
          scheduleToCloseTimeout: options?.scheduleToCloseTimeout,
          cancellationType: options?.cancellationType,
          retry: options?.retryPolicy ? {
            maximumAttempts: options.retryPolicy.maximumAttempts || 3,
            initialInterval: `${options.retryPolicy.initialInterval || 100}ms`,
            maximumInterval: options.retryPolicy.maximumInterval ? `${options.retryPolicy.maximumInterval}ms` : undefined,
            backoffCoefficient: options.retryPolicy.backoffCoefficient || 2.0,
            nonRetryableErrorTypes: options.retryPolicy.nonRetryableErrorTypes
          } : undefined
        }
      });

      console.log(`Activité locale '${name}' enregistrée avec succès`);
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de l'activité locale '${name}':`, error);
      throw error;
    }
  }

  /**
   * Exécute un workflow enregistré
   */
  public async executeWorkflow(
    workflowName: string,
    input: any,
    options?: { workflowId?: string }
  ): Promise<string> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    if (!this.workflows.has(workflowName)) {
      throw new Error(`Workflow '${workflowName}' non enregistré`);
    }

    try {
      // Création d'un ID unique si non fourni
      const workflowId = options?.workflowId || `${workflowName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Exécution du workflow via le client Temporal
      const handle = await this.client.start(workflowName, {
        args: [input],
        taskQueue: this.config.taskQueue,
        workflowId: workflowId,
        workflowExecutionTimeout: this.config.workflowDuration
          ? `${Math.floor(this.config.workflowDuration / 1000)}s`
          : undefined,
      });

      console.log(`Workflow '${workflowName}' démarré avec l'ID: ${workflowId}`);
      return workflowId;
    } catch (error) {
      console.error(`Erreur lors de l'exécution du workflow '${workflowName}':`, error);
      throw new Error(`Échec de l'exécution du workflow '${workflowName}': ${error}`);
    }
  }

  /**
   * Exécute un workflow avec une version spécifique
   * @param workflowName Nom du workflow à exécuter
   * @param input Données d'entrée pour le workflow
   * @param version Version du workflow (format semver recommandé)
   * @param options Options d'exécution supplémentaires
   * @returns ID d'exécution du workflow
   */
  public async executeWorkflowWithVersion(
    workflowName: string,
    input: any,
    version: string,
    options?: { 
      workflowId?: string,
      memo?: Record<string, any>,
      searchAttributes?: Record<string, any>
    }
  ): Promise<string> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }
  
    if (!this.workflows.has(workflowName)) {
      throw new Error(`Workflow '${workflowName}' non enregistré`);
    }
  
    try {
      // Création d'un ID unique si non fourni
      const workflowId = options?.workflowId || `${workflowName}-${version}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Préparation des mémo pour inclure la version
      const memo = {
        ...options?.memo || {},
        version
      };
  
      // Préparation des attributs de recherche pour inclure la version
      const searchAttributes = {
        ...options?.searchAttributes || {},
        VersionTag: version
      };
      
      // Exécution du workflow via le client Temporal
      const handle = await this.client.start(workflowName, {
        args: [input],
        taskQueue: this.config.taskQueue,
        workflowId: workflowId,
        workflowExecutionTimeout: this.config.workflowDuration
          ? `${Math.floor(this.config.workflowDuration / 1000)}s`
          : undefined,
        memo,
        searchAttributes,
        // Utilisation de la stratégie de réutilisation d'ID pour gérer les versions
        workflowIdReusePolicy: 'WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE',
      });
  
      console.log(`Workflow '${workflowName}' version '${version}' démarré avec l'ID: ${workflowId}`);
      return workflowId;
    } catch (error) {
      console.error(`Erreur lors de l'exécution du workflow '${workflowName}' version '${version}':`, error);
      throw new Error(`Échec de l'exécution du workflow '${workflowName}' version '${version}': ${error}`);
    }
  }

  /**
   * Récupère le résultat d'un workflow
   */
  public async getWorkflowResult(workflowId: string): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      // Récupération du handle du workflow
      const handle: WorkflowHandle = this.client.getHandle(workflowId);
      
      // Vérification du statut du workflow
      const description = await handle.describe();
      const status = description.status.name;
      
      // Traitement selon le statut
      if (status === WorkflowExecutionStatus.COMPLETED) {
        try {
          const result = await handle.result();
          return { status: 'completed', result };
        } catch (error) {
          // Gestion propre des erreurs lors de la récupération du résultat
          console.warn(`Workflow ${workflowId} est complété mais erreur lors de la récupération du résultat:`, error);
          return { status: 'completed', result: null, warning: 'Résultat indisponible' };
        }
      } else if (status === WorkflowExecutionStatus.FAILED) {
        // Récupérer les détails de l'erreur si disponibles
        try {
          const failure = await handle.failure();
          return { 
            status: 'failed', 
            error: failure?.message || 'Workflow execution failed',
            details: {
              failureType: failure?.cause?.type,
              stackTrace: failure?.stackTrace
            }
          };
        } catch {
          return { status: 'failed', error: 'Workflow execution failed' };
        }
      } else if (status === WorkflowExecutionStatus.CANCELED) {
        return { status: 'cancelled' };
      } else if (status === WorkflowExecutionStatus.TERMINATED) {
        return { status: 'terminated', reason: description.historyEvents?.find(e => e.eventType === 'WorkflowExecutionTerminated')?.attributes?.reason || 'Unknown reason' };
      } else if (status === WorkflowExecutionStatus.TIMED_OUT) {
        return { status: 'timedout', error: 'Workflow execution timed out' };
      } else {
        // En cours d'exécution ou en attente
        return { 
          status: 'running', 
          executionInfo: {
            startTime: description.startTime,
            executionTime: description.executionTime,
            taskQueue: description.taskQueue
          }
        };
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du résultat pour le workflow ${workflowId}:`, error);
      return { status: 'error', error: `${error}` };
    }
  }

  /**
   * Récupère l'historique complet d'exécution d'un workflow
   * @param workflowId ID du workflow
   * @returns Historique complet de l'exécution
   */
  public async getWorkflowHistory(workflowId: string): Promise<any> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      const handle = this.client.getHandle(workflowId);
      return await handle.fetchHistory();
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique pour ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour l'état du workflow pour les workflows de longue durée (continueAsNew)
   * @param workflowId ID du workflow à mettre à jour
   * @param updateName Nom de la mise à jour
   * @param args Arguments pour la mise à jour
   */
  public async updateWorkflow(workflowId: string, updateName: string, ...args: any[]): Promise<any> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      const handle = this.client.getHandle(workflowId);
      
      // Vérifier que le workflow est en cours d'exécution
      const description = await handle.describe();
      if (description.status.name !== WorkflowExecutionStatus.RUNNING) {
        throw new Error(`Impossible de mettre à jour le workflow ${workflowId}: statut ${description.status.name}`);
      }
      
      // Appel à l'API Update de Temporal
      return await handle.update(updateName, ...args);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du workflow ${workflowId} avec ${updateName}:`, error);
      throw error;
    }
  }

  /**
   * Soumet une tâche à exécuter dans le workflow
   */
  public async submitJob(job: OrchestrationJob): Promise<string> {
    return this.executeWorkflow(job.type, job.payload, {
      workflowId: job.id
    });
  }

  /**
   * Termine un workflow en cours
   */
  public async terminateWorkflow(workflowId: string, reason?: string): Promise<void> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      const handle = this.client.getHandle(workflowId);
      await handle.terminate({
        reason: reason || 'Terminaison manuelle'
      });
      console.log(`Workflow ${workflowId} terminé. Raison: ${reason || 'Terminaison manuelle'}`);
    } catch (error) {
      console.error(`Erreur lors de la terminaison du workflow ${workflowId}:`, error);
      throw new Error(`Échec de la terminaison du workflow ${workflowId}: ${error}`);
    }
  }

  /**
   * Met en pause un workflow en cours
   */
  public async pauseWorkflow(workflowId: string): Promise<void> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }
    
    try {
      // Utilisation de l'Update API pour mettre en pause le workflow
      // Note: Nécessite que le workflow implémente la gestion de pause
      const handle = this.client.getHandle(workflowId);
      await handle.update('pauseWorkflow');
      console.log(`Workflow ${workflowId} mis en pause`);
    } catch (error) {
      console.error(`Erreur lors de la mise en pause du workflow ${workflowId}:`, error);
      throw new Error(`Échec de la mise en pause du workflow ${workflowId}: ${error}`);
    }
  }

  /**
   * Reprend un workflow en pause
   */
  public async resumeWorkflow(workflowId: string): Promise<void> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }
    
    try {
      // Utilisation de l'Update API pour reprendre le workflow
      // Note: Nécessite que le workflow implémente la gestion de pause
      const handle = this.client.getHandle(workflowId);
      await handle.update('resumeWorkflow');
      console.log(`Workflow ${workflowId} repris`);
    } catch (error) {
      console.error(`Erreur lors de la reprise du workflow ${workflowId}:`, error);
      throw new Error(`Échec de la reprise du workflow ${workflowId}: ${error}`);
    }
  }

  /**
   * Exécute une requête sur un workflow en cours d'exécution
   * @param workflowId ID du workflow à interroger
   * @param queryType Type de requête à exécuter
   * @param args Arguments optionnels de la requête
   * @returns Le résultat de la requête ou null en cas d'erreur
   */
  public async queryWorkflow(workflowId: string, queryType: string, args?: any[]): Promise<any> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      const handle = this.client.getHandle(workflowId);
      
      // Vérifier que le workflow est toujours en cours d'exécution
      const description = await handle.describe();
      if (description.status.name !== WorkflowExecutionStatus.RUNNING) {
        throw new Error(`Le workflow ${workflowId} n'est pas en cours d'exécution (statut: ${description.status.name})`);
      }
      
      // Exécuter la requête sur le workflow
      const result = await handle.query(queryType, ...(args || []));
      return result;
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la requête ${queryType} sur le workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des workflows selon des critères spécifiques
   * @param query Critères de recherche sous forme d'objet
   * @param options Options de pagination et tri
   * @returns Liste des workflows correspondant aux critères
   */
  public async searchWorkflows(query: {
    status?: 'OPEN' | 'CLOSED' | 'ALL',
    workflowType?: string,
    executionTimeFrom?: Date,
    executionTimeTo?: Date,
    [key: string]: any
  }, options?: {
    pageSize?: number,
    nextPageToken?: Uint8Array,
    maximumPageSize?: number
  }): Promise<{ executions: any[], nextPageToken?: Uint8Array }> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      // Construction de la requête de recherche avec les attributs de recherche
      const searchAttributes: Record<string, any> = {};
      
      // Ajouter les attributs de recherche standards
      if (query.workflowType) {
        searchAttributes.WorkflowType = query.workflowType;
      }
      
      // Mapper les attributs personnalisés
      Object.keys(query).forEach(key => {
        if (!['status', 'workflowType', 'executionTimeFrom', 'executionTimeTo'].includes(key)) {
          // Convertir camelCase en PascalCase pour les attributs de recherche personnalisés
          const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
          searchAttributes[pascalCaseKey] = query[key];
        }
      });

      // Exécuter la recherche
      const result = await this.client.workflow.list({
        query: Object.keys(searchAttributes).length > 0 
          ? this.buildSearchAttributesQuery(searchAttributes) 
          : undefined,
        statuses: query.status === 'OPEN' ? ['OPEN'] : 
                  query.status === 'CLOSED' ? ['CLOSED'] : undefined,
        startTimeFilter: {
          earliestTime: query.executionTimeFrom,
          latestTime: query.executionTimeTo
        },
        pageSize: options?.pageSize || 20,
        nextPageToken: options?.nextPageToken,
        maximumPageSize: options?.maximumPageSize
      });

      return {
        executions: result.executions,
        nextPageToken: result.nextPageToken
      };
    } catch (error) {
      console.error('Erreur lors de la recherche de workflows:', error);
      throw error;
    }
  }

  /**
   * Construit une requête d'attributs de recherche pour Temporal
   */
  private buildSearchAttributesQuery(attributes: Record<string, any>): string {
    const conditions = Object.entries(attributes).map(([key, value]) => {
      if (Array.isArray(value)) {
        // Pour les tableaux, construire une condition IN
        const values = value.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
        return `${key} IN (${values})`;
      } else if (typeof value === 'string') {
        return `${key} = '${value}'`;
      } else {
        return `${key} = ${value}`;
      }
    });
    
    return conditions.join(' AND ');
  }

  /**
   * S'abonne aux événements d'un workflow spécifique
   */
  public subscribeToWorkflowEvents(workflowId: string, callback: (event: any) => void): void {
    // Nous utilisons ici un mécanisme d'événements local pour simplifier
    // Une implémentation plus avancée pourrait utiliser l'API de polling de Temporal
    this.eventEmitter.on(`workflow:${workflowId}`, callback);
    
    // Démarre un processus de polling en arrière-plan pour vérifier les mises à jour
    this.startWorkflowPolling(workflowId);
  }

  /**
   * Démarre un processus de polling pour surveiller un workflow
   */
  private async startWorkflowPolling(workflowId: string): Promise<void> {
    if (!this.isInitialized || !this.client) {
      return;
    }
    
    const pollingInterval = 5000; // 5 secondes
    let lastStatus: string | null = null;
    
    const poll = async () => {
      try {
        const handle = this.client!.getHandle(workflowId);
        const description = await handle.describe();
        const status = description.status.name;
        
        // Émet un événement uniquement si le statut a changé
        if (status !== lastStatus) {
          lastStatus = status;
          this.eventEmitter.emit(`workflow:${workflowId}`, {
            type: 'status',
            workflowId,
            status,
            timestamp: Date.now()
          });
          
          // Si le workflow est terminé (succès, échec ou annulation), arrête le polling
          if ([WorkflowExecutionStatus.COMPLETED, WorkflowExecutionStatus.FAILED, WorkflowExecutionStatus.CANCELED].includes(status as any)) {
            clearInterval(intervalId);
            
            // Récupération du résultat si terminé avec succès
            if (status === WorkflowExecutionStatus.COMPLETED) {
              try {
                const result = await handle.result();
                this.eventEmitter.emit(`workflow:${workflowId}`, {
                  type: 'result',
                  workflowId,
                  result,
                  timestamp: Date.now()
                });
              } catch (error) {
                // En cas d'erreur lors de la récupération du résultat
                console.error(`Erreur lors de la récupération du résultat pour ${workflowId}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Erreur lors du polling du workflow ${workflowId}:`, error);
        clearInterval(intervalId);
      }
    };
    
    // Démarre le polling immédiatement puis à intervalle régulier
    poll();
    const intervalId = setInterval(poll, pollingInterval);
  }
  
  /**
   * Se désabonne des événements d'un workflow
   */
  public unsubscribeFromWorkflowEvents(workflowId: string, callback: (event: any) => void): void {
    this.eventEmitter.off(`workflow:${workflowId}`, callback);
  }
  
  /**
   * Nettoie les ressources avant la fermeture
   */
  public async close(): Promise<void> {
    try {
      if (this.worker) {
        await this.worker.shutdown();
        this.worker = null;
      }
      
      // Le client Temporal n'a pas besoin d'être fermé explicitement
      this.client = null;
      this.isInitialized = false;
      
      console.log('Connecteur Temporal fermé avec succès');
    } catch (error) {
      console.error('Erreur lors de la fermeture du connecteur Temporal:', error);
    }
  }
}