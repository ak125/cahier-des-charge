import { BusinessAgent, AgentResult } from 'mcp-types';

export class BaseMemoAgent implements BusinessAgent {
  async process(operation: string, context: Record<string, any>): Promise<AgentResult> {
    // Déléguer aux méthodes spécifiques selon l'opération
    switch(operation) {
      default:
        return {
          success: false,
          error: `Opération ${operation} non supportée`
        };
    }
  }

}
