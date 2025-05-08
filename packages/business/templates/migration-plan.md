# Plan de Migration SQL → PostgreSQL → Prisma

> Généré le 12 avril 2025 à 14:30

## 📊 Résumé

- **Tables analysées**: 42
- **Modèles Prisma**: 38
- **Tâches identifiées**: 45

## 📋 Vagues de migration

### Vague 1 - Tables de référence

Tables de référence et tables indépendantes. Ces tables n'ont pas ou peu de dépendances.

**Tables (12)**: `categories`, `statuts`, `roles`, `pays`, `permissions`, `types_documents`, `parametres_systeme`, `langues`, `devises`, `unites_mesure`, `methodes_paiement`, `taxes`

### Vague 2 - Tables principales

Tables principales avec des relations simples. Ces tables forment le cœur du modèle de données.

**Tables (15)**: `utilisateurs`, `clients`, `fournisseurs`, `produits`, `services`, `commandes`, `factures`, `devis`, `contacts`, `adresses`, `departements`, `employes`, `stocks`, `catalogues`, `projets`

### Vague 3 - Tables de jonction et relations complexes

Tables gérant les relations many-to-many et autres relations complexes.

**Tables (10)**: `commandes_produits`, `factures_produits`, `utilisateurs_roles`, `produits_categories`, `projets_employes`, `clients_contacts`, `fournisseurs_produits`, `devis_services`, `commandes_services`, `factures_services`

### Vague 4 - Vues et couche métier

Vues, aggrégats et fonctionnalités métier avancées.

**Tables (5)**: `vue_stocks_faibles`, `vue_commandes_en_cours`, `vue_ca_mensuel`, `vue_clients_actifs`, `vue_dashboard`

## 🔍 Tables critiques

| Table | Modèle Prisma | Raison | Dépendances PHP |
|-------|--------------|--------|----------------|
| `utilisateurs` | `User` | Table centrale utilisée par 8 autres tables | auth.php, profile.php, user_manager.php |
| `commandes` | `Order` | Table business critique avec relations complexes | order_process.php, invoice_generator.php |
| `produits` | `Product` | Modèle central avec 6 dépendances | product_catalog.php, stock_manager.php |
| `clients` | `Customer` | Données critiques business | crm.php, customer_dashboard.php |

## 🗺️ Dépendances entre tables

### Tables avec le plus de dépendances

| Table | Dépend de | Nombre |
|-------|-----------|--------|
| `commandes` | `utilisateurs`, `clients`, `statuts` | 3 |
| `factures` | `commandes`, `clients`, `methodes_paiement` | 3 |
| `commandes_produits` | `commandes`, `produits`, `unites_mesure` | 3 |
| `produits` | `categories`, `fournisseurs` | 2 |
| `projets` | `clients`, `statuts` | 2 |

### Tables les plus utilisées

| Table | Utilisée par | Nombre |
|-------|-------------|--------|
| `utilisateurs` | `commandes`, `factures`, `devis`, `projets`, `utilisateurs_roles`, `contacts`, `adresses`, `commentaires` | 8 |
| `produits` | `commandes_produits`, `factures_produits`, `stocks`, `produits_categories`, `fournisseurs_produits`, `catalogues` | 6 |
| `clients` | `commandes`, `factures`, `devis`, `projets`, `clients_contacts` | 5 |
| `statuts` | `commandes`, `projets`, `factures`, `devis` | 4 |

## 📝 Liste des tâches de migration

### Vague 1

#### Role (`roles`)

**Statut**: ⏳ pending

**Actions**:

- [ ] Créer modèle Prisma Role
- [ ] Vérifier les valeurs par défaut
- [ ] Appliquer mapping dans le code NestJS

#### Category (`categories`)

**Statut**: ⏳ pending

**Actions**:

- [ ] Créer modèle Prisma Category
- [ ] Vérifier les valeurs par défaut
- [ ] Appliquer les index et contraintes d'unicité
- [ ] Appliquer mapping dans le code NestJS

**Fichiers PHP associés**:

- `product_catalog.php`
- `admin/category_manager.php`

### Vague 2

#### User (`utilisateurs`)

**Statut**: ⏳ pending

**Actions**:

- [ ] Créer modèle Prisma User
- [ ] Valider les relations (Role)
- [ ] Vérifier les valeurs par défaut
- [ ] Appliquer les index et contraintes d'unicité
- [ ] Appliquer mapping dans le code NestJS

**Fichiers PHP associés**:

- `auth.php`
- `profile.php`
- `user_manager.php`

#### Product (`produits`)

**Statut**: 🔒 blocked

**Bloqué par**: `Category`

**Actions**:

- [ ] Créer modèle Prisma Product
- [ ] Valider les relations (Category, Supplier)
- [ ] Vérifier les valeurs par défaut
- [ ] Appliquer les index et contraintes d'unicité
- [ ] Appliquer mapping dans le code NestJS

**Fichiers PHP associés**:

- `product_catalog.php`
- `stock_manager.php`
- `admin/product_editor.php`

### Vague 3

#### OrderProduct (`commandes_produits`)

**Statut**: 🔒 blocked

**Bloqué par**: `Order`, `Product`

**Actions**:

- [ ] Créer modèle Prisma OrderProduct
- [ ] Valider les relations (Order, Product)
- [ ] Vérifier les valeurs par défaut
- [ ] Appliquer mapping dans le code NestJS

**Fichiers PHP associés**:

- `order_process.php`
- `order_details.php`

### Vague 4

#### CustomerDashboardView (`vue_clients_actifs`)

**Statut**: 🔒 blocked

**Bloqué par**: `Customer`, `Order`, `Invoice`

**Actions**:

- [ ] Créer modèle Prisma CustomerDashboardView
- [ ] Valider les relations (Customer, Order, Invoice)
- [ ] Créer la logique équivalente avec Prisma
- [ ] Appliquer mapping dans le code NestJS

## ⚠️ Refactorings critiques

### User (`utilisateurs`)

- ⚠️ Timestamp without timezone for date_creation
- ⚠️ Inconsistent column prefixes: user_, u_

### Product (`produits`)

- ⚠️ Type mismatch in foreign key: category_id (INT) → categories.id (BIGINT)
- ⚠️ Oversized varchar(1024) for reference (1024 chars)

### Order (`commandes`)

- ⚠️ Timestamp without timezone for date_commande
- ⚠️ Type mismatch in foreign key: client_id (INT) → clients.id (BIGINT)

## 📊 Statistiques

### Répartition des modèles

- 🧠 **Core**: 8
- 📚 **Reference**: 12
- 🔄 **Junction**: 10
- 💼 **Business**: 13
- 👁️ **View**: 5