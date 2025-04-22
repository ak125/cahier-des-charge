-- migration_checklist.sql
-- Checklist automatisée pour vérifier les anomalies potentielles lors de la migration MySQL vers PostgreSQL
-- Date: 2025-04-13

-- Configuration
\set ON_ERROR_STOP on
\timing

-- Fonction helper pour afficher les résultats avec formatage
CREATE OR REPLACE FUNCTION print_report(title text, query text) RETURNS void AS $$
DECLARE
    result_record record;
    row_count integer := 0;
    query_result text;
BEGIN
    RAISE NOTICE '----------------------------------------------';
    RAISE NOTICE '% :', title;
    RAISE NOTICE '----------------------------------------------';
    
    FOR result_record IN EXECUTE query LOOP
        row_count := row_count + 1;
        query_result := '';
        FOR i IN 1..json_object_keys(row_to_json(result_record))::integer LOOP
            query_result := query_result || result_record::text;
        END LOOP;
        RAISE NOTICE '%', query_result;
        
        IF row_count >= 10 THEN
            RAISE NOTICE '... (et plus de résultats)';
            EXIT;
        END IF;
    END LOOP;
    
    IF row_count = 0 THEN
        RAISE NOTICE 'Aucun problème détecté ✓';
    END IF;
    
    RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- 1. Vérification des tables sans clés primaires
SELECT print_report('Tables sans clés primaires', $$
    SELECT t.table_name
    FROM information_schema.tables t
    LEFT JOIN information_schema.table_constraints tc 
        ON tc.table_name = t.table_name 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = t.table_schema
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND tc.constraint_name IS NULL
    ORDER BY t.table_name;
$$);

-- 2. Vérification des colonnes avec types de données potentiellement incompatibles
SELECT print_report('Colonnes avec types potentiellement problématiques', $$
    SELECT 
        table_name,
        column_name,
        data_type,
        CASE 
            WHEN data_type = 'character varying' AND character_maximum_length > 10485760 THEN 'Longueur excessive'
            WHEN data_type = 'numeric' AND (numeric_precision > 1000 OR numeric_scale > 1000) THEN 'Précision/échelle excessive'
            WHEN data_type = 'bit varying' THEN 'Type bit rarely used'
            WHEN data_type = 'USER-DEFINED' THEN 'Type personnalisé potentiellement incompatible'
            ELSE NULL
        END AS warning
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND CASE 
        WHEN data_type = 'character varying' AND character_maximum_length > 10485760 THEN true
        WHEN data_type = 'numeric' AND (numeric_precision > 1000 OR numeric_scale > 1000) THEN true
        WHEN data_type = 'bit varying' THEN true
        WHEN data_type = 'USER-DEFINED' THEN true
        ELSE false
    END
    ORDER BY table_name, column_name;
$$);

-- 3. Vérification des contraintes d'unicité sans index
SELECT print_report('Contraintes d''unicité sans index', $$
    SELECT 
        tc.table_name, 
        tc.constraint_name
    FROM information_schema.table_constraints tc
    LEFT JOIN pg_indexes idx ON 
        idx.tablename = tc.table_name AND 
        idx.indexname = tc.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
    AND idx.indexname IS NULL
    ORDER BY tc.table_name;
$$);

