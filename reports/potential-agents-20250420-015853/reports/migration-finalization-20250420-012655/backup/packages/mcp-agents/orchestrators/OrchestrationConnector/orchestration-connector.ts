/**
 * Interface pour les connecteurs d'orchestration
 *
 * Cette interface définit le contrat que tous les connecteurs d'orchestration
 * doivent implémenter pour être utilisés avec l'OrchestratorBridge.
 */

import { EventEmitter } from 'events';

/**
 * Statut d'un job d'orchestration
 */
export interface OrchestrationJob {
  /**
   * Identifiant unique du job
   */
  id: string;

  /**
   * Type ou nom du job
   */
  type: string;

  /**
   * Données d'entrée du job
   */
  data: any;

  /**
   * Statut actuel du job
   */
  status: 'pending' | 'running' | 'completed' | 'failed';

  /**
   * Horodatage de début d'exécution
   */
  startTime?: Date;

  /**
   * Horodatage de fin d'exécution
   */
  endTime?: Date;

  /**
   * Résultat de l'exécution (si le job est terminé)
   */
  result?: any;

  /**
   * Message d'erreur (si le job a échoué)
   */
  error?: string;

  /**
   * Métadonnées spécifiques au connecteur
   */
  metadata?: Record<string, any>;
}

/**
 * Configuration d'une étape de workflow
 */
export interface WorkflowStep {
  /**
   * Identifiant de l'agent à exécuter
   */
  agentId: string;

  /**
   * Configuration spécifique à cette étape
   */
  config?: Record<string, any>;

  /**
   * Liste des étapes dont dépend cette étape
   */
  dependencies?: string[];
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
  version: string;

  /**
   * Description du workflow
   */
  description?: string;

  /**
   * Étapes du workflow
   */
  steps: WorkflowStep[];

  /**
   * Options de configuration du workflow
   */
  options?: Record<string, any>;
}

/**
 * Résultat d'exécution d'un workflow
 */
export interface ExecutionResult {
  /**
   * Indique si l'exécution a démarré avec succès
   */
  success: boolean;

  /**
   * ID du job créé
   */
  jobId?: string;

  /**
   * ID du workflow exécuté
   */
  workflowId?: string;

  /**
   * ID de cette exécution spécifique
   */
  runId?: string;

  /**
   * Message d'erreur en cas d'échec
   */
  error?: string;
}

/**
 * Configuration de base pour les connecteurs d'orchestration
 */
export interface OrchestrationConnectorConfig {
  /**
   * Chaîne de connexion au service d'orchestration
   */
  connectionString: string;
}

/**
 * Interface pour les connecteurs d'orchestration
 */
export interface OrchestrationConnector {
  /**
   * Émetteur d'événements pour les notifications
   */
  readonly events: EventEmitter;

  /**
   * Nom du connecteur
   */
  readonly name: string;

  /**
   * Statut actuel du connecteur
   */
  readonly status: 'connecting' | 'ready' | 'error' | 'closed';

  /**
   * Initialise le connecteur avec la configuration spécifiée
   */
  initialize(config: OrchestrationConnectorConfig): Promise<void>;

  /**
   * Ferme le connecteur et libère les ressources
   */
  close(): Promise<void>;

  /**
   * Enregistre une définition de workflow
   */
  registerWorkflow(workflow: WorkflowDefinition): Promise<void>;

  /**
   * Soumet un job à exécuter
   */
  submitJob(type: string, data: any, options?: Record<string, any>): Promise<string>;

  /**
   * Exécute un workflow complet
   */
  executeWorkflow(
    workflowId: string,
    input: any,
    options?: Record<string, any>
  ): Promise<ExecutionResult>;

  /**
   * Récupère le statut d'un job
   */
  getJobStatus(jobId: string): Promise<OrchestrationJob | null>;

  /**
   * Annule un job en cours d'exécution
   */
  cancelJob(jobId: string): Promise<boolean>;

  /**
   * Récupère des métriques sur le système d'orchestration
   */
  getMetrics(): Promise<Record<string, any>>;

  /**
   * Vérifie l'état de santé du connecteur
   */
  healthCheck(): Promise<boolean>;
}
