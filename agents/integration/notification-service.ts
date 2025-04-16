import { Logger } from "@nestjs/common";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as nodemailer from "nodemailer";

/**
 * Type de notification
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Canal de notification
 */
export enum NotificationChannel {
  SLACK = 'slack',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  CONSOLE = 'console',
  FILE = 'file'
}

/**
 * Configuration pour le service de notification
 */
export interface NotificationConfig {
  channels: {
    [NotificationChannel.SLACK]?: {
      webhookUrl: string;
      defaultChannel?: string;
      username?: string;
    };
    [NotificationChannel.EMAIL]?: {
      transport: {
        host: string;
        port: number;
        secure?: boolean;
        auth?: {
          user: string;
          pass: string;
        };
      };
      defaultFrom: string;
      defaultTo: string[];
      defaultSubjectPrefix?: string;
    };
    [NotificationChannel.WEBHOOK]?: {
      url: string;
      headers?: Record<string, string>;
    };
    [NotificationChannel.FILE]?: {
      filePath: string;
    };
  };
  defaults?: {
    channels?: NotificationChannel[];
    type?: NotificationType;
    throttleMs?: number;
  };
}

/**
 * Options pour une notification
 */
export interface NotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
  // Options spécifiques aux canaux
  slack?: {
    channel?: string;
    username?: string;
    iconEmoji?: string;
    blocks?: any[];
  };
  email?: {
    subject?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    from?: string;
    html?: boolean;
  };
  webhook?: {
    headers?: Record<string, string>;
  };
}

/**
 * Service de notification pour les événements du système
 * 
 * Ce service permet d'envoyer des notifications sur différents canaux 
 * (Slack, Email, Webhook, Console, Fichier) en fonction des événements du système.
 */
export class NotificationService {
  private readonly logger = new Logger('NotificationService');
  private readonly config: NotificationConfig;
  private lastNotifications: Record<string, number> = {}; // Pour le throttling
  
