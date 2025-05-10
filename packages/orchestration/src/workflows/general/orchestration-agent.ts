import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de la couche d'orchestration
 * Responsable de la gestion des workflows et de la coordination de haut niveau
 */
export interface OrchestrationAgent extends BaseAgent {
    /**
     * Démarre l'orchestration d'un workflow ou d'un processus
     * @param workflow Identifiant ou définition du workflow à orchestrer
     * @param context Contexte d'exécution incluant les paramètres nécessaires
     */
    orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult>;

    /**
     * Enregistre l'état d'avancement d'un workflow
     * @param workflowId Identifiant du workflow
     * @param status État actuel du workflow
     * @param metadata Métadonnées additionnelles sur l'avancement
     */
    reportStatus(workflowId: string, status: 'started' | 'running' | 'completed' | 'failed', metadata?: Record<string, any>): Promise<void>;
}