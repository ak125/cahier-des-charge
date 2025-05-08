# Standards pour les workflows Temporal

## Introduction

Ce document définit les standards officiels pour la création et la maintenance des workflows Temporal dans notre projet. Ces standards ont été établis suite à un effort de consolidation visant à éliminer les duplications et à standardiser la structure du code.

## Structure des dossiers

### Structure standard

Tous les workflows Temporal doivent être placés dans le répertoire :

```
/packages/business/temporal/workflows/
```

Organisation des sous-dossiers :

- Organisez les workflows par domaine fonctionnel
- Exemple : `/packages/business/temporal/workflows/php-analysis/`

### Structure obsolète (à ne pas utiliser)

❌ N'utilisez pas cette structure obsolète :

```
/packages/business/workflows/temporal/
```

## Nomenclature des fichiers

### Format standard

```
<fonctionnalité>[-<sous-fonctionnalité>].workflow.ts
```

### Exemples

✅ Formats corrects :
- `php-analysis/consolidated-php-analyzer.workflow.ts`
- `migration-plans/generate-migration-plans.workflow.ts`
- `audit/consolidated-audit.workflow.ts`

❌ Formats à éviter :
- `phpAnalyzer.ts` (manque du suffixe .workflow)
- `workflow.ts` (trop générique)
- `PhpMigration.workflow.ts` (ne pas utiliser PascalCase pour les noms de fichiers)

## Structure du code

### Imports standard

```typescript
import { 
  proxyActivities, 
  setHandler, 
  workflow,
  // autres imports de @temporalio/workflow selon les besoins 
} from '@temporalio/workflow';

// Import des types d'activités
import type * as myActivities from '../../activities/my-activities';
```

### Déclaration des activités

```typescript
const { 
  activity1, 
  activity2 
} = proxyActivities<typeof myActivities>({
  startToCloseTimeout: '30 minutes',
  retry: {
    maximumAttempts: 3
  }
});
```

### Définition du workflow

```typescript
/**
 * Description détaillée du workflow
 * 
 * @param input Paramètres d'entrée du workflow
 * @returns Résultat du workflow
 */
export async function myWorkflow(input: MyInput): Promise<MyOutput> {
  // Implémentation
}

// Exportation par défaut (recommandé)
export default myWorkflow;
```

### Gestion des signaux et queries

Pour les workflows complexes, utilisez `setHandler` pour gérer les signaux et les requêtes :

```typescript
// Définition des queries
export const getState = defineQuery<WorkflowState>('getState');
export const getStatus = defineQuery<string>('getStatus');

// Définition des signaux
export const cancelWorkflow = defineSignal('cancelWorkflow');
export const pauseWorkflow = defineSignal('pauseWorkflow');

// Dans le workflow
setHandler(getState, () => state);
setHandler(cancelWorkflow, () => {
  // Logique d'annulation
});
```

## Bonnes pratiques

### Documentation

- **Commentaires JSDoc** : Chaque workflow et fonction principale doit avoir un commentaire JSDoc décrivant sa fonction, ses paramètres et ses valeurs de retour
- **Commentaires de section** : Utiliser des commentaires pour séparer les grandes sections de code

### Gestion des erreurs

- Toujours encapsuler le code principal dans un bloc try-catch
- Journaliser les erreurs avant de les propager
- Utiliser des types d'erreur spécifiques lorsque c'est possible

```typescript
try {
  // Logique du workflow
} catch (error) {
  console.error(`Workflow failed: ${error instanceof Error ? error.message : String(error)}`);
  throw error;
}
```

### Durabilité

- Éviter les références à des objets externes non sérialisables
- Stocker les états intermédiaires pour permettre la reprise
- Utiliser `continueAsNew` pour les workflows de longue durée

### Tests

- Chaque workflow doit avoir des tests unitaires correspondants
- Tester les cas normaux et les scénarios d'erreur
- Simuler les signaux et les requêtes dans les tests

## Exemples de workflows

### Workflow simple

```typescript
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { getUser, updateUser } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes'
});

export async function userUpdateWorkflow(userId: string, updates: any): Promise<boolean> {
  try {
    const user = await getUser(userId);
    const result = await updateUser(userId, { ...user, ...updates });
    return result.success;
  } catch (error) {
    console.error(`Failed to update user: ${error}`);
    return false;
  }
}

export default userUpdateWorkflow;
```

### Workflow avancé

```typescript
import { 
  proxyActivities, 
  setHandler, 
  workflow, 
  defineQuery, 
  defineSignal 
} from '@temporalio/workflow';
import type * as activities from './activities';

// Définir les types
interface WorkflowInput {
  userId: string;
  steps: string[];
}

interface WorkflowState {
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStep: number;
  results: any[];
}

// Définir les queries et signaux
export const getStatus = defineQuery<WorkflowState>('getStatus');
export const pauseWorkflow = defineSignal('pauseWorkflow');
export const resumeWorkflow = defineSignal('resumeWorkflow');

// Définir les activités
const { 
  processStep, 
  notifyCompletion 
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: {
    maximumAttempts: 3
  }
});

/**
 * Workflow multi-étapes avec gestion d'état
 */
export async function multiStepWorkflow(input: WorkflowInput): Promise<any[]> {
  // Initialiser l'état
  const state: WorkflowState = {
    status: 'running',
    currentStep: 0,
    results: []
  };
  
  // Configurer les handlers
  setHandler(getStatus, () => state);
  setHandler(pauseWorkflow, () => { state.status = 'paused'; });
  setHandler(resumeWorkflow, () => { state.status = 'running'; });
  
  try {
    // Boucle principale
    for (let i = 0; i < input.steps.length; i++) {
      state.currentStep = i;
      
      // Vérifier si pause
      while (state.status === 'paused') {
        await workflow.sleep('1 second');
      }
      
      // Traiter l'étape
      const result = await processStep(input.userId, input.steps[i]);
      state.results.push(result);
    }
    
    // Finalisation
    state.status = 'completed';
    await notifyCompletion(input.userId, state.results);
    
    return state.results;
  } catch (error) {
    // Gestion d'erreur
    state.status = 'failed';
    console.error(`Workflow failed: ${error}`);
    throw error;
  }
}

export default multiStepWorkflow;
```

## Migration et consolidation

Si vous identifiez des workflows qui effectuent des tâches similaires, suivez ce processus pour les consolider :

1. Identifiez le workflow le plus complet ou le mieux conçu comme workflow principal
2. Extrayez les fonctionnalités uniques des autres workflows
3. Intégrez ces fonctionnalités dans le workflow principal
4. Exportez des fonctions compatibles pour assurer la compatibilité avec le code existant
5. Mettez à jour les références et les imports dans les fichiers qui utilisent l'ancien workflow
6. Archivez les anciens workflows une fois la migration vérifiée

## Outils de nettoyage

Utilisez les scripts de nettoyage fournis dans le dossier `/cleanup-scripts/` :

- `standardize-workflow-structure.js` : Déplace les workflows vers la structure standard
- `refactor-php-migration-workflow.js` : Refactorise le workflow de migration PHP pour utiliser le workflow d'analyse consolidé
- `consolidate-ai-workflows.js` : Consolide les workflows de migration AI

## Support et questions

Pour toute question concernant ces standards, contactez l'équipe d'architecture ou référez-vous aux documents suivants :
- [Guide de consolidation des workflows](/docs/workflow-consolidation-guide.md)
- [Architecture des orchestrateurs](/docs/orchestrateur-standardise-guide.md)