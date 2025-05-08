/**
 * Module principal pour la validation sécurisée du code généré par IA
 * 
 * Ce module fournit une validation à plusieurs niveaux pour garantir
 * que le code généré par des agents IA est sécurisé et conforme aux
 * standards du projet.
 */

export * from './core/SafeMigrationValidator';
export * from './scanners/SecurityScanner';
export * from './verifiers/ComplianceVerifier';
export * from './validators/SemanticValidator';
export * from './types';

import { SafeMigrationValidator } from './core/SafeMigrationValidator';

// Export de l'instance par défaut du validateur
export const safeValidator = new SafeMigrationValidator();