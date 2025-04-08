# Plan détaillé de migration MySQL vers PostgreSQL

## 📋 Préparation

### 1. Analyse du schéma MySQL existant

```bash
# Génération d'un dump schema-only
mysqldump --no-data --skip-comments \
  -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > schema_mysql.sql

# Génération d'un fichier d'analyse avec metadata
php scripts/analyze_mysql_schema.php > mysql_schema_analysis.json
```

### 2. Définition du schema Prisma initial

```prisma
// Exemple de schema.prisma initial converti depuis MySQL
datasource db {
  provider = "mysql" // Initialement sur MySQL
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  orders    Order[]

  @@map("users")
}

model Product {
  id          Int         @id @default(autoincrement()) 
  name        String
  description String?     @db.Text
  price       Decimal     @db.Decimal(10, 2)
  stockQty    Int         @map("stock_qty")
  isActive    Boolean     @default(true) @map("is_active")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  orderItems  OrderItem[]

  @@map("products")
}

// Autres modèles...
```

## 🔄 Étapes de migration

### Phase 1: Migration parallèle (Read MySQL, Write Both)

1. **Prisma avec MySQL**
   - Déployer le nouveau backend avec Prisma pointant vers MySQL
   - Valider les performances et la compatibilité

2. **Configuration PostgreSQL**
   - Installer PostgreSQL 14+
   - Créer la base de données et l'utilisateur dédié
   - Configurer les paramètres optimaux (work_mem, shared_buffers)

3. **Migration du schema**
   - Modifier `schema.prisma` pour supporter PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL_PG")
   }
   ```
   - Adapter les types spécifiques (TEXT, JSON, etc.)
   - Gérer les index et contraintes spécifiques à PostgreSQL

### Phase 2: ETL et Synchronisation

1. **Migration initiale des données**
   ```bash
   # Script de migration séquentielle par table
   node scripts/migrate-data.js --table=users
   node scripts/migrate-data.js --table=products
   # etc.
   ```

2. **Mise en place de la synchronisation**
   - Développer des triggers MySQL pour capturer les changements (CDC)
   - Utiliser Debezium ou un système custom pour répliquer vers PostgreSQL
   - Implémenter des vérifications de cohérence périodiques

### Phase 3: Basculement complet

1. **Tests de performance**
   - Exécuter des benchmarks sur les deux systèmes
   - Vérifier les performances des requêtes complexes
   - Optimiser les index PostgreSQL

2. **Période de double-écriture**
   - Configurer le backend pour écrire dans les deux bases
   - Vérifier la cohérence des données
   - Corriger les divergences si nécessaires

3. **Basculement final**
   - Planifier une fenêtre de maintenance
   - Vérifier une dernière fois la synchronisation
   - Basculer la configuration vers PostgreSQL uniquement
   - Conserver MySQL en lecture seule pendant une période de sécurité

## 📊 Suivi et monitoring

### Métriques à surveiller

- Taux de synchronisation entre les bases
- Délai de réplication
- Temps de réponse des requêtes avant/après
- Utilisation des ressources (CPU, RAM, IO)

### Logs et alertes

- Configurer des alertes sur les erreurs de synchronisation
- Journaliser toutes les opérations de migration
- Implémenter des vérifications automatiques de cohérence des données
