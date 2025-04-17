# Architecture à Trois Couches pour MCP OS

Ce document présente la stratégie de migration vers une architecture à trois couches pour MCP OS, avec une explication détaillée de la stratégie de consolidation des agents.

## Architecture à Trois Couches

L'architecture à trois couches sépare les responsabilités du système en trois niveaux distincts :

1. **Couche d'Orchestration** : Gestion des workflows, coordination de haut niveau des processus métier et planification des tâches.
2. **Couche de Coordination** : Communication entre les agents, gestion des événements, ponts d'intégration.
3. **Couche Business** : Logique métier spécifique, traitement des données, agents d'analyse et de génération.

### Avantages de l'Architecture à Trois Couches

- Séparation claire des responsabilités
- Meilleure maintenabilité du code
- Évolutivité améliorée
- Réduction des dépendances croisées
- Tests plus simples et plus ciblés

## Structure de Répertoires

La nouvelle structure organise les agents selon leur couche et leur type :

```
src/
├── orchestration/            # Couche d'orchestration
│   ├── orchestrators/        # Orchestrateurs de workflows
│   ├── schedulers/           # Planificateurs de tâches
│   └── monitors/             # Moniteurs d'exécution
├── coordination/             # Couche de coordination
│   ├── bridges/              # Ponts d'intégration
│   ├── adapters/             # Adaptateurs pour services externes
│   └── mediators/            # Médiateurs entre agents
├── business/                 # Couche business
    ├── analyzers/            # Agents d'analyse
    ├── generators/           # Agents de génération
    ├── validators/           # Agents de validation
    └── parsers/              # Agents de parsing
└── core/                     # Éléments partagés et fondamentaux
    ├── interfaces/           # Interfaces des agents par couche
    ├── utils/                # Utilitaires partagés
    └── models/               # Modèles de données communs
```

## Stratégie de Consolidation des Agents

L'audit effectué a révélé la présence de nombreux agents redondants dans notre codebase. Pour migrer vers l'architecture à trois couches, nous avons développé une stratégie de consolidation qui :

1. Identifie les agents redondants
2. Détermine une "source de vérité" pour chaque agent
3. Réorganise les agents dans la structure à trois couches
4. Préserve la compatibilité avec l'existant

### Processus de Consolidation

Pour chaque agent redondant identifié, l'outil :

1. Sélectionne le fichier principal selon des règles de priorité
2. Archive les versions redondantes
3. Crée des liens symboliques pour maintenir la compatibilité
4. Place le fichier principal dans la structure à trois couches

### Règles de Priorisation

Pour déterminer la "source de vérité" parmi les versions redondantes d'un agent, les règles suivantes sont appliquées dans l'ordre :

1. Fichiers dans la structure à trois couches existante
2. Fichiers dans le répertoire `core`
3. Fichiers d'index
4. Fichiers dans le répertoire `shared`
5. Choisir le chemin le plus court et le plus simple

### Classification des Agents

Les agents sont classifiés automatiquement selon leur nom et leur chemin :

- **Couche** : Déterminée par les mots-clés dans le chemin (`orchestrat`, `temporal`, `bridge`, etc.)
- **Type** : Déterminé par le répertoire ou le nom (`analyzer`, `generator`, `validator`, etc.)

## Processus de Migration Complet

La migration vers l'architecture à trois couches se déroule en plusieurs étapes :

### Étape 1 : Audit des Agents Existants

```bash
npx ts-node ./agents/tools/agent-version-auditor.ts --ci-mode
```

Cette commande analyse le code existant et génère :
- Liste des agents redondants
- Score de redondance par agent
- Paires d'agents similaires

### Étape 2 : Consolidation des Agents

Trois approches sont possibles selon vos besoins :

**Simulation (Mode Dry-Run)**
```bash
./scripts/consolidate.sh --dry-run
```

**Consolidation Progressive**
```bash
./scripts/consolidate.sh --quick
```

**Consolidation Ciblée**
```bash
./scripts/consolidate.sh --threshold 3.5
```

### Étape 3 : Génération des Interfaces

```bash
./scripts/generate-interfaces.sh
```

Cette commande génère les interfaces TypeScript pour:
- La couche d'orchestration (Orchestrators, Schedulers, Monitors)
- La couche de coordination (Bridges, Adapters, Mediators)
- La couche business (Analyzers, Generators, Validators, Parsers)
- L'interface BaseAgent commune

### Étape 4 : Adaptation des Agents Existants

Pour adapter un agent existant à l'architecture à trois couches:

1. Identifier sa couche et son type
2. Implémenter l'interface correspondante
3. Placer le fichier au bon emplacement dans la structure

