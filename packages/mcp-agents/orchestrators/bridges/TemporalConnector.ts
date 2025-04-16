import { AbstractOrchestratorAgent } from '../abstract-orchestrator';
import { EventEmitter } from 'events';
import { Connection, Client } from '@temporalio/client';
import { OrchestrationConnector } from './OrchestrationConnector';

/**
 * Configuration pour le connecteur Temporal
 */
export interface TemporalConnectorConfig {
  /**
   * URL du service Temporal
   */
  serverUrl: string;
  
  /**
   * Namespace Temporal à utiliser
   */
  namespace: string;
  
  /**
   * Options de connexion additionnelles
   */
  connectionOptions?: any;
}

/**
 * Implémentation de l'adaptateur d'orchestration pour Temporal.io
 */
export class TemporalConnector extends AbstractOrchestratorAgent<any, any> implements OrchestrationConnector {
  private client: Client | null = null;
  private connection: Connection | null = null;
  private config: TemporalConnectorConfig | null = null;
  private eventEmitter: EventEmitter = new EventEmitter();
  private workflowDefinitions: Map<string, any> = new Map();

  /**
   * Initialise la connexion au serveur Temporal
   * @param config Configuration de connexion à Temporal
   */
  protected async initializeInternal(): Promise<void> {
  protected async cleanupInternal(): Promise<void> {
    // Nettoyage des ressources
  }

    try {
      this.config = config;
      
      // Établir la connexion
      this.connection = await Connection.connect({
        address: config.serverUrl,
        ...config.connectionOptions
      });
      
      // Créer le client avec le namespace spécifié
      this.client = new Client({
        connection: this.connection,
        namespace: config.namespace
      });
      
      this.eventEmitter.emit('connected', { status: 'connected', serverUrl: config.serverUrl });
      console.log(`Connecté au serveur Temporal: ${config.serverUrl}, namespace: ${config.namespace}`);
    } catch (error) {
      this.eventEmitter.emit('error', { type: 'connection', error });
      console.error('Erreur lors de l\'initialisation du connecteur Temporal:', error);
      throw error;
    }
  }

  /**
   * Démarre l'exécution d'un workflow
   * @param workflowId Identifiant du workflow
   * @param input Données d'entrée pour le workflow
   * @param options Options du workflow (taskQueue, workflowId personnalisé, etc.)
   * @returns ID de l'exécution du workflow
   */
  async startWorkflow(workflowId: string, input: any, options?: any): Promise<string> {
    if (!this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      const definition = this.workflowDefinitions.get(workflowId);
      if (!definition) {
        throw new Error(`Définition de workflow non trouvée pour l'ID: ${workflowId}`);
      }

      const defaultOptions = {
        taskQueue: 'default',
        workflowId: `${workflowId}-${Date.now()}`,
        ...options
      };

      const result = await this.client.workflow.start(definition.workflowName, {
        args: [input],
        workflowId: defaultOptions.workflowId,
        taskQueue: defaultOptions.taskQueue,
        ...defaultOptions
      });

      this.eventEmitter.emit('workflowStarted', { 
        workflowId, 
        executionId: result.workflowId,
        input 
      });
      
      return result.workflowId;
    } catch (error) {
      this.eventEmitter.emit('error', { 
        type: 'startWorkflow', 
        workflowId, 
        error 
      });
      console.error(`Erreur lors du démarrage du workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère l'état d'exécution d'un workflow
   * @param executionId ID de l'exécution du workflow
   * @returns État actuel du workflow
   */
  async getWorkflowStatus(executionId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      const handle = this.client.workflow.getHandle(executionId);
      const description = await handle.describe();
      
      return {
        id: executionId,
        status: description.status.name,
        startTime: description.startTime,
        historyEvents: description.historyLength,
        executionTime: description.executionTime,
        closeTime: description.closeTime,
        taskQueue: description.taskQueue,
      };
    } catch (error) {
      this.eventEmitter.emit('error', { 
        type: 'getStatus', 
        executionId, 
        error 
      });
      console.error(`Erreur lors de la récupération du statut du workflow ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Annule l'exécution d'un workflow en cours
   * @param executionId ID de l'exécution du workflow
   * @returns true si l'annulation a réussi
   */
  async cancelWorkflow(executionId: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Le connecteur Temporal n\'est pas initialisé');
    }

    try {
      const handle = this.client.workflow.getHandle(executionId);
      await handle.cancel();
      
      this.eventEmitter.emit('workflowCancelled', { executionId });
      return true;
    } catch (error) {
      this.eventEmitter.emit('error', { 
        type: 'cancelWorkflow', 
        executionId, 
        error 
      });
      console.error(`Erreur lors de l'annulation du workflow ${executionId}:`, error);
      return false;
    }
  }

  /**
   * Enregistre une nouvelle définition de workflow
   * @param workflowId Identifiant du workflow
   * @param definition Définition du workflow
   */
  async registerWorkflow(workflowId: string, definition: any): Promise<void> {
    if (!definition.workflowName) {
      throw new Error('La définition du workflow doit contenir un nom de workflow (workflowName)');
    }
    
    this.workflowDefinitions.set(workflowId, definition);
    this.eventEmitter.emit('workflowRegistered', { workflowId, definition });
  }

  /**
   * Met à jour une définition de workflow existante
   * @param workflowId Identifiant du workflow
   * @param definition Nouvelle définition du workflow
   */
  async updateWorkflow(workflowId: string, definition: any): Promise<void> {
    if (!this.workflowDefinitions.has(workflowId)) {
      throw new Error(`Aucun workflow trouvé avec l'ID: ${workflowId}`);
    }
    
    this.workflowDefinitions.set(workflowId, definition);
    this.eventEmitter.emit('workflowUpdated', { workflowId, definition });
  }

  /**
   * Récupère la définition d'un workflow
   * @param workflowId Identifiant du workflow
   */
  async getWorkflowDefinition(workflowId: string): Promise<any> {
    const definition = this.workflowDefinitions.get(workflowId);
    if (!definition) {
      throw new Error(`Aucun workflow trouvé avec l'ID: ${workflowId}`);
    }
    
    return definition;
  }

  /**
   * Vérifie si le serveur Temporal est accessible
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client || !this.connection) {
      return false;
    }

    try {
      // Une simple requête pour vérifier la connexion
      await this.connection.serviceClient.checkHealth();
      return true;
    } catch (error) {
      console.error('Erreur lors du health check Temporal:', error);
      return false;
    }
  }

  /**
   * Arrête proprement le connecteur
   */
  async shutdown(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.client = null;
      this.eventEmitter.emit('disconnected');
    }
  }

  /**
   * Fournit l'émetteur d'événements pour s'abonner aux notifications
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }
}