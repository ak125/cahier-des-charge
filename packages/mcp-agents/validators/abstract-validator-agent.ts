// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractValidatorAgent, ValidatorConfig } from '../../core/abstract-validator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractValidatorAgent, ValidatorConfig } from '../../core/abstract-validator-agent';
import { AgentContext } from '../../core/mcp-agent';

import { Agent, AgentResult, AgentStatus, AgentHealthState } from '../core/interfaces/base-agent';
import { ValidatorAgent, ValidatorConfig, ValidationRule, ValidationResult, ValidationViolation } from '../core/interfaces/validator-agent';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger';

/**
 * Classe abstraite pour les agents de validation
 * Fournit une implémentation de base des méthodes communes aux validateurs
 */
export abstract class AbstractValidatorAgent<TConfig extends ValidatorConfig = ValidatorConfig> implements ValidatorAgent<TConfig> {
  /**
   * Identifiant unique de l'agent
   */
  public abstract id: string;

  /**
   * Version de l'agent
   */
  public abstract version: string;

  /**
   * Nom descriptif de l'agent
   */
  public abstract name: string;

  /**
   * Description des fonctionnalités de l'agent
   */
  public abstract description: string;

  /**
   * Chemin du fichier ou des données à valider
   */
  public filePath?: string;

  /**
   * Contenu du fichier ou des données à valider
   */
  public fileContent?: string;

  /**
   * Configuration du validateur
   */
  public config: TConfig;

  /**
   * Règles de validation utilisées par l'agent
   */
  public rules: ValidationRule[] = [];

  /**
   * Résultat de la dernière validation
   */
  public validationResult?: ValidationResult;

  /**
   * Erreurs rencontrées pendant la validation
   */
  public errors: Error[] = [];

  /**
   * Avertissements générés pendant la validation
   */
  public warnings: string[] = [];

  /**
   * Artefacts générés (chemins de fichiers)
   */
  public artifacts: string[] = [];

  /**
   * Logger utilisé par l'agent
   */
  protected logger: Logger;

  /**
   * État de santé de l'agent
   */
  private _status: AgentStatus = {
    health: AgentHealthState.STOPPED,
    successCount: 0,
    failureCount: 0
  };

  /**
   * Constructeur
   * @param filePath Chemin du fichier à valider (optionnel)
   * @param config Configuration du validateur
   */
  constructor(filePath?: string, config?: Partial<TConfig>) {
    this.filePath = filePath;
    this.config = {
      threshold: 80, // Score minimal par défaut
      minSeverity: 'warning', // Sévérité minimale à reporter par défaut
      strictMode: false, // Mode strict désactivé par défaut
      outputDir: './validation-reports',
      ...(config || {})
    } as TConfig;
    
    this.logger = new Logger(this.getName() || 'AbstractValidatorAgent');
  }

  /**
   * Initialise l'agent avec ses dépendances et configuration
   */
  public async initialize(): Promise<void> {
    this._status.health = AgentHealthState.STARTING;
    
    // Charge les données si un chemin est fourni mais que le contenu n'est pas encore chargé
    if (this.filePath && !this.fileContent) {
      await this.loadData();
    }
    
    // Charge les règles de validation par défaut
    await this.loadDefaultRules();

    this._status.health = AgentHealthState.HEALTHY;
    this.logger.info(`Agent ${this.getName()} (v${this.getVersion()}) initialisé avec ${this.rules.length} règles`);
  }

  /**
   * Exécute l'agent et retourne le résultat
   */
  public async process(): Promise<AgentResult> {
    const startTime = Date.now();
    this._status.lastRun = new Date();
    
    try {
      // Initialiser si ce n'est pas déjà fait
      if (this._status.health === AgentHealthState.STOPPED) {
        await this.initialize();
      }
      
      // Exécuter la validation
      this.validationResult = await this.validate();
      
      // Générer le rapport de validation
      const reportPath = await this.generateReport();
      if (reportPath) {
        this.artifacts.push(reportPath);
      }
      
      const endTime = Date.now();
      this._status.lastRunDuration = endTime - startTime;
      
      // Mise à jour des statistiques de succès/échec
      if (this.isValid()) {
        this._status.successCount = (this._status.successCount || 0) + 1;
      } else {
        this._status.failureCount = (this._status.failureCount || 0) + 1;
      }
      
      // Préparer la réponse avec les résultats de la validation
      return {
        success: this.errors.length === 0 && this.isValid(),
        message: this.isValid() 
          ? `Validation réussie avec un score de ${this.validationResult.score}%`
          : `Validation échouée avec un score de ${this.validationResult.score}% (seuil: ${this.config.threshold}%)`,
        data: {
          validationResult: this.validationResult,
          isValid: this.isValid(),
          score: this.validationResult.score
        },
        errors: this.errors,
        warnings: this.warnings,
        artifacts: this.artifacts,
        metrics: {
          executionTime: endTime - startTime,
          score: this.validationResult.score,
          totalChecks: this.validationResult.stats.totalChecks,
          passedChecks: this.validationResult.stats.passedChecks,
          failedChecks: this.validationResult.stats.failedChecks,
          errorCount: this.validationResult.stats.errorCount,
          warningCount: this.validationResult.stats.warningCount
        }
      };
    } catch (error) {
      const endTime = Date.now();
      this._status.lastRunDuration = endTime - startTime;
      this._status.failureCount = (this._status.failureCount || 0) + 1;
      this._status.health = AgentHealthState.DEGRADED;
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.errors.push(errorObj);
      
      this.logger.error(`Erreur lors de l'exécution du validateur: ${errorObj.message}`);
      
      return {
        success: false,
        message: `Échec de la validation: ${errorObj.message}`,
        errors: [errorObj],
        warnings: this.warnings
      };
    }
  }

