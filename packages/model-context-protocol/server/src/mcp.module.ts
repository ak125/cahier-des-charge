/**
 * Module MCP pour NestJS
 * Module principal pour l'intégration du Model Context Protocol avec NestJS
 */
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MCPController } from './controllers/mcp.controller';
import { MCPNestService, MCPNestConfig } from './services/mcp-nest.service';

/**
 * Options de configuration pour le module MCP
 */
export interface MCPModuleOptions {
    /**
     * Configuration de l'agent
     */
    agent: {
        id: string;
        name: string;
        capabilities: string[];
        version: string;
    };

    /**
     * Configuration de la télémétrie
     */
    telemetry: {
        serviceName: string;
        serviceVersion?: string;
        environment?: string;
        attributes?: Record<string, string>;
    };

    /**
     * Active la documentation Swagger
     */
    enableSwagger?: boolean;
}

/**
 * Token d'injection pour les options du module MCP
 */
export const MCP_MODULE_OPTIONS = 'MCP_MODULE_OPTIONS';

/**
 * Module NestJS pour le Model Context Protocol
 */
@Module({
    controllers: [MCPController],
})
export class MCPModule {
    /**
     * Configure le module MCP avec les options spécifiées
     * @param options Options de configuration pour le module MCP
     */
    static forRoot(options: MCPModuleOptions): DynamicModule {
        // Provider pour les options du module
        const optionsProvider: Provider = {
            provide: MCP_MODULE_OPTIONS,
            useValue: options,
        };

        // Provider pour le service MCP
        const mcpServiceProvider: Provider = {
            provide: MCPNestService,
            useFactory: () => {
                const config: MCPNestConfig = {
                    agent: {
                        id: options.agent.id,
                        name: options.agent.name,
                        capabilities: options.agent.capabilities,
                        version: options.agent.version,
                    },
                    telemetry: {
                        serviceName: options.telemetry.serviceName,
                        serviceVersion: options.telemetry.serviceVersion,
                        environment: options.telemetry.environment,
                        attributes: options.telemetry.attributes,
                    },
                };
                return new MCPNestService(config);
            },
        };

        return {
            module: MCPModule,
            controllers: [MCPController],
            providers: [optionsProvider, mcpServiceProvider],
            exports: [mcpServiceProvider],
        };
    }

    /**
     * Configure le module MCP pour un contexte asynchrone
     * Utile lorsque les options de configuration sont chargées depuis un ConfigService
     * @param options Options asynchrones pour le module MCP
     */
    static forRootAsync(options: {
        inject?: any[];
        useFactory: (...args: any[]) => Promise<MCPModuleOptions> | MCPModuleOptions;
    }): DynamicModule {
        // Provider pour le service MCP
        const mcpServiceProvider: Provider = {
            provide: MCPNestService,
            useFactory: async (...args: any[]) => {
                const config = await options.useFactory(...args);
                return new MCPNestService({
                    agent: config.agent,
                    telemetry: config.telemetry,
                });
            },
            inject: options.inject || [],
        };

        return {
            module: MCPModule,
            controllers: [MCPController],
            providers: [mcpServiceProvider],
            exports: [mcpServiceProvider],
        };
    }
}