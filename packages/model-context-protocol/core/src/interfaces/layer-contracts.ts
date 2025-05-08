/**
 * layer-contracts.ts
 *
 * Définition des contrats d'interface entre les trois couches de l'architecture MCP OS
 * Ce fichier sert de référence centrale pour toutes les interactions entre les couches
 * et standardise les interfaces des agents selon leur appartenance.
 *
 * @version 2.0.0
 * @since 2025-05-07
 */

import { z } from 'zod';
import { MCPContext, MCPResponse, MCPErrorResponse } from '../schemas/mcp-context.schema';

// ======================================================
// INTERFACES DE BASE COMMUNES À TOUTES LES COUCHES
// ======================================================

/**
 * Interface de base pour tous les agents dans le système MCP
 * Chaque agent, quelle que soit sa couche, doit implémenter cette interface
 */
export interface BaseMCPAgent {
    /**
     * Identifiant unique de l'agent (UUID v4 recommandé)
     */
    id: string;

    /**
     * Nom lisible et descriptif de l'agent
     */
    name: string;

    /**
     * Type d'agent (orchestre, coordinateur, business, etc.)
     */
    type: string;

    /**
     * Version de l'agent suivant la spécification SemVer
     */
    version: string;

    /**
     * Couche à laquelle appartient l'agent
     */
    layer: 'orchestration' | 'coordination' | 'business';

    /**
     * Capacités spécifiques de l'agent
     */
    capabilities: string[];

    /**
     * Initialise l'agent avec les options spécifiées
     * @param options Options spécifiques d'initialisation
     */
    initialize(options?: Record<string, any>): Promise<void>;

    /**
     * Vérifie si l'agent est prêt à recevoir des demandes
     */
    isReady(): boolean;

    /**
     * Arrête proprement l'agent et libère les ressources
     */
    shutdown(): Promise<void>;

    /**
     * Traite un contexte MCP et retourne une réponse
     * @param context Le contexte MCP contenant la requête
     */
    processContext(context: MCPContext): Promise<MCPResponse | MCPErrorResponse>;

    /**
     * Récupère les métadonnées de l'agent
     */
    getMetadata(): AgentMetadata;
}

/**
 * Interface pour les métadonnées des agents
 */
export interface AgentMetadata {
    id: string;
    name: string;
    type: string;
    version: string;
    layer: 'orchestration' | 'coordination' | 'business';
    capabilities: string[];
    description?: string;
    author?: string;
    lastUpdated?: Date;
    healthStatus?: 'healthy' | 'degraded' | 'unhealthy';
    metrics?: Record<string, any>;
    dependencies?: string[];
}

// ======================================================
// COUCHE ORCHESTRATION
// ======================================================

/**
 * Interface pour les agents de la couche orchestration
 */
export interface OrchestrationAgent extends BaseMCPAgent {
    /**
     * Valeur fixe pour identifier la couche
     */
    layer: 'orchestration';

    /**
     * Lance un workflow avec les paramètres spécifiés
     * @param workflowDefinition Définition du workflow à exécuter
     * @param options Options d'exécution
     */
    startWorkflow(workflowDefinition: WorkflowDefinition, options?: WorkflowOptions): Promise<string>;

    /**
     * Récupère le statut d'un workflow en cours d'exécution
     * @param workflowId Identifiant du workflow
     */
    getWorkflowStatus(workflowId: string): Promise<WorkflowStatus>;

    /**
     * Arrête un workflow en cours d'exécution
     * @param workflowId Identifiant du workflow à arrêter
     */
    stopWorkflow(workflowId: string): Promise<boolean>;

    /**
     * Liste les workflows actifs avec filtrage optionnel
     */
    listActiveWorkflows(filter?: WorkflowFilter): Promise<WorkflowSummary[]>;
}

/**
 * Interface spécifique pour les orchestrateurs
 */
export interface OrchestratorAgent extends OrchestrationAgent {
    type: 'orchestrator';

