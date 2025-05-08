/**
 * Types de base communs à tous les agents
 */

/**
 * États de santé possibles pour un agent
 */
export enum AgentHealthState {
  HEALTHY = 'healthy', // L'agent fonctionne normalement
  UNHEALTHY = 'unhealthy', // L'agent ne fonctionne pas correctement
  DEGRADED = 'degraded', // L'agent fonctionne mais avec des limitations
  STARTING = 'starting', // L'agent est en cours de démarrage
  STOPPED = 'stopped', // L'agent est arrêté
}

/**
 * Statut actuel d'un agent
 */
export interface AgentStatus {
  health: AgentHealthState; // État de santé de l'agent
  lastRun?: Date; // Date de dernière exécution
  lastRunDuration?: number; // Durée de la dernière exécution en ms
  successCount?: number; // Nombre d'exécutions réussies
  failureCount?: number; // Nombre d'exécutions échouées
  message?: string; // Message d'information sur l'état
  details?: Record<string, any>; // Détails supplémentaires
}

/**
 * Représente un résultat généré par un agent
 */
export interface AgentResult {
  success: boolean; // Statut global de l'exécution
  errors?: Error[]; // Erreurs rencontrées
  warnings?: string[]; // Avertissements
  artifacts?: string[]; // Chemins des fichiers générés
  sections?: AuditSection[]; // Sections d'audit/analyse
  data?: Record<string, any>; // Données supplémentaires
  metadata?: Record<string, any>; // Métadonnées
  executionTimeMs?: number; // Temps d'exécution en millisecondes
  timestamp?: string; // Horodatage de fin d'exécution
}

/**
 * Représente une section d'analyse ou d'audit
 */
export interface AuditSection {
  id: string; // Identifiant unique de la section
  title: string; // Titre de la section
  description: string; // Description détaillée
  type: string; // Type de section (pour catégorisation)
  data?: Record<string, any>; // Données associées à la section
  severity?: 'info' | 'warning' | 'critical'; // Niveau de sévérité
}

/**
 * Interface de configuration de base pour tous les agents
 */
export interface AgentConfig {
  outputDir?: string; // Répertoire de sortie
  verbose?: boolean; // Mode verbeux
  [key: string]: any; // Propriétés additionnelles spécifiques à l'agent
}

/**
 * Interface de base pour tous les agents
 */
export interface Agent<TConfig extends AgentConfig = AgentConfig> {
  id: string; // Identifiant unique de l'agent
  name: string; // Nom descriptif de l'agent
  version: string; // Version de l'agent
  description: string; // Description des fonctionnalités de l'agent

  // Configuration spécifique à l'agent
  config: TConfig;

  // Initialisation de l'agent (optionnel)
  init?: () => Promise<void>;

  // Méthode principale d'exécution de l'agent
  process: () => Promise<AgentResult>;

  // Méthodes optionnelles
  getDependencies?: () => string[]; // Renvoie les IDs des agents dont celui-ci dépend
  validate?: () => Promise<boolean>; // Validation de l'état de l'agent avant exécution
  cleanup?: () => Promise<void>; // Nettoyage des ressources
}
