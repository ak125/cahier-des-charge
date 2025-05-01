// Types d'agents extraits de l'ancien mcp-core

export interface AgentOptions {
  name: string;
  version: string;
  category: string;
  capabilities: string[];
  configOptions?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data: any;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AnalysisOptions {
  depth: number;
  includeTests: boolean;
  targetPath: string;
  excludePatterns?: string[];
  analysisType: 'static' | 'dynamic' | 'hybrid';
}
