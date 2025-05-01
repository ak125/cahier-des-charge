#!/usr/bin/env node

/**
 * Tableau de bord unifié qui sert de portail vers tous les tableaux de bord
 * et donne une vue d'ensemble des métriques clés de chaque système
 */

const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { loadConfig } = require('../config/config');
const { storeMetrics, getMetricsHistory, getDailyMetrics } = require('./metrics-history');

// Charger la configuration
const config = loadConfig();
const { DASHBOARD, PATHS } = config;

// Ports des tableaux de bord
const MIGRATION_PORT = DASHBOARD.PORT || 3000;
const AUDIT_PORT = DASHBOARD.AUDIT_PORT || 3002;
const AGENTS_PORT = DASHBOARD.AGENTS_PORT || 3003;
const UNIFIED_PORT = DASHBOARD.UNIFIED_PORT || 3001;

// Configuration du serveur Express
const app = express();

// Servir les fichiers statiques
app.use(express.static(path.join(PATHS.ROOT, 'dashboard', 'unified')));
app.use(express.json());

// État global des tableaux de bord
const dashboardsState = {
  lastUpdated: new Date(),
  migration: { status: 'unknown', metrics: {} },
  audit: { status: 'unknown', metrics: {} },
  agents: { status: 'unknown', metrics: {} },
};

/**
 * Met à jour l'état global des tableaux de bord en interrogeant leurs API
 */
async function updateDashboardsState() {
  try {
    // Vérifier le statut des tableaux de bord
    const checks = [
      checkDashboardStatus('migration', `http://localhost:${MIGRATION_PORT}/api/status`),
      checkDashboardStatus('audit', `http://localhost:${AUDIT_PORT}/api/audit/state`),
      checkDashboardStatus('agents', `http://localhost:${AGENTS_PORT}/api/status`),
    ];

    // Attendre la fin de toutes les vérifications
    await Promise.all(checks);

    // Mettre à jour la date de dernière mise à jour
    dashboardsState.lastUpdated = new Date();

    return dashboardsState;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'état des tableaux de bord: ${error.message}`);
    return dashboardsState;
  }
}

/**
 * Vérifie le statut d'un tableau de bord spécifique
 */
async function checkDashboardStatus(name, url) {
  try {
    const response = await axios.get(url, { timeout: 2000 });

    if (response.status === 200) {
      dashboardsState[name].status = 'online';
      const metrics = extractKeyMetrics(name, response.data);
      dashboardsState[name].metrics = metrics;

      // Stocker les métriques dans l'historique quotidien
      await storeMetrics(name, metrics);
    } else {
      dashboardsState[name].status = 'error';
    }
  } catch (error) {
    dashboardsState[name].status = 'offline';
    console.log(`Tableau de bord ${name} inaccessible: ${error.message}`);
  }
}

/**
 * Extrait les métriques clés de la réponse d'un tableau de bord
 */
function extractKeyMetrics(dashboardName, data) {
  const metrics = {};

  switch (dashboardName) {
    case 'migration':
      if (data.progress && data.progress.global !== undefined) {
        metrics.progress = data.progress.global;
      }
      if (data.metrics) {
        metrics.filesMigrated = data.metrics.filesMigrated;
        metrics.totalFiles = data.metrics.totalFiles;
      }
      if (data.modules) {
        metrics.modules = Object.keys(data.modules).length;
      }
      break;

    case 'audit':
      if (data.metrics) {
        metrics.auditedModules = data.metrics.auditedModules;
        metrics.totalModules = data.metrics.totalModules;
        metrics.avgScore = data.metrics.avgScore;
        metrics.passedModules = data.metrics.passedModules;
        metrics.failedModules = data.metrics.failedModules;
      }
      break;

    case 'agents':
      if (data.progress) {
        metrics.progress = data.progress.global;
      }
      if (data.modules) {
        metrics.modules = Object.keys(data.modules).length;
      }
      metrics.agents = data.agents ? data.agents.length : 0;
      break;
  }

  return metrics;
}

