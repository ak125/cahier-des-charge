/**
 * Agent de base - Interface commune à tous les agents MCP
 * 
 * Cette interface définit les méthodes et propriétés de base que tous
 * les agents MCP doivent implémenter, quelle que soit leur couche ou type.
 */
export interface BaseAgent {
  /**
   * Identifiant unique de l'agent
   */
  id: string;

  /**
   * Nom descriptif de l'agent
   */
  name: string;

  /**
   * Type d'agent (analyzer, generator, validator, etc.)
   */
  type: string;

  /**
   * Version de l'agent
   */
  version: string;

  /**
   * Initialise l'agent avec des options spécifiques
   * @param options Options d'initialisation
   */
  initialize(options?: Record<string, any>): Promise<void>;

  /**
   * Indique si l'agent est prêt à être utilisé
   * @returns Vrai si l'agent est prêt
   */
  isReady(): boolean;

  /**
   * Arrête et nettoie l'agent
   */
  shutdown(): Promise<void>;

  /**
   * Récupère les métadonnées de l'agent
   * @returns Les métadonnées
   */
  getMetadata(): Record<string, any>;
}

/**
 * Types communs pour les agents MCP
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: Array<any>;
  [key: string]: any;
}

export interface WorkflowStatus {
  id: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  [key: string]: any;
}

export interface TaskDefinition {
  id: string;
  name: string;
  handler: string;
  data?: any;
  [key: string]: any;
}

export interface ScheduleOptions {
  cron?: string;
  delay?: number;
  repeat?: boolean;
  startAt?: Date;
  endAt?: Date;
  [key: string]: any;
}

export interface ScheduledTask {
  id: string;
  taskDefinition: TaskDefinition;
  options: ScheduleOptions;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'canceled';
  nextRunTime?: Date;
  [key: string]: any;
}

export interface MonitoringTarget {
  id: string;
  type: 'workflow' | 'agent' | 'service' | 'system';
  address?: string;
  [key: string]: any;
}

export interface MonitoringOptions {
  interval?: number;
  metrics?: string[];
  alertThresholds?: Record<string, number>;
  [key: string]: any;
}

export interface TimeRange {
  from: Date;
  to: Date;
}

export interface MetricsData {
  [key: string]: any;
}

export interface ConnectionConfig {
  id: string;
  type: string;
  url?: string;
  credentials?: Record<string, any>;
  options?: Record<string, any>;
  [key: string]: any;
}

export interface Connection {
  id: string;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
  [key: string]: any;
}

export interface TransferResult {
  success: boolean;
  error?: string;
  transferredCount?: number;
  [key: string]: any;
}

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  endpoints?: string[];
  capabilities?: string[];
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface DiscoveryCriteria {
  type?: string;
  status?: string;
  capabilities?: string[];
  [key: string]: any;
}

export interface AnalysisOptions {
  depth?: number;
  focus?: string[];
  excludePatterns?: string[];
  includeDetails?: boolean;
  [key: string]: any;
}

export interface AnalysisResult {
  id: string;
  summary: string;
  details?: any;
  insights?: Insight[];
  createdAt: Date;
  [key: string]: any;
}

export interface Insight {
  id: string;
  type: string;
  description: string;
  confidence: number;
  evidence?: any;
  [key: string]: any;
}

export interface GenerationSpec {
  type: string;
  template?: string;
  inputs: Record<string, any>;
  options?: Record<string, any>;
  [key: string]: any;
}

export interface GeneratedContent {
  id: string;
  type: string;
  content: any;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: Array<{
    code: string;
    message: string;
    path?: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings?: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
  [key: string]: any;
}

export interface ValidationRules {
  schema?: any;
  patterns?: Array<{
    pattern: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  customRules?: Array<{
    id: string;
    validator: (content: any) => Promise<boolean>;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  [key: string]: any;
}

export interface Suggestion {
  id: string;
  type: string;
  description: string;
  path?: string;
  replacements?: Array<{
    text: string;
    description?: string;
  }>;
  [key: string]: any;
}

export interface FixOptions {
  autoFix?: boolean;
  fixTypes?: string[];
  maxChanges?: number;
  [key: string]: any;
}

export interface CorrectedContent {
  content: any;
  changeCount: number;
  changes: Array<{
    path: string;
    before: any;
    after: any;
    reason: string;
  }>;
  [key: string]: any;
}

export interface ParseOptions {
  format?: string;
  strict?: boolean;
  [key: string]: any;
}

export interface ParseResult {
  data: any;
  errors?: Array<{
    message: string;
    line?: number;
    column?: number;
  }>;
  [key: string]: any;
}

export interface HistoryFilters {
  from?: Date;
  to?: Date;
  type?: string;
  status?: string;
  [key: string]: any;
}

export interface GenerationRecord {
  id: string;
  spec: GenerationSpec;
  result: GeneratedContent;
  timestamp: Date;
  status: 'success' | 'failure';
  error?: string;
  [key: string]: any;
}
