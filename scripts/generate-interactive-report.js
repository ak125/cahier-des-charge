#!/usr/bin/env node

/**
 * Ce script génère des rapports interactifs au format HTML
 * avec des graphiques et des fonctionnalités d'export vers PDF
 *
 * Utilisation:
 * node generate-interactive-report.js --type=itération --date="13/04/2025"
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Définir les options du programme
program
  .option('-t, --type <type>', 'Type de rapport (itération, routes, performance, etc.)')
  .option('-d, --date <date>', 'Date du rapport')
  .option('-o, --output <output>', 'Chemin du fichier de sortie')
  .option('-f, --format <format>', 'Format de sortie (html, pdf)', 'html')
  .parse(process.argv);

const options = program.opts();

// Valeurs par défaut
const today = new Date().toLocaleDateString('fr-FR');
const reportType = options.type || 'itération';
const reportDate = options.date || today;
const outputFormat = options.format || 'html';
const outputPath =
  options.output ||
  path.join(
    __dirname,
    '..',
    `reports/rapport-${reportType}-${reportDate.replace(/\//g, '-')}.${outputFormat}`
  );

// Créer le répertoire de sortie s'il n'existe pas
const reportsDir = path.dirname(outputPath);
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Configuration pour différents types de rapports
const reportConfigs = {
  itération: {
    title: `Rapport d'itération - ${reportDate}`,
    sections: [
      { id: 'resume', title: "Résumé de l'itération" },
      { id: 'accomplissements', title: 'Accomplissements' },
      { id: 'problemes', title: 'Problèmes rencontrés' },
      { id: 'plans', title: 'Plans pour la prochaine itération' },
    ],
    charts: [
      { id: 'progression', title: 'Progression des tâches', type: 'bar' },
      { id: 'repartition', title: 'Répartition du travail', type: 'pie' },
    ],
  },
  routes: {
    title: `Rapport des routes - ${reportDate}`,
    sections: [
      { id: 'resume', title: 'Résumé des routes' },
      { id: 'manquees', title: 'Routes manquées' },
      { id: 'redirections', title: 'Redirections' },
      { id: 'seo', title: 'Impact SEO' },
    ],
    charts: [
      { id: 'routes-status', title: 'Statut des routes', type: 'bar' },
      { id: 'routes-categories', title: 'Catégories de routes', type: 'pie' },
    ],
  },
  performance: {
    title: `Rapport de performance - ${reportDate}`,
    sections: [
      { id: 'resume', title: 'Résumé des performances' },
      { id: 'metrics', title: 'Métriques clés' },
      { id: 'comparaison', title: 'Comparaison avec la version précédente' },
      { id: 'recommandations', title: 'Recommandations' },
    ],
    charts: [
      { id: 'temps-chargement', title: 'Temps de chargement', type: 'line' },
      { id: 'taille-bundle', title: 'Taille des bundles', type: 'bar' },
    ],
  },
};

// Vérifier si le type de rapport est supporté
if (!reportConfigs[reportType]) {
  console.error(`Type de rapport non supporté: ${reportType}`);
  console.error(`Types supportés: ${Object.keys(reportConfigs).join(', ')}`);
  process.exit(1);
}

// Fonction pour générer des données aléatoires pour les graphiques (à remplacer par des données réelles)
function generateMockData(chartType) {
  if (chartType === 'bar') {
    return {
      labels: ['Tâche 1', 'Tâche 2', 'Tâche 3', 'Tâche 4', 'Tâche 5'],
      datasets: [
        {
          label: 'Progrès (%)',
          data: [75, 100, 40, 60, 20],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  }
  if (chartType === 'pie') {
    return {
      labels: ['Terminé', 'En cours', 'À faire', 'Bloqué'],
      datasets: [
        {
          data: [40, 30, 20, 10],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(255, 99, 132, 0.5)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }
  if (chartType === 'line') {
    return {
      labels: ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'],
      datasets: [
        {
          label: 'Temps (ms)',
          data: [1200, 950, 800, 650],
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1,
        },
      ],
    };
  }

  return { labels: [], datasets: [] };
}

// Générer le contenu du rapport HTML
function generateHtmlReport(config) {
  // Générer les sections pour les graphiques
  const chartSections = config.charts
    .map((chart) => {
      const chartData = JSON.stringify(generateMockData(chart.type));
      return `
      <div class="chart-container">
        <h3>${chart.title}</h3>
        <canvas id="${chart.id}" width="400" height="200"></canvas>
        <script>
          (function() {
            const ctx = document.getElementById('${chart.id}').getContext('2d');
            const chartData = ${chartData};
            new Chart(ctx, {
              type: '${chart.type}',
              data: chartData,
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '${chart.title}'
                  }
                }
              }
            });
          })();
        </script>
      </div>
    `;
    })
    .join('\n');

  // Générer les sections de contenu
  const contentSections = config.sections
    .map((section) => {
      return `
      <section id="${section.id}" class="report-section">
        <h2>${section.title}</h2>
        <div class="section-content" contenteditable="true">
          <p>[Contenu à remplir pour ${section.title}]</p>
        </div>
      </section>
    `;
    })
    .join('\n');

  // Générer le HTML complet
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .report-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .report-section {
      margin-bottom: 40px;
      padding: 20px;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    .report-section h2 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    .section-content {
      background-color: white;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
      min-height: 100px;
    }
    .chart-container {
      margin: 20px 0;
      padding: 20px;
      background-color: white;
      border-radius: 5px;
      border: 1px solid #ddd;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin: 20px 0;
    }
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 10px 15px;
      margin-left: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #2980b9;
    }
    .print-only {
      display: none;
    }
    @media print {
      .no-print {
        display: none;
      }
      .print-only {
        display: block;
      }
      .report-section, .chart-container {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
    [contenteditable]:focus {
      outline: 2px solid #3498db;
    }
    .report-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.9em;
      color: #666;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="report-container" id="report-container">
    <div class="report-header">
      <h1>${config.title}</h1>
      <div class="report-meta">
        <div>Date du rapport: ${reportDate}</div>
        <div>Généré le: ${new Date().toLocaleString('fr-FR')}</div>
      </div>
    </div>
    
    <div class="actions no-print">
      <button onclick="saveAsPDF()">Exporter en PDF</button>
      <button onclick="window.print()">Imprimer</button>
      <button onclick="saveAsHTML()">Sauvegarder</button>
    </div>
    
    ${contentSections}
    
    <div class="charts-grid">
      ${chartSections}
    </div>
    
    <div class="report-footer">
      <p>Ce rapport a été généré automatiquement. Les données sont à titre indicatif.</p>
    </div>
  </div>
  
  <script>
    // Fonction pour exporter en PDF
    function saveAsPDF() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const reportElement = document.getElementById('report-container');
      
      // Utiliser html2canvas pour chaque section
      const promises = [];
      let currentY = 10;
      
      document.querySelectorAll('.report-section, .report-header, .charts-grid').forEach((section, index) => {
        promises.push(
          html2canvas(section, {scale: 2}).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const imgWidth = 190;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            if (currentY + imgHeight > 280) {  // Si on dépasse la page
              doc.addPage();
              currentY = 10;
            }
            
            doc.addImage(imgData, 'JPEG', 10, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;
          })
        );
      });
      
      Promise.all(promises).then(() => {
        doc.save('rapport.pdf');
      });
    }
    
    // Fonction pour sauvegarder le HTML modifié
    function saveAsHTML() {
      // Simuler la sauvegarde en local
      alert('Rapport sauvegardé !');
      
      // Dans une implémentation réelle, on enverrait le contenu à un serveur
      // ou on utiliserait l'API File System pour sauvegarder localement
    }
  </script>
</body>
</html>`;
}

// Générer le rapport selon le format demandé
console.log(`Génération du rapport de type '${reportType}' au format ${outputFormat}...`);

if (outputFormat === 'html') {
  // Générer le HTML
  const reportConfig = reportConfigs[reportType];
  const htmlContent = generateHtmlReport(reportConfig);

  // Écrire le fichier HTML
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
  console.log(`Rapport HTML généré avec succès: ${outputPath}`);
} else if (outputFormat === 'pdf') {
  // Note: Pour générer un PDF en ligne de commande,
  // il faudrait utiliser une bibliothèque comme puppeteer
  console.error("La génération directe de PDF n'est pas encore supportée en ligne de commande.");
  console.error('Veuillez générer un rapport HTML puis utiliser le bouton "Exporter en PDF".');
  process.exit(1);
} else {
  console.error(`Format de sortie non supporté: ${outputFormat}`);
  process.exit(1);
}
