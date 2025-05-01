const express = require('express');
const client = require('prom-client');

// Création du registre et configuration
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Définition de quelques métriques d'exemple (pour démarrage rapide)
const exampleCounter = new client.Counter({
  name: 'example_counter',
  help: "Compteur d'exemple",
  labelNames: ['service'],
});

const exampleGauge = new client.Gauge({
  name: 'example_gauge',
  help: "Gauge d'exemple",
  labelNames: ['service'],
});

// Incrémente le compteur d'exemple et définit une valeur pour le gauge
exampleCounter.inc({ service: 'api' });
exampleGauge.set({ service: 'api' }, 42);

// Enregistrement des métriques
register.registerMetric(exampleCounter);
register.registerMetric(exampleGauge);

const app = express();
const PORT = process.env.METRICS_PORT || 3001;

// Endpoint pour les métriques Prometheus
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    console.error('Erreur lors de la génération des métriques:', error);
    res.status(500).send('Erreur lors de la génération des métriques');
  }
});

// Endpoint de santé
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur de métriques démarré sur le port ${PORT}`);
});