Exemple :
```typescript
// src/business/analyzers/my-analyzer/my-analyzer.ts
import { AnalyzerAgent } from '../../../core/interfaces/business';

export class MyAnalyzer implements AnalyzerAgent {
  id = 'my-analyzer-001';
  name = 'My Custom Analyzer';
  type = 'analyzer';
  version = '1.0.0';
  
  // Implémentation des méthodes requises
  async initialize(options?: Record<string, any>): Promise<void> {
    // ...
  }
  
  isReady(): boolean {
    // ...
  }
  
  async shutdown(): Promise<void> {
    // ...
  }
  
  getMetadata(): Record<string, any> {
    // ...
  }
  
  async analyze(data: any, options?: any): Promise<any> {
    // Logique d'analyse spécifique
  }
  
  async getInsights(analysisId: string): Promise<any[]> {
    // Récupération des insights
  }
}
```

### Étape 5 : Validation et Tests

Après la consolidation et l'adaptation, il est crucial de :

1. Exécuter les tests unitaires pour chaque agent
2. Vérifier les intégrations entre les couches
3. S'assurer que les liens symboliques fonctionnent correctement

## Outils de Migration

### 1. `tools/consolidate-agents.ts`

Outil TypeScript qui implémente la logique de consolidation :
- Analyse du rapport d'audit des agents
- Création de plans de consolidation
- Archivage des fichiers redondants
- Mise en place de liens symboliques
- Organisation selon l'architecture à trois couches

### 2. `scripts/consolidate.sh`

Script shell qui facilite l'utilisation de l'outil de consolidation :
- Interface utilisateur simplifiée
- Options pour différentes stratégies de consolidation
- Génération automatique des rapports nécessaires
- Affichage des statistiques et résumés

### 3. `tools/generate-layer-interfaces.ts`

Outil TypeScript qui génère les interfaces pour l'architecture à trois couches :
- Définition des interfaces par couche et type d'agent
- Documentation complète avec JSDoc
- Spécification des méthodes requises
- Types communs et partagés

### 4. `scripts/generate-interfaces.sh`

Script shell qui facilite la génération des interfaces :
- Interface utilisateur simplifiée
- Vérification des dépendances
- Exemples d'utilisation des interfaces
- Options pour écraser les interfaces existantes

## Guide d'Utilisation des Interfaces

Les interfaces générées fournissent un contrat clair pour chaque type d'agent dans chaque couche :

### Orchestration Layer Interfaces

```typescript
import { OrchestratorAgent } from '../core/interfaces/orchestration';

class MyWorkflowOrchestrator implements OrchestratorAgent {
  // Implémentation obligatoire des méthodes de base
  id = 'workflow-orchestrator-001';
  name = 'Workflow Orchestrator';
  type = 'orchestrator';
  version = '1.0.0';
  
  async initialize() { /* ... */ }
  isReady() { /* ... */ }
  async shutdown() { /* ... */ }
  getMetadata() { /* ... */ }
  
  // Méthodes spécifiques à l'orchestrator
  async startWorkflow(workflowDefinition, input) { /* ... */ }
  async getStatus(workflowId) { /* ... */ }
  async cancelWorkflow(workflowId, reason) { /* ... */ }
}
```

### Coordination Layer Interfaces

```typescript
import { BridgeAgent } from '../core/interfaces/coordination';

class MyIntegrationBridge implements BridgeAgent {
  // Implémentation
}
```

### Business Layer Interfaces

```typescript
import { AnalyzerAgent } from '../core/interfaces/business';

class MyDataAnalyzer implements AnalyzerAgent {
  // Implémentation
}
```

## Bonnes Pratiques pour les Nouveaux Agents

Pour maintenir la cohérence de l'architecture à trois couches, les nouveaux agents doivent :

1. Être placés dans le répertoire correspondant à leur couche et type
2. Respecter les principes de responsabilité unique
3. Implémenter l'interface de leur couche
4. Inclure des tests unitaires
5. Être documentés avec des commentaires JSDoc

## Migration Progressive

La consolidation des agents est la première étape d'une migration plus large vers l'architecture à trois couches. Les étapes suivantes incluent :

1. Refactoring des interfaces d'agents
2. Migration des workflows
3. Mise à jour des imports
4. Tests d'intégration
5. Documentation complète

## Gouvernance

Pour maintenir la qualité et la cohérence de l'architecture à trois couches :

1. Exécuter régulièrement l'auditeur d'agents
2. Maintenir à jour les diagrammes d'architecture
3. Réviser les pull requests pour conformité
4. Former l'équipe aux principes de l'architecture
5. Documenter les décisions d'architecture

## Plan d'Action Recommandé

1. **Semaine 1** : Audit complet et planification
   - Exécuter l'auditeur d'agents
   - Analyser les résultats
   - Définir les priorités

2. **Semaine 2-3** : Consolidation initiale
   - Commencer par les agents les plus redondants
   - Générer les interfaces de base
   - Tests en environnement de développement

3. **Semaine 4-5** : Adaptation et tests
   - Adapter les agents aux interfaces
   - Mettre à jour les imports
   - Tests d'intégration

4. **Semaine 6-8** : Migration complète
   - Consolidation de tous les agents restants
   - Documentation complète
   - Formation de l'équipe