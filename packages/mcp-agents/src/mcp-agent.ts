import { getConfig } from '@workspaces/mcp-config';
// Agent MCP de base extrait de l'ancien mcp-core
import { AgentContext, AgentOptions, AgentResult, BaseAgent } from '@workspaces/mcp-types';

export abstract class MCPAgent implements BaseAgent {
  protected context: AgentContext;

  constructor(public options: AgentOptions) {
    this.context = {
      logger: console,
      config: getConfig(),
    };
  }

  async initialize(): Promise<boolean> {
    // Logique d'initialisation commune à tous les agents MCP
    try {
      this.context.logger.info(`Initializing agent: ${this.options.name} v${this.options.version}`);
      return true;
    } catch (error) {
      this.context.logger.error(`Failed to initialize agent: ${error}`);
      return false;
    }
  }

  abstract execute(params: Record<string, any>): Promise<AgentResult>;

  protected createResult(success: boolean, data: any, errors?: string[]): AgentResult {
    return {
      success,
      data,
      errors,
      timestamp: new Date().toISOString(),
      metadata: {
        agentName: this.options.name,
        agentVersion: this.options.version,
      },
    };
  }

  async cleanup(): Promise<void> {
    // Nettoyage commun à tous les agents MCP
    this.context.logger.info(`Cleaning up agent: ${this.options.name}`);
  }
}
