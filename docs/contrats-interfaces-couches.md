# Contrats d'Interfaces entre les Couches MCP OS

## Introduction

Ce document détaille les contrats d'interfaces formels entre les trois couches de l'architecture MCP OS:

1. **Couche d'Orchestration**: Gestion des workflows et coordination de haut niveau
2. **Couche de Coordination**: Communication entre agents et gestion des intégrations
3. **Couche Business**: Logique métier et traitement des données

Ces contrats d'interfaces formalisent les interactions autorisées entre les couches et garantissent une séparation claire des responsabilités, apportant plusieurs avantages:

- Découplage clair entre les couches
- Documentation précise des points d'interaction
- Meilleure testabilité des composants
- Réduction des dépendances croisées
- Facilitation de la maintenance et de l'évolution du système

## Structure des Interfaces

Les interfaces sont organisées hiérarchiquement:

1. **Interface de base commune**: `BaseAgent` définissant les comportements minimums de tout agent
2. **Interfaces de couche**: Une interface par couche définissant les comportements spécifiques
3. **Interfaces spécifiques**: Des interfaces pour chaque type d'agent dans une couche

## Règles d'Interaction entre Couches

Le respect des règles suivantes est essentiel pour maintenir la séparation des couches:

### Règles Générales

1. Une couche ne peut communiquer qu'avec la couche immédiatement inférieure
2. Les agents d'une couche doivent implémenter au minimum l'interface de leur couche
3. Tout agent doit implémenter l'interface `BaseAgent`

```
┌─────────────────────┐
│     Orchestration   │
└──────────┬──────────┘
           │ peut appeler
           ▼
┌─────────────────────┐
│     Coordination    │
└──────────┬──────────┘
           │ peut appeler
           ▼
┌─────────────────────┐
│       Business      │
└─────────────────────┘
```

### Règles Spécifiques par Couche

#### Couche d'Orchestration

- Peut appeler des méthodes de la Couche de Coordination
- Ne peut pas appeler directement des méthodes de la Couche Business
- Doit déléguer les opérations métier à la Couche de Coordination

#### Couche de Coordination

- Peut appeler des méthodes de la Couche Business
- Peut recevoir des appels de la Couche d'Orchestration
- Traduit les demandes d'orchestration en opérations business

#### Couche Business

- Ne peut pas appeler de méthodes des couches supérieures
- Est appelée uniquement par la Couche de Coordination
- Se concentre uniquement sur la logique métier spécifique

## Interactions Autorisées entre Couches

| De ↓ Vers → | Orchestration | Coordination | Business |
|-------------|---------------|--------------|----------|
| **Orchestration** | ✓ | ✓ | ✗ |
| **Coordination** | ✗ | ✓ | ✓ |
| **Business** | ✗ | ✗ | ✓ |

## Flux de Communication

### Flux Descendant (Top-Down)

```
[Orchestration] → orchestrate() ou executeSequence()
    ↓
[Coordination] → coordinate() ou adapt()
    ↓
[Business] → process(), analyze(), generate(), etc.
```

### Flux Ascendant (Retour d'Information)

```
[Business] → Résultats sous forme d'objet AgentResult
    ↑
[Coordination] → Transforme/enrichit les résultats et les renvoie
    ↑
[Orchestration] → Reçoit les résultats finaux
```

## Guide d'Implémentation

### Exemple d'Implémentation pour Chaque Couche

#### Agent d'Orchestration (OrchestratorAgent)

```typescript
import { OrchestratorAgent, AgentResult } from 'mcp-types';

export class WorkflowOrchestrator implements OrchestratorAgent {
  id = 'workflow-orchestrator-001';
  name = 'Workflow Orchestrator';
  type = 'orchestrator';
  version = '1.0.0';

  async initialize(options?: Record<string, any>): Promise<void> {
    // Initialisation...
  }

  isReady(): boolean {
    return true;
  }

  async shutdown(): Promise<void> {
    // Nettoyage...
  }

  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  async orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult> {
    // Orchestration du workflow...
    const coordinationAgent = container.get('DataCoordinationAgent');
    return await coordinationAgent.coordinate(
      ['source1', 'source2'],
      ['target1'],
      { workflowData: context.data }
    );
  }

  async reportStatus(workflowId: string, status: 'started' | 'running' | 'completed' | 'failed', metadata?: Record<string, any>): Promise<void> {
    // Rapport de statut...
    console.log(`Workflow ${workflowId} is ${status}`);
  }

  async executeSequence(agents: string[], inputs: Record<string, any>, options?: Record<string, any>): Promise<AgentResult> {
    // Exécution séquentielle des agents...
    let result = { success: true, data: inputs };
    
    for (const agent of agents) {
      // Déléguer à la couche de coordination
      const coordinationAgent = container.get('SequenceCoordinationAgent');
      result = await coordinationAgent.coordinate([agent], ['target'], result.data);
      
      if (!result.success) {
        break;
      }
    }
    
    return result;
  }

  async handleFailure(workflowId: string, errorContext: Record<string, any>): Promise<AgentResult> {
    // Gestion des erreurs...
    return {
      success: false,
      error: errorContext
    };
  }
}
```

