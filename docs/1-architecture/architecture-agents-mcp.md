---
title: Architecture Agents Mcp
description: Architecture à trois couches et structure
slug: architecture-agents-mcp
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Architecture des agents MCP

> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) ou Temporal.io (pour les workflows complexes).



Ce document décrit l'architecture des agents du Model Context Protocol (MCP) et leur migration vers une architecture à base de classes abstraites.

## Introduction


Les agents MCP sont des composants spécialisés qui effectuent des tâches spécifiques dans le cadre de l'architecture globale du projet. Ils sont organisés en quatre types principaux :

1. **Analyzers** : Agents d'analyse qui examinent du code ou des données
2. **Validators** : Agents de validation qui vérifient la conformité du code ou des données
3. **Generators** : Agents de génération qui produisent du code ou des données
4. **Orchestrators** : Agents d'orchestration qui coordonnent d'autres agents

Chaque type d'agent hérite maintenant d'une classe abstraite spécifique qui fournit une interface commune et des fonctionnalités de base.

## Cycle de vie des agents


Tous les agents MCP suivent un cycle de vie commun :

1. **Initialisation** (`initialize()`) : Prépare l'agent pour l'exécution
2. **Exécution** (méthode principale spécifique au type d'agent)
3. **Nettoyage** (`cleanup()`) : Libère les ressources utilisées

Les classes abstraites implémentent le modèle Template Method pour standardiser ce cycle de vie :

```typescript
public async initialize(): Promise<void> {
  // Logique commune d'initialisation
  await this.initializeInternal();
  // Mise à jour de l'état après initialisation
}

protected abstract initializeInternal(): Promise<void>;
```typescript

Les classes dérivées doivent implémenter les méthodes "Internal" pour leur logique spécifique.

## Agents de type Analyzer


Les agents de type *Analyzer* sont utilisés pour analyser du code ou des données en profondeur.

Tous ces agents héritent de la classe `AbstractAnalyzerAgent<I, O>` où :
- `I` est le type des données d'entrée
- `O` est le type des données de sortie

La méthode principale à implémenter est :
```typescript
public async analyze(input: I, context?: any): Promise<O>
```typescript

| Agent | Description | Version | Migré |
|-------|-------------|---------|-------|
| DataAgent | *Pas de description disponible* | - | ❌ |
| DataAgent | *Pas de description disponible* | - | ❌ |
| DependencyAgent | *Pas de description disponible* | - | ❌ |
| DependencyAgent | *Pas de description disponible* | - | ❌ |
| php-analyzer-agent | *Pas de description disponible* | - | ✅ |
| PHP Code Analyzer V2 | Analyse approfondie du code PHP pour la migration vers NestJS et Remix | 2.0.0 | ✅ |
| php-analyzer-v2 | *Pas de description disponible* | - | ❌ |
| StructureAgent | *Pas de description disponible* | - | ❌ |
| StructureAgent | *Pas de description disponible* | - | ❌ |
| qa-analyzer | *Pas de description disponible* | - | ❌ |
| qa-analyzer | *Pas de description disponible* | - | ❌ |
| base-analyzer-agent | *Pas de description disponible* | - | ❌ |

**Statistiques de migration:** 2/12 agents migrés (16%)

## Agents de type Validator


Les agents de type *Validator* sont utilisés pour valider la conformité du code ou des données.

Tous ces agents héritent de la classe `AbstractValidatorAgent<I, O>` où :
- `I` est le type des données d'entrée
- `O` est le type des données de sortie

La méthode principale à implémenter est :
```typescript
public async validate(input: I, context?: any): Promise<O>
```typescript

| Agent | Description | Version | Migré |
|-------|-------------|---------|-------|
| dev-checker | *Pas de description disponible* | - | ❌ |
| dev-checker | *Pas de description disponible* | - | ❌ |
| seo-checker-agent | *Pas de description disponible* | - | ❌ |
| base-validator-agent | *Pas de description disponible* | - | ❌ |
| canonical-validator | *Pas de description disponible* | - | ❌ |
| canonical-validator | *Pas de description disponible* | - | ❌ |
| seo-checker-agent | *Pas de description disponible* | - | ❌ |
| seo-checker-agent | *Pas de description disponible* | - | ❌ |

**Statistiques de migration:** 0/8 agents migrés (0%)

## Agents de type Generator


Les agents de type *Generator* sont utilisés pour générer du code ou des données.

Tous ces agents héritent de la classe `AbstractGeneratorAgent<I, O>` où :
- `I` est le type des données d'entrée
- `O` est le type des données de sortie

La méthode principale à implémenter est :
```typescript
public async generate(input: I, context?: any): Promise<O>
```typescript

| Agent | Description | Version | Migré |
|-------|-------------|---------|-------|
| seo-content-enhancer | *Pas de description disponible* | - | ❌ |
| seo-content-enhancer | *Pas de description disponible* | - | ❌ |
| remix-generator | *Pas de description disponible* | - | ❌ |
| caddyfile-generator | *Pas de description disponible* | - | ❌ |
| caddyfile-generator | *Pas de description disponible* | - | ❌ |
| base-generator-agent | *Pas de description disponible* | - | ❌ |
| nestjs-generator | *Pas de description disponible* | - | ❌ |

**Statistiques de migration:** 0/7 agents migrés (0%)

## Agents de type Orchestrator


Les agents de type *Orchestrator* sont utilisés pour coordonner l'exécution d'autres agents.

Tous ces agents héritent de la classe `AbstractOrchestratorAgent<I, O>` où :
- `I` est le type des données d'entrée
- `O` est le type des données de sortie

La méthode principale à implémenter est :
```typescript
public async orchestrate(input: I, context?: any): Promise<O>
```

| Agent | Description | Version | Migré |
|-------|-------------|---------|-------|
| adapter-layer | *Pas de description disponible* | - | ❌ |
| temporal-adapter | *Pas de description disponible* | - | ❌ |
| abstraction-layer | *Pas de description disponible* | - | ❌ |
| temporal-adapter | *Pas de description disponible* | - | ❌ |
| temporal-connector | *Pas de description disponible* | - | ❌ |
| OrchestrationConnector | *Pas de description disponible* | - | ❌ |
| orchestrator-bridge | *Pas de description disponible* | - | ❌ |
| bullmq-connector | *Pas de description disponible* | - | ❌ |
| n8n-connector | *Pas de description disponible* | - | ❌ |
| orchestrator-bridge | *Pas de description disponible* | - | ❌ |
| TemporalConnector | *Pas de description disponible* | - | ❌ |
| bullmq-orchestrator | *Pas de description disponible* | - | ❌ |
| base-orchestrator-agent | *Pas de description disponible* | - | ❌ |

**Statistiques de migration:** 0/13 agents migrés (0%)

## Migration des agents vers l'architecture abstraite


### Utilisation du script de migration


Le script `migrate-agents.sh` permet d'automatiser la migration des agents existants vers la nouvelle architecture abstraite :

```bash
./scripts/migrate-agents.sh --type=analyzer --agent=mon-agent
```

Options disponibles :
- `--type=TYPE` : Type d'agent à migrer (analyzer, validator, generator, orchestrator, all)
- `--agent=NOM` : Nom spécifique d'agent à migrer
- `--dry-run` : Mode simulation sans modification des fichiers
- `--verbose` : Afficher des informations détaillées

### Migration manuelle


Pour adapter manuellement un agent à la nouvelle architecture :

1. **Importez la classe abstraite appropriée** :
   ```typescript
   import { AbstractAnalyzerAgent } from '../abstract-analyzer';
   ```

2. **Faites hériter votre classe** :
   ```typescript
   export class MonAgent extends AbstractAnalyzerAgent<EntreeType, SortieType> {
     // ...
   }
   ```typescript

3. **Remplacez la méthode principale** par la méthode standard du type d'agent.

4. **Implémentez les méthodes du cycle de vie** :
   ```typescript
   protected async initializeInternal(): Promise<void> {
     // Code d'initialisation spécifique
   }

   protected async cleanupInternal(): Promise<void> {
     // Code de nettoyage spécifique
   }
   ```

## Bonnes pratiques


1. **Typez correctement vos entrées/sorties** : Utilisez des interfaces ou des types pour définir clairement les données d'entrée et de sortie de votre agent.

2. **Gérez correctement les ressources** : Initialisez les ressources dans `initializeInternal()` et libérez-les dans `cleanupInternal()`.

3. **Documentez vos agents** : Ajoutez des commentaires JSDoc pour décrire le but de votre agent et ses fonctionnalités.

4. **Ajouter des tests unitaires** : Vérifiez que votre agent fonctionne correctement et maintient la compatibilité avec l'architecture abstraite.

> Document généré automatiquement le 16 avril 2025 à 11:12

