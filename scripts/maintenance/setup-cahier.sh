#!/bin/bash

echo "🚀 Initialisation du Cahier des Charges Évolutif..."

CDC_DIR="cahier-des-charges"
mkdir -p "$CDC_DIR"

# Créer la structure de fichiers
cat > "$CDC_DIR/00-sommaire.md" << EOL
# Cahier des Charges - Sommaire

Ce document contient les liens vers les différentes sections du cahier des charges.
EOL

cat > "$CDC_DIR/01-introduction.md" << EOL
# Introduction et Vision Globale

## 🎯 Objectif du projet
Moderniser l'architecture applicative en migrant d'une application PHP legacy vers un monorepo NestJS (backend) et Remix (frontend) avec une approche progressive et assistée par IA.

## 📋 Portée du document
Ce cahier des charges couvre les exigences fonctionnelles, techniques, le plan de migration, l'architecture IA, et les procédures d'audit et de surveillance.
EOL

cat > "$CDC_DIR/02-exigences-fonctionnelles.md" << EOL
# Exigences Fonctionnelles

## Modules métier

### 🔐 Module Authentification et Gestion des Utilisateurs
- Inscription, connexion, gestion de profil
- Rôles et permissions RBAC
- SSO et intégration OAuth2

### 🛒 Module E-commerce / Transactions
- Gestion du panier
- Processus de commande
- Passerelles de paiement

### 📊 Module Analytics et Reporting
- Tableaux de bord personnalisés
- Exports de données
- Métriques commerciales

## Exigences UX/UI

### 📱 Responsive Design
- Mobile-first approach
- Breakpoints et adaptabilité

### 🎨 Design System
- Composants réutilisables Remix
- Thème et variables
- Accessibilité WCAG 2.1
EOL

cat > "$CDC_DIR/03-specifications-techniques.md" << EOL
# Spécifications Techniques

## 📦 Architecture Monorepo

