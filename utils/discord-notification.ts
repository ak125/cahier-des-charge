import axios from 'axios';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Interface pour les options de notification
interface NotificationOptions {
  title?: string;
  color?: number; // Couleur hexadécimale pour l'embed Discord
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  timestamp?: boolean; // Ajouter un timestamp automatiquement
  footer?: string;
  thumbnailUrl?: string;
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
  options: NotificationOptions = {},
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
    // Préparer l'embed Discord
    const embed = {
      title: options.title || 'Pipeline de Migration PHP → NestJS + Remix',
      description: message,
      color: options.color || 3447003, // Bleu par défaut
      fields: options.fields || [],
      timestamp: options.timestamp ? new Date().toISOString() : undefined,
      footer: options.footer ? {
        text: options.footer
      } : undefined,
      thumbnail: options.thumbnailUrl ? {
        url: options.thumbnailUrl
      } : undefined
    };
    
    // Préparer la payload pour Discord
    const payload = {
      username: 'Migration Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2166/2166860.png',
      embeds: [embed]
    };
    
    // Envoyer la notification
    const response = await axios.post(discordWebhook, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Vérifier si la notification a été envoyée avec succès
    if (response.status === 204) {
      console.log('✅ Notification Discord envoyée avec succès.');
      return true;
    } else {
      console.error(`❌ Erreur lors de l'envoi de la notification Discord: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Exception lors de l\'envoi de la notification Discord:', error);
    return false;
  }
}

/**
 * Envoie une notification de début de migration
 */
export async function sendMigrationStartNotification(
  sourceDir: string,
  mode: string,
  webhookUrl?: string
): Promise<boolean> {
  return sendDiscordNotification(
    `🚀 Démarrage de la migration PHP → NestJS + Remix`,
    {
      title: 'Migration Démarrée',
      color: 3066993, // Vert
      fields: [
        {
          name: 'Répertoire Source',
          value: sourceDir,
          inline: true
        },
        {
          name: 'Mode',
          value: mode,
          inline: true
        },
        {
          name: 'État',
          value: 'En cours',
          inline: true
        }
      ],
      timestamp: true
    },
    webhookUrl
  );
}

/**
 * Envoie une notification de progression de migration
 */
export async function sendMigrationProgressNotification(
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
  
  return sendDiscordNotification(
    `⏳ Migration en cours: ${progress.toFixed(1)}% terminée`,
    {
      title: 'Progression de la Migration',
      color: 16776960, // Jaune
      fields: [
        {
          name: 'Répertoire Source',
          value: sourceDir,
          inline: true
        },
        {
          name: 'Progression',
          value: progressBar,
          inline: false
        },
        {
          name: 'Fichiers Traités',
          value: `${stats.filesProcessed}/${stats.totalFiles}`,
          inline: true
        },
        {
          name: 'Succès',
          value: `${stats.filesSucceeded}`,
          inline: true
        },
        {
          name: 'Échecs',
          value: `${stats.filesFailed}`,
          inline: true
        }
      ],
      timestamp: true
    },
    webhookUrl
  );
}

/**
 * Envoie une notification de fin de migration
 */
export async function sendMigrationCompleteNotification(
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
  
  return sendDiscordNotification(
    success 
      ? `✅ Migration terminée avec succès en ${duration}` 
      : `⚠️ Migration terminée avec des problèmes en ${duration}`,
    {
      title: success ? 'Migration Réussie' : 'Migration Terminée avec Avertissements',
      color: success ? 3066993 : 16750899, // Vert ou Orange
      fields: [
        {
          name: 'Répertoire Source',
          value: sourceDir,
          inline: true
        },
        {
          name: 'Répertoire Cible',
          value: targetDir,
          inline: true
        },
        {
          name: 'Durée',
          value: duration,
          inline: true
        },
        {
          name: 'Fichiers Traités',
          value: `${stats.filesProcessed}/${stats.totalFiles}`,
          inline: true
        },
        {
          name: 'Succès',
          value: `${stats.filesSucceeded}`,
          inline: true
        },
        {
          name: 'Échecs',
          value: `${stats.filesFailed}`,
          inline: true
        },
        {
          name: 'Taux de Réussite',
          value: `${((stats.filesSucceeded / stats.totalFiles) * 100).toFixed(1)}%`,
          inline: true
        }
      ],
      timestamp: true
    },
    webhookUrl
  );
}

/**
 * Envoie une notification d'erreur de migration
 */
export async function sendMigrationErrorNotification(
  sourceDir: string,
  error: string,
  webhookUrl?: string
): Promise<boolean> {
  return sendDiscordNotification(
    `❌ Erreur lors de la migration PHP → NestJS + Remix`,
    {
      title: 'Erreur de Migration',
      color: 15158332, // Rouge
      fields: [
        {
          name: 'Répertoire Source',
          value: sourceDir,
          inline: true
        },
        {
          name: 'Erreur',
          value: error,
          inline: false
        }
      ],
      timestamp: true
    },
    webhookUrl
  );
}

/**
 * Fonctions utilitaires
 */

// Crée une barre de progression visuelle pour Discord
function createProgressBar(progress: number): string {
  const filledBar = '█';
  const emptyBar = '░';
  const barLength = 20;
  
  const filledLength = Math.floor((progress / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  return `${filledBar.repeat(filledLength)}${emptyLength > 0 ? emptyBar.repeat(emptyLength) : ''} ${progress.toFixed(1)}%`;
}

// Formate une durée en secondes en format lisible
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconde${seconds !== 1 ? 's' : ''}`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds.toFixed(0)} seconde${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours} heure${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

// Pour tester l'envoi de notification si ce script est exécuté directement
if (require.main === module) {
  (async () => {
    // Tester la notification
    const success = await sendDiscordNotification(
      'Ceci est un test de notification depuis le pipeline de migration',
      {
        title: 'Test de Notification',
        color: 3447003,
        fields: [
          {
            name: 'Test',
            value: 'Valeur de test',
            inline: true
          }
        ],
        timestamp: true
      }
    );
    
    if (success) {
      console.log('✅ Test de notification envoyé avec succès');
    } else {
      console.error('❌ Échec du test de notification');
    }
  })();
}