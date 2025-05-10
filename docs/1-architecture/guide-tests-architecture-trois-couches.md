---
title: Guide Tests Architecture Trois Couches
description: Architecture à trois couches et structure
slug: guide-tests-architecture-trois-couches
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Guide de mise à jour des tests pour l'architecture à trois couches


*Date : 8 mai 2025*

Ce guide explique comment mettre à jour les tests existants pour qu'ils utilisent les agents consolidés dans notre nouvelle architecture à trois couches.

## Table des matières


1. [Introduction](#introduction)
2. [Structure des imports](#structure-des-imports)
3. [Migration des tests existants](#migration-des-tests-existants)
4. [Bonnes pratiques](#bonnes-pratiques)
5. [Exemples](#exemples)
6. [Modèles de test par couche](#modèles-de-test-par-couche)
7. [Vérification de la couverture](#vérification-de-la-couverture)

## Introduction


Suite à notre restructuration et déduplication du code selon l'architecture à trois couches, les tests existants doivent être mis à jour pour utiliser les nouveaux emplacements des agents. Ce document explique comment adapter vos tests pour la nouvelle structure.

## Structure des imports


La première étape consiste à mettre à jour les imports dans vos tests. Voici comment ils doivent être structurés :

### Ancienne structure (à remplacer)


```typescript
// ❌ Imports obsolètes
import { PhpAnalyzerAgent } from '../../packages/mcp-agents/analyzers/php-analyzer-agent';
import { MonitorAgent } from '../../packages/migrated-agents/orchestration/monitor-agent-3a930372';
```

### Nouvelle structure (à utiliser)


```typescript
// ✅ Nouveaux imports pour les interfaces
import { AnalyzerAgent } from '../../packages/core/interfaces/business/analyzer-agent';
import { MonitorAgent } from '../../packages/core/interfaces/orchestration/monitor-agent';

// ✅ Nouveaux imports pour les implémentations
import { PhpAnalyzerAgent } from '../../packages/business/analyzers/php-analyzer-agent';
import { StandardMonitorAgent } from '../../packages/orchestration/monitors/standard-monitor-agent';
```

## Migration des tests existants


Suivez ces étapes pour migrer vos tests :

1. **Identifier les dépendances** : Analysez les imports dans vos tests pour identifier tous les agents utilisés

2. **Remplacer les imports** : Suivez le modèle ci-dessus pour mettre à jour vos imports

3. **Adapter les initialisations** : Si les constructeurs ont changé, mettez à jour les initialisations d'agents

4. **Mettre à jour les assertions** : Assurez-vous que vos assertions correspondent aux nouvelles interfaces

5. **Mettre à jour les mocks** : Mettez à jour tous les mocks pour refléter les nouvelles structures

## Bonnes pratiques


- **Utiliser les interfaces** : Basez vos tests sur les interfaces plutôt que sur des implémentations spécifiques

```typescript
// ✅ Privilégier l'utilisation des interfaces
function testAnalyzer(analyzer: AnalyzerAgent) {
  // Tests indépendants de l'implémentation
}

// ❌ Éviter de dépendre d'implémentations spécifiques
function testPhpAnalyzer(analyzer: PhpAnalyzerAgent) {
  // Tests trop spécifiques
}
```

- **Créer des factories de test** : Centralisez la création d'instances de test

```typescript
// ✅ Factory de test
export function createTestAnalyzer(): AnalyzerAgent {
  return new PhpAnalyzerAgent();
}
```

- **Utiliser des fixtures** : Créez des données de test réutilisables

## Exemples


### Exemple 1 : Test de fonctionnalité d'agent d'analyse


```typescript
import { AnalyzerAgent } from '../../packages/core/interfaces/business/analyzer-agent';
import { PhpAnalyzerAgent } from '../../packages/business/analyzers/php-analyzer-agent';

describe('PHP Analyzer', () => {
  let analyzer: AnalyzerAgent;

  beforeEach(() => {
    analyzer = new PhpAnalyzerAgent();
    return analyzer.initialize();
  });

  afterEach(async () => {
    await analyzer.shutdown();
  });

  it('should analyze PHP code correctly', async () => {
    const code = `<?php echo "Hello World"; ?>`;
    const result = await analyzer.analyze(code, { type: 'code-snippet' });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('statements');
  });
});
```

### Exemple 2 : Test d'intégration d'orchestrateur


```typescript
import { OrchestratorAgent } from '../../packages/core/interfaces/orchestration/orchestrator-agent';
import { BullMqOrchestratorAgent } from '../../packages/orchestration/orchestrators/bullmq-orchestrator-agent';
import { AnalyzerAgent } from '../../packages/core/interfaces/business/analyzer-agent';
import { PhpAnalyzerAgent } from '../../packages/business/analyzers/php-analyzer-agent';

describe('BullMQ Orchestrator with PHP Analyzer', () => {
  let orchestrator: OrchestratorAgent;
  let analyzer: AnalyzerAgent;

  beforeEach(async () => {
    orchestrator = new BullMqOrchestratorAgent();
    analyzer = new PhpAnalyzerAgent();

    await orchestrator.initialize();
    await analyzer.initialize();
  });

  afterEach(async () => {
    await analyzer.shutdown();
    await orchestrator.shutdown();
  });

  it('should orchestrate analysis workflow', async () => {
    const workflow = {
      name: 'php-analysis',
      steps: [
        {
          agent: analyzer.id,
          action: 'analyze',
          input: {
            code: `<?php echo "Test"; ?>`
          }
        }
      ]
    };

    const result = await orchestrator.orchestrate(workflow, { source: 'test' });
    expect(result.success).toBe(true);
  });
});
```

## Modèles de test par couche


### Tests de la couche d'orchestration


Les tests d'orchestration doivent se concentrer sur la coordination des tâches et la gestion des workflows :

```typescript
import { OrchestratorAgent } from '../../packages/core/interfaces/orchestration/orchestrator-agent';
import { TemporalOrchestratorAgent } from '../../packages/orchestration/orchestrators/temporal-orchestrator-agent';

describe('Temporal Orchestrator', () => {
  // Configuration des tests d'orchestration
});
```

### Tests de lcouche de coordinationon


Les tests de coordination doivent se concentrer sur l'interopérabilité et la communication :

```typescript
import { BridgeAgent } from '../../packages/core/interfaces/coordination/bridge-agent';
import { RestApiBridgeAgent } from '../../packages/coordination/bridges/rest-api-bridge-agent';

describe('REST API Bridge', () => {
  // Configuration des tests de pont (bridge)
});
```

### Tests de la couche Business


Les tests business doivent se concentrer sur la logique métier :

```typescript
import { ValidatorAgent } from '../../packages/core/interfaces/business/validator-agent';
import { SeoValidatorAgent } from '../../packages/business/validators/seo-validator-agent';

describe('SEO Validator', () => {
  // Configuration des tests de validation SEO
});
```

## Vérification de la couverture


Après avoir mis à jour vos tests, vérifiez la couverture pour vous assurer que tous les agents consolidés sont correctement testés :

```bash
npm run test:coverage
```

Assurez-vous que chaque agent consolidé a une couverture de test adéquate, idéalement supérieure à 80%.

---

Pour toute question sur la mise à jour des tests, contactez l'équipe d'architecture.

