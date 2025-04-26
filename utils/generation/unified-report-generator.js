#!/usr/bin/env node

/**
 * Script unifié pour la génération de rapports
 * Combine les fonctionnalités de plusieurs générateurs de rapports précédents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const projectRoot = path.resolve(__dirname, '../..');
const reportDir = path.join(projectRoot, 'reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(projectRoot, 'logs', `report-generator-${timestamp}.log`);

// Assurer que les répertoires existent
fs.mkdirSync(path.join(projectRoot, 'logs'), { recursive: true });
fs.mkdirSync(reportDir, { recursive: true });

// Logger
function log(message) {
  const logEntry = `[${new Date().toISOString()}] ${message}`;
  console.log(logEntry);
  fs.appendFileSync(logFile, logEntry + '\n');
}

// Générer un rapport simple
function generateSimpleReport(target, options = {}) {
  log(`Génération d'un rapport simple pour ${target}...`);
  
  const reportFile = path.join(reportDir, `${target}-report-${timestamp}.md`);
  
  let content = `# Rapport sur ${target}\n\n`;
  content += `Date: ${new Date().toLocaleString()}\n\n`;
  
  if (target === 'agents') {
    // Liste des agents
    content += '## Liste des agents\n\n';
    const agentsDir = path.join(projectRoot, 'agents');
    
    if (fs.existsSync(agentsDir)) {
      const agents = fs.readdirSync(agentsDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      agents.forEach(agent => {
        content += `- ${agent}\n`;
      });
    } else {
      content += '*Aucun agent trouvé*\n';
    }
  } else if (target === 'workflows') {
    // Liste des workflows
    content += '## Liste des workflows\n\n';
    const workflowsDir = path.join(projectRoot, 'workflows');
    
    if (fs.existsSync(workflowsDir)) {
      const workflows = fs.readdirSync(workflowsDir)
        .filter(file => file.endsWith('.json'));
      
      workflows.forEach(workflow => {
        content += `- ${workflow}\n`;
      });
    } else {
      content += '*Aucun workflow trouvé*\n';
    }
  } else if (target === 'scripts') {
    // Liste des scripts
    content += '## Liste des scripts\n\n';
    const scriptsDir = path.join(projectRoot, 'scripts');
    
    if (fs.existsSync(scriptsDir)) {
      const categories = fs.readdirSync(scriptsDir)
        .filter(item => fs.statSync(path.join(scriptsDir, item)).isDirectory());
      
      categories.forEach(category => {
        content += `### ${category}\n\n`;
        
        const categoryDir = path.join(scriptsDir, category);
        const scripts = fs.readdirSync(categoryDir)
          .filter(file => file.endsWith('.sh') || file.endsWith('.js') || file.endsWith('.ts'));
        
        scripts.forEach(script => {
          content += `- ${script}\n`;
        });
        
        content += '\n';
      });
    } else {
      content += '*Aucun script trouvé*\n';
    }
  }
  
  fs.writeFileSync(reportFile, content);
  log(`✅ Rapport généré : ${reportFile}`);
  
  return reportFile;
}

// Générer un rapport HTML
function generateHTMLReport(target, options = {}) {
  log(`Génération d'un rapport HTML pour ${target}...`);
  
  // Générer d'abord le rapport markdown
  const mdReportFile = generateSimpleReport(target, options);
  const htmlReportFile = mdReportFile.replace('.md', '.html');
  
  // Conversion en HTML
  let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport sur ${target}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    li { margin: 5px 0; }
    .timestamp { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>Rapport sur ${target}</h1>
  <p class="timestamp">Date: ${new Date().toLocaleString()}</p>
`;

  // Convertir le contenu Markdown en HTML basique
  const mdContent = fs.readFileSync(mdReportFile, 'utf8');
  const lines = mdContent.split('\n');
  
  // Ignorer les deux premières lignes (titre et date)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('## ')) {
      htmlContent += `  <h2>${line.substring(3)}</h2>\n`;
    } else if (line.startsWith('### ')) {
      htmlContent += `  <h3>${line.substring(4)}</h3>\n`;
    } else if (line.startsWith('- ')) {
      htmlContent += `  <ul>\n    <li>${line.substring(2)}</li>\n  </ul>\n`;
    } else if (line !== '') {
      htmlContent += `  <p>${line}</p>\n`;
    }
  }
  
  htmlContent += `</body>
</html>`;

  fs.writeFileSync(htmlReportFile, htmlContent);
  log(`✅ Rapport HTML généré : ${htmlReportFile}`);
  
  return htmlReportFile;
}

// Générer un rapport interactif
function generateInteractiveReport(target, options = {}) {
  log(`Génération d'un rapport interactif pour ${target}...`);
  
  const interactiveReportFile = path.join(reportDir, `${target}-interactive-${timestamp}.html`);
  
  // Contenu de base
  let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport interactif - ${target}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .filters { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
    .filters input, .filters select { padding: 8px; margin-right: 10px; }
    .filters button { padding: 8px 15px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .filters button:hover { background: #0052a3; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .hidden { display: none; }
    .timestamp { color: #666; font-style: italic; }
    .expandable { cursor: pointer; }
    .details { display: none; padding: 10px; background: #f9f9f9; border-left: 3px solid #0066cc; margin: 5px 0 5px 20px; }
  </style>
</head>
<body>
  <h1>Rapport interactif - ${target}</h1>
  <p class="timestamp">Date: ${new Date().toLocaleString()}</p>
  
  <div class="filters">
    <input type="text" id="searchInput" placeholder="Rechercher...">
    <select id="categoryFilter">
      <option value="">Toutes les catégories</option>
    </select>
    <button onclick="applyFilters()">Filtrer</button>
    <button onclick="resetFilters()">Réinitialiser</button>
  </div>
  
  <table id="dataTable">
    <thead>
      <tr>
        <th>Nom</th>
        <th>Catégorie</th>
        <th>Taille</th>
        <th>Dernière modification</th>
      </tr>
    </thead>
    <tbody>
`;

  // Générer les données en fonction de la cible
  let dataDir = projectRoot;
  if (target === 'agents') {
    dataDir = path.join(projectRoot, 'agents');
  } else if (target === 'scripts') {
    dataDir = path.join(projectRoot, 'scripts');
  } else if (target === 'workflows') {
    dataDir = path.join(projectRoot, 'workflows');
  }
  
  // Fonction récursive pour lister les fichiers
  function listFiles(dir, targetType) {
    let files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively add files from subdirectory
        files = files.concat(listFiles(fullPath, targetType));
      } else {
        // Only include relevant files based on target
        let shouldInclude = false;
        let category = path.relative(dataDir, path.dirname(fullPath)) || 'Root';
        
        if (targetType === 'agents' && (item.endsWith('.ts') || item.endsWith('.js'))) {
          shouldInclude = true;
        } else if (targetType === 'scripts' && (item.endsWith('.sh') || item.endsWith('.js') || item.endsWith('.ts'))) {
          shouldInclude = true;
        } else if (targetType === 'workflows' && item.endsWith('.json')) {
          shouldInclude = true;
        } else if (targetType === 'all') {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          files.push({
            name: item,
            path: fullPath,
            category: category,
            size: stats.size,
            mtime: stats.mtime
          });
        }
      }
    }
    
    return files;
  }
  
  const files = listFiles(dataDir, target);
  
  // Ajouter chaque fichier au tableau
  for (const file of files) {
    const relativePath = path.relative(projectRoot, file.path);
    const sizeKb = (file.size / 1024).toFixed(2);
    const mtime = file.mtime.toLocaleString();
    
    htmlContent += `      <tr class="expandable" data-path="${relativePath}">
        <td>${file.name}</td>
        <td>${file.category}</td>
        <td>${sizeKb} KB</td>
        <td>${mtime}</td>
      </tr>
      <tr>
        <td colspan="4" class="details" id="${relativePath.replace(/[^a-zA-Z0-9]/g, '_')}">
          <p>Chargement...</p>
        </td>
      </tr>
`;
  }
  
  // Terminer le HTML avec le JavaScript pour l'interactivité
  htmlContent += `    </tbody>
  </table>

  <script>
    // Collecte des catégories uniques
    document.addEventListener('DOMContentLoaded', () => {
      const categories = new Set();
      const rows = document.querySelectorAll('#dataTable tbody tr.expandable');
      
      rows.forEach(row => {
        const category = row.cells[1].textContent;
        categories.add(category);
        
        // Ajouter les événements de clic
        row.addEventListener('click', function() {
          const path = this.getAttribute('data-path');
          const detailsId = path.replace(/[^a-zA-Z0-9]/g, '_');
          const detailsRow = document.getElementById(detailsId);
          
          if (detailsRow.style.display === 'block') {
            detailsRow.style.display = 'none';
          } else {
            detailsRow.style.display = 'block';
            
            // Charger les détails si ce n'est pas déjà fait
            if (detailsRow.querySelector('p').textContent === 'Chargement...') {
              fetchFileDetails(path, detailsId);
            }
          }
        });
      });
      
      // Remplir le sélecteur de catégories
      const categoryFilter = document.getElementById('categoryFilter');
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
      });
    });
    
    // Fonction pour chercher les détails du fichier
    function fetchFileDetails(path, detailsId) {
      const detailsElement = document.getElementById(detailsId);
      
      // Simuler un chargement asynchrone (dans un vrai environnement, il faudrait un appel serveur)
      setTimeout(() => {
        let content = '<h4>Détails pour ' + path + '</h4>';
        
        // Selon l'extension, afficher différentes informations
        if (path.endsWith('.ts') || path.endsWith('.js')) {
          content += '<p>Script JavaScript/TypeScript</p>';
          content += '<p>Voir le code source pour plus de détails.</p>';
        } else if (path.endsWith('.sh')) {
          content += '<p>Script Shell</p>';
          content += '<p>Voir le code source pour plus de détails.</p>';
        } else if (path.endsWith('.json')) {
          content += '<p>Fichier de configuration ou workflow</p>';
          content += '<p>Contient des paramètres structurés au format JSON.</p>';
        }
        
        detailsElement.innerHTML = content;
      }, 500);
    }
    
    // Filtrage
    function applyFilters() {
      const searchTerm = document.getElementById('searchInput').value.toLowerCase();
      const categoryFilter = document.getElementById('categoryFilter').value;
      const rows = document.querySelectorAll('#dataTable tbody tr.expandable');
      
      rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const category = row.cells[1].textContent;
        const path = row.getAttribute('data-path');
        const detailsId = path.replace(/[^a-zA-Z0-9]/g, '_');
        const detailsRow = document.getElementById(detailsId);
        
        const nameMatch = name.includes(searchTerm);
        const categoryMatch = categoryFilter === '' || category === categoryFilter;
        
        if (nameMatch && categoryMatch) {
          row.classList.remove('hidden');
          if (detailsRow.style.display === 'block') {
            detailsRow.classList.remove('hidden');
          } else {
            detailsRow.classList.add('hidden');
          }
        } else {
          row.classList.add('hidden');
          detailsRow.classList.add('hidden');
        }
      });
    }
    
    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.getElementById('categoryFilter').value = '';
      
      const rows = document.querySelectorAll('#dataTable tbody tr');
      rows.forEach(row => {
        if (row.classList.contains('details')) {
          row.style.display = 'none';
        }
        row.classList.remove('hidden');
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(interactiveReportFile, htmlContent);
  log(`✅ Rapport interactif généré : ${interactiveReportFile}`);
  
  return interactiveReportFile;
}

// Générer un rapport de tableau de bord
function generateDashboardReport(options = {}) {
  log(`Génération d'un tableau de bord...`);
  
  const dashboardFile = path.join(reportDir, `dashboard-${timestamp}.html`);
  
  // Générer des données pour le tableau de bord
  const dashboardData = {
    scripts: {
      total: 0,
      byCategory: {}
    },
    agents: {
      total: 0,
      byType: {}
    },
    workflows: {
      total: 0
    }
  };
  
  // Compter les scripts par catégorie
  const scriptsDir = path.join(projectRoot, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const categories = fs.readdirSync(scriptsDir)
      .filter(item => fs.statSync(path.join(scriptsDir, item)).isDirectory());
    
    categories.forEach(category => {
      const categoryDir = path.join(scriptsDir, category);
      const scripts = fs.readdirSync(categoryDir)
        .filter(file => file.endsWith('.sh') || file.endsWith('.js') || file.endsWith('.ts'));
      
      dashboardData.scripts.byCategory[category] = scripts.length;
      dashboardData.scripts.total += scripts.length;
    });
  }
  
  // Compter les agents
  const agentsDir = path.join(projectRoot, 'agents');
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    
    dashboardData.agents.total = agents.length;
    
    // Catégoriser les agents par nom
    agents.forEach(agent => {
      let type = 'Autre';
      
      if (agent.includes('audit')) {
        type = 'Audit';
      } else if (agent.includes('validator') || agent.includes('verifier')) {
        type = 'Validation';
      } else if (agent.includes('orchestrator')) {
        type = 'Orchestration';
      } else if (agent.includes('monitor')) {
        type = 'Monitoring';
      }
      
      dashboardData.agents.byType[type] = (dashboardData.agents.byType[type] || 0) + 1;
    });
  }
  
  // Compter les workflows
  const workflowsDir = path.join(projectRoot, 'workflows');
  if (fs.existsSync(workflowsDir)) {
    const workflows = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.json'));
    
    dashboardData.workflows.total = workflows.length;
  }
  
  // Générer le HTML du tableau de bord
  let dashboardHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tableau de Bord du Projet</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: #333; color: white; padding: 20px; }
    .header h1 { margin: 0; }
    .header p { margin: 5px 0 0 0; opacity: 0.8; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-top: 20px; }
    .card { background: white; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 20px; }
    .card h2 { margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .stat-box { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .stat-label { font-weight: bold; }
    .chart-container { height: 250px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tableau de Bord du Projet</h1>
    <p>Généré le ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="container">
    <div class="dashboard-grid">
      <div class="card">
        <h2>Scripts</h2>
        <div class="stat-box">
          <span class="stat-label">Total des scripts:</span>
          <span class="stat-value">${dashboardData.scripts.total}</span>
        </div>
        <div class="chart-container">
          <canvas id="scriptsChart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2>Agents</h2>
        <div class="stat-box">
          <span class="stat-label">Total des agents:</span>
          <span class="stat-value">${dashboardData.agents.total}</span>
        </div>
        <div class="chart-container">
          <canvas id="agentsChart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2>Workflows</h2>
        <div class="stat-box">
          <span class="stat-label">Total des workflows:</span>
          <span class="stat-value">${dashboardData.workflows.total}</span>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Données pour les graphiques
    const scriptsData = {
      labels: ${JSON.stringify(Object.keys(dashboardData.scripts.byCategory))},
      values: ${JSON.stringify(Object.values(dashboardData.scripts.byCategory))}
    };
    
    const agentsData = {
      labels: ${JSON.stringify(Object.keys(dashboardData.agents.byType))},
      values: ${JSON.stringify(Object.values(dashboardData.agents.byType))}
    };
    
    // Créer les graphiques
    document.addEventListener('DOMContentLoaded', () => {
      // Graphique des scripts
      const scriptsCtx = document.getElementById('scriptsChart').getContext('2d');
      new Chart(scriptsCtx, {
        type: 'bar',
        data: {
          labels: scriptsData.labels,
          datasets: [{
            label: 'Nombre de scripts',
            data: scriptsData.values,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
      
      // Graphique des agents
      const agentsCtx = document.getElementById('agentsChart').getContext('2d');
      new Chart(agentsCtx, {
        type: 'pie',
        data: {
          labels: agentsData.labels,
          datasets: [{
            data: agentsData.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(dashboardFile, dashboardHtml);
  log(`✅ Tableau de bord généré : ${dashboardFile}`);
  
  return dashboardFile;
}

// Fonction d'aide : afficher l'aide
function showHelp() {
  console.log(`
Générateur de rapports unifié
-----------------------------

Usage: node unified-report-generator.js [command] [target] [options]

Commands:
  simple    Générer un rapport simple au format Markdown
  html      Générer un rapport HTML
  interactive  Générer un rapport interactif HTML avec filtres
  dashboard    Générer un tableau de bord général

Targets:
  agents    Générer un rapport sur les agents
  scripts   Générer un rapport sur les scripts
  workflows Générer un rapport sur les workflows
  all       Générer un rapport sur tous les éléments

Options:
  --open    Ouvrir le rapport généré dans un navigateur
  --help    Afficher cette aide

Examples:
  node unified-report-generator.js simple agents
  node unified-report-generator.js html scripts --open
  node unified-report-generator.js interactive workflows
  node unified-report-generator.js dashboard --open
  `);
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    return;
  }
  
  const command = args[0];
  const target = args[1] || 'all';
  const options = {
    open: args.includes('--open')
  };
  
  let reportFile;
  
  switch (command) {
    case 'simple':
      reportFile = generateSimpleReport(target, options);
      break;
    case 'html':
      reportFile = generateHTMLReport(target, options);
      break;
    case 'interactive':
      reportFile = generateInteractiveReport(target, options);
      break;
    case 'dashboard':
      reportFile = generateDashboardReport(options);
      break;
    default:
      console.error(`Commande inconnue: ${command}`);
      showHelp();
      return;
  }
  
  // Ouvrir le rapport si demandé
  if (options.open && reportFile) {
    const command = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    try {
      execSync(`${command} "${reportFile}"`);
      log(`Rapport ouvert dans le navigateur par défaut`);
    } catch (error) {
      log(`Erreur lors de l'ouverture du rapport: ${error.message}`);
    }
  }
  
  log(`Exécution terminée.`);
}

main();
