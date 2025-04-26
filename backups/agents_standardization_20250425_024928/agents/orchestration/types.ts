/**
 * Types spécifiques aux agents de la catégorie orchestration
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents orchestration
 */
export interface OrchestrationAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents orchestration
 */
export interface OrchestrationResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
