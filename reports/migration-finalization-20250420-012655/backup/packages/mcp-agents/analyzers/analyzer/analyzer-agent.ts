/**
 * Interface pour les agents d'analyse
 *
 * Les agents d'analyse sont responsables d'examiner des données ou du code
 * et de produire des résultats d'analyse structurés.
 */

import { Agent, AgentResult, AgentStatus } from './BaseAgent';

/**
 * Configuration de base pour un agent d'analyse
 */
export interface AnalyzerConfig {
  timeout?: number; // Délai d'expiration en ms
  retryCount?: number; // Nombre de tentatives en cas d'échec
  enabled?: boolean; // Si l'agent est activé
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // Niveau de journalisation
  maxDepth?: number; // Profondeur maximale d'analyse
  maxItems?: number; // Nombre maximum d'éléments à analyser
  rules?: Record<string, boolean>; // Règles d'analyse activées/désactivées
  filePath?: string; // Chemin du fichier à analyser
  outputDir?: string; // Répertoire de sortie pour les rapports générés
  verbosity?: number; // Niveau de verbosité de l'analyse (0-3)
  outputFormats?: string[]; // Formats de sortie pour les rapports ('json', 'md', 'html', etc.)
  [key: string]: any; // Configuration supplémentaire
}

/**
 * Structure d'une découverte/observation faite par un analyseur
 */
export interface AnalyzerFinding {
  id: string; // Identifiant unique de la découverte
  type: string; // Type de découverte (ex: 'security-vulnerability', 'code-smell', 'performance-issue')
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; // Niveau de sévérité
  message: string; // Description de la découverte
  location?: string; // Emplacement (fichier, URL, etc.)
  lineNumber?: number; // Numéro de ligne (pour les problèmes de code)
  codeSnippet?: string; // Extrait de code concerné
  suggestedFix?: string; // Suggestion de correction
  metadata?: Record<string, any>; // Métadonnées supplémentaires
}

/**
 * Structure des statistiques d'analyse
 */
export interface AnalysisStats {
  totalFiles?: number; // Nombre total de fichiers analysés
  totalLines?: number; // Nombre total de lignes analysées
  totalFindings?: number; // Nombre total de découvertes
  findingsByType?: Record<string, number>; // Nombre de découvertes par type
  findingsBySeverity?: Record<string, number>; // Nombre de découvertes par sévérité
  executionTime?: number; // Temps d'exécution en ms
  [key: string]: any; // Autres statistiques personnalisées
}

/**
 * Structure du résultat d'une analyse
 */
export interface AnalysisResult<TOutput = any> {
  success: boolean; // Si l'analyse s'est terminée avec succès
  findings: AnalyzerFinding[]; // Liste des découvertes
  stats?: AnalysisStats; // Statistiques d'analyse
  data?: TOutput; // Données de sortie spécifiques à l'analyseur
  timestamp: Date; // Horodatage de l'analyse
}

/**
 * Représente une section d'un rapport d'analyse
 */
export interface AnalysisSection {
  id: string; // Identifiant unique de la section
  title: string; // Titre de la section
  content: string; // Contenu de la section
  category: string; // Catégorie de la section (ex: 'security', 'performance', 'code-quality')
  severity?: 'info' | 'warning' | 'critical' | 'success'; // Sévérité des problèmes détectés dans cette section
  metadata?: Record<string, any>; // Métadonnées supplémentaires
}

/**
 * Interface pour les agents d'analyse
 * Les agents d'analyse examinent du code, des fichiers ou des structures de données
 * et produisent des rapports d'analyse sans effectuer de modifications.
 */
export interface AnalyzerAgent<TConfig extends AnalyzerConfig = AnalyzerConfig> extends Agent {
  config: TConfig; // Configuration spécifique de l'agent d'analyse
  sections: AnalysisSection[]; // Sections d'analyse produites par l'agent
  errors: Error[]; // Erreurs rencontrées pendant l'analyse
  warnings: string[]; // Avertissements générés pendant l'analyse

  /**
   * Charge le fichier à analyser
   */
  loadFile(): Promise<void>;

  /**
   * Effectue l'analyse et génère les sections du rapport
   */
  analyze(): Promise<void>;

  /**
   * Ajoute une section au rapport d'analyse
   */
  addSection(
    id: string,
    title: string,
    content: string,
    category: string,
    metadata?: Record<string, any>
  ): void;

  /**
   * Ajoute un avertissement non critique
   */
  addWarning(warning: string): void;

  /**
   * Génère un rapport final à partir des sections d'analyse
   */
  generateReport(format?: string): Promise<string>;
}