    /**
     * Enregistre un nouvel agent dans le système
     */
    registerAgent(agent: BaseMCPAgent): Promise<boolean>;

    /**
     * Désenregistre un agent du système
     */
    unregisterAgent(agentId: string): Promise<boolean>;

    /**
     * Découvre les agents disponibles selon des critères
     */
    discoverAgents(criteria?: DiscoveryCriteria): Promise<AgentMetadata[]>;
}

/**
 * Interface spécifique pour les agents de surveillance
 */
export interface MonitorAgent extends OrchestrationAgent {
    type: 'monitor';

    /**
     * Configure la surveillance pour une cible spécifique
     */
    setupMonitoring(target: MonitoringTarget, options: MonitoringOptions): Promise<string>;

    /**
     * Récupère les métriques pour une cible surveillée
     */
    getMetrics(targetId: string, timeRange: TimeRange): Promise<MetricsData>;

    /**
     * Configure des alertes basées sur des seuils
     */
    setupAlerts(targetId: string, alertConfig: AlertConfig): Promise<string>;
}

/**
 * Interface spécifique pour les planificateurs
 */
export interface SchedulerAgent extends OrchestrationAgent {
    type: 'scheduler';

    /**
     * Planifie une tâche pour exécution future
     */
    scheduleTask(task: TaskDefinition, options: ScheduleOptions): Promise<string>;

    /**
     * Annule une tâche planifiée
     */
    cancelScheduledTask(taskId: string): Promise<boolean>;

    /**
     * Liste les tâches planifiées
     */
    listScheduledTasks(filter?: TaskFilter): Promise<ScheduledTask[]>;
}

// ======================================================
// COUCHE COORDINATION
// ======================================================

/**
 * Interface pour les agents de la couche coordination
 */
export interface CoordinationAgent extends BaseMCPAgent {
    /**
     * Valeur fixe pour identifier la couche
     */
    layer: 'coordination';

    /**
     * Enregistre un service dans le registre
     */
    registerService(service: ServiceInfo): Promise<boolean>;

    /**
     * Désenregistre un service du registre
     */
    unregisterService(serviceId: string): Promise<boolean>;

    /**
     * Découvre les services disponibles selon des critères
     */
    discoverServices(criteria?: DiscoveryCriteria): Promise<ServiceInfo[]>;
}

/**
 * Interface spécifique pour les agents de médiation
 */
export interface MediatorAgent extends CoordinationAgent {
    type: 'mediator';

    /**
     * Coordonne l'exécution d'une tâche entre plusieurs agents
     */
    coordinateTask(taskDefinition: TaskDefinition): Promise<TaskResult>;

    /**
     * Distribue des sous-tâches aux agents appropriés
     */
    distributeSubtasks(parentTaskId: string, subtasks: TaskDefinition[]): Promise<string[]>;

    /**
     * Agrège les résultats de plusieurs sous-tâches
     */
    aggregateResults(taskId: string, results: TaskResult[]): Promise<AggregatableResult>;
}

/**
 * Interface spécifique pour les agents de pont
 */
export interface BridgeAgent extends CoordinationAgent {
    type: 'bridge';

    /**
     * Établit une connexion vers un système externe
     */
    connect(connectionConfig: ConnectionConfig): Promise<Connection>;

    /**
     * Ferme une connexion existante
     */
    disconnect(connectionId: string): Promise<boolean>;

    /**
     * Transfère des données entre systèmes
     */
    transferData(source: string, destination: string, data: any): Promise<TransferResult>;
}

/**
 * Interface spécifique pour les agents d'adaptation
 */
export interface AdapterAgent extends CoordinationAgent {
    type: 'adapter';

    /**
     * Transforme les données d'un format à un autre
     */
    transform(data: any, targetFormat: string, options?: TransformOptions): Promise<any>;

    /**
     * Vérifie la compatibilité des données avec un format cible
     */
    checkCompatibility(data: any, targetFormat: string): Promise<CompatibilityResult>;

    /**
     * Identifie le format d'entrée des données
     */
    detectFormat(data: any): Promise<FormatDetectionResult>;
}