-- 4. Vérification des clés étrangères qui pourraient être problématiques
SELECT print_report('Clés étrangères potentiellement problématiques', $$
    SELECT
        kcu1.table_name AS table_name,
        kcu1.column_name AS column_name,
        kcu2.table_name AS referenced_table,
        kcu2.column_name AS referenced_column
    FROM 
        information_schema.referential_constraints AS rc
    JOIN 
        information_schema.key_column_usage AS kcu1
        ON kcu1.constraint_catalog = rc.constraint_catalog
        AND kcu1.constraint_schema = rc.constraint_schema
        AND kcu1.constraint_name = rc.constraint_name
    JOIN 
        information_schema.key_column_usage AS kcu2
        ON kcu2.constraint_catalog = rc.unique_constraint_catalog
        AND kcu2.constraint_schema = rc.unique_constraint_schema
        AND kcu2.constraint_name = rc.unique_constraint_name
        AND kcu2.ordinal_position = kcu1.ordinal_position
    JOIN
        information_schema.columns AS c1
        ON c1.table_schema = kcu1.table_schema
        AND c1.table_name = kcu1.table_name
        AND c1.column_name = kcu1.column_name
    JOIN
        information_schema.columns AS c2
        ON c2.table_schema = kcu2.table_schema
        AND c2.table_name = kcu2.table_name
        AND c2.column_name = kcu2.column_name
    WHERE 
        rc.constraint_schema = 'public'
        AND (
            c1.data_type != c2.data_type
            OR (c1.data_type = c2.data_type AND 
                (c1.character_maximum_length != c2.character_maximum_length OR
                 c1.numeric_precision != c2.numeric_precision OR
                 c1.numeric_scale != c2.numeric_scale)
               )
        )
    ORDER BY kcu1.table_name, kcu1.column_name;
$$);

-- 5. Vérification des index manquants sur clés étrangères
SELECT print_report('Clés étrangères sans index', $$
    SELECT
        tc.table_name,
        kcu.column_name
    FROM 
        information_schema.table_constraints tc
    JOIN 
        information_schema.key_column_usage kcu ON
        tc.constraint_name = kcu.constraint_name AND
        tc.table_schema = kcu.table_schema
    LEFT JOIN 
        pg_indexes idx ON 
        idx.tablename = tc.table_name AND 
        idx.indexdef LIKE '%' || kcu.column_name || '%'
    WHERE 
        tc.constraint_type = 'FOREIGN KEY' AND
        tc.table_schema = 'public' AND
        idx.indexname IS NULL
    ORDER BY tc.table_name, kcu.column_name;
$$);

-- 6. Vérification des champs TEXT sans contrainte de longueur
SELECT print_report('Champs TEXT sans contrainte de longueur', $$
    SELECT 
        table_name,
        column_name
    FROM 
        information_schema.columns
    WHERE 
        table_schema = 'public' AND
        data_type = 'text' AND
        character_maximum_length IS NULL
    ORDER BY table_name, column_name;
$$);

-- 7. Vérification des valeurs NULL dans les champs qui devraient être NOT NULL
SELECT print_report('Tables avec potentiel de données NULL dans colonnes importantes', $$
    SELECT DISTINCT
        c.table_name,
        c.column_name
    FROM 
        information_schema.columns c
    WHERE 
        c.table_schema = 'public' AND
        c.is_nullable = 'YES' AND
        (c.column_name LIKE '%id' OR
         c.column_name LIKE '%code' OR
         c.column_name LIKE '%key' OR
         c.column_name = 'slug' OR
         c.column_name = 'name')
    ORDER BY c.table_name, c.column_name;
$$);

-- 8. Vérification des séquences pour colonnes d'auto-incrémentation
SELECT print_report('Vérification des séquences pour colonnes auto-incrémentation', $$
    SELECT 
        t.tablename AS table_name,
        a.attname AS column_name,
        pg_get_serial_sequence(t.tablename, a.attname) AS sequence_name
    FROM 
        pg_catalog.pg_attribute a
    JOIN 
        pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN 
        pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN 
        pg_tables t ON t.schemaname = n.nspname AND t.tablename = c.relname
    WHERE 
        n.nspname = 'public' AND
        a.attnum > 0 AND
        NOT a.attisdropped AND
        a.attidentity = 'a' AND
        pg_get_serial_sequence(t.tablename, a.attname) IS NULL
    ORDER BY t.tablename, a.attname;
$$);

