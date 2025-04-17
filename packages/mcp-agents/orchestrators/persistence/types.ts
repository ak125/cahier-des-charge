/**
 * Types pour le système de persistance et de checkpoints
 * Permet de stocker l'état des migrations pour une reprise après échec
 */

/**
 * Statut possible d'un point de contrôle (checkpoint)
 */
export enum CheckpointStatus {
  PENDING = 'PENDING',         // En attente de démarrage
  IN_PROGRESS = 'IN_PROGRESS', // En cours d'exécution
  COMPLETED = 'COMPLETED',     // Terminé avec succès
  FAILED = 'FAILED',           // Échoué définitivement
  PAUSED = 'PAUSED',           // Mis en pause manuellement
  RESUMING = 'RESUMING',       // En cours de reprise
  CANCELLED = 'CANCELLED'      // Annulé manuellement
}

/**
 * Niveau de criticité d'un workflow
 * Détermine la stratégie de retry à utiliser
 */
export enum WorkflowCriticality {
  LOW = 'LOW',           // Workflows peu critiques (retry limité)
  MEDIUM = 'MEDIUM',     // Workflows de criticité moyenne
  HIGH = 'HIGH',         // Workflows critiques (plus de retries)
  CRITICAL = 'CRITICAL'  // Workflows absolument critiques (retries maximums)
}

/**
 * Type d'erreur dans un workflow
 */
export interface WorkflowError {
  timestamp: Date;          // Moment où l'erreur s'est produite
  message: string;          // Message d'erreur
  type: string;             // Type d'erreur (ex: 'DATABASE_CONNECTION', 'TIMEOUT')
  stack?: string;           // Pile d'appel
  retryable: boolean;       // Indique si l'erreur permet un retry
  workflowId: string;       // ID du workflow concerné
  taskId?: string;          // ID de la tâche concernée (si applicable)
  metadata?: Record<string, any>; // Métadonnées additionnelles sur l'erreur
}

/**
 * Stratégie de retry pour un workflow
 */
export interface RetryStrategy {
  maxAttempts: number;              // Nombre maximum de tentatives
  backoffCoefficient: number;       // Coefficient pour le backoff exponentiel
  initialIntervalSec: number;       // Intervalle initial entre les tentatives (secondes)
  maximumIntervalSec: number;       // Intervalle maximum entre les tentatives (secondes)
  currentAttempt: number;           // Tentative actuelle
  nonRetryableErrorTypes?: string[]; // Types d'erreurs qui ne permettent pas de retry
}

/**
 * Point de contrôle (checkpoint) pour un workflow
 */
export interface WorkflowCheckpoint {
  id: string;                       // ID unique du checkpoint
  workflowId: string;               // ID du workflow
  workflowType: string;             // Type de workflow
  status: CheckpointStatus;         // Statut actuel
  progress: number;                 // Progression (0-100)
  data: Record<string, any>;        // Données persistées du workflow
  createdAt?: Date;                 // Date de création
  updatedAt?: Date;                 // Date de la dernière mise à jour
  completedAt?: Date;               // Date de complétion
  errors?: WorkflowError[];         // Erreurs rencontrées
  lastTaskCompleted?: string;       // Dernière tâche complétée
  nextTaskToExecute?: string;       // Prochaine tâche à exécuter
  metadata?: {                      // Métadonnées du workflow
    priority: number;               // Priorité (1-10, 10 étant la plus haute)
    criticality: WorkflowCriticality; // Niveau de criticité
    retryStrategy?: RetryStrategy;    // Stratégie de retry
    name?: string;                    // Nom lisible du workflow
    description?: string;             // Description du workflow
    tags?: string[];                  // Tags pour catégorisation
    parentWorkflowId?: string;        // ID du workflow parent si applicable
  };
}

/**
 * Options pour la recherche de checkpoints
 */
export interface CheckpointQueryOptions {
  status?: CheckpointStatus[];      // Filtrer par statut
  workflowType?: string;            // Filtrer par type de workflow
  priority?: number;                // Filtrer par priorité
  createdAfter?: Date;              // Créé après cette date
  createdBefore?: Date;             // Créé avant cette date
  limit?: number;                   // Nombre max de résultats
  offset?: number;                  // Offset pour la pagination
  sortBy?: string;                  // Champ pour le tri
  sortOrder?: 'asc' | 'desc';       // Ordre de tri
}

/**
 * Options pour la mise à jour d'un checkpoint
 */
export interface CheckpointUpdateOptions {
  status?: CheckpointStatus;        // Nouveau statut
  progress?: number;                // Nouvelle progression
  data?: Record<string, any>;       // Nouvelles données
  mergeData?: boolean;              // Si true, fusionne data avec les données existantes
  error?: WorkflowError;            // Erreur à ajouter
  lastTaskCompleted?: string;       // Dernière tâche complétée
  nextTaskToExecute?: string;       // Prochaine tâche à exécuter
  metadata?: Record<string, any>;   // Métadonnées à mettre à jour
  mergeMetadata?: boolean;          // Si true, fusionne les métadonnées
}