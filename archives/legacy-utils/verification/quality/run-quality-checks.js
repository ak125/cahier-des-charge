#!/usr/bin/env node

/**
 * Script d'automatisation des analyses de qualité
 *
 * Ce script lance les pipelines d'analyse de qualité et génère les rapports nécessaires
 * pour le tableau de bord. Il peut être exécuté dans un environnement CI/CD ou via cron.
 *
 * Utilisation:
 * - Analyse complète: node run-quality-checks.js --full
 * - Analyse incrémentale: node run-quality-checks.js --incremental
 * - Analyse d'un répertoire spécifique: node run-quality-checks.js --dir=<chemin>
 */

const fs = require('fsstructure-agent');
const path = require('pathstructure-agent');
const { execSync, spawn } = require('child_processstructure-agent');

// Configuration
const CONFIG = {
  qaReportDir: path.resolve('./qa-reports'),
  dashboardDataFile: path.resolve('./qa-reports/qa-dashboard-data.json'),
  historicalDataFile: path.resolve('./qa-reports/qa-historical-data.json'),
  notificationsFile: path.resolve('./qa-reports/quality-alerts.json'),
  thresholds: {
    seo: 80,
    performance: 70,
    accessibility: 85,
    bestPractices: 75,
    overall: 75,
  },
};

// Arguments de la ligne de commande
const args = process.argv.slice(2);
const isFullAnalysis = args.includes('--full');
const _isIncrementalAnalysis = args.includes('--incremental') || !isFullAnalysis;
const dirArg = args.find((arg) => arg.startsWith('--dir='));
const targetDir = dirArg ? dirArg.split('=')[1] : null;

// Garantir que les répertoires existent
if (!fs.existsSync(CONFIG.qaReportDir)) {
  fs.mkdirSync(CONFIG.qaReportDir, { recursive: true });
  console.log(`📁 Création du répertoire ${CONFIG.qaReportDir}`);
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log("\n🔍 Démarrage de l'analyse de qualité");
  console.log(`📊 Mode: ${isFullAnalysis ? 'Analyse complète' : 'Analyse incrémentale'}`);
  if (targetDir) {
    console.log(`📂 Répertoire cible: ${targetDir}`);
  }

  try {
    // 1. Exécuter l'analyse SEO
    await runSeoAnalysis();

    // 2. Exécuter l'analyse de performance
    await runPerformanceAnalysis();

    // 3. Exécuter l'analyse d'accessibilité
    await runAccessibilityAnalysis();

    // 4. Exécuter l'analyse des meilleures pratiques
    await runBestPracticesAnalysis();

    // 5. Exécuter l'analyse d'utilisabilité et d'expérience utilisateur (nouveaux tests)
    await runUsabilityUXAnalysis();

    // 6. Agréger les résultats
    const aggregatedData = aggregateResults();

    // 7. Mettre à jour le fichier d'historique
    updateHistoricalData(aggregatedData);

    // 8. Détecter les changements significatifs et générer les alertes
    detectQualityChanges(aggregatedData);

    console.log('\n✅ Analyse de qualité terminée avec succès');
  } catch (error) {
    console.error("\n❌ Erreur lors de l'analyse de qualité:", error);
    process.exit(1);
  }
}

/**
 * Exécute l'analyse SEO via n8n ou l'outil approprié
 */
async function runSeoAnalysis() {
  console.log('\n📝 Analyse SEO en cours...');

  try {
    // Utilisation de n8n pour exécuter le workflow d'analyse SEO
    const n8nCommand = isFullAnalysis
      ? 'n8n execute workflow --id qa-analyzer-seo'
      : 'n8n execute workflow --id qa-analyzer-seo-incremental';

    const _outputPath = path.join(CONFIG.qaReportDir, 'seo-analysis-results.json');
    execSync(n8nCommand, { stdio: 'inherit' });

    console.log('✅ Analyse SEO terminée');
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse SEO:", error.message);
    throw error;
  }
}

/**
 * Exécute l'analyse de performance (via Lighthouse ou autre outil)
 */
async function runPerformanceAnalysis() {
  console.log('\n🚀 Analyse de performance en cours...');

  try {
    // Utilisation de Lighthouse ou autre outil pour l'analyse de performance
    const performanceCommand = 'node ./tools/run-performance-analysis.js';
    execSync(performanceCommand, { stdio: 'inherit' });

    console.log('✅ Analyse de performance terminée');
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse de performance:", error.message);
    throw error;
  }
}

