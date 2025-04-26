# Audit IA - `${FILENAME}`

## Catégorie 1 — Fonction

### 1️⃣ Rôle métier principal
<!-- Ce que fait réellement ce fichier côté métier (ex : afficher une fiche, gérer un panier) -->

### 2️⃣ Points d'entrée / déclenchement
<!-- Route, appel GET/POST, inclusion, tâche cron, ou déclencheur JS -->

### 3️⃣ Zone fonctionnelle détectée
<!-- Exemple : panier, compte utilisateur, moteur de recherche, SEO, email, etc. -->

## Catégorie 2 — Structure

### 4️⃣ Structure du code
<!-- Description générale : procédural, orienté objet, mixte, spaghetti -->

### 5️⃣ Fonctions et classes
<!-- Liste des fonctions, méthodes, classes (avec signature simplifiée) -->

### 6️⃣ Fragments HTML/JS
<!-- Présence de echo, include, blocs JS ou CSS inline, template imbriqué -->

## Catégorie 3 — Données & Entrées/Sorties

### 7️⃣ Variables globales utilisées
<!-- Liste des $_GET, $_POST, $_SESSION, $_COOKIE, etc. -->

### 8️⃣ Appels SQL détectés
<!-- SQL natif, PDO, MySQLi, ORM, avec détail des requêtes si possible -->

### 9️⃣ Structure de données en sortie
<!-- Données affichées à l'utilisateur, exportées, ou injectées dans une vue -->

## Catégorie 4 — Dépendances

### 🔟 Fichiers inclus / requis
<!-- require, include, autoload, fichiers de config, dépendances métier -->

### 1️⃣1️⃣ Appels croisés
<!-- Appels directs à d'autres fichiers PHP, scripts JS externes, APIs locales -->

### 1️⃣2️⃣ Sessions et variables partagées
<!-- Utilisation de $_SESSION, cookies, ou variables PHP entre fichiers -->

## Catégorie 5 — Qualité & Sécurité

### 1️⃣3️⃣ Complexité cyclomatique
<!-- Nombre de chemins logiques : if imbriqués, boucles, conditions multiples -->

### 1️⃣4️⃣ Endettement technique
<!-- Duplication, manque de typage, code mort, spaghetti, dette long terme -->

### 1️⃣5️⃣ Failles potentielles
<!-- XSS, SQL injection, CSRF, accès non filtré, manque de validation d'input -->

## Catégorie 6 — Migration

### 1️⃣6️⃣ Route Remix cible
<!-- Où placer le fichier converti : ex /routes/produit.$slug.tsx -->

### 1️⃣7️⃣ Module NestJS cible
<!-- Ex : ProduitModule, ProduitController, ProduitService -->

### 1️⃣8️⃣ DTO / Zod Schema suggéré
<!-- Liste des propriétés structurées avec types pour Prisma + DTO/Zod -->

### 1️⃣9️⃣ Modèle Prisma associé
<!-- Table SQL → model Prisma à générer ou lier -->

### 2️⃣0️⃣ Loader Remix
<!-- Fichier .tsx → loader Remix (Appels backend / API) -->

### 2️⃣1️⃣ SEO / Meta / Canonical
<!-- Données dynamiques pour balises HTML (title, description, canonical, etc.) -->

### 2️⃣2️⃣ Tests recommandés
<!-- E2E (Playwright), unitaires (Jest), sécurité, etc. -->

### 2️⃣3️⃣ Tâches manuelles à prévoir
<!-- Migration manuelle, dépendances non connues, validations métier -->

### 2️⃣4️⃣ Suivi GitHub / CI/CD
<!-- Branche, PR, état dans GitHub, assigné, label, lien vers backlog -->
