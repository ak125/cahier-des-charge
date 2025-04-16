// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractOrchestratorAgent, OrchestratorConfig } from '../../core/abstract-orchestrator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractOrchestratorAgent, OrchestratorConfig } from '../../core/abstract-orchestrator-agent';
import { AgentContext } from '../../core/mcp-agent';

/**
 * BaseOrchestratorAgent - Classe de base pour tous les agents d'orchestration
 * 
 * Cette classe implémente la couche d'abstraction pour les agents d'orchestration
 * et fournit des fonctionnalités communes à tous les orchestrateurs.
 */

import { BaseMcpAgent, AgentContext, AgentResult, AgentConfig } from '../core/interfaces';
import { EventEmitter } from 'events';

// Configuration spécifique aux agents d'orchestration
export interface OrchestratorAgentConfig extends AgentConfig {
  // Configurations spécifiques aux orchestrateurs
  agentsToUse?: string[];
  maxParallelExecutions?: number;
  continueOnError?: boolean;
  retryStrategy?: {
    maxRetries: number;
    delayMs: number;
    backoffFactor: number;
  };
  webhooks?: {
    onStart?: string;
    onProgress?: string;
    onComplete?: string;
    onError?: string;
  };
  statusFilePath?: string;
  outputFormat?: 'simple' | 'detailed' | 'json';
}

// Résultat spécifique aux agents d'orchestration
export interface OrchestrationResult {
  // Résultats spécifiques aux orchestrateurs
  completedSteps: Array<{
    agentId: string;
    status: 'success' | 'warning' | 'error' | 'skipped';
    score?: number;
    result?: any;
    duration: number;
  }>;
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    skippedSteps: number;
    overallStatus: 'success' | 'partial' | 'failed';
    duration: number;
    startTime: string;
    endTime: string;
  };
  artifacts?: Array<{
    agentId: string;
    path: string;
    type: string;
  }>;
}

// Événements spécifiques aux orchestrateurs
export enum OrchestratorEvent {
  WORKFLOW_STARTED = 'workflow:started',
  WORKFLOW_COMPLETED = 'workflow:completed',
  WORKFLOW_FAILED = 'workflow:failed',
  STEP_STARTED = 'step:started',
  STEP_COMPLETED = 'step:completed',
  STEP_FAILED = 'step:failed',
  STEP_SKIPPED = 'step:skipped',
  STATUS_UPDATED = 'status:updated'
}

/**
 * Classe de base pour les agents d'orchestration
 */
export abstract class BaseOrchestratorAgent extends BaseMcpAgent<OrchestrationResult, OrchestratorAgentConfig> {
  // Émetteur d'événements dédié aux événements d'orchestration
  protected workflowEvents: EventEmitter = new EventEmitter();
  
  // État interne de l'orchestration
  protected workflowState: {
    startTime: number;
    currentStep: number;
    totalSteps: number;
    steps: Array<{
      agentId: string;
      status?: 'pending' | 'running' | 'success' | 'warning' | 'error' | 'skipped';
      startTime?: number;
      endTime?: number;
      result?: any;
    }>;
  } = {
    startTime: 0,
    currentStep: 0,
    totalSteps: 0,
    steps: []
  };
  
