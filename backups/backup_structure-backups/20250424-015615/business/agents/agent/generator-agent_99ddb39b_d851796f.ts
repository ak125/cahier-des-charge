import { BaseAgent } from ../base-agentstructure-agent';

/**
 * Interface pour les agents de génération de code, contenu ou configuration
 */
export interface GeneratorAgent extends BaseAgent {
  /** Génère du contenu à partir des données d'entrée */
  generate(input: Record<string, any>): Promise<Record<string, any>>;
  
  /** Configuration spécifique à la génération */
  generationConfig?: Record<string, any>;
  
  /** Formats de sortie supportés */
  outputFormats?: string[];
  
  /** Vérifie si le contenu généré est valide */
  validateOutput?(output: Record<string, any>): boolean;
  
  /** Options de formatage de la sortie */
  formatOptions?: Record<string, any>;
}