  /**
   * Renvoie le statut actuel de l'agent
   */
  public getStatus(): AgentStatus {
    return { ...this._status };
  }

  /**
   * Nettoie les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    // Libérer les ressources potentiellement utilisées par le validateur
    this.fileContent = undefined;
    this._status.health = AgentHealthState.STOPPED;
    this.logger.info(`Agent ${this.getName()} nettoyé`);
  }

  /**
   * Renvoie les agents dont celui-ci dépend
   * À surcharger dans les classes dérivées selon leurs dépendances
   */
  public getDependencies(): string[] {
    return [];
  }

  /**
   * Renvoie le nom de l'agent
   * Par défaut utilise le nom de la classe
   */
  public getName(): string {
    return this.name || this.constructor.name;
  }

  /**
   * Renvoie la version de l'agent
   * À surcharger dans les classes dérivées
   */
  public getVersion(): string {
    return this.version || '1.0.0';
  }

  /**
   * Charge les données à valider
   */
  public async loadData(): Promise<void> {
    if (!this.filePath) {
      throw new Error('Aucun chemin de fichier à valider spécifié');
    }
    
    try {
      // Vérifier si le fichier existe
      if (!await fs.pathExists(this.filePath)) {
        throw new Error(`Le fichier ${this.filePath} n'existe pas`);
      }
      
      // Charger le contenu du fichier
      this.fileContent = await fs.readFile(this.filePath, 'utf-8');
      this.logger.debug(`Fichier à valider chargé: ${this.filePath}`);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      const newError = new Error(`Erreur lors du chargement des données à valider: ${errorMessage}`);
      this.errors.push(newError);
      throw newError;
    }
  }

  /**
   * Charge les règles de validation par défaut
   * À surcharger dans les classes dérivées pour définir les règles spécifiques
   */
  protected async loadDefaultRules(): Promise<void> {
    // Cette méthode doit être implémentée par les classes dérivées pour charger les règles spécifiques
  }

  /**
   * Effectue la validation selon les règles définies
   * À implémenter dans les classes dérivées
   */
  public abstract validate(): Promise<ValidationResult>;

  /**
   * Ajoute une règle de validation
   */
  public addRule(rule: ValidationRule): void {
    // Vérifier si la règle existe déjà (par son id)
    const existingRuleIndex = this.rules.findIndex(r => r.id === rule.id);
    
    if (existingRuleIndex >= 0) {
      // Mettre à jour la règle existante
      this.rules[existingRuleIndex] = { ...rule };
      this.logger.debug(`Règle de validation mise à jour: ${rule.id}`);
    } else {
      // Ajouter la nouvelle règle
      this.rules.push({ ...rule });
      this.logger.debug(`Règle de validation ajoutée: ${rule.id}`);
    }
  }

