import axios from 'axios';
import type { QualityAlert } from '../components/quality-alert-notification';

/**
 * Service de notification pour envoyer des alertes de qualité vers des canaux externes
 * comme Slack et Microsoft Teams
 */
export class NotificationService {
  private config: {
    slack?: {
      webhookUrl: string;
      channel?: string;
      username?: string;
    };
    teams?: {
      webhookUrl: string;
    };
    email?: {
      recipients: string[];
      smtpConfig: {
        host: string;
        port: number;
        secure: boolean;
        auth?: {
          user: string;
          pass: string;
        };
      };
    };
  };

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Envoie une alerte vers tous les canaux configurés
   */
  async sendAlert(alert: QualityAlert): Promise<boolean> {
    const promises: Promise<boolean>[] = [];

    if (this.config.slack?.webhookUrl) {
      promises.push(this.sendToSlack(alert));
    }

    if (this.config.teams?.webhookUrl) {
      promises.push(this.sendToTeams(alert));
    }

    if (this.config.email?.recipients.length > 0) {
      promises.push(this.sendEmail(alert));
    }

    // Si aucun canal n'est configuré, on considère que c'est réussi
    if (promises.length === 0) {
      return true;
    }

    // On attend que tous les envois soient terminés
    const results = await Promise.all(promises);
    // Si au moins un envoi a réussi, on considère que c'est réussi
    return results.some((result) => result);
  }

  /**
   * Envoie plusieurs alertes, avec un regroupement si possible
   */
  async sendAlerts(alerts: QualityAlert[]): Promise<boolean> {
    // Si on a une seule alerte, on utilise la méthode simple
    if (alerts.length === 1) {
      return this.sendAlert(alerts[0]);
    }

    const promises: Promise<boolean>[] = [];

    if (this.config.slack?.webhookUrl) {
      promises.push(this.sendMultipleToSlack(alerts));
    }

    if (this.config.teams?.webhookUrl) {
      promises.push(this.sendMultipleToTeams(alerts));
    }

    if (this.config.email?.recipients.length > 0) {
      promises.push(this.sendMultipleEmails(alerts));
    }

    // Si aucun canal n'est configuré, on considère que c'est réussi
    if (promises.length === 0) {
      return true;
    }

    // On attend que tous les envois soient terminés
    const results = await Promise.all(promises);
    // Si au moins un envoi a réussi, on considère que c'est réussi
    return results.some((result) => result);
  }

  /**
   * Envoie une alerte vers Slack
   */
  private async sendToSlack(alert: QualityAlert): Promise<boolean> {
    try {
      const color = alert.type === 'degradation' ? '#FF5252' : '#4CAF50';
      const emoji = alert.type === 'degradation' ? ':warning:' : ':chart_with_upwards_trend:';

      const payload = {
        channel: this.config.slack.channel,
        username: this.config.slack.username || 'Quality Analyzer Bot',
        icon_emoji: ':bar_chart:',
        attachments: [
          {
            color,
            pretext: `${emoji} *Alerte de qualité*`,
            title: alert.message,
            fields: [
              {
                title: 'Catégorie',
                value: this.formatCategory(alert.category),
                short: true,
              },
              {
                title: 'Type',
                value: alert.type === 'degradation' ? 'Dégradation' : 'Amélioration',
                short: true,
              },
            ],
            footer: `Détecté le ${new Date(alert.timestamp).toLocaleString()}`,
          },
        ],
      };

      // Ajout des valeurs précédentes et actuelles si disponibles
      if (alert.previousValue !== undefined && alert.currentValue !== undefined) {
        payload.attachments[0].fields.push({
          title: 'Avant',
          value: `${alert.previousValue}/100`,
          short: true,
        });
        payload.attachments[0].fields.push({
          title: 'Après',
          value: `${alert.currentValue}/100`,
          short: true,
        });
      }

      // Ajout du fichier concerné si disponible
      if (alert.file) {
        payload.attachments[0].fields.push({
          title: 'Fichier',
          value: alert.file,
        });
      }

      await axios.post(this.config.slack.webhookUrl, payload);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'alerte vers Slack:", error);
      return false;
    }
  }

