/**
 * Utilitaire pour analyser les chaînes de connexion PostgreSQL
 */

import { ConnectionConfig } from '../types';

/**
 * Analyse une chaîne de connexion PostgreSQL et renvoie un objet de configuration
 * Format de la chaîne: postgresql://user:password@host:port/database?sslmode=require
 *
 * @param connectionString Chaîne de connexion PostgreSQL
 * @returns Configuration de connexion structurée
 */
export function parseConnectionString(connectionString: string): ConnectionConfig {
  // Valeurs par défaut
  const config: ConnectionConfig = {
    user: 'postgres',
    password: '',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    ssl: false,
  };

  try {
    // Vérifier si la chaîne est vide
    if (!connectionString) {
      return config;
    }

    // Vérifier si c'est une URL valide
    const url = new URL(connectionString);

    // Vérifier que c'est bien une connexion PostgreSQL
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      throw new Error(
        `Protocole non supporté: ${url.protocol}. Utilisez postgresql:// ou postgres://`
      );
    }

    // Extraire les composants
    if (url.hostname) {
      config.host = url.hostname;
    }

    if (url.port) {
      config.port = parseInt(url.port, 10);
    }

    if (url.username) {
      config.user = url.username;
    }

    if (url.password) {
      config.password = url.password;
    }

    // Extraire le nom de la base de données du chemin
    const pathParts = url.pathname.split('/').filter((p) => p);
    if (pathParts.length > 0) {
      config.database = pathParts[0];
    }

    // Analyser les paramètres de requête pour SSL
    const sslMode = url.searchParams.get('sslmode');
    if (
      sslMode === 'require' ||
      sslMode === 'prefer' ||
      sslMode === 'verify-ca' ||
      sslMode === 'verify-full'
    ) {
      config.ssl = true;
    } else if (sslMode === 'disable') {
      config.ssl = false;
    }

    return config;
  } catch (error) {
    // Si ce n'est pas une URL valide, essayons l'ancien format
    // Format: user:password@host:port/database
    try {
      const oldFormatRegex = /^([^:]+)(?::([^@]+))?@([^:]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/;
      const matches = connectionString.match(oldFormatRegex);

      if (matches) {
        config.user = matches[1] || config.user;
        config.password = matches[2] || config.password;
        config.host = matches[3] || config.host;
        config.port = matches[4] ? parseInt(matches[4], 10) : config.port;
        config.database = matches[5] || config.database;

        // Paramètres supplémentaires
        if (matches[6]) {
          const params = new URLSearchParams(matches[6]);
          const sslMode = params.get('sslmode');
          if (
            sslMode === 'require' ||
            sslMode === 'prefer' ||
            sslMode === 'verify-ca' ||
            sslMode === 'verify-full'
          ) {
            config.ssl = true;
          } else if (sslMode === 'disable') {
            config.ssl = false;
          }
        }

        return config;
      }
    } catch (innerError) {
      console.error("Erreur lors de l'analyse du format de connexion alternatif:", innerError);
    }

    console.error("Erreur lors de l'analyse de la chaîne de connexion:", error);
    return config;
  }
}

/**
 * Génère une chaîne de connexion PostgreSQL à partir d'un objet de configuration
 *
 * @param config Configuration de connexion
 * @returns Chaîne de connexion PostgreSQL
 */
export function generateConnectionString(config: ConnectionConfig): string {
  const url = new URL('postgresql://');

  url.hostname = config.host;
  url.port = config.port.toString();
  url.username = config.user;

  if (config.password) {
    url.password = config.password;
  }

  url.pathname = `/${config.database}`;

  if (config.ssl) {
    url.searchParams.set('sslmode', 'require');
  } else {
    url.searchParams.set('sslmode', 'disable');
  }

  return url.toString();
}

/**
 * Masque les informations sensibles d'une chaîne de connexion pour la journalisation
 *
 * @param connectionString Chaîne de connexion PostgreSQL
 * @returns Chaîne de connexion avec le mot de passe masqué
 */
export function maskConnectionString(connectionString: string): string {
  try {
    const config = parseConnectionString(connectionString);

    // Remplacer le mot de passe par des astérisques
    if (config.password) {
      config.password = '********';
    }

    return generateConnectionString(config);
  } catch (_error) {
    // Si nous ne pouvons pas analyser la chaîne, masquons manuellement
    return connectionString.replace(/(:.*?@)/g, ':********@');
  }
}