/**
 * Exécute l'analyse d'accessibilité
 */
async function runAccessibilityAnalysis() {
  console.log("\n♿ Analyse d'accessibilité en cours...");

  try {
    // Utilisation d'un outil comme axe-core ou pa11y
    const accessibilityCommand = 'node ./tools/run-accessibility-analysis.js';
    execSync(accessibilityCommand, { stdio: 'inherit' });

    console.log("✅ Analyse d'accessibilité terminée");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse d'accessibilité:", error.message);
    throw error;
  }
}

/**
 * Exécute l'analyse des meilleures pratiques
 */
async function runBestPracticesAnalysis() {
  console.log('\n👍 Analyse des meilleures pratiques en cours...');

  try {
    // Utilisation d'outils comme ESLint, Stylelint, etc.
    const bestPracticesCommand = 'node ./tools/run-best-practices-analysis.js';
    execSync(bestPracticesCommand, { stdio: 'inherit' });

    console.log('✅ Analyse des meilleures pratiques terminée');
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse des meilleures pratiques:", error.message);
    throw error;
  }
}

/**
 * Exécute l'analyse d'utilisabilité et d'expérience utilisateur
 */
async function runUsabilityUXAnalysis() {
  console.log("\n🧩 Analyse d'utilisabilité et d'expérience utilisateur en cours...");

  try {
    // Utilisation d'outils spécifiques pour l'analyse d'utilisabilité et UX
    const usabilityUXCommand = 'node ./tools/run-usability-ux-analysis.js';
    execSync(usabilityUXCommand, { stdio: 'inherit' });

    console.log("✅ Analyse d'utilisabilité et d'expérience utilisateur terminée");
    return true;
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'analyse d'utilisabilité et d'expérience utilisateur:",
      error.message
    );
    throw error;
  }
}

/**
 * Agrège les résultats des différentes analyses
 */
