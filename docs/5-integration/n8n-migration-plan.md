---
title: N8n Migration Plan
description: Intégration et standards technologiques
slug: n8n-migration-plan
module: 5-integration
status: stable
lastReviewed: 2025-05-09
---

# Plan de Migration n8n

> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) ou Temporal.io (pour les workflows complexes).



*Date de création : 4 mai 2025*
*Dernière mise à jour : 4 mai 2025*

## Contexte


Conformément au document de standardisation des technologies ([`technologies-standards.md`](../5-integration/technologies-standards)), n8n est désormais classé comme **DÉPRÉCIÉ** et doit être progressivement remplacé par :

- **Temporal.io** pour les workflows complexes avec état
- **BullMQ** pour les tâches simples et rapides

Ce document détaille le plan de migration pour assurer une transition progressive et sans interruption de service.

## Calendrier de migration


| Phase | Période | Objectif |
|-------|---------|----------|
| **Phase 1: Audit** | Mai 2025 | Inventaire et analyse des workflows n8n existants |
| **Phase 2: Prioritisation** | Juin 2025 | Classification et priorisation des workflows à migrer |
| **Phase 3: Migration pilote** | Juillet 2025 | Migration des workflows non critiques sélectionnés |
| **Phase 4: Migration générale** | Août-Octobre 2025 | Migration de tous les workflows restants |
| **Phase 5: Décommissionnement** | Novembre 2025 | Mise hors service de n8n |

## Phase 1: Audit et inventaire


### Objectifs

- Identifier tous les workflows n8n existants
- Analyser leur complexité et leur criticité
- Documenter leurs intégrations et dépendances

### Actions

1. **Extraction des workflows** : Utiliser l'API n8n pour extraire tous les workflows actifs
   ```bash
   ./tools/scripts/n8n-migration/extract-workflows.sh --output ./migrations/n8n-inventory/
   ```

2. **Classification automatique** : Analyser les workflows pour déterminer leur type
   ```bash
   node ./tools/scripts/n8n-migration/classify-workflows.js --input ./migrations/n8n-inventory/ --output ./migrations/n8n-classification.json
   ```

3. **Documentation** : Générer un rapport détaillé par workflow
   ```bash
   node ./tools/scripts/n8n-migration/generate-workflow-docs.js --input ./migrations/n8n-inventory/ --output ./docs/n8n-workflows/
   ```

### Livrables

- Inventaire complet des workflows n8n actifs
- Classification initiale (complexité, criticité, dépendances)
- Rapport détaillé par workflow

## Phase 2: Classification et prioritisation


### Catégories de workflows


Chaque workflow sera classé selon ces critères :

#### Complexité

- **Simple** : Workflow linéaire avec peu d'étapes et sans état complexe
- **Modéré** : Workflow avec branchements conditionnels ou boucles simples
- **Complexe** : Workflow avec état persistant, compensation, ou longue durée

#### Criticité

- **Faible** : Non essentiel au fonctionnement du système
- **Moyenne** : Important mais avec alternatives ou contournements
- **Haute** : Critique pour le fonctionnement du système

#### Stratégie de migration cible

- **BullMQ** : Pour les workflows simples sans état
- **Temporal** : Pour les workflows complexes avec état
- **API** : Pour les workflows remplaçables par API directes
- **Suppression** : Pour les workflows obsolètes ou inutilisés

### Matrice de priorisation


| Complexité | Criticité | Priorité | Stratégie recommandée |
|------------|-----------|----------|----------------------|
| Simple | Faible | P3 | BullMQ en lot |
| Simple | Moyenne | P2 | BullMQ individuel |
| Simple | Haute | P2 | BullMQ avec tests approfondis |
| Modéré | Faible | P3 | BullMQ ou Temporal selon cas |
| Modéré | Moyenne | P2 | Temporal avec tests |
| Modéré | Haute | P1 | Temporal avec migration parallèle |
| Complexe | Faible | P2 | Temporal |
| Complexe | Moyenne | P1 | Temporal avec migration parallèle |
| Complexe | Haute | P1 | Temporal avec exécution parallèle et fallback |

