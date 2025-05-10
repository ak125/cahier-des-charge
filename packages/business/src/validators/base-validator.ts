/**
 * Validateur de base pour la couche Business
 */
import { ValidationResult } from '../types';

export class BaseValidator {
  validate(data: any): ValidationResult {
    // Implémentation de base
    return {
      valid: true,
      errors: []
    };
  }
}
