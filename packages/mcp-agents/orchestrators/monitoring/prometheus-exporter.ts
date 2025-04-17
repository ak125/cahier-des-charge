import * as client from 'prom-client';
import { createLogger } from '../../utils/logger';
import { SystemMetrics } from '../scheduler/system-monitor';
import express from 'express';
import http from 'http';

/**
 * Configuration de l'exporteur Prometheus
 */
export interface PrometheusExporterConfig {
  port: number;                // Port d'écoute du serveur HTTP
  endpoint: string;            // Endpoint pour les métriques (par défaut: /metrics)
  defaultLabels: Record<string, string>; // Labels par défaut pour toutes les métriques
  collectDefaultMetrics: boolean; // Collecter les métriques Node.js par défaut
}

/**
 * Service d'exportation de métriques vers Prometheus
 * Expose les métriques de performance des migrations et de l'orchestrateur
 */
export class PrometheusExporter {
  private logger = createLogger('PrometheusExporter');
  private config: PrometheusExporterConfig;
  private server: http.Server | null = null;
  private registry: client.Registry;

  // Métriques définies
  private workflowGauge: client.Gauge<string>;
  private workflowDurationHistogram: client.Histogram<string>;
  private workflowErrorCounter: client.Counter<string>;
  private workflowStepsGauge: client.Gauge<string>;
  private systemResourcesGauge: client.Gauge<string>;
  private retryCounter: client.Counter<string>;
  private activeWorkflowsGauge: client.Gauge<string>;
  private migrationProgressGauge: client.Gauge<string>;

  constructor(config: Partial<PrometheusExporterConfig> = {}) {
    this.config = {
      port: 9090,
      endpoint: '/metrics',
      defaultLabels: {
        app: 'mcp-orchestrator',
        environment: process.env.NODE_ENV || 'development'
      },
      collectDefaultMetrics: true,
      ...config
    };

    // Initialiser le registre
    this.registry = new client.Registry();
    
    // Ajouter les labels par défaut
    this.registry.setDefaultLabels(this.config.defaultLabels);

    // Initialiser les métriques
    this.initializeMetrics();

    // Collecter les métriques Node.js par défaut si demandé
    if (this.config.collectDefaultMetrics) {
      client.collectDefaultMetrics({ register: this.registry });
    }
    
    this.logger.info('Prometheus exporter initialized');
  }

  /**
   * Initialise toutes les métriques Prometheus
   */
  private initializeMetrics(): void {
    // Gauge pour suivre le statut des workflows
    this.workflowGauge = new client.Gauge({
      name: 'mcp_workflow_status',
      help: 'Statut des workflows de migration (0: en échec, 1: en cours, 2: complété)',
      labelNames: ['workflow_id', 'workflow_name', 'priority']
    });
    this.registry.registerMetric(this.workflowGauge);

    // Histogramme pour la durée d'exécution des workflows
    this.workflowDurationHistogram = new client.Histogram({
      name: 'mcp_workflow_duration_seconds',
      help: 'Durée d\'exécution des workflows en secondes',
      labelNames: ['workflow_id', 'workflow_name', 'status'],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800] // 1min, 5min, 10min, 30min, 1h, 2h, 4h, 8h
    });
    this.registry.registerMetric(this.workflowDurationHistogram);

    // Compteur pour les erreurs de workflow
    this.workflowErrorCounter = new client.Counter({
      name: 'mcp_workflow_errors_total',
      help: 'Nombre total d\'erreurs par workflow',
      labelNames: ['workflow_id', 'workflow_name', 'error_type', 'error_source']
    });
    this.registry.registerMetric(this.workflowErrorCounter);

    // Gauge pour suivre les étapes des workflows
    this.workflowStepsGauge = new client.Gauge({
      name: 'mcp_workflow_steps',
      help: 'Progression des étapes de workflow',
      labelNames: ['workflow_id', 'workflow_name', 'step_type']
    });
    this.registry.registerMetric(this.workflowStepsGauge);

    // Gauge pour les ressources système
    this.systemResourcesGauge = new client.Gauge({
      name: 'mcp_system_resources',
      help: 'Métriques de ressources système',
      labelNames: ['resource_type']
    });
    this.registry.registerMetric(this.systemResourcesGauge);

    // Compteur pour les retries
    this.retryCounter = new client.Counter({
      name: 'mcp_retry_attempts_total',
      help: 'Nombre total de tentatives de retry par workflow',
      labelNames: ['workflow_id', 'workflow_name', 'error_type']
    });
    this.registry.registerMetric(this.retryCounter);

    // Gauge pour le nombre de workflows actifs
    this.activeWorkflowsGauge = new client.Gauge({
      name: 'mcp_active_workflows',
      help: 'Nombre de workflows actifs par statut',
      labelNames: ['status', 'priority']
    });
    this.registry.registerMetric(this.activeWorkflowsGauge);

