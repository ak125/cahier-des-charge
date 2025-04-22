import { Agent, AgentResult } from './BaseAgent';

/**
 * Configuration de base pour un agent de validation
 */
export interface ValidatorConfig {
  /**
   * Seuil de validation (0-100)
   */
  threshold?: number;
  
  /**
   * Fichier ou données à valider
   */
  sourcePath?: string;
  
  /**
   * Règles de validation à activer/désactiver
   */
  rules?: Record<string, boolean>;
  
  /**
   * Niveau de sévérité minimum pour les violations ('error', 'warning', 'info')
   */
  minSeverity?: 'error' | 'warning' | 'info';
  
  /**
   * Répertoire où stocker les résultats de validation
   */
  outputDir?: string;
  
  /**
   * Mode strict de validation
   */
  strictMode?: boolean;
  
  /**
   * Options supplémentaires spécifiques à l'agent
   */
  [key: string]: any;
}

/**
 * Règle de validation
 */
export interface ValidationRule {
  /**
   * Identifiant unique de la règle
   */
  id: string;
  
  /**
   * Description de la règle
   */
  description: string;
  
  /**
   * Sévérité en cas de violation ('error', 'warning', 'info')
   */
  severity: 'error' | 'warning' | 'info';
  
  /**
   * Si la règle est activée
   */
  enabled: boolean;
  
  /**
   * Catégorie de la règle
   */
  category: string;
  
  /**
   * Critères de validation de la règle (spécifique à l'implémentation)
   */
  criteria?: any;
}

/**
 * Violation d'une règle de validation
 */
export interface ValidationViolation {
  /**
   * Référence à la règle violée
   */
  ruleId: string;
  
  /**
   * Message décrivant la violation
   */
  message: string;
  
  /**
   * Sévérité de la violation ('error', 'warning', 'info')
   */
  severity: 'error' | 'warning' | 'info';
  
  /**
   * Emplacement de la violation (fichier, ligne, colonne)
   */
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  
  /**
   * Code ou contexte concerné par la violation
   */
  context?: string;
  
  /**
   * Recommandation pour corriger la violation
   */
  recommendation?: string;
  
  /**
   * Métadonnées supplémentaires
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat d'une validation
 */
export interface ValidationResult {
  /**
   * Si la validation est réussie (respect des critères)
   */
  isValid: boolean;
  
  /**
   * Score de la validation (0-100)
   */
  score: number;
  
  /**
   * Liste des violations détectées
   */
  violations: ValidationViolation[];
  
  /**
   * Statistiques de validation
   */
  stats: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  
  /**
   * Métadonnées supplémentaires
   */
  metadata?: Record<string, any>;
}

/**
 * Interface pour les agents de validation
 * Les agents de validation vérifient la conformité à des règles ou standards et
 * produisent des rapports détaillant les violations détectées.
 */
export interface ValidatorAgent<TConfig extends ValidatorConfig = ValidatorConfig> extends Agent {
  /**
   * Configuration spécifique de l'agent de validation
   */
  config: TConfig;
  
  /**
   * Règles de validation utilisées par l'agent
   */
  rules: ValidationRule[];
  
  /**
   * Résultat de la dernière validation
   */
  validationResult?: ValidationResult;
  
  /**
   * Charge les données à valider
   */
  loadData(): Promise<void>;
  
  /**
   * Effectue la validation selon les règles définies
   */
  validate(): Promise<ValidationResult>;
  
  /**
   * Ajoute une règle de validation
   */
  addRule(rule: ValidationRule): void;
  
  /**
   * Active ou désactive une règle de validation
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void;
  
  /**
   * Génère un rapport de validation
   */
  generateReport(format?: string): Promise<string>;
  
  /**
   * Détermine si les résultats de la validation sont conformes au seuil configuré
   */
  isValid(): boolean;
}