function aggregateResults() {
  console.log('\n📊 Agrégation des résultats...');

  try {
    // Récupérer les données existantes si disponibles
    const dashboardData = {
      lastUpdate: new Date().toISOString(),
      results: {},
      stats: {
        totalFiles: 0,
        passedFiles: 0,
        partialFiles: 0,
        failedFiles: 0,
      },
      averageScore: 0,
      performanceStats: {
        averageScore: 0,
        goodPerformanceCount: 0,
        poorPerformanceCount: 0,
      },
      accessibilityStats: {
        averageScore: 0,
        criticalIssuesCount: 0,
        seriousIssuesCount: 0,
      },
      bestPracticesStats: {
        averageScore: 0,
        highSeverityCount: 0,
        mediumSeverityCount: 0,
      },
    };

    // Charger les résultats de chaque analyse et les fusionner
    const seoResults = JSON.parse(
      fs.readFileSync(path.join(CONFIG.qaReportDir, 'seo-analysis-results.json'), 'utf8')
    );
    const performanceResults = JSON.parse(
      fs.readFileSync(path.join(CONFIG.qaReportDir, 'performance-analysis-results.json'), 'utf8')
    );
    const accessibilityResults = JSON.parse(
      fs.readFileSync(path.join(CONFIG.qaReportDir, 'accessibility-analysis-results.json'), 'utf8')
    );
    const bestPracticesResults = JSON.parse(
      fs.readFileSync(path.join(CONFIG.qaReportDir, 'best-practices-analysis-results.json'), 'utf8')
    );

    // Fusionner les résultats par fichier
    const allFilePaths = new Set([
      ...Object.keys(seoResults.results || {}),
      ...Object.keys(performanceResults.results || {}),
      ...Object.keys(accessibilityResults.results || {}),
      ...Object.keys(bestPracticesResults.results || {}),
    ]);

    // Pour chaque fichier, combiner les résultats
    allFilePaths.forEach((filePath) => {
      dashboardData.results[filePath] = {
        ...dashboardData.results[filePath],
        ...seoResults.results[filePath],
        performanceScore: performanceResults.results[filePath]?.score,
        performanceMetrics: performanceResults.results[filePath]?.metrics,
        accessibilityScore: accessibilityResults.results[filePath]?.score,
        accessibilityIssues: accessibilityResults.results[filePath]?.issues,
        bestPracticesScore: bestPracticesResults.results[filePath]?.score,
        bestPracticesIssues: bestPracticesResults.results[filePath]?.issues,
      };

      // Calculer le score global
      const scores = [
        dashboardData.results[filePath].score || 0,
        dashboardData.results[filePath].performanceScore || 0,
        dashboardData.results[filePath].accessibilityScore || 0,
        dashboardData.results[filePath].bestPracticesScore || 0,
      ].filter((score) => score > 0);

      dashboardData.results[filePath].overallScore =
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    });

    // Calculer les statistiques globales
    const results = Object.values(dashboardData.results);
    dashboardData.stats.totalFiles = results.length;
    dashboardData.stats.passedFiles = results.filter((r) => r.status === 'success').length;
    dashboardData.stats.partialFiles = results.filter((r) => r.status === 'partial').length;
    dashboardData.stats.failedFiles = results.filter((r) => r.status === 'failed').length;

    // Calculs des moyennes pour chaque catégorie
    dashboardData.averageScore =
      results.reduce((sum, r) => sum + (r.score || 0), 0) / (results.length || 1);

    dashboardData.performanceStats.averageScore =
      results.reduce((sum, r) => sum + (r.performanceScore || 0), 0) /
      (results.filter((r) => r.performanceScore !== undefined).length || 1);

    dashboardData.accessibilityStats.averageScore =
      results.reduce((sum, r) => sum + (r.accessibilityScore || 0), 0) /
      (results.filter((r) => r.accessibilityScore !== undefined).length || 1);

    dashboardData.bestPracticesStats.averageScore =
      results.reduce((sum, r) => sum + (r.bestPracticesScore || 0), 0) /
      (results.filter((r) => r.bestPracticesScore !== undefined).length || 1);

    // Statistiques supplémentaires
    dashboardData.performanceStats.goodPerformanceCount = results.filter(
      (r) => (r.performanceScore || 0) >= CONFIG.thresholds.performance
    ).length;

    dashboardData.performanceStats.poorPerformanceCount = results.filter(
      (r) => (r.performanceScore || 0) < CONFIG.thresholds.performance
    ).length;

    dashboardData.accessibilityStats.criticalIssuesCount = results.reduce(
      (sum, r) => sum + (r.accessibilityIssues?.filter((i) => i.impact === 'critical').length || 0),
      0
    );

    dashboardData.accessibilityStats.seriousIssuesCount = results.reduce(
      (sum, r) => sum + (r.accessibilityIssues?.filter((i) => i.impact === 'serious').length || 0),
      0
    );

    dashboardData.bestPracticesStats.highSeverityCount = results.reduce(
      (sum, r) => sum + (r.bestPracticesIssues?.filter((i) => i.severity === 'high').length || 0),
      0
    );

    dashboardData.bestPracticesStats.mediumSeverityCount = results.reduce(
      (sum, r) => sum + (r.bestPracticesIssues?.filter((i) => i.severity === 'medium').length || 0),
      0
    );

    // Analyse des problèmes les plus courants
    const issueCounter = {};
    results.forEach((result) => {
      if (result.missingFields && result.missingFields.length > 0) {
        result.missingFields.forEach((field) => {
          if (!issueCounter[field]) {
            issueCounter[field] = { count: 0, files: [] };
          }
          issueCounter[field].count++;
          issueCounter[field].files.push(result.filePath);
        });
      }
    });

    // Trier et limiter aux problèmes les plus fréquents
    dashboardData.topIssues = Object.entries(issueCounter)
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        affectedFiles: data.files,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Sauvegarder les données agrégées
    fs.writeFileSync(CONFIG.dashboardDataFile, JSON.stringify(dashboardData, null, 2));
    console.log(`✅ Résultats agrégés et sauvegardés dans ${CONFIG.dashboardDataFile}`);

    return dashboardData;
  } catch (error) {
    console.error("❌ Erreur lors de l'agrégation des résultats:", error.message);
    throw error;
  }
}

/**
 * Met à jour les données historiques
 */
