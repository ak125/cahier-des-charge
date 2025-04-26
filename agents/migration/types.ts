/**
 * Types spécifiques aux agents de la catégorie migration
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents migration
 */
export interface MigrationAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents migration
 */
export interface MigrationResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
