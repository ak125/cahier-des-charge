/**
 * Interface de la couche de coordination
 * 
 * Cette interface définit les fonctionnalités de la couche de coordination qui est responsable
 * de la communication entre la couche d'orchestration et la couche métier, ainsi que de la
 * gestion des flux de travail complexes.
 */

import { ExecutionResult, JobStatus } from './AbstractionLayer';

/**
 * Définition d'un processus métier
 */
export interface BusinessProcess {
  /**
   * Identifiant unique du processus
   */
  id: string;

  /**
   * Nom du processus
   */
  name: string;

  /**
   * Description du processus
   */
  description?: string;

  /**
   * Version du processus
   */
  version?: string;

  /**
   * Étapes du processus métier
   */
  steps: ProcessStep[];

  /**
   * Métadonnées du processus
   */
  metadata?: Record<string, any>;
}

/**
 * Définition d'une étape de processus
 */
export interface ProcessStep {
  /**
   * Identifiant unique de l'étape
   */
  id: string;

  /**
   * Nom de l'étape
   */
  name: string;

  /**
   * Description de l'étape
   */
  description?: string;

  /**
   * Type d'étape
   */
  type: 'task' | 'decision' | 'parallel' | 'subprocess' | 'wait' | 'notification';

  /**
   * Données de configuration de l'étape (dépend du type)
   */
  config: {
    /**
     * Identifiant du composant métier à exécuter (pour les étapes de type 'task')
     */
    businessComponentId?: string;

    /**
     * Condition pour les étapes de décision
     */
    condition?: string;

    /**
     * Branches pour les étapes parallèles
     */
    branches?: string[];

    /**
     * Identifiant du sous-processus à exécuter (pour les étapes de type 'subprocess')
     */
    subprocessId?: string;

    /**
     * Durée d'attente en millisecondes (pour les étapes de type 'wait')
     */
    waitTime?: number;

    /**
     * Condition d'attente (pour les étapes de type 'wait')
     */
    waitCondition?: string;

    /**
     * Canaux de notification (pour les étapes de type 'notification')
     */
    notificationChannels?: string[];

    /**
     * Gabarit de message (pour les étapes de type 'notification')
     */
    messageTemplate?: string;

    /**
     * Mappages de variables d'entrée/sortie
     */
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;

    /**
     * Options spécifiques au type d'étape
     */
    [key: string]: any;
  };

  /**
   * Étapes suivantes possibles (avec conditions si nécessaire)
   */
  next?: Array<{
    stepId: string;
    condition?: string;
  }>;

  /**
   * Politiques de gestion des erreurs
   */
  errorHandling?: {
    /**
     * Nombre de tentatives maximum
     */
    maxRetries?: number;

    /**
     * Délai entre les tentatives (en millisecondes)
     */
    retryDelay?: number;

    /**
     * Étape à exécuter en cas d'erreur
     */
    errorStepId?: string;

    /**
     * Actions à exécuter en cas d'erreur
     */
    onError?: 'retry' | 'skip' | 'fail' | 'compensate';
  };

  /**
   * Politiques de complétion
   */
  completion?: {
    /**
     * Délai d'expiration (en millisecondes)
     */
    timeout?: number;

    /**
     * Condition de complétion
     */
    completionCondition?: string;
  };

  /**
   * Métadonnées de l'étape
   */
  metadata?: Record<string, any>;
}

/**
 * Options pour l'exécution d'un processus métier
 */
export interface ProcessExecutionOptions {
  /**
   * Données d'entrée du processus
   */
  input: any;

  /**
   * Variables de contexte
   */
  context?: Record<string, any>;

  /**
   * Identifiant d'exécution personnalisé
   */
  executionId?: string;

  /**
   * Priorité d'exécution
   */
  priority?: number;

  /**
   * Délai maximal d'exécution (en millisecondes)
   */
  timeout?: number;

  /**
   * Étape à partir de laquelle démarrer l'exécution
   */
  startAt?: string;
}

/**
 * Options de notification pour la couche de coordination
 */
export interface NotificationOptions {
  /**
   * Canal de notification
   */
  channel: string;

  /**
   * Destinataires de la notification
   */
  recipients?: string[];

  /**
   * Niveau d'importance
   */
  importance?: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Délai avant expiration (en millisecondes)
   */
  expiresIn?: number;

  /**
   * Tentatives maximum d'envoi
   */
  maxRetries?: number;
}

/**
 * Interface de la couche de coordination
 */
export interface CoordinationLayer {
  /**
   * Initialise la couche de coordination
   */
  initialize(): Promise<void>;

  /**
   * Enregistre un processus métier
   * @param process Définition du processus métier à enregistrer
   */
  registerProcess(process: BusinessProcess): Promise<void>;

  /**
   * Exécute un processus métier
   * @param processId Identifiant du processus à exécuter
   * @param options Options d'exécution
   */
  executeProcess(processId: string, options: ProcessExecutionOptions): Promise<ExecutionResult>;

  /**
   * Obtient le statut d'un processus en cours d'exécution
   * @param executionId Identifiant de l'exécution
   */
  getProcessStatus(executionId: string): Promise<JobStatus>;

  /**
   * Annule l'exécution d'un processus
   * @param executionId Identifiant de l'exécution à annuler
   */
  cancelProcess(executionId: string): Promise<boolean>;

  /**
   * Envoie une notification
   * @param title Titre de la notification
   * @param message Contenu de la notification
   * @param options Options de notification
   */
  sendNotification(title: string, message: string, options: NotificationOptions): Promise<void>;

  /**
   * Enregistre un événement de processus
   * @param executionId Identifiant de l'exécution
   * @param eventType Type d'événement
   * @param data Données de l'événement
   */
  logProcessEvent(executionId: string, eventType: string, data: any): Promise<void>;

  /**
   * S'abonne aux événements d'un processus
   * @param processId Identifiant du processus
   * @param eventType Type d'événement
   * @param callback Fonction de rappel à exécuter
   */
  subscribeToProcessEvents(processId: string, eventType: string, callback: (data: any) => void): Promise<void>;

  /**
   * Ferme la couche de coordination
   */
  close(): Promise<void>;
}