---
title: Architecture Agents Coordination
description: Architecture à trois couches et structure
slug: architecture-agents-coordination
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Architecture des agents MCP (Coordination, Orchestration, Business)


Ce document décrit l'architecture générale des agents (coordination, orchestration, business) dans le système MCP (Model Context Protocol).

## Vue d'ensemble


L'architecture des agents est organisée selon une hiérarchie de classes qui permet une réutilisation maximale du code et une cohérence entre les différentes implémentations. Voici la structure générale :

```
BaseAgent (interface)
    |
    +--> AbstractBaseAgent (classe abstraite)
            |
            +--> AbstractCoordinationAgent (classe abstraite)
            |       |
            |       +--> AbstractAdapterAgent (classe abstraite)
            |       |       |
            |       |       +--> Implémentations concrètes d'agents adaptateurs
            |       |
            |       +--> AbstractBridgeAgent (classe abstraite)
            |       |       |
            |       |       +--> Implémentations concrètes d'agents pont
            |       |
            |       +--> AbstractRegistryAgent (classe abstraite)
            |       |       |
            |       |       +--> Implémentations concrètes d'agents de registre
            |       |
            |       +--> AbstractMediatorAgent (classe abstraite)
            |               |
            |               +--> Implémentations concrètes d'agents médiateurs
            |
            +--> AbstractOrchestrationAgent (classe abstraite)
            |       |
            |       +--> (Implémentations spécifiques à l'orchestration, ex: AbstractWorkflowAgent)
            |               |
            |               +--> Implémentations concrètes d'agents d'orchestration
            |
            +--> AbstractBusinessAgent (classe abstraite)
                    |
                    +--> (Implémentations spécifiques au business, ex: AbstractRuleEngineAgent)
                            |
                            +--> Implémentations concrètes d'agents business
```

## Organisation des packages


L'architecture est organisée dans les packages suivants :

- **mcp-types**: Contient toutes les interfaces et types nécessaires pour définir les contrats entre les différentes couches et composants.
- **mcp-core**: Contient les implémentations abstraites de base qui fournissent les fonctionnalités communes à tous les agents.

La structure des dossiers est la suivante (étendue pour inclure orchestration et business) :

```
/packages/
  /mcp-types/
    /src/
      layer-contracts.ts    # Interfaces pour les contrats entre couches (CoordinationAgent, OrchestrationAgent, BusinessAgent, etc.)
      base-agent.ts         # Interface de base pour tous les agents
      # Optionnel: coordination-agent.ts, orchestration-agent.ts, business-agent.ts si layer-contracts.ts devient trop grand

  /mcp-core/
    /src/
      /abstracts/
        abstract-base-agent.ts  # Classe de base pour tous les agents

      /coordination/
        /abstract/
          abstract-coordination-agent.ts    # Base pour les agents de coordination
          abstract-adapter-agent.ts         # Base pour les agents adaptateurs
          abstract-bridge-agent.ts          # Base pour les agents pont
          abstract-registry-agent.ts        # Base pour les agents de registre
          abstract-mediator-agent.ts        # Base pour les agents médiateurs
        /adapter/    # Implémentations concrètes d'agents adaptateurs
        /bridge/     # Implémentations concrètes d'agents pont
        /registry/   # Implémentations concrètes d'agents de registre
        /mediator/   # Implémentations concrètes d'agents médiateurs

      /orchestration/
        /abstract/
          abstract-orchestration-agent.ts # Base pour les agents d'orchestration
          # ex: abstract-workflow-agent.ts
          # ex: abstract-task-scheduler-agent.ts
        # /workflow/   # Implémentations concrètes (exemple)
        # /scheduler/  # Implémentations concrètes (exemple)

      /business/
        /abstract/
          abstract-business-agent.ts    # Base pour les agents business (logique métier)
          # ex: abstract-rule-engine-agent.ts
          # ex: abstract-data-processor-agent.ts
        # /rules/      # Implémentations concrètes (exemple)
        # /processing/ # Implémentations concrètes (exemple)
```

## Classes abstraites principales


### AbstractBaseAgent


Classe abstraite de base pour tous les agents du système. Elle implémente l'interface `BaseAgent` et fournit :

- Gestion du cycle de vie (initialisation, arrêt)
- Gestion des événements
- Gestion d'état de base
- Méthodes utilitaires pour tous les agents

### AbstractCoordinationAgent


Étend `AbstractBaseAgent` et implémente l'interface `CoordinationAgent`. Ajoute des fonctionnalités spécifiques à la couche de coordination :

- Gestion des services et compatibilités
- Vérification de connexions
- Mécanismes de coordination
- Gestion des erreurs et retries

### Agents spécialisés (Coordination)


#### AbstractAdapterAgent


Agent pour adapter différents formats de données et intégrer des systèmes externes. Fonctionnalités principales :

- Conversion entre formats
- Vérification de compatibilité
- Gestion de clients pour services externes

#### AbstractBridgeAgent


Agent pour établir des ponts entre différents systèmes. Fonctionnalités principales :

- Établissement de connexions entre systèmes
- Transfert de données entre systèmes
- Synchronisation de données

#### AbstractRegistryAgent


Agent pour gérer l'enregistrement et la découverte d'autres agents. Fonctionnalités principales :

- Enregistrement d'agents
- Découverte d'agents selon critères
- Coordination entre agents enregistrés
- Mise en cache et rafraîchissement

#### AbstractMediatorAgent


Agent pour faciliter la communication entre agents. Fonctionnalités principales :

- Enregistrement d'agents
- Communication directe entre agents
- Diffusion de messages
- Coordination multi-agents

