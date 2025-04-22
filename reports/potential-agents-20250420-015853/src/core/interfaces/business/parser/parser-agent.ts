/**
 * Agent d'analyse syntaxique
 * 
 * Fait partie de la Couche business - Logique métier spécifique et traitement des données
 * Responsabilité: Implémenter la logique métier spécifique, analyser et transformer les données
 */

import { BaseAgent } from '../../../core/interfaces/BaseAgent';

export interface ParserAgent extends BaseAgent {

  /**
   * Analyse syntaxiquement des données
   */
  parse(content: string, options?: ParsingOptions): Promise<ParsedData>;

  /**
   * Transforme des données parsées
   */
  transform(parsedData: ParsedData, targetFormat: string): Promise<any>;
}

// Types utilisés par l'interface
export type ParserOptions = Record<string, any>;
export interface ParserResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
