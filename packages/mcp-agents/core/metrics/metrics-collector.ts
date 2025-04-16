/**
 * Service de métriques pour les agents MCP
 * Collecte et expose les métriques opérationnelles des agents
 */

import * as os from 'os';
import { EventEmitter } from 'events';
import { AgentEvent } from '../types';

export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
}

export interface HistogramBuckets {
  buckets: number[];
}

export interface JobMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  success: boolean;
  agentId: string;
  jobId: string;
}

export class McpMetricsCollector {
  private metrics: Map<string, MetricValue[]> = new Map();
  private definitions: Map<string, MetricDefinition> = new Map();
  private histogramBuckets: Map<string, number[]> = new Map();
  private readonly maxDataPoints: number;
  private readonly retentionPeriod: number; // en ms
  private eventEmitter: EventEmitter = new EventEmitter();
  private cleanupInterval?: NodeJS.Timeout;
  private readonly systemMetricsEnabled: boolean;
  
  constructor(options: {
    maxDataPoints?: number;
    retentionPeriod?: number;
    collectSystemMetrics?: boolean;
  } = {}) {
    this.maxDataPoints = options.maxDataPoints || 1000;
    this.retentionPeriod = options.retentionPeriod || 24 * 60 * 60 * 1000; // 24h par défaut
    this.systemMetricsEnabled = options.collectSystemMetrics !== false;
  }
  
  /**
   * Initialisation du service de métriques
   */
  initialize(): void {
    // Définir les métriques de base
    this.registerMetric({
      name: 'mcp_agent_execution_total',
      help: 'Total number of agent executions',
      type: 'counter'
    });
    
    this.registerMetric({
      name: 'mcp_agent_execution_duration_seconds',
      help: 'Duration of agent executions in seconds',
      type: 'histogram'
    }, { buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600] });
    
    this.registerMetric({
      name: 'mcp_agent_execution_success_total',
      help: 'Total number of successful agent executions',
      type: 'counter'
    });
    
    this.registerMetric({
      name: 'mcp_agent_execution_failure_total',
      help: 'Total number of failed agent executions',
      type: 'counter'
    });
    
    this.registerMetric({
      name: 'mcp_agent_memory_usage_bytes',
      help: 'Memory usage of agent executions in bytes',
      type: 'gauge'
    });
    
    // Métriques système
    if (this.systemMetricsEnabled) {
      this.registerMetric({
        name: 'mcp_system_cpu_usage',
        help: 'CPU usage percentage',
        type: 'gauge'
      });
      
      this.registerMetric({
        name: 'mcp_system_memory_usage',
        help: 'Memory usage percentage',
        type: 'gauge'
      });
      
      this.registerMetric({
        name: 'mcp_system_load_average',
        help: 'System load average',
        type: 'gauge'
      });
      
      // Collecter les métriques système toutes les 10 secondes
      setInterval(() => this.collectSystemMetrics(), 10000);
    }
    
