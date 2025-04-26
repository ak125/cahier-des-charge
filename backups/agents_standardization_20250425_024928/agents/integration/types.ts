/**
 * Types spécifiques aux agents de la catégorie integration
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents integration
 */
export interface IntegrationAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents integration
 */
export interface IntegrationResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
