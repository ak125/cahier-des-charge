import { 
  OrchestrationAbstraction, 
  WorkflowDefinition, 
  ExecutionOptions, 
  ExecutionResult, 
  TaskOptions, 
  JobStatus 
} from './AbstractionLayer';

/**
 * Interface de la couche d'adaptation pour les systèmes d'orchestration
 * 
 * Cette interface définit comment un adaptateur spécifique doit se connecter 
 * à un système d'orchestration concret et exposer ses fonctionnalités.
 */
export interface OrchestrationAdapter extends OrchestrationAbstraction {
  /**
   * Nom du système d'orchestration
   */
  readonly name: string;

  /**
   * Version du système d'orchestration
   */
  readonly version: string;

  /**
   * Capacités supportées par ce système d'orchestration
   */
  readonly capabilities: OrchestratorCapabilities;

  /**
   * Valide si une définition de workflow est compatible avec ce système d'orchestration
   * @param workflowDefinition Définition de workflow à valider
   */
  validateWorkflowDefinition(workflowDefinition: WorkflowDefinition): Promise<ValidationResult>;

  /**
   * Convertit un format de workflow générique vers le format spécifique de ce système
   * @param genericDefinition Définition de workflow générique
   */
  convertToNativeFormat(genericDefinition: WorkflowDefinition): any;

  /**
   * Convertit un format de workflow spécifique vers notre format générique
   * @param nativeDefinition Définition de workflow au format natif du système
   */
  convertFromNativeFormat(nativeDefinition: any): WorkflowDefinition;

  /**
   * Enregistre un gestionnaire d'erreurs pour ce système d'orchestration
   * @param handler Gestionnaire d'erreurs à enregistrer
   */
  registerErrorHandler(handler: ErrorHandler): void;

  /**
   * Vérifie l'état de santé de la connexion au système d'orchestration
   */
  checkHealth(): Promise<HealthStatus>;
}

/**
 * Capacités supportées par un système d'orchestration
 */
export interface OrchestratorCapabilities {
  /**
   * Supporte les workflows durables (persistants)
   */
  durableWorkflows: boolean;

  /**
   * Supporte la reprise des workflows après une défaillance
   */
  workflowRecovery: boolean;

  /**
   * Supporte l'exécution parallèle
   */
  parallelExecution: boolean;
  
  /**
   * Supporte les sous-workflows
   */
  subWorkflows: boolean;

  /**
   * Supporte le signaling (envoi de signaux aux workflows en cours)
   */
  signaling: boolean;

  /**
   * Supporte les transactions distribuées
   */
  distributedTransactions: boolean;

  /**
   * Supporte la planification des workflows (cron)
   */
  scheduling: boolean;

  /**
   * Supporte le versionnement des workflows
   */
  versioning: boolean;
  
  /**
   * Capacités additionnelles spécifiques au système
   */
  [capability: string]: boolean;
}

/**
 * Résultat de validation d'un workflow
 */
export interface ValidationResult {
  /**
   * Indique si le workflow est valide
   */
  isValid: boolean;

  /**
   * Liste des erreurs de validation (si présentes)
   */
  errors?: ValidationError[];

  /**
   * Liste des avertissements (si présents)
   */
  warnings?: ValidationWarning[];
}

/**
 * Erreur de validation
 */
export interface ValidationError {
  /**
   * Code d'erreur
   */
  code: string;
  
  /**
   * Message d'erreur
   */
  message: string;
  
  /**
   * Chemin dans la définition du workflow où l'erreur est présente
   */
  path?: string;
  
  /**
   * Suggestions de correction
   */
  suggestions?: string[];
}

/**
 * Avertissement de validation
 */
export interface ValidationWarning {
  /**
   * Code d'avertissement
   */
  code: string;
  
  /**
   * Message d'avertissement
   */
  message: string;
  
  /**
   * Chemin dans la définition du workflow où l'avertissement est présent
   */
  path?: string;
  
  /**
   * Suggestions d'amélioration
   */
  suggestions?: string[];
}

/**
 * Gestionnaire d'erreurs pour un système d'orchestration
 */
export type ErrorHandler = (error: any, context: ErrorContext) => Promise<ErrorHandlingResult>;

/**
 * Contexte d'une erreur d'orchestration
 */
export interface ErrorContext {
  /**
   * Type de l'erreur
   */
  type: 'WORKFLOW' | 'TASK' | 'CONNECTION' | 'SYSTEM';
  
  /**
   * Identifiant de l'entité concernée par l'erreur
   */
  entityId?: string;
  
  /**
   * Tentative actuelle (pour les mécanismes de retry)
   */
  attemptNumber?: number;
  
  /**
   * Métadonnées additionnelles
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat de la gestion d'une erreur
 */
export interface ErrorHandlingResult {
  /**
   * Action à prendre
   */
  action: 'RETRY' | 'FAIL' | 'IGNORE' | 'COMPENSATE';
  
  /**
   * Délai avant retry (si action=RETRY)
   */
  retryDelayMs?: number;
  
  /**
   * Données de compensation (si action=COMPENSATE)
   */
  compensationData?: any;
}

/**
 * État de santé de la connexion au système d'orchestration
 */
export interface HealthStatus {
  /**
   * État de santé global
   */
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  
  /**
   * Détails sur l'état de santé
   */
  details: {
    /**
     * État de la connexion
     */
    connection: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
    
    /**
     * Temps de réponse en millisecondes
     */
    responseTimeMs?: number;
    
    /**
     * Statut des services dépendants
     */
    dependencies?: Record<string, 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'>;
    
    /**
     * Message d'erreur (si présent)
     */
    error?: string;
  };
}

/**
 * Factory pour créer des adaptateurs d'orchestration
 */
export interface AdapterFactory {
  /**
   * Crée un adaptateur pour un système d'orchestration spécifique
   * @param config Configuration de l'adaptateur
   */
  createAdapter(config: AdapterConfig): Promise<OrchestrationAdapter>;
}

/**
 * Configuration pour un adaptateur d'orchestration
 */
export interface AdapterConfig {
  /**
   * Type d'adaptateur à créer
   */
  type: 'TEMPORAL' | 'BULLMQ' | 'N8N' | string;
  
  /**
   * Configuration de connexion
   */
  connection: {
    /**
     * URL du service d'orchestration
     */
    url?: string;
    
    /**
     * Informations d'authentification
     */
    auth?: {
      username?: string;
      password?: string;
      token?: string;
      [key: string]: any;
    };
    
    /**
     * Options de timeout (en millisecondes)
     */
    timeouts?: {
      connection?: number;
      operation?: number;
    };
    
    /**
     * Options additionnelles spécifiques au système
     */
    [key: string]: any;
  };
  
  /**
   * Options de configuration additionnelles
   */
  options?: Record<string, any>;
}