-- Schéma Supabase pour le Dashboard de Migration SQL vers Prisma/PostgreSQL
-- À exécuter dans l'éditeur SQL de Supabase

-- Table des structures SQL
CREATE TABLE IF NOT EXISTS sql_tables (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  schema_data JSONB NOT NULL,
  column_count INTEGER NOT NULL DEFAULT 0,
  has_primary_key BOOLEAN NOT NULL DEFAULT false,
  foreign_key_count INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de statut de migration
CREATE TABLE IF NOT EXISTS migration_status (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  assigned_to TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'blocked', 'in_progress', 'migrated', 'validated', 'ignored'))
);

-- Table de dette technique
CREATE TABLE IF NOT EXISTS technical_debt (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  debt_score INTEGER NOT NULL DEFAULT 0,
  metrics JSONB,
  suggestions JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de relations entre tables
CREATE TABLE IF NOT EXISTS table_relations (
  id SERIAL PRIMARY KEY,
  source_table TEXT NOT NULL,
  target_table TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'unknown',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_relation UNIQUE (source_table, target_table, relation_type)
);

-- Table de mapping de types SQL vers Prisma
CREATE TABLE IF NOT EXISTS type_mapping (
  id SERIAL PRIMARY KEY,
  sql_type TEXT NOT NULL UNIQUE,
  prisma_type TEXT NOT NULL,
  postgres_type TEXT NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table d'audit des modifications
CREATE TABLE IF NOT EXISTS migration_audit (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  performed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour les timestamps
CREATE TRIGGER update_sql_tables_timestamp
BEFORE UPDATE ON sql_tables
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_migration_status_timestamp
BEFORE UPDATE ON migration_status
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_technical_debt_timestamp
BEFORE UPDATE ON technical_debt
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_table_relations_timestamp
BEFORE UPDATE ON table_relations
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_type_mapping_timestamp
BEFORE UPDATE ON type_mapping
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Trigger pour enregistrer les modifications du statut de migration
CREATE OR REPLACE FUNCTION log_migration_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO migration_audit (table_name, action, details, performed_by)
  VALUES (
    NEW.table_name,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated' 
      ELSE TG_OP
    END,
    jsonb_build_object(
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      'new_status', NEW.status,
      'old_progress', CASE WHEN TG_OP = 'UPDATE' THEN OLD.progress ELSE NULL END,
      'new_progress', NEW.progress,
      'assigned_to', NEW.assigned_to
    ),
    auth.uid()
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_migration_status_audit
AFTER INSERT OR UPDATE ON migration_status
FOR EACH ROW EXECUTE PROCEDURE log_migration_status_changes();

-- Configurez les règles RLS (Row Level Security) comme nécessaire
ALTER TABLE sql_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_audit ENABLE ROW LEVEL SECURITY;

-- Créez des politiques RLS appropriées
CREATE POLICY "Données publiques pour les utilisateurs authentifiés" ON sql_tables
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Mise à jour pour les administrateurs" ON migration_status
  FOR UPDATE USING (auth.role() = 'authenticated');
  
-- Ajoutez des exemples de données de base si nécessaire
INSERT INTO type_mapping (sql_type, prisma_type, postgres_type, notes) VALUES
  ('INT', 'Int', 'integer', 'Type entier standard'),
  ('VARCHAR', 'String', 'varchar', 'Chaîne de caractères à longueur variable'),
  ('TEXT', 'String', 'text', 'Texte de longueur illimitée'),
  ('DATETIME', 'DateTime', 'timestamp', 'Date et heure'),
  ('BOOLEAN', 'Boolean', 'boolean', 'Valeur booléenne'),
  ('DECIMAL', 'Decimal', 'decimal', 'Nombre décimal à précision fixe'),
  ('FLOAT', 'Float', 'float8', 'Nombre à virgule flottante'),
  ('ENUM', 'Enum', 'enum', 'Converti en type Enum Prisma, nécessite une définition supplémentaire'),
  ('JSON', 'Json', 'jsonb', 'Données JSON')
ON CONFLICT (sql_type) DO NOTHING;