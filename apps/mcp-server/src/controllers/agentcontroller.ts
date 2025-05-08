import { agentRegistry, executeAgent } from '@fafaDoDotmcp-agents';
import { Body, Controller, HttpException, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { Agent, AgentApiSchemas, ExecuteAgentRequestSchema } from '../schemas/agent-schemas';
import { TypeBoxConfig, validateSchema } from '../../../packages/schema-validation/src';

// Pipe de validation NestJS utilisant TypeBox
class TypeBoxValidationPipe {
  constructor(private schema: any) { }

  transform(value: any) {
    const result = validateSchema(this.schema, value);

    if (!result.valid) {
      const errors = result.errors || [];
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Validation échouée',
          details: errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return value;
  }
}

@Controller('agents')
export class AgentController {
  @Post('execute')
  @UsePipes(new TypeBoxValidationPipe(ExecuteAgentRequestSchema))
  async executeAgent(@Body() request: any) {
    try {
      console.info(`Exécution de l'agent avec ID: ${request.agentId}`);

      // Récupérer l'agent par son ID (logique simplifiée pour l'exemple)
      const agentName = this.getAgentNameById(request.agentId);

      // Exécuter l'agent avec les données d'entrée
      const result = await executeAgent(agentName, request.input);

      // Construire une réponse conforme au schéma
      return {
        executionId: request.agentId, // Utiliser un UUID réel en production
        status: 'completed',
        result: result,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        executionTimeMs: 0 // À calculer en réalité
      };
    } catch (error) {
      console.error(`Erreur lors de l'exécution de l'agent ${request.agentId}:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `Échec de l'exécution de l'agent: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('list')
  getAvailableAgents() {
    // Convertir les agents existants au format du schéma Agent
    const agents: Agent[] = Object.keys(agentRegistry).map(name => ({
      id: `agent-${name}`, // Générer un vrai UUID en production
      name: name,
      description: agentRegistry[name].description || 'Aucune description disponible',
      version: '1.0.0',
      type: 'analyzer',
      status: 'active',
      configuration: {},
      capabilities: [],
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Utiliser le format de réponse standardisé
    return {
      success: true,
      data: {
        items: agents,
        total: agents.length,
        page: 1,
        pageSize: agents.length,
        totalPages: 1
      }
    };
  }

  // Méthode d'aide pour obtenir le nom de l'agent à partir de son ID
  private getAgentNameById(agentId: string): string {
    // Logique simplifiée pour l'exemple
    // En réalité, vous devriez récupérer cela depuis une base de données
    const agentNames = Object.keys(agentRegistry);
    const index = parseInt(agentId.replace('agent-', '')) % agentNames.length;
    return agentNames[index] || agentNames[0];
  }
}