/**
 * Agent de génération
 * 
 * Fait partie de la Couche business - Logique métier spécifique et traitement des données
 * Responsabilité: Implémenter la logique métier spécifique, analyser et transformer les données
 */

import { BaseAgent } from '../../../core/interfaces/BaseAgent';

export interface GeneratorAgent extends BaseAgent {

  /**
   * Génère du contenu basé sur des instructions
   */
  generate(instructions: GenerationInstructions): Promise<GeneratedContent>;

  /**
   * Met à jour du contenu généré
   */
  update(contentId: string, updates: Partial<GenerationInstructions>): Promise<GeneratedContent>;
}

// Types utilisés par l'interface
export type GeneratorOptions = Record<string, any>;
export interface GeneratorResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
