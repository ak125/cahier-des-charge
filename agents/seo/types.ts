/**
 * Types spécifiques aux agents de la catégorie seo
 * Ce fichier étend les types de base pour les spécialiser
 */

import { AgentOptions, AgentResult } from '../core/types';

/**
 * Options spécifiques aux agents seo
 */
export interface SeoAgentOptions extends AgentOptions {
  // Options spécifiques à cette catégorie
}

/**
 * Résultat spécifique aux agents seo
 */
export interface SeoResult extends AgentResult {
  // Données spécifiques à cette catégorie
}
