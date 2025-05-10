/**
 * Orchestrateur Unifié
 *
 * Ce module fournit une implémentation simplifiée qui utilise BullMQ comme
 * orchestrateur principal tout en gardant une interface adaptative pour
 * faciliter d'éventuelles migrations futures.
 */
import { Job, Queue, Worker } from 'bullmq';
import { Orchestrator, TaskDefinition, TaskResult } from './orchestrator-adapter';
/**
 * Configuration de l'orchestrateur unifié
 */
export interface UnifiedOrchestratorConfig {
    connectionString: string;
    options?: Record<string, any>;
    /**
     * Mode de migration - quand 'true', toutes les opérations sont enregistrées pour
     * pouvoir être migrées ultérieurement vers un autre orchestrateur
     */
    migrationMode?: boolean;
}
/**
 * Orchestrateur unifié utilisant BullMQ comme moteur principal
 */
export declare class UnifiedOrchestrator implements Orchestrator {
    type: any;
    private connection;
    private queues;
    private queueEvents;
    private connectionString;
    private options;
    private migrationMode;
    constructor(config: UnifiedOrchestratorConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    /**
     * Récupère une instance de Queue BullMQ sous-jacente par son nom
     * REMARQUE : Cette méthode est une exception à notre règle d'abstraction
     * et ne devrait être utilisée que pour des cas spécifiques comme le tableau de bord
     * @param queueName Nom de la file d'attente
     * @returns Instance Queue BullMQ ou null si non trouvée
     */
    getUnderlyingQueue(queueName: string): Promise<Queue | null>;
    scheduleTask(task: TaskDefinition): Promise<string>;
    getTaskStatus(taskId: string): Promise<TaskResult>;
    cancelTask(taskId: string): Promise<boolean>;
    listTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
    /**
     * Crée un worker pour traiter les tâches d'une file d'attente spécifique
     * @param queueName Nom de la file d'attente
     * @param processor Fonction de traitement des tâches
     */
    createWorker(queueName: string, processor: (job: Job) => Promise<any>): Worker;
}
export declare const unifiedOrchestrator: UnifiedOrchestrator;
//# sourceMappingURL=unified-orchestrator.d.ts.map