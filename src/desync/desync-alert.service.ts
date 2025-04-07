import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { MismatchTrackerService } from '../mismatch/mismatch-tracker.service';
import { NotificationService } from '../notification/notification.service';
import { DocumentService } from '../document/document.service';

import {
  DesyncAlert,
  AlertPriority,
  AlertStatus,
  AlertChannel,
  AlertContext,
  AlertType
} from './interfaces';

@Injectable()
export class DesyncAlertService {
  private readonly logger = new Logger(DesyncAlertService.name);
  private readonly contextHistory: AlertContext[] = [];
  
  constructor(
    @InjectModel('DesyncAlert') private alertModel: Model<DesyncAlert>,
    private readonly configService: ConfigService,
    private readonly mismatchService: MismatchTrackerService,
    private readonly notificationService: NotificationService,
    private readonly documentService: DocumentService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialiser le contexte du projet
    this.updateProjectContext();
    
    // S'abonner aux événements de mismatch
    this.eventEmitter.on('mismatches.detected', (data) => {
      this.handleMismatchesDetected(data);
    });
    
    this.eventEmitter.on('document.updated', (data) => {
      this.checkForResolvedAlerts(data);
    });
  }
  
  /**
   * Mise à jour planifiée du contexte du projet - hebdomadaire
   */
  @Cron('0 0 * * 0')
  async updateProjectContext() {
    this.logger.debug('Mise à jour du contexte du projet');
    
    // Déterminer la phase du projet
    const projectPhase = this.determineProjectPhase();
    
    // Obtenir le calendrier de release
    const releaseSchedule = await this.getReleaseSchedule();
    
    // Obtenir la santé des composants
    const componentHealth = await this.getComponentHealth();
    
    // Créer le nouveau contexte
    const newContext: AlertContext = {
      timestamp: new Date(),
      projectPhase,
      releaseSchedule,
      componentHealth,
      recentAlerts: await this.getRecentAlerts(),
      teamAvailability: await this.getTeamAvailability(),
    };
    
    // Stocker dans l'historique (garder max 10 contextes)
    this.contextHistory.unshift(newContext);
    if (this.contextHistory.length > 10) {
      this.contextHistory.pop();
    }
    
    this.logger.debug(`Contexte mis à jour: phase=${projectPhase}, prochaine release=${releaseSchedule.nextRelease}`);
  }
  
  /**
   * Traitement des mismatches détectés
   */
  async handleMismatchesDetected(data: any) {
    const { count, critical, report } = data;
    
    if (count === 0) {
      return; // Rien à faire
    }
    
    this.logger.log(`Traitement de ${count} mismatches (${critical} critiques)`);
    
    // Convertir les mismatches en alertes
    for (const mismatch of report.mismatches) {
      await this.createAlertFromMismatch(mismatch);
    }
    
    // Si alertes critiques, envoyer un rapport global
    if (critical > 0) {
      await this.sendSummaryAlert(report);
    }
  }
  
  /**
   * Crée une alerte à partir d'un mismatch
   */
  private async createAlertFromMismatch(mismatch: any) {
    // Convertir la sévérité en priorité d'alerte
    const priorityMap = {
      'critical': AlertPriority.CRITICAL,
      'high': AlertPriority.HIGH,
      'medium': AlertPriority.MEDIUM,
      'low': AlertPriority.LOW
    };
    
    // Convertir le type de mismatch en type d'alerte
    const typeMap = {
      'api_signature_mismatch': AlertType.API_DIVERGENT,
      'missing_implementation': AlertType.API_DIVERGENT,
      'data_model_mismatch': AlertType.MODEL_MODIFIE,
      // Autres mappings...
    };
    
    // Vérifier si cette alerte existe déjà
    const existingAlert = await this.alertModel.findOne({
      sourceId: mismatch.id,
      status: { $in: ['new', 'in_progress'] }
    });
    
    if (existingAlert) {
      // Mettre à jour l'alerte existante
      existingAlert.priority = priorityMap[mismatch.severity] || AlertPriority.MEDIUM;
      existingAlert.lastDetected = new Date();
      existingAlert.occurrences += 1;
      
      await existingAlert.save();
      this.logger.debug(`Alerte existante mise à jour: ${existingAlert.id}`);
      
      return existingAlert;
    }
    
    // Créer une nouvelle alerte
    const context = this.contextHistory[0]; // Contexte le plus récent
    
    const alert = new this.alertModel({
      type: typeMap[mismatch.type] || AlertType.AUTRE,
      sourceType: 'mismatch',
      sourceId: mismatch.id,
      title: this.generateAlertTitle(mismatch),
      description: mismatch.description,
      priority: priorityMap[mismatch.severity] || AlertPriority.MEDIUM,
      details: {
        ...mismatch.details,
        suggestedFix: mismatch.suggestedFix
      },
      component: this.determineComponent(mismatch),
      assignee: await this.findBestAssignee(mismatch),
      status: 'new',
      createdAt: new Date(),
      lastDetected: new Date(),
      occurrences: 1,
      notificationsSent: []
    });
    
    // Ajuster la priorité en fonction du contexte
    this.adjustAlertPriority(alert, context);
    
    // Sauvegarder l'alerte
    await alert.save();
    this.logger.log(`Nouvelle alerte créée: ${alert.id} (${AlertPriority[alert.priority]})`);
    
    // Envoyer les notifications
    await this.sendAlertNotifications(alert);
    
    return alert;
  }
  
