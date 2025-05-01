// @ts-ignore - Ignorer l'erreur de module non trouvé
import { createClient } from '@supabase/supabase-js';

// Types pour Supabase
export type McpJobStatus = 'pending' | 'running' | 'done' | 'error' | 'ignored';

export interface McpJob {
  id: string;
  filename: string;
  status: McpJobStatus;
  priority: number;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  error_message?: string;
  audit_path?: string;
  verification_report_path?: string;
  impact_graph_path?: string;
  migration_result_path?: string;
  dry_run_result?: string;
  metadata?: Record<string, any>;
}

// Schema de la table Supabase
export const mcpJobsTableSchema = `
CREATE TABLE mcp_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  original_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  priority NUMERIC NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error', 'ignored')),
  last_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_details TEXT,
  log_details TEXT,
  metadata JSONB
);

-- Index pour améliorer les performances des requêtes fréquentes
CREATE INDEX mcp_jobs_status_idx ON mcp_jobs (status);
CREATE INDEX mcp_jobs_priority_idx ON mcp_jobs (priority DESC);
CREATE INDEX mcp_jobs_filename_idx ON mcp_jobs (filename);

-- Fonction pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON mcp_jobs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();
`;

// Initialisation du client Supabase côté serveur
// @ts-ignore - Ignorer les erreurs de type process.env
const supabaseUrl = typeof process !== 'undefined' ? process.env.SUPABASE_URL || '' : '';
const supabaseKey = typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY || '' : '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Variables d\'environnement Supabase manquantes, veuillez définir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * API pour interagir avec Supabase pour les jobs MCP
 */
export const mcpSupabaseApi = {
  /**
   * Récupère tous les jobs MCP avec filtre optionnel
   */
  async getJobs(filters?: { status?: McpJobStatus; search?: string; limit?: number; offset?: number }) {
    const { status, search, limit = 50, offset = 0 } = filters || {};

    let query = supabase
      .from('mcp_jobs')
      .select('*')
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('filename', `%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des jobs:', error);
      throw error;
    }

    return { jobs: data as McpJob[], count };
  },

  /**
   * Récupère un job MCP spécifique par ID ou nom de fichier
   */
  async getJob(idOrFilename: string) {
    // Essayez d'abord par ID
    let { data, error } = await supabase
      .from('mcp_jobs')
      .select('*')
      .eq('id', idOrFilename)
      .single();

    // Si rien n'est trouvé, essayez par nom de fichier
    if (!data && !error) {
      ({ data, error } = await supabase
        .from('mcp_jobs')
        .select('*')
        .eq('filename', idOrFilename)
        .single());
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération du job:', error);
      throw error;
    }

    return data as McpJob | null;
  },

  /**
   * Met à jour le statut d'un job MCP
   */
  async updateJobStatus(jobId: string, status: McpJobStatus, details?: { error_message?: string }) {
    const { data, error } = await supabase
      .from('mcp_jobs')
      .update({
        status,
        updated_at: new Date().toISOString(),
        last_run_at: status === 'running' ? new Date().toISOString() : undefined,
        error_message: details?.error_message,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du job:', error);
      throw error;
    }

    return data as McpJob;
  },

  /**
   * Crée ou met à jour un job MCP
   */
  async upsertJob(job: Partial<McpJob> & { filename: string }) {
    const now = new Date().toISOString();

    // Extraire filename pour éviter la duplication
    const { filename } = job;
    const jobData = { ...job };

    const { data, error } = await supabase
      .from('mcp_jobs')
      .upsert({
        ...jobData,
        status: job.status || 'pending',
        priority: job.priority || 5,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création/mise à jour du job:', error);
      throw error;
    }

    return data as McpJob;
  },

  /**
   * Démarre l'exécution d'un job MCP (met à jour le statut à "running")
   */
  async startJob(jobId: string) {
    return this.updateJobStatus(jobId, 'running');
  },

  /**
   * Termine avec succès un job MCP (met à jour le statut à "done")
   */
  async completeJob(jobId: string, details?: { paths?: Record<string, string> }) {
    const { data, error } = await supabase
      .from('mcp_jobs')
      .update({
        status: 'done',
        updated_at: new Date().toISOString(),
        last_run_at: new Date().toISOString(),
        ...(details?.paths || {}),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du job:', error);
      throw error;
    }

    return data as McpJob;
  },
};

export default supabase;