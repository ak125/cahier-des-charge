/**
 * Agent de validation
 *
 * Fait partie de la Couche business - Logique métier spécifique et traitement des données
 * Responsabilité: Implémenter la logique métier spécifique, analyser et transformer les données
 */

import { BaseAgent } from '../../../core/interfaces/base-agent';

export interface ValidatorAgent extends BaseAgent {
  /**
   * Valide des données selon des règles
   */
  validate(data: any, rules: ValidationRules): Promise<ValidationResult>;

  /**
   * Obtient les erreurs de validation
   */
  getErrors(validationId: string): Promise<ValidationError[]>;
}

// Types utilisés par l'interface
export type ValidatorOptions = Record<string, any>;
export interface ValidatorResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
