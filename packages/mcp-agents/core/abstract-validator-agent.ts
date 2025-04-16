/**
 * Classe abstraite pour les agents de validation
 * Ces agents valident des fichiers, configurations ou données selon des règles
 * Date: 16 avril 2025
 */

import { MCPAgent, AgentContext, AgentResult } from './mcp-agent';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '../utils/logger';

/**
 * Configuration spécifique aux agents de validation
 */
export interface ValidatorConfig {
  inputPath?: string;           // Chemin du fichier ou répertoire à valider
  outputDir: string;            // Répertoire de sortie pour les rapports
  rules?: string[];            // Chemins des règles personnalisées
  rulesets?: string[];         // Noms des ensembles de règles prédéfinis
  threshold?: number;          // Seuil de score pour considérer la validation comme réussie (0-100)
  generateReport?: boolean;    // Indique si un rapport doit être généré
  reportFormat?: 'json' | 'md' | 'html' | 'csv'; // Format de sortie des rapports
  reportName?: string;         // Nom du rapport
  strict?: boolean;            // Mode strict (toute violation est une erreur)
  autoFix?: boolean;           // Correction automatique des violations lorsque possible
  verbose?: boolean;           // Mode verbeux
  excludePatterns?: string[];  // Patterns à exclure
  includePatterns?: string[];  // Patterns à inclure
}

/**
 * Règle de validation avec sa fonction de vérification
 */
export interface ValidationRule {
  id: string;                  // Identifiant unique de la règle
  name: string;                // Nom descriptif de la règle
  description: string;         // Description détaillée
  category: string;            // Catégorie de la règle (ex: 'security', 'style', etc.)
  severity: 'info' | 'warning' | 'error' | 'critical'; // Niveau de sévérité
  validate: (input: any, context?: any) => Promise<ValidationResult> | ValidationResult; // Fonction de validation
  fix?: (input: any, context?: any) => Promise<any> | any; // Fonction de correction automatique (optionnelle)
  enabled?: boolean;           // Indique si la règle est activée (défaut: true)
}

/**
 * Violation d'une règle de validation
 */
export interface ValidationViolation {
  ruleId: string;              // ID de la règle violée
  message: string;             // Message décrivant la violation
  severity: 'info' | 'warning' | 'error' | 'critical'; // Niveau de sévérité
  location?: {                 // Localisation de la violation
    file?: string;             // Fichier concerné
    line?: number;             // Numéro de ligne
    column?: number;           // Numéro de colonne
    path?: string;             // Chemin dans la structure (pour données hiérarchiques)
  };
  context?: any;               // Contexte supplémentaire de la violation
  fix?: string;                // Suggestion ou description de correction
  autoFixable?: boolean;       // Indique si la violation peut être corrigée automatiquement
}

/**
 * Résultat de validation
 */
export interface ValidationResult {
  valid: boolean;              // Indique si la validation est réussie
  score: number;               // Score de qualité (0-100)
  violations: ValidationViolation[]; // Liste des violations détectées
  stats: {                     // Statistiques de validation
    totalChecks: number;       // Nombre total de vérifications effectuées
    passedChecks: number;      // Nombre de vérifications réussies
    failedChecks: number;      // Nombre de vérifications échouées
    errorCount: number;        // Nombre d'erreurs
    warningCount: number;      // Nombre d'avertissements
    infoCount: number;         // Nombre d'informations
    criticalCount: number;     // Nombre de problèmes critiques
  };
  timestamp: string;           // Horodatage de la validation
  executionTimeMs: number;     // Temps d'exécution en millisecondes
  autoFixableCount?: number;   // Nombre de problèmes corrigeables automatiquement
  fixedCount?: number;         // Nombre de problèmes corrigés automatiquement
}

/**
 * Statut de santé de l'agent
 */
export enum AgentHealthState {
  HEALTHY = 'healthy',        // Agent en bon état
  DEGRADED = 'degraded',      // Agent fonctionnel mais avec des problèmes
  ERROR = 'error',            // Agent en erreur
  STARTING = 'starting',      // Agent en cours de démarrage
  STOPPED = 'stopped'         // Agent arrêté
}

/**
 * Statut de l'agent
 */