### Actions

1. **Atelier de priorisation** : Réunion avec les parties prenantes
2. **Validation de la classification** : Revue détaillée des workflows critiques
3. **Plan de migration détaillé** : Calendrier par workflow avec responsables

### Livrables

- Matrice de classification validée
- Calendrier de migration par workflow
- Liste des responsables de migration par domaine

## Phase 3: Migration pilote


### Workflows pilotes


Nous sélectionnerons 3-5 workflows non critiques représentatifs des différentes catégories :

1. Un workflow simple → BullMQ
2. Un workflow complexe → Temporal
3. Un workflow avec intégrations externes → Temporal + API
4. Un workflow de notification → BullMQ

### Processus de migration par workflow


1. **Analyse détaillée** du workflow n8n
   - Extraction des données d'entrée/sortie
   - Identification des étapes et leur logique
   - Documentation des règles métier

2. **Conception de l'équivalent** standardisé
   - Modélisation avec Temporal ou BullMQ selon le cas
   - Définition des interfaces et structures de données
   - Planification des tests

3. **Implémentation** du nouveau workflow
   - Développement avec validation par étape
   - Tests unitaires et d'intégration
   - Review de code

4. **Exécution en parallèle**
   - Période de validation avec les deux systèmes
   - Comparaison des résultats
   - Ajustements si nécessaire

5. **Migration complète**
   - Redirection du trafic vers le nouveau système
   - Monitoring accru pendant la période initiale
   - Documentation du workflow migré

### Actions

1. **Préparation de l'environnement** : Mise en place des infrastructures requises
2. **Migration des workflows pilotes** : Suivant le processus établi
3. **Évaluation** : Analyse des résultats et ajustements du processus

### Livrables

- Workflows pilotes migrés et validés
- Retour d'expérience et ajustements de la méthodologie
- Modèles et templates pour accélérer les migrations suivantes

## Phase 4: Migration générale


### Approche par vagues


Les workflows seront migrés par vagues selon leur priorité :

1. **Vague 1** (Août 2025) : Workflows P3 non critiques
2. **Vague 2** (Septembre 2025) : Workflows P2 d'importance moyenne
3. **Vague 3** (Octobre 2025) : Workflows P1 critiques

### Stratégies de migration selon la complexité


#### Workflows simples (BullMQ)


```typescript
// Exemple de migration d'un workflow simple n8n vers BullMQ
// AVANT: Webhook n8n pour notification
const n8nWebhookUrl = 'https://n8n.notre-domaine.com/webhook/notification';

// APRÈS: Utilisation de l'orchestrateur standardisé
import { standardizedOrchestrator } from '@packages/business';

await standardizedOrchestrator.schedule({
  type: 'send-notification',
  data: {
    userId: '123',
    message: 'Votre document est prêt'
  },
  isComplex: false,
  queue: 'notifications'
});
```

#### Workflows complexes (Temporal)


```typescript
// Exemple de migration d'un workflow complexe n8n vers Temporal
// AVANT: Déclenchement d'un workflow n8n multi-étapes
await axios.post('https://n8n.notre-domaine.com/webhook/process-document', {
  documentId: 'doc-123',
  operations: ['extract', 'analyze', 'index']
});

// APRÈS: Utilisation de l'orchestrateur standardisé avec Temporal
import { standardizedOrchestrator } from '@packages/business';

await standardizedOrchestrator.schedule({
  type: 'process-document',
  data: {
    documentId: 'doc-123',
    operations: ['extract', 'analyze', 'index']
  },
  isComplex: true, // Indique à l'orchestrateur d'utiliser Temporal
  tags: ['document-processing']
});
```typescript

### Suivi et rapports


Un dashboard de suivi sera mis en place pour surveiller la progression :

