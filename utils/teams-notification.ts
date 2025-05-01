import axios from 'axios';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Interface pour les options de notification Teams
interface TeamsNotificationOptions {
  title?: string;
  themeColor?: string; // Couleur du thème pour la carte adaptive
  sections?: {
    title?: string;
    text?: string;
    facts?: {
      name: string;
      value: string;
    }[];
  }[];
  timestamp?: boolean; // Ajouter un timestamp automatiquement
  footer?: string;
  images?: {
    url: string;
    alt?: string;
  }[];
}

/**
 * Envoie une notification à un webhook Microsoft Teams
 * @param message Le message principal à envoyer
 * @param options Options supplémentaires pour la notification
 * @param webhookUrl URL du webhook Teams (optionnel, sinon utilise la variable d'environnement)
 * @returns true si la notification a été envoyée avec succès, false sinon
 */
export async function sendTeamsNotification(
  message: string,
  options: TeamsNotificationOptions = {},
  webhookUrl?: string
): Promise<boolean> {
  // Récupérer l'URL du webhook
  const teamsWebhook = webhookUrl || process.env.TEAMS_WEBHOOK;

  // Si aucune URL de webhook n'est fournie, retourner false
  if (!teamsWebhook) {
    console.warn('⚠️ Aucune URL de webhook Teams configurée. Notification ignorée.');
    return false;
  }

  try {
    // Préparer les facts pour la carte Teams
    const facts = [];
    if (options.sections) {
      for (const section of options.sections) {
        if (section.facts) {
          facts.push(...section.facts);
        }
      }
    }

    // Préparer la payload pour Teams (format Carte Adaptative)
    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: options.themeColor || '0076D7', // Bleu par défaut
      summary: options.title || 'Notification de Migration',
      title: options.title || 'Pipeline de Migration PHP → NestJS + Remix',
      text: message,
      sections: options.sections || [],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Voir le Projet',
          targets: [
            {
              os: 'default',
              uri: 'https:/DoDoDoDoDoDotgithub.com/votre-organisation/votre-projet',
            },
          ],
        },
      ],
    };

    // Ajouter un timestamp si demandé
    if (options.timestamp) {
      if (!payload.sections || payload.sections.length === 0) {
        payload.sections = [{}];
      }

      if (!payload.sections[0].facts) {
        payload.sections[0].facts = [];
      }

      payload.sections[0].facts.push({
        name: 'Horodatage',
        value: new Date().toLocaleString(),
      });
    }

    // Ajouter un footer si demandé
    if (options.footer) {
      if (!payload.sections || payload.sections.length === 0) {
        payload.sections = [{}];
      }

      payload.sections.push({
        text: `<em>${options.footer}</em>`,
      });
    }

    // Envoyer la notification
    const response = await axios.post(teamsWebhook, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Vérifier si la notification a été envoyée avec succès
    if (response.status === 200) {
      console.log('✅ Notification Teams envoyée avec succès.');
      return true;
    }
    console.error(
      `❌ Erreur lors de l'envoi de la notification Teams: ${response.status} ${response.statusText}`
    );
    return false;
  } catch (error) {
    console.error("❌ Exception lors de l'envoi de la notification Teams:", error);
    return false;
  }
}

/**
 * Envoie une notification de début de migration
 */
export async function sendTeamsMigrationStartNotification(
  sourceDir: string,
  mode: string,
  webhookUrl?: string
): Promise<boolean> {
  return sendTeamsNotification(
    '🚀 Démarrage de la migration PHP → NestJS + Remix',
    {
      title: 'Migration Démarrée',
      themeColor: '2EB886', // Vert
      sections: [
        {
          facts: [
            {
              name: 'Répertoire Source',
              value: sourceDir,
            },
            {
              name: 'Mode',
              value: mode,
            },
            {
              name: 'État',
              value: 'En cours',
            },
          ],
        },
      ],
      timestamp: true,
    },
    webhookUrl
  );
}

/**
 * Envoie une notification de progression de migration
 */
export async function sendTeamsMigrationProgressNotification(
  sourceDir: string,
  progress: number, // 0-100
  stats: {
    filesProcessed: number;
    totalFiles: number;
    filesSucceeded: number;
    filesFailed: number;
  },
  webhookUrl?: string
): Promise<boolean> {
  // Créer une barre de progression visuelle
  const progressBar = createProgressBar(progress);

  return sendTeamsNotification(
    `⏳ Migration en cours: ${progress.toFixed(1)}% terminée`,
    {
      title: 'Progression de la Migration',
      themeColor: 'FFC107', // Jaune
      sections: [
        {
          facts: [
            {
              name: 'Répertoire Source',
              value: sourceDir,
            },
            {
              name: 'Progression',
              value: progressBar,
            },
            {
              name: 'Fichiers Traités',
              value: `${stats.filesProcessed}/${stats.totalFiles}`,
            },
            {
              name: 'Succès',
              value: `${stats.filesSucceeded}`,
            },
            {
              name: 'Échecs',
              value: `${stats.filesFailed}`,
            },
          ],
        },
      ],
      timestamp: true,
    },
    webhookUrl
  );
}

/**
 * Envoie une notification de fin de migration
 */
