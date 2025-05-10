import { StandardizedTaskOptions } from './standardized-orchestrator';
/**
 * Service NestJS pour l'orchestrateur standardisé
 * Fournit une interface injectable pour l'orchestrateur standardisé
 */
export declare class StandardizedOrchestratorService {
    /**
     * Planifie une tâche standardisée
     * @param taskName Le nom de la tâche à planifier
     * @param payload Les données à fournir à la tâche
     * @param options Options de configuration de la tâche
     * @returns Un identifiant unique pour la tâche planifiée
     */
    scheduleTask(taskName: string, payload: any, options: StandardizedTaskOptions): Promise<string>;
    /**
     * Planifie une tâche simple via BullMQ (helper)
     */
    scheduleSimpleTask(taskName: string, payload: any, options: Omit<StandardizedTaskOptions, 'taskType'>): Promise<string>;
    /**
     * Planifie un workflow complexe via Temporal (helper)
     */
    scheduleComplexWorkflow(taskName: string, payload: any, options: Omit<StandardizedTaskOptions, 'taskType'> & {
        temporal: NonNullable<StandardizedTaskOptions['temporal']>;
    }): Promise<string>;
    /**
     * Planifie une intégration externe via n8n (helper)
     */
    scheduleExternalIntegration(taskName: string, payload: any, options: Omit<StandardizedTaskOptions, 'taskType'> & {
        n8n: NonNullable<StandardizedTaskOptions['n8n']>;
    }): Promise<string>;
    /**
     * Récupère le statut d'une tâche
     * @param taskId L'identifiant de la tâche
     */
    getTaskStatus(taskId: string): Promise<any>;
    /**
     * Annule une tâche
     * @param taskId L'identifiant de la tâche à annuler
     */
    cancelTask(taskId: string): Promise<boolean>;
}
//# sourceMappingURL=standardized-orchestratorservice.d.ts.map