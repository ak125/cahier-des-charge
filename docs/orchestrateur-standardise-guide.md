# Guide d'utilisation de l'Orchestrateur Standardisé - v2.0 (Mai 2025)

*Date de création : 4 mai 2025*  
*Dernière mise à jour : 4 mai 2025*

## Introduction

L'orchestrateur standardisé offre une interface unifiée pour gérer les tâches asynchrones et les workflows au sein de notre architecture. Suite à la standardisation technologique d'avril 2025, nous avons consolidé nos technologies d'orchestration autour de deux outils principaux :

- **BullMQ** : Pour les files d'attente simples et rapides
- **Temporal.io** : Pour toute gestion d'état et workflows complexes

> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ ou Temporal selon leur complexité.

Cette consolidation présente plusieurs avantages :

- **Interface uniforme** : Une seule API pour tous les types de tâches
- **Séparation claire des responsabilités** : Chaque outil pour son cas d'usage optimal
- **Maintenance simplifiée** : Réduction de la complexité et des dépendances croisées
- **Observabilité améliorée** : Surveillance unifiée des jobs et workflows

## Architecture consolidée

### Structure de dossiers

La nouvelle structure standardisée est organisée comme suit :

```
/packages/orchestration/
  /client/          # Interface unifiée pour les orchestrateurs
    index.ts        # Point d'entrée principal
    types.ts        # Types partagés
  /temporal/        # Implémentation Temporal.io
    /workflows/     # Workflows organisés par domaine
    /activities/    # Activités réutilisables
    /workers/       # Configuration des workers
  /bullmq/          # Implémentation BullMQ
    /queues/        # Queues organisées par domaine
    /processors/    # Processeurs de jobs
    /workers/       # Configuration des workers
  /monitoring/      # Monitoring unifié
  /testing/         # Outils de test
```

### Matrice décisionnelle : Temporal vs BullMQ

| Critère | Temporal.io | BullMQ |
|---------|------------|--------|
| **Durée d'exécution** | > 5 minutes | < 5 minutes |
| **Complexité** | Workflows multi-étapes | Tâches atomiques |
| **État** | Avec état persistant | Sans état ou état minimal |
| **Criticité** | Haute (ne doit jamais échouer) | Moyenne à faible |
| **Pattern** | Saga, Compensation, Retry complexe | File d'attente simple |
| **Dépendances** | Multiples services/systèmes | Service unique |
| **Exemples** | Migration de code, pipeline IA, analyses profondes | Notifications, indexation, traitement média |

## Comment utiliser l'orchestrateur standardisé

### Installation

```bash
pnpm add @notre-org/orchestration
```

### Importer l'orchestrateur

```typescript
// Pour une utilisation directe
import { orchestrator, TaskType } from '@notre-org/orchestration';

// Pour une utilisation avec NestJS (injection de dépendance)
import { OrchestratorService } from '@notre-org/orchestration/nestjs';

@Injectable()
export class MonService {
  constructor(
    private readonly orchestrator: OrchestratorService
  ) {}
}
```

### Planifier une tâche simple (BullMQ)

Utilisez BullMQ **uniquement** pour les tâches simples et rapides comme :
- Traitement asynchrone de petites tâches
- Files d'attente simples sans état complexe
- Jobs de courte durée (< 5 minutes)

```typescript
// Option 1 : API standard
await orchestrator.scheduleTask({
  name: 'send-notification',
  payload: {
    userId: 'user-123',
    message: 'Votre analyse est terminée'
  },
  options: {
    type: TaskType.SIMPLE,
    priority: Priority.HIGH,
    attempts: 3
  }
});

// Option 2 : API spécifique (recommandée)
await orchestrator.simple.schedule('send-notification', {
  userId: 'user-123',
  message: 'Votre analyse est terminée'
}, {
  priority: Priority.HIGH,
  attempts: 3
});
```

### Planifier un workflow complexe (Temporal)

Utilisez Temporal pour **tous** les workflows complexes comme :
- Processus avec gestion d'état
- Workflows de longue durée
- Traitements avec compensation et saga pattern
- Orchestration de microservices

