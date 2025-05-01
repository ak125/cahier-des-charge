export interface AgentContext {
  jobId: string;
  sourceFile?: string;
  targetFile?: string;
  options?: Record<string, any>;
  dryRun?: boolean;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
  score?: number;
  duration?: number;
}

export interface McpAgent {
  name: string;
  version: string;
  description: string;
  execute(context: AgentContext): Promise<AgentResult>;
  validate?(context: AgentContext): Promise<boolean>;
  getStatus?(): Promise<{ status: 'ready' | 'busy' | 'error'; message?: string }>;
}
