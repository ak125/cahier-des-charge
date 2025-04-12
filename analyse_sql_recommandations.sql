-- ANALYSE SQL & RECOMMANDATIONS POUR OPTIMISATION
-- Agent 8 - Optimiseur SQL & Performances Prisma/PostgreSQL
-- Date de génération: 2025-04-12

-- 1. ANALYSE DES INDEX MANQUANTS
-- Cette requête identifie les tables sans index ou avec des clauses WHERE fréquentes sans index
WITH table_scans AS (
    SELECT relid,
           schemaname || '.' || relname AS relation,
           seq_scan,
           seq_tup_read,
           idx_scan,
           seq_tup_read / GREATEST(seq_scan, 1) AS avg_seq_tuples_per_scan
    FROM pg_stat_user_tables
    WHERE seq_scan > 0
),
index_usage AS (
    SELECT schemaname || '.' || relname AS relation,
           indexrelname,
           idx_scan,
           idx_tup_read,
           idx_tup_read / GREATEST(idx_scan, 1) AS avg_idx_tuples_per_scan
    FROM pg_stat_user_indexes
    WHERE idx_scan > 0
)
SELECT ts.relation,
       ts.seq_scan,
       ts.seq_tup_read,
       ts.avg_seq_tuples_per_scan,
       ts.idx_scan,
       CASE
           WHEN ts.seq_scan > 10 AND (ts.seq_scan::float / (ts.seq_scan + ts.idx_scan)) > 0.3
               THEN 'Possible table scan issue, investigate indexing'
           ELSE 'No indexing issue detected'
       END AS index_recommendation
FROM table_scans ts
ORDER BY ts.seq_tup_read DESC
LIMIT 20;

-- 2. IDENTIFIER LES COLONNES REDONDANTES OU INUTILISÉES
-- Cette requête recherche des colonnes potentiellement inutilisées ou redondantes
-- Note: À adapter selon la structure spécifique de votre application
SELECT
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    pg_catalog.col_description(format('%I.%I', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as column_comment,
    -- Comptabilisation des valeurs NULL
    format('SELECT COUNT(*) FROM %I.%I WHERE %I IS NULL', c.table_schema, c.table_name, c.column_name) AS check_null_query,
    format('SELECT COUNT(DISTINCT %I) FROM %I.%I', c.column_name, c.table_schema, c.table_name) AS check_distinct_values_query,
    'SELECT pg_size_pretty(pg_column_size(' || c.column_name || ')) FROM ' || c.table_schema || '.' || c.table_name || ' LIMIT 1' AS column_size_query
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE 
    t.table_type = 'BASE TABLE'
    AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY c.table_schema, c.table_name, c.ordinal_position;

-- 3. RECOMMANDATIONS DE PARTITIONNEMENT
-- Détection des tables candidates pour le partitionnement
SELECT 
    relname AS table_name,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(C.oid)) AS total_size,
    CASE 
        WHEN n_live_tup > 10000000 THEN 'PARTITION BY RANGE (date_column) - Table très volumineuse'
        WHEN n_live_tup > 5000000 THEN 'PARTITION BY RANGE (date_column) - Table volumineuse'
        WHEN relname LIKE '%log%' THEN 'PARTITION BY RANGE (created_at)'
        WHEN relname LIKE '%hist%' THEN 'PARTITION BY RANGE (date_column)'
        WHEN relname LIKE '%archive%' THEN 'PARTITION BY RANGE (date_column)'
        WHEN relname LIKE '%_20%' THEN 'Considérer une restructuration avec PARTITION BY RANGE (année)'
        ELSE 'Pas de partitionnement recommandé'
    END AS partition_recommendation
FROM 
    pg_class C
    LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
WHERE 
    nspname NOT IN ('pg_catalog', 'information_schema')
    AND C.relkind = 'r'
    AND nspname !~ '^pg_toast'
ORDER BY n_live_tup DESC;

-- 4. ANALYSE DE L'ALIGNEMENT DES TYPES ENTRE PRISMA ET POSTGRESQL
-- Recherche des incohérences de typage courantes
SELECT
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    CASE
        WHEN c.data_type = 'character varying' AND c.character_maximum_length IS NULL THEN 'RISQUE: VARCHAR sans limite - définir @db.VarChar(n) dans Prisma'
        WHEN c.data_type = 'character varying' AND c.character_maximum_length > 255 THEN 'CONSIDÉRER: @db.Text pour Prisma au lieu de String'
        WHEN c.data_type = 'double precision' AND c.column_name LIKE '%price%' THEN 'REMPLACER: Float par Decimal dans Prisma'
        WHEN c.data_type = 'double precision' AND c.column_name LIKE '%montant%' THEN 'REMPLACER: Float par Decimal dans Prisma'
        WHEN c.data_type = 'double precision' AND c.column_name LIKE '%amount%' THEN 'REMPLACER: Float par Decimal dans Prisma'
        WHEN c.data_type = 'timestamp without time zone' THEN 'VÉRIFIER: Utilisation correcte de @db.Timestamp() dans Prisma'
        WHEN c.data_type = 'boolean' AND c.column_name LIKE 'is_%' THEN 'OK: Boolean dans Prisma'
        WHEN c.data_type = 'text' AND c.column_name LIKE '%description%' THEN 'OK: @db.Text dans Prisma'
        WHEN c.data_type = 'text' AND c.column_name LIKE '%contenu%' THEN 'OK: @db.Text dans Prisma'
        WHEN c.data_type = 'text' AND c.column_name LIKE '%content%' THEN 'OK: @db.Text dans Prisma'
        WHEN c.data_type = 'json' THEN 'CONSIDÉRER: Prisma Json ou JsonValue'
        WHEN c.data_type = 'jsonb' THEN 'CONSIDÉRER: Prisma Json avec @db.JsonB'
        ELSE 'OK'
    END AS prisma_recommendation
FROM
    information_schema.columns c
JOIN
    information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE
    t.table_type = 'BASE TABLE'
    AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    c.table_schema,
    c.table_name,
    c.ordinal_position;

-- 5. IDENTIFICATION DES OPPORTUNITÉS POUR DES VUES MATÉRIALISÉES
SELECT
    s.schemaname,
    s.relname AS table_name,
    s.seq_scan,
    s.seq_tup_read,
    s.idx_scan,
    s.idx_tup_fetch,
    pg_size_pretty(pg_relation_size('"' || s.schemaname || '"."' || s.relname || '"')) AS table_size,
    CASE
        WHEN s.seq_scan > 10 AND s.idx_scan < s.seq_scan * 0.1 AND pg_relation_size('"' || s.schemaname || '"."' || s.relname || '"') > 100000000 THEN 'Vue matérialisée fortement recommandée'
        WHEN s.seq_scan > 5 AND s.idx_scan < s.seq_scan * 0.3 AND pg_relation_size('"' || s.schemaname || '"."' || s.relname || '"') > 50000000 THEN 'Vue matérialisée recommandée'
        WHEN s.relname LIKE '%_report%' OR s.relname LIKE '%_stat%' OR s.relname LIKE '%_summary%' THEN 'Candidat pour vue matérialisée (par nomenclature)'
        ELSE 'Pas de vue matérialisée nécessaire'
    END AS materialized_view_recommendation
FROM pg_stat_user_tables s
WHERE s.schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY s.seq_scan DESC;

-- 6. PLAN EXPLAIN VISUALIZER POUR REQUÊTES CRITIQUES
-- Exemple de requête à analyser
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM example_table WHERE complex_condition;
-- Note: Remplacer la requête ci-dessus par vos requêtes critiques identifiées