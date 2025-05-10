/**
 * Interfaces pour les workflows
 */

export interface Workflow {
  name: string;
  execute(): Promise<WorkflowResult>;
  addStep(step: WorkflowStep): void;
  removeStep(stepId: string): void;
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
