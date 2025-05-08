# Solution d'Observabilité avec Prometheus, Grafana et OpenTelemetry

Cette documentation détaille la mise en place d'une solution d'observabilité complète pour surveiller les agents MCP, le pipeline et les performances globales du système.

## Architecture

La solution d'observabilité est composée des éléments suivants :

- **Prometheus** : Collecte et stocke les métriques
- **Grafana** : Visualisation des métriques et création d'alertes
- **Node Exporter** : Collecte des métriques système (CPU, mémoire, disque, réseau)
- **Application Metrics Server** : Expose les métriques spécifiques aux agents et au pipeline
- **OpenTelemetry** : Traçage distribué des agents et orchestrateurs
- **Jaeger** : Visualisation des traces distribuées

![Architecture d'observabilité](https://mermaid.ink/img/pako:eNp1kc1uwjAQhF9l5XOQoJQ_kZpLT730XKXHyF4SK8ROvQ6IIt69ToKKKHXPO59nRrZ3UKakQEBGh5SYrwjtlq5sW26Ftal3mN7QO_MSqbKtcFs9oPOUvdGIKWs9YiQfSehLxX3dn4OZCzzfF2KEfsuN6V7xYEUw4h6tMq88aE_J2DQRLs2z2eOFlimbVkfNnX42ukVlJrzU2DuK_tCjoAYjqAYRzW4rpTVFqxOBKDHTn1LC-E1C1KHJorG_dcmLDlqM7WnEzPeAKofej5jdBJ0HQcYB3Wzgxsyo4lWDfKKOmi3IcgVHOmLYg6BdweZ8nKuIZSUPMb0DKdhJu2PJKh__T6tev91wAXJSYqGxdv8l1vgKEv4A1BaYyw?type=png)

## Démarrage rapide

Pour démarrer la solution de monitoring complète avec traçage distribué :

```bash
./monitoring/start-monitoring-otel.sh
```

Une fois démarrés, les services sont accessibles aux URLs suivantes :
- Grafana : http://localhost:3000 (identifiants : admin/mcppassword)
- Prometheus : http://localhost:9090
- Jaeger : http://localhost:16686

Pour démarrer uniquement la partie métriques (sans traçage) :

```bash
./monitoring/start-monitoring.sh
```

## Instrumentation de votre code

### Pour les agents et les métriques

Utilisez les utilitaires fournis dans `monitoring/metrics.ts` :

```typescript
import { measureExecutionTime } from './monitoring/metrics';

// Fonction qui mesure automatiquement le temps d'exécution et gère le comptage des erreurs
async function processTask() {
  return measureExecutionTime('nom-de-agent', async () => {
    // Votre code ici
    return result;
  });
}
```

### Pour le traçage distribué

#### Dans les agents

```typescript
import { AgentTracer } from './monitoring/telemetry';

// Initialisation
AgentTracer.initAgentTracing(this);

// Traçage d'une exécution
return AgentTracer.traceAgentExecution(
  this,
  'nomOperation',
  async () => {
    // Votre code ici
    return result;
  },
  { 'attribut.contexte': 'valeur' }
);
```

#### Dans les orchestrateurs

```typescript
import { OrchestratorTracer } from './monitoring/telemetry';

// Initialisation
OrchestratorTracer.initOrchestratorTracing(this);

// Traçage d'un workflow complet
return OrchestratorTracer.traceWorkflowExecution(
  this,
  workflow,
  async (workflowSpan) => {
    // Exécution du workflow, avec propagation du contexte
    return result;
  }
);
```

## Tableaux de bord disponibles

Les tableaux de bord suivants sont préconfigurés dans Grafana :

1. **Agents Monitoring Dashboard** : Performances et erreurs des agents
2. **Migration Pipeline Dashboard** : Suivi du pipeline de migration
3. **CI/CD Builds Dashboard** : Métriques des builds CI/CD
4. **Traces distribuées** : Visualisation des traces OpenTelemetry

## Alertes

Des règles d'alerte sont préconfigurées pour :

- Erreurs d'exécution des agents
- Durée d'exécution élevée des agents
- Inactivité des agents
- Durée de traitement élevée du pipeline
- Taux d'erreur élevé dans le pipeline
- Files d'attente trop volumineuses

## Personnalisation

### Ajouter de nouvelles métriques

1. Modifiez le fichier `monitoring/metrics.ts` pour ajouter de nouvelles métriques
2. Utilisez ces métriques dans votre code
3. Redémarrez le serveur de métriques

### Configurer le traçage distribué

Consultez la documentation détaillée dans `/monitoring/telemetry/README.md` pour :
- Instrumenter vos agents et orchestrateurs
- Enrichir vos traces avec des attributs pertinents
- Visualiser efficacement les chaînes d'appels

### Créer de nouveaux tableaux de bord

1. Connectez-vous à Grafana (http://localhost:3000)
2. Créez un nouveau tableau de bord
3. Ajoutez des visualisations basées sur les métriques disponibles
4. Enregistrez le tableau de bord

### Configurer de nouvelles alertes

1. Modifiez les fichiers dans `monitoring/prometheus/rules/`
2. Redémarrez Prometheus avec `docker-compose -f docker-compose.monitoring.yml restart prometheus`

## Métriques disponibles

### Métriques des agents
- `agent_execution_time_seconds` : Temps d'exécution des agents
- `agent_executions_total` : Nombre total d'exécutions des agents
- `agent_errors_total` : Nombre total d'erreurs des agents

### Métriques du pipeline
- `pipeline_processing_time_seconds` : Temps de traitement du pipeline
- `pipeline_tasks_processed_total` : Nombre total de tâches traitées par le pipeline
- `pipeline_queue_size` : Taille de la file d'attente du pipeline

## Dépannage

### Problèmes courants avec Prometheus et Grafana
- Vérifiez que les endpoints `/metrics` sont accessibles
- Vérifiez la configuration dans `monitoring/prometheus/prometheus.yml`
- Consultez les logs avec `docker-compose -f docker-compose.monitoring.yml logs prometheus`

### Problèmes avec OpenTelemetry et Jaeger
- Vérifiez que le collecteur OpenTelemetry est démarré (`docker-compose -f docker-compose.monitoring.yml logs otel-collector`)
- Vérifiez que le port 4317 est accessible pour OTLP/gRPC
- Consultez les logs de Jaeger avec `docker-compose -f docker-compose.monitoring.yml logs jaeger`