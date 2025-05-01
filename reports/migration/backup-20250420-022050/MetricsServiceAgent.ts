import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { CoordinationAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/coordination';
import { BaseAgent, OrchestrationAgent } from '../core/interfaces/BaseAgent';

/**
 * Interface pour les métriques collectées
 */
export interface Metrics {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, number[]>;
  lastUpdated: string;
}

/**
 * Service de métriques simple pour l'orchestration
 *
 * Cette classe permet de collecter des métriques sur les workflows et jobs
 * et de les exporter dans différents formats (JSON, exposé via HTTP)
 */
export class MetricsService implements BaseAgent, OrchestrationAgent, CoordinationAgent {
  private metrics: Metrics = {
    counters: {},
    gauges: {},
    histograms: {},
    lastUpdated: new Date().toISOString(),
  };

  private readonly logger = new Logger('MetricsService');
  private readonly metricsFilePath: string;
  private saveInterval: NodeJS.Timeout | null = null;

  constructor(options: {
    metricsFilePath?: string;
    autoSave?: boolean;
    saveIntervalMs?: number;
  }) {
    this.metricsFilePath = options.metricsFilePath || path.join(process.cwd(), 'metrics.json');

    // Configuration de la sauvegarde automatique
    if (options.autoSave) {
      this.saveInterval = setInterval(
        () => {
          this.saveToFile();
        },
        options.saveIntervalMs || 60000
      ); // Par défaut sauvegarde toutes les minutes
    }

    // Charger les métriques depuis le fichier si elles existent
    this.loadFromFile();
  }

  /**
   * Incrémente un compteur
   * @param name Nom du compteur
   * @param value Valeur à ajouter (défaut: 1)
   * @param labels Labels pour catégoriser la métrique
   */
  incrementCounter(name: string, value = 1, labels?: Record<string, string>): void {
    const metricName = this.formatMetricName(name, labels);
    if (!this.metrics.counters[metricName]) {
      this.metrics.counters[metricName] = 0;
    }
    this.metrics.counters[metricName] += value;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Définit la valeur d'une jauge
   * @param name Nom de la jauge
   * @param value Valeur à définir
   * @param labels Labels pour catégoriser la métrique
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metricName = this.formatMetricName(name, labels);
    this.metrics.gauges[metricName] = value;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Ajoute une observation à un histogramme
   * @param name Nom de l'histogramme
   * @param value Valeur à ajouter
   * @param labels Labels pour catégoriser la métrique
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metricName = this.formatMetricName(name, labels);
    if (!this.metrics.histograms[metricName]) {
      this.metrics.histograms[metricName] = [];
    }
    this.metrics.histograms[metricName].push(value);

    // Limiter le nombre de points à conserver pour éviter une utilisation excessive de la mémoire
    if (this.metrics.histograms[metricName].length > 1000) {
      this.metrics.histograms[metricName] = this.metrics.histograms[metricName].slice(-1000);
    }

    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Récupère toutes les métriques
   */
  getMetrics(): Metrics {
    return this.metrics;
  }

  /**
   * Sauvegarde les métriques dans un fichier JSON
   */
  saveToFile(): void {
    try {
      fs.writeFileSync(this.metricsFilePath, JSON.stringify(this.metrics, null, 2));
      this.logger.log(`Métriques sauvegardées dans ${this.metricsFilePath}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la sauvegarde des métriques: ${error.message}`);
    }
  }

  /**
   * Charge les métriques depuis un fichier JSON
   */
  loadFromFile(): void {
    try {
      if (fs.existsSync(this.metricsFilePath)) {
        const fileContent = fs.readFileSync(this.metricsFilePath, 'utf8');
        this.metrics = JSON.parse(fileContent);
        this.logger.log(`Métriques chargées depuis ${this.metricsFilePath}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors du chargement des métriques: ${error.message}`);
    }
  }

  /**
   * Format de sortie pour exposition HTTP compatible Prometheus
   */
  getPrometheusFormat(): string {
    let output = '';

    // Compteurs
    Object.entries(this.metrics.counters).forEach(([name, value]) => {
      output += `# TYPE ${name} counter\n`;
      output += `${name} ${value}\n`;
    });

    // Jauges
    Object.entries(this.metrics.gauges).forEach(([name, value]) => {
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${value}\n`;
    });

    // Histogrammes (simplifiés)
    Object.entries(this.metrics.histograms).forEach(([name, values]) => {
      if (values.length > 0) {
        output += `# TYPE ${name} histogram\n`;

        // Calculer des percentiles simples pour l'histogramme
        const sorted = [...values].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p90 = sorted[Math.floor(sorted.length * 0.9)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];

        output += `${name}{quantile="0.5"} ${p50}\n`;
        output += `${name}{quantile="0.9"} ${p90}\n`;
        output += `${name}{quantile="0.95"} ${p95}\n`;
        output += `${name}{quantile="0.99"} ${p99}\n`;
        output += `${name}_count ${values.length}\n`;
        output += `${name}_sum ${values.reduce((a, b) => a + b, 0)}\n`;
      }
    });

    return output;
  }

  /**
   * Arrête la sauvegarde automatique
   */
  shutdown(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }

    // Sauvegarde finale
    this.saveToFile();
  }

  /**
   * Formatte le nom d'une métrique avec ses labels
   */
  private formatMetricName(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  id = '';
  name = '';
  type = '';
  version = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version,
    };
  }

  /**
   * Récupère l'état actuel du système
   */
  async getSystemState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}

import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