// ======================================================
// COUCHE BUSINESS
// ======================================================

/**
 * Interface pour les agents de la couche business
 */
export interface BusinessAgent extends BaseMCPAgent {
    /**
     * Valeur fixe pour identifier la couche
     */
    layer: 'business';
}

/**
 * Interface spécifique pour les agents d'analyse
 */
export interface AnalyzerAgent extends BusinessAgent {
    type: 'analyzer';

    /**
     * Analyse des données selon les options spécifiées
     */
    analyze(data: any, options?: AnalysisOptions): Promise<AnalysisResult>;

    /**
     * Extrait des insights spécifiques des données
     */
    extractInsights(data: any, types: string[]): Promise<Insight[]>;

    /**
     * Compare deux ensembles de données
     */
    compareData(dataA: any, dataB: any, options?: CompareOptions): Promise<ComparisonResult>;
}

/**
 * Interface spécifique pour les agents générateurs
 */
export interface GeneratorAgent extends BusinessAgent {
    type: 'generator';

    /**
     * Génère du contenu selon les spécifications
     */
    generate(spec: GenerationSpec): Promise<GeneratedContent>;

    /**
     * Modifie du contenu existant selon les spécifications
     */
    modify(content: any, modifications: ModificationSpec): Promise<GeneratedContent>;

    /**
     * Récupère l'historique des générations
     */
    getGenerationHistory(filters?: HistoryFilters): Promise<GenerationRecord[]>;
}

/**
 * Interface spécifique pour les agents validateurs
 */
export interface ValidatorAgent extends BusinessAgent {
    type: 'validator';

    /**
     * Valide du contenu selon des règles spécifiées
     */
    validate(content: any, rules: ValidationRules): Promise<ValidationResult>;

    /**
     * Suggère des corrections pour du contenu non valide
     */
    suggestFixes(content: any, validationResult: ValidationResult): Promise<Suggestion[]>;

    /**
     * Corrige automatiquement le contenu si possible
     */
    autoFix(content: any, validationResult: ValidationResult, options?: FixOptions): Promise<CorrectedContent>;
}

/**
 * Interface spécifique pour les agents d'analyse syntaxique
 */
export interface ParserAgent extends BusinessAgent {
    type: 'parser';

    /**
     * Parse des données brutes en structure exploitable
     */
    parse(rawData: string | Buffer, options?: ParseOptions): Promise<ParseResult>;

    /**
     * Convertit les données d'un format à un autre
     */
    format(data: any, targetFormat: string): Promise<string>;

    /**
     * Extrait des informations structurées de données non structurées
     */
    extract(data: any, extractionRules: ExtractionRule[]): Promise<ExtractionResult>;
}

// ======================================================
// TYPES DE DONNÉES PARTAGÉS ENTRE LES COUCHES
// ======================================================

export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    version: string;
    steps: WorkflowStep[];
    inputs: WorkflowInput[];
    outputs: WorkflowOutput[];
    errorHandling?: ErrorHandlingStrategy;
    timeouts?: TimeoutConfig;
    metadata?: Record<string, any>;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    agentId?: string;
    taskDefinition?: TaskDefinition;
    condition?: string;
    dependencies?: string[];
    retryPolicy?: RetryPolicy;
    timeoutMs?: number;
    parameters?: Record<string, any>;
}

export interface WorkflowInput {
    name: string;
    type: string;
    required: boolean;
    default?: any;
    validation?: ValidationRule;
}

export interface WorkflowOutput {
    name: string;
    type: string;
    mapping: string;
}

export interface WorkflowStatus {
    id: string;
    state: 'pending' | 'running' | 'completed' | 'failed' | 'canceled' | 'suspended';
    progress?: number;
    currentStep?: string;
    startedAt?: Date;
    completedAt?: Date;
    error?: ErrorDetail;
    outputs?: Record<string, any>;
    metrics?: WorkflowMetrics;
}

