/**
 * Orchestrateur Centralisé
 *
 * Ce fichier implémente l'orchestrateur standardisé qui :
 * - Utilise Temporal pour les workflows complexes de longue durée
 * - Utilise BullMQ pour les jobs courts et simples
 * - Offre une interface unique et cohérente
 *
 * IMPORTANT: Ce fichier remplace les implémentations précédentes fragmentées
 * et devient le point d'entrée unique pour l'orchestration.
 */
import { Worker, Job } from 'bullmq';
import { TaskDefinition, TaskResult } from './orchestrator-adapter';
export declare enum WorkflowType {
    SHORT_RUNNING = "short_running",
    LONG_RUNNING = "long_running"
}
export interface CentralizedOrchestratorConfig {
    redis: {
        host: string;
        port: number;
    };
    temporal: {
        address: string;
        namespace?: string;
    };
    options?: {
        bullmqPrefix?: string;
        temporalTaskQueue?: string;
        logLevel?: string;
        enableDebug?: boolean;
        enableMetrics?: boolean;
        metricsPort?: number;
    };
}
/**
 * Orchestrateur centralisé qui répartit intelligemment les tâches
 * entre Temporal (workflows complexes) et BullMQ (jobs courts)
 */
export declare class CentralizedOrchestrator {
    private bullmqConnection;
    private bullmqQueues;
    private temporalConnection;
    private temporalClient;
    private readonly config;
    private readonly logger;
    private taskRegistry;
    constructor(config: CentralizedOrchestratorConfig);
    /**
     * Initialise le registre des tâches depuis le stockage persistant
     * (Peut être chargé depuis Redis/PostgreSQL dans une vraie implémentation)
     */
    private initTaskRegistry;
    /**
     * Se connecte à BullMQ et Temporal
     */
    connect(): Promise<void>;
    /**
     * Se connecte à BullMQ
     */
    private connectBullMQ;
    /**
     * Se connecte à Temporal
     */
    private connectTemporal;
    /**
     * Se déconnecte de BullMQ et Temporal
     */
    disconnect(): Promise<void>;
    /**
     * Se déconnecte de BullMQ
     */
    private disconnectBullMQ;
    /**
     * Se déconnecte de Temporal
     */
    private disconnectTemporal;
    /**
     * Vérifie si l'orchestrateur est connecté
     */
    isConnected(): boolean;
    /**
     * Détermine automatiquement le type de workflow en fonction de la tâche
     */
    private determineWorkflowType;
    /**
     * Planifie une tâche en utilisant l'orchestrateur approprié
     */
    scheduleTask(task: TaskDefinition, forceType?: WorkflowType): Promise<string>;
    /**
     * Planifie un workflow Temporal pour les tâches complexes
     */
    private scheduleTemporalWorkflow;
    /**
     * Planifie un job BullMQ pour les tâches courtes
     */
    private scheduleBullMQJob;
    /**
     * Récupère le statut d'une tâche
     */
    getTaskStatus(taskId: string): Promise<TaskResult>;
    /**
     * Récupère le statut d'un workflow Temporal
     */
    private getTemporalWorkflowStatus;
    /**
     * Récupère le statut d'un job BullMQ
     */
    private getBullMQJobStatus;
    /**
     * Annule une tâche
     */
    cancelTask(taskId: string): Promise<boolean>;
    /**
     * Annule un workflow Temporal
     */
    private cancelTemporalWorkflow;
    /**
     * Annule un job BullMQ
     */
    private cancelBullMQJob;
    /**
     * Liste toutes les tâches (de BullMQ et Temporal)
     */
    listTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
    /**
     * Liste les jobs BullMQ
     */
    private listBullMQJobs;
    /**
     * Liste les workflows Temporal
     */
    private listTemporalWorkflows;
    /**
     * Crée un worker pour traiter les tâches BullMQ
     */
    createBullMQWorker(queueName: string, processor: (job: Job) => Promise<any>): Worker;
    /**
     * Enregistre un worker Temporal (wrapper autour de l'API Temporal)
     * Dans une implémentation réelle, on utiliserait l'API Worker de Temporal
     */
    registerTemporalWorker(taskQueue: string): void;
}
export declare const centralizedOrchestrator: CentralizedOrchestrator;
//# sourceMappingURL=centralized-orchestrator.d.ts.map