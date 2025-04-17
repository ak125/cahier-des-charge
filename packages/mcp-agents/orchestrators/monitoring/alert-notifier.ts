import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import { createLogger } from '../../utils/logger';
import { SystemMetrics } from '../scheduler/system-monitor';
import { WorkflowCheckpoint, CheckpointStatus } from '../persistence/types';
import axios from 'axios';

/**
 * Configuration des alertes
 */
export interface AlertConfig {
  channels: {
    email?: {
      enabled: boolean;
      transportConfig: nodemailer.TransportOptions;
      recipients: string[];
      from: string;
    };
    slack?: {
      enabled: boolean;
      token: string;
      channel: string;
    };
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
    pushover?: {
      enabled: boolean;
      token: string;
      user: string;
    };
  };
  thresholds: {
    system: {
      criticalCpuUsage: number;      // Pourcentage CPU critique
      warningCpuUsage: number;       // Pourcentage CPU avertissement
      criticalMemoryUsage: number;   // Pourcentage mémoire critique
      warningMemoryUsage: number;    // Pourcentage mémoire avertissement
      criticalLoadAverage: number;   // Charge système critique
      warningLoadAverage: number;    // Charge système avertissement
    };
    workflow: {
      maxDurationSeconds: number;    // Durée max avant alerte (secondes)
      maxRetryAttempts: number;      // Nombre max de tentatives
      errorCountThreshold: number;   // Nombre d'erreurs avant notification
    };
  };
  cooldowns: {
    system: number;                  // Temps min entre alertes système (ms)
    workflow: number;                // Temps min entre alertes workflow (ms)
  };
  includeDetails: boolean;           // Inclure des détails techniques
  throttling: {
    maxAlertsPerHour: number;        // Nombre max d'alertes par heure
    suppressDuplicates: boolean;     // Supprimer les alertes dupliquées
    bufferTimeMs: number;            // Délai de regroupement des alertes (ms)
  };
}

/**
 * Niveaux d'alerte
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Structure d'une alerte
 */
export interface Alert {
  id: string;
  title: string;
  message: string;
  level: AlertLevel;
  source: 'system' | 'workflow' | 'application';
  timestamp: Date;
  metadata?: Record<string, any>;
  workflowId?: string;
  suppressNotification?: boolean;
}

/**
 * Service de notification d'alertes multi-canal
 * Gère l'envoi d'alertes via différents canaux de communication
 */
export class AlertNotifier {
  private logger = createLogger('AlertNotifier');
  private config: AlertConfig;
  private emailTransporter: nodemailer.Transporter | null = null;
  private slackClient: WebClient | null = null;
  private alertHistory: Map<string, Date> = new Map();
  private alertBuffer: Alert[] = [];
  private bufferTimeout: NodeJS.Timeout | null = null;
  private hourlyAlertCount = 0;
  private hourlyResetInterval: NodeJS.Timeout | null = null;
  private lastSystemAlertTime = 0;
  private lastWorkflowAlertsByWorkflow: Map<string, Date> = new Map();

  constructor(config: Partial<AlertConfig> = {}) {
    // Configuration par défaut
    this.config = {
      channels: {
        email: {
          enabled: false,
          transportConfig: {},
          recipients: [],
          from: 'mcp-orchestrator@example.com'
        },
        slack: {
          enabled: false,
          token: '',
          channel: 'migration-alerts'
        },
        webhook: {
          enabled: false,
          url: '',
        },
        pushover: {
          enabled: false,
          token: '',
          user: ''
        }
      },
      thresholds: {
        system: {
          criticalCpuUsage: 90,
          warningCpuUsage: 75,
          criticalMemoryUsage: 85,
          warningMemoryUsage: 70,
          criticalLoadAverage: 5,
          warningLoadAverage: 3,
        },
        workflow: {
          maxDurationSeconds: 3600, // 1h
          maxRetryAttempts: 3,
          errorCountThreshold: 2,
        }
      },
      cooldowns: {
        system: 5 * 60 * 1000, // 5 minutes
        workflow: 10 * 60 * 1000 // 10 minutes
      },
      includeDetails: true,
      throttling: {
        maxAlertsPerHour: 20,
        suppressDuplicates: true,
        bufferTimeMs: 30000 // 30s
      },
      ...config
    };
    
    this.logger.info('Alert notifier initialized');
  }

