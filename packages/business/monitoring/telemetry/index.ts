/**
 * Module principal d'exportation pour OpenTelemetry
 * Permet d'instrumenter facilement les agents et orchestrateurs
 */

// Export des utilitaires de base
export * from './tracer';

// Export des utilitaires spécifiques
export * as AgentTracer from './agent-tracer';
export * as OrchestratorTracer from './orchestrator-tracer';

// Réexportation des types OpenTelemetry nécessaires
export {
  SpanKind,
  SpanStatusCode,
  trace,
  Span,
  Context,
  context
} from '@opentelemetry/api';