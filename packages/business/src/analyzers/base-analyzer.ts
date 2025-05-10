/**
 * Analyseur de base pour la couche Business
 */
import { AnalyzerConfig } from '../types';

export class BaseAnalyzer {
  protected config: AnalyzerConfig;

  constructor(config: AnalyzerConfig) {
    this.config = config;
  }

  async analyze(input: any): Promise<any> {
    // Implémentation de base
    return {};
  }
}
