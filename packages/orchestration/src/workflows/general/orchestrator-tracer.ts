/**
 * Module de traçage spécifique pour les orchestrateurs MCP
 * Permet un traçage précis du flux de travail entre plusieurs agents
 */

import { SpanKind, SpanStatusCode, trace, Span, context } from '@opentelemetry/api';
import { initTracing, traceAsync, getTracer } from './tracer';

// Type minimal pour un orchestrateur
interface Orchestrator {
  id: string;
  name: string;
  version?: string;
}

// Type minimal pour un workflow
interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

// Type minimal pour une étape de workflow
interface WorkflowStep {
  id: string;
  name: string;
  agentId?: string;
  dependsOn?: string[];
}

/**
 * Initialise le traçage pour un orchestrateur
 */
export function initOrchestratorTracing(orchestrator: Orchestrator) {
  initTracing(`orchestrator-${orchestrator.id}`, orchestrator.version || '1.0.0');
}

/**
 * Trace l'exécution complète d'un workflow
 * Crée un span parent pour l'ensemble du workflow et retourne le contexte
 */
export async function traceWorkflowExecution<T>(
  orchestrator: Orchestrator,
  workflow: Workflow,
  fn: (workflowSpan: Span) => Promise<T>,
  metadata: Record<string, any> = {}
): Promise<T> {
  return traceAsync(
    `Workflow:${workflow.name}`,
    async (span) => {
      span.setAttributes({
        'orchestrator.id': orchestrator.id,
        'orchestrator.name': orchestrator.name,
        'workflow.id': workflow.id,
        'workflow.name': workflow.name,
        'workflow.steps.count': workflow.steps.length,
        ...metadata
      });

      return await fn(span);
    },
    { 'service.type': 'orchestrator' },
    SpanKind.INTERNAL
  );
}

/**
 * Trace l'exécution d'une étape de workflow avec contexte parental
 */
export async function traceWorkflowStep<T>(
  orchestrator: Orchestrator,
  workflow: Workflow,
  step: WorkflowStep,
  fn: () => Promise<T>,
  parentSpan?: Span
): Promise<T> {
  const tracer = getTracer(`orchestrator-${orchestrator.id}`);

  // Utiliser le contexte actif ou le contexte du span parent s'il est fourni
  const ctx = parentSpan ? trace.setSpan(context.active(), parentSpan) : context.active();

  return tracer.startActiveSpan(
    `Step:${step.name}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'orchestrator.id': orchestrator.id,
        'workflow.id': workflow.id,
        'workflow.name': workflow.name,
        'step.id': step.id,
        'step.name': step.name,
        'step.agent_id': step.agentId || 'none',
        'step.has_dependencies': step.dependsOn && step.dependsOn.length > 0,
        'step.dependencies_count': (step.dependsOn || []).length
      }
    },
    ctx,
    async (span) => {
      const startTime = Date.now();

      try {
        const result = await fn();

        const duration = Date.now() - startTime;
        span.setAttributes({
          'execution.duration_ms': duration,
          'execution.success': true
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        span.setAttributes({
          'execution.duration_ms': duration,
          'execution.success': false,
          'error.type': error instanceof Error ? error.name : 'Unknown',
          'error.message': error instanceof Error ? error.message : String(error)
        });

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error)
        });

        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Trace une opération d'ordonnancement
 */
export async function traceSchedulingOperation<T>(
  orchestrator: Orchestrator,
  operationName: string,
  fn: () => Promise<T>,
  metadata: Record<string, any> = {}
): Promise<T> {
  return traceAsync(
    `Scheduling:${operationName}`,
    async (span) => {
      span.setAttributes({
        'orchestrator.id': orchestrator.id,
        'orchestrator.name': orchestrator.name,
        'operation.name': operationName,
        ...metadata
      });

      return await fn();
    },
    { 'service.type': 'orchestrator' },
    SpanKind.INTERNAL
  );
}