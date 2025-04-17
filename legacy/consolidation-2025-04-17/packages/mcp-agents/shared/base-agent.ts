import { AgentContext, AgentResult, McpAgent } from './types';

export abstract class BaseMcpAgent implements McpAgent {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  
  abstract execute(context: AgentContext): Promise<AgentResult>;
  
  async validate(context: AgentContext): Promise<boolean> {
    // Validation de base - peut être surchargée par les agents spécifiques
    return !!context && !!context.jobId;
  }
  
  async getStatus(): Promise<{ status: 'ready' | 'busy' | 'error'; message?: string }> {
    return { status: 'ready' };
  }
  
  protected async logExecution(context: AgentContext, message: string): Promise<void> {
    console.log(`[${this.name}] ${message} (JobID: ${context.jobId})`);
  }
}
