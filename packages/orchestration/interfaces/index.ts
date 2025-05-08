/**
 * Interfaces partagées pour le module d'orchestration
 */

// Types de base
export interface OrchestratorJob {
    id: string;
    queue: string;
    data: any;
    createdAt: Date;
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
    progress?: number;
    attempts?: number;
    result?: any;
    error?: Error | string;
}

// Événements d'orchestration
export enum OrchestratorEventType {
    TASK_CREATED = 'task:created',
    TASK_STARTED = 'task:started',
    TASK_COMPLETED = 'task:completed',
    TASK_FAILED = 'task:failed',
    WORKFLOW_STARTED = 'workflow:started',
    WORKFLOW_COMPLETED = 'workflow:completed',
    WORKFLOW_FAILED = 'workflow:failed',
    SYSTEM_ERROR = 'system:error'
}

// Informations de métrique
export interface MetricData {
    timestamp: number;
    name: string;
    value: number;
    tags?: Record<string, string>;
    type?: 'counter' | 'gauge' | 'histogram';
}

// Interface pour les écouteurs d'événements
export interface OrchestratorEventListener {
    eventType: OrchestratorEventType | string;
    handler: (data: any) => void | Promise<void>;
}