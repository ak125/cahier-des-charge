# Workers Temporal

Ce répertoire contient les définitions et configurations des workers Temporal selon l'implémentation standardisée.

## Objectif

Les workers Temporal sont responsables de l'exécution des workflows et activités. Ils s'abonnent aux queues de tâches (task queues) et exécutent les activités définies.

## Conventions de nommage

- Les fichiers des workers doivent suivre le format : `{domain}-worker.ts`
- Exemple : `code-analysis-worker.ts`

## Utilisation

```typescript
import { Worker } from '@temporalio/worker';
import * as activities from '../activities/my-activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflows/my-workflows'),
    activities,
    taskQueue: 'my-task-queue'
  });
  
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## Structure recommandée

- Un worker par domaine fonctionnel
- Séparation claire des responsabilités
- Configuration centralisée des workers similaires