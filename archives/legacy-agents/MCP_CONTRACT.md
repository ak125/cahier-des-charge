# Contrat MCP pour les Agents

Ce document définit les contrats et conventions que tous les agents MCP doivent respecter dans le projet de migration PHP vers NestJS/Remix.

## Structure Standard

Tous les agents doivent hériter de `BaseMcpAgent` et implémenter les propriétés et méthodes suivantes :

- `name`: Nom unique de l'agent (string)
- `version`: Version sémantique (string)
- `description`: Description courte des fonctionnalités (string)
- `execute(context: AgentContext)`: Méthode principale avec contexte standardisé
- `validate(context: AgentContext)`: Validation des entrées

## Interface AgentContext

```typescript
interface AgentContext {
  id: string;                // Identifiant unique pour cette exécution
  sourceFile?: string;       // Chemin du fichier source à analyser/traiter
  targetFile?: string;       // Chemin du fichier cible à générer
  options?: Record<string, any>; // Options spécifiques à l'agent
  workingDir?: string;       // Répertoire de travail pour cette exécution
  manifestFile?: string;     // Fichier manifeste lié à cette exécution
  parentJobId?: string;      // ID du job parent si c'est un sous-job
  timeoutMs?: number;        // Timeout pour l'exécution (défaut: 60000)
  debug?: boolean;           // Mode debug
}
```

## Interface AgentResult

```typescript
interface AgentResult {
  success: boolean;          // Statut de l'exécution
  error?: string;            // Message d'erreur si échec
  data?: Record<string, any>; // Données résultantes
  duration: number;          // Durée d'exécution en ms
  score?: number;            // Score de qualité optionnel (0-100)
  warnings?: string[];       // Avertissements optionnels
  logs?: string[];           // Logs d'exécution
}
```

## Entrées/Sorties

- **Entrées**: Définies via `context` avec schéma JSON clair
- **Sorties**: Objet `AgentResult` avec propriétés standard
- **Fichiers temporaires**: Stockés dans `/tmp/mcp-agents/{agent-name}/{uuid}/`
- **Format de données**: JSON pour les échanges inter-agents

## Cycle de vie d'un Agent

1. **Initialisation**: Chargement des dépendances, préparation des ressources
2. **Validation**: Vérification des entrées via `validate()`
3. **Exécution**: Traitement principal via `execute()`
4. **Reporting**: Production du résultat standardisé
5. **Nettoyage**: Libération des ressources

## Instrumentation

- Toutes les exécutions doivent être tracées avec OpenTelemetry
- Les métriques doivent être exposées via Prometheus
- Utiliser le logger standardisé pour la cohérence

### Métriques Standard

- `agent.execution.count`: Nombre d'exécutions
- `agent.execution.duration`: Durée d'exécution (histogramme)
- `agent.execution.success`: Taux de succès
- `agent.memory.usage`: Utilisation mémoire
- `agent.errors.count`: Nombre d'erreurs

## Gestion des Erreurs

- Utiliser des codes d'erreur standardisés
- Logger les erreurs avec stack trace
- Implémenter la logique de retry avec backoff exponentiel
- Dégrader gracieusement en cas d'échec partiel

## Contrat d'événements

- Publication via EventEmitter central
- Souscription via système centralisé d'événements

### Événements Standard

- `agent:start`: Début d'exécution
- `agent:complete`: Fin d'exécution
- `agent:error`: Erreur d'exécution
- `agent:warning`: Avertissement pendant l'exécution
- `agent:progress`: Progression de l'exécution (0-100)

## Bonnes Pratiques

- **Idempotence**: Une exécution répétée avec les mêmes entrées doit produire le même résultat
- **Isolation**: Chaque agent doit fonctionner indépendamment des autres
- **Observabilité**: Exposer suffisamment de logs et métriques
- **Robustesse**: Gérer gracieusement les entrées invalides et les erreurs
- **Performance**: Optimiser l'utilisation des ressources

## Tests

Chaque agent doit avoir une couverture de tests pour les scénarios suivants :
- Test unitaire des fonctions internes
- Test d'intégration avec entrées/sorties standards
- Test de performance avec profiling
- Test d'erreur avec entrées invalides

## Compatibilité Wasm

Pour les agents compatibles WebAssembly :
- Utiliser interface WASI pour l'I/O
- Respecter la convention de mémoire partagée
- Implémenter des fallbacks pour les fonctionnalités non supportées

## Manifestes

Chaque agent doit être associé à un manifeste déclaratif dans le format suivant :

```json
{
  "name": "agent-name",
  "version": "1.0.0",
  "description": "Description de l'agent",
  "inputs": {
    "requiredInputs": ["sourceFile"],
    "optionalInputs": ["options"]
  },
  "outputs": {
    "data": "Record<string, any>",
    "files": ["outputFile"]
  },
  "runtime": {
    "node": ">=18",
    "wasm": true,
    "memory": "512MB",
    "timeout": 60000
  }
}
```

## Déploiement

Les agents doivent être packagés et déployables de manière autonome :
- Package npm avec dépendances explicites
- Conteneur Docker pour exécution isolée
- Module WASM pour exécution dans le navigateur ou conteneur léger