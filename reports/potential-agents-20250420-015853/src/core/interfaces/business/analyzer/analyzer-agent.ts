/**
 * Agent d'analyse
 * 
 * Fait partie de la Couche business - Logique métier spécifique et traitement des données
 * Responsabilité: Implémenter la logique métier spécifique, analyser et transformer les données
 */

import { BaseAgent } from '../../../core/interfaces/BaseAgent';

export interface AnalyzerAgent extends BaseAgent {

  /**
   * Analyse des données
   */
  analyze(data: any, options?: AnalysisOptions): Promise<AnalysisResult>;

  /**
   * Obtient des insights à partir de données analysées
   */
  getInsights(analysisId: string): Promise<Insight[]>;
}

// Types utilisés par l'interface
export type AnalyzerOptions = Record<string, any>;
export interface AnalyzerResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
