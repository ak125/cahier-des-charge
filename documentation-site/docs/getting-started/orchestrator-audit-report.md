---
sidebar_position: 5
---

# Rapport d'audit des orchestrateurs
  
> Généré le : 28/04/2025 22:48:31

Ce rapport identifie toutes les utilisations directes des orchestrateurs BullMQ, Temporal et n8n dans le projet,
et propose un plan de migration vers l'orchestrateur standardisé.

## Résumé

- **Utilisations directes détectées** : 491
- **BullMQ** : 432 utilisations directes
- **Temporal** : 54 utilisations directes
- **n8n** : 5 utilisations directes
- **Orchestrateur standardisé** : 100 utilisations

## Utilisations directes de BullMQ

Les tâches suivantes utilisent BullMQ directement et devraient être migrées vers `standardizedOrchestrator.scheduleTask` avec `TaskType.SIMPLE`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 3 | `import { Queue } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue('mcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_2afd4b00.ts` | 148 | `this.queues[agentType] = new Queue('mcp-' + agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/packages/mcp-orchestrator/agent-runner.ts` | 16 | `import { Queue, QueueScheduler } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue('mcp-' + agentType, {` | SIMPLE |

<!-- Tableau tronqué pour plus de lisibilité -->

## Utilisations directes de Temporal

Les workflows suivants utilisent Temporal directement et devraient être migrés vers `standardizedOrchestrator.scheduleTask` avec `TaskType.COMPLEX`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|
| `/workspaces/cahier-des-charge/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |

<!-- Tableau tronqué pour plus de lisibilité -->

## Utilisations directes de n8n

Les intégrations suivantes utilisent n8n directement et devraient être migrées vers `standardizedOrchestrator.scheduleTask` avec `TaskType.INTEGRATION`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 251 | `await n8nClient.triggerWorkflow({ workflowId: 'abc123', payload: data });` | INTEGRATION |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 48 | `{ regex: /webhookUrl.*?n8n/, classification: 'INTEGRATION' },` | INTEGRATION |

<!-- Tableau tronqué pour plus de lisibilité -->

## Utilisations existantes de l'orchestrateur standardisé

Ces services utilisent déjà l'orchestrateur standardisé et peuvent servir d'exemples pour la migration.

| Fichier | Ligne | Utilisation détectée |
|---------|-------|---------------------|
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts` | 5 | `import { StandardizedOrchestratorAdapter } from '../../../../src/orchestration/adapters/bull-board-adapter';` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts` | 24 | `new StandardizedOrchestratorAdapter('PhpAnalyzer'),` |

<!-- Tableau tronqué pour plus de lisibilité -->

## Recommandations pour la migration

1. **Étape 1**: Commencer par migrer les cas d'utilisation BullMQ simples vers l'orchestrateur standardisé
2. **Étape 2**: Migrer ensuite les workflows Temporal complexes
3. **Étape 3**: Finaliser avec les intégrations n8n

### Exemple de migration pour BullMQ

```typescript
// Avant
import { Queue } from 'bullmq';
const queue = new Queue('my-queue');
await queue.add('my-job', { data: 'value' });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('my-queue', { data: 'value' }, { taskType: TaskType.SIMPLE });
```

### Exemple de migration pour Temporal

```typescript
// Avant
import { Client } from '@temporalio/client';
const client = new Client();
await client.workflow.start('MyWorkflow', { args: [arg1, arg2], taskQueue: 'my-queue' });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('MyWorkflow', { arg1, arg2 }, { 
  taskType: TaskType.COMPLEX,
  temporal: {
    workflowType: 'MyWorkflow',
    workflowArgs: [arg1, arg2],
    taskQueue: 'my-queue'
  }
});
```

### Exemple de migration pour n8n

```typescript
// Avant
import { n8nClient } from '../integration/n8n-client';
await n8nClient.triggerWorkflow({ workflowId: 'abc123', payload: data });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('integration-workflow', data, { 
  taskType: TaskType.INTEGRATION,
  n8n: {
    workflowId: 'abc123'
  }
});
```
