# Activities Temporal

Ce répertoire contient les définitions d'activités réutilisables pour les workflows Temporal.

## Objectif

Les activités Temporal représentent des unités de travail individuelles appelées par les workflows. Elles sont exécutées une seule fois et peuvent interagir avec des systèmes externes.

## Conventions de nommage

- Les fichiers d'activités doivent suivre le format : `{domaine}-activities.ts`
- Exemple : `data-processing-activities.ts`

## Utilisation

```typescript
// Définition d'une activité
export async function processData(input: any): Promise<any> {
  // Logique métier de l'activité
  return processedResult;
}

// Activité avec retry policies
export async function httpRequest(url: string): Promise<any> {
  // Appel HTTP externe pouvant nécessiter des retries
  const response = await fetch(url);
  return response.json();
}
```

## Bonnes pratiques

- Garder les activités idempotentes quand possible
- Définir des retry policies appropriées
- Regrouper les activités par domaine fonctionnel
- Favoriser la réutilisabilité entre workflows