    // Gauge pour la progression globale des migrations
    this.migrationProgressGauge = new client.Gauge({
      name: 'mcp_migration_progress_percent',
      help: 'Pourcentage de progression des migrations',
      labelNames: ['migration_type']
    });
    this.registry.registerMetric(this.migrationProgressGauge);
  }

  /**
   * Démarre le serveur HTTP pour exposer les métriques
   */
  async start(): Promise<void> {
    const app = express();

    // Endpoint pour les métriques Prometheus
    app.get(this.config.endpoint, async (req, res) => {
      try {
        res.set('Content-Type', this.registry.contentType);
        res.end(await this.registry.metrics());
      } catch (error) {
        res.status(500).end(`Erreur lors de la génération des métriques: ${error}`);
      }
    });

    // Endpoint de healthcheck
    app.get('/health', (req, res) => {
      res.status(200).send({ status: 'ok' });
    });

    // Démarrer le serveur HTTP
    this.server = http.createServer(app);
    
    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.config.port, () => {
        this.logger.info(`Prometheus metrics exposed on http://localhost:${this.config.port}${this.config.endpoint}`);
        resolve();
      }).on('error', (err) => {
        this.logger.error('Failed to start Prometheus exporter server:', err);
        reject(err);
      });
    });
  }

  /**
   * Arrête le serveur HTTP
   */
  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          this.logger.info('Prometheus exporter server stopped');
          resolve();
        });
      });
      this.server = null;
    }
  }

  /**
   * Met à jour le statut d'un workflow
   * @param workflowId ID du workflow
   * @param workflowName Nom du workflow
   * @param status Statut (0: échec, 1: en cours, 2: complété)
   * @param priority Priorité du workflow
   */
  updateWorkflowStatus(workflowId: string, workflowName: string, status: number, priority: number = 5): void {
    this.workflowGauge.set({ workflow_id: workflowId, workflow_name: workflowName, priority: priority.toString() }, status);
  }

  /**
   * Enregistre la durée d'exécution d'un workflow
   * @param workflowId ID du workflow
   * @param workflowName Nom du workflow
   * @param durationSeconds Durée en secondes
   * @param status Statut final
   */
  recordWorkflowDuration(workflowId: string, workflowName: string, durationSeconds: number, status: string): void {
    this.workflowDurationHistogram.observe(
      { workflow_id: workflowId, workflow_name: workflowName, status },
      durationSeconds
    );
  }

  /**
   * Incrémente le compteur d'erreurs pour un workflow
   * @param workflowId ID du workflow
   * @param workflowName Nom du workflow
   * @param errorType Type d'erreur
   * @param errorSource Source de l'erreur
   */
  incrementWorkflowError(workflowId: string, workflowName: string, errorType: string, errorSource: string): void {
    this.workflowErrorCounter.inc({ workflow_id: workflowId, workflow_name: workflowName, error_type: errorType, error_source: errorSource });
  }

  /**
   * Met à jour les métriques d'étapes pour un workflow
   * @param workflowId ID du workflow
   * @param workflowName Nom du workflow
   * @param stepType Type d'étape
   * @param currentStep Étape actuelle
   * @param totalSteps Nombre total d'étapes
   */
  updateWorkflowSteps(workflowId: string, workflowName: string, stepType: string, currentStep: number, totalSteps: number): void {
    this.workflowStepsGauge.set(
      { workflow_id: workflowId, workflow_name: workflowName, step_type: `${stepType}_current` },
      currentStep
    );
    this.workflowStepsGauge.set(
      { workflow_id: workflowId, workflow_name: workflowName, step_type: `${stepType}_total` },
      totalSteps
    );
    
    // Calculer le pourcentage de progression
    if (totalSteps > 0) {
      const progress = (currentStep / totalSteps) * 100;
      this.workflowStepsGauge.set(
        { workflow_id: workflowId, workflow_name: workflowName, step_type: `${stepType}_percent` },
        progress
      );
    }
  }

  /**
   * Met à jour les métriques de ressources système
   * @param metrics Métriques système
   */
  updateSystemMetrics(metrics: SystemMetrics): void {
    this.systemResourcesGauge.set({ resource_type: 'cpu_usage_percent' }, metrics.cpuUsagePercent);
    this.systemResourcesGauge.set({ resource_type: 'memory_usage_percent' }, metrics.memoryUsagePercent);
    this.systemResourcesGauge.set({ resource_type: 'memory_free_bytes' }, metrics.memoryFreeBytes);
    this.systemResourcesGauge.set({ resource_type: 'load_average' }, metrics.loadAverage);
    
    if (metrics.networkStats) {
      this.systemResourcesGauge.set({ resource_type: 'network_bytes_in' }, metrics.networkStats.bytesIn);
      this.systemResourcesGauge.set({ resource_type: 'network_bytes_out' }, metrics.networkStats.bytesOut);
      this.systemResourcesGauge.set({ resource_type: 'network_connections' }, metrics.networkStats.connectionsCount);
    }
  }

  /**
   * Incrémente le compteur de retries pour un workflow
   * @param workflowId ID du workflow
   * @param workflowName Nom du workflow
   * @param errorType Type d'erreur
   */
  incrementRetry(workflowId: string, workflowName: string, errorType: string): void {
    this.retryCounter.inc({ workflow_id: workflowId, workflow_name: workflowName, error_type: errorType });
  }

  /**
   * Met à jour le nombre de workflows actifs
   * @param status Statut des workflows
   * @param count Nombre de workflows
   * @param priority Priorité (optionnel)
   */
  updateActiveWorkflows(status: string, count: number, priority?: number): void {
    this.activeWorkflowsGauge.set(
      { 
        status, 
        priority: priority !== undefined ? priority.toString() : 'any' 
      }, 
      count
    );
  }

  /**
   * Met à jour la progression globale des migrations
   * @param migrationType Type de migration
   * @param progressPercent Pourcentage de progression (0-100)
   */
  updateMigrationProgress(migrationType: string, progressPercent: number): void {
    this.migrationProgressGauge.set({ migration_type: migrationType }, progressPercent);
  }
}