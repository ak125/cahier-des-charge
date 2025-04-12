-- supabase-rls-policies.sql
-- Configuration des politiques de sécurité RLS pour l'analyse PHP

-- Activer RLS (Row Level Security) sur nos tables
ALTER TABLE php_analysis.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE php_analysis.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE php_analysis.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE php_analysis.functions ENABLE ROW LEVEL SECURITY;

-- Création des rôles
CREATE ROLE php_analyst;
CREATE ROLE dashboard_viewer;
CREATE ROLE anonymous;

-- Attribuer les rôles aux utilisateurs Supabase
GRANT php_analyst TO authenticated;
GRANT dashboard_viewer TO authenticated;
GRANT anonymous TO anon;

-- 1. Politiques pour la table php_analysis.files

-- Politique: Les analystes PHP peuvent tout voir
CREATE POLICY "Les analystes PHP peuvent tout voir" 
    ON php_analysis.files
    FOR ALL
    TO php_analyst
    USING (true);

-- Politique: Les utilisateurs du dashboard peuvent uniquement lire
CREATE POLICY "Les utilisateurs du dashboard peuvent uniquement lire" 
    ON php_analysis.files
    FOR SELECT
    TO dashboard_viewer
    USING (true);

-- Politique: Les utilisateurs anonymes peuvent voir des statistiques limitées
CREATE POLICY "Les utilisateurs anonymes peuvent voir des métriques limitées" 
    ON php_analysis.files
    FOR SELECT
    TO anonymous
    USING (
        -- Ne montrer que des informations limitées aux utilisateurs anonymes
        -- Par exemple, masquer les chemins de fichiers spécifiques
        last_analyzed > (CURRENT_DATE - INTERVAL '30 days')
    );

-- 2. Politiques pour la table php_analysis.metrics

-- Politique: Les analystes PHP peuvent tout voir
CREATE POLICY "Les analystes PHP peuvent tout voir" 
    ON php_analysis.metrics
    FOR ALL
    TO php_analyst
    USING (true);

-- Politique: Les utilisateurs du dashboard peuvent uniquement lire
CREATE POLICY "Les utilisateurs du dashboard peuvent uniquement lire" 
    ON php_analysis.metrics
    FOR SELECT
    TO dashboard_viewer
    USING (true);

-- Politique: Les utilisateurs anonymes ne peuvent pas voir les métriques détaillées
CREATE POLICY "Les utilisateurs anonymes voient des métriques agrégées" 
    ON php_analysis.metrics
    FOR SELECT
    TO anonymous
    USING (
        metric_type IN ('complexity', 'maintainability', 'comment_ratio')
    );

-- 3. Politiques pour la table php_analysis.alerts

-- Politique: Les analystes PHP peuvent tout voir
CREATE POLICY "Les analystes PHP peuvent tout voir" 
    ON php_analysis.alerts
    FOR ALL
    TO php_analyst
    USING (true);

-- Politique: Les utilisateurs du dashboard peuvent uniquement lire
CREATE POLICY "Les utilisateurs du dashboard peuvent uniquement lire" 
    ON php_analysis.alerts
    FOR SELECT
    TO dashboard_viewer
    USING (true);

-- Politique: Les utilisateurs anonymes ne peuvent pas voir les alertes (aucun accès)
-- Pas besoin de créer explicitement une politique, car par défaut sans politique, c'est DENY

-- 4. Politiques pour la table php_analysis.functions

-- Politique: Les analystes PHP peuvent tout voir
CREATE POLICY "Les analystes PHP peuvent tout voir" 
    ON php_analysis.functions
    FOR ALL
    TO php_analyst
    USING (true);

-- Politique: Les utilisateurs du dashboard peuvent uniquement lire
CREATE POLICY "Les utilisateurs du dashboard peuvent uniquement lire" 
    ON php_analysis.functions
    FOR SELECT
    TO dashboard_viewer
    USING (true);

-- Politique: Les utilisateurs anonymes peuvent voir les fonctions les plus complexes
CREATE POLICY "Les utilisateurs anonymes peuvent voir les fonctions complexes" 
    ON php_analysis.functions
    FOR SELECT
    TO anonymous
    USING (
        complexity > 10
        AND analyzed_at > (CURRENT_DATE - INTERVAL '30 days')
    );

-- 5. Fonctions RPC pour accès sécurisé et filtré aux données

