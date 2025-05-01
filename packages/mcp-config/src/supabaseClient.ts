// Client Supabase extrait de l'ancien mcp-core
import { createClient } from '@supabase/supabase-js';
import { getConfig } from './config';

let supabaseClient: any = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const config = getConfig();

    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase URL and key must be provided in the configuration');
    }

    supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
  }

  return supabaseClient;
}

export function resetSupabaseClient() {
  supabaseClient = null;
}
