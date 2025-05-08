/**
 * Tableau de bord unifié pour les orchestrateurs
 *
 * Ce module fournit une interface web pour surveiller l'état des tâches
 * dans tous les orchestrateurs (BullMQ, Temporal, n8n).
 */

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter as BullBoardMQAdapter } from '@bull-board/api/bullmqadapter';
import { ExpressAdapter } from '@bull-board/express';
import axios from 'axios';
import { Queue } from 'bullmq';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { OrchestratorType, TaskResult, orchestrationService } from '../orchestrator-adapter';

// Configuration
const DEFAULT_PORT = 3000;
const _N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
const _N8N_API_KEY = process.env.N8N_API_KEY || '';

interface TaskStatusSummary {
  id: string;
  name: string;
  status: string;
  source: OrchestratorType;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  duration?: number;
}

export class UnifiedMonitoringDashboard {
  private app = express();
  private port: number;
  private queues: Map<string, Queue> = new Map();
  private temporalNamespace = 'default';
  private refreshInterval: NodeJS.Timeout | null = null;
  private taskCache: Map<string, TaskStatusSummary> = new Map();

  constructor(port: number = DEFAULT_PORT) {
    this.port = port;
    this.setupExpress();
  }

  private setupExpress() {
    // Configuration Express
    this.app.use(cors());
    this.app.use(express.json());

    // Configurer les routes
    this.setupRoutes();
  }

