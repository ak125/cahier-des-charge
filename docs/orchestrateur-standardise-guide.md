# Guide d'utilisation de l'Orchestrateur Standardisé

Ce guide explique comment utiliser le nouvel orchestrateur standardisé qui remplace l'utilisation directe de BullMQ, Temporal et n8n dans notre projet.

## Introduction

L'orchestrateur standardisé offre une interface unifiée pour gérer les tâches asynchrones et les workflows, avec une séparation claire des responsabilités selon les recommandations suivantes :

- **BullMQ** : Uniquement pour les files d'attente simples et rapides
- **Temporal** : Pour toute gestion d'état et workflows complexes
- **n8n** : Uniquement pour les intégrations externes (CI/CD, webhooks externes)

Cette approche présente plusieurs avantages :

- **Interface uniforme** : Une seule API pour tous les types de tâches
- **Séparation des responsabilités** : Chaque outil pour son cas d'usage optimal
- **Maintenance facilitée** : Réduction de la complexité et des dépendances croisées

## Comment utiliser l'orchestrateur standardisé

### Importer l'orchestrateur

```typescript
// Pour une utilisation directe (hors NestJS)
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour une utilisation avec NestJS (injection de dépendance)
import { StandardizedOrchestratorService } from '../src/orchestration/standardized-orchestrator.service';

@Injectable()
export class MonService {
  constructor(
    private readonly orchestrator: StandardizedOrchestratorService
  ) {}
}
```

### Planifier une tâche simple (BullMQ)

Utilisez BullMQ **uniquement** pour les tâches simples et rapides comme :
- Traitement asynchrone de petites tâches
- Files d'attente simples
- Jobs de courte durée sans état complexe

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Option 1 : Méthode standard
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

// Option 2 : Avec le service NestJS et méthode helper
await orchestratorService.scheduleSimpleTask(
  'nom-de-la-tache',
  {
    // Données de la tâche
  },
  {
    priority: 1,
    attempts: 3
  }
);
```

### Planifier un workflow complexe (Temporal)

Utilisez Temporal pour **tous** les workflows complexes comme :
- Processus avec gestion d'état
- Workflows de longue durée
- Traitements avec compensation et saga pattern
- Orchestration de microservices

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Option 1 : Méthode standard
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

// Option 2 : Avec le service NestJS et méthode helper
await orchestratorService.scheduleComplexWorkflow(
  'nom-du-workflow',
  {
    // Données du workflow
  },
  {
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: [arg1, arg2],
      taskQueue: 'task-queue-name'
    }
  }
);
```

### Planifier une intégration externe (n8n)

Utilisez n8n **uniquement** pour les intégrations externes comme :
- CI/CD
- Webhooks externes 
- Intégrations avec des systèmes tiers

```typescript
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Option 1 : Méthode standard
await standardizedOrchestrator.scheduleTask(
  'nom-integration',
  {
    // Données pour l'intégration
  },
  {
    taskType: TaskType.INTEGRATION,
    n8n: {
      workflowId: 'workflow-id-n8n',
      webhookUrl: 'https://n8n.example.com/webhook/trigger',
      integrationSource: 'github'
    }
  }
);

// Option 2 : Avec le service NestJS et méthode helper
await orchestratorService.scheduleExternalIntegration(
  'nom-integration',
  {
    // Données pour l'intégration
  },
  {
    n8n: {
      workflowId: 'workflow-id-n8n',
      webhookUrl: 'https://n8n.example.com/webhook/trigger'
    }
  }
);
```

### Suivre le statut d'une tâche

L'orchestrateur standardisé permet de suivre le statut d'une tâche quelle que soit sa nature (simple, complexe ou intégration) :

```typescript
const status = await standardizedOrchestrator.getTaskStatus(taskId);
// ou
const status = await orchestratorService.getTaskStatus(taskId);

console.log(`Statut de la tâche: ${status.status}`);
console.log(`Source: ${status.source}`); // 'BULLMQ', 'TEMPORAL' ou 'N8N'
```

### Annuler une tâche

De la même manière, vous pouvez annuler une tâche quelle que soit sa nature :