```typescript
// Option 1 : API standard
await orchestrator.scheduleTask({
  name: 'analyze-repository',
  payload: {
    repoUrl: 'https://github.com/organization/project',
    depth: 'full'
  },
  options: {
    type: TaskType.COMPLEX,
    temporal: {
      workflowType: 'analyzeRepositoryWorkflow',
      taskQueue: 'code-analysis',
      workflowId: `repo-analysis-${Date.now()}` // ID unique (facultatif)
    }
  }
});

// Option 2 : API spécifique (recommandée)
await orchestrator.complex.schedule('analyze-repository', {
  repoUrl: 'https://github.com/organization/project',
  depth: 'full'
}, {
  workflowType: 'analyzeRepositoryWorkflow',
  taskQueue: 'code-analysis'
});
```

### Suivi et gestion des tâches

L'orchestrateur standardisé permet de suivre le statut des tâches de manière unifiée :

```typescript
// Obtenir le statut d'une tâche
const status = await orchestrator.getTaskStatus('task-id-123');
console.log(`Statut: ${status.state}, Source: ${status.source}`);

// Annuler une tâche
const canceled = await orchestrator.cancelTask('task-id-123');

// Mettre en pause/reprendre une tâche
await orchestrator.pauseTask('task-id-123');
await orchestrator.resumeTask('task-id-123');
```

## Bonnes pratiques par technologie

### Temporal.io - Bonnes pratiques

1. **Structurer les workflows par domaine fonctionnel**:
   ```typescript
   // /packages/orchestration/temporal/workflows/codeAnalysis/analyzeRepository.ts
   export const analyzeRepositoryWorkflow = defineWorkflow("analyzeRepository", async (input: AnalyzeRepositoryInput) => {
     // Implémentation du workflow
   });
   ```

2. **Utiliser des activités atomiques et réutilisables**:
   ```typescript
   // Activité réutilisable
   export const fetchRepository = defineActivity("fetchRepository", async (input) => {
     // Implémentation de l'activité
   });

   // Utilisation dans un workflow
   export const analyzeRepositoryWorkflow = defineWorkflow("analyzeRepository", async (input) => {
     const repo = await executeActivity(fetchRepository, {
       taskQueue: "repository-operations",
       retry: standardRetryPolicy,
     }, { url: input.repositoryUrl });
     
     // Suite du workflow
   });
   ```

3. **Implémenter une gestion d'erreurs robuste**:
   ```typescript
   export const analyzeRepositoryWorkflow = defineWorkflow("analyzeRepository", async (input) => {
     try {
       // Logique du workflow
     } catch (error) {
       // Journalisation structurée de l'erreur
       logger.error("Workflow failed", { error, workflowId, input });

       // Actions de compensation
       await executeActivity(cleanupTemporaryResources, {}, { workflowId });
       await executeActivity(notifyFailure, {}, { workflowId, error });

       // Propager l'erreur avec contexte enrichi
       throw new ApplicationFailure(`Analyse du dépôt échouée: ${error.message}`, "ANALYSIS_FAILED");
     }
   });
   ```

4. **Utiliser continueAsNew pour les workflows de longue durée**:
   ```typescript
   export const longRunningWorkflow = defineWorkflow("longRunningWorkflow", async function*(input) {
     let currentState = input;
     let iteration = 0;
     
     while (true) {
       if (iteration >= 100) {
         yield* continueAsNew(currentState);
       }
       
       // Logique de traitement
       currentState = await executeActivity(processChunk, {}, { state: currentState });
       iteration++;
       
       // Sauvegarde périodique de l'état
       if (iteration % 10 === 0) {
         await executeActivity(saveCheckpoint, {}, { state: currentState });
       }
     }
   });
   ```

### BullMQ - Bonnes pratiques

1. **Utiliser des files d'attente spécifiques au domaine**:
   ```typescript
   // Définition des queues par domaine
   const notificationQueue = new Queue('notification', {
     connection: redisOptions,
     defaultJobOptions: standardQueueOptions
   });
   
   const mediaProcessingQueue = new Queue('media-processing', {
     connection: redisOptions,
     defaultJobOptions: { ...standardQueueOptions, attempts: 2 }
   });
   ```