    // Nettoyer les métriques anciennes toutes les heures
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }
  
  /**
   * Arrêt du service de métriques
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
  
  /**
   * Enregistre un nouveau type de métrique
   */
  registerMetric(definition: MetricDefinition, options?: HistogramBuckets): void {
    this.definitions.set(definition.name, definition);
    
    // Initialiser les buckets pour les histogrammes
    if (definition.type === 'histogram' && options?.buckets) {
      this.histogramBuckets.set(definition.name, options.buckets);
    }
  }
  
  /**
   * Incrémente un compteur
   */
  incrementCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const def = this.definitions.get(name);
    if (!def || def.type !== 'counter') {
      console.warn(`Métrique ${name} non définie ou n'est pas un compteur`);
      return;
    }
    
    this.recordMetric(name, value, labels);
  }
  
  /**
   * Définit une valeur de jauge
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const def = this.definitions.get(name);
    if (!def || def.type !== 'gauge') {
      console.warn(`Métrique ${name} non définie ou n'est pas une jauge`);
      return;
    }
    
    this.recordMetric(name, value, labels);
  }
  
  /**
   * Enregistre une observation d'histogramme
   */
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const def = this.definitions.get(name);
    if (!def || def.type !== 'histogram') {
      console.warn(`Métrique ${name} non définie ou n'est pas un histogramme`);
      return;
    }
    
    this.recordMetric(name, value, labels);
  }
  
  /**
   * Enregistre les métriques d'un job d'agent
   */
  recordJobMetrics(metrics: JobMetrics): void {
    const { duration, success, agentId, jobId } = metrics;
    const labels = { agentId, jobId };
    
    // Incrémenter le compteur total
    this.incrementCounter('mcp_agent_execution_total', 1, labels);
    
    // Incrémenter le compteur de succès ou d'échec
    if (success) {
      this.incrementCounter('mcp_agent_execution_success_total', 1, labels);
    } else {
      this.incrementCounter('mcp_agent_execution_failure_total', 1, labels);
    }
    
    // Observer la durée d'exécution
    this.observeHistogram('mcp_agent_execution_duration_seconds', duration / 1000, labels);
    
    // Enregistrer l'utilisation mémoire si disponible
    if (metrics.memoryUsage !== undefined) {
      this.setGauge('mcp_agent_memory_usage_bytes', metrics.memoryUsage, labels);
    }
    
    // Émettre un événement pour les consommateurs de métriques
    this.eventEmitter.emit('job_metrics', { ...metrics });
  }
  
  /**
   * S'abonne aux événements d'un agent pour collecter automatiquement les métriques
   */
  watchAgent(agentId: string, events: EventEmitter): void {
    events.on(AgentEvent.COMPLETED, (result) => {
      if (!result.metrics) return;
      
      this.recordJobMetrics({
        duration: result.metrics.duration,
        startTime: result.metrics.startTime,
        endTime: result.metrics.endTime,
        memoryUsage: result.metrics.resourceUsage?.memory,
        success: result.success,
        agentId,
        jobId: result.jobId || 'unknown'
      });
    });
    
    events.on(AgentEvent.FAILED, (result) => {
      if (!result.metrics) return;
      
      this.recordJobMetrics({
        duration: result.metrics.duration,
        startTime: result.metrics.startTime,
        endTime: result.metrics.endTime,
        memoryUsage: result.metrics.resourceUsage?.memory,
        success: false,
        agentId,
        jobId: result.jobId || 'unknown'
      });
    });
  }
  
  /**
   * Enregistre une valeur de métrique
   */
  private recordMetric(name: string, value: number, labels: Record<string, string> = {}): void {
    const metricValues = this.metrics.get(name) || [];
    
    // Ajouter la nouvelle valeur
    metricValues.push({
      value,
      timestamp: Date.now(),
      labels
    });
    
    // Limiter le nombre de points de données
    if (metricValues.length > this.maxDataPoints) {
      metricValues.shift();
    }
    
    this.metrics.set(name, metricValues);
    
    // Émettre un événement pour les consommateurs de métriques
    this.eventEmitter.emit('metric', { name, value, timestamp: Date.now(), labels });
  }
  
  /**
   * Récupère les dernières valeurs d'une métrique
   */
  getMetric(name: string, options: { 
    since?: number,  // Timestamp depuis quand récupérer (ms)
    labels?: Partial<Record<string, string>> // Filtre sur les labels
  } = {}): MetricValue[] {
    const values = this.metrics.get(name) || [];
    
    return values.filter(metric => {
      // Filtrer par timestamp si spécifié
      if (options.since && metric.timestamp < options.since) {
        return false;
      }
      
      // Filtrer par labels si spécifiés
      if (options.labels) {
        for (const [key, value] of Object.entries(options.labels)) {
          if (metric.labels?.[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  /**
   * Récupère toutes les métriques sous forme de map
   */
  getAllMetrics(): Map<string, MetricValue[]> {
    return new Map(this.metrics);
  }
  
  /**
   * Récupère les définitions de métriques
   */
  getDefinitions(): Map<string, MetricDefinition> {
    return new Map(this.definitions);
  }
  
  /**
   * Nettoie les anciennes métriques
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.retentionPeriod;
    
    for (const [name, values] of this.metrics.entries()) {
      const filteredValues = values.filter(v => v.timestamp >= cutoff);
      this.metrics.set(name, filteredValues);
    }
  }
  
  /**
   * Collecte les métriques système
   */
  private collectSystemMetrics(): void {
    try {
      // CPU usage
      const cpus = os.cpus();
      const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + (1 - idle / total);
      }, 0) / cpus.length * 100;
      
      this.setGauge('mcp_system_cpu_usage', cpuUsage);
      
      // Memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = (usedMem / totalMem) * 100;
      
      this.setGauge('mcp_system_memory_usage', memoryUsagePercent);
      
      // Load average
      const loadAvg = os.loadavg()[0]; // 1 minute load average
      
      this.setGauge('mcp_system_load_average', loadAvg);
    } catch (error) {
      console.error('Erreur lors de la collecte des métriques système:', error);
    }
  }
  
  /**
   * S'abonne aux événements de métriques
   */
  on(event: 'metric' | 'job_metrics', listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * Exporte les métriques au format Prometheus
   */
  getPrometheusMetrics(): string {
    let output = '';
    
    for (const [name, definition] of this.definitions.entries()) {
      // Ajouter les commentaires d'aide
      output += `# HELP ${name} ${definition.help}\n`;
      output += `# TYPE ${name} ${definition.type}\n`;
      
      const values = this.metrics.get(name) || [];
      
      // Regrouper par combinaison de labels
      const groupedMetrics = new Map<string, MetricValue[]>();
      
      for (const value of values) {
        const labelsKey = this.getLabelsKey(value.labels || {});
        const group = groupedMetrics.get(labelsKey) || [];
        group.push(value);
        groupedMetrics.set(labelsKey, group);
      }
      
      // Générer les lignes de métriques
      for (const [labelsKey, metricsGroup] of groupedMetrics.entries()) {
        if (definition.type === 'counter') {
          // Pour un compteur, on prend la dernière valeur
          const lastValue = metricsGroup[metricsGroup.length - 1];
          output += `${name}${labelsKey} ${lastValue.value}\n`;
        } else if (definition.type === 'gauge') {
          // Pour une jauge, on prend la dernière valeur
          const lastValue = metricsGroup[metricsGroup.length - 1];
          output += `${name}${labelsKey} ${lastValue.value}\n`;
        } else if (definition.type === 'histogram') {
          // Pour un histogramme, calculer les buckets, sum et count
          const buckets = this.histogramBuckets.get(name) || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
          const values = metricsGroup.map(m => m.value);
          
          let count = 0;
          let sum = 0;
          
          // Calculer les buckets
          for (const bucket of buckets) {
            const leCount = values.filter(v => v <= bucket).length;
            output += `${name}_bucket${labelsKey}{le="${bucket}"} ${leCount}\n`;
            count += leCount;
          }
          
          // +Inf bucket
          output += `${name}_bucket${labelsKey}{le="+Inf"} ${values.length}\n`;
          
          // Sum
          sum = values.reduce((acc, val) => acc + val, 0);
          output += `${name}_sum${labelsKey} ${sum}\n`;
          
          // Count
          output += `${name}_count${labelsKey} ${values.length}\n`;
        }
      }
      
      output += '\n';
    }
    
    return output;
  }
  
  private getLabelsKey(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) {
      return '';
    }
    
    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `{${labelPairs}}`;
  }
}