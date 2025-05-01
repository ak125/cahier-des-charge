import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from './types';

// Charger les variables d'environnement
dotenv.config();

// Valider que les variables d'environnement nécessaires sont définies
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies'
  );
}

// Créer et exporter le client Supabase typé
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'xDoDotmcp-agent': DoDotmcp-core',
      },
    },
  }
);

/**
 * Fonction utilitaire pour vérifier la connectivité à Supabase
 * @returns {Promise<boolean>} True si la connexion est établie, sinon lance une erreur
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from(mcp_events').select('id').limit(1);
    
    if (error) {
      throw new Error(`Erreur de connexion à Supabase: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion à Supabase:', error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour enregistrer un événement MCP
 * @param eventType Type d'événement
 * @param payload Données associées à l'événement
 * @param source Source de l'événement (généralement le nom de l'agent)
 * @param priority Priorité de l'événement (1-5, 5 étant la plus élevée)
 * @returns ID de l'événement créé
 */
export async function logMcpEvent(
  eventType: string,
  payload: Record<string, any>,
  source: string,
  priority = 3
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(mcp_events')
      .insert({
        event_type: eventType,
        payload,
        source,
        status: 'received',
        priority,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'enregistrement de l'événement MCP: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'événement MCP:', error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour mettre à jour le statut d'un événement MCP
 * @param eventId ID de l'événement
 * @param status Nouveau statut
 * @param errorMessage Message d'erreur optionnel
 */
export async function updateMcpEventStatus(
  eventId: number,
  status: 'received' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      status,
      processed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
      error_message: errorMessage,
    };

    const { error } = await supabase
      .from(mcp_events')
      .update(updateData)
      .eq('id', eventId);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du statut de l'événement MCP: ${error.message}`);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'événement MCP:', error);
    throw error;
  }
}

// utils/supabaseClient.ts
// Client Supabase temporaire pour permettre le démarrage du serveur MCP

import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement ou utiliser des valeurs par défaut pour développement
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:5433';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example-key';

// Créer et exporter le client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Exporter un client fictif pour permettre le démarrage sans connexion réelle
export const mockSupabase = {
  from: (table: string) => ({
    select: () => ({ data: [], error: null }),
    insert: (data: any) => ({ data, error: null }),
    update: (data: any) => ({ data, error: null }),
    delete: () => ({ data: null, error: null }),
    eq: () => ({ data: null, error: null }),
    order: () => ({ data: [], error: null }),
    limit: () => ({ data: [], error: null }),
    single: () => ({ data: {}, error: null }),
    group: () => ({ data: [], error: null }),
  }),
};

// Exporter par défaut un client qui utilise le mock si les variables d'environnement ne sont pas définies
export default process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? supabase : mockSupabase;