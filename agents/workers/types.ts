/**
 * Types spécifiques aux agents de la catégorie workers
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents workers
 */
export interface WorkersAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents workers
 */
export interface WorkersResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