  /**
   * Initialise les connexions pour les canaux de notification
   */
  async initialize(): Promise<void> {
    // Configurer le transport email si activé
    if (this.config.channels.email?.enabled) {
      try {
        this.emailTransporter = nodemailer.createTransport(this.config.channels.email.transportConfig);
        await this.emailTransporter.verify();
        this.logger.info('Email transport initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize email transport:', error);
        this.emailTransporter = null;
      }
    }

    // Configurer le client Slack si activé
    if (this.config.channels.slack?.enabled) {
      try {
        this.slackClient = new WebClient(this.config.channels.slack.token);
        this.logger.info('Slack client initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Slack client:', error);
        this.slackClient = null;
      }
    }

    // Configurer le reset horaire du compteur d'alertes
    this.hourlyResetInterval = setInterval(() => {
      this.hourlyAlertCount = 0;
    }, 3600000); // 1 heure

    this.logger.info('Alert notifier initialization completed');
  }

  /**
   * Envoie une alerte via tous les canaux configurés
   * @param alert Alerte à envoyer
   */
  async sendAlert(alert: Alert): Promise<boolean> {
    // Vérifier si on est en période de cooldown pour cette alerte
    if (this.isInCooldown(alert)) {
      this.logger.debug(`Alert ${alert.id} suppressed due to cooldown period`);
      return false;
    }

    // Vérifier le throttling horaire
    if (this.hourlyAlertCount >= this.config.throttling.maxAlertsPerHour) {
      this.logger.warn(`Hourly alert limit reached (${this.config.throttling.maxAlertsPerHour}), suppressing alert: ${alert.title}`);
      return false;
    }

    // Ajouter au buffer pour envoi groupé si configuré
    if (this.config.throttling.bufferTimeMs > 0 && !alert.suppressNotification) {
      this.addToBuffer(alert);
      return true;
    }
    
    // Sinon, envoyer immédiatement
    return this.sendAlertImmediately(alert);
  }

  /**
   * Ajoute une alerte au buffer et programme son envoi
   * @param alert Alerte à ajouter au buffer
   */
  private addToBuffer(alert: Alert): void {
    // Vérifier si une alerte similaire est déjà dans le buffer
    if (this.config.throttling.suppressDuplicates) {
      const existing = this.alertBuffer.find(a => 
        a.title === alert.title && a.level === alert.level && a.source === alert.source
      );
      
      if (existing) {
        this.logger.debug(`Alert "${alert.title}" suppressed as duplicate in buffer`);
        return;
      }
    }
    
    this.alertBuffer.push(alert);
    
    // Si aucun timeout n'est en cours, programmer le traitement du buffer
    if (!this.bufferTimeout) {
      this.bufferTimeout = setTimeout(() => {
        this.processAlertBuffer();
      }, this.config.throttling.bufferTimeMs);
    }
  }

