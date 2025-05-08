# Configuration standardisée pour NX

Ce document décrit la configuration standardisée NX adoptée pour notre monorepo, conformément à notre stratégie technologique "ADOPTER" pour NX.

## Introduction

NX est notre framework principal pour la gestion du monorepo, permettant l'exécution optimisée des builds/tests et la mise en cache intelligente des artefacts. Cette configuration standardisée assure la cohérence des processus de développement et de CI/CD à travers tous nos projets.

## Structure de la configuration

### Configuration NX de base

Notre configuration NX dans `nx.json` définit :

- **TasksRunnerOptions** : Configuration du cache et de l'exécution parallèle
- **NamedInputs** : Définition des ensembles de fichiers utilisés par les différentes tâches
- **TargetDefaults** : Configuration par défaut pour build, test, lint, etc.
- **Plugins** : Intégrations avec ESLint, Jest, Webpack et Storybook
- **Generators** : Configuration par défaut pour la génération de code

### Intégration avec NX Cloud

Nous utilisons NX Cloud pour :
- Mise en cache distribuée des builds
- Exécution distribuée en CI/CD
- Reporting et analytics des builds

## Commandes standardisées

### Développement local

```bash
# Démarrer le serveur de développement d'une application
nx serve nom-de-l-app

# Lancer les tests d'un projet
nx test nom-du-projet

# Lancer le linter sur un projet
nx lint nom-du-projet

# Vérifier les types TypeScript
nx typecheck nom-du-projet
```

### Commandes affectées (optimisées)

```bash
# Lancer les tests uniquement sur les projets affectés par vos changements
nx affected:test

# Construire uniquement les projets affectés par vos changements
nx affected:build

# Lancer le linter uniquement sur les projets affectés
nx affected:lint

# Vérifier les types uniquement sur les projets affectés
nx affected:typecheck
```

### Commandes pour plusieurs projets

```bash
# Exécuter une commande sur plusieurs projets
nx run-many --target=build --projects=frontend,backend

# Exécuter une commande sur tous les projets
nx run-many --target=test --all
```

## Structure du monorepo

Notre monorepo suit cette structure standardisée :

```
/
├── apps/               # Applications déployables
│   ├── frontend/       # Application frontend
│   ├── admin-dashboard/# Dashboard d'administration
│   ├── backend/        # Service backend principal
│   └── mcp-server/     # Serveur MCP
├── packages/           # Bibliothèques partagées
│   ├── ui/             # Composants UI réutilisables
│   ├── schema-validation/ # Validation de schémas
│   └── common/         # Utilitaires communs
├── tools/              # Scripts et outils de développement
└── nx.json             # Configuration NX
```

## Standards de nommage

- **Applications** : Noms descriptifs en minuscules avec tirets (`frontend`, `admin-dashboard`)
- **Bibliothèques** : Noms fonctionnels en minuscules avec tirets (`ui`, `schema-validation`)
- **Tags** : Utiliser `scope:frontend`, `scope:backend`, `type:ui`, `type:util`, etc.

## Dépendances entre projets

Suivez ces règles de dépendance :

1. Les applications peuvent dépendre des bibliothèques
2. Les bibliothèques ne doivent pas dépendre des applications
3. Évitez les dépendances circulaires entre bibliothèques
4. Utilisez les tags pour limiter les dépendances (voir `dependency-rules.json`)

## CI/CD avec NX

Notre configuration CI/CD est intégrée via GitHub Actions :

1. **NX Cloud CI** (`nx-cloud.yml`) : Pipeline principal qui utilise NX Cloud pour exécuter les builds, tests, etc.
2. **Deploy Production** (`deploy-production.yml`) : Déploiement en production qui utilise NX pour les builds et déploiements
3. **Earthly Builds** (`earthly-builds.yml`) : Builds reproductibles pour les applications complexes

## Bonnes pratiques

### Performance

- Utilisez `nx affected` pour limiter les exécutions aux projets affectés
- Activez le cache NX (`useDaemonProcess: true`)
- Ne désactivez pas le cache sans raison valable

### Structure du code

- Partagez le code commun dans des bibliothèques
- Utilisez les schémas NX pour générer du code cohérent
- Créez des bibliothèques à responsabilité unique

### Tests

- Écrivez des tests unitaires pour toutes les bibliothèques
- Configurez des tests e2e pour les applications
- Utilisez les collecteurs de couverture de code

## Migration depuis GitLab CI

Conformément à notre stratégie "ÉLIMINER" pour GitLab CI, migrez tous les workflows de la manière suivante :

1. Identifiez les workflows GitLab CI existants
2. Mappez-les aux workflows GitHub Actions équivalents
3. Utilisez NX pour optimiser les builds et tests
4. Supprimez les fichiers `.gitlab-ci.yml` une fois migrés

## Ressources

- [Documentation NX officielle](https://nx.dev/getting-started/intro)
- [NX Cloud](https://nx.app/)
- [GitHub Actions avec NX](https://nx.dev/ci/recipes/github-actions)
- [Earthly avec NX](https://docs.earthly.dev/examples/nx)