export interface WorkflowMetrics {
    duration: number;
    resourceUsage: {
        cpu?: number;
        memory?: number;
        io?: number;
    };
    stepMetrics: Record<string, StepMetric>;
}

export interface StepMetric {
    duration: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    retryCount?: number;
    error?: string;
}

export interface WorkflowOptions {
    priority?: number;
    startAt?: Date;
    timeoutMs?: number;
    maxRetries?: number;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
}

export interface WorkflowFilter {
    state?: ('pending' | 'running' | 'completed' | 'failed' | 'canceled')[];
    startedAfter?: Date;
    startedBefore?: Date;
    namePattern?: string;
    tags?: string[];
}

export interface WorkflowSummary {
    id: string;
    name: string;
    state: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
    progress?: number;
    startedAt?: Date;
    completedAt?: Date;
    version: string;
    tags?: string[];
}

export interface TaskDefinition {
    id: string;
    name: string;
    type: string;
    handler: string;
    data?: any;
    priority?: number;
    timeoutMs?: number;
    retryPolicy?: RetryPolicy;
    metadata?: Record<string, any>;
}

export interface TaskResult {
    taskId: string;
    status: 'success' | 'failure' | 'canceled' | 'timeout';
    result?: any;
    error?: ErrorDetail;
    startedAt: Date;
    completedAt: Date;
    duration: number;
    metadata?: Record<string, any>;
}

export interface TaskFilter {
    status?: ('scheduled' | 'running' | 'completed' | 'failed' | 'canceled')[];
    scheduledAfter?: Date;
    scheduledBefore?: Date;
    namePattern?: string;
    type?: string[];
}

export interface AggregatableResult {
    id: string;
    data: any;
    metadata: Record<string, any>;
    errors?: ErrorDetail[];
}

export interface ScheduleOptions {
    cron?: string;
    delay?: number;
    repeat?: boolean;
    startAt?: Date;
    endAt?: Date;
    timezone?: string;
    maxExecutions?: number;
}

export interface ScheduledTask {
    id: string;
    taskDefinition: TaskDefinition;
    options: ScheduleOptions;
    status: 'scheduled' | 'running' | 'completed' | 'failed' | 'canceled';
    nextRunTime?: Date;
    lastRunTime?: Date;
    executionCount: number;
    createdAt: Date;
    lastStatus?: TaskResult;
}

export interface MonitoringTarget {
    id: string;
    type: 'workflow' | 'agent' | 'service' | 'system' | 'custom';
    address?: string;
    name?: string;
    labels?: Record<string, string>;
}

export interface MonitoringOptions {
    interval?: number;
    metrics?: string[];
    alertThresholds?: Record<string, number>;
    retention?: {
        duration: number;
        resolution: 'raw' | 'minute' | 'hour' | 'day';
    };
}

export interface AlertConfig {
    name: string;
    condition: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    channels: string[];
    cooldown?: number;
    metadata?: Record<string, any>;
}

export interface TimeRange {
    from: Date;
    to: Date;
}

export interface MetricsData {
    metrics: Record<string, Array<{
        timestamp: Date;
        value: number;
    }>>;
    summary?: Record<string, {
        min: number;
        max: number;
        avg: number;
        sum: number;
        count: number;
    }>;
}

export interface ServiceInfo {
    id: string;
    name: string;
    version: string;
    type: string;
    endpoint?: string;
    capabilities?: string[];
    status: 'active' | 'inactive' | 'degraded';
    lastSeen?: Date;
    metadata?: Record<string, any>;
}

export interface DiscoveryCriteria {
    type?: string | string[];
    capability?: string | string[];
    version?: string;
    metadata?: Record<string, any>;
    minHealthScore?: number;
}

export interface ConnectionConfig {
    id: string;
    type: string;
    uri?: string;
    credentials?: {
        type: 'api_key' | 'oauth2' | 'basic' | 'cert';
        data: Record<string, any>;
    };
    options?: Record<string, any>;
    rateLimit?: {
        requestsPerMinute: number;
        burstLimit?: number;
    };
}

