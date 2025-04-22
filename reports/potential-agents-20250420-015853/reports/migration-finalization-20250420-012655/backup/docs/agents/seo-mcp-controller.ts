/**
 * seoDoDotmcp-controller.ts
 * 
 * Contrôleur pour orchestrer l'ensemble de l'architecture SEO-MCP
 * Coordonne les différents agents et assure la traçabilité de bout en bout
 */

import { SEOCheckerAgent } from './SeoChecker-agent';
import { MetaGenerator } from './MetaGenerator';
import { CanonicalValidator } from './CanonicalValidator';
import { SEORedirectMapper } from './SeoRedirectMapper';
import { createTraceabilityService, TraceabilityService } from '../utils/traceability/traceability-service';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


interface SEOMCPControllerConfig {
  // Chemin des répertoires de travail
  phpSourceDir: string;
  remixTargetDir: string;
  outputDir: string;
  metaDir: string;
  
  // Options de validation et génération SEO
  baseUrl: string;
  minSeoScore: number;
  autoFix: boolean;
  validateCanonicals: boolean;
  validateRedirects: boolean;
  extractFromPhp: boolean;
  extractFromDb: boolean;
  extractFromHtaccess: boolean;
  
  // Options htaccess
  htaccessPaths: string[];
  remixConfigPath: string;
  nestJSConfigPath?: string;
  
  // Configuration Supabase
  supabaseUrl?: string;
  supabaseKey?: string;
}

interface SEOProcessingResult {
  success: boolean;
  routesProcessed: number;
  routesWithIssues: number;
  routesFixed: number;
  averageSeoScore: number;
  canonicalIssues: number;
  redirects: number;
  meta: {
    generated: number;
    failed: number;
  };
  warnings: string[];
  errors: string[];
}

export class SEOMCPController implements BusinessAgent, BaseAgent, BusinessAgent {
  private traceService: TraceabilityService;
  private seoChecker: SEOCheckerAgent | null = null;
  private metaGenerator: MetaGenerator | null = null;
  private canonicalValidator: CanonicalValidator | null = null;
  private redirectMapper: SEORedirectMapper | null = null;
  
  constructor(private config: SEOMCPControllerConfig) {
    // Initialiser le service de traçabilité
    this.traceService = createTraceabilityService('orchestration', {
      storageStrategy: 'database',
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
      databaseTable: 'seo_migration_status'
    });
    
    // Créer les répertoires nécessaires s'ils n'existent pas
    this.ensureDirectories();
  }
  
