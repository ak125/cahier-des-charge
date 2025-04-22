import { BaseAgent } from '../base-agent';

/**
 * Interface pour les agents d'analyse de données ou de code
 */
export interface AnalyzerAgent extends BaseAgent {
  /** Réalise une analyse sur les données d'entrée */
  analyze(input: Record<string, any>): Promise<Record<string, any>>;
  
  /** Configuration spécifique à l'analyse */
  analysisConfig?: Record<string, any>;
  
  /** Vérifie si les données d'entrée sont valides pour l'analyse */
  validateInput?(input: Record<string, any>): boolean;
  
  /** Liste des formats d'entrée supportés */
  supportedFormats?: string[];
}
