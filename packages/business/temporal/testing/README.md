# Testing Temporal

Ce répertoire contient les utilitaires et outils pour tester les workflows et activités Temporal.

## Objectif

Faciliter les tests unitaires et d'intégration des workflows Temporal en fournissant des mocks, des utilitaires et des configurations standardisées.

## Contenu recommandé

- Mocks pour les activités
- Workers de test
- Environnement de test local
- Helpers pour les assertions spécifiques aux workflows

## Exemple d'utilisation

```typescript
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import * as workflows from '../workflows/my-workflows';

describe('Mon workflow', () => {
  let testEnv: TestWorkflowEnvironment;
  
  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.create();
  });
  
  afterAll(async () => {
    await testEnv.teardown();
  });
  
  it('devrait exécuter le workflow correctement', async () => {
    const { client, nativeConnection } = testEnv;
    const worker = await Worker.create({
      connection: nativeConnection,
      workflowsPath: require.resolve('../workflows/my-workflows'),
      taskQueue: 'test-task-queue'
    });
    
    await worker.runUntil(async () => {
      const result = await client.workflow.execute(workflows.myWorkflow, {
        taskQueue: 'test-task-queue',
        workflowId: 'test-workflow-id',
        args: [/* arguments */]
      });
      
      expect(result).toEqual(/* résultat attendu */);
    });
  });
});
```

## Bonnes pratiques

- Utiliser TestWorkflowEnvironment pour les tests d'intégration
- Mocker les dépendances externes
- Tester séparément les activités et les workflows