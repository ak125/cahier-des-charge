# Audit IA - panier.php

## 1️⃣ Rôle métier principal

Ce fichier gère le panier d'achat des utilisateurs, incluant l'ajout, la suppression et la modification des quantités de produits, ainsi que le calcul des totaux et l'application des promotions.

## 2️⃣ Structure

### 2.1. Structure logique du fichier
- Fonctions détectées : `ajouterProduit` (Traitement, 45 lignes, profondeur 3), `supprimerProduit` (Traitement, 12 lignes, profondeur 2), `modifierQuantite` (Traitement, 28 lignes, profondeur 3), `calculerTotal` (Traitement, 32 lignes, profondeur 3), `appliquerPromotion` (Traitement, 52 lignes, profondeur 4)
- Includes : `config/init.php`, `classes/Produit.class.php`, `classes/Promotion.class.php`
- Profondeur max de conditions imbriquées : 4
- Présence de blocs HTML avec logique backend imbriquée : ✅ plusieurs blocs avec mélange PHP/HTML

### 2.2. Type de module
- Type dominant : `Page (vue)`
- Alertes : 🔶 Mélange HTML + logique métier non encapsulée

### 2.3. Qualité du code
| Critère | Score | Commentaire |
|--------|-------|-------------|
| Duplication | 1/3 | Plusieurs blocs similaires de calcul des prix |
| Logique inline | 0/3 | Nombreuses conditions PHP dans les blocs HTML |
| Mix frontend/backend | 0/3 | Pas de séparation entre affichage et logique métier |
| Absence de fonctions | 2/3 | Principales fonctionnalités en fonctions mais code HTML non encapsulé |
| JS inline | 1/3 | Événements onclick directement dans le HTML |
| Nom des variables | 2/3 | Quelques variables peu explicites : `$p`, `$t`, `$q` |

> 🔧 Qualité structurelle estimée : **1.0 / 3**

## 3️⃣ Points d'entrée / déclenchement

Le fichier est accessible via l'URL `/panier.php` et peut être appelé avec les paramètres suivants:
- `?action=ajouter&id=X` : Ajoute le produit avec l'ID X au panier
- `?action=supprimer&id=X` : Supprime le produit avec l'ID X du panier
- `?action=modifier&id=X&qte=Y` : Modifie la quantité du produit X à Y
- `?code=Z` : Applique le code promotion Z

## 4️⃣ Zone fonctionnelle détectée

Panier / Commandes

## 5️⃣ Fonctions et classes

- `ajouterProduit($id, $quantite)` : Ajoute un produit au panier
- `supprimerProduit($id)` : Supprime un produit du panier
- `modifierQuantite($id, $quantite)` : Modifie la quantité d'un produit
- `calculerTotal()` : Calcule le total du panier
- `appliquerPromotion($code)` : Applique un code promotion

## 6️⃣ Fragments HTML/JS

Le fichier contient plusieurs fragments HTML:
1. Tableau d'affichage des produits du panier (lignes 120-180)
2. Formulaire de code promotion (lignes 185-200)
3. Bloc d'affichage des totaux (lignes 205-240)
4. Boutons de navigation (lignes 245-260)

## 7️⃣ Variables globales utilisées

- `$_SESSION['panier']` : Stockage des produits du panier
- `$_SESSION['utilisateur']` : Informations de l'utilisateur connecté
- `$_GET['action']` : Action à effectuer
- `$_GET['id']` : ID du produit à manipuler
- `$_GET['qte']` : Quantité à définir
- `$_GET['code']` : Code promotion à appliquer

## 8️⃣ Appels SQL détectés

```sql
SELECT * FROM produits WHERE id = ?
SELECT * FROM promotions WHERE code = ? AND date_fin > NOW() AND active = 1
UPDATE panier_temp SET quantite = ? WHERE id_session = ? AND id_produit = ?
INSERT INTO panier_temp (id_session, id_produit, quantite) VALUES (?, ?, ?)
```

## 9️⃣ Structure de données en sortie