  /**
   * Traite le buffer d'alertes et envoie les notifications groupées
   */
  private async processAlertBuffer(): Promise<void> {
    if (this.alertBuffer.length === 0) {
      this.bufferTimeout = null;
      return;
    }

    this.logger.info(`Processing alert buffer with ${this.alertBuffer.length} alerts`);
    
    // Regrouper les alertes par niveau
    const alertsByLevel = new Map<AlertLevel, Alert[]>();
    
    for (const alert of this.alertBuffer) {
      if (!alertsByLevel.has(alert.level)) {
        alertsByLevel.set(alert.level, []);
      }
      alertsByLevel.get(alert.level)!.push(alert);
    }
    
    // Construire un message de résumé pour chaque niveau
    for (const [level, alerts] of alertsByLevel.entries()) {
      if (alerts.length === 0) continue;
      
      // Créer une alerte de résumé
      const summaryAlert: Alert = {
        id: `summary-${Date.now()}-${level}`,
        title: `Résumé des alertes (${level}): ${alerts.length} notifications`,
        message: alerts.map(a => `- ${a.title}: ${a.message}`).join('\n'),
        level,
        source: 'application',
        timestamp: new Date(),
        metadata: {
          alertCount: alerts.length,
          sources: [...new Set(alerts.map(a => a.source))],
          originalAlerts: alerts.map(a => ({ id: a.id, title: a.title }))
        }
      };
      
      // Envoyer cette alerte de résumé
      await this.sendAlertImmediately(summaryAlert);
      
      // Mettre à jour l'historique des alertes
      for (const alert of alerts) {
        this.alertHistory.set(alert.id, new Date());
        
        // Mettre à jour les timestamps de cooldown
        if (alert.source === 'system') {
          this.lastSystemAlertTime = Date.now();
        } else if (alert.source === 'workflow' && alert.workflowId) {
          this.lastWorkflowAlertsByWorkflow.set(alert.workflowId, new Date());
        }
      }
    }
    
    // Vider le buffer et réinitialiser le timeout
    this.alertBuffer = [];
    this.bufferTimeout = null;
  }

