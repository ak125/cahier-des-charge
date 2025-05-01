import express from 'express';
import * as promClient from 'prom-client';

/**
 * Service de métriques pour les agents MCP
 * Permet de collecter et exposer des métriques de performance et d'exécution
 * pour l'observabilité via Prometheus et Grafana
 */
export class MetricsService {
  private static instance: MetricsService;

  // Compteurs
  public agentExecutionCounter: promClient.Counter;
  public agentSuccessCounter: promClient.Counter;
  public agentFailureCounter: promClient.Counter;
  public agentWarningCounter: promClient.Counter;

  // Histogrammes
  public agentExecutionDuration: promClient.Histogram;
  public agentMemoryUsage: promClient.Gauge;

  // Jauges
  public activeAgents: promClient.Gauge;
  public pendingAgents: promClient.Gauge;
  public queueSize: promClient.Gauge;

  // Registre pour les métriques
  private registry: promClient.Registry;

  private constructor() {
    // Initialiser le registre
    this.registry = new promClient.Registry();

    // Ajouter les métriques par défaut
    promClient.collectDefaultMetrics({ register: this.registry });

    // Créer les compteurs
    this.agentExecutionCounter = new promClient.Counter({
      name: 'mcp_agent_execution_total',
      help: "Nombre total d'exécutions des agents",
      labelNames: ['agent', 'type', 'layer'] as const,
      registers: [this.registry],
    });

    this.agentSuccessCounter = new promClient.Counter({
      name: 'mcp_agent_success_total',
      help: "Nombre total d'exécutions réussies des agents",
      labelNames: ['agent', 'type', 'layer'] as const,
      registers: [this.registry],
    });

    this.agentFailureCounter = new promClient.Counter({
      name: 'mcp_agent_failure_total',
      help: "Nombre total d'échecs d'exécution des agents",
      labelNames: ['agent', 'type', 'layer', 'error_type'] as const,
      registers: [this.registry],
    });

    this.agentWarningCounter = new promClient.Counter({
      name: 'mcp_agent_warning_total',
      help: "Nombre total d'avertissements générés par les agents",
      labelNames: ['agent', 'type', 'layer', 'warning_type'] as const,
      registers: [this.registry],
    });

    // Créer les histogrammes
    this.agentExecutionDuration = new promClient.Histogram({
      name: 'mcp_agent_execution_duration_seconds',
      help: "Durée d'exécution des agents en secondes",
      labelNames: ['agent', 'type', 'layer'] as const,
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600],
      registers: [this.registry],
    });

    // Créer les jauges
    this.agentMemoryUsage = new promClient.Gauge({
      name: 'mcp_agent_memory_usage_bytes',
      help: 'Utilisation mémoire des agents en bytes',
      labelNames: ['agent', 'type', 'layer'] as const,
      registers: [this.registry],
    });

    this.activeAgents = new promClient.Gauge({
      name: 'mcp_active_agents',
      help: "Nombre d'agents actifs",
      labelNames: ['layer', 'type'] as const,
      registers: [this.registry],
    });

    this.pendingAgents = new promClient.Gauge({
      name: 'mcp_pending_agents',
      help: "Nombre d'agents en attente",
      labelNames: ['layer', 'type'] as const,
      registers: [this.registry],
    });

    this.queueSize = new promClient.Gauge({
      name: 'mcp_queue_size',
      help: "Taille de la file d'attente",
      labelNames: ['queue_name'] as const,
      registers: [this.registry],
    });
  }

  /**
   * Obtient l'instance unique du service
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Démarre un serveur HTTP pour exposer les métriques
   * @param port Port sur lequel exposer les métriques (défaut: 3002)
   */
  public startMetricsServer(port = 3002): void {
    const app = express();

    // Endpoint pour les métriques Prometheus
    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', this.registry.contentType);
      res.end(await this.registry.metrics());
    });

    // Endpoint de santé
    app.get('/health', (_req, res) => {
      res.status(200).send('OK');
    });

    // Démarrer le serveur
    app.listen(port, () => {
      console.log(`Server de métriques démarré sur le port ${port}`);
    });
  }

  /**
   * Obtient toutes les métriques actuelles
   */
  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Enregistre l'exécution d'un agent avec la durée
   */
  public recordAgentExecution(
    agent: string,
    type: string,
    layer: string,
    durationMs: number,
    success = true
  ): void {
    const durationSeconds = durationMs / 1000;

    this.agentExecutionCounter.inc({ agent, type, layer });
    this.agentExecutionDuration.observe({ agent, type, layer }, durationSeconds);

    if (success) {
      this.agentSuccessCounter.inc({ agent, type, layer });
    } else {
      this.agentFailureCounter.inc({ agent, type, layer, error_type: 'execution_error' });
    }
  }

  /**
   * Enregistre l'utilisation mémoire d'un agent
   */
  public recordAgentMemoryUsage(
    agent: string,
    type: string,
    layer: string,
    memoryBytes: number
  ): void {
    this.agentMemoryUsage.set({ agent, type, layer }, memoryBytes);
  }

  /**
   * Met à jour le nombre d'agents actifs
   */
  public updateActiveAgents(layer: string, type: string, count: number): void {
    this.activeAgents.set({ layer, type }, count);
  }

  /**
   * Met à jour le nombre d'agents en attente
   */
  public updatePendingAgents(layer: string, type: string, count: number): void {
    this.pendingAgents.set({ layer, type }, count);
  }

  /**
   * Met à jour la taille d'une file d'attente
   */
  public updateQueueSize(queueName: string, size: number): void {
    this.queueSize.set({ queue_name: queueName }, size);
  }
}

// Exporter une instance unique du service de métriques
export const metricsService = MetricsService.getInstance();
