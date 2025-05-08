// Types métier extraits de l'ancien mcp-core

export interface MigrationContext {
  sourceId: string;
  targetId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  metadata: Record<string, any>;
}

export interface ModuleAnalysis {
  name: string;
  dependencies: string[];
  complexity: number;
  testCoverage?: number;
  analysisDate: Date;
}

export interface MigrationResult {
  id: string;
  context: MigrationContext;
  results: {
    modules: ModuleAnalysis[];
    performance: {
      duration: number;
      memoryUsage: number;
    };
    qualityMetrics: {
      codeQuality: number;
      testCoverage: number;
      performanceScore: number;
    };
  };
}
