---
title: Bonnes Pratiques Agents
description: Architecture à trois couches et structure
slug: bonnes-pratiques-agents
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Guide des bonnes pratiques pour le développement d'agents MCP


Ce document fournit des directives à suivre pour le développement des agents dans le système MCP (Model Context Protocol) afin d'éviter les duplications et assurer une cohérence dans la base de code.

## Principes généraux


1. **Architecture en couches**: Respecter l'architecture à trois couches (orchestration, coordination, business) pour tous les agents.
2. **Modèle de responsabilité unique**: Chaque agent doit avoir une responsabilité unique et clairement définie.
3. **DRY (Don't Repeat Yourself)**: Éviter les duplications de code entre agents.
4. **Extensibilité**: Concevoir les agents pour qu'ils soient facilement extensibles sans modifications massives.

## Structure des fichiers et nommage


### Emplacement des fichiers


```
/packages/
  /mcp-types/                  # Interfaces et types uniquement
    /src/
      layer-contracts.ts       # Interfaces pour les contrats entre couches
      base-agent.ts            # Interface BaseAgent
      ...

  /mcp-core/                   # Classes abstraites de base
    /src/
      /abstracts/
        abstract-base-agent.ts # Classe AbstractBaseAgent

      /coordination/
        /abstract/             # Classes abstraites pour la couche de coordination
          abstract-*.ts

        /adapter/              # Implémentations concrètes d'agents adaptateurs
          *-adapter-agent.ts

        /bridge/               # Implémentations concrètes d'agents pont
          *-bridge-agent.ts

        /registry/             # Implémentations concrètes d'agents de registre
          *-registry-agent.ts

        /mediator/             # Implémentations concrètes d'agents médiateurs
          *-mediator-agent.ts

      /orchestration/          # Structure similaire pour couche d'orchestrationion
        /abstract/
        /orchestrator/
        /monitor/
        ...

      /business/              # Structure similaire pour la couche business
        /abstract/
        /analyzer/
        /generator/
        ...
```

### Conventions de nommage


- **Interfaces**: Nom descriptif au format PascalCase (ex: `AdapterAgent`)
- **Classes abstraites**: Préfixe "Abstract" + nom descriptif au format PascalCase (ex: `AbstractAdapterAgent`)
- **Classes concrètes**: Nom descriptif au format PascalCase sans préfixe/suffixe spéciaux (ex: `JsonToXmlAdapter`)
- **Fichiers**:
  - Interfaces: kebab-case (ex: `adapter-agent.ts`)
  - Classes abstraites: kebab-case avec préfixe "abstract-" (ex: `abstract-adapter-agent.ts`)
  - Classes concrètes: kebab-case descriptif (ex: `json-xml-adapter-agent.ts`)

## Hiérarchie des classes


### Ne jamais court-circuiter la hiérarchie


❌ **INCORRECT**:
```typescript
// Ne PAS implémenter directement l'interface
export class MonAgentAdapter implements AdapterAgent {
  // Implémentation directe, duplique le code
}
```

✅ **CORRECT**:
```typescript
// TOUJOURS étendre la classe abstraite appropriée
export class MonAgentAdapter extends AbstractAdapterAgent {
  // Implémentation des méthodes abstraites uniquement
}
```

### Ne pas créer de nouvelles classes abstraites intermédiaires sans raison


❌ **INCORRECT**:
```typescript
// Ajouter une classe abstraite intermédiaire non nécessaire
export abstract class AbstractCustomAdapter extends AbstractAdapterAgent {
  // Peu de valeur ajoutée
}

export class MonAgentAdapter extends AbstractCustomAdapter {
  // Implémentation
}
```

✅ **CORRECT**:
```typescript
export class MonAgentAdapter extends AbstractAdapterAgent {
  // Implémentation directement à partir de la classe abstraite standard
}
```

## Gestion des imports


### Centralisation des imports


- Toujours importer les interfaces depuis `mcp-types`
- Toujours importer les classes abstraites depuis `mcp-core`

❌ **INCORRECT**:
```typescript
import { AdapterAgent } from '../../some/relative/path/adapter-agent';
```

✅ **CORRECT**:
```typescript
import { AdapterAgent } from 'mcp-types';
import { AbstractAdapterAgent } from '@workspaces/cahier-des-charge/packages/mcp-core/src/coordination/abstract/abstract-adapter-agent';
```

### Éviter les imports circulaires


- Organiser le code pour éviter les dépendances circulaires
- Utiliser des interfaces pour les injections de dépendances

## Documentation et commentaires


### Documentation obligatoire


- Documenter toutes les classes avec commentaires JSDoc (description, paramètres, retours)
- Documenter toutes les méthodes publiques
- Inclure des exemples d'utilisation pour les méthodes complexes

```typescript
/**
- Agent qui adapte les données entre différents formats.
- Prend en charge les conversions JSON, XML et CSV.
 */
export class FormatConverterAdapter extends AbstractAdapterAgent {
  /**
- Convertit les données du format source au format cible
- @param input Les données à convertir
- @param sourceFormat Le format source (json, xml, csv)
- @param targetFormat Le format cible (json, xml, csv)
- @returns Les données converties dans le format cible
- @throws Error si la conversion n'est pas supportée
- * @example
- ```typescript
- const adapter = new FormatConverterAdapter();
- const xmlData = await adapter.adapt({name: "test"}, "json", "xml");
- ```
   */
  async adapt(input: any, sourceFormat: string, targetFormat: string): Promise<any> {
    // Implémentation
  }
}
```

## Tests unitaires


### Tests obligatoires


- Créer des tests unitaires pour chaque nouvel agent
- Tester au minimum :
  - L'initialisation correcte
  - La fonctionnalité principale
  - Les cas d'erreur
  - L'arrêt/nettoyage

```typescript
describe('FormatConverterAdapter', () => {
  let adapter: FormatConverterAdapter;

  beforeEach(() => {
    adapter = new FormatConverterAdapter();
    return adapter.initialize();
  });

  afterEach(() => adapter.shutdown());

  it('should convert JSON to XML correctly', async () => {
    // Test
  });

  it('should handle errors for unsupported formats', async () => {
    // Test
  });
});
```

## Gestion des erreurs


### Centralisation de la gestion des erreurs


- Utiliser les méthodes de gestion d'erreurs fournies par les classes abstraites
- Étendre les types d'erreurs si nécessaire de façon structurée

```typescript
// Utilisation des méthodes de gestion d'erreurs
try {
  const result = await this.performOperation();
  return this.createSuccessResult(result, "Opération réussie");
} catch (error) {
  return this.createErrorResult(error, { operationId: "123" });
}
```typescript

## Gestion d'état


### État des agents


- Placer toutes les propriétés d'état liées au contexte de l'agent dans `this.context`
- Utiliser `this.metadata` pour les informations descriptives
- Ne pas stocker d'état mutable dans des variables de classe si possible

## Intégration de nouveaux agents


### Étapes pour ajouter un nouvel agent


1. **Identifier la couche** (orchestration, coordination, business)
2. **Identifier le type d'agent** spécifique (adapter, bridge, etc.)
3. **Créer la classe** en étendant la classe abstraite appropriée
4. **Implémenter les méthodes abstraites** requises
5. **Ajouter des tests unitaires**
6. **Documenter** la classe et ses méthodes
7. **Enregistrer l'agent** dans le registre approprié

### Ne pas modifier les classes abstraites existantes


Si vous avez besoin de fonctionnalités supplémentaires :
1. Vérifiez d'abord si c'est nécessaire pour tous les agents de ce type
2. Si oui, proposez une modification à l'équipe de l'architecture
3. Si non, implémentez la fonctionnalité uniquement dans votre agent concret

## Considérations de performance


- Implémenter la mise en cache lorsqu'elle est appropriée
- Utiliser des méthodes asynchrones pour les opérations potentiellement longues
- Utiliser le mécanisme de retry pour les opérations susceptibles d'échouer temporairement

## Exemple complet


Voici un exemple complet d'un agent qui suit toutes les bonnes pratiques:

```typescript
import { AgentResult } from 'mcp-types';
import { AbstractAdapterAgent } from '@workspaces/cahier-des-charge/packages/mcp-core/src/coordination/abstract/abstract-adapter-agent';

/**
- Agent adaptateur qui convertit des données entre différents formats.
- Supporte les conversions entre JSON, XML et CSV.
 */
export class DataFormatAdapter extends AbstractAdapterAgent {
  /**
- Crée une nouvelle instance de DataFormatAdapter
   */
  constructor() {
    super(
      'data-format-adapter-001',
      'Data Format Adapter',
      '1.0.0',
      {
        timeout: 30000,
        maxRetries: 3
      }
    );

    this.supportedFormats = ['json', 'xml', 'csv'];
    this.supportedServices = ['format-conversion'];
  }

  /**
- Adapte les données d'un format à un autre
   */
  async adapt(input: any, sourceFormat: string, targetFormat: string): Promise<any> {
    if (!this.supportedFormats.includes(sourceFormat) || !this.supportedFormats.includes(targetFormat)) {
      throw new Error(`Format non supporté: ${sourceFormat} -> ${targetFormat}`);
    }

    // Logique de conversion
    // ...

    return result;
  }

  /**
- Vérifie si la conversion entre les formats est possible
   */
  async checkCompatibility(sourceFormat: string, targetFormat: string): Promise<boolean> {
    return this.supportedFormats.includes(sourceFormat) &&
           this.supportedFormats.includes(targetFormat);
  }

  /**
- Crée un client de service
   */
  protected async createServiceClient(serviceName: string): Promise<any> {
    // Création de client
    // ...

    return client;
  }

  /**
- Initialisation spécifique
   */
  protected async onInitialize(options?: Record<string, any>): Promise<void> {
    // Initialisation
    // ...
  }

  /**
- Nettoyage lors de l'arrêt
   */
  protected async onShutdown(): Promise<void> {
    // Nettoyage
    // ...
  }
}
```

