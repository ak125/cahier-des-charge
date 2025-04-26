-- ===============================================================
-- SQL Index Suggestions - Générées automatiquement le 12 avril 2025
-- ===============================================================
-- 
-- Ce script contient les suggestions d'index pour optimiser 
-- les performances de la base de données avant ou après la migration.
-- 
-- INSTRUCTIONS:
-- 1. Vérifiez chaque index proposé avant de l'appliquer
-- 2. Testez l'impact sur les performances avec EXPLAIN ANALYZE
-- 3. Appliquez progressivement ces changements en surveillant les performances
-- 4. Attention aux index sur les tables volumineuses (analyser l'impact)
-- 
-- ===============================================================

-- -------------------------
-- CORRECTION DES INDEX MANQUANTS SUR LES CLÉS ÉTRANGÈRES
-- -------------------------

-- Index manquant sur order_items.product_id (HAUTE PRIORITÉ)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items (product_id);

-- Index manquant sur profiles.user_id (PRIORITÉ MOYENNE)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles (user_id);

-- Index manquant sur product_categories.product_id (HAUTE PRIORITÉ)
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id 
ON product_categories (product_id);

-- Index manquant sur product_categories.category_id (PRIORITÉ MOYENNE)
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id 
ON product_categories (category_id);

-- -------------------------
-- OPTIMISATION DES INDEX DE FILTRAGE
-- -------------------------

-- Index sur le statut des produits (utilisé dans de nombreuses requêtes)
CREATE INDEX IF NOT EXISTS idx_products_status 
ON products (status);

-- Index sur le statut des commandes (utilisé pour le filtrage)
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders (status);

-- Index composite pour les recherches de session par utilisateur et expiration
DROP INDEX IF EXISTS idx_session_expiry; -- Remplacer l'index simple
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires 
ON sessions (user_id, expires_at);

-- Index pour les recherches de produits par nom (PRIORITÉ MOYENNE)
CREATE INDEX IF NOT EXISTS idx_products_name 
ON products (name);

-- -------------------------
-- INDEX SPÉCIALISÉS POUR POSTGRESQL
-- -------------------------

-- Index GIN pour la recherche full-text dans les descriptions de produits
CREATE INDEX IF NOT EXISTS idx_products_description_gin 
ON products USING GIN (to_tsvector('french', description));

-- Index GIN pour les requêtes sur les champs JSON
CREATE INDEX IF NOT EXISTS idx_users_settings_gin 
ON users USING GIN (settings jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_metadata_gin 
ON profiles USING GIN (metadata jsonb_path_ops);

-- Index GiST pour les recherches hiérarchiques dans les catégories
CREATE INDEX IF NOT EXISTS idx_categories_path_gist 
ON categories USING GIST (path);

-- Index GiST pour les requêtes géospatiales
CREATE INDEX IF NOT EXISTS idx_locations_coordinates_gist 
ON locations USING GIST (coordinates);

-- -------------------------
-- SUPPRESSION DES INDEX REDONDANTS
-- -------------------------

-- Suppression des index redondants sur users.email
DROP INDEX IF EXISTS idx_users_email;
-- Conserver uniquement idx_users_email_username

-- -------------------------
-- OPTIMISATION DES GRANDES TABLES
-- -------------------------

-- Partitionnement de la table log_entries par mois (après migration vers PostgreSQL)
-- ATTENTION: Ceci est une recommandation à implémenter manuellement
-- CREATE TABLE log_entries_partitioned (
--     id SERIAL PRIMARY KEY,
--     created_at TIMESTAMP WITH TIME ZONE NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     message TEXT NOT NULL,
--     context JSONB,
--     user_id UUID
-- ) PARTITION BY RANGE (created_at);
-- 
-- CREATE TABLE log_entries_y2025m04 PARTITION OF log_entries_partitioned
--     FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
-- 
-- CREATE TABLE log_entries_y2025m05 PARTITION OF log_entries_partitioned
--     FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

-- -------------------------
-- AJOUT DES CONTRAINTES MANQUANTES
-- -------------------------

-- Contrainte CHECK sur le prix des produits
ALTER TABLE products 
ADD CONSTRAINT chk_products_price_positive 
CHECK (price > 0);

-- Contrainte CHECK sur le montant total des commandes
ALTER TABLE orders 
ADD CONSTRAINT chk_orders_total_amount_positive 
CHECK (total_amount >= 0);

-- Contrainte CHECK sur le statut utilisateur (si pas d'enum)
ALTER TABLE users 
ADD CONSTRAINT chk_users_status_valid 
CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'));

-- -------------------------
-- OPTIMISATIONS DE PARTITIONNEMENT
-- -------------------------

-- RECOMMANDATION: Partitionner les tables d'audit par intervalle de temps
-- RECOMMANDATION: Partitionner les tables de log par niveau de sévérité
-- RECOMMANDATION: Partitionner les grandes tables d'historique par date

-- -------------------------
-- MESURES DE PERFORMANCE
-- -------------------------

-- Avant d'appliquer ces index, collectez des métriques de référence:
-- 
-- 1. EXPLAIN ANALYZE SELECT * FROM products WHERE status = 'ACTIVE';
-- 2. EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = '123' AND status = 'PENDING';
-- 3. EXPLAIN ANALYZE SELECT * FROM order_items JOIN products ON order_items.product_id = products.id;
--
-- Après avoir appliqué les index, exécutez les mêmes requêtes pour mesurer l'amélioration.