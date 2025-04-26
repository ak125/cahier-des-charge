/**
 * Types spécifiques aux agents de la catégorie ui
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents ui
 */
export interface UiAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents ui
 */
export interface UiResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
