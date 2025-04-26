export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retry';

export interface LangfuseTrace {
  traceId: string;
  name: string;
  startTime: string;
  endTime?: string;
  tags: string[];
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  modelName?: string;
  projectId: string;
}

export interface GitHubPR {
  prNumber: number;
  title: string;
  url: string;
  status: 'draft' | 'open' | 'merged' | 'closed';
  createdAt: string;
  updatedAt: string;
  author: string;
  repository: string;
}

export interface ExecutionHistoryEntry {
  id: string;
  startTime: string;
  endTime?: string;
  status: JobStatus;
  duration?: number;
  error?: string;
  attempt: number;
}

export interface TemporalJob {
  id: string;
  workflowId: string;
  runId?: string;
  type: string;
  name: string;
  status: JobStatus;
  progress?: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  attempts: number;
  maxAttempts: number;
  taskQueue: string;
  priority: number;
  metadata?: Record<string, any>;
  // Nouveaux champs
  langfuseTraces?: LangfuseTrace[];
 DoDoDoDoDoDotgithubPR?: GitHubPR;
  executionHistory?: ExecutionHistoryEntry[];
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  isRecurring?: boolean;
}

export interface JobStatistics {
  workflowsStarted: number;
  workflowsCompleted: number;
  workflowsFailed: number;
  jobsProcessed: number;
  jobsCompleted: number;
  jobsFailed: number;
  lastUpdated: string;
}

/**
 * Récupère les jobs Temporal récents
 */
