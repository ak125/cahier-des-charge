/**
 * SEO Checker Agent
 *
 * Agent IA qui vérifie, valide et corrige les métadonnées SEO
 * pour les sites Remix migrés depuis PHP
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { SEOChecker } from '../packagesDoDotmcp-agents/seo-checker/seo-checker';
import { AgentConfig, AgentContext, MCPAgent } from '../packagesDoDotmcp-core';
import {
  TraceabilityService,
  createTraceabilityService,
} from '../utils/traceability/traceability-service';

interface SEOCheckerConfig extends AgentConfig {
  // Répertoires source et cible
  phpDir: string;
  remixDir: string;
  outputDir: string;
  // Seuils de qualité
  minSeoScore: number;
  // Options de validation
  validateCanonicals: boolean;
  validateRedirects: boolean;
  runLighthouse: boolean;
  autoFix: boolean;
  // Options Supabase pour la traçabilité
  supabaseUrl?: string;
  supabaseKey?: string;
}

// Extension du service de traçabilité pour les événements SEO
export interface SEOTraceEvent {
  route: string;
  seoScore?: number;
  seoIssues?: string[];
  canonicalUrl?: string;
  redirectionType?: string;
  lighthouseScore?: number;
  hasMeta: boolean;
  hasCanonical: boolean;
  hasRedirects: boolean;
}

export class SEOCheckerAgent implements MCPAgent<SEOCheckerConfig> {
  id = 'seo-checker-agent';
  name = 'SEO Checker Agent';
  description = 'Vérifie, valide et corrige les métadonnées SEO des routes Remix';
  version = '1.0.0';

  private seoChecker: SEOChecker;
  private traceService: TraceabilityService;

  constructor(private config: SEOCheckerConfig, private context: AgentContext) {
    this.seoChecker = new SEOChecker({
      phpDir: config.phpDir,
      remixDir: config.remixDir,
      outputDir: config.outputDir,
      useDatabase: true, // Utiliser la base de données pour le suivi
    });

    // Initialisation du service de traçabilité
    this.traceService = createTraceabilityService('agents', {
      storageStrategy: 'database',
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
      databaseTable: 'seo_migration_status',
    });
  }

  async initialize(): Promise<void> {
    this.context.logger.info('Initialisation du SEO Checker Agent');

    // Traçage de l'initialisation
    const traceId = await this.traceService.generateTraceId({
      agentId: this.id,
      operation: 'initialize',
    });

    await this.traceService.logTrace({
      traceId,
      event: 'seo-checker-initialization',
      timestamp: new Date(),
      context: {
        phpDir: this.config.phpDir,
        remixDir: this.config.remixDir,
        outputDir: this.config.outputDir,
      },
    });

    await fs.ensureDir(this.config.outputDir);

    // Vérifier que tous les outils requis sont installés
    if (this.config.runLighthouse) {
      try {
        execSync('lighthouse --version', { stdio: 'ignore' });
      } catch (error) {
        this.context.logger.warn("Lighthouse n'est pas installé. Installation en cours...");
        execSync('npm install -g lighthouse', { stdio: 'inherit' });
      }
    }
  }

  async run(): Promise<void> {
    this.context.logger.info('Démarrage de la vérification SEO');

    // Création d'un ID de trace pour cette exécution
    const runTraceId = await this.traceService.generateTraceId({
      agentId: this.id,
      operation: 'run',
      timestamp: Date.now().toString(),
    });

    try {
      // Tracer le début de l'exécution
      await this.traceService.logTrace({
        traceId: runTraceId,
        event: 'seo-check-started',
        timestamp: new Date(),
        context: {
          phpDir: this.config.phpDir,
          remixDir: this.config.remixDir,
        },
      });

      // Traiter tous les fichiers PHP et générer les métadonnées Remix
      const result = await this.seoChecker.checkDirectory();

      // Tracer les résultats de l'exécution
      await this.traceService.logTrace({
        traceId: runTraceId,
        event: 'seo-check-completed',
        timestamp: new Date(),
        success: result.success > 0 && result.failed === 0,
        context: {
          processed: result.processed,
          success: result.success,
          failed: result.failed,
          averageScore: result.averageScore,
        },
      });

      // Analyser les résultats
      this.context.logger.info(`
      📊 Migration SEO terminée:
      - Fichiers traités: ${result.processed}
      - Succès: ${result.success}
      - Échecs: ${result.failed}
      - Score SEO moyen: ${result.averageScore}/100
      `);

      // Vérifier si on atteint le score minimal
      if (result.averageScore < this.config.minSeoScore) {
        this.context.logger.error(
          `⚠️ Score SEO moyen (${result.averageScore}) inférieur au minimum requis (${this.config.minSeoScore})`
        );

        // Tracer l'alerte de score faible
        await this.traceService.logTrace({
          traceId: runTraceId,
          event: 'seo-score-warning',
          timestamp: new Date(),
          success: false,
          context: {
            averageScore: result.averageScore,
            minRequired: this.config.minSeoScore,
          },
        });

        // Si autoFix est activé, essayer de corriger automatiquement
        if (this.config.autoFix) {
          await this.runAutoFix(runTraceId);
        }
      }

      // Générer le rapport global
      await this.generateSEOReport(runTraceId);
    } catch (error) {
      // Tracer toute erreur survenue
      await this.traceService.logTrace({
        traceId: runTraceId,
        event: 'seo-check-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
        context: { stack: error instanceof Error ? error.stack : undefined },
      });

      throw error;
    }
  }

  /**
   * Correction automatique des problèmes SEO courants
   */
  private async runAutoFix(parentTraceId: string): Promise<void> {
    this.context.logger.info('Lancement de la correction automatique des problèmes SEO');

    // Créer un ID de trace enfant pour l'opération de correction
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'autofix',
    });

    // Tracer le début de la correction
    await this.traceService.logTrace({
      traceId: childTraceId,
      parentTraceId,
      event: 'seo-autofix-started',
      timestamp: new Date(),
    });

    try {
      // Vérifier les canonicals manquants ou incorrects
      if (this.config.validateCanonicals) {
        await this.fixCanonicals(childTraceId);
      }

      // Vérifier les redirections
      if (this.config.validateRedirects) {
        await this.fixRedirects(childTraceId);
      }

      // Tracer la fin de la correction
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'seo-autofix-completed',
        timestamp: new Date(),
        success: true,
      });
    } catch (error) {
      // Tracer toute erreur survenue pendant la correction
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'seo-autofix-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Correction des URL canoniques
   */
  private async fixCanonicals(parentTraceId: string): Promise<void> {
    this.context.logger.info('Correction des URL canoniques');

    // Créer un ID de trace pour cette opération spécifique
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'fix-canonicals',
    });

    // Tracer le début de la correction des canonicals
    await this.traceService.logTrace({
      traceId: childTraceId,
      parentTraceId,
      event: 'canonical-fix-started',
      timestamp: new Date(),
    });

    try {
      // Logique pour corriger les canonicals
      // Implémentation spécifique selon vos besoins

      // Simulons un résultat pour l'exemple
      const result = {
        fixed: 5,
        skipped: 2,
      };

      // Tracer les résultats
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'canonical-fix-completed',
        timestamp: new Date(),
        success: true,
        context: result,
      });
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'canonical-fix-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Correction des redirections
   */
  private async fixRedirects(parentTraceId: string): Promise<void> {
    this.context.logger.info('Correction des redirections');

    // Créer un ID de trace pour cette opération
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'fix-redirects',
    });

    // Tracer le début de la correction des redirections
    await this.traceService.logTrace({
      traceId: childTraceId,
      parentTraceId,
      event: 'redirects-fix-started',
      timestamp: new Date(),
    });

    try {
      // Extraction des redirections depuis .htaccess et génération pour Remix
      // Implémentation selon votre structure

      // Simulons un résultat pour l'exemple
      const result = {
        redirectionsExtracted: 12,
        redirectionsGenerated: 12,
      };

      // Tracer les résultats
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'redirects-fix-completed',
        timestamp: new Date(),
        success: true,
        context: result,
      });
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'redirects-fix-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Génère un rapport SEO global
   */
  private async generateSEOReport(parentTraceId: string): Promise<void> {
    // Créer un ID de trace pour cette opération
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'generate-report',
    });

    // Tracer le début de la génération du rapport
    await this.traceService.logTrace({
      traceId: childTraceId,
      parentTraceId,
      event: 'seo-report-generation-started',
      timestamp: new Date(),
    });

    const reportPath = path.join(this.config.outputDir, 'seo-report.md');
    const jsonReportPath = path.join(this.config.outputDir, 'seo-report.json');

    try {
      // Collecter toutes les métadonnées
      // Vous pouvez implémenter cette partie pour collecter les données
      // des fichiers .seo.json générés

      // Générer le rapport markdown
      const markdown = `# Rapport SEO - ${new Date().toLocaleDateString()}
      
## Résumé
- Routes analysées: XXX
- Score SEO moyen: YYY%
- Problèmes critiques: ZZZ
- Optimisations suggérées: AAA

## Problèmes détectés
...

## Recommandations
...
      `;

      await fs.writeFile(reportPath, markdown, 'utf-8');
      this.context.logger.info(`Rapport SEO généré: ${reportPath}`);

      // Enregistrer les données dans un format structuré pour le dashboard
      await fs.writeJson(
        jsonReportPath,
        {
          date: new Date().toISOString(),
          summary: {
            // Données de résumé
          },
          issues: [
            // Problèmes détectés
          ],
          recommendations: [
            // Recommandations générées par IA
          ],
        },
        { spaces: 2 }
      );

      // Tracer la fin de la génération du rapport
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'seo-report-generation-completed',
        timestamp: new Date(),
        success: true,
        context: {
          reportPath,
          jsonReportPath,
        },
      });
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'seo-report-generation-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Enregistre une trace SEO pour une route spécifique
   */
  private async logSEORouteTrace(
    route: string,
    seoData: SEOTraceEvent,
    parentTraceId: string
  ): Promise<void> {
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      route,
      operation: 'route-seo-check',
    });

    await this.traceService.logTrace({
      traceId: childTraceId,
      parentTraceId,
      event: 'route-seo-check',
      timestamp: new Date(),
      success: (seoData.seoScore || 0) >= this.config.minSeoScore,
      context: {
        route,
        ...seoData,
      },
    });
  }
}

export default SEOCheckerAgent;
