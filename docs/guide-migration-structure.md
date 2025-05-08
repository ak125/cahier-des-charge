# Guide de Migration vers la Nouvelle Structure de Projet

*Date: 3 mai 2025*

Ce guide explique comment migrer vers la nouvelle structure de projet standardisée selon le rapport d'obsolescence du 3 mai 2025. La nouvelle structure suit les standards modernes de monorepo avec Nx et simplifie considérablement la navigation dans le code.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Étapes de migration](#étapes-de-migration)
3. [Mise à jour des imports](#mise-à-jour-des-imports)
4. [Structure des dossiers](#structure-des-dossiers)
5. [Configuration Nx](#configuration-nx)
6. [Validation CI/CD](#validation-cicd)
7. [Meilleures pratiques](#meilleures-pratiques)
8. [Résolution des problèmes courants](#résolution-des-problèmes-courants)

## Vue d'ensemble

La migration de notre projet vers une structure Nx standard vise à résoudre plusieurs problèmes identifiés dans le rapport d'obsolescence, notamment :

- Plus de 50 dossiers à la racine rendant la navigation difficile
- Duplication de code entre différents dossiers
- Manque de standardisation dans l'organisation du code
- Difficultés pour mettre en place des builds incrémentaux

La nouvelle structure est organisée comme suit :

```
/
├── apps/                    # Applications (standard Nx)
│   ├── api/                 # API NestJS
│   ├── frontend/            # UI Remix
│   ├── dashboard/           # Dashboard d'administration
│   └── mcp-server/          # Serveur MCP
├── packages/                # Bibliothèques partagées (standard Nx)
│   ├── agents/              # Agents MCP unifiés
│   │   ├── base/            # Classes de base et interfaces
│   │   ├── php-analyzer/    # Agent analyse PHP
│   │   ├── wasm/            # Implémentations WASM
│   │   └── seo/             # Agents SEO consolidés
│   ├── orchestration/       # Orchestrateurs consolidés
│   ├── business/            # Logique métier
│   ├── ui/                  # Composants UI partagés
│   └── utils/               # Utilitaires consolidés
├── tools/                   # Outils de développement
│   ├── generators/          # Générateurs Nx personnalisés
│   ├── executors/           # Executors Nx personnalisés
│   └── scripts/             # Scripts d'administration
├── prisma/                  # Modèles Prisma unifiés
│   └── schema.prisma        # Schéma DB principal
├── manifests/               # Manifestes MCP
├── migrations/              # Scripts de migration DB
├── docker/                  # Configuration Docker
├── docs/                    # Documentation projet
├── wasm-modules/            # Modules WASM compilés
├── nx.json                  # Configuration Nx
├── package.json             # Dépendances projet
├── pnpm-workspace.yaml      # Configuration pnpm
├── earthfile                # Configuration Earthfile
└── docker-compose.yml       # Orchestration services
```

## Étapes de migration

La migration vers la nouvelle structure de projet s'effectue en plusieurs étapes :

### 1. Exécuter le script de restructuration

Le script `tmp-restructuration/restructure.sh` déplace automatiquement les dossiers et fichiers vers leur nouvelle emplacement :

```bash
# Exécuter en mode simulation pour vérifier les changements sans les appliquer
./tmp-restructuration/restructure.sh

# Exécuter en mode réel pour appliquer les changements
./tmp-restructuration/restructure.sh --execute
```

### 2. Mettre à jour les imports

Une fois les fichiers déplacés, vous devez mettre à jour les imports dans le code. Utilisez le script fourni :

```bash
# Exécuter en mode simulation pour voir les changements
node ./tools/scripts/update-imports.js --dry-run --verbose --path=/workspaces/cahier-des-charge

# Appliquer les changements
node ./tools/scripts/update-imports.js --path=/workspaces/cahier-des-charge
```

### 3. Configurer les alias TypeScript

Le fichier `tsconfig.json` doit être mis à jour pour inclure les alias correspondant à la nouvelle structure :

```json
{
  "compilerOptions": {
    "paths": {
      "@packages/agents/*": ["packages/agents/*"],
      "@packages/agents": ["packages/agents/index.ts"],
      "@packages/orchestration/*": ["packages/orchestration/*"],
      "@packages/orchestration": ["packages/orchestration/index.ts"],
      "@packages/business/*": ["packages/business/*"],
      "@packages/business": ["packages/business/index.ts"],
      "@packages/ui/*": ["packages/ui/*"],
      "@packages/ui": ["packages/ui/index.ts"],
      "@packages/utils/*": ["packages/utils/*"],
      "@packages/utils": ["packages/utils/index.ts"]
    }
  }
}
```

### 4. Mettre à jour les configurations CI/CD

Les workflows CI/CD doivent être mis à jour pour refléter la nouvelle structure de dossiers. Les modifications principales concernent les chemins des fichiers et les commandes NX.

## Mise à jour des imports

Le script `tools/scripts/update-imports.js` vous permet de mettre à jour automatiquement les imports dans votre code. Il prend en charge les modèles d'importation suivants :

### Avant la migration

```typescript
// Importation d'un orchestrateur
import { OrchestratorBridge } from '../../agents/integration/orchestrator-bridge';

// Importation d'un agent
import { PhpAnalyzer } from '../../agents/php-analyzer';

// Importation d'utilitaires
import { logger } from '../../utils/logger';
```

### Après la migration

```typescript
// Importation d'un orchestrateur
import { OrchestratorBridge } from '@packages/orchestration';

// Importation d'un agent
import { PhpAnalyzer } from '@packages/agents/php-analyzer';

// Importation d'utilitaires
import { logger } from '@packages/utils/logger';
```

## Structure des dossiers

### Apps

Le dossier `apps/` contient des applications complètes et exécutables :

- **`api/`** : API backend NestJS
- **`frontend/`** : Interface utilisateur Remix
- **`dashboard/`** : Dashboard d'administration
- **`mcp-server/`** : Serveur MCP principal

### Packages

Le dossier `packages/` contient des bibliothèques partagées :

- **`agents/`** : Tous les agents MCP
- **`orchestration/`** : Module d'orchestration unifié
- **`business/`** : Logique métier partagée
- **`ui/`** : Composants d'interface utilisateur partagés
- **`utils/`** : Utilitaires génériques

### Autres dossiers importants

- **`tools/`** : Scripts et outils de développement
- **`prisma/`** : Modèles de données Prisma centralisés
- **`docker/`** : Configuration Docker
- **`docs/`** : Documentation du projet

## Configuration Nx

Le fichier `nx.json` a été mis à jour pour refléter la nouvelle structure de projet :

- Les chemins d'accès aux applications et bibliothèques ont été mis à jour
- Les entrées nommées (`namedInputs`) ont été adaptées à la nouvelle structure
- Les cibles par défaut (`targetDefaults`) incluent maintenant des configurations pour Docker

## Validation CI/CD

Après la migration, assurez-vous que vos pipelines CI/CD fonctionnent correctement :

1. Vérifiez que les chemins des fichiers sont corrects dans les workflows
2. Exécutez `nx affected --target=lint` pour vérifier que le lint fonctionne
3. Exécutez `nx affected --target=test` pour vérifier que les tests fonctionnent
4. Exécutez `nx affected --target=build` pour vérifier que les builds fonctionnent

## Meilleures pratiques

### Organisation du code

- Placez la logique métier réutilisable dans `packages/business/`
- Placez les composants UI partagés dans `packages/ui/`
- Placez les utilitaires génériques dans `packages/utils/`
- Maintenez les applications complètes dans `apps/`

### Importations

- Utilisez toujours les alias d'importation (`@packages/...`) plutôt que des chemins relatifs
- Créez des fichiers `index.ts` dans chaque dossier pour exporter les fonctionnalités publiques

### Documentation

- Documentez chaque package avec un fichier README.md
- Utilisez les commentaires JSDoc pour documenter les fonctions et classes

## Résolution des problèmes courants

### Imports non résolus

Si vous rencontrez des erreurs d'importation après la migration :

1. Vérifiez que le fichier `tsconfig.json` est correctement configuré avec les alias
2. Assurez-vous que le module est correctement exporté dans son fichier `index.ts`
3. Exécutez `pnpm install` pour mettre à jour les dépendances

### Erreurs de build

Si vous rencontrez des erreurs lors de la construction du projet :

1. Vérifiez les logs d'erreur pour identifier le problème
2. Assurez-vous que tous les fichiers nécessaires ont été inclus dans la nouvelle structure
3. Exécutez `nx reset` pour nettoyer le cache de NX

### Problèmes de CI/CD

Si vos pipelines CI/CD échouent après la migration :

1. Vérifiez les chemins d'accès aux fichiers dans les workflows
2. Assurez-vous que les commandes NX utilisent les bons cibles
3. Mettez à jour les chemins de sortie des artefacts

---

Pour toute question ou assistance supplémentaire concernant la migration, contactez l'équipe d'architecture ou créez un ticket dans le système de suivi des problèmes.