export interface AgentStatus {
  health: AgentHealthState;    // État de santé
  lastRun?: Date;              // Dernière exécution
  lastRunDuration?: number;    // Durée de la dernière exécution en ms
  successCount?: number;       // Nombre de validations réussies
  failureCount?: number;       // Nombre de validations échouées
}

/**
 * Classe abstraite pour les agents de validation
 */
export abstract class AbstractValidatorAgent<TConfig extends ValidatorConfig = ValidatorConfig> {
  // Propriétés d'identité de l'agent
  public abstract id: string;
  public abstract name: string;
  public abstract version: string;
  public abstract description: string;
  
  // Chemin et contenu du fichier ou des données à valider
  public filePath?: string;
  public fileContent?: string;
  
  // Configuration du validateur
  public config: TConfig;
  
  // Règles de validation utilisées par l'agent
  public rules: ValidationRule[] = [];
  
  // Résultat de la dernière validation
  public validationResult?: ValidationResult;
  
  // Erreurs, avertissements et artefacts
  public errors: Error[] = [];
  public warnings: string[] = [];
  public artifacts: string[] = [];
  
  // Logger pour l'agent
  protected logger: Logger;
  
  // État de santé de l'agent
  private _status: AgentStatus = {
    health: AgentHealthState.STOPPED,
    successCount: 0,
    failureCount: 0
  };
  
  /**
   * Constructeur
   * @param config Configuration du validateur
   */
  constructor(config: Partial<TConfig>) {
    // Initialiser la configuration avec les valeurs par défaut et celles fournies
    this.config = {
      outputDir: './output',
      threshold: 70,
      generateReport: true,
      reportFormat: 'md',
      strict: false,
      autoFix: false,
      verbose: false
    } as unknown as TConfig;
    
    // Fusionner avec la configuration fournie
    Object.assign(this.config, config);
    
    // Créer un logger pour cet agent
    this.logger = new Logger(this.constructor.name, {
      outputToFile: true,
      logFilePath: path.join(this.config.outputDir, `${this.constructor.name}.log`),
      verbose: this.config.verbose
    });
  }
  
  /**
   * Initialise l'agent avec ses dépendances et configuration
   */
  public async initialize(context: AgentContext): Promise<void> {
    this._status.health = AgentHealthState.STARTING;
    this.logger.info(`Initialisation de l'agent ${this.name}`);
    
    // Mise à jour de la configuration à partir du contexte
    const contextConfig = context.getConfig<Partial<TConfig>>();
    Object.assign(this.config, contextConfig);
    
    // Créer le répertoire de sortie s'il n'existe pas
    if (this.config.outputDir) {
      await fs.ensureDir(this.config.outputDir);
    }
    
    // Charger le fichier ou les données si un chemin est fourni
    if (this.config.inputPath && !this.fileContent) {
      await this.loadData(this.config.inputPath);
    }
    
    // Charger les règles de validation par défaut
    await this.loadDefaultRules();
    
    // Charger les règles personnalisées si spécifiées
    if (this.config.rules && this.config.rules.length > 0) {
      await this.loadCustomRules(this.config.rules);
    }
    
    // Charger les ensembles de règles prédéfinis si spécifiés
    if (this.config.rulesets && this.config.rulesets.length > 0) {
      await this.loadRulesets(this.config.rulesets);
    }
    
    this._status.health = AgentHealthState.HEALTHY;
    this.logger.info(`Agent ${this.name} (v${this.version}) initialisé avec ${this.rules.length} règles`);
  }
  