Tableau HTML du panier avec:
- Liste des produits (nom, référence, prix unitaire, quantité, sous-total)
- Sous-total HT
- Montant TVA
- Frais de livraison
- Total TTC
- Économies réalisées (si promotion)

## 1️⃣0️⃣ Fichiers inclus / requis

- `config/init.php` : Initialisation de la session et connexion DB
- `classes/Produit.class.php` : Classe de gestion des produits
- `classes/Promotion.class.php` : Classe de gestion des promotions

## 1️⃣1️⃣ Tests requis

- Test d'ajout de produit
- Test de suppression de produit
- Test de modification de quantité
- Test d'application de promotion
- Test de calcul des totaux
- Test avec quantités invalides
- Test avec produits inexistants
- Test avec code promotion invalide

## 1️⃣2️⃣ Risques identifiés

- Race condition lors de la modification simultanée du panier
- Incohérence des prix entre affichage et validation finale
- Problèmes de performance avec des paniers contenant de nombreux produits
- Vulnérabilité XSS dans l'affichage des noms de produits

## 1️⃣3️⃣ État de migration estimé

- Analyse: Complète
- Complexité: Moyenne
- Priorité: Élevée (critique pour le parcours client)

## 1️⃣4️⃣ Authentification/Autorisation

- Accessible sans connexion (panier sauvegardé en session)
- Passage à l'étape de commande uniquement pour utilisateurs connectés

## 1️⃣5️⃣ Flux de données

Entrée → Traitement → Sortie:
1. Paramètres URL ou formulaire → Gestion panier → Affichage panier
2. Sélection produit → Vérification stock → Ajout au panier
3. Code promotion → Validation → Application remise

## 1️⃣6️⃣ Route Remix cible

- `/panier` (GET) pour affichage
- `/panier/ajouter` (POST) pour ajout
- `/panier/supprimer/$id` (DELETE) pour suppression
- `/panier/modifier` (PATCH) pour modification
- `/panier/promotion` (POST) pour application promotion

## 1️⃣7️⃣ Module NestJS cible

- Module: `CartModule`
- Contrôleur: `CartController`
- Services: `CartService`, `ProductService`, `PromotionService`

## 1️⃣8️⃣ DTO / Zod Schema suggéré

```typescript
// CartItemDto
interface CartItemDto {
  productId: number;
  quantity: number;
}

// AddToCartDto
interface AddToCartDto {
  productId: number;
  quantity: number;
}

// UpdateCartItemDto
interface UpdateCartItemDto {
  productId: number;
  quantity: number;
}

// ApplyPromotionDto
interface ApplyPromotionDto {
  code: string;
}

// CartResponseDto
interface CartResponseDto {
  items: Array<{
    id: number;
    productId: number;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
}
```

## 1️⃣9️⃣ Modèle Prisma associé

```prisma
model CartItem {
  id         Int      @id @default(autoincrement())
  sessionId  String
  userId     Int?
  productId  Int
  quantity   Int
  addedAt    DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user       User?    @relation(fields: [userId], references: [id])
  product    Product  @relation(fields: [productId], references: [id])
  
  @@unique([sessionId, productId])
  @@index([sessionId])
  @@index([userId])
}

model Promotion {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  type        String   // percentage, fixed, shipping
  value       Float
  minAmount   Float?
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(true)
  maxUses     Int?
  currentUses Int      @default(0)
}
```

## 2️⃣0️⃣ Migration

### Migration Backend

1. Créer les modèles Prisma CartItem et Promotion
2. Développer CartService avec méthodes CRUD et calcul
3. Implémenter CartController avec endpoints RESTful
4. Mettre en place la validation avec class-validator
5. Développer le système de promotion avec différents types de remises

### Migration Frontend

1. Créer la route Remix /panier
2. Implémenter le composant Cart avec affichage des produits
3. Créer les formulaires d'ajout et modification
4. Implémenter la logique de mise à jour optimiste
5. Ajouter les animations et feedback utilisateur

### Tests et validation

1. Tests unitaires pour CartService et calculs
2. Tests d'intégration pour CartController
3. Tests end-to-end du parcours complet
4. Tests de performance avec différentes tailles de panier
