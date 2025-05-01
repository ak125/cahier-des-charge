import * as client from 'prom-client';

// Création du registre et configuration
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Métriques pour les agents
export const agentExecutionTime = new client.Histogram({
  name: 'agent_execution_time_seconds',
  help: "Temps d'exécution des agents en secondes",
  labelNames: ['agent_name', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60],
});

export const agentExecutions = new client.Counter({
  name: 'agent_executions_total',
  help: "Nombre total d'exécutions des agents",
  labelNames: ['agent_name', 'status'],
});

export const agentErrors = new client.Counter({
  name: 'agent_errors_total',
  help: "Nombre total d'erreurs des agents",
  labelNames: ['agent_name', 'error_type'],
});

// Métriques pour le pipeline
export const pipelineProcessingTime = new client.Histogram({
  name: 'pipeline_processing_time_seconds',
  help: 'Temps de traitement du pipeline en secondes',
  labelNames: ['pipeline_step', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 300],
});

export const pipelineTasksProcessed = new client.Counter({
  name: 'pipeline_tasks_processed_total',
  help: 'Nombre total de tâches traitées par le pipeline',
  labelNames: ['pipeline_step', 'status'],
});

export const pipelineQueueSize = new client.Gauge({
  name: 'pipeline_queue_size',
  help: "Taille de la file d'attente du pipeline",
  labelNames: ['queue_name'],
});

// Enregistrement des métriques
register.registerMetric(agentExecutionTime);
register.registerMetric(agentExecutions);
register.registerMetric(agentErrors);
register.registerMetric(pipelineProcessingTime);
register.registerMetric(pipelineTasksProcessed);
register.registerMetric(pipelineQueueSize);

// Exposer les métriques au format Prometheus
export const getMetrics = async () => {
  return register.metrics();
};

// Fonction utilitaire pour mesurer le temps d'exécution d'une fonction
export const measureExecutionTime = async (name: string, fn: () => Promise<any>): Promise<any> => {
  const end = agentExecutionTime.startTimer({ agent_name: name });
  try {
    const result = await fn();
    end({ status: 'success' });
    agentExecutions.inc({ agent_name: name, status: 'success' });
    return result;
  } catch (error) {
    end({ status: 'error' });
    agentExecutions.inc({ agent_name: name, status: 'error' });
    agentErrors.inc({
      agent_name: name,
      error_type: error.name || 'unknown',
    });
    throw error;
  }
};
