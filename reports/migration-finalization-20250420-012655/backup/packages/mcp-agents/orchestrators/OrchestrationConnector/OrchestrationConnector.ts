import { EventEmitter } from 'events';

/**
 * Interface définissant les opérations standard pour tous les connecteurs d'orchestration
 */
export interface OrchestrationConnector {
  /**
   * Initialise le connecteur avec les configurations spécifiques
   * @param config Configuration spécifique au connecteur
   */
  initialize(config: any): Promise<void>;

  /**
   * Démarre l'exécution d'un workflow
   * @param workflowId Identifiant unique du workflow
   * @param input Données d'entrée pour le workflow
   * @param options Options spécifiques au workflow
   */
  startWorkflow(workflowId: string, input: any, options?: any): Promise<string>;

  /**
   * Récupère l'état d'exécution d'un workflow
   * @param executionId Identifiant de l'exécution du workflow
   */
  getWorkflowStatus(executionId: string): Promise<any>;

  /**
   * Annule l'exécution d'un workflow en cours
   * @param executionId Identifiant de l'exécution du workflow
   */
  cancelWorkflow(executionId: string): Promise<boolean>;

  /**
   * Enregistre une nouvelle définition de workflow
   * @param workflowId Identifiant du workflow
   * @param definition Définition du workflow
   */
  registerWorkflow(workflowId: string, definition: any): Promise<void>;

  /**
   * Met à jour une définition de workflow existante
   * @param workflowId Identifiant du workflow
   * @param definition Nouvelle définition du workflow
   */
  updateWorkflow(workflowId: string, definition: any): Promise<void>;

  /**
   * Récupère la définition d'un workflow
   * @param workflowId Identifiant du workflow
   */
  getWorkflowDefinition(workflowId: string): Promise<any>;

  /**
   * Vérifie si le système d'orchestration est disponible
   */
  healthCheck(): Promise<boolean>;

  /**
   * Arrête proprement le connecteur
   */
  shutdown(): Promise<void>;

  /**
   * Fournit un émetteur d'événements pour les notifications
   */
  getEventEmitter(): EventEmitter;
}
