/**
 * orchestration.ts
 *
 * Interfaces pour la couche orchestration de l'architecture MCP OS en 3 couches
 *
 * Cette couche est responsable de:
 * - Gérer le flux de travail entre agents
 * - Planifier et exécuter des tâches
 * - Superviser l'état du système
 * - Gérer les ressources et la configuration
 */

import {
  BaseAgent,
  ConfigurationOptions,
  ResourceMetrics,
  TaskDefinition,
  TaskStatus,
  WorkflowDefinition,
  WorkflowStatus,
} from './BaseAgent';

/**
 * Interface de base pour tous les agents d'orchestration
 */
export interface OrchestrationAgent extends BaseAgent {
  /**
   * Récupère l'état actuel du système
   */
  getSystemState(): Promise<Record<string, any>>;
}

/**
 * Interface pour les agents de workflow
 */
export interface WorkflowManagerAgent extends OrchestrationAgent {
  /**
   * Démarre un workflow
   */
  startWorkflow(workflow: WorkflowDefinition): Promise<string>;

  /**
   * Arrête un workflow en cours
   */
  stopWorkflow(workflowId: string): Promise<boolean>;

  /**
   * Pause un workflow en cours
   */
  pauseWorkflow(workflowId: string): Promise<boolean>;

  /**
   * Reprend un workflow en pause
   */
  resumeWorkflow(workflowId: string): Promise<boolean>;

  /**
   * Récupère le statut d'un workflow
   */
  getWorkflowStatus(workflowId: string): Promise<WorkflowStatus>;

  /**
   * Liste tous les workflows actifs
   */
  listActiveWorkflows(): Promise<Record<string, WorkflowStatus>>;

  /**
   * Récupère la définition d'un workflow
   */
  getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition>;
}

/**
 * Interface pour les agents de gestion de tâches
 */
export interface TaskManagerAgent extends OrchestrationAgent {
  /**
   * Crée une nouvelle tâche
   */
  createTask(task: TaskDefinition): Promise<string>;

  /**
   * Assigne une tâche à un agent
   */
  assignTask(taskId: string, agentId: string): Promise<boolean>;

  /**
   * Exécute une tâche
   */
  executeTask(taskId: string): Promise<boolean>;

  /**
   * Annule une tâche
   */
  cancelTask(taskId: string): Promise<boolean>;

  /**
   * Récupère le statut d'une tâche
   */
  getTaskStatus(taskId: string): Promise<TaskStatus>;

  /**
   * Liste toutes les tâches avec leur statut
   */
  listTasks(filter?: Record<string, any>): Promise<Record<string, TaskStatus>>;

  /**
   * Planifie une tâche pour une exécution ultérieure
   */
  scheduleTask(task: TaskDefinition, scheduledTime: Date): Promise<string>;
}

/**
 * Interface pour les agents de supervision
 */
export interface MonitoringAgent extends OrchestrationAgent {
  /**
   * Démarre la surveillance
   */
  startMonitoring(targets: string[], metrics: string[]): Promise<boolean>;

  /**
   * Arrête la surveillance
   */
  stopMonitoring(monitoringId: string): Promise<boolean>;

  /**
   * Récupère les métriques de surveillance
   */
  getMetrics(targets: string[], timeRange: { start: Date; end: Date }): Promise<ResourceMetrics[]>;

  /**
   * Configure des alertes
   */
  configureAlerts(alerts: Record<string, any>[]): Promise<boolean>;

  /**
   * Récupère l'historique des alertes
   */
  getAlertHistory(timeRange: { start: Date; end: Date }): Promise<Record<string, any>[]>;

  /**
   * Génère un rapport de santé du système
   */
  generateHealthReport(): Promise<Record<string, any>>;
}

/**
 * Interface pour les agents de configuration
 */
export interface ConfigurationAgent extends OrchestrationAgent {
  /**
   * Récupère la configuration actuelle
   */
  getConfiguration(path?: string): Promise<Record<string, any>>;

  /**
   * Met à jour la configuration
   */
  updateConfiguration(path: string, value: any): Promise<boolean>;

  /**
   * Sauvegarde la configuration
   */
  backupConfiguration(): Promise<string>;

  /**
   * Restaure une configuration sauvegardée
   */
  restoreConfiguration(backupId: string): Promise<boolean>;

  /**
   * Valide une configuration
   */
  validateConfiguration(
    config: Record<string, any>
  ): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Applique une configuration avec des options
   */
  applyConfiguration(config: Record<string, any>, options?: ConfigurationOptions): Promise<boolean>;
}

/**
 * Interface pour les agents de gestion des ressources
 */
export interface ResourceManagerAgent extends OrchestrationAgent {
  /**
   * Alloue des ressources à un agent ou un service
   */
  allocateResources(targetId: string, resources: Record<string, any>): Promise<boolean>;

  /**
   * Libère des ressources
   */
  releaseResources(targetId: string, resourceIds: string[]): Promise<boolean>;

  /**
   * Récupère l'utilisation des ressources
   */
  getResourceUsage(targetId?: string): Promise<ResourceMetrics>;

  /**
   * Optimise l'allocation des ressources
   */
  optimizeResourceAllocation(): Promise<boolean>;

  /**
   * Vérifie la disponibilité des ressources
   */
  checkResourceAvailability(resourceType: string, amount: number): Promise<boolean>;

  /**
   * Récupère les limites des ressources
   */
  getResourceLimits(): Promise<Record<string, any>>;
}

/**
 * Interface pour les agents d'orchestrateur MCP
 */
export interface MCPOrchestratorAgent extends OrchestrationAgent {
  /**
   * Enregistre un nouvel agent dans le système
   */
  registerAgent(agentInfo: Record<string, any>): Promise<string>;

  /**
   * Désenregistre un agent du système
   */
  unregisterAgent(agentId: string): Promise<boolean>;

  /**
   * Découvre les agents disponibles
   */
  discoverAgents(criteria?: Record<string, any>): Promise<Record<string, any>[]>;

  /**
   * Récupère les informations d'un agent
   */
  getAgentInfo(agentId: string): Promise<Record<string, any>>;

  /**
   * Démarre un agent
   */
  startAgent(agentId: string, options?: Record<string, any>): Promise<boolean>;

  /**
   * Arrête un agent
   */
  stopAgent(agentId: string): Promise<boolean>;

  /**
   * Crée une chaîne d'agents (pipeline)
   */
  createAgentChain(chainDefinition: Record<string, any>): Promise<string>;

  /**
   * Exécute une chaîne d'agents
   */
  executeAgentChain(chainId: string, input?: any): Promise<any>;
}