export interface Connection {
    id: string;
    status: 'connected' | 'disconnected' | 'error' | 'rate_limited';
    error?: string;
    connectedAt?: Date;
    disconnectedAt?: Date;
    metadata?: Record<string, any>;
}

export interface TransferResult {
    success: boolean;
    transferId: string;
    transferredCount?: number;
    error?: string;
    timestamp: string;
    details?: Record<string, any>;
}

export interface TransformOptions {
    preserveStructure?: boolean;
    includeMetadata?: boolean;
    validationLevel?: 'none' | 'warn' | 'strict';
    customMappings?: Record<string, string>;
}

export interface CompatibilityResult {
    compatible: boolean;
    issues?: Array<{
        path: string;
        expected: string;
        found: string;
        severity: 'warning' | 'error';
    }>;
    compatibilityScore: number;
}

export interface FormatDetectionResult {
    format: string;
    confidence: number;
    alternatives?: Array<{
        format: string;
        confidence: number;
    }>;
}

export interface AnalysisOptions {
    depth?: number;
    focus?: string[];
    excludePatterns?: string[];
    includeDetails?: boolean;
    algorithms?: string[];
    contextData?: any;
}

export interface AnalysisResult {
    id: string;
    summary: string;
    details?: any;
    insights?: Insight[];
    createdAt: Date;
    score?: number;
    confidence?: number;
}

export interface Insight {
    id: string;
    type: string;
    description: string;
    confidence: number;
    evidence?: any;
    importance: number;
    category?: string;
    actionable?: boolean;
}

export interface CompareOptions {
    ignoreFields?: string[];
    threshold?: number;
    algorithm?: 'exact' | 'fuzzy' | 'semantic';
    includeDetails?: boolean;
}

export interface ComparisonResult {
    similarity: number;
    differences: Array<{
        path: string;
        valueA: any;
        valueB: any;
        type: 'added' | 'removed' | 'changed' | 'unchanged';
    }>;
    summary: string;
}

export interface GenerationSpec {
    type: string;
    template?: string;
    inputs: Record<string, any>;
    constraints?: Record<string, any>;
    options?: Record<string, any>;
    quality?: 'draft' | 'standard' | 'high';
}

export interface GeneratedContent {
    id: string;
    type: string;
    content: any;
    metadata?: Record<string, any>;
    generatedAt: Date;
    version: string;
}

export interface ModificationSpec {
    operations: Array<{
        type: 'insert' | 'update' | 'delete' | 'replace';
        path: string;
        value?: any;
        condition?: string;
    }>;
    preserveStructure: boolean;
    validateAfter: boolean;
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
    validatedAt: Date;
    score?: number;
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
}

export interface ValidationRule {
    type: string;
    parameters?: Record<string, any>;
    message?: string;
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
    confidence: number;
    impact: 'low' | 'medium' | 'high';
}

export interface FixOptions {
    autoFix?: boolean;
    fixTypes?: string[];
    maxChanges?: number;
    dryRun?: boolean;
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
    validAfterCorrection: boolean;
}

export interface ParseOptions {
    format?: string;
    strict?: boolean;
    encoding?: string;
    skipValidation?: boolean;
}

export interface ParseResult {
    data: any;
    errors?: Array<{
        message: string;
        line?: number;
        column?: number;
        code?: string;
    }>;
    format: string;
    valid: boolean;
}

export interface ExtractionRule {
    name: string;
    selector: string;
    type: string;
    required?: boolean;
    default?: any;
    transformation?: string;
}

export interface ExtractionResult {
    data: Record<string, any>;
    missing: string[];
    invalid: Record<string, string>;
    success: boolean;
}

export interface HistoryFilters {
    from?: Date;
    to?: Date;
    type?: string;
    status?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
}

export interface GenerationRecord {
    id: string;
    spec: GenerationSpec;
    result: GeneratedContent;
    timestamp: Date;
    status: 'success' | 'failure';
    error?: string;
    duration: number;
    metadata?: Record<string, any>;
}

