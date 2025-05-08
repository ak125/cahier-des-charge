/**
 * Types consolidés pour les workflows
 * Ce fichier regroupe tous les types précédemment séparés dans différents fichiers
 */

export interface WorkflowInput {
    workflowId?: string;
    projectId?: string;
    data?: any;
    options?: WorkflowOptions;
}

export interface WorkflowOptions {
    timeout?: number;
    retries?: number;
    notifyOnCompletion?: boolean;
    priority?: 'high' | 'medium' | 'low';
}

export interface AnalysisInput {
    codeString: string;
    filePath?: string;
    options?: {
        detailed?: boolean;
        includeMetrics?: boolean;
    };
}

export interface AnalysisResult {
    issues: Array<{
        type: string;
        message: string;
        severity: 'error' | 'warning' | 'info';
        line?: number;
    }>;
    metrics?: {
        complexity: number;
        linesOfCode: number;
        maintainability: number;
    };
    recommendations?: string[];
}

export interface MigrationPlan {
    steps: Array<{
        action: string;
        description: string;
        code?: string;
        filePath?: string;
    }>;
    estimatedEffort: number;
    risks: Array<{
        description: string;
        severity: 'high' | 'medium' | 'low';
        mitigation?: string;
    }>;
}

export interface WorkflowResult {
    success: boolean;
    errors?: string[];
    warnings?: string[];
    data?: any;
    completedAt: string;
}

export enum WorkflowStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELED = 'CANCELED'
}