2. **Implémenter la validation des données en entrée**:
   ```typescript
   // Validation avec Zod avant l'ajout d'un job
   const notificationSchema = z.object({
     userId: z.string(),
     message: z.string(),
     channel: z.enum(['email', 'sms', 'push'])
   });

   async function addNotificationJob(data: unknown) {
     const validatedData = notificationSchema.parse(data);
     return notificationQueue.add('send-notification', validatedData);
   }
   ```

3. **Gérer efficacement les priorités**:
   ```typescript
   // Système de priorité standardisé
   enum Priority {
     CRITICAL = 1,  // Traité immédiatement
     HIGH = 5,      // Traité rapidement
     NORMAL = 10,   // Traitement standard
     LOW = 15,      // Peut attendre
     BACKGROUND = 20 // Traité lorsque le système est peu chargé
   }

   // Utilisation
   await notificationQueue.add('password-reset', data, { 
     priority: Priority.HIGH 
   });
   ```

4. **Configurer des stratégies de retry adaptatives**:
   ```typescript
   // Configuration adaptative selon le type de tâche
   const mediaProcessingOptions = {
     attempts: 3,
     backoff: {
       type: 'exponential',
       delay: 1000 // Délai initial de 1 seconde
     }
   };

   // Utilisation
   await mediaQueue.add('optimize-image', data, mediaProcessingOptions);
   ```

## Patterns d'intégration avancés

Pour certains cas spécifiques, nous recommandons d'intégrer les deux technologies :

### 1. Pattern de notification des résultats de workflow

```typescript
// Workflow Temporal qui utilise BullMQ pour notifier des résultats
export const complexAnalysisWorkflow = defineWorkflow("complexAnalysis", async (input) => {
  // Exécution du workflow Temporal
  const result = await executeActivity(runComplexAnalysis, {}, input);
  
  // Notification des résultats via BullMQ (plus léger et plus rapide)
  await executeActivity(notifyViaQueue, {}, { 
    queue: 'notification',
    data: {
      type: 'analysis-complete',
      result: result.summary,
      userId: input.userId
    }
  });
  
  return result;
});
```

### 2. Pattern de suivi d'avancement

```typescript
// Activité Temporal qui met à jour une file BullMQ pour le suivi
export const updateProgressActivity = defineActivity("updateProgress", async (input) => {
  const { workflowId, progress, details } = input;
  
  // Ajoute une tâche BullMQ pour mettre à jour le statut
  await progressQueue.add('update-progress', {
    workflowId,
    progress,
    details,
    timestamp: new Date()
  }, { 
    priority: Priority.HIGH,
    removeOnComplete: true
  });
  
  return true;
});
```

### 3. Pattern d'orchestration à deux niveaux

```typescript
// Utiliser Temporal pour orchestrer des workflows de haut niveau
// et BullMQ pour des tâches granulaires dans chaque étape
export const migrationOrchestrator = defineWorkflow("migrationOrchestrator", async (input) => {
  // Première phase - Analyse (via BullMQ)
  const analysisResult = await executeActivity(scheduleAnalysisBatch, {}, {
    queue: 'analysis',
    projectId: input.projectId,
    batchSize: 100
  });
  
  // Décision basée sur l'analyse
  if (analysisResult.issuesFound > 0) {
    // Phase corrective (Temporal car complexe et avec état)
    await executeActivity(runCorrectionWorkflow, {}, {
      projectId: input.projectId,
      issues: analysisResult.issues
    });
  }
  
  // Phase finale - Notification (via BullMQ)
  await executeActivity(scheduleNotifications, {}, {
    queue: 'notification',
    recipients: input.stakeholders,
    results: { status: 'completed', summary: analysisResult }
  });
});
```

## Monitoring unifié

Le nouveau système de monitoring unifié surveille simultanément les tâches BullMQ et Temporal :

```typescript
// Accès aux métriques unifiées
const metrics = await orchestrator.monitoring.getMetrics();
console.log('Métriques consolidées:', metrics.consolidated);
console.log('Métriques BullMQ:', metrics.bullmq);
console.log('Métriques Temporal:', metrics.temporal);

// Configuration d'alertes unifiées
orchestrator.monitoring.configureAlerts({
  taskFailureRate: {
    threshold: 0.05,  // 5% d'échecs
    window: '5m',     // sur 5 minutes
    action: 'notify'  // Action à effectuer
  },
  queueBacklog: {
    threshold: 100,   // 100 tâches en attente
    window: '10m',    // sur 10 minutes
    action: 'scale'   // Action à effectuer
  }
});
```

