import express from 'express';
import { createServer } from 'http';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { config } from '../config/config';

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1/workflows';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes pour piloter les workflows n8n
app.get('/api/workflows', async (req, res) => {
  try {
    const response = await axios.get(N8N_API_URL, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des workflows:', error);
    res.status(500).json({ error: 'Impossible de récupérer les workflows' });
  }
});

// Route pour obtenir un workflow spécifique
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const response = await axios.get(`${N8N_API_URL}/${req.params.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération du workflow ${req.params.id}:`, error);
    res.status(500).json({ error: `Impossible de récupérer le workflow ${req.params.id}` });
  }
});

// Route pour activer/désactiver un workflow
app.post('/api/workflows/:id/toggle', async (req, res) => {
  try {
    const workflowResponse = await axios.get(`${N8N_API_URL}/${req.params.id}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    
    const workflow = workflowResponse.data;
    const newState = !workflow.active;
    
    await axios.put(`${N8N_API_URL}/${req.params.id}`, 
      { ...workflow, active: newState },
      { headers: { 'X-N8N-API-KEY': N8N_API_KEY } }
    );
    
    res.json({ id: req.params.id, active: newState });
  } catch (error) {
    console.error(`Erreur lors du basculement du workflow ${req.params.id}:`, error);
    res.status(500).json({ error: `Impossible de basculer le workflow ${req.params.id}` });
  }
});

// Route pour exécuter manuellement un workflow
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const response = await axios.post(`${N8N_API_URL}/${req.params.id}/execute`, {}, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de l'exécution du workflow ${req.params.id}:`, error);
    res.status(500).json({ error: `Impossible d'exécuter le workflow ${req.params.id}` });
  }
});

// Route pour obtenir les exécutions récentes d'un workflow
app.get('/api/workflows/:id/executions', async (req, res) => {
  try {
    const response = await axios.get(`${N8N_API_URL}/${req.params.id}/executions`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des exécutions du workflow ${req.params.id}:`, error);
    res.status(500).json({ error: `Impossible de récupérer les exécutions du workflow ${req.params.id}` });
  }
});

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Serveur du dashboard démarré sur le port ${PORT}`);
  console.log(`URL de l'API n8n configurée: ${N8N_API_URL}`);
});

export default app;