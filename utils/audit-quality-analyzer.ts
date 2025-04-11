/**
 * Analyseur de qualité des audits
 * 
 * Ce script analyse tous les fichiers d'audit et génère des métriques de qualité
 * qui permettent de suivre l'évolution de la qualité des audits dans le temps.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';

// Interfaces pour les types de données
interface AuditMetrics {
  completeness: number;     // Complétude de l'audit (0-100%)
  consistency: number;      // Cohérence entre les fichiers (0-100%)
  complexity: number;       // Complexité estimée (0-10)
  coverage: number;         // Couverture des fonctionnalités (0-100%)
  migrationReadiness: number; // Préparation à la migration (0-100%)
}

interface AuditQualityReport {
  timestamp: string;
  totalAudits: number;
  averageMetrics: AuditMetrics;
  metrics: {
    [slug: string]: {
      metrics: AuditMetrics;
      files: string[];
      lastUpdated: string;
    }
  };
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: {
    priority: string[];
    needsReview: string[];
    exemplary: string[];
  };
}

// Configuration
const CONFIG = {
  extensions: {
    audit: '.audit.md',
    backlog: '.backlog.json',
    impactGraph: '.impact_graph.json',
  },
  directories: {
    audits: './reports/audits',
    backlogs: './reports/backlogs',
    impactGraphs: './reports/impact_graphs',
  },
  outputFile: './reports/audit_quality_metrics.json',
  historyFile: './reports/audit_quality_history.json',
  weightings: {
    sectionCompleteness: 0.3,
    backlogTasks: 0.2,
    dependenciesMapping: 0.15,
    consistencyScore: 0.2,
    technicalDetails: 0.15,
  }
};

/**
 * Fonction principale
 */
export async function analyzeAuditQuality(
  options: { verbose: boolean } = { verbose: false }
): Promise<AuditQualityReport> {
  console.log(chalk.blue('📊 Analyse de la qualité des audits...'));

  // 1. Collecte des fichiers d'audit
  const auditFiles = await collectAuditFiles();
  
  // 2. Analyse des métriques par audit
  const metricsMap = await analyzeMetricsByAudit(auditFiles);
  
  // 3. Calcul des métriques moyennes
  const averageMetrics = calculateAverageMetrics(metricsMap);
  
  // 4. Analyse des tendances (si l'historique existe)
  const trends = await analyzeTrends(metricsMap);
  
  // 5. Génération de recommandations
  const recommendations = generateRecommendations(metricsMap);
  
  // 6. Compilation du rapport final
  const report: AuditQualityReport = {
    timestamp: new Date().toISOString(),
    totalAudits: Object.keys(metricsMap).length,
    averageMetrics,
    metrics: metricsMap,
    trends,
    recommendations,
  };
  
  // 7. Sauvegarde du rapport et mise à jour de l'historique
  await saveReport(report);
  await updateHistory(report);
  
  // 8. Affichage des résultats si demandé
  if (options.verbose) {
    displayResults(report);
  }
  
  return report;
}

/**
 * Collecte tous les fichiers d'audit et les regroupe par slug
 */
async function collectAuditFiles(): Promise<{ [slug: string]: { audit?: string, backlog?: string, impactGraph?: string } }> {
  const result: { [slug: string]: { audit?: string, backlog?: string, impactGraph?: string } } = {};
  
  // Collecter les fichiers d'audit
  const auditFiles = glob.sync(`${CONFIG.directories.audits}/**/*${CONFIG.extensions.audit}`);
  auditFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const slug = extractField(content, 'slug');
    if (slug) {
      if (!result[slug]) result[slug] = {};
      result[slug].audit = filePath;
    }
  });
  
  // Collecter les fichiers de backlog
  const backlogFiles = glob.sync(`${CONFIG.directories.backlogs}/**/*${CONFIG.extensions.backlog}`);
  backlogFiles.forEach(filePath => {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const slug = content.slug;
      if (slug) {
        if (!result[slug]) result[slug] = {};
        result[slug].backlog = filePath;
      }
    } catch (error) {}
  });
  
  // Collecter les fichiers de graphe d'impact
  const impactGraphFiles = glob.sync(`${CONFIG.directories.impactGraphs}/**/*${CONFIG.extensions.impactGraph}`);
  impactGraphFiles.forEach(filePath => {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const slug = content.slug;
      if (slug) {
        if (!result[slug]) result[slug] = {};
        result[slug].impactGraph = filePath;
      }
    } catch (error) {}
  });
  
  return result;
}

