# 🔍 Mapping Typologique SQL ➝ PostgreSQL ➝ Prisma

## 📊 Statistiques

- Tables analysées: **10**
- Colonnes analysées: **47**
- Colonnes avec remarques: **32**
  - ⚠️ Avertissements: **26**
  - ❌ Erreurs: **0**
  - ℹ️ Informations: **6**

## ✅ Exemples de colonnes converties correctement

- `users.email`: `VARCHAR(255)` ➝ `VARCHAR(255)` ➝ `String @db.VarChar(255)`
- `users.created_at`: `DATETIME` ➝ `TIMESTAMP` ➝ `DateTime @default(now())`
- `users.updated_at`: `TIMESTAMP` ➝ `TIMESTAMP` ➝ `DateTime @updatedAt`
- `orders.total_amount`: `DECIMAL(10,2)` ➝ `NUMERIC(10,2)` ➝ `Decimal @db.Decimal(10,2)`
- `categories.name`: `VARCHAR(50)` ➝ `VARCHAR(50)` ➝ `String @db.VarChar(50)`
- `order_items.unit_price`: `DECIMAL(10,2)` ➝ `NUMERIC(10,2)` ➝ `Decimal @db.Decimal(10,2)`
- `media.filename`: `VARCHAR(255)` ➝ `VARCHAR(255)` ➝ `String @db.VarChar(255)`
- `media.mime_type`: `VARCHAR(100)` ➝ `VARCHAR(100)` ➝ `String @db.VarChar(100)`
- `user_preferences.preferences`: `JSON` ➝ `JSONB` ➝ `Json`
- `tags.name`: `VARCHAR(50)` ➝ `VARCHAR(50)` ➝ `String @db.VarChar(50)`

## ⚠️ Conversions spéciales

- `orders.status`: `ENUM('pending','processing','completed','cancelled')` ➝ `VARCHAR(255)`
  - **Remarque**: Les ENUMs MySQL ne se mappent pas directement à PostgreSQL, utiliser un type enum Prisma
  - **Suggestion**: Créer un enum Prisma: enum OrdersStatusEnum { pending processing completed cancelled }

- `product_variants.attributes`: `SET('color','size','material','style')` ➝ `TEXT[]`
  - **Remarque**: Le type SET MySQL n'existe pas dans PostgreSQL, converti en tableau TEXT[]
  - **Suggestion**: Utiliser des requêtes ARRAY en PostgreSQL pour manipuler ces données

- `geo_locations.coordinates`: `POINT` ➝ `GEOMETRY`
  - **Remarque**: Les types géométriques MySQL doivent être gérés avec PostGIS dans PostgreSQL
  - **Suggestion**: Installer l'extension PostGIS

- `logs.id`: `BIGINT(20) UNSIGNED` ➝ `BIGSERIAL`
  - **Remarque**: MySQL BIGINT UNSIGNED n'a pas d'équivalent direct dans PostgreSQL
  - **Suggestion**: Utiliser CHECK (id >= 0) en PostgreSQL

## ❌ Problèmes de typage

- `products.price`: `FLOAT(10,2)` ➝ `REAL`
  - **Problème**: Le type FLOAT a une précision limitée, considérer NUMERIC pour des calculs financiers
  - **Solution**: Utiliser NUMERIC(10,2) pour les montants financiers

## 🔄 Candidats potentiels pour ENUM

- `users.status`: `VARCHAR(20)`
  - **Suggestion**: Envisager de convertir en type enum Prisma pour une meilleure validation

- `media.ref_type`: `VARCHAR(50)`
  - **Suggestion**: Envisager de convertir en type enum Prisma pour une meilleure validation

- `logs.level`: `VARCHAR(20)`
  - **Suggestion**: Envisager de convertir en type enum Prisma pour une meilleure validation

## 🔢 Problèmes de précision numérique

- `products.price`: `FLOAT(10,2)` ➝ `REAL`
  - **Remarque**: Le type FLOAT a une précision limitée, considérer NUMERIC pour des calculs financiers
  - **Solution**: Utiliser NUMERIC(10,2) pour les montants financiers

## 📝 Autres remarques

- `products.description`: `TEXT` ➝ `TEXT`
  - **Remarque**: Contenu potentiellement riche détecté
  - **Suggestion**: Envisager d'ajouter un champ personnalisé RichText dans votre modèle si ce champ contient du HTML/Markdown

## 💡 Recommandations générales

- Remplacer tous les ENUM natifs MySQL par des enums Prisma
- Remplacer les SET MySQL par des tableaux PostgreSQL (type[])
- Utiliser NUMERIC(p,s) au lieu de FLOAT/DOUBLE pour les valeurs monétaires
- Ajouter des contraintes CHECK pour émuler le comportement UNSIGNED
- Préférer le type TIMESTAMPTZ pour les dates avec fuseau horaire
- Utiliser le type UUID pour les identifiants si possible (meilleure sécurité et distribution)

## ✅ Intégration dans Prisma

Pour intégrer ces mappings dans votre schema.prisma :

1. Utilisez l'outil `generate_prisma_model.ts` pour générer automatiquement les modèles
2. Révisez les définitions d'enum suggérées et ajoutez-les manuellement au début du fichier
3. Vérifiez les relations et les contraintes référentielles

Exemple d'énumération Prisma :

```prisma
enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}

model Order {
  id          Int        @id @default(autoincrement())
  status      OrderStatus
  total_amount Decimal   @db.Decimal(10,2)
  // ...autres champs
}
```

## 🚀 Prochaines étapes

1. Valider les types suggérés avec l'équipe de développement
2. Tester la migration sur un environnement de test
3. Vérifier les performances des requêtes complexes après la migration
4. Mettre à jour les requêtes SQL utilisant des fonctionnalités spécifiques à MySQL
5. Documenter les nouvelles conventions de typage pour le projet

## 📌 Note sur la compatibilité avec Prisma

Prisma supporte très bien PostgreSQL et propose une API moderne pour interagir avec votre base de données. Les avantages incluent :

- Typage fort pour les modèles et les relations
- Migrations automatiques
- Validation au niveau du schéma
- Requêtes complexes simplifiées

Pour générer votre modèle Prisma complet, utilisez le script `generate_prisma_model.ts` inclus dans ce rapport.