export async function getRecentTemporalJobs(limit = 10): Promise<TemporalJob[]> {
  // Dans une implémentation réelle, cette fonction ferait un appel à l'API ou à la base de données
  // Pour l'exemple, nous retournons des données statiques
  return Promise.resolve([
    {
      id: 'job-1',
      workflowId: 'codeTransformationWorkflow-1713356421789',
      runId: '29ad4685-96b3-41b3-9dfa-e4a95a3c4c78',
      type: 'codeTransformationWorkflow',
      name: 'Migration UserController.php',
      status: 'completed',
      progress: 100,
      startTime: new Date(Date.now() - 1200000).toISOString(), // 20 min avant
      endTime: new Date(Date.now() - 900000).toISOString(), // 15 min avant
      duration: 300000,
      attempts: 1,
      maxAttempts: 3,
      taskQueue: DoDotmcp-task-queue',
      priority: 1,
      metadata: {
        sourceFile: 'UserController.php',
        targetFile: 'UserController.ts'
      },
      langfuseTraces: [
        {
          traceId: 'trace_01HRX2V5K8ABCDEFGHIJKLMNOP',
          name: 'PHP to TypeScript Migration',
          startTime: new Date(Date.now() - 1200000).toISOString(),
          endTime: new Date(Date.now() - 900000).toISOString(),
          tags: ['php-to-ts', 'controller', 'migration'],
          promptTokens: 1245,
          completionTokens: 2389,
          totalTokens: 3634,
          modelName: 'gpt-4',
          projectId: DoDotmcp-migration'
        }
      ],
     DoDoDoDoDoDotgithubPR: {
        prNumber: 324,
        title: 'Migration: Convert UserController from PHP to TypeScript',
        url: 'https:/DoDoDoDoDoDotgithub.com/your-org/your-repo/pull/324',
        status: 'merged',
        createdAt: new Date(Date.now() - 1100000).toISOString(),
        updatedAt: new Date(Date.now() - 800000).toISOString(),
        author: DoDotmcp-bot',
        repository: 'your-org/your-repo'
      },
      executionHistory: [
        {
          id: 'exec-1',
          startTime: new Date(Date.now() - 1200000).toISOString(),
          endTime: new Date(Date.now() - 900000).toISOString(),
          status: 'completed',
          duration: 300000,
          attempt: 1
        }
      ]
    },
    {
      id: 'job-2',
      workflowId: 'codeAnalysisWorkflow-1713356821789',
      runId: '7c5f12d0-3e98-4a7b-b432-f8c7d34a1bbb',
      type: 'codeAnalysisWorkflow',
      name: 'Analyse CartService.php',
      status: 'running',
      progress: 65,
      startTime: new Date(Date.now() - 600000).toISOString(), // 10 min avant
      attempts: 1,
      maxAttempts: 3,
      taskQueue: DoDotmcp-task-queue',
      priority: 2,
      metadata: {
        sourceFile: 'CartService.php'
      },
      langfuseTraces: [
        {
          traceId: 'trace_01HRX2V5K8QRSTUVWXYZABCDEF',
          name: 'PHP Code Analysis',
          startTime: new Date(Date.now() - 600000).toISOString(),
          tags: ['code-analysis', 'php', 'cartservice'],
          promptTokens: 3872,
          completionTokens: 1240,
          totalTokens: 5112,
          modelName: 'gpt-4',
          projectId: DoDotmcp-migration'
        }
      ],
      executionHistory: [
        {
          id: 'exec-2',
          startTime: new Date(Date.now() - 600000).toISOString(),
          status: 'running',
          attempt: 1
        }
      ]
    },
    {
      id: 'job-3',
      workflowId: 'codeAuditWorkflow-1713355821789',
      runId: '4a1bbb7c-5f12d0-3e98-4a7b-b432-f8c7d34a',
      type: 'codeAuditWorkflow',
      name: 'Audit PaymentProcessor.ts',
      status: 'failed',
      progress: 30,
      startTime: new Date(Date.now() - 1800000).toISOString(), // 30 min avant
      endTime: new Date(Date.now() - 1700000).toISOString(), // 28 min avant
      duration: 100000,
      error: 'TypeScript compilation error in PaymentProcessor.ts',
      attempts: 2,
      maxAttempts: 3,
      taskQueue: DoDotmcp-task-queue',
      priority: 1,
      metadata: {
        sourceFile: 'PaymentProcessor.ts',
        errorLine: 42
      },
      langfuseTraces: [
        {
          traceId: 'trace_01HRX2V5K8GHIJKLMNOPQRSTUV',
          name: 'TypeScript Security Audit',
          startTime: new Date(Date.now() - 1800000).toISOString(),
          endTime: new Date(Date.now() - 1700000).toISOString(),
          tags: ['security-audit', 'typescript', 'payment'],
          promptTokens: 2150,
          completionTokens: 890,
          totalTokens: 3040,
          modelName: 'gpt-4',
          projectId: DoDotmcp-migration'
        }
      ],
      executionHistory: [
        {
          id: 'exec-3a',
          startTime: new Date(Date.now() - 2400000).toISOString(),
          endTime: new Date(Date.now() - 2350000).toISOString(),
          status: 'failed',
          error: 'Network timeout while accessing TypeScript compiler',
          duration: 50000,
          attempt: 1
        },
        {
          id: 'exec-3b',
          startTime: new Date(Date.now() - 1800000).toISOString(),
          endTime: new Date(Date.now() - 1700000).toISOString(),
          status: 'failed',
          error: 'TypeScript compilation error in PaymentProcessor.ts',
          duration: 100000,
          attempt: 2
        }
      ]
    },
    {
      id: 'job-4',
      workflowId: 'migrationWorkflow-1713358821789',
      runId: '3e98-4a7b-b432-7c5f12d0-f8c7d34a1bbb',
      type: 'migrationWorkflow',
      name: 'Migration OrderService.php',
      status: 'pending',
      startTime: new Date(Date.now() - 300000).toISOString(), // 5 min avant
      attempts: 0,
      maxAttempts: 3,
      taskQueue: DoDotmcp-task-queue',
      priority: 3,
      metadata: {
        sourceFile: 'OrderService.php'
      },
      isRecurring: true,
      frequency: 'daily',
      executionHistory: [
        {
          id: 'exec-4a',
          startTime: new Date(Date.now() - 86400000 - 600000).toISOString(), // hier
          endTime: new Date(Date.now() - 86400000 - 300000).toISOString(),
          status: 'completed',
          duration: 300000,
          attempt: 1
        },
        {
          id: 'exec-4b',
          startTime: new Date(Date.now() - 300000).toISOString(),
          status: 'pending',
          attempt: 1
        }
      ]
    }
  ]);
}

