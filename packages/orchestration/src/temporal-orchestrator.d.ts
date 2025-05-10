/**
 * Temporal Orchestrator
 *
 * Ce module fournit une abstraction pour utiliser Temporal.io comme orchestrateur
 * pour les workflows complexes à état long, comme les migrations, refactors d'IA,
 * et autres tâches nécessitant de la durabilité et de la résilience.
 */
import { ComplexWorkflowOptions, TaskDescription } from '../../types';
/**
 * Options de configuration pour l'orchestrateur Temporal
 */
interface TemporalOrchestratorOptions {
    address?: string;
    namespace?: string;
}
/**
 * Classe pour orchestrer des workflows complexes avec Temporal.io
 */
export declare class TemporalOrchestrator {
    private client;
    constructor(options?: TemporalOrchestratorOptions);
    /**
     * Planifie un workflow complexe via Temporal.io
     *
     * @param workflowName - Le nom du workflow à exécuter
     * @param input - Les données d'entrée du workflow
     * @param options - Options spécifiques à Temporal
     * @returns L'ID du workflow planifié
     */
    scheduleWorkflow(workflowName: string, input: any, options?: ComplexWorkflowOptions): Promise<string>;
    /**
     * Récupère le statut d'un workflow en cours d'exécution
     *
     * @param workflowId - L'ID du workflow à vérifier
     * @returns Le statut actuel du workflow
     */
    getWorkflowStatus(workflowId: string): Promise<any>;
    /**
     * Annule un workflow en cours d'exécution
     *
     * @param workflowId - L'ID du workflow à annuler
     * @returns true si le workflow a été annulé avec succès
     */
    cancelWorkflow(workflowId: string): Promise<boolean>;
    /**
     * Planifie une tâche complexe selon la description fournie
     * Adapte les paramètres de la tâche au format Temporal
     *
     * @param task - Description de la tâche à planifier
     * @returns L'ID de la tâche planifiée
     */
    schedule(task: TaskDescription): Promise<string>;
}
export {};
//# sourceMappingURL=temporal-orchestrator.d.ts.map