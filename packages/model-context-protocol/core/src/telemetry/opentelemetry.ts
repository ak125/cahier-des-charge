/**
 * Intégration OpenTelemetry pour le Model Context Protocol
 * Suivant les standards définis dans le document de standardisation des technologies
 */
import {
    Context,
    TraceFlags,
    SpanStatusCode,
    SpanKind,
    trace,
    Span,
    Tracer,
    SpanOptions
} from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {
    SimpleSpanProcessor,
    BatchSpanProcessor,
    ConsoleSpanExporter
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

// Configuration de télémétrie
export interface TelemetryConfig {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    otlpEndpoint?: string;
    enableConsole?: boolean;
    samplingRatio?: number;
    debug?: boolean;
}

/**
 * Classe OpenTelemetry pour l'instrumentation du Model Context Protocol
 * Fournit des fonctionnalités de tracing et d'observabilité
 */
export class OpenTelemetry {
    private tracer: Tracer;
    private provider: NodeTracerProvider;
    private isInitialized: boolean = false;

    constructor(private readonly config: TelemetryConfig) {
        this.initialize();
    }

    /**
     * Initialise le provider OpenTelemetry
     * @private
     */
    private initialize(): void {
        if (this.isInitialized) {
            return;
        }

        try {
            // Créer le resource avec les informations du service
            const resource = Resource.default().merge(
                new Resource({
                    [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
                    [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion || '1.0.0',
                    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment || 'development',
                })
            );

            // Créer le provider de tracing
            this.provider = new NodeTracerProvider({
                resource,
                // Configuration du sampler selon la configuration
                // sampler: new ParentBasedSampler({
                //   root: new TraceIdRatioBasedSampler(this.config.samplingRatio || 1.0),
                // }),
            });

            // Ajouter des exporters
            if (this.config.otlpEndpoint) {
                // Ajouter l'exporter OTLP si un endpoint est configuré
                const otlpExporter = new OTLPTraceExporter({
                    url: this.config.otlpEndpoint,
                });
                this.provider.addSpanProcessor(
                    new BatchSpanProcessor(otlpExporter, {
                        maxQueueSize: 1000,
                        maxExportBatchSize: 100,
                    })
                );
            }

            // Ajouter un exporter console en mode debug ou si explicitement demandé
            if (this.config.debug || this.config.enableConsole) {
                this.provider.addSpanProcessor(
                    new SimpleSpanProcessor(new ConsoleSpanExporter())
                );
            }

            // Enregistrer le provider comme global
            this.provider.register();

            // Obtenir un tracer pour ce service
            this.tracer = trace.getTracer(
                this.config.serviceName,
                this.config.serviceVersion
            );

            this.isInitialized = true;
        } catch (error) {
            // En cas d'échec d'initialisation, créer un tracer no-op
            console.error('Échec de l\'initialisation d\'OpenTelemetry:', error);
            this.tracer = trace.getTracer('noop');
        }
    }

    /**
     * Démarre un nouveau span
     * @param name Nom du span
     * @param options Options du span
     * @returns Le span créé
     */
    startSpan(name: string, options: SpanOptions = {}): Span {
        return this.tracer.startSpan(name, {
            kind: SpanKind.SERVER,
            ...options,
        });
    }

    /**
     * Exécute une fonction dans le contexte d'un span
     * @param name Nom du span
     * @param fn Fonction à exécuter
     * @param options Options du span
     * @returns Résultat de la fonction
     */
    async withSpan<T>(
        name: string,
        fn: (span: Span) => Promise<T>,
        options: SpanOptions = {}
    ): Promise<T> {
        const span = this.startSpan(name, options);

        try {
            return await fn(span);
        } catch (error: any) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            throw error;
        } finally {
            span.end();
        }
    }

    /**
     * Crée un contexte de tracing à partir des informations fournies
     * @param traceId ID de trace
     * @param spanId ID de span
     * @param traceFlags Flags de trace
     * @returns Contexte de tracing
     */
    createContext(
        traceId: string,
        spanId: string,
        traceFlags: TraceFlags = TraceFlags.SAMPLED
    ): Context {
        return trace.setSpanContext(trace.context.active(), {
            traceId,
            spanId,
            traceFlags,
            isRemote: true,
        });
    }

    /**
     * Arrête proprement la télémétrie
     */
    async shutdown(): Promise<void> {
        if (this.provider) {
            await this.provider.shutdown();
        }
        this.isInitialized = false;
    }
}