  /**
   * Envoie une alerte vers Microsoft Teams
   */
  private async sendToTeams(alert: QualityAlert): Promise<boolean> {
    try {
      const color = alert.type === 'degradation' ? 'FF5252' : '4CAF50';
      const emoji = alert.type === 'degradation' ? '⚠️' : '📈';

      const facts = [
        {
          name: 'Catégorie',
          value: this.formatCategory(alert.category),
        },
        {
          name: 'Type',
          value: alert.type === 'degradation' ? 'Dégradation' : 'Amélioration',
        },
      ];

      // Ajout des valeurs précédentes et actuelles si disponibles
      if (alert.previousValue !== undefined && alert.currentValue !== undefined) {
        facts.push({
          name: 'Avant',
          value: `${alert.previousValue}/100`,
        });
        facts.push({
          name: 'Après',
          value: `${alert.currentValue}/100`,
        });
      }

      // Ajout du fichier concerné si disponible
      if (alert.file) {
        facts.push({
          name: 'Fichier',
          value: alert.file,
        });
      }

      const payload = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: color,
        summary: `Alerte de qualité: ${alert.message}`,
        sections: [
          {
            activityTitle: `${emoji} Alerte de qualité`,
            activitySubtitle: alert.message,
            facts: facts,
            markdown: true,
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'Voir le tableau de bord',
            targets: [
              {
                os: 'default',
                uri: 'https://example.com/dashboard/quality',
              },
            ],
          },
        ],
      };

      await axios.post(this.config.teams.webhookUrl, payload);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'alerte vers Microsoft Teams:", error);
      return false;
    }
  }

  /**
   * Envoie un email avec l'alerte
   */
  private async sendEmail(_alert: QualityAlert): Promise<boolean> {
    try {
      // Utilisation de la bibliothèque nodemailer (à installer)
      // Cette implémentation est simplifiée, à adapter selon vos besoins
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return false;
    }
  }

  /**
   * Envoie plusieurs alertes vers Slack
   */
  private async sendMultipleToSlack(alerts: QualityAlert[]): Promise<boolean> {
    try {
      // Compteurs pour le résumé
      const degradations = alerts.filter((a) => a.type === 'degradation').length;
      const improvements = alerts.filter((a) => a.type === 'improvement').length;

      const payload = {
        channel: this.config.slack.channel,
        username: this.config.slack.username || 'Quality Analyzer Bot',
        icon_emoji: ':bar_chart:',
        text: `*Récapitulatif des alertes de qualité* (${alerts.length} au total)`,
        attachments: [
          {
            color: degradations > 0 ? '#FF5252' : '#4CAF50',
            fields: [
              {
                title: 'Dégradations',
                value: degradations,
                short: true,
              },
              {
                title: 'Améliorations',
                value: improvements,
                short: true,
              },
            ],
          },
        ],
      };

      // Ajouter les 5 alertes les plus critiques (dégradations d'abord)
      const sortedAlerts = [...alerts].sort((a, b) => {
        if (a.type === 'degradation' && b.type !== 'degradation') return -1;
        if (a.type !== 'degradation' && b.type === 'degradation') return 1;
        return 0;
      });

      sortedAlerts.slice(0, 5).forEach((alert) => {
        const color = alert.type === 'degradation' ? '#FF5252' : '#4CAF50';
        const emoji = alert.type === 'degradation' ? ':warning:' : ':chart_with_upwards_trend:';

        payload.attachments.push({
          color,
          text: `${emoji} *${alert.message}*\n_Catégorie: ${this.formatCategory(alert.category)}_`,
          footer: `Détecté le ${new Date(alert.timestamp).toLocaleString()}`,
        });
      });

      // Ajouter un lien vers le tableau de bord pour voir toutes les alertes
      if (alerts.length > 5) {
        payload.attachments.push({
          color: '#BBBBBB',
          text: `<https://example.com/dashboard/quality|Voir les ${
            alerts.length - 5
          } autres alertes sur le tableau de bord>`,
        });
      }

      await axios.post(this.config.slack.webhookUrl, payload);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi des alertes vers Slack:", error);
      return false;
    }
  }

  /**
   * Envoie plusieurs alertes vers Microsoft Teams
   */
  private async sendMultipleToTeams(alerts: QualityAlert[]): Promise<boolean> {
    try {
      // Compteurs pour le résumé
      const degradations = alerts.filter((a) => a.type === 'degradation').length;
      const improvements = alerts.filter((a) => a.type === 'improvement').length;

      const payload = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: degradations > 0 ? 'FF5252' : '4CAF50',
        summary: `Récapitulatif des alertes de qualité (${alerts.length} au total)`,
        sections: [
          {
            activityTitle: '📊 Récapitulatif des alertes de qualité',
            facts: [
              {
                name: "Nombre d'alertes",
                value: alerts.length.toString(),
              },
              {
                name: 'Dégradations',
                value: degradations.toString(),
              },
              {
                name: 'Améliorations',
                value: improvements.toString(),
              },
            ],
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'Voir le tableau de bord',
            targets: [
              {
                os: 'default',
                uri: 'https://example.com/dashboard/quality',
              },
            ],
          },
        ],
      };

      // Ajouter les 5 alertes les plus critiques
      const sortedAlerts = [...alerts].sort((a, b) => {
        if (a.type === 'degradation' && b.type !== 'degradation') return -1;
        if (a.type !== 'degradation' && b.type === 'degradation') return 1;
        return 0;
      });

      if (sortedAlerts.length > 0) {
        const alertsSection = {
          title: 'Alertes principales',
          text: sortedAlerts
            .slice(0, 5)
            .map((alert) => {
              const emoji = alert.type === 'degradation' ? '⚠️' : '📈';
              return `**${emoji} ${alert.message}**  \n_Catégorie: ${this.formatCategory(
                alert.category
              )}_  \n`;
            })
            .join('\n\n'),
        };
        payload.sections.push(alertsSection);
      }

      await axios.post(this.config.teams.webhookUrl, payload);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi des alertes vers Microsoft Teams:", error);
      return false;
    }
  }

  /**
   * Envoie plusieurs alertes par email
   */
  private async sendMultipleEmails(_alerts: QualityAlert[]): Promise<boolean> {
    try {
      // Utilisation de la bibliothèque nodemailer (à installer)
      // Cette implémentation est simplifiée, à adapter selon vos besoins
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi des emails:", error);
      return false;
    }
  }

  /**
   * Formate le nom de la catégorie pour affichage
   */
  private formatCategory(category: string): string {
    switch (category) {
      case 'seo':
        return 'SEO';
      case 'performance':
        return 'Performance';
      case 'accessibility':
        return 'Accessibilité';
      case 'bestPractices':
        return 'Meilleures pratiques';
      case 'usability':
        return 'Utilisabilité';
      case 'ux':
        return 'Expérience utilisateur';
      case 'file':
        return 'Fichier';
      default:
        return category;
    }
  }
}

export default NotificationService;