### Dashboard de monitoring

Un dashboard de monitoring unifié est disponible à l'adresse : `https://monitoring.notre-domaine.com/orchestration`

Ce dashboard affiche :
- État des queues BullMQ (taille, taux de traitement, échecs)
- État des workflows Temporal (actifs, complétés, échecs)
- Métriques consolidées sur l'ensemble du système d'orchestration
- Alertes et incidents

## Migration depuis les anciens orchestrateurs

### Migration depuis BullMQ v4

Si vous utilisez déjà BullMQ v4 avec l'ancien système, voici comment migrer :

```typescript
// AVANT
import { Queue } from 'bullmq';
const queue = new Queue('maFile');
await queue.add('job-name', payload, options);

// APRÈS
import { orchestrator } from '@notre-org/orchestration';
await orchestrator.simple.schedule('job-name', payload, options);
```

### Migration depuis Temporal v1

Si vous utilisez directement Temporal v1, voici comment migrer :

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
import { orchestrator } from '@notre-org/orchestration';
await orchestrator.complex.schedule('workflow-name', { arg1, arg2 }, {
  workflowType: 'workflowType',
  taskQueue: 'taskQueue',
  workflowId
});
```

### Migration depuis n8n (déprécié)

Si vous utilisez encore n8n, suivez ce plan de migration en 5 étapes :

1. **Analyser** le workflow n8n (complexité, état, criticité)
2. **Choisir** la technologie cible (BullMQ ou Temporal)
3. **Implémenter** l'équivalent suivant les bonnes pratiques
4. **Exécuter en parallèle** les deux implémentations pour validation
5. **Décommissionner** le workflow n8n

Exemple de migration d'un workflow n8n simple :

```typescript
// AVANT - Webhook n8n appelé directement
await axios.post('https://n8n.notre-domaine.com/webhook/trigger', payload);

// APRÈS - Utilisation de l'orchestrateur standardisé
import { orchestrator } from '@notre-org/orchestration';
await orchestrator.simple.schedule('external-integration', payload, {
  queue: 'integrations',
  priority: Priority.NORMAL
});
```

### Migration depuis les orchestrateurs personnalisés (OrchestratorBridge, etc.)

Si vous utilisez encore des orchestrateurs personnalisés comme `OrchestratorBridge`, suivez ce guide pour migrer vers l'orchestrateur standardisé :

1. **Analyser** votre implémentation personnalisée pour identifier le type d'orchestration et les schémas de données
2. **Choisir** la technologie cible appropriée selon cette matrice :

| Caractéristique de l'orchestrateur personnalisé | Technologie cible | API standardisée |
|------------------------------------------------|-------------------|-----------------|
| Files d'attente simples (<5 min) | BullMQ | `orchestrator.simple` |
| Workflows avec état | Temporal | `orchestrator.complex` |
| Communication entre services | Temporal | `orchestrator.complex` |
| Webhooks et intégrations | BullMQ ou Temporal selon complexité | API appropriée |

3. **Remplacer** le code existant par les appels standardisés

#### Exemple : Migration depuis OrchestratorBridge

```typescript
// AVANT - Utilisation directe de l'OrchestratorBridge
await orchestratorBridge.startTemporalWorkflowWithBullMQTracking({
  workflowType: 'analyzeCode',
  workflowArgs: [analysisData],
  taskQueue: 'code-analysis',
  bullMQQueue: 'tracking',
  bullMQJobData: { projectId: analysisData.projectId }
});

// APRÈS - Utilisation de l'orchestrateur standardisé
import { orchestrator } from '@notre-org/orchestration';
await orchestrator.complex.schedule('analyze-code', analysisData, {
  workflowType: 'analyzeCode',
  taskQueue: 'code-analysis',
  trackingQueue: 'tracking',
  trackingData: { projectId: analysisData.projectId }
});
```

#### Exemple : Migration depuis WorkflowOrchestrator personnalisé

```typescript
// AVANT - Utilisation d'un orchestrateur personnalisé
await customOrchestrator.scheduleWorkflow({
  name: 'processRepository',
  data: repositoryData,
  options: {
    retry: 3,
    timeout: '2h'
  }
});

