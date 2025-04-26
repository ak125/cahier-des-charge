import { Injectable, Logger } from @nestjs/commonstructure-agent';
import { ISeoAnalysisStrategy } from ../interfaces/seo-strategy.interfacestructure-agent';

/**
 * Registre central pour les stratégies d'analyse SEO
 * Permet d'enregistrer, récupérer et orchestrer différentes stratégies
 */
@Injectable()
export class SeoStrategyRegistry {
  private readonly logger = new Logger(SeoStrategyRegistry.name);
  private strategies: Map<string, ISeoAnalysisStrategy> = new Map();

  /**
   * Enregistre une nouvelle stratégie d'analyse SEO
   * @param strategy La stratégie à enregistrer
   */
  registerStrategy(strategy: ISeoAnalysisStrategy): void {
    if (this.strategies.has(strategy.id)) {
      this.logger.warn(`Une stratégie avec l'ID ${strategy.id} est déjà enregistrée. Elle sera remplacée.`);
    }
    
    this.strategies.set(strategy.id, strategy);
    this.logger.log(`Stratégie d'analyse SEO '${strategy.name}' (${strategy.id}) enregistrée.`);
  }

  /**
   * Récupère une stratégie par son ID
   * @param strategyId ID de la stratégie
   */
  getStrategy(strategyId: string): ISeoAnalysisStrategy | null {
    return this.strategies.get(strategyId) || null;
  }

  /**
   * Récupère toutes les stratégies enregistrées
   */
  getAllStrategies(): ISeoAnalysisStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Récupère toutes les stratégies applicables à une URL
   * @param url URL de la page
   * @param content Contenu HTML (optionnel)
   */
  getApplicableStrategies(url: string, content?: string): ISeoAnalysisStrategy[] {
    return Array.from(this.strategies.values())
      .filter(strategy => strategy.isApplicable(url, content))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Analyse une URL en utilisant toutes les stratégies applicables
   * @param url URL de la page à analyser
   * @param content Contenu HTML de la page
   * @param options Options supplémentaires
   */
  async analyzeUrl(
    url: string,
    content: string,
    options?: { 
      strategyIds?: string[];
      aggregateResults?: boolean;
    }
  ): Promise<{
    overallScore: number;
    issuesByStrategy: Record<string, any>;
    metadata: Record<string, any>;
  }> {
    const { strategyIds, aggregateResults = true } = options || {};
    
    // Filtrer les stratégies à utiliser
    let strategiesToUse: ISeoAnalysisStrategy[];
    
    if (strategyIds && strategyIds.length > 0) {
      // Utiliser uniquement les stratégies spécifiées
      strategiesToUse = strategyIds
        .map(id => this.getStrategy(id))
        .filter(Boolean) as ISeoAnalysisStrategy[];
    } else {
      // Utiliser toutes les stratégies applicables
      strategiesToUse = this.getApplicableStrategies(url, content);
    }
    
    if (strategiesToUse.length === 0) {
      this.logger.warn(`Aucune stratégie applicable trouvée pour l'URL: ${url}`);
      return {
        overallScore: 0,
        issuesByStrategy: {},
        metadata: { noApplicableStrategies: true }
      };
    }
    
    // Exécuter chaque stratégie
    const results = await Promise.all(
      strategiesToUse.map(async strategy => {
        try {
          const result = await strategy.analyze(url, content);
          return {
            strategyId: strategy.id,
            strategyName: strategy.name,
            ...result
          };
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'exécution de la stratégie ${strategy.name} (${strategy.id}): ${error.message}`,
            error.stack
          );
          return {
            strategyId: strategy.id,
            strategyName: strategy.name,
            score: 0,
            issues: [{
              type: 'error',
              severity: 'critical',
              message: `Erreur lors de l'analyse: ${error.message}`,
              details: { error: error.message }
            }],
            metadata: { error: true }
          };
        }
      })
    );
    
    // Agréger les résultats
    const issuesByStrategy: Record<string, any> = {};
    let totalScore = 0;
    const metadata: Record<string, any> = {};
    
    results.forEach(result => {
      issuesByStrategy[result.strategyId] = {
        name: result.strategyName,
        score: result.score,
        issues: result.issues,
        metadata: result.metadata
      };
      
      totalScore += result.score;
      
      // Fusionner les métadonnées
      if (result.metadata) {
        Object.assign(metadata, { [result.strategyId]: result.metadata });
      }
    });
    
    // Calculer le score global
    const overallScore = aggregateResults
      ? Math.round(totalScore / results.length)
      : 0;
    
    return {
      overallScore,
      issuesByStrategy,
      metadata: {
        ...metadata,
        analyzedAt: new Date().toISOString(),
        url,
        strategiesUsed: results.length
      }
    };
  }
}