- Nombre de workflows migrés vs restants
- Taux de réussite des workflows migrés
- Incidents par workflow
- Performance comparative entre n8n et la nouvelle implémentation

### Actions

1. **Migration des workflows par vague** selon le calendrier établi
2. **Revue hebdomadaire** de la progression et des obstacles
3. **Adaptation continue** du plan selon les retours

### Livrables

- Tous les workflows migrés avec documentation
- Rapports de performance et stabilité comparatifs
- Documentation de la nouvelle architecture

## Phase 5: Décommissionnement


### Vérifications pré-décommissionnement


1. **Audit final** : Vérifier qu'aucun workflow n'est oublié
2. **Période de stabilisation** : Deux semaines sans utiliser n8n
3. **Validation** : Confirmation des parties prenantes

### Processus de décommissionnement


1. **Mise en lecture seule** de n8n (1 semaine)
2. **Sauvegarde complète** des données et configurations
3. **Désactivation de l'interface utilisateur** n8n
4. **Archivage** des workflows pour référence future
5. **Communication** aux équipes sur la finalisation

### Plan de rollback


En cas de problème majeur non identifié précédemment :

1. **Réactivation temporaire** de n8n en parallèle
2. **Résolution** des problèmes identifiés
3. **Nouveau plan** de décommissionnement

### Actions

1. **Exécution du processus** de décommissionnement
2. **Communication** aux équipes
3. **Archivage** de la documentation et des workflows

### Livrables

- n8n complètement décommissionné
- Archives des workflows pour référence
- Rapport final de migration

## Ressources


### Équipe de migration