  private setupRoutes() {
    // Route principale - affiche le tableau de bord
    this.app.get('/', async (_req: Request, res: Response) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tableau de bord d'orchestration unifié</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body { padding: 20px; }
            .status-completed { background-color: #d1e7dd; }
            .status-pending { background-color: #fff3cd; }
            .status-failed { background-color: #f8d7da; }
            .badge { font-size: 0.9em; }
            .badge-bullmq { background-color: #6610f2; }
            .badge-temporal { background-color: #0d6efd; }
            .badge-n8n { background-color: #198754; }
            .refresh-button { margin-bottom: 20px; }
            .task-details { display: none; white-space: pre; background: #f8f9fa; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="mb-4">Tableau de bord d'orchestration unifié</h1>
            
            <div class="row mb-4">
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h5 class="card-title">BullMQ</h5>
                    <p class="card-text">
                      <span class="task-count" id="bullmq-count">0</span> tâches
                    </p>
                    <a href="/bullmq" class="btn btn-sm btn-primary">Dashboard BullMQ</a>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h5 class="card-title">Temporal</h5>
                    <p class="card-text">
                      <span class="task-count" id="temporal-count">0</span> tâches
                    </p>
                    <a href="/temporal" class="btn btn-sm btn-primary">Dashboard Temporal</a>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h5 class="card-title">n8n</h5>
                    <p class="card-text">
                      <span class="task-count" id="n8n-count">0</span> tâches
                    </p>
                    <a href="/n8n" class="btn btn-sm btn-primary">Dashboard n8n</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2>Toutes les tâches</h2>
              <button id="refreshButton" class="btn btn-outline-primary refresh-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
                Rafraîchir
              </button>
            </div>
            
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Durée</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="tasksList">
                <tr>
                  <td colspan="7" class="text-center">Chargement des tâches...</td>
                </tr>
              </tbody>
            </table>
            
            <div class="modal fade" id="taskDetailsModal" tabindex="-1">
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Détails de la tâche</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <dl>
                      <dt>ID</dt>
                      <dd id="detail-id"></dd>
                      <dt>Nom</dt>
                      <dd id="detail-name"></dd>
                      <dt>Source</dt>
                      <dd id="detail-source"></dd>
                      <dt>Statut</dt>
                      <dd id="detail-status"></dd>
                      <dt>Créé le</dt>
                      <dd id="detail-created"></dd>
                      <dt>Mis à jour le</dt>
                      <dd id="detail-updated"></dd>
                      <dt>Démarré le</dt>
                      <dd id="detail-started"></dd>
                      <dt>Terminé le</dt>
                      <dd id="detail-completed"></dd>
                      <dt>Durée</dt>
                      <dd id="detail-duration"></dd>
                    </dl>
                    <h6>Payload</h6>
                    <pre id="detail-payload" class="task-details p-3 bg-light"></pre>
                    <div id="detail-error-container">
                      <h6>Erreur</h6>
                      <pre id="detail-error" class="task-details p-3 bg-light text-danger"></pre>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
          <script>
            // Fonction pour charger les tâches
            async function loadTasks() {
              try {
                const response = await fetch('/api/tasks');
                const tasks = await response.json();
                
                // Mettre à jour les compteurs
                document.getElementById('bullmq-count').textContent = tasks.filter(t => t.source === 'bullmq').length;
                document.getElementById('temporal-count').textContent = tasks.filter(t => t.source === 'temporal').length;
                document.getElementById('n8n-count').textContent = tasks.filter(t => t.source === 'n8n').length;
                
                // Mettre à jour la liste des tâches
                const tableBody = document.getElementById('tasksList');
                tableBody.innerHTML = '';
                
                if (tasks.length === 0) {
                  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Aucune tâche trouvée</td></tr>';
                  return;
                }
                
                tasks.forEach(task => {
                  const row = document.createElement('tr');
                  row.className = 'status-' + task.status.toLowerCase();
                  
                  // Formater la date
                  const createdDate = new Date(task.createdAt);
                  const formattedDate = \`\${createdDate.toLocaleDateString()} \${createdDate.toLocaleTimeString()}\`;
                  
                  // Formater la durée
                  let duration = task.duration ? \`\${task.duration}ms\` : '-';
                  
                  // Badge pour la source
                  const sourceBadge = \`<span class="badge badge-\${task.source}">\${task.source}</span>\`;
                  
                  row.innerHTML = \`
                    <td>\${task.id}</td>
                    <td>\${task.name}</td>
                    <td>\${sourceBadge}</td>
                    <td>\${task.status}</td>
                    <td>\${formattedDate}</td>
                    <td>\${duration}</td>
                    <td>
                      <button class="btn btn-sm btn-info view-details" data-task-id="\${task.id}">Détails</button>
                    </td>
                  \`;
                  
                  tableBody.appendChild(row);
                });
                
                // Ajouter les gestionnaires d'événements aux boutons
                document.querySelectorAll('.view-details').forEach(button => {
                  button.addEventListener('click', async () => {
                    const taskId = button.getAttribute('data-task-id');
                    const response = await fetch(\`/api/tasks/\${taskId}\`);
                    const task = await response.json();
                    
                    // Remplir le modal avec les détails
                    document.getElementById('detail-id').textContent = task.id;
                    document.getElementById('detail-name').textContent = task.name;
                    document.getElementById('detail-source').textContent = task.source;
                    document.getElementById('detail-status').textContent = task.status;
                    document.getElementById('detail-created').textContent = new Date(task.createdAt).toLocaleString();
                    document.getElementById('detail-updated').textContent = new Date(task.updatedAt).toLocaleString();
                    document.getElementById('detail-started').textContent = task.startedAt ? new Date(task.startedAt).toLocaleString() : '-';
                    document.getElementById('detail-completed').textContent = task.completedAt ? new Date(task.completedAt).toLocaleString() : '-';
                    document.getElementById('detail-duration').textContent = task.duration ? \`\${task.duration}ms\` : '-';
                    
                    // Payload (peut être vide)
                    const payloadElement = document.getElementById('detail-payload');
                    payloadElement.textContent = task.payload ? JSON.stringify(task.payload, null, 2) : '{}';
                    payloadElement.style.display = 'block';
                    
                    // Erreur (peut être absente)
                    const errorContainer = document.getElementById('detail-error-container');
                    const errorElement = document.getElementById('detail-error');
                    if (task.error) {
                      errorElement.textContent = task.error;
                      errorContainer.style.display = 'block';
                    } else {
                      errorContainer.style.display = 'none';
                    }
                    
                    // Afficher le modal
                    const modal = new bootstrap.Modal(document.getElementById('taskDetailsModal'));
                    modal.show();
                  });
                });
              } catch (error) {
                console.error('Erreur lors du chargement des tâches:', error);
              }
            }
            
            // Charger les tâches au chargement de la page
            document.addEventListener('DOMContentLoaded', loadTasks);
            
            // Configurer le bouton de rafraîchissement
            document.getElementById('refreshButton').addEventListener('click', loadTasks);
            
            // Rafraîchir automatiquement toutes les 30 secondes
            setInterval(loadTasks, 30000);
          </script>
        </body>
        </html>
      `);
    });

    // API pour obtenir toutes les tâches
    this.app.get('/api/tasks', async (_req: Request, res: Response) => {
      try {
        const allTasks = Array.from(this.taskCache.values());
        res.json(allTasks);
      } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        res.status(500).json({ error: 'Erreur serveur' });
      }
    });

    // API pour obtenir une tâche spécifique
    this.app.get('/api/tasks/:id', async (req: Request, res: Response) => {
      try {
        const taskId = req.params.id;
        const task = this.taskCache.get(taskId);

        if (!task) {
          return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        res.json(task);
      } catch (error) {
        console.error(`Erreur lors de la récupération de la tâche ${req.params.id}:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
      }
    });

    // API pour annuler une tâche
    this.app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
      try {
        const taskId = req.params.id;
        const task = this.taskCache.get(taskId);

        if (!task) {
          return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        const orchestrator = orchestrationService.getOrchestratorByType(task.source);
        if (!orchestrator) {
          return res.status(400).json({ error: `Orchestrateur ${task.source} non disponible` });
        }

        const success = await orchestrator.cancelTask(taskId);

        if (success) {
          task.status = 'cancelled';
          this.taskCache.set(taskId, task);
          res.json({ success: true, message: 'Tâche annulée avec succès' });
        } else {
          res.status(500).json({ error: "Échec de l'annulation de la tâche" });
        }
      } catch (error) {
        console.error(`Erreur lors de l'annulation de la tâche ${req.params.id}:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
      }
    });

    // Redirection vers le tableau de bord BullMQ
    this.app.get('/bullmq', (_req: Request, res: Response) => {
      res.redirect('http://localhost:3020/bullmq/queues');
    });

    // Redirection vers le tableau de bord Temporal
    this.app.get('/temporal', (_req: Request, res: Response) => {
      res.redirect('http://localhost:8088');
    });

    // Redirection vers le tableau de bord n8n
    this.app.get('/n8n', (_req: Request, res: Response) => {
      res.redirect('http://localhost:5678');
    });
  }

  public async start() {
    // Démarrer la mise à jour régulière du cache des tâches
    await this.updateTaskCache();
    this.refreshInterval = setInterval(() => this.updateTaskCache(), 10000);

    // Démarrer le serveur
    return new Promise<void>((resolve) => {
      this.app.listen(this.port, () => {
        console.log(
          `Tableau de bord d'orchestration unifié démarré sur http://localhost:${this.port}`
        );
        resolve();
      });
    });
  }

  public async stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async updateTaskCache() {
    try {
      // Mise à jour du cache BullMQ
      await this.updateBullMQTasks();

      // Mise à jour du cache Temporal
      await this.updateTemporalTasks();

      // Mise à jour du cache n8n
      await this.updateN8nTasks();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache des tâches:', error);
    }
  }

  private async updateBullMQTasks() {
    // Cette méthode serait implémentée pour récupérer les jobs BullMQ
    // et les ajouter au cache avec le format normalisé
    try {
      // Pour une implémentation réelle, nous interrogerions Redis pour obtenir les jobs BullMQ
      // Placeholder pour la démonstration
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tâches BullMQ:', error);
    }
  }

  private async updateTemporalTasks() {
    // Cette méthode serait implémentée pour récupérer les workflows Temporal
    // et les ajouter au cache avec le format normalisé
    try {
      // Pour une implémentation réelle, nous utiliserions le client Temporal
      // pour récupérer les workflows en cours
      // Placeholder pour la démonstration
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tâches Temporal:', error);
    }
  }

  private async updateN8nTasks() {
    // Cette méthode serait implémentée pour récupérer les exécutions n8n
    // et les ajouter au cache avec le format normalisé
    try {
      // Pour une implémentation réelle, nous utiliserions l'API REST n8n
      // Placeholder pour la démonstration
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tâches n8n:', error);
    }
  }

  public registerBullMQQueue(queue: Queue) {
    this.queues.set(queue.name, queue);
  }
}

// Export un singleton pour faciliter l'utilisation dans tout le projet
export const unifiedDashboard = new UnifiedMonitoringDashboard();
