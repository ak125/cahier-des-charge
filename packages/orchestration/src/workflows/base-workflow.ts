/**
 * Workflow de base pour la couche Orchestration
 */
import { WorkflowConfig, WorkflowResult } from '../types';

export class BaseWorkflow {
  protected config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  async execute(): Promise<WorkflowResult> {
    // Implémentation de base
    return {
      id: this.config.name,
      status: 'pending',
      results: {}
    };
  }
}
