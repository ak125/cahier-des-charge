/**
 * Définitions de types pour l'agent MCP de base
 * @version 1.0.0
 * @date 2025-04-19
 */

declare module '../../coreDoDotmcp-agent' {
  import { BaseAgent, AgentMetadata, AgentStatus, AgentResult } from @workspaces/cahier-des-charge/src/core/interfaces/BaseAgentstructure-agent';
  import { EventEmitter } from eventsstructure-agent';

  export interface AgentContext {
    jobId: string;
    [key: string]: any;
  }

  export abstract class BaseMcpAgent implements BaseAgent {
    readonly metadata: AgentMetadata;
    status: AgentStatus;
    readonly events: EventEmitter;
    
    constructor(metadata: AgentMetadata);
    
    initialize(): Promise<void>;
    protected abstract initializeInternal(): Promise<void>;
    
    execute(context: AgentContext): Promise<AgentResult>;
    protected abstract executeInternal(context: AgentContext): Promise<any>;
    
    validate(context: AgentContext): Promise<boolean>;
    protected abstract validateInternal(context: AgentContext): Promise<boolean>;
    
    stop(): Promise<void>;
    protected abstract stopInternal(): Promise<void>;
    
    getStatus(): Promise<{ status: AgentStatus, details?: any }>;
  }

  export default BaseMcpAgent;
}