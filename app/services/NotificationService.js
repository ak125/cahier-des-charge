/**
 * Service de notification
 *
 * Ce service gère l'envoi de notifications vers différentes plateformes:
 * - Slack
 * - Microsoft Teams
 * - Email (optionnel)
 */

const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class NotificationService {
  /**
   * Constructeur du service de notification
   * @param {Object} config Configuration du service
   * @param {Object} config.slack Configuration Slack
   * @param {string} config.slack.webhookUrl URL du webhook Slack
   * @param {Object} config.teams Configuration Microsoft Teams
   * @param {string} config.teams.webhookUrl URL du webhook Teams
   * @param {Object} config.email Configuration email (optionnelle)
   */
  constructor(config) {
    this.config = config || {};

    // Configurer le dossier pour les logs
    this.logDir = path.resolve('./logs/notifications');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Initialiser les transports si la configuration est fournie
    if (this.config.email?.host && this.config.email.user) {
      this.emailTransport = nodemailer.createTransport({
        host: this.config.email.host,
        port: this.config.email.port || 587,
        secure: this.config.email.secure || false,
        auth: {
          user: this.config.email.user,
          pass: this.config.email.password,
        },
      });
    }

    this.log('Service de notification initialisé');
  }

  /**
   * Envoie une alerte à tous les canaux configurés
   * @param {Array|Object} alerts Une alerte ou un tableau d'alertes à envoyer
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async sendAlerts(alerts) {
    if (!alerts) return false;

    // Convertir en tableau si ce n'est pas déjà le cas
    const alertsArray = Array.isArray(alerts) ? alerts : [alerts];
    if (alertsArray.length === 0) return true;

    try {
      const results = [];

      // Envoyer à Slack si configuré
      if (this.config.slack?.webhookUrl) {
        const slackResult = await this.sendToSlack(alertsArray);
        results.push(slackResult);
      }

      // Envoyer à Microsoft Teams si configuré
      if (this.config.teams?.webhookUrl) {
        const teamsResult = await this.sendToTeams(alertsArray);
        results.push(teamsResult);
      }

      // Envoyer par email si configuré
      if (this.config.email && this.emailTransport) {
        const emailResult = await this.sendToEmail(alertsArray);
        results.push(emailResult);
      }

      // Considérer comme réussi si au moins un canal a fonctionné
      const success = results.some((r) => r === true);
      this.log(`Envoi des alertes ${success ? 'réussi' : 'échoué'}`);
      return success;
    } catch (error) {
      this.log(`Erreur lors de l'envoi des alertes: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Envoie des alertes à Slack
   * @param {Array} alerts Tableau d'alertes à envoyer
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async sendToSlack(alerts) {
    try {
      if (!this.config.slack || !this.config.slack.webhookUrl) {
        return false;
      }

      // Grouper les alertes par type (dégradation/amélioration)
      const degradations = alerts.filter((a) => a.type === 'degradation');
      const improvements = alerts.filter((a) => a.type === 'improvement');

      // Préparer les données pour Slack
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `Rapport de qualité: ${new Date().toLocaleDateString()}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alerts.length} changement(s) de qualité détecté(s)*\n${degradations.length} dégradations, ${improvements.length} améliorations`,
          },
        },
        {
          type: 'divider',
        },
      ];

      // Ajouter les dégradations les plus importantes (max 5)
      if (degradations.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Dégradations principales:*',
          },
        });

        // Trier par impact (différence de score)
        const sortedDegradations = degradations
          .sort((a, b) => a.previousValue - a.currentValue - (b.previousValue - b.currentValue))
          .slice(0, 5);

        sortedDegradations.forEach((alert) => {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `• *${alert.category.toUpperCase()}*: ${
                alert.message
              }\n  _Score: ${alert.previousValue.toFixed(1)} → ${alert.currentValue.toFixed(1)}_`,
            },
          });
        });
      }

      // Ajouter un message global en fonction des résultats
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            degradations.length > improvements.length
              ? 'Une attention particulière est requise pour améliorer la qualité.'
              : "La qualité s'est globalement améliorée, mais restons vigilants.",
        },
      });

      // Ajouter un lien vers le tableau de bord
      if (this.config.slack.dashboardUrl) {
        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Voir le tableau de bord',
                emoji: true,
              },
              url: this.config.slack.dashboardUrl,
              style: 'primary',
            },
          ],
        });
      }

      // Envoyer à Slack
      const response = await axios.post(this.config.slack.webhookUrl, {
        blocks,
      });

      const success = response.status === 200;
      this.log(`Envoi Slack ${success ? 'réussi' : 'échoué'}`);
      return success;
    } catch (error) {
      this.log(`Erreur lors de l'envoi à Slack: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Envoie des alertes à Microsoft Teams
   * @param {Array} alerts Tableau d'alertes à envoyer
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async sendToTeams(alerts) {
    try {
      if (!this.config.teams || !this.config.teams.webhookUrl) {
        return false;
      }

      // Grouper les alertes par type (dégradation/amélioration)
      const degradations = alerts.filter((a) => a.type === 'degradation');
      const improvements = alerts.filter((a) => a.type === 'improvement');

      // Déterminer la couleur du message en fonction des résultats
      const themeColor = degradations.length > improvements.length ? '#FF5733' : '#4CAF50';

      // Préparer les sections du message Teams
      const facts = [];

      if (degradations.length > 0) {
        facts.push({
          name: 'Dégradations:',
          value: `${degradations.length} détectée(s)`,
        });
      }

      if (improvements.length > 0) {
        facts.push({
          name: 'Améliorations:',
          value: `${improvements.length} détectée(s)`,
        });
      }

      // Construire le message
      const messageCard = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor,
        summary: `Rapport de qualité: ${alerts.length} changement(s) détecté(s)`,
        sections: [
          {
            activityTitle: `Rapport de qualité: ${new Date().toLocaleDateString()}`,
            activitySubtitle: `${alerts.length} changement(s) de qualité détecté(s)`,
            facts,
          },
        ],
      };

      // Ajouter les dégradations les plus importantes (max 5)
      if (degradations.length > 0) {
        const sortedDegradations = degradations
          .sort((a, b) => a.previousValue - a.currentValue - (b.previousValue - b.currentValue))
          .slice(0, 5);

        const degradationSection = {
          title: 'Dégradations principales:',
          text: sortedDegradations
            .map(
              (alert) =>
                `- **${alert.category.toUpperCase()}**: ${
                  alert.message
                } (Score: ${alert.previousValue.toFixed(1)} → ${alert.currentValue.toFixed(1)})`
            )
            .join('\n\n'),
        };

        messageCard.sections.push(degradationSection);
      }

      // Ajouter un lien vers le tableau de bord si configuré
      if (this.config.teams.dashboardUrl) {
        messageCard.potentialAction = [
          {
            '@type': 'OpenUri',
            name: 'Voir le tableau de bord',
            targets: [
              {
                os: 'default',
                uri: this.config.teams.dashboardUrl,
              },
            ],
          },
        ];
      }

      // Envoyer à Microsoft Teams
      const response = await axios.post(this.config.teams.webhookUrl, messageCard);

      const success = response.status === 200;
      this.log(`Envoi Microsoft Teams ${success ? 'réussi' : 'échoué'}`);
      return success;
    } catch (error) {
      this.log(`Erreur lors de l'envoi à Microsoft Teams: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Envoie des alertes par email
   * @param {Array} alerts Tableau d'alertes à envoyer
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async sendToEmail(alerts) {
    try {
      if (!this.config.email || !this.emailTransport) {
        return false;
      }

      const { from, to, subject } = this.config.email;

      if (!from || !to) {
        this.log('Configuration email incomplète (from/to manquants)', 'error');
        return false;
      }

      // Grouper les alertes par type (dégradation/amélioration)
      const degradations = alerts.filter((a) => a.type === 'degradation');
      const improvements = alerts.filter((a) => a.type === 'improvement');

      // Construire le contenu HTML de l'email
      let htmlContent = `
        <h2>Rapport de qualité: ${new Date().toLocaleDateString()}</h2>
        <p><strong>${alerts.length} changement(s) de qualité détecté(s)</strong></p>
        <ul>
          <li>${degradations.length} dégradation(s)</li>
          <li>${improvements.length} amélioration(s)</li>
        </ul>
        <hr>
      `;

      // Ajouter les dégradations principales
      if (degradations.length > 0) {
        htmlContent += '<h3>Dégradations principales:</h3><ul>';

        const sortedDegradations = degradations
          .sort((a, b) => a.previousValue - a.currentValue - (b.previousValue - b.currentValue))
          .slice(0, 5);

        sortedDegradations.forEach((alert) => {
          htmlContent += `
            <li>
              <strong>${alert.category.toUpperCase()}</strong>: ${alert.message}<br>
              <em>Score: ${alert.previousValue.toFixed(1)} → ${alert.currentValue.toFixed(1)}</em>
            </li>
          `;
        });

        htmlContent += '</ul>';
      }

      // Ajouter les améliorations principales
      if (improvements.length > 0) {
        htmlContent += '<h3>Améliorations principales:</h3><ul>';

        const sortedImprovements = improvements
          .sort((a, b) => b.currentValue - b.previousValue - (a.currentValue - a.previousValue))
          .slice(0, 3);

        sortedImprovements.forEach((alert) => {
          htmlContent += `
            <li>
              <strong>${alert.category.toUpperCase()}</strong>: ${alert.message}<br>
              <em>Score: ${alert.previousValue.toFixed(1)} → ${alert.currentValue.toFixed(1)}</em>
            </li>
          `;
        });

        htmlContent += '</ul>';
      }

      // Ajouter un lien vers le tableau de bord
      if (this.config.email.dashboardUrl) {
        htmlContent += `
          <p>
            <a href="${this.config.email.dashboardUrl}" style="background-color:#4CAF50;color:white;padding:10px 15px;text-decoration:none;border-radius:4px;">
              Voir le tableau de bord
            </a>
          </p>
        `;
      }

      // Envoyer l'email
      const mailOptions = {
        from,
        to,
        subject: subject || 'Rapport de qualité: Changements détectés',
        html: htmlContent,
      };

      const info = await this.emailTransport.sendMail(mailOptions);

      this.log(`Email envoyé: ${info.messageId}`);
      return true;
    } catch (error) {
      this.log(`Erreur lors de l'envoi de l'email: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Enregistre un message dans les logs
   * @param {string} message Message à logger
   * @param {string} level Niveau de log (info, error, warn)
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // Écrire dans le fichier de log
    fs.appendFileSync(
      path.join(this.logDir, `notifications-${new Date().toISOString().split('T')[0]}.log`),
      logLine
    );

    // Afficher en console selon le niveau
    if (level === 'error') {
      console.error(logLine.trim());
    } else if (level === 'warn') {
      console.warn(logLine.trim());
    } else {
      console.log(logLine.trim());
    }
  }
}

module.exports = NotificationService;
