-- Configuration de la table d'audit PHP avec Row Level Security
-- À exécuter dans la console SQL de Supabase

-- Création de la table si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.php_audit_results (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    filename TEXT NOT NULL,
    result_json JSONB NOT NULL,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    file_size INTEGER,
    lines_of_code INTEGER,
    classes_count INTEGER,
    functions_count INTEGER,
    complexity INTEGER,
    maintainability INTEGER,
    issues_count INTEGER,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    created_by UUID REFERENCES auth.users(id)
);

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS php_audit_results_filename_idx ON public.php_audit_results(filename);
CREATE INDEX IF NOT EXISTS php_audit_results_analyzed_at_idx ON public.php_audit_results(analyzed_at);
CREATE INDEX IF NOT EXISTS php_audit_results_complexity_idx ON public.php_audit_results(complexity);
CREATE INDEX IF NOT EXISTS php_audit_results_issues_count_idx ON public.php_audit_results(issues_count);
CREATE INDEX IF NOT EXISTS php_audit_results_tags_idx ON public.php_audit_results USING GIN (tags);

-- Activer Row Level Security
ALTER TABLE public.php_audit_results ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (accès complet)
CREATE POLICY "Admins have full access to PHP audit results" 
ON public.php_audit_results
FOR ALL 
TO authenticated
USING (
    auth.uid() IN (
        SELECT auth.uid() FROM auth.users 
        WHERE auth.email() IN (SELECT jsonb_array_elements_text(current_setting('app.admin_emails', TRUE)::jsonb))
    )
);

-- Politique pour les utilisateurs authentifiés (lecture seule)
CREATE POLICY "Authenticated users can read PHP audit results" 
ON public.php_audit_results
FOR SELECT 
TO authenticated
USING (TRUE);

-- Politique pour les systèmes automatisés (API, CI/CD, agents MCP)
CREATE POLICY "Service accounts can insert and update PHP audit results" 
ON public.php_audit_results
FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT auth.uid() FROM auth.users 
        WHERE auth.email() IN (SELECT jsonb_array_elements_text(current_setting('app.service_account_emails', TRUE)::jsonb))
    )
);

-- Création d'une fonction pour filtrer les résultats d'audit par niveau de complexité
CREATE OR REPLACE FUNCTION public.get_complex_php_files(complexity_threshold INTEGER DEFAULT 10)
RETURNS SETOF public.php_audit_results
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.php_audit_results
    WHERE complexity >= complexity_threshold
    ORDER BY complexity DESC, issues_count DESC;
$$;

-- Création d'une vue pour les fichiers à haut risque (complexité élevée et nombreux problèmes)
CREATE OR REPLACE VIEW public.high_risk_php_files AS
SELECT 
    id,
    path,
    filename,
    complexity,
    maintainability,
    issues_count,
    lines_of_code,
    analyzed_at,
    tags
FROM 
    public.php_audit_results
WHERE 
    (complexity > 15 OR issues_count > 10) 
    AND maintainability < 65
ORDER BY 
    complexity DESC, 
    issues_count DESC;

-- Configuration des paramètres d'application
-- À exécuter dans la console SQL de Supabase avec les valeurs appropriées
-- ALTER DATABASE postgres SET "app.admin_emails" TO '["admin@example.com", "tech-lead@example.com"]';
-- ALTER DATABASE postgres SET "app.service_account_emails" TO '["ci-bot@example.com", "mcp-service@example.com"]';

-- Commentaires sur la table et les colonnes pour la documentation
COMMENT ON TABLE public.php_audit_results IS 'Résultats d''analyse statique de fichiers PHP par le MCP PHP Analyzer';
COMMENT ON COLUMN public.php_audit_results.id IS 'Identifiant unique au format "php:<chemin_relatif>"';
COMMENT ON COLUMN public.php_audit_results.complexity IS 'Complexité cyclomatique du fichier (plus la valeur est élevée, plus le code est complexe)';
COMMENT ON COLUMN public.php_audit_results.maintainability IS 'Indice de maintenabilité (0-100, plus la valeur est élevée, plus le code est facile à maintenir)';
COMMENT ON COLUMN public.php_audit_results.tags IS 'Tags de catégorisation du fichier (ex: controller, model, service)';