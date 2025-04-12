import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import dotenv from 'dotenv';

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
        'x-mcp-agent': 'mcp-core',
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
    const { error } = await supabase.from('mcp_events').select('id').limit(1);
    
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
  priority: number = 3
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('mcp_events')
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
      .from('mcp_events')
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