  constructor(config: NotificationConfig) {
    this.config = config;
    
    // Configurer les valeurs par défaut
    this.config.defaults = this.config.defaults || {};
    this.config.defaults.channels = this.config.defaults.channels || [NotificationChannel.CONSOLE];
    this.config.defaults.type = this.config.defaults.type || NotificationType.INFO;
    this.config.defaults.throttleMs = this.config.defaults.throttleMs || 60000; // 1 minute par défaut
    
    // S'assurer que les répertoires pour les fichiers de log existent
    if (this.config.channels[NotificationChannel.FILE]?.filePath) {
      const dir = path.dirname(this.config.channels[NotificationChannel.FILE].filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    this.logger.log('Service de notification initialisé');
  }
  
  /**
   * Envoie une notification
   * @param options Options de la notification
   */
  async notify(options: NotificationOptions): Promise<boolean> {
    // Appliquer les valeurs par défaut
    const type = options.type || this.config.defaults.type;
    const channels = options.channels || this.config.defaults.channels;
    
    // Générer une clé pour le throttling
    const throttleKey = `${type}-${options.title}`;
    
    // Vérifier le throttling
    const now = Date.now();
    if (
      this.lastNotifications[throttleKey] && 
      now - this.lastNotifications[throttleKey] < this.config.defaults.throttleMs
    ) {
      this.logger.debug(`Notification throttlée: ${options.title}`);
      return false;
    }
    
    // Mettre à jour le timestamp de la dernière notification
    this.lastNotifications[throttleKey] = now;
    
    // Envoyer la notification sur chaque canal configuré
    const promises = channels.map(channel => this.sendToChannel(channel, options, type));
    
    // Attendre que toutes les notifications soient envoyées
    const results = await Promise.allSettled(promises);
    const allSucceeded = results.every(result => result.status === 'fulfilled' && result.value);
    
    return allSucceeded;
  }
  
  /**
   * Raccourci pour envoyer une notification d'information
   */
  async info(title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<boolean> {
    return this.notify({
      title,
      message,
      type: NotificationType.INFO,
      ...options
    });
  }
  
  /**
   * Raccourci pour envoyer une notification de succès
   */
  async success(title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<boolean> {
    return this.notify({
      title,
      message,
      type: NotificationType.SUCCESS,
      ...options
    });
  }
  
  /**
   * Raccourci pour envoyer une notification d'avertissement
   */
  async warning(title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<boolean> {
    return this.notify({
      title,
      message,
      type: NotificationType.WARNING,
      ...options
    });
  }
  
  /**
   * Raccourci pour envoyer une notification d'erreur
   */
  async error(title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<boolean> {
    return this.notify({
      title,
      message,
      type: NotificationType.ERROR,
      ...options
    });
  }
  
  /**
   * Raccourci pour envoyer une notification critique
   */
  async critical(title: string, message: string, options: Partial<NotificationOptions> = {}): Promise<boolean> {
    return this.notify({
      title,
      message,
      type: NotificationType.CRITICAL,
      ...options
    });
  }
  
  /**
   * Envoie une notification sur un canal spécifique
   * @param channel Canal de notification
   * @param options Options de notification
   * @param type Type de notification
   * @returns true si l'envoi a réussi, false sinon
   */
  private async sendToChannel(
    channel: NotificationChannel,
    options: NotificationOptions,
    type: NotificationType
  ): Promise<boolean> {
    try {
      switch (channel) {
        case NotificationChannel.SLACK:
          return await this.sendToSlack(options, type);
        
        case NotificationChannel.EMAIL:
          return await this.sendToEmail(options, type);
        
        case NotificationChannel.WEBHOOK:
          return await this.sendToWebhook(options, type);
        
        case NotificationChannel.CONSOLE:
          return this.sendToConsole(options, type);
        
        case NotificationChannel.FILE:
          return await this.sendToFile(options, type);
        
        default:
          this.logger.warn(`Canal de notification non pris en charge: ${channel}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de la notification sur le canal ${channel}:`, error);
      return false;
    }
  }
  
  /**
   * Envoie une notification via Slack
   */
  private async sendToSlack(
    options: NotificationOptions,
    type: NotificationType
  ): Promise<boolean> {
    const slackConfig = this.config.channels[NotificationChannel.SLACK];
    if (!slackConfig?.webhookUrl) {
      this.logger.warn('Configuration Slack manquante');
      return false;
    }
    
    try {
      // Déterminer l'icône emoji en fonction du type
      let iconEmoji = options.slack?.iconEmoji;
      if (!iconEmoji) {
        switch (type) {
          case NotificationType.INFO:
            iconEmoji = ':information_source:';
            break;
          case NotificationType.SUCCESS:
            iconEmoji = ':white_check_mark:';
            break;
          case NotificationType.WARNING:
            iconEmoji = ':warning:';
            break;
          case NotificationType.ERROR:
            iconEmoji = ':x:';
            break;
          case NotificationType.CRITICAL:
            iconEmoji = ':skull_and_crossbones:';
            break;
        }
      }
      
      // Préparer le payload de base
      const payload: any = {
        channel: options.slack?.channel || slackConfig.defaultChannel,
        username: options.slack?.username || slackConfig.username || 'Orchestrator Bot',
        icon_emoji: iconEmoji,
        text: `*${options.title}*\n${options.message}`
      };
      
      // Ajouter des blocs si spécifiés
      if (options.slack?.blocks) {
        payload.blocks = options.slack.blocks;
      }
      // Sinon, créer un bloc par défaut
      else {
        payload.blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: options.title
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: options.message
            }
          }
        ];
        
        // Ajouter des métadonnées si présentes
        if (options.metadata && Object.keys(options.metadata).length > 0) {
          payload.blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Détails:*\n' + 
                Object.entries(options.metadata)
                  .map(([key, value]) => `• *${key}:* ${JSON.stringify(value)}`)
                  .join('\n')
            }
          });
        }
      }
      
      // Envoyer la notification à Slack
      await axios.post(slackConfig.webhookUrl, payload);
      this.logger.log(`Notification envoyée sur Slack: ${options.title}`);
      
      return true;
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi de la notification sur Slack:', error);
      return false;
    }
  }
  
  /**
   * Envoie une notification par email
   */
  private async sendToEmail(
    options: NotificationOptions,
    type: NotificationType
  ): Promise<boolean> {
    const emailConfig = this.config.channels[NotificationChannel.EMAIL];
    if (!emailConfig?.transport) {
      this.logger.warn('Configuration Email manquante');
      return false;
    }
    
    try {
      // Créer le transporteur nodemailer
      const transporter = nodemailer.createTransport(emailConfig.transport);
      
      // Déterminer le préfixe du sujet en fonction du type
      let subjectPrefix = '';
      switch (type) {
        case NotificationType.INFO:
          subjectPrefix = '[INFO]';
          break;
        case NotificationType.SUCCESS:
          subjectPrefix = '[SUCCÈS]';
          break;
        case NotificationType.WARNING:
          subjectPrefix = '[AVERTISSEMENT]';
          break;
        case NotificationType.ERROR:
          subjectPrefix = '[ERREUR]';
          break;
        case NotificationType.CRITICAL:
          subjectPrefix = '[CRITIQUE]';
          break;
      }
      
      // Si un préfixe par défaut est configuré, l'ajouter également
      if (emailConfig.defaultSubjectPrefix) {
        subjectPrefix = `${emailConfig.defaultSubjectPrefix} ${subjectPrefix}`;
      }
      
      // Créer le contenu de l'email
      let html = '';
      let text = '';
      
      if (options.email?.html || options.metadata) {
        // Créer un email HTML
        html = `
          <h2>${options.title}</h2>
          <p>${options.message}</p>
        `;
        
        // Ajouter les métadonnées si présentes
        if (options.metadata && Object.keys(options.metadata).length > 0) {
          html += '<h3>Détails:</h3><ul>';
          for (const [key, value] of Object.entries(options.metadata)) {
            html += `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`;
          }
          html += '</ul>';
        }
        
        // Version texte brut également
        text = `${options.title}\n\n${options.message}`;
        
        if (options.metadata) {
          text += '\n\nDétails:\n';
          for (const [key, value] of Object.entries(options.metadata)) {
            text += `- ${key}: ${JSON.stringify(value)}\n`;
          }
        }
      } else {
        // Email en texte brut uniquement
        text = `${options.title}\n\n${options.message}`;
        
        if (options.metadata) {
          text += '\n\nDétails:\n';
          for (const [key, value] of Object.entries(options.metadata)) {
            text += `- ${key}: ${JSON.stringify(value)}\n`;
          }
        }
      }
      
      // Envoyer l'email
      const mailOptions = {
        from: options.email?.from || emailConfig.defaultFrom,
        to: options.email?.to || emailConfig.defaultTo,
        cc: options.email?.cc,
        bcc: options.email?.bcc,
        subject: `${subjectPrefix} ${options.email?.subject || options.title}`,
        text,
        html: html || undefined
      };
      
      await transporter.sendMail(mailOptions);
      this.logger.log(`Notification envoyée par email: ${options.title}`);
      
      return true;
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi de la notification par email:', error);
      return false;
    }
  }
  
  /**
   * Envoie une notification via un webhook
   */
  private async sendToWebhook(
    options: NotificationOptions,
    type: NotificationType
  ): Promise<boolean> {
    const webhookConfig = this.config.channels[NotificationChannel.WEBHOOK];
    if (!webhookConfig?.url) {
      this.logger.warn('Configuration Webhook manquante');
      return false;
    }
    
    try {
      // Préparer le payload
      const payload = {
        title: options.title,
        message: options.message,
        type,
        timestamp: new Date().toISOString(),
        metadata: options.metadata || {}
      };
      
      // Préparer les en-têtes
      const headers = {
        'Content-Type': 'application/json',
        ...webhookConfig.headers,
        ...options.webhook?.headers
      };
      
      // Envoyer la notification au webhook
      await axios.post(webhookConfig.url, payload, { headers });
      this.logger.log(`Notification envoyée au webhook: ${options.title}`);
      
      return true;
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi de la notification au webhook:', error);
      return false;
    }
  }
  
  /**
   * Affiche une notification dans la console
   */
  private sendToConsole(
    options: NotificationOptions,
    type: NotificationType
  ): boolean {
    // Déterminer le style de log en fonction du type
    let logMethod: 'log' | 'info' | 'warn' | 'error';
    let prefix: string;
    
    switch (type) {
      case NotificationType.INFO:
        logMethod = 'info';
        prefix = '[INFO]';
        break;
      case NotificationType.SUCCESS:
        logMethod = 'log';
        prefix = '[SUCCÈS]';
        break;
      case NotificationType.WARNING:
        logMethod = 'warn';
        prefix = '[AVERTISSEMENT]';
        break;
      case NotificationType.ERROR:
        logMethod = 'error';
        prefix = '[ERREUR]';
        break;
      case NotificationType.CRITICAL:
        logMethod = 'error';
        prefix = '[CRITIQUE]';
        break;
      default:
        logMethod = 'log';
        prefix = '[INFO]';
    }
    
    // Afficher la notification
    this.logger[logMethod](`${prefix} ${options.title}`);
    this.logger[logMethod](options.message);
    
    // Afficher les métadonnées si présentes
    if (options.metadata && Object.keys(options.metadata).length > 0) {
      this.logger[logMethod]('Détails:', options.metadata);
    }
    
    return true;
  }
  
  /**
   * Écrit une notification dans un fichier
   */
  private async sendToFile(
    options: NotificationOptions,
    type: NotificationType
  ): Promise<boolean> {
    const fileConfig = this.config.channels[NotificationChannel.FILE];
    if (!fileConfig?.filePath) {
      this.logger.warn('Configuration de fichier manquante');
      return false;
    }
    
    try {
      // Formater la notification
      const timestamp = new Date().toISOString();
      const entry = {
        timestamp,
        type,
        title: options.title,
        message: options.message,
        metadata: options.metadata
      };
      
      // Écrire dans le fichier (en mode append)
      fs.appendFileSync(
        fileConfig.filePath,
        JSON.stringify(entry) + '\n',
        'utf8'
      );
      
      this.logger.log(`Notification écrite dans le fichier: ${options.title}`);
      
      return true;
    } catch (error) {
      this.logger.error('Erreur lors de l\'écriture de la notification dans le fichier:', error);
      return false;
    }
  }
}