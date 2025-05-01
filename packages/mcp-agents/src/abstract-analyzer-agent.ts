import { AgentOptions, AgentResult, AnalysisOptions } from '@workspaces/mcp-types';
// Agent analyseur abstrait extrait de l'ancien mcp-core
import { MCPAgent } from './mcp-agent';

export abstract class AbstractAnalyzerAgent extends MCPAgent {
  constructor(options: AgentOptions) {
    super({
      ...options,
      category: 'analyzer',
      capabilities: [...(options.capabilities || []), 'analyze'],
    });
  }

  async execute(params: Record<string, any>): Promise<AgentResult> {
    try {
      // Validation des options d'analyse
      const analysisOptions = this.validateAnalysisOptions(params.analysisOptions);

      // Exécution de l'analyse
      const analysisResult = await this.analyze(analysisOptions);

      return this.createResult(true, analysisResult);
    } catch (error) {
      return this.createResult(false, null, [
        error instanceof Error ? error.message : String(error),
      ]);
    }
  }

  protected validateAnalysisOptions(options?: Partial<AnalysisOptions>): AnalysisOptions {
    // Options par défaut
    const defaultOptions: AnalysisOptions = {
      depth: 1,
      includeTests: false,
      targetPath: '.',
      analysisType: 'static',
    };

    // Fusion avec les options fournies
    const validatedOptions = { ...defaultOptions, ...options };

    // Validation supplémentaire spécifique à l'implémentation
    this.validateOptions(validatedOptions);

    return validatedOptions;
  }

  // Méthode abstraite à implémenter par les classes dérivées
  protected abstract analyze(options: AnalysisOptions): Promise<any>;

  // Peut être surchargée par les classes dérivées pour une validation supplémentaire
  protected validateOptions(options: AnalysisOptions): void {
    // Validation par défaut
    if (!options.targetPath) {
      throw new Error('Target path is required');
    }
  }
}