function updateHistoricalData(dashboardData) {
  console.log('\n📈 Mise à jour des données historiques...');

  try {
    // Récupérer les données historiques existantes
    let historicalData = { data: [] };
    if (fs.existsSync(CONFIG.historicalDataFile)) {
      historicalData = JSON.parse(fs.readFileSync(CONFIG.historicalDataFile, 'utf8'));
    }

    // Ajouter les données actuelles à l'historique
    const historicalEntry = {
      date: new Date().toISOString(),
      averageScore: dashboardData.averageScore,
      passedFiles: dashboardData.stats.passedFiles,
      failedFiles: dashboardData.stats.failedFiles,
      partialFiles: dashboardData.stats.partialFiles,
      avgPerformanceScore: dashboardData.performanceStats.averageScore,
      avgAccessibilityScore: dashboardData.accessibilityStats.averageScore,
      avgBestPracticesScore: dashboardData.bestPracticesStats.averageScore,
    };

    // Limiter l'historique aux 100 dernières entrées
    historicalData.data.push(historicalEntry);
    if (historicalData.data.length > 100) {
      historicalData.data = historicalData.data.slice(-100);
    }

    // Sauvegarder les données historiques
    fs.writeFileSync(CONFIG.historicalDataFile, JSON.stringify(historicalData, null, 2));
    console.log(`✅ Données historiques mises à jour dans ${CONFIG.historicalDataFile}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des données historiques:', error.message);
    throw error;
  }
}

/**
 * Détecte les changements significatifs dans la qualité et génère des alertes
 */
function detectQualityChanges(currentData) {
  console.log('\n🚨 Analyse des changements de qualité...');

  try {
    // Charger les données historiques pour comparer
    if (!fs.existsSync(CONFIG.historicalDataFile)) {
      console.log('⚠️ Aucune donnée historique disponible pour la comparaison');
      return;
    }

    const historicalData = JSON.parse(fs.readFileSync(CONFIG.historicalDataFile, 'utf8'));
    if (historicalData.data.length < 2) {
      console.log('⚠️ Pas assez de données historiques pour détecter des changements');
      return;
    }

    // Obtenir l'entrée précédente pour la comparaison
    const previousEntry = historicalData.data[historicalData.data.length - 2];
    const currentEntry = historicalData.data[historicalData.data.length - 1];

    // Définir les seuils pour les alertes (pourcentage de changement considéré comme significatif)
    const significantChange = 5; // 5% de changement

    // Vérifier les changements significatifs
    const alerts = [];

    // Score SEO
    const seoDiff = currentEntry.averageScore - previousEntry.averageScore;
    if (Math.abs(seoDiff) >= significantChange) {
      alerts.push({
        type: seoDiff < 0 ? 'degradation' : 'improvement',
        category: 'seo',
        message: `Score SEO ${seoDiff < 0 ? 'dégradé' : 'amélioré'} de ${Math.abs(seoDiff).toFixed(
          1
        )}%`,
        timestamp: new Date().toISOString(),
        previousValue: previousEntry.averageScore,
        currentValue: currentEntry.averageScore,
      });
    }

    // Score Performance
    const perfDiff = currentEntry.avgPerformanceScore - previousEntry.avgPerformanceScore;
    if (Math.abs(perfDiff) >= significantChange) {
      alerts.push({
        type: perfDiff < 0 ? 'degradation' : 'improvement',
        category: 'performance',
        message: `Score de performance ${perfDiff < 0 ? 'dégradé' : 'amélioré'} de ${Math.abs(
          perfDiff
        ).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        previousValue: previousEntry.avgPerformanceScore,
        currentValue: currentEntry.avgPerformanceScore,
      });
    }

    // Score Accessibilité
    const a11yDiff = currentEntry.avgAccessibilityScore - previousEntry.avgAccessibilityScore;
    if (Math.abs(a11yDiff) >= significantChange) {
      alerts.push({
        type: a11yDiff < 0 ? 'degradation' : 'improvement',
        category: 'accessibility',
        message: `Score d'accessibilité ${a11yDiff < 0 ? 'dégradé' : 'amélioré'} de ${Math.abs(
          a11yDiff
        ).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        previousValue: previousEntry.avgAccessibilityScore,
        currentValue: currentEntry.avgAccessibilityScore,
      });
    }

    // Score Meilleures pratiques
    const bpDiff = currentEntry.avgBestPracticesScore - previousEntry.avgBestPracticesScore;
    if (Math.abs(bpDiff) >= significantChange) {
      alerts.push({
        type: bpDiff < 0 ? 'degradation' : 'improvement',
        category: 'bestPractices',
        message: `Score des meilleures pratiques ${
          bpDiff < 0 ? 'dégradé' : 'amélioré'
        } de ${Math.abs(bpDiff).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        previousValue: previousEntry.avgBestPracticesScore,
        currentValue: currentEntry.avgBestPracticesScore,
      });
    }

    // Score Utilisabilité (nouveau)
    if (currentEntry.avgUsabilityScore && previousEntry.avgUsabilityScore) {
      const usabilityDiff = currentEntry.avgUsabilityScore - previousEntry.avgUsabilityScore;
      if (Math.abs(usabilityDiff) >= significantChange) {
        alerts.push({
          type: usabilityDiff < 0 ? 'degradation' : 'improvement',
          category: 'usability',
          message: `Score d'utilisabilité ${
            usabilityDiff < 0 ? 'dégradé' : 'amélioré'
          } de ${Math.abs(usabilityDiff).toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          previousValue: previousEntry.avgUsabilityScore,
          currentValue: currentEntry.avgUsabilityScore,
        });
      }
    }

    // Score UX (nouveau)
    if (currentEntry.avgUXScore && previousEntry.avgUXScore) {
      const uxDiff = currentEntry.avgUXScore - previousEntry.avgUXScore;
      if (Math.abs(uxDiff) >= significantChange) {
        alerts.push({
          type: uxDiff < 0 ? 'degradation' : 'improvement',
          category: 'ux',
          message: `Score d'expérience utilisateur ${
            uxDiff < 0 ? 'dégradé' : 'amélioré'
          } de ${Math.abs(uxDiff).toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          previousValue: previousEntry.avgUXScore,
          currentValue: currentEntry.avgUXScore,
        });
      }
    }

    // Alerter sur les fichiers avec une dégradation significative
    Object.entries(currentData.results).forEach(([filePath, result]) => {
      // Vérifier l'historique de ce fichier s'il existe
      if (result.history && result.history.length >= 2) {
        const lastEntry = result.history[result.history.length - 1];
        const prevEntry = result.history[result.history.length - 2];

        const scoreDiff = lastEntry.score - prevEntry.score;
        if (scoreDiff <= -10) {
          // Dégradation de 10% ou plus
          alerts.push({
            type: 'degradation',
            category: 'file',
            file: filePath,
            message: `Dégradation significative du fichier ${filePath} de ${Math.abs(scoreDiff)}%`,
            timestamp: new Date().toISOString(),
            previousValue: prevEntry.score,
            currentValue: lastEntry.score,
          });
        }
      }
    });

    // Sauvegarder les alertes
    if (alerts.length > 0) {
      console.log(`⚠️ ${alerts.length} alertes détectées`);

      // Charger les alertes existantes
      let existingAlerts = [];
      if (fs.existsSync(CONFIG.notificationsFile)) {
        existingAlerts = JSON.parse(fs.readFileSync(CONFIG.notificationsFile, 'utf8'));
      }

      // Ajouter les nouvelles alertes
      const updatedAlerts = [...existingAlerts, ...alerts];

      // Limiter à 100 alertes maximales
      const limitedAlerts = updatedAlerts.slice(-100);

      // Sauvegarder les alertes
      fs.writeFileSync(CONFIG.notificationsFile, JSON.stringify(limitedAlerts, null, 2));
      console.log(`✅ Alertes sauvegardées dans ${CONFIG.notificationsFile}`);

      // Afficher les alertes de dégradation dans la console
      const degradationAlerts = alerts.filter((a) => a.type === 'degradation');
      if (degradationAlerts.length > 0) {
        console.log('\n🔴 Alertes de dégradation:');
        degradationAlerts.forEach((alert) => {
          console.log(`- ${alert.message}`);
        });
      }

      // Envoyer les alertes via le service de notification si configuré
      if (
        CONFIG.notifications &&
        (CONFIG.notifications.slack || CONFIG.notifications.teams || CONFIG.notifications.email)
      ) {
        try {
          // Dynamically import the NotificationService
          const {
            default: NotificationService,
          } = require('../app/services/NotificationServicestructure-agent');
          const notificationService = new NotificationService(CONFIG.notifications);

          console.log('\n📢 Envoi des alertes aux canaux de notification...');
          notificationService
            .sendAlerts(alerts)
            .then((success) => {
              if (success) {
                console.log('✅ Alertes envoyées avec succès');
              } else {
                console.log("⚠️ Échec de l'envoi des alertes");
              }
            })
            .catch((error) => {
              console.error("❌ Erreur lors de l'envoi des alertes:", error);
            });
        } catch (error) {
          console.error('❌ Erreur lors du chargement du service de notification:', error);
        }
      }
    } else {
      console.log('✅ Aucun changement significatif détecté');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la détection des changements:', error.message);
    throw error;
  }
}

// Démarrer l'exécution
main().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