  /**
   * Exécute l'orchestration et retourne le résultat
   */
  async execute(context: AgentContext): Promise<AgentResult<OrchestrationResult>> {
    return this.executeWithMetrics(context, async () => {
      // Valider le contexte
      if (!(await this.validate(context))) {
        return {
          success: false,
          error: 'Contexte d\'exécution invalide',
          warnings: ['Le contexte d\'exécution fourni ne contient pas les informations nécessaires']
        };
      }

      this.log('info', 'Démarrage de l\'orchestration du workflow');
      
      // Initialiser l'état du workflow
      this.workflowState = {
        startTime: Date.now(),
        currentStep: 0,
        totalSteps: 0,
        steps: []
      };
      
      // Préparer le plan d'exécution
      const executionPlan = await this.prepareExecutionPlan(context);
      this.workflowState.totalSteps = executionPlan.length;
      this.workflowState.steps = executionPlan.map(step => ({
        agentId: step.agentId,
        status: 'pending'
      }));
      
      // Notifier le début du workflow
      this.workflowEvents.emit(OrchestratorEvent.WORKFLOW_STARTED, {
        totalSteps: this.workflowState.totalSteps,
        timestamp: new Date().toISOString()
      });
      
      // Exécuter les webhook si configurés
      if (this.config.webhooks?.onStart) {
        await this.callWebhook(this.config.webhooks.onStart, {
          event: 'workflow.started',
          totalSteps: this.workflowState.totalSteps,
          timestamp: new Date().toISOString(),
          workflowId: context.jobId
        });
      }
      
      try {
        // Exécuter le workflow
        const result = await this.executeWorkflow(executionPlan, context);
        
        // Calculer les métriques finales
        result.summary.duration = Date.now() - this.workflowState.startTime;
        result.summary.startTime = new Date(this.workflowState.startTime).toISOString();
        result.summary.endTime = new Date().toISOString();
        
        // Déterminer le statut général
        if (result.summary.failedSteps === 0) {
          result.summary.overallStatus = 'success';
        } else if (result.summary.successfulSteps > 0) {
          result.summary.overallStatus = 'partial';
        } else {
          result.summary.overallStatus = 'failed';
        }
        
        // Notifier la fin du workflow
        this.workflowEvents.emit(OrchestratorEvent.WORKFLOW_COMPLETED, {
          summary: result.summary,
          timestamp: new Date().toISOString()
        });
        
        // Exécuter les webhook si configurés
        if (this.config.webhooks?.onComplete) {
          await this.callWebhook(this.config.webhooks.onComplete, {
            event: 'workflow.completed',
            summary: result.summary,
            timestamp: new Date().toISOString(),
            workflowId: context.jobId
          });
        }
        
        this.log('info', `Orchestration terminée: ${result.summary.successfulSteps}/${result.summary.totalSteps} étapes réussies`);
        
        return {
          success: result.summary.overallStatus === 'success' || result.summary.overallStatus === 'partial',
          data: result,
          warnings: result.summary.overallStatus === 'partial' ? [`${result.summary.failedSteps} étapes ont échoué`] : undefined
        };
      } catch (error) {
        this.log('error', `Erreur lors de l'orchestration: ${error instanceof Error ? error.message : String(error)}`);
        
        // Notifier l'échec du workflow
        this.workflowEvents.emit(OrchestratorEvent.WORKFLOW_FAILED, {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        
        // Exécuter les webhook si configurés
        if (this.config.webhooks?.onError) {
          await this.callWebhook(this.config.webhooks.onError, {
            event: 'workflow.error',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            workflowId: context.jobId,
            completedSteps: this.workflowState.currentStep
          });
        }
        
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });
  }
  
  /**
   * Prépare le plan d'exécution pour l'orchestration
   */
  protected abstract prepareExecutionPlan(context: AgentContext): Promise<Array<{
    agentId: string;
    config?: any;
    dependencies?: string[]; // IDs des étapes dont cette étape dépend
  }>>;
  
  /**
   * Exécute le plan de workflow
   */
  protected abstract executeWorkflow(
    executionPlan: Array<{
      agentId: string;
      config?: any;
      dependencies?: string[];
    }>,
    context: AgentContext
  ): Promise<OrchestrationResult>;
  
  /**
   * Exécute un agent à partir de l'ID
   */
  protected abstract executeAgent(
    agentId: string, 
    config: any, 
    context: AgentContext
  ): Promise<any>;
  
  /**
   * Met à jour le statut d'une étape
   */
  protected updateStepStatus(
    stepIndex: number, 
    status: 'running' | 'success' | 'warning' | 'error' | 'skipped',
    result?: any
  ): void {
    if (stepIndex >= 0 && stepIndex < this.workflowState.steps.length) {
      const step = this.workflowState.steps[stepIndex];
      step.status = status;
      
      if (status === 'running') {
        step.startTime = Date.now();
      } else if (['success', 'warning', 'error', 'skipped'].includes(status)) {
        step.endTime = Date.now();
        step.result = result;
      }
      
      this.workflowState.currentStep = stepIndex;
      
      // Émettre l'événement correspondant
      let eventType: OrchestratorEvent;
      switch (status) {
        case 'running':
          eventType = OrchestratorEvent.STEP_STARTED;
          break;
        case 'success':
        case 'warning':
          eventType = OrchestratorEvent.STEP_COMPLETED;
          break;
        case 'error':
          eventType = OrchestratorEvent.STEP_FAILED;
          break;
        case 'skipped':
          eventType = OrchestratorEvent.STEP_SKIPPED;
          break;
        default:
          return;
      }
      
      this.workflowEvents.emit(eventType, {
        stepIndex,
        agentId: step.agentId,
        status,
        timestamp: new Date().toISOString(),
        duration: step.endTime && step.startTime ? step.endTime - step.startTime : undefined,
        result
      });
      
      // Mettre à jour le statut global
      this.workflowEvents.emit(OrchestratorEvent.STATUS_UPDATED, {
        currentStep: stepIndex + 1,
        totalSteps: this.workflowState.totalSteps,
        progress: Math.round((stepIndex + 1) / this.workflowState.totalSteps * 100),
        timestamp: new Date().toISOString()
      });
      
      // Exécuter le webhook de progression si configuré
      if (this.config.webhooks?.onProgress) {
        this.callWebhook(this.config.webhooks.onProgress, {
          event: 'workflow.progress',
          stepIndex,
          agentId: step.agentId,
          status,
          currentStep: stepIndex + 1,
          totalSteps: this.workflowState.totalSteps,
          progress: Math.round((stepIndex + 1) / this.workflowState.totalSteps * 100),
          timestamp: new Date().toISOString(),
          workflowId: 'context-jobid-placeholder'  // A remplacer par le vrai jobId
        }).catch(err => this.log('warn', `Échec de l'appel du webhook de progression: ${err.message}`));
      }
      
      // Mettre à jour le fichier de statut si configuré
      this.updateStatusFile().catch(err => this.log('warn', `Échec de mise à jour du fichier de statut: ${err.message}`));
    }
  }
  
  /**
   * Appelle un webhook
   */
  protected async callWebhook(url: string, payload: any): Promise<void> {
    try {
      this.log('debug', `Appel du webhook ${url}`);
      
      // Utiliser fetch ou axios pour appeler le webhook
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        this.log('warn', `Échec de l'appel du webhook (${response.status}): ${url}`);
      }
    } catch (error) {
      this.log('warn', `Erreur lors de l'appel du webhook ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Met à jour le fichier de statut si configuré
   */
  protected async updateStatusFile(): Promise<void> {
    if (!this.config.statusFilePath) return;
    
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      // Créer le répertoire parent si nécessaire
      await fs.mkdir(path.dirname(this.config.statusFilePath), { recursive: true });
      
      // Préparer les données de statut
      const status = {
        jobId: 'context-jobid-placeholder',  // A remplacer par le vrai jobId
        startTime: new Date(this.workflowState.startTime).toISOString(),
        currentTime: new Date().toISOString(),
        currentStep: this.workflowState.currentStep + 1,
        totalSteps: this.workflowState.totalSteps,
        progress: Math.round((this.workflowState.currentStep + 1) / this.workflowState.totalSteps * 100),
        steps: this.workflowState.steps.map(step => ({
          agentId: step.agentId,
          status: step.status,
          startTime: step.startTime ? new Date(step.startTime).toISOString() : undefined,
          endTime: step.endTime ? new Date(step.endTime).toISOString() : undefined,
          duration: step.endTime && step.startTime ? `${(step.endTime - step.startTime) / 1000}s` : undefined
        }))
      };
      
      // Écrire le fichier
      await fs.writeFile(this.config.statusFilePath, JSON.stringify(status, null, 2));
      
    } catch (error) {
      this.log('warn', `Erreur lors de la mise à jour du fichier de statut: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * S'abonne aux événements d'orchestration
   */
  public onWorkflowEvent(
    event: OrchestratorEvent, 
    listener: (data: any) => void
  ): void {
    this.workflowEvents.on(event, listener);
  }
}