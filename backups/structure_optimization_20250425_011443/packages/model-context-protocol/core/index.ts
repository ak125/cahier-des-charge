// Stub implementation for Model Context Protocol Core

/**
 * Interface principale pour le protocole MCP
 */
export interface ModelContextProtocol {
  version: string;
  registerAgent(agentName: string, agent: MCPAgent): void;
  executeAgent(agentName: string, context: any): Promise<any>;
}

/**
 * Interface pour un agent MCP
 */
export interface MCPAgent {
  name: string;
  description?: string;
  category?: string;
  run(context: any): Promise<any>;
}

/**
 * Classe d'implémentation stub du protocole MCP
 */
export class MCPCore implements ModelContextProtocol {
  version = '1.0.0';
  private agents: Record<string, MCPAgent> = {};

  registerAgent(agentName: string, agent: MCPAgent): void {
    this.agents[agentName] = agent;
    console.log(`Agent ${agentName} enregistré dans le protocole MCP`);
  }

  async executeAgent(agentName: string, context: any): Promise<any> {
    if (!this.agents[agentName]) {
      throw new Error(`Agent ${agentName} non trouvé dans le registre MCP`);
    }
    console.log(`Exécution de l'agent ${agentName} via le protocole MCP`);
    return await this.agents[agentName].run(context);
  }
}

// Export de l'instance par défaut
export constDoDotmcpCore = new MCPCore();

// Fonction utilitaire pour créer un nouvel agent
export function createAgent(name: string, handler: (context: any) => Promise<any>, options?: { description?: string, category?: string }): MCPAgent {
  return {
    name,
    description: options?.description || '',
    category: options?.category || 'default',
    run: handler
  };
}

export defaultDoDotmcpCore;