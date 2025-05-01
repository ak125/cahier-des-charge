/**
 * SEO Audit Runner Agent
 *
 * Agent qui exécute des audits Lighthouse sur les pages Remix
 * et génère des rapports d'analyse SEO détaillés
 */

import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import fs from 'fs-extra';
import glob from 'glob';
import { Database } from '../packages/shared/DbConnector';
import { AgentConfig, AgentContext, MCPAgent } from '../packagesDoDotmcp-core';

const execPromise = util.promisify(exec);

interface AuditOptions {
  url: string;
  output?: 'json' | 'html' | 'both';
  outputPath?: string;
}

interface AuditResult {
  url: string;
  date: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  details: {
    seoIssues: Array<{
      title: string;
      description: string;
      severity: string;
      score: number;
    }>;
    recommendations: string[];
  };
  reportPath?: string;
  htmlReportPath?: string;
}

interface SEOAuditConfig extends AgentConfig {
  baseUrl: string;
  routes: string[] | 'auto';
  outputDir: string;
  minSeoScore: number;
  failOnLowScore: boolean;
  dbTracking: boolean;
  concurrentAudits: number;
  generateRecommendations: boolean;
  skipRoutes: string[];
}

export class SEOAuditRunner implements MCPAgent<SEOAuditConfig> {
  id = 'seo-audit-runner';
  name = 'SEO Audit Runner';
  description =
    "Exécute des audits Lighthouse sur les routes Remix et génère des rapports d'analyse SEO";
  version = '1.0.0';

  private db: Database | null = null;
  private results: AuditResult[] = [];

  constructor(private config: SEOAuditConfig, private context: AgentContext) {
    if (config.dbTracking) {
      this.initializeDatabase();
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.db = new Database({
        connectionString: process.env.DATABASE_URL || '',
        schema: 'public',
        table: 'seo_audit_results',
      });
      await this.db.initialize();
    } catch (error) {
      this.context.logger.error("Erreur lors de l'initialisation de la base de données:", error);
      this.db = null;
    }
  }

  async initialize(): Promise<void> {
    this.context.logger.info('Initialisation du SEO Audit Runner');
    this.results = [];

    // Vérifier que Lighthouse est installé
    try {
      await execPromise('lighthouse --version');
    } catch (error) {
      this.context.logger.warn("Lighthouse n'est pas installé. Installation en cours...");
      try {
        await execPromise('npm install -g lighthouse');
        this.context.logger.info('Lighthouse a été installé avec succès.');
      } catch (installError) {
        throw new Error(`Impossible d'installer Lighthouse: ${installError}`);
      }
    }

    // Créer le répertoire de sortie s'il n'existe pas
    await fs.ensureDir(this.config.outputDir);
  }

  async run(): Promise<void> {
    this.context.logger.info('Démarrage des audits SEO');

    // Déterminer les routes à auditer
    const routesToAudit = await this.determineRoutesToAudit();
    this.context.logger.info(`${routesToAudit.length} routes à auditer`);

    // Exécuter les audits par lots pour limiter la concurrence
    const batchSize = this.config.concurrentAudits || 3;
    const batches = [];

    for (let i = 0; i < routesToAudit.length; i += batchSize) {
      batches.push(routesToAudit.slice(i, i + batchSize));
    }

    let batchNumber = 1;
    for (const batch of batches) {
      this.context.logger.info(
        `Traitement du lot ${batchNumber}/${batches.length} (${batch.length} routes)`
      );

      const auditPromises = batch.map((route) => this.auditRoute(route));
      const batchResults = await Promise.all(auditPromises);

      this.results.push(...batchResults);
      batchNumber++;
    }

    // Générer le rapport global
    await this.generateFullReport();

    // Vérifier si le score SEO moyen est suffisant
    const averageSeoScore = this.calculateAverageSeoScore();
    this.context.logger.info(`Score SEO moyen: ${averageSeoScore.toFixed(2)}`);

    if (averageSeoScore < this.config.minSeoScore) {
      const message = `⚠️ Score SEO moyen (${averageSeoScore.toFixed(
        2
      )}) inférieur au minimum requis (${this.config.minSeoScore})`;

      if (this.config.failOnLowScore) {
        throw new Error(message);
      } else {
        this.context.logger.warn(message);
      }
    }
  }

