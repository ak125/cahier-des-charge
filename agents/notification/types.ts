/**
 * Types spécifiques aux agents de la catégorie notification
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents notification
 */
export interface NotificationAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents notification
 */
export interface NotificationResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