-- 9. Vérification des longues chaînes en colonnes indexées
SELECT print_report('Colonnes indexées avec longues chaînes', $$
    SELECT 
        t.tablename AS table_name,
        a.attname AS column_name,
        format_type(a.atttypid, a.atttypmod) AS data_type
    FROM 
        pg_catalog.pg_attribute a
    JOIN 
        pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN 
        pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN 
        pg_tables t ON t.schemaname = n.nspname AND t.tablename = c.relname
    JOIN 
        pg_indexes i ON i.tablename = t.tablename
    JOIN 
        pg_index idx ON idx.indexrelid = i.indexrelid::regclass::oid
    WHERE 
        n.nspname = 'public' AND
        format_type(a.atttypid, a.atttypmod) LIKE '%char%' AND
        (a.atttypmod > 260 OR a.atttypmod = -1) AND
        (idx.indkey @> ARRAY[a.attnum] OR
         idx.indkey[0] = a.attnum OR
         idx.indkey[1] = a.attnum)
    ORDER BY t.tablename, a.attname;
$$);

-- 10. Recherche des tables avec beaucoup de colonnes (plus de 50)
SELECT print_report('Tables avec beaucoup de colonnes (> 50)', $$
    SELECT 
        table_name,
        COUNT(*) AS column_count
    FROM 
        information_schema.columns
    WHERE 
        table_schema = 'public'
    GROUP BY 
        table_name
    HAVING 
        COUNT(*) > 50
    ORDER BY 
        COUNT(*) DESC;
$$);

-- 11. Problèmes de collation
SELECT print_report('Colonnes avec collations différentes', $$
    SELECT DISTINCT
        c1.table_name,
        c1.column_name,
        c1.collation_name
    FROM 
        information_schema.columns c1
    JOIN 
        information_schema.columns c2 
        ON c1.table_schema = c2.table_schema
        AND c1.data_type = c2.data_type
        AND c1.collation_name IS NOT NULL
        AND c2.collation_name IS NOT NULL
        AND c1.collation_name != c2.collation_name
    WHERE 
        c1.table_schema = 'public'
    ORDER BY 
        c1.table_name, c1.column_name;
$$);

-- 12. Tables sans commentaires (pour documentation)
SELECT print_report('Tables sans commentaires', $$
    SELECT 
        t.table_name
    FROM 
        information_schema.tables t
    LEFT JOIN 
        pg_description d ON d.objoid = (
            'public.' || t.table_name)::regclass::oid 
            AND d.objsubid = 0
    WHERE 
        t.table_schema = 'public' AND
        t.table_type = 'BASE TABLE' AND
        d.description IS NULL
    ORDER BY 
        t.table_name;
$$);

-- Rapport final
DO $$
BEGIN
    RAISE NOTICE '======================================================';
    RAISE NOTICE 'RAPPORT DE VÉRIFICATION MIGRATION MYSQL -> POSTGRESQL';
    RAISE NOTICE '======================================================';
    RAISE NOTICE 'Date d''exécution: %', NOW();
    RAISE NOTICE '';
    RAISE NOTICE 'Vérifiez les résultats ci-dessus et corrigez les problèmes potentiels';
    RAISE NOTICE 'avant de finaliser la migration vers Prisma et la génération';
    RAISE NOTICE 'de code pour NestJS et Remix.';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour résoudre les problèmes, considérez:';
    RAISE NOTICE '1. Ajouter des clés primaires aux tables qui n''en ont pas';
    RAISE NOTICE '2. Ajuster les types de données incompatibles';
    RAISE NOTICE '3. Ajouter des index aux clés étrangères';
    RAISE NOTICE '4. Ajouter des contraintes NOT NULL aux colonnes importantes';
    RAISE NOTICE '5. Remplacer les TEXT par VARCHAR avec limites appropriées';
    RAISE NOTICE '6. Vérifier les séquences d''auto-incrément';
    RAISE NOTICE '7. Ajouter des commentaires pour la documentation';
    RAISE NOTICE '======================================================';
END $$;