| Nom | Rôle | Responsabilité |
|-----|------|----------------|
| [Chef d'équipe] | Lead Migration | Supervision globale |
| [Dev Senior] | Architecte Temporal | Workflows complexes |
| [Dev Senior] | Architecte BullMQ | Workflows simples |
| [Dev] | Développeur Migration | Implémentation |
| [QA] | Testeur | Validation des migrations |

### Formation


Des sessions de formation seront organisées pour les équipes :

1. **Introduction à l'architecture standardisée** (2h)
2. **Développement avec Temporal** (1 jour)
3. **Développement avec BullMQ** (0.5 jour)
4. **Bonnes pratiques d'orchestration** (0.5 jour)

### Documentation


- [Guide d'utilisation de l'orchestrateur standardisé](../3-orchestration/orchestrateur-standardise-guide.md)
- [Documentation Temporal](https://docs.temporal.io/)
- [Documentation BullMQ](https://docs.bullmq.io/)
- [Exemples de migrations](../packages/business/examples/)

## Annexe: Modèle de fiche de migration


```markdown


# Fiche de migration workflow n8n


## Informations générales

- **ID du workflow**: [ID n8n]
- **Nom**: [Nom du workflow]
- **Description**: [Description]
- **Criticité**: [Haute/Moyenne/Faible]
- **Complexité**: [Simple/Modérée/Complexe]
- **Usage mensuel**: [Nombre d'exécutions]
- **Propriétaire**: [Équipe/Personne]

## Analyse technique

- **Nombre d'étapes**: [N]
- **Nœuds utilisés**: [Liste des types de nœuds]
- **Intégrations externes**: [Liste des services externes]
- **État persistant**: [Oui/Non]
- **Durée moyenne d'exécution**: [Temps]

## Plan de migration

- **Technologie cible**: [Temporal/BullMQ]
- **Priorité**: [P1/P2/P3]
- **Date prévue**: [Date]
- **Responsable**: [Nom]
- **Reviewers**: [Noms]

## Stratégie de migration

- **Approche**: [Parallèle/Direct/Par étapes]
- **Points d'attention**: [Liste]
- **Risques identifiés**: [Liste]
- **Plan de test**: [Description]

## Mise en œuvre

- **PR**: [Lien]
- **Date de déploiement**: [Date]
- **Période d'exécution parallèle**: [Dates début-fin]
- **Date de désactivation n8n**: [Date]

## Résultats

- **Statut**: [En cours/Complété/Bloqué]
- **Incidents**: [Description si applicable]
- **Performance comparative**: [Métrique avant/après]
- **Retours utilisateurs**: [Feedback]
```

# Guide de migration depuis n8n vers les orchestrateurs standardisés


> Date : 4 mai 2025
> Statut : En cours
> Responsable : Équipe Architecture
> Contact : equipe-architecture@example.com

## Objectif


Ce document fournit un guide détaillé pour migrer les workflows et intégrations n8n existants vers les orchestrateurs standardisés Temporal.io et BullMQ conformément au document de standardisation des technologies.

## Contexte


n8n est actuellement utilisé pour certaines intégrations externes et webhooks, mais il est en cours de dépréciation progressive au profit de Temporal.io et BullMQ pour les raisons suivantes :

1. **Duplication de fonctionnalités** : Temporal.io et BullMQ couvrent ensemble tous les cas d'usage actuellement gérés par n8n
2. **Complexité de maintenance** : La maintenance de trois systèmes d'orchestration parallèles augmente la complexité opérationnelle
3. **Optimisation des coûts** : Réduction du nombre de technologies à maintenir et à héberger
4. **Standardisation** : Simplification des patterns d'orchestration à travers l'application

## Matrice de décision


Pour déterminer quelle technologie utiliser pour remplacer n8n, suivez cette matrice de décision :

| Type de workflow n8n | Caractéristiques | Technologie cible | Implémentation standardisée |
|---------------------|-------------------|------------------|----------------------------|
| **Type A** | Workflows complexes avec état | Temporal.io | `/packages/business/temporal/` |
| **Type B** | Tâches simples sans état (<5 min) | BullMQ | `/packages/business/queue/` |
| **Type C** | Intégrations externes | Temporal.io Activities | `/packages/business/temporal/activities/` |

## Guide de migration étape par étape


### Étape 1 : Identifier et classifier les workflows n8n


1. Analysez chaque workflow n8n existant :
   - Est-ce un workflow complexe avec état ? → Type A (Temporal)
   - Est-ce une tâche simple et rapide ? → Type B (BullMQ)
   - Est-ce une intégration avec un système externe ? → Type C (Temporal Activities)

2. Documentez chaque workflow dans le registre de migration :
   ```
   /docs/migrations/n8n-workflows-registry.md
   ```

### Étape 2 : Migrer les workflows Type B vers BullMQ


Pour les tâches simples sans état (<5 minutes) :

1. **Créer un processor BullMQ**

```typescript
// /packages/business/queue/processors/{domaine}-processor.ts
import { Job } from 'bullmq';

export async function processMyTask(job: Job): Promise<any> {
  const { param1, param2 } = job.data;

  // Implémentez ici la logique équivalente à celle du workflow n8n
  const result = await doSomething(param1, param2);

  return {
    status: 'success',
    result,
    processedAt: new Date().toISOString()
  };
}
```

2. **Configurer un worker BullMQ**

```typescript
// /packages/business/queue/workers/{domaine}-worker.ts
import { Worker } from 'bullmq';
import { redisConnection } from '../client/redis-connection';
import { processMyTask } from '../processors/{domaine}-processor';

const worker = new Worker('my-queue', processMyTask, {
  connection: redisConnection,
  // Configuration supplémentaire selon les besoins
});

export default worker;
```

3. **Mettre à jour le code client**

Avant (avec n8n) :
```typescript
import { n8n } from '../orchestrators';

async function triggerProcess(data) {
  const executionId = await n8n.schedule({
    id: 'unique-task-id',
    type: 'my-task',
    integration: {
      workflowId: 'n8n-workflow-id'
    },
    data
  });

  return executionId;
}
```

Après (avec BullMQ) :
```typescript
import { bullmq } from '@notre-org/business/queue';

async function triggerProcess(data) {
  const jobId = await bullmq.schedule('my-queue', data, {
    priority: 2,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });

  return jobId;
}
```

### Étape 3 : Migrer les workflows Type A vers Temporal.io


Pour les workflows complexes avec état :

1. **Créer les activités Temporal**

```typescript
// /packages/business/temporal/activities/{domaine}-activities.ts
export async function performStep1(input: StepInput): Promise<StepOutput> {
  // Implémentez ici la logique équivalente à l'étape 1 du workflow n8n
  return result;
}

export async function performStep2(input: StepInput): Promise<StepOutput> {
  // Implémentez ici la logique équivalente à l'étape 2 du workflow n8n
  return result;
}
```

2. **Créer le workflow Temporal**

```typescript
// /packages/business/temporal/workflows/{domaine}-workflows.ts
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/{domaine}-activities';

const { performStep1, performStep2 } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function myWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  // Étape 1
  const step1Result = await performStep1(input);

  // Étape 2
  const step2Result = await performStep2(step1Result);

  // Résultat final
  return {
    status: 'completed',
    result: step2Result,
    workflowId: workflowInfo().workflowId,
    completedAt: new Date().toISOString()
  };
}
```

3. **Configurer un worker Temporal**

```typescript
// /packages/business/temporal/workers/{domaine}-worker.ts
import { Worker } from '@temporalio/worker';
import * as activities from '../activities/{domaine}-activities';
import { temporalConnection } from '../client/temporal-client';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflows/{domaine}-workflows'),
    activities,
    taskQueue: 'my-domain-task-queue',
    connection: temporalConnection
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

4. **Mettre à jour le code client**

Avant (avec n8n) :
```typescript
import { n8n } from '../orchestrators';

async function startComplexProcess(data) {
  const executionId = await n8n.schedule({
    id: 'complex-process',
    type: 'complex-workflow',
    integration: {
      workflowId: 'complex-n8n-workflow-id'
    },
    data
  });

  return executionId;
}
```

Après (avec Temporal) :
```typescript
import { temporal } from '@notre-org/business/temporal';

async function startComplexProcess(data) {
  const workflowId = await temporal.startWorkflow({
    workflowType: 'myWorkflow',
    taskQueue: 'my-domain-task-queue',
    workflowId: `my-workflow-${Date.now()}`, // ID unique
    args: [data]
  });

  return workflowId;
}
```

### Étape 4 : Migrer les intégrations externes (Type C)


Pour les intégrations avec des systèmes externes :

1. **Créer des activités Temporal dédiées aux appels API**

```typescript
// /packages/business/temporal/activities/external-integration-activities.ts
import axios from 'axios';

export async function callExternalApi(config: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}): Promise<any> {
  try {
    const response = await axios({
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });

    return {
      status: response.status,
      data: response.data
    };
  } catch (error) {
    throw new Error(`Erreur API externe: ${error.message}`);
  }
}
```

2. **Utiliser cette activité dans un workflow Temporal**

```typescript
// /packages/business/temporal/workflows/integration-workflows.ts
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/external-integration-activities';

const { callExternalApi } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3
  }
});

