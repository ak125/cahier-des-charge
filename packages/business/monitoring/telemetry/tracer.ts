/**
 * Module principal d'instrumentation OpenTelemetry
 * Permet de tracer automatiquement les opérations des agents et orchestrateurs
 */

import * as opentelemetry from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { trace, Span, SpanStatusCode, context, Context, SpanKind } from '@opentelemetry/api';

let initialized = false;

/**
 * Initialise l'instrumentation OpenTelemetry
 * @param serviceName Nom du service (agent ou orchestrateur)
 * @param serviceVersion Version du service
 */
export function initTracing(serviceName: string, serviceVersion: string = '1.0.0') {
  if (initialized) return;

  // Configuration du SDK OpenTelemetry
  const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    spanProcessor: new opentelemetry.tracing.BatchSpanProcessor(
      new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      })
    ),
    metricReader: new opentelemetry.metrics.PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
      }),
      exportIntervalMillis: 1000,
    }),
    contextManager: new AsyncHooksContextManager(),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
      }),
    ],
  });

  // Démarrage du SDK et gestion des erreurs
  sdk.start()
    .then(() => {
      console.log('Instrumentation OpenTelemetry initialisée pour', serviceName);
      initialized = true;

      // Gestion propre de l'arrêt
      process.on('SIGTERM', () => {
        sdk.shutdown()
          .then(() => console.log('SDK OpenTelemetry arrêté'))
          .catch((error) => console.log('Erreur lors de l\'arrêt du SDK OpenTelemetry', error))
          .finally(() => process.exit(0));
      });
    })
    .catch((error) => {
      console.error('Erreur lors de l\'initialisation de l\'instrumentation OpenTelemetry:', error);
    });
}

/**
 * Obtient le tracer pour le module courant
 */
export function getTracer(moduleName: string) {
  return trace.getTracer(moduleName);
}

/**
 * Enveloppe une fonction asynchrone avec un span OpenTelemetry
 * @param name Nom de l'opération
 * @param fn Fonction à tracer
 * @param attributes Attributs additionnels à ajouter au span
 */
export async function traceAsync<T>(
  name: string,
  fn: (span: Span, ctx: Context) => Promise<T>,
  attributes: Record<string, any> = {},
  kind: SpanKind = SpanKind.INTERNAL
): Promise<T> {
  const tracer = getTracer('mcp-agents');

  return tracer.startActiveSpan(name, { attributes, kind }, async (span) => {
    try {
      const result = await fn(span, context.active());
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Crée un middleware Express pour tracer les requêtes HTTP
 */
export function createTracingMiddleware(serviceName: string) {
  return (req: any, res: any, next: Function) => {
    const tracer = getTracer(serviceName);

    tracer.startActiveSpan(`HTTP ${req.method}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.route': req.route?.path,
      },
    }, (span) => {
      // Intercepter la fin de la requête pour ajouter le code de statut
      const originalEnd = res.end;
      res.end = function (...args: any[]) {
        span.setAttributes({
          'http.status_code': res.statusCode,
        });

        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP error ${res.statusCode}`,
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        span.end();
        return originalEnd.apply(res, args);
      };

      next();
    });
  };
}