export interface ErrorDetail {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    source?: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    retryable: boolean;
}

export interface RetryPolicy {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
    retryableErrors?: string[];
}

export interface ErrorHandlingStrategy {
    onError: 'fail' | 'continue' | 'retry' | 'fallback';
    errorTypes?: Record<string, 'fail' | 'continue' | 'retry' | 'fallback'>;
    fallbackAction?: string;
    notifyChannels?: string[];
}

export interface TimeoutConfig {
    workflowTimeoutMs: number;
    stepDefaultTimeoutMs: number;
    stepTimeouts?: Record<string, number>;
}

// ======================================================
// SCHÉMAS ZOD POUR LA VALIDATION DES CONTRATS
// ======================================================

// Les schémas Zod permettent de valider les données échangées entre les couches
// Ces schémas correspondent aux interfaces définies ci-dessus

export const workflowDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    version: z.string(),
    steps: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            agentId: z.string().optional(),
            taskDefinition: z.any().optional(),
            condition: z.string().optional(),
            dependencies: z.array(z.string()).optional(),
            retryPolicy: z.any().optional(),
            timeoutMs: z.number().optional(),
            parameters: z.record(z.string(), z.any()).optional(),
        })
    ),
    inputs: z.array(
        z.object({
            name: z.string(),
            type: z.string(),
            required: z.boolean(),
            default: z.any().optional(),
            validation: z.any().optional(),
        })
    ),
    outputs: z.array(
        z.object({
            name: z.string(),
            type: z.string(),
            mapping: z.string(),
        })
    ),
    errorHandling: z.any().optional(),
    timeouts: z.any().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

export const taskDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    handler: z.string(),
    data: z.any().optional(),
    priority: z.number().optional(),
    timeoutMs: z.number().optional(),
    retryPolicy: z.any().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

// ======================================================
// TYPES UTILITAIRES POUR LES COMMUNICATIONS ENTRE COUCHES
// ======================================================

/**
 * Type d'événement pour la communication entre couches
 */
export enum LayerEventType {
    // Événements d'orchestration
    WORKFLOW_STARTED = 'workflow.started',
    WORKFLOW_COMPLETED = 'workflow.completed',
    WORKFLOW_FAILED = 'workflow.failed',
    WORKFLOW_STEP_STARTED = 'workflow.step.started',
    WORKFLOW_STEP_COMPLETED = 'workflow.step.completed',

    // Événements de coordination
    TASK_ASSIGNED = 'task.assigned',
    TASK_COMPLETED = 'task.completed',
    TASK_FAILED = 'task.failed',
    SERVICE_REGISTERED = 'service.registered',
    SERVICE_UNREGISTERED = 'service.unregistered',

    // Événements business
    DATA_PROCESSED = 'data.processed',
    VALIDATION_COMPLETED = 'validation.completed',
    ANALYSIS_COMPLETED = 'analysis.completed',
    GENERATION_COMPLETED = 'generation.completed',

    // Événements système
    SYSTEM_ERROR = 'system.error',
    SYSTEM_ALERT = 'system.alert',
    METRICS_COLLECTED = 'metrics.collected'
}

/**
 * Structure d'un événement entre couches
 */
export interface LayerEvent<T = any> {
    type: LayerEventType;
    source: {
        layer: 'orchestration' | 'coordination' | 'business';
        agentId: string;
        agentType: string;
    };
    timestamp: Date;
    id: string;
    correlationId?: string;
    payload: T;
    metadata?: Record<string, any>;
}

/**
 * Utilitaire pour créer un événement entre couches
 */
export function createLayerEvent<T>(
    type: LayerEventType,
    layer: 'orchestration' | 'coordination' | 'business',
    agentId: string,
    agentType: string,
    payload: T,
    correlationId?: string
): LayerEvent<T> {
    return {
        type,
        source: {
            layer,
            agentId,
            agentType
        },
        timestamp: new Date(),
        id: crypto.randomUUID(),
        correlationId,
        payload
    };
}