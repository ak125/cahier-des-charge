import { BaseAgent, BaseAgentConfig } from './BaseAgent';

/**
 * États possibles pour un job d'orchestration
 */
export enum JobStatus {
  PENDING = 'pending',       // En attente d'exécution
  RUNNING = 'running',       // En cours d'exécution
  COMPLETED = 'completed',   // Terminé avec succès
  FAILED = 'failed',         // Échoué
  CANCELED = 'canceled',     // Annulé par l'utilisateur ou le système
  TIMEOUT = 'timeout',       // Temps d'exécution dépassé
  TERMINATED = 'terminated', // Terminé de force
  WAITING = 'waiting',       // En attente d'une condition externe
  UNKNOWN = 'unknown'        // État indéterminé
}

/**
 * Configuration spécifique pour les agents d'orchestration
 */
export interface OrchestratorConfig extends BaseAgentConfig {
  /**
   * Nombre maximum de tâches simultanées
   */
  maxConcurrentJobs?: number;
  
  /**
   * Nombre maximum de tentatives pour une tâche
   */
  maxRetries?: number;
  
  /**
   * Délai de base entre les tentatives (en ms)
   */
  baseRetryDelay?: number;
  
  /**
   * Type de planification des tâches ('fifo', 'priority', 'fair-share')
   */
  schedulingPolicy?: 'fifo' | 'priority' | 'fair-share';
  
  /**
   * Options de persistance
   */
  persistence?: {
    /**
     * Activer la persistance des tâches et de leur état
     */
    enabled: boolean;
    
    /**
     * Type de stockage ('memory', 'redis', 'database')
     */
    storageType: 'memory' | 'redis' | 'database';
    
    /**
     * Options de connexion au stockage (si applicable)
     */
    storageOptions?: Record<string, any>;
  };
}

/**
 * Définition d'une tâche à orchestrer
 */
export interface WorkflowTask {
  /**
   * Identifiant unique de la tâche
   */
  id: string;
  
  /**
   * Nom descriptif de la tâche
   */
  name: string;
  
  /**
   * Type de la tâche (nom de la fonction, du service ou de l'agent à exécuter)
   */
  type: string;
  
  /**
   * Données d'entrée pour la tâche
   */
  input?: any;
  
  /**
   * Dépendances (IDs des tâches qui doivent être terminées avant celle-ci)
   */
  dependencies?: string[];
  
  /**
   * Priorité de la tâche (plus le nombre est grand, plus la priorité est haute)
   */
  priority?: number;
  
  /**
   * Timeout spécifique pour cette tâche (en ms)
   */
  timeout?: number;
  
  /**
   * Nombre de tentatives spécifiques pour cette tâche
   */
  retries?: number;
  
  /**
   * Fonction pour transformer le résultat des dépendances en entrée pour cette tâche
   */
  inputFunction?: string;
  
  /**
   * Fonction pour transformer la sortie de cette tâche
   */
  outputFunction?: string;
  
  /**
   * Fonction à appeler en cas d'erreur
   */
  onError?: string;
  
  /**
   * Métadonnées additionnelles pour cette tâche
   */
  meta?: Record<string, any>;
}

/**
 * Définition d'un workflow complet
 */
export interface WorkflowDefinition {
  /**
   * Identifiant unique du workflow
   */
  id: string;
  
  /**
   * Nom descriptif du workflow
   */
  name: string;
  
  /**
   * Description du workflow
   */
  description: string;
  
  /**
   * Version du workflow (semver)
   */
  version: string;
  
  /**
   * Liste des tâches du workflow
   */
  tasks: WorkflowTask[];
  
  /**
   * Identifiant de la tâche principale de sortie (si applicable)
   */
  outputTask?: string;
  
  /**
   * Tags pour catégoriser le workflow
   */
  tags?: string[];
  
  /**
   * Métadonnées additionnelles pour le workflow
   */
  meta?: Record<string, any>;
}

/**
 * État d'une exécution de workflow
 */
export interface WorkflowExecutionState {
  /**
   * Identifiant de l'exécution
   */
  executionId: string;
  
  /**
   * Identifiant du workflow exécuté
   */
  workflowId: string;
  
  /**
   * Données d'entrée de l'exécution
   */
  input: any;
  
  /**
   * État global de l'exécution
   */
  status: JobStatus;
  
  /**
   * Résultat de l'exécution (si terminée)
   */
  output?: any;
  
  /**
   * Erreur en cas d'échec
   */
  error?: {
    message: string;
    stack?: string;
    code?: string;
    taskId?: string;
  };
  
  /**
   * État des tâches individuelles
   */
  tasks: Record<string, {
    status: JobStatus;
    startTime?: Date;
    endTime?: Date;
    output?: any;
    error?: string;
    retryCount: number;
  }>;
  
  /**
   * Heure de début de l'exécution
   */
  startTime: Date;
  
  /**
   * Heure de fin de l'exécution (si terminée)
   */
  endTime?: Date;
  
  /**
   * Progression estimée en pourcentage
   */
  progress?: number;
}

/**
 * Interface pour les agents d'orchestration
 * Les agents d'orchestration coordonnent l'exécution de workflows
 */
export interface OrchestratorAgent extends BaseAgent {
  /**
   * Configuration spécifique de l'orchestrateur
   */
  config: OrchestratorConfig;
  
  /**
   * Déploie un workflow dans le système d'orchestration
   * @param workflow Définition du workflow à déployer
   */
  deployWorkflow(workflow: WorkflowDefinition): Promise<string>;
  
  /**
   * Démarre l'exécution d'un workflow
   * @param workflowId Identifiant du workflow à exécuter
   * @param input Données d'entrée pour le workflow
   * @param options Options d'exécution
   */
  executeWorkflow(workflowId: string, input?: any, options?: {
    detached?: boolean;
    priority?: number;
    idempotencyKey?: string;
    searchAttributes?: Record<string, any>;
  }): Promise<WorkflowExecutionState>;
  
  /**
   * Récupère l'état d'exécution d'un workflow
   * @param executionId Identifiant de l'exécution
   */
  getExecutionState(executionId: string): Promise<WorkflowExecutionState>;
  
  /**
   * Annule l'exécution d'un workflow
   * @param executionId Identifiant de l'exécution
   * @param reason Raison de l'annulation
   */
  cancelExecution(executionId: string, reason?: string): Promise<boolean>;
  
  /**
   * Récupère l'historique d'exécution d'un workflow
   * @param executionId Identifiant de l'exécution
   */
  getExecutionHistory(executionId: string): Promise<any[]>;
  
  /**
   * Planifie l'exécution d'un workflow selon une expression cron
   * @param workflowId Identifiant du workflow à planifier
   * @param cronExpression Expression cron pour la planification
   * @param input Données d'entrée pour le workflow
   */
  scheduleWorkflow(workflowId: string, cronExpression: string, input?: any): Promise<string>;
  
  /**
   * Liste les workflows déployés
   * @param query Critères de filtrage
   */
  listWorkflows(query?: { tags?: string[]; version?: string }): Promise<Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    tags?: string[];
  }>>;
  
  /**
   * Liste les exécutions de workflows
   * @param query Critères de filtrage
   */
  listExecutions(query?: {
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
   * @param executionId Identifiant de l'exécution
   * @param signalName Nom du signal
   * @param payload Données du signal
   */
  signalWorkflow(executionId: string, signalName: string, payload?: any): Promise<boolean>;
}