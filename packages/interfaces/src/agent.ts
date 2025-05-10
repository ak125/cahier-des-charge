/**
 * Interfaces pour les agents
 */

export interface Agent {
  name: string;
  execute(input: any): Promise<AgentResult>;
  configure(config: AgentConfig): void;
}

export interface AgentConfig {
  name: string;
  type: string;
  parameters: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data: any;
  errors?: Error[];
}
