/**
 * Interface pour les stratégies d'analyse SEO
 * Permet d'implémenter différentes stratégies d'analyse SEO qui peuvent être interchangées
 */
export interface ISeoAnalysisStrategy {
  /**
   * Identifiant unique de la stratégie
   */
  readonly id: string;

  /**
   * Nom descriptif de la stratégie
   */
  readonly name: string;

  /**
   * Priorité de la stratégie (plus le nombre est bas, plus la priorité est élevée)
   */
  readonly priority: number;

  /**
   * Vérifie si la stratégie est applicable à une URL ou un contenu donné
   * @param url URL de la page à analyser
   * @param content Contenu HTML de la page (optionnel)
   */
  isApplicable(url: string, content?: string): boolean;

  /**
   * Analyse une page et retourne les problèmes SEO détectés
   * @param url URL de la page à analyser
   * @param content Contenu HTML de la page
   * @param options Options supplémentaires spécifiques à la stratégie
   */
  analyze(url: string, content: string, options?: any): Promise<{
    score: number;
    issues: Array<{
      type: string;
      severity: 'critical' | 'warning' | 'info';
      message: string;
      details?: any;
    }>;
    metadata?: Record<string, any>;
  }>;

  /**
   * Suggère des corrections pour les problèmes identifiés
   * @param issues Liste des problèmes identifiés
   * @param content Contenu HTML à corriger
   */
  suggestFixes(issues: Array<any>, content: string): Promise<{
    fixedContent?: string;
    recommendations: Array<{
      issue: any;
      recommendation: string;
      autoFixable: boolean;
    }>;
  }>;
}