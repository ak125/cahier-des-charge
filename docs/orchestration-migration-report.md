# Rapport de Migration vers l'Orchestrateur Standardisé

Ce rapport a été généré automatiquement pour faciliter la migration des orchestrateurs existants vers le nouvel orchestrateur standardisé.

## Résumé

- Fichiers analysés: 28374
- Fichiers avec occurrences: 54
- Occurrences BullMQ: 72
- Occurrences Temporal: 25
- Occurrences OrchestratorBridge: 46

## Tâches NX configurées

- `nx run build`
- `nx run test`
- `nx run lint`
- `nx run migrate`
- `nx run audit`
- `nx run docker`
- `nx run workflow`
- `nx run agents`
- `nx run ci`
- `nx run seo`
- `nx run manifest`
- `nx run tasks`

## Guides de Migration par Fichier

## backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/20250424-012046/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/20250424-012046/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/20250424-015615/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/20250424-015615/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/20250424-015615/structure-backups/20250424-012046/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/20250424-015615/structure-backups/20250424-012046/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/backup_structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/backup_structure-backups/20250424-012046/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/backup_structure-backups/20250424-012046/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/backup_structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/backup_structure-backups/20250424-015615/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/backup_structure-backups/20250424-015615/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/structure_optimization_20250425_011443/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/structure_optimization_20250425_011443/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/structure_optimization_20250425_011443/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## backups/structure_optimization_20250425_012654/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## backups/structure_optimization_20250425_012654/config/trigger/github-to-mcp.ts

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'phpToRemixMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'phpToRemixMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'phpToRemixMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

Remplacer l'appel au workflow Temporal 'validateMigrationWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'validateMigrationWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'validateMigrationWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## backups/structure_optimization_20250425_012654/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'orchestrator' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'orchestrator',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'orchestrator' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'orchestrator',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'orchestrator' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'orchestrator',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## reports/potential-agents-20250420-015853/apps/mcp-server/src/bullmq/bullmq.module.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'verification' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'verification',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## reports/potential-agents-20250420-015853/examples/enhanced-orchestrator-example.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'orchestrator' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'orchestrator',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'orchestrator' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'orchestrator',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'PhpAnalyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'PhpAnalyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'js-analyzer' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'js-analyzer',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'migration' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'migration',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

## reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## reports/potential-agents-20250420-015853/src/orchestration/orchestrators/OrchestratorBridge/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## reports/potential-agents-20250420-015853/src/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## scripts/audit-orchestrators.js

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'my-queue' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'my-queue',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'MyWorkflow' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'MyWorkflow',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'MyWorkflow',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## scripts/migrate-to-standardized-orchestration.js

### OrchestratorBridge → Orchestrateur standardisé

Remplacer l'utilisation de l'OrchestratorBridge par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);
```

## scripts/setup-orchestrator.js

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'processing-queue' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'processing-queue',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'analyzeCode' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'analyzeCode',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'analyzeCode',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```

## scripts/start-orchestrator-migration.js

### BullMQ → Orchestrateur standardisé

Remplacer l'utilisation de la file d'attente BullMQ 'ma-queue' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'ma-queue',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

Remplacer l'utilisation de la file d'attente BullMQ 'processing-queue' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'processing-queue',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);
```

### Temporal → Orchestrateur standardisé

Remplacer l'appel au workflow Temporal 'analyzeCode' par :

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'analyzeCode',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'analyzeCode',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);
```


## Guide d'utilisation de l'orchestrateur standardisé

Voir `examples/standardized-orchestrator-example.ts` pour des exemples complets d'utilisation.

### Tâche simple (BullMQ)

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

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
```

### Workflow complexe (Temporal)

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

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