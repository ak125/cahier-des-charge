-- Migration SQL pour configurer le système LISTEN/NOTIFY PostgreSQL pour les jobs MCP
-- À exécuter sur votre base de données Supabase ou PostgreSQL

-- Vérifie si la table mcp_jobs existe, sinon la crée
CREATE TABLE IF NOT EXISTS mcp_jobs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_path TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Création de la fonction qui envoie la notification
CREATE OR REPLACE FUNCTION notify_job_finished() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('job_finished', json_build_object(
    'jobId', NEW.job_id,
    'status', NEW.status,
    'timestamp', NEW.updated_at
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprime le trigger s'il existe déjà (pour permettre la ré-exécution du script)
DROP TRIGGER IF EXISTS trigger_notify_job_finished ON mcp_jobs;

-- Crée le trigger qui appelle la fonction de notification quand un job est terminé
CREATE TRIGGER trigger_notify_job_finished
AFTER UPDATE ON mcp_jobs
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'done')
EXECUTE FUNCTION notify_job_finished();

-- Commentaire pour confirmer l'exécution
COMMENT ON FUNCTION notify_job_finished() IS 'Fonction créée le ' || CURRENT_TIMESTAMP || ' pour notifier les changements de statut des jobs MCP';