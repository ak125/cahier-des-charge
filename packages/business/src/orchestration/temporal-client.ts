/**
 * Client Temporal
 *
 * Module pour initialiser et fournir un client Temporal.io
 * Utilisé pour les workflows complexes de longue durée
 */

import { Client, Connection } from '@temporalio/client';

let client: Client | null = null;

/**
 * Options de configuration du client Temporal
 */
export interface TemporalClientOptions {
  serverUrl?: string;
  namespace?: string;
}

/**
 * Initialise et récupère un client Temporal
 */
export async function getTemporalClient(options: TemporalClientOptions = {}): Promise<Client> {
  if (client) {
    return client;
  }

  const serverUrl = options.serverUrl || process.env.TEMPORAL_SERVER_URL || 'localhost:7233';
  const namespace = options.namespace || process.env.TEMPORAL_NAMESPACE || 'default';

  const connection = await Connection.connect({
    address: serverUrl,
  });

  client = new Client({
    connection,
    namespace,
  });

  return client;
}

/**
 * Ferme la connexion au serveur Temporal
 */
export async function closeTemporalClient(): Promise<void> {
  if (client) {
    // La méthode close() n'existe pas directement sur Client
    // On ferme la connexion sous-jacente
    // @ts-ignore - Accès à une propriété interne
    if (client.connection) {
      // @ts-ignore - Accès à une méthode interne
      await client.connection.close();
    }
    client = null;
  }
}