export async function externalIntegrationWorkflow(input: IntegrationInput): Promise<IntegrationResult> {
  // Appel à l'API externe avec retry automatique
  const apiResult = await callExternalApi({
    url: input.endpoint,
    method: input.method,
    data: input.data,
    headers: input.headers
  });

  // Traitement du résultat
  return {
    status: apiResult.status === 200 ? 'success' : 'error',
    data: apiResult.data,
    processedAt: new Date().toISOString()
  };
}
```

## Verification et validation


Après la migration d'un workflow n8n, effectuez les vérifications suivantes :

1. **Tests fonctionnels** : Vérifiez que le comportement est identique à l'original
2. **Tests de performance** : Assurez-vous que les performances sont au moins équivalentes
3. **Tests de résilience** : Vérifiez la gestion des erreurs et les mécanismes de retry
4. **Monitoring** : Configurez la surveillance appropriée pour la nouvelle implémentation

## Planning de migration


La migration doit suivre le calendrier global défini dans le document de s

## Ressources


- [Documentation Temporal.io](https://docs.temporal.io/)
- [Documentation BullMQ](https://docs.bullmq.io/)
- [Structure standardisée Temporal](../../packages/business/temporal/README.md)
- [Structure standardisée BullMQ](../../packages/business/queue/README.md)
- [Document de standardisation des technologies](../5-integration/technologies-standards.md)

## Outils de suivi de la migration


### Scripts disponibles


Pour faciliter le processus de migration, plusieurs scripts ont été développés et sont disponibles dans le répertoire `/tools/scripts/n8n-migration/` :

1. **extract-workflows.ts** : Extraction des workflows n8n existants
   ```bash
   npx ts-node tools/scripts/n8n-migration/extract-workflows.ts --token <votre_token_n8n> --output ./migrations/n8n-inventory
   ```

2. **classify-workflows.ts** : Classification automatique des workflows selon leur complexité et criticité
   ```bash
   npx ts-node tools/scripts/n8n-migration/classify-workflows.ts --input ./migrations/n8n-inventory --output ./migrations/n8n-classification.json
   ```

3. **validate-and-repair-workflows.ts** : Validation de l'intégrité des workflows
   ```bash
   npx ts-node tools/scripts/n8n-migration/validate-and-repair-workflows.ts --input ./migrations/n8n-inventory
   ```

4. **initialize-migration-dashboard.ts** : Configuration du tableau de bord de suivi
   ```bash
   npx ts-node tools/scripts/n8n-migration/initialize-migration-dashboard.ts --input ./migrations/n8n-classification.json
   ```

5. **generate-migration-status-report.ts** : Génération d'un rapport d'état de la migration
   ```bash
   npx ts-node tools/scripts/n8n-migration/generate-migration-status-report.ts --output ./docs/n8n-migration-status-report.md
   ```

### Mise à jour du statut de migration


Pour mettre à jour le statut de migration d'un workflow spécifique, utilisez le script `update-migration-status.js` :

```bash
node update-migration-status.js <workflowId> <status> [options]

