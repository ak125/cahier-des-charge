# OpenTelemetry pour le traçage distribué des agents et orchestrateurs

Cette documentation explique comment utiliser le système de traçage distribué basé sur OpenTelemetry pour surveiller vos agents et orchestrateurs MCP.

## Architecture

Le système de traçage est composé de :

- **SDK OpenTelemetry** : Instrumenté dans vos agents et orchestrateurs
- **OpenTelemetry Collector** : Collecte et traite les données de traçage
- **Jaeger** : Visualisation des traces distribuées
- **Grafana** : Tableaux de bord intégrés avec Prometheus

## Installation des dépendances

Pour utiliser cette solution, ajoutez les dépendances suivantes à votre projet :

```bash
npm install --save @opentelemetry/sdk-node @opentelemetry/api @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-proto @opentelemetry/exporter-metrics-otlp-proto @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/context-async-hooks
```

## Démarrage du système de traçage

L'infrastructure est déjà configurée dans le fichier `docker-compose.monitoring.yml`. Pour démarrer :

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Après le démarrage, vous pouvez accéder aux interfaces :
- Grafana : http://localhost:3000 (identifiants : admin/mcppassword)
- Jaeger : http://localhost:16686

## Utilisation dans les agents

### 1. Initialisation du traçage

Initialisez le traçage au démarrage de votre agent :

```typescript
import { AgentTracer } from '../monitoring/telemetry';

class MonAgent {
  id: string = 'mon-agent-id';
  name: string = 'Mon Agent';
  
  constructor() {
    AgentTracer.initAgentTracing(this);
  }
}
```

### 2. Traçage des méthodes d'exécution

Enveloppez les méthodes principales d'exécution de votre agent :

```typescript
async executeTask(taskData) {
  return AgentTracer.traceAgentExecution(
    this,
    'executeTask',
    async () => {
      // Votre code d'exécution ici
      const result = await this.processData(taskData);
      return result;
    },
    { 'task.size': taskData.size }
  );
}
```

### 3. Traçage des appels API externes

```typescript
private async callExternalAPI(endpoint, data) {
  return AgentTracer.traceApiCall(
    this,
    'external-service',
    endpoint,
    async () => {
      // Votre code d'appel API ici
      return await fetch(endpoint, { body: JSON.stringify(data) });
    }
  );
}
```

## Utilisation dans les orchestrateurs

### 1. Initialisation du traçage

```typescript
import { OrchestratorTracer } from '../monitoring/telemetry';

class MonOrchestrator {
  id: string = 'mon-orchestrator';
  name: string = 'Mon Orchestrateur';
  
  constructor() {
    OrchestratorTracer.initOrchestratorTracing(this);
  }
}
```

### 2. Traçage d'un workflow complet

```typescript
async executeWorkflow(workflow, params) {
  return OrchestratorTracer.traceWorkflowExecution(
    this,
    workflow,
    async (workflowSpan) => {
      // Exécution des étapes du workflow
      // Le paramètre workflowSpan est le span parent
      
      for (const step of workflow.steps) {
        await this.executeStep(workflow, step, workflowSpan, params);
      }
      
      return { success: true };
    }
  );
}
```

### 3. Traçage des étapes individuelles

```typescript
async executeStep(workflow, step, parentSpan, params) {
  return OrchestratorTracer.traceWorkflowStep(
    this,
    workflow,
    step,
    async () => {
      // Exécution de l'étape
      return await this.invokeAgent(step.agentId, params);
    },
    parentSpan
  );
}
```

## Visualisation des traces

1. Accédez à Jaeger (http://localhost:16686)
2. Sélectionnez votre service dans la liste déroulante
3. Définissez vos critères de recherche
4. Explorez les traces distribuées

## Tableaux de bord Grafana

Un tableau de bord spécial pour les traces distribuées est disponible dans Grafana.
Pour y accéder :

1. Connectez-vous à Grafana (http://localhost:3000)
2. Accédez à Dashboards > MCP > Traces distribuées

## Bonnes pratiques

- Tracez les opérations significatives, mais évitez de surcharger avec des détails non pertinents
- Ajoutez des attributs utiles aux spans pour faciliter le filtrage et l'analyse
- Utilisez des noms d'opérations cohérents pour faciliter l'identification
- Propagez le contexte de traçage entre les services pour maintenir la chaîne de traces

## Exemples

Consultez les fichiers d'exemples pour voir l'intégration en action :
- `/monitoring/telemetry/exemple-agent.ts` : Exemple d'agent instrumenté
- `/monitoring/telemetry/exemple-orchestrateur.ts` : Exemple d'orchestrateur instrumenté