### Structure
\`\`\`
/
├── apps/
│   ├── api/         # NestJS Backend
│   ├── web/         # Remix Frontend
│   └── admin/       # Admin Dashboard
├── libs/
│   ├── core/        # Logique métier partagée
│   ├── ui/          # Composants UI
│   └── utils/       # Utilitaires communs
└── tools/           # Scripts et outils dev
\`\`\`

## 🛠️ Stack Technique

### Backend (NestJS)
- TypeScript 5+
- NestJS 10+
- Prisma ORM
- Redis pour le cache et les sessions
- Bull pour les jobs/queues

### Frontend (Remix)
- TypeScript 5+
- Remix 2+
- Tailwind CSS
- React Query pour le cache client

### DevOps
- Docker / Docker Compose
- GitHub Actions
- Déploiement CI/CD sur Coolify
EOL

cat > "$CDC_DIR/04-architecture-ia.md" << EOL
# Architecture IA et Automatisation

## 🤖 Agents IA

### dev-generator
- Génération de code TypeScript
- Création de controllers NestJS et composants Remix
- Mapping automatique des routes

### audit-checker
- Analyse de qualité du code
- Détection des erreurs potentielles
- Suggestions d'optimisation

### route-mapper
- Conversion des URLs legacy vers le nouveau format
- Génération des redirections
- Tests de cohérence SEO

## 🔄 Orchestration avec n8n

### Workflows
- Analyse quotidienne du codebase
- Génération de rapports d'audit
- Création de PR automatiques pour les optimisations
EOL

cat > "$CDC_DIR/05-plan-migration.md" << EOL
# Plan de Migration

## 🗃️ Base de données

### MySQL → PostgreSQL
- Analyse de schéma initial et colonnes
- Migration progressive par tables avec validation
- Stratégie de synchronisation temporaire pour les données critiques

### Prisma Schema
- Modélisation initiale avec import du schéma legacy
- Relations et indexes optimisés
- Migrations gérées avec versioning

## 📑 Code Legacy

### Analyse statique
- Cartographie des dépendances
- Identification des modules critiques
- Analyse de complexité cyclomatique

### Stratégie de migration
- Migration module par module
- Tests parallèles (A/B testing)
- Rollback automatique en cas d'erreur
EOL

cat > "$CDC_DIR/06-seo-compatibilite.md" << EOL
# Compatibilité et Redirection SEO

## 🔄 Stratégie de redirection

### Mapping .htaccess vers Remix/NestJS
- Conversion des règles RewriteRule
- Gestion des paramètres d'URL
- Préservation des URLs canoniques

### Compatibilité
- Redirections 301 pour les anciennes URLs
- Préservation des métadonnées SEO
- Gestion des liens entrants
EOL

cat > "$CDC_DIR/07-suivi-evolution.md" << EOL
# Suivi d'évolution automatique

## 📊 Dashboard d'avancement

### Métriques automatiques
- Pourcentage de code migré
- Tests de couverture
- Performance avant/après

### Rapport hebdomadaire
- Génération automatique des statistiques
- Tracking des objectifs
- Prédiction d'achèvement basée sur la vélocité
EOL

cat > "$CDC_DIR/08-historique-tracabilite.md" << EOL
# Historique & Traçabilité

## 📝 Système de documentation des évolutions

Chaque modification significative du projet est documentée dans un format standardisé pour garantir la traçabilité complète.

### Format des entrées de changement

\`\`\`md
> [!CHANGELOG]  
> **Date:** YYYY-MM-DD  
> **Auteur:** Nom de l'auteur  
> **Type:** Feature | Bugfix | Refactoring | Documentation  
>  
> **Fichiers modifiés:**
> - \`/path/to/file1.ts\`
> - \`/path/to/file2.tsx\`
>
> **Description:**  
> Description détaillée du changement et de sa justification
>
> **Impact:**  
> Impact sur le système, les performances ou l'expérience utilisateur
\`\`\`

### Traçabilité multi-niveaux

- **Niveau Code**: Commits Git avec messages standardisés
- **Niveau Module**: Documents \`.changelog.md\` dans chaque dossier de module
- **Niveau Projet**: Historique centralisé dans le cahier des charges
- **Niveau Process**: Journalisation des actions IA dans \`ai-actions-log.json\`

## 🔄 Processus de mise à jour

1. Toute modification significative est documentée selon le format ci-dessus
2. Le script \`update-changelog.sh\` détecte les changements et met à jour les fichiers concernés
3. Les Pull Requests doivent inclure les mises à jour de documentation appropriées
4. Les revues de code vérifient la qualité et la complétude de la documentation

## 📊 Tableaux de bord de traçabilité

- **Timeline d'évolution**: Visualisation chronologique des changements
- **Heatmap de modification**: Identification des modules à forte évolution
- **Matrice de responsabilité**: Traçabilité des décisions par contributeur
- **Métriques de documentation**: Évaluation de la qualité de la documentation

## 🔒 Conservation à long terme

- Archivage mensuel des documents de traçabilité
- Snapshot des décisions techniques importantes (ADR)
- Historique immuable conservé dans des stockages redondants
- Documentation des raisonnements derrière les choix techniques majeurs

## 🔄 Alignement avec le pipeline d'automatisation

Le cahier des charges évolue de manière synchronisée avec le pipeline d'automatisation pour maintenir une cohérence parfaite entre la documentation et l'implémentation.

### Synchronisation automatique

À chaque mise à jour significative du pipeline (n8n, agents MCP, rapports d'audit), le système peut automatiquement :

- **Proposer une mise à jour du cahier des charges** pour refléter les nouvelles capacités ou contraintes
- **Réorganiser ou clarifier les priorités** en fonction des avancées techniques
- **Ajouter des dépendances techniques ou des modules manquants** identifiés lors de l'exécution

### Mécanisme d'intégration

\`\`\`mermaid
graph TD
    A[Changement Pipeline] -->|Détecté| B[Analyse d'impact]
    B --> C{Mise à jour requise?}
    C -->|Oui| D[Génération proposition CDC]
    C -->|Non| E[Log d'audit]
    D --> F[Pull Request]
    F --> G[Revue]
    G --> H[Mise à jour CDC]
\`\`\`

### Agent de mise à jour continue

Le système fonctionne comme un agent proactif qui accompagne l'évolution du cahier des charges:

1. **Lecture continue**
   - Analyse du contenu du cahier des charges à chaque nouvelle itération
   - Détection automatique des sections nouvelles, incomplètes ou floues
   - Proposition d'ajouts, reformulations, ou restructurations selon la logique du projet
   - Évaluation continue de la cohérence et de la complétude globale

2. **Analyse continue des nouvelles sections**
   - Détection automatique des ajouts et modifications
   - Analyse sémantique du contenu pour identifier le contexte
   - Évaluation de la cohérence avec les sections existantes

3. **Propositions d'évolution intelligentes**
   - Suggestions d'améliorations basées sur l'analyse contextuelle
   - Identification des impacts sur d'autres sections du cahier
   - Génération de propositions concrètes et actionnables

4. **Restructuration et reformulation**
   - Harmonisation du style et du format avec l'ensemble du document
   - Réorganisation logique des éléments pour une meilleure lisibilité
   - Clarification des concepts ambigus ou complexes

5. **Suggestions intelligentes**
   - Ajout de sous-sections ou de détails manquants pour compléter la documentation
   - Mise à jour des plans d'action, roadmap et dépendances techniques
   - Établissement de liens avec les fichiers associés (.audit.md, .backlog.json, etc.)
   - Génération de contenu contextualisé adapté à chaque section
   - Identification proactive des évolutions nécessaires

6. **Complétion proactive**
   - Identification des informations manquantes mais nécessaires
   - Suggestions de contenu additionnel cohérent avec l'existant
   - Enrichissement des sections avec des exemples pertinents

7. **Historique des interventions**
   - Journal détaillé des analyses effectuées
   - Traçabilité des suggestions proposées et appliquées
   - Versioning des modifications avec justifications
   - Documentation de chaque évolution dans un encadré type changelog standardisé
   
   \`\`\`md
   > [!CHANGELOG]
   > ## Évolution documentée
   > 
   > **Date:** YYYY-MM-DD  
   > **Type:** Ajout | Modification | Suppression | Refactoring  
   > **Section:** Nom de la section modifiée  
   > 
   > **Changements:**  
   > - Description précise des changements effectués
   > - Impact sur les autres sections
   > 
   > **Justification:**  
   > Explication du raisonnement et de la valeur ajoutée
   \`\`\`

   - Liaison systématique entre les modifications du code et les mises à jour documentaires
   - Conservation de l'historique complet des révisions avec possibilité de comparaison

8. **Alignement continu avec le pipeline**
   - Synchronisation automatique avec les mises à jour du pipeline (n8n, agents MCP, rapports d'audit)
   - Proposition proactive de mises à jour du cahier des charges pour refléter les évolutions techniques
   - Réorganisation et clarification des priorités en fonction des avancées constatées
   - Ajout des dépendances techniques ou modules manquants identifiés lors des exécutions
   - Maintien d'une cohérence parfaite entre la documentation et l'implémentation réelle
   - Génération de suggestions contextuelles basées sur l'évolution observée du système

9. **Fonctionnement comme agent de mise à jour continue**
   - Lecture attentive des nouvelles sections à chaque ajout pour compréhension du contexte
   - Proposition automatique des évolutions nécessaires à apporter aux sections connexes
   - Restructuration ou reformulation du contenu pour maintenir la cohérence globale
   - Complétion des parties manquantes en respectant le style et la logique d'ensemble
   - Conservation d'un historique clair et détaillé de toutes les modifications apportées
   - Adaptation continue aux besoins évolutifs du projet et de sa documentation

### Triggers de mise à jour

| Événement Pipeline | Action sur le CDC | Priorité |
|-------------------|-------------------|----------|
| Nouvel agent IA | Ajout documentation capacités | Haute |
| Nouveau workflow n8n | Mise à jour process | Moyenne |
| Modification schéma BDD | Mise à jour spécifications | Haute |
| Nouveau rapport d'audit | Mise à jour métriques | Basse |
| Évolution architecture | Mise à jour diagrammes | Haute |

### Validation des suggestions automatiques

1. Toute suggestion de mise à jour est générée sous forme de Pull Request
2. Un diff visuel montre clairement les changements proposés
3. Des explications détaillées justifient chaque changement substantiel
4. L'acceptation finale reste sous contrôle humain pour garantir la pertinence

Cette approche garantit que le cahier des charges reste continuellement aligné avec les évolutions techniques du projet, tout en conservant un niveau de qualité et de pertinence optimal.
EOL

cat > "$CDC_DIR/changelog.md" << EOL
# Historique des modifications

## $(date +'%Y-%m-%d') - Initialisation du cahier des charges
- Création de la structure initiale
- Définition des grandes sections
- Configuration du suivi automatique
EOL

echo "✅ Structure du cahier des charges initialisée dans $CDC_DIR/"
echo "📝 Vous pouvez maintenant éditer les fichiers pour les adapter à votre projet."
echo "🔄 Utilisez ./update-cahier.sh pour mettre à jour le sommaire automatiquement."
chmod +x "$0"
