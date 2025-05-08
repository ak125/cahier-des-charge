/**
 * Service de notification Slack
 */
import axios from 'axios';
import {
    Alert,
    SlackConfig,
    NotificationService,
    AlertSeverity
} from '../interfaces/alert-types';

/**
 * Service responsable de l'envoi de notifications via Slack
 */
export class SlackNotificationService implements NotificationService {
    private config: SlackConfig;

    /**
     * Crée une nouvelle instance du service de notification Slack
     * @param config Configuration Slack
     */
    constructor(config: SlackConfig) {
        this.config = config;
    }

    /**
     * Vérifie si le service est configuré correctement
     */
    public isConfigured(): boolean {
        return !!this.config && !!this.config.webhookUrl;
    }

    /**
     * Envoie une notification via Slack
     * @param alert L'alerte à envoyer
     */
    public async send(alert: Alert): Promise<boolean> {
        if (!this.isConfigured()) {
            console.error('Le service de notification Slack n\'est pas configuré correctement');
            return false;
        }

        try {
            const payload = this.generateSlackPayload(alert);

            await axios.post(this.config.webhookUrl, payload);

            console.log(`Notification Slack envoyée avec succès: ${alert.name}`);
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'envoi de la notification Slack:`, error);
            return false;
        }
    }

    /**
     * Génère le payload pour l'API Slack
     */
    private generateSlackPayload(alert: Alert): any {
        // Si un template est spécifié, l'utiliser avec la syntaxe Slack
        if (this.config.template) {
            return {
                text: this.config.template
                    .replace(/{{alertName}}/g, alert.name)
                    .replace(/{{alertDescription}}/g, alert.description)
                    .replace(/{{alertSeverity}}/g, alert.severity)
                    .replace(/{{alertSource}}/g, alert.source)
                    .replace(/{{alertValue}}/g, String(alert.value))
                    .replace(/{{alertTime}}/g, alert.createdAt.toLocaleString())
                    .replace(/{{alertId}}/g, alert.id),
                channel: this.config.channel,
                username: this.config.username || 'AlertManager',
                icon_emoji: this.config.iconEmoji,
                icon_url: this.config.iconUrl
            };
        }

        // Générer un message Slack formaté
        const severityEmoji = this.getSeverityEmoji(alert.severity);
        const severityColor = this.getSeverityColor(alert.severity);
        const ruleDetails = `${alert.rule.metric} ${alert.rule.operator} ${alert.rule.threshold}`;

        // Créer des champs pour les détails supplémentaires
        const fields = [
            {
                title: "Source",
                value: alert.source,
                short: true
            },
            {
                title: "Sévérité",
                value: `${severityEmoji} ${alert.severity.toUpperCase()}`,
                short: true
            },
            {
                title: "Règle déclenchée",
                value: ruleDetails,
                short: false
            },
            {
                title: "Valeur actuelle",
                value: String(alert.value),
                short: true
            },
            {
                title: "Date",
                value: alert.createdAt.toLocaleString(),
                short: true
            }
        ];

        // Ajouter des champs pour le contexte si présent
        if (alert.context && Object.keys(alert.context).length > 0) {
            fields.push({
                title: "Informations supplémentaires",
                value: "```" + JSON.stringify(alert.context, null, 2) + "```",
                short: false
            });
        }

        return {
            channel: this.config.channel,
            username: this.config.username || 'AlertManager',
            icon_emoji: this.config.iconEmoji,
            icon_url: this.config.iconUrl,
            attachments: [
                {
                    fallback: `[${alert.severity.toUpperCase()}] Alerte: ${alert.name}`,
                    color: severityColor,
                    pretext: `${severityEmoji} *Nouvelle alerte détectée*`,
                    title: alert.name,
                    title_link: '', // Peut être remplacé par un lien vers un dashboard ou une interface de gestion des alertes
                    text: alert.description,
                    fields: fields,
                    footer: `ID: ${alert.id}`,
                    ts: Math.floor(alert.createdAt.getTime() / 1000)
                }
            ]
        };
    }

    /**
     * Retourne un emoji selon le niveau de sévérité
     */
    private getSeverityEmoji(severity: AlertSeverity): string {
        switch (severity) {
            case AlertSeverity.CRITICAL:
                return ':fire:';
            case AlertSeverity.ERROR:
                return ':x:';
            case AlertSeverity.WARNING:
                return ':warning:';
            case AlertSeverity.INFO:
            default:
                return ':information_source:';
        }
    }

    /**
     * Retourne une couleur pour les attachments Slack selon le niveau de sévérité
     */
    private getSeverityColor(severity: AlertSeverity): string {
        switch (severity) {
            case AlertSeverity.CRITICAL:
                return '#d9534f'; // Rouge
            case AlertSeverity.ERROR:
                return '#d9534f'; // Rouge
            case AlertSeverity.WARNING:
                return '#f0ad4e'; // Jaune
            case AlertSeverity.INFO:
            default:
                return '#5bc0de'; // Bleu
        }
    }
}