-- Fonction pour obtenir des métriques anonymisées (agrégations sans montrer les fichiers spécifiques)
CREATE OR REPLACE FUNCTION get_anonymous_metrics()
RETURNS TABLE (
    metric_name TEXT,
    avg_value NUMERIC,
    max_value NUMERIC,
    min_value NUMERIC,
    total_files INT
) SECURITY DEFINER
SET search_path = php_analysis, public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.metric_type AS metric_name,
        AVG(CASE WHEN m.metric_value ? 'value' THEN (m.metric_value->>'value')::NUMERIC ELSE 0 END) AS avg_value,
        MAX(CASE WHEN m.metric_value ? 'value' THEN (m.metric_value->>'value')::NUMERIC ELSE 0 END) AS max_value,
        MIN(CASE WHEN m.metric_value ? 'value' THEN (m.metric_value->>'value')::NUMERIC ELSE 0 END) AS min_value,
        COUNT(DISTINCT file_id) AS total_files
    FROM 
        php_analysis.metrics m
    WHERE 
        m.metric_type IN (
            'cyclomatic_complexity', 
            'nested_complexity', 
            'method_complexity',
            'code_duplication', 
            'comment_ratio', 
            'maintainability_index',
            'memory_usage', 
            'execution_time', 
            'query_count',
            'security_issues', 
            'vulnerable_patterns', 
            'input_validation'
        )
        AND m.analyzed_at > CURRENT_DATE - INTERVAL '30 days'
    GROUP BY 
        m.metric_type;
END;
$$;

-- Fonction pour obtenir les tendances d'analyse PHP sur une période donnée
CREATE OR REPLACE FUNCTION get_php_analysis_trends(time_range_days INT DEFAULT 30)
RETURNS TABLE (
    date DATE,
    total_files INT,
    avg_complexity NUMERIC,
    avg_maintainability NUMERIC,
    total_issues INT
) SECURITY DEFINER
SET search_path = php_analysis, public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(f.analyzed_at) AS date,
        COUNT(DISTINCT f.id) AS total_files,
        AVG(f.complexity_score) AS avg_complexity,
        AVG(f.maintainability_index) AS avg_maintainability,
        COALESCE(SUM(a.issues_count), 0) AS total_issues
    FROM 
        php_analysis.files f
        LEFT JOIN (
            SELECT 
                file_id, 
                COUNT(*) AS issues_count,
                MAX(created_at) AS alert_date
            FROM 
                php_analysis.alerts
            WHERE 
                created_at > CURRENT_DATE - INTERVAL '1 day' * time_range_days
            GROUP BY 
                file_id
        ) a ON f.id = a.file_id
    WHERE 
        f.analyzed_at > CURRENT_DATE - INTERVAL '1 day' * time_range_days
    GROUP BY 
        DATE(f.analyzed_at)
    ORDER BY 
        date DESC;
END;
$$;

-- Fonction pour obtenir des statistiques agrégées pour le tableau de bord
CREATE OR REPLACE FUNCTION get_php_analysis_stats(time_range_days INT DEFAULT 7)
RETURNS TABLE (
    total_files INT,
    avg_complexity NUMERIC,
    avg_maintainability NUMERIC,
    total_issues INT,
    low_complexity_files INT,
    medium_complexity_files INT,
    high_complexity_files INT
) SECURITY DEFINER
SET search_path = php_analysis, public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT f.id) AS total_files,
        AVG(f.complexity_score) AS avg_complexity,
        AVG(f.maintainability_index) AS avg_maintainability,
        COALESCE(SUM(a.issues_count), 0) AS total_issues,
        COUNT(DISTINCT CASE WHEN f.complexity_score < 10 THEN f.id END) AS low_complexity_files,
        COUNT(DISTINCT CASE WHEN f.complexity_score >= 10 AND f.complexity_score < 20 THEN f.id END) AS medium_complexity_files,
        COUNT(DISTINCT CASE WHEN f.complexity_score >= 20 THEN f.id END) AS high_complexity_files
    FROM 
        php_analysis.files f
        LEFT JOIN (
            SELECT 
                file_id, 
                COUNT(*) AS issues_count
            FROM 
                php_analysis.alerts
            WHERE 
                created_at > CURRENT_DATE - INTERVAL '1 day' * time_range_days
            GROUP BY 
                file_id
        ) a ON f.id = a.file_id
    WHERE 
        f.analyzed_at > CURRENT_DATE - INTERVAL '1 day' * time_range_days;
END;
$$;

-- Accorder des droits d'exécution sur les fonctions
GRANT EXECUTE ON FUNCTION get_anonymous_metrics TO anonymous, dashboard_viewer, php_analyst;
GRANT EXECUTE ON FUNCTION get_php_analysis_trends TO anonymous, dashboard_viewer, php_analyst;
GRANT EXECUTE ON FUNCTION get_php_analysis_stats TO anonymous, dashboard_viewer, php_analyst;

-- Index pour améliorer les performances
CREATE INDEX idx_files_analyzed_at ON php_analysis.files(analyzed_at);
CREATE INDEX idx_files_complexity ON php_analysis.files(complexity_score);
CREATE INDEX idx_alerts_created_at ON php_analysis.alerts(created_at);
CREATE INDEX idx_metrics_type ON php_analysis.metrics(metric_type);
CREATE INDEX idx_functions_complexity ON php_analysis.functions(complexity);