/**
 * Récupère les statistiques des jobs Temporal
 */
export async function getTemporalJobStatistics(): Promise<JobStatistics> {
  // Dans une implémentation réelle, cette fonction ferait un appel à l'API ou à la base de données
  return Promise.resolve({
    workflowsStarted: 42,
    workflowsCompleted: 35,
    workflowsFailed: 4,
    jobsProcessed: 78,
    jobsCompleted: 72,
    jobsFailed: 6,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Récupère l'historique complet d'exécution pour un workflow
 */
export async function getJobExecutionHistory(workflowId: string): Promise<ExecutionHistoryEntry[]> {
  // Dans une implémentation réelle, cette fonction appellerait l'API Temporal pour obtenir l'historique
  console.log(`Récupération de l'historique pour le workflow ${workflowId}`);
  
  // Exemple de simulation pour le job-3 (celui qui a échoué plusieurs fois)
  if (workflowId === 'codeAuditWorkflow-1713355821789') {
    return Promise.resolve([
      {
        id: 'exec-3a',
        startTime: new Date(Date.now() - 2400000).toISOString(),
        endTime: new Date(Date.now() - 2350000).toISOString(),
        status: 'failed',
        error: 'Network timeout while accessing TypeScript compiler',
        duration: 50000,
        attempt: 1
      },
      {
        id: 'exec-3b',
        startTime: new Date(Date.now() - 1800000).toISOString(),
        endTime: new Date(Date.now() - 1700000).toISOString(),
        status: 'failed',
        error: 'TypeScript compilation error in PaymentProcessor.ts',
        duration: 100000,
        attempt: 2
      }
    ]);
  }
  
  return Promise.resolve([]);
}

/**
 * Annule un job Temporal en cours d'exécution
 */
export async function cancelTemporalJob(workflowId: string): Promise<boolean> {
  // Dans une implémentation réelle, cette fonction appellerait l'API Temporal pour annuler le workflow
  console.log(`Annulation du workflow ${workflowId}`);
  return Promise.resolve(true);
}

/**
 * Relance un job Temporal échoué
 */
export async function retryTemporalJob(workflowId: string): Promise<boolean> {
  // Dans une implémentation réelle, cette fonction appellerait l'API Temporal pour relancer le workflow
  console.log(`Relance du workflow ${workflowId}`);
  return Promise.resolve(true);
}

/**
 * Ouvre une trace Langfuse dans un nouvel onglet
 */
export async function openLangfuseTrace(traceId: string, projectId: string): Promise<void> {
  // Dans une implémentation réelle, cette fonction construirait l'URL et l'ouvrirait
  const url = `https://cloud.langfuse.com/${projectId}/traces/${traceId}`;
  console.log(`Ouverture de la trace Langfuse: ${url}`);
  window.open(url, '_blank');
}

/**
 * Récupère les exécutions programmées à venir pour un workflow récurrent
 */
export async function getUpcomingScheduledExecutions(workflowId: string, count: number = 3): Promise<{ scheduledTime: string }[]> {
  // Dans une implémentation réelle, cette fonction appellerait l'API Temporal pour obtenir les exécutions programmées
  console.log(`Récupération des exécutions programmées pour ${workflowId}`);
  
  // Exemple pour le job récurrent
  if (workflowId === 'migrationWorkflow-1713358821789') {
    const now = Date.now();
    return Promise.resolve([
      { scheduledTime: new Date(now + 86400000).toISOString() },  // demain
      { scheduledTime: new Date(now + 2 * 86400000).toISOString() },  // après-demain
      { scheduledTime: new Date(now + 3 * 86400000).toISOString() }   // dans 3 jours
    ]);
  }
  
  return Promise.resolve([]);
}