  /**
   * Ajuste la priorité d'une alerte en fonction du contexte
   */
  private adjustAlertPriority(alert: DesyncAlert, context: AlertContext) {
    if (!context) return;
    
    // 1. Ajustement basé sur la phase du projet
    if (context.projectPhase === 'pre-release' && context.releaseSchedule.isCriticalPath) {
      alert.priority = Math.min(alert.priority + 1, AlertPriority.CRITICAL);
    }
    
    // 2. Ajustement basé sur la santé du composant
    const compHealth = context.componentHealth[alert.component];
    if (compHealth) {
      if (compHealth.errorRate > 0.1 || compHealth.changeFrequency > 0.5) {
        // Composant instable ou en changement fréquent = priorité plus élevée
        alert.priority = Math.min(alert.priority + 1, AlertPriority.CRITICAL);
      } else if (compHealth.errorRate < 0.01 && compHealth.changeFrequency < 0.1) {
        // Composant stable = priorité légèrement réduite
        alert.priority = Math.max(alert.priority - 1, AlertPriority.LOW);
      }
    }
    
    // 3. Ajustement basé sur les alertes récentes
    const similarRecentAlerts = context.recentAlerts.filter(a => 
      a.type === alert.type && a.component === alert.component
    );
    
    if (similarRecentAlerts.length > 3) {
      // Problème récurrent = augmenter la priorité
      alert.priority = Math.min(alert.priority + 1, AlertPriority.CRITICAL);
    }
  }
  
  /**
   * Envoie des notifications pour une alerte
   */
  private async sendAlertNotifications(alert: DesyncAlert) {
    // Obtenir la configuration des canaux pour cette priorité
    const channelsConfig = this.getChannelsConfig(alert.priority);
    
    for (const channel of channelsConfig) {
      try {
        switch (channel.type) {
          case 'slack':
            await this.notificationService.sendNotification({
              channel: 'slack',
              recipient: channel.target,
              subject: `[${AlertPriority[alert.priority]}] ${alert.title}`,
              message: this.formatSlackMessage(alert, channel.includeDetails),
              priority: this.mapAlertPriorityToNotificationPriority(alert.priority)
            });
            break;
            
          case 'email':
            await this.notificationService.sendNotification({
              channel: 'email',
              recipient: channel.target,
              subject: `[Désynchronisation] ${alert.title}`,
              message: this.formatEmailMessage(alert, channel.includeDetails),
              priority: this.mapAlertPriorityToNotificationPriority(alert.priority)
            });
            break;
            
          case 'dashboard':
            // Les alertes sont automatiquement affichées dans le dashboard
            break;
            
          // Autres canaux...
        }
        
        // Enregistrer la notification envoyée
        alert.notificationsSent.push({
          channel: channel.type,
          target: channel.target,
          timestamp: new Date()
        });
        
      } catch (error) {
        this.logger.error(`Erreur lors de l'envoi de notification ${channel.type}: ${error.message}`);
      }
    }
    
    // Mise à jour de l'alerte avec les notifications envoyées
    await this.alertModel.updateOne(
      { _id: alert._id },
      { $set: { notificationsSent: alert.notificationsSent } }
    );
  }
  
