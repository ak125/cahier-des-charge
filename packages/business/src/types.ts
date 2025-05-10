/**
 * Types pour la couche Business
 */

export interface AgentConfig {
  name: string;
  type: string;
  parameters: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data: any;
  errors?: Error[];
}

export interface AnalyzerConfig {
  target: string;
  depth?: number;
  filters?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning' | 'info';
}
