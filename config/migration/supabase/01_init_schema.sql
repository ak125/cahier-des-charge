-- Initialisation des schémas et tables nécessaires pour l'analyse PHP
CREATE SCHEMA IF NOT EXISTS php_analysis;

-- Table des fichiers PHP analysés
CREATE TABLE IF NOT EXISTS php_analysis.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  complexity_score INTEGER NOT NULL,
  loc INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des métriques par fichier
CREATE TABLE IF NOT EXISTS php_analysis.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES php_analysis.files(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des alertes de qualité
CREATE TABLE IF NOT EXISTS php_analysis.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES php_analysis.files(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  line_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_files_path ON php_analysis.files(file_path);
CREATE INDEX IF NOT EXISTS idx_files_complexity ON php_analysis.files(complexity_score);
CREATE INDEX IF NOT EXISTS idx_metrics_file_id ON php_analysis.metrics(file_id);
CREATE INDEX IF NOT EXISTS idx_alerts_file_id ON php_analysis.alerts(file_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON php_analysis.alerts(severity);