-- Script SQL de secours pour la migration MySQL → PostgreSQL
-- À utiliser si la migration via Navicat échoue
-- Ce script effectue les conversions manuelles des types problématiques

-- 1. Configuration initiale PostgreSQL
SET client_encoding = 'UTF8';
BEGIN;

-- 2. Fonctions utilitaires pour la conversion

-- Fonction pour gérer les valeurs de date/heure invalides
CREATE OR REPLACE FUNCTION handle_invalid_dates(input_date text) RETURNS timestamp AS $$
BEGIN
    -- Si la date est 0000-00-00 ou similaire, retourner NULL
    IF input_date ~ '^0000-00-00' THEN
        RETURN NULL;
    ELSE
        -- Sinon essayer de convertir, avec NULL en cas d'échec
        BEGIN
            RETURN input_date::timestamp;
        EXCEPTION WHEN OTHERS THEN
            RETURN NULL;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour convertir tinyint(1) en boolean
CREATE OR REPLACE FUNCTION tinyint_to_boolean(value integer) RETURNS boolean AS $$
BEGIN
    RETURN CASE WHEN value = 0 THEN FALSE ELSE TRUE END;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer les types ENUM si nécessaire
-- Remplacez ces exemples par vos propres types ENUM

-- Exemple : Status d'une commande
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
    END IF;
END$$;

-- Exemple : Rôle utilisateur
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
    END IF;
END$$;

-- 4. Scripts de création de tables
-- Remplacez ces exemples par vos propres tables en adaptant les types

-- Exemple : Table users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user', 'guest')), -- Alternative à ENUM
    is_active BOOLEAN DEFAULT TRUE,                        -- Conversion de tinyint(1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exemple : Table products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    tags TEXT[], -- Type tableau PostgreSQL (peut stocker les valeurs SET de MySQL)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exemple : Table orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')), -- Alternative à ENUM
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address TEXT,
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Migration des données
-- Utilisez des instructions INSERT INTO ... SELECT avec des conversions explicites

-- Exemple : Migration de users
-- INSERT INTO users (id, username, email, password_hash, role, is_active, created_at, updated_at)
-- SELECT 
--     id, 
--     username, 
--     email, 
--     password_hash, 
--     CASE role_enum 
--         WHEN 1 THEN 'admin' 
--         WHEN 2 THEN 'user' 
--         ELSE 'guest' 
--     END, 
--     tinyint_to_boolean(is_active), 
--     handle_invalid_dates(created_at::text), 
--     handle_invalid_dates(updated_at::text)
-- FROM mysql_users_temp;

-- 6. Correction des séquences
-- Pour chaque table avec une colonne SERIAL, réinitialisez la séquence

-- Exemple : Réinitialiser la séquence pour la table users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products), true);
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders), true);

-- 7. Création des index manquants

-- Exemple : Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 8. Ajout des contraintes d'intégrité supplémentaires

-- Exemple : Contrainte CHECK
ALTER TABLE products 
ADD CONSTRAINT check_price_positive CHECK (price > 0);

-- 9. Conversion des procédures stockées et des triggers
-- Les procédures stockées et triggers MySQL devront être réécrits en PL/pgSQL

-- Exemple de fonction PostgreSQL
-- CREATE OR REPLACE FUNCTION update_product_stock() RETURNS TRIGGER AS $$
-- BEGIN
--     -- Logique pour mettre à jour le stock
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- CREATE TRIGGER product_stock_update
-- BEFORE UPDATE ON products
-- FOR EACH ROW
-- EXECUTE FUNCTION update_product_stock();

-- 10. Validation finale
ANALYZE;

COMMIT;

-- Instructions pour la correction des problèmes courants après migration:
/*
-- En cas d'erreur de type 'invalid date/time value', exécutez:
UPDATE table_name SET date_column = NULL WHERE date_column::text = '0000-00-00 00:00:00';

-- Pour corriger les séquences auto-increment:
SELECT setval('table_name_id_seq', (SELECT MAX(id) FROM table_name), true);

-- Pour gérer les chaînes UTF-8 problématiques:
UPDATE table_name SET text_column = regexp_replace(text_column, '[^\x01-\x7F]', '', 'g') 
WHERE text_column ~ '[^\x01-\x7F]';
*/