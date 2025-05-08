# Standardisation des Technologies - Projet de Migration IA

*Document créé le 3 mai 2025*  
*Dernière mise à jour : 4 mai 2025*

## Sommaire
- [Objectif](#objectif)
- [Méthodologie d'évaluation des technologies](#méthodologie-dévaluation-des-technologies)
- [Processus d'évaluation des implémentations existantes](#processus-dévaluation-des-implémentations-existantes)
- [Cycle de vie du document](#cycle-de-vie-du-document)
- [Technologies d'orchestration](#technologies-dorchestration)
- [Bases de données et ORM](#bases-de-données-et-orm)
- [Framework Backend](#framework-backend)
- [Framework Frontend](#framework-frontend)
- [API et Communication](#api-et-communication)
- [Validation et Typing](#validation-et-typing)
- [Testing](#testing)
- [CI/CD et Gestion de Projet](#cicd-et-gestion-de-projet)
- [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents)
- [Logging et Monitoring](#logging-et-monitoring)
- [Conteneurisation et Infrastructure as Code](#conteneurisation-et-infrastructure-as-code)
- [Observabilité IA](#observabilité-ia)
- [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts)
- [Delivery Avancée](#delivery-avancée)
- [Gestion de Cache et Stockage Temporaire](#gestion-de-cache-et-stockage-temporaire)
- [Processus de révision](#processus-de-révision)
- [Dérogations](#dérogations)
- [Technologies émergentes](#technologies-émergentes)
- [Index des technologies](#index-des-technologies)

## Objectif

Ce document définit les technologies standards à utiliser dans le projet de migration IA. Il vise à :
- Standardiser les choix technologiques
- Éliminer les technologies obsolètes
- Réduire les duplications et les solutions parallèles
- Assurer la maintenabilité à long terme du code
- Faciliter l'intégration des nouveaux membres de l'équipe
- Optimiser les coûts de développement et de maintenance

## Méthodologie d'évaluation des technologies

Pour chaque technologie, nous utilisons la classification suivante:

- **ADOPTER** : Technologie standard à utiliser pour tous les nouveaux développements.
- **CONSERVER** : Technologie acceptable qui peut continuer à être utilisée.
- **MAINTENIR** : Technologie à conserver pour le code existant mais à ne pas utiliser pour les nouveaux développements.
- **LIMITER** : Technologie à utiliser uniquement dans des cas spécifiques et justifiés.
- **DÉPRÉCIER** : Technologie en cours d'élimination, à remplacer progressivement.
- **ÉLIMINER** : Technologie à remplacer en priorité car obsolète ou problématique.
- **STANDARDISER** : Technologie à conserver mais dont l'implémentation doit être standardisée.
- **ÉVALUER** : Technologie prometteuse en cours d'évaluation pour une possible adoption future.

### Critères d'évaluation

Chaque décision technologique est basée sur les critères suivants, pondérés selon l'importance stratégique pour notre organisation :

| Critère | Pondération | Description |
|---------|-------------|-------------|
| **Maturité** | 25% | Stabilité, adoption par l'industrie, communauté active |
| **Maintenabilité** | 20% | Facilité de maintenance, documentation, lisibilité |
| **Performances** | 15% | Efficacité, scalabilité, optimisation des ressources |
| **Sécurité** | 15% | Vulnérabilités connues, mises à jour de sécurité |
| **Compétences internes** | 10% | Expertise de l'équipe avec la technologie |
| **Intégration** | 10% | Compatibilité avec l'écosystème technologique existant |
| **Coût** | 5% | Licences, coûts d'infrastructure, formation |

## Processus d'évaluation des implémentations existantes

Avant de procéder à des changements d'architecture ou d'implémentation basés sur ce document de standardisation, il est essentiel d'évaluer rigoureusement l'état actuel du projet. Cette section définit la méthodologie d'évaluation et de comparaison à suivre avant toute migration technologique.

### Démarche d'évaluation en quatre étapes

1. **Analyse de l'existant**
   - Documenter l'architecture actuelle et ses principes de conception
   - Identifier les patterns d'implémentation existants
   - Cartographier les dépendances entre composants
   - Évaluer la couverture des tests et la documentation technique

2. **Comparaison avec les standards définis**
   - Établir un tableau comparatif entre l'implémentation actuelle et les recommandations
   - Identifier les écarts (gaps) et les points de convergence
   - Quantifier le niveau de conformité aux standards par module
   - Noter les bonnes pratiques existantes qui pourraient enrichir les standards

3. **Analyse des coûts et bénéfices**
   - Estimer l'effort de migration (en jours-personnes)
   - Évaluer les risques associés aux changements proposés
   - Quantifier les bénéfices attendus en termes de :
     - Maintenabilité (réduction de la dette technique)
     - Performance (optimisations potentielles)
     - Temps de développement futur
     - Facilité d'intégration de nouvelles fonctionnalités

4. **Élaboration d'un plan d'action graduel**
   - Prioriser les changements selon leur ratio bénéfice/effort
   - Définir des étapes intermédiaires mesurables et validables
   - Établir une stratégie de cohabitation des implémentations pendant la transition
   - Prévoir des points de validation et des critères de réussite

### Matrice de décision

Pour chaque composant à évaluer, utilisez cette matrice de décision standardisée :

| Critère | Poids | Implémentation actuelle (1-5) | Standard recommandé (1-5) | Écart pondéré |
|---------|-------|-------------------------------|---------------------------|---------------|
| Maintenabilité | 25% | | | |
| Performance | 20% | | | |
| Sécurité | 20% | | | |
| Intégration | 15% | | | |
| Documentation | 10% | | | |
| Couverture des tests | 10% | | | |
| **Score global** | **100%** | | | |

### Rapport d'évaluation standard

Chaque évaluation doit être documentée selon ce format standardisé :

#### 1. Résumé exécutif
Synthèse des conclusions principales et des recommandations en 3-5 points clés.

#### 2. Points forts de l'implémentation actuelle
Liste des aspects positifs et pratiques à conserver ou à intégrer dans les standards.

#### 3. Écarts par rapport aux standards
Détail des divergences entre l'implémentation existante et les recommandations du document de standardisation.

#### 4. Améliorations suggérées
Propositions concrètes d'améliorations, classées par ordre de priorité et avec estimation d'effort.

#### 5. Stratégie de migration recommandée
Plan par étapes pour migrer progressivement vers l'implémentation standardisée, incluant:
- Les phases de transition
- Les stratégies de cohabitation des implémentations
- Les points de validation intermédiaires
- Les rollback plans en cas de problème

#### 6. Conclusion et recommandation
Recommandation finale avec justification et conditions préalables à réunir avant d'entamer la migration.

### Exemple: Évaluation de l'orchestrateur actuel

Voici un exemple d'évaluation comparant l'orchestrateur existant avec les recommandations de standardisation:

#### Points forts de l'implémentation actuelle
1. **Architecture intelligente déjà en place**: Un "Orchestrateur Standardisé Intelligent" qui implémente déjà l'approche recommandée (Temporal pour workflows complexes, BullMQ pour tâches simples)
2. **Sélection automatique de l'orchestrateur**: Logique sophistiquée pour déterminer quel orchestrateur utiliser en fonction des caractéristiques de la tâche
3. **Interface standardisée**: L'interface `StandardizedOrchestrator` offre déjà une abstraction commune
4. **Méthodes spécialisées**: Des méthodes dédiées pour chaque type de tâche
5. **Gestion unifiée des statuts et annulations**: Gestion transparente du statut et de l'annulation des tâches

#### Améliorations suggérées par le document de standardisation
1. **Structure de dossier unifiée**: Organisation recommandée des fichiers non encore implémentée
2. **Patterns standardisés pour Temporal**: Patterns précis à formaliser dans l'implémentation actuelle
3. **Architecture BullMQ standardisée**: Conventions de nommage et stratégies de gestion d'erreurs à enrichir
4. **Plan de dépréciation n8n**: Plan détaillé de migration progressive à mettre en œuvre
5. **Observabilité et monitoring améliorés**: Intégration d'outils de monitoring à renforcer

#### Recommandation
Conserver l'architecture intelligente de l'orchestrateur actuel, mais l'enrichir progressivement avec les éléments détaillés dans le document de standardisation, notamment:
1. Restructurer les fichiers selon l'organisation recommandée
2. Implémenter les patterns standardisés pour Temporal et BullMQ
3. Suivre le plan de migration depuis n8n
4. Améliorer l'observabilité avec OpenTelemetry et les logs structurés

### Processus de validation des changements

Tout changement d'implémentation majeur basé sur ce document de standardisation doit suivre ce processus de validation:

1. **Évaluation préliminaire**: Produire un rapport d'évaluation selon le format standardisé
2. **Revue technique**: Présentation des conclusions à l'équipe d'architecture pour validation
3. **POC (Preuve de concept)**: Implémentation d'un prototype minimal démontrant la faisabilité
4. **Tests comparatifs**: Benchmarks comparant les performances des implémentations actuelle et proposée
5. **Validation incrémentale**: Déploiement progressif sur des services non critiques
6. **Documentation des apprentissages**: Capture des leçons apprises et mise à jour des standards si nécessaire

Ce processus rigoureux garantit que les changements apportés représentent une véritable amélioration plutôt qu'une simple conformité aux standards définis.

## Cycle de vie du document

Ce document est un référentiel évolutif qui suit un cycle de vie bien défini pour maintenir sa pertinence face aux évolutions technologiques.

### Processus de mise à jour

1. **Révision trimestrielle** (mars, juin, septembre, décembre)
   - Évaluation des technologies émergentes
   - Analyse des technologies en observation
   - Mise à jour des statuts
   - Mise à jour des recommandations d'implémentation

2. **Révision d'urgence** (au besoin)
   - Déclenchée par la découverte de vulnérabilités critiques
   - Déclenchée par l'obsolescence soudaine d'une technologie clé
   - Déclenchée par l'émergence d'une technologie disruptive

### Responsables par domaine

| Domaine technologique | Responsable principal | Suppléant |
|-----------------------|------------------------|-----------|
| Orchestration | Marc Dubois | Sarah Chen |
| Bases de données | Emma Lefèvre | Raj Patel |
| Framework Backend | Thomas Klein | Anna Kowalski |
| Framework Frontend | Julie Martin | David Nguyen |
| APIs & Communication | Pierre Legrand | Sophia Rahman |
| Intelligence Artificielle | Léa Bernard | James Wilson |
| Infrastructure & CI/CD | Nicolas Girard | Aisha Mohammed |

### Historique des changements majeurs

| Date | Version | Changements | Auteur |
|------|---------|------------|--------|
| 03/05/2025 | 1.0 | Version initiale | Équipe Architecture |
| 04/05/2025 | 1.1 | Ajout table des matières et matrices décisionnelles | M. Dubois |

### Intégration avec les outils de vérification

Ce document est intégré avec notre infrastructure d'intégration continue via les outils suivants :

- **check-tech-obsolescence.js** : Analyse automatique du code pour détecter les technologies obsolètes
- **continuous-improvement.sh** : Génération de rapports et suggestions d'amélioration
- **MCP ObsolescenceDetectorService** : Service d'analyse prédictive de l'obsolescence technologique

Les alertes générées par ces outils sont automatiquement transmises aux responsables de domaine concernés et discutées lors des réunions de révision trimestrielles.

## Technologies d'orchestration

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Temporal.io** | **ADOPTER** | Solution principale pour les workflows IA complexes et durables. Offre une excellente gestion des erreurs, visibilité et durabilité des workflows. |
| **BullMQ** | **CONSERVER** | À utiliser pour les tâches simples, files d'attente et jobs asynchrones non-critiques. Ne pas utiliser pour les workflows complexes. |
| **n8n** | **DÉPRÉCIER** | Remplacer progressivement par Temporal pour les workflows et BullMQ pour les tâches simples. |
| **Custom orchestrators** | **ÉLIMINER** | Tous les orchestrateurs personnalisés (hors adaptateurs) doivent être migrés vers Temporal ou BullMQ. |

### Temporal.io - Implémentation standardisée

Temporal.io est notre solution principale pour l'orchestration des workflows IA complexes. Voici les guidelines d'implémentation standardisée :

#### Architecture

- **Structure de dossier unifiée** : Tous les fichiers liés à Temporal doivent être organisés dans `/packages/business/temporal/` avec la structure suivante :
  - `client/` : Configuration et abstraction du client Temporal
  - `workers/` : Définition et configuration des workers Temporal 
  - `workflows/` : Workflows organisés par domaine fonctionnel
  - `activities/` : Activités réutilisables
  - `testing/` : Utilitaires pour tester les workflows
  - `types/` : Définitions TypeScript partagées

#### Patterns à utiliser

1. **Modèles de workflows standardisés** :
   - Utiliser `defineWorkflow` avec des noms explicites liés au domaine métier
   - Implémenter la gestion d'erreurs avec retry automatique
   - Diviser les workflows complexes en phases distinctes avec points de sauvegarde
   - Utiliser `continueAsNew` pour les workflows de longue durée

2. **Gestion d'état** :
   - Sauvegarder régulièrement l'état des workflows via des activités dédiées
   - Structurer les inputs/outputs avec des interfaces TypeScript
   - Valider les entrées avec Zod

3. **Observabilité** :
   - Intégrer OpenTelemetry pour le tracing distribué
   - Utiliser un logger structuré plutôt que `console.log`
   - Exposer des métriques standardisées pour Prometheus

4. **Contrôle des workflows** :
   - Implémenter des handlers de signaux pour pause/reprise
   - Utiliser des requêtes pour récupérer l'état actuel
   - Définir des timeouts adaptés au contexte d'exécution

#### Cas d'usage

| Type de workflow | Technologie recommandée | Cas d'utilisation |
|------------------|-------------------------|-------------------|
| Workflows IA complexes avec état | Temporal.io | Migration de code, analyses profondes, refactorings automatisés |
| Workflows courts (< 5 min) | BullMQ | Traitements par lot, indexation, notifications |
| Workflows avec dépendances externes | Temporal.io | Intégration avec des API tierces peu fiables |
| Traitements massivement parallèles | BullMQ | Traitement d'image, génération de miniatures |

#### Exemple de workflow standardisé

```typescript
// Exemple minimal de workflow respectant les standards
export const StandardizedWorkflow = defineWorkflow('DomainSpecificWorkflow', async (input: ValidatedInput) => {
  // Validation avec Zod
  const validatedInput = workflowInputSchema.parse(input);
  
  // Logging structuré
  const logger = createWorkflowLogger('DomainSpecificWorkflow');
  logger.info('Workflow started', { workflowId: workflowInfo().workflowId });
  
  try {
    // Phase 1 : Analyse
    const analysisResult = await executeActivity('analyzeData', {
      taskQueue: 'analysis-queue',
      startToCloseTimeout: '30 minutes',
      retry: standardRetryPolicy
    }, validatedInput);
    
    // Checkpoint
    await executeActivity('saveCheckpoint', { phase: 'analysis', result: analysisResult });
    
    // Phase 2 : Traitement
    // ...
    
    return { success: true, result };
  } catch (error) {
    logger.error('Workflow failed', { error });
    await executeActivity('notifyFailure', { workflowId, error });
    throw error;
  }
});
```

#### Migration depuis les anciennes implémentations

Les implémentations existantes doivent être migrées progressivement vers cette architecture standardisée, en suivant ces étapes :

1. Créer un adaptateur compatible avec la nouvelle structure
2. Migrer les workflows un par un
3. Valider avec des tests automatisés
4. Supprimer l'ancienne implémentation

### BullMQ - Implémentation standardisée

BullMQ est notre solution complémentaire à Temporal.io pour gérer des tâches simples, rapides et sans état. Voici les guidelines d'implémentation standardisée :

#### Architecture

- **Structure de dossier unifiée** : Tous les fichiers liés à BullMQ doivent être organisés dans `/packages/business/queue/` avec la structure suivante :
  - `client/` : Configuration et abstraction du client BullMQ
  - `workers/` : Définition et configuration des workers BullMQ
  - `processors/` : Fonctions de traitement des jobs
  - `testing/` : Utilitaires pour tester les queues
  - `types/` : Définitions TypeScript partagées

#### Patterns à utiliser

1. **Queues nommées par domaine** :
   - Utiliser des noms de queues explicites liés au domaine métier (ex: `notification`, `image-processing`)
   - Limiter le nombre de queues pour éviter la fragmentation
   - Mettre en place des politiques de rétention adaptées au type de tâche

2. **Gestion des priorités** :
   - Définir un système cohérent de priorités (1-10)
   - Documenter les niveaux de priorité pour chaque type de tâche
   - Réserver les priorités élevées pour les tâches critiques

3. **Observabilité** :
   - Implémenter des hooks `completed` et `failed` avec logging structuré
   - Exposer des métriques Redis pour Prometheus
   - Utiliser Bull-Board pour la visualisation des queues en développement

4. **Gestion des erreurs** :
   - Définir des stratégies de retry adaptées à chaque type de tâche
   - Utiliser des backoffs exponentiels pour les opérations avec services externes
   - Mettre en place une queue "dead letter" pour analyser les échecs

#### Cas d'usage

| Type de tâche | File d'attente | Stratégie de retry | Cas d'utilisation |
|---------------|----------------|-------------------|-------------------|
| Notifications | `notification` | 3 tentatives, délai 10s | Alertes utilisateurs, résultats de workflow |
| Traitements médias | `media-processing` | 2 tentatives, délai 30s | Génération de miniatures, optimisation d'images |
| Indexation | `indexing` | 5 tentatives, backoff exponentiel | Mise à jour des index de recherche |
| Maintenance | `maintenance` | 1 tentative | Nettoyage de données, archivage |

#### Exemple de processeur standardisé

```typescript
// Exemple minimal de processeur BullMQ respectant les standards
import { Job } from 'bullmq';
import { z } from 'zod';
import { createStructuredLogger } from '@/utils/logger';

// Définition du schéma de validation
const notificationJobSchema = z.object({
  userId: z.string(),
  message: z.string(),
  channel: z.enum(['email', 'push', 'sms']),
  priority: z.number().min(1).max(5).optional()
});

type NotificationJobData = z.infer<typeof notificationJobSchema>;

// Processeur de job standardisé
export async function processNotificationJob(job: Job<NotificationJobData>) {
  const logger = createStructuredLogger('notification-processor');
  
  try {
    // Validation des données du job
    const data = notificationJobSchema.parse(job.data);
    
    logger.info('Processing notification', { jobId: job.id, userId: data.userId, channel: data.channel });
    
    // Mise à jour de la progression
    await job.updateProgress(10);
    
    // Logique métier
    const result = await sendNotificationByChannel(data);
    
    // Mise à jour finale
    await job.updateProgress(100);
    
    logger.info('Notification processed successfully', { jobId: job.id });
    return result;
  } catch (error) {
    logger.error('Failed to process notification', { jobId: job.id, error });
    throw error;
  }
}

// Enregistrement du processeur dans un worker
registerProcessor('notification', processNotificationJob);
```

#### Configuration standardisée

```typescript
// Configuration standard pour les queues BullMQ
import { QueueOptions } from 'bullmq';

export const standardQueueOptions: QueueOptions = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // 1 jour
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 jours
    },
  },
  // Options pour la connexion Redis
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }
};
```

#### Intégration avec NestJS

Pour les services NestJS, utiliser le module `@nestjs/bull` qui fournit une intégration élégante de BullMQ :

```typescript
// Module NestJS standardisé pour BullMQ
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'notification',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  providers: [NotificationProcessor],
})
export class QueueModule {}
```

#### Migration depuis les anciennes implémentations

Les implémentations existantes doivent être migrées progressivement vers cette architecture standardisée, en suivant ces étapes :

1. Restructurer les queues selon les domaines fonctionnels
2. Standardiser les noms de queues et les options
3. Mettre à jour les processeurs pour suivre le pattern standardisé
4. Mettre en place l'observabilité

### n8n - Stratégie de dépréciation

n8n est actuellement utilisé pour certaines intégrations externes et webhooks, mais nous avons décidé de le déprécier progressivement au profit de Temporal.io et BullMQ pour plusieurs raisons :

1. **Duplication de fonctionnalités** : Temporal.io et BullMQ couvrent ensemble tous les cas d'usage actuellement gérés par n8n
2. **Complexité de maintenance** : La maintenance de trois systèmes d'orchestration parallèles augmente la complexité opérationnelle
3. **Optimisation des coûts** : Réduction du nombre de technologies à maintenir et à héberger
4. **Standardisation** : Simplification des patterns d'orchestration à travers l'application

#### Plan de migration progressive

La migration depuis n8n vers Temporal.io et BullMQ doit suivre ce plan en quatre phases :

##### Phase 1: Inventaire et classification (Q2 2025)
- Recenser tous les workflows n8n existants
- Classer chaque workflow selon sa complexité et son type :
  - **Type A**: Workflows complexes avec état → Temporal.io
  - **Type B**: Tâches simples sans état → BullMQ
  - **Type C**: Intégrations externes complexes → Temporal.io avec activités HTTP

##### Phase 2: Développement des adaptateurs (Q3 2025)
- Créer un adaptateur Temporal pour les workflows de Type A et C
- Créer un adaptateur BullMQ pour les workflows de Type B
- Mettre en place un système de redondance pour assurer la continuité pendant la migration

##### Phase 3: Migration des workflows (Q3-Q4 2025)
- Migrer les workflows selon l'ordre de priorité suivant :
  1. Workflows non critiques de Type B vers BullMQ
  2. Workflows critiques de Type A vers Temporal.io
  3. Intégrations externes (Type C) vers Temporal.io

##### Phase 4: Décommissionnement (Q1 2026)
- Vérifier que tous les workflows ont été migrés avec succès
- Mettre n8n en mode lecture seule pendant 1 mois
- Décommissionner l'infrastructure n8n

#### Matrice de correspondance n8n → Temporal/BullMQ

| Fonctionnalité n8n | Alternative recommandée | Remarques |
|--------------------|-------------------------|-----------|
| Workflows simples | BullMQ | Utiliser les queues nommées par domaine |
| Workflows avec état | Temporal.io | Utiliser les workflows avec continueAsNew |
| Déclencheurs webhook | API REST + BullMQ | Créer une API REST qui publie dans BullMQ |
| Intégrations tierces | Temporal.io Activities | Encapsuler les appels HTTP dans des activités |
| Interface visuelle | Temporal UI | Compléter avec des tableaux de bord Grafana |

#### Exemple d'un workflow n8n migré vers Temporal.io

Voici un exemple de migration d'un workflow d'intégration externe de n8n vers Temporal.io :

```typescript
// Avant : Workflow n8n via l'orchestrateur
const executionId = await n8n.schedule({
  id: 'sync-external-data',
  type: 'data-sync',
  integration: {
    workflowId: 'external-sync-workflow'
  },
  data: {
    sourceSystem: 'legacy-crm',
    entities: ['customers', 'orders']
  }
});

// Après : Workflow Temporal équivalent
import { WorkflowClient } from '@temporalio/client';
import { externalSyncWorkflow } from './workflows';
import { validateSyncInput } from './validators';

const client = new WorkflowClient();
const input = {
  sourceSystem: 'legacy-crm',
  entities: ['customers', 'orders']
};

// Validation avec Zod
const validInput = validateSyncInput(input);

const handle = await client.start(externalSyncWorkflow, {
  args: [validInput],
  taskQueue: 'external-integration',
  workflowId: `sync-external-data-${Date.now()}`,
});

console.log(`Workflow started: ${handle.workflowId}`);
```

#### Documentation des APIs de migration

Pour faciliter la migration, nous avons développé des APIs de migration spécifiques :

1. **MigrationService** : Service d'analyse des workflows n8n et génération des équivalents Temporal/BullMQ
2. **WorkflowTranslator** : Utilitaire de conversion de la logique n8n vers Temporal/BullMQ
3. **RunParallel** : Utilitaire permettant d'exécuter des workflows en parallèle sur n8n et Temporal pendant la phase de migration

#### Critères de validation de migration

Chaque workflow migré doit répondre aux critères suivants avant d'être considéré comme complètement migré :

1. Fonctionnalité équivalente ou améliorée
2. Tests automatisés validant le comportement
3. Documentation mise à jour
4. Métriques et monitoring en place
5. Période de fonctionnement parallèle sans incident

## Bases de données et ORM

> **INFORMATION :** Pour des standards détaillés concernant les bases de données et ORM, veuillez consulter le document spécialisé [standards-bases-donnees-orm.md](./standards-bases-donnees-orm.md).

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Prisma** | **ADOPTER** | ORM principal pour toutes les nouvelles fonctionnalités. À utiliser avec le schéma centralisé. |
| **TypeORM** | **MAINTENIR** | Conserver pour le code existant, mais ne pas utiliser pour les nouvelles fonctionnalités. |
| **MySQL** | **MAINTENIR** | Pour compatibilité avec les systèmes existants. |
| **PostgreSQL** | **ADOPTER** | Base de données principale pour toutes les nouvelles fonctionnalités. |
| **SQLite** | **LIMITER** | À utiliser uniquement pour les tests ou le développement local. |

## Framework Backend

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **NestJS** | **ADOPTER** | Framework principal pour le backend. Tous les nouveaux microservices doivent l'utiliser. |
| **Express** | **MAINTENIR** | Conserver pour le code existant, migrer progressivement vers NestJS. |
| **Fastify** | **ÉLIMINER** | Migrer vers NestJS pour une meilleure standardisation. |

## Framework Frontend

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Remix** | **ADOPTER** | Framework principal pour les applications web. |
| **React** | **ADOPTER** | Bibliothèque UI sous-jacente. |
| **Next.js** | **LIMITER** | À utiliser uniquement pour des cas spécifiques où Remix ne convient pas. |
| **Angular** | **ÉLIMINER** | Migrer progressivement vers Remix/React. |

## API et Communication

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Model Context Protocol** | **ADOPTER** | Standard pour toutes les communications entre agents IA. |
| **REST API** | **ADOPTER** | Pour les API publiques et la communication entre services. |
| **GraphQL** | **LIMITER** | À utiliser uniquement pour les interfaces qui nécessitent des requêtes complexes et flexibles. |
| **gRPC** | **ADOPTER** | Pour les communications à haut débit entre services internes. |
| **WebSockets** | **CONSERVER** | Pour les communications bidirectionnelles en temps réel. |
| **SOAP** | **ÉLIMINER** | Migrer vers REST ou GraphQL. |
| **OpenAPI (Swagger)** | **ADOPTER** | Pour la documentation et spécification des API REST. |
| **AsyncAPI** | **ÉVALUER** | Pour la documentation des API événementielles et asynchrones. |

### Model Context Protocol - Implémentation standardisée

Le Model Context Protocol (MCP) est notre standard de communication pour les agents d'intelligence artificielle. Tous les services d'IA du projet doivent l'utiliser pour communiquer entre eux.

#### Structure MCP standardisée

```typescript
// Schéma MCP standard
import { z } from 'zod';

// Schéma de base du contexte
export const MCPContextSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
  version: z.string().default('2.0'),
  agent: z.object({
    id: z.string(),
    name: z.string(),
    capabilities: z.array(z.string()).optional(),
    version: z.string().optional(),
  }),
  session: z.object({
    id: z.string().uuid(),
    history: z.array(z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  input: z.object({
    query: z.string(),
    parameters: z.record(z.string(), z.any()).optional(),
    format: z.enum(['text', 'json', 'markdown', 'html']).default('text'),
  }),
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      parameters: z.any().optional(),
      returns: z.any().optional(),
    })
  ).optional(),
  contextData: z.record(z.string(), z.any()).optional(),
  security: z.object({
    accessToken: z.string().optional(),
    permissions: z.array(z.string()).optional(),
  }).optional(),
  tracing: z.object({
    traceId: z.string().optional(),
    spanId: z.string().optional(),
    parentId: z.string().optional(),
    sampled: z.boolean().default(true),
  }).optional(),
});

// Types inférés
export type MCPContext = z.infer<typeof MCPContextSchema>;
```

#### Service MCP standardisé

```typescript
// Service MCP standardisé
import { MCPContext, MCPContextSchema } from './types';
import { OpenTelemetry } from '../telemetry';

export class MCPService {
  constructor(
    private readonly agentConfig: {
      id: string;
      name: string;
      capabilities: string[];
      version: string;
    },
    private readonly telemetry: OpenTelemetry
  ) {}

  // Valider et enrichir le contexte MCP
  async processContext(rawContext: unknown): Promise<MCPContext> {
    // Validation avec Zod
    const validationResult = MCPContextSchema.safeParse(rawContext);
    
    if (!validationResult.success) {
      throw new Error(`Contexte MCP invalide: ${validationResult.error.message}`);
    }
    
    // Contexte validé
    const context = validationResult.data;
    
    // Enrichir avec les informations de l'agent
    context.agent = {
      ...context.agent,
      ...this.agentConfig
    };
    
    // Initialiser le traçage si nécessaire
    if (!context.tracing) {
      context.tracing = {};
    }
    
    // Intégrer avec la télémétrie
    const span = this.telemetry.startSpan('mcp.process_context', {
      attributes: {
        'mcp.request_id': context.requestId,
        'mcp.version': context.version,
        'mcp.agent.id': context.agent.id,
        'mcp.session.id': context.session.id,
      }
    });
    
    // Attacher les IDs de traçage
    context.tracing.traceId = span.traceId;
    context.tracing.spanId = span.spanId;
    
    return context;
  }

  // Exécuter une requête MCP
  async executeRequest(context: MCPContext): Promise<any> {
    // Implémenter la logique spécifique à l'agent
    throw new Error('La méthode executeRequest doit être implémentée par le service spécifique');
  }
  
  // Formater une réponse MCP
  formatResponse(context: MCPContext, result: any): any {
    return {
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      agent: context.agent,
      session: context.session.id,
      result,
      status: 'success',
      tracing: context.tracing
    };
  }
  
  // Formater une réponse d'erreur
  formatErrorResponse(context: MCPContext, error: Error): any {
    return {
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      agent: context.agent,
      session: context.session.id,
      error: {
        message: error.message,
        code: error.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'PROCESSING_ERROR',
      },
      status: 'error',
      tracing: context.tracing
    };
  }
}
```

#### Exemple d'intégration dans NestJS

```typescript
// Contrôleur MCP standard pour NestJS
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { MCPService } from './mcp.service';
import { MCPContext } from './types';

@Controller('mcp')
export class MCPController {
  constructor(private readonly mcpService: MCPService) {}

  @Post('process')
  async processRequest(@Body() rawContext: any): Promise<any> {
    try {
      // Valider et enrichir le contexte
      const context = await this.mcpService.processContext(rawContext);
      
      // Exécuter la requête
      const result = await this.mcpService.executeRequest(context);
      
      // Retourner la réponse formatée
      return this.mcpService.formatResponse(context, result);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new HttpException(
          this.mcpService.formatErrorResponse(rawContext, error),
          HttpStatus.BAD_REQUEST
        );
      }
      
      throw new HttpException(
        this.mcpService.formatErrorResponse(rawContext, error),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
```

### REST API - Implémentation standardisée

REST est notre standard pour les API publiques et les communications entre services. Toutes les API REST doivent suivre ces principes :

#### Principes fondamentaux REST

1. **Centrés sur les ressources** : Les endpoints doivent représenter des ressources, pas des actions
2. **Utilisation correcte des méthodes HTTP** : GET (lecture), POST (création), PUT (mise à jour complète), PATCH (mise à jour partielle), DELETE (suppression)
3. **Stateless** : Chaque requête contient toutes les informations nécessaires
4. **Utilisation des codes HTTP appropriés** : 200 (succès), 201 (créé), 400 (erreur client), 404 (non trouvé), 500 (erreur serveur), etc.
5. **Pagination standardisée** : Utiliser `limit` et `offset` ou `page` et `pageSize`
6. **Filtering, Sorting and Searching** : Paramètres de requête standardisés

#### Structure d'API REST standardisée

```typescript
// Contrôleur REST standardisé pour NestJS
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaginationDto, FilterDto } from '../common/dto';
import { JwtAuthGuard } from '../auth/guards';
import { Resource, ResourceDto } from './dto';

@ApiTags('resources')
@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les ressources' })
  @ApiResponse({ status: 200, description: 'Liste des ressources récupérée avec succès' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(@Query() paginationDto: PaginationDto, @Query() filterDto: FilterDto) {
    const { items, total } = await this.resourcesService.findAll(paginationDto, filterDto);
    
    return {
      items,
      meta: {
        total,
        page: paginationDto.page,
        pageSize: paginationDto.pageSize,
        pages: Math.ceil(total / paginationDto.pageSize)
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une ressource par ID' })
  @ApiResponse({ status: 200, description: 'Ressource récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Ressource non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la ressource' })
  async findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle ressource' })
  @ApiResponse({ status: 201, description: 'Ressource créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() createResourceDto: ResourceDto) {
    return this.resourcesService.create(createResourceDto);
  }
}
```

#### DTOs et Validation standardisés

```typescript
// DTOs et validation standardisés
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO de pagination standard
export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize: number = 20;
}

// DTO de filtrage standard
export class FilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortDirection?: 'asc' | 'desc' = 'asc';
}
```

#### Intercepteur de réponse standardisé

```typescript
// Intercepteur de réponse standardisé
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    
    return next.handle().pipe(
      map(data => {
        // Si nous avons déjà une structure standardisée (pagination, etc.), la préserver
        if (data && data.meta !== undefined && data.items !== undefined) {
          return {
            success: true,
            timestamp: new Date().toISOString(),
            duration: `${Date.now() - now}ms`,
            data: data.items,
            meta: data.meta,
          };
        }
        
        // Sinon, standardiser la réponse
        return {
          success: true,
          timestamp: new Date().toISOString(),
          duration: `${Date.now() - now}ms`,
          data,
        };
      }),
    );
  }
}
```

### GraphQL - Utilisation limitée

GraphQL doit être utilisé uniquement pour les interfaces qui nécessitent des requêtes complexes et flexibles, comme les tableaux de bord administratifs ou les cas où différents clients ont besoin de récupérer des données fortement personnalisées.

#### Configuration standardisée avec NestJS

```typescript
// Module GraphQL standardisé pour NestJS
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      context: ({ req }) => ({ req }),
      formatError: (error) => {
        const graphQLFormattedError = {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          path: error.path,
        };
        return graphQLFormattedError;
      },
    }),
  ],
})
export class AppModule {}
```

#### Modèles et Résolveurs standardisés

```typescript
// Modèles et résolveurs GraphQL standardisés
import { Field, ObjectType, ID, InputType, Int, ArgsType } from '@nestjs/graphql';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards';

// Modèle GraphQL standardisé
@ObjectType()
class Resource {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// Input pour la création
@InputType()
class CreateResourceInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}

// Args pour la pagination
@ArgsType()
class ResourceArgs {
  @Field(() => Int, { defaultValue: 0 })
  skip = 0;

  @Field(() => Int, { defaultValue: 25 })
  take = 25;

  @Field({ nullable: true })
  searchTerm?: string;
}

// Résolveur standardisé
@Resolver(() => Resource)
@UseGuards(GqlAuthGuard)
export class ResourcesResolver {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Query(() => [Resource])
  async resources(@Args() args: ResourceArgs) {
    return this.resourcesService.findAll(args);
  }

  @Query(() => Resource, { nullable: true })
  async resource(@Args('id', { type: () => ID }) id: string) {
    return this.resourcesService.findOne(id);
  }

  @Mutation(() => Resource)
  async createResource(
    @Args('input') createResourceInput: CreateResourceInput,
  ) {
    return this.resourcesService.create(createResourceInput);
  }
}
```

### gRPC - Pour communications internes

gRPC doit être utilisé pour les communications à haut débit entre services internes, particulièrement lorsque la performance est cruciale.

#### Configuration standardisée avec NestJS

```typescript
// Module gRPC standardisé pour NestJS
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RESOURCE_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'resource',
          protoPath: join(__dirname, './proto/resource.proto'),
          loader: {
            keepCase: true,
            enums: String,
            oneofs: true,
            defaults: true,
          },
          url: process.env.RESOURCE_SERVICE_URL || 'localhost:5000',
        },
      },
    ]),
  ],
  controllers: [ResourceController],
  providers: [ResourceService],
})
export class ResourceModule {}
```

#### Définition Proto standardisée

```protobuf
// resource.proto - Définition standardisée du service
syntax = "proto3";

package resource;

service ResourceService {
  rpc FindAll (ResourceFilter) returns (ResourceList);
  rpc FindOne (ResourceId) returns (Resource);
  rpc Create (CreateResourceRequest) returns (Resource);
  rpc Update (UpdateResourceRequest) returns (Resource);
  rpc Delete (ResourceId) returns (DeleteResourceResponse);
}

message ResourceFilter {
  int32 page = 1;
  int32 page_size = 2;
  string search_term = 3;
}

message ResourceList {
  repeated Resource items = 1;
  int32 total = 2;
}

message ResourceId {
  string id = 1;
}

message Resource {
  string id = 1;
  string name = 2;
  optional string description = 3;
  string created_at = 4;
  string updated_at = 5;
}

message CreateResourceRequest {
  string name = 1;
  optional string description = 2;
}

message UpdateResourceRequest {
  string id = 1;
  string name = 2;
  optional string description = 3;
}

message DeleteResourceResponse {
  bool success = 1;
}
```

### Documentation d'API standardisée (OpenAPI)

Toutes les API REST doivent être documentées avec OpenAPI (Swagger) selon ces standards :

#### Configuration Swagger NestJS

```typescript
// Configuration Swagger standardisée
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('API du Service de Ressources')
    .setDescription('API pour la gestion des ressources dans le système')
    .setVersion('1.0')
    .addTag('ressources')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
```

### Migration depuis les systèmes legacy

Pour migrer les API existantes vers ces standards :

1. **Phase 1 : Documentation** - Documenter les API existantes avec OpenAPI
2. **Phase 2 : Standardisation** - Adapter les contrôleurs et DTOs aux standards
3. **Phase 3 : Versioning** - Mettre en place un système de versioning d'API
4. **Phase 4 : Redirection** - Rediriger progressivement le trafic vers les nouvelles API

### Documentation de référence

Pour plus de détails sur l'implémentation des API standardisées, consultez :
- [Guide d'implémentation du Model Context Protocol](/docs/api/model-context-protocol.md)
- [Standards REST pour les API publiques](/docs/api/rest-api-standards.md)
- [Guide d'utilisation limité de GraphQL](/docs/api/graphql-usage-guidelines.md)
- [Configuration gRPC pour les services internes](/docs/api/grpc-internal-services.md)

## Validation et Typing

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **TypeScript** | **ADOPTER** | À utiliser pour tout nouveau code. |
| **Zod** | **ADOPTER** | Pour la validation de schémas complexes et la génération de types TypeScript. |
| **Typebox** | **ADOPTER** | Pour la validation JSON Schema et la génération de types TypeScript, parfait pour les API avec OpenAPI. |
| **class-validator** | **MAINTENIR** | Conserver pour le code existant avec NestJS, mais privilégier Zod ou Typebox pour les nouveaux développements. |
| **Joi** | **ÉLIMINER** | Remplacer par Zod ou Typebox. |
| **Ajv** | **LIMITER** | À utiliser uniquement pour les projets avec des contraintes de performance strictes. |

### Configuration standardisée pour Zod

Tous les projets utilisant Zod doivent suivre ces conventions :

```typescript
// schemas/user.schema.ts
import { z } from 'zod';
import { emailSchema, phoneNumberSchema } from './common.schemas';

// 1. Définir des schémas réutilisables
export const addressSchema = z.object({
  street: z.string().min(1).max(100),
  city: z.string().min(1).max(50),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string().min(1).max(50),
});

// 2. Composer des schémas plus complexes
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: emailSchema,
  phone: phoneNumberSchema.optional(),
  address: addressSchema,
  role: z.enum(['user', 'admin', 'support']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).strict(); // Interdire les propriétés supplémentaires

// 3. Exporter les types inférés
export type User = z.infer<typeof userSchema>;
export type Address = z.infer<typeof addressSchema>;
```

### Configuration standardisée pour Typebox

Pour les projets qui nécessitent des schémas JSON Schema (OpenAPI, FastAPI), utilisez Typebox avec cette configuration :

```typescript
// schemas/product.schema.ts
import { Type, TSchema, Static } from '@sinclair/typebox';

// 1. Définir des schémas réutilisables
export const priceSchema = Type.Object({
  amount: Type.Number({ minimum: 0 }),
  currency: Type.String({ enum: ['EUR', 'USD', 'GBP'] }),
});

// 2. Utiliser les annotations JSON Schema
export const productSchema = Type.Object({
  id: Type.Optional(Type.String({ format: 'uuid' })),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.String({ minLength: 1, maxLength: 1000 }),
  sku: Type.String({ pattern: '^[A-Z]{2}-\\d{6}$' }),
  price: priceSchema,
  category: Type.Array(
    Type.String(),
    { minItems: 1, maxItems: 5 }
  ),
  inStock: Type.Boolean(),
  tags: Type.Array(Type.String()),
  metadata: Type.Record(Type.String(), Type.Unknown()),
}, { additionalProperties: false });

// 3. Exporter les types statiques
export type Product = Static<typeof productSchema>;
export type Price = Static<typeof priceSchema>;

// 4. Intégration avec OpenAPI/Swagger
export const productApiSchema = {
  summary: 'Création d\'un produit',
  description: 'Crée un nouveau produit dans le catalogue',
  body: productSchema,
  response: {
    201: Type.Object({
      id: Type.String({ format: 'uuid' }),
      created: Type.Boolean(),
    })
  }
};
```

### Integration avec NestJS

Pour les projets NestJS, utilisez les schémas Zod ou Typebox avec les pipes de validation :

```typescript
// Avec Zod
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const UserDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Génération du DTO
export class CreateUserDto extends createZodDto(UserDto) {}

// Avec Typebox
import { Type } from '@sinclair/typebox';
import { TypeboxPipe } from 'nestjs-typebox';

const CreateOrderSchema = Type.Object({
  productIds: Type.Array(Type.String({ format: 'uuid' })),
  quantity: Type.Number({ minimum: 1 }),
  shippingAddress: Type.Object({/* ... */}),
});

@Post()
createOrder(@Body(new TypeboxPipe(CreateOrderSchema)) createOrderDto: Static<typeof CreateOrderSchema>) {
  // Corps du contrôleur
}
```

### Validation côté frontend (Remix/React)

Pour les validations frontend, utilisez Zod avec les bibliothèques d'intégration de formulaires :

```tsx
// Avec React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
  });
  
  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

### Migration depuis class-validator / Joi

Pour migrer progressivement votre base de code :

1. **Nouvelles entités** : Utiliser directement Zod ou Typebox
2. **Entités existantes** : Créer des wrappers de validation qui utilisent Zod/Typebox en interne
3. **Couche d'API** : Commencer par migrer la validation des entrées d'API

### Documentation de référence

Pour plus de détails sur l'implémentation de la validation de schémas, consultez :
- [Guide d'intégration Zod-Prisma](/docs/prisma-zod-integration.md)
- [Générateur de documentation OpenAPI avec Typebox](/docs/api/typebox-openapi.md)

## Testing

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Jest** | **ADOPTER** | Framework de test principal. |
| **Testing Library** | **ADOPTER** | Pour les tests frontend. |
| **Playwright** | **ADOPTER** | Pour les tests end-to-end. |
| **Mocha/Chai** | **ÉLIMINER** | Migrer vers Jest. |

## CI/CD et Gestion de Projet

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **NX** | **ADOPTER** | Framework principal pour la gestion du monorepo, l'exécution optimisée des builds/tests et la mise en cache intelligente des artefacts. |
| **GitHub Actions** | **ADOPTER** | Solution principale d'orchestration CI/CD pour l'automatisation des workflows de build, test et déploiement. |
| **Earthly** | **MAINTENIR** | Solution pour les builds reproductibles et déterministes. À utiliser pour les builds complexes nécessitant une isolation complète. |
| **GitLab CI** | **ÉLIMINER** | Migrer tous les workflows restants vers GitHub Actions pour standardiser notre approche CI/CD. |

### Configuration standardisée pour NX

Pour garantir des builds cohérents et optimisés, tous les projets doivent suivre cette configuration NX standard :

```json
// nx.json - Configuration standardisée
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint", "e2e"],
        "parallel": 3,
        "useDaemonProcess": true,
        "cacheDirectory": ".nx/cache"
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.config.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    },
    "e2e": {
      "inputs": ["default", "^production"],
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  },
  "affected": {
    "defaultBase": "main"
  },
  "plugins": ["@nx/eslint/plugin"]
}
```

### Structure de projet NX standardisée

Pour assurer une organisation cohérente, tous les projets NX doivent suivre la structure suivante :

```
├── apps/                    # Applications autonomes
│   ├── frontend/            # Application principale frontend
│   ├── backend/             # Application principale backend
│   └── admin-dashboard/     # Dashboard d'administration
├── packages/                # Bibliothèques partagées
│   ├── ui/                  # Composants UI réutilisables
│   ├── business/            # Logique métier partagée
│   ├── models/              # Modèles de données partagés
│   └── utils/               # Utilitaires partagés
├── tools/                   # Outils et scripts de build
│   ├── generators/          # Générateurs personnalisés
│   └── scripts/             # Scripts d'automatisation
├── .github/                 # Configuration GitHub Actions
├── nx.json                  # Configuration NX
├── package.json             # Configuration de package principale
└── tsconfig.base.json       # Configuration TypeScript de base
```

### Générateurs NX standardisés

Pour accélérer le développement et maintenir la cohérence, utilisez ces générateurs NX standardisés :

```bash
# Créer une nouvelle application React
nx g @nx/react:application --name=frontend --routing --style=scss --e2e-test-runner=playwright

# Créer une nouvelle application NestJS
nx g @nx/nest:application --name=api

# Créer une bibliothèque de composants UI
nx g @nx/react:library --name=ui --buildable --publishable --importPath=@myorg/ui

# Créer une bibliothèque d'utilitaires
nx g @nx/js:library --name=utils --buildable --publishable --importPath=@myorg/utils
```

### Commandes NX standardisées

Standardisez l'utilisation de NX avec ces commandes de base :

```bash
# Démarrer le développement local
nx serve frontend
nx serve backend

# Construire pour la production
nx build frontend --prod
nx build backend --prod

# Exécuter les tests
nx test frontend
nx test backend

# Construire uniquement ce qui a changé depuis la dernière version
nx affected:build --base=main
nx affected:test --base=main

# Analyser le graphe de dépendances
nx graph
```

### Intégration avec GitHub Actions

Pour optimiser les builds CI avec NX, utilisez ce modèle de workflow GitHub Actions :

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
        with:
  }

  async _call(query: string): Promise<string> {
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: { q: query, count: 5 },
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': this.apiKey }
      });
      
      return response.data.results
        .map((r: any) => `[${r.title}] ${r.description} (Source: ${r.url})`)
        .join('\n\n');
    } catch (error) {
      return `Erreur lors de la recherche: ${error.message}`;
    }
  }
}
```

### Configuration standardisée pour WasmEdge

Pour les projets utilisant WasmEdge comme runtime WASM haute performance, suivez cette configuration standardisée :

```typescript
// Configuration WasmEdge standardisée
import { VM, Config, Module } from 'wasmedge-binding';
import * as fs from 'fs';
import * as path from 'path';

// Configuration standard pour différents types d'agents
const AGENT_PROFILES = {
  // Pour les agents standards avec temps d'exécution court
  standard: {
    memoryPages: 100,         // 6.4 Mo de mémoire (100 * 64KB)
    maxThreads: 1,
    jitOptimization: true,
    aot: false,
    timeoutMs: 5000
  },
  // Pour les agents intensifs en calcul
  compute: {
    memoryPages: 1000,        // 64 Mo de mémoire
    maxThreads: 4,
    jitOptimization: true,
    aot: true,                // Compilation Ahead-of-Time pour performances maximales
    timeoutMs: 30000
  },
  // Pour les agents de traitement ML
  ml: {
    memoryPages: 3200,        // 200 Mo de mémoire
    maxThreads: 8,
    jitOptimization: true,
    aot: true,
    timeoutMs: 60000,
    extensions: ['wasi:nn']   // Extension Neural Network pour ML
  }
};

// Création d'une VM WasmEdge configurée
export function createWasmEdgeVM(
  profileType: keyof typeof AGENT_PROFILES,
  customOptions = {}
) {
  const profile = { ...AGENT_PROFILES[profileType], ...customOptions };
  
  // Configuration de la VM
  const config = new Config();
  
  // Activer WASI
  config.addHostRegistration(Config.HostRegistration.Wasi);
  
  // Configurer l'optimisation JIT si supportée
  if (profile.jitOptimization && Config.hasJITSupport) {
    config.addCompilerSetting(Config.CompilerSetting.EnableJIT);
  }
  
  // Configurer les extensions
  if (profile.extensions) {
    for (const extension of profile.extensions) {
      config.addHostRegistration(extension);
    }
  }
  
  // Créer la VM avec la configuration
  const vm = new VM(config);
  
  return {
    vm,
    profile,
    
    // Charger un module WASM depuis un fichier
    async loadModule(wasmPath: string): Promise<Module> {
      // Précompiler le module pour AOT si demandé
      if (profile.aot && Config.hasCompilerSupport) {
        const wasmName = path.basename(wasmPath);
        const aotPath = path.join(os.tmpdir(), `${wasmName}.aot`);
        
        // Vérifier si un module AOT existe déjà
        if (!fs.existsSync(aotPath)) {
          console.log(`[WasmEdge] Précompilation AOT du module: ${wasmName}`);
          await Config.compileFromFile(wasmPath, aotPath);
        }
        
        // Charger le module AOT
        return Module.fromFile(aotPath);
      }
      
      // Charger le module standard
      return Module.fromFile(wasmPath);
    },
    
    // Exécuter une fonction dans le module avec timeout
    async executeFunction(
      module: Module,
      funcName: string,
      args: any[] = []
    ): Promise<any> {
      // Ajouter le module à l'instance VM
      vm.registerModule(module);
      
      // Créer une promesse avec timeout
      return Promise.race([
        vm.execute(funcName, ...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WasmEdge execution timeout')), 
          profile.timeoutMs)
        )
      ]);
    },
    
    // Libérer les ressources
    cleanup() {
      vm.cleanup();
    }
  };
}

// Fonction utilitaire pour exécuter un agent WASM
export async function runWasmAgent(
  wasmPath: string,
  input: object,
  profileType: keyof typeof AGENT_PROFILES = 'standard'
) {
  const runner = createWasmEdgeVM(profileType);
  
  try {
    // Charger le module WASM
    const module = await runner.loadModule(wasmPath);
    
    // Convertir l'entrée en format JSON
    const inputJson = JSON.stringify(input);
    
    // Exécuter la fonction d'agent
    const resultJson = await runner.executeFunction(module, 'run', [inputJson]);
    
    // Analyser et retourner le résultat
    return JSON.parse(resultJson);
  } finally {
    // Nettoyer les ressources
    runner.cleanup();
  }
}
```

### Intégration de WasmEdge avec notre framework MCP

Pour intégrer WasmEdge avec l'architecture MCP existante :

```typescript
// integration/wasmedge-mcp-adapter.ts
import { WasmAgentContract, AgentContext } from '@/packages/mcp-wasm-runtime';
import { runWasmAgent } from './wasmedge-config';

export class WasmEdgeAdapter implements WasmAgentContract {
  constructor(
    private wasmPath: string,
    private profileType: 'standard' | 'compute' | 'ml' = 'standard'
  ) {}

  async initialize(): Promise<void> {
    // Vérifier que l'agent WASM existe et est valide
    // Cette étape peut précharger le module pour validation
    const testResult = await runWasmAgent(
      this.wasmPath, 
      { action: 'healthcheck' }, 
      this.profileType
    );
    
    if (!testResult?.success) {
      throw new Error(`Échec de l'initialisation de l'agent WasmEdge: ${this.wasmPath}`);
    }
  }

  async execute(contextJson: string): Promise<string> {
    const context = JSON.parse(contextJson);
    
    // Tracker les métriques de performance
    const startTime = Date.now();
    
    try {
      // Exécuter l'agent via WasmEdge
      const result = await runWasmAgent(this.wasmPath, context, this.profileType);
      
      // Ajouter les métriques
      result.metrics = {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        runtime: 'wasmedge'
      };
      
      return JSON.stringify(result);
    } catch (error) {
      // Gérer les erreurs
      const errorResult = {
        success: false,
        error: error.message,
        metrics: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          runtime: 'wasmedge'
        }
      };
      
      return JSON.stringify(errorResult);
    }
  }

  async validate(contextJson: string): Promise<boolean> {
    try {
      const context = JSON.parse(contextJson);
      const result = await runWasmAgent(
        this.wasmPath, 
        { ...context, action: 'validate' },
        this.profileType
      );
      return !!result?.valid;
    } catch (error) {
      return false;
    }
  }

  getMetadata(): string {
    // Pour simplifier, récupérer les métadonnées via une exécution
    return runWasmAgent(
      this.wasmPath, 
      { action: 'metadata' },
      'standard'  // Utiliser un profil léger pour la récupération des métadonnées
    ).then(result => JSON.stringify(result?.metadata || {}))
    .catch(() => JSON.stringify({}));
  }
}
```

### Benchmarking et sélection automatique du moteur WASM

Pour sélectionner automatiquement le moteur WASM le plus adapté (WasmEdge vs standard) :

```typescript
// utils/wasm-engine-selector.ts
import { AgentContext } from '@/packages/mcp-wasm-runtime';
import { WasmAgentLoader } from '@/packages/mcp-wasm-runtime';
import { WasmEdgeAdapter } from '../integration/wasmedge-mcp-adapter';

// Profils d'agents pour déterminer le meilleur moteur
const AGENT_ENGINE_PROFILES = {
  // Agents nécessitant les meilleures performances
  'code-transformation': {
    preferredEngine: 'wasmedge',
    profileType: 'compute'
  },
  'vector-similarity': {
    preferredEngine: 'wasmedge',
    profileType: 'ml'
  },
  // Agents standards
  'text-processing': {
    preferredEngine: 'standard',
    profileType: 'standard'
  }
};

export async function getOptimalWasmEngine(
  agentType: string,
  wasmPath: string
) {
  // Récupérer le profil ou utiliser un profil par défaut
  const profile = AGENT_ENGINE_PROFILES[agentType] || {
    preferredEngine: 'standard',
    profileType: 'standard'
  };
  
  // Si WasmEdge est préféré, essayer de l'utiliser d'abord
  if (profile.preferredEngine === 'wasmedge') {
    try {
      const adapter = new WasmEdgeAdapter(wasmPath, profile.profileType);
      await adapter.initialize();
      return adapter;
    } catch (error) {
      console.warn(`WasmEdge non disponible, utilisation du moteur standard: ${error.message}`);
    }
  }
  
  // Fallback au moteur WASM standard
  const standardLoader = new WasmAgentLoader(wasmPath);
  await standardLoader.initialize();
  return standardLoader;
}
```

Cette configuration vous permettra d'exécuter efficacement des agents WASM en utilisant WasmEdge pour les cas nécessitant des performances élevées, tout en conservant la compatibilité avec l'architecture MCP existante.

### Architecture standardisée pour les agents personnalisés

Tous les agents personnalisés doivent implémenter l'architecture MCP avec ces principes :

1. **Séparation des responsabilités** :
   - `ModelProvider` : Interface avec le LLM (Ollama, DeepSeek, etc.)
   - `ToolProvider` : Outils à disposition de l'agent (incluant BraveSearchTool)
   - `AgentExecutor` : Orchestration du comportement de l'agent
   
2. **Observabilité intégrée** :
   - Journalisation structurée des prompts et réponses
   - Traçabilité des étapes d'exécution
   - Métriques standardisées (latence, consommation de tokens, etc.)

3. **Gestion de contexte efficace** :
   - Utilisation de vectorisation locale via FAISS
   - Stratégies de fenêtrage de contexte pour les documents volumineux
   - Compression sémantique avec des modèles locaux

### Documentation de référence

Pour plus de détails sur l'implémentation des agents IA, consultez :
- [Guide d'implémentation des agents MCP](/docs/agents/guide-implementation-mcp.md)
- [Best practices pour Ollama](/docs/agents/ollama-best-practices.md)
- [Tutoriel d'intégration Brave Search](/docs/agents/brave-search-integration.md)

## Logging et Monitoring

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **OpenTelemetry** | **ADOPTER** | Pour la télémétrie et le tracing distribué. |
| **Prometheus** | **ADOPTER** | Pour les métriques. |
| **Grafana** | **ADOPTER** | Pour la visualisation des métriques et logs. |
| **Winston** | **MAINTENIR** | Logger standard pour les applications Node.js. |

## Méthodologie d'évaluation des technologies

Pour chaque technologie, nous utilisons la classification suivante:

- **ADOPTER** : Technologie standard à utiliser pour tous les nouveaux développements.
- **CONSERVER** : Technologie acceptable qui peut continuer à être utilisée.
- **MAINTENIR** : Technologie à conserver pour le code existant mais à ne pas utiliser pour les nouveaux développements.
- **LIMITER** : Technologie à utiliser uniquement dans des cas spécifiques et justifiés.
- **DÉPRÉCIER** : Technologie en cours d'élimination, à remplacer progressivement.
- **ÉLIMINER** : Technologie à remplacer en priorité car obsolète ou problématique.
- **STANDARDISER** : Technologie à conserver mais dont l'implémentation doit être standardisée.

## Processus de révision

Ce document sera révisé trimestriellement pour s'assurer que les choix technologiques restent pertinents et alignés avec les besoins du projet et les évolutions du secteur.

## Dérogations

Toute dérogation à ces standards doit être justifiée et approuvée par le comité technique. Les demandes de dérogation doivent être soumises via le formulaire de dérogation technologique disponible dans l'espace documentation.

## Conteneurisation et Infrastructure as Code

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Docker** | **ADOPTER** | Standard pour la conteneurisation de toutes les applications et services. |
| **Docker Compose** | **ADOPTER** | Pour les environnements de développement et les déploiements simples. |
| **GitHub Actions** | **ADOPTER** | Pour l'automatisation du CI/CD et de l'infrastructure. |
| **Pulumi** | **ADOPTER** | Gestion d'infrastructure déclarative avec support TypeScript/JavaScript natif. |
| **Kubernetes** | **ÉVALUER** | À considérer uniquement pour les cas d'utilisation avancés nécessitant une orchestration complexe. |
| **Terraform** | **MAINTENIR** | À conserver pour les projets existants mais privilégier Pulumi pour les nouveaux développements. |
| **Ansible** | **ÉLIMINER** | Remplacer par des solutions déclaratives pour l'approvisionnement et la configuration. |

### Configuration standardisée pour Docker

Tous les projets doivent suivre ces directives de conteneurisation :

```dockerfile
# Dockerfile standard multi-stage
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Installation des dépendances avec mise en cache optimisée
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && \
    pnpm install --frozen-lockfile

# Copie du code source
COPY . .

# Build du projet
RUN pnpm nx build ${APP_NAME} --prod

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app

# Copie des fichiers nécessaires uniquement
COPY --from=builder /app/dist/${APP_NAME} ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Configuration runtime
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Utilisateur non-privilégié pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs
USER nodejs

CMD ["node", "main.js"]
```

### Structure de docker-compose standardisée

Pour assurer une configuration cohérente des environnements, les fichiers docker-compose doivent adopter cette structure :

```yaml
version: '3.8'

services:
  # Service d'application principal
  app:
    build:
      context: .
      dockerfile: docker/contexts/api/Dockerfile
      args:
        - APP_NAME=api
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app_db
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:8080"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./:/app
      - node_modules:/app/node_modules
    networks:
      - app-network
    restart: unless-stopped

  # Base de données
  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - app-network
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  postgres-data:
  redis-data:
  node_modules:

networks:
  app-network:
    driver: bridge
```

### Intégration CI/CD avec GitHub Actions

L'intégration continue et le déploiement continu doivent suivre ce modèle de workflow :

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Cache Docker layers
        uses: actions/cache@v3
        with:
          path: /tmp/.buildx-cache
          key: ${{ runner.os }}-buildx-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-buildx-
      
      - name: Build and cache Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: false
          load: true
          tags: app:test
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new,mode=max
          build-args: |
            APP_NAME=api
      
      - name: Move cache
        run: |
          rm -rf /tmp/.buildx-cache
          mv /tmp/.buildx-cache-new /tmp/.buildx-cache

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Docker Compose
        run: docker-compose -f docker-compose.ci.yml up -d
      
      - name: Run tests
        run: docker-compose -f docker-compose.ci.yml exec -T app pnpm test
      
      - name: Stop Docker Compose
        run: docker-compose -f docker-compose.ci.yml down

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to environment
        run: |
          echo "Deploying to production"
          # Commandes de déploiement
```

### Organisation des configurations par environnement

Pour gérer efficacement les différentes configurations d'environnement :

1. **Environnements de base** :
   - `docker-compose.yml` - Configuration de base
   - `docker-compose.override.yml` - Overrides de développement local (non commité)

2. **Environnements spécifiques** :
   - `docker-compose.dev.yml` - Environnement de développement
   - `docker-compose.ci.yml` - Environnement CI/CD
   - `docker-compose.staging.yml` - Environnement de staging
   - `docker-compose.prod.yml` - Environnement de production

3. **Services spécifiques** :
   - `docker-compose.monitoring.yml` - Services de monitoring (Prometheus, Grafana)
   - `docker-compose.mcp.yml` - Services MCP (Model Context Protocol)

### Standards de sécurité pour les conteneurs

Appliquez systématiquement ces pratiques de sécurité :

1. **Images de base minimales** : Privilégier les images Alpine ou Distroless
2. **Utilisateurs non-root** : Toujours exécuter avec un utilisateur limité
3. **Scan de vulnérabilités** : Utiliser Trivy ou Docker Scout dans le pipeline CI
4. **Secrets sécurisés** : Ne jamais inclure de secrets dans les images (utiliser les secrets GitHub Actions)
5. **Principe du moindre privilège** : Limiter les capabilities et accès réseau

### Monitoring des conteneurs

Implémenter une solution de monitoring standardisée avec :

1. **Prometheus** : Pour la collecte des métriques
2. **Grafana** : Pour la visualisation des métriques
3. **OpenTelemetry** : Pour le tracing distribué
4. **Loki** : Pour l'agrégation des logs

### Documentation de référence

Pour plus de détails sur la mise en œuvre de ces standards, consultez les documents suivants :
- [Guide Docker pour environnements multi-étages](/docs/docker-multistage-environments.md)
- [Bonnes pratiques de sécurité Docker](/docs/docker-security-best-practices.md)
- [Intégration Docker avec GitHub Actions](/docs/docker-github-actions-integration.md)

## Observabilité IA

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **LangSmith** | **ADOPTER** | Plateforme principale pour le traçage, le débogage et l'évaluation des applications LLM basées sur LangChain. |
| **Honeycomb** | **ADOPTER** | Pour l'observabilité distribuée avancée sur l'ensemble des interactions avec les modèles d'IA. |
| **OpenTelemetry** | **ADOPTER** | Pour l'instrumentation standardisée et le tracing distribué des agents IA. |
| **Langfuse** | **MAINTENIR** | Pour les projets existants, mais privilégier LangSmith pour les nouveaux développements. |
| **Prometheus/Grafana** | **ADOPTER** | Pour les métriques système et la visualisation des performances des agents IA. |
| **Services MCP Tracing** | **STANDARDISER** | Standardiser l'implémentation des services de traçabilité personnalisés. |

### Configuration standardisée pour LangSmith

Pour assurer une observabilité complète des chaînes LangChain, tous les projets doivent intégrer LangSmith avec cette configuration:

```typescript
// Configuration LangSmith standardisée
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";

// Configuration centralisée
export const initLangSmith = (options: {
  projectName: string;
  apiKey?: string;
  traceLevel?: 'simple' | 'detailed' | 'everything';
}) => {
  // Utiliser les clés d'API depuis l'environnement ou les paramètres
  const apiKey = options.apiKey || process.env.LANGSMITH_API_KEY;
  
  if (!apiKey) {
    console.warn('LANGSMITH_API_KEY non définie, observabilité limitée');
    return null;
  }
  
  // Initialisation du client LangSmith
  const client = new Client({
    apiKey,
    apiUrl: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
  });
  
  // Créer le traceur
  const tracer = new LangChainTracer({
    projectName: options.projectName,
    client,
  });

  // Configuration du niveau de détail du traçage
  const detailLevel = options.traceLevel || 'detailed';
  switch (detailLevel) {
    case 'simple':
      // Tracer uniquement les entrées/sorties principales
      tracer.config = { includeRunInfo: false, includeIntermediateSteps: false };
      break;
    case 'everything':
      // Tracer tous les détails, y compris les embeddings et les tokens
      tracer.config = { 
        includeRunInfo: true, 
        includeIntermediateSteps: true,
        includeEmbeddings: true,
        trackTokenCounts: true
      };
      break;
    case 'detailed':
    default:
      // Tracer les étapes intermédiaires mais pas les embeddings
      tracer.config = { 
        includeRunInfo: true, 
        includeIntermediateSteps: true,
        includeEmbeddings: false
      };
  }

  return tracer;
};

// Middleware d'évaluation automatique des réponses
export const createEvaluationMiddleware = (
  client: Client,
  evaluationCriteria: Array<'relevance' | 'accuracy' | 'helpfulness' | 'toxicity' | 'custom'>,
  customEvalFunctions?: Record<string, (input: any, output: any) => Promise<number>>
) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    // Capture les données avant l'envoi de la réponse
    const reqData = req.body;
    let resData: any;
    
    res.send = function(body) {
      // Stocker la réponse pour évaluation
      resData = JSON.parse(body);
      
      // Soumettre pour évaluation async (ne pas bloquer la réponse)
      Promise.resolve().then(async () => {
        try {
          // Évaluer selon les critères demandés
          for (const criterion of evaluationCriteria) {
            if (criterion === 'custom' && customEvalFunctions) {
              // Exécuter les fonctions d'évaluation personnalisées
              for (const [name, evalFn] of Object.entries(customEvalFunctions)) {
                const score = await evalFn(reqData, resData);
                await client.createRunEvaluation({
                  runId: resData.runId,
                  evaluationName: name,
                  score,
                  comment: `Score d'évaluation ${name}: ${score}`
                });
              }
            } else {
              // Utiliser les évaluateurs intégrés de LangSmith
              await client.evaluateRun({
                runId: resData.runId,
                evaluationName: criterion
              });
            }
          }
        } catch (error) {
          console.error('Erreur lors de l'évaluation LangSmith:', error);
        }
      });
      
      // Continuer avec l'envoi normal de la réponse
      return originalSend.call(this, body);
    };
    
    next();
  };
};
```

### Configuration standardisée pour Honeycomb

Pour l'observabilité distribuée avancée, intégrez Honeycomb avec cette configuration standard :

```typescript
// Configuration standardisée pour Honeycomb
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { 
  ConsoleSpanExporter, 
  SimpleSpanProcessor,
  BatchSpanProcessor 
} from '@opentelemetry/sdk-trace-node';

export const initHoneycombTracing = ({
  serviceName,
  serviceVersion = '1.0.0',
  apiKey = process.env.HONEYCOMB_API_KEY,
  dataset = process.env.HONEYCOMB_DATASET || 'mcp-agents',
  environment = process.env.NODE_ENV || 'development',
  debug = process.env.NODE_ENV !== 'production'
}) => {
  if (!apiKey) {
    console.warn('HONEYCOMB_API_KEY non définie, observabilité limitée');
    return null;
  }
  
  // Configurer l'exportateur Honeycomb
  const traceExporter = new OTLPTraceExporter({
    url: 'https://api.honeycomb.io/v1/traces',
    headers: {
      'x-honeycomb-team': apiKey,
      'x-honeycomb-dataset': dataset
    },
  });

  // Configurer l'exportateur de métriques Honeycomb
  const metricExporter = new OTLPMetricExporter({
    url: 'https://api.honeycomb.io/v1/metrics',
    headers: {
      'x-honeycomb-team': apiKey,
      'x-honeycomb-dataset': dataset
    },
  });

  // Définir les attributs de base qui seront attachés à toutes les spans
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      'deployment.environment': environment,
      'mcp.agent_platform': 'nodejs',
    })
  );

  // Configurer le SDK
  const sdk = new NodeSDK({
    resource,
    spanProcessors: [
      // En mode debug, ajouter un processeur de console pour voir les spans immédiatement
      ...(debug ? [new SimpleSpanProcessor(new ConsoleSpanExporter())] : []),
      // Toujours utiliser le processeur par lot pour l'envoi à Honeycomb
      new BatchSpanProcessor(traceExporter),
    ],
    metricReader: metricExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Activer le tracing automatique pour les frameworks et bibliothèques courantes
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-fastify': { enabled: true },
        '@opentelemetry/instrumentation-nestjs-core': { enabled: true },
        '@opentelemetry/instrumentation-graphql': { enabled: true },
        '@opentelemetry/instrumentation-mongodb': { enabled: true },
        '@opentelemetry/instrumentation-redis': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
      }),
    ],
  });

  // Démarrer le SDK
  sdk.start();

  return {
    sdk,
    shutdown: () => sdk.shutdown(),
    addCustomAttributes: (spanName: string, attributes: Record<string, any>) => {
      // Helper pour ajouter des attributs personnalisés aux spans existantes
    }
  };
};
```

### Intégration MCP standardisée

Pour intégrer l'observabilité à notre architecture MCP :

```typescript
// Configuration standardisée pour le tracing MCP
import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { initHoneycombTracing } from './honeycomb-config';
import { initLangSmith } from './langsmith-config';

// Niveaux d'observabilité
const OBSERVABILITY_LEVELS = {
  BASIC: 'basic',       // Uniquement les entrées/sorties principales
  STANDARD: 'standard', // Inclut étapes intermédiaires et métriques clés
  DETAILED: 'detailed', // Traçage détaillé pour débogage
  FULL: 'full'          // Tracing complet avec tokens, embeddings, etc.
};

// Tags standards à appliquer à tous les agents
const standardAgentTags = {
  'mcp.version': '2.0',
  'mcp.protocol': 'standard'
};

// Type général pour un agent MCP
interface MCPAgent {
  id: string;
  name: string;
  category: string;
  version?: string;
}

export class MCPObservability {
  private langSmith;
  private honeycomb;
  private serviceInfo;
  private level;
  
  constructor({
    serviceName,
    serviceVersion = '1.0.0',
    observabilityLevel = OBSERVABILITY_LEVELS.STANDARD,
    honeycombConfig = {},
    langSmithConfig = {}
  }) {
    this.serviceInfo = {
      name: serviceName,
      version: serviceVersion
    };
    
    this.level = observabilityLevel;
    
    // Initialiser Honeycomb pour le tracing général
    this.honeycomb = initHoneycombTracing({
      serviceName,
      serviceVersion,
      ...honeycombConfig
    });
    
    // Initialiser LangSmith pour le tracing LLM
    this.langSmith = initLangSmith({
      projectName: serviceName,
      traceLevel: this.mapObservabilityToLangSmith(observabilityLevel),
      ...langSmithConfig
    });
  }
  
  // Convertir notre niveau d'observabilité au niveau LangSmith
  private mapObservabilityToLangSmith(level) {
    switch(level) {
      case OBSERVABILITY_LEVELS.BASIC: return 'simple';
      case OBSERVABILITY_LEVELS.FULL: return 'everything';
      default: return 'detailed';
    }
  }

  // Tracer l'exécution complète d'un agent
  async traceAgentExecution<T>(
    agent: MCPAgent,
    input: any,
    executionFn: (span: any) => Promise<T>
  ): Promise<T> {
    const tracer = trace.getTracer(this.serviceInfo.name);
    
    return tracer.startActiveSpan(
      `Agent:${agent.name}`,
      { kind: SpanKind.INTERNAL },
      async (span) => {
        try {
          // Ajouter les attributs communs
          span.setAttributes({
            'agent.id': agent.id,
            'agent.name': agent.name,
            'agent.category': agent.category,
            'agent.version': agent.version || '1.0.0',
            ...standardAgentTags
          });
          
          if (this.level !== OBSERVABILITY_LEVELS.BASIC) {
            span.setAttributes({
              'input.type': typeof input,
              'input.size': JSON.stringify(input).length
            });
            
            // Ajouter l'entrée complète si niveau détaillé
            if (this.level === OBSERVABILITY_LEVELS.DETAILED || 
                this.level === OBSERVABILITY_LEVELS.FULL) {
              span.setAttributes({
                'input.content': typeof input === 'string' ? input : JSON.stringify(input)
              });
            }
          }
          
          // Générer un contexte pour LangSmith si disponible
          const callbacks = this.langSmith ? [this.langSmith] : [];
          
          // Exécuter la fonction avec le contexte de trace
          const result = await executionFn({
            span,
            callbacks,
            addEvent: (name, attributes) => span.addEvent(name, attributes)
          });
          
          // Ajouter des attributs sur le résultat
          if (this.level !== OBSERVABILITY_LEVELS.BASIC) {
            span.setAttributes({
              'result.type': typeof result,
              'result.size': JSON.stringify(result).length,
              'execution.success': true
            });
            
            // Ajouter le résultat complet si niveau détaillé
            if (this.level === OBSERVABILITY_LEVELS.DETAILED || 
                this.level === OBSERVABILITY_LEVELS.FULL) {
              span.setAttributes({
                'result.content': typeof result === 'string' ? result : JSON.stringify(result)
              });
            }
          }
          
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          // Gestion des erreurs
          span.setAttributes({
            'execution.success': false,
            'error.type': error.name,
            'error.message': error.message
          });
          
          if (this.level !== OBSERVABILITY_LEVELS.BASIC) {
            span.setAttributes({
              'error.stack': error.stack
            });
          }
          
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          });
          
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }
  
  // Tracer les interactions avec les LLMs
  async traceLLMInteraction<T>(
    agent: MCPAgent,
    modelName: string,
    prompt: string,
    executionFn: (callbacks: any[]) => Promise<T>
  ): Promise<T> {
    const tracer = trace.getTracer(this.serviceInfo.name);
    
    return tracer.startActiveSpan(
      `LLM:${modelName}`,
      { kind: SpanKind.CLIENT },
      async (span) => {
        try {
          // Ajouter les attributs communs
          span.setAttributes({
            'agent.id': agent.id,
            'agent.name': agent.name,
            'llm.model': modelName,
            'llm.provider': this.getLLMProvider(modelName),
            ...standardAgentTags
          });
          
          if (this.level !== OBSERVABILITY_LEVELS.BASIC) {
            span.setAttributes({
              'prompt.size': prompt.length,
              'prompt.tokens_estimate': this.estimateTokens(prompt)
            });
            
            // Ajouter le prompt complet si niveau détaillé
            if (this.level === OBSERVABILITY_LEVELS.DETAILED || 
                this.level === OBSERVABILITY_LEVELS.FULL) {
              span.setAttributes({
                'prompt.content': prompt.substring(0, 1000) // Limiter la taille
              });
            }
          }
          
          // Générer les callbacks 
          const callbacks = this.langSmith ? [this.langSmith] : [];
          
          // Ajouter un callback pour capturer la réponse
          const responseCapturingCallback = {
            handleLLMEnd: (output) => {
              const response = output.generations[0][0].text;
              
              if (this.level !== OBSERVABILITY_LEVELS.BASIC) {
                span.setAttributes({
                  'response.size': response.length,
                  'response.tokens_estimate': this.estimateTokens(response)
                });
                
                // Ajouter la réponse complète si niveau détaillé
                if (this.level === OBSERVABILITY_LEVELS.DETAILED ||
                    this.level === OBSERVABILITY_LEVELS.FULL) {
                  span.setAttributes({
                    'response.content': response.substring(0, 1000) // Limiter la taille
                  });
                }
              }
            }
          };
          
          callbacks.push(responseCapturingCallback);
          
          // Exécuter l'appel LLM avec les callbacks
          const result = await executionFn(callbacks);
          
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          // Gestion des erreurs
          span.setAttributes({
            'error.type': error.name,
            'error.message': error.message
          });
          
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          });
          
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }
  
  private getLLMProvider(modelName: string): string {
    if (modelName.includes('gpt')) return 'openai';
    if (modelName.includes('llama') || modelName.includes('mistral')) return 'ollama';
    if (modelName.includes('claude')) return 'anthropic';
    return 'unknown';
  }
  
  private estimateTokens(text: string): number {
    // Estimation très approximative : ~4 caractères par token en moyenne
    return Math.ceil(text.length / 4);
  }
  
  // Nettoyage et finalisation
  async shutdown() {
    if (this.honeycomb?.shutdown) {
      await this.honeycomb.shutdown();
    }
  }
}

// Fonction d'utilitaire pour initialiser rapidement l'observabilité
export const setupMCPObservability = (config) => {
  return new MCPObservability(config);
};
```

### Visualisation des données d'observabilité

Pour standardiser l'utilisation des dashboards avec Honeycomb et LangSmith :

1. **Dashboard Honeycomb standardisés** :
   - Dashboard de santé des agents (latence, taux d'erreur, répartition par type)
   - Dashboard de performance LLM (temps de réponse, tokens, coûts estimés)
   - Dashboard de qualité (taux de succès des tâches, évaluations)

2. **Intégration dans l'interface MCP** :
   - Intégrer les liens directs vers les traces LangSmith et Honeycomb
   - Afficher les métriques clés dans le tableau de bord de l'agent
   - Contextualiser les erreurs avec les traces correspondantes

### Évaluation standardisée de la qualité des sorties IA

```typescript
// Configuration pour l'évaluation standardisée des sorties IA
import { Client } from "langsmith";

// Critères d'évaluation standards
export const EVALUATION_CRITERIA = {
  RELEVANCE: 'relevance',     // Pertinence de la réponse par rapport à la requête
  CORRECTNESS: 'correctness', // Exactitude factuelle
  HELPFULNESS: 'helpfulness', // Utilité pour l'utilisateur
  TOXICITY: 'toxicity',       // Absence de contenu inapproprié
  COHERENCE: 'coherence',     // Cohérence logique et clarté
  FORMAT: 'format'            // Respect du format demandé
};

// Configuration standardisée pour l'évaluation des agents
export const setupEvaluationPipeline = async ({
  projectName,
  apiKey = process.env.LANGSMITH_API_KEY,
  evaluationDataset = process.env.LANGSMITH_EVAL_DATASET,
  evaluationLLM = 'gpt-4', // Modèle d'évaluation par défaut
  evaluationCriteria = [
    EVALUATION_CRITERIA.RELEVANCE,
    EVALUATION_CRITERIA.CORRECTNESS,
    EVALUATION_CRITERIA.HELPFULNESS
  ]
}) => {
  if (!apiKey) {
    console.warn('LANGSMITH_API_KEY non définie, évaluation limitée');
    return null;

  // Initialiser le client LangSmith
  const client = new Client({ apiKey });
  
  // Vérifier l'existence du dataset d'évaluation ou en créer un
  let datasetId = evaluationDataset;
  if (!datasetId) {
    const dataset = await client.createDataset({
      name: `${projectName}-eval-dataset`,
      description: `Dataset d'évaluation pour ${projectName}`
    });
    datasetId = dataset.id;
  }
  
  // Créer l'évaluateur pour chaque critère
  const evaluators = {};
  
  for (const criterion of evaluationCriteria) {
    evaluators[criterion] = await client.createEvaluator({
      name: `${criterion}-evaluator`,
      evaluationModel: evaluationLLM
    });
  }
  
  return {
    client,
    datasetId,
    evaluators,
    
    // Ajouter un exemple au dataset d'évaluation
    async addEvaluationExample(input, expectedOutput, metadata = {}) {
      return client.createExample({
        inputs: { input },
        outputs: { expected: expectedOutput },
        dataset_id: datasetId,
        metadata
      });
    },
    
    // Évaluer un run contre les critères standards
    async evaluateRun(runId, customCriteria = {}) {
      const results = {};
      
      for (const [criterion, evaluator] of Object.entries(evaluators)) {
        try {
          const evaluation = await client.evaluateRun({
            runId,
            evaluatorId: evaluator.id
          });
          
          results[criterion] = {
            score: evaluation.score,
            feedback: evaluation.feedback
          };
        } catch (error) {
          console.error(`Erreur lors de l'évaluation ${criterion}:`, error);
        }
      }
      
      // Ajouter les évaluations personnalisées
      for (const [name, evalFn] of Object.entries(customCriteria)) {
        try {
          // Récupérer les données du run
          const run = await client.getRun(runId);
          const score = await evalFn(run.inputs, run.outputs);
          
          await client.createRunEvaluation({
            runId,
            evaluationName: name,
            score,
          });
          
          results[name] = { score };
        } catch (error) {
          console.error(`Erreur lors de l'évaluation personnalisée ${name}:`, error);
        }
      }
      
      return results;
    }
  };
};
```

### Migration depuis les systèmes existants

Pour migrer depuis les systèmes de tracing personnalisés :

1. **Phase 1 (Q2 2025)**: 
   - Audit des services de traçabilité existants
   - Mise en place des exportateurs OpenTelemetry pour les services existants

2. **Phase 2 (Q3 2025)**:
   - Migration progressive des agents vers LangSmith pour le tracing LLM
   - Configuration des dashboards Honeycomb standards

3. **Phase 3 (Q4 2025)**:
   - Migration complète des métriques vers Honeycomb
   - Mise à jour des interfaces d'administration pour intégrer les nouvelles visualisations

### Documentation de référence

Pour plus de détails sur la mise en œuvre de l'observabilité IA, consultez les documents suivants :
- [Guide d'implémentation LangSmith](/docs/observability/langsmith-implementation.md)
- [Tutoriel Honeycomb pour agents IA](/docs/observability/honeycomb-for-ai-agents.md)
- [Standardisation des évaluations LLM](/docs/observability/llm-evaluation-standards.md)
- [Architecture d'observabilité MCP 2.0](/docs/architecture/mcp2-observability.md)

## Sécurité CI/CD et Gestion des Artefacts

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Sigstore** | **ADOPTER** | Standard pour la signature et la vérification des artefacts logiciels. |
| **Cosign** | **ADOPTER** | Outil pour signer, vérifier et stocker les signatures pour les conteneurs et les autres artefacts OCI. |
| **SBOMs Cyclonedx** | **ADOPTER** | Format standard pour les SBOMs (Software Bill of Materials) permettant de documenter les dépendances. |
| **Syft** | **ADOPTER** | Pour la génération automatique des SBOMs dans les pipelines CI/CD. |
| **SLSA** | **ADOPTER** | Framework de niveaux de sécurisation des artefacts logiciels. Viser SLSA niveau 3 minimum. |
| **Keylime** | **ÉVALUER** | Pour la vérification d'intégrité des environnements d'exécution à base de TPM. |
| **Vault Secrets** | **ADOPTER** | Gestion centralisée des secrets avec rotation automatique. |
| **OIDC GitHub Actions** | **ADOPTER** | Authentification sans secret pour les déploiements sur Cloud via GitHub Actions. |

### Configuration standardisée pour Sigstore

Tous les projets doivent implémenter la signature des artefacts avec Sigstore selon cette configuration standard :

```yaml
# .github/workflows/sigstore-sign.yml
name: Sign Artifacts with Sigstore

on:
  workflow_call:
    inputs:
      artifact-path:
        required: true
        type: string
        description: 'Path to artifact to sign'
      signature-output:
        required: true
        type: string
        description: 'Path to store signature'

jobs:
  sign-artifact:
    runs-on: ubuntu-latest
    permissions:
      id-token: write # Nécessaire pour OIDC
      contents: read
    steps:
      - name: Setup Cosign
        uses: sigstore/cosign-installer@main
      
      - name: Sign Artifact
        run: |
          cosign sign-blob --oidc-issuer https://token.actions.githubusercontent.com \
            --output-signature ${{ inputs.signature-output }} \
            --output-certificate cosign.crt \
            ${{ inputs.artifact-path }}
        env:
          COSIGN_EXPERIMENTAL: 1
      
      - name: Upload Signature
        uses: actions/upload-artifact@v3
        with:
          name: artifact-signature
          path: |
            ${{ inputs.signature-output }}
            cosign.crt
          retention-days: 30
```

### Signature automatique des conteneurs Docker

Pour garantir l'authenticité et l'intégrité des images Docker produites par nos pipelines CI/CD :

```yaml
# .github/workflows/build-sign-image.yml
name: Build and Sign Docker Image

on:
  push:
    branches: [main]
    tags: ['v*.*.*']
  pull_request:
    branches: [main]

jobs:
  build-and-sign:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write # Pour Sigstore/Cosign
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: eu-west-3
      
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Login to GHCR
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and Push Image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
            ${{ startsWith(github.ref, 'refs/tags/') && format('{0}/{1}:{2}', env.ECR_REGISTRY, env.ECR_REPOSITORY, github.ref_name) || '' }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true # Activer la génération de provenance SLSA
          sbom: true # Générer un SBOM
      
      - name: Install Cosign
        uses: sigstore/cosign-installer@main
      
      - name: Sign Container Image
        if: github.event_name != 'pull_request'
        run: |
          cosign sign --oidc-issuer https://token.actions.githubusercontent.com \
            --recursive \
            ghcr.io/${{ github.repository }}:${{ github.sha }}
        env:
          COSIGN_EXPERIMENTAL: 1
      
      - name: Generate SBOM with Syft
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
          syft ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -o cyclonedx-json > sbom.cyclonedx.json
      
      - name: Sign SBOM
        if: github.event_name != 'pull_request'
        run: |
          cosign sign-blob --oidc-issuer https://token.actions.githubusercontent.com \
            --output-signature sbom.sig \
            sbom.cyclonedx.json
        env:
          COSIGN_EXPERIMENTAL: 1
      
      - name: Upload SBOM and Signature
        uses: actions/upload-artifact@v3
        with:
          name: sbom-and-signature
          path: |
            sbom.cyclonedx.json
            sbom.sig
```

### Validation des artefacts signés

Pour vérifier les signatures avant le déploiement :

```typescript
// scripts/verify-signatures.ts
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface VerificationOptions {
  artifactPath: string;
  signaturePath: string;
  certificatePath?: string;
  publicKey?: string;
  rekorURL?: string;
}

/**
 * Vérifie la signature d'un artefact avec Sigstore
 */
export function verifySignature(options: VerificationOptions): boolean {
  const { artifactPath, signaturePath, certificatePath, publicKey, rekorURL } = options;
  
  console.log(`Vérification de la signature pour ${path.basename(artifactPath)}`);
  
  // Construire la commande de vérification
  const args = ['verify-blob'];
  
  // Ajouter le chemin de la signature
  args.push('--signature', signaturePath);
  
  // Ajouter le certificat si fourni
  if (certificatePath) {
    args.push('--certificate', certificatePath);
  }
  
  // Ajouter la clé publique si fournie
  if (publicKey) {
    args.push('--key', publicKey);
  }
  
  // Ajouter l'URL Rekor si fournie
  if (rekorURL) {
    args.push('--rekor-url', rekorURL);
  }
  
  // Ajouter le chemin de l'artefact
  args.push(artifactPath);
  
  console.log(`Exécution de la commande: cosign ${args.join(' ')}`);
  
  // Exécuter la commande Cosign
  const result = spawnSync('cosign', args, {
    stdio: 'inherit',
    env: { ...process.env, COSIGN_EXPERIMENTAL: '1' }
  });
  
  if (result.status !== 0) {
    console.error(`Échec de la vérification de la signature: code ${result.status}`);
    return false;
  }
  
  console.log('Signature vérifiée avec succès!');
  return true;
}

/**
 * Vérifie une image conteneur signée
 */
export function verifyContainerImage(imageRef: string, publicKey?: string): boolean {
  console.log(`Vérification de la signature pour l'image: ${imageRef}`);
  
  const args = ['verify'];
  
  if (publicKey) {
    args.push('--key', publicKey);
  } else {
    args.push('--certificate-identity-regexp', '.*@github.com'); 
    args.push('--certificate-oidc-issuer', 'https://token.actions.githubusercontent.com');
  }
  
  args.push(imageRef);
  
  console.log(`Exécution de la commande: cosign ${args.join(' ')}`);
  
  const result = spawnSync('cosign', args, {
    stdio: 'inherit',
    env: { ...process.env, COSIGN_EXPERIMENTAL: '1' }
  });
  
  if (result.status !== 0) {
    console.error(`Échec de la vérification de l'image: code ${result.status}`);
    return false;
  }
  
  console.log('Image vérifiée avec succès!');
  return true;
}
```

### Intégration avec Vault pour la gestion des secrets

Pour une gestion sécurisée des secrets dans les pipelines CI/CD :

```yaml
# .github/workflows/vault-secrets.yml
name: CI with Vault Secrets

on:
  push:
    branches: [main]

jobs:
  build-with-secrets:
    runs-on: ubuntu-latest
    
    # Définition des permissions nécessaires pour le workflow
    permissions:
      id-token: write
      contents: read
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Import Vault secrets
        uses: hashicorp/vault-action@v2
        with:
          url: ${{ secrets.VAULT_URL }}
          method: jwt
          path: github
          role: github-actions
          secrets: |
            secret/data/ci/npm token | NPM_TOKEN ;
            secret/data/ci/aws access_key | AWS_ACCESS_KEY_ID ;
            secret/data/ci/aws secret_key | AWS_SECRET_ACCESS_KEY ;
            secret/data/ci/docker username | DOCKER_USERNAME ;
            secret/data/ci/docker password | DOCKER_PASSWORD
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: |
          npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
          npm ci
      
      - name: Build
        run: npm run build
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ env.DOCKER_USERNAME }}
          password: ${{ env.DOCKER_PASSWORD }}
```

### Mise en place de SLSA niveau 3

Pour garantir un niveau élevé de sécurité des artefacts conformément au framework SLSA (Supply-chain Levels for Software Artifacts) :

```yaml
# .github/workflows/slsa-builder.yml
name: SLSA Builder

on:
  workflow_call:
    inputs:
      artifact-path:
        required: true
        type: string
      go-version:
        required: false
        default: '1.19'
        type: string

jobs:
  slsa-build:
    permissions:
      actions: read
      id-token: write
      contents: read
      packages: write
    
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v1.4.0
    with:
      base-builder-image: 'golang:${{ inputs.go-version }}-alpine@sha256:0a03fe51325d5aca7b793eb3e9dac190a5e64a84f89d27b6abc2ebcbf8e84ab4'
      builder-digest: 'sha256:d7c1c90bb1ad6a898acf5e05086895e5717eed09aa869b24d5be69f4008c916e'
      compile-builder: 'go build -o ${{ inputs.artifact-path }} .'
      provenance-name: ${{ inputs.artifact-path }}.intoto.jsonl
      private-repository: true
```

### Vérification des dépendances avec SBOM

Pour analyser et gérer les vulnérabilités dans les dépendances :

```typescript
// scripts/sbom-vulnerability-scan.ts
import { spawnSync } from 'child_process';
import * as fs from 'fs';

/**
 * Génère un SBOM pour le projet avec Syft
 */
export function generateSBOM(outputFormat: 'cyclonedx-json' | 'spdx-json' = 'cyclonedx-json'): string {
  const outputFile = `sbom.${outputFormat.split('-')[0]}.json`;
  
  console.log('Génération du SBOM...');
  
  const result = spawnSync('syft', [
    '.',
    '-o', outputFormat,
    '--output-file', outputFile
  ], { stdio: 'inherit' });
  
  if (result.status !== 0) {
    throw new Error(`Échec de la génération du SBOM: code ${result.status}`);
  }
  
  console.log(`SBOM généré avec succès: ${outputFile}`);
  return outputFile;
}

/**
 * Analyse les vulnérabilités dans un SBOM avec Grype
 */
export function scanVulnerabilities(sbomPath: string, severityCutoff: 'negligible' | 'low' | 'medium' | 'high' | 'critical' = 'medium'): boolean {
  console.log(`Analyse des vulnérabilités avec seuil de sévérité: ${severityCutoff}...`);
  
  const result = spawnSync('grype', [
    'sbom:' + sbomPath,
    '--fail-on', severityCutoff,
    '--output', 'table'
  ], { stdio: 'inherit' });
  
  if (result.status !== 0) {
    console.error(`Des vulnérabilités ont été détectées au-dessus du seuil ${severityCutoff}`);
    return false;
  }
  
  console.log('Analyse de vulnérabilités réussie sans problème critique.');
  return true;
}
```

### Rotation automatique des secrets avec Vault

Pour mettre en place une rotation régulière des secrets d'API :

```typescript
// scripts/rotate-secrets.ts
import axios from 'axios';
import * as vault from 'node-vault';

interface RotationConfig {
  secretPath: string;
  secretKey: string;
  providerType: 'aws' | 'github' | 'npm' | 'docker' | 'api';
  providerConfig: {
    apiUrl?: string;
    credentialType?: string;
    tokenLength?: number;
  };
}

/**
 * Rotation automatique des secrets dans Vault
 */
export async function rotateSecret(
  vaultClient: vault.client,
  config: RotationConfig
): Promise<void> {
  console.log(`Rotation du secret: ${config.secretPath}/${config.secretKey}`);
  
  // Générer un nouveau secret selon le type de provider
  let newSecret: string;
  
  switch (config.providerType) {
    case 'api':
      // Demander un nouveau token à l'API externe
      if (!config.providerConfig.apiUrl) {
        throw new Error('apiUrl requis pour la rotation API');
      }
      
      const response = await axios.post(
        config.providerConfig.apiUrl,
        { type: config.providerConfig.credentialType || 'token' },
        { headers: { 'Authorization': `Bearer ${process.env.API_AUTH_TOKEN}` } }
      );
      
      newSecret = response.data.token;
      break;
      
    default:
      // Générer un token aléatoire pour les autres cas
      const length = config.providerConfig.tokenLength || 32;
      newSecret = generateRandomToken(length);
  }
  
  // Sauvegarder le nouveau secret dans Vault
  await vaultClient.write(config.secretPath, {
    [config.secretKey]: newSecret
  });
  
  console.log(`Secret ${config.secretPath}/${config.secretKey} mis à jour avec succès.`);
}

/**
 * Générer un token aléatoire sécurisé
 */
function generateRandomToken(length: number): string {
  const crypto = require('crypto');
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}
```

### Authentification OIDC pour les déploiements cloud

Pour éliminer les secrets à longue durée de vie dans les pipelines CI/CD :

```typescript
// terraform/modules/github-oidc/main.tf
provider "aws" {
  region = var.region
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["a031c46782e6e6c662c2c87c76da9aa62ccabd8e"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-deployment-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
          }
        }
      }
    ]
  })
}

// Politique pour les droits ECR
resource "aws_iam_role_policy" "ecr_policy" {
  name = "ecr-deployment-policy"
  role = aws_iam_role.github_actions.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

output "role_arn" {
  value = aws_iam_role.github_actions.arn
}
```

### Documentation de référence

Pour plus de détails sur la mise en œuvre de ces standards de sécurité CI/CD, consultez les documents suivants :
- [Guide d'implémentation Sigstore](/docs/security/sigstore-implementation.md)
- [Conformité SLSA niveau 3](/docs/security/slsa-compliance-guide.md)
- [Gestion des secrets avec Vault](/docs/security/vault-secrets-management.md)
- [Architecture de sécurité CI/CD](/docs/security/cicd-security-architecture.md)

## Delivery Avancée

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **LaunchDarkly** | **ADOPTER** | Solution principale pour la gestion des Feature Flags et le déploiement progressif. Offre des fonctionnalités avancées de ciblage, segmentation et analyse. |
| **FlagSmith** | **MAINTENIR** | Alternative open-source pour les projets existants ou de petite envergure nécessitant une solution autohébergée. |
| **Custom Feature Flags** | **ÉLIMINER** | Migrer toutes les implémentations personnalisées de Feature Flags vers LaunchDarkly ou FlagSmith. |

### Configuration standardisée pour LaunchDarkly

Tous les projets utilisant LaunchDarkly doivent suivre ces conventions d'implémentation :

```typescript
// utils/feature-flags.ts
import * as LaunchDarkly from 'launchdarkly-node-server-sdk';
import type { LDUser, LDFlagSet } from 'launchdarkly-node-server-sdk';

// Types de drapeau standardisés
export enum FlagType {
  RELEASE = 'release',      // Fonctionnalités en cours de déploiement
  EXPERIMENT = 'experiment', // Tests A/B et expérimentations
  PERMISSION = 'permission', // Contrôle d'accès aux fonctionnalités
  OPERATIONAL = 'operational', // Configuration opérationnelle
  KILL_SWITCH = 'kill-switch' // Interrupteurs d'urgence
}

// Interface pour la configuration du client
interface LDClientConfig {
  sdkKey: string;
  environment?: string;
  defaultUser?: Partial<LDUser>;
  offline?: boolean;
  tags?: Record<string, string>;
}

// Singleton pour le client LaunchDarkly
class FeatureFlagService {
  private static instance: FeatureFlagService;
  private client: LaunchDarkly.LDClient | null = null;
  private initialized = false;
  private defaultUser: Partial<LDUser> = { anonymous: true };
  private environment: string = 'development';

  private constructor() {}

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  public async initialize(config: LDClientConfig): Promise<void> {
    if (this.initialized) return;

    if (!config.sdkKey) {
      console.warn('LaunchDarkly SDK key not provided, running in offline mode');
      this.client = LaunchDarkly.init(config.sdkKey || 'fake-key', { offline: true });
      this.initialized = true;
      return;
    }

    // Configurer l'environnement et l'utilisateur par défaut
    this.environment = config.environment || process.env.NODE_ENV || 'development';
    this.defaultUser = config.defaultUser || { anonymous: true };

    // Initialiser le client
    this.client = LaunchDarkly.init(config.sdkKey, {
      offline: config.offline || false,
      tags: {
        environment: this.environment,
        service: 'mcp-platform',
        ...config.tags
      }
    });

    try {
      await this.client.waitForInitialization();
      this.initialized = true;
      console.log('LaunchDarkly client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LaunchDarkly client:', error);
      // Fallback en mode offline en cas d'erreur
      this.client = LaunchDarkly.init(config.sdkKey, { offline: true });
      this.initialized = true;
    }
  }

  public async getBooleanFlag(
    flagKey: string,
    user: Partial<LDUser> = this.defaultUser,
    defaultValue = false
  ): Promise<boolean> {
    if (!this.initialized || !this.client) {
      console.warn(`LaunchDarkly client not initialized, returning default value for ${flagKey}`);
      return defaultValue;
    }

    // Ajouter l'environnement à l'utilisateur si non spécifié
    const ldUser: LDUser = {
      ...user,
      custom: {
        ...(user.custom || {}),
        environment: user.custom?.environment || this.environment
      }
    };

    try {
      return await this.client.variation(flagKey, ldUser, defaultValue);
    } catch (error) {
      console.error(`Error fetching flag ${flagKey}:`, error);
      return defaultValue;
    }
  }

  public async getStringFlag(
    flagKey: string,
    user: Partial<LDUser> = this.defaultUser,
    defaultValue = ''
  ): Promise<string> {
    if (!this.initialized || !this.client) {
      return defaultValue;
    }

    // Enrichir l'utilisateur avec l'environnement
    const ldUser: LDUser = {
      ...user,
      custom: {
        ...(user.custom || {}),
        environment: user.custom?.environment || this.environment
      }
    };

    try {
      return await this.client.variation(flagKey, ldUser, defaultValue);
    } catch (error) {
      console.error(`Error fetching flag ${flagKey}:`, error);
      return defaultValue;
    }
  }

  public async getJsonFlag<T>(
    flagKey: string,
    user: Partial<LDUser> = this.defaultUser,
    defaultValue: T
  ): Promise<T> {
    if (!this.initialized || !this.client) {
      return defaultValue;
    }

    // Enrichir l'utilisateur avec l'environnement
    const ldUser: LDUser = {
      ...user,
      custom: {
        ...(user.custom || {}),
        environment: user.custom?.environment || this.environment
      }
    };

    try {
      return await this.client.variation(flagKey, ldUser, defaultValue);
    } catch (error) {
      console.error(`Error fetching flag ${flagKey}:`, error);
      return defaultValue;
    }
  }

  public async getAllFlags(user: Partial<LDUser> = this.defaultUser): Promise<LDFlagSet> {
    if (!this.initialized || !this.client) {
      return {};
    }

    // Enrichir l'utilisateur avec l'environnement
    const ldUser: LDUser = {
      ...user,
      custom: {
        ...(user.custom || {}),
        environment: user.custom?.environment || this.environment
      }
    };

    try {
      return await this.client.allFlagsState(ldUser).then(state => state.toJSON());
    } catch (error) {
      console.error('Error fetching all flags:', error);
      return {};
    }
  }

  public async track(
    eventName: string,
    user: Partial<LDUser> = this.defaultUser,
    data?: any
  ): Promise<void> {
    if (!this.initialized || !this.client) {
      return;
    }

    // Enrichir l'utilisateur avec l'environnement
    const ldUser: LDUser = {
      ...user,
      custom: {
        ...(user.custom || {}),
        environment: user.custom?.environment || this.environment
      }
    };

    try {
      await this.client.track(eventName, ldUser, data);
    } catch (error) {
      console.error(`Error tracking event ${eventName}:`, error);
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.initialized = false;
      this.client = null;
    }
  }
}

// Exporter l'instance singleton
export const featureFlags = FeatureFlagService.getInstance();
```

### Intégration avec NestJS

Pour les projets NestJS, utilisez ce module standardisé :

```typescript
// feature-flags/feature-flags.module.ts
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { featureFlags } from './feature-flags.service';
import { FEATURE_FLAGS_OPTIONS } from './feature-flags.constants';

export interface FeatureFlagsModuleOptions {
  sdkKey: string;
  environment?: string;
  offline?: boolean;
  tags?: Record<string, string>;
}

@Global()
@Module({})
export class FeatureFlagsModule {
  static forRoot(options: FeatureFlagsModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: FEATURE_FLAGS_OPTIONS,
      useValue: options,
    };

    const serviceProvider: Provider = {
      provide: 'FEATURE_FLAGS_SERVICE',
      useFactory: async () => {
        await featureFlags.initialize(options);
        return featureFlags;
      },
    };

    return {
      module: FeatureFlagsModule,
      providers: [optionsProvider, serviceProvider],
      exports: [serviceProvider],
    };
  }
}

// feature-flags/feature-flags.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { featureFlags } from './feature-flags.service';

export const FeatureFlag = createParamDecorator(
  async (flagKey: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user || { anonymous: true };
    
    return await featureFlags.getBooleanFlag(flagKey, user, false);
  }
);

// Exemple d'utilisation dans un contrôleur
@Controller('api')
export class ApiController {
  @Get('feature')
  async getFeature(@FeatureFlag('new-feature') isEnabled: boolean) {
    if (isEnabled) {
      return { version: 'new' };
    }
    return { version: 'old' };
  }
}
```

### Intégration avec React/Remix

Pour l'intégration côté client, utilisez le provider React standardisé :

```tsx
// components/LaunchDarklyProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as LDClient from 'launchdarkly-js-client-sdk';

interface FlagsContextType {
  flags: Record<string, any>;
  ldClient: LDClient.LDClient | null;
  isInitialized: boolean;
  identify: (user: LDClient.LDUser) => Promise<void>;
  trackEvent: (key: string, data?: any) => void;
}

const FlagsContext = createContext<FlagsContextType>({
  flags: {},
  ldClient: null,
  isInitialized: false,
  identify: async () => {},
  trackEvent: () => {},
});

interface LaunchDarklyProviderProps {
  clientSideId: string;
  user: LDClient.LDUser;
  options?: LDClient.LDOptions;
  children: React.ReactNode;
}

export const LaunchDarklyProvider: React.FC<LaunchDarklyProviderProps> = ({
  clientSideId,
  user,
  options = {},
  children,
}) => {
  const [ldClient, setLdClient] = useState<LDClient.LDClient | null>(null);
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Ne rien faire si clientSideId n'est pas défini
    if (!clientSideId) {
      console.warn('LaunchDarkly client side ID not provided');
      return;
    }

    const client = LDClient.initialize(clientSideId, user, options);

    // Écouter les modifications de flags
    client.on('change', (changedFlags) => {
      console.log('Flags changed:', changedFlags);
      setFlags((prevFlags) => ({ ...prevFlags, ...changedFlags }));
    });

    // Initialiser le client
    client.on('ready', () => {
      setLdClient(client);
      setFlags(client.allFlags());
      setIsInitialized(true);
      console.log('LaunchDarkly client initialized');
    });

    client.on('error', (error) => {
      console.error('LaunchDarkly client error:', error);
    });

    // Nettoyage à la destruction du composant
    return () => {
      client.close();
    };
  }, [clientSideId]);

  // Identifier un nouvel utilisateur
  const identify = async (newUser: LDClient.LDUser): Promise<void> => {
    if (ldClient) {
      try {
        await ldClient.identify(newUser);
        setFlags(ldClient.allFlags());
      } catch (error) {
        console.error('Error identifying user:', error);
      }
    }
  };

  // Suivre un événement personnalisé
  const trackEvent = (key: string, data?: any): void => {
    if (ldClient) {
      ldClient.track(key, data);
    }
  };

  return (
    <FlagsContext.Provider
      value={{ flags, ldClient, isInitialized, identify, trackEvent }}
    >
      {children}
    </FlagsContext.Provider>
  );
};

// Hook pour consommer les feature flags
export const useFeatureFlag = (flagKey: string, defaultValue: any = false) => {
  const { flags, isInitialized } = useContext(FlagsContext);
  
  if (!isInitialized) {
    return defaultValue;
  }
  
  return flags[flagKey] !== undefined ? flags[flagKey] : defaultValue;
};

// Hook pour consommer tous les flags
export const useFeatureFlags = () => {
  return useContext(FlagsContext);
};
```

### Configuration standardisée pour FlagSmith

Pour les projets nécessitant une solution autohébergée :

```typescript
// utils/flagsmith-client.ts
import Flagsmith from 'flagsmith-nodejs';
import { IFlags, IFlagsmith, IFlagsmithOptions, IIdentity } from 'flagsmith-nodejs/types';

interface FlagsmithConfig {
  apiKey: string;
  apiUrl?: string;
  environmentKey?: string;
  defaultFlagValues?: Record<string, any>;
  enableAnalytics?: boolean;
  timeout?: number;
}

class FlagsmithService {
  private static instance: FlagsmithService;
  private client: IFlagsmith | null = null;
  private initialized = false;
  private defaultFlagValues: Record<string, any> = {};

  private constructor() {}

  public static getInstance(): FlagsmithService {
    if (!FlagsmithService.instance) {
      FlagsmithService.instance = new FlagsmithService();
    }
    return FlagsmithService.instance;
  }

  public async initialize(config: FlagsmithConfig): Promise<void> {
    if (this.initialized) return;

    const options: IFlagsmithOptions = {
      environmentKey: config.apiKey,
      enableAnalytics: config.enableAnalytics || false,
      timeout: config.timeout || 5000,
    };

    if (config.apiUrl) {
      options.apiUrl = config.apiUrl;
    }

    this.defaultFlagValues = config.defaultFlagValues || {};

    try {
      this.client = await Flagsmith.init(options);
      this.initialized = true;
      console.log('FlagSmith client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FlagSmith client:', error);
      // Initialiser un client factice en cas d'erreur
      this.client = {
        getFlags: async () => this.createMockFlags(this.defaultFlagValues),
        getIdentity: async () => this.createMockFlags(this.defaultFlagValues),
        getValue: async () => null,
        hasFeature: async () => false,
        getTrait: async () => null,
        setTrait: async () => ({}),
        setTraits: async () => ({}),
        incrementTrait: async () => ({}),
      } as IFlagsmith;
      this.initialized = true;
    }
  }

  private createMockFlags(defaultValues: Record<string, any> = {}): IFlags {
    const flags: IFlags = {
      isFeatureEnabled: (featureId: string) => 
        Boolean(defaultValues[featureId] || false),
      getFeatureValue: (featureId: string) => 
        defaultValues[featureId] || null,
      getAllFlags: () => Object.entries(defaultValues)
        .map(([key, value]) => ({ 
          feature: { name: key, id: key },
          enabled: Boolean(value),
          value: value
        })),
    };
    return flags;
  }

  public async getFeatureEnabled(
    featureId: string, 
    userId?: string, 
    traits?: Record<string, any>
  ): Promise<boolean> {
    if (!this.initialized || !this.client) {
      return this.defaultFlagValues[featureId] || false;
    }
    
    try {
      if (userId) {
        const identity: IIdentity = await this.client.getIdentity(userId, traits);
        return identity.isFeatureEnabled(featureId);
      } else {
        const flags = await this.client.getFlags();
        return flags.isFeatureEnabled(featureId);
      }
    } catch (error) {
      console.error(`Error checking feature ${featureId}:`, error);
      return this.defaultFlagValues[featureId] || false;
    }
  }

  public async getFeatureValue<T>(
    featureId: string, 
    defaultValue: T,
    userId?: string,
    traits?: Record<string, any>
  ): Promise<T> {
    if (!this.initialized || !this.client) {
      return this.defaultFlagValues[featureId] || defaultValue;
    }
    
    try {
      let value: any;
      
      if (userId) {
        const identity = await this.client.getIdentity(userId, traits);
        value = identity.getFeatureValue(featureId);
      } else {
        const flags = await this.client.getFlags();
        value = flags.getFeatureValue(featureId);
      }
      
      return value !== null && value !== undefined ? value : defaultValue;
    } catch (error) {
      console.error(`Error getting value for feature ${featureId}:`, error);
      return this.defaultFlagValues[featureId] || defaultValue;
    }
  }

  public async getAllFlags(userId?: string, traits?: Record<string, any>): Promise<any[]> {
    if (!this.initialized || !this.client) {
      return Object.entries(this.defaultFlagValues).map(([key, value]) => ({
        feature: { name: key, id: key },
        enabled: Boolean(value),
        value
      }));
    }
    
    try {
      if (userId) {
        const identity = await this.client.getIdentity(userId, traits);
        return identity.getAllFlags();
      } else {
        const flags = await this.client.getFlags();
        return flags.getAllFlags();
      }
    } catch (error) {
      console.error('Error getting all flags:', error);
      return Object.entries(this.defaultFlagValues).map(([key, value]) => ({
        feature: { name: key, id: key },
        enabled: Boolean(value),
        value
      }));
    }
  }
}

// Exporter l'instance singleton
export const flagsmith = FlagsmithService.getInstance();
```

### Standards de nommage des Feature Flags

Pour assurer une utilisation cohérente des Feature Flags, suivez ces conventions de nommage :

1. **Format standard**: `[domaine].[fonctionnalité].[action]`
   - Exemple: `payments.subscription.enable-monthly-billing`

2. **Catégories de drapeaux**:
   - `release-`: Pour les fonctionnalités en cours de déploiement
   - `exp-`: Pour les expérimentations ou tests A/B
   - `ops-`: Pour les configurations opérationnelles
   - `perm-`: Pour les contrôles d'accès
   - `kill-`: Pour les interrupteurs d'urgence

3. **Versionnement**: Indiquer la version pour les fonctionnalités itératives
   - Exemple: `release-ui.dashboard.v2-layout`

### Stratégies de déploiement progressif

Les déploiements progressifs doivent suivre cette stratégie en quatre phases:

1. **Phase de développement**:
   - Activé uniquement pour les utilisateurs internes
   - Environnement: développement uniquement
   - Durée typique: N/A

2. **Phase d'Évaluation**:
   - Déploiement canary (5% des utilisateurs)
   - Environnement: production
   - Durée typique: 1-3 jours
   - Métriques à surveiller: erreurs, performance, engagement

3. **Phase de Déploiement progressif**:
   - Augmentation progressive: 20% → 50% → 80% → 100%
   - Environnement: production
   - Durée typique: 1-2 semaines
   - Évaluation à chaque palier avant progression

4. **Phase de Stabilisation**:
   - Fonctionnalité activée pour tous les utilisateurs
   - Garder le flag pendant 2-4 semaines pour rollback facile
   - Après stabilisation, intégrer la fonctionnalité au code de base

### Documentation de référence

Pour plus de détails sur l'utilisation des Feature Flags, consultez les documents suivants:
- [Guide d'implémentation LaunchDarkly](/docs/feature-flags/launchdarkly-implementation-guide.md)
- [Stratégies de test A/B](/docs/feature-flags/ab-testing-strategies.md)
- [Guide de migration depuis les systèmes de flags personnalisés](/docs/feature-flags/custom-flags-migration.md)
- [Bonnes pratiques pour les Feature Flags](/docs/feature-flags/feature-flags-best-practices.md)

## Gestion de Cache et Stockage Temporaire

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Redis Stack (RedisJSON)** | **ADOPTER** | Solution principale pour le stockage temporaire des résultats d'agents IA et l'état d'orchestration des pipelines. |
| **Redis** | **MAINTENIR** | À utiliser pour les cas simples de cache et les files d'attente BullMQ. |
| **Memcached** | **ÉLIMINER** | Migrer progressivement vers Redis Stack pour une meilleure standardisation. |
| **Custom caching solutions** | **ÉLIMINER** | Remplacer les solutions de cache personnalisées par Redis Stack. |

### Configuration standardisée pour Redis Stack

Redis Stack avec le module RedisJSON offre une solution adaptée pour stocker des structures de données JSON natives, permettant ainsi de gérer efficacement les résultats intermédiaires des agents IA et l'état des orchestrations de pipelines. Tous les projets utilisant Redis Stack doivent suivre ces conventions d'implémentation :

```typescript
// utils/redis-stack-client.ts
import { createClient, RedisClientType } from 'redis';

// Interface pour la configuration client
interface RedisStackConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  username?: string;
  database?: number;
  tls?: boolean;
  connectionName?: string;
  retryStrategy?: boolean | number;
}

// Types de stockage standardisés
export enum CacheType {
  AGENT_RESULT = 'agent:result',    // Résultats des agents IA
  PIPELINE_STATE = 'pipeline:state', // État des pipelines d'orchestration
  WORKFLOW_STEP = 'workflow:step',   // Étape de workflow
  CONFIG = 'config',                 // Configurations temporaires
  SESSION = 'session'                // Données de session
}

// Singleton pour le client Redis
class RedisStackService {
  private static instance: RedisStackService;
  private client: RedisClientType | null = null;
  private isConnected = false;
  private defaultTTL = 3600; // 1 heure par défaut

  private constructor() {}

  public static getInstance(): RedisStackService {
    if (!RedisStackService.instance) {
      RedisStackService.instance = new RedisStackService();
    }
    return RedisStackService.instance;
  }

  public async initialize(config: RedisStackConfig): Promise<void> {
    if (this.isConnected) return;

    const url = config.url || `redis://${config.host || 'localhost'}:${config.port || 6379}`;

    const clientOptions: any = {
      url,
      socket: {
        reconnectStrategy: config.retryStrategy === false ? false : 
          typeof config.retryStrategy === 'number' ? 
            (retries: number) => Math.min(retries * 50, 1000) : 
            (retries: number) => Math.min(retries * 50, 1000)
      }
    };

    if (config.database !== undefined) {
      clientOptions.database = config.database;
    }

    if (config.username) {
      clientOptions.username = config.username;
    }

    if (config.password) {
      clientOptions.password = config.password;
    }

    if (config.tls) {
      clientOptions.socket.tls = true;
    }

    if (config.connectionName) {
      clientOptions.name = config.connectionName;
    }

    this.client = createClient(clientOptions) as RedisClientType;

    // Gestion des erreurs
    this.client.on('error', (err) => {
      console.error('Redis Stack client error:', err);
    });

    // Reconnexion
    this.client.on('reconnecting', () => {
      console.warn('Redis Stack client reconnecting...');
    });

    // Connexion réussie
    this.client.on('connect', () => {
      console.log('Redis Stack client connected');
      this.isConnected = true;
    });

    // Déconnexion
    this.client.on('end', () => {
      console.log('Redis Stack client disconnected');
      this.isConnected = false;
    });

    try {
      await this.client.connect();
      
      // Vérifier que le module RedisJSON est chargé
      const modules = await this.client.sendCommand(['MODULE', 'LIST']);
      const hasRedisJSON = modules.some((module: any) => 
        module.name && module.name.toString().toLowerCase() === 'rejson'
      );
      
      if (!hasRedisJSON) {
        console.warn('RedisJSON module not loaded. JSON operations may not work properly.');
      } else {
        console.log('RedisJSON module detected and ready to use');
      }
    } catch (error) {
      console.error('Failed to initialize Redis Stack client:', error);
      throw error;
    }
  }

  // Stocker un objet JSON avec un préfixe standardisé
  public async setJson<T>(
    type: CacheType, 
    key: string, 
    data: T, 
    ttlSeconds: number = this.defaultTTL
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis Stack client not initialized');
    }

    const fullKey = `${type}:${key}`;
    
    try {
      // Utiliser JSON.SET via la commande Redis native
      await this.client.sendCommand(['JSON.SET', fullKey, '.', JSON.stringify(data)]);
      
      if (ttlSeconds > 0) {
        await this.client.expire(fullKey, ttlSeconds);
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting JSON at ${fullKey}:`, error);
      return false;
    }
  }

  // Récupérer un objet JSON
  public async getJson<T>(type: CacheType, key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis Stack client not initialized');
    }

    const fullKey = `${type}:${key}`;
    
    try {
      // Utiliser JSON.GET via la commande Redis native
      const result = await this.client.sendCommand(['JSON.GET', fullKey, '.']);
      
      if (!result) return null;
      
      return JSON.parse(result as string) as T;
    } catch (error) {
      console.error(`Error getting JSON from ${fullKey}:`, error);
      return null;
    }
  }

  // Mise à jour partielle d'un objet JSON
  public async updateJson<T>(
    type: CacheType, 
    key: string, 
    path: string,
    data: any, 
    resetTTL: boolean = false,
    ttlSeconds: number = this.defaultTTL
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis Stack client not initialized');
    }

    const fullKey = `${type}:${key}`;
    
    try {
      // Vérifier que l'objet existe
      const exists = await this.client.exists(fullKey);
      if (exists === 0) return false;
      
      // Utiliser JSON.SET avec le chemin spécifié
      await this.client.sendCommand([
        'JSON.SET', 
        fullKey, 
        path, 
        JSON.stringify(data)
      ]);
      
      // Reset TTL if requested
      if (resetTTL && ttlSeconds > 0) {
        await this.client.expire(fullKey, ttlSeconds);
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating JSON at ${fullKey}:`, error);
      return false;
    }
  }

  // Supprimer un objet JSON
  public async deleteJson(type: CacheType, key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis Stack client not initialized');
    }

    const fullKey = `${type}:${key}`;
    
    try {
      const deleted = await this.client.del(fullKey);
      return deleted > 0;
    } catch (error) {
      console.error(`Error deleting JSON at ${fullKey}:`, error);
      return false;
    }
  }

  // Récupérer plusieurs objets JSON par préfixe
  public async findJsonsByPattern(type: CacheType, pattern: string): Promise<Record<string, any>> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis Stack client not initialized');
    }

    const fullPattern = `${type}:${pattern}`;
    
    try {
      const keys = await this.client.keys(fullPattern);
      const result: Record<string, any> = {};
      
      for (const fullKey of keys) {
        const key = fullKey.replace(`${type}:`, '');
        const data = await this.getJson(type, key);
        if (data) {
          result[key] = data;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error finding JSON by pattern ${fullPattern}:`, error);
      return {};
    }
  }

  // Fermer la connexion
  public async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Définir un TTL par défaut global
  public setDefaultTTL(seconds: number): void {
    this.defaultTTL = seconds;
  }
}

// Exporter l'instance singleton
export const redisStack = RedisStackService.getInstance();
```

### Intégration avec NestJS

Pour les projets NestJS, utilisez ce module standardisé pour Redis Stack :

```typescript
// redis-stack/redis-stack.module.ts
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { redisStack, CacheType } from './redis-stack.service';

export interface RedisStackModuleOptions {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: number;
  tls?: boolean;
  connectionName?: string;
  defaultTTL?: number;
}

@Global()
@Module({})
export class RedisStackModule {
  static forRoot(options: RedisStackModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: 'REDIS_STACK_OPTIONS',
      useValue: options,
    };

    const serviceProvider: Provider = {
      provide: 'REDIS_STACK_SERVICE',
      useFactory: async () => {
        await redisStack.initialize(options);
        
        if (options.defaultTTL) {
          redisStack.setDefaultTTL(options.defaultTTL);
        }
        
        return redisStack;
      },
    };

    return {
      module: RedisStackModule,
      providers: [optionsProvider, serviceProvider],
      exports: [serviceProvider],
    };
  }
}

// redis-stack/redis-stack.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { redisStack, CacheType } from './redis-stack.service';

export const CachedResult = createParamDecorator(
  async (data: { type: CacheType; key: string }, ctx: ExecutionContext) => {
    const { type, key } = data;
    return await redisStack.getJson(type, key);
  }
);
```

### Cas d'utilisation standardisés

Les principaux cas d'utilisation pour Redis Stack (RedisJSON) sont les suivants :

| Cas d'utilisation | Type de cache | TTL recommandé | Exemple |
|------------------|---------------|---------------|---------|
| Résultats d'agents IA | `AGENT_RESULT` | 1 heure | Stockage temporaire des réponses générées par les LLM |
| État des pipelines | `PIPELINE_STATE` | 24 heures | Suivi de l'état d'exécution des pipelines d'orchestration |
| Checkpoints de workflows | `WORKFLOW_STEP` | 48 heures | Points de reprise pour les workflows longue durée |
| Configurations dynamiques | `CONFIG` | 30 minutes | Paramètres de configuration temporaires |
| Sessions utilisateur | `SESSION` | 1 heure | État de session pour les interfaces utilisateur |

### Stratégies de gestion de cache

Pour une utilisation optimale du cache Redis Stack, respectez ces bonnes pratiques :

1. **Structure de données** : Privilégier des structures JSON plates pour les données fréquemment accédées
2. **TTL adaptés** : Définir des TTL appropriés selon la nature des données
3. **Invalidation ciblée** : Invalider uniquement les parties nécessaires du cache
4. **Éviction sélective** : Configurer des politiques d'éviction adaptées (allkeys-lru recommandé)
5. **Préfixage cohérent** : Toujours utiliser les types de cache standards définis

### Configuration Docker recommandée

Pour déployer Redis Stack avec RedisJSON activé :

```yaml
# docker-compose.redis-stack.yml
version: '3.8'

services:
  redis-stack:
    image: redis/redis-stack:latest
    ports:
      - "6379:6379"
      - "8001:8001"  # RedisInsight UI
    volumes:
      - redis-stack-data:/data
    environment:
      - REDIS_ARGS=--appendonly yes --requirepass ${REDIS_PASSWORD:-strongpassword}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    restart: unless-stopped

volumes:
  redis-stack-data:

networks:
  app-network:
    driver: bridge
```

### Migration depuis Redis standard ou autres solutions

Pour migrer vers Redis Stack (RedisJSON) depuis d'autres solutions de cache :

1. **Étape 1**: Installer Redis Stack en parallèle du système existant
2. **Étape 2**: Mettre en place une couche d'abstraction utilisant l'implémentation ci-dessus
3. **Étape 3**: Migrer progressivement les données en écrivant en double pendant une phase de transition
4. **Étape 4**: Basculer la lecture vers Redis Stack tout en conservant l'écriture double
5. **Étape 5**: Une fois stable, supprimer l'ancienne implémentation

### Documentation de référence

Pour plus de détails sur l'utilisation de Redis Stack pour la gestion du cache de pipeline, consultez :
- [Guide d'implémentation Redis Stack](/docs/cache/redis-stack-implementation.md)
- [Patterns de cache pour agents IA](/docs/cache/cache-patterns-ia-agents.md)
- [Optimisation des performances avec RedisJSON](/docs/performance/redisjson-optimization.md)
- [Architecture de cache distribué](/docs/architecture/distributed-cache.md)

## Technologies émergentes

Cette section présente les technologies actuellement en cours d'évaluation pour une potentielle adoption future. Ces technologies ne sont pas encore recommandées pour une utilisation en production, mais peuvent être expérimentées dans des projets pilotes ou des preuves de concept.

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Bun** | **ÉVALUER** | Runtime JavaScript plus rapide avec meilleure gestion des dépendances. À évaluer comme alternative à Node.js pour certains services à forte charge. |
| **WebAssembly WASI** | **ÉVALUER** | Standard en évolution pour les workloads portables, à surveiller pour l'exécution d'agents en environnement restreint. |
| **Deno** | **ÉVALUER** | Runtime JavaScript sécurisé par défaut, à évaluer pour les fonctions edge et la sécurité accrue. |
| **Hono** | **ÉVALUER** | Framework web léger et performant pour Edge Functions, à considérer comme alternative à Express pour les services légers. |
| **HTMX** | **ÉVALUER** | Alternative légère aux frameworks JavaScript pour les interfaces simples, à considérer pour les applications avec peu d'interactions côté client. |
| **Drizzle ORM** | **ÉVALUER** | ORM TypeScript léger, à évaluer comme alternative à Prisma pour les cas nécessitant plus de performance. |
| **TurboRepo** | **ÉVALUER** | Système de build incrémental, à comparer avec NX pour l'optimisation des builds monorepo. |
| **Bazel** | **ÉVALUER** | Système de build multi-langage scalable, à considérer pour les projets très larges avec multiples langages. |

### Critères d'évaluation

Chaque technologie émergente est évaluée selon ces critères avant d'être considérée pour adoption :

1. **Maturité du projet** : Activité de développement, contributions communautaires, roadmap
2. **Performance** : Benchmarks comparatifs avec les solutions existantes
3. **Compatibilité** : Intégration avec notre stack technologique actuelle
4. **Sécurité** : Audit des vulnérabilités et modèle de sécurité
5. **Coût d'adoption** : Formation nécessaire, courbe d'apprentissage, migration
6. **Support à long terme** : Engagement des mainteneurs, modèle de gouvernance

### Processus d'évaluation

Le processus d'évaluation des technologies émergentes suit ces étapes :

1. **Veille technologique** : Identification des technologies prometteuses
2. **Phase d'exploration** : Recherche approfondie et POCs simples
3. **Projet pilote** : Implémentation sur un projet non critique
4. **Évaluation formelle** : Analyse des résultats selon les critères définis
5. **Décision** : Maintien du statut ÉVALUER, promotion à ADOPTER, ou abandon

### Calendrier d'évaluation 2025

| Technologie | Évaluation prévue | Responsable | Livrables attendus |
|-------------|-------------------|-------------|-------------------|
| **Bun** | T2 2025 | David Nguyen | Benchmark de performance, POC sur service de notification |
| **WebAssembly WASI** | T3 2025 | Léa Bernard | POC d'agent ML isolé |
| **Drizzle ORM** | T2 2025 | Emma Lefèvre | Comparatif de performance avec Prisma |
| **Hono** | T3 2025 | Thomas Klein | POC API edge computing |
| **TurboRepo** | T4 2025 | Nicolas Girard | Comparatif avec NX sur temps de build |

## Index des technologies

Index alphabétique de toutes les technologies mentionnées dans ce document avec leur statut et un lien rapide vers leur section détaillée.

| Technologie | Statut | Section |
|-------------|--------|---------|
| **Ajv** | **LIMITER** | [Validation et Typing](#validation-et-typing) |
| **Angular** | **ÉLIMINER** | [Framework Frontend](#framework-frontend) |
| **Ansible** | **ÉLIMINER** | [Conteneurisation et Infrastructure as Code](#conteneurisation-et-infrastructure-as-code) |
| **Bazel** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **Brave Search API** | **ADOPTER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **BullMQ** | **CONSERVER** | [Technologies d'orchestration](#technologies-dorchestration) |
| **Bun** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **class-validator** | **MAINTENIR** | [Validation et Typing](#validation-et-typing) |
| **Cosign** | **ADOPTER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **Custom Agents** | **STANDARDISER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **Custom Feature Flags** | **ÉLIMINER** | [Delivery Avancée](#delivery-avancée) |
| **Custom orchestrators** | **ÉLIMINER** | [Technologies d'orchestration](#technologies-dorchestration) |
| **DeepSeek** | **ÉVALUER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **Deno** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **Docker** | **ADOPTER** | [Conteneurisation et Infrastructure as Code](#conteneurisation-et-infrastructure-as-code) |
| **Docker Compose** | **ADOPTER** | [Conteneurisation et Infrastructure as Code](#conteneurisation-et-infrastructure-as-code) |
| **Drizzle ORM** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **Earthly** | **MAINTENIR** | [CI/CD et Gestion de Projet](#cicd-et-gestion-de-projet) |
| **Express** | **MAINTENIR** | [Framework Backend](#framework-backend) |
| **Fastify** | **ÉLIMINER** | [Framework Backend](#framework-backend) |
| **FlagSmith** | **MAINTENIR** | [Delivery Avancée](#delivery-avancée) |
| **GitHub Actions** | **ADOPTER** | [CI/CD et Gestion de Projet](#cicd-et-gestion-de-projet) |
| **GitLab CI** | **ÉLIMINER** | [CI/CD et Gestion de Projet](#cicd-et-gestion-de-projet) |
| **Grafana** | **ADOPTER** | [Logging et Monitoring](#logging-et-monitoring) |
| **GraphQL** | **LIMITER** | [API et Communication](#api-et-communication) |
| **Honeycomb** | **ADOPTER** | [Observabilité IA](#observabilité-ia) |
| **Hono** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **HTMX** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **Jest** | **ADOPTER** | [Testing](#testing) |
| **Joi** | **ÉLIMINER** | [Validation et Typing](#validation-et-typing) |
| **Keylime** | **ÉVALUER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **Kubernetes** | **ÉVALUER** | [Conteneurisation et Infrastructure as Code](#conteneurisation-et-infrastructure-as-code) |
| **LangChain.js** | **ADOPTER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **Langfuse** | **MAINTENIR** | [Observabilité IA](#observabilité-ia) |
| **LangSmith** | **ADOPTER** | [Observabilité IA](#observabilité-ia) |
| **LaunchDarkly** | **ADOPTER** | [Delivery Avancée](#delivery-avancée) |
| **Memcached** | **ÉLIMINER** | [Gestion de Cache et Stockage Temporaire](#gestion-de-cache-et-stockage-temporaire) |
| **Model Context Protocol** | **ADOPTER** | [API et Communication](#api-et-communication) |
| **Mocha/Chai** | **ÉLIMINER** | [Testing](#testing) |
| **MySQL** | **MAINTENIR** | [Bases de données et ORM](#bases-de-données-et-orm) |
| **n8n** | **DÉPRÉCIER** | [Technologies d'orchestration](#technologies-dorchestration) |
| **NestJS** | **ADOPTER** | [Framework Backend](#framework-backend) |
| **Next.js** | **LIMITER** | [Framework Frontend](#framework-frontend) |
| **NX** | **ADOPTER** | [CI/CD et Gestion de Projet](#cicd-et-gestion-de-projet) |
| **OIDC GitHub Actions** | **ADOPTER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **Ollama** | **ADOPTER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **OpenTelemetry** | **ADOPTER** | [Logging et Monitoring](#logging-et-monitoring) |
| **Playwright** | **ADOPTER** | [Testing](#testing) |
| **PostgreSQL** | **ADOPTER** | [Bases de données et ORM](#bases-de-données-et-orm) |
| **Prisma** | **ADOPTER** | [Bases de données et ORM](#bases-de-données-et-orm) |
| **Prometheus** | **ADOPTER** | [Logging et Monitoring](#logging-et-monitoring) |
| **Pulumi** | **ADOPTER** | [Conteneurisation et Infrastructure as Code](#conteneurisation-et-infrastructure-as-code) |
| **React** | **ADOPTER** | [Framework Frontend](#framework-frontend) |
| **Redis** | **MAINTENIR** | [Gestion de Cache et Stockage Temporaire](#gestion-de-cache-et-stockage-temporaire) |
| **Redis Stack (RedisJSON)** | **ADOPTER** | [Gestion de Cache et Stockage Temporaire](#gestion-de-cache-et-stockage-temporaire) |
| **Remix** | **ADOPTER** | [Framework Frontend](#framework-frontend) |
| **REST API** | **ADOPTER** | [API et Communication](#api-et-communication) |
| **SBOMs Cyclonedx** | **ADOPTER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **Services MCP Tracing** | **STANDARDISER** | [Observabilité IA](#observabilité-ia) |
| **SigStore** | **ADOPTER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **Sigstore** | **ADOPTER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **SLSA** | **ADOPTER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **SOAP** | **ÉLIMINER** | [API et Communication](#api-et-communication) |
| **SQLite** | **LIMITER** | [Bases de données et ORM](#bases-de-données-et-orm) |
| **Syft** | **ADOPTER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **Temporal.io** | **ADOPTER** | [Technologies d'orchestration](#technologies-dorchestration) |
| **Terraform** | **MAINTENIR** | [Conteneurisation et Infrastructure as Code](#conteneurisation-et-infrastructure-as-code) |
| **Testing Library** | **ADOPTER** | [Testing](#testing) |
| **TurboRepo** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **TypeORM** | **MAINTENIR** | [Bases de données et ORM](#bases-de-données-et-orm) |
| **Typebox** | **ADOPTER** | [Validation et Typing](#validation-et-typing) |
| **TypeScript** | **ADOPTER** | [Validation et Typing](#validation-et-typing) |
| **Vault Secrets** | **ADOPTER** | [Sécurité CI/CD et Gestion des Artefacts](#sécurité-cicd-et-gestion-des-artefacts) |
| **WASM** | **ADOPTER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **WasmEdge** | **ADOPTER** | [Intelligence Artificielle et Agents](#intelligence-artificielle-et-agents) |
| **WebAssembly WASI** | **ÉVALUER** | [Technologies émergentes](#technologies-émergentes) |
| **Winston** | **MAINTENIR** | [Logging et Monitoring](#logging-et-monitoring) |
| **Zod** | **ADOPTER** | [Validation et Typing](#validation-et-typing) |