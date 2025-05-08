/**
 * Service de notification par email
 */
import * as nodemailer from 'nodemailer';
import {
    Alert,
    EmailConfig,
    NotificationService,
    AlertSeverity
} from '../interfaces/alert-types';

/**
 * Service responsable de l'envoi de notifications par email
 */
export class EmailNotificationService implements NotificationService {
    private config: EmailConfig;
    private transporter: any;

    /**
     * Crée une nouvelle instance du service de notification par email
     * @param config Configuration email
     */
    constructor(config: EmailConfig) {
        this.config = config;
        this.initTransporter();
    }

    /**
     * Initialise le transporteur nodemailer
     */
    private initTransporter(): void {
        try {
            this.transporter = nodemailer.createTransport({
                host: this.config.smtpConfig.host,
                port: this.config.smtpConfig.port,
                secure: this.config.smtpConfig.secure,
                auth: {
                    user: this.config.smtpConfig.auth.user,
                    pass: this.config.smtpConfig.auth.pass
                }
            });
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du transporteur email:', error);
        }
    }

    /**
     * Vérifie si le service est configuré correctement
     */
    public isConfigured(): boolean {
        return !!this.transporter &&
            !!this.config.from &&
            Array.isArray(this.config.to) &&
            this.config.to.length > 0;
    }

    /**
     * Envoie une notification par email
     * @param alert L'alerte à envoyer
     */
    public async send(alert: Alert): Promise<boolean> {
        if (!this.isConfigured()) {
            console.error('Le service de notification par email n\'est pas configuré correctement');
            return false;
        }

        const subject = this.config.subject || this.generateSubject(alert);
        const html = this.generateEmailContent(alert);

        try {
            await this.transporter.sendMail({
                from: this.config.from,
                to: this.config.to.join(', '),
                cc: this.config.cc ? this.config.cc.join(', ') : undefined,
                subject,
                html
            });

            console.log(`Email d'alerte envoyé avec succès: ${alert.name}`);
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'envoi de l'email d'alerte:`, error);
            return false;
        }
    }

    /**
     * Génère un sujet d'email en fonction de l'alerte
     */
    private generateSubject(alert: Alert): string {
        const severityEmoji = this.getSeverityEmoji(alert.severity);
        return `${severityEmoji} [${alert.severity.toUpperCase()}] Alerte: ${alert.name}`;
    }

    /**
     * Retourne un emoji selon le niveau de sévérité
     */
    private getSeverityEmoji(severity: AlertSeverity): string {
        switch (severity) {
            case AlertSeverity.CRITICAL:
                return '🔥';
            case AlertSeverity.ERROR:
                return '❌';
            case AlertSeverity.WARNING:
                return '⚠️';
            case AlertSeverity.INFO:
            default:
                return 'ℹ️';
        }
    }

    /**
     * Génère le contenu HTML de l'email d'alerte
     */
    private generateEmailContent(alert: Alert): string {
        // Si un template est spécifié, l'utiliser
        if (this.config.template) {
            // Simple template engine avec remplacement de variables
            return this.config.template
                .replace(/{{alertName}}/g, alert.name)
                .replace(/{{alertDescription}}/g, alert.description)
                .replace(/{{alertSeverity}}/g, alert.severity)
                .replace(/{{alertSource}}/g, alert.source)
                .replace(/{{alertValue}}/g, String(alert.value))
                .replace(/{{alertTime}}/g, alert.createdAt.toLocaleString())
                .replace(/{{alertId}}/g, alert.id);
        }

        // Template par défaut
        const severityColor = this.getSeverityColor(alert.severity);
        const ruleDetails = `${alert.rule.metric} ${alert.rule.operator} ${alert.rule.threshold}`;

        return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .alert-container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; max-width: 600px; }
            .alert-header { background-color: ${severityColor}; color: white; padding: 10px; border-radius: 3px; }
            .alert-body { padding: 15px 0; }
            .alert-footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
            .detail-row { display: flex; margin-bottom: 8px; }
            .detail-label { font-weight: bold; width: 120px; }
            .detail-value { flex: 1; }
          </style>
        </head>
        <body>
          <div class="alert-container">
            <div class="alert-header">
              <h2>${this.getSeverityEmoji(alert.severity)} Alerte: ${alert.name}</h2>
            </div>
            <div class="alert-body">
              <p>${alert.description}</p>
              
              <div class="detail-row">
                <div class="detail-label">Sévérité:</div>
                <div class="detail-value">${alert.severity.toUpperCase()}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Source:</div>
                <div class="detail-value">${alert.source}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Règle:</div>
                <div class="detail-value">${ruleDetails}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Valeur actuelle:</div>
                <div class="detail-value">${alert.value}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${alert.createdAt.toLocaleString()}</div>
              </div>
              
              ${alert.context && Object.keys(alert.context).length > 0 ? `
                <div class="detail-row">
                  <div class="detail-label">Contexte:</div>
                  <div class="detail-value">
                    <pre>${JSON.stringify(alert.context, null, 2)}</pre>
                  </div>
                </div>
              ` : ''}
            </div>
            <div class="alert-footer">
              ID de l'alerte: ${alert.id}<br>
              Ceci est un message automatique, merci de ne pas y répondre.
            </div>
          </div>
        </body>
      </html>
    `;
    }

    /**
     * Retourne une couleur CSS selon le niveau de sévérité
     */
    private getSeverityColor(severity: AlertSeverity): string {
        switch (severity) {
            case AlertSeverity.CRITICAL:
                return '#d9534f'; // Rouge
            case AlertSeverity.ERROR:
                return '#f0ad4e'; // Orange
            case AlertSeverity.WARNING:
                return '#f0ad4e'; // Jaune
            case AlertSeverity.INFO:
            default:
                return '#5bc0de'; // Bleu
        }
    }
}