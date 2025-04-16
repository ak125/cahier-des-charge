// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractValidatorAgent, ValidatorConfig } from '../../core/abstract-validator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractValidatorAgent, ValidatorConfig } from '../../core/abstract-validator-agent';
import { AgentContext } from '../../core/mcp-agent';

/**
 * BaseValidatorAgent - Classe de base pour tous les agents de validation
 * 
 * Cette classe implémente la couche d'abstraction pour les agents de validation
 * et fournit des fonctionnalités communes à tous les validateurs.
 */

import { BaseMcpAgent, AgentContext, AgentResult, AgentConfig } from '../core/interfaces';

// Configuration spécifique aux agents de validation
export interface ValidatorAgentConfig extends AgentConfig {
  // Configurations spécifiques aux validateurs
  strictMode?: boolean;
  rules?: string[];
  customRules?: Record<string, any>;
  autofixEnabled?: boolean;
  minScoreThreshold?: number; // Seuil minimal de score pour validation (0-100)
  reportFormat?: 'simple' | 'detailed' | 'json';
}

// Résultat spécifique aux agents de validation
export interface ValidationResult {
  // Résultats spécifiques aux validateurs
  valid: boolean;
  violations: Array<{
    rule: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    location?: {
      file?: string;
      line?: number;
      column?: number;
    };
    autoFixable: boolean;
    autoFixed?: boolean;
    suggestedFix?: string;
  }>;
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    score: number; // Score de 0 à 100
  };
  fixesSuggested?: Record<string, any>;
  fixesApplied?: Record<string, any>;
}

/**
 * Classe de base pour les agents de validation
 */
export abstract class BaseValidatorAgent extends BaseMcpAgent<ValidationResult, ValidatorAgentConfig> {
  /**
   * Exécute la validation et retourne le résultat
   */
  async execute(context: AgentContext): Promise<AgentResult<ValidationResult>> {
    return this.executeWithMetrics(context, async () => {
      // Valider le contexte
      if (!(await this.validate(context))) {
        return {
          success: false,
          error: 'Contexte d\'exécution invalide',
          warnings: ['Le contexte d\'exécution fourni ne contient pas les informations nécessaires']
        };
      }

      this.log('info', 'Démarrage de la validation');

      try {
        // Appel à l'implémentation spécifique de la validation
        const validationResult = await this.performValidation(context);
        
        // Si autofixEnabled et que des violations sont autoFixable
        if (this.config.autofixEnabled && validationResult.violations.some(v => v.autoFixable)) {
          await this.applyAutofixes(validationResult, context);
        }
        
        // Calcul du score final
        validationResult.summary.score = this.calculateScore(validationResult);
        
        // Détermine si le résultat est valide selon les règles et le seuil configuré
        const valid = validationResult.summary.score >= (this.config.minScoreThreshold || 100);
        validationResult.valid = valid;
        
        // Construction du résultat
        const result: AgentResult<ValidationResult> = {
          success: true,
          data: validationResult,
          score: validationResult.summary.score
        };
        
        if (!valid) {
          result.warnings = [`Le score de validation (${validationResult.summary.score}) est inférieur au seuil requis (${this.config.minScoreThreshold || 100})`];
        }
        
        this.log('info', `Validation terminée avec un score de ${validationResult.summary.score}% (${validationResult.violations.length} violations)`);
        
        return result;
      } catch (error) {
        this.log('error', `Erreur lors de la validation: ${error instanceof Error ? error.message : String(error)}`);
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });
  }

  /**
   * Implémentation spécifique de la validation à fournir par chaque sous-classe
   */
  protected abstract performValidation(context: AgentContext): Promise<ValidationResult>;

  /**
   * Applique les corrections automatiques aux violations
   */
  protected async applyAutofixes(result: ValidationResult, context: AgentContext): Promise<void> {
    // Par défaut, cette méthode ne fait rien
    // Les sous-classes doivent implémenter leur propre logique de correction
    
    // On marque quelles violations ont été corrigées
    const autoFixableViolations = result.violations.filter(v => v.autoFixable);
    this.log('info', `${autoFixableViolations.length} violations peuvent être corrigées automatiquement`);
    
    // Garder une trace des corrections appliquées
    result.fixesApplied = {};
  }

  /**
   * Calcule le score de validation
   */
  protected calculateScore(result: ValidationResult): number {
    if (result.summary.totalChecks === 0) return 100; // Pas de tests = score parfait
    
    // Calcul simple : pourcentage de tests réussis
    const baseScore = (result.summary.passedChecks / result.summary.totalChecks) * 100;

    // Pénalités additionnelles basées sur la sévérité
    let penaltyPoints = 0;
    const weights = {
      'warning': 1,
      'error': 3,
      'critical': 10
    };

    // Comptage par sévérité
    const violationsBySeverity: Record<string, number> = {};
    for (const violation of result.violations) {
      violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
    }

    // Application des pénalités
    for (const [severity, count] of Object.entries(violationsBySeverity)) {
      const weight = weights[severity as keyof typeof weights] || 0;
      penaltyPoints += Math.min(count * weight, 20); // Maximum 20 points de pénalité par catégorie
    }

    // Score final
    const finalScore = Math.max(0, Math.min(100, baseScore - penaltyPoints));
    return Math.round(finalScore);
  }

  /**
   * Charge et valide les règles spécifiées dans la configuration
   */
  protected async loadRules(): Promise<any[]> {
    // Cette méthode peut être surchargée par les sous-classes
    // pour charger des règles personnalisées depuis différentes sources
    
    const rules: any[] = [];
    
    // Si des règles sont spécifiées dans la configuration
    if (this.config.rules && this.config.rules.length > 0) {
      for (const ruleName of this.config.rules) {
        try {
          // Logique pour charger la règle (à implémenter par les sous-classes)
          this.log('debug', `Chargement de la règle ${ruleName}`);
          // rules.push(...);
        } catch (error) {
          this.log('warn', `Impossible de charger la règle ${ruleName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Ajouter les règles personnalisées si définies
    if (this.config.customRules) {
      Object.entries(this.config.customRules).forEach(([name, rule]) => {
        this.log('debug', `Ajout de la règle personnalisée ${name}`);
        rules.push(rule);
      });
    }
    
    return rules;
  }
}