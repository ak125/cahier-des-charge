import { runCITester } from '@fafaDoDotmcp-agents-ci-tester';

// Route pour déclencher la génération CI
app.post('/api/ci/generate', async (req, res) => {
  const result = await runCITester({
    outputPath: req.body.outputPath,
    localTest: req.body.runLocalTests,
  });

  return res.json({ success: true, result });
});
import axios from 'axios';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

/**
 * Interface pour les options de notification Discord
 */
interface DiscordNotificationOptions {
  username?: string; // Nom d'utilisateur du webhook
  avatar_url?: string; // URL de l'avatar
  tts?: boolean; // Text-to-speech
  embeds?: DiscordEmbed[]; // Embeds Discord
  components?: any[]; // Composants interactifs
  allowedMentions?: {
    // Mentions autorisées
    parse?: string[];
    users?: string[];
    roles?: string[];
  };
}

/**
 * Interface pour les embeds Discord
 */
interface DiscordEmbed {
  title?: string; // Titre de l'embed
  description?: string; // Description de l'embed
  url?: string; // URL du titre
  timestamp?: string; // Timestamp ISO8601
  color?: number; // Couleur (entier)
  footer?: {
    // Pied de page
    text: string;
    icon_url?: string;
  };
  image?: {
    // Image
    url: string;
  };
  thumbnail?: {
    // Miniature
    url: string;
  };
  author?: {
    // Auteur
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: {
    // Champs
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

/**
 * Couleurs prédéfinies pour les différents niveaux de sévérité
 */
export enum DiscordColors {
  DEFAULT = 0x000000, // Noir
  SUCCESS = 0x57f287, // Vert
  INFO = 0x3498db, // Bleu
  WARNING = 0xfee75c, // Jaune
  ERROR = 0xed4245, // Rouge
  CRITICAL = 0x9b59b6, // Violet
}

/**
 * Envoie une notification à un webhook Discord
 * @param message Le message principal à envoyer
 * @param options Options supplémentaires pour la notification
 * @param webhookUrl URL du webhook Discord (optionnel, sinon utilise la variable d'environnement)
 * @returns true si la notification a été envoyée avec succès, false sinon
 */
export async function sendDiscordNotification(
  message: string,
  options: DiscordNotificationOptions = {},
  webhookUrl?: string
): Promise<boolean> {
  // Récupérer l'URL du webhook
  const discordWebhook = webhookUrl || process.env.DISCORD_WEBHOOK;

  // Si aucune URL de webhook n'est fournie, retourner false
  if (!discordWebhook) {
    console.warn('⚠️ Aucune URL de webhook Discord configurée. Notification ignorée.');
    return false;
  }

  try {
    // Préparer la payload pour Discord
    const payload = {
      content: message,
      username: options.username || 'Notification Bot',
      avatar_url: options.avatar_url,
      tts: options.tts || false,
      embeds: options.embeds || [],
      components: options.components || [],
      allowed_mentions: options.allowedMentions,
    };

    // Envoyer la notification
    const response = await axios.post(discordWebhook, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Vérifier si la notification a été envoyée avec succès
    if (response.status === 204) {
      console.log('✅ Notification Discord envoyée avec succès.');
      return true;
    }
    console.error(
      `❌ Erreur lors de l'envoi de la notification Discord: ${response.status} ${response.statusText}`
    );
    return false;
  } catch (error) {
    console.error("❌ Exception lors de l'envoi de la notification Discord:", error);
    return false;
  }
}

/**
 * Crée un embed Discord formaté
 * @param title Titre de l'embed
 * @param description Description de l'embed
 * @param color Couleur de l'embed
 * @param fields Champs de l'embed
 * @param footerText Texte du pied de page
 * @param includeTimestamp Inclure un timestamp automatiquement
 * @returns Un objet embed Discord formaté
 */
export function createDiscordEmbed(
  title?: string,
  description?: string,
  color: number = DiscordColors.INFO,
  fields?: Array<{ name: string; value: string; inline?: boolean }>,
  footerText?: string,
  includeTimestamp = false
): DiscordEmbed {
  const embed: DiscordEmbed = {
    color,
  };

  if (title) embed.title = title;
  if (description) embed.description = description;
  if (fields) embed.fields = fields;
  if (footerText) embed.footer = { text: footerText };
  if (includeTimestamp) embed.timestamp = new Date().toISOString();

  return embed;
}

/**
 * Envoie une notification d'erreur
 * @param title Titre de l'erreur
 * @param description Description de l'erreur
 * @param details Détails supplémentaires (optionnel)
 * @param webhookUrl URL du webhook Discord (optionnel)
 * @returns true si la notification a été envoyée avec succès, false sinon
 */
export async function sendErrorNotification(
  title: string,
  description: string,
  details?: Record<string, string>,
  webhookUrl?: string
): Promise<boolean> {
  const fields = details
    ? Object.entries(details).map(([name, value]) => ({
        name,
        value,
        inline: true,
      }))
    : [];

  const embed = createDiscordEmbed(
    `❌ ${title}`,
    description,
    DiscordColors.ERROR,
    fields,
    "Notification d'erreur automatique",
    true
  );

  return sendDiscordNotification(
    '', // Pas de contenu principal, tout est dans l'embed
    {
      username: 'Error Reporter',
      embeds: [embed],
    },
    webhookUrl
  );
}

/**
 * Envoie une notification de succès
 * @param title Titre du succès
 * @param description Description du succès
 * @param details Détails supplémentaires (optionnel)
 * @param webhookUrl URL du webhook Discord (optionnel)
 * @returns true si la notification a été envoyée avec succès, false sinon
 */
export async function sendSuccessNotification(
  title: string,
  description: string,
  details?: Record<string, string>,
  webhookUrl?: string
): Promise<boolean> {
  const fields = details
    ? Object.entries(details).map(([name, value]) => ({
        name,
        value,
        inline: true,
      }))
    : [];

  const embed = createDiscordEmbed(
    `✅ ${title}`,
    description,
    DiscordColors.SUCCESS,
    fields,
    'Notification de succès automatique',
    true
  );

  return sendDiscordNotification(
    '', // Pas de contenu principal, tout est dans l'embed
    {
      username: 'Success Reporter',
      embeds: [embed],
    },
    webhookUrl
  );
}

/**
 * Envoie une notification d'alerte
 * @param title Titre de l'alerte
 * @param description Description de l'alerte
 * @param severity Niveau de sévérité ('info', 'warning', 'error', 'critical')
 * @param details Détails supplémentaires (optionnel)
 * @param webhookUrl URL du webhook Discord (optionnel)
 * @returns true si la notification a été envoyée avec succès, false sinon
 */
export async function sendAlertNotification(
  title: string,
  description: string,
  severity: 'info' | 'warning' | 'error' | 'critical',
  details?: Record<string, string>,
  webhookUrl?: string
): Promise<boolean> {
  // Choisir la couleur en fonction de la sévérité
  let color: number;
  let emoji: string;

  switch (severity) {
    case 'info':
      color = DiscordColors.INFO;
      emoji = 'ℹ️';
      break;
    case 'warning':
      color = DiscordColors.WARNING;
      emoji = '⚠️';
      break;
    case 'error':
      color = DiscordColors.ERROR;
      emoji = '❌';
      break;
    case 'critical':
      color = DiscordColors.CRITICAL;
      emoji = '🚨';
      break;
    default:
      color = DiscordColors.INFO;
      emoji = 'ℹ️';
  }

  const fields = details
    ? Object.entries(details).map(([name, value]) => ({
        name,
        value,
        inline: true,
      }))
    : [];

  const embed = createDiscordEmbed(
    `${emoji} ${title}`,
    description,
    color,
    fields,
    `Niveau de sévérité: ${severity.toUpperCase()}`,
    true
  );

  return sendDiscordNotification(
    '', // Pas de contenu principal, tout est dans l'embed
    {
      username: 'Alert System',
      embeds: [embed],
    },
    webhookUrl
  );
}

/**
 * Envoie une notification de progression
 * @param title Titre de la progression
 * @param description Description de la progression
 * @param progress Pourcentage de progression (0-100)
 * @param stats Statistiques supplémentaires (optionnel)
 * @param webhookUrl URL du webhook Discord (optionnel)
 * @returns true si la notification a été envoyée avec succès, false sinon
 */
export async function sendProgressNotification(
  title: string,
  description: string,
  progress: number,
  stats?: Record<string, string | number>,
  webhookUrl?: string
): Promise<boolean> {
  // Créer une barre de progression visuelle
  const progressBar = createProgressBar(progress);

  // Préparer les champs
  const fields = [
    {
      name: 'Progression',
      value: progressBar,
      inline: false,
    },
  ];

  // Ajouter les statistiques si elles existent
  if (stats) {
    for (const [key, value] of Object.entries(stats)) {
      fields.push({
        name: key,
        value: String(value),
        inline: true,
      });
    }
  }

  const embed = createDiscordEmbed(
    title,
    description,
    DiscordColors.INFO,
    fields,
    'Notification de progression',
    true
  );

  return sendDiscordNotification(
    '', // Pas de contenu principal, tout est dans l'embed
    {
      username: 'Progress Tracker',
      embeds: [embed],
    },
    webhookUrl
  );
}

/**
 * Crée une barre de progression visuelle pour Discord
 * @param progress Pourcentage de progression (0-100)
 * @returns Une chaîne représentant une barre de progression
 */
function createProgressBar(progress: number): string {
  const filledBar = '█';
  const emptyBar = '░';
  const barLength = 20;

  // S'assurer que la progression est entre 0 et 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const filledLength = Math.round((clampedProgress / 100) * barLength);
  const emptyLength = barLength - filledLength;

  return `${filledBar.repeat(filledLength)}${emptyBar.repeat(
    emptyLength
  )} ${clampedProgress.toFixed(1)}%`;
}

// Pour tester l'envoi de notification si ce script est exécuté directement
if (require.main === module) {
  (async () => {
    // Tester la notification
    const success = await sendDiscordNotification(
      'Ceci est un test de notification Discord depuis le pipeline de migration',
      {
        username: 'Test Bot',
        embeds: [
          createDiscordEmbed(
            'Test de Notification Discord',
            'Cet embed est un test pour vérifier que les notifications Discord fonctionnent correctement.',
            DiscordColors.INFO,
            [
              {
                name: 'Test',
                value: 'Valeur de test',
                inline: true,
              },
            ],
            'Ceci est un test',
            true
          ),
        ],
      }
    );

    if (success) {
      console.log('✅ Test de notification Discord envoyé avec succès');
    } else {
      console.error('❌ Échec du test de notification Discord');
    }
  })();
}
