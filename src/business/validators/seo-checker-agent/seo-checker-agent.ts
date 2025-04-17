import { AbstractValidatorAgent } from '../abstract-validator';
/**
 * SEOCheckerAgent - Agent standardisé de validation SEO
 * 
 * Vérifie, valide et corrige les métadonnées SEO pour les sites Remix migrés depuis PHP
 */

import { AgentContext, AgentMetadata } from '../core/interfaces';
import { BaseValidatorAgent, ValidatorAgentConfig, ValidationResult } from './base-validator-agent';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

// Importation de la classe utilitaire SEOChecker
import { SEOChecker } from '../core/seo/seo-checker';

// Configuration spécifique à l'agent SEO
export interface SEOCheckerConfig extends ValidatorAgentConfig {
  // Répertoires source et cible
  phpDir: string;
  remixDir: string;
  outputDir: string;
  // Options de validation
  validateCanonicals?: boolean;
  validateRedirects?: boolean;
  validateMetaTags?: boolean;
  validateSitemap?: boolean;
  validateRobotsTxt?: boolean;
  runLighthouse?: boolean;
}

/**
 * Agent de validation SEO standardisé
 */
export class SEOCheckerAgent extends AbstractValidatorAgent<any, any> extends BaseValidatorAgent {
  private seoChecker: SEOChecker;
  
  /**
   * Métadonnées de l'agent selon le standard MCP
   */
  readonly metadata: AgentMetadata = {
    id: 'seo-checker-agent',
    name: 'SEO Checker Agent',
    description: 'Vérifie, valide et corrige les métadonnées SEO des routes Remix',
    version: '2.0.0',
    type: 'validator',
    author: 'Équipe MCP',
    tags: ['seo', 'remix', 'metadata', 'canonical', 'redirects']
  };
  
  constructor(config: SEOCheckerConfig) {
    // Initialiser la classe parente avec la configuration
    super(config);
    
    // Configuration d'autofixes activée par défaut si non spécifiée
    if (this.config.autofixEnabled === undefined) {
      this.config.autofixEnabled = true;
    }
    
    // Initialiser le checker SEO
    this.seoChecker = new SEOChecker({
      phpDir: config.phpDir,
      remixDir: config.remixDir,
      outputDir: config.outputDir,
      useDatabase: true, // Utiliser la base de données pour le suivi
    });
  }
  
  /**
   * Initialise l'agent et vérifie les dépendances
   */
  protected async initializeInternal(): Promise<void> {
  protected async cleanupInternal(): Promise<void> {
    // Nettoyage des ressources
  }

    // Initialiser la classe parente
    await super.initialize();
    
    this.log('info', 'Initialisation du SEO Checker Agent');
    
    // S'assurer que le répertoire de sortie existe
    await fs.ensureDir(this.config.outputDir);
    
    // Vérifier que tous les outils requis sont installés
    if (this.config.runLighthouse) {
      try {
        execSync('lighthouse --version', { stdio: 'ignore' });
      } catch (error) {
        this.log('warn', 'Lighthouse n\'est pas installé. Installation en cours...');
        execSync('npm install -g lighthouse', { stdio: 'inherit' });
      }
    }
  }
  
  /**
   * Implémentation de la méthode de validation requise par BaseValidatorAgent
   */
  protected async performValidation(context: AgentContext): Promise<ValidationResult> {
    this.log('info', 'Démarrage de la vérification SEO');
    
    // Initialiser le résultat de validation
    const validationResult: ValidationResult = {
      valid: false,
      violations: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        score: 0
      }
    };
    
