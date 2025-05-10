/**
 * Abstract Orchestration Agent
 * 
 * Classe abstraite de base pour tous les agents de la couche orchestration.
 * Cette classe fournit une implémentation de base des méthodes communes à tous les agents d'orchestration
 * et étend la classe AbstractBaseAgent pour hériter des fonctionnalités générales des agents.
 */

import { EventEmitter } from 'events';
import { OrchestrationAgent, AgentResult } from 'mcp-types';
import { AbstractBaseAgent } from '../../abstracts/abstract-base-agent';

/**
 * Classe abstraite de base pour les agents de la couche orchestration
 */
export abstract class AbstractOrchestrationAgent extends AbstractBaseAgent implements OrchestrationAgent {

  /**
   * Storage pour les workflows en cours d'exécution
   * @protected
   */
  protected runningWorkflows: Map<string, {
    status: 'started' | 'running' | 'completed' | 'failed';
    startTime: string;
    lastUpdated: string;
    metadata?: Record<string, any>;
  }> = new Map();

  /**
   * Constructeur de la classe AbstractOrchestrationAgent
   * @param id Identifiant unique de l'agent
   * @param name Nom descriptif de l'agent
   * @param version Version de l'agent
   * @param options Options de configuration de l'agent
   */
  constructor(
    id: string,
    name: string,
    version: string,
    options?: Record<string, any>
  ) {
    super(id, name, version, options);
    this.type = 'orchestration';
  }

  /**
   * Démarre l'orchestration d'un workflow ou d'un processus
   * @param workflow Identifiant ou définition du workflow à orchestrer
   * @param context Contexte d'exécution incluant les paramètres nécessaires
   */
  public abstract orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult>;

  /**
   * Enregistre l'état d'avancement d'un workflow
   * @param workflowId Identifiant du workflow
   * @param status État actuel du workflow
   * @param metadata Métadonnées additionnelles sur l'avancement
   */
  public async reportStatus(workflowId: string, status: 'started' | 'running' | 'completed' | 'failed', metadata?: Record<string, any>): Promise<void> {
    if (!workflowId) {
      throw new Error("workflowId est requis");
    }

    const now = new Date().toISOString();
    const workflowInfo = this.runningWorkflows.get(workflowId) || {
      status: 'started',
      startTime: now,
      lastUpdated: now
    };

    workflowInfo.status = status;
    workflowInfo.lastUpdated = now;

    if (metadata) {
      workflowInfo.metadata = {
        ...(workflowInfo.metadata || {}),
        ...metadata
      };
    }

    this.runningWorkflows.set(workflowId, workflowInfo);

    // Émettre un événement pour le changement de statut
    this.emit('workflow:status-change', {
      workflowId,
      status,
      timestamp: now,
      metadata: workflowInfo.metadata
    });

    // Émettre des événements spécifiques selon le statut
    if (status === 'completed') {
      this.emit('workflow:completed', {
        workflowId,
        duration: this.calculateDuration(workflowInfo.startTime, now),
        metadata: workflowInfo.metadata
      });
    } else if (status === 'failed') {
      this.emit('workflow:failed', {
        workflowId,
        duration: this.calculateDuration(workflowInfo.startTime, now),
        metadata: workflowInfo.metadata
      });
    }
  }

  /**
   * Récupère l'état actuel d'un workflow
   * @param workflowId Identifiant du workflow
   * @returns Le statut et les métadonnées du workflow
   */
  public getWorkflowStatus(workflowId: string): { status: string; metadata?: Record<string, any> } | null {
    const workflowInfo = this.runningWorkflows.get(workflowId);
    if (!workflowInfo) {
      return null;
    }

    return {
      status: workflowInfo.status,
      metadata: workflowInfo.metadata
    };
  }

  /**
   * Récupère la liste de tous les workflows en cours
   * @returns Liste des workflows avec leur statut
   */
  public getAllWorkflows(): Record<string, { status: string; metadata?: Record<string, any> }> {
    const result: Record<string, { status: string; metadata?: Record<string, any> }> = {};

    this.runningWorkflows.forEach((info, id) => {
      result[id] = {
        status: info.status,
        metadata: info.metadata
      };
    });

    return result;
  }

  /**
   * Nettoie les workflows terminés ou échoués ayant dépassé un âge donné
   * @param maxAgeMs Âge maximum en millisecondes (par défaut: 1 heure)
   */
  protected cleanupOldWorkflows(maxAgeMs: number = 3600000): void {
    const now = new Date();

    this.runningWorkflows.forEach((info, id) => {
      const lastUpdated = new Date(info.lastUpdated);
      const ageMs = now.getTime() - lastUpdated.getTime();

      if ((info.status === 'completed' || info.status === 'failed') && ageMs > maxAgeMs) {
        this.runningWorkflows.delete(id);
      }
    });
  }

  /**
   * Calcule la durée entre deux timestamps ISO
   * @param start Timestamp de début au format ISO
   * @param end Timestamp de fin au format ISO
   * @returns La durée en millisecondes
   */
  private calculateDuration(start: string, end: string): number {
    return new Date(end).getTime() - new Date(start).getTime();
  }

  /**
   * Méthode commune pour créer un résultat de succès
   * @param data Données à inclure dans la réponse
   * @param message Message descriptif pour le résultat
   * @returns Objet AgentResult formaté
   */
  protected createSuccessResult(data: any, message: string = "Opération réussie"): AgentResult {
    return {
      success: true,
      data,
      message
    };
  }

  /**
   * Méthode commune pour créer un résultat d'erreur
   * @param error Erreur à formater
   * @param metadata Métadonnées additionnelles
   * @returns Objet AgentResult formaté avec les détails d'erreur
   */
  protected createErrorResult(error: any, metadata?: Record<string, any>): AgentResult {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata
    };
  }

  /**
   * Helper pour exécuter une opération avec retries automatiques
   * @param operation Fonction asynchrone à exécuter
   * @param maxRetries Nombre maximum de tentatives
   * @param delayMs Délai entre les tentatives en millisecondes
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error("L'opération a échoué après plusieurs tentatives");
  }
}