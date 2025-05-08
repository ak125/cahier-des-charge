/**
 * Service MCP principal
 * Implémente les standards définis dans le document de standardisation des technologies
 */
import { v4 as uuidv4 } from 'uuid';
import {
    MCPContext,
    MCPContextSchema,
    MCPResponse,
    MCPErrorResponse,
    MCPTracing,
    MCPInput
} from '../schemas/mcp-context.schema';
import { OpenTelemetry } from '../telemetry/opentelemetry';

// Classe d'erreur de validation personnalisée
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Configuration de l'agent MCP
export interface MCPAgentConfig {
    id: string;
    name: string;
    capabilities?: string[];
    version?: string;
}

/**
 * Service principal pour le Model Context Protocol
 * Fournit des fonctionnalités pour traiter et valider les contextes MCP
 */
export class MCPService {
    constructor(
        private readonly agentConfig: MCPAgentConfig,
        private readonly telemetry: OpenTelemetry
    ) { }

    /**
     * Valide et enrichit un contexte MCP brut
     * @param rawContext Contexte MCP brut à traiter
     * @returns Contexte MCP validé et enrichi
     * @throws ValidationError si le contexte est invalide
     */
    async processContext(rawContext: unknown): Promise<MCPContext> {
        // Créer un span pour la télémétrie
        const span = this.telemetry.startSpan('mcp.process_context');

        try {
            // Validation avec Zod
            const validationResult = MCPContextSchema.safeParse(rawContext);

            if (!validationResult.success) {
                const errorMessage = validationResult.error.errors
                    .map(err => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');

                throw new ValidationError(`Contexte MCP invalide: ${errorMessage}`);
            }

            // Contexte validé
            const context = validationResult.data;

            // Enrichir avec les informations de l'agent
            context.agent = {
                ...context.agent,
                ...this.agentConfig
            };

            // Initialiser le traçage si nécessaire
            if (!context.tracing) {
                context.tracing = {};
            }

            // Intégrer avec la télémétrie
            context.tracing.traceId = span.spanContext().traceId;
            context.tracing.spanId = span.spanContext().spanId;

            // Ajouter des attributs au span
            span.setAttributes({
                'mcp.request_id': context.requestId,
                'mcp.version': context.version,
                'mcp.agent.id': context.agent.id,
                'mcp.session.id': context.session.id,
            });

            return context;
        } catch (error) {
            // Enregistrer l'erreur dans le span
            span.recordException(error as Error);
            span.setStatus({ code: 1 }); // ERROR
            throw error;
        } finally {
            // Terminer le span
            span.end();
        }
    }

    /**
     * Exécute une requête MCP
     * Cette méthode est conçue pour être surchargée par les classes dérivées
     * @param context Contexte MCP validé
     * @returns Résultat de l'exécution de la requête
     */
    async executeRequest(context: MCPContext): Promise<any> {
        // Cette méthode doit être surchargée par l'implémentation spécifique
        throw new Error('La méthode executeRequest doit être implémentée par le service spécifique');
    }

    /**
     * Formate une réponse MCP réussie
     * @param context Contexte MCP
     * @param result Résultat à formater
     * @returns Réponse MCP formatée
     */
    formatResponse(context: MCPContext, result: any): MCPResponse {
        return {
            requestId: context.requestId,
            timestamp: new Date().toISOString(),
            agent: {
                id: context.agent.id,
                name: context.agent.name,
                version: context.agent.version,
            },
            session: context.session.id,
            result,
            status: 'success',
            tracing: context.tracing
        };
    }

    /**
     * Formate une réponse d'erreur MCP
     * @param context Contexte MCP (peut être partiel ou invalide)
     * @param error Erreur à formater
     * @returns Réponse d'erreur MCP formatée
     */
    formatErrorResponse(context: any, error: Error): MCPErrorResponse {
        // Tenter d'extraire autant d'informations que possible du contexte
        const requestId = context?.requestId || uuidv4();
        const sessionId = context?.session?.id || uuidv4();
        const agentId = context?.agent?.id || this.agentConfig.id;
        const agentName = context?.agent?.name || this.agentConfig.name;
        const agentVersion = context?.agent?.version || this.agentConfig.version;
        const tracing = context?.tracing as MCPTracing | undefined;

        return {
            requestId,
            timestamp: new Date().toISOString(),
            agent: {
                id: agentId,
                name: agentName,
                version: agentVersion,
            },
            session: sessionId,
            error: {
                message: error.message,
                code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'PROCESSING_ERROR',
            },
            status: 'error',
            tracing
        };
    }

    /**
     * Crée un nouveau contexte MCP
     * @param input Entrée pour le contexte
     * @param sessionId ID de session optionnel (génère un UUID si non fourni)
     * @returns Nouveau contexte MCP
     */
    createContext(input: {
        query: string;
        parameters?: Record<string, any>;
        format?: 'text' | 'json' | 'markdown' | 'html';
    }, sessionId?: string): MCPContext {
        const now = new Date();
        const requestId = uuidv4();
        const session = sessionId || uuidv4();

        // Créer le contexte selon le schéma MCP
        return {
            requestId,
            timestamp: now.toISOString(),
            version: '2.0',
            agent: {
                id: this.agentConfig.id,
                name: this.agentConfig.name,
                capabilities: this.agentConfig.capabilities,
                version: this.agentConfig.version,
            },
            session: {
                id: session,
            },
            input: {
                query: input.query,
                parameters: input.parameters,
                format: input.format || 'text',
            },
        };
    }
}