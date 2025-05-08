/**
 * Service de notification Discord
 */
import axios from 'axios';
import {
    Alert,
    DiscordConfig,
    NotificationService,
    AlertSeverity
} from '../interfaces/alert-types';

/**
 * Service responsable de l'envoi de notifications via Discord
 */
export class DiscordNotificationService implements NotificationService {
    private config: DiscordConfig;

    /**
     * Couleurs par défaut pour les embeds Discord par niveau de sévérité
     * Les couleurs sont au format décimal pour les embeds Discord
     */
    private defaultColors = {
        info: 3447003,      // Bleu
        warning: 16763904,  // Jaune
        error: 15158332,    // Rouge
        critical: 10038562  // Rouge foncé
    };

    /**
     * Crée une nouvelle instance du service de notification Discord
     * @param config Configuration Discord
     */
    constructor(config: DiscordConfig) {
        this.config = config;
    }

    /**
     * Vérifie si le service est configuré correctement
     */
    public isConfigured(): boolean {
        return !!this.config && !!this.config.webhookUrl;
    }

    /**
     * Envoie une notification via Discord
     * @param alert L'alerte à envoyer
     */
    public async send(alert: Alert): Promise<boolean> {
        if (!this.isConfigured()) {
            console.error('Le service de notification Discord n\'est pas configuré correctement');
            return false;
        }

        try {
            const payload = this.generateDiscordPayload(alert);

            await axios.post(this.config.webhookUrl, payload);

            console.log(`Notification Discord envoyée avec succès: ${alert.name}`);
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'envoi de la notification Discord:`, error);
            return false;
        }
    }

    /**
     * Génère le payload pour l'API Discord
     */
    private generateDiscordPayload(alert: Alert): any {
        // Si un template est spécifié, l'utiliser avec la syntaxe Discord
        if (this.config.template) {
            return {
                content: this.config.template
                    .replace(/{{alertName}}/g, alert.name)
                    .replace(/{{alertDescription}}/g, alert.description)
                    .replace(/{{alertSeverity}}/g, alert.severity)
                    .replace(/{{alertSource}}/g, alert.source)
                    .replace(/{{alertValue}}/g, String(alert.value))
                    .replace(/{{alertTime}}/g, alert.createdAt.toLocaleString())
                    .replace(/{{alertId}}/g, alert.id),
                username: this.config.username || 'AlertManager',
                avatar_url: this.config.avatarUrl
            };
        }

        // Obtenir la couleur pour l'embed selon la sévérité
        const colors = this.config.embedColor || this.defaultColors;
        const color = colors[alert.severity] || this.defaultColors.info;
        const severityEmoji = this.getSeverityEmoji(alert.severity);
        const ruleDetails = `${alert.rule.metric} ${alert.rule.operator} ${alert.rule.threshold}`;

        // Créer des champs pour les détails
        const fields = [
            {
                name: "Source",
                value: alert.source,
                inline: true
            },
            {
                name: "Sévérité",
                value: `${severityEmoji} ${alert.severity.toUpperCase()}`,
                inline: true
            },
            {
                name: "Règle déclenchée",
                value: ruleDetails,
                inline: false
            },
            {
                name: "Valeur actuelle",
                value: String(alert.value),
                inline: true
            },
            {
                name: "Date",
                value: alert.createdAt.toLocaleString(),
                inline: true
            }
        ];

        // Ajouter des champs pour le contexte si présent
        if (alert.context && Object.keys(alert.context).length > 0) {
            fields.push({
                name: "Informations supplémentaires",
                value: "```json\n" + JSON.stringify(alert.context, null, 2) + "\n```",
                inline: false
            });
        }

        return {
            username: this.config.username || 'AlertManager',
            avatar_url: this.config.avatarUrl,
            content: `${severityEmoji} **Nouvelle alerte détectée**`,
            embeds: [
                {
                    title: alert.name,
                    description: alert.description,
                    color: color,
                    fields: fields,
                    footer: {
                        text: `ID: ${alert.id}`
                    },
                    timestamp: alert.createdAt.toISOString()
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
}