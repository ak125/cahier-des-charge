# Checklist de Validation Post-Migration SQL → PostgreSQL → Prisma

> Généré le 12 avril 2025 à 14:30

## 🧪 Intégrité des données

### Tables critiques

- [ ] **User** (`utilisateurs`)
  - [ ] Vérifier le nombre total d'enregistrements (SQL: XXX vs Prisma: XXX)
  - [ ] Valider les champs sensibles (email, mot de passe hashé, permissions)
  - [ ] Tester l'authentification avec 3 comptes types (admin, utilisateur, client)

- [ ] **Order** (`commandes`)
  - [ ] Vérifier le nombre total d'enregistrements (SQL: XXX vs Prisma: XXX)
  - [ ] Valider le calcul des totaux sur 10 commandes aléatoires
  - [ ] Vérifier les relations avec les utilisateurs et produits

- [ ] **Product** (`produits`)
  - [ ] Vérifier le nombre total d'enregistrements (SQL: XXX vs Prisma: XXX)
  - [ ] Valider les stocks et prix sur 20 produits aléatoires
  - [ ] Confirmer les catégories et relations fournisseurs

- [ ] **Customer** (`clients`)
  - [ ] Vérifier le nombre total d'enregistrements (SQL: XXX vs Prisma: XXX)
  - [ ] Valider les données de contact et adresses

## 🔍 Contraintes et relations

- [ ] Vérifier que toutes les clés primaires sont correctement définies
- [ ] Valider que les contraintes de clé étrangère sont actives et fonctionnelles
- [ ] Tester les contraintes d'unicité (email, référence produit, etc.)
- [ ] Vérifier la propagation des suppressions (onDelete) sur 3 tables test

## 📊 Performances

- [ ] Exécuter les 10 requêtes les plus fréquentes et comparer les temps
- [ ] Vérifier la présence et l'efficacité de tous les index critiques
- [ ] Tester les performances de chargement des relations (eager vs lazy)
- [ ] Mesurer les performances de pagination sur les grandes tables

```sql
-- Requête de test d'intégrité des relations
SELECT
  t.table_name,
  c.column_name,
  c.is_nullable,
  tc.constraint_type,
  rc.delete_rule
FROM
  information_schema.tables t
JOIN
  information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN
  information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN
  information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
LEFT JOIN
  information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE
  t.table_type = 'BASE TABLE'
  AND t.table_schema = 'public'
ORDER BY
  t.table_name, c.ordinal_position;
```

## 🧪 Tests automatisés

- [ ] Exécuter la suite de tests d'intégrité (jest ou vitest)
- [ ] Valider les tests d'API avec Prisma vs MySQL
- [ ] Confirmer le fonctionnement de tous les scénarios de test

```bash
# Commande pour exécuter les tests d'intégrité de la migration
npm run test:migration-integrity

# Vérifier les performances
npm run test:perf-comparison
```

## 🔐 Sécurité

- [ ] Vérifier que les politiques RLS sont correctement appliquées dans Supabase
- [ ] Tester les scénarios d'injection SQL via Prisma
- [ ] Valider que les champs sensibles sont protégés par l'API

## 📱 Application

- [ ] Tester le login/logout dans l'application
- [ ] Vérifier le flux complet de création de commande
- [ ] Tester la consultation de l'historique client
- [ ] Valider les tableaux de bord et statistiques
- [ ] Confirmer les fonctionnalités de filtrage et recherche

## 📝 Documentation

- [ ] Mettre à jour le schéma Prisma avec des commentaires complets
- [ ] Documenter les différences de modélisation SQL → Prisma
- [ ] Créer/mettre à jour les diagrammes ER avec le nouveau modèle
- [ ] Documenter les décisions de refactoring prises pendant la migration