// Routes API
app.get('/api/status', async (_req, res) => {
  try {
    await updateDashboardsState();
    res.json(dashboardsState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer l'historique des métriques
app.get('/api/history/:dashboard', async (req, res) => {
  try {
    const dashboardName = req.params.dashboard;
    const days = parseInt(req.query.days || '30', 10);
    const metrics = req.query.metrics ? req.query.metrics.split(',') : [];

    // Vérifier si le tableau de bord demandé est valide
    if (!['migration', 'audit', 'agents'].includes(dashboardName)) {
      return res.status(400).json({ error: 'Tableau de bord non valide' });
    }

    // Récupérer les métriques agrégées par jour
    const dailyMetrics = await getDailyMetrics(dashboardName, days, metrics);
    res.json(dailyMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer l'historique brut des métriques
app.get('/api/history/:dashboard/raw', async (req, res) => {
  try {
    const dashboardName = req.params.dashboard;
    const days = parseInt(req.query.days || '30', 10);

    // Vérifier si le tableau de bord demandé est valide
    if (!['migration', 'audit', 'agents'].includes(dashboardName)) {
      return res.status(400).json({ error: 'Tableau de bord non valide' });
    }

    // Récupérer l'historique complet
    const history = await getMetricsHistory(dashboardName, days);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route principale pour le dashboard unifié
app.get('/', (_req, res) => {
  // Vérifier s'il existe un fichier HTML statique
  const indexPath = path.join(PATHS.DASHBOARD_DIR, 'unified', 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // Générer une page HTML basique
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tableau de bord unifié</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        header {
          background-color: #2c3e50;
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h1 {
          margin: 0;
          font-size: 24px;
        }
        .refresh-btn {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .refresh-btn:hover {
          background-color: #2980b9;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .dashboard-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .dashboard-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        .dashboard-status {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-online {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .status-offline {
          background-color: #ffebee;
          color: #c62828;
        }
        .status-unknown {
          background-color: #fffde7;
          color: #f9a825;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .metric {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
        }
        .metric-name {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 600;
          margin: 5px 0 0;
        }
        .dashboard-link {
          display: block;
          text-align: center;
          margin-top: 15px;
          padding: 8px;
          background: #f0f0f0;
          color: #333;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        .dashboard-link:hover {
          background: #e0e0e0;
        }
        .info-panel {
          background-color: #e3f2fd;
          padding: 15px;
          border-left: 5px solid #2196F3;
          margin-top: 20px;
          border-radius: 4px;
        }
        .last-updated {
          text-align: right;
          color: #777;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>Tableau de bord unifié - Migration des systèmes</h1>
        <div>
          <a href="/trends" style="margin-right: 10px; color: white; text-decoration: none; padding: 8px 12px; background-color: #e74c3c; border-radius: 4px;">Voir les tendances</a>
          <button id="refresh-btn" class="refresh-btn">Actualiser les données</button>
        </div>
      </header>
      
      <div class="dashboard-grid" id="dashboards-container">
        <!-- Les cartes des tableaux de bord seront insérées ici via JavaScript -->
      </div>
      
      <div class="info-panel">
        <p><strong>Note :</strong> Ce tableau de bord unifié permet d'accéder rapidement à tous les tableaux de bord disponibles et de visualiser leurs métriques clés. Pour des informations plus détaillées, cliquez sur le lien "Accéder" pour chaque tableau de bord.</p>
      </div>
      
      <p class="last-updated">Dernière mise à jour: <span id="last-updated">Chargement...</span></p>
      
      <script>
        // Configuration des tableaux de bord
        const dashboards = [
          { 
            name: 'Migration', 
            description: 'État et progression de la migration du système',
            port: ${MIGRATION_PORT},
            key: 'migration'
          },
          { 
            name: 'Audit', 
            description: 'Audits de qualité et conformité des modules',
            port: ${AUDIT_PORT},
            key: 'audit'
          },
          { 
            name: 'Agents', 
            description: 'Gestion et statut des agents de migration',
            port: ${AGENTS_PORT},
            key: 'agents'
          }
        ];
        
        // Chargement initial des données
        window.addEventListener('DOMContentLoaded', loadDashboardsStatus);
        
        // Event listener pour le bouton d'actualisation
        document.getElementById('refresh-btn').addEventListener('click', loadDashboardsStatus);
        
        // Fonction pour charger le statut des tableaux de bord
        async function loadDashboardsStatus() {
          try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            // Mettre à jour l'interface
            updateDashboardsUI(data);
            
            // Mettre à jour la date de dernière mise à jour
            document.getElementById('last-updated').textContent = new Date(data.lastUpdated).toLocaleString();
          } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
          }
        }
        
        // Fonction pour mettre à jour l'interface utilisateur
        function updateDashboardsUI(data) {
          const container = document.getElementById('dashboards-container');
          container.innerHTML = '';
          
          // Créer une carte pour chaque tableau de bord
          dashboards.forEach(dashboard => {
            const status = data[dashboard.key].status;
            const metrics = data[dashboard.key].metrics;
            
            // Créer le contenu HTML pour les métriques
            let metricsHtml = '<div class="metrics-grid">';
            
            if (dashboard.key === 'migration') {
              metricsHtml += createMetric('Progression', \`\${metrics.progress || 0}%\`);
              metricsHtml += createMetric('Fichiers migrés', metrics.filesMigrated || 0);
              metricsHtml += createMetric('Total fichiers', metrics.totalFiles || 0);
              metricsHtml += createMetric('Modules', metrics.modules || 0);
            } else if (dashboard.key === 'audit') {
              metricsHtml += createMetric('Modules audités', \`\${metrics.auditedModules || 0}/\${metrics.totalModules || 0}\`);
              metricsHtml += createMetric('Score moyen', \`\${metrics.avgScore || 0}/100\`);
              metricsHtml += createMetric('Modules réussis', metrics.passedModules || 0);
              metricsHtml += createMetric('Modules échoués', metrics.failedModules || 0);
            } else if (dashboard.key === 'agents') {
              metricsHtml += createMetric('Progression', \`\${metrics.progress || 0}%\`);
              metricsHtml += createMetric('Modules', metrics.modules || 0);
              metricsHtml += createMetric('Agents', metrics.agents || 0);
            }
            
            metricsHtml += '</div>';
            
            // Créer la carte complète
            const card = document.createElement('div');
            card.className = 'dashboard-card';
            card.innerHTML = \`
              <div class="dashboard-header">
                <h2 class="dashboard-title">\${dashboard.name}</h2>
                <span class="dashboard-status status-\${status}">\${status}</span>
              </div>
              <p>\${dashboard.description}</p>
              \${metricsHtml}
              <a href="http://localhost:\${dashboard.port}" class="dashboard-link" target="_blank">
                Accéder au tableau de bord
              </a>
            \`;
            
            container.appendChild(card);
          });
        }
        
        // Fonction pour créer un élément de métrique
        function createMetric(name, value) {
          return \`
            <div class="metric">
              <p class="metric-name">\${name}</p>
              <p class="metric-value">\${value}</p>
            </div>
          \`;
        }
        
        // Actualiser les données toutes les 30 secondes
        setInterval(loadDashboardsStatus, 30000);
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Route pour la page des tendances
app.get('/trends', (_req, res) => {
  // Générer une page HTML pour visualiser l'historique des métriques
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tendances - Tableau de bord unifié</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            header {
                background-color: #2c3e50;
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            h1 {
                margin: 0;
                font-size: 24px;
            }
            .chart-container {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                margin-bottom: 30px;
            }
            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .chart-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }
            .controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            select, button {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: white;
                font-size: 14px;
            }
            button {
                background-color: #3498db;
                color: white;
                border: none;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            button:hover {
                background-color: #2980b9;
            }
            .back-link {
                display: inline-block;
                padding: 8px 16px;
                background-color: #f0f0f0;
                color: #333;
                text-decoration: none;
                border-radius: 4px;
                margin-bottom: 20px;
                transition: background-color 0.3s;
            }
            .back-link:hover {
                background-color: #e0e0e0;
            }
            .tab-container {
                border-bottom: 1px solid #ddd;
                margin-bottom: 20px;
            }
            .tab {
                display: inline-block;
                padding: 10px 20px;
                cursor: pointer;
                border: 1px solid transparent;
                border-bottom: none;
                margin-bottom: -1px;
                background-color: #f8f9fa;
            }
            .tab.active {
                border-color: #ddd;
                background-color: white;
                border-radius: 4px 4px 0 0;
            }
        </style>
    </head>
    <body>
        <a href="/" class="back-link">← Retour au tableau de bord</a>
        
        <header>
            <h1>Tendances - Évolution des métriques</h1>
        </header>
        
        <div class="controls">
            <div class="control-group">
                <label for="dashboard-select">Tableau de bord</label>
                <select id="dashboard-select">
                    <option value="migration">Migration</option>
                    <option value="audit">Audit</option>
                    <option value="agents">Agents</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="period-select">Période</label>
                <select id="period-select">
                    <option value="7">7 derniers jours</option>
                    <option value="14">14 derniers jours</option>
                    <option value="30" selected>30 derniers jours</option>
                    <option value="90">90 derniers jours</option>
                </select>
            </div>
            
            <div class="control-group">
                <label>&nbsp;</label>
                <button id="update-btn">Actualiser</button>
            </div>
        </div>
        
        <div class="tab-container">
            <div class="tab active" data-tab="trends">Tendances</div>
            <div class="tab" data-tab="comparison">Comparaison</div>
        </div>
        
        <div id="trends-tab">
            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Progression</h2>
                </div>
                <canvas id="progress-chart"></canvas>
            </div>
            
            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Modules</h2>
                </div>
                <canvas id="modules-chart"></canvas>
            </div>
            
            <div id="audit-charts" style="display: none;">
                <div class="chart-container">
                    <div class="chart-header">
                        <h2 class="chart-title">Score d'audit</h2>
                    </div>
                    <canvas id="score-chart"></canvas>
                </div>
            </div>
        </div>
        
        <div id="comparison-tab" style="display: none;">
            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Comparaison des tableaux de bord</h2>
                </div>
                <canvas id="comparison-chart"></canvas>
            </div>
        </div>
        
        <script>
            // Configuration globale des graphiques
            Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
            Chart.defaults.color = '#666';
            
            // Variables globales pour les graphiques
            let progressChart = null;
            let modulesChart = null;
            let scoreChart = null;
            let comparisonChart = null;
            
            // Couleurs pour les graphiques
            const chartColors = {
                progress: 'rgba(52, 152, 219, 0.7)',
                modules: 'rgba(46, 204, 113, 0.7)',
                filesMigrated: 'rgba(155, 89, 182, 0.7)',
                avgScore: 'rgba(230, 126, 34, 0.7)',
                passedModules: 'rgba(39, 174, 96, 0.7)',
                failedModules: 'rgba(231, 76, 60, 0.7)'
            };
            
            // Fonction pour charger les données et mettre à jour les graphiques
            async function loadDataAndUpdateCharts() {
                const dashboard = document.getElementById('dashboard-select').value;
                const period = document.getElementById('period-select').value;
                
                try {
                    // Charger les données
                    const response = await fetch(\`/api/history/\${dashboard}?days=\${period}\`);
                    const data = await response.json();
                    
                    if (data.length === 0) {
                        alert('Aucune donnée disponible pour cette période.');
                        return;
                    }
                    
                    // Mettre à jour les graphiques en fonction du tableau de bord sélectionné
                    updateCharts(dashboard, data);
                    
                    // Afficher ou masquer les graphiques spécifiques à l'audit
                    document.getElementById('audit-charts').style.display = 
                        dashboard === 'audit' ? 'block' : 'none';
                        
                } catch (error) {
                    console.error('Erreur lors du chargement des données:', error);
                    alert('Erreur lors du chargement des données. Veuillez réessayer.');
                }
            }
            
            // Fonction pour mettre à jour les graphiques
            function updateCharts(dashboard, data) {
                // Extraire les dates et les valeurs
                const dates = data.map(entry => entry.date);
                
                // Mettre à jour le graphique de progression
                updateProgressChart(dashboard, dates, data);
                
                // Mettre à jour le graphique des modules
                updateModulesChart(dashboard, dates, data);
                
                // Mettre à jour le graphique de score si c'est le tableau de bord d'audit
                if (dashboard === 'audit') {
                    updateScoreChart(dates, data);
                }
            }
            
            // Fonction pour mettre à jour le graphique de progression
            function updateProgressChart(dashboard, dates, data) {
                const progressData = data.map(entry => entry.progress || 0);
                
                const datasets = [{
                    label: 'Progression (%)',
                    data: progressData,
                    backgroundColor: chartColors.progress,
                    borderColor: chartColors.progress.replace('0.7', '1'),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }];
                
                // Si c'est le tableau de bord de migration, ajouter les fichiers migrés
                if (dashboard === 'migration' && data[0].filesMigrated !== undefined) {
                    const totalFiles = data.map(entry => entry.totalFiles || 0);
                    const filesMigrated = data.map(entry => entry.filesMigrated || 0);
                    
                    // Calculer le pourcentage de fichiers migrés
                    const percentageMigrated = totalFiles.map((total, i) => {
                        return total > 0 ? Math.round((filesMigrated[i] / total) * 100) : 0;
                    });
                    
                    datasets.push({
                        label: 'Fichiers migrés (%)',
                        data: percentageMigrated,
                        backgroundColor: chartColors.filesMigrated,
                        borderColor: chartColors.filesMigrated.replace('0.7', '1'),
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false
                    });
                }
                
                if (progressChart) {
                    progressChart.data.labels = dates;
                    progressChart.data.datasets = datasets;
                    progressChart.update();
                } else {
                    const ctx = document.getElementById('progress-chart').getContext('2d');
                    progressChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: datasets
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    title: {
                                        display: true,
                                        text: 'Progression (%)'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date'
                                    }
                                }
                            }
                        }
                    });
                }
            }
            
            // Fonction pour mettre à jour le graphique des modules
            function updateModulesChart(dashboard, dates, data) {
                const modulesData = data.map(entry => entry.modules || 0);
                
                const datasets = [{
                    label: 'Nombre de modules',
                    data: modulesData,
                    backgroundColor: chartColors.modules,
                    borderColor: chartColors.modules.replace('0.7', '1'),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }];
                
                if (modulesChart) {
                    modulesChart.data.labels = dates;
                    modulesChart.data.datasets = datasets;
                    modulesChart.update();
                } else {
                    const ctx = document.getElementById('modules-chart').getContext('2d');
                    modulesChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: datasets
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Nombre de modules'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date'
                                    }
                                }
                            }
                        }
                    });
                }
            }
            
            // Fonction pour mettre à jour le graphique de score
            function updateScoreChart(dates, data) {
                const avgScoreData = data.map(entry => entry.avgScore || 0);
                const passedModulesData = data.map(entry => entry.passedModules || 0);
                const failedModulesData = data.map(entry => entry.failedModules || 0);
                
                const datasets = [
                    {
                        label: 'Score moyen',
                        data: avgScoreData,
                        backgroundColor: chartColors.avgScore,
                        borderColor: chartColors.avgScore.replace('0.7', '1'),
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Modules réussis',
                        data: passedModulesData,
                        backgroundColor: chartColors.passedModules,
                        borderColor: chartColors.passedModules.replace('0.7', '1'),
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Modules échoués',
                        data: failedModulesData,
                        backgroundColor: chartColors.failedModules,
                        borderColor: chartColors.failedModules.replace('0.7', '1'),
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ];
                
                if (scoreChart) {
                    scoreChart.data.labels = dates;
                    scoreChart.data.datasets = datasets;
                    scoreChart.update();
                } else {
                    const ctx = document.getElementById('score-chart').getContext('2d');
                    scoreChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: datasets
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    position: 'left',
                                    title: {
                                        display: true,
                                        text: 'Score moyen'
                                    }
                                },
                                y1: {
                                    beginAtZero: true,
                                    position: 'right',
                                    grid: {
                                        drawOnChartArea: false,
                                    },
                                    title: {
                                        display: true,
                                        text: 'Nombre de modules'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date'
                                    }
                                }
                            }
                        }
                    });
                }
            }
            
            // Chargement initial des données
            document.addEventListener('DOMContentLoaded', () => {
                // Charger les données initiales
                loadDataAndUpdateCharts();
                
                // Event listener pour le bouton d'actualisation
                document.getElementById('update-btn').addEventListener('click', loadDataAndUpdateCharts);
                
                // Event listener pour le changement de tableau de bord
                document.getElementById('dashboard-select').addEventListener('change', loadDataAndUpdateCharts);
                
                // Event listener pour la gestion des onglets
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        // Désactiver l'onglet actif
                        document.querySelector('.tab.active').classList.remove('active');
                        
                        // Activer l'onglet cliqué
                        tab.classList.add('active');
                        
                        // Afficher le contenu de l'onglet
                        const tabName = tab.getAttribute('data-tab');
                        
                        document.getElementById('trends-tab').style.display = 
                            tabName === 'trends' ? 'block' : 'none';
                            
                        document.getElementById('comparison-tab').style.display = 
                            tabName === 'comparison' ? 'block' : 'none';
                            
                        // Si c'est l'onglet de comparaison, charger les données de comparaison
                        if (tabName === 'comparison') {
                            loadComparisonData();
                        }
                    });
                });
            });
            
            // Fonction pour charger les données de comparaison
            async function loadComparisonData() {
                const period = document.getElementById('period-select').value;
                
                try {
                    // Charger les données pour chaque tableau de bord
                    const dashboards = ['migration', 'audit', 'agents'];
                    const dashboardNames = ['Migration', 'Audit', 'Agents'];
                    
                    // Récupérer uniquement les données de progression
                    const promises = dashboards.map(db => 
                        fetch(\`/api/history/\${db}?days=\${period}&metrics=progress\`)
                            .then(response => response.json())
                    );
                    
                    const results = await Promise.all(promises);
                    
                    // Préparer les données pour le graphique
                    const allDates = new Set();
                    results.forEach(data => {
                        data.forEach(entry => {
                            allDates.add(entry.date);
                        });
                    });
                    
                    // Trier les dates
                    const sortedDates = Array.from(allDates).sort();
                    
                    // Créer les datasets
                    const datasets = dashboards.map((db, index) => {
                        const data = results[index];
                        const dataMap = {};
                        
                        // Créer une map pour un accès facile
                        data.forEach(entry => {
                            dataMap[entry.date] = entry.progress || 0;
                        });
                        
                        // Générer les valeurs pour toutes les dates
                        const values = sortedDates.map(date => dataMap[date] || null);
                        
                        // Générer une couleur basée sur l'index
                        const hue = (index * 120) % 360;
                        const color = \`hsla(\${hue}, 70%, 50%, 0.7)\`;
                        const borderColor = \`hsla(\${hue}, 70%, 50%, 1)\`;
                        
                        return {
                            label: \`\${dashboardNames[index]}\`,
                            data: values,
                            backgroundColor: color,
                            borderColor: borderColor,
                            borderWidth: 2,
                            tension: 0.3,
                            fill: false
                        };
                    });
                    
                    // Mettre à jour ou créer le graphique de comparaison
                    if (comparisonChart) {
                        comparisonChart.data.labels = sortedDates;
                        comparisonChart.data.datasets = datasets;
                        comparisonChart.update();
                    } else {
                        const ctx = document.getElementById('comparison-chart').getContext('2d');
                        comparisonChart = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: sortedDates,
                                datasets: datasets
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        title: {
                                            display: true,
                                            text: 'Progression (%)'
                                        }
                                    },
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Date'
                                        }
                                    }
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des données de comparaison:', error);
                }
            }
        </script>
    </body>
    </html>
    `;

  res.send(html);
});

// Démarrage du serveur
const PORT = UNIFIED_PORT;
app.listen(PORT, () => {
  console.log(chalk.green(`🚀 Tableau de bord unifié démarré sur http://localhost:${PORT}`));
  console.log(chalk.blue('📊 Accédez au portail unifié pour visualiser tous les tableaux de bord'));

  // Mettre à jour l'état initial
  updateDashboardsState().catch((error) => {
    console.error(chalk.red(`Erreur lors de l'initialisation: ${error.message}`));
  });
});

module.exports = {
  updateDashboardsState,
};
