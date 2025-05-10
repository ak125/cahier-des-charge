/**
 * Module de traçage spécifique pour les orchestrateurs MCP
 * Permet un traçage précis du flux de travail entre plusieurs agents
 */
import { Span } from '@opentelemetry/api';
interface Orchestrator {
    id: string;
    name: string;
    version?: string;
}
interface Workflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
}
interface WorkflowStep {
    id: string;
    name: string;
    agentId?: string;
    dependsOn?: string[];
}
/**
 * Initialise le traçage pour un orchestrateur
 */
export declare function initOrchestratorTracing(orchestrator: Orchestrator): void;
/**
 * Trace l'exécution complète d'un workflow
 * Crée un span parent pour l'ensemble du workflow et retourne le contexte
 */
export declare function traceWorkflowExecution<T>(orchestrator: Orchestrator, workflow: Workflow, fn: (workflowSpan: Span) => Promise<T>, metadata?: Record<string, any>): Promise<T>;
/**
 * Trace l'exécution d'une étape de workflow avec contexte parental
 */
export declare function traceWorkflowStep<T>(orchestrator: Orchestrator, workflow: Workflow, step: WorkflowStep, fn: () => Promise<T>, parentSpan?: Span): Promise<T>;
/**
 * Trace une opération d'ordonnancement
 */
export declare function traceSchedulingOperation<T>(orchestrator: Orchestrator, operationName: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
export {};
//# sourceMappingURL=orchestrator-tracer.d.ts.map