# Notes d'Optimisation du Schéma PostgreSQL/Prisma

**Date :** 12 avril 2025  
**Auteur :** Agent 8 - Optimiseur SQL & Performances

## Alignement de Types entre Prisma et PostgreSQL

Le passage de MySQL à PostgreSQL via Prisma nécessite une attention particulière à l'alignement des types. Ce document présente les bonnes pratiques et corrections recommandées.

### Types numériques

| Cas d'usage | Type MySQL | Type PostgreSQL à éviter | Type PostgreSQL recommandé | Type Prisma |
|-------------|------------|--------------------------|----------------------------|-------------|
| Montants financiers | FLOAT/DOUBLE | FLOAT/DOUBLE PRECISION | DECIMAL(10,2) | Decimal @db.Decimal(10,2) |
| Identifiants | INT AUTO_INCREMENT | SERIAL | BIGINT avec DEFAULT nextval | Int @id @default(autoincrement()) |
| Grandes quantités | BIGINT | NUMERIC sans précision | BIGINT ou NUMERIC(20,0) | BigInt |
| Pourcentages | FLOAT | FLOAT | NUMERIC(5,2) | Decimal @db.Decimal(5,2) |

⚠️ **Important** : Pour toutes les colonnes représentant des montants, prix, ou valeurs financières, toujours utiliser `Decimal` dans Prisma avec une précision définie. Jamais `Float`.

### Types textuels

| Cas d'usage | Type MySQL | Type PostgreSQL recommandé | Type Prisma |
|-------------|------------|----------------------------|-------------|
| Courts textes (<255) | VARCHAR(n) | VARCHAR(n) | String @db.VarChar(n) |
| Textes moyens | TEXT | VARCHAR(1000) | String @db.VarChar(1000) |
| Textes longs | LONGTEXT | TEXT | String @db.Text |
| Descriptions | TEXT | TEXT | String @db.Text |
| Identifiants uniques | VARCHAR(36) | UUID | String @db.Uuid |
| Énumérations | ENUM | ENUM ou VARCHAR avec contrainte | Enum |

⚠️ **Important** : Prisma par défaut utilise `TEXT` pour `String` ce qui peut être inefficace pour des colonnes courtes. Toujours spécifier `@db.VarChar(n)` quand approprié.

### Types temporels

| Cas d'usage | Type MySQL | Type PostgreSQL recommandé | Type Prisma |
|-------------|------------|----------------------------|-------------|
| Date seule | DATE | DATE | DateTime @db.Date |
| Date et heure | DATETIME | TIMESTAMP | DateTime @db.Timestamp() |
| Date et heure avec timezone | DATETIME | TIMESTAMPTZ | DateTime @db.Timestamptz |
| Heure seule | TIME | TIME | DateTime @db.Time |
| Intervalle | - | INTERVAL | Unsupported (raw query) |

⚠️ **Important** : PostgreSQL est plus strict sur les types temporels que MySQL. Si vous travaillez avec des fuseaux horaires, utilisez toujours `TIMESTAMPTZ`.

### Types JSON

| Cas d'usage | Type MySQL | Type PostgreSQL recommandé | Type Prisma |
|-------------|------------|----------------------------|-------------|
| Données structurées | JSON | JSONB | Json |
| Données avec index | JSON | JSONB + GIN index | Json |
| Métadonnées rarement requêtées | JSON | JSON | Json |

⚠️ **Important** : Préférez toujours `JSONB` à `JSON` dans PostgreSQL pour les performances. Créez des index GIN pour les champs JSON fréquemment requêtés.

## Vues Matérialisées Recommandées

PostgreSQL offre des vues matérialisées très puissantes qui peuvent grandement améliorer les performances pour les requêtes analytiques ou de rapports.

### Vue matérialisée pour les statistiques de ventes mensuelles

```sql
CREATE MATERIALIZED VIEW stats_ventes_mensuelles AS
SELECT
    DATE_TRUNC('month', c.date_commande) AS mois,
    COUNT(DISTINCT c.id) AS nombre_commandes,
    COUNT(DISTINCT c.client_id) AS nombre_clients,
    SUM(c.total) AS montant_total,
    AVG(c.total) AS panier_moyen
FROM
    commandes c
WHERE
    c.statut = 'validée'
GROUP BY
    DATE_TRUNC('month', c.date_commande)
WITH DATA;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX ON stats_ventes_mensuelles (mois);

-- Procédure de rafraîchissement
CREATE OR REPLACE PROCEDURE refresh_stats_ventes_mensuelles()
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY stats_ventes_mensuelles;
END;
$$;
```

