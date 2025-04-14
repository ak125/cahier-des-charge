/**
 * monitoring-check.ts
 * Agent de surveillance post-migration
 * 
 * Cet agent vérifie la stabilité fonctionnelle, la performance et la cohérence visuelle
 * des routes migrées, après déploiement (en preview ou en production).
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';
import * as chalk from 'chalk';
import * as dotenv from 'dotenv';
import { program } from 'commander';

// Chargement des variables d'environnement
dotenv.config();

// Types
interface MonitoringConfig {
  baseUrl: string;
  routes: string[];
  oldRoutes?: { [key: string]: string };
  timeoutMs: number;
  expectedStatuses: { [key: string]: number };
  performanceThreshold: number;
  domElementsToCheck: string[];
  screenshotComparison: boolean;
  outputDir: string;
  slackWebhook?: string;
  n8nWebhook?: string;
}

interface RouteStatus {
  url: string;
  status: number;
  location?: string;
  valid: boolean;
  responseTime: number;
  error?: string;
}

interface PerformanceComparison {
  route: string;
  oldTime?: number;
  newTime: number;
  difference?: number;
  percentChange?: number;
  improvement: boolean;
}

interface DomIssue {
  route: string;
  issues: string[];
  severity: 'critical' | 'warning' | 'info';
}

interface MonitoringResult {
  timestamp: string;
  environment: string;
  baseUrl: string;
  summary: {
    totalRoutes: number;
    validStatusCodes: number;
    invalidStatusCodes: number;
    performanceImprovements: number;
    performanceRegressions: number;
    criticalDomIssues: number;
    warnings: number;
  };
  statusResults: RouteStatus[];
  performanceResults: PerformanceComparison[];
  domIssues: DomIssue[];
}

class MonitoringAgent {
  private config: MonitoringConfig;
  private results: MonitoringResult;
  private environment: string;
  private migrationData: any;

  constructor(environment: string, targetRoutes?: string[]) {
    this.environment = environment;

    // Configuration par défaut
    this.config = {
      baseUrl: '',
      routes: [],
      timeoutMs: 10000,
      expectedStatuses: {},
      performanceThreshold: 20, // pourcentage de différence toléré
      domElementsToCheck: ['title', 'meta[name="description"]', 'main', 'header', 'footer'],
      screenshotComparison: true,
      outputDir: path.join(process.cwd(), 'reports', 'monitoring')
    };

    // Initialisation des résultats
    this.results = {
      timestamp: new Date().toISOString(),
      environment,
      baseUrl: '',
      summary: {
        totalRoutes: 0,
        validStatusCodes: 0,
        invalidStatusCodes: 0,
        performanceImprovements: 0,
        performanceRegressions: 0,
        criticalDomIssues: 0,
        warnings: 0
      },
      statusResults: [],
      performanceResults: [],
      domIssues: []
    };

    // Charger les données de migration
    this.loadMigrationData();

    // Configurer l'agent selon l'environnement
    this.configureForEnvironment(environment, targetRoutes);
  }

  /**
   * Charge les données de migration depuis les fichiers de résultats
   */
  private loadMigrationData(): void {
    try {
      // Trouver le fichier de résultats de migration le plus récent
      const migrationResults = path.join(process.cwd(), 'migration-results-*.json');
      const latestMigrationFile = execSync(`ls -t ${migrationResults} | head -1`).toString().trim();

      if (fs.existsSync(latestMigrationFile)) {
        this.migrationData = fs.readJsonSync(latestMigrationFile);
        console.log(chalk.blue(`✓ Données de migration chargées depuis: ${latestMigrationFile}`));
      } else {
        console.log(chalk.yellow('⚠️ Aucun fichier de résultats de migration trouvé'));
        this.migrationData = { routes: [], redirections: {} };
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du chargement des données de migration: ${error}`));
      this.migrationData = { routes: [], redirections: {} };
    }
  }

  /**
   * Configure l'agent selon l'environnement cible (preview ou production)
   */
  private configureForEnvironment(environment: string, targetRoutes?: string[]): void {
    // Déterminer l'URL de base selon l'environnement
    if (environment === 'preview') {
      // Chercher l'URL de prévisualisation la plus récente
      try {
        const previewDirs = fs.readdirSync(path.join(process.cwd(), '.preview'))
          .filter(dir => dir.startsWith('fiche-'))
          .sort()
          .reverse();
        
        if (previewDirs.length > 0) {
          const previewUrlPath = path.join(process.cwd(), '.preview', previewDirs[0], 'preview_url.txt');
          if (fs.existsSync(previewUrlPath)) {
            this.config.baseUrl = fs.readFileSync(previewUrlPath, 'utf8').trim();
          }
        }
        
        if (!this.config.baseUrl) {
          this.config.baseUrl = process.env.PREVIEW_URL || 'http://localhost:3000';
        }
      } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de la recherche de l'URL de prévisualisation: ${error}`));
        this.config.baseUrl = process.env.PREVIEW_URL || 'http://localhost:3000';
      }
    } else if (environment === 'production') {
      this.config.baseUrl = process.env.PROD_URL || 'https://www.mysite.io';
    } else {
      this.config.baseUrl = environment; // Utiliser directement l'environnement comme URL
    }

    // Assigner l'URL de base aux résultats
    this.results.baseUrl = this.config.baseUrl;
    console.log(chalk.blue(`🌐 URL de base: ${this.config.baseUrl}`));

    // Routes à surveiller
    if (targetRoutes && targetRoutes.length > 0) {
      this.config.routes = targetRoutes;
    } else if (this.migrationData && this.migrationData.routes) {
      // Utiliser les routes trouvées dans les données de migration
      this.config.routes = this.migrationData.routes.map((r: any) => r.newPath || r.path);
    } else {
      // Routes par défaut
      this.config.routes = ['/'];
    }

    // Mapper les anciennes routes vers les nouvelles (pour les redirections)
    this.config.oldRoutes = {};
    if (this.migrationData && this.migrationData.redirections) {
      this.config.oldRoutes = this.migrationData.redirections;
    }

    // Statuts HTTP attendus
    this.config.expectedStatuses = {};
    this.config.routes.forEach(route => {
      this.config.expectedStatuses[route] = 200; // Par défaut, on attend un 200 OK
    });
    
    // Pour les anciennes routes, on attend une redirection 301
    if (this.config.oldRoutes) {
      Object.keys(this.config.oldRoutes).forEach(oldRoute => {
        this.config.expectedStatuses[oldRoute] = 301;
      });
    }

    // Créer le dossier de sortie si nécessaire
    fs.ensureDirSync(this.config.outputDir);
    console.log(chalk.blue(`✓ Dossier de sortie créé: ${this.config.outputDir}`));
  }

  /**
   * Vérifie les statuts HTTP pour toutes les routes
   */
  async checkHttpStatuses(): Promise<RouteStatus[]> {
    console.log(chalk.blue('🔍 Vérification des statuts HTTP...'));

    const allRoutes = [
      ...this.config.routes, 
      ...(this.config.oldRoutes ? Object.keys(this.config.oldRoutes) : [])
    ];

    const results: RouteStatus[] = [];

    for (const route of allRoutes) {
      try {
        const url = new URL(route, this.config.baseUrl).toString();
        const startTime = Date.now();
        
        console.log(chalk.blue(`  Vérification de: ${url}`));
        
        const response = await axios.get(url, {
          maxRedirects: 0,
          validateStatus: () => true,
          timeout: this.config.timeoutMs
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const expectedStatus = this.config.expectedStatuses[route] || 200;
        const valid = this.validateStatus(route, response.status, response.headers.location);
        
        const result: RouteStatus = {
          url: route,
          status: response.status,
          responseTime,
          valid
        };
        
        // Ajouter l'URL de redirection si c'est une redirection
        if (response.status >= 300 && response.status < 400 && response.headers.location) {
          result.location = response.headers.location;
        }
        
        if (!valid) {
          result.error = `Statut attendu: ${expectedStatus}, reçu: ${response.status}`;
        }
        
        results.push(result);
        
        if (valid) {
          console.log(chalk.green(`  ✓ ${route} - ${response.status} (${responseTime}ms)`));
        } else {
          console.log(chalk.red(`  ❌ ${route} - ${response.status} (${responseTime}ms) - Attendu: ${expectedStatus}`));
        }
      } catch (error: any) {
        console.error(chalk.red(`  ❌ Erreur pour ${route}: ${error.message}`));
        
        results.push({
          url: route,
          status: 0,
          responseTime: 0,
          valid: false,
          error: `Erreur de connexion: ${error.message}`
        });
      }
    }

    // Mise à jour des statistiques du résumé
    this.results.summary.totalRoutes = results.length;
    this.results.summary.validStatusCodes = results.filter(r => r.valid).length;
    this.results.summary.invalidStatusCodes = results.filter(r => !r.valid).length;
    this.results.statusResults = results;

    return results;
  }

  /**
   * Valide si le statut reçu correspond au statut attendu
   */
  private validateStatus(route: string, status: number, location?: string): boolean {
    const expectedStatus = this.config.expectedStatuses[route] || 200;
    
    // Cas d'une redirection 301
    if (expectedStatus === 301) {
      if (status !== 301) return false;
      
      // Vérifier aussi que la redirection pointe vers la bonne URL
      if (this.config.oldRoutes && this.config.oldRoutes[route]) {
        const expectedLocation = this.config.oldRoutes[route];
        // Vérification simplifiée: la redirection doit se terminer par le chemin attendu
        return location ? location.endsWith(expectedLocation) : false;
      }
      
      return true;
    }
    
    // Cas standard: le statut doit correspondre exactement
    return status === expectedStatus;
  }

  /**
   * Analyse les temps de réponse et les compare avec les données historiques
   */
  async analyzeResponseTimes(): Promise<PerformanceComparison[]> {
    console.log(chalk.blue('⏱️ Analyse des temps de réponse...'));

    const results: PerformanceComparison[] = [];
    const historicalData = this.loadHistoricalPerformanceData();

    // Analyse uniquement pour les nouvelles routes (pas les redirections)
    for (const routeStatus of this.results.statusResults.filter(r => this.config.routes.includes(r.url))) {
      const route = routeStatus.url;
      const newTime = routeStatus.responseTime;
      
      const comparison: PerformanceComparison = {
        route,
        newTime,
        improvement: false
      };
      
      // Chercher les données historiques pour cette route
      const historicalEntry = historicalData[route];
      if (historicalEntry) {
        comparison.oldTime = historicalEntry.responseTime;
        comparison.difference = newTime - comparison.oldTime;
        comparison.percentChange = comparison.oldTime ? Math.round((comparison.difference / comparison.oldTime) * 100) : 0;
        comparison.improvement = comparison.difference < 0;
        
        const changeText = comparison.improvement 
          ? chalk.green(`${Math.abs(comparison.percentChange || 0)}% plus rapide`) 
          : chalk.yellow(`${comparison.percentChange || 0}% plus lent`);
        
        console.log(chalk.blue(`  ${route}: ${newTime}ms vs ${comparison.oldTime}ms (${changeText})`));
      } else {
        console.log(chalk.blue(`  ${route}: ${newTime}ms (pas de données historiques)`));
      }
      
      results.push(comparison);
    }

    // Mise à jour des statistiques du résumé
    this.results.performanceResults = results;
    this.results.summary.performanceImprovements = results.filter(r => r.improvement).length;
    this.results.summary.performanceRegressions = results.filter(r => !r.improvement && r.percentChange !== undefined).length;

    // Enregistrer les nouvelles données de performance
    this.savePerformanceData();

    return results;
  }

  /**
   * Charge les données historiques de performance
   */
  private loadHistoricalPerformanceData(): { [route: string]: { responseTime: number, timestamp: string } } {
    const historyFile = path.join(this.config.outputDir, 'performance_history.json');
    
    if (fs.existsSync(historyFile)) {
      try {
        return fs.readJsonSync(historyFile);
      } catch (error) {
        console.error(chalk.red(`❌ Erreur lors du chargement des données historiques: ${error}`));
      }
    }
    
    return {};
  }

  /**
   * Enregistre les nouvelles données de performance
   */
  private savePerformanceData(): void {
    const historyFile = path.join(this.config.outputDir, 'performance_history.json');
    let history = this.loadHistoricalPerformanceData();
    
    // Ajouter les nouvelles données
    this.results.statusResults.forEach(status => {
      history[status.url] = {
        responseTime: status.responseTime,
        timestamp: this.results.timestamp
      };
    });
    
    // Sauvegarder
    fs.writeJsonSync(historyFile, history, { spaces: 2 });
  }

  /**
   * Vérifie la structure DOM des pages
   */
  async inspectDomStructure(): Promise<DomIssue[]> {
    console.log(chalk.blue('🧬 Inspection de la structure DOM...'));

    // Vérifier si Playwright est installé
    try {
      execSync('npx playwright --version', { stdio: 'ignore' });
    } catch (e) {
      console.log(chalk.yellow('⚠️ Playwright non installé. Installation en cours...'));
      execSync('npx playwright install --with-deps chromium');
    }

    const issues: DomIssue[] = [];
    const snapshotsDir = path.join(this.config.outputDir, 'dom_snapshots');
    fs.ensureDirSync(snapshotsDir);

    // Créer un script temporaire pour Playwright
    const playwrightScript = `
      const { chromium } = require('playwright');
      const fs = require('fs');
      const path = require('path');

      (async () => {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const baseUrl = process.argv[2];
        const routes = ${JSON.stringify(this.config.routes)};
        const elementsToCheck = ${JSON.stringify(this.config.domElementsToCheck)};
        const outputDir = process.argv[3];
        
        for (const route of routes) {
          try {
            const page = await context.newPage();
            const url = new URL(route, baseUrl).toString();
            
            console.log('Analyzing DOM:', url);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Capturer une snapshot du DOM
            const domSnapshot = await page.evaluate(() => {
              // Fonction pour nettoyer le DOM (retirer les scripts, etc.)
              function cleanDom(node) {
                const clone = node.cloneNode(true);
                const scripts = clone.querySelectorAll('script, noscript, style');
                scripts.forEach(s => s.remove());
                return clone.outerHTML;
              }
              
              return cleanDom(document.documentElement);
            });
            
            // Sauvegarder la snapshot
            const safeRoute = route.replace(/\\//g, '_').replace(/^_/, '') || 'home';
            fs.writeFileSync(
              path.join(outputDir, \`dom_\${safeRoute}.html\`),
              domSnapshot
            );
            
            // Vérifier les éléments critiques
            const missingElements = [];
            for (const selector of elementsToCheck) {
              const element = await page.$(selector);
              if (!element) {
                missingElements.push(selector);
              }
            }
            
            // Vérifier les attributs ALT des images
            const imagesWithoutAlt = await page.$$eval('img:not([alt]), img[alt=""]', (imgs) => imgs.length);
            
            // Vérifier les liens sans texte ou titre
            const emptyLinks = await page.$$eval('a:not(:has(*)):empty, a:not([title]):not(:has(*)):empty', (links) => links.length);
            
            // Sauvegarder les problèmes
            const issues = {
              route,
              missingElements,
              imagesWithoutAlt,
              emptyLinks,
              otherIssues: []
            };
            
            // Vérifier la présence de H1
            const h1Count = await page.$$eval('h1', (h1s) => h1s.length);
            if (h1Count === 0) {
              issues.otherIssues.push('missing-h1');
            } else if (h1Count > 1) {
              issues.otherIssues.push('multiple-h1');
            }
            
            fs.writeFileSync(
              path.join(outputDir, \`issues_\${safeRoute}.json\`),
              JSON.stringify(issues, null, 2)
            );
            
            await page.close();
          } catch (error) {
            console.error(\`Error analyzing \${route}: \${error.message}\`);
            fs.writeFileSync(
              path.join(outputDir, \`error_\${route.replace(/\\//g, '_')}.txt\`),
              error.message
            );
          }
        }
        
        await browser.close();
      })();
    `;

    const scriptPath = path.join(this.config.outputDir, 'dom-inspect.js');
    fs.writeFileSync(scriptPath, playwrightScript);

    try {
      // Exécuter Playwright
      execSync(`node ${scriptPath} ${this.config.baseUrl} ${snapshotsDir}`, { stdio: 'inherit' });
      
      // Analyser les résultats
      const issueFiles = fs.readdirSync(snapshotsDir).filter(file => file.startsWith('issues_'));
      
      for (const file of issueFiles) {
        const filePath = path.join(snapshotsDir, file);
        const fileData = fs.readJsonSync(filePath);
        
        const routeIssues: string[] = [];
        let severity: 'critical' | 'warning' | 'info' = 'info';
        
        // Analyser les éléments manquants
        if (fileData.missingElements && fileData.missingElements.length > 0) {
          fileData.missingElements.forEach((element: string) => {
            routeIssues.push(`missing-element: ${element}`);
            if (element === 'title' || element === 'meta[name="description"]' || element === 'main') {
              severity = 'critical';
            } else {
              severity = 'warning';
            }
          });
        }
        
        // Ajouter les autres problèmes
        if (fileData.imagesWithoutAlt > 0) {
          routeIssues.push(`${fileData.imagesWithoutAlt} images sans attribut alt`);
          severity = severity === 'info' ? 'warning' : severity;
        }
        
        if (fileData.emptyLinks > 0) {
          routeIssues.push(`${fileData.emptyLinks} liens vides ou sans texte`);
          severity = severity === 'info' ? 'warning' : severity;
        }
        
        if (fileData.otherIssues && fileData.otherIssues.length > 0) {
          fileData.otherIssues.forEach((issue: string) => {
            routeIssues.push(issue);
            if (issue === 'missing-h1') {
              severity = 'warning';
            }
          });
        }
        
        if (routeIssues.length > 0) {
          issues.push({
            route: fileData.route,
            issues: routeIssues,
            severity
          });
          
          if (severity === 'critical') {
            console.log(chalk.red(`  ❌ ${fileData.route}: ${routeIssues.join(', ')}`));
          } else if (severity === 'warning') {
            console.log(chalk.yellow(`  ⚠️ ${fileData.route}: ${routeIssues.join(', ')}`));
          } else {
            console.log(chalk.blue(`  ℹ️ ${fileData.route}: ${routeIssues.join(', ')}`));
          }
        } else {
          console.log(chalk.green(`  ✓ ${fileData.route}: Aucun problème DOM détecté`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de l'analyse DOM: ${error}`));
    }

    // Mise à jour des statistiques du résumé
    this.results.domIssues = issues;
    this.results.summary.criticalDomIssues = issues.filter(issue => issue.severity === 'critical').length;
    this.results.summary.warnings = issues.filter(issue => issue.severity === 'warning').length;

    return issues;
  }

  /**
   * Compare visuellement les pages avant/après migration (si des captures sont disponibles)
   */
  async compareScreenshots(): Promise<void> {
    // Implémentation future pour la comparaison de captures d'écran
    // Nécessiterait des captures d'écran "avant migration" pour comparaison
    console.log(chalk.blue('🖼️ La comparaison visuelle automatique n\'est pas implémentée dans cette version'));
  }

  /**
   * Génère les rapports de sortie
   */
  async generateReports(): Promise<void> {
    console.log(chalk.blue('📊 Génération des rapports...'));

    // Rapport JSON principal
    const monitorReportPath = path.join(this.config.outputDir, 'post_migration_monitor.json');
    fs.writeJsonSync(monitorReportPath, this.results, { spaces: 2 });
    console.log(chalk.green(`  ✓ Rapport principal généré: ${monitorReportPath}`));

    // Rapport détaillé des statuts HTTP
    const statusReportPath = path.join(this.config.outputDir, 'route_statuses.json');
    fs.writeJsonSync(statusReportPath, this.results.statusResults, { spaces: 2 });
    console.log(chalk.green(`  ✓ Rapport des statuts généré: ${statusReportPath}`));

    // Rapport de comparaison des temps de réponse
    const timingReportPath = path.join(this.config.outputDir, 'timing_comparison.md');
    let timingReport = `# Rapport de Performance - ${this.environment}\n\n`;
    timingReport += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`;
    timingReport += `## Comparaison des temps de réponse\n\n`;
    timingReport += `| Route | Temps actuel | Temps précédent | Différence | % Change |\n`;
    timingReport += `| --- | ---: | ---: | ---: | ---: |\n`;

    this.results.performanceResults.forEach(result => {
      const diff = result.difference !== undefined ? `${result.difference > 0 ? '+' : ''}${result.difference}ms` : '-';
      const percent = result.percentChange !== undefined ? `${result.percentChange > 0 ? '+' : ''}${result.percentChange}%` : '-';
      const oldTime = result.oldTime !== undefined ? `${result.oldTime}ms` : '-';
      
      timingReport += `| ${result.route} | ${result.newTime}ms | ${oldTime} | ${diff} | ${percent} |\n`;
    });

    fs.writeFileSync(timingReportPath, timingReport);
    console.log(chalk.green(`  ✓ Rapport de performance généré: ${timingReportPath}`));

    // Rapport des problèmes DOM
    const domReportPath = path.join(this.config.outputDir, 'dom_issues_report.md');
    let domReport = `# Rapport d'Analyse DOM - ${this.environment}\n\n`;
    domReport += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`;
    domReport += `## Problèmes détectés\n\n`;

    if (this.results.domIssues.length === 0) {
      domReport += `✅ Aucun problème DOM détecté.\n\n`;
    } else {
      this.results.domIssues.forEach(issue => {
        const severityIcon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟠' : '🔵';
        domReport += `### ${severityIcon} ${issue.route}\n\n`;
        issue.issues.forEach(problem => {
          domReport += `- ${problem}\n`;
        });
        domReport += `\n`;
      });
    }

    fs.writeFileSync(domReportPath, domReport);
    console.log(chalk.green(`  ✓ Rapport d'analyse DOM généré: ${domReportPath}`));

    // Rapport de résumé
    const summaryReportPath = path.join(this.config.outputDir, 'monitoring_summary.md');
    let summaryReport = `# Résumé de la Surveillance Post-Migration - ${this.environment}\n\n`;
    summaryReport += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`;
    summaryReport += `Base URL: ${this.config.baseUrl}\n\n`;
    
    const statuses = this.results.summary;
    const totalIssues = statuses.invalidStatusCodes + statuses.performanceRegressions + statuses.criticalDomIssues;
    const statusIcon = totalIssues === 0 ? '✅' : totalIssues > 3 ? '❌' : '⚠️';
    
    summaryReport += `## Statut global: ${statusIcon}\n\n`;
    summaryReport += `- Routes testées: ${statuses.totalRoutes}\n`;
    summaryReport += `- Codes HTTP valides: ${statuses.validStatusCodes}/${statuses.totalRoutes}\n`;
    summaryReport += `- Améliorations de performance: ${statuses.performanceImprovements}\n`;
    summaryReport += `- Régressions de performance: ${statuses.performanceRegressions}\n`;
    summaryReport += `- Problèmes DOM critiques: ${statuses.criticalDomIssues}\n`;
    summaryReport += `- Avertissements: ${statuses.warnings}\n\n`;
    
    summaryReport += `## Liens vers les rapports détaillés\n\n`;
    summaryReport += `- [Statuts HTTP](./route_statuses.json)\n`;
    summaryReport += `- [Performances](./timing_comparison.md)\n`;
    summaryReport += `- [Analyse DOM](./dom_issues_report.md)\n`;

    fs.writeFileSync(summaryReportPath, summaryReport);
    console.log(chalk.green(`  ✓ Rapport de résumé généré: ${summaryReportPath}`));
  }

  /**
   * Envoie une notification si des problèmes sont détectés
   */
  async sendNotifications(): Promise<void> {
    console.log(chalk.blue('📣 Envoi des notifications...'));

    const statuses = this.results.summary;
    const totalIssues = statuses.invalidStatusCodes + statuses.performanceRegressions + statuses.criticalDomIssues;
    
    if (totalIssues === 0) {
      console.log(chalk.green('  ✓ Aucun problème détecté, pas de notification nécessaire'));
      return;
    }

    // Préparer le message
    const message = {
      text: `🚨 Surveillance post-migration: problèmes détectés sur ${this.environment}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🚨 Problèmes post-migration détectés (${this.environment})`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Base URL:* ${this.config.baseUrl}\n*Date:* ${new Date().toLocaleString('fr-FR')}`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Routes testées:*\n${statuses.totalRoutes}`
            },
            {
              type: "mrkdwn",
              text: `*HTTP invalides:*\n${statuses.invalidStatusCodes}`
            },
            {
              type: "mrkdwn",
              text: `*Régressions perf:*\n${statuses.performanceRegressions}`
            },
            {
              type: "mrkdwn",
              text: `*Problèmes DOM:*\n${statuses.criticalDomIssues}`
            }
          ]
        }
      ]
    };

    // Envoyer à Slack si configuré
    if (this.config.slackWebhook) {
      try {
        await axios.post(this.config.slackWebhook, message);
        console.log(chalk.green('  ✓ Notification Slack envoyée'));
      } catch (error) {
        console.error(chalk.red(`  ❌ Erreur lors de l'envoi de la notification Slack: ${error}`));
      }
    }

    // Envoyer à n8n si configuré
    if (this.config.n8nWebhook) {
      try {
        await axios.post(this.config.n8nWebhook, {
          monitoring: this.results,
          environment: this.environment,
          timestamp: new Date().toISOString()
        });
        console.log(chalk.green('  ✓ Notification n8n envoyée'));
      } catch (error) {
        console.error(chalk.red(`  ❌ Erreur lors de l'envoi de la notification n8n: ${error}`));
      }
    }
  }

  /**
   * Exécute toutes les étapes de surveillance
   */
  async run(): Promise<MonitoringResult> {
    console.log(chalk.blue(`🚀 Démarrage de la surveillance post-migration pour ${this.environment}`));

    try {
      // 1. Vérifier les statuts HTTP
      await this.checkHttpStatuses();

      // 2. Analyser les temps de réponse
      await this.analyzeResponseTimes();

      // 3. Inspecter la structure DOM
      await this.inspectDomStructure();

      // 4. Comparer visuellement (si activé)
      if (this.config.screenshotComparison) {
        await this.compareScreenshots();
      }

      // 5. Générer les rapports
      await this.generateReports();

      // 6. Envoyer des notifications si des problèmes sont détectés
      await this.sendNotifications();

      console.log(chalk.green(`✅ Surveillance post-migration terminée`));
      return this.results;
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de l'exécution de la surveillance: ${error}`));
      throw error;
    }
  }
}

// Point d'entrée du script en ligne de commande
if (require.main === module) {
  program
    .name('monitoring-check')
    .description('Agent de surveillance post-migration')
    .option('-e, --env <environment>', 'Environnement cible (preview, production, ou URL personnalisée)', 'preview')
    .option('-t, --target <routes>', 'Routes spécifiques à surveiller (séparées par des virgules)')
    .option('-o, --output <dir>', 'Dossier de sortie des rapports')
    .parse(process.argv);

  const options = program.opts();
  const targetRoutes = options.target ? options.target.split(',').map((r: string) => r.trim()) : undefined;
  
  const agent = new MonitoringAgent(options.env, targetRoutes);
  
  if (options.output) {
    agent.config.outputDir = options.output;
  }
  
  agent.run()
    .then(() => {
      console.log(chalk.green('✅ Monitoring terminé avec succès'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red(`❌ Erreur: ${error.message}`));
      process.exit(1);
    });
}

// Export pour utilisation dans d'autres modules
export { MonitoringAgent, MonitoringResult };