  /**
   * Active ou désactive une règle de validation
   */
  public setRuleEnabled(ruleId: string, enabled: boolean): void {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex >= 0) {
      this.rules[ruleIndex].enabled = enabled;
      this.logger.debug(`Règle ${ruleId} ${enabled ? 'activée' : 'désactivée'}`);
    } else {
      this.logger.warn(`Impossible de ${enabled ? 'activer' : 'désactiver'} la règle ${ruleId}: règle non trouvée`);
    }
  }

  /**
   * Génère un rapport de validation
   */
  public async generateReport(format: string = 'json'): Promise<string> {
    if (!this.validationResult) {
      throw new Error('Aucun résultat de validation disponible');
    }
    
    // S'assurer que le répertoire de sortie existe
    await fs.ensureDir(this.config.outputDir!);
    
    const fileName = `${path.basename(this.filePath || 'validation')}-${this.getName()}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const filePath = path.join(this.config.outputDir!, `${fileName}.${format}`);
    
    try {
      let content: string;
      
      if (format === 'json') {
        const reportObj = {
          agent: {
            name: this.getName(),
            version: this.getVersion(),
            id: this.id
          },
          target: this.filePath,
          timestamp: new Date().toISOString(),
          configuration: {
            threshold: this.config.threshold,
            strictMode: this.config.strictMode,
            minSeverity: this.config.minSeverity
          },
          result: {
            isValid: this.isValid(),
            score: this.validationResult.score,
            violationCount: this.validationResult.violations.length,
            statistics: this.validationResult.stats
          },
          violations: this.validationResult.violations,
          errors: this.errors.map(err => err.message),
          warnings: this.warnings
        };
        content = JSON.stringify(reportObj, null, 2);
      } else if (format === 'md') {
        content = this.generateMarkdownReport();
      } else {
        throw new Error(`Format de rapport non supporté: ${format}`);
      }
      
      await fs.writeFile(filePath, content, 'utf-8');
      this.logger.info(`Rapport de validation généré: ${filePath}`);
      
      return filePath;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.warnings.push(`Erreur lors de la génération du rapport: ${errorMessage}`);
      return '';
    }
  }

  /**
   * Génère un rapport au format Markdown
   */
  protected generateMarkdownReport(): string {
    if (!this.validationResult) {
      throw new Error('Aucun résultat de validation disponible');
    }
    
    let md = `# Rapport de validation: ${path.basename(this.filePath || 'unknown')}\n\n`;
    md += `Généré par: ${this.getName()} v${this.getVersion()}\n`;
    md += `Date: ${new Date().toISOString()}\n\n`;
    
    // Résumé de la validation
    md += `## Résumé\n\n`;
    md += `- **Statut**: ${this.isValid() ? '✅ Valide' : '❌ Invalide'}\n`;
    md += `- **Score**: ${this.validationResult.score}% (seuil: ${this.config.threshold}%)\n`;
    md += `- **Vérifications**: ${this.validationResult.stats.passedChecks}/${this.validationResult.stats.totalChecks} réussies\n`;
    md += `- **Violations**: ${this.validationResult.violations.length} (${this.validationResult.stats.errorCount} erreurs, ${this.validationResult.stats.warningCount} avertissements, ${this.validationResult.stats.infoCount} infos)\n\n`;
    
    // Afficher les violations
    if (this.validationResult.violations.length > 0) {
      md += `## Violations\n\n`;
      
      // Grouper les violations par sévérité
      const violationsBySeverity: Record<string, ValidationViolation[]> = {
        error: [],
        warning: [],
        info: []
      };
      
      this.validationResult.violations.forEach(violation => {
        violationsBySeverity[violation.severity].push(violation);
      });
      
      // Erreurs
      if (violationsBySeverity.error.length > 0) {
        md += `### ❌ Erreurs (${violationsBySeverity.error.length})\n\n`;
        violationsBySeverity.error.forEach(violation => {
          md += `- **[${violation.ruleId}]**: ${violation.message}\n`;
          if (violation.location && violation.location.file) {
            md += `  - *${violation.location.file}${violation.location.line ? `:${violation.location.line}` : ''}*\n`;
          }
          if (violation.recommendation) {
            md += `  - 💡 ${violation.recommendation}\n`;
          }
          md += '\n';
        });
      }
      
      // Avertissements
      if (violationsBySeverity.warning.length > 0) {
        md += `### ⚠️ Avertissements (${violationsBySeverity.warning.length})\n\n`;
        violationsBySeverity.warning.forEach(violation => {
          md += `- **[${violation.ruleId}]**: ${violation.message}\n`;
          if (violation.location && violation.location.file) {
            md += `  - *${violation.location.file}${violation.location.line ? `:${violation.location.line}` : ''}*\n`;
          }
          if (violation.recommendation) {
            md += `  - 💡 ${violation.recommendation}\n`;
          }
          md += '\n';
        });
      }
      
      // Infos
      if (violationsBySeverity.info.length > 0) {
        md += `### ℹ️ Informations (${violationsBySeverity.info.length})\n\n`;
        violationsBySeverity.info.forEach(violation => {
          md += `- **[${violation.ruleId}]**: ${violation.message}\n`;
          if (violation.location && violation.location.file) {
            md += `  - *${violation.location.file}${violation.location.line ? `:${violation.location.line}` : ''}*\n`;
          }
          if (violation.recommendation) {
            md += `  - 💡 ${violation.recommendation}\n`;
          }
          md += '\n';
        });
      }
    }
    
    // Afficher les erreurs d'exécution
    if (this.errors.length > 0) {
      md += `## Erreurs d'exécution\n\n`;
      this.errors.forEach(err => {
        md += `- ${err.message}\n`;
      });
      md += '\n';
    }
    
    // Afficher les avertissements d'exécution
    if (this.warnings.length > 0) {
      md += `## Avertissements d'exécution\n\n`;
      this.warnings.forEach(warning => {
        md += `- ${warning}\n`;
      });
      md += '\n';
    }
    
    return md;
  }

  /**
   * Détermine si les résultats de la validation sont conformes au seuil configuré
   */
  public isValid(): boolean {
    if (!this.validationResult) {
      return false;
    }
    
    // En mode strict, on vérifie aussi qu'il n'y a aucune violation de type 'error'
    if (this.config.strictMode && this.validationResult.stats.errorCount > 0) {
      return false;
    }
    
    // Sinon, on vérifie juste le score par rapport au seuil
    return this.validationResult.isValid && this.validationResult.score >= (this.config.threshold || 0);
  }
}