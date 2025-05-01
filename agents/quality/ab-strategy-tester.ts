import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent } from '../orchestration/types.ts';
import { agents } from './agentRegistry';

/**
 * Structure des tests A/B pour comparer des stratégies de migration
 */
interface ABTestingConfig {
  id: string;
  name: string;
  description?: string;
  sourceFile: string;
  sourceDependencies?: string[];
  strategies: Array<{
    id: string;
    name: string;
    description?: string;
    agents: string[];
    options?: Record<string, any>;
  }>;
  evaluationCriteria: {
    metrics: string[];
    weights?: Record<string, number>;
    customTests?: Array<{
      name: string;
      command: string;
      weight?: number;
    }>;
  };
  outputs?: {
    reportFormat?: 'json' | 'markdown' | 'html';
    outputDirectory?: string;
    saveGeneratedFiles?: boolean;
  };
  schedule?: {
    enabled?: boolean;
    cron?: string;
    notifyEmail?: string;
  };
}

/**
 * Structure des résultats d'un test A/B
 */
interface ABTestResults {
  testId: string;
  testName: string;
  sourceFile: string;
  timestamp: string;
  strategies: Array<{
    id: string;
    name: string;
    metrics: Record<string, number>;
    success: boolean;
    duration: number;
    outputs: string[];
    errors?: string[];
  }>;
  winner?: {
    strategyId: string;
    score: number;
    comparisonDetails: Record<string, any>;
  };
  rawData: Record<string, any>;
}

/**
 * ABStrategyTester - Agent pour tester et comparer différentes stratégies de migration
 *
 * Cet agent permet d'exécuter des tests A/B entre différentes combinaisons d'agents
 * pour déterminer quelle stratégie donne les meilleurs résultats pour un type de fichier donné.
 */
export class ABStrategyTester implements BaseAgent {
  id = 'ab-strategy-tester';
  name = 'A/B Strategy Tester';
  version = '1.0.0';

  /**
   * Exécute un test A/B entre différentes stratégies de migration
   * @param config Configuration du test A/B ou chemin vers un fichier de configuration
   * @returns Résultats du test A/B avec les métriques et la stratégie gagnante
   */
  async execute(config: ABTestingConfig | string): Promise<ABTestResults> {
    console.log('Démarrage du test A/B des stratégies de migration...');

    // Charger la configuration si un chemin a été fourni
    const testConfig = typeof config === 'string' ? this.loadConfigFromFile(config) : config;

    // Valider la configuration
    this.validateConfig(testConfig);

    // Préparer le répertoire de sortie
    const outputDir = this.prepareOutputDirectory(testConfig);

    // Exécuter chaque stratégie
    const results = await this.executeStrategies(testConfig, outputDir);

    // Évaluer les résultats
    const evaluatedResults = this.evaluateResults(results, testConfig);

    // Générer un rapport
    await this.generateReport(evaluatedResults, testConfig, outputDir);

    console.log(`Test A/B terminé. Résultats disponibles dans: ${outputDir}`);

    return evaluatedResults;
  }

  /**
   * Charge la configuration depuis un fichier
   */
  private loadConfigFromFile(filePath: string): ABTestingConfig {
    try {
      const configContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(configContent) as ABTestingConfig;
    } catch (error) {
      throw new Error(`Erreur lors du chargement de la configuration: ${error.message}`);
    }
  }

  /**
   * Valide la configuration du test A/B
   */
  private validateConfig(config: ABTestingConfig): void {
    // Vérifier les champs requis
    if (!config.sourceFile) {
      throw new Error('Le fichier source est requis dans la configuration');
    }

    if (!config.strategies || config.strategies.length < 2) {
      throw new Error('Au moins deux stratégies sont nécessaires pour un test A/B');
    }

    if (
      !config.evaluationCriteria ||
      !config.evaluationCriteria.metrics ||
      config.evaluationCriteria.metrics.length === 0
    ) {
      throw new Error("Les critères d'évaluation sont requis");
    }

    // Vérifier l'existence du fichier source
    if (!fs.existsSync(config.sourceFile)) {
      throw new Error(`Le fichier source n'existe pas: ${config.sourceFile}`);
    }

    // Vérifier l'existence des agents
    for (const strategy of config.strategies) {
      for (const agentId of strategy.agents) {
        if (!agents[agentId]) {
          throw new Error(`Agent non trouvé: ${agentId} dans la stratégie ${strategy.id}`);
        }
      }
    }
  }

