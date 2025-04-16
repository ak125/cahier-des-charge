import { Agent, AgentResult } from './base-agent';

/**
 * Interface pour les agents générateurs
 * 
 * Les agents générateurs sont responsables de produire du contenu, du code 
 * ou d'autres artefacts selon des paramètres d'entrée.
 */

/**
 * Structure d'un avertissement généré pendant la génération
 */
export interface GeneratorWarning {
  id: string;              // Identifiant unique de l'avertissement
  type: string;            // Type d'avertissement
  severity: 'high' | 'medium' | 'low' | 'info'; // Niveau de sévérité
  message: string;         // Message d'avertissement
  location?: string;       // Emplacement concerné
  context?: any;           // Contexte associé à l'avertissement
}

/**
 * Structure des statistiques de génération
 */
export interface GenerationStats {
  executionTime?: number;         // Temps d'exécution en ms
  resourcesGenerated?: number;    // Nombre de ressources générées
  totalSize?: number;             // Taille totale générée (en octets)
  warnings?: number;              // Nombre d'avertissements
  [key: string]: any;             // Autres statistiques personnalisées
}

/**
 * Structure du résultat d'une génération
 */
export interface GenerationResult<TOutput = any> {
  success: boolean;              // Si la génération s'est terminée avec succès
  output: TOutput;               // Résultat de la génération
  warnings?: GeneratorWarning[]; // Avertissements générés
  stats?: GenerationStats;       // Statistiques de génération
  metadata?: Record<string, any>; // Métadonnées supplémentaires
  timestamp: Date;               // Horodatage de la génération
}

/**
 * Structure des options de génération
 */
export interface GeneratorOptions {
  format?: string;               // Format de sortie
  version?: string;              // Version du format ou standard à utiliser
  optimize?: boolean;            // Si le résultat doit être optimisé
  dryRun?: boolean;              // Si on doit seulement simuler la génération
  templates?: Record<string, string>; // Templates à utiliser
  [key: string]: any;            // Autres options personnalisées
}

/**
 * Configuration de base pour un agent générateur
 */
export interface GeneratorConfig {
  /**
   * Répertoire de sortie pour les fichiers générés
   */
  outputDir: string;
  
  /**
   * Format des fichiers générés (si applicable)
   */
  format?: string;
  
  /**
   * Modèles à utiliser pour la génération
   */
  templates?: Record<string, string>;
  
  /**
   * Si les fichiers existants peuvent être écrasés
   */
  overwrite?: boolean;
  
  /**
   * Templates customisés à utiliser à la place des templates par défaut
   */
  customTemplatesDir?: string;
  
  /**
   * Préfixe pour les noms de fichiers générés
   */
  fileNamePrefix?: string;
  
  /**
   * Suffixe pour les noms de fichiers générés
   */
  fileNameSuffix?: string;
  
  /**
   * Options supplémentaires spécifiques à l'agent
   */
  [key: string]: any;
}

/**
 * Représente un fichier généré
 */
export interface GeneratedFile {
  /**
   * Chemin du fichier généré
   */
  path: string;
  
  /**
   * Contenu du fichier généré
   */
  content: string;
  
  /**
   * Type de fichier généré
   */
  type: string;
  
  /**
   * Modèle utilisé pour la génération
   */
  template?: string;
  
  /**
   * Si le fichier a été modifié par rapport à une version existante
   */
  modified?: boolean;
  
  /**
   * Métadonnées supplémentaires
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat de la génération
 */
export interface GenerationResult {
  /**
   * Si la génération a réussi
   */
  success: boolean;
  
  /**
   * Liste des fichiers générés
   */
  files: GeneratedFile[];
  
  /**
   * Statistiques de génération
   */
  stats: {
    fileCount: number;
    totalLines: number;
    generationTime: number; // en ms
  };
  
  /**
   * Erreurs rencontrées pendant la génération
   */
  errors?: Error[];
  
  /**
   * Avertissements générés pendant la génération
   */
  warnings?: string[];
  
  /**
   * Métadonnées supplémentaires
   */
  metadata?: Record<string, any>;
}

/**
 * Interface pour les agents générateurs
 * Les agents générateurs produisent du code, des documents ou d'autres artefacts
 * à partir de spécifications ou modèles.
 */
export interface GeneratorAgent<TConfig extends GeneratorConfig = GeneratorConfig> extends Agent {
  /**
   * Configuration spécifique de l'agent générateur
   */
  config: TConfig;
  
  /**
   * Liste des fichiers générés
   */
  generatedFiles: GeneratedFile[];
  
  /**
   * Erreurs rencontrées pendant la génération
   */
  errors: Error[];
  
  /**
   * Avertissements générés pendant la génération
   */
  warnings: string[];
  
  /**
   * Charge les modèles de génération
   */
  loadTemplates(): Promise<void>;
  
  /**
   * Effectue la génération de code/fichiers
   */
  generate(): Promise<GenerationResult>;
  
  /**
   * Écrit les fichiers générés sur le disque
   */
  writeFiles(): Promise<void>;
  
  /**
   * Ajoute un fichier généré
   */
  addGeneratedFile(file: GeneratedFile): void;
  
  /**
   * Ajoute un avertissement non critique
   */
  addWarning(warning: string): void;
  
  /**
   * Formate les fichiers générés selon des règles spécifiques
   */
  formatOutput(): Promise<void>;
  
  /**
   * Vérifie si les fichiers générés sont valides
   */
  validateOutput(): Promise<boolean>;
}