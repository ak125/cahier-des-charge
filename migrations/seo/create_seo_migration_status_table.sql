-- Migration pour créer la table seo_migration_status
-- Cette table stocke les informations de traçabilité SEO pour chaque route

CREATE TABLE IF NOT EXISTS seo_migration_status (
  id SERIAL PRIMARY KEY,
  trace_id TEXT NOT NULL,
  parent_trace_id TEXT,
  root_trace_id TEXT,
  route TEXT NOT NULL,
  canonical TEXT,
  title TEXT,
  description TEXT,
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  lighthouse_score INTEGER CHECK (lighthouse_score >= 0 AND lighthouse_score <= 100),
  has_meta BOOLEAN DEFAULT FALSE,
  has_canonical BOOLEAN DEFAULT FALSE,
  has_redirects BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'warning')),
  issues JSONB,
  warnings JSONB,
  recommendations JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  migrated_at TIMESTAMP WITH TIME ZONE,
  original_php_file TEXT,
  remix_file TEXT,
  meta_file TEXT,
  redirect_rules JSONB,
  validation_details JSONB,
  
  -- Indexer les champs importants pour les performances
  CONSTRAINT unique_route_trace UNIQUE (route, trace_id)
);

-- Indexation pour des recherches efficaces
CREATE INDEX IF NOT EXISTS idx_seo_migration_trace_id ON seo_migration_status(trace_id);
CREATE INDEX IF NOT EXISTS idx_seo_migration_route ON seo_migration_status(route);
CREATE INDEX IF NOT EXISTS idx_seo_migration_status ON seo_migration_status(status);
CREATE INDEX IF NOT EXISTS idx_seo_migration_score ON seo_migration_status(seo_score);

-- Trigger pour mettre à jour automatiquement la date de mise à jour
CREATE OR REPLACE FUNCTION update_seo_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seo_status_timestamp
BEFORE UPDATE ON seo_migration_status
FOR EACH ROW
EXECUTE FUNCTION update_seo_status_timestamp();

-- Commentaires sur les colonnes
COMMENT ON TABLE seo_migration_status IS 'Suivi de l''état SEO des routes migrées de PHP à Remix';
COMMENT ON COLUMN seo_migration_status.trace_id IS 'Identifiant unique de traçabilité';
COMMENT ON COLUMN seo_migration_status.route IS 'Chemin de la route';
COMMENT ON COLUMN seo_migration_status.canonical IS 'URL canonique de la route';
COMMENT ON COLUMN seo_migration_status.seo_score IS 'Score SEO de 0 à 100';
COMMENT ON COLUMN seo_migration_status.lighthouse_score IS 'Score Lighthouse de 0 à 100';
COMMENT ON COLUMN seo_migration_status.status IS 'État actuel de la migration SEO';