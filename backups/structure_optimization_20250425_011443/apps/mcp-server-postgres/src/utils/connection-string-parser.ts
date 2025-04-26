/**
 * Utilitaire pour analyser les chaînes de connexion PostgreSQL
 */

export interface PostgresConnectionOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  schema?: string;
  ssl?: boolean;
}

/**
 * Analyse une chaîne de connexion PostgreSQL et la convertit en objet d'options de connexion
 * Formats supportés:
 * - postgres://user:password@host:port/database
 * - postgresql://user:password@host:port/database?schema=public&ssl=true
 * 
 * @param connectionString Chaîne de connexion PostgreSQL
 * @returns Options de connexion PostgreSQL
 */
export function parseConnectionString(connectionString: string): PostgresConnectionOptions {
  try {
    // Gestion du cas où la chaîne est déjà un objet de connexion
    if (typeof connectionString !== 'string') {
      throw new Error('La chaîne de connexion doit être une chaîne de caractères');
    }

    // Valider que la chaîne commence par postgresql:// ou postgres://
    if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
      throw new Error('La chaîne de connexion doit commencer par postgresql:// ou postgres://');
    }

    const url = new URL(connectionString);
    
    // Extraire les paramètres de base
    const host = url.hostname;
    const port = url.port ? parseInt(url.port, 10) : 5432;
    const database = url.pathname.slice(1); // Supprimer le / initial
    const user = url.username;
    const password = url.password;
    
    // Extraire les paramètres optionnels
    const schema = url.searchParams.get('schema') || 'public';
    const ssl = url.searchParams.get('ssl') === 'true';
    
    // Valider les paramètres obligatoires
    if (!host || !database || !user) {
      throw new Error('La chaîne de connexion doit contenir un hôte, une base de données et un utilisateur');
    }
    
    return {
      host,
      port,
      database,
      user,
      password,
      schema,
      ssl
    };
  } catch (error) {
    throw new Error(`Erreur d'analyse de la chaîne de connexion PostgreSQL: ${error.message}`);
  }
}

/**
 * Convertit un objet d'options de connexion en chaîne de connexion PostgreSQL
 * 
 * @param options Options de connexion PostgreSQL
 * @returns Chaîne de connexion PostgreSQL
 */
export function buildConnectionString(options: PostgresConnectionOptions): string {
  const { host, port, database, user, password, schema, ssl } = options;
  
  // Construire l'URL de base
  let connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  
  // Ajouter les paramètres optionnels
  const params = new URLSearchParams();
  
  if (schema && schema !== 'public') {
    params.append('schema', schema);
  }
  
  if (ssl) {
    params.append('ssl', 'true');
  }
  
  // Ajouter les paramètres à l'URL si nécessaire
  const paramsString = params.toString();
  if (paramsString) {
    connectionString += `?${paramsString}`;
  }
  
  return connectionString;
}

/**
 * Masquer le mot de passe dans une chaîne de connexion pour l'affichage sécurisé
 */
export function maskConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    
    // Masquer le mot de passe s'il existe
    if (url.password) {
      url.password = '********';
    }
    
    return url.toString();
  } catch (error) {
    // Si l'analyse échoue, retourner une version masquée basique
    return connectionString.replace(/:[^:@]*@/, ':********@');
  }
}