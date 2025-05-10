/**
 * Orchestrateur Standardisé Intelligent
 *
 * Ce module fournit une interface unifiée pour tous les types d'orchestrateurs,
 * et sélectionne automatiquement l'orchestrateur le plus approprié en fonction
 * du type de tâche à exécuter.
 *
 * - Temporal.io pour les workflows complexes avec état
 * - BullMQ pour les tâches simples et les jobs rapides
 * - n8n pour les intégrations externes (déprécié, migration en cours)
 */
import { TaskDescription, Orchestrator, TaskStatus } from './types';
/**
 * Options pour l'orchestrateur standardisé
 */
export interface StandardizedOrchestratorOptions {
    defaultOrchestrator?: 'temporal' | 'bullmq' | 'n8n';
    preferComplexWorkflows?: boolean;
    enableN8nFallback?: boolean;
}
/**
 * Orchestrateur standardisé qui détecte automatiquement le meilleur
 * orchestrateur à utiliser en fonction du type de tâche
 */
export declare class StandardizedOrchestrator implements Orchestrator {
    private defaultOrchestrator;
    private preferComplexWorkflows;
    private enableN8nFallback;
    constructor(options?: StandardizedOrchestratorOptions);
    /**
     * Détermine l'orchestrateur le plus approprié pour une tâche donnée
     *
     * @param task Description de la tâche à planifier
     * @returns L'identifiant de l'orchestrateur à utiliser
     */
    private determineOrchestrator;
    /**
     * Planifie une tâche en utilisant l'orchestrateur le plus approprié
     *
     * @param task Description de la tâche à planifier
     * @returns L'ID de la tâche planifiée
     */
    schedule(task: TaskDescription): Promise<string>;
    /**
     * Planifie un workflow complexe via Temporal
     *
     * @param workflowName Nom du workflow à exécuter
     * @param input Données d'entrée du workflow
     * @param options Options spécifiques à Temporal
     * @returns L'ID du workflow planifié
     */
    scheduleWorkflow(workflowName: string, input: any, options?: any): Promise<string>;
    /**
     * Planifie une tâche simple via BullMQ
     *
     * @param taskType Type de tâche à exécuter
     * @param data Données pour la tâche
     * @param options Options pour la tâche
     * @returns L'ID du job planifié
     */
    scheduleTask(taskType: string, data: any, options?: any): Promise<string>;
    /**
     * Récupère le statut d'une tâche en cours d'exécution
     *
     * @param taskId ID de la tâche à vérifier
     * @param orchestratorType Type d'orchestrateur qui gère cette tâche
     * @returns Le statut actuel de la tâche
     */
    getTaskStatus(taskId: string, orchestratorType: 'temporal' | 'bullmq' | 'n8n', queueName?: string): Promise<TaskStatus>;
    /**
     * Annule une tâche en cours d'exécution
     *
     * @param taskId ID de la tâche à annuler
     * @param orchestratorType Type d'orchestrateur qui gère cette tâche
     * @returns true si la tâche a été annulée avec succès
     */
    cancelTask(taskId: string, orchestratorType: 'temporal' | 'bullmq' | 'n8n', queueName?: string): Promise<boolean>;
}
export declare const standardizedOrchestrator: StandardizedOrchestrator;
export default standardizedOrchestrator;
//# sourceMappingURL=standardized-orchestrator.d.ts.map