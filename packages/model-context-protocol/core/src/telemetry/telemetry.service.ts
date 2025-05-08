/**
 * Service de télémétrie standardisé pour le Model Context Protocol
 * Suivant les standards définis dans le document de standardisation des technologies
 */
import * as api from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Configuration du service de télémétrie
 */
export interface TelemetryConfig {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    attributes?: Record<string, string>;
}

/**
 * Service standardisé pour la télémétrie dans le contexte MCP
 */
export class OpenTelemetry {
    private tracer: api.Tracer;
    private resource: Resource;

    constructor(config: TelemetryConfig) {
        this.resource = new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
            [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion || '1.0.0',
            'deployment.environment': config.environment || 'development',
            'mcp.protocol.version': '2.0',
            ...config.attributes,
        });

        this.tracer = api.trace.getTracer(config.serviceName, config.serviceVersion);
    }

    /**
     * Démarre un span avec les attributs spécifiés
     */
    startSpan(name: string, options?: {
        kind?: api.SpanKind;
        attributes?: Record<string, api.AttributeValue>;
    }): api.Span {
        const span = this.tracer.startSpan(
            name,
            {
                kind: options?.kind || api.SpanKind.INTERNAL,
                attributes: options?.attributes,
            }
        );

        return span;
    }

    /**
     * Exécute une fonction dans le contexte d'un span
     */
    async withSpan<T>(
        name: string,
        fn: (span: api.Span) => Promise<T>,
        options?: {
            kind?: api.SpanKind;
            attributes?: Record<string, api.AttributeValue>;
        }
    ): Promise<T> {
        const span = this.startSpan(name, options);

        try {
            const result = await fn(span);
            span.end();
            return result;
        } catch (error) {
            span.setStatus({
                code: api.SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : String(error),
            });
            span.end();
            throw error;
        }
    }

    /**
     * Crée un contexte actif avec le span spécifié
     */
    withActiveSpan<T>(span: api.Span, fn: () => Promise<T>): Promise<T> {
        return api.context.with(api.trace.setSpan(api.context.active(), span), fn);
    }

    /**
     * Obtient le tracer sous-jacent
     */
    getTracer(): api.Tracer {
        return this.tracer;
    }

    /**
     * Crée des attributs standardisés pour MCP
     */
    createMCPAttributes(context: {
        requestId: string;
        agentId?: string;
        agentName?: string;
        sessionId?: string;
    }): Record<string, api.AttributeValue> {
        return {
            'mcp.request_id': context.requestId,
            'mcp.session_id': context.sessionId || 'unknown',
            'mcp.agent.id': context.agentId || 'unknown',
            'mcp.agent.name': context.agentName || 'unknown',
        };
    }
}