// APRÈS - Utilisation de l'orchestrateur standardisé
import { orchestrator } from '@notre-org/orchestration';
await orchestrator.complex.schedule('process-repository', repositoryData, {
  workflowType: 'processRepositoryWorkflow',
  taskQueue: 'repository-processing',
  retry: { attempts: 3 },
  timeout: '2h'
});
```

#### Exemple : Migration depuis une implémentation BullMQ personnalisée

```typescript
// AVANT - Utilisation de BullMQ avec un wrapper personnalisé
await customQueue.addJob('image-processing', {
  fileUrl: 'https://storage.notre-domaine.com/images/image.jpg',
  filters: ['resize', 'optimize']
}, {
  priority: 2,
  attempts: 5
});

// APRÈS - Utilisation de l'orchestrateur standardisé
import { orchestrator } from '@notre-org/orchestration';
await orchestrator.simple.schedule('image-processing', {
  fileUrl: 'https://storage.notre-domaine.com/images/image.jpg',
  filters: ['resize', 'optimize']
}, {
  priority: Priority.HIGH,
  attempts: 5
});
```

## Exemples complets par cas d'usage

### 1. Traitement de médias

```typescript
import { orchestrator } from '@notre-org/orchestration';

async function processMedia(fileUrl: string, options: ProcessingOptions) {
  // Tâche simple pour des traitements rapides
  if (options.processingType === 'thumbnail') {
    return orchestrator.simple.schedule('generate-thumbnail', {
      fileUrl,
      dimensions: options.dimensions
    }, {
      priority: Priority.NORMAL,
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 }
    });
  }
  
  // Workflow complexe pour des traitements avancés
  if (options.processingType === 'video-encoding') {
    return orchestrator.complex.schedule('process-video', {
      fileUrl,
      formats: options.formats,
      quality: options.quality
    }, {
      workflowType: 'videoEncodingWorkflow',
      taskQueue: 'media-processing'
    });
  }
}
```

### 2. Analyse de code et migration

```typescript
import { orchestrator } from '@notre-org/orchestration';

async function migrateCodebase(repositoryUrl: string, options: MigrationOptions) {
  // Orchestration complète avec Temporal
  const workflowId = `migration-${Date.now()}`;
  
  return orchestrator.complex.schedule('migrate-codebase', {
    repositoryUrl,
    targetVersion: options.targetVersion,
    rules: options.migrationRules,
    notifyEmail: options.notifyEmail
  }, {
    workflowType: 'codebaseMigrationWorkflow',
    taskQueue: 'code-migration',
    workflowId
  });
}

// Suivre la progression de la migration
async function getMigrationStatus(workflowId: string) {
  return orchestrator.getTaskStatus(workflowId);
}
```

## Considérations de sécurité

1. **Isolation des files d'attente sensibles** : Utilisez des préfixes de namespace Redis différents pour isoler les données sensibles.

2. **Validations d'entrée strictes** : Appliquez des validations Zod sur toutes les données entrantes pour les deux orchestrateurs.

3. **Journalisation sécurisée** : Ne journalisez jamais de données sensibles (mots de passe, tokens) dans les workflows ou les jobs.

4. **Contrôle d'accès** : Limitez l'accès aux interfaces d'administration Temporal UI et Bull Board selon les privilèges des utilisateurs.

## Support et ressources

- **Documentation API complète** : [https://docs.notre-domaine.com/orchestration/api](https://docs.notre-domaine.com/orchestration/api)
- **Exemples** : [https://github.com/notre-org/orchestration-examples](https://github.com/notre-org/orchestration-examples)
- **Support** : Pour toute question, contactez l'équipe d'architecture via Slack (#orchestration-support)

## Changelog

- **Mai 2025** : Version 2.0 - Consolidation autour de Temporal et BullMQ, dépréciation de n8n
- **Janvier 2025** : Version 1.2 - Amélioration du monitoring unifié
- **Octobre 2024** : Version 1.1 - Support de Temporal v1.20
- **Juin 2024** : Version 1.0 - Première version de l'orchestrateur standardisé