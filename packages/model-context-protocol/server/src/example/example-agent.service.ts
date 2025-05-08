/**
 * Service d'agent d'exemple qui implémente l'interface MCPAgent
 * Montre comment créer un agent conforme aux standards MCP
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MCPContext } from '@model-context-protocol/core';
import { MCPNestService } from '../services/mcp-nest.service';

interface AgentResponse {
    message: string;
    timestamp: string;
    parameters: Record<string, any>;
    analysis?: {
        sentiment: string;
        tokens: number;
        language: string;
    }
}

@Injectable()
export class ExampleAgentService implements OnModuleInit {
    constructor(private readonly mcpService: MCPNestService) { }

    /**
     * Initialisation du module
     * Enregistre l'agent auprès du service MCP à l'initialisation
     */
    onModuleInit() {
        // Enregistrement de l'agent avec une implémentation
        this.mcpService.registerAgent('example-agent', this.processRequest.bind(this));
        console.log('Agent exemple enregistré avec succès');
    }

    /**
     * Traite une requête MCP selon le protocole standardisé
     * Cette méthode est appelée par le service MCP lorsqu'une requête est reçue pour cet agent
     * @param context Contexte MCP validé
     * @returns Résultat de la requête
     */
    async processRequest(context: MCPContext): Promise<any> {
        console.log(`Traitement de la requête MCP: ${context.input.query}`);

        // Logique de traitement spécifique à l'agent
        // Dans un cas réel, cela pourrait être un appel à un LLM, une analyse de données, etc.
        const response: AgentResponse = {
            message: `Votre requête "${context.input.query}" a été traitée avec succès par l'agent exemple`,
            timestamp: new Date().toISOString(),
            parameters: context.input.parameters || {},
        };

        // Si des paramètres spécifiques sont fournis dans la requête, on peut les utiliser
        if (context.input.parameters?.analyze === true) {
            response.analysis = {
                sentiment: 'positive',
                tokens: context.input.query.split(' ').length,
                language: 'fr',
            };
        }

        // On peut utiliser le format de sortie spécifié dans la requête
        if (context.input.format === 'markdown') {
            return {
                content: `# Réponse de l'agent exemple\n\n**Requête:** ${context.input.query}\n\n**Réponse:** ${response.message}`,
                format: 'markdown'
            };
        }

        return response;
    }
}