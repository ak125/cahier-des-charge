/**
 * Utilitaire pour analyser les chaînes de connexion PostgreSQL
 */

// Interface pour les informations de connexion
export interface ConnectionInfo {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  ssl?: boolean;
  schema?: string;
}

/**
 * Analyser une chaîne de connexion PostgreSQL
 * Format: postgresql://user:password@host:port/database
 */
export function parseConnectionString(connectionString: string): ConnectionInfo {
  try {
    // Vérifier que la chaîne commence par postgresql://
    if (!connectionString.startsWith('postgresql://')) {
      throw new Error('La chaîne de connexion doit commencer par postgresql://');
    }

    // Extraire les composants
    const url = new URL(connectionString);
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port ? parseInt(url.port, 10) : 5432;
    const database = url.pathname.slice(1); // Enlever le / initial

    // Extraire les options SSL et le schéma des paramètres de requête
    const ssl = url.searchParams.get('ssl') === 'true';
    const schema = url.searchParams.get('schema') || 'public';

    // Vérifier que les informations nécessaires sont présentes
    if (!user || !host || !database) {
      throw new Error('Informations de connexion incomplètes');
    }

    return {
      user,
      password,
      host,
      port,
      database,
      ssl,
      schema,
    };
  } catch (error) {
    throw new Error(
      `Erreur d'analyse de la chaîne de connexion: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Construire une chaîne de connexion PostgreSQL à partir des informations de connexion
 */
export function buildConnectionString(info: ConnectionInfo): string {
  const baseUrl = `postgresql://${info.user}:${info.password}@${info.host}:${info.port}/${info.database}`;

  // Ajouter les paramètres optionnels
  const params = new URLSearchParams();
  if (info.ssl) {
    params.set('ssl', 'true');
  }
  if (info.schema && info.schema !== 'public') {
    params.set('schema', info.schema);
  }

  const paramsString = params.toString();
  return paramsString ? `${baseUrl}?${paramsString}` : baseUrl;
}
