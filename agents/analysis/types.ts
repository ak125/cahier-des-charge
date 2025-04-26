/**
 * Types spécifiques aux agents de la catégorie analysis
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents analysis
 */
export interface AnalysisAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents analysis
 */
export interface AnalysisResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