    try {
      // Traiter tous les fichiers PHP et générer les métadonnées Remix
      const checkResult = await this.seoChecker.checkDirectory();
      
      // Ajouter les résultats de l'analyse à notre format standardisé
      validationResult.summary.totalChecks = checkResult.total || 0;
      validationResult.summary.passedChecks = checkResult.success || 0;
      validationResult.summary.failedChecks = checkResult.failed || 0;
      
      // Mettre à jour le score
      const avgScore = checkResult.averageScore || 0;
      validationResult.summary.score = avgScore;
      
      // Vérifier si on atteint le score minimal
      const minScoreThreshold = (this.config as SEOCheckerConfig).minScoreThreshold || 80;
      validationResult.valid = avgScore >= minScoreThreshold;
      
      // Ajouter les vérifications spécifiques selon la configuration
      await this.addSpecificValidations(validationResult);
      
      // Log des résultats
      this.log('info', `Validation SEO terminée: Score ${avgScore}/100, ${validationResult.violations.length} violations`);
      
      // Générer le rapport détaillé
      await this.generateSEOReport(checkResult, validationResult);
      
    } catch (error) {
      this.log('error', `Erreur lors de la validation SEO: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
    
    return validationResult;
  }
  
  /**
   * Correction automatique des problèmes SEO courants
   */
  protected async applyAutofixes(result: ValidationResult, context: AgentContext): Promise<void> {
    this.log('info', 'Lancement de la correction automatique des problèmes SEO');
    
    // Garder trace des fixes appliqués
    result.fixesApplied = {};
    let fixCount = 0;
    
    // Vérifier les canonicals manquants ou incorrects
    if ((this.config as SEOCheckerConfig).validateCanonicals) {
      const canonicalFixes = await this.fixCanonicals();
      result.fixesApplied.canonicals = canonicalFixes;
      fixCount += canonicalFixes.length;
      
      // Mettre à jour les violations qui ont été corrigées
      canonicalFixes.forEach(fix => {
        const index = result.violations.findIndex(v => 
          v.rule === 'canonical-url' && 
          v.location?.file === fix.file
        );
        
        if (index !== -1) {
          result.violations[index].autoFixed = true;
        }
      });
    }
    
    // Vérifier les redirections
    if ((this.config as SEOCheckerConfig).validateRedirects) {
      const redirectFixes = await this.fixRedirects();
      result.fixesApplied.redirects = redirectFixes;
      fixCount += redirectFixes.length;
      
      // Mettre à jour les violations qui ont été corrigées
      redirectFixes.forEach(fix => {
        const index = result.violations.findIndex(v => 
          v.rule === 'redirect-rule' && 
          v.location?.file === fix.file
        );
        
        if (index !== -1) {
          result.violations[index].autoFixed = true;
        }
      });
    }
    
    this.log('info', `${fixCount} problèmes SEO corrigés automatiquement`);
  }
  
  /**
   * Ajoute des validations spécifiques selon la configuration
   */
  private async addSpecificValidations(result: ValidationResult): Promise<void> {
    const config = this.config as SEOCheckerConfig;
    
    // Vérification des canonicals
    if (config.validateCanonicals) {
      const canonicalIssues = await this.seoChecker.validateCanonicals();
      canonicalIssues.forEach(issue => {
        result.violations.push({
          rule: 'canonical-url',
          severity: issue.severity as any || 'warning',
          message: issue.message,
          location: { file: issue.file, line: issue.line },
          autoFixable: issue.autoFixable || false,
          suggestedFix: issue.suggestion
        });
      });
    }
    
    // Vérification des redirections
    if (config.validateRedirects) {
      const redirectIssues = await this.seoChecker.validateRedirects();
      redirectIssues.forEach(issue => {
        result.violations.push({
          rule: 'redirect-rule',
          severity: issue.severity as any || 'warning',
          message: issue.message,
          location: { file: issue.file, line: issue.line },
          autoFixable: issue.autoFixable || false,
          suggestedFix: issue.suggestion
        });
      });
    }
    
    // Vérification des balises meta
    if (config.validateMetaTags) {
      const metaIssues = await this.seoChecker.validateMetaTags();
      metaIssues.forEach(issue => {
        result.violations.push({
          rule: 'meta-tags',
          severity: issue.severity as any || 'warning',
          message: issue.message,
          location: { file: issue.file, line: issue.line },
          autoFixable: issue.autoFixable || false,
          suggestedFix: issue.suggestion
        });
      });
    }
  }
  
  /**
   * Correction des URL canoniques
   */
  private async fixCanonicals(): Promise<Array<{file: string, fixed: string, original: string}>> {
    this.log('info', 'Correction des URL canoniques');
    
    try {
      // Logique pour corriger les canonicals
      // Retourne la liste des fichiers corrigés
      return await this.seoChecker.fixCanonicals();
    } catch (error) {
      this.log('error', `Erreur lors de la correction des canonicals: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Correction des redirections
   */
  private async fixRedirects(): Promise<Array<{file: string, fixed: string, original: string}>> {
    this.log('info', 'Correction des redirections');
    
    try {
      // Extraction des redirections depuis .htaccess et génération pour Remix
      return await this.seoChecker.fixRedirects();
    } catch (error) {
      this.log('error', `Erreur lors de la correction des redirections: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Génère un rapport SEO global
   */
  private async generateSEOReport(checkResult: any, validationResult: ValidationResult): Promise<void> {
    const reportPath = path.join((this.config as SEOCheckerConfig).outputDir, 'seo-report.md');
    const jsonReportPath = path.join((this.config as SEOCheckerConfig).outputDir, 'seo-report.json');
    
    // Générer le rapport markdown
    const markdown = `# Rapport SEO - ${new Date().toLocaleDateString()}
    
## Résumé
- Routes analysées: ${checkResult.processed || 0}
- Score SEO moyen: ${checkResult.averageScore || 0}%
- Problèmes critiques: ${validationResult.violations.filter(v => v.severity === 'critical').length}
- Problèmes d'erreur: ${validationResult.violations.filter(v => v.severity === 'error').length}
- Avertissements: ${validationResult.violations.filter(v => v.severity === 'warning').length}

## Problèmes détectés
${validationResult.violations.map(v => `- ${v.severity.toUpperCase()}: ${v.message} ${v.location?.file ? `(${v.location.file}:${v.location.line || 1})` : ''}`).join('\n')}

## Recommandations
${validationResult.violations.filter(v => v.suggestedFix).map(v => `- ${v.message}: ${v.suggestedFix}`).join('\n')}
    `;
    
    await fs.writeFile(reportPath, markdown, 'utf-8');
    this.log('info', `Rapport SEO généré: ${reportPath}`);
    
    // Enregistrer les données dans un format structuré pour le dashboard
    await fs.writeJson(jsonReportPath, {
      date: new Date().toISOString(),
      summary: {
        routesAnalyzed: checkResult.processed,
        averageScore: checkResult.averageScore,
        criticalIssues: validationResult.violations.filter(v => v.severity === 'critical').length,
        errorIssues: validationResult.violations.filter(v => v.severity === 'error').length,
        warningIssues: validationResult.violations.filter(v => v.severity === 'warning').length,
      },
      issues: validationResult.violations.map(v => ({
        rule: v.rule,
        severity: v.severity,
        message: v.message,
        location: v.location,
        autoFixed: v.autoFixed || false,
      })),
      recommendations: validationResult.violations
        .filter(v => v.suggestedFix)
        .map(v => ({
          issue: v.message,
          suggestion: v.suggestedFix
        }))
    }, { spaces: 2 });
  }
}