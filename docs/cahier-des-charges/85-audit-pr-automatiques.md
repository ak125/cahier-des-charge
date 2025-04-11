# Création automatique des fichiers .audit.md + PR IA

## 🔄 Processus automatisé

À chaque fichier migré, le pipeline de migration déclenche automatiquement la génération d'un fichier d'audit et crée une Pull Request sur GitHub pour faciliter la revue du code.

## 📋 Fichiers d'audit

### Contenu des fichiers .audit.md

Chaque fichier migré est accompagné d'un fichier d'audit détaillé contenant:

1. **Objectif du module**
   - Description fonctionnelle
   - Cas d'utilisation principaux
   - Dépendances avec autres modules

2. **Modèle SQL associé**
   - Tables et relations principales
   - Mapping avec le schéma Prisma
   - Requêtes critiques identifiées

3. **Routes associées**
   - Correspondance ancienne route → nouvelle route
   - Paramètres d'URL et leur traitement
   - Mécanismes de redirection

4. **Checklist de validation IA + humaine**
   - Points vérifiés par l'IA (avec statut)
   - Points à vérifier par un humain
   - Métriques de performance avant/après

### Exemple de fichier d'audit

```markdown
# Audit de migration: Module Panier

## Objectif du module
Ce module gère le panier d'achat de l'utilisateur, incluant l'ajout/suppression de produits, 
la gestion des quantités, le calcul des prix et la persistence entre sessions.

### Cas d'utilisation principaux
- Ajout d'un produit au panier
- Modification de la quantité
- Suppression d'un article
- Application de promotions/remises
- Sauvegarde du panier pour utilisateur connecté/non-connecté

### Dépendances
- Module Produit (vérification disponibilité)
- Module Utilisateur (panier sauvegardé)
- Module Promotions (calcul des remises)

## Modèle SQL associé

### Tables principales
- `cart`: Panier principal (id, user_id, created_at, updated_at)
- `cart_items`: Éléments du panier (id, cart_id, product_id, quantity, price)
- `cart_promotions`: Promotions appliquées (cart_id, promotion_id)

### Mapping Prisma
```typescript
model Cart {
  id        String     @id @default(uuid())
  userId    String?    @map("user_id")
  items     CartItem[]
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  
  user      User?      @relation(fields: [userId], references: [id])
  promotions CartPromotion[]

  @@map("carts")
}
```

### Requêtes critiques
- Jointure complexe pour le calcul de prix avec promotions
- Agrégation pour le calcul du total du panier

## Routes associées

| Ancienne route | Nouvelle route | Méthode | Paramètres |
|----------------|---------------|---------|------------|
| `/panier.php` | `/cart` | GET | - |
| `/panier.php?action=add` | `/cart/items` | POST | productId, quantity |
| `/panier.php?action=update` | `/cart/items/$itemId` | PATCH | quantity |
| `/panier.php?action=delete` | `/cart/items/$itemId` | DELETE | - |

### Redirections
- Toutes les anciennes routes sont redirigées avec code 301
- Paramètres query sont mappés vers REST ou body parameters
- Support backward compatibility pour anciens liens

## Checklist de validation

### Validations IA ✅
- [x] Structure conforme au pattern Remix
- [x] Types Prisma correctement utilisés
- [x] Requêtes optimisées (pas de N+1)
- [x] Gestion des erreurs appropriée
- [x] Redirections implémentées

### Validation humaine requise 👤
- [ ] Vérifier comportement avec grande quantité d'items
- [ ] Tester le calcul des promotions complexes
- [ ] Confirmer persistence du panier entre sessions
- [ ] Valider UX mobile du panier

### Métriques de performance
| Métrique | Avant | Après | Différence |
|----------|-------|-------|------------|
| Temps de chargement | 1200ms | 350ms | -71% |
| Requêtes SQL | 8 | 2 | -75% |
| Taille bundle JS | 245KB | 68KB | -72% |
```

## 🔀 Pull Requests automatiques

### Processus de création des PR

Le workflow de migration déclenche automatiquement:

1. La création d'une branche spécifique au module (`migration/module-xxx`)
2. L'envoi des fichiers migrés et du fichier d'audit
3. La création d'une Pull Request avec le tag `#ai-generated`
4. L'assignation à des réviseurs selon la configuration

### Structure des PR

Chaque Pull Request contient:

- **Titre**: `[AI Migration] Module XXX`
- **Description**: Générée à partir du fichier d'audit
- **Tags**: `#ai-generated`, `#needs-review`, domaine spécifique
- **Fichiers inclus**:
  - Code migré (NestJS + Remix)
  - Tests unitaires et d'intégration
  - Fichier d'audit `.audit.md`
  - Documentation d'API mise à jour

### Exemple de commandes d'automatisation

```bash
# Script de création de PR automatique
MODULE_NAME="cart"
BRANCH_NAME="migration/$MODULE_NAME"

# Création de la branche
git checkout -b $BRANCH_NAME

# Ajout des fichiers
git add apps/api/src/modules/$MODULE_NAME
git add apps/web/app/routes/$MODULE_NAME
git add docs/audit/$MODULE_NAME.audit.md

# Commit
git commit -m "[AI Migration] Module $MODULE_NAME

Automated migration of $MODULE_NAME module.
See $MODULE_NAME.audit.md for details."

# Push et création de la PR
git push origin $BRANCH_NAME

# Création de la PR via GitHub CLI
gh pr create \
  --title "[AI Migration] Module $MODULE_NAME" \
  --body "$(cat docs/audit/$MODULE_NAME.audit.md)" \
  --label "ai-generated,needs-review" \
  --reviewer "tech-lead,domain-expert"
```

## 📊 Suivi et statistiques

Le système maintient des statistiques sur les PR générées:

- Taux d'approbation des PR automatiques
- Temps moyen de revue
- Nombres de modifications demandées
- Ratio de code conservé/modifié lors de la revue

Ces métriques permettent d'améliorer continuellement la qualité des migrations automatiques et d'identifier les domaines nécessitant une attention particulière.
