/**
 * Tableau de bord de suivi pour la migration des workflows n8n
 * 
 * Ce script démarre un serveur web qui affiche un tableau de bord
 * pour suivre la progression de la migration des workflows n8n.
 */

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { program } = require('commander');

// Configuration avec Commander
program
    .option('-p, --port <number>', 'Port pour le serveur web', 3030)
    .option('-d, --data <path>', 'Chemin vers le répertoire de données', './migrations')
    .parse(process.argv);

const options = program.opts();
const PORT = options.port;
const DATA_DIR = path.resolve(process.cwd(), options.data);

// Création de l'application Express
const app = express();

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Créer le répertoire public s'il n'existe pas
fs.ensureDirSync(path.join(__dirname, 'public'));

// Configuration des routes API
app.get('/api/migration-status', async (req, res) => {
    try {
        // Charger les données de classification
        const classificationPath = path.join(DATA_DIR, 'n8n-classification.json');
        const summaryPath = path.join(DATA_DIR, 'n8n-classification-summary.json');
        const migrationStatusPath = path.join(DATA_DIR, 'migration-progress.json');

        let classification = [];
        let summary = {};
        let migrationProgress = {
            workflows: {},
            lastUpdated: '',
            totalMigrated: 0,
            byStatus: {
                pending: 0,
                inProgress: 0,
                completed: 0,
                failed: 0
            },
            byStrategy: {
                bullmq: { total: 0, completed: 0 },
                temporal: { total: 0, completed: 0 },
                api: { total: 0, completed: 0 },
                suppression: { total: 0, completed: 0 }
            }
        };

        // Charger la classification si disponible
        if (await fs.pathExists(classificationPath)) {
            classification = await fs.readJson(classificationPath);
        }

        // Charger le résumé si disponible
        if (await fs.pathExists(summaryPath)) {
            summary = await fs.readJson(summaryPath);
        }

        // Charger le statut de migration si disponible
        if (await fs.pathExists(migrationStatusPath)) {
            migrationProgress = await fs.readJson(migrationStatusPath);
        } else {
            // Initialiser avec les données de classification
            if (classification.length > 0) {
                // Initialiser les statuts de migration à partir de la classification
                classification.forEach(workflow => {
                    migrationProgress.workflows[workflow.id] = {
                        id: workflow.id,
                        name: workflow.name,
                        status: 'pending',
                        targetStrategy: workflow.targetStrategy,
                        priority: workflow.priority,
                        complexity: workflow.complexity,
                        criticality: workflow.criticality,
                        assignedTo: '',
                        startDate: '',
                        completionDate: '',
                        notes: ''
                    };
                });

                // Mettre à jour les compteurs
                migrationProgress.byStatus.pending = classification.length;
                migrationProgress.byStrategy.bullmq.total = summary.byTargetStrategy?.bullmq || 0;
                migrationProgress.byStrategy.temporal.total = summary.byTargetStrategy?.temporal || 0;
                migrationProgress.byStrategy.api.total = summary.byTargetStrategy?.api || 0;
                migrationProgress.byStrategy.suppression.total = summary.byTargetStrategy?.suppression || 0;

                migrationProgress.lastUpdated = new Date().toISOString();

                // Sauvegarder le fichier initialisé
                await fs.writeJson(migrationStatusPath, migrationProgress, { spaces: 2 });
            }
        }

        // Renvoyer les données complètes pour le tableau de bord
        res.json({
            classification,
            summary,
            migrationProgress
        });
    } catch (error) {
        console.error(chalk.red('Erreur lors du chargement des données:'), error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour mettre à jour le statut de migration d'un workflow
app.post('/api/update-workflow-status', async (req, res) => {
    try {
        const { workflowId, status, assignedTo, notes } = req.body;

        if (!workflowId || !status) {
            return res.status(400).json({ error: 'ID de workflow et statut requis' });
        }

        const migrationStatusPath = path.join(DATA_DIR, 'migration-progress.json');

        if (!await fs.pathExists(migrationStatusPath)) {
            return res.status(404).json({ error: 'Données de migration non trouvées' });
        }

        const migrationProgress = await fs.readJson(migrationStatusPath);

        if (!migrationProgress.workflows[workflowId]) {
            return res.status(404).json({ error: 'Workflow non trouvé' });
        }

        // Sauvegarder l'ancien statut pour mettre à jour les compteurs
        const oldStatus = migrationProgress.workflows[workflowId].status;
        const targetStrategy = migrationProgress.workflows[workflowId].targetStrategy;

        // Mettre à jour le workflow
        migrationProgress.workflows[workflowId] = {
            ...migrationProgress.workflows[workflowId],
            status,
            assignedTo: assignedTo || migrationProgress.workflows[workflowId].assignedTo,
            notes: notes || migrationProgress.workflows[workflowId].notes,
            startDate: status === 'inProgress' && oldStatus === 'pending'
                ? new Date().toISOString()
                : migrationProgress.workflows[workflowId].startDate,
            completionDate: (status === 'completed' || status === 'failed') && oldStatus !== status
                ? new Date().toISOString()
                : migrationProgress.workflows[workflowId].completionDate
        };

        // Mettre à jour les compteurs
        if (oldStatus !== status) {
            // Décrémenter l'ancien statut
            if (migrationProgress.byStatus[oldStatus]) {
                migrationProgress.byStatus[oldStatus]--;
            }

            // Incrémenter le nouveau statut
            if (migrationProgress.byStatus[status]) {
                migrationProgress.byStatus[status]++;
            }

            // Mettre à jour les compteurs par stratégie
            if (status === 'completed' && targetStrategy) {
                migrationProgress.byStrategy[targetStrategy].completed++;
                migrationProgress.totalMigrated++;
            }
        }

        migrationProgress.lastUpdated = new Date().toISOString();

        // Sauvegarder les mises à jour
        await fs.writeJson(migrationStatusPath, migrationProgress, { spaces: 2 });

        res.json({ success: true, workflow: migrationProgress.workflows[workflowId] });
    } catch (error) {
        console.error(chalk.red('Erreur lors de la mise à jour du statut:'), error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour générer une page HTML du tableau de bord
app.get('/', (req, res) => {
    const dashboardHTML = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tableau de bord de migration n8n</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body { padding-top: 20px; }
      .progress-card { margin-bottom: 20px; }
      .workflow-list { max-height: 600px; overflow-y: auto; }
      .priority-P1 { background-color: #ffebee; }
      .priority-P2 { background-color: #e3f2fd; }
      .priority-P3 { background-color: #f1f8e9; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="mb-4">Tableau de bord de migration n8n</h1>
      <p id="lastUpdated" class="text-muted"></p>
      
      <div class="row">
        <div class="col-md-6">
          <div class="card progress-card">
            <div class="card-header">Progression globale</div>
            <div class="card-body">
              <div class="progress" style="height: 25px;">
                <div id="progressBar" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <p class="mt-2"><span id="completedCount">0</span> sur <span id="totalCount">0</span> workflows migrés</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card progress-card">
            <div class="card-header">Statuts des workflows</div>
            <div class="card-body">
              <canvas id="statusChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="card progress-card">
            <div class="card-header">Progression par stratégie cible</div>
            <div class="card-body">
              <canvas id="strategyChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card progress-card">
            <div class="card-header">Progression par priorité</div>
            <div class="card-body">
              <canvas id="priorityChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="row align-items-center">
            <div class="col">Liste des workflows</div>
            <div class="col-auto">
              <div class="input-group">
                <input type="text" id="searchInput" class="form-control" placeholder="Rechercher...">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Filtrer</button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="#" data-filter="all">Tous</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><h6 class="dropdown-header">Par statut</h6></li>
                  <li><a class="dropdown-item" href="#" data-filter="status-pending">En attente</a></li>
                  <li><a class="dropdown-item" href="#" data-filter="status-inProgress">En cours</a></li>
                  <li><a class="dropdown-item" href="#" data-filter="status-completed">Complétés</a></li>
                  <li><a class="dropdown-item" href="#" data-filter="status-failed">Échoués</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><h6 class="dropdown-header">Par priorité</h6></li>
                  <li><a class="dropdown-item" href="#" data-filter="priority-P1">P1 (Haute)</a></li>
                  <li><a class="dropdown-item" href="#" data-filter="priority-P2">P2 (Moyenne)</a></li>
                  <li><a class="dropdown-item" href="#" data-filter="priority-P3">P3 (Basse)</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="card-body workflow-list">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Priorité</th>
                  <th>Stratégie</th>
                  <th>Statut</th>
                  <th>Assigné à</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="workflowTable">
                <!-- Les données seront chargées dynamiquement ici -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal pour mettre à jour le statut -->
    <div class="modal fade" id="updateStatusModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Mettre à jour le statut</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="updateStatusForm">
              <input type="hidden" id="workflowId">
              <div class="mb-3">
                <label class="form-label">Workflow:</label>
                <div id="workflowName" class="form-control-plaintext"></div>
              </div>
              <div class="mb-3">
                <label for="statusSelect" class="form-label">Statut:</label>
                <select class="form-select" id="statusSelect" required>
                  <option value="pending">En attente</option>
                  <option value="inProgress">En cours</option>
                  <option value="completed">Complété</option>
                  <option value="failed">Échoué</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="assignedToInput" class="form-label">Assigné à:</label>
                <input type="text" class="form-control" id="assignedToInput">
              </div>
              <div class="mb-3">
                <label for="notesInput" class="form-label">Notes:</label>
                <textarea class="form-control" id="notesInput" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
            <button type="button" class="btn btn-primary" id="saveStatusButton">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // État global
      let migrationData = null;
      let statusChart = null;
      let strategyChart = null;
      let priorityChart = null;
      
      // Charger les données du tableau de bord
      function loadDashboardData() {
        fetch('/api/migration-status')
          .then(response => response.json())
          .then(data => {
            migrationData = data;
            updateDashboard();
          })
          .catch(error => {
            console.error('Erreur lors du chargement des données:', error);
            alert('Erreur lors du chargement des données. Veuillez réessayer.');
          });
      }
      
      // Mettre à jour le tableau de bord avec les nouvelles données
      function updateDashboard() {
        if (!migrationData) return;
        
        const { migrationProgress, summary } = migrationData;
        
        // Mettre à jour les compteurs
        document.getElementById('lastUpdated').textContent = 
          'Dernière mise à jour: ' + new Date(migrationProgress.lastUpdated).toLocaleString();
        
        const total = Object.keys(migrationProgress.workflows).length;
        const completed = migrationProgress.byStatus.completed || 0;
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('progressBar').style.width = progressPercentage + '%';
        document.getElementById('progressBar').setAttribute('aria-valuenow', progressPercentage);
        document.getElementById('progressBar').textContent = progressPercentage + '%';
        
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('totalCount').textContent = total;
        
        // Mettre à jour les graphiques
        updateStatusChart();
        updateStrategyChart();
        updatePriorityChart();
        
        // Mettre à jour la liste des workflows
        updateWorkflowList();
      }
      
      // Mettre à jour le graphique des statuts
      function updateStatusChart() {
        const { migrationProgress } = migrationData;
        
        const statusData = {
          labels: ['En attente', 'En cours', 'Complétés', 'Échoués'],
          datasets: [{
            data: [
              migrationProgress.byStatus.pending || 0,
              migrationProgress.byStatus.inProgress || 0,
              migrationProgress.byStatus.completed || 0,
              migrationProgress.byStatus.failed || 0
            ],
            backgroundColor: [
              '#FFC107', // jaune pour en attente
              '#2196F3', // bleu pour en cours
              '#4CAF50', // vert pour complétés
              '#F44336', // rouge pour échoués
            ]
          }]
        };
        
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        if (statusChart) {
          statusChart.data = statusData;
          statusChart.update();
        } else {
          statusChart = new Chart(ctx, {
            type: 'pie',
            data: statusData,
            options: {
              responsive: true,
              plugins: {
                legend: { position: 'right' }
              }
            }
          });
        }
      }
      
      // Mettre à jour le graphique des stratégies
      function updateStrategyChart() {
        const { migrationProgress } = migrationData;
        
        const strategies = ['bullmq', 'temporal', 'api', 'suppression'];
        const labels = ['BullMQ', 'Temporal', 'API', 'Suppression'];
        const completed = strategies.map(s => migrationProgress.byStrategy[s]?.completed || 0);
        const remaining = strategies.map((s, i) => 
          (migrationProgress.byStrategy[s]?.total || 0) - completed[i]
        );
        
        const data = {
          labels: labels,
          datasets: [
            {
              label: 'Complétés',
              data: completed,
              backgroundColor: '#4CAF50'
            },
            {
              label: 'Restants',
              data: remaining,
              backgroundColor: '#FFC107'
            }
          ]
        };
        
        const ctx = document.getElementById('strategyChart').getContext('2d');
        
        if (strategyChart) {
          strategyChart.data = data;
          strategyChart.update();
        } else {
          strategyChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
              responsive: true,
              scales: {
                x: { stacked: true },
                y: { stacked: true }
              }
            }
          });
        }
      }
      
      // Mettre à jour le graphique des priorités
      function updatePriorityChart() {
        const { migrationProgress } = migrationData;
        
        // Calculer les compteurs de priorité
        const priorityCounts = { P1: 0, P2: 0, P3: 0 };
        const priorityCompleted = { P1: 0, P2: 0, P3: 0 };
        
        Object.values(migrationProgress.workflows).forEach(workflow => {
          const priority = workflow.priority || 'P3';
          priorityCounts[priority]++;
          
          if (workflow.status === 'completed') {
            priorityCompleted[priority]++;
          }
        });
        
        const data = {
          labels: ['P1 (Haute)', 'P2 (Moyenne)', 'P3 (Basse)'],
          datasets: [
            {
              label: 'Complétés',
              data: [priorityCompleted.P1, priorityCompleted.P2, priorityCompleted.P3],
              backgroundColor: '#4CAF50'
            },
            {
              label: 'Total',
              data: [priorityCounts.P1, priorityCounts.P2, priorityCounts.P3],
              backgroundColor: '#2196F3',
              type: 'line'
            }
          ]
        };
        
        const ctx = document.getElementById('priorityChart').getContext('2d');
        
        if (priorityChart) {
          priorityChart.data = data;
          priorityChart.update();
        } else {
          priorityChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
              responsive: true
            }
          });
        }
      }
      
      // Mettre à jour la liste des workflows
      function updateWorkflowList() {
        const { migrationProgress } = migrationData;
        const tableBody = document.getElementById('workflowTable');
        tableBody.innerHTML = '';
        
        const workflows = Object.values(migrationProgress.workflows);
        const searchText = document.getElementById('searchInput').value.toLowerCase();
        
        // Obtenir les filtres actifs
        const activeFilter = document.querySelector('.dropdown-item.active');
        const filterType = activeFilter ? activeFilter.dataset.filter : 'all';
        
        workflows
          .filter(workflow => {
            // Filtrer par texte de recherche
            if (searchText && !workflow.name.toLowerCase().includes(searchText)) {
              return false;
            }
            
            // Appliquer les filtres de catégorie
            if (filterType === 'all') {
              return true;
            } else if (filterType.startsWith('status-')) {
              const status = filterType.replace('status-', '');
              return workflow.status === status;
            } else if (filterType.startsWith('priority-')) {
              const priority = filterType.replace('priority-', '');
              return workflow.priority === priority;
            }
            
            return true;
          })
          .sort((a, b) => {
            // Trier par priorité (P1 en premier)
            const priorityOrder = { P1: 1, P2: 2, P3: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .forEach(workflow => {
            const row = document.createElement('tr');
            row.className = 'priority-' + workflow.priority;
            
            // Status badge style
            let statusBadge = '';
            switch(workflow.status) {
              case 'pending':
                statusBadge = '<span class="badge bg-warning">En attente</span>';
                break;
              case 'inProgress':
                statusBadge = '<span class="badge bg-primary">En cours</span>';
                break;
              case 'completed':
                statusBadge = '<span class="badge bg-success">Complété</span>';
                break;
              case 'failed':
                statusBadge = '<span class="badge bg-danger">Échoué</span>';
                break;
            }
            
            // Target strategy badge style
            let strategyBadge = '';
            switch(workflow.targetStrategy) {
              case 'bullmq':
                strategyBadge = '<span class="badge bg-info">BullMQ</span>';
                break;
              case 'temporal':
                strategyBadge = '<span class="badge bg-secondary">Temporal</span>';
                break;
              case 'api':
                strategyBadge = '<span class="badge bg-dark">API</span>';
                break;
              case 'suppression':
                strategyBadge = '<span class="badge bg-danger">Suppression</span>';
                break;
            }
            
            row.innerHTML = \`
              <td>\${workflow.name}</td>
              <td><span class="badge bg-secondary">P\${workflow.priority}</span></td>
              <td>\${strategyBadge}</td>
              <td>\${statusBadge}</td>
              <td>\${workflow.assignedTo || '-'}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary update-status" 
                  data-workflow-id="\${workflow.id}" 
                  data-workflow-name="\${workflow.name}"
                  data-workflow-status="\${workflow.status}"
                  data-workflow-assigned="\${workflow.assignedTo || ''}"
                  data-workflow-notes="\${workflow.notes || ''}">
                  Mettre à jour
                </button>
              </td>
            \`;
            
            tableBody.appendChild(row);
          });
          
        // Ajouter les événements aux boutons
        document.querySelectorAll('.update-status').forEach(button => {
          button.addEventListener('click', showUpdateStatusModal);
        });
      }
      
      // Afficher la modal de mise à jour de statut
      function showUpdateStatusModal(event) {
        const button = event.currentTarget;
        const modal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
        
        document.getElementById('workflowId').value = button.dataset.workflowId;
        document.getElementById('workflowName').textContent = button.dataset.workflowName;
        document.getElementById('statusSelect').value = button.dataset.workflowStatus;
        document.getElementById('assignedToInput').value = button.dataset.workflowAssigned;
        document.getElementById('notesInput').value = button.dataset.workflowNotes;
        
        modal.show();
      }
      
      // Enregistrer le nouveau statut
      function saveWorkflowStatus() {
        const workflowId = document.getElementById('workflowId').value;
        const status = document.getElementById('statusSelect').value;
        const assignedTo = document.getElementById('assignedToInput').value;
        const notes = document.getElementById('notesInput').value;
        
        fetch('/api/update-workflow-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ workflowId, status, assignedTo, notes })
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Fermer la modal
              bootstrap.Modal.getInstance(document.getElementById('updateStatusModal')).hide();
              
              // Recharger les données
              loadDashboardData();
            } else {
              alert('Erreur: ' + data.error);
            }
          })
          .catch(error => {
            console.error('Erreur lors de la mise à jour:', error);
            alert('Erreur lors de la mise à jour du statut.');
          });
      }
      
      // Filtrer la liste des workflows
      function filterWorkflows(event) {
        event.preventDefault();
        
        // Mettre à jour la classe active
        document.querySelectorAll('.dropdown-item').forEach(item => {
          item.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Mettre à jour la liste
        updateWorkflowList();
      }
      
      // Initialiser le tableau de bord
      document.addEventListener('DOMContentLoaded', function() {
        // Charger les données initiales
        loadDashboardData();
        
        // Configurer les événements de recherche
        document.getElementById('searchInput').addEventListener('input', updateWorkflowList);
        
        // Configurer les événements de filtre
        document.querySelectorAll('[data-filter]').forEach(item => {
          item.addEventListener('click', filterWorkflows);
        });
        
        // Configurer l'événement de sauvegarde du statut
        document.getElementById('saveStatusButton').addEventListener('click', saveWorkflowStatus);
        
        // Actualiser les données toutes les 30 secondes
        setInterval(loadDashboardData, 30000);
      });
    </script>
  </body>
  </html>
  `;

    res.send(dashboardHTML);
});

// Créer le répertoire public et les fichiers statiques si nécessaire
async function createStaticFiles() {
    const publicDir = path.join(__dirname, 'public');
    await fs.ensureDir(publicDir);

    // Créer un fichier README dans le répertoire public
    await fs.writeFile(
        path.join(publicDir, 'README.md'),
        '# Fichiers statiques pour le tableau de bord de migration n8n\n\nCe répertoire contient les fichiers statiques pour le tableau de bord.'
    );
}

// Démarrer le serveur
async function startServer() {
    try {
        // Vérifier que le répertoire de données existe
        if (!await fs.pathExists(DATA_DIR)) {
            console.log(chalk.yellow(`Le répertoire de données ${DATA_DIR} n'existe pas. Création...`));
            await fs.ensureDir(DATA_DIR);
        }

        // Créer les fichiers statiques si nécessaire
        await createStaticFiles();

        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log(chalk.green(`✅ Serveur du tableau de bord démarré sur http://localhost:${PORT}`));
            console.log(chalk.blue('📊 Accédez au tableau de bord en ouvrant cette URL dans votre navigateur'));
        });
    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du démarrage du serveur:'), error);
        process.exit(1);
    }
}

// Exécuter le programme
startServer().catch(console.error);