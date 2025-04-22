/**
 * Interface de la couche d'abstraction pour l'orchestration
 * 
 * Cette interface définit le contrat commun pour tous les systèmes d'orchestration,
 * indépendamment de leur implémentation sous-jacente.
 */
export interface OrchestrationAbstraction {
  /**
   * Initialise le système d'orchestration
   */
  initialize(): Promise<void>;

  /**
   * Enregistre un workflow dans le système d'orchestration
   * @param workflowDefinition Définition du workflow à enregistrer
   */
  registerWorkflow(workflowDefinition: WorkflowDefinition): Promise<void>;

  /**
   * Exécute un workflow enregistré
   * @param workflowId Identifiant du workflow à exécuter
   * @param input Données d'entrée pour le workflow
   * @param options Options d'exécution
   */
  executeWorkflow(workflowId: string, input: any, options?: ExecutionOptions): Promise<ExecutionResult>;

  /**
   * Soumet une tâche à exécuter
   * @param taskType Type de tâche à exécuter
   * @param taskData Données pour la tâche
   * @param options Options d'exécution
   */
  submitTask(taskType: string, taskData: any, options?: TaskOptions): Promise<string>;

  /**
   * Obtient le statut d'exécution d'un job
   * @param jobId Identifiant du job
   */
  getJobStatus(jobId: string): Promise<JobStatus>;

  /**
   * Annule l'exécution d'un job
   * @param jobId Identifiant du job à annuler
   */
  cancelJob(jobId: string): Promise<boolean>;

  /**
   * S'abonne aux événements d'un workflow ou d'un job
   * @param entityId Identifiant du workflow ou du job
   * @param eventType Type d'événement auquel s'abonner
   * @param callback Fonction de rappel à exécuter lors de l'événement
   */
  subscribeToEvents(entityId: string, eventType: string, callback: EventCallback): Promise<void>;

  /**
   * Ferme le système d'orchestration
   */
  close(): Promise<void>;
}

/**
 * Définition d'un workflow
 */
export interface WorkflowDefinition {
  /**
   * Identifiant unique du workflow
   */
  id: string;

  /**
   * Nom du workflow
   */
  name: string;

  /**
   * Version du workflow
   */
  version?: string;

  /**
   * Description du workflow
   */
  description?: string;

  /**
   * Implémentation du workflow (dépend du système d'orchestration)
   */
  implementation: any;

  /**
   * Métadonnées additionnelles du workflow
   */
  metadata?: Record<string, any>;
}

/**
 * Options d'exécution pour un workflow
 */
export interface ExecutionOptions {
  /**
   * Durée maximale d'exécution (en millisecondes)
   */
  timeout?: number;

  /**
   * Identifiant d'exécution personnalisé
   */
  executionId?: string;

  /**
   * Priorité d'exécution
   */
  priority?: number;

  /**
   * Options spécifiques au système d'orchestration
   */
  [key: string]: any;
}

/**
 * Options pour l'exécution d'une tâche
 */
export interface TaskOptions {
  /**
   * Durée maximale d'exécution (en millisecondes)
   */
  timeout?: number;

  /**
   * Délai avant exécution (en millisecondes)
   */
  delay?: number;

  /**
   * Priorité d'exécution
   */
  priority?: number;

  /**
   * Options spécifiques au système d'orchestration
   */
  [key: string]: any;
}

/**
 * Résultat d'exécution d'un workflow
 */
export interface ExecutionResult {
  /**
   * Identifiant du job créé
   */
  jobId: string;

  /**
   * Statut initial de l'exécution
   */
  status: JobStatus;

  /**
   * URL de suivi de l'exécution (si disponible)
   */
  trackingUrl?: string;

  /**
   * Données de contexte spécifiques au système d'orchestration
   */
  context?: Record<string, any>;
}

/**
 * Statut d'un job
 */
export interface JobStatus {
  /**
   * État actuel du job
   */
  state: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';

  /**
   * Progression du job (0-100)
   */
  progress?: number;

  /**
   * Résultat du job (si terminé)
   */
  result?: any;

  /**
   * Erreur survenue (si échoué)
   */
  error?: {
    message: string;
    code?: string;
    details?: any;
  };

  /**
   * Horodatages importants
   */
  timestamps: {
    created: Date;
    started?: Date;
    completed?: Date;
  };
}

/**
 * Callback pour les événements d'orchestration
 */
export type EventCallback = (eventData: any) => void;