### Vue matérialisée pour le tableau de bord des utilisateurs

```sql
CREATE MATERIALIZED VIEW dashboard_utilisateurs AS
SELECT
    u.id,
    u.nom,
    u.email,
    u.date_inscription,
    (SELECT COUNT(*) FROM commandes c WHERE c.client_id = u.id) AS total_commandes,
    (SELECT SUM(total) FROM commandes c WHERE c.client_id = u.id) AS montant_total_achats,
    (SELECT MAX(date_commande) FROM commandes c WHERE c.client_id = u.id) AS derniere_commande
FROM
    utilisateurs u
WITH DATA;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX ON dashboard_utilisateurs (id);
```

## Recommandations de Schémas PostgreSQL

Pour une organisation optimale, nous recommandons la création des schémas suivants:

```sql
-- Schéma principal pour les données métier
CREATE SCHEMA IF NOT EXISTS public;

-- Schéma pour les tables techniques
CREATE SCHEMA IF NOT EXISTS technical;

-- Schéma pour les données archivées
CREATE SCHEMA IF NOT EXISTS archive;

-- Schéma pour les tables d'analyse
CREATE SCHEMA IF NOT EXISTS analytics;

-- Schéma pour les tables temporaires
CREATE SCHEMA IF NOT EXISTS staging;
```

### Migration recommandée des tables

```sql
-- Migration des logs vers le schéma technique
ALTER TABLE logs SET SCHEMA technical;

-- Migration des tables d'archive
ALTER TABLE commandes_archive SET SCHEMA archive;
ALTER TABLE produits_archive SET SCHEMA archive;

-- Migration des tables d'analytics
ALTER TABLE stats_ventes SET SCHEMA analytics;
ALTER TABLE rapports_mensuels SET SCHEMA analytics;
```

## Intégration avec Prisma

Pour gérer ces optimisations avec Prisma, plusieurs approches sont possibles:

### 1. Gestion des schémas multiples

```prisma
model Log {
  id            Int      @id @default(autoincrement())
  message       String
  level         String
  created_at    DateTime @db.Timestamp()
  
  @@schema("technical")
}
```

### 2. Gestion des vues matérialisées

Comme Prisma ne supporte pas directement les vues matérialisées, vous devez:

1. Créer les vues directement en SQL (migrations brutes Prisma)
2. Les mapper comme des modèles en lecture seule

```prisma
/// @materialized_view
model StatVentesMensuelles {
  mois               DateTime @id @db.Date
  nombre_commandes   Int
  nombre_clients     Int
  montant_total      Decimal  @db.Decimal(15,2)
  panier_moyen       Decimal  @db.Decimal(15,2)
  
  @@schema("analytics")
  @@map("stats_ventes_mensuelles")
}
```

### 3. Gestion des tables partitionnées

Pour les tables partitionnées, vous devrez:

1. Créer la structure de partitionnement via SQL pur (migrations brutes)
2. Mapper la table parente dans Prisma

```prisma
model Commande {
  id                Int           @id @default(autoincrement())
  client_id         Int
  total             Decimal       @db.Decimal(10,2)
  date_commande     DateTime      @db.Date
  
  client            Client        @relation(fields: [client_id], references: [id])
  lignes_commande   LigneCommande[]
  
  // Note: Cette table est partitionnée par RANGE(date_commande) en SQL
}
```

## Recommandations de Monitoring

Pour assurer des performances optimales après ces changements:

1. Installez et configurez `pg_stat_statements` pour le suivi des requêtes
2. Mettez en place des checks d'index inutilisés
3. Créez des alertes sur les tables en croissance rapide
4. Planifiez un VACUUM ANALYZE hebdomadaire
5. Mettez en place un suivi des deadlocks et longues transactions

## Prochaines étapes

1. Valider les recommandations avec l'équipe technique
2. Créer un environnement de test pour mesurer l'impact des changements
3. Prioriser les modifications par impact/effort
4. Planifier les migrations par phases pour minimiser les indisponibilités