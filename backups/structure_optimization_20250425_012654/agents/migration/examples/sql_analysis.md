# Analyse SQL et Recommandations de Migration

## Vue d'ensemble
Ce document présente une analyse détaillée du schéma SQL actuel et des recommandations pour la migration vers Prisma et PostgreSQL. Les recommandations sont organisées par table.

## Table: users

### Problèmes identifiés:
- Le champ `status` utilise un type ENUM MySQL qui n'est pas directement compatible avec PostgreSQL
- Le champ `is_admin` utilise tinyint(1) au lieu d'un booléen natif
- Les timestamps ne sont pas gérés automatiquement pour updated_at

### Recommandations:
1. **Refactoring**:
   - Convertir `status` en type TEXT avec contrainte CHECK pour PostgreSQL
   - Convertir `is_admin` en type BOOLEAN natif
   - Ajouter trigger pour mise à jour automatique de updated_at ou utiliser la fonctionnalité Prisma

2. **Renommage**:
   - Pas de renommage nécessaire

3. **Index**:
   - Les index actuels sont appropriés
   - Envisager un index partiel pour users.status='active' si les requêtes filtrent souvent sur ce statut

4. **Types**:
   - Remplacer `tinyint(1)` par `boolean`
   - Remplacer l'ENUM par un type TEXT avec contrainte CHECK

## Table: profiles

### Problèmes identifiés:
- Relation one-to-one avec users n'est pas clairement définie dans les contraintes
- Champ `phone` sans validation de format
- Manque d'index sur les colonnes fréquemment recherchées

### Recommandations:
1. **Refactoring**:
   - Assurer que la relation one-to-one est bien définie dans Prisma
   - Considérer l'ajout de validation pour phone dans l'application

2. **Renommage**:
   - Renommer `full_name` en `name` pour plus de clarté

3. **Index**:
   - Ajouter un index sur `phone` si des recherches par téléphone sont fréquentes

4. **Types**:
   - Le type varchar(20) pour phone est approprié
   - Envisager de limiter la taille de address si possible

## Table: sessions

### Problèmes identifiés:
- Le champ `id` utilise varchar(40) mais pourrait être optimisé
- Champ `payload` de type TEXT pourrait bénéficier du type JSONB dans PostgreSQL
- Les timestamps ne sont pas cohérents avec les autres tables

### Recommandations:
1. **Refactoring**:
   - Convertir `payload` en JSONB pour PostgreSQL
   - Standardiser la gestion des timestamps avec les autres tables

2. **Renommage**:
   - Pas de renommage nécessaire

3. **Index**:
   - Ajouter un index sur `last_activity` pour faciliter le nettoyage des sessions expirées
   - Considérer un index fonctionnel sur payload (GIN) si des recherches dans le JSON sont prévues

4. **Types**:
   - Utiliser UUID pour id au lieu de varchar(40)
   - Convertir `payload` en JSONB

## Plan de migration général

1. **Étape préliminaire**:
   - Créer les types enum personnalisés dans PostgreSQL pour remplacer les ENUM MySQL
   - Définir les fonctions de triggers pour la gestion automatique des timestamps

2. **Migration des données**:
   - Convertir les types de données selon les recommandations ci-dessus
   - S'assurer que les contraintes d'intégrité sont maintenues pendant la migration

3. **Validation post-migration**:
   - Vérifier l'intégrité des données après migration
   - Valider que les relations sont correctement préservées
   - Tester les performances avec les nouveaux index suggérés

4. **Adaptation du code**:
   - Mettre à jour le code qui utilise directement les ENUM MySQL
   - Modifier les requêtes qui dépendent des particularités de MySQL