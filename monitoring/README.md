# Solution d'Observabilité avec Prometheus et Grafana

Cette documentation détaille la mise en place d'une solution d'observabilité complète pour surveiller les agents MCP, le pipeline et les performances globales du système.

## Architecture

La solution d'observabilité est composée des éléments suivants :

- **Prometheus** : Collecte et stocke les métriques
- **Grafana** : Visualisation des métriques et création d'alertes
- **Node Exporter** : Collecte des métriques système (CPU, mémoire, disque, réseau)
- **Application Metrics Server** : Expose les métriques spécifiques aux agents et au pipeline

## Démarrage rapide

Pour démarrer la solution de monitoring :

```bash
./monitoring/start-monitoring.sh
```

Une fois démarrés, les services sont accessibles aux URLs suivantes :
- Grafana : http://localhost:3000 (identifiants : admin/mcppassword)
- Prometheus : http://localhost:9090

## Instrumentation de votre code

### Pour les agents

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

### Pour le pipeline

```typescript
import { pipelineProcessingTime, pipelineTasksProcessed, pipelineQueueSize } from './monitoring/metrics';

// Mesurer le temps de traitement d'une étape du pipeline
async function pipelineStep(data) {
  const end = pipelineProcessingTime.startTimer({ pipeline_step: 'step-name' });
  try {
    // Traitement
    const result = await processPipelineStep(data);
    
    // Fin du timer avec succès
    end({ status: 'success' });
    
    // Incrémenter le compteur de tâches traitées
    pipelineTasksProcessed.inc({ pipeline_step: 'step-name', status: 'success' });
    
    return result;
  } catch (error) {
    // Fin du timer avec erreur
    end({ status: 'error' });
    pipelineTasksProcessed.inc({ pipeline_step: 'step-name', status: 'error' });
    throw error;
  }
}

// Mise à jour de la taille d'une file d'attente
function updateQueueSize(queueName, size) {
  pipelineQueueSize.set({ queue_name: queueName }, size);
}
```

## Tableaux de bord disponibles

1. **Agents MCP** : Visualisation des métriques des agents (temps d'exécution, erreurs, etc.)
2. **Pipeline MCP** : Suivi du pipeline (temps de traitement, taille des files d'attente, etc.)
3. **Node Exporter** : Métriques système (CPU, mémoire, disque, réseau)

## Alertes

Des alertes sont configurées pour surveiller :

- L'état des agents (up/down)
- La latence des agents
- Le taux d'erreur des agents
- L'état du pipeline (up/down)
- Le temps de traitement du pipeline
- La taille des files d'attente

## Personnalisation

### Ajouter de nouvelles métriques

1. Modifiez le fichier `monitoring/metrics.ts` pour ajouter de nouvelles métriques
2. Utilisez ces métriques dans votre code
3. Redémarrez le serveur de métriques

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

### Prometheus ne collecte pas les métriques
- Vérifiez que les endpoints `/metrics` sont accessibles
- Vérifiez la configuration dans `monitoring/prometheus/prometheus.yml`
- Consultez les logs avec `docker-compose -f docker-compose.monitoring.yml logs prometheus`

### Grafana ne montre pas de données
- Vérifiez que la source de données Prometheus est correctement configurée
- Vérifiez que Prometheus collecte bien les métriques
- Assurez-vous que les requêtes PromQL sont correctes