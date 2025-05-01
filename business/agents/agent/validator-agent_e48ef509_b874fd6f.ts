import { BaseAgent } from '../base-agentstructure-agent';

/**
 * Interface pour les agents de validation et vérification
 */
export interface ValidatorAgent extends BaseAgent {
  /** Valide les données d'entrée selon un schéma ou des règles */
  validate(input: Record<string, any>): Promise<Record<string, any>>;

  /** Règles de validation configurables */
  validationRules?: Record<string, any>;

  /** Niveau de sévérité des erreurs à remonter */
  severityLevel?: 'info' | 'warning' | 'error' | 'critical';

  /** Vérifie la conformité à un standard spécifique */
  checkCompliance?(standard: string, input: Record<string, any>): Promise<boolean>;

  /** Formats des rapports d'erreurs */
  errorReportFormat?: 'simple' | 'detailed' | 'json';
}