export async function sendTeamsMigrationCompleteNotification(
  sourceDir: string,
  targetDir: string,
  success: boolean,
  stats: {
    duration: number; // en secondes
    filesProcessed: number;
    totalFiles: number;
    filesSucceeded: number;
    filesFailed: number;
  },
  webhookUrl?: string
): Promise<boolean> {
  // Formater la durée
  const duration = formatDuration(stats.duration);

  return sendTeamsNotification(
    success
      ? `✅ Migration terminée avec succès en ${duration}`
      : `⚠️ Migration terminée avec des problèmes en ${duration}`,
    {
      title: success ? 'Migration Réussie' : 'Migration Terminée avec Avertissements',
      themeColor: success ? '2EB886' : 'FFC107', // Vert ou Orange
      sections: [
        {
          facts: [
            {
              name: 'Répertoire Source',
              value: sourceDir,
            },
            {
              name: 'Répertoire Cible',
              value: targetDir,
            },
            {
              name: 'Durée',
              value: duration,
            },
            {
              name: 'Fichiers Traités',
              value: `${stats.filesProcessed}/${stats.totalFiles}`,
            },
            {
              name: 'Succès',
              value: `${stats.filesSucceeded}`,
            },
            {
              name: 'Échecs',
              value: `${stats.filesFailed}`,
            },
            {
              name: 'Taux de Réussite',
              value: `${((stats.filesSucceeded / stats.totalFiles) * 100).toFixed(1)}%`,
            },
          ],
        },
      ],
      timestamp: true,
    },
    webhookUrl
  );
}

/**
 * Envoie une notification d'erreur de migration
 */
export async function sendTeamsMigrationErrorNotification(
  sourceDir: string,
  error: string,
  webhookUrl?: string
): Promise<boolean> {
  return sendTeamsNotification(
    '❌ Erreur lors de la migration PHP → NestJS + Remix',
    {
      title: 'Erreur de Migration',
      themeColor: 'E81123', // Rouge
      sections: [
        {
          facts: [
            {
              name: 'Répertoire Source',
              value: sourceDir,
            },
            {
              name: 'Erreur',
              value: error,
            },
          ],
        },
      ],
      timestamp: true,
    },
    webhookUrl
  );
}

/**
 * Fonction d'alerte de désynchronisation pour Teams
 */
export async function sendTeamsDesyncAlert(
  message: string,
  details: {
    entityType: string;
    entityId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    target: string;
    timestamp?: Date;
    differences?: Array<{ field: string; sourceValue: any; targetValue: any }>;
  },
  webhookUrl?: string
): Promise<boolean> {
  // Déterminer la couleur en fonction de la sévérité
  let themeColor = '0076D7'; // Bleu par défaut
  switch (details.severity) {
    case 'low':
      themeColor = '2EB886'; // Vert
      break;
    case 'medium':
      themeColor = 'FFC107'; // Jaune
      break;
    case 'high':
      themeColor = 'FF9800'; // Orange
      break;
    case 'critical':
      themeColor = 'E81123'; // Rouge
      break;
  }

  // Préparer les facts avec les différences
  const facts = [
    {
      name: "Type d'entité",
      value: details.entityType,
    },
    {
      name: "ID de l'entité",
      value: details.entityId,
    },
    {
      name: 'Sévérité',
      value: `${getSeverityEmoji(details.severity)} ${
        details.severity.charAt(0).toUpperCase() + details.severity.slice(1)
      }`,
    },
    {
      name: 'Source',
      value: details.source,
    },
    {
      name: 'Cible',
      value: details.target,
    },
  ];

  // Ajouter les différences si elles existent
  let differencesText = '';
  if (details.differences && details.differences.length > 0) {
    differencesText = '**Différences détectées:**\n\n';
    details.differences.forEach((diff) => {
      differencesText += `- **${diff.field}**: '${diff.sourceValue}' → '${diff.targetValue}'\n`;
    });
  }

  return sendTeamsNotification(
    `🚨 ${message}`,
    {
      title: 'Alerte de Désynchronisation Détectée',
      themeColor: themeColor,
      sections: [
        {
          facts: facts,
        },
        {
          text: differencesText,
        },
      ],
      timestamp: true,
      footer: 'Alerte générée automatiquement par le système de surveillance de désynchronisation',
    },
    webhookUrl
  );
}

/**
 * Fonctions utilitaires
 */

// Crée une barre de progression visuelle pour Teams
function createProgressBar(progress: number): string {
  const filledBar = '█';
  const emptyBar = '░';
  const barLength = 20;

  const filledLength = Math.floor((progress / 100) * barLength);
  const emptyLength = barLength - filledLength;

  return `${filledBar.repeat(filledLength)}${
    emptyLength > 0 ? emptyBar.repeat(emptyLength) : ''
  } ${progress.toFixed(1)}%`;
}

// Formate une durée en secondes en format lisible
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconde${seconds !== 1 ? 's' : ''}`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds.toFixed(0)} seconde${
      remainingSeconds !== 1 ? 's' : ''
    }`;
  }

  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours} heure${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${
    remainingMinutes !== 1 ? 's' : ''
  }`;
}

// Renvoie un emoji représentant le niveau de sévérité
function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🟠';
    case 'critical':
      return '🔴';
    default:
      return '⚪';
  }
}

// Pour tester l'envoi de notification si ce script est exécuté directement
if (require.main === module) {
  (async () => {
    // Tester la notification
    const success = await sendTeamsNotification(
      'Ceci est un test de notification Teams depuis le pipeline de migration',
      {
        title: 'Test de Notification Teams',
        themeColor: '0076D7',
        sections: [
          {
            facts: [
              {
                name: 'Test',
                value: 'Valeur de test',
              },
            ],
          },
        ],
        timestamp: true,
      }
    );

    if (success) {
      console.log('✅ Test de notification Teams envoyé avec succès');
    } else {
      console.error('❌ Échec du test de notification Teams');
    }
  })();
}