/**
 * Analyse les métriques pour chaque audit
 */
async function analyzeMetricsByAudit(
  auditFiles: { [slug: string]: { audit?: string, backlog?: string, impactGraph?: string } }
): Promise<{ [slug: string]: { metrics: AuditMetrics, files: string[], lastUpdated: string } }> {
  const result: { [slug: string]: { metrics: AuditMetrics, files: string[], lastUpdated: string } } = {};
  
  for (const [slug, files] of Object.entries(auditFiles)) {
    // Liste des fichiers pour cet audit
    const filesList = [
      files.audit,
      files.backlog,
      files.impactGraph
    ].filter(Boolean) as string[];
    
    // Dernière mise à jour (date de modification la plus récente)
    const lastModified = Math.max(
      ...filesList.map(file => fs.statSync(file).mtime.getTime())
    );
    
    // Analyse des métriques
    const metrics = {
      completeness: analyzeCompleteness(files),
      consistency: analyzeConsistency(files),
      complexity: analyzeComplexity(files),
      coverage: analyzeCoverage(files),
      migrationReadiness: analyzeMigrationReadiness(files),
    };
    
    result[slug] = {
      metrics,
      files: filesList,
      lastUpdated: new Date(lastModified).toISOString(),
    };
  }
  
  return result;
}

/**
 * Analyse la complétude d'un audit (sections remplies, détails, etc.)
 */