#### Agent de Coordination (AdapterAgent)

```typescript
import { AdapterAgent, AgentResult } from 'mcp-types';

export class DataFormatAdapter implements AdapterAgent {
  id = 'data-adapter-001';
  name = 'Data Format Adapter';
  type = 'adapter';
  version = '1.0.0';

  async initialize(options?: Record<string, any>): Promise<void> {
    // Initialisation...
  }

  isReady(): boolean {
    return true;
  }

  async shutdown(): Promise<void> {
    // Nettoyage...
  }

  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  async coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<AgentResult> {
    // Coordination entre les sources et cibles...
    const adaptedData = await this.adapt(data, 'source-format', 'target-format');
    
    // Appel à la couche business
    const businessAgent = container.get('DataProcessingAgent');
    return await businessAgent.process('transform', { data: adaptedData });
  }

  async adapt(input: any, sourceFormat: string, targetFormat: string): Promise<any> {
    // Adaptation des données...
    switch (targetFormat) {
      case 'json':
        return typeof input === 'string' ? JSON.parse(input) : input;
      case 'xml':
        // Conversion en XML...
        return `<root>${JSON.stringify(input)}</root>`;
      default:
        return input;
    }
  }

  async checkCompatibility(sourceFormat: string, targetFormat: string): Promise<boolean> {
    // Vérification de la compatibilité...
    const compatibilityMatrix: Record<string, string[]> = {
      'json': ['xml', 'yaml', 'json'],
      'xml': ['json', 'xml'],
      'yaml': ['json', 'yaml']
    };
    
    return compatibilityMatrix[sourceFormat]?.includes(targetFormat) || false;
  }

  async transformData(data: any, targetFormat: string): Promise<any> {
    // Transformation de données...
    return await this.adapt(data, 'auto-detect', targetFormat);
  }
}
```

#### Agent Business (AnalyzerAgent)

```typescript
import { AnalyzerAgent, AgentResult } from 'mcp-types';

export class DataAnalyzer implements AnalyzerAgent {
  id = 'data-analyzer-001';
  name = 'Data Analyzer';
  type = 'analyzer';
  version = '1.0.0';

  async initialize(options?: Record<string, any>): Promise<void> {
    // Initialisation...
  }

  isReady(): boolean {
    return true;
  }

  async shutdown(): Promise<void> {
    // Nettoyage...
  }

  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  async process(operation: string, context: Record<string, any>): Promise<AgentResult> {
    // Traitement selon l'opération demandée
    switch (operation) {
      case 'analyze':
        return {
          success: true,
          data: await this.analyze(context.data, context.criteria)
        };
      default:
        return {
          success: false,
          error: `Operation '${operation}' not supported`
        };
    }
  }

  async analyze(data: any, criteria: Record<string, any>): Promise<Record<string, any>> {
    // Analyse des données selon les critères...
    const results: Record<string, any> = {};
    
    // Analyse effectuée ici selon les critères spécifiés...
    if (criteria.countItems) {
      results.itemCount = Array.isArray(data) ? data.length : 0;
    }
    
    if (criteria.calculateStats && Array.isArray(data)) {
      const numericValues = data.filter(item => typeof item === 'number');
      results.sum = numericValues.reduce((sum, val) => sum + val, 0);
      results.average = results.sum / numericValues.length || 0;
    }
    
    return results;
  }

  async generateReport(analysisResult: Record<string, any>, format: string): Promise<string> {
    // Génération d'un rapport...
    switch (format) {
      case 'json':
        return JSON.stringify(analysisResult, null, 2);
      case 'text':
        return Object.entries(analysisResult)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      default:
        return JSON.stringify(analysisResult);
    }
  }

  async validateBusinessRules(data: any, rules: Record<string, any>): Promise<boolean> {
    // Validation des règles métier...
    for (const [rule, condition] of Object.entries(rules)) {
      // Implémentation des validations de règles...
    }
    return true;
  }
}
```