  /**
   * Vérifie si une alerte est en période de cooldown
   * @param alert Alerte à vérifier
   */
  private isInCooldown(alert: Alert): boolean {
    const now = Date.now();
    
    // Vérifier le cooldown système
    if (alert.source === 'system') {
      if ((now - this.lastSystemAlertTime) < this.config.cooldowns.system) {
        return true;
      }
    }
    
    // Vérifier le cooldown workflow
    else if (alert.source === 'workflow' && alert.workflowId) {
      const lastAlert = this.lastWorkflowAlertsByWorkflow.get(alert.workflowId);
      if (lastAlert && (now - lastAlert.getTime()) < this.config.cooldowns.workflow) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Envoie une alerte immédiatement via tous les canaux configurés
   * @param alert Alerte à envoyer
   */
  private async sendAlertImmediately(alert: Alert): Promise<boolean> {
    let success = false;
    this.hourlyAlertCount++;
    
    // Préparer le formatage de base
    const formattedTime = alert.timestamp.toLocaleString();
    const formattedTitle = `[${alert.level.toUpperCase()}] ${alert.title}`;
    
    // Essayer d'envoyer par email
    if (this.config.channels.email?.enabled && this.emailTransporter) {
      try {
        await this.emailTransporter.sendMail({
          from: this.config.channels.email.from,
          to: this.config.channels.email.recipients.join(', '),
          subject: formattedTitle,
          text: `${alert.message}\n\nDate: ${formattedTime}\nSource: ${alert.source}\n${this.getDetailedInfo(alert)}`,
          html: this.formatEmailHtml(alert)
        });
        this.logger.info(`Email alert "${alert.title}" sent successfully`);
        success = true;
      } catch (error) {
        this.logger.error('Failed to send email alert:', error);
      }
    }
    
    // Essayer d'envoyer via Slack
    if (this.config.channels.slack?.enabled && this.slackClient) {
      try {
        await this.slackClient.chat.postMessage({
          channel: this.config.channels.slack.channel,
          text: formattedTitle,
          blocks: this.formatSlackMessage(alert)
        });
        this.logger.info(`Slack alert "${alert.title}" sent successfully`);
        success = true;
      } catch (error) {
        this.logger.error('Failed to send Slack alert:', error);
      }
    }
    
    // Essayer d'envoyer via webhook
    if (this.config.channels.webhook?.enabled) {
      try {
        await axios.post(this.config.channels.webhook.url, {
          alert: {
            ...alert,
            formatted_time: formattedTime
          }
        }, {
          headers: this.config.channels.webhook.headers
        });
        this.logger.info(`Webhook alert "${alert.title}" sent successfully`);
        success = true;
      } catch (error) {
        this.logger.error('Failed to send webhook alert:', error);
      }
    }
    
    // Essayer d'envoyer via Pushover
    if (this.config.channels.pushover?.enabled) {
      try {
        const priority = this.getPushoverPriority(alert.level);
        await axios.post('https://api.pushover.net/1/messages.json', {
          token: this.config.channels.pushover.token,
          user: this.config.channels.pushover.user,
          title: formattedTitle,
          message: alert.message,
          priority: priority,
          sound: priority >= 1 ? 'tugboat' : 'pushover'
        });
        this.logger.info(`Pushover alert "${alert.title}" sent successfully`);
        success = true;
      } catch (error) {
        this.logger.error('Failed to send Pushover alert:', error);
      }
    }
    
    return success;
  }

  /**
   * Analyse les métriques système et déclenche des alertes si nécessaire
   * @param metrics Métriques système à analyser
   */
  async checkSystemMetrics(metrics: SystemMetrics): Promise<void> {
    const alerts: Alert[] = [];
    const thresholds = this.config.thresholds.system;
    
    // Vérifier l'utilisation CPU
    if (metrics.cpuUsagePercent >= thresholds.criticalCpuUsage) {
      alerts.push({
        id: `cpu-critical-${Date.now()}`,
        title: 'Utilisation CPU critique',
        message: `L'utilisation CPU a atteint un niveau critique: ${metrics.cpuUsagePercent.toFixed(1)}%`,
        level: AlertLevel.CRITICAL,
        source: 'system',
        timestamp: new Date(),
        metadata: { cpuUsagePercent: metrics.cpuUsagePercent }
      });
    } else if (metrics.cpuUsagePercent >= thresholds.warningCpuUsage) {
      alerts.push({
        id: `cpu-warning-${Date.now()}`,
        title: 'Utilisation CPU élevée',
        message: `L'utilisation CPU est élevée: ${metrics.cpuUsagePercent.toFixed(1)}%`,
        level: AlertLevel.WARNING,
        source: 'system',
        timestamp: new Date(),
        metadata: { cpuUsagePercent: metrics.cpuUsagePercent }
      });
    }
    
    // Vérifier l'utilisation mémoire
    if (metrics.memoryUsagePercent >= thresholds.criticalMemoryUsage) {
      alerts.push({
        id: `memory-critical-${Date.now()}`,
        title: 'Utilisation mémoire critique',
        message: `L'utilisation de la mémoire a atteint un niveau critique: ${metrics.memoryUsagePercent.toFixed(1)}%`,
        level: AlertLevel.CRITICAL,
        source: 'system',
        timestamp: new Date(),
        metadata: { memoryUsagePercent: metrics.memoryUsagePercent }
      });
    } else if (metrics.memoryUsagePercent >= thresholds.warningMemoryUsage) {
      alerts.push({
        id: `memory-warning-${Date.now()}`,
        title: 'Utilisation mémoire élevée',
        message: `L'utilisation de la mémoire est élevée: ${metrics.memoryUsagePercent.toFixed(1)}%`,
        level: AlertLevel.WARNING,
        source: 'system',
        timestamp: new Date(),
        metadata: { memoryUsagePercent: metrics.memoryUsagePercent }
      });
    }
    
    // Vérifier la charge système
    if (metrics.loadAverage >= thresholds.criticalLoadAverage) {
      alerts.push({
        id: `load-critical-${Date.now()}`,
        title: 'Charge système critique',
        message: `La charge du système a atteint un niveau critique: ${metrics.loadAverage.toFixed(2)}`,
        level: AlertLevel.CRITICAL,
        source: 'system',
        timestamp: new Date(),
        metadata: { loadAverage: metrics.loadAverage }
      });
    } else if (metrics.loadAverage >= thresholds.warningLoadAverage) {
      alerts.push({
        id: `load-warning-${Date.now()}`,
        title: 'Charge système élevée',
        message: `La charge du système est élevée: ${metrics.loadAverage.toFixed(2)}`,
        level: AlertLevel.WARNING,
        source: 'system',
        timestamp: new Date(),
        metadata: { loadAverage: metrics.loadAverage }
      });
    }
    
    // Envoyer toutes les alertes
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Vérifie un checkpoint de workflow et déclenche des alertes si nécessaire
   * @param checkpoint Checkpoint de workflow à vérifier
   */
  async checkWorkflowCheckpoint(checkpoint: WorkflowCheckpoint): Promise<void> {
    const workflowThresholds = this.config.thresholds.workflow;
    
    // Si le workflow a échoué
    if (checkpoint.status === CheckpointStatus.FAILED) {
      // Vérifier le nombre de tentatives
      if (checkpoint.metadata?.retryStrategy?.currentAttempt >= workflowThresholds.maxRetryAttempts) {
        await this.sendAlert({
          id: `workflow-failed-max-retries-${checkpoint.workflowId}`,
          title: 'Workflow échoué - Max retries atteint',
          message: `Le workflow ${checkpoint.workflowId} a atteint le nombre maximum de tentatives (${checkpoint.metadata.retryStrategy.currentAttempt})`,
          level: AlertLevel.ERROR,
          source: 'workflow',
          workflowId: checkpoint.workflowId,
          timestamp: new Date(),
          metadata: {
            workflowId: checkpoint.workflowId,
            retryAttempts: checkpoint.metadata.retryStrategy.currentAttempt,
            progress: checkpoint.progress,
            lastError: checkpoint.errors?.length ? checkpoint.errors[checkpoint.errors.length - 1] : null
          }
        });
      }
      
      // Vérifier le nombre d'erreurs
      if (checkpoint.errors && checkpoint.errors.length >= workflowThresholds.errorCountThreshold) {
        await this.sendAlert({
          id: `workflow-error-count-${checkpoint.workflowId}`,
          title: 'Workflow avec trop d\'erreurs',
          message: `Le workflow ${checkpoint.workflowId} a accumulé ${checkpoint.errors.length} erreurs`,
          level: AlertLevel.WARNING,
          source: 'workflow',
          workflowId: checkpoint.workflowId,
          timestamp: new Date(),
          metadata: {
            workflowId: checkpoint.workflowId,
            errorCount: checkpoint.errors.length,
            errors: checkpoint.errors
          }
        });
      }
    }
    
    // Vérifier la durée d'exécution
    if (checkpoint.createdAt && checkpoint.status !== CheckpointStatus.COMPLETED) {
      const durationMs = Date.now() - checkpoint.createdAt.getTime();
      const durationSeconds = durationMs / 1000;
      
      if (durationSeconds >= workflowThresholds.maxDurationSeconds) {
        await this.sendAlert({
          id: `workflow-long-duration-${checkpoint.workflowId}`,
          title: 'Workflow en cours d\'exécution depuis trop longtemps',
          message: `Le workflow ${checkpoint.workflowId} est en cours d'exécution depuis ${Math.floor(durationSeconds / 60)} minutes`,
          level: AlertLevel.WARNING,
          source: 'workflow',
          workflowId: checkpoint.workflowId,
          timestamp: new Date(),
          metadata: {
            workflowId: checkpoint.workflowId,
            durationSeconds,
            status: checkpoint.status,
            progress: checkpoint.progress
          }
        });
      }
    }
  }

  /**
   * Arrête le service de notification
   */
  async stop(): Promise<void> {
    if (this.hourlyResetInterval) {
      clearInterval(this.hourlyResetInterval);
      this.hourlyResetInterval = null;
    }
    
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
      this.bufferTimeout = null;
      
      // Traiter les alertes restantes dans le buffer
      await this.processAlertBuffer();
    }
    
    this.logger.info('Alert notifier stopped');
  }

  /**
   * Génère les informations détaillées pour une alerte
   * @param alert Alerte
   */
  private getDetailedInfo(alert: Alert): string {
    if (!this.config.includeDetails) return '';
    
    let details = '\n--- Détails techniques ---\n';
    
    if (alert.metadata) {
      details += Object.entries(alert.metadata)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
    }
    
    return details;
  }

  /**
   * Formate un message Slack
   * @param alert Alerte à formater
   */
  private formatSlackMessage(alert: Alert): any[] {
    // Déterminer la couleur en fonction du niveau d'alerte
    let color = '';
    switch (alert.level) {
      case AlertLevel.INFO:
        color = '#2196F3';
        break;
      case AlertLevel.WARNING:
        color = '#FF9800';
        break;
      case AlertLevel.ERROR:
        color = '#F44336';
        break;
      case AlertLevel.CRITICAL:
        color = '#880E4F';
        break;
    }
    
    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${alert.title}*\n${alert.message}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Date:* ${alert.timestamp.toLocaleString()} | *Source:* ${alert.source} | *Niveau:* ${alert.level}`
          }
        ]
      }
    ];
    
    // Ajouter des détails si configuré
    if (this.config.includeDetails && alert.metadata) {
      blocks.push({
        type: 'divider'
      });
      
      const details = Object.entries(alert.metadata)
        .map(([key, value]) => `*${key}:* ${typeof value === 'object' ? '(object)' : value}`)
        .join('\n');
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Détails techniques*\n${details}`
        }
      });
    }
    
    return [{
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: blocks
            }
          ]
        }
      ]
    }];
  }

  /**
   * Formate un message email en HTML
   * @param alert Alerte à formater
   */
  private formatEmailHtml(alert: Alert): string {
    // Déterminer la couleur en fonction du niveau d'alerte
    let color = '';
    switch (alert.level) {
      case AlertLevel.INFO:
        color = '#2196F3';
        break;
      case AlertLevel.WARNING:
        color = '#FF9800';
        break;
      case AlertLevel.ERROR:
        color = '#F44336';
        break;
      case AlertLevel.CRITICAL:
        color = '#880E4F';
        break;
    }
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${color};">${alert.title}</h2>
        <p style="font-size: 16px; line-height: 1.5;">${alert.message.replace(/\n/g, '<br>')}</p>
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 20px;">
          <p><strong>Date:</strong> ${alert.timestamp.toLocaleString()}</p>
          <p><strong>Source:</strong> ${alert.source}</p>
          <p><strong>Niveau:</strong> ${alert.level}</p>
        </div>
    `;
    
    // Ajouter des détails si configuré
    if (this.config.includeDetails && alert.metadata) {
      html += `
        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
          <h3>Détails techniques</h3>
          <ul>
      `;
      
      for (const [key, value] of Object.entries(alert.metadata)) {
        html += `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`;
      }
      
      html += `
          </ul>
        </div>
      `;
    }
    
    html += `</div>`;
    return html;
  }

  /**
   * Convertit un niveau d'alerte en priorité Pushover
   * @param level Niveau d'alerte
   */
  private getPushoverPriority(level: AlertLevel): number {
    switch (level) {
      case AlertLevel.INFO:
        return 0; // Normal priority
      case AlertLevel.WARNING:
        return 0; // Normal priority
      case AlertLevel.ERROR:
        return 1; // High priority
      case AlertLevel.CRITICAL:
        return 2; // Emergency priority (requires confirmation)
      default:
        return 0;
    }
  }
}