  /**
   * Exécute la validation
   */
  public async execute(context: AgentContext): Promise<void> {
    this.logger.info(`Exécution de la validation avec l'agent ${this.name} v${this.version}`);
    
    const startTime = Date.now();
    this._status.lastRun = new Date();
    this._status.health = AgentHealthState.HEALTHY;
    
    try {
      // Initialiser les compteurs de statistiques
      const stats = {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        criticalCount: 0
      };
      
      // Liste des violations détectées
      const violations: ValidationViolation[] = [];
      
      // Appliquer chaque règle active
      for (const rule of this.rules.filter(r => r.enabled !== false)) {
        this.logger.debug(`Application de la règle: ${rule.id} - ${rule.name}`);
        
        try {
          // Incrémenter le nombre total de vérifications
          stats.totalChecks++;
          
          // Exécuter la validation
          const input = this.fileContent || this.filePath;
          const ruleResult = await rule.validate(input, { agent: this });
          
          // Fusionner les violations
          if (ruleResult && ruleResult.violations) {
            violations.push(...ruleResult.violations);
            
            // Mettre à jour les compteurs selon la sévérité
            for (const violation of ruleResult.violations) {
              switch (violation.severity) {
                case 'info':
                  stats.infoCount++;
                  break;
                case 'warning':
                  stats.warningCount++;
                  break;
                case 'error':
                  stats.errorCount++;
                  break;
                case 'critical':
                  stats.criticalCount++;
                  break;
              }
            }
            
            // Incrémenter le compteur de vérifications échouées
            if (ruleResult.violations.length > 0) {
              stats.failedChecks++;
            } else {
              stats.passedChecks++;
            }
          } else {
            // Si pas de violations, considérer comme une vérification réussie
            stats.passedChecks++;
          }
        } catch (error: any) {
          // En cas d'erreur dans l'application de la règle
          this.logger.error(`Erreur lors de l'application de la règle ${rule.id}: ${error.message}`);
          this.errors.push(error instanceof Error ? error : new Error(`Erreur règle ${rule.id}: ${error}`));
          
          // Incrémenter le compteur de vérifications échouées
          stats.failedChecks++;
        }
      }
      
      // Calculer le score
      const score = this.calculateScore(stats);
      
      // Déterminer si la validation est réussie selon le seuil
      const isValid = score >= (this.config.threshold || 70);
      
      // Créer le résultat de validation
      this.validationResult = {
        valid: isValid,
        score,
        violations,
        stats,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime
      };
      
      // Tentative de correction automatique si activée
      if (this.config.autoFix && violations.some(v => v.autoFixable)) {
        await this.applyAutoFix(violations);
      }
      
      // Générer le rapport si configuré
      if (this.config.generateReport) {
        const reportPath = await this.generateReport();
        if (reportPath) {
          this.artifacts.push(reportPath);
        }
      }
      
      // Mettre à jour le statut
      this._status.lastRunDuration = Date.now() - startTime;
      
      if (isValid) {
        this._status.successCount = (this._status.successCount || 0) + 1;
        this.logger.info(`Validation réussie avec un score de ${score}%`);
      } else {
        this._status.failureCount = (this._status.failureCount || 0) + 1;
        this._status.health = AgentHealthState.DEGRADED;
        this.logger.warn(`Validation échouée avec un score de ${score}% (seuil: ${this.config.threshold}%)`);
      }
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      this._status.lastRunDuration = Date.now() - startTime;
      this._status.failureCount = (this._status.failureCount || 0) + 1;
      this._status.health = AgentHealthState.ERROR;
      
      this.errors.push(errorObj);
      this.logger.error(`Erreur lors de la validation: ${errorObj.message}`);
    }
  }
  
  /**
   * Applique une correction automatique aux violations qui le permettent
   * @param violations Liste des violations à corriger
   */
  private async applyAutoFix(violations: ValidationViolation[]): Promise<void> {
    const autoFixableViolations = violations.filter(v => v.autoFixable);
    
    if (autoFixableViolations.length === 0) {
      return;
    }
    
    this.logger.info(`Tentative de correction automatique pour ${autoFixableViolations.length} violations`);
    
    let fixedCount = 0;
    
    for (const violation of autoFixableViolations) {
      try {
        // Trouver la règle correspondant à la violation
        const rule = this.rules.find(r => r.id === violation.ruleId);
        
        if (rule && rule.fix) {
          const input = this.fileContent || this.filePath;
          const fixedData = await rule.fix(input, { violation, agent: this });
          
          // Si la correction a produit du contenu, le sauvegarder
          if (typeof fixedData === 'string' && this.fileContent) {
            this.fileContent = fixedData;
            
            // Si un chemin de fichier est défini, enregistrer les modifications
            if (this.filePath) {
              await fs.writeFile(this.filePath, fixedData);
              this.logger.info(`Correction appliquée et sauvegardée dans ${this.filePath}`);
            }
            
            fixedCount++;
          }
        }
      } catch (error: any) {
        this.logger.error(`Erreur lors de la correction automatique: ${error.message}`);
      }
    }
    
    if (this.validationResult) {
      this.validationResult.autoFixableCount = autoFixableViolations.length;
      this.validationResult.fixedCount = fixedCount;
    }
    
    this.logger.info(`${fixedCount}/${autoFixableViolations.length} violations corrigées automatiquement`);
  }
  