```typescript
const annulee = await standardizedOrchestrator.cancelTask(taskId);
// ou
const annulee = await orchestratorService.cancelTask(taskId);

if (annulee) {
  console.log('Tâche annulée avec succès');
} else {
  console.log('Impossible d\'annuler la tâche');
}
```

## Migration depuis les anciens orchestrateurs

### Depuis BullMQ direct

Remplacez l'utilisation directe de BullMQ :

```typescript
// AVANT
import { Queue } from 'bullmq';
const queue = new Queue('maFile');
await queue.add('job-name', payload, options);

// APRÈS
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('maFile', payload, {
  taskType: TaskType.SIMPLE,
  ...options
});
```

### Depuis Temporal direct

Remplacez l'utilisation directe de Temporal :

```typescript
// AVANT
import { Client } from '@temporalio/client';
const client = new Client();
const handle = await client.workflow.start('workflowType', {
  args: [arg1, arg2],
  taskQueue: 'taskQueue',
  workflowId
});

// APRÈS
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('workflowName', payload, {
  taskType: TaskType.COMPLEX,
  temporal: {
    workflowType: 'workflowType',
    workflowArgs: [arg1, arg2],
    taskQueue: 'taskQueue',
    workflowId
  }
});
```

### Depuis n8n direct ou webhooks

Remplacez l'utilisation directe de n8n :

```typescript
// AVANT
import axios from 'axios';
await axios.post('https://n8n.example.com/webhook/trigger', payload);

// APRÈS
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('integration-name', payload, {
  taskType: TaskType.INTEGRATION,
  n8n: {
    workflowId: 'workflow-id-n8n',
    webhookUrl: 'https://n8n.example.com/webhook/trigger'
  }
});
```

## Bonnes pratiques

1. **Choisir le bon type de tâche** :
   - BullMQ pour les tâches simples et rapides **uniquement**
   - Temporal pour les workflows complexes avec état
   - n8n uniquement pour les intégrations externes

2. **Éviter les dépendances croisées** :
   - Ne pas mélanger les responsabilités des différents orchestrateurs
   - Conserver une séparation claire entre les types de tâches

3. **Utiliser les helpers de NestJS** :
   - `scheduleSimpleTask()` pour les tâches BullMQ
   - `scheduleComplexWorkflow()` pour les workflows Temporal
   - `scheduleExternalIntegration()` pour les intégrations n8n

4. **Standardisation des noms** :
   - Utiliser des noms cohérents pour les tâches et workflows
   - Documenter clairement le but de chaque tâche

5. **Surveillance unifiée** :
   - Utiliser les méthodes `getTaskStatus()` pour suivre les tâches uniformément
   - Configurer une surveillance centralisée pour tous les types d'orchestrateurs

## Exemple complet

Voici un exemple complet montrant l'utilisation des trois types de tâches :

```typescript
import { Injectable } from '@nestjs/common';
import { StandardizedOrchestratorService } from '../src/orchestration/standardized-orchestrator.service';

@Injectable()
export class MigrationService {
  constructor(private readonly orchestrator: StandardizedOrchestratorService) {}

  async migrerProjet(projectId: string, options: any) {
    // 1. Tâche simple : préparation rapide (BullMQ)
    const prepTaskId = await this.orchestrator.scheduleSimpleTask(
      'preparation-migration',
      { projectId },
      { priority: 10, attempts: 3 }
    );

    // 2. Workflow complexe : processus de migration avec état (Temporal)
    const migrationWorkflowId = await this.orchestrator.scheduleComplexWorkflow(
      'migration-workflow',
      { 
        projectId,
        prepTaskId,
        options
      },
      {
        temporal: {
          workflowType: 'migrationWorkflow',
          workflowArgs: [projectId, options],
          taskQueue: 'migrations',
          trackingQueue: 'migration-tracking'
        }
      }
    );

    // 3. Intégration externe : notification CI/CD (n8n)
    await this.orchestrator.scheduleExternalIntegration(
      'ci-cd-notification',
      {
        projectId,
        migrationWorkflowId,
        status: 'started',
        timestamp: new Date().toISOString()
      },
      {
        n8n: {
          workflowId: 'ci-integration',
          integrationSource: 'jenkins'
        }
      }
    );

    return migrationWorkflowId;
  }
}
```