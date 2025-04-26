-- INDEX_SUGGESTIONS.SQL
-- Agent 8 - Optimiseur SQL & Performances Prisma/PostgreSQL
-- Date de génération: 2025-04-12

-- =========================================================
-- RECOMMANDATIONS D'INDEX STRATÉGIQUES POUR POSTGRESQL
-- =========================================================

-- -------------------------
-- 1. INDEX SIMPLES
-- -------------------------

-- Tables de commande - Optimisation des recherches par client et date
CREATE INDEX IF NOT EXISTS idx_commandes_client_id ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_date ON commandes(date_commande);

-- Tables de produits - Optimisation des recherches par catégorie et par nom
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_produits_nom ON produits USING gin (nom gin_trgm_ops);

-- Tables utilisateurs - Optimisation des recherches par email (authentification)
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);

-- Tables de journalisation - Optimisation par date (pour faciliter le partitionnement)
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(created_at);

-- -------------------------
-- 2. INDEX COMPOSITES
-- -------------------------

-- Optimisation des jointures commandes-lignes de commande
CREATE INDEX IF NOT EXISTS idx_lignes_commande_ordre ON lignes_commande(commande_id, produit_id);

-- Optimisation des recherches de produits par catégorie+prix (filtres combinés)
CREATE INDEX IF NOT EXISTS idx_produits_cat_prix ON produits(categorie_id, prix);

-- Optimisation des requêtes sur les utilisateurs par rôle et statut
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role_statut ON utilisateurs(role, is_active);

-- -------------------------
-- 3. INDEX PARTIELS
-- -------------------------

-- Optimisation des recherches de commandes actives uniquement
CREATE INDEX IF NOT EXISTS idx_commandes_actives ON commandes(date_commande)
WHERE statut != 'annulée';

-- Optimisation des recherches des produits en stock
CREATE INDEX IF NOT EXISTS idx_produits_en_stock ON produits(id)
WHERE quantite_stock > 0;

-- Optimisation des recherches sur utilisateurs actifs
CREATE INDEX IF NOT EXISTS idx_utilisateurs_actifs ON utilisateurs(last_login)
WHERE is_active = TRUE;

-- -------------------------
-- 4. INDEX FONCTIONNELS
-- -------------------------

-- Recherche insensible à la casse sur les noms de produits
CREATE INDEX IF NOT EXISTS idx_produits_nom_lower ON produits(LOWER(nom));

-- Recherche par année et mois de commande
CREATE INDEX IF NOT EXISTS idx_commandes_annee_mois ON commandes(EXTRACT(YEAR FROM date_commande), EXTRACT(MONTH FROM date_commande));

-- Optimisation de recherche sur des JSON
CREATE INDEX IF NOT EXISTS idx_utilisateurs_preferences ON utilisateurs((preferences->>'theme'));

-- -------------------------
-- 5. INDEX TEXTUELS
-- -------------------------

-- Recherche full-text sur les descriptions de produits
CREATE INDEX IF NOT EXISTS idx_produits_desc_fulltext ON produits USING GIN (to_tsvector('french', description));

-- Recherche full-text sur les commentaires
CREATE INDEX IF NOT EXISTS idx_commentaires_fulltext ON commentaires USING GIN (to_tsvector('french', contenu));

-- -------------------------
-- 6. INDEX SPATIAUX
-- -------------------------

-- Si extension PostGIS est activée
-- CREATE INDEX IF NOT EXISTS idx_adresses_localisation ON adresses USING GIST (localisation);

-- -------------------------
-- NOTES D'UTILISATION:
-- -------------------------
-- 1. Exécuter ANALYZE sur les tables après la création des index
-- 2. Vérifier l'utilisation des index avec:
--    SELECT * FROM pg_stat_user_indexes;
-- 3. Supprimer les index non utilisés après observation:
--    DROP INDEX IF EXISTS nom_index_non_utilise;
-- -------------------------

-- IMPORTANT: Adapter les noms de tables et de colonnes à votre schéma réel
-- Exécuter ces commandes sur une base de test avant de les appliquer en production