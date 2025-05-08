/**
 * Abstract Monitor Agent
 * 
 * Classe abstraite pour les agents de surveillance de la couche orchestration.
 * Étend la classe AbstractOrchestrationAgent et implémente l'interface MonitorAgent.
 */

import { MonitorAgent, AgentResult } from 'mcp-types';
import { AbstractOrchestrationAgent } from './abstract-orchestration-agent';

/**
 * Classe abstraite pour les agents de surveillance
 */
export abstract class AbstractMonitorAgent extends AbstractOrchestrationAgent implements MonitorAgent {

  /**
   * Map des workflows surveillés
   */
  protected monitoredWorkflows: Map<string, {
    lastChecked: string;
    status: string;
    metrics: Record<string, any>;
    alerts: Array<{
      timestamp: string;
      level: 'info' | 'warning' | 'error';
      message: string;
      details?: Record<string, any>;
    }>;
  }> = new Map();

  /**
   * Configuration du monitoring
   */
  protected monitorConfig: {
    checkIntervalMs: number;
    alertThresholds: Record<string, any>;
    retentionPeriodMs: number;
  };

  /**
   * Constructeur de la classe AbstractMonitorAgent
   * @param id Identifiant unique de l'agent
   * @param name Nom descriptif de l'agent
   * @param version Version de l'agent
   * @param options Options de configuration de l'agent
   */
  constructor(
    id: string,
    name: string,
    version: string,
    options?: Record<string, any>
  ) {
    super(id, name, version, options);
    this.type = 'monitor';

    // Configuration par défaut du monitoring
    this.monitorConfig = {
      checkIntervalMs: options?.checkIntervalMs || 60000, // 1 minute par défaut
      alertThresholds: options?.alertThresholds || {
        responseTimeMs: 5000,
        errorRatePercent: 5,
        memoryUsagePercent: 80
      },
      retentionPeriodMs: options?.retentionPeriodMs || 86400000 // 24 heures par défaut
    };
  }

  /**
   * Surveille l'exécution d'un ou plusieurs workflows
   * @param targets Identifiants des workflows à surveiller
   */
  public abstract monitorExecution(targets: string[]): Promise<void>;

  /**
   * Produit un rapport de monitoring sur un workflow
   * @param workflowId Identifiant du workflow
   */
  public abstract generateReport(workflowId: string): Promise<Record<string, any>>;

