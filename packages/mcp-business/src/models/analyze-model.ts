// Modèle de données pour les analyses
import { ModuleAnalysis } from '@workspaces/mcp-types';

export class AnalyzeModel {
  moduleAnalysis: ModuleAnalysis;

  constructor(moduleAnalysis: Partial<ModuleAnalysis>) {
    this.moduleAnalysis = {
      name: moduleAnalysis.name || '',
      dependencies: moduleAnalysis.dependencies || [],
      complexity: moduleAnalysis.complexity || 0,
      testCoverage: moduleAnalysis.testCoverage,
      analysisDate: moduleAnalysis.analysisDate || new Date(),
    };
  }

  get name(): string {
    return this.moduleAnalysis.name;
  }

  get dependencies(): string[] {
    return this.moduleAnalysis.dependencies;
  }

  get complexity(): number {
    return this.moduleAnalysis.complexity;
  }

  get testCoverage(): number | undefined {
    return this.moduleAnalysis.testCoverage;
  }

  get analysisDate(): Date {
    return this.moduleAnalysis.analysisDate;
  }

  isFlaggedForReview(): boolean {
    // Un module est marqué pour révision s'il est trop complexe ou a une couverture de tests trop faible
    const complexity = this.complexity;
    const testCoverage = this.testCoverage || 0;

    return complexity > 7 || testCoverage < 50;
  }

  update(updates: Partial<ModuleAnalysis>): void {
    this.moduleAnalysis = {
      ...this.moduleAnalysis,
      ...updates,
      // Toujours mettre à jour la date d'analyse lors d'une mise à jour
      analysisDate: new Date(),
    };
  }

  toJSON(): ModuleAnalysis {
    return { ...this.moduleAnalysis };
  }
}
