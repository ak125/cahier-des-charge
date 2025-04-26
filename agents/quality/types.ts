/**
 * Types spécifiques aux agents de la catégorie quality
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents quality
 */
export interface QualityAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents quality
 */
export interface QualityResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
