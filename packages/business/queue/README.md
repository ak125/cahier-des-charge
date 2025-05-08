# Orchestrateur BullMQ Standardisé

Ce répertoire contient l'implémentation standardisée de l'orchestration utilisant BullMQ, conformément au document de standardisation des technologies.

## Objectif

BullMQ est utilisé pour toutes les tâches simples et rapides sans état complexe, notamment :
- Jobs de courte durée (< 5 minutes)
- Tâches sans besoin de persistance d'état complexe
- Files d'attente pour traitement asynchrone
- Notifications, indexation, et traitements légers

## Structure du répertoire

- **[/client](/client/)** : Configuration et abstraction du client BullMQ
- **[/workers](/workers/)** : Définition et configuration des workers BullMQ
- **[/processors](/processors/)** : Fonctions de traitement des jobs
- **[/testing](/testing/)** : Utilitaires pour tester les queues
- **[/types](/types/)** : Définitions TypeScript partagées

## Utilisation

Pour utiliser l'orchestrateur BullMQ standardisé :

```typescript
import { bullmq } from '@packages/business/queue';

// Planifier un job simple
const jobId = await bullmq.schedule('email-notifications', {
  recipient: 'user@example.com',
  subject: 'Votre rapport est prêt',
  template: 'report-ready',
  data: { reportId: '12345' }
}, {
  priority: 2,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000
  }
});

// Récupérer le statut d'un job
const status = await bullmq.getJobStatus('email-notifications', jobId);

// Attendre la fin d'un job
const result = await bullmq.waitForJob('email-notifications', jobId);
```

## Migration depuis n8n et les orchestrateurs personnalisés

Pour migrer vers cette implémentation standardisée, référez-vous au guide de migration :
[Guide de migration n8n](/docs/n8n-migration-plan.md)

## Bonnes pratiques

1. **Files d'attente par domaine** : Créez des queues distinctes pour chaque domaine fonctionnel
2. **Priorités et concurrence** : Configurez adéquatement les priorités et la concurrence
3. **Gestion d'erreurs** : Définissez des stratégies de retry appropriées pour chaque type de job
4. **Persistance** : Utilisez BullMQ pour des jobs qui ne nécessitent pas d'état persistant complexe
5. **Monitoring** : Utilisez le dashboard BullMQ et configurez des alertes

## Ressources

- [Documentation BullMQ](https://docs.bullmq.io/)
- [Guide de l'orchestrateur standardisé](/docs/orchestrateur-standardise-guide.md)
- [Document de standardisation des technologies](/docs/technologies-standards.md)