function analyzeCompleteness(
  files: { audit?: string, backlog?: string, impactGraph?: string }
): number {
  let score = 0;
  let maxScore = 0;
  
  // Vérifier le fichier d'audit
  if (files.audit) {
    const content = fs.readFileSync(files.audit, 'utf8');
    maxScore += 60;
    
    // Sections principales attendues
    const expectedSections = [
      'Objectif du module', 
      'Modèle SQL associé', 
      'Routes associées',
      'Checklist de validation',
      'Migration',
      'Logique métier'
    ];
    
    // Vérifier chaque section
    for (const section of expectedSections) {
      if (content.includes(`## ${section}`)) {
        score += 5;
        
        // Bonus pour le contenu de la section
        const sectionMatch = content.match(new RegExp(`## ${section}[\\s\\S]*?(## |$)`));
        if (sectionMatch) {
          const sectionContent = sectionMatch[0];
          // Vérifier la taille de la section (au moins 50 caractères)
          if (sectionContent.length > 50) score += 5;
        }
      }
    }
  }
  
  // Vérifier le fichier de backlog
  if (files.backlog) {
    maxScore += 20;
    try {
      const content = JSON.parse(fs.readFileSync(files.backlog, 'utf8'));
      if (content.tasks && Array.isArray(content.tasks)) {
        // Points pour le nombre de tâches (jusqu'à 10 points)
        score += Math.min(content.tasks.length, 10);
        
        // Points pour la qualité des tâches
        const qualityScore = content.tasks.reduce((sum, task) => {
          return sum + (task.description && task.description.length > 30 ? 1 : 0);
        }, 0);
        score += Math.min(qualityScore, 10);
      }
    } catch (error) {}
  }
  
  // Vérifier le fichier de graphe d'impact
  if (files.impactGraph) {
    maxScore += 20;
    try {
      const content = JSON.parse(fs.readFileSync(files.impactGraph, 'utf8'));
      if (content.dependencies && Array.isArray(content.dependencies)) {
        // Points pour le nombre de dépendances (jusqu'à 10 points)
        score += Math.min(content.dependencies.length, 10);
        
        // Points pour la diversité des dépendances (types différents)
        const types = new Set(content.dependencies.map(d => d.type));
        score += Math.min(types.size * 2, 10);
      }
    } catch (error) {}
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

/**
 * Analyse la cohérence entre les différents fichiers d'un audit
 */
function analyzeConsistency(
  files: { audit?: string, backlog?: string, impactGraph?: string }
): number {
  if (!files.audit || !files.backlog) return 0;
  
  let score = 0;
  const maxScore = 100;
  
  try {
    // Extraire les informations du fichier d'audit
    const auditContent = fs.readFileSync(files.audit, 'utf8');
    const auditSlug = extractField(auditContent, 'slug');
    const auditTable = extractField(auditContent, 'table');
    const auditType = extractField(auditContent, 'type');
    
    // Extraire les informations du fichier de backlog
    const backlogContent = JSON.parse(fs.readFileSync(files.backlog, 'utf8'));
    const backlogSlug = backlogContent.slug;
    const backlogTable = backlogContent.table;
    const backlogType = backlogContent.type;
    
    // Points si les slugs correspondent
    if (auditSlug && backlogSlug && auditSlug === backlogSlug) {
      score += 40;
    }
    
    // Points si les tables correspondent
    if (auditTable && backlogTable && auditTable === backlogTable) {
      score += 30;
    }
    
    // Points si les types correspondent
    if (auditType && backlogType && auditType === backlogType) {
      score += 30;
    }
    
    // Si le graphe d'impact existe, vérifier sa cohérence aussi
    if (files.impactGraph) {
      try {
        const impactContent = JSON.parse(fs.readFileSync(files.impactGraph, 'utf8'));
        const impactSlug = impactContent.slug;
        
        // Bonus si le slug du graphe correspond aussi
        if (auditSlug && impactSlug && auditSlug === impactSlug) {
          score += 15;
        }
      } catch (error) {}
    }
  } catch (error) {
    return 0;
  }
  
  return Math.min(score, 100);
}

/**
 * Analyse la complexité de l'audit et du code associé
 */
function analyzeComplexity(
  files: { audit?: string, backlog?: string, impactGraph?: string }
): number {
  let complexity = 0;
  
  // Complexité basée sur le nombre de dépendances
  if (files.impactGraph) {
    try {
      const content = JSON.parse(fs.readFileSync(files.impactGraph, 'utf8'));
      if (content.dependencies && Array.isArray(content.dependencies)) {
        // Facteur de complexité basé sur le nombre de dépendances
        const dependencyCount = content.dependencies.length;
        complexity += Math.min(dependencyCount / 10, 5);
        
        // Facteur de complexité basé sur la profondeur des dépendances
        const dependencyTypes = new Set(content.dependencies.map(d => d.type));
        complexity += Math.min(dependencyTypes.size / 2, 2);
      }
    } catch (error) {}
  }
  
  // Complexité basée sur les tâches du backlog
  if (files.backlog) {
    try {
      const content = JSON.parse(fs.readFileSync(files.backlog, 'utf8'));
      if (content.tasks && Array.isArray(content.tasks)) {
        // Facteur de complexité basé sur le nombre de tâches
        const taskCount = content.tasks.length;
        complexity += Math.min(taskCount / 5, 3);
        
        // Facteur de complexité basé sur les types de tâches
        const taskTypes = new Set(content.tasks.map(t => t.type));
        complexity += Math.min(taskTypes.size / 3, 2);
      }
    } catch (error) {}
  }
  
  // Complexité basée sur le contenu de l'audit
  if (files.audit) {
    try {
      const content = fs.readFileSync(files.audit, 'utf8');
      
      // Facteur de complexité basé sur la taille du fichier
      const fileSize = content.length;
      complexity += Math.min(fileSize / 5000, 2);
      
      // Facteur de complexité basé sur le nombre de sections
      const sectionCount = (content.match(/##\s/g) || []).length;
      complexity += Math.min(sectionCount / 5, 1);
    } catch (error) {}
  }
  
  // Garantir une échelle de 0 à 10
  return Math.min(Math.max(complexity, 0), 10);
}

/**
 * Analyse la couverture des fonctionnalités dans l'audit
 */
function analyzeCoverage(
  files: { audit?: string, backlog?: string, impactGraph?: string }
): number {
  let score = 0;
  let maxScore = 0;
  
  if (files.audit) {
    const content = fs.readFileSync(files.audit, 'utf8');
    maxScore += 50;
    
    // Vérifier la couverture des fonctionnalités principales
    const keyFunctionalities = [
      'authentification', 'autorisation', 'validation', 'données', 
      'formulaire', 'affichage', 'API', 'base de données', 'requête',
      'utilisateur', 'session', 'cache'
    ];
    
    // Compter combien de ces fonctionnalités sont mentionnées
    const mentionedCount = keyFunctionalities.filter(func => 
      content.toLowerCase().includes(func.toLowerCase())
    ).length;
    
    score += (mentionedCount / keyFunctionalities.length) * 50;
  }
  
  if (files.backlog) {
    maxScore += 50;
    try {
      const content = JSON.parse(fs.readFileSync(files.backlog, 'utf8'));
      if (content.tasks && Array.isArray(content.tasks)) {
        // Vérifier les types de tâches pour évaluer la couverture
        const expectedTaskTypes = [
          'controller', 'model', 'view', 'service', 'migration',
          'test', 'validation', 'security', 'documentation'
        ];
        
        // Extraire les types uniques de tâches
        const taskTypes = new Set(content.tasks.map(t => 
          (t.type || '').toLowerCase()
        ));
        
        // Calculer le score basé sur la couverture des types de tâches
        const coveredTypes = expectedTaskTypes.filter(type => 
          Array.from(taskTypes).some(t => t.includes(type))
        ).length;
        
        score += (coveredTypes / expectedTaskTypes.length) * 50;
      }
    } catch (error) {}
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

/**
 * Analyse la préparation à la migration
 */
function analyzeMigrationReadiness(
  files: { audit?: string, backlog?: string, impactGraph?: string }
): number {
  let score = 0;
  let maxScore = 0;
  
  // Vérification du fichier d'audit
  if (files.audit) {
    const content = fs.readFileSync(files.audit, 'utf8');
    maxScore += 40;
    
    // Vérifier si une section de migration existe
    if (content.includes('## Migration') || content.includes('## Plan de migration')) {
      score += 20;
      
      // Vérifier la qualité du plan de migration
      const migrationMatch = content.match(/## Migration[^#]*|## Plan de migration[^#]*/);
      if (migrationMatch) {
        const migrationContent = migrationMatch[0];
        
        // Points pour la taille du plan (au moins 200 caractères)
        if (migrationContent.length > 200) score += 10;
        
        // Points pour la structure du plan (étapes numérotées)
        if (migrationContent.match(/\d+\.\s/)) score += 10;
      }
    }
  }
  
  // Vérification du fichier de backlog
  if (files.backlog) {
    maxScore += 60;
    try {
      const content = JSON.parse(fs.readFileSync(files.backlog, 'utf8'));
      if (content.tasks && Array.isArray(content.tasks)) {
        // Vérifier si les types de tâches nécessaires à la migration sont présents
        const migrationTaskTypes = [
          'migration', 'controller', 'model', 'dto', 'test', 'validation'
        ];
        
        // Calculer le score basé sur les types de tâches
        const taskTypes = content.tasks.map(t => (t.type || '').toLowerCase());
        const coveredTypes = migrationTaskTypes.filter(type => 
          taskTypes.some(t => t.includes(type))
        );
        
        score += (coveredTypes.length / migrationTaskTypes.length) * 30;
        
        // Vérifier l'état des tâches (combien sont complétées)
        const completedTasks = content.tasks.filter(t => t.status === 'done').length;
        const totalTasks = content.tasks.length;
        
        if (totalTasks > 0) {
          score += (completedTasks / totalTasks) * 30;
        }
      }
    } catch (error) {}
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

/**
 * Calcule les métriques moyennes sur tous les audits
 */
function calculateAverageMetrics(
  metricsMap: { [slug: string]: { metrics: AuditMetrics, files: string[], lastUpdated: string } }
): AuditMetrics {
  const slugs = Object.keys(metricsMap);
  if (slugs.length === 0) {
    return {
      completeness: 0,
      consistency: 0,
      complexity: 0,
      coverage: 0,
      migrationReadiness: 0,
    };
  }
  
  const totals = {
    completeness: 0,
    consistency: 0,
    complexity: 0,
    coverage: 0,
    migrationReadiness: 0,
  };
  
  for (const slug of slugs) {
    const metrics = metricsMap[slug].metrics;
    totals.completeness += metrics.completeness;
    totals.consistency += metrics.consistency;
    totals.complexity += metrics.complexity;
    totals.coverage += metrics.coverage;
    totals.migrationReadiness += metrics.migrationReadiness;
  }
  
  return {
    completeness: totals.completeness / slugs.length,
    consistency: totals.consistency / slugs.length,
    complexity: totals.complexity / slugs.length,
    coverage: totals.coverage / slugs.length,
    migrationReadiness: totals.migrationReadiness / slugs.length,
  };
}

/**
 * Analyse les tendances en comparant avec l'historique
 */
async function analyzeTrends(
  currentMetrics: { [slug: string]: { metrics: AuditMetrics, files: string[], lastUpdated: string } }
): Promise<{ improving: string[], declining: string[], stable: string[] }> {
  const result = {
    improving: [] as string[],
    declining: [] as string[],
    stable: [] as string[],
  };
  
  // Charger l'historique si disponible
  let history: AuditQualityReport[] = [];
  try {
    if (fs.existsSync(CONFIG.historyFile)) {
      history = JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf8'));
    }
  } catch (error) {
    return result;
  }
  
  // S'il n'y a pas d'historique, considérer tous les audits comme stables
  if (history.length === 0) {
    result.stable = Object.keys(currentMetrics);
    return result;
  }
  
  // Trouver le rapport le plus récent
  const latestReport = history[history.length - 1];
  
  // Comparer les métriques pour chaque audit
  for (const slug of Object.keys(currentMetrics)) {
    const current = currentMetrics[slug].metrics;
    
    // Si l'audit existe dans l'historique, comparer les métriques
    if (latestReport.metrics && latestReport.metrics[slug]) {
      const previous = latestReport.metrics[slug].metrics;
      
      // Calculer un score global pour chaque version
      const currentScore = (
        current.completeness * 0.3 +
        current.consistency * 0.3 +
        current.coverage * 0.2 +
        current.migrationReadiness * 0.2
      );
      
      const previousScore = (
        previous.completeness * 0.3 +
        previous.consistency * 0.3 +
        previous.coverage * 0.2 +
        previous.migrationReadiness * 0.2
      );
      
      // Déterminer la tendance
      const difference = currentScore - previousScore;
      if (difference > 5) {
        result.improving.push(slug);
      } else if (difference < -5) {
        result.declining.push(slug);
      } else {
        result.stable.push(slug);
      }
    } else {
      // Nouvel audit, le considérer comme stable
      result.stable.push(slug);
    }
  }
  
  return result;
}

/**
 * Génère des recommandations basées sur les métriques
 */
function generateRecommendations(
  metricsMap: { [slug: string]: { metrics: AuditMetrics, files: string[], lastUpdated: string } }
): { priority: string[], needsReview: string[], exemplary: string[] } {
  const result = {
    priority: [] as string[],    // Audits à améliorer en priorité
    needsReview: [] as string[], // Audits qui nécessitent une revue
    exemplary: [] as string[],   // Audits exemplaires
  };
  
  for (const [slug, data] of Object.entries(metricsMap)) {
    const metrics = data.metrics;
    
    // Calcul d'un score global
    const globalScore = (
      metrics.completeness * 0.3 +
      metrics.consistency * 0.3 +
      metrics.coverage * 0.2 +
      metrics.migrationReadiness * 0.2
    );
    
    // Identifier les audits prioritaires (score global faible)
    if (globalScore < 50) {
      result.priority.push(slug);
    }
    
    // Identifier les audits qui nécessitent une revue (incohérences)
    if (metrics.consistency < 70 || (metrics.completeness > 80 && metrics.coverage < 50)) {
      result.needsReview.push(slug);
    }
    
    // Identifier les audits exemplaires (bon score global)
    if (globalScore > 85 && metrics.consistency > 90) {
      result.exemplary.push(slug);
    }
  }
  
  return result;
}

/**
 * Sauvegarde le rapport de qualité
 */
async function saveReport(report: AuditQualityReport): Promise<void> {
  const outputDir = path.dirname(CONFIG.outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(chalk.green(`📊 Rapport de qualité des audits généré: ${CONFIG.outputFile}`));
}

/**
 * Met à jour l'historique des rapports de qualité
 */
async function updateHistory(report: AuditQualityReport): Promise<void> {
  // Charger l'historique existant
  let history: AuditQualityReport[] = [];
  try {
    if (fs.existsSync(CONFIG.historyFile)) {
      history = JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf8'));
    }
  } catch (error) {}
  
  // Ajouter le nouveau rapport (limiter à 10 rapports)
  history.push(report);
  if (history.length > 10) {
    history = history.slice(history.length - 10);
  }
  
  // Sauvegarder l'historique
  const historyDir = path.dirname(CONFIG.historyFile);
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.historyFile, JSON.stringify(history, null, 2), 'utf8');
  console.log(chalk.green(`📚 Historique des rapports de qualité mis à jour: ${CONFIG.historyFile}`));
}

/**
 * Affiche les résultats de l'analyse
 */
function displayResults(report: AuditQualityReport): void {
  console.log(chalk.blue('\n📊 Résultats de l\'analyse de qualité:'));
  
  // Afficher les métriques moyennes
  console.log(chalk.yellow('\n→ Métriques moyennes:'));
  console.log(`  Complétude: ${report.averageMetrics.completeness.toFixed(1)}%`);
  console.log(`  Cohérence: ${report.averageMetrics.consistency.toFixed(1)}%`);
  console.log(`  Complexité: ${report.averageMetrics.complexity.toFixed(1)}/10`);
  console.log(`  Couverture: ${report.averageMetrics.coverage.toFixed(1)}%`);
  console.log(`  Préparation à la migration: ${report.averageMetrics.migrationReadiness.toFixed(1)}%`);
  
  // Afficher les audits exemplaires
  if (report.recommendations.exemplary.length > 0) {
    console.log(chalk.green('\n→ Audits exemplaires:'));
    report.recommendations.exemplary.forEach(slug => {
      console.log(`  - ${slug}`);
    });
  }
  
  // Afficher les audits prioritaires
  if (report.recommendations.priority.length > 0) {
    console.log(chalk.red('\n→ Audits prioritaires à améliorer:'));
    report.recommendations.priority.forEach(slug => {
      console.log(`  - ${slug}`);
    });
  }
  
  // Afficher les audits qui nécessitent une revue
  if (report.recommendations.needsReview.length > 0) {
    console.log(chalk.yellow('\n→ Audits nécessitant une revue:'));
    report.recommendations.needsReview.forEach(slug => {
      console.log(`  - ${slug}`);
    });
  }
  
  // Afficher les tendances
  console.log(chalk.blue('\n→ Tendances:'));
  console.log(`  En amélioration: ${report.trends.improving.length}`);
  console.log(`  En déclin: ${report.trends.declining.length}`);
  console.log(`  Stables: ${report.trends.stable.length}`);
}

/**
 * Extrait un champ à partir du contenu de l'audit
 */
function extractField(content: string, fieldName: string): string | undefined {
  const regex = new RegExp(`## ${fieldName}:([^\\n]*)|${fieldName}:\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? (match[1] || match[2]).trim() : undefined;
}

// Point d'entrée en cas d'exécution directe
if (require.main === module) {
  (async () => {
    const options = {
      verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
    };
    
    await analyzeAuditQuality(options);
  })();
}