# Guide de migration avec Navicat Premium

## Introduction

Ce document décrit comment utiliser Navicat Premium comme solution visuelle pour migrer des données depuis MySQL vers Supabase (PostgreSQL), en complément de notre pipeline automatisé existant.

## Prérequis

1. **Navicat Premium** (ou Navicat for MySQL + Navicat for PostgreSQL)
2. **Connexion MySQL** configurée
3. **Connexion Supabase** configurée

## Configuration des connexions

### Connexion Supabase (PostgreSQL)

1. Dans le dashboard Supabase, accéder à `Project settings > Database`
2. Noter les informations suivantes :
   - Host : `db.<projet>.supabase.co`
   - Port : `5432`
   - Database name : `postgres`
   - User : `postgres`
   - Password : récupéré via `settings > Database password`
   - SSL : **obligatoirement activé**

### Connexion MySQL

Selon votre environnement, utilisez :
- Base locale
- Base distante (via IP)
- Base dans Docker

## Étapes détaillées

### 1. Ajouter les connexions dans Navicat

#### Pour MySQL :
1. Cliquer sur `Connection > MySQL`
2. Entrer les informations de votre base source
3. Tester la connexion

#### Pour PostgreSQL (Supabase) :
1. Cliquer sur `Connection > PostgreSQL`
2. Entrer les informations Supabase notées précédemment
3. **Important** : Cocher "Use SSL"
4. Tester la connexion

### 2. Comparer les structures (optionnel mais recommandé)

Cette étape permet de vérifier les incompatibilités avant la migration :

1. Clic droit sur la base MySQL → `Structure Synchronization`
2. Sélectionner la base Supabase comme cible
3. Noter les types incompatibles :
   - `enum` (à convertir en `text`)
   - `timestamp(0)` (à gérer spécifiquement)
   - `tinyint` (à convertir en `boolean` pour les `tinyint(1)`)
   - `unsigned int` (à convertir en `bigint`)

### 3. Migrer les données

#### Option A : Table par table
1. Clic droit sur la table MySQL → `Data Transfer`
2. Sélectionner la connexion Supabase PostgreSQL comme cible
3. Choisir les options :
   - Structure + Data (ou juste Data si la structure existe déjà)
   - Mode Append (ajouter) ou Replace (supprimer + recréer)
4. Vérifier les mappages de types proposés et les ajuster si nécessaire
5. Exécuter le transfert

#### Option B : Base complète
1. Clic droit sur la base MySQL → `Data Transfer`
2. Sélectionner la connexion Supabase PostgreSQL comme cible
3. Sélectionner toutes les tables pertinentes
4. Configurer les options comme dans l'Option A
5. Exécuter le transfert

### 4. Contrôle qualité

Navicat fournit automatiquement :
- Nombre de lignes transférées
- Conflits de types / clés primaires
- Logs de transfert

Pour un contrôle plus approfondi, utilisez notre outil de validation :
```bash
cd /workspaces/cahier-des-charge
./scripts/validate-migration.sh --source=mysql --target=supabase
```

## Complémentarité avec notre pipeline existant

### Utilisation hybride recommandée

1. **Pipeline automatisé** (`start_migration.sh`) pour les environnements de dev/test
2. **Navicat** pour :
   - Migration visuelle en production
   - Résolution de problèmes spécifiques
   - Vérification manuelle des données

### Sauvegarde de la configuration Navicat

Pour réutiliser facilement une configuration :
1. Dans Navicat, menu `File > Export Connection`
2. Sauvegarder le fichier `.ncx` dans `/workspaces/cahier-des-charge/config/migration/navicat-config.ncx`
3. Pour réutiliser : `File > Import Connection`

## Points de vigilance

- **Types incompatibles** :
  - `enum` → `text`
  - `tinyint(1)` → `boolean`
  - `blob` → `bytea` ou Supabase Storage
  - `unsigned int` → `bigint`

- **Timestamps par défaut** : Si vous avez des champs `timestamp` avec valeur par défaut `0000-00-00`, Navicat échouera car PostgreSQL ne les accepte pas. Correction requise : remplacer par `NULL`.

- **Séquences PostgreSQL** : Après la migration, les séquences pour les colonnes auto-increment doivent être réinitialisées à la bonne valeur.

## Intégration avec n8n (optionnel)

Notre workflow n8n peut être déclenché après une migration Navicat pour effectuer des validations supplémentaires :

1. Terminer la migration via Navicat
2. Exécuter :
```bash
cd /workspaces/cahier-des-charge
node run-pipeline.js --workflow=migration-validation --source=supabase
```

## Support

Pour toute question, contactez l'équipe DevOps ou créez un ticket dans notre système de suivi.