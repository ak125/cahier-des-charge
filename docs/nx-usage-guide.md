# Guide d'utilisation de NX

Ce guide explique comment utiliser NX pour remplacer les anciennes commandes de Taskfile.

## Introduction

Dans le cadre de notre initiative de simplification des dépendances et de l'outillage, nous avons migré toutes les tâches de Taskfile vers NX. Cette migration offre plusieurs avantages :

- **Cohérence** : Une seule façon de gérer les tâches d'automatisation
- **Cachabilité** : NX met en cache les résultats des tâches pour une exécution plus rapide
- **Extensibilité** : Plus facile d'ajouter de nouvelles tâches dans un système unifié
- **Documentation** : Toutes les tâches sont documentées dans un seul emplacement (`nx.json`)

## Comment exécuter des tâches avec NX

La syntaxe générale pour exécuter une tâche NX est :

```bash
nx run <tâche>[:configuration] [-- --param1=valeur1 --param2=valeur2]
```

### Exemples d'utilisation

#### Migration de code PHP vers Remix/NestJS

```bash
# Ancienne commande (Taskfile)
task migrate -- controllers/UserController.php

# Nouvelle commande (NX)
nx run migrate -- --path=controllers/UserController.php

# Analyse d'un fichier PHP sans effectuer de migration
nx run migrate:analyze -- --path=controllers/UserController.php

# Migration par lot
nx run migrate:batch -- --count=5
```

#### Audit et vérification

```bash
# Audit complet
nx run audit

# Audit du code
nx run audit:code

# Audit de Temporal
nx run audit:temporal

# Audit SEO
nx run audit:seo

# Audit de performance
nx run audit:performance
```

#### Gestion Docker

```bash
# Démarrer les services
nx run docker:up

# Arrêter les services
nx run docker:down

# Redémarrer les services
nx run docker:restart

# Afficher les logs
nx run docker:logs -- --service=nom-du-service
```

#### CI/CD

```bash
# Toutes les vérifications CI
nx run ci:check

# Tests automatisés
nx run test

# Linting
nx run lint

# Build
nx run build

# Vérification du build
nx run build:check
```

#### Workflows n8n

```bash
# Démarrer n8n
nx run workflow:n8n-start

# Importer les workflows n8n
nx run workflow:n8n-import
```

#### Développement

```bash
# Démarrer l'environnement de développement
nx run dev
```

#### Agents MCP

```bash
# Générer ou mettre à jour le manifeste MCP
nx run manifest:generate

# Enregistrer les agents disponibles
nx run agents:register
```

## Fonctionnalités avancées de NX

### Exécution en parallèle

NX peut exécuter plusieurs tâches en parallèle :

```bash
nx run-many --target=test --all
```

### Cache intelligent

NX met en cache les résultats des tâches, ce qui accélère considérablement les exécutions ultérieures :

```bash
# Forcer une exécution sans utiliser le cache
nx run test --skip-nx-cache
```

### Afficher les tâches disponibles

```bash
nx show projects  # Afficher tous les projets
nx show project monProjet  # Afficher les détails d'un projet
nx show targets   # Afficher toutes les cibles disponibles 
```

## Orchestration standardisée

En parallèle de la migration vers NX, nous avons également standardisé notre système d'orchestration. Au lieu d'utiliser directement BullMQ, Temporal ou OrchestratorBridge, nous utilisons désormais un point d'entrée unifié :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour une tâche simple (via BullMQ)
await standardizedOrchestrator.scheduleTask(
  'nom-de-la-tache',
  {
    // Données de la tâche
  },
  {
    taskType: TaskType.SIMPLE,
    priority: 1,
    attempts: 3
  }
);

// Pour un workflow complexe (via Temporal)
await standardizedOrchestrator.scheduleTask(
  'nom-du-workflow',
  {
    // Données du workflow
  },
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: [arg1, arg2],
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Optionnel: pour suivre avec BullMQ
    }
  }
);
```

Consultez `examples/standardized-orchestrator-example.ts` pour des exemples détaillés d'utilisation.

## Structure des scripts

Les scripts NX sont organisés dans les répertoires suivants :

- `scripts/nx-tasks/` : Scripts d'implémentation pour les tâches NX
- `scripts/agent-runner.js` : Exécution des agents MCP
- `scripts/migration-orchestrator.js` : Orchestration des migrations en lot
- `scripts/docker-manager.js` : Gestion des conteneurs Docker
- `scripts/workflow-manager.js` : Gestion des workflows n8n et Temporal
- `scripts/manifest-manager.js` : Génération et validation des manifestes MCP

## Migration de code existant

Si vous rencontrez dans le code des références à BullMQ, Temporal ou OrchestratorBridge, veuillez les remplacer par notre nouvel orchestrateur standardisé, comme expliqué dans la section "Orchestration standardisée" ci-dessus.

Pour générer un rapport de migration pour votre code, exécutez :

```bash
node scripts/migrate-to-standardized-orchestration.js
```

## Besoin d'aide ?

En cas de questions ou de problèmes liés à l'utilisation de NX ou de l'orchestrateur standardisé, consultez la documentation complète ou contactez l'équipe DevOps.