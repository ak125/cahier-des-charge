/**
 * Agent de base pour la couche Business
 */
import { AgentConfig, AgentResult } from '../types';

export class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async execute(input: any): Promise<AgentResult> {
    // Implémentation de base
    return {
      success: true,
      data: {}
    };
  }
}
