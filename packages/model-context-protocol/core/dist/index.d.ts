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
export declare class MCPCore implements ModelContextProtocol {
    version: string;
    private agents;
    registerAgent(agentName: string, agent: MCPAgent): void;
    executeAgent(agentName: string, context: any): Promise<any>;
}
export declare const mcpCore: MCPCore;
export declare function createAgent(name: string, handler: (context: any) => Promise<any>, options?: {
    description?: string;
    category?: string;
}): MCPAgent;
export default mcpCore;
