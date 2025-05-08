/**
 * Module de traçage spécifique pour les agents MCP
 * Permet un traçage précis des opérations des agents
 */

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { initTracing, traceAsync, getTracer } from './tracer';

// Type minimal pour les agents
interface Agent {
  id: string;
  name: string;
  version?: string;
}

// Type minimal pour les résultats d'agents
interface AgentResult {
  success: boolean;
  error?: Error;
  data?: any;
}

/**
 * Initialise le traçage pour un agent
 * @param agent Informations sur l'agent à tracer
 */
export function initAgentTracing(agent: Agent) {
  initTracing(`agent-${agent.id}`, agent.version || '1.0.0');
}

/**
 * Trace l'exécution d'un agent avec propagation de contexte
 * @param agent Agent en cours d'exécution
 * @param taskName Nom de la tâche exécutée
 * @param fn Fonction à exécuter dans le contexte de traçage
 * @param metadata Métadonnées supplémentaires pour le traçage
 */
export async function traceAgentExecution<T>(
  agent: Agent,
  taskName: string,
  fn: () => Promise<T>,
  metadata: Record<string, any> = {}
): Promise<T> {
  return traceAsync(
    `Agent:${agent.name}:${taskName}`,
    async (span) => {
      span.setAttributes({
        'agent.id': agent.id,
        'agent.name': agent.name,
        'agent.version': agent.version || '1.0.0',
        'task.name': taskName,
        ...metadata
      });

      const startTime = Date.now();

      try {
        const result = await fn();

        // Enregistrer les métriques supplémentaires
        const duration = Date.now() - startTime;
        span.setAttributes({
          'execution.duration_ms': duration,
          'execution.success': true
        });

        // Si le résultat est un objet AgentResult, tracer le résultat
        if (result && typeof result === 'object' && 'success' in result) {
          const agentResult = result as AgentResult;

          span.setAttributes({
            'result.success': agentResult.success,
          });

          if (!agentResult.success && agentResult.error) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: agentResult.error.message,
            });
            span.recordException(agentResult.error);
          }
        }

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
      }
    },
    // Autres attributs pour le span
    {
      'service.type': 'agent'
    },
    // Type de span (SERVER pour représenter une unité de travail initiée de l'extérieur)
    SpanKind.SERVER
  );
}

/**
 * Trace un appel API vers un service externe
 */
export async function traceApiCall<T>(
  agent: Agent,
  serviceName: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(
    `API:${serviceName}:${endpoint}`,
    async (span) => {
      span.setAttributes({
        'agent.id': agent.id,
        'agent.name': agent.name,
        'service.name': serviceName,
        'http.url': endpoint
      });

      return await fn();
    },
    {},
    SpanKind.CLIENT
  );
}

/**
 * Trace le traitement d'une file d'attente
 */
export async function traceQueueProcessing<T>(
  agent: Agent,
  queueName: string,
  taskId: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(
    `Queue:${queueName}:Process`,
    async (span) => {
      span.setAttributes({
        'agent.id': agent.id,
        'agent.name': agent.name,
        'queue.name': queueName,
        'task.id': taskId
      });

      return await fn();
    },
    {},
    SpanKind.CONSUMER
  );
}