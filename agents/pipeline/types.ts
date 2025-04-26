/**
 * Types spécifiques aux agents de la catégorie pipeline
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents pipeline
 */
export interface PipelineAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents pipeline
 */
export interface PipelineResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
