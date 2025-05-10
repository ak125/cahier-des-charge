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