# Exemple pour marquer un workflow comme complété

node update-migration-status.js 12345 completed --target temporal --by "Jean Dupont"

# Exemple pour marquer un workflow comme en cours

node update-migration-status.js 67890 in-progress --target bullmq --by "Marie Martin"
```

Options disponibles :
- `--target <system>` : Système cible ('bullmq', 'temporal', 'api')
- `--date <date>` : Date de migration (format YYYY-MM-DD, défaut : aujourd'hui)
- `--by <name>` : Personne responsable de la migration
- `--notes <text>` : Notes supplémentaires

### Rapport d'état de la migration


Pour générer un rapport détaillé sur l'état actuel de la migration, utilisez :

```bash
npx ts-node tools/scripts/n8n-migration/generate-migration-status-report.ts
```

Le rapport inclut :
- Vue d'ensemble de la progression
- Liste des workflows critiques en attente de migration
- Répartition par stratégie cible
- Workflows récemment migrés
- Prochains workflows à migrer
- Recommandations

Vous pouvez spécifier différentes options :
- `--format markdown` (défaut) ou `--format json` pour le format de sortie
- `--output <chemin>` pour spécifier l'emplacement du rapport

### Tableau de bord de migration


Un tableau de bord interactif est disponible pour suivre la progression de la migration :

```bash


# Lancer le tableau de bord

npm run migration-dashboard

# URL d'accès

# http://localhost:3030/migration-dashboard

```

Le tableau de bord affiche :
- Progression globale de la migration
- Répartition par priorité et statut
- Liste des workflows avec filtres et recherche
- Détails et historique par workflow

