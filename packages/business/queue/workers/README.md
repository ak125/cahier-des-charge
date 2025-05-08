# Workers BullMQ

Ce répertoire contient les définitions et configurations des workers BullMQ selon l'implémentation standardisée.

## Objectif

Les workers BullMQ sont responsables du traitement des jobs dans les files d'attente. Ils écoutent les queues et exécutent les processeurs associés.

## Conventions de nommage

- Les fichiers des workers doivent suivre le format : `{domaine}-worker.ts`
- Exemple : `notification-worker.ts`, `data-indexing-worker.ts`

## Utilisation

```typescript
import { Worker } from 'bullmq';
import { redisConnection } from '../client/redis-connection';
import { processNotification } from '../processors/notification-processor';

// Création du worker
const notificationWorker = new Worker('notifications', processNotification, {
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 1000
  }
});

// Gestion des événements
notificationWorker.on('completed', job => {
  console.log(`Job ${job.id} complété avec succès`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} a échoué avec l'erreur: ${err.message}`);
});

// Export pour utilisation dans l'application
export default notificationWorker;
```

## Bonnes pratiques

- Un worker par domaine fonctionnel
- Configuration adéquate de la concurrence
- Gestion appropriée des erreurs
- Limitation de débit si nécessaire
- Monitoring et logging des événements importants