  /**
   * Détermine les routes à auditer selon la configuration
   */
  private async determineRoutesToAudit(): Promise<string[]> {
    if (Array.isArray(this.config.routes)) {
      // Utiliser les routes spécifiées dans la configuration
      return this.config.routes.filter(
        (route) =>
          !this.config.skipRoutes.some((skipPattern) => new RegExp(skipPattern).test(route))
      );
    } else if (this.config.routes === 'auto') {
      // Découvrir automatiquement les routes à partir des fichiers
      try {
        // Chercher tous les fichiers de routes Remix
        const routeFiles = glob.sync('app/routes/**/*.{tsx,jsx}', {
          ignore: ['**/*.test.*', '**/*.spec.*', '**/._*'],
        });

        const routes = routeFiles
          .map((file) => {
            // Convertir le chemin du fichier en route
            const route =
              '/' +
              file
                .replace(/^app\/routes\//, '')
                .replace(/\.(tsx|jsx)$/, '')
                .replace(/\$/g, ':')
                .replace(/\.index$/, '')
                .replace(/index$/, '')
                .replace(/\._/g, '/');

            return route;
          })
          .filter(
            (route) =>
              // Filtrer les routes à ignorer
              !this.config.skipRoutes.some((skipPattern) => new RegExp(skipPattern).test(route))
          );

        return routes;
      } catch (error) {
        this.context.logger.error('Erreur lors de la découverte automatique des routes:', error);
        return [];
      }
    }

    return [];
  }

  /**
   * Exécute un audit Lighthouse pour une route
   */
  private async auditRoute(route: string): Promise<AuditResult> {
    const url = `${this.config.baseUrl}${route}`;
    this.context.logger.info(`Audit de ${url}`);

    try {
      const outputPath = path.join(this.config.outputDir, `${this.sanitizeFileName(route)}`);

      // Exécuter Lighthouse
      const auditResult = await this.runLighthouse({
        url,
        output: 'both',
        outputPath,
      });

      // Enregistrer le résultat dans la base de données si activé
      if (this.db) {
        try {
          await this.db.query(
            `
            INSERT INTO seo_audit_results (url, score, performance, accessibility, best_practices, audited_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (url) DO UPDATE 
            SET score = $2, performance = $3, accessibility = $4, best_practices = $5, audited_at = NOW()
          `,
            [
              route,
              auditResult.scores.seo,
              auditResult.scores.performance,
              auditResult.scores.accessibility,
              auditResult.scores.bestPractices,
            ]
          );
        } catch (error) {
          this.context.logger.error(
            `Erreur lors de l'enregistrement en base de données pour ${route}:`,
            error
          );
        }
      }

      return auditResult;
    } catch (error) {
      this.context.logger.error(`Erreur lors de l'audit de ${url}:`, error);

      // Retourner un résultat d'erreur
      return {
        url,
        date: new Date().toISOString(),
        scores: {
          performance: 0,
          accessibility: 0,
          bestPractices: 0,
          seo: 0,
        },
        details: {
          seoIssues: [
            {
              title: "Erreur d'audit",
              description: `L'audit a échoué: ${error}`,
              severity: 'error',
              score: 0,
            },
          ],
          recommendations: ["Vérifier la disponibilité de la page et réessayer l'audit."],
        },
      };
    }
  }

  /**
   * Exécute Lighthouse et analyse les résultats
   */
  private async runLighthouse(options: AuditOptions): Promise<AuditResult> {
    const {
      url,
      output = 'json',
      outputPath = path.join(this.config.outputDir, this.sanitizeFileName(url)),
    } = options;

    try {
      // Format de sortie pour Lighthouse
      const outputFormats = output === 'both' ? 'html,json' : output;
      const fullOutputPath = `${outputPath}`;

      // Exécuter Lighthouse avec les options spécifiées
      const command = `lighthouse ${url} --output ${outputFormats} --output-path ${fullOutputPath} --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo`;

      await execPromise(command);

      // Lire et analyser le rapport JSON
      const jsonReportPath = `${outputPath}.report.json`;
      const htmlReportPath = `${outputPath}.report.html`;

      if (!fs.existsSync(jsonReportPath)) {
        throw new Error(`Le rapport JSON n'a pas été généré: ${jsonReportPath}`);
      }

      const jsonReport = await fs.readJson(jsonReportPath);

      // Extraire les scores et détails pertinents
      const scores = {
        performance: Math.round(jsonReport.categories.performance.score * 100),
        accessibility: Math.round(jsonReport.categories.accessibility.score * 100),
        bestPractices: Math.round(jsonReport.categories['best-practices'].score * 100),
        seo: Math.round(jsonReport.categories.seo.score * 100),
      };

      // Extraire les problèmes SEO
      const seoIssues = this.extractSEOIssues(jsonReport);

      // Générer des recommandations par IA si demandé
      const recommendations = this.config.generateRecommendations
        ? this.generateRecommendations(seoIssues, scores.seo)
        : [];

      return {
        url,
        date: new Date().toISOString(),
        scores,
        details: {
          seoIssues,
          recommendations,
        },
        reportPath: jsonReportPath,
        htmlReportPath: fs.existsSync(htmlReportPath) ? htmlReportPath : undefined,
      };
    } catch (error) {
      throw new Error(`Échec de l'audit Lighthouse pour ${url}: ${error}`);
    }
  }

  /**
   * Extrait les problèmes SEO du rapport Lighthouse
   */
  private extractSEOIssues(
    report: any
  ): Array<{ title: string; description: string; severity: string; score: number }> {
    const issues = [];

    // Parcourir les audits de la catégorie SEO
    for (const [id, audit] of Object.entries(report.audits)) {
      const auditData = audit as any;

      // Ne considérer que les audits échoués ou avec avertissements
      if ((auditData.score !== null && auditData.score < 0.9) || auditData.score === null) {
        if (report.categoryGroups[auditData.group]?.title?.includes('SEO') || id.includes('seo')) {
          issues.push({
            title: auditData.title,
            description: auditData.description,
            severity:
              auditData.score === null ? 'info' : auditData.score < 0.5 ? 'error' : 'warning',
            score: auditData.score === null ? 0 : auditData.score,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Génère des recommandations basées sur les problèmes identifiés
   */
  private generateRecommendations(issues: any[], seoScore: number): string[] {
    const recommendations = [];

    // Recommendations basées sur le score
    if (seoScore < 50) {
      recommendations.push(
        '⚠️ Votre page a des problèmes SEO critiques qui doivent être résolus rapidement.'
      );
    } else if (seoScore < 80) {
      recommendations.push("📝 Votre page présente plusieurs opportunités d'amélioration SEO.");
    } else if (seoScore < 90) {
      recommendations.push(
        '✅ Votre page a un bon score SEO, mais quelques améliorations peuvent encore être apportées.'
      );
    } else {
      recommendations.push('🌟 Excellent score SEO ! Continuez à maintenir ces bonnes pratiques.');
    }

    // Recommendations spécifiques basées sur les problèmes détectés
    const metaTagsIssues = issues.filter(
      (i) =>
        i.title.includes('Meta') || i.title.includes('Description') || i.title.includes('Title')
    );

    if (metaTagsIssues.length > 0) {
      recommendations.push(
        '📋 Améliorez vos balises meta : title et description doivent être présentes, uniques et de bonne longueur.'
      );
    }

    const linkIssues = issues.filter(
      (i) => i.title.includes('link') || i.title.includes('Link') || i.title.includes('anchor')
    );

    if (linkIssues.length > 0) {
      recommendations.push(
        '🔗 Optimisez les liens : assurez-vous que tous les liens ont des textes descriptifs et évitez les liens brisés.'
      );
    }

    const mobileIssues = issues.filter(
      (i) => i.title.includes('mobile') || i.title.includes('viewport')
    );

    if (mobileIssues.length > 0) {
      recommendations.push(
        '📱 Optimisez pour mobile : assurez-vous que votre page est adaptée aux appareils mobiles et que le contenu est lisible sans zoom.'
      );
    }

    // Recommendation générale pour des scores faibles
    if (recommendations.length <= 2 && seoScore < 70) {
      recommendations.push(
        "🔍 Envisagez un audit SEO complet pour identifier tous les problèmes et opportunités d'amélioration."
      );
    }

    return recommendations;
  }

  /**
   * Calcule le score SEO moyen de tous les audits
   */
  private calculateAverageSeoScore(): number {
    if (this.results.length === 0) return 0;

    const totalScore = this.results.reduce((sum, result) => sum + result.scores.seo, 0);
    return totalScore / this.results.length;
  }

  /**
   * Génère un rapport complet de tous les audits
   */
  private async generateFullReport(): Promise<void> {
    const reportDate = new Date().toISOString().split('T')[0];
    const reportPath = path.join(this.config.outputDir, `seo-report-${reportDate}.md`);
    const jsonReportPath = path.join(this.config.outputDir, `seo-report-${reportDate}.json`);

    // Générer le rapport markdown
    let markdownReport = `# Rapport d'audit SEO - ${reportDate}

## Résumé

- **URLs auditées**: ${this.results.length}
- **Score SEO moyen**: ${this.calculateAverageSeoScore().toFixed(2)}%
- **Pages avec score < 80**: ${this.results.filter((r) => r.scores.seo < 80).length}

## Détails des audits

`;

    // Trier les résultats par score SEO (ascendant)
    const sortedResults = [...this.results].sort((a, b) => a.scores.seo - b.scores.seo);

    for (const result of sortedResults) {
      markdownReport += `### [${result.url}](${result.url})

- **Score SEO**: ${result.scores.seo}%
- **Performance**: ${result.scores.performance}%
- **Accessibilité**: ${result.scores.accessibility}%
- **Bonnes pratiques**: ${result.scores.bestPractices}%
${
  result.htmlReportPath
    ? `- **Rapport complet**: [HTML](${path.relative(
        this.config.outputDir,
        result.htmlReportPath
      )})\n`
    : ''
}

#### Problèmes détectés

`;

      if (result.details.seoIssues.length === 0) {
        markdownReport += '✅ Aucun problème SEO détecté\n\n';
      } else {
        for (const issue of result.details.seoIssues) {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          markdownReport += `${icon} **${issue.title}**\n${issue.description}\n\n`;
        }
      }

      markdownReport += '#### Recommandations\n\n';

      for (const recommendation of result.details.recommendations) {
        markdownReport += `- ${recommendation}\n`;
      }

      markdownReport += '\n---\n\n';
    }

    // Ajouter des recommandations générales
    markdownReport += `## Recommandations générales

- Assurez-vous que toutes les pages ont des titres et descriptions uniques et pertinents
- Vérifiez que les URLs canoniques sont correctement configurées
- Optimisez les images avec des attributs alt descriptifs
- Assurez-vous que le site est compatible avec les appareils mobiles
- Vérifiez la vitesse de chargement des pages, en particulier sur mobile

Rapport généré automatiquement le ${new Date().toLocaleDateString()} par SEO Audit Runner.
`;

    // Écrire le rapport markdown
    await fs.writeFile(reportPath, markdownReport, 'utf-8');

    // Écrire le rapport JSON
    await fs.writeJson(
      jsonReportPath,
      {
        date: new Date().toISOString(),
        summary: {
          totalUrls: this.results.length,
          averageSeoScore: this.calculateAverageSeoScore(),
          lowScorePages: this.results.filter((r) => r.scores.seo < 80).length,
        },
        results: this.results.map((result) => ({
          url: result.url,
          scores: result.scores,
          issues: result.details.seoIssues,
          recommendations: result.details.recommendations,
        })),
      },
      { spaces: 2 }
    );

    this.context.logger.info(`Rapports générés: 
- Markdown: ${reportPath}
- JSON: ${jsonReportPath}`);
  }

  /**
   * Convertit une URL en nom de fichier sécurisé
   */
  private sanitizeFileName(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[\/\?#:\*\<\>\|\"]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

export default SEOAuditRunner;
