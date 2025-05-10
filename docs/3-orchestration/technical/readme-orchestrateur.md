---
title: Readme Orchestrateur
description: Orchestrateur standardisé et coordination
slug: readme-orchestrateur
module: 3-orchestration
category: technical
status: stable
lastReviewed: 2025-05-09
---

# Orchestrateur Intelligent de Migration PHP vers Remix

> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) ou Temporal.io (pour les workflows complexes).



> Solution d'orchestration intelligente, automatisée et priorisée pour la migration de code PHP vers Remix, parfaitement adaptée à la complexité du monorepo.

## 📋 Vue d'ensemble


L'orchestrateur de migration est une solution complète pour gérer le processus de migration de PHP vers Remix dans un environnement monorepo complexe. Il offre:

- **Orchestration intelligente**: Analyse des dépendances entre fichiers pour déterminer l'ordre optimal de migration
- **Priorisation métier**: Définition de priorités pour les fichiers critiques
- **Automatisation**: Pipeline automatisé via n8n avec intégration GitHub
- **Validation qualité**: Vérification des différences entre PHP et Remix pour assurer la conformité fonctionnelle
- **Mode simulation**: Possibilité de tester le processus sans modifications réelles du code

## 🔧 Architecture


La solution est composée des modules suivants:

1. **MigrationOrchestrator** (`agents/migration-orchestrator.ts`) - Cœur du système qui gère l'orchestration des migrations

2. **DependencyResolver** (`packages/mcp-orchestrator/dependency-resolver.ts`) - Analyse les relations entre fichiers PHP

3. **DiffChecker** (`packages/mcp-orchestrator/diff-checker.ts`) - Compare les fichiers PHP avec les versions Remix générées

4. **AgentRunner** (`packages/mcp-orchestrator/agent-runner.ts`) - Exécute les agents MCP dans le bon ordre

5. **Workflows n8n** (`n8n.migration-orchestrator.json`) - Automatise le déclenchement du processus de migration

## 🚀 Installation


### Méthode automatique (recommandée)


Utilisez notre script de déploiement qui configure automatiquement tous les composants nécessaires:

```bash


# Accorder les permissions d'exécution au script

chmod +x scripts/deploy-migration-orchestrator.sh

# Lancer le script de déploiement

./scripts/deploy-migration-orchestrator.sh
```

### Options du script de déploiement


```
--help                  Affiche l'aide
--dry-run               Exécute en mode simulation
--skip-docker           Ignore l'installation Docker
--skip-n8n              Ignore la configuration de n8n
--redis-url <url>       Spécifie l'URL Redis (défaut: redis://localhost:6379)
--supabase-url <url>    Spécifie l'URL Supabase
--supabase-key <key>    Spécifie la clé Supabase
--config <file>         Utilise un fichier de configuration personnalisé
--prod                  Installe en mode production
```

### Prérequis


- Node.js v16.x ou supérieur
- npm ou pnpm
- Docker et Docker Compose (optionnel)
- n8n (optionnel, pour l'automatisation complète)

## 📝 Configuration


### Structure du fichier discovery_map.json


Le fichier `discovery_map.json` contient la liste des fichiers PHP à migrer avec leurs métadonnées:

```json
[
  {
    "name": "index.php",
    "path": "legacy/index.php",
    "type": "php",
    "priority": 100,
    "dependencies": [],
    "metadata": {
      "routeType": "homepage",
      "isCritical": true,
      "hasDatabase": true,
      "hasAuthentication": false
    }
  }
]
```

| Propriété | Description |
|-----------|-------------|
| `name` | Nom du fichier |
| `path` | Chemin relatif du fichier |
| `type` | Type de fichier (généralement "php") |
| `priority` | Priorité de migration (plus élevé = plus prioritaire) |
| `dependencies` | Liste des fichiers dont dépend celui-ci |
| `metadata` | Métadonnées supplémentaires pour personnaliser le comportement |

### Fichier de configuration


Vous pouvez créer un fichier `migration-config.json` à la racine du projet:

```json
{
  "redisUrl": "redis://localhost:6379",
  "supabaseUrl": "https://votre-projet.supabase.co",
  "supabaseKey": "votre-clé-supabase",
  "simulationMode": false,
  "maxRetries": 3,
  "timeout": 60000
}
```

## 🏃‍♂️ Utilisation


### Démarrer l'orchestrateur


```bash


# Mode normal

npm start

# Mode simulation (sans modifications réelles)

npm run start:dry-run
```

### Vérifier les différences entre fichiers PHP et TSX


```bash
npm run diff chemin/vers/fichier.php chemin/vers/fichier.tsx
```

### Analyser les dépendances entre fichiers PHP


```bash
npm run dependency-graph
```

### Via n8n


1. Accédez à votre instance n8n (par défaut: http://localhost:5678)
2. Importez le workflow `n8n.migration-orchestrator.json`
3. Configurez les variables dans le nœud "Config"
4. Activez le workflow

## 🔄 Workflow de migration


L'orchestrateur suit le processus suivant:

1. **Découverte** - Détection des fichiers PHP à migrer via le fichier `discovery_map.json` ou automatiquement via les commits Git
2. **Analyse des dépendances** - Identification des relations entre fichiers
3. **Priorisation** - Ordonnancement en fonction des priorités et dépendances
4. **Exécution séquentielle** - Traitement des fichiers dans l'ordre optimal:
   - Analyse du fichier PHP par `php-analyzer`
   - Génération du code Remix par `remix-generator`
   - Vérification qualité par `qa-analyzer` et `diff-verifier`
   - Finalisation par `dev-linter`
5. **Validation** - Vérification des différences entre le fichier PHP original et le fichier Remix généré
6. **Reporting** - Génération de rapports sur l'état d'avancement des migrations

## 👥 Intégration avec les agents MCP


L'orchestrateur s'intègre avec les autres agents MCP via Redis/BullMQ:

- `php-analyzer` - Analyse la structure du code PHP
- `remix-generator` - Convertit le code PHP en composants Remix
- `qa-analyzer` - Vérifie la qualité du code généré
- `diff-verifier` - Compare les fonctionnalités du code original et généré
- `dev-linter` - Assure la conformité du code avec les standards du projet

## 📊 Tableau de bord et monitoring


L'état des migrations est suivi dans le fichier `status.json` et peut être visualisé via:

1. **Supabase** - Si configuré, les données sont synchronisées avec Supabase
2. **n8n Dashboard** - Via le workflow de monitoring
3. **Rapports générés** - Disponibles dans le dossier `diff-reports`

## ⚡ Performances


L'orchestrateur est conçu pour optimiser les performances de migration:

- Exécution en parallèle limitée (configurable via `maxConcurrent`)
- Cache des résultats d'analyse
- Détection intelligente des fichiers modifiés

## 🐛 Dépannage


### Problèmes courants


1. **Erreur de connexion Redis**: Vérifiez que le service Redis est bien démarré
   ```bash
   docker-compose -f docker-compose.mcp.yml ps
   ```

2. **Agents MCP non trouvés**: Assurez-vous que le chemin des agents est correct
   ```bash
   ls -la agents/
   ```

3. **Cycle de dépendances**: L'orchestrateur détectera les dépendances circulaires et les résoudra automatiquement

### Logs


Les logs sont disponibles dans le dossier `logs/`:
```bash
cat logs/orchestrator.log
```

## 📄 License


Proprietary - Tous droits réservés

