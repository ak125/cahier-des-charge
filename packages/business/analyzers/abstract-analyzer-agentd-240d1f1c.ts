/**
 * abstract-analyzer-agentd-240d1f1c
 * 
 * Architecture en trois couches : Couche business
 * 
 * Cet agent implémente l'interface canonique définie dans:
 * /workspaces/cahier-des-charge/packages/migrated-agents/business/abstract-analyzer-agentd-240d1f1c.ts
 * 
 * Migré le 2025-05-08
 */

/**
 * Définitions de types pour l'agent abstrait d'analyse
 * @version 1.0.0
 * @date 2025-04-19
 */

declare module '../../core/abstract-analyzer-agent' {
  import { AnalyzerAgent } from '@core/interfaces/business/analyzer-agent';;
  import { AgentContext, AgentResult,  } from '@core/interfaces/base/base-agent';;

  export interface AnalyzerConfig {
    id: string;
    name: string;
    version: string;
    type?: string;
    description?: string;
  }

  export abstract class AbstractAnalyzerAgent<InputType, OutputType> implements AnalyzerAgent {
    readonly metadata: {
      id: string;
      type: string;
      name: string;
      version: string;
      description?: string;
    };
    readonly domain: string;
    readonly capabilities: string[];
    status: 'ready' | 'busy' | 'error' | 'stopped';
    readonly events: import('events').EventEmitter;

    constructor(config: AnalyzerConfig);

    initialize(): Promise<void>;
    protected abstract initializeInternal(): Promise<void>;

    execute(context: AgentContext): Promise<AgentResult>;

    analyze<I = InputType, O = OutputType>(input: I, context?: AgentContext): Promise<O>;
    protected abstract analyzeInternal(
      input: InputType,
      context?: AgentContext
    ): Promise<OutputType>;

    validate(context: AgentContext): Promise<boolean>;
    protected abstract validateInternal(context: AgentContext): Promise<boolean>;

    stop(): Promise<void>;
    protected abstract stopInternal(): Promise<void>;

    getStatus(): Promise<{ status: 'ready' | 'busy' | 'error' | 'stopped'; details?: any }>;
    getSummary(): Promise<{ domain: string; capabilities: string[]; status: string }>;
  }

  export default AbstractAnalyzerAgent;
}