  /**
   * Démarre l'orchestration d'un workflow ou d'un processus
   * Ici, va configurer et démarrer une session de monitoring
   * @param workflow Identifiant ou définition du workflow à orchestrer
   * @param context Contexte d'exécution incluant les paramètres nécessaires
   */
  public async orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult> {
    try {
      // Déterminer les cibles de surveillance
      const monitoringTargets: string[] = [];

      if (typeof workflow === 'string') {
        // Si c'est une chaîne, on la considère comme un ID de workflow
        monitoringTargets.push(workflow);
      } else if (Array.isArray(workflow)) {
        // Si c'est un tableau, on le considère comme une liste de workflows
        monitoringTargets.push(...workflow.map(w => typeof w === 'string' ? w : w.id));
      } else if (typeof workflow === 'object') {
        // Si c'est un objet, on utilise sa propriété id ou targets
        const targets = (workflow as any).targets || [(workflow as any).id];
        if (Array.isArray(targets)) {
          monitoringTargets.push(...targets);
        } else {
          monitoringTargets.push(targets);
        }
      }

      // Générer un ID pour cette session de monitoring
      const monitoringSessionId = `mon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Enregistrer le début de la surveillance
      await this.reportStatus(monitoringSessionId, 'started', {
        targets: monitoringTargets,
        parameters: context,
        initiator: context.initiator || 'system',
        config: {
          interval: this.monitorConfig.checkIntervalMs,
          thresholds: this.monitorConfig.alertThresholds
        }
      });

      // Démarrer la surveillance
      await this.monitorExecution(monitoringTargets);

      // Mettre à jour le statut
      await this.reportStatus(monitoringSessionId, 'running', {
        activeTargets: monitoringTargets.length
      });

      return this.createSuccessResult({
        monitoringSessionId,
        targets: monitoringTargets,
        status: 'running'
      }, "Session de surveillance démarrée");

    } catch (error) {
      return this.createErrorResult(error, { operation: 'orchestrate-monitoring' });
    }
  }

  /**
   * Crée une alerte pour un workflow surveillé
   * @param workflowId Identifiant du workflow concerné
   * @param level Niveau de sévérité de l'alerte
   * @param message Message descriptif
   * @param details Détails supplémentaires
   */
  protected addAlert(workflowId: string, level: 'info' | 'warning' | 'error', message: string, details?: Record<string, any>): void {
    const monitorInfo = this.monitoredWorkflows.get(workflowId);
    if (!monitorInfo) return;

    const alert = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };

    monitorInfo.alerts.push(alert);

    // Émettre un événement pour cette alerte
    this.emit('monitor:alert', {
      workflowId,
      alert
    });

    // Pour les alertes de niveau error, émettre également un événement d'erreur
    if (level === 'error') {
      this.emit('monitor:error', {
        workflowId,
        error: message,
        details
      });
    }
  }

  /**
   * Met à jour les métriques pour un workflow surveillé
   * @param workflowId Identifiant du workflow
   * @param metrics Métriques à mettre à jour
   */
  protected updateMetrics(workflowId: string, metrics: Record<string, any>): void {
    const monitorInfo = this.monitoredWorkflows.get(workflowId) || {
      lastChecked: new Date().toISOString(),
      status: 'unknown',
      metrics: {},
      alerts: []
    };

    monitorInfo.lastChecked = new Date().toISOString();
    monitorInfo.metrics = {
      ...monitorInfo.metrics,
      ...metrics
    };

    this.monitoredWorkflows.set(workflowId, monitorInfo);

    // Analyser les métriques pour générer des alertes si nécessaire
    this.analyzeMetricsForAlerts(workflowId, metrics);
  }

  /**
   * Analyse les métriques pour générer des alertes si les seuils sont dépassés
   * @param workflowId Identifiant du workflow
   * @param metrics Métriques à analyser
   */
  protected analyzeMetricsForAlerts(workflowId: string, metrics: Record<string, any>): void {
    // Vérifier le temps de réponse
    if (metrics.responseTimeMs !== undefined &&
      metrics.responseTimeMs > this.monitorConfig.alertThresholds.responseTimeMs) {
      this.addAlert(
        workflowId,
        'warning',
        `Temps de réponse élevé: ${metrics.responseTimeMs}ms (seuil: ${this.monitorConfig.alertThresholds.responseTimeMs}ms)`,
        { metric: 'responseTimeMs', value: metrics.responseTimeMs }
      );
    }

    // Vérifier le taux d'erreur
    if (metrics.errorRatePercent !== undefined &&
      metrics.errorRatePercent > this.monitorConfig.alertThresholds.errorRatePercent) {
      this.addAlert(
        workflowId,
        'error',
        `Taux d'erreur élevé: ${metrics.errorRatePercent}% (seuil: ${this.monitorConfig.alertThresholds.errorRatePercent}%)`,
        { metric: 'errorRatePercent', value: metrics.errorRatePercent }
      );
    }

    // Vérifier l'utilisation mémoire
    if (metrics.memoryUsagePercent !== undefined &&
      metrics.memoryUsagePercent > this.monitorConfig.alertThresholds.memoryUsagePercent) {
      this.addAlert(
        workflowId,
        'warning',
        `Utilisation mémoire élevée: ${metrics.memoryUsagePercent}% (seuil: ${this.monitorConfig.alertThresholds.memoryUsagePercent}%)`,
        { metric: 'memoryUsagePercent', value: metrics.memoryUsagePercent }
      );
    }
  }

  /**
   * Nettoie les données de surveillance anciennes
   */
  protected cleanupOldMonitoringData(): void {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - this.monitorConfig.retentionPeriodMs);

    this.monitoredWorkflows.forEach((info, id) => {
      const lastChecked = new Date(info.lastChecked);

      if (lastChecked < cutoffTime) {
        // Émettre un événement avant suppression
        this.emit('monitor:data-cleanup', {
          workflowId: id,
          lastChecked: info.lastChecked,
          reason: 'retention-period-exceeded'
        });

        // Supprimer les données
        this.monitoredWorkflows.delete(id);
      } else {
        // Nettoyer juste les alertes anciennes
        const oldAlertsCutoff = new Date(now.getTime() - (this.monitorConfig.retentionPeriodMs / 2)); // Garder les alertes deux fois moins longtemps
        info.alerts = info.alerts.filter(alert => {
          const alertTime = new Date(alert.timestamp);
          return alertTime >= oldAlertsCutoff;
        });
      }
    });
  }
}