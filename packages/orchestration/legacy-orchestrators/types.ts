/**
 * Types partagés pour les orchestrateurs
 */

/**
 * Options communes à toutes les tâches
 */
export interface TaskCommonOptions {
    id?: string;
    queue?: string;
    tags?: string[];
    retry?: {
        maxAttempts: number;
        backoff?: {
            type: 'fixed' | 'exponential';
            delay: number;
        };
    };
}

/**
 * Options spécifiques aux tâches simples (BullMQ)
 */
export interface SimpleTaskOptions extends TaskCommonOptions {
    priority?: number;
    delay?: number;
    jobId?: string;
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
}

/**
 * Options spécifiques aux workflows complexes (Temporal)
 */
export interface ComplexWorkflowOptions extends TaskCommonOptions {
    workflowId?: string;
    taskQueue?: string;
}

/**
 * Options spécifiques aux intégrations externes (n8n)
 */
export interface ExternalIntegrationOptions extends TaskCommonOptions {
    webhook?: {
        url?: string;
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        headers?: Record<string, string>;
    };
}

/**
 * Description d'une tâche à orchestrer
 */
export interface TaskDescription {
    id?: string;
    type: string;
    data?: any;
    queue?: string;
    tags?: string[];
    isComplex?: boolean;
    priority?: number;
    delay?: number;
    retry?: {
        maxAttempts: number;
        backoff?: {
            type: 'fixed' | 'exponential';
            delay: number;
        };
    };
    integration?: {
        workflowId: string;
        webhook?: {
            url?: string;
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
            headers?: Record<string, string>;
        };
    };
}

/**
 * Interface pour tous les types d'orchestrateurs
 */
export interface Orchestrator {
    schedule(task: TaskDescription): Promise<string>;
}

/**
 * Statut d'une tâche
 */
export interface TaskStatus {
    id: string;
    status: string;
    source: 'TEMPORAL' | 'BULLMQ' | 'N8N';
    [key: string]: any;
}