  /**
   * Exécute le pipeline complet de SEO-MCP
   */
  async runPipeline(): Promise<SEOProcessingResult> {
    console.log('🚀 Démarrage du pipeline SEO-MCP');
    
    const result: SEOProcessingResult = {
      success: false,
      routesProcessed: 0,
      routesWithIssues: 0,
      routesFixed: 0,
      averageSeoScore: 0,
      canonicalIssues: 0,
      redirects: 0,
      meta: {
        generated: 0,
        failed: 0
      },
      warnings: [],
      errors: []
    };
    
    // Créer un ID de trace pour cette exécution
    const pipelineTraceId = await this.traceService.generateTraceId({
      operation: 'seoDoDotmcp-pipeline',
      timestamp: Date.now().toString()
    });
    
    try {
      // Tracer le début de l'exécution
      await this.traceService.logTrace({
        traceId: pipelineTraceId,
        event: 'seoDoDotmcp-pipeline-started',
        timestamp: new Date(),
        context: {
          config: {
            phpSourceDir: this.config.phpSourceDir,
            remixTargetDir: this.config.remixTargetDir,
            baseUrl: this.config.baseUrl,
            minSeoScore: this.config.minSeoScore
          }
        }
      });
      
      // 1. Mapper les redirections (doit être fait en premier pour maintenir l'historique SEO)
      console.log('📍 Étape 1: Mapper les redirections depuis .htaccess');
      const redirectResult = await this.processRedirects(pipelineTraceId);
      result.redirects = redirectResult.redirectCount;
      
      if (redirectResult.errors.length > 0) {
        result.errors.push(...redirectResult.errors);
        result.warnings.push('⚠️ Des erreurs sont survenues lors du mapping des redirections');
      }
      
      // 2. Générer les métadonnées SEO pour les routes Remix
      console.log('📍 Étape 2: Générer les métadonnées SEO');
      const metaResult = await this.generateMetadata(pipelineTraceId);
      result.meta.generated = metaResult.generated;
      result.meta.failed = metaResult.failed;
      
      if (metaResult.errors.length > 0) {
        result.errors.push(...metaResult.errors);
        result.warnings.push('⚠️ Des erreurs sont survenues lors de la génération des métadonnées');
      }
      
      // 3. Valider les URLs canoniques
      console.log('📍 Étape 3: Valider les URLs canoniques');
      const canonicalResult = await this.validateCanonicals(pipelineTraceId);
      result.canonicalIssues = canonicalResult.issuesFound;
      result.routesFixed += canonicalResult.fixed;
      
      if (canonicalResult.errors.length > 0) {
        result.errors.push(...canonicalResult.errors);
        result.warnings.push('⚠️ Des erreurs sont survenues lors de la validation des canonicals');
      }
      
      // 4. Exécuter la vérification SEO complète
      console.log('📍 Étape 4: Vérification SEO complète');
      const seoCheckResult = await this.runSEOCheck(pipelineTraceId);
      result.routesProcessed = seoCheckResult.processed;
      result.routesWithIssues = seoCheckResult.withIssues;
      result.averageSeoScore = seoCheckResult.averageScore;
      
      if (seoCheckResult.errors.length > 0) {
        result.errors.push(...seoCheckResult.errors);
        result.warnings.push('⚠️ Des erreurs sont survenues lors de la vérification SEO');
      }
      
      // 5. Générer le rapport final
      console.log('📍 Étape 5: Générer le rapport final');
      await this.generateFinalReport(pipelineTraceId, result);
      
      // Déterminer si le pipeline a été exécuté avec succès
      result.success = result.errors.length === 0;
      
      // Tracer la fin de l'exécution
      await this.traceService.logTrace({
        traceId: pipelineTraceId,
        event: 'seoDoDotmcp-pipeline-completed',
        timestamp: new Date(),
        success: result.success,
        context: {
          result: {
            routesProcessed: result.routesProcessed,
            routesWithIssues: result.routesWithIssues,
            routesFixed: result.routesFixed,
            averageSeoScore: result.averageSeoScore,
            warnings: result.warnings.length,
            errors: result.errors.length
          }
        }
      });
      
      console.log(`✅ Pipeline SEO-MCP terminé ${result.success ? 'avec succès' : 'avec des erreurs'}`);
      console.log(`   - Routes traitées: ${result.routesProcessed}`);
      console.log(`   - Score SEO moyen: ${result.averageSeoScore.toFixed(2)}/100`);
      console.log(`   - Redirections configurées: ${result.redirects}`);
      console.log(`   - Fichiers meta.ts générés: ${result.meta.generated}`);
      
      return result;
    } catch (error) {
      // Tracer l'erreur fatale
      await this.traceService.logTrace({
        traceId: pipelineTraceId,
        event: 'seoDoDotmcp-pipeline-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
        context: { 
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      console.error('❌ Erreur fatale dans le pipeline SEO-MCP:', error);
      
      result.success = false;
      result.errors.push(`Erreur fatale: ${error instanceof Error ? error.message : String(error)}`);
      
      return result;
    }
  }
  
  /**
   * Traite les règles de redirection
   */
  private async processRedirects(parentTraceId: string): Promise<{
    redirectCount: number;
    errors: string[];
  }> {
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'process-redirects'
    });
    
    const result = {
      redirectCount: 0,
      errors: [] as string[]
    };
    
    try {
      // Tracer le début de l'opération
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'redirects-processing-started',
        timestamp: new Date()
      });
      
      // Instancier l'agent de mapping des redirections
      const agentContext = {
        logger: console
      };
      
      this.redirectMapper = new SEORedirectMapper({
        htaccessPaths: this.config.htaccessPaths,
        remixConfigPath: this.config.remixConfigPath,
        nestJSConfigPath: this.config.nestJSConfigPath,
        outputJsonPath: path.join(this.config.outputDir, 'redirects.json'),
        validateRedirects: this.config.validateRedirects
      }, agentContext as any);
      
      // Initialiser l'agent
      await this.redirectMapper.initialize();
      
      // Exécuter l'agent
      await this.redirectMapper.run();
      
      // Lire le fichier JSON généré pour compter les redirections
      const redirectsJsonPath = path.join(this.config.outputDir, 'redirects.json');
      if (await fs.pathExists(redirectsJsonPath)) {
        const redirectsData = await fs.readJson(redirectsJsonPath);
        result.redirectCount = redirectsData.count || 0;
      }
      
      // Tracer le résultat
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'redirects-processing-completed',
        timestamp: new Date(),
        success: true,
        context: {
          redirectCount: result.redirectCount,
          remixConfigPath: this.config.remixConfigPath,
          nestJSConfigPath: this.config.nestJSConfigPath
        }
      });
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'redirects-processing-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      result.errors.push(`Erreur lors du traitement des redirections: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return result;

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';
  }
  
  /**
   * Génère les métadonnées SEO pour les routes Remix
   */
  private async generateMetadata(parentTraceId: string): Promise<{
    generated: number;
    failed: number;
    errors: string[];
  }> {
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'generate-metadata'
    });
    
    const result = {
      generated: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    try {
      // Tracer le début de l'opération
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'metadata-generation-started',
        timestamp: new Date()
      });
      
      // Instancier le générateur de métadonnées
      this.metaGenerator = new MetaGenerator({
        phpSourceDir: this.config.phpSourceDir,
        remixTargetDir: this.config.remixTargetDir,
        outputDir: this.config.metaDir,
        extractFromPhp: this.config.extractFromPhp,
        extractFromDb: this.config.extractFromDb,
        extractFromHtaccess: this.config.extractFromHtaccess,
        enableTracing: true,
        dbConfig: {
          supabaseUrl: this.config.supabaseUrl,
          supabaseKey: this.config.supabaseKey
        }
      });
      
      // Trouver toutes les routes Remix
      const routeFiles = await this.findRemixRouteFiles();
      
      if (routeFiles.length === 0) {
        result.errors.push('Aucun fichier de route Remix trouvé');
        throw new Error('Aucun fichier de route Remix trouvé');
      }
      
      // Générer les métadonnées pour chaque route
      for (const routeFile of routeFiles) {
        try {
          // Extraire le nom de la route à partir du chemin du fichier
          const relativePath = path.relative(this.config.remixTargetDir, routeFile);
          const routePath = relativePath.replace(/\.tsx$/, '');
          
          // Générer les métadonnées pour cette route
          const genResult = await this.metaGenerator.generateMetaForRoute(routePath);
          
          if (genResult.success) {
            result.generated++;
          } else {
            result.failed++;
            result.errors.push(`Échec pour la route ${routePath}: ${genResult.messages.join(', ')}`);
          }
        } catch (routeError) {
          result.failed++;
          result.errors.push(`Erreur lors du traitement de la route ${routeFile}: ${routeError instanceof Error ? routeError.message : String(routeError)}`);
        }
      }
      
      // Limiter le nombre d'erreurs dans le résultat
      if (result.errors.length > 10) {
        const remainingErrors = result.errors.length - 10;
        result.errors = result.errors.slice(0, 10);
        result.errors.push(`... et ${remainingErrors} autres erreurs`);
      }
      
      // Tracer le résultat
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'metadata-generation-completed',
        timestamp: new Date(),
        success: result.failed === 0,
        context: {
          generated: result.generated,
          failed: result.failed,
          routesFound: routeFiles.length
        }
      });
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'metadata-generation-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      result.errors.push(`Erreur lors de la génération des métadonnées: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return result;
  }
  
  /**
   * Valide les URLs canoniques des routes
   */
  private async validateCanonicals(parentTraceId: string): Promise<{
    issuesFound: number;
    fixed: number;
    errors: string[];
  }> {
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'validate-canonicals'
    });
    
    const result = {
      issuesFound: 0,
      fixed: 0,
      errors: [] as string[]
    };
    
    try {
      // Tracer le début de l'opération
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'canonicals-validation-started',
        timestamp: new Date()
      });
      
      // Instancier le validateur de canonicals
      this.canonicalValidator = new CanonicalValidator({
        remixDir: this.config.remixTargetDir,
        metaDir: this.config.metaDir,
        outputDir: this.config.outputDir,
        baseUrl: this.config.baseUrl,
        strictValidation: this.config.minSeoScore >= 80, // Validation stricte si le score minimal est élevé
        autoFix: this.config.autoFix,
        enableTracing: true,
        supabaseUrl: this.config.supabaseUrl,
        supabaseKey: this.config.supabaseKey
      });
      
      // Trouver toutes les routes Remix
      const routeFiles = await this.findRemixRouteFiles();
      
      // Valider les canonicals pour chaque route
      for (const routeFile of routeFiles) {
        try {
          // Extraire le nom de la route à partir du chemin du fichier
          const relativePath = path.relative(this.config.remixTargetDir, routeFile);
          const routePath = relativePath.replace(/\.tsx$/, '');
          
          // Valider les canonicals pour cette route
          const valResult = await this.canonicalValidator.validateRoute(routePath);
          
          if (valResult.issues.length > 0) {
            result.issuesFound += valResult.issues.length;
            result.fixed += valResult.fixed;
            
            // Ajouter les problèmes non résolus au rapport
            if (valResult.issues.length > valResult.fixed) {
              const unfixed = valResult.issues.filter(issue => !issue.fixed);
              for (const issue of unfixed) {
                result.errors.push(`Canonical non corrigé pour ${routePath}: ${issue.issueType} (${issue.expectedCanonical})`);
              }
            }
          }
        } catch (routeError) {
          result.errors.push(`Erreur lors de la validation du canonical pour ${routeFile}: ${routeError instanceof Error ? routeError.message : String(routeError)}`);
        }
      }
      
      // Limiter le nombre d'erreurs dans le résultat
      if (result.errors.length > 10) {
        const remainingErrors = result.errors.length - 10;
        result.errors = result.errors.slice(0, 10);
        result.errors.push(`... et ${remainingErrors} autres erreurs`);
      }
      
      // Tracer le résultat
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'canonicals-validation-completed',
        timestamp: new Date(),
        success: result.issuesFound === 0 || result.fixed === result.issuesFound,
        context: {
          issuesFound: result.issuesFound,
          fixed: result.fixed,
          routesChecked: routeFiles.length
        }
      });
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'canonicals-validation-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      result.errors.push(`Erreur lors de la validation des canonicals: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return result;
  }
  
  /**
   * Exécute la vérification SEO complète
   */
  private async runSEOCheck(parentTraceId: string): Promise<{
    processed: number;
    withIssues: number;
    averageScore: number;
    errors: string[];
  }> {
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'seo-check'
    });
    
    const result = {
      processed: 0,
      withIssues: 0,
      averageScore: 0,
      errors: [] as string[]
    };
    
    try {
      // Tracer le début de l'opération
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'seo-check-started',
        timestamp: new Date()
      });
      
      // Instancier l'agent SEO Checker
      const agentContext = {
        logger: console
      };
      
      this.seoChecker = new SEOCheckerAgent({
        phpDir: this.config.phpSourceDir,
        remixDir: this.config.remixTargetDir,
        outputDir: this.config.outputDir,
        minSeoScore: this.config.minSeoScore,
        validateCanonicals: this.config.validateCanonicals,
        validateRedirects: this.config.validateRedirects,
        runLighthouse: true,
        autoFix: this.config.autoFix,
        supabaseUrl: this.config.supabaseUrl,
        supabaseKey: this.config.supabaseKey
      }, agentContext as any);
      
      // Initialiser l'agent
      await this.seoChecker.initialize();
      
      // Exécuter l'agent
      await this.seoChecker.run();
      
      // Lire le rapport SEO généré
      const seoReportPath = path.join(this.config.outputDir, 'seo-report.json');
      if (await fs.pathExists(seoReportPath)) {
        const seoReport = await fs.readJson(seoReportPath);
        
        if (seoReport.summary) {
          result.processed = seoReport.summary.processed || 0;
          result.withIssues = seoReport.summary.withIssues || 0;
          result.averageScore = seoReport.summary.averageScore || 0;
        }
        
        if (seoReport.issues && Array.isArray(seoReport.issues)) {
          // Limiter à 10 erreurs pour ne pas surcharger le rapport
          for (let i = 0; i < Math.min(10, seoReport.issues.length); i++) {
            const issue = seoReport.issues[i];
            result.errors.push(`Problème SEO: ${issue.message} (score: ${issue.score}, route: ${issue.route})`);
          }
          
          if (seoReport.issues.length > 10) {
            result.errors.push(`... et ${seoReport.issues.length - 10} autres problèmes`);
          }
        }
      }
      
      // Tracer le résultat
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'seo-check-completed',
        timestamp: new Date(),
        success: result.averageScore >= this.config.minSeoScore,
        context: {
          processed: result.processed,
          withIssues: result.withIssues,
          averageScore: result.averageScore,
          minRequiredScore: this.config.minSeoScore
        }
      });
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'seo-check-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      result.errors.push(`Erreur lors de la vérification SEO: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return result;
  }
  
  /**
   * Génère le rapport final du pipeline SEO-MCP
   */
  private async generateFinalReport(parentTraceId: string, data: SEOProcessingResult): Promise<void> {
    const { childTraceId } = await this.traceService.createChildTraceId(parentTraceId, {
      operation: 'generate-final-report'
    });
    
    try {
      // Tracer le début de l'opération
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'final-report-generation-started',
        timestamp: new Date()
      });
      
      // Générer le rapport au format JSON
      const jsonReport = {
        timestamp: new Date().toISOString(),
        success: data.success,
        summary: {
          routesProcessed: data.routesProcessed,
          routesWithIssues: data.routesWithIssues,
          routesFixed: data.routesFixed,
          averageSeoScore: data.averageSeoScore,
          canonicalIssues: data.canonicalIssues,
          redirects: data.redirects,
          meta: data.meta
        },
        warnings: data.warnings,
        errors: data.errors
      };
      
      // Enregistrer le rapport JSON
      const jsonReportPath = path.join(this.config.outputDir, 'seoDoDotmcp-report.json');
      await fs.writeJson(jsonReportPath, jsonReport, { spaces: 2 });
      
      // Générer le rapport au format Markdown
      const markdownReport = `# Rapport SEO-MCP
      
Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

## Résumé

- **Statut**: ${data.success ? '✅ Succès' : '❌ Échec'}
- **Routes traitées**: ${data.routesProcessed}
- **Score SEO moyen**: ${data.averageSeoScore.toFixed(2)}/100 (minimum requis: ${this.config.minSeoScore})
- **Problèmes détectés**: ${data.routesWithIssues}
- **Problèmes corrigés**: ${data.routesFixed}
- **Problèmes de canonicals**: ${data.canonicalIssues}
- **Redirections configurées**: ${data.redirects}
- **Fichiers meta.ts générés**: ${data.meta.generated}
- **Échecs de génération meta.ts**: ${data.meta.failed}

## Avertissements

${data.warnings.length > 0 ? data.warnings.map(w => `- ${w}`).join('\n') : '- Aucun avertissement'}

## Erreurs

${data.errors.length > 0 ? data.errors.map(e => `- ${e}`).join('\n') : '- Aucune erreur'}

## Prochaines étapes

${data.success ? 
  '1. Vérifier les métriques SEO dans Google Search Console\n2. Surveiller les performances de pages migrées\n3. Analyser l\'impact des redirections sur le trafic' :
  '1. Corriger les erreurs mentionnées ci-dessus\n2. Relancer le pipeline SEO-MCP\n3. Vérifier les pages avec un score SEO faible'}

*Ce rapport a été généré automatiquement par le pipeline SEO-MCP.*
`;
      
      // Enregistrer le rapport Markdown
      const mdReportPath = path.join(this.config.outputDir, 'seoDoDotmcp-report.md');
      await fs.writeFile(mdReportPath, markdownReport, 'utf-8');
      
      // Tracer le résultat
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'final-report-generation-completed',
        timestamp: new Date(),
        success: true,
        context: {
          jsonReportPath,
          mdReportPath
        }
      });
      
      console.log(`📊 Rapport final généré: ${mdReportPath}`);
    } catch (error) {
      // Tracer l'erreur
      await this.traceService.logTrace({
        traceId: childTraceId,
        parentTraceId,
        event: 'final-report-generation-error',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.error('Erreur lors de la génération du rapport final:', error);
    }
  }
  
  /**
   * Trouve tous les fichiers de routes Remix
   */
  private async findRemixRouteFiles(): Promise<string[]> {
    try {
      const pattern = path.join(this.config.remixTargetDir, '**/*.tsx');
      const files = await fs.glob(pattern);
      
      // Filtrer pour ne garder que les fichiers de routes (pas les fichiers meta.ts, etc.)
      return files.filter(file => {
        const basename = path.basename(file);
        return !basename.includes('.meta.') && 
               !basename.includes('.loader.') && 
               !basename.includes('.action.');
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des fichiers de routes Remix:', error);
      return [];
    }
  }
  
  /**
   * Assure que tous les répertoires nécessaires existent
   */
  private ensureDirectories(): void {
    try {
      fs.ensureDirSync(this.config.outputDir);
      fs.ensureDirSync(this.config.metaDir);
    } catch (error) {
      console.error('Erreur lors de la création des répertoires:', error);
    }
  }
}

/**
 * Fonction utilitaire pour créer une instance du contrôleur SEO-MCP
 */
export function createSEOMCPController(config: SEOMCPControllerConfig): SEOMCPController {
  return new SEOMCPController(config);
}