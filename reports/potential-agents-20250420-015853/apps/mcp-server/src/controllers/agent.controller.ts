import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { agentRegistry, executeAgent } from '@fafaDoDotmcp-agents';

interface AgentRequestDto {
  agentName: string;
  context: any;
}

@Controller('agents')
export class AgentController {
  @Post('execute')
  async executeAgent(@Body() request: AgentRequestDto) {
    try {
      console.info(`Exécution de l'agent : @fafaDoDotmcp-agents/${request.agentName}`);
      const result = await executeAgent(request.agentName, request.context);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Erreur lors de l'exécution de l'agent ${request.agentName}:`, error);
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
    return {
      success: true,
      agents: Object.keys(agentRegistry).map(name => ({
        name,
        description: agentRegistry[name].description || 'Aucune description disponible'
      }))
    };
  }
}