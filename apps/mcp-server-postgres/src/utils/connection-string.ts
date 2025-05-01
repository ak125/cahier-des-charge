/**
 * Utilitaire pour analyser et gérer les chaînes de connexion PostgreSQL
 */

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  schema?: string;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number; // Nombre maximum de clients dans le pool
}

/**
 * Analyse une chaîne de connexion PostgreSQL et retourne un objet de configuration
 * @param connectionString Chaîne de connexion au format PostgreSQL
 * @returns Un objet de configuration de connexion
 */
export function parseConnectionString(connectionString: string): ConnectionConfig {
  // Configuration par défaut
  const config: ConnectionConfig = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '',
    ssl: false,
  };

  try {
    // Cas 1: URL complète avec postgres:// ou postgresql://
    if (
      connectionString.startsWith('postgres://') ||
      connectionString.startsWith('postgresql://')
    ) {
      return parseConnectionUrl(connectionString);
    }

    // Cas 2: Chaîne au format clé=valeur séparée par des espaces
    if (connectionString.includes('=') && !connectionString.includes('://')) {
      const parts = connectionString.split(/\s+/);

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (!key || !value) continue;

        switch (key.toLowerCase()) {
          case 'host':
          case 'hostname':
            config.host = value;
            break;
          case 'port':
            config.port = parseInt(value, 10);
            break;
          case 'dbname':
          case 'database':
            config.database = value;
            break;
          case 'user':
          case 'username':
            config.user = value;
            break;
          case 'password':
          case 'pass':
            config.password = value;
            break;
          case 'ssl':
            config.ssl = value.toLowerCase() === 'true';
            break;
          case 'schema':
            config.schema = value;
            break;
          case 'connectiontimeoutmillis':
            config.connectionTimeoutMillis = parseInt(value, 10);
            break;
          case 'idletimeoutmillis':
            config.idleTimeoutMillis = parseInt(value, 10);
            break;
          case 'max':
            config.max = parseInt(value, 10);
            break;
        }
      }

      return config;
    }

    // Cas 3: Format non reconnu, on lance une erreur
    throw new Error('Format de chaîne de connexion non reconnu');
  } catch (error) {
    throw new Error(`Erreur lors de l'analyse de la chaîne de connexion: ${error.message}`);
  }
}

/**
 * Analyse une URL de connexion PostgreSQL
 * @param url URL de connexion au format postgres:// ou postgresql://
 * @returns Un objet de configuration de connexion
 */
function parseConnectionUrl(url: string): ConnectionConfig {
  try {
    const parsedUrl = new URL(url);

    // Extraire le nom d'utilisateur et le mot de passe
    const auth = parsedUrl.username
      ? {
          user: decodeURIComponent(parsedUrl.username),
          password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : '',
        }
      : {
          user: 'postgres',
          password: '',
        };

    // Extraire le nom de la base de données du chemin (sans le premier slash)
    const database = parsedUrl.pathname ? parsedUrl.pathname.substring(1) : 'postgres';

    // Extraire les paramètres de l'URL
    const ssl = parsedUrl.searchParams.get('ssl') === 'true';
    const schema = parsedUrl.searchParams.get('schema') || undefined;
    const connectionTimeoutMillis = parsedUrl.searchParams.get('connectionTimeoutMillis')
      ? parseInt(parsedUrl.searchParams.get('connectionTimeoutMillis')!, 10)
      : undefined;
    const idleTimeoutMillis = parsedUrl.searchParams.get('idleTimeoutMillis')
      ? parseInt(parsedUrl.searchParams.get('idleTimeoutMillis')!, 10)
      : undefined;
    const max = parsedUrl.searchParams.get('max')
      ? parseInt(parsedUrl.searchParams.get('max')!, 10)
      : undefined;

    return {
      host: parsedUrl.hostname || 'localhost',
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
      database,
      ...auth,
      ssl,
      schema,
      connectionTimeoutMillis,
      idleTimeoutMillis,
      max,
    };
  } catch (error) {
    throw new Error(`Erreur lors de l'analyse de l'URL de connexion: ${error.message}`);
  }
}

/**
 * Convertit un objet de configuration en chaîne de connexion PostgreSQL
 * @param config Objet de configuration de connexion
 * @returns Une chaîne de connexion au format PostgreSQL
 */
export function formatConnectionString(config: ConnectionConfig): string {
  const { host, port, database, user, password, ssl, schema } = config;

  let connectionString = `postgresql://${encodeURIComponent(user)}`;

  if (password) {
    connectionString += `:${encodeURIComponent(password)}`;
  }

  connectionString += `@${host}:${port}/${database}`;

  // Ajouter les paramètres supplémentaires si nécessaire
  const params: string[] = [];

  if (ssl !== undefined) {
    params.push(`ssl=${ssl}`);
  }

  if (schema) {
    params.push(`schema=${schema}`);
  }

  if (config.connectionTimeoutMillis !== undefined) {
    params.push(`connectionTimeoutMillis=${config.connectionTimeoutMillis}`);
  }

  if (config.idleTimeoutMillis !== undefined) {
    params.push(`idleTimeoutMillis=${config.idleTimeoutMillis}`);
  }

  if (config.max !== undefined) {
    params.push(`max=${config.max}`);
  }

  if (params.length > 0) {
    connectionString += `?${params.join('&')}`;
  }

  return connectionString;
}

/**
 * Masque les informations sensibles dans une chaîne de connexion (comme le mot de passe)
 * @param connectionString Chaîne de connexion PostgreSQL
 * @returns Chaîne de connexion avec les informations sensibles masquées
 */
export function maskConnectionString(connectionString: string): string {
  try {
    const config = parseConnectionString(connectionString);

    // Masquer le mot de passe
    if (config.password) {
      config.password = '********';
    }

    return formatConnectionString(config);
  } catch (_error) {
    // Si on n'arrive pas à analyser la chaîne, on fait un masquage simple
    if (connectionString.includes('@')) {
      // Format URL
      return connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
    }
    if (connectionString.includes('password=')) {
      // Format clé=valeur
      return connectionString.replace(/password=([^\s]+)/, 'password=********');
    }

    // Si on ne peut pas masquer de façon fiable, on retourne une chaîne générique
    return '[Chaîne de connexion masquée]';
  }
}

/**
 * Vérifie si une chaîne de connexion PostgreSQL est valide syntaxiquement
 * @param connectionString Chaîne de connexion à vérifier
 * @returns true si la chaîne est valide, sinon false
 */
export function isValidConnectionString(connectionString: string): boolean {
  try {
    parseConnectionString(connectionString);
    return true;
  } catch (_error) {
    return false;
  }
}