## Bonnes Pratiques

### Règles de Design

1. **Principe de responsabilité unique**: Chaque agent ne doit avoir qu'une seule raison de changer.
2. **Découplage**: Limiter les dépendances entre les composants.
3. **Substitution**: Un agent doit pouvoir être remplacé par une autre implémentation de la même interface.
4. **Immutabilité des données**: Éviter de modifier les objets partagés entre les couches.

### Anti-patterns à Éviter

1. ❌ **Court-circuiter les couches**: Appeler directement une couche en sautant les couches intermédiaires.
2. ❌ **Mélanger les responsabilités**: Un agent qui implémente à la fois des fonctionnalités d'orchestration et de business.
3. ❌ **Dépendances circulaires**: Créer des dépendances mutuelles entre agents de différentes couches.
4. ❌ **Non-respect des interfaces**: Implémenter partiellement une interface ou ignorer certaines méthodes requises.

### Patterns Recommandés

1. ✅ **Inversion de contrôle**: Utiliser l'injection de dépendances pour connecter les couches.
2. ✅ **Médiateur**: Utiliser la couche de coordination comme médiateur entre orchestration et business.
3. ✅ **Façade**: Exposer une interface simplifiée pour des opérations complexes.
4. ✅ **Observateur**: Permettre aux couches supérieures de s'abonner aux événements des couches inférieures.

## Tests et Validation

### Tests Unitaires

- Tester chaque agent individuellement en utilisant des mocks pour les dépendances
- Vérifier que chaque agent respecte son contrat d'interface
- Valider les cas limites et les scénarios d'erreur

### Tests d'Intégration

- Tester les interactions entre agents de différentes couches
- Vérifier que les règles d'interaction sont respectées
- Simuler des workflows complets

### Validation de Conformité

Pour vérifier qu'un agent respecte bien son contrat d'interface:

```typescript
import { validateAgent } from '../tools/agent-validator';

// Exemple de validation
const myAgent = new MyBusinessAgent();
const validationResult = validateAgent(myAgent, 'BusinessAgent');

if (validationResult.valid) {
  console.log('Agent conforme à son interface');
} else {
  console.error('Problèmes de conformité:', validationResult.errors);
}
```

## Standardisation des Agents

Pour standardiser les agents selon leur couche, suivez ces directives:

1. Nommage cohérent: `[Type][Fonction]Agent` (ex: AnalyzerTextAgent)
2. Structure de répertoire uniforme selon la couche et le type
3. Documentation précise des interfaces implémentées
4. Tests unitaires obligatoires

## Phase de Migration et Nettoyage

La standardisation des agents et l'adoption des contrats d'interfaces impliquent:

1. **Identification des agents obsolètes**: Les agents qui ne respectent pas les nouvelles interfaces ou dont la fonctionnalité est dupliquée
2. **Plan de migration**: Pour chaque agent non conforme, créer un plan de mise à jour ou de remplacement
3. **Nettoyage progressif**: Supprimer progressivement les agents obsolètes après validation des remplacements

### Tableau de Décision pour Nettoyage des Agents

| Critère | Action recommandée |
|---------|-------------------|
| Agent avec fonctionnalité dupliquée | Fusionner ou supprimer |
| Agent implémentant partiellement l'interface | Compléter ou remplacer |
| Agent mixant des responsabilités de différentes couches | Diviser en agents spécifiques par couche |
| Agent sans tests | Ajouter des tests ou remplacer |
| Agent sans documentation | Documenter ou remplacer |

## Conclusion

Les contrats d'interfaces entre couches fournissent une structure claire et rigide pour organiser les agents dans l'architecture MCP OS. Cette structure favorise:

- Une **meilleure maintenabilité** du système
- Un **développement parallèle** plus efficace
- Une **évolutivité** améliorée
- Des **tests plus fiables**
- Une **documentation plus précise**

L'adoption systématique de ces contrats permettra à terme d'éliminer la dette technique liée aux agents obsolètes ou mal conçus, tout en facilitant l'intégration de nouvelles fonctionnalités.