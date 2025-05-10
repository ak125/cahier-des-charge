# Guide de migration vers l'architecture à trois couches

*Date : 8 mai 2025*

Ce guide explique comment adapter votre code existant à la nouvelle architecture à trois couches mise en place dans le cadre de la déduplication du projet.

## Table des matières

1. [Introduction](#introduction)
2. [Localisation des agents](#localisation-des-agents)
3. [Mettre à jour les imports](#mettre-à-jour-les-imports)
4. [Adapter votre code](#adapter-votre-code)
5. [Checklist de migration](#checklist-de-migration)
6. [Outils d'aide à la migration](#outils-daide-à-la-migration)

## Introduction

Dans le cadre de notre effort de restructuration et de déduplication, nous avons migré tous les agents vers une architecture à trois couches :

1. **Couche d'orchestration** (`/packages/orchestration`) - Pour les agents qui coordonnent et surveillent l'exécution
2. **Couche de coordination** (`/packages/coordination`) - Pour les agents qui assurent la communication entre systèmes
3. **Couche business** (`/packages/business`) - Pour les agents qui implémentent la logique métier spécifique

Cette migration vous offre des avantages significatifs :
- Code plus organisé et facile à maintenir
- Réduction des duplications
- Interfaces standardisées
- Meilleure séparation des responsabilités

## Localisation des agents

Les chemins des agents ont changé. Voici comment retrouver vos agents :

### Agents d'orchestration

```
/packages/orchestration/
├── monitors/            # Agents de surveillance
├── schedulers/          # Planificateurs de tâches
├── orchestrators/       # Gestionnaires de workflows
└── bridges/             # Ponts d'orchestration
```

### Agents de coordination

```
/packages/coordination/
├── bridges/             # Composants de pont entre systèmes
├── registries/          # Registres d'agents et de services
└── adapters/            # Adaptateurs pour systèmes externes
```

### Agents business

```
/packages/business/
├── analyzers/           # Agents d'analyse
├── generators/          # Agents de génération
├── validators/          # Agents de validation
└── parsers/             # Agents d'analyse syntaxique
```

### Interfaces partagées

Toutes les interfaces sont définies dans :

```
/packages/core/interfaces/
├── base/                # Interfaces de base
├── orchestration/       # Interfaces d'orchestration
├── coordination/        # Interfaces de coordination
└── business/            # Interfaces business
```

## Mettre à jour les imports

La première étape consiste à mettre à jour vos imports. Voici comment procéder :

### Anciennes importations (à remplacer)

```typescript
// ANCIEN : Import direct depuis le répertoire des agents migrés
import { PhpAnalyzerAgent } from '../../packages/migrated-agents/business/php-analyzer-agent';
import { MonitorAgent } from '../../packages/migrated-agents/orchestration/monitor-agent-3a930372';
import { SimpleAdapterAgent } from '../../packages/migrated-agents/coordination/adapter-agent';
```

### Nouvelles importations (à utiliser)

```typescript
// NOUVEAU : Import des interfaces
import { AnalyzerAgent } from '../../packages/core/interfaces/business/analyzer-agent';
import { MonitorAgent } from '../../packages/core/interfaces/orchestration/monitor-agent';
import { AdapterAgent } from '../../packages/core/interfaces/coordination/adapter-agent';

// NOUVEAU : Import des implémentations spécifiques
import { PhpAnalyzerAgent } from '../../packages/business/analyzers/php-analyzer-agent';
import { StandardMonitorAgent } from '../../packages/orchestration/monitors/standard-monitor-agent';
import { SimpleAdapterAgent } from '../../packages/coordination/adapters/simple-adapter-agent';
```

## Adapter votre code

Après avoir mis à jour vos imports, adaptez votre code pour utiliser les interfaces standardisées :

### Avant la migration

```typescript
const phpAnalyzer = new PhpAnalyzerAgent();
await phpAnalyzer.startAnalysis(phpCode, { depth: 'deep' });

// Vérification spécifique à l'implémentation
if (phpAnalyzer.statusCode === 200) {
  // Traitement du résultat
}
```

### Après la migration

```typescript
// Utiliser l'interface plutôt que l'implémentation spécifique
const analyzer: AnalyzerAgent = new PhpAnalyzerAgent();
const result = await analyzer.analyze(phpCode, { depth: 'deep' });

// Utiliser l'interface standardisée
if (result.success) {
  // Traitement du résultat
}
```

## Checklist de migration

Utilisez cette liste pour vérifier votre progression :

- [ ] Identifier tous les agents utilisés dans votre code
- [ ] Mettre à jour tous les imports pour utiliser les nouveaux chemins
- [ ] Adapter les appels de méthodes pour utiliser les interfaces standardisées
- [ ] Mettre à jour les signatures de fonctions pour utiliser les interfaces
- [ ] Mettre à jour les tests unitaires
- [ ] Vérifier que votre code compile sans erreurs
- [ ] Exécuter les tests pour vérifier que tout fonctionne correctement

## Outils d'aide à la migration

Des scripts sont disponibles pour vous aider dans cette migration :

1. **Analyse des imports** : `node tools/scripts/analyze-imports.js your-file.ts`

   Ce script identifie les imports obsolètes dans vos fichiers et suggère des alternatives.

2. **Correction automatique** : `node tools/scripts/fix-imports.js your-file.ts`

   Ce script tente de corriger automatiquement les imports obsolètes.

3. **Vérification de la couverture d'interfaces** : `node tools/scripts/check-interface-compliance.js`

   Ce script vérifie que vos agents respectent bien les interfaces standardisées.

## Demander de l'aide

Si vous avez des difficultés à migrer votre code, n'hésitez pas à contacter l'équipe d'architecture qui pourra vous aider dans cette transition.

---

Cette migration est une étape importante vers un code plus maintenable et évolutif. Merci de votre contribution à cet effort de restructuration !
