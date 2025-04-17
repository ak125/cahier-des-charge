/**
 * Couche métier - Agents analytiques, générateurs, stratégies, outils de migration/QA/SEO
 * 
 * Responsabilité: Implémenter les fonctionnalités métier spécifiques, l'analyse des données, la génération de contenu, etc.
 */

import { BaseAgent } from '../base-agent';

/**
 * Agent responsable de l'analyse de données et de l'extraction d'informations
 */
export interface AnalyzerAgent extends BaseAgent {
  /**
   * Analyse des données selon un contexte spécifique
   *
   * @param data Les données à analyser
   * @param options Les options d'analyse
   * @returns Le résultat de l'analyse
   */
  analyze(data: any, options?: AnalysisOptions): Promise<AnalysisResult>;

  /**
   * Récupère les insights d'une analyse
   *
   * @param analysisId L'identifiant de l'analyse
   * @returns Les insights extraits de l'analyse
   */
  getInsights(analysisId: string): Promise<Insight[]>;

  /**
   * Fournit une explication détaillée d'une analyse
   *
   * @param analysisId L'identifiant de l'analyse
   * @returns L'explication de l'analyse
   */
  explainAnalysis(analysisId: string): Promise<string>;

}

/**
 * Agent responsable de la génération de code, contenu ou autres artefacts
 */
export interface GeneratorAgent extends BaseAgent {
  /**
   * Génère du contenu à partir de spécifications
   *
   * @param specifications Les spécifications pour la génération
   * @returns Le contenu généré
   */
  generate(specifications: GenerationSpec): Promise<GeneratedContent>;

  /**
   * Valide un contenu généré
   *
   * @param content Le contenu à valider
   * @returns Le résultat de la validation
   */
  validate(content: GeneratedContent): Promise<ValidationResult>;

  /**
   * Récupère l'historique des générations
   *
   * @param filters Les filtres pour l'historique
   * @returns L'historique des générations
   */
  getGenerationHistory(filters?: HistoryFilters): Promise<GenerationRecord[]>;

}

/**
 * Agent responsable de la validation et du contrôle qualité
 */
export interface ValidatorAgent extends BaseAgent {
  /**
   * Valide du contenu ou des données selon des règles spécifiques
   *
   * @param content Le contenu à valider
   * @param rules Les règles de validation
   * @returns Le résultat de la validation
   */
  validate(content: any, rules: ValidationRules): Promise<ValidationResult>;

  /**
   * Obtient des suggestions d'amélioration
   *
   * @param content Le contenu à améliorer
   * @returns Les suggestions d'amélioration
   */
  getSuggestions(content: any): Promise<Suggestion[]>;

  /**
   * Applique des corrections automatiques
   *
   * @param content Le contenu à corriger
   * @param fixOptions Les options de correction
   * @returns Le contenu corrigé
   */
  applyFixes(content: any, fixOptions?: FixOptions): Promise<CorrectedContent>;

}

/**
 * Agent responsable de l'analyse syntaxique et de la transformation de formats
 */
export interface ParserAgent extends BaseAgent {
  /**
   * Analyse et transforme du contenu structuré ou non
   *
   * @param content Le contenu à analyser
   * @param options Les options d'analyse
   * @returns Le résultat de l'analyse
   */
  parse(content: string | Buffer, options?: ParseOptions): Promise<ParseResult>;

  /**
   * Transforme un objet en chaîne de caractères formatée
   *
   * @param data L'objet à sérialiser
   * @param format Le format de sortie
   * @returns La représentation sérialisée
   */
  serialize(data: any, format: string): Promise<string>;

}

