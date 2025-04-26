/**
 * Tableau de bord unifié d'audit pour la migration
 * 
 * Ce script fournit un tableau de bord web pour visualiser l'état des audits
 * et permet de déclencher manuellement des audits sur les modules.
 */

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { exec } = require('child_process');

// Type explicite pour Express Request et Response
interface ExpressRequestType {
  body: any;
  params: any;
  query: any;
}

interface ExpressResponseType {
  send: (body: any) => any;
  json: (body: any) => any;
  status: (code: number) => any;
  sendFile: (path: string) => any;
}

// Interface pour les modules audités
interface AuditedModule {
  name: string;
  lastAudit: Date;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  reportPath: string;
}

// Interface pour les métriques d'audit
interface AuditMetrics {
  totalModules: number;
  auditedModules: number;
  passedModules: number;
  warningModules: number;
  failedModules: number;
  avgScore: number;
}

// Interface pour l'état global de l'audit
interface AuditState {
  lastUpdated: Date;
  modules: Record<string, AuditedModule>;
  metrics: AuditMetrics;
}

// Vérifier si le mode dashboard est activé
const isDashboardMode = process.argv.includes('--dashboard');

// Configuration de base
const config = {
  PORT: process.env.AUDIT_DASHBOARD_PORT || 3002,
  AUDIT_REPORTS_DIR: path.join(process.cwd(), 'audit', 'reports'),
  MODULES_DIR: path.join(process.cwd(), 'modules'),
  DASHBOARD_STATIC_DIR: path.join(process.cwd(), 'dashboard', 'audit')
};

// Créer les dossiers nécessaires s'ils n'existent pas
fs.mkdirSync(config.AUDIT_REPORTS_DIR, { recursive: true });

// État global des audits
let auditState: AuditState = {
  lastUpdated: new Date(),
  modules: {},
  metrics: {
    totalModules: 0,
    auditedModules: 0,
    passedModules: 0,
    warningModules: 0,
    failedModules: 0,
    avgScore: 0
  }
};

/**
 * Lance l'audit d'un module spécifique
 */
async function auditModule(moduleName: string): Promise<boolean> {
  const spinner = ora(`Audit du module ${moduleName} en cours...`).start();

  try {
    // Simulation de l'exécution d'un audit (dans un projet réel, appeler les outils d'audit appropriés)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Générer un score d'audit aléatoire entre 50 et 100 pour la démo
    const score = Math.floor(Math.random() * 51) + 50;
    const status = score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail';

    // Simuler un rapport d'audit
    const auditReport = {
      moduleName,
      timestamp: new Date(),
      score,
      status,
      issues: [
        {
          severity: score < 60 ? 'error' : 'warning',
          code: 'AUDIT-001',
          message: `Problème d'audit démontré pour ${moduleName}`,
          location: `${moduleName}/index.ts`
        }
      ]
    };

    // Sauvegarder le rapport dans un fichier
    const reportPath = path.join(config.AUDIT_REPORTS_DIR, `${moduleName}.audit.json`);
    await fs.writeJson(reportPath, auditReport, { spaces: 2 });

    // Mettre à jour l'état
    auditState.modules[moduleName] = {
      name: moduleName,
      lastAudit: new Date(),
      score,
      status,
      reportPath
    };

    spinner.succeed(`Audit du module ${moduleName} terminé avec un score de ${score}/100`);
    return true;
  } catch (error: any) {
    spinner.fail(`Erreur lors de l'audit du module ${moduleName}: ${error.message}`);
    return false;
  }
}

/**
 * Met à jour l'état global des audits
 */
