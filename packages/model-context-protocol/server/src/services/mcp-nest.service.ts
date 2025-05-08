/**
 * Service MCP pour NestJS
 * Adapter pour intégrer le Model Context Protocol avec NestJS
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
    MCPService,
    MCPAgentConfig,
    OpenTelemetry,
    TelemetryConfig,
    MCPContext
} from '@model-context-protocol/core';

/**
 * Configuration pour le service MCP NestJS
 */
export interface MCPNestConfig {
    agent: MCPAgentConfig;
    telemetry: TelemetryConfig;
}

/**
 * Service MCP pour NestJS
 * Fournit une intégration NestJS standardisée pour le protocole MCP
 */
@Injectable()
export class MCPNestService implements OnModuleInit {
    private mcpService: MCPService;
    private agentImplementations: Map<string, (context: MCPContext) => Promise<any>> = new Map();

    constructor(private readonly config: MCPNestConfig) {
        const telemetry = new OpenTelemetry(this.config.telemetry);
        this.mcpService = new MCPService(this.config.agent, telemetry);
    }

    /**
     * Initialisation du module
     */
    onModuleInit() {
        // Override de la méthode executeRequest du MCPService
        this.mcpService.executeRequest = async (context: MCPContext): Promise<any> => {
            const agentId = context.agent.id;
            const implementation = this.agentImplementations.get(agentId);

            if (!implementation) {
                throw new Error(`Agent '${agentId}' non implémenté`);
            }

            return implementation(context);
        };
    }

    /**
     * Enregistre une implémentation d'agent
     */
    registerAgent(agentId: string, implementation: (context: MCPContext) => Promise<any>) {
        this.agentImplementations.set(agentId, implementation);
    }

    /**
     * Traite une requête MCP
     */
    async processRequest(rawContext: any): Promise<any> {
        try {
            // Validation et enrichissement du contexte
            const context = await this.mcpService.processContext(rawContext);

            // Exécution de la requête
            const result = await this.mcpService.executeRequest(context);

            // Formatage de la réponse
            return this.mcpService.formatResponse(context, result);
        } catch (error: unknown) {
            // S'assurer que error est traité comme un Error
            const errorObject = error instanceof Error
                ? error
                : new Error(typeof error === 'string' ? error : 'Erreur inconnue');

            return this.mcpService.formatErrorResponse(rawContext, errorObject);
        }
    }

    /**
     * Crée un nouveau contexte MCP
     */
    createContext(input: {
        query: string;
        parameters?: Record<string, any>;
        format?: 'text' | 'json' | 'markdown' | 'html';
    }, sessionId?: string): MCPContext {
        return this.mcpService.createContext(input, sessionId);
    }
}