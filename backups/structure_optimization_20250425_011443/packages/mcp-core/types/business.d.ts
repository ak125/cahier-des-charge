/**
 * Définitions de types pour les agents Business MCP
 * @version 1.0.0
 * @date 2025-04-19
 */

declare module '@workspaces/cahier-des-charge/src/core/interfaces/business' {
  import { BaseAgent, AgentContext, AgentResult } from @workspaces/cahier-des-charge/src/core/interfaces/BaseAgentstructure-agent';

  export interface BusinessAgent extends BaseAgent {
    readonly domain: string;
    readonly capabilities: string[];
    getSummary(): Promise<{ domain: string, capabilities: string[], status: string }>;
  }

  export interface AnalyzerAgent extends BusinessAgent {
    analyze<T, R>(input: T, context?: AgentContext): Promise<R>;
  }

  export interface GeneratorAgent extends BusinessAgent {
    generate<T, R>(input: T, context?: AgentContext): Promise<R & { generatedFiles?: string[] }>;
  }

  export interface ValidatorAgent extends BusinessAgent {
    validate<T>(input: T, context?: AgentContext): Promise<AgentResult & { isValid: boolean, errors?: string[] }>;
  }

  export interface ParserAgent extends BusinessAgent {
    parse<T, R>(input: T, context?: AgentContext): Promise<R>;
  }

  export default BusinessAgent;
}