  /**
   * Prépare le répertoire de sortie pour les résultats du test
   */
  private prepareOutputDirectory(config: ABTestingConfig): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testId = config.id || 'ab-test';

    const baseDir = config.outputs?.outputDirectory || path.resolve(__dirname, '../audit/ab-tests');
    const outputDir = path.join(baseDir, `${testId}-${timestamp}`);

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return outputDir;
  }

  /**
   * Exécute chaque stratégie et collecte les résultats
   */
  private async executeStrategies(
    config: ABTestingConfig,
    outputDir: string
  ): Promise<ABTestResults> {
    const results: ABTestResults = {
      testId: config.id || 'unknown',
      testName: config.name || 'Unnamed A/B Test',
      sourceFile: config.sourceFile,
      timestamp: new Date().toISOString(),
      strategies: [],
      rawData: {},
    };

    // Copier le fichier source dans un répertoire temporaire pour chaque stratégie
    for (const strategy of config.strategies) {
      console.log(`Exécution de la stratégie: ${strategy.name || strategy.id}`);

      const strategyDir = path.join(outputDir, strategy.id);
      if (!fs.existsSync(strategyDir)) {
        fs.mkdirSync(strategyDir, { recursive: true });
      }

      // Copier le fichier source
      const sourceFileName = path.basename(config.sourceFile);
      const targetSourcePath = path.join(strategyDir, sourceFileName);
      fs.copyFileSync(config.sourceFile, targetSourcePath);

      // Copier les dépendances si spécifiées
      if (config.sourceDependencies) {
        for (const depPath of config.sourceDependencies) {
          if (fs.existsSync(depPath)) {
            const depFileName = path.basename(depPath);
            const targetDepPath = path.join(strategyDir, depFileName);
            fs.copyFileSync(depPath, targetDepPath);
          } else {
            console.warn(`Dépendance non trouvée: ${depPath}`);
          }
        }
      }

      // Exécuter les agents dans l'ordre spécifié
      const strategyResult = {
        id: strategy.id,
        name: strategy.name || strategy.id,
        metrics: {} as Record<string, number>,
        success: true,
        duration: 0,
        outputs: [] as string[],
        errors: [] as string[],
      };

      const startTime = Date.now();

      try {
        let currentInput: any = {
          sourcePath: targetSourcePath,
          options: strategy.options || {},
        };

        for (const agentId of strategy.agents) {
          const agent = agents[agentId];

          if (!agent) {
            throw new Error(`Agent non trouvé: ${agentId}`);
          }

          console.log(`Exécution de l'agent ${agentId}...`);
          const agentStartTime = Date.now();

          try {
            const agentOutput = await agent.execute(currentInput);
            currentInput = agentOutput; // L'output devient l'input de l'agent suivant

            // Enregistrer les fichiers générés
            if (typeof agentOutput === 'object' && agentOutput.outputPath) {
              strategyResult.outputs.push(agentOutput.outputPath);
            }

            // Collecter des métriques basiques pour cet agent
            const agentDuration = Date.now() - agentStartTime;
            strategyResult.metrics[`${agentId}_duration`] = agentDuration;
          } catch (agentError) {
            strategyResult.success = false;
            strategyResult.errors.push(`Erreur dans l'agent ${agentId}: ${agentError.message}`);
            console.error(`Erreur lors de l'exécution de l'agent ${agentId}:`, agentError);
            break;
          }
        }
      } catch (strategyError) {
        strategyResult.success = false;
        strategyResult.errors.push(`Erreur générale: ${strategyError.message}`);
        console.error(`Erreur lors de l'exécution de la stratégie ${strategy.id}:`, strategyError);
      }

      strategyResult.duration = Date.now() - startTime;

      // Exécuter les métriques d'évaluation
      if (strategyResult.success) {
        strategyResult.metrics = {
          ...strategyResult.metrics,
          ...(await this.collectMetrics(config, strategyDir, strategy.id)),
        };
      }

      results.strategies.push(strategyResult);
      results.rawData[strategy.id] = {
        outputs: strategyResult.outputs,
        metrics: strategyResult.metrics,
      };
    }

    return results;
  }

  /**
   * Collecte les métriques pour évaluer chaque stratégie
   */
  private async collectMetrics(
    config: ABTestingConfig,
    strategyDir: string,
    _strategyId: string
  ): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};

    // Collecter les métriques demandées
    for (const metric of config.evaluationCriteria.metrics) {
      switch (metric) {
        case 'performance':
          // Mesurer la performance (temps d'exécution déjà collecté)
          break;

        case 'codeQuality':
          // Exécuter ESLint pour mesurer la qualité du code
          try {
            const eslintResults = this.runCommand(`npx eslint ${strategyDir} --format json`);
            const eslintData = JSON.parse(eslintResults);
            const totalProblems = eslintData.reduce(
              (acc, file) => acc + file.errorCount + file.warningCount,
              0
            );
            metrics.codeQuality = totalProblems === 0 ? 100 : Math.max(0, 100 - totalProblems * 5);
          } catch (error) {
            metrics.codeQuality = 0;
            console.error(`Erreur lors de l'évaluation de la qualité du code:`, error.message);
          }
          break;

        case 'bundleSize':
          // Mesurer la taille des fichiers générés
          try {
            let totalSize = 0;
            const files = fs.readdirSync(strategyDir);

            for (const file of files) {
              const filePath = path.join(strategyDir, file);
              const stats = fs.statSync(filePath);
              if (stats.isFile()) {
                totalSize += stats.size;
              }
            }

            metrics.bundleSize = totalSize;
          } catch (error) {
            metrics.bundleSize = 0;
            console.error('Erreur lors du calcul de la taille des fichiers:', error.message);
          }
          break;

        case 'numTypescriptErrors':
          // Compter les erreurs TypeScript
          try {
            const tsResults = this.runCommand(
              `npx tsc --noEmit --project ${strategyDir} 2>&1 || true`
            );
            const errorCount = (tsResults.match(/error TS/g) || []).length;
            metrics.numTypescriptErrors = errorCount;
          } catch (error) {
            metrics.numTypescriptErrors = 100; // Valeur pénalisante en cas d'erreur
            console.error('Erreur lors du comptage des erreurs TypeScript:', error.message);
          }
          break;

        // Autres métriques...
        default:
          console.warn(`Métrique non supportée: ${metric}`);
      }
    }

    // Exécuter les tests personnalisés
    if (config.evaluationCriteria.customTests) {
      for (const test of config.evaluationCriteria.customTests) {
        try {
          const customCommand = test.command.replace('{dir}', strategyDir);
          const result = this.runCommand(customCommand);

          try {
            const numericResult = parseFloat(result.trim());
            if (!Number.isNaN(numericResult)) {
              metrics[test.name] = numericResult;
            }
          } catch {
            // Le résultat n'est pas un nombre, ignorer
          }
        } catch (error) {
          console.error(
            `Erreur lors de l'exécution du test personnalisé ${test.name}:`,
            error.message
          );
        }
      }
    }

    return metrics;
  }

  /**
   * Évalue les résultats et détermine la stratégie gagnante
   */
  private evaluateResults(results: ABTestResults, config: ABTestingConfig): ABTestResults {
    // Ne comparer que les stratégies réussies
    const successfulStrategies = results.strategies.filter((s) => s.success);

    if (successfulStrategies.length < 2) {
      console.log('Pas assez de stratégies réussies pour comparer');
      return results;
    }

    // Normaliser les métriques pour avoir une base comparable
    const normalizedMetrics = this.normalizeMetrics(
      successfulStrategies,
      config.evaluationCriteria.metrics
    );

    // Calculer un score global pour chaque stratégie
    const scores: Record<string, number> = {};
    const comparisonDetails: Record<string, any> = {};

    for (const strategy of successfulStrategies) {
      let totalScore = 0;
      let totalWeight = 0;
      const strategyDetails: Record<string, number> = {};

      for (const metricName in normalizedMetrics[strategy.id]) {
        const metricValue = normalizedMetrics[strategy.id][metricName];
        const metricWeight = config.evaluationCriteria.weights?.[metricName] || 1;

        // Pour certaines métriques, une valeur plus faible est meilleure (ex: erreurs)
        const isInversed = this.isInversedMetric(metricName);
        const adjustedValue = isInversed ? 1 - metricValue : metricValue;

        totalScore += adjustedValue * metricWeight;
        totalWeight += metricWeight;

        strategyDetails[metricName] = adjustedValue;
      }

      scores[strategy.id] = totalWeight > 0 ? totalScore / totalWeight : 0;
      comparisonDetails[strategy.id] = strategyDetails;
    }

    // Déterminer le gagnant
    let winnerStrategyId = '';
    let winnerScore = -1;

    for (const strategyId in scores) {
      if (scores[strategyId] > winnerScore) {
        winnerScore = scores[strategyId];
        winnerStrategyId = strategyId;
      }
    }

    if (winnerStrategyId) {
      results.winner = {
        strategyId: winnerStrategyId,
        score: winnerScore,
        comparisonDetails,
      };
    }

    return results;
  }

  /**
   * Normalise les métriques pour les rendre comparables
   */
  private normalizeMetrics(
    strategies: Array<{ id: string; metrics: Record<string, number> }>,
    _metricsToEvaluate: string[]
  ): Record<string, Record<string, number>> {
    const normalizedMetrics: Record<string, Record<string, number>> = {};

    // Initialiser
    for (const strategy of strategies) {
      normalizedMetrics[strategy.id] = {};
    }

    // Obtenir min et max pour chaque métrique
    const metricBounds: Record<string, { min: number; max: number }> = {};

    for (const metric of Object.keys(strategies[0].metrics)) {
      const values = strategies.map((s) => s.metrics[metric]);
      metricBounds[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    // Normaliser chaque métrique entre 0 et 1
    for (const strategy of strategies) {
      for (const metric in strategy.metrics) {
        const { min, max } = metricBounds[metric];

        if (max === min) {
          // Toutes les stratégies ont la même valeur
          normalizedMetrics[strategy.id][metric] = 1;
        } else {
          // Normaliser entre 0 et 1
          normalizedMetrics[strategy.id][metric] = (strategy.metrics[metric] - min) / (max - min);
        }
      }
    }

    return normalizedMetrics;
  }

  /**
   * Détermine si une métrique doit être inversée (moins c'est mieux)
   */
  private isInversedMetric(metricName: string): boolean {
    const inversedMetrics = [
      'duration',
      'bundleSize',
      'memoryUsage',
      'numTypescriptErrors',
      'numEslintWarnings',
      '_duration',
    ];

    return inversedMetrics.some((m) => metricName.includes(m));
  }

  /**
   * Génère un rapport des résultats du test A/B
   */
  private async generateReport(
    results: ABTestResults,
    config: ABTestingConfig,
    outputDir: string
  ): Promise<void> {
    // Sauvegarder les résultats bruts en JSON
    const jsonPath = path.join(outputDir, 'results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

    // Générer un rapport selon le format demandé
    const format = config.outputs?.reportFormat || 'markdown';

    if (format === 'markdown') {
      await this.generateMarkdownReport(results, outputDir);
    } else if (format === 'html') {
      await this.generateHtmlReport(results, outputDir);
    }

    // Nettoyer les fichiers générés si demandé
    if (config.outputs?.saveGeneratedFiles === false) {
      for (const strategy of config.strategies) {
        const strategyDir = path.join(outputDir, strategy.id);
        if (fs.existsSync(strategyDir)) {
          // Ne conserver que les rapports
          const files = fs.readdirSync(strategyDir);
          for (const file of files) {
            if (!file.endsWith('.md') && !file.endsWith('.html') && !file.endsWith('.json')) {
              fs.unlinkSync(path.join(strategyDir, file));
            }
          }
        }
      }
    }
  }

  /**
   * Génère un rapport Markdown des résultats
   */
  private async generateMarkdownReport(results: ABTestResults, outputDir: string): Promise<void> {
    let markdown = `# Rapport de Test A/B: ${results.testName}\n\n`;

    markdown += `- **ID du test**: ${results.testId}\n`;
    markdown += `- **Fichier source**: ${results.sourceFile}\n`;
    markdown += `- **Date**: ${new Date(results.timestamp).toLocaleString('fr-FR')}\n\n`;

    markdown += '## Résultats\n\n';

    if (results.winner) {
      markdown += `### 🏆 Stratégie gagnante: ${this.getStrategyName(
        results,
        results.winner.strategyId
      )}\n\n`;
      markdown += `- **Score**: ${(results.winner.score * 100).toFixed(2)}%\n\n`;
    } else {
      markdown += '### ⚠️ Aucune stratégie gagnante déterminée\n\n';
      markdown +=
        'Pas assez de stratégies ont réussi leur exécution pour déterminer un gagnant.\n\n';
    }

    markdown += '### Comparaison des Stratégies\n\n';

    // Tableau de comparaison
    markdown += '| Stratégie | Statut | Durée | ';

    // En-têtes des métriques
    const firstSuccessfulStrategy = results.strategies.find((s) => s.success);
    const metricNames = firstSuccessfulStrategy
      ? Object.keys(firstSuccessfulStrategy.metrics).sort()
      : [];

    metricNames.forEach((metric) => {
      markdown += `${metric} | `;
    });

    markdown += `\n|${'-'.repeat(10)}|${'-'.repeat(8)}|${'-'.repeat(8)}|`;
    metricNames.forEach(() => {
      markdown += `${'-'.repeat(10)}|`;
    });
    markdown += '\n';

    // Contenu du tableau
    for (const strategy of results.strategies) {
      const isWinner = results.winner?.strategyId === strategy.id;
      const statusIcon = strategy.success ? '✅' : '❌';
      const nameFormat = isWinner ? `**${strategy.name}**` : strategy.name;

      markdown += `| ${nameFormat} | ${statusIcon} | ${this.formatDuration(strategy.duration)} | `;

      if (strategy.success) {
        metricNames.forEach((metric) => {
          const value = strategy.metrics[metric];
          if (typeof value === 'number') {
            markdown += `${this.formatMetricValue(metric, value)} | `;
          } else {
            markdown += '- | ';
          }
        });
      } else {
        metricNames.forEach(() => {
          markdown += '- | ';
        });
      }

      markdown += '\n';
    }

    markdown += '\n';

    // Section détaillée pour chaque stratégie
    markdown += '## Détail des Stratégies\n\n';

    for (const strategy of results.strategies) {
      markdown += `### ${strategy.name}\n\n`;

      if (!strategy.success) {
        markdown += '⚠️ **Échec de la stratégie**\n\n';

        if (strategy.errors && strategy.errors.length > 0) {
          markdown += '**Erreurs:**\n\n';
          strategy.errors.forEach((error) => {
            markdown += `- ${error}\n`;
          });
          markdown += '\n';
        }

        continue;
      }

      markdown += `- **Durée totale**: ${this.formatDuration(strategy.duration)}\n`;
      markdown += `- **Fichiers générés**: ${strategy.outputs.length}\n\n`;

      if (strategy.outputs.length > 0) {
        markdown += '**Sorties:**\n\n';
        strategy.outputs.forEach((output) => {
          markdown += `- ${output}\n`;
        });
      }

      markdown += '\n**Métriques:**\n\n';

      for (const metric in strategy.metrics) {
        markdown += `- **${metric}**: ${this.formatMetricValue(
          metric,
          strategy.metrics[metric]
        )}\n`;
      }

      markdown += '\n';
    }

    // Écrire le rapport
    const reportPath = path.join(outputDir, 'report.md');
    fs.writeFileSync(reportPath, markdown, 'utf8');
  }

  /**
   * Génère un rapport HTML des résultats
   */
  private async generateHtmlReport(results: ABTestResults, outputDir: string): Promise<void> {
    // Implémentation basique d'un rapport HTML
    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Test A/B: ${results.testName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .winner {
      background-color: #e3f2fd;
      border-left: 5px solid #2196f3;
      padding: 10px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
    }
    .success {
      color: #4caf50;
    }
    .failure {
      color: #f44336;
    }
    .strategy {
      margin-bottom: 30px;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 15px;
    }
    .winner-row {
      background-color: #e3f2fd;
    }
  </style>
</head>
<body>
  <h1>Rapport de Test A/B: ${results.testName}</h1>
  
  <p>
    <strong>ID du test:</strong> ${results.testId}<br>
    <strong>Fichier source:</strong> ${results.sourceFile}<br>
    <strong>Date:</strong> ${new Date(results.timestamp).toLocaleString('fr-FR')}
  </p>
  
  <h2>Résultats</h2>`;

    if (results.winner) {
      html += `
  <div class="winner">
    <h3>🏆 Stratégie gagnante: ${this.getStrategyName(results, results.winner.strategyId)}</h3>
    <p><strong>Score:</strong> ${(results.winner.score * 100).toFixed(2)}%</p>
  </div>`;
    } else {
      html += `
  <div class="failure">
    <h3>⚠️ Aucune stratégie gagnante déterminée</h3>
    <p>Pas assez de stratégies ont réussi leur exécution pour déterminer un gagnant.</p>
  </div>`;
    }

    html += `
  <h3>Comparaison des Stratégies</h3>
  
  <table>
    <thead>
      <tr>
        <th>Stratégie</th>
        <th>Statut</th>
        <th>Durée</th>`;

    // En-têtes des métriques
    const firstSuccessfulStrategy = results.strategies.find((s) => s.success);
    const metricNames = firstSuccessfulStrategy
      ? Object.keys(firstSuccessfulStrategy.metrics).sort()
      : [];

    metricNames.forEach((metric) => {
      html += `
        <th>${metric}</th>`;
    });

    html += `
      </tr>
    </thead>
    <tbody>`;

    // Contenu du tableau
    for (const strategy of results.strategies) {
      const isWinner = results.winner?.strategyId === strategy.id;
      const statusIcon = strategy.success
        ? '<span class="success">✅</span>'
        : '<span class="failure">❌</span>';

      html += `
      <tr${isWinner ? ' class="winner-row"' : ''}>
        <td>${isWinner ? `<strong>${strategy.name}</strong>` : strategy.name}</td>
        <td>${statusIcon}</td>
        <td>${this.formatDuration(strategy.duration)}</td>`;

      if (strategy.success) {
        metricNames.forEach((metric) => {
          const value = strategy.metrics[metric];
          if (typeof value === 'number') {
            html += `
        <td>${this.formatMetricValue(metric, value)}</td>`;
          } else {
            html += `
        <td>-</td>`;
          }
        });
      } else {
        metricNames.forEach(() => {
          html += `
        <td>-</td>`;
        });
      }

      html += `
      </tr>`;
    }

    html += `
    </tbody>
  </table>
  
  <h2>Détail des Stratégies</h2>`;

    // Section détaillée pour chaque stratégie
    for (const strategy of results.strategies) {
      html += `
  <div class="strategy${results.winner?.strategyId === strategy.id ? ' winner' : ''}">
    <h3>${strategy.name}</h3>`;

      if (!strategy.success) {
        html += `
    <p class="failure">⚠️ <strong>Échec de la stratégie</strong></p>`;

        if (strategy.errors && strategy.errors.length > 0) {
          html += `
    <p><strong>Erreurs:</strong></p>
    <ul>`;

          strategy.errors.forEach((error) => {
            html += `
      <li>${error}</li>`;
          });

          html += `
    </ul>`;
        }
      } else {
        html += `
    <p>
      <strong>Durée totale:</strong> ${this.formatDuration(strategy.duration)}<br>
      <strong>Fichiers générés:</strong> ${strategy.outputs.length}
    </p>`;

        if (strategy.outputs.length > 0) {
          html += `
    <p><strong>Sorties:</strong></p>
    <ul>`;

          strategy.outputs.forEach((output) => {
            html += `
      <li>${output}</li>`;
          });

          html += `
    </ul>`;
        }

        html += `
    <p><strong>Métriques:</strong></p>
    <ul>`;

        for (const metric in strategy.metrics) {
          html += `
      <li><strong>${metric}:</strong> ${this.formatMetricValue(
        metric,
        strategy.metrics[metric]
      )}</li>`;
        }

        html += `
    </ul>`;
      }

      html += `
  </div>`;
    }

    html += `
</body>
</html>`;

    // Écrire le rapport
    const reportPath = path.join(outputDir, 'report.html');
    fs.writeFileSync(reportPath, html, 'utf8');
  }

  /**
   * Utilitaire pour exécuter des commandes shell
   */
  private runCommand(command: string): string {
    try {
      return execSync(command, { encoding: 'utf8' });
    } catch (error) {
      if (error.stdout) return error.stdout;
      throw error;
    }
  }

  /**
   * Récupère le nom d'une stratégie par son ID
   */
  private getStrategyName(results: ABTestResults, strategyId: string): string {
    const strategy = results.strategies.find((s) => s.id === strategyId);
    return strategy ? strategy.name : strategyId;
  }

  /**
   * Formatte la durée en millisecondes de façon lisible
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  }

  /**
   * Formatte une valeur métrique de façon appropriée
   */
  private formatMetricValue(metricName: string, value: number): string {
    if (metricName.includes('duration')) {
      return this.formatDuration(value);
    }

    if (metricName === 'bundleSize') {
      return this.formatBytes(value);
    }

    if (metricName.endsWith('Score') || metricName.includes('Rate')) {
      return `${value.toFixed(1)}%`;
    }

    // Valeur par défaut
    if (Number.isInteger(value)) {
      return value.toString();
    }

    return value.toFixed(2);
  }

  /**
   * Formatte une taille en octets de façon lisible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
  }
}

export default new ABStrategyTester();
