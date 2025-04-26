/**
 * business.ts
 * 
 * Interfaces pour la couche business de l'architecture MCP OS en 3 couches
 * 
 * Cette couche est responsable de:
 * - Analyser les données et systèmes
 * - Générer du contenu et des modèles
 * - Valider les règles métier
 * - Gérer les agents spécifiques au domaine métier
 */

import { 
  BaseAgent, 
  AnalysisOptions, 
  AnalysisResult,
  GenerationSpec,
  GeneratedContent,
  ValidationResult,
  ValidationRules,
  Suggestion,
  FixOptions,
  CorrectedContent,
  ParseOptions,
  ParseResult
} from ./BaseAgentstructure-agent';

/**
 * Interface de base pour tous les agents de la couche business
 */
export interface BusinessAgent extends BaseAgent {
  /**
   * Récupère l'état actuel de l'agent business
   */
  getState?(): Promise<Record<string, any>>;
}

/**
 * Interface pour les agents analyseurs
 */
export interface AnalyzerAgent extends BusinessAgent {
  /**
   * Analyse des données ou un système
   */
  analyze(data: any, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  /**
   * Identifie les problèmes potentiels
   */
  identifyIssues?(data: any): Promise<Array<Record<string, any>>>;
  
  /**
   * Récupère les métadonnées de l'analyse
   */
  getAnalysisMetadata?(analysisId: string): Promise<Record<string, any>>;
  
  /**
   * Compare deux éléments pour détecter les différences
   */
  compare?(item1: any, item2: any, options?: AnalysisOptions): Promise<Record<string, any>>;
}

/**
 * Interface pour les agents générateurs
 */
export interface GeneratorAgent extends BusinessAgent {
  /**
   * Génère du contenu basé sur une spécification
   */
  generate(spec: GenerationSpec): Promise<GeneratedContent>;
  
  /**
   * Récupère les modèles disponibles pour la génération
   */
  getTemplates?(): Promise<Record<string, any>[]>;
  
  /**
   * Modifie du contenu existant
   */
  modify?(content: any, modifications: Record<string, any>): Promise<any>;
  
  /**
   * Récupère l'historique des générations
   */
  getGenerationHistory?(filters?: Record<string, any>): Promise<Record<string, any>[]>;
}

/**
 * Interface pour les agents validateurs
 */
export interface ValidatorAgent extends BusinessAgent {
  /**
   * Valide du contenu selon des règles spécifiées
   */
  validate(content: any, rules?: ValidationRules): Promise<ValidationResult>;
  
  /**
   * Génère des suggestions pour corriger les problèmes
   */
  suggest?(content: any, options?: Record<string, any>): Promise<Suggestion[]>;
  
  /**
   * Applique des corrections automatiques
   */
  fix?(content: any, options?: FixOptions): Promise<CorrectedContent>;
  
  /**
   * Récupère les règles de validation disponibles
   */
  getValidationRules?(): Promise<ValidationRules>;
}

/**
 * Interface pour les agents analyseurs de code
 */
export interface CodeAnalyzerAgent extends AnalyzerAgent {
  /**
   * Analyse une base de code spécifique
   */
  analyzeCode(code: string, language: string, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  /**
   * Détecte les problèmes de qualité dans le code
   */
  detectCodeIssues?(code: string, language: string): Promise<Record<string, any>[]>;
  
  /**
   * Analyse la complexité du code
   */
  analyzeComplexity?(code: string, language: string): Promise<Record<string, any>>;
  
  /**
   * Détecte les vulnérabilités de sécurité
   */
  detectVulnerabilities?(code: string, language: string): Promise<Record<string, any>[]>;
}

/**
 * Interface pour les agents de parsing
 */
export interface ParserAgent extends BusinessAgent {
  /**
   * Parse du contenu selon un format spécifié
   */
  parse(content: string, options?: ParseOptions): Promise<ParseResult>;
  
  /**
   * Vérifie si le contenu est valide pour un format donné
   */
  isValid?(content: string, format: string): Promise<boolean>;
  
  /**
   * Récupère les formats supportés par le parser
   */
  getSupportedFormats?(): string[];
  
  /**
   * Transforme le contenu en une autre représentation
   */
  transform?(parsed: any, targetFormat: string): Promise<any>;
}

/**
 * Interface pour les agents SEO
 */
export interface SEOAgent extends BusinessAgent {
  /**
   * Analyse les aspects SEO d'un contenu
   */
  analyzeSEO(content: any, url?: string): Promise<Record<string, any>>;
  
  /**
   * Génère des méta-tags optimisés pour le SEO
   */
  generateMetaTags?(content: any): Promise<Record<string, string>>;
  
  /**
   * Optimise un contenu pour le SEO
   */
  optimizeContent?(content: string, keywords?: string[]): Promise<string>;
  
  /**
   * Vérifie les liens canoniques
   */
  validateCanonicals?(urls: string[]): Promise<Record<string, any>>;
}