async function updateAuditState(): Promise<void> {
  try {
    // Rechercher tous les rapports d'audit existants
    let files: string[] = [];
    try {
      files = await fs.readdir(config.AUDIT_REPORTS_DIR);
    } catch (error: any) {
      console.log(chalk.yellow(`Répertoire de rapports d'audit non trouvé ou vide: ${config.AUDIT_REPORTS_DIR}`));
    }

    const auditReports = files.filter(f => f.endsWith('.audit.json'));

    // Réinitialiser l'état des métriques
    auditState.metrics = {
      totalModules: 0,
      auditedModules: auditReports.length,
      passedModules: 0,
      warningModules: 0,
      failedModules: 0,
      avgScore: 0
    };

    let totalScore = 0;

    // Analyser chaque rapport d'audit
    for (const reportFile of auditReports) {
      try {
        const reportPath = path.join(config.AUDIT_REPORTS_DIR, reportFile);
        const report = await fs.readJson(reportPath);

        const moduleName = report.moduleName || path.basename(reportFile, '.audit.json');

        // Mettre à jour l'état du module
        auditState.modules[moduleName] = {
          name: moduleName,
          lastAudit: new Date(report.timestamp),
          score: report.score,
          status: report.status,
          reportPath
        };

        // Mettre à jour les métriques
        totalScore += report.score;
        if (report.status === 'pass') {
          auditState.metrics.passedModules++;
        } else if (report.status === 'warning') {
          auditState.metrics.warningModules++;
        } else {
          auditState.metrics.failedModules++;
        }
      } catch (error: any) {
        console.error(`Erreur lors de la lecture du rapport ${reportFile}: ${error.message}`);
      }
    }

    // S'il n'y a pas de modules réels dans le projet, créer des données de démo
    if (Object.keys(auditState.modules).length === 0) {
      const demoModules = [
        'authentication', 'users', 'products', 'cart', 'orders', 'payment', 'shipping',
        'notifications', 'search', 'admin', 'reviews', 'inventory'
      ];

      for (const moduleName of demoModules) {
        // Générer un score aléatoire entre 50 et 100
        const score = Math.floor(Math.random() * 51) + 50;
        const status = score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail';

        auditState.modules[moduleName] = {
          name: moduleName,
          lastAudit: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Jusqu'à 7 jours dans le passé
          score,
          status,
          reportPath: `demo/${moduleName}.audit.json`
        };

        totalScore += score;
        if (status === 'pass') {
          auditState.metrics.passedModules++;
        } else if (status === 'warning') {
          auditState.metrics.warningModules++;
        } else {
          auditState.metrics.failedModules++;
        }
      }

      auditState.metrics.auditedModules = demoModules.length;
    }

    // Calculer le score moyen et nombre total de modules
    auditState.metrics.totalModules = Object.keys(auditState.modules).length;
    if (auditState.metrics.auditedModules > 0) {
      auditState.metrics.avgScore = Math.round(totalScore / auditState.metrics.auditedModules);
    }

    auditState.lastUpdated = new Date();
  } catch (error: any) {
    console.error(`Erreur lors de la mise à jour de l'état des audits: ${error.message}`);
  }
}

/**
 * Lance un audit complet sur tous les modules
 */
async function runFullAudit(): Promise<void> {
  console.log(chalk.blue('🔍 Lancement de l\'audit complet...'));

  try {
    // Rechercher les modules du projet
    let moduleDirs: string[] = [];
    try {
      moduleDirs = await fs.readdir(config.MODULES_DIR);
    } catch (error: any) {
      console.log(chalk.yellow(`Répertoire des modules non trouvé: ${config.MODULES_DIR}`));
      console.log(chalk.yellow('Utilisation des modules démo à la place.'));

      // Si aucun module réel n'est trouvé, utiliser les noms de modules de démo
      moduleDirs = [
        'authentication', 'users', 'products', 'cart', 'orders', 'payment', 'shipping',
        'notifications', 'search', 'admin', 'reviews', 'inventory'
      ];
    }

    // Lancer l'audit sur chaque module
    for (const moduleName of moduleDirs) {
      try {
        const stats = await fs.stat(path.join(config.MODULES_DIR, moduleName));
        if (stats.isDirectory()) {
          await auditModule(moduleName);
        }
      } catch (error: any) {
        console.error(`Erreur lors de l'audit du module ${moduleName}: ${error.message}`);
      }
    }

    // Mettre à jour l'état global
    await updateAuditState();

    console.log(chalk.green('✅ Audit complet terminé.'));
    console.log(chalk.blue(`📊 Modules audités: ${auditState.metrics.auditedModules}/${auditState.metrics.totalModules}`));
    console.log(chalk.blue(`🟢 Modules en succès: ${auditState.metrics.passedModules}`));
    console.log(chalk.blue(`🟠 Modules avec avertissements: ${auditState.metrics.warningModules}`));
    console.log(chalk.blue(`🔴 Modules en échec: ${auditState.metrics.failedModules}`));
    console.log(chalk.blue(`⭐ Score moyen: ${auditState.metrics.avgScore}/100`));
  } catch (error: any) {
    console.error(chalk.red(`❌ Erreur lors de l'audit complet: ${error.message}`));
  }
}

