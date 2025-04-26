/**
 * Types spécifiques aux agents de la catégorie monitoring
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents monitoring
 */
export interface MonitoringAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents monitoring
 */
export interface MonitoringResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
