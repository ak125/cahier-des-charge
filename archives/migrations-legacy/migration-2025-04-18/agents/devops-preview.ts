/**
 * devops-preview.ts
 * Agent automatique de prévisualisation des Pull Requests de migration
 * 
 * Cet agent déploie chaque PR de migration dans un environnement isolé
 * et génère des captures d'écran, rapports SEO et validations HTML.
 * Inclut maintenant des mesures de performance Lighthouse.
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';

// Chargement de la configuration
dotenv.config();

// Types
interface PreviewConfig {
  previewDomain: string;
  useAuth: boolean;
  authUser?: string;
  authPassword?: string;
  capturePages: string[];
  checkSEO: boolean;
  runLighthouse: boolean;
  lighthouseCategories: string[];
 DoDoDoDoDoDotgithubToken?: string;
  coolifyApiKey?: string;
  deploymentProvider: 'docker' | 'coolify' | 'vercel' | 'render';
  notificationWebhook?: string;
}

interface MigrationInfo {
  prNumber: string;
  branchName: string;
  status: string;
  routes: string[];
  migrationDate: string;
}

interface LighthouseResults {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa?: number;
  firstContentfulPaint?: number;
  speedIndex?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
  cumulativeLayoutShift?: number;
}

class PreviewAgent {
  private config: PreviewConfig;
  private previewDir = '.preview';
  private previewUrl = '';
  private prInfo: MigrationInfo;

  constructor(prNumber: string, branchName: string) {
    // Valeurs par défaut
    this.config = {
      previewDomain: process.env.PREVIEW_DOMAIN || 'preview.mysite.io',
      useAuth: process.env.PREVIEW_USE_AUTH === 'true',
      authUser: process.env.PREVIEW_AUTH_USER,
      authPassword: process.env.PREVIEW_AUTH_PASSWORD,
      capturePages: [],
      checkSEO: true,
      runLighthouse: process.env.RUN_LIGHTHOUSE !== 'false',
      lighthouseCategories: (process.env.LIGHTHOUSE_CATEGORIES || 'performance,accessibility,best-practices,seo').split(','),
      deploymentProvider: (process.env.DEPLOYMENT_PROVIDER as any) || 'docker',
     DoDoDoDoDoDotgithubToken: process.env.GITHUB_TOKEN,
      coolifyApiKey: process.env.COOLIFY_API_KEY,
      notificationWebhook: process.env.NOTIFICATION_WEBHOOK
    };

    this.prInfo = {
      prNumber: prNumber,
      branchName: branchName,
      status: 'pending',
      routes: [],
      migrationDate: new Date().toISOString()
    };

    // Création des dossiers nécessaires
    this.setupDirectories();
  }

  /**
   * Prépare les dossiers pour les rapports
   */
  private setupDirectories(): void {
    const previewDir = path.join(process.cwd(), this.previewDir);
    const prPreviewDir = path.join(previewDir, `fiche-${this.prInfo.prNumber}`);
    const snapshotsDir = path.join(prPreviewDir, 'snapshots');
    const lighthouseDir = path.join(prPreviewDir, 'lighthouse');

    fs.ensureDirSync(previewDir);
    fs.ensureDirSync(prPreviewDir);
    fs.ensureDirSync(snapshotsDir);
    fs.ensureDirSync(lighthouseDir);

    console.log(chalk.blue(`✓ Dossiers de prévisualisation créés: ${prPreviewDir}`));
  }

  /**
   * Charge les informations sur les routes migrées depuis le backlog
   */
  async loadMigrationInfo(): Promise<boolean> {
    try {
      // Vérifier si le fichier fiche.backlog.json existe
      const backlogPath = path.join(process.cwd(), 'migration-toolkit', 'fiche.backlog.json');
      
      if (fs.existsSync(backlogPath)) {
        const backlog = await fs.readJson(backlogPath);
        const prBacklog = backlog.items.find(
          (item: any) => item.prNumber === this.prInfo.prNumber || 
                         item.branchName === this.prInfo.branchName
        );

        if (prBacklog) {
          this.prInfo.status = prBacklog.status;
          this.prInfo.routes = prBacklog.routes || [];
          this.config.capturePages = this.prInfo.routes;
          return true;
        }
      }
      
      // Fallback si pas de backlog: trouver les routes dans les fichiers migrés
      const migrationResults = path.join(process.cwd(), 'migration-results-*.json');
      const latestMigrationFile = execSync(`ls -t ${migrationResults} | head -1`).toString().trim();

      if (fs.existsSync(latestMigrationFile)) {
        const migrationData = await fs.readJson(latestMigrationFile);
        this.prInfo.routes = migrationData.migratedRoutes || [];
        this.config.capturePages = this.prInfo.routes;
        return true;
      }

      console.log(chalk.yellow('⚠️ Aucune information de migration trouvée. Utilisation des routes par défaut.'));
      this.config.capturePages = ['/'];
      return false;
    } catch (error) {
      console.error(chalk.red(`Erreur lors du chargement des infos de migration: ${error}`));
      this.config.capturePages = ['/'];
      return false;
    }
  }

  /**
   * Déploie l'environnement de prévisualisation
   */
  async deployPreview(): Promise<boolean> {
    console.log(chalk.blue(`🚀 Déploiement de l'environnement de prévisualisation pour PR #${this.prInfo.prNumber}...`));

    try {
      const provider = this.config.deploymentProvider;

      switch (provider) {
        case 'docker':
          // Utiliser script deploy-preview.sh
          execSync(`./scripts/deploy-preview.sh ${this.prInfo.branchName}`, { stdio: 'inherit' });
          this.previewUrl = `https://${this.prInfo.branchName.replace(/[^a-z0-9]/gi, '-')}.${this.config.previewDomain}`;
          break;

        case 'coolify':
          // Déclencher un déploiement Coolify
          if (!this.config.coolifyApiKey) {
            throw new Error('Clé API Coolify manquante');
          }
          
          await axios.post(
            'https://api.coolify.io/deploy/preview', 
            { branch: this.prInfo.branchName },
            { headers: { 'Authorization': `Bearer ${this.config.coolifyApiKey}` } }
          );
          
          this.previewUrl = `https://${this.prInfo.branchName.replace(/[^a-z0-9]/gi, '-')}.${this.config.previewDomain}`;
          break;

        case 'vercel':
          // Utilisation de Vercel pour le déploiement
          execSync(`npx vercel --token ${process.env.VERCEL_TOKEN} --scope ${process.env.VERCEL_TEAM} --confirm`);
          
          // Récupérer l'URL de déploiement depuis la sortie de Vercel
          const vercelOutput = execSync('npx vercel --token ${process.env.VERCEL_TOKEN} ls --scope ${process.env.VERCEL_TEAM} --json').toString();
          const deployments = JSON.parse(vercelOutput);
          const latestDeployment = deployments[0];
          this.previewUrl = latestDeployment.url;
          break;

        default:
          throw new Error(`Fournisseur de déploiement non pris en charge: ${provider}`);
      }

      // Sauvegarde de l'URL de prévisualisation
      const previewUrlPath = path.join(process.cwd(), this.previewDir, `fiche-${this.prInfo.prNumber}`, 'preview_url.txt');
      await fs.writeFile(previewUrlPath, this.previewUrl);

      console.log(chalk.green(`✓ Environnement déployé: ${this.previewUrl}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Erreur lors du déploiement: ${error}`));
      return false;
    }
  }

  /**
   * Génère des captures d'écran des pages migrées avec Playwright
   */
  async captureScreenshots(): Promise<boolean> {
    console.log(chalk.blue('📸 Génération des captures d'écran...'));

    try {
      // Vérifier si Playwright est installé
      try {
        execSync('npx playwright --version');
      } catch (e) {
        console.log(chalk.yellow('⚠️ Playwright non installé. Installation en cours...'));
        execSync('npx playwright install --with-deps chromium');
      }

      // Créer script temporaire pour Playwright
      const playwrightScript = `
        const { chromium } = require('playwright');
        const fs = require('fs');
        const path = require('path');

        (async () => {
          const browser = await chromium.launch();
          const context = await browser.newContext();
          const pages = ${JSON.stringify(this.config.capturePages)};
          const baseUrl = process.argv[2];
          const outputDir = process.argv[3];
          
          for (const route of pages) {
            const page = await context.newPage();
            const fullUrl = new URL(route, baseUrl).toString();
            
            console.log('Capturing:', fullUrl);
            await page.goto(fullUrl, { waitUntil: 'networkidle' });
            
            // Capture de l'écran entier
            const screenshotPath = path.join(outputDir, 'snapshots', \`screenshot-\${route.replace(/\\//g, '-').replace(/^-/, '')}.png\`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            
            // Extraction des métadonnées SEO
            const seoData = await page.evaluate(() => {
              return {
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
                h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
                metaTags: Array.from(document.querySelectorAll('meta')).map(m => ({
                  name: m.getAttribute('name') || m.getAttribute('property') || '',
                  content: m.getAttribute('content') || ''
                }))
              };
            });
            
            // Sauvegarde des données SEO
            const seoFilePath = path.join(outputDir, 'snapshots', \`seo-\${route.replace(/\\//g, '-').replace(/^-/, '')}.json\`);
            fs.writeFileSync(seoFilePath, JSON.stringify(seoData, null, 2));
            
            await page.close();
          }
          
          await browser.close();
        })();
      `;

      const scriptPath = path.join(process.cwd(), this.previewDir, 'capture-script.js');
      await fs.writeFile(scriptPath, playwrightScript);

      // Exécuter le script de capture
      const outputDir = path.join(process.cwd(), this.previewDir, `fiche-${this.prInfo.prNumber}`);
      
      execSync(`node ${scriptPath} ${this.previewUrl} ${outputDir}`, { stdio: 'inherit' });
      
      // Générer rapport SEO
      await this.generateSeoReport(outputDir);
      
      console.log(chalk.green('✓ Captures d\'écran générées avec succès'));
      return true;
    } catch (error) {
      console.error(chalk.red(`Erreur lors de la capture d'écran: ${error}`));
      return false;
    }
  }

  /**
   * Génère un rapport SEO à partir des données collectées
   */
  private async generateSeoReport(outputDir: string): Promise<void> {
    console.log(chalk.blue('📊 Génération du rapport SEO...'));

    try {
      const snapshotsDir = path.join(outputDir, 'snapshots');
      const seoFiles = fs.readdirSync(snapshotsDir).filter(file => file.startsWith('seo-'));

      let markdownReport = `# Rapport SEO - PR #${this.prInfo.prNumber}\n\n`;
      markdownReport += `URL de prévisualisation: ${this.previewUrl}\n\n`;
      markdownReport += `Date de génération: ${new Date().toLocaleString('fr-FR')}\n\n`;

      for (const seoFile of seoFiles) {
        const seoFilePath = path.join(snapshotsDir, seoFile);
        const seoData = await fs.readJson(seoFilePath);
        const routeName = seoFile.replace('seo-', '').replace('.json', '').replace(/-/g, '/');

        markdownReport += `## Route: ${routeName}\n\n`;
        markdownReport += `### Métadonnées principales\n\n`;
        markdownReport += `- **Titre**: ${seoData.title || 'Non défini'}\n`;
        markdownReport += `- **Description**: ${seoData.description || 'Non définie'}\n`;
        markdownReport += `- **Canonical**: ${seoData.canonical || 'Non définie'}\n`;
        markdownReport += `- **H1**: ${seoData.h1.join(', ') || 'Non défini'}\n\n`;

        markdownReport += `### Balises Meta\n\n`;
        markdownReport += `| Nom | Contenu |\n`;
        markdownReport += `| --- | --- |\n`;

        seoData.metaTags.forEach((meta: any) => {
          if (meta.name && meta.content) {
            markdownReport += `| ${meta.name} | ${meta.content} |\n`;
          }
        });

        markdownReport += `\n`;
      }

      // Vérification des problèmes SEO
      markdownReport += `## Problèmes détectés\n\n`;
      let issuesFound = false;

      for (const seoFile of seoFiles) {
        const seoFilePath = path.join(snapshotsDir, seoFile);
        const seoData = await fs.readJson(seoFilePath);
        const routeName = seoFile.replace('seo-', '').replace('.json', '').replace(/-/g, '/');
        
        const issues = [];

        if (!seoData.title) issues.push("Titre manquant");
        if (!seoData.description) issues.push("Description meta manquante");
        if (!seoData.canonical) issues.push("Lien canonical manquant");
        if (seoData.h1.length === 0) issues.push("H1 manquant");
        if (seoData.h1.length > 1) issues.push("Multiple H1 détectés");

        if (issues.length > 0) {
          issuesFound = true;
          markdownReport += `### Route: ${routeName}\n\n`;
          issues.forEach(issue => {
            markdownReport += `- ⚠️ ${issue}\n`;
          });
          markdownReport += `\n`;
        }
      }

      if (!issuesFound) {
        markdownReport += `✅ Aucun problème SEO majeur détecté.\n\n`;
      }

      // Génération de la checklist
      const checklistPath = path.join(outputDir, 'preview_checklist.md');
      
      let checklist = `# Checklist de prévisualisation - PR #${this.prInfo.prNumber}\n\n`;
      checklist += `URL: ${this.previewUrl}\n\n`;
      checklist += `## À vérifier manuellement\n\n`;
      checklist += `- [ ] L'interface utilisateur correspond à la maquette\n`;
      checklist += `- [ ] Les fonctionnalités clés sont opérationnelles\n`;
      checklist += `- [ ] La navigation fonctionne correctement\n`;
      checklist += `- [ ] Le design est responsive (mobile, tablette, desktop)\n`;
      checklist += `- [ ] Les performances sont satisfaisantes\n\n`;
      
      checklist += `## Vérifications automatiques\n\n`;
      checklist += `- [${!issuesFound ? 'x' : ' '}] Balises SEO correctement configurées\n`;
      checklist += `- [x] Captures d'écran générées\n`;
      checklist += `- [x] Rapport SEO généré\n`;
      
      // Sauvegarde des rapports
      const seoReportPath = path.join(outputDir, 'seo_report.md');
      await fs.writeFile(seoReportPath, markdownReport);
      await fs.writeFile(checklistPath, checklist);

      console.log(chalk.green('✓ Rapport SEO généré avec succès'));
    } catch (error) {
      console.error(chalk.red(`Erreur lors de la génération du rapport SEO: ${error}`));
    }
  }

  /**
   * Exécute toutes les étapes du processus de prévisualisation
   */
  async run(): Promise<boolean> {
    console.log(chalk.blue(`🔍 Démarrage de l'agent de prévisualisation pour PR #${this.prInfo.prNumber}`));
    
    try {
      // 1. Charger les informations de migration
      await this.loadMigrationInfo();
      
      if (this.prInfo.status === 'ready' || process.env.FORCE_PREVIEW === 'true') {
        // 2. Déployer l'environnement de prévisualisation
        const deploySuccess = await this.deployPreview();
        if (!deploySuccess) return false;
        
        // 3. Attendre que le déploiement soit disponible
        console.log(chalk.blue('⏳ Attente de la disponibilité du déploiement...'));
        
        // Petite pause pour laisser le déploiement se stabiliser
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // 4. Capturer les screenshots et générer le rapport SEO
        const captureSuccess = await this.captureScreenshots();
        if (!captureSuccess) return false;
        
        // 5. Exécuter Lighthouse si activé
        if (this.config.runLighthouse) {
          await this.runLighthouseAnalysis();
        }
        
        // 6. Ajouter un commentaire à la PR GitHub
        await this.commentOnPR();
        
        console.log(chalk.green(`✅ Prévisualisation complétée avec succès pour PR #${this.prInfo.prNumber}`));
        console.log(chalk.green(`🔗 URL: ${this.previewUrl}`));
        
        return true;
      } else {
        console.log(chalk.yellow(`⚠️ La PR #${this.prInfo.prNumber} n'est pas prête pour la prévisualisation (status: ${this.prInfo.status})`));
        return false;
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de l'exécution de l'agent de prévisualisation: ${error}`));
      return false;
    }
  }

  /**
   * Exécute l'analyse Lighthouse pour chaque page
   */
  async runLighthouseAnalysis(): Promise<boolean> {
    console.log(chalk.blue('🔍 Exécution de l\'analyse Lighthouse...'));

    try {
      // Vérifier si Lighthouse est installé
      try {
        execSync('npx lighthouse --version', { stdio: 'ignore' });
      } catch (e) {
        console.log(chalk.yellow('⚠️ Lighthouse CLI non installé. Installation en cours...'));
        execSync('npm install -g lighthouse');
      }

      // Vérifier si Chrome est disponible
      try {
        execSync('which google-chrome-stable || which google-chrome', { stdio: 'ignore' });
      } catch (e) {
        console.log(chalk.yellow('⚠️ Google Chrome non trouvé. Installation en cours...'));
        if (process.platform === 'linux') {
          execSync('apt-get update && apt-get install -y google-chrome-stable');
        } else {
          console.log(chalk.red('⚠️ Installation automatique de Chrome uniquement prise en charge sous Linux.'));
          console.log(chalk.red('⚠️ Veuillez installer Chrome manuellement pour utiliser Lighthouse.'));
          return false;
        }
      }

      const outputDir = path.join(process.cwd(), this.previewDir, `fiche-${this.prInfo.prNumber}`);
      const lighthouseDir = path.join(outputDir, 'lighthouse');
      const lighthouseReportPath = path.join(outputDir, 'lighthouse_report.md');
      
      let markdownReport = `# Rapport de performance Lighthouse - PR #${this.prInfo.prNumber}\n\n`;
      markdownReport += `URL de prévisualisation: ${this.previewUrl}\n\n`;
      markdownReport += `Date de génération: ${new Date().toLocaleString('fr-FR')}\n\n`;
      markdownReport += `## Résumé des performances\n\n`;
      markdownReport += `| Route | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | CLS | TTI |\n`;
      markdownReport += `| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

      const allResults: { [route: string]: LighthouseResults } = {};
      
      // Exécuter Lighthouse pour chaque page
      for (const route of this.config.capturePages) {
        const fullUrl = new URL(route, this.previewUrl).toString();
        const safeRoute = route.replace(/\//g, '-').replace(/^-/, '') || 'home';
        const htmlOutputPath = path.join(lighthouseDir, `lighthouse-${safeRoute}.html`);
        const jsonOutputPath = path.join(lighthouseDir, `lighthouse-${safeRoute}.json`);
        
        console.log(chalk.blue(`⏳ Analyse Lighthouse en cours pour: ${fullUrl}`));
        
        try {
          const categories = this.config.lighthouseCategories.join(',');
          const command = `npx lighthouse ${fullUrl} --output html,json --output-path ${lighthouseDir}/lighthouse-${safeRoute} --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=${categories} --quiet`;
          
          execSync(command, { stdio: 'inherit' });
          
          // Analyser les résultats
          if (fs.existsSync(jsonOutputPath)) {
            const lighthouseResults = await fs.readJson(jsonOutputPath);
            const categories = lighthouseResults.categories;
            
            const results: LighthouseResults = {
              performance: Math.round(categories.performance?.score * 100) || 0,
              accessibility: Math.round(categories.accessibility?.score * 100) || 0,
              bestPractices: Math.round(categories['best-practices']?.score * 100) || 0,
              seo: Math.round(categories.seo?.score * 100) || 0,
              pwa: categories.pwa ? Math.round(categories.pwa.score * 100) : undefined,
              firstContentfulPaint: lighthouseResults.audits['first-contentful-paint']?.numericValue,
              largestContentfulPaint: lighthouseResults.audits['largest-contentful-paint']?.numericValue,
              cumulativeLayoutShift: lighthouseResults.audits['cumulative-layout-shift']?.numericValue,
              timeToInteractive: lighthouseResults.audits['interactive']?.numericValue,
              totalBlockingTime: lighthouseResults.audits['total-blocking-time']?.numericValue,
              speedIndex: lighthouseResults.audits['speed-index']?.numericValue
            };
            
            // Sauvegarder les résultats
            allResults[route] = results;
            
            // Formater les mesures pour l'affichage
            const fcp = results.firstContentfulPaint ? `${(results.firstContentfulPaint / 1000).toFixed(1)}s` : '-';
            const lcp = results.largestContentfulPaint ? `${(results.largestContentfulPaint / 1000).toFixed(1)}s` : '-';
            const cls = results.cumulativeLayoutShift ? results.cumulativeLayoutShift.toFixed(3) : '-';
            const tti = results.timeToInteractive ? `${(results.timeToInteractive / 1000).toFixed(1)}s` : '-';
            
            // Ajouter les résultats au rapport
            markdownReport += `| ${route} | ${formatScore(results.performance)} | ${formatScore(results.accessibility)} | ${formatScore(results.bestPractices)} | ${formatScore(results.seo)} | ${fcp} | ${lcp} | ${cls} | ${tti} |\n`;
          }
          
        } catch (error) {
          console.error(chalk.red(`Erreur lors de l'analyse Lighthouse pour ${fullUrl}: ${error}`));
          markdownReport += `| ${route} | ❌ | ❌ | ❌ | ❌ | - | - | - | - |\n`;
        }
      }
      
      // Ajouter des explications au rapport
      markdownReport += `\n## Explication des métriques\n\n`;
      markdownReport += `- **Performance**: Score global de performance (0-100)\n`;
      markdownReport += `- **Accessibilité**: Conformité aux normes d'accessibilité (0-100)\n`;
      markdownReport += `- **Bonnes pratiques**: Respect des bonnes pratiques web (0-100)\n`;
      markdownReport += `- **SEO**: Optimisation pour les moteurs de recherche (0-100)\n`;
      markdownReport += `- **FCP (First Contentful Paint)**: Temps jusqu'au premier affichage de contenu\n`;
      markdownReport += `- **LCP (Largest Contentful Paint)**: Temps jusqu'à l'affichage du plus grand élément visible\n`;
      markdownReport += `- **CLS (Cumulative Layout Shift)**: Mesure de la stabilité visuelle (plus c'est bas, mieux c'est)\n`;
      markdownReport += `- **TTI (Time to Interactive)**: Temps jusqu'à ce que la page soit interactive\n\n`;
      
      markdownReport += `## Classification des performances\n\n`;
      markdownReport += `| Score | Évaluation | Description |\n`;
      markdownReport += `| --- | --- | --- |\n`;
      markdownReport += `| 90-100 | 🟢 Excellent | La page est optimale |\n`;
      markdownReport += `| 70-89 | 🟡 Bon | La page présente quelques opportunités d'amélioration |\n`;
      markdownReport += `| 50-69 | 🟠 Moyen | La page présente des problèmes de performance importants |\n`;
      markdownReport += `| 0-49 | 🔴 Faible | La page présente des problèmes critiques de performance |\n\n`;
      
      markdownReport += `## Détails complets\n\n`;
      markdownReport += `Les rapports Lighthouse complets sont disponibles dans le dossier \`.preview/fiche-${this.prInfo.prNumber}/lighthouse/\`.\n\n`;
      
      // Ajouter les problèmes identifiés
      markdownReport += `## Problèmes identifiés et recommandations\n\n`;
      
      let hasIssues = false;
      for (const route in allResults) {
        const results = allResults[route];
        const issues = [];
        
        if (results.performance < 70) issues.push(`Performance faible (${results.performance}/100)`);
        if (results.accessibility < 70) issues.push(`Accessibilité insuffisante (${results.accessibility}/100)`);
        if (results.bestPractices < 70) issues.push(`Non-respect des bonnes pratiques (${results.bestPractices}/100)`);
        if (results.seo < 70) issues.push(`Optimisation SEO insuffisante (${results.seo}/100)`);
        if (results.largestContentfulPaint && results.largestContentfulPaint > 2500) issues.push(`LCP trop lent (${(results.largestContentfulPaint/1000).toFixed(1)}s > 2.5s)`);
        if (results.cumulativeLayoutShift && results.cumulativeLayoutShift > 0.25) issues.push(`CLS trop élevé (${results.cumulativeLayoutShift.toFixed(3)} > 0.25)`);
        
        if (issues.length > 0) {
          hasIssues = true;
          markdownReport += `### Route: ${route}\n\n`;
          issues.forEach(issue => {
            markdownReport += `- ⚠️ ${issue}\n`;
          });
          markdownReport += `\n`;
        }
      }
      
      if (!hasIssues) {
        markdownReport += `✅ Aucun problème majeur de performance détecté.\n\n`;
      }
      
      // Sauvegarder le rapport
      await fs.writeFile(lighthouseReportPath, markdownReport);
      
      // Mettre à jour la checklist avec les résultats Lighthouse
      const checklistPath = path.join(outputDir, 'preview_checklist.md');
      if (fs.existsSync(checklistPath)) {
        let checklist = await fs.readFile(checklistPath, 'utf8');
        
        // Ajouter l'entrée Lighthouse à la checklist si elle n'existe pas déjà
        if (!checklist.includes('Rapport Lighthouse généré')) {
          const insertPosition = checklist.indexOf('## Vérifications automatiques') + '## Vérifications automatiques\n\n'.length;
          const lighthouseEntry = `- [x] Rapport Lighthouse généré\n`;
          
          checklist = checklist.slice(0, insertPosition) + lighthouseEntry + checklist.slice(insertPosition);
          await fs.writeFile(checklistPath, checklist);
        }
      }
      
      console.log(chalk.green('✓ Analyse Lighthouse terminée avec succès'));
      return true;
    } catch (error) {
      console.error(chalk.red(`Erreur lors de l'analyse Lighthouse: ${error}`));
      return false;
    }
  }

  /**
   * Ajoute un commentaire à la PR GitHub avec les résultats
   */
  async commentOnPR(): Promise<boolean> {
    if (!this.configDoDoDoDoDoDotgithubToken || !this.prInfo.prNumber) {
      console.log(chalk.yellow('⚠️ Commentaire GitHub ignoré: token ou numéro de PR manquant'));
      return false;
    }

    console.log(chalk.blue(`💬 Ajout d'un commentaire à la PR #${this.prInfo.prNumber}...`));

    try {
      const { Octokit } = require('@octokit/rest');
      const octokit = new Octokit({ auth: this.configDoDoDoDoDoDotgithubToken });
      
      // Récupérer le propriétaire et le nom du repo depuis l'URL du repo
      const packageJson = await fs.readJson(path.join(process.cwd(), 'package.json'));
      const repoUrl = packageJson.repository?.url || '';
      const repoMatch = repoUrl.match(DoDoDoDoDoDotgithub\.com\/([^\/]+)\/([^\.]+)\DoDoDoDotgit/);
      
      if (!repoMatch) {
        throw new Error('Impossible de déterminer le propriétaire et le nom du repo GitHub');
      }
      
      const [, owner, repo] = repoMatch;
      
      // Générer le contenu du commentaire
      let comment = `## 🚀 Prévisualisation de la PR\n\n`;
      comment += `L'environnement de prévisualisation a été déployé avec succès !\n\n`;
      comment += `🔗 URL de prévisualisation: ${this.previewUrl}\n\n`;
      
      const previewDir = path.join(process.cwd(), this.previewDir, `fiche-${this.prInfo.prNumber}`);
      
      // Ajouter résumé Lighthouse si disponible
      const lighthouseReportPath = path.join(previewDir, 'lighthouse_report.md');
      if (fs.existsSync(lighthouseReportPath)) {
        comment += `### 📊 Performance Lighthouse\n\n`;
        
        // Récupérer les scores moyens de performance
        let performanceAvg = 0;
        let accessibilityAvg = 0;
        let bestPracticesAvg = 0;
        let seoAvg = 0;
        let routeCount = 0;
        
        const lighthouseDir = path.join(previewDir, 'lighthouse');
        const lighthouseFiles = fs.readdirSync(lighthouseDir).filter(file => file.endsWith('.json'));
        
        for (const file of lighthouseFiles) {
          const filePath = path.join(lighthouseDir, file);
          const data = await fs.readJson(filePath);
          
          if (data.categories) {
            performanceAvg += (data.categories.performance?.score || 0) * 100;
            accessibilityAvg += (data.categories.accessibility?.score || 0) * 100;
            bestPracticesAvg += (data.categories['best-practices']?.score || 0) * 100;
            seoAvg += (data.categories.seo?.score || 0) * 100;
            routeCount++;
          }
        }
        
        if (routeCount > 0) {
          performanceAvg = Math.round(performanceAvg / routeCount);
          accessibilityAvg = Math.round(accessibilityAvg / routeCount);
          bestPracticesAvg = Math.round(bestPracticesAvg / routeCount);
          seoAvg = Math.round(seoAvg / routeCount);
          
          comment += `| Métrique | Score moyen |\n`;
          comment += `| --- | :---: |\n`;
          comment += `| Performance | ${getScoreEmoji(performanceAvg)} ${performanceAvg}/100 |\n`;
          comment += `| Accessibilité | ${getScoreEmoji(accessibilityAvg)} ${accessibilityAvg}/100 |\n`;
          comment += `| Bonnes pratiques | ${getScoreEmoji(bestPracticesAvg)} ${bestPracticesAvg}/100 |\n`;
          comment += `| SEO | ${getScoreEmoji(seoAvg)} ${seoAvg}/100 |\n\n`;
          
          comment += `Consultez le rapport complet Lighthouse dans les artefacts pour plus de détails.\n\n`;
        }
      }
      
      // Ajouter capture d'écran principale
      const snapshotsDir = path.join(previewDir, 'snapshots');
      const screenshots = fs.readdirSync(snapshotsDir).filter(file => file.startsWith('screenshot-'));
      
      if (screenshots.length > 0) {
        // Utiliser GitHub Actions pour télécharger les captures d'écran
        if (process.env.GITHUB_ACTIONS) {
          const artifactName = `preview-${this.prInfo.prNumber}`;
          
          comment += `### 📸 Captures d'écran\n\n`;
          comment += `Les captures d'écran sont disponibles dans l'artefact \`${artifactName}\`.\n\n`;
        }
      }
      
      // Ajouter statut SEO
      const seoReportPath = path.join(previewDir, 'seo_report.md');
      if (fs.existsSync(seoReportPath)) {
        comment += `### 🔍 Validation SEO\n\n`;
        comment += `Un rapport SEO complet a été généré. Vérifiez l'artefact pour plus de détails.\n\n`;
      }
      
      // Publier le commentaire
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: parseInt(this.prInfo.prNumber),
        body: comment
      });
      
      console.log(chalk.green('✓ Commentaire ajouté à la PR avec succès'));
      return true;
    } catch (error) {
      console.error(chalk.red(`Erreur lors de l'ajout du commentaire GitHub: ${error}`));
      return false;
    }
  }
}

/**
 * Formate un score pour l'affichage avec un emoji
 */
function formatScore(score: number): string {
  return `${getScoreEmoji(score)} ${score}`;
}

/**
 * Retourne un emoji en fonction du score
 */
function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}

// Point d'entrée du script
if (require.main === module) {
  const args = process.argv.slice(2);
  const prNumber = args[0];
  const branchName = args[1] || `pr-${prNumber}`;
  
  if (!prNumber) {
    console.error(chalk.red('❌ Erreur: Numéro de PR requis.'));
    console.log('Usage: ts-node agents/devops-preview.ts <PR_NUMBER> [BRANCH_NAME]');
    process.exit(1);
  }
  
  const agent = new PreviewAgent(prNumber, branchName);
  agent.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red(`❌ Erreur non gérée: ${error}`));
      process.exit(1);
    });
}

// Exportation pour utilisation dans d'autres scripts
export { PreviewAgent };