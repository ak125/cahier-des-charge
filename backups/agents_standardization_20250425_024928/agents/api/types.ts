/**
 * Types spécifiques aux agents de la catégorie api
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents api
 */
export interface ApiAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents api
 */
export interface ApiResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