  /**
   * Détermine le composant concerné par un mismatch
   */
  private determineComponent(mismatch: any): string {
    // Version simplifiée - analyse des chemins pour déterminer le composant
    const pathsToCheck = [
      mismatch.details.codePath,
      mismatch.details.documentPath
    ].filter(Boolean);
    
    // Liste des composants connus
    const knownComponents = [
      'auth', 'user', 'product', 'cart', 'payment', 
      'order', 'admin', 'search', 'notification'
    ];
    
    for (const path of pathsToCheck) {
      if (!path) continue;
      
      for (const component of knownComponents) {
        if (path.includes(`/${component}/`) || path.includes(`${component}.`)) {
          return component;
        }
      }
    }
    
    return 'core'; // Composant par défaut
  }
  
  /**
   * Trouve le meilleur assigné pour une alerte
   */
  private async findBestAssignee(mismatch: any): Promise<string> {
    // Dans une implémentation réelle, utiliser:
    // 1. Git blame pour voir qui a modifié le fichier récemment
    // 2. CODEOWNERS pour déterminer l'équipe responsable
    // 3. Historique des assignations précédentes
    
    // Version simplifiée
    const component = this.determineComponent(mismatch);
    
    // Mapping de composants à des owners (dans un vrai système, chargé depuis la config)
    const componentOwners = {
      'auth': 'auth-team',
      'user': 'user-team',
      'product': 'product-team',
      'cart': 'cart-team',
      'payment': 'payment-team',
      'order': 'order-team',
      'admin': 'admin-team',
      'search': 'search-team',
      'notification': 'notification-team',
      'core': 'core-team'
    };
    
    return componentOwners[component] || 'documentation-team';
  }
  
  /**
   * Génère un titre pour une alerte
   */
  private generateAlertTitle(mismatch: any): string {
    const typeMap = {
      'api_signature_mismatch': 'Signature API incompatible',
      'missing_implementation': 'API documentée mais non implémentée',
      'data_model_mismatch': 'Modèle de données divergent',
      // Autres mappings...
    };
    
    const baseTitle = typeMap[mismatch.type] || 'Désynchronisation détectée';
    
    let context = '';
    
    // Ajouter du contexte selon le type de mismatch
    if (mismatch.type === 'api_signature_mismatch' && mismatch.details.diff) {
      const { missing, extra } = mismatch.details.diff;
      if (missing && missing.length > 0) {
        context = `: paramètres manquants`;
      } else if (extra && extra.length > 0) {
        context = `: paramètres supplémentaires`;
      }
    }
    
    // Ajouter l'identifiant de l'élément concerné si disponible
    let elementId = '';
    if (mismatch.details.codePath) {
      const pathParts = mismatch.details.codePath.split('/');
      elementId = pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, "");
    }
    
