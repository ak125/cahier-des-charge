/**
 * Types spécifiques aux agents de la catégorie audit
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents audit
 */
export interface AuditAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents audit
 */
export interface AuditResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
