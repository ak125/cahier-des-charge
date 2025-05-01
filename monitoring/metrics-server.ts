import express, { Request, Response } from 'express';
import { getMetrics } from './metrics';

const app = express();
const PORT = process.env.METRICS_PORT || 3001;

// Endpoint pour les métriques Prometheus
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    console.error('Erreur lors de la génération des métriques:', error);
    res.status(500).send('Erreur lors de la génération des métriques');
  }
});

// Endpoint de santé
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur de métriques démarré sur le port ${PORT}`);
});