### AbstractOrchestrationAgent (Nouvelle section)


Étend `AbstractBaseAgent` et implémente l'interface `OrchestrationAgent` (à définir dans `layer-contracts.ts`). Ajoute des fonctionnalités spécifiques à la couche d'orchestration :

- Gestion de workflows et de séquences de tâches
- Coordination de services multiples
- Gestion de l'état des processus d'orchestration
- Reprise sur erreur et compensation

Des classes abstraites plus spécialisées peuvent en dériver (ex: `AbstractWorkflowAgent`).

### AbstractBusinessAgent (Nouvelle section)


Étend `AbstractBaseAgent` et implémente l'interface `BusinessAgent` (à définir dans `layer-contracts.ts`). Ajoute des fonctionnalités spécifiques à la couche business :

- Implémentation de la logique métier principale
- Interaction avec les sources de données et services externes via des agents de coordination/adaptation
- Prise de décisions basées sur des règles métier
- Validation et transformation de données métier

Des classes abstraites plus spécialisées peuvent en dériver (ex: `AbstractRuleEngineAgent`).

## Comment créer un nouvel agent


Pour créer un nouvel agent (coordination, orchestration, ou business), suivez les étapes suivantes :

1. Identifiez la couche de l'agent (coordination, orchestration, business) et le type d'agent dont vous avez besoin (ex: adaptateur, workflow, moteur de règles).
2. Créez une nouvelle classe qui étend la classe abstraite correspondante
3. Implémentez les méthodes abstraites requises
4. Ajoutez des fonctionnalités spécifiques à votre agent
5. Créez des tests unitaires pour votre agent

### Exemple pour un agent adaptateur


```typescript
import { AbstractAdapterAgent } from '@workspaces/cahier-des-charge/packages/mcp-core/src/coordination/abstract/abstract-adapter-agent';

export class MyCustomAdapter extends AbstractAdapterAgent {
  constructor() {
    super(
      'my-adapter-001',
      'Mon adaptateur personnalisé',
      '1.0.0',
      { timeout: 30000 }
    );

    this.supportedFormats = ['format1', 'format2'];
    this.supportedServices = ['service1', 'service2'];
  }

  async adapt(input: any, sourceFormat: string, targetFormat: string): Promise<any> {
    // Implémentation spécifique pour adapter les données
  }

  async checkCompatibility(sourceFormat: string, targetFormat: string): Promise<boolean> {
    // Vérifier si la conversion est possible
  }

  protected async createServiceClient(serviceName: string): Promise<any> {
    // Créer un client pour le service spécifié
  }

  protected async onInitialize(options?: Record<string, any>): Promise<void> {
    // Initialisation spécifique
  }

  protected async onShutdown(): Promise<void> {
    // Nettoyage spécifique
  }
}
```typescript

## Bonnes pratiques


1. **Utiliser les classes abstraites**: Toujours étendre les classes abstraites appropriées plutôt que d'implémenter directement les interfaces.
2. **Gestion des événements**: Utiliser les mécanismes d'événements fournis par la classe de base pour signaler les changements d'état.
3. **Gestion des erreurs**: Utiliser les méthodes `createSuccessResult` et `createErrorResult` pour des réponses cohérentes.
4. **Retries**: Utiliser `withRetry` pour les opérations qui peuvent échouer de façon transitoire.
5. **Validation des entrées**: Toujours valider les entrées avant de les traiter.
6. **Documentation**: Documenter toutes les méthodes publiques avec des commentaires JSDoc.
7. **Tests**: Créer des tests unitaires pour chaque agent.
8. **Nommage**: Utiliser des noms descriptifs pour les classes et méthodes.

## Considérations de migration


Pour les agents existants (coordination, orchestration, business) qui n'utilisent pas encore cette nouvelle architecture :

1. Identifier la couche et le type d'agent dans l'ancienne structure
2. Créez une nouvelle classe qui étend la classe abstraite correspondante
3. Migrer la logique de l'ancien agent vers la nouvelle classe
4. Mettre à jour tous les imports pour utiliser la nouvelle classe
5. Tester pour s'assurer que le comportement est préservé

## Diagramme de classes (mis à jour)


```
+--------------+     +---------------------+
|  BaseAgent   |<----| AbstractBaseAgent   |
+--------------+     +---------------------+
                          ^   ^   ^
                          |   |   |
  +-----------------------+   |   +--------------------------+
  |                           |                              |
+-------------------------+ +----------------------------+ +-------------------------+
| AbstractCoordinationAgent | | AbstractOrchestrationAgent | | AbstractBusinessAgent   |
+-------------------------+ +----------------------------+ +-------------------------+
  |        |        |         |      (Ex: Abstract-        |      (Ex: Abstract-
  |        |        |         |      WorkflowAgent)        |      RuleEngineAgent)
  |        |        |         +-------------+              +-------------+
  |        |        |                       |                            |
(Implémentations spécifiques à la coordination, voir ci-dessus) (Implémentations concrètes) (Implémentations concrètes)

(Note: Ce diagramme est une simplification pour illustrer les nouvelles branches.
 Les détails des agents de coordination restent comme dans la section "Vue d'ensemble")
```

## Exemples concrets


Pour des exemples concrets d'implémentation, consultez les fichiers suivants :

- SimpleAdapterAgent dans `/packages/migrated-agents/coordination/adapter-agent.ts`
- SimpleBridgeAgent dans `/packages/migrated-agents/coordination/bridge-agent.ts`
- AgentRegistryManager dans `/packages/migrated-agents/coordination/agent-registry.ts`
(Note: Des exemples pour les agents d'orchestration et business devront être ajoutés au fur et à mesure de leur migration.)

