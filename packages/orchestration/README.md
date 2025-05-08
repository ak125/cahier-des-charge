# Module d'Orchestration MCP Consolidé

Ce package contient l'implémentation consolidée de l'`OrchestratorBridge`, qui unifie les différentes versions dupliquées précédemment dispersées dans le projet.

## Objectif

L'`OrchestratorBridge` sert de point central pour l'orchestration des tâches à travers différents systèmes d'exécution :
- **BullMQ** pour les tâches simples et les files d'attente
- **Temporal.io** pour les workflows complexes de longue durée
- **n8n** pour les triggers externes et webhooks

## Installation

```bash
pnpm add @mcp/orchestration
```

## Utilisation

### Utilisation de base

```typescript
import { standardizedOrchestrator, TaskType } from '@mcp/orchestration';

// Initialisation
await standardizedOrchestrator.initialize({
  // Options de configuration
  enableNotifications: true,
  logLevel: 'info'
});

// Planification d'une tâche simple avec BullMQ
await standardizedOrchestrator.scheduleTask(
  'ma-queue',
  { data: 'valeur' },
  {
    taskType: TaskType.SIMPLE,
    attempts: 3
  }
);

// Planification d'un workflow Temporal
await standardizedOrchestrator.scheduleTask(
  'mon-workflow',
  { data: 'valeur' },
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'MonWorkflow',
      workflowArgs: ['arg1', 'arg2'],
      taskQueue: 'ma-queue-temporal',
      trackingQueue: 'suivi-workflow' // Pour suivre avec BullMQ
    }
  }
);

// Déclenchement d'un webhook n8n
await standardizedOrchestrator.scheduleTask(
  'mon-webhook',
  { event: 'notification', data: 'valeur' },
  {
    taskType: TaskType.EXTERNAL,
    n8n: {
      webhookUrl: 'https://n8n.example.com/webhook/abc123'
    }
  }
);
```

### Écoute des événements

```typescript
// Écouter les événements de l'orchestrateur
standardizedOrchestrator.on('task:completed', ({ queueName, jobId }) => {
  console.log(`Tâche ${jobId} terminée dans la queue ${queueName}`);
});

standardizedOrchestrator.on('workflow:scheduled', ({ workflowId, workflowType }) => {
  console.log(`Workflow ${workflowType} planifié avec l'ID ${workflowId}`);
});
```

### Création d'un worker BullMQ

```typescript
// Créer un worker pour une file d'attente
const worker = standardizedOrchestrator.createBullMQWorker(
  'ma-queue',
  async (job) => {
    console.log(`Traitement de la tâche ${job.id}`);
    // Logique de traitement
    return { result: 'succès' };
  }
);
```

## Configuration avancée

### Options de configuration complètes

```typescript
import { OrchestratorBridge } from '@mcp/orchestration';

const orchestrator = new OrchestratorBridge({
  // Options générales
  enableNotifications: true,
  logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error'
  autoReconnect: true,

  // Options BullMQ
  bullmq: {
    connection: {
      host: 'localhost',
      port: 6379
    },
    defaultQueueOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  },

  // Options Temporal
  temporal: {
    namespace: 'default',
    taskQueue: 'default-task-queue',
    serverUrl: 'localhost:7233'
  },

  // Options n8n
  n8n: {
    serverUrl: 'https://n8n.example.com',
    apiKey: 'votre-api-key',
    webhookSecret: 'votre-webhook-secret'
  },

  // Options de métriques
  metrics: {
    enabled: true,
    collectInterval: 60000 // ms
  }
});

await orchestrator.initialize();
```

## Guide de migration

Pour migrer depuis les anciennes implémentations d'`OrchestratorBridge`, suivez ces étapes :

### 1. Remplacer les importations

Avant :
```typescript
// Depuis les anciennes implémentations
import { OrchestratorBridge } from '../agents/integration/orchestrator-bridge';
// ou
import OrchestratorBridge from '../agents/notification/orchestrator-bridge';
```

Après :
```typescript
import { OrchestratorBridge, standardizedOrchestrator } from '@mcp/orchestration';
```

### 2. Adapter les appels aux méthodes

#### Migration depuis BullMQ direct

Avant :
```typescript
const queue = new Queue('ma-queue', options);
const job = await queue.add('job-name', data, jobOptions);
```

Après :
```typescript
const result = await standardizedOrchestrator.scheduleTask(
  'ma-queue',
  data,
  {
    taskType: TaskType.SIMPLE,
    bullmq: {
      jobOptions: jobOptions
    }
  }
);
```

#### Migration depuis Temporal direct

Avant :
```typescript
const client = new Client({ ... });
const handle = await client.workflow.start(workflowType, workflowArgs, options);
```

Après :
```typescript
const result = await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: workflowType,
      workflowArgs: workflowArgs,
      taskQueue: options.taskQueue
    }
  }
);
```

#### Migration depuis startTemporalWorkflowWithBullMQTracking

Avant :
```typescript
await orchestratorBridge.startTemporalWorkflowWithBullMQTracking({
  workflowType: 'MonWorkflow',
  workflowArgs: args,
  taskQueue: 'ma-queue',
  trackingQueue: 'suivi'
});
```

Après :
```typescript
await standardizedOrchestrator.scheduleTask(
  'MonWorkflow',
  args[0], // Généralement le premier argument contient les données principales
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'MonWorkflow',
      workflowArgs: args,
      taskQueue: 'ma-queue',
      trackingQueue: 'suivi'
    }
  }
);
```

## Meilleurs pratiques

1. **Utilisez l'instance standardisée** : Préférez utiliser `standardizedOrchestrator` plutôt que de créer de nouvelles instances.
2. **Gestion des erreurs** : Encadrez les appels à `scheduleTask` dans des blocs try/catch.
3. **Utilisation des événements** : Tirez parti du système d'événements pour suivre les tâches.
4. **Surveillance** : Consultez les métriques exposées par l'orchestrateur pour surveiller les performances.
5. **Nettoyage** : Appelez `shutdown()` pour libérer proprement les ressources.

## Remarques

- Cette implémentation est rétrocompatible avec les anciennes implémentations via les fichiers de redirection.
- Pour plus de détails sur la migration, consultez le rapport d'orchestration complet dans `/docs/orchestration-migration-report.md`.