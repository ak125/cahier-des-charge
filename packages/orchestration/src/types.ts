/**
 * Types pour la couche Orchestration
 */

export interface WorkflowConfig {
  name: string;
  steps: WorkflowStep[];
  maxConcurrency?: number;
  timeout?: number;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  parameters: Record<string, any>;
  dependsOn?: string[];
}

export interface WorkflowResult {
  id: string;
  status: 'success' | 'failure' | 'pending';
  results: Record<string, any>;
  errors?: Error[];
}