  /**
   * Calcule le score de validation (0-100)
   * @param stats Statistiques de validation
   */
  protected calculateScore(stats: ValidationResult['stats']): number {
    // Poids par sévérité
    const weights = {
      info: 0,
      warning: 1,
      error: 5,
      critical: 20
    };
    
    // Calculer le score basé sur les violations
    const weightedViolations = 
      stats.infoCount * weights.info +
      stats.warningCount * weights.warning +
      stats.errorCount * weights.error +
      stats.criticalCount * weights.critical;
    
    // Le score maximum possible est le nombre total de vérifications multiplié par le poids maximum
    const maxScore = stats.totalChecks * weights.critical;
    
    // Le score est le pourcentage de points non perdus
    const score = maxScore === 0 ? 100 : 100 - (weightedViolations * 100 / maxScore);
    
    // Assurer que le score est entre 0 et 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Génère un rapport de validation
   * @returns Chemin du rapport généré
   */
  protected async generateReport(): Promise<string | undefined> {
    if (!this.validationResult || this.config.generateReport === false) {
      return undefined;
    }
    
    try {
      // Créer le répertoire de sortie s'il n'existe pas
      await fs.ensureDir(this.config.outputDir);
      
      // Déterminer le nom du fichier
      const reportName = this.config.reportName || `${this.id}-report`;
      const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      const fileName = `${reportName}-${timestamp}.${this.config.reportFormat}`;
      const filePath = path.join(this.config.outputDir, fileName);
      
      // Générer le contenu du rapport selon le format
      let content: string;
      
      switch (this.config.reportFormat) {
        case 'json':
          content = this.generateJsonReport();
          break;
        case 'html':
          content = this.generateHtmlReport();
          break;
        case 'csv':
          content = this.generateCsvReport();
          break;
        case 'md':
        default:
          content = this.generateMarkdownReport();
          break;
      }
      
      // Écrire le rapport dans le fichier
      await fs.writeFile(filePath, content);
      
      this.logger.info(`Rapport de validation généré: ${filePath}`);
      return filePath;
    } catch (error: any) {
      this.logger.error(`Erreur lors de la génération du rapport: ${error.message}`);
      return undefined;
    }
  }
  
  /**
   * Génère un rapport au format JSON
   */
  protected generateJsonReport(): string {
    return JSON.stringify({
      agent: {
        id: this.id,
        name: this.name,
        version: this.version
      },
      timestamp: this.validationResult?.timestamp,
      input: this.filePath || this.config.inputPath,
      result: this.validationResult,
      errors: this.errors.map(err => err.message),
      warnings: this.warnings
    }, null, 2);
  }
  
  /**
   * Génère un rapport au format Markdown
   */
  protected generateMarkdownReport(): string {
    if (!this.validationResult) {
      return '# Aucun résultat de validation disponible';
    }
    
    let markdown = `# Rapport de validation - ${this.name} v${this.version}\n\n`;
    
    // Informations générales
    markdown += `## Informations générales\n\n`;
    markdown += `- **Date de validation**: ${this.validationResult.timestamp}\n`;
    markdown += `- **Statut**: ${this.validationResult.valid ? '✅ Validé' : '❌ Non validé'}\n`;
    markdown += `- **Score**: ${this.validationResult.score}/100 (Seuil: ${this.config.threshold || 70})\n`;
    markdown += `- **Fichier validé**: ${this.filePath || this.config.inputPath || 'N/A'}\n`;
    markdown += `- **Durée d'exécution**: ${this.validationResult.executionTimeMs}ms\n\n`;
    
    // Statistiques
    markdown += `## Statistiques\n\n`;
    markdown += `| Métrique | Valeur |\n|----------|--------|\n`;
    markdown += `| Total vérifications | ${this.validationResult.stats.totalChecks} |\n`;
    markdown += `| Vérifications réussies | ${this.validationResult.stats.passedChecks} |\n`;
    markdown += `| Vérifications échouées | ${this.validationResult.stats.failedChecks} |\n`;
    markdown += `| Erreurs critiques | ${this.validationResult.stats.criticalCount} |\n`;
    markdown += `| Erreurs | ${this.validationResult.stats.errorCount} |\n`;
    markdown += `| Avertissements | ${this.validationResult.stats.warningCount} |\n`;
    markdown += `| Informations | ${this.validationResult.stats.infoCount} |\n`;
    
    if (this.validationResult.autoFixableCount !== undefined) {
      markdown += `| Violations corrigeables | ${this.validationResult.autoFixableCount} |\n`;
      markdown += `| Violations corrigées | ${this.validationResult.fixedCount || 0} |\n`;
    }
    
    markdown += `\n`;
    
    // Violations
    markdown += `## Violations détectées (${this.validationResult.violations.length})\n\n`;
    
    if (this.validationResult.violations.length === 0) {
      markdown += `Aucune violation détectée.\n\n`;
    } else {
      // Regrouper les violations par sévérité
      const violationsBySeverity = {
        critical: this.validationResult.violations.filter(v => v.severity === 'critical'),
        error: this.validationResult.violations.filter(v => v.severity === 'error'),
        warning: this.validationResult.violations.filter(v => v.severity === 'warning'),
        info: this.validationResult.violations.filter(v => v.severity === 'info')
      };
      
      // Afficher les violations critiques en premier
      for (const [severity, violations] of Object.entries(violationsBySeverity)) {
        if (violations.length > 0) {
          markdown += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${violations.length})\n\n`;
          
          for (const violation of violations) {
            markdown += `#### ${violation.ruleId}: ${violation.message}\n\n`;
            
            if (violation.location) {
              if (violation.location.file) {
                markdown += `- **Fichier**: ${violation.location.file}\n`;
              }
              if (violation.location.line !== undefined) {
                markdown += `- **Ligne**: ${violation.location.line}\n`;
              }
              if (violation.location.path) {
                markdown += `- **Chemin**: ${violation.location.path}\n`;
              }
            }
            
            if (violation.fix) {
              markdown += `- **Suggestion**: ${violation.fix}\n`;
            }
            
            if (violation.autoFixable) {
              markdown += `- ⚙️ Corrigeable automatiquement\n`;
            }
            
            markdown += `\n`;
          }
        }
      }
    }
    
