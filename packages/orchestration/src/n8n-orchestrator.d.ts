/**
 * n8n Orchestrator (DÉPRÉCIÉ)
 *
 * Ce module fournit une abstraction pour utiliser n8n comme orchestrateur
 * pour les intégrations externes et les webhooks avec des systèmes tiers.
 *
 * @deprecated Ce module est déprécié et sera progressivement remplacé par Temporal.io et BullMQ
 * selon le plan de migration décrit dans la documentation de standardisation.
 */
import { TaskDescription } from '../types';
/**
 * Options de configuration pour l'orchestrateur n8n
 */
interface N8nOrchestratorOptions {
    apiBaseUrl?: string;
    apiKey?: string;
}
/**
 * Classe pour orchestrer des intégrations externes avec n8n
 * @deprecated À remplacer progressivement selon le plan de migration
 */
export declare class N8nOrchestrator {
    private apiBaseUrl;
    private apiKey;
    constructor(options?: N8nOrchestratorOptions);
    /**
     * Configure les en-têtes d'authentification pour les requêtes API
     */
    private getAuthHeaders;
    /**
     * Déclenche un workflow n8n
     *
     * @param workflowId - ID du workflow à déclencher
     * @param data - Données à passer au workflow
     * @returns L'ID de l'exécution du workflow
     */
    triggerWorkflow(workflowId: string, data: any): Promise<string>;
    /**
     * Récupère le statut d'une exécution de workflow
     *
     * @param executionId - ID de l'exécution à vérifier
     * @returns Le statut de l'exécution
     */
    getExecutionStatus(executionId: string): Promise<any>;
    /**
     * Arrête l'exécution d'un workflow
     *
     * @param executionId - ID de l'exécution à stopper
     * @returns true si l'exécution a été stoppée avec succès
     */
    stopExecution(executionId: string): Promise<boolean>;
    /**
     * Planifie une intégration externe via n8n
     * Adapte les paramètres de la tâche au format n8n
     *
     * @param task - Description de la tâche d'intégration externe
     * @returns L'ID de la tâche planifiée
     */
    schedule(task: TaskDescription): Promise<string>;
}
export {};
//# sourceMappingURL=n8n-orchestrator.d.ts.map