# Workflows Temporal

Ce répertoire contient les définitions de workflows Temporal organisés par domaine fonctionnel.

## Objectif

Les workflows Temporal définissent la logique d'orchestration de longue durée avec maintien d'état. Ils sont parfaits pour les processus complexes nécessitant durabilité et fiabilité.

## Conventions de nommage

- Les fichiers de workflows doivent suivre le format : `{domain}-workflows.ts`
- Exemple : `code-analysis-workflows.ts`

## Utilisation

```typescript
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/my-activities';

const { myActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function myWorkflow(input: any): Promise<any> {
  // Logique du workflow
  const result = await myActivity(input);
  return result;
}
```

## Organisation recommandée

- Organiser les workflows par domaine fonctionnel
- Utiliser des sous-répertoires pour les domaines complexes
- Documenter clairement les paramètres d'entrée/sortie