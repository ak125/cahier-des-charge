-- SUPABASE MIGRATION POUR AGENT 8 - OPTIMISEUR SQL
-- Ce script crée les tables et fonctions nécessaires pour suivre les optimisations SQL

-- Créer une table pour stocker les historiques d'analyse
CREATE TABLE IF NOT EXISTS sql_optimization_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT NOT NULL,
    run_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    database_name TEXT NOT NULL,
    total_tables INTEGER NOT NULL,
    tables_with_issues INTEGER NOT NULL,
    optimization_score DECIMAL(5,2) NOT NULL,
    index_recommendations_count INTEGER NOT NULL,
    type_issues_count INTEGER NOT NULL,
    partition_recommendations_count INTEGER NOT NULL,
    slow_queries_count INTEGER NOT NULL,
    report_path TEXT,
    run_by TEXT
);

-- Créer une table pour stocker les détails des tables analysées
CREATE TABLE IF NOT EXISTS sql_table_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT NOT NULL,
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    row_count BIGINT,
    total_size_mb DECIMAL(10,2),
    index_size_mb DECIMAL(10,2),
    seq_scan_rate DECIMAL(5,4),
    avg_query_time_ms DECIMAL(10,2),
    bloat_percent DECIMAL(5,2),
    cache_hit_ratio DECIMAL(5,4),
    index_usage_ratio DECIMAL(5,4),
    optimization_score INTEGER,
    partition_status TEXT,
    FOREIGN KEY (run_id) REFERENCES sql_optimization_history(run_id)
);

-- Créer une table pour stocker les problèmes détectés
CREATE TABLE IF NOT EXISTS sql_detected_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT NOT NULL,
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    severity TEXT NOT NULL,
    suggested_fix TEXT,
    fix_applied BOOLEAN DEFAULT FALSE,
    fix_date TIMESTAMP WITH TIME ZONE,
    fix_notes TEXT,
    FOREIGN KEY (run_id) REFERENCES sql_optimization_history(run_id)
);

-- Créer une table pour stocker les recommandations d'index
CREATE TABLE IF NOT EXISTS sql_index_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT NOT NULL,
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    index_name TEXT NOT NULL,
    index_columns TEXT[] NOT NULL,
    index_type TEXT NOT NULL,
    benefit_description TEXT,
    estimated_improvement DECIMAL(5,2),
    is_applied BOOLEAN DEFAULT FALSE,
    applied_date TIMESTAMP WITH TIME ZONE,
    applied_by TEXT,
    FOREIGN KEY (run_id) REFERENCES sql_optimization_history(run_id)
);

-- Créer une table pour stocker les recommandations de partitionnement
CREATE TABLE IF NOT EXISTS sql_partition_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT NOT NULL,
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    partition_strategy TEXT NOT NULL,
    partition_key TEXT NOT NULL,
    partition_interval TEXT,
    justification TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_date TIMESTAMP WITH TIME ZONE,
    applied_by TEXT,
    FOREIGN KEY (run_id) REFERENCES sql_optimization_history(run_id)
);

-- Créer une vue pour afficher le progrès des optimisations au fil du temps
CREATE OR REPLACE VIEW optimization_progress AS
SELECT 
    run_date::DATE as date,
    database_name,
    optimization_score,
    tables_with_issues,
    index_recommendations_count + type_issues_count + partition_recommendations_count as total_recommendations,
    (SELECT COUNT(*) FROM sql_index_recommendations WHERE is_applied = TRUE AND run_id = h.run_id) as applied_index_recommendations,
    (SELECT COUNT(*) FROM sql_partition_recommendations WHERE is_applied = TRUE AND run_id = h.run_id) as applied_partition_recommendations
FROM 
    sql_optimization_history h
ORDER BY 
    run_date;

-- Créer une fonction pour marquer un index comme appliqué
CREATE OR REPLACE FUNCTION mark_index_applied(
    p_index_id UUID,
    p_applied_by TEXT DEFAULT current_user
) RETURNS VOID AS $$
BEGIN
    UPDATE sql_index_recommendations
    SET 
        is_applied = TRUE,
        applied_date = now(),
        applied_by = p_applied_by
    WHERE id = p_index_id;
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour marquer un partitionnement comme appliqué
CREATE OR REPLACE FUNCTION mark_partition_applied(
    p_partition_id UUID,
    p_applied_by TEXT DEFAULT current_user
) RETURNS VOID AS $$
BEGIN
    UPDATE sql_partition_recommendations
    SET 
        is_applied = TRUE,
        applied_date = now(),
        applied_by = p_applied_by
    WHERE id = p_partition_id;
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour marquer un problème comme résolu
CREATE OR REPLACE FUNCTION mark_issue_fixed(
    p_issue_id UUID,
    p_fix_notes TEXT DEFAULT NULL,
    p_fixed_by TEXT DEFAULT current_user
) RETURNS VOID AS $$
BEGIN
    UPDATE sql_detected_issues
    SET 
        fix_applied = TRUE,
        fix_date = now(),
        fix_notes = p_fix_notes
    WHERE id = p_issue_id;
END;
$$ LANGUAGE plpgsql;

-- Créer des politiques RLS pour la sécurité
ALTER TABLE sql_optimization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sql_table_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sql_detected_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sql_index_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sql_partition_recommendations ENABLE ROW LEVEL SECURITY;

-- Créer des politiques qui permettent à l'utilisateur authentifié de voir toutes les données
CREATE POLICY "Users can view all optimization history" 
    ON sql_optimization_history FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all table performance data" 
    ON sql_table_performance FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all detected issues" 
    ON sql_detected_issues FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all index recommendations" 
    ON sql_index_recommendations FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all partition recommendations" 
    ON sql_partition_recommendations FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Créer des politiques qui permettent à l'utilisateur authentifié de modifier certaines données
CREATE POLICY "Users can update issue fix status" 
    ON sql_detected_issues FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update index application status" 
    ON sql_index_recommendations FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update partition application status" 
    ON sql_partition_recommendations FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Créer des politiques qui permettent à l'API d'insérer de nouvelles données
CREATE POLICY "API can insert new optimization history" 
    ON sql_optimization_history FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "API can insert new table performance data" 
    ON sql_table_performance FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "API can insert new detected issues" 
    ON sql_detected_issues FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "API can insert new index recommendations" 
    ON sql_index_recommendations FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "API can insert new partition recommendations" 
    ON sql_partition_recommendations FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');