// Si le mode tableau de bord est activé, démarrer le serveur web
if (isDashboardMode) {
  const app = express();

  // Middleware pour servir les fichiers statiques du dashboard
  app.use(express.json());
  app.use(express.static(config.DASHBOARD_STATIC_DIR));

  // Créer une page HTML basique si le répertoire dashboard/audit n'existe pas
  app.get('/', async (req: ExpressRequestType, res: ExpressResponseType) => {
    try {
      // Vérifier si index.html existe dans le répertoire du dashboard
      const indexPath = path.join(config.DASHBOARD_STATIC_DIR, 'index.html');
      if (await fs.pathExists(indexPath)) {
        return res.sendFile(indexPath);
      }

      // Sinon, générer une page HTML basique
      await updateAuditState();

      const moduleRows = Object.values(auditState.modules)
        .map(module => {
          const statusColor = module.status === 'pass' ? 'green' : module.status === 'warning' ? 'orange' : 'red';
          const statusText = module.status === 'pass' ? 'Succès' : module.status === 'warning' ? 'Avertissement' : 'Échec';
          return `
            <tr>
              <td>${module.name}</td>
              <td><span style="color: ${statusColor}">${statusText}</span></td>
              <td>${module.score}/100</td>
              <td>${new Date(module.lastAudit).toLocaleString()}</td>
              <td>
                <button onclick="auditModule('${module.name}')" class="audit-button">
                  Auditer
                </button>
              </td>
            </tr>
          `;
        })
        .join('');

      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tableau de bord d'audit unifié</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .dashboard-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .stats-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 30px;
            }
            .stats-card {
              background: #f9f9f9;
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 15px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .stats-card h3 {
              margin-top: 0;
              color: #555;
            }
            .stats-card p {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
            }
            tr:hover {
              background-color: #f9f9f9;
            }
            .audit-button {
              background-color: #4CAF50;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            }
            .audit-button:hover {
              background-color: #45a049;
            }
            .full-audit-button {
              background-color: #2196F3;
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            .full-audit-button:hover {
              background-color: #0b7dda;
            }
            .last-updated {
              color: #777;
              font-size: 14px;
              margin-top: 30px;
            }
            .info {
              background-color: #e3f2fd;
              padding: 15px;
              border-left: 5px solid #2196F3;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="dashboard-header">
            <h1>Tableau de bord d'audit unifié</h1>
            <button id="full-audit-btn" class="full-audit-button">
              Lancer un audit complet
            </button>
          </div>
          
          <div class="info">
            <p><strong>Note :</strong> Ce tableau de bord génère une interface simplifiée car les fichiers statiques ne sont pas disponibles. 
            Les composants Remix complets sont disponibles dans le dossier 'layered-dashboards'.</p>
          </div>
          
          <div class="stats-cards">
            <div class="stats-card">
              <h3>Modules audités</h3>
              <p>${auditState.metrics.auditedModules}/${auditState.metrics.totalModules}</p>
            </div>
            <div class="stats-card">
              <h3>Modules en succès</h3>
              <p style="color: green">${auditState.metrics.passedModules}</p>
            </div>
            <div class="stats-card">
              <h3>Modules avec avertissements</h3>
              <p style="color: orange">${auditState.metrics.warningModules}</p>
            </div>
            <div class="stats-card">
              <h3>Modules en échec</h3>
              <p style="color: red">${auditState.metrics.failedModules}</p>
            </div>
            <div class="stats-card">
              <h3>Score moyen</h3>
              <p>${auditState.metrics.avgScore}/100</p>
            </div>
          </div>
          
          <h2>Résultats des audits par module</h2>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Statut</th>
                <th>Score</th>
                <th>Dernière mise à jour</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="module-list">
              ${moduleRows}
            </tbody>
          </table>
          
          <p class="last-updated">
            Dernière mise à jour: ${new Date(auditState.lastUpdated).toLocaleString()}
          </p>
          
          <script>
            // Fonction pour auditer un module spécifique
            async function auditModule(moduleName) {
              try {
                const response = await fetch('/api/audit/module', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ moduleName })
                });
                
                if (response.ok) {
                  alert(\`Audit du module \${moduleName} lancé avec succès.\`);
                  setTimeout(() => location.reload(), 2000);
                } else {
                  alert(\`Erreur lors de l'audit du module \${moduleName}.\`);
                }
              } catch (error) {
                console.error('Erreur:', error);
                alert(\`Erreur lors de l'audit: \${error.message}\`);
              }
            }
            
            // Événement pour le bouton d'audit complet
            document.getElementById('full-audit-btn').addEventListener('click', async () => {
              if (confirm('Êtes-vous sûr de vouloir lancer un audit complet ? Cela peut prendre du temps.')) {
                try {
                  const response = await fetch('/api/audit/full', {
                    method: 'POST'
                  });
                  
                  if (response.ok) {
                    alert('Audit complet lancé avec succès. Cette opération peut prendre quelques minutes.');
                    setTimeout(() => location.reload(), 5000);
                  } else {
                    alert('Erreur lors du lancement de l\\'audit complet.');
                  }
                } catch (error) {
                  console.error('Erreur:', error);
                  alert(\`Erreur lors de l'audit: \${error.message}\`);
                }
              }
            });
          </script>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error: any) {
      res.status(500).send(`Erreur lors de la génération du tableau de bord: ${error.message}`);
    }
  });

  // API pour récupérer l'état actuel des audits
  app.get('/api/audit/state', async (req: ExpressRequestType, res: ExpressResponseType) => {
    try {
      await updateAuditState();
      res.json(auditState);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API pour auditer un module spécifique
  app.post('/api/audit/module', async (req: ExpressRequestType, res: ExpressResponseType) => {
    try {
      const moduleName = req.body.moduleName;
      if (!moduleName) {
        return res.status(400).json({ error: 'Le nom du module est requis' });
      }

      const success = await auditModule(moduleName);
      if (success) {
        await updateAuditState();
        res.json({ success: true, message: `Audit du module ${moduleName} terminé avec succès` });
      } else {
        res.status(500).json({ error: `Erreur lors de l'audit du module ${moduleName}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API pour lancer un audit complet
  app.post('/api/audit/full', async (req: ExpressRequestType, res: ExpressResponseType) => {
    // Lancer l'audit complet en arrière-plan
    res.json({ success: true, message: 'Audit complet lancé en arrière-plan' });

    // Exécuter l'audit complet après avoir envoyé la réponse
    setTimeout(() => {
      runFullAudit().catch(error => {
        console.error(`Erreur lors de l'audit complet: ${error.message}`);
      });
    }, 100);
  });

  // Démarrer le serveur
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(chalk.green(`🚀 Tableau de bord d'audit démarré sur http://localhost:${PORT}`));
    console.log(chalk.blue('📊 Accédez au tableau de bord pour visualiser l\'état des audits'));

    // Mettre à jour l'état initial
    updateAuditState().catch(error => {
      console.error(chalk.red(`Erreur lors de l'initialisation de l'état: ${error.message}`));
    });
  });
} else {
  // Mode CLI: exécuter un audit complet
  (async () => {
    await runFullAudit();
  })();
}

// Export pour les tests
module.exports = {
  auditModule,
  updateAuditState,
  runFullAudit
};