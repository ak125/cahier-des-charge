// Types d'agent de base extraits de l'ancien mcp-core
import { AgentOptions, AgentResult } from './agent-types';

export interface BaseAgent {
  options: AgentOptions;

  initialize(): Promise<boolean>;

  execute(params: Record<string, any>): Promise<AgentResult>;

  validate?(input: any): boolean;

  cleanup?(): Promise<void>;
}

export interface AgentContext {
  logger: any;
  config: Record<string, any>;
  services?: Record<string, any>;
}
