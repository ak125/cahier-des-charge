/**
 * Adaptateur unifié pour les orchestrateurs
 *
 * Ce module fournit une abstraction commune pour interagir avec différents
 * orchestrateurs (BullMQ, Temporal, n8n) à travers une interface unifiée.
 *
 * RECOMMANDATION DE SIMPLIFICATION :
 * ---------------------------------
 * Pour réduire la complexité de maintenance, il est recommandé de :
 * 1. Choisir BullMQ comme orchestrateur principal par défaut (le plus simple à déployer)
 * 2. Implémenter complètement cet orchestrateur uniquement
 * 3. Conserver l'interface abstraite pour permettre des migrations futures
 * 4. Désactiver temporairement les adaptateurs Temporal et n8n
 *
 * Cette approche permet de :
 * - Simplifier la maintenance
 * - Réduire les risques d'incohérence
 * - Faciliter les tests
 * - Garder une porte ouverte pour d'éventuelles migrations
 */
/**
 * Types d'orchestrateurs supportés
 */
export declare enum OrchestratorType {
    BULLMQ = "bullmq",
    TEMPORAL = "temporal",// Conserver pour compatibilité future
    N8N = "n8n"
}
/**
 * Statut commun des tâches pour tous les orchestrateurs
 */
export declare enum TaskStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
/**
 * Configuration commune pour un orchestrateur
 */
export interface OrchestratorConfig {
    type: OrchestratorType;
    connectionString: string;
    options?: Record<string, any>;
}
/**
 * Options pour la planification d'une tâche
 */
export interface TaskOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
    timeout?: number;
    signal?: AbortSignal;
}
/**
 * Définition d'une tâche à planifier
 */
export interface TaskDefinition {
    name: string;
    payload: any;
    options?: TaskOptions;
}
/**
 * Résultat d'une tâche
 */
export interface TaskResult {
    id: string;
    name: string;
    status: TaskStatus;
    source: OrchestratorType;
    result?: any;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
}
/**
 * Interface commune pour tous les orchestrateurs
 */
export interface Orchestrator {
    type: OrchestratorType;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    scheduleTask(task: TaskDefinition): Promise<string>;
    getTaskStatus(taskId: string): Promise<TaskResult>;
    cancelTask(taskId: string): Promise<boolean>;
    listTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
}
/**
 * Adaptateur BullMQ
 */
export declare class BullMQOrchestrator implements Orchestrator {
    type: OrchestratorType;
    private connection;
    private queues;
    private queueEvents;
    private connectionString;
    private options;
    constructor(connectionString: string, options?: Record<string, any>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    scheduleTask(task: TaskDefinition): Promise<string>;
    getTaskStatus(taskId: string): Promise<TaskResult>;
    cancelTask(taskId: string): Promise<boolean>;
    listTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
}
/**
 * Adaptateur Temporal
 */
export declare class TemporalOrchestrator implements Orchestrator {
    type: OrchestratorType;
    private connection;
    private client;
    private connectionString;
    private options;
    constructor(connectionString: string, options?: Record<string, any>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    scheduleTask(task: TaskDefinition): Promise<string>;
    getTaskStatus(taskId: string): Promise<TaskResult>;
    cancelTask(_taskId: string): Promise<boolean>;
    listTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
}
/**
 * Adaptateur n8n
 */
export declare class N8nOrchestrator implements Orchestrator {
    type: OrchestratorType;
    private apiUrl;
    private apiKey;
    private options;
    private isConnectedFlag;
    constructor(connectionString: string, options?: Record<string, any>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    scheduleTask(task: TaskDefinition): Promise<string>;
    getTaskStatus(taskId: string): Promise<TaskResult>;
    cancelTask(taskId: string): Promise<boolean>;
    listTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
}
/**
 * Service d'orchestration qui gère tous les orchestrateurs
 */
declare class OrchestrationService {
    private orchestrators;
    private preferredOrchestrator;
    /**
     * Enregistre un orchestrateur
     */
    registerOrchestrator(config: OrchestratorConfig): Promise<void>;
    /**
     * Désenregistre un orchestrateur
     */
    unregisterOrchestrator(type: OrchestratorType): Promise<void>;
    /**
     * Définit l'orchestrateur préféré
     */
    setPreferredOrchestrator(type: OrchestratorType): void;
    /**
     * Obtient l'orchestrateur préféré
     */
    getPreferredOrchestrator(): Orchestrator | null;
    /**
     * Obtient un orchestrateur par type
     */
    getOrchestratorByType(type: OrchestratorType): Orchestrator | null;
    /**
     * Planifie une tâche avec l'orchestrateur préféré
     */
    scheduleTask(task: TaskDefinition): Promise<string>;
    /**
     * Planifie une tâche avec un orchestrateur spécifique
     */
    scheduleTaskWith(type: OrchestratorType, task: TaskDefinition): Promise<string>;
    /**
     * Obtient le statut d'une tâche
     * Cette méthode essaie de trouver la tâche dans tous les orchestrateurs enregistrés
     */
    getTaskStatus(taskId: string): Promise<TaskResult>;
    /**
     * Annule une tâche
     * Cette méthode essaie d'annuler la tâche dans tous les orchestrateurs enregistrés
     */
    cancelTask(taskId: string): Promise<boolean>;
    /**
     * Liste toutes les tâches de tous les orchestrateurs
     */
    listAllTasks(filter?: Record<string, any>): Promise<TaskResult[]>;
}
export declare const orchestrationService: OrchestrationService;
export {};
//# sourceMappingURL=orchestrator-adapter.d.ts.map