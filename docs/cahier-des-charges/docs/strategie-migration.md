# Stratégie de migration PHP → NestJS/Remix

Ce document détaille l'approche méthodologique pour migrer progressivement l'application PHP legacy vers l'architecture moderne NestJS (backend) et Remix (frontend).

## Principes directeurs

La migration s'appuie sur quatre principes fondamentaux :

1. **Progressivité** : Avancer par petites étapes sécurisées, sans big-bang
2. **Priorisation** : Identifier les modules critiques et à fort impact
3. **Découplage** : Réduire les interdépendances avant la migration
4. **Tests** : Valider chaque étape avec des tests automatisés et manuels

## Évaluation des fichiers

Chaque fichier PHP est évalué selon plusieurs critères pour déterminer sa stratégie de migration :

### 1. Impact transverse

L'impact transverse mesure à quel point le fichier est utilisé par d'autres composants :

| Critère | Description | Métrique |
|---------|-------------|----------|
| Centralité | Degré d'interconnexion dans le graphe | Score 0-1 |
| Fichiers appelants | Nombre de fichiers qui dépendent de celui-ci | Nombre |
| Fichiers appelés | Nombre de dépendances | Nombre |
| Type de module | Rôle fonctionnel du fichier | Catégorisation |

Les fichiers à fort impact (centralité > 0.7 ou nombreux appelants) nécessitent une approche de migration plus prudente.

### 2. Scoring de migration

Chaque fichier reçoit une note de difficulté de migration (0-5) basée sur :

| Critère | Description | Poids |
|---------|-------------|-------|
| Couplage interne | Dépendances avec d'autres composants | 25% |
| Complexité métier | Importance et subtilité des règles métier | 25% |
| Qualité technique | Dette technique et organisation du code | 20% |
| Dépendances externes | API, bibliothèques, systèmes externes | 15% |
| Volume | Taille et scope du fichier | 15% |

Le score final (🌟 à 🌟🌟🌟🌟🌟) détermine l'effort et les risques associés à la migration.

### 3. Besoin de refactoring

Certains fichiers nécessitent un refactoring PHP avant la migration :

- Structure très imbriquée ou monolithique
- Mélange de HTML et logique métier sans séparation
- Requêtes SQL directement dans le flux de rendu
- Chemins d'inclusion dynamiques ou variables

Dans ces cas, une phase de refactoring intermédiaire est recommandée avant la migration effective.

## Vagues de migration

La migration est organisée en 4 vagues séquentielles :

### Vague 1 : Infrastructure et composants de base

- Mise en place de l'architecture NestJS/Remix
- Migration des composants utilitaires et de configuration
- Création des modèles Prisma et validation de l'architecture de données
- **Durée estimée** : 2-3 semaines

### Vague 2 : Composants critiques à fort impact

- Migration des services partagés (authentification, session, panier)
- Mise en place des stratégies de routage et middlewares
- Phase de coexistence entre ancien et nouveau système
- **Durée estimée** : 3-4 semaines

### Vague 3 : Fonctionnalités métier principales

- Migration des modules métier (produits, commandes, utilisateurs)
- Développement des routes et loaders Remix
- Intégration avec les APIs NestJS
- **Durée estimée** : 4-6 semaines

### Vague 4 : Fonctionnalités secondaires et finalisation

- Migration des fonctionnalités restantes
- Optimisations de performance
- Finalisation des tests et de la documentation
- **Durée estimée** : 2-3 semaines

## Plan d'action par fichier

Pour chaque fichier PHP, un plan de migration détaillé est généré avec :

1. **Analyse d'impact** : Dépendances entrantes et sortantes
2. **Scoring de difficulté** : Évaluation quantitative
3. **Refactoring préliminaire** : Actions recommandées avant migration
4. **Mapping PHP → NestJS/Remix** : Correspondance entre éléments source et cible
5. **Tâches techniques** : Liste précise d'actions à effectuer
6. **Risques anticipés** : Problèmes potentiels et stratégies d'atténuation

## Outils d'aide à la migration

Plusieurs outils sont développés pour faciliter le processus :

1. **Générateur de plan de migration** : Crée automatiquement un fichier `.migration_plan.md` pour chaque fichier PHP
2. **Tableau de bord de migration** : Application Remix permettant de visualiser l'avancement et les dépendances
3. **Générateurs de squelettes** : Création automatique de contrôleurs, services et routes basés sur l'analyse
4. **Tests de non-régression** : Comparaison automatique des sorties entre ancienne et nouvelle implémentation

## Gouvernance de la migration

La migration est supervisée par :

- **Revues de code** : Validation des PRs avec attention particulière aux fichiers à fort impact
- **Points de synchronisation** : Réunion hebdomadaire pour évaluer l'avancement et les blocages
- **Validation incrémentale** : Tests utilisateurs par fonctionnalité migrée

## Exemple de plan de migration

Voici un exemple simplifié de plan de migration pour un fichier :

```markdown
# Plan de migration pour panier.php

## Résumé
- Difficulté: 🟠 Élevée
- Impact transverse: 8/10
- Score de migration: 🌟🌟🌟🌟 (4/5)
- Vague de migration: 2
- Refactoring préalable: Oui

## Impact transverse
- Utilisé par 12 fichiers
- Centralité: 0.82
- Type: Service critique partagé (cart / session)

## Refactoring préliminaire
- Extraire les appels SQL en fonctions séparées
- Supprimer le HTML inline
- Ajouter une couche d'abstraction pour la session

## Plan NestJS
- CartModule avec CartService et CartController
- Modèle Prisma pour Cart et CartItem
- Middleware de session Redis

## Plan Remix
- Route /panier avec loader et action
- Formulaires avec validation zod
- Gestion d'état via useFetcher()
```

Ce plan détaillé permet une migration méthodique, réduisant les risques et maximisant l'efficacité du processus.
