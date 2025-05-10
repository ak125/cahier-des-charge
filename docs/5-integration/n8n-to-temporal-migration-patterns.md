---
title: N8n To Temporal Migration Patterns
description: Intégration et standards technologiques
slug: n8n-to-temporal-migration-patterns
module: 5-integration
status: stable
lastReviewed: 2025-05-09
---

# Modèles de Migration n8n → Temporal

> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) ou Temporal.io (pour les workflows complexes).



*Document créé le 5 mai 2025*

Ce document présente les modèles et bonnes pratiques identifiés lors de la migration des workflows n8n vers les orchestrateurs standardisés Temporal et BullMQ.

## Structure générale de migration


### Architecture à trois composants


Pour chaque workflow n8n migré vers Temporal, nous recommandons d'utiliser une architecture à trois composants :

1. **Activités** : Fonctions qui remplacent les nœuds individuels du workflow n8n
2. **Workflow** : Orchestration des activités, gestion des erreurs et branchements conditionnels
3. **Client API** : Interface simplifiée pour intégrer le workflow dans les applications existantes

### Équivalences n8n → Temporal


| Concept n8n | Équivalent Temporal | Notes |
|-------------|---------------------|-------|
| Nœuds | Activités | Chaque nœud n8n devient typiquement une activité Temporal |
| Connexions | Enchaînement de code | Les connexions entre nœuds deviennent des appels de fonction séquentiels |
| Conditions | Instructions if/else | Les conditions n8n se traduisent en structures de contrôle standard |
| Variables | Variables locales | Les variables sont maintenues dans le workflow et passées aux activités |
| Déclencheurs | Démarrage de workflow | Les déclencheurs deviennent des points d'entrée API ou des crons |
| Webhook | API REST ou gRPC | Les webhooks sont remplacés par des API traditionnelles |
| Exécution parallèle | Promise.all() | Les exécutions parallèles utilisent les promesses JavaScript |

## Modèles de conversion par type de nœud


### Nœuds de déclenchement


| Nœud n8n | Implémentation Temporal |
|----------|------------------------|
| Schedule Trigger | Utiliser un service de planification externe (ex: cron) qui appelle le workflow |
| Webhook | Créer un endpoint API qui démarre le workflow |
| Manual Trigger | Exposer une API REST pour démarrer le workflow |

### Nœuds d'exécution


| Nœud n8n | Implémentation Temporal |
|----------|------------------------|
| Function | Activité Temporal avec la même logique |
| Execute Command | Activité qui utilise child_process pour exécuter des commandes shell |
| HTTP Request | Activité qui utilise axios ou fetch pour les requêtes HTTP |
| IF | Structure conditionnelle dans le workflow |
| Switch | Structure switch/case dans le workflow |
| Set | Assignation de variables dans le workflow |

### Nœuds de sortie


| Nœud n8n | Implémentation Temporal |
|----------|------------------------|
| Email | Activité qui utilise un service d'email |
| Slack | Activité qui utilise l'API Slack |
| Webhook (sortie) | Activité qui envoie une requête HTTP |

## Bonnes pratiques


### Gestion des erreurs


- Implémenter une gestion d'erreur robuste avec des mécanismes de retry
- Utiliser des timeouts appropriés pour chaque activité
- Journaliser les erreurs de manière détaillée

```typescript
// Exemple de gestion d'erreur robuste
try {
  const result = await activity();
} catch (error) {
  // Journaliser l'erreur
  console.error(`Erreur dans l'activité: ${error.message}`);

  // Déterminer si l'erreur est récupérable
  if (isRecoverable(error)) {
    // Réessayer avec backoff exponentiel
    await retry(() => activity(), {
      initialInterval: '1s',
      maximumAttempts: 3,
    });
  } else {
    // Propager l'erreur
    throw error;
  }
}
```

### Tests


- Créer des tests unitaires pour chaque activité
- Créer des tests d'intégration pour le workflow complet
- Utiliser des mocks pour simuler les dépendances externes

```typescript
// Exemple de test d'activité
test('analyzeSQL fonctionne correctement', async () => {
  // Arranger
  const input = {
    connectionString: 'mysql://test:test@localhost:3306/test',
    outputDir: '/tmp/test'
  };

  // Agir
  const result = await analyzeSQL(input);

  // Affirmer
  expect(result.tables.length).toBeGreaterThan(0);
});
```

### Validation de la migration


- Exécuter les workflows n8n et Temporal en parallèle
- Comparer les résultats pour s'assurer qu'ils sont identiques
- Mesurer les différences de performance

## Exemple de migration : SQL Analyzer & Prisma Builder


### Workflow n8n original


```
Déclencheur (Planifié ou Webhook) → Configuration → Exécution Analyse SQL → Validation → Actions conditionnelles → Notification
```

### Implémentation Temporal


1. **Activités**:
   - `prepareAnalysis`: Configuration et préparation
   - `analyzeSQL`: Exécution de l'analyse
   - `verifyGeneratedFiles`: Validation des résultats
   - `commitFilesToGit`, `createArchive`: Actions post-analyse
   - etc.

2. **Workflow principal**:
   - Orchestration séquentielle des activités
   - Gestion des conditions (succès/échec)
   - Traitement des erreurs

3. **Client API**:
   - Méthodes simplifiées pour les utilisateurs
   - Gestion du statut et des résultats

## Ressources


- [Documentation Temporal](https://docs.temporal.io/)
- [Guide de migration n8n](https://docs.n8n.io/hosting/scaling/)**

