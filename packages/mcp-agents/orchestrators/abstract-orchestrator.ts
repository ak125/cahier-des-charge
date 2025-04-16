// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractOrchestratorAgent, OrchestratorConfig } from '../../core/abstract-orchestrator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractOrchestratorAgent, OrchestratorConfig } from '../../core/abstract-orchestrator-agent';
import { AgentContext } from '../../core/mcp-agent';

import { OrchestratorAgent, OrchestratorConfig, WorkflowDefinition, WorkflowExecutionState, JobStatus } from '../core/interfaces/orchestrator-agent';
import { AgentHealthState, AgentStatus } from '../core/interfaces/base-agent';

/**
 * Classe abstraite pour les agents d'orchestration
 * Fournit une implémentation de base des méthodes communes
 */
export abstract class AbstractOrchestratorAgent implements OrchestratorAgent {
  /**
   * Identifiant unique de l'agent
   */
  public abstract id: string;

  /**
   * Version de l'agent
   */
  public abstract version: string;

  /**
   * Nom descriptif de l'agent
   */
  public abstract name: string;

  /**
   * Description des fonctionnalités de l'agent
   */
  public abstract description: string;

  /**
   * Configuration de l'orchestrateur
   */
  public config: OrchestratorConfig = {
    timeout: 3600000, // 1 heure par défaut
    retryCount: 3,
    enabled: true,
    logLevel: 'info',
    maxConcurrentJobs: 10,
    maxRetries: 3,
    baseRetryDelay: 1000,
    schedulingPolicy: 'fifo',
    persistence: {
      enabled: true,
      storageType: 'memory'
    }
  };

  private _status: AgentStatus = {
    health: AgentHealthState.STOPPED,
    successCount: 0,
    failureCount: 0,
    details: {
      activeWorkflows: 0,
      completedWorkflows: 0,
      failedWorkflows: 0
    }
  };

  /**
   * Initialise l'agent avec sa configuration
   * @param config Configuration spécifique à l'agent
   */
  public async initialize(config?: OrchestratorConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this._status.health = AgentHealthState.STARTING;
    
    try {
      await this.initializeInternal();
      this._status.health = AgentHealthState.HEALTHY;
    } catch (error) {
      this._status.health = AgentHealthState.UNHEALTHY;
      throw error;
    }
  }

  /**
   * Méthode d'initialisation spécifique à implémenter par les classes dérivées
   */
  protected abstract initializeInternal(): Promise<void>;

  /**
   * Exécute un workflow
   * @param input Données d'entrée pour le workflow
   * @param context Contexte d'exécution
   */
  public async run(input: { workflowId: string; input?: any; options?: any }, context?: any): Promise<WorkflowExecutionState> {
    const startTime = Date.now();
    
    try {
      if (!input.workflowId) {
        throw new Error('Le workflowId est requis pour exécuter un workflow');
      }
      
      const result = await this.executeWorkflow(
        input.workflowId, 
        input.input,
        input.options
      );
      
      this._status.lastRun = new Date();
      this._status.lastRunDuration = Date.now() - startTime;
      this._status.successCount = (this._status.successCount || 0) + 1;
      
      return result;
    } catch (error) {
      this._status.lastRun = new Date();
      this._status.lastRunDuration = Date.now() - startTime;
      this._status.failureCount = (this._status.failureCount || 0) + 1;
      
      throw error;
    }
  }

  /**
   * Déploie un workflow dans le système d'orchestration
   */
  public abstract deployWorkflow(workflow: WorkflowDefinition): Promise<string>;

  /**
   * Démarre l'exécution d'un workflow
   */
  public abstract executeWorkflow(workflowId: string, input?: any, options?: {
    detached?: boolean;
    priority?: number;
    idempotencyKey?: string;
    searchAttributes?: Record<string, any>;
  }): Promise<WorkflowExecutionState>;

  /**
   * Récupère l'état d'exécution d'un workflow
   */
  public abstract getExecutionState(executionId: string): Promise<WorkflowExecutionState>;

  /**
   * Annule l'exécution d'un workflow
   */
  public abstract cancelExecution(executionId: string, reason?: string): Promise<boolean>;

  /**
   * Récupère l'historique d'exécution d'un workflow
   */
  public abstract getExecutionHistory(executionId: string): Promise<any[]>;

  /**
   * Planifie l'exécution d'un workflow selon une expression cron
   */
  public abstract scheduleWorkflow(workflowId: string, cronExpression: string, input?: any): Promise<string>;

  /**
   * Liste les workflows déployés
   */
  public abstract listWorkflows(query?: { tags?: string[]; version?: string }): Promise<Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    tags?: string[];
  }>>;

  /**
   * Liste les exécutions de workflows
   */
  public abstract listExecutions(query?: {
    workflowId?: string;
    status?: JobStatus[];
    timeRange?: { start?: Date; end?: Date };
    limit?: number;
    offset?: number;
  }): Promise<Array<{
    executionId: string;
    workflowId: string;
    status: JobStatus;
    startTime: Date;
    endTime?: Date;
  }>>;

  /**
   * Envoie un signal à un workflow en cours d'exécution
   */
  public abstract signalWorkflow(executionId: string, signalName: string, payload?: any): Promise<boolean>;

  /**
   * Récupère le statut actuel de l'agent
   */
  public async getStatus(): Promise<AgentStatus> {
    // Obtenir les statistiques à jour
    try {
      const updatedStats = await this.getOrchestratorStats();
      this._status.details = {
        ...this._status.details,
        ...updatedStats
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
    
    return { ...this._status };
  }

  /**
   * Récupère les statistiques de l'orchestrateur
   */
  protected abstract getOrchestratorStats(): Promise<Record<string, any>>;

  /**
   * Libère les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    try {
      await this.cleanupInternal();
      this._status.health = AgentHealthState.STOPPED;
    } catch (error) {
      this._status.health = AgentHealthState.DEGRADED;
      throw error;
    }
  }

  /**
   * Méthode de nettoyage spécifique à implémenter par les classes dérivées
   */
  protected abstract cleanupInternal(): Promise<void>;
}