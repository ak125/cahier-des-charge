/**
 * Types pour le dashboard d'administration MCP
 */

export interface MigrationStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  failed: number;
  lastUpdated: string;
}

export interface QAScores {
  overall: number;
  requiredFields: number;
  validationRules: number;
  dataConsistency: number;
  uiComponents: number;
}

export type AgentStatus = 'ready' | 'busy' | 'error';

export interface Agent {
  name: string;
  status: AgentStatus;
  lastRun: string;
  jobsCompleted: number;
  error?: string;
}

export type MigrationStatus = 'planned' | 'in_progress' | 'completed' | 'failed';

export interface Migration {
  id: string;
  name: string;
  status: MigrationStatus;
  route: string;
  startedAt?: string;
  completedAt?: string;
  qaScore?: number;
  seoScore?: number;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface McpJob {
  id: string;
  type: 'analyze' | 'generate' | 'validate' | 'migrate';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  agent: string;
  sourceFile?: string;
  targetFile?: string;
  result?: any;
  error?: string;
}