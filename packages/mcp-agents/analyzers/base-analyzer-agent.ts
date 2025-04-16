// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

/**
 * BaseAnalyzerAgent - Classe de base pour tous les agents d'analyse
 * 
 * Cette classe implémente la couche d'abstraction pour les agents d'analyse
 * et fournit des fonctionnalités communes à tous les analyseurs.
 */

import { BaseMcpAgent, AgentContext, AgentResult, AgentMetadata, AgentConfig } from '../core/interfaces';

// Configuration spécifique aux agents d'analyse
export interface AnalyzerAgentConfig extends AgentConfig {
  // Configurations spécifiques aux analyseurs
  analysisDepth?: 'shallow' | 'normal' | 'deep';
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFilesToAnalyze?: number;
}

// Résultat spécifique aux agents d'analyse
export interface AnalysisResult<T = any> {
  // Résultats spécifiques aux analyseurs
  findings: Array<{
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    location?: {
      file?: string;
      line?: number;
      column?: number;
    };
    code?: string;
    suggestion?: string;
  }>;
  summary?: T;
  statistics?: {
    totalFiles?: number;
    filesAnalyzed?: number;
    totalFindings?: number;
    findingsBySeverity?: Record<string, number>;
  };
}

/**
 * Classe de base pour les agents d'analyse
 */
export abstract class BaseAnalyzerAgent<T = any> extends BaseMcpAgent<AnalysisResult<T>, AnalyzerAgentConfig> {
  /**
   * Exécute l'analyse et retourne le résultat
   */
  async execute(context: AgentContext): Promise<AgentResult<AnalysisResult<T>>> {
    return this.executeWithMetrics(context, async () => {
      // Valider le contexte
      if (!(await this.validate(context))) {
        return {
          success: false,
          error: 'Contexte d\'exécution invalide',
          warnings: ['Le contexte d\'exécution fourni ne contient pas les informations nécessaires']
        };
      }

      this.log('info', `Démarrage de l'analyse avec ${context.sourceFiles?.length || 0} fichiers sources`);

      try {
        // Appel à l'implémentation spécifique de l'analyse
        const analysisResult = await this.performAnalysis(context);
        
        // Construction du résultat
        const result: AgentResult<AnalysisResult<T>> = {
          success: true,
          data: analysisResult,
          // Calculer un score si possible
          score: this.calculateQualityScore(analysisResult)
        };
        
        this.log('info', `Analyse terminée avec ${analysisResult.findings.length} résultats`);
        
        return result;
      } catch (error) {
        this.log('error', `Erreur lors de l'analyse: ${error instanceof Error ? error.message : String(error)}`);
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });
  }

  /**
   * Implémentation spécifique de l'analyse à fournir par chaque sous-classe
   */
  protected abstract performAnalysis(context: AgentContext): Promise<AnalysisResult<T>>;

  /**
   * Calcule un score de qualité basé sur les résultats de l'analyse
   * Peut être surchargé par les sous-classes pour une logique spécifique
   */
  protected calculateQualityScore(result: AnalysisResult<T>): number {
    // Logique de base pour calculer un score sur 100
    // On part de 100 et on soustrait en fonction de la sévérité des problèmes
    let score = 100;

    // Les poids par sévérité
    const weights = {
      'info': 0,
      'warning': 1,
      'error': 3,
      'critical': 10
    };

    // Comptage par sévérité
    const countBySeverity: Record<string, number> = {};
    for (const finding of result.findings) {
      countBySeverity[finding.severity] = (countBySeverity[finding.severity] || 0) + 1;
    }

    // Calcul du score
    for (const [severity, count] of Object.entries(countBySeverity)) {
      const weight = weights[severity as keyof typeof weights] || 0;
      score -= Math.min(count * weight, 50); // Maximum 50 points de pénalité par catégorie
    }

    return Math.max(0, Math.min(100, score)); // Borner entre 0 et 100
  }

  /**
   * Filtre les fichiers à analyser selon les patterns d'inclusion et d'exclusion
   */
  protected filterFilesToAnalyze(files: string[]): string[] {
    if (!files || files.length === 0) return [];

    let result = [...files];
    
    // Appliquer les patterns d'inclusion
    if (this.config.includePatterns && this.config.includePatterns.length > 0) {
      result = result.filter(file => 
        this.config.includePatterns?.some(pattern => 
          new RegExp(pattern).test(file)
        )
      );
    }
    
    // Appliquer les patterns d'exclusion
    if (this.config.excludePatterns && this.config.excludePatterns.length > 0) {
      result = result.filter(file => 
        !this.config.excludePatterns?.some(pattern => 
          new RegExp(pattern).test(file)
        )
      );
    }
    
    // Limiter le nombre de fichiers
    if (this.config.maxFilesToAnalyze && result.length > this.config.maxFilesToAnalyze) {
      result = result.slice(0, this.config.maxFilesToAnalyze);
    }
    
    return result;
  }
}