    return `${baseTitle}${context}${elementId ? ` dans ${elementId}` : ''}`;
  }
  
  /**
   * Obtient la configuration des canaux pour un niveau de priorité
   */
  private getChannelsConfig(priority: AlertPriority): AlertChannel[] {
    // Dans une implémentation réelle, charger depuis la configuration
    const config = {
      [AlertPriority.CRITICAL]: [
        { type: 'slack', target: '#alerts-critical', includeDetails: true },
        { type: 'email', target: 'team-leads@company.com', includeDetails: true },
        { type: 'dashboard', highlight: true }
      ],
      [AlertPriority.HIGH]: [
        { type: 'slack', target: '#alerts-important', includeDetails: true },
        { type: 'dashboard', highlight: true }
      ],
      [AlertPriority.MEDIUM]: [
        { type: 'dashboard', highlight: false }
      ],
      [AlertPriority.LOW]: [
        { type: 'dashboard', highlight: false }
      ]
    };
    
    return config[priority] || [];
  }
  
  /**
   * Formate un message Slack pour une alerte
   */
  private formatSlackMessage(alert: DesyncAlert, includeDetails: boolean): string {
    const priorityEmoji = {
      [AlertPriority.CRITICAL]: '🚨',
      [AlertPriority.HIGH]: '⚠️',
      [AlertPriority.MEDIUM]: '📣',
      [AlertPriority.LOW]: 'ℹ️'
    };
    
    let message = `${priorityEmoji[alert.priority]} *${alert.title}*\n\n`;
    message += `*Composant:* ${alert.component}\n`;
    message += `*Priorité:* ${AlertPriority[alert.priority]}\n\n`;
    message += `${alert.description}\n`;
    
    if (includeDetails && alert.details) {
      message += '\n*Détails:*\n';
      
      if (alert.details.documentPath) {
        message += `Document: \`${alert.details.documentPath}\`\n`;
      }
      
      if (alert.details.codePath) {
        message += `Code: \`${alert.details.codePath}\`\n`;
      }
      
      if (alert.details.suggestedFix) {
        message += `\n*Correction suggérée:*\n${alert.details.suggestedFix}\n`;
      }
    }
    
    message += `\n👀 <${this.configService.get('APP_URL')}/admin/alerts/${alert.id}|Voir l'alerte>`;
    
    return message;
  }
  
  /**
   * Formate un message email pour une alerte
   */
  private formatEmailMessage(alert: DesyncAlert, includeDetails: boolean): string {
    // Version simplifiée - dans un vrai système, utiliser un template HTML
    let message = `<h2>${alert.title}</h2>`;
    message += `<p><strong>Composant:</strong> ${alert.component}<br>`;
    message += `<strong>Priorité:</strong> ${AlertPriority[alert.priority]}</p>`;
    message += `<p>${alert.description}</p>`;
    
    if (includeDetails && alert.details) {
      message += '<h3>Détails:</h3>';
      
      if (alert.details.documentPath) {
        message += `<p><strong>Document:</strong> ${alert.details.documentPath}</p>`;
      }
      
      if (alert.details.codePath) {
        message += `<p><strong>Code:</strong> ${alert.details.codePath}</p>`;
      }
      
      if (alert.details.suggestedFix) {
        message += `<h4>Correction suggérée:</h4><p>${alert.details.suggestedFix}</p>`;
      }
    }
    
    message += `<p><a href="${this.configService.get('APP_URL')}/admin/alerts/${alert.id}">Voir l'alerte</a></p>`;
    
    return message;
  }
  
  /**
   * Mappe une priorité d'alerte à une priorité de notification
   */
  private mapAlertPriorityToNotificationPriority(priority: AlertPriority): string {
    const mapping = {
      [AlertPriority.CRITICAL]: 'high',
      [AlertPriority.HIGH]: 'high',
      [AlertPriority.MEDIUM]: 'medium',
      [AlertPriority.LOW]: 'low'
    };
    
    return mapping[priority] || 'medium';
  }
  
  /**
   * Vérifier si des alertes ont été résolues suite à une mise à jour de document
   */
  private async checkForResolvedAlerts(data: any) {
    const { path } = data;
    
    // Rechercher les alertes concernant ce document
    const alerts = await this.alertModel.find({
      'details.documentPath': path,
      status: { $in: ['new', 'in_progress'] }
    });
    
    if (alerts.length === 0) {
      return;
    }
    
    this.logger.debug(`Vérification de ${alerts.length} alertes potentiellement résolues suite à la mise à jour de ${path}`);
    
    // Pour chaque alerte, vérifier si le problème a été résolu
    for (const alert of alerts) {
      // Vérification simplifiée - dans un vrai système, revérifier via MismatchTrackerService
      const isResolved = await this.checkIfIssueResolved(alert);
      
      if (isResolved) {
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.resolution = {
          method: 'document_updated',
          resolvedBy: data.userId || 'system',
          comment: `Résolu par mise à jour de document: ${path}`
        };
        
        await alert.save();
        
        this.logger.log(`Alerte ${alert.id} marquée comme résolue automatiquement`);
      }
    }
  }
  
  /**
   * Vérifie si une alerte est résolue
   */
  private async checkIfIssueResolved(alert: DesyncAlert): Promise<boolean> {
    // Simplification - dans un vrai système, réexécuter la vérification
    // de correspondance spécifique qui a généré l'alerte
    
    if (alert.sourceType === 'mismatch' && alert.sourceId) {
      // Vérifier si le mismatch original existe toujours
      const stillExists = await this.mismatchService.checkMismatchExists(alert.sourceId);
      return !stillExists;
    }
    
    return false;
  }
  
  /**
   * Détermine la phase actuelle du projet
   */
  private determineProjectPhase(): 'development' | 'pre-release' | 'maintenance' {
    // Dans une implémentation réelle, déterminer en fonction de:
    // 1. Configuration du projet
    // 2. Branches actives
    // 3. Tags récents
    // 4. Calendrier de releases
    
    return 'development'; // Valeur par défaut
  }
  
  /**
   * Obtient le calendrier de release
   */
  private async getReleaseSchedule() {
    // Dans une implémentation réelle, obtenir depuis un système de gestion de projet
    return {
      nextRelease: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 jours
      isCriticalPath: false
    };
  }
  
  /**
   * Obtient la santé des composants
   */
  private async getComponentHealth() {
    // Dans une implémentation réelle, obtenir depuis un système de monitoring
    return {
      'auth': { errorRate: 0.01, changeFrequency: 0.2 },
      'user': { errorRate: 0.02, changeFrequency: 0.1 },
      'product': { errorRate: 0.03, changeFrequency: 0.3 },
      'cart': { errorRate: 0.05, changeFrequency: 0.4 },
      'payment': { errorRate: 0.01, changeFrequency: 0.1 },
      'order': { errorRate: 0.02, changeFrequency: 0.2 },
      'admin': { errorRate: 0.01, changeFrequency: 0.1 },
      'search': { errorRate: 0.03, changeFrequency: 0.2 },
      'core': { errorRate: 0.01, changeFrequency: 0.1 }
    };
  }
  
  /**
   * Obtient les alertes récentes
   */
  private async getRecentAlerts() {
    // Obtenir les alertes des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return this.alertModel.find({
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(100);
  }
  
  /**
   * Obtient la disponibilité des équipes
   */
  private async getTeamAvailability() {
    // Dans une implémentation réelle, obtenir depuis un calendrier d'équipe
    return {
      'auth-team': true,
      'user-team': true,
      'product-team': true,
      'cart-team': false,  // En congés?
      'payment-team': true,
      'order-team': true,
      'admin-team': true,
      'search-team': true,
      'core-team': true,
      'documentation-team': true
    };
  }

  /**
   * Envoie un rapport global pour les alertes critiques
   */
  private async sendSummaryAlert(report: any) {
    const criticalMismatches = report.mismatches.filter(m => m.severity === 'critical');
    
    const message = this.formatSummaryMessage(criticalMismatches);
    
    await this.notificationService.sendNotification({
      channel: 'slack',
      recipient: '#alerts-critical',
      subject: `🚨 ${criticalMismatches.length} désynchronisations critiques détectées`,
      message,
      priority: 'high'
    });
    
    // Également email aux leads
    await this.notificationService.sendNotification({
      channel: 'email',
      recipient: 'tech-leads@company.com',
      subject: `[URGENT] ${criticalMismatches.length} désynchronisations critiques détectées`,
      message: this.formatSummaryEmailMessage(criticalMismatches),
      priority: 'high'
    });
  }
  
  /**
   * Formate un message résumé pour Slack
   */
  private formatSummaryMessage(mismatches: any[]): string {
    let message = `*${mismatches.length} désynchronisations critiques détectées*\n\n`;
    
    // Regrouper par composant
    const byComponent = mismatches.reduce((acc, m) => {
      const component = this.determineComponent(m);
      acc[component] = acc[component] || [];
      acc[component].push(m);
      return acc;
    }, {});
    
    for (const [component, compMismatches] of Object.entries(byComponent)) {
      message += `*Composant ${component}*: ${compMismatches.length} problèmes\n`;
      
      for (const mismatch of compMismatches) {
        message += `- ${mismatch.description}\n`;
      }
      
      message += '\n';
    }
    
    message += `👀 <${this.configService.get('APP_URL')}/admin/alerts|Voir toutes les alertes>`;
    
    return message;
  }
  
  /**
   * Formate un message résumé pour email
   */
  private formatSummaryEmailMessage(mismatches: any[]): string {
    // Version simplifiée - dans un vrai système, utiliser un template HTML
    let message = `<h1>${mismatches.length} désynchronisations critiques détectées</h1>`;
    
    // Regrouper par composant
    const byComponent = mismatches.reduce((acc, m) => {
      const component = this.determineComponent(m);
      acc[component] = acc[component] || [];
      acc[component].push(m);
      return acc;
    }, {});
    
    for (const [component, compMismatches] of Object.entries(byComponent)) {
      message += `<h2>Composant ${component}: ${compMismatches.length} problèmes</h2><ul>`;
      
      for (const mismatch of compMismatches) {
        message += `<li>${mismatch.description}</li>`;
      }
      
      message += '</ul>';
    }
    
    message += `<p><a href="${this.configService.get('APP_URL')}/admin/alerts">Voir toutes les alertes</a></p>`;
    
    return message;
  }
}
