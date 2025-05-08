/**
 * Module principal de l'application d'exemple
 */
import { Module } from '@nestjs/common';
import { MCPModule } from '../mcp.module';
import { ExampleAgentService } from './example-agent.service';

@Module({
    imports: [
        // Configuration du module MCP avec les options standardisées
        MCPModule.forRoot({
            agent: {
                id: 'example-agent',
                name: 'Agent Exemple',
                capabilities: ['text-generation', 'content-analysis'],
                version: '1.0.0',
            },
            telemetry: {
                serviceName: 'mcp-example-service',
                serviceVersion: '1.0.0',
                environment: 'development',
            },
            enableSwagger: true,
        }),
    ],
    providers: [ExampleAgentService],
})
export class AppModule {
    // Initialisation de l'application avec l'agent d'exemple
    constructor(private readonly exampleAgentService: ExampleAgentService) {
        // L'agent sera enregistré dans le constructeur du service
    }
}