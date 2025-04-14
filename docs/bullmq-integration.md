# Intégration BullMQ pour MCP Pipeline

Ce module fournit une intégration complète de BullMQ dans le pipeline MCP pour gérer efficacement les files d'attente, les jobs et les workflows complexes de migration PHP vers Remix.

## 🚀 Fonctionnalités

- **Gestion des files d'attente prioritaires** : Traitement prioritaire des fichiers importants
- **Retries automatiques** : Tentatives automatiques en cas d'échec avec délai exponentiel
- **Workflows complexes** : Orchestration de workflows avec dépendances et étapes séquentielles
- **Interface de monitoring** : Dashboard Bull Board pour visualiser et gérer les jobs
- **API REST complète** : API pour intégrer BullMQ dans vos applications
- **Dashboard Remix** : Interface utilisateur Remix pour visualiser les jobs en temps réel

## 📋 Prérequis

- Node.js v16+
- Redis (local ou via Docker)
- pnpm

## 🔧 Installation

```bash
# Installer les dépendances
pnpm add bullmq @nestjs/bullmq @bull-board/api @bull-board/express -w
```

## 🏃‍♂️ Démarrage rapide

```bash
# Démarrer l'écosystème BullMQ complet (serveur, workers, orchestrateur)
./scripts/start-bullmq-ecosystem.sh
```

## 📊 Composants principaux

### 1. Service BullQueue (NestJS)

Module NestJS qui encapsule les fonctionnalités BullMQ et expose des méthodes utilitaires pour ajouter des jobs avec différentes priorités.

```typescript
// Ajouter un job d'analyse PHP
await bullQueueService.addPhpAnalyzerJob('/path/to/file.php', { priority: 10 });
```

### 2. Workers BullMQ

Workers qui traitent les jobs en arrière-plan avec une concurrence configurable.

```typescript
// Démarrer le worker PHP
await startPhpAnalyzerWorker();
```

### 3. Orchestrateur BullMQ

Coordonne les workflows complexes avec des dépendances entre jobs.

```typescript
// Initialiser l'orchestrateur
const orchestrator = new BullMqOrchestrator();
await orchestrator.initialize();

// Ajouter un workflow d'analyse de répertoire
await orchestrator.orchestrateDirectoryAnalysis('/path/to/dir');
```

### 4. Interface Bull Board

Interface utilisateur pour visualiser et gérer les jobs. Accessible à l'adresse:
```
http://localhost:3030/queues
```

### 5. Dashboard Remix

Interface utilisateur Remix pour visualiser les jobs en temps réel. Accessible à l'adresse:
```
http://localhost:3000/dashboard/bullmq
```

## 📝 Exemples d'utilisation

### Exemple 1: Ajouter un job d'analyse PHP via l'API REST

```bash
curl -X POST http://localhost:3030/api/jobs/php-analyzer \
  -H 'Content-Type: application/json' \
  -d '{"filePath":"/test/example.php"}'
```

### Exemple 2: Créer un workflow de migration automatisé

Voir le fichier d'exemple `examples/php-to-remix-migration-workflow.ts` pour un workflow complet de migration PHP vers Remix.

```bash
# Exécuter l'exemple de workflow
pnpm ts-node examples/php-to-remix-migration-workflow.ts
```

## 🔍 Surveillance et monitoring

- Utilisez Bull Board pour surveiller les jobs en temps réel: `http://localhost:3030/queues`
- Utilisez le dashboard Remix pour visualiser les statistiques: `http://localhost:3000/dashboard/bullmq`
- Consultez les logs des workers pour plus de détails

## 📚 Architecture

L'intégration BullMQ dans le pipeline MCP suit une architecture basée sur les files d'attente:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    n8n      │────▶│    API      │────▶│  BullMQ     │
│  Workflows  │     │  Gateway    │     │  Queues     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐
│   Remix     │◀────│  NestJS     │◀────│   BullMQ    │
│ Dashboard   │     │  Backend    │     │   Workers   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 🛠️ Configuration avancée

### Environnement Redis

```
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Concurrence des workers

```
PHP_WORKER_CONCURRENCY=2
JS_WORKER_CONCURRENCY=2
```

### Priorités des jobs

- 1-10: Priorité basse à haute (1 = la plus basse, 10 = la plus haute)
- Valeur par défaut: 1

## 🤝 Intégration avec d'autres systèmes

- **n8n**: Utilisez l'API REST pour ajouter des jobs depuis les workflows n8n
- **MCP Agents**: Les agents MCP peuvent être déclenchés par des jobs BullMQ
- **PostgreSQL Listeners**: Peut déclencher des jobs BullMQ via l'API REST

## 📄 Licence

MIT