    // Erreurs d'exécution
    if (this.errors.length > 0) {
      markdown += `## Erreurs d'exécution\n\n`;
      
      for (const error of this.errors) {
        markdown += `- ${error.message}\n`;
      }
      
      markdown += `\n`;
    }
    
    return markdown;
  }
  
  /**
   * Génère un rapport au format HTML
   */
  protected generateHtmlReport(): string {
    if (!this.validationResult) {
      return '<html><body><h1>Aucun résultat de validation disponible</h1></body></html>';
    }
    
    // Génération d'un rapport HTML basique
    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de validation - ${this.name}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; margin-top: 30px; }
    h3 { color: #2c3e50; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .info { background-color: #d1ecf1; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
    .warning { background-color: #fff3cd; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
    .error { background-color: #f8d7da; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
    .critical { background-color: #dc3545; color: white; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
    .status { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; margin-bottom: 10px; }
    .status.valid { background-color: #28a745; color: white; }
    .status.invalid { background-color: #dc3545; color: white; }
    .score-container { display: flex; align-items: center; gap: 10px; }
    .score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
    .autofix { background-color: #e9ecef; border-radius: 4px; padding: 5px 10px; font-size: 0.8em; margin-top: 5px; display: inline-block; }
  </style>
</head>
<body>
  <h1>Rapport de validation - ${this.name} v${this.version}</h1>
  
  <div class="score-container">
    <div class="score-circle" style="background-color: ${this.getScoreColor(this.validationResult.score)}; color: white;">
      ${this.validationResult.score}/100
    </div>
    <div>
      <div class="status ${this.validationResult.valid ? 'valid' : 'invalid'}">
        ${this.validationResult.valid ? '✓ Validé' : '✗ Non validé'}
      </div>
      <p><strong>Date:</strong> ${this.validationResult.timestamp}</p>
      <p><strong>Fichier validé:</strong> ${this.filePath || this.config.inputPath || 'N/A'}</p>
      <p><strong>Durée d'exécution:</strong> ${this.validationResult.executionTimeMs}ms</p>
      <p><strong>Seuil de validation:</strong> ${this.config.threshold || 70}%</p>
    </div>
  </div>
  
  <h2>Statistiques</h2>
  <table>
    <tr>
      <th>Métrique</th>
      <th>Valeur</th>
    </tr>
    <tr>
      <td>Total vérifications</td>
      <td>${this.validationResult.stats.totalChecks}</td>
    </tr>
    <tr>
      <td>Vérifications réussies</td>
      <td>${this.validationResult.stats.passedChecks}</td>
    </tr>
    <tr>
      <td>Vérifications échouées</td>
      <td>${this.validationResult.stats.failedChecks}</td>
    </tr>
    <tr>
      <td>Erreurs critiques</td>
      <td>${this.validationResult.stats.criticalCount}</td>
    </tr>
    <tr>
      <td>Erreurs</td>
      <td>${this.validationResult.stats.errorCount}</td>
    </tr>
    <tr>
      <td>Avertissements</td>
      <td>${this.validationResult.stats.warningCount}</td>
    </tr>
    <tr>
      <td>Informations</td>
      <td>${this.validationResult.stats.infoCount}</td>
    </tr>`;
    
    if (this.validationResult.autoFixableCount !== undefined) {
      html += `
    <tr>
      <td>Violations corrigeables</td>
      <td>${this.validationResult.autoFixableCount}</td>
    </tr>
    <tr>
      <td>Violations corrigées</td>
      <td>${this.validationResult.fixedCount || 0}</td>
    </tr>`;
    }
    
    html += `
  </table>
  
  <h2>Violations détectées (${this.validationResult.violations.length})</h2>`;
    
    if (this.validationResult.violations.length === 0) {
      html += `
  <p>Aucune violation détectée.</p>`;
    } else {
      // Regrouper les violations par sévérité
      const violationsBySeverity = {
        critical: this.validationResult.violations.filter(v => v.severity === 'critical'),
        error: this.validationResult.violations.filter(v => v.severity === 'error'),
        warning: this.validationResult.violations.filter(v => v.severity === 'warning'),
        info: this.validationResult.violations.filter(v => v.severity === 'info')
      };
      
      // Afficher les violations par sévérité
      for (const [severity, violations] of Object.entries(violationsBySeverity)) {
        if (violations.length > 0) {
          html += `
  <h3>${severity.charAt(0).toUpperCase() + severity.slice(1)} (${violations.length})</h3>`;
          
          for (const violation of violations) {
            html += `
  <div class="${severity}">
    <h4>${violation.ruleId}: ${violation.message}</h4>`;
            
            if (violation.location) {
              html += `
    <p>`;
              if (violation.location.file) {
                html += `<strong>Fichier:</strong> ${violation.location.file}`;
                if (violation.location.line !== undefined) {
                  html += `, <strong>Ligne:</strong> ${violation.location.line}`;
                }
              }
              if (violation.location.path) {
                html += ` <strong>Chemin:</strong> ${violation.location.path}`;
              }
              html += `</p>`;
            }
            
            if (violation.fix) {
              html += `
    <p><strong>Suggestion:</strong> ${violation.fix}</p>`;
            }
            
            if (violation.autoFixable) {
              html += `
    <div class="autofix">⚙️ Corrigeable automatiquement</div>`;
            }
            
            html += `
  </div>`;
          }
        }
      }
    }
    
    // Erreurs d'exécution
    if (this.errors.length > 0) {
      html += `
  <h2>Erreurs d'exécution</h2>
  <ul>`;
      
      for (const error of this.errors) {
        html += `
    <li>${error.message}</li>`;
      }
      
      html += `
  </ul>`;
    }
    
    html += `
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Génère un rapport au format CSV
   */
  protected generateCsvReport(): string {
    if (!this.validationResult) {
      return 'Aucun résultat de validation disponible';
    }
    
    let csv = 'Type,RuleId,Severity,Message,File,Line,Column,Path,Suggestion,AutoFixable\n';
    
    // Ajouter les violations
    for (const violation of this.validationResult.violations) {
      const row = [
        'violation',
        violation.ruleId,
        violation.severity,
        `"${violation.message.replace(/"/g, '""')}"`,
        violation.location?.file || '',
        violation.location?.line || '',
        violation.location?.column || '',
        violation.location?.path || '',
        violation.fix ? `"${violation.fix.replace(/"/g, '""')}"` : '',
        violation.autoFixable ? 'true' : 'false'
      ];
      
      csv += row.join(',') + '\n';
    }
    
    // Ajouter les erreurs
    for (const error of this.errors) {
      const row = [
        'error',
        '',
        'error',
        `"${error.message.replace(/"/g, '""')}"`,
        '',
        '',
        '',
        '',
        '',
        ''
      ];
      
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }
  
  /**
   * Retourne le statut actuel de l'agent
   */
  public getStatus(): AgentStatus {
    return { ...this._status };
  }
  
  /**
   * Retourne une couleur en fonction du score
   * @param score Score entre 0 et 100
   */
  protected getScoreColor(score: number): string {
    if (score >= 90) return '#28a745'; // Vert
    if (score >= 75) return '#2ecc71'; // Vert clair
    if (score >= (this.config.threshold || 70)) return '#17a2b8'; // Bleu
    if (score >= 50) return '#ffc107'; // Jaune
    return '#dc3545'; // Rouge
  }
  
  /**
   * Charge les données à valider
   * @param inputPath Chemin du fichier ou des données à valider
   */
  public async loadData(inputPath: string): Promise<void> {
    try {
      this.filePath = inputPath;
      
      const stats = await fs.stat(inputPath);
      
      if (stats.isFile()) {
        this.fileContent = await fs.readFile(inputPath, 'utf-8');
        this.logger.debug(`Données chargées depuis le fichier: ${inputPath}`);
      } else {
        throw new Error(`Le chemin spécifié n'est pas un fichier valide: ${inputPath}`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement des données: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Charge les règles de validation par défaut
   * À surcharger dans les classes dérivées pour définir les règles spécifiques
   */
  protected async loadDefaultRules(): Promise<void> {
    // Par défaut, aucune règle - à implémenter dans les sous-classes
    this.logger.debug('Aucune règle par défaut définie. Utilisez loadDefaultRules() dans votre sous-classe.');
  }
  
  /**
   * Charge des règles de validation personnalisées à partir de chemins de fichiers
   * @param rulePaths Chemins des fichiers de règles
   */
  protected async loadCustomRules(rulePaths: string[]): Promise<void> {
    for (const rulePath of rulePaths) {
      try {
        // Vérifier si le fichier existe
        if (await fs.pathExists(rulePath)) {
          // Charger le fichier et évaluer son contenu
          const ruleModule = require(path.resolve(rulePath));
          
          // Vérifier si le module exporte une règle ou un tableau de règles
          if (Array.isArray(ruleModule)) {
            // Ajouter toutes les règles du tableau
            for (const rule of ruleModule) {
              if (this.isValidRule(rule)) {
                this.addRule(rule);
              }
            }
          } else if (this.isValidRule(ruleModule)) {
            // Ajouter la règle unique
            this.addRule(ruleModule);
          } else {
            this.logger.warn(`Le fichier de règle ${rulePath} n'exporte pas de règles valides`);
          }
        } else {
          this.logger.warn(`Fichier de règles introuvable: ${rulePath}`);
        }
      } catch (error: any) {
        this.logger.error(`Erreur lors du chargement des règles depuis ${rulePath}: ${error.message}`);
        this.errors.push(error instanceof Error ? error : new Error(`Erreur chargement règle: ${error}`));
      }
    }
  }
  
  /**
   * Charge des ensembles de règles prédéfinis
   * @param rulesetNames Noms des ensembles de règles à charger
   */
  protected async loadRulesets(rulesetNames: string[]): Promise<void> {
    // À implémenter dans les sous-classes pour charger des ensembles de règles spécifiques
    this.logger.debug('Méthode loadRulesets() appelée mais non implémentée dans la classe abstraite');
  }
  
  /**
   * Vérifie si un objet est une règle de validation valide
   * @param rule Objet à vérifier
   */
  protected isValidRule(rule: any): rule is ValidationRule {
    return typeof rule === 'object' &&
           typeof rule.id === 'string' &&
           typeof rule.name === 'string' &&
           typeof rule.validate === 'function';
  }
  
  /**
   * Ajoute une règle à l'ensemble des règles de validation
   * @param rule Règle à ajouter
   */
  protected addRule(rule: ValidationRule): void {
    // Vérifier si la règle existe déjà
    const existingRule = this.rules.find(r => r.id === rule.id);
    
    if (existingRule) {
      // Remplacer la règle existante
      const index = this.rules.indexOf(existingRule);
      this.rules[index] = rule;
      this.logger.debug(`Règle ${rule.id} mise à jour`);
    } else {
      // Ajouter la nouvelle règle
      this.rules.push(rule);
      this.logger.debug(`Règle ${rule.id} ajoutée`);
    }
  }
  
  /**
   * Vérifie si la validation est réussie
   */
  public isValid(): boolean {
    return this.validationResult?.valid === true;
  }
  
  /**
   * Nettoie les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    // Libérer les ressources potentiellement utilisées par le validateur
    this.logger.info(`Nettoyage de l'agent ${this.name}`);
    
    this.fileContent = undefined;
    this._status.health = AgentHealthState.STOPPED;
    
    // Les erreurs et avertissements sont conservés pour la traçabilité
  }
  
  /**
   * Retourne les agents dont celui-ci dépend
   */
  public getDependencies(): string[] {
    return []; // Par défaut, aucune dépendance
  }
  
  /**
   * Traite la demande d'exécution et retourne le résultat
   */
  public async process(): Promise<AgentResult> {
    const startTime = Date.now();
    this._status.lastRun = new Date();
    
    try {
      // Créer un contexte minimal si nécessaire
      const context: AgentContext = {
        getConfig: () => this.config,
        logger: this.logger
      };
      
      // Initialiser l'agent
      await this.initialize(context);
      
      // Exécuter la validation
      await this.execute(context);
      
      // Nettoyer les ressources
      await this.cleanup();
      
      const endTime = Date.now();
      this._status.lastRunDuration = endTime - startTime;
      
      // Préparer la réponse avec les résultats de la validation
      return {
        success: this.isValid(),
        message: this.isValid() 
          ? `Validation réussie avec un score de ${this.validationResult!.score}%`
          : `Validation échouée avec un score de ${this.validationResult!.score}% (seuil: ${this.config.threshold}%)`,
        data: {
          validationResult: this.validationResult,
          isValid: this.isValid(),
          score: this.validationResult!.score
        },
        errors: this.errors.length > 0 ? this.errors : undefined,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        artifacts: this.artifacts.length > 0 ? this.artifacts : undefined,
        metrics: {
          executionTimeMs: endTime - startTime,
          score: this.validationResult!.score,
          totalChecks: this.validationResult!.stats.totalChecks,
          passedChecks: this.validationResult!.stats.passedChecks,
          failedChecks: this.validationResult!.stats.failedChecks,
          errorCount: this.validationResult!.stats.errorCount,
          warningCount: this.validationResult!.stats.warningCount
        },
        executionTimeMs: endTime - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      const endTime = Date.now();
      this._status.lastRunDuration = endTime - startTime;
      this._status.failureCount = (this._status.failureCount || 0) + 1;
      this._status.health = AgentHealthState.ERROR;
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.errors.push(errorObj);
      
      this.logger.error(`Erreur lors de l'exécution du validateur: ${errorObj.message}`);
      
      return {
        success: false,
        message: `Échec de la validation: ${errorObj.message}`,
        errors: [errorObj],
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        executionTimeMs: endTime - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }
}