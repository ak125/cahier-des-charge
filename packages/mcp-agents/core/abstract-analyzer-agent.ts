/**
 * Classe abstraite pour les agents d'analyse
 * Ces agents analysent du code, des configurations ou des données
 * Date: 16 avril 2025
 */

import { AbstractAgent } from './abstract-agent';
import { MCPAgent, AgentContext, AgentResult } from './mcp-agent';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '../utils/logger';

/**
 * Configuration spécifique aux agents d'analyse
 */
export interface AnalyzerConfig {
  inputPath?: string;           // Chemin du fichier ou répertoire à analyser
  outputDir: string;           // Répertoire de sortie pour les rapports
  reportFormat?: 'json' | 'md' | 'html' | 'csv' | 'pdf'; // Format de sortie des rapports
  generateReport?: boolean;    // Indique si un rapport doit être généré
  reportName?: string;         // Nom du rapport
  thresholds?: {               // Seuils pour les métriques
    [key: string]: number;     // Nom de la métrique -> valeur du seuil
  };
  verbose?: boolean;           // Mode verbeux
  excludePatterns?: string[];  // Patterns à exclure
  includePatterns?: string[];  // Patterns à inclure
  maxDepth?: number;           // Profondeur max d'analyse
  timeout?: number;            // Timeout en ms
}

/**
 * Représente un problème identifié lors de l'analyse
 */
export interface AnalysisIssue {
  type: string;                // Type de problème (validation, security, performance, etc.)
  severity: "info" | "warning" | "error" | "critical"; // Gravité du problème
  message: string;             // Message descriptif
  code?: string;               // Code d'identification ou référence
  location?: {                 // Emplacement du problème
    file?: string;            // Chemin du fichier
    line?: number;            // Numéro de ligne
    column?: number;          // Numéro de colonne
    offset?: number;          // Décalage dans le fichier
  } | string;                  // Ou chaîne simple pour compatibilité
  suggestion?: string;         // Suggestion de correction
}

/**
 * Représente un résultat d'analyse 
 */
export interface AnalysisResult {
  metrics: {                   // Métriques collectées
    [key: string]: number | string | boolean; // Nom de la métrique -> valeur
  };
  issues: AnalysisIssue[];     // Problèmes identifiés
  suggestions: string[];       // Suggestions d'amélioration
  metadata: Record<string, any>; // Métadonnées
  timestamp?: string;          // Timestamp de l'analyse
  executionTimeMs?: number;    // Temps d'exécution en ms
  passedChecks?: number;       // Nombre de vérifications réussies
  failedChecks?: number;       // Nombre de vérifications échouées
  score?: number;              // Score global (0-100)
}

/**
 * Classe abstraite pour les agents d'analyse
 */
export abstract class AbstractAnalyzerAgent<TConfig extends AnalyzerConfig = AnalyzerConfig> {
  // Propriétés d'identité de l'agent
  public abstract id: string;
  public abstract name: string;
  public abstract version: string;
  public abstract description: string;
  
  // Configuration de l'analyseur
  protected config: TConfig;
  
  // Résultat de l'analyse
  protected analysisResult: AnalysisResult = {
    metrics: {},
    issues: [],
    suggestions: [],
    metadata: {}
  };
  
  // Contenu du fichier ou des données à analyser
  protected filePath?: string;
  protected fileContent?: string;
  protected files: Map<string, string> = new Map();
  
  // Logger pour l'agent
  protected logger: Logger;
  
  // Erreurs, avertissements et artefacts générés
  protected errors: Error[] = [];
  protected warnings: string[] = [];
  protected artifacts: string[] = [];
  
  /**
   * Constructeur de l'agent d'analyse
   * @param config Configuration de l'agent
   */
  constructor(config: Partial<TConfig>) {
    // Initialiser la configuration avec les valeurs par défaut et celles fournies
    this.config = {
      outputDir: './output',
      reportFormat: 'md',
      generateReport: true,
      verbose: false
    } as unknown as TConfig;
    
    // Fusionner avec la configuration fournie
    Object.assign(this.config, config);
    
    // Créer un logger pour cet agent
    this.logger = new Logger(this.constructor.name, {
      outputToFile: true,
      logFilePath: path.join(this.config.outputDir, `${this.constructor.name}.log`),
      verbose: this.config.verbose
    });
  }
  
  /**
   * Initialisation de l'agent avec le contexte d'exécution
   */
  public async initialize(context: AgentContext): Promise<void> {
    this.logger.info(`Initialisation de l'agent ${this.name}`);
    
    // Mise à jour de la configuration à partir du contexte
    const contextConfig = context.getConfig<Partial<TConfig>>();
    Object.assign(this.config, contextConfig);
    
    // Créer le répertoire de sortie s'il n'existe pas
    if (this.config.outputDir) {
      await fs.ensureDir(this.config.outputDir);
    }
    
    // Charger le fichier spécifié si présent
    if (this.config.inputPath) {
      await this.loadInput(this.config.inputPath);
    }
    
    // Préparation spécifique de l'agent (méthode abstraite)
    if (this.prepare) {
      await this.prepare();
    }
  }
  
  /**
   * Exécute l'agent d'analyse
   */
  public async execute(context: AgentContext): Promise<void> {
    this.logger.info(`Exécution de l'analyse avec l'agent ${this.name} v${this.version}`);
    
    const startTime = Date.now();
    
    try {
      // Exécuter l'analyse (méthode abstraite à implémenter par les sous-classes)
      await this.analyze();
      
      // Collecter les métriques globales
      this.analysisResult.timestamp = new Date().toISOString();
      this.analysisResult.executionTimeMs = Date.now() - startTime;
      this.analysisResult.passedChecks = this.getPassedChecksCount();
      this.analysisResult.failedChecks = this.analysisResult.issues.filter(
        i => i.severity === 'error' || i.severity === 'critical'
      ).length;
      
      // Calculer le score si pas déjà défini
      if (this.analysisResult.score === undefined) {
        this.analysisResult.score = this.calculateScore();
      }
      
      // Générer le rapport si configuré
      if (this.config.generateReport) {
        const reportPath = await this.generateReport();
        if (reportPath) {
          this.artifacts.push(reportPath);
        }
      }
      
      this.logger.info(`Analyse terminée en ${this.analysisResult.executionTimeMs}ms avec un score de ${this.analysisResult.score}/100`);
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'analyse: ${error.message}`);
      this.errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * Méthode abstraite d'analyse à implémenter par les sous-classes
   */
  protected abstract analyze(): Promise<void>;
  
  /**
   * Charge les données à analyser
   * @param inputPath Chemin du fichier ou répertoire à analyser
   */
  protected async loadInput(inputPath: string): Promise<void> {
    try {
      const stats = await fs.stat(inputPath);
      
      if (stats.isFile()) {
        // Charger un fichier unique
        this.filePath = inputPath;
        this.fileContent = await fs.readFile(inputPath, 'utf-8');
        this.files.set(inputPath, this.fileContent);
        this.logger.debug(`Fichier chargé: ${inputPath}`);
      } else if (stats.isDirectory()) {
        // Charger un répertoire
        const files = await this.findFiles(inputPath);
        await Promise.all(files.map(async (file) => {
          try {
            const content = await fs.readFile(file, 'utf-8');
            this.files.set(file, content);
          } catch (err) {
            this.logger.warn(`Impossible de lire le fichier ${file}: ${err}`);
          }
        }));
        
        this.logger.debug(`${this.files.size} fichiers chargés depuis le répertoire ${inputPath}`);
      } else {
        throw new Error(`Le chemin spécifié n'est ni un fichier ni un répertoire: ${inputPath}`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement des données: ${error.message}`);
      throw new Error(`Échec du chargement des données: ${error.message}`);
    }
  }
  
  /**
   * Trouve tous les fichiers dans un répertoire selon les patterns d'inclusion/exclusion
   * @param directory Répertoire à explorer
   */
  private async findFiles(directory: string): Promise<string[]> {
    // TODO: Implémenter la recherche de fichiers récursive avec inclusion/exclusion
    return []; // Placeholder
  }
  
  /**
   * Génère un rapport basé sur les résultats d'analyse
   * @returns Chemin du rapport généré
   */
  protected async generateReport(): Promise<string | undefined> {
    if (this.config.generateReport === false) {
      this.logger.debug('Génération de rapport désactivée');
      return undefined;
    }
    
    try {
      // Créer le répertoire de sortie s'il n'existe pas
      await fs.ensureDir(this.config.outputDir);
      
      // Déterminer le nom du fichier
      const reportName = this.config.reportName || `${this.id}-report`;
      const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      const fileName = `${reportName}-${timestamp}.${this.config.reportFormat}`;
      const filePath = path.join(this.config.outputDir, fileName);
      
      // Générer le contenu du rapport selon le format
      let content: string;
      
      switch (this.config.reportFormat) {
        case 'json':
          content = this.generateJsonReport();
          break;
        case 'html':
          content = this.generateHtmlReport();
          break;
        case 'csv':
          content = this.generateCsvReport();
          break;
        case 'pdf':
          // La génération de PDF est généralement plus complexe et peut nécessiter des dépendances externes
          throw new Error('Format PDF non pris en charge pour l\'instant');
        case 'md':
        default:
          content = this.generateMarkdownReport();
          break;
      }
      
      // Écrire le rapport dans le fichier
      await fs.writeFile(filePath, content);
      
      this.logger.info(`Rapport généré: ${filePath}`);
      return filePath;
    } catch (error: any) {
      this.logger.error(`Erreur lors de la génération du rapport: ${error.message}`);
      return undefined;
    }
  }
  
  /**
   * Génère un rapport au format JSON
   */
  protected generateJsonReport(): string {
    return JSON.stringify({
      agent: {
        id: this.id,
        name: this.name,
        version: this.version
      },
      timestamp: this.analysisResult.timestamp,
      input: this.filePath || this.config.inputPath,
      result: this.analysisResult,
      errors: this.errors.map(err => err.message),
      warnings: this.warnings
    }, null, 2);
  }
  
  /**
   * Génère un rapport au format Markdown
   */
  protected generateMarkdownReport(): string {
    let markdown = `# Rapport d'analyse - ${this.name} v${this.version}\n\n`;
    
    // Informations générales
    markdown += `## Informations générales\n\n`;
    markdown += `- **Date d'analyse**: ${this.analysisResult.timestamp}\n`;
    markdown += `- **Score**: ${this.analysisResult.score}/100\n`;
    markdown += `- **Fichier analysé**: ${this.filePath || this.config.inputPath || 'N/A'}\n`;
    markdown += `- **Durée d'exécution**: ${this.analysisResult.executionTimeMs}ms\n\n`;
    
    // Métriques
    markdown += `## Métriques\n\n`;
    markdown += `| Métrique | Valeur |\n|----------|--------|\n`;
    
    for (const [key, value] of Object.entries(this.analysisResult.metrics)) {
      markdown += `| ${key} | ${value} |\n`;
    }
    
    markdown += `\n`;
    
    // Problèmes
    markdown += `## Problèmes détectés (${this.analysisResult.issues.length})\n\n`;
    
    if (this.analysisResult.issues.length === 0) {
      markdown += `Aucun problème détecté.\n\n`;
    } else {
      // Regrouper les problèmes par sévérité
      const issuesBySeverity = {
        critical: this.analysisResult.issues.filter(i => i.severity === 'critical'),
        error: this.analysisResult.issues.filter(i => i.severity === 'error'),
        warning: this.analysisResult.issues.filter(i => i.severity === 'warning'),
        info: this.analysisResult.issues.filter(i => i.severity === 'info')
      };
      
      // Afficher les problèmes critiques en premier
      for (const [severity, issues] of Object.entries(issuesBySeverity)) {
        if (issues.length > 0) {
          markdown += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${issues.length})\n\n`;
          
          for (const issue of issues) {
            markdown += `#### ${issue.code}: ${issue.message}\n\n`;
            
            if (issue.location && issue.location.file) {
              markdown += `- **Fichier**: ${issue.location.file}\n`;
              if (issue.location.line !== undefined) {
                markdown += `- **Ligne**: ${issue.location.line}\n`;
              }
            }
            
            if (issue.suggestion) {
              markdown += `- **Suggestion**: ${issue.suggestion}\n`;
            }
            
            markdown += `\n`;
          }
        }
      }
    }
    
    // Suggestions
    if (this.analysisResult.suggestions.length > 0) {
      markdown += `## Suggestions d'amélioration\n\n`;
      
      for (const suggestion of this.analysisResult.suggestions) {
        markdown += `- ${suggestion}\n`;
      }
      
      markdown += `\n`;
    }
    
    // Erreurs d'exécution
    if (this.errors.length > 0) {
      markdown += `## Erreurs d'exécution\n\n`;
      
      for (const error of this.errors) {
        markdown += `- ${error.message}\n`;
      }
      
      markdown += `\n`;
    }
    
    return markdown;
  }
  
  /**
   * Génère un rapport au format HTML
   */
  protected generateHtmlReport(): string {
    // Génération d'un rapport HTML basique
    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'analyse - ${this.name}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; margin-top: 30px; }
    h3 { color: #2c3e50; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .info { background-color: #d1ecf1; border-radius: 4px; padding: 10px; }
    .warning { background-color: #fff3cd; border-radius: 4px; padding: 10px; }
    .error { background-color: #f8d7da; border-radius: 4px; padding: 10px; }
    .critical { background-color: #dc3545; color: white; border-radius: 4px; padding: 10px; }
    .score-container { display: flex; align-items: center; gap: 10px; }
    .score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Rapport d'analyse - ${this.name} v${this.version}</h1>
  
  <div class="score-container">
    <div class="score-circle" style="background-color: ${this.getScoreColor(this.analysisResult.score || 0)}; color: white;">
      ${this.analysisResult.score}/100
    </div>
    <div>
      <p><strong>Date:</strong> ${this.analysisResult.timestamp}</p>
      <p><strong>Fichier analysé:</strong> ${this.filePath || this.config.inputPath || 'N/A'}</p>
      <p><strong>Durée d'exécution:</strong> ${this.analysisResult.executionTimeMs}ms</p>
    </div>
  </div>
  
  <h2>Métriques</h2>
  <table>
    <tr>
      <th>Métrique</th>
      <th>Valeur</th>
    </tr>`;
    
    for (const [key, value] of Object.entries(this.analysisResult.metrics)) {
      html += `
    <tr>
      <td>${key}</td>
      <td>${value}</td>
    </tr>`;
    }
    
    html += `
  </table>
  
  <h2>Problèmes détectés (${this.analysisResult.issues.length})</h2>`;
    
    if (this.analysisResult.issues.length === 0) {
      html += `
  <p>Aucun problème détecté.</p>`;
    } else {
      // Regrouper les problèmes par sévérité
      const issuesBySeverity = {
        critical: this.analysisResult.issues.filter(i => i.severity === 'critical'),
        error: this.analysisResult.issues.filter(i => i.severity === 'error'),
        warning: this.analysisResult.issues.filter(i => i.severity === 'warning'),
        info: this.analysisResult.issues.filter(i => i.severity === 'info')
      };
      
      // Afficher les problèmes par sévérité
      for (const [severity, issues] of Object.entries(issuesBySeverity)) {
        if (issues.length > 0) {
          html += `
  <h3>${severity.charAt(0).toUpperCase() + severity.slice(1)} (${issues.length})</h3>`;
          
          for (const issue of issues) {
            html += `
  <div class="${severity}">
    <h4>${issue.code}: ${issue.message}</h4>`;
            
            if (issue.location && issue.location.file) {
              html += `
    <p><strong>Fichier:</strong> ${issue.location.file}`;
              if (issue.location.line !== undefined) {
                html += `, <strong>Ligne:</strong> ${issue.location.line}`;
              }
              html += `</p>`;
            }
            
            if (issue.suggestion) {
              html += `
    <p><strong>Suggestion:</strong> ${issue.suggestion}</p>`;
            }
            
            html += `
  </div>`;
          }
        }
      }
    }
    
    // Suggestions
    if (this.analysisResult.suggestions.length > 0) {
      html += `
  <h2>Suggestions d'amélioration</h2>
  <ul>`;
      
      for (const suggestion of this.analysisResult.suggestions) {
        html += `
    <li>${suggestion}</li>`;
      }
      
      html += `
  </ul>`;
    }
    
    // Erreurs d'exécution
    if (this.errors.length > 0) {
      html += `
  <h2>Erreurs d'exécution</h2>
  <ul>`;
      
      for (const error of this.errors) {
        html += `
    <li>${error.message}</li>`;
      }
      
      html += `
  </ul>`;
    }
    
    html += `
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Génère un rapport au format CSV
   */
  protected generateCsvReport(): string {
    let csv = 'Type,Code,Severity,Message,File,Line,Column,Suggestion\n';
    
    // Ajouter les problèmes
    for (const issue of this.analysisResult.issues) {
      const row = [
        'issue',
        issue.code,
        issue.severity,
        `"${issue.message.replace(/"/g, '""')}"`,
        issue.location?.file || '',
        issue.location?.line || '',
        issue.location?.column || '',
        issue.suggestion ? `"${issue.suggestion.replace(/"/g, '""')}"` : ''
      ];
      
      csv += row.join(',') + '\n';
    }
    
    // Ajouter les suggestions
    for (const suggestion of this.analysisResult.suggestions) {
      const row = [
        'suggestion',
        '',
        'info',
        `"${suggestion.replace(/"/g, '""')}"`,
        '',
        '',
        '',
        ''
      ];
      
      csv += row.join(',') + '\n';
    }
    
    // Ajouter les erreurs
    for (const error of this.errors) {
      const row = [
        'error',
        '',
        'error',
        `"${error.message.replace(/"/g, '""')}"`,
        '',
        '',
        '',
        ''
      ];
      
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }
  
  /**
   * Utilitaire pour normaliser un AnalysisIssue afin d'assurer que location est toujours un objet ou undefined
   */
  protected normalizeIssue(issue: AnalysisIssue): AnalysisIssue {
    if (!issue.location) {
      return issue;
    }
    
    // Si location est une chaîne, la convertir en objet
    if (typeof issue.location === 'string') {
      return {
        ...issue,
        location: {
          file: issue.location,
          line: undefined,
          column: undefined,
          offset: undefined
        }
      };
    }
    
    return issue;
  }

  /**
   * Ajoute un problème au résultat d'analyse
   * @param issue Problème à ajouter
   */
  protected addIssue(issue: AnalysisIssue): void {
    // Normaliser l'issue avant de l'ajouter
    const normalizedIssue = this.normalizeIssue(issue);
    this.analysisResult.issues.push(normalizedIssue);
    
    const severity = normalizedIssue.severity === 'critical' ? '🔴' :
                     normalizedIssue.severity === 'error' ? '🟠' :
                     normalizedIssue.severity === 'warning' ? '🟡' : '🔵';
    
    const location = normalizedIssue.location ? 
      `${normalizedIssue.location.file}${normalizedIssue.location.line ? `:${normalizedIssue.location.line}` : ''}` : 
      'N/A';
    
    this.logger.debug(`${severity} Problème détecté: [${normalizedIssue.code}] ${normalizedIssue.message} (${location})`);
  }
  
  /**
   * Ajoute une suggestion au résultat d'analyse
   * @param suggestion Suggestion à ajouter
   */
  protected addSuggestion(suggestion: string): void {
    this.analysisResult.suggestions.push(suggestion);
    this.logger.debug(`💡 Suggestion: ${suggestion}`);
  }
  
  /**
   * Ajoute une métrique au résultat d'analyse
   * @param key Clé de la métrique
   * @param value Valeur de la métrique
   */
  protected addMetric(key: string, value: number | string | boolean): void {
    this.analysisResult.metrics[key] = value;
  }
  
  /**
   * Ajoute une erreur à la liste
   * @param error Erreur à ajouter
   */
  protected addError(error: Error | string): void {
    const err = typeof error === 'string' ? new Error(error) : error;
    this.errors.push(err);
    this.logger.error(err.message);
  }
  
  /**
   * Ajoute un avertissement à la liste
   * @param warning Message d'avertissement
   */
  protected addWarning(warning: string): void {
    this.warnings.push(warning);
    this.logger.warn(warning);
  }
  
  /**
   * Retourne le nombre de vérifications réussies
   * (par défaut, la somme des problèmes de type info)
   */
  protected getPassedChecksCount(): number {
    // Par défaut, on compte les problèmes de type info comme des vérifications réussies
    return this.analysisResult.issues.filter(i => i.severity === 'info').length;
  }
  
  /**
   * Calcule le score global (0-100) basé sur les problèmes détectés
   */
  protected calculateScore(): number {
    // Poids par sévérité pour le calcul du score
    const weights = {
      info: 0,
      warning: 1,
      error: 10,
      critical: 25
    };
    
    // Calculer la somme pondérée des problèmes
    let weightedSum = 0;
    let totalChecks = 1; // Éviter la division par zéro
    
    for (const issue of this.analysisResult.issues) {
      weightedSum += weights[issue.severity] || 0;
      totalChecks++;
    }
    
    // Calculer le score (inversé car plus de problèmes = score plus bas)
    // La formule est adaptable selon les besoins
    const maxPossibleScore = totalChecks * weights.critical;
    const normalizedScore = 1 - (weightedSum / maxPossibleScore);
    
    // Convertir en score sur 100 et arrondir
    return Math.round(normalizedScore * 100);
  }
  
  /**
   * Retourne une couleur en fonction du score
   * @param score Score entre 0 et 100
   */
  protected getScoreColor(score: number): string {
    if (score >= 90) return '#27ae60'; // Vert
    if (score >= 75) return '#2ecc71'; // Vert clair
    if (score >= 60) return '#f1c40f'; // Jaune
    if (score >= 40) return '#e67e22'; // Orange
    return '#e74c3c'; // Rouge
  }
  
  /**
   * Nettoie les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    this.logger.info(`Nettoyage de l'agent ${this.name}`);
    
    // Réinitialiser l'état pour future utilisation
    this.files.clear();
    this.fileContent = undefined;
    
    // Les erreurs et avertissements sont conservés pour la traçabilité
  }
  
  /**
   * Retourne les agents dont celui-ci dépend
   */
  public getDependencies(): string[] {
    return []; // Par défaut, aucune dépendance
  }
  
  /**
   * Traite la demande d'exécution et retourne le résultat
   */
  public async process(): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Créer un contexte minimal si nécessaire
      const context: AgentContext = {
        getConfig: () => this.config,
        logger: this.logger
      };
      
      // Initialiser l'agent
      await this.initialize(context);
      
      // Exécuter l'analyse
      await this.execute(context);
      
      // Nettoyer les ressources
      await this.cleanup();
      
      // Construire le résultat
      const result: AgentResult = {
        success: this.errors.length === 0,
        message: `Analyse terminée avec un score de ${this.analysisResult.score}/100`,
        data: this.analysisResult,
        errors: this.errors.length > 0 ? this.errors : undefined,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        artifacts: this.artifacts.length > 0 ? this.artifacts : undefined,
        metrics: {
          score: this.analysisResult.score,
          issues: this.analysisResult.issues.length,
          critical: this.analysisResult.issues.filter(i => i.severity === 'critical').length,
          errors: this.analysisResult.issues.filter(i => i.severity === 'error').length,
          warnings: this.analysisResult.issues.filter(i => i.severity === 'warning').length,
          info: this.analysisResult.issues.filter(i => i.severity === 'info').length,
          executionTimeMs: Date.now() - startTime
        },
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      return result;
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.errors.push(errorObj);
      
      return {
        success: false,
        message: `Échec de l'analyse: ${errorObj.message}`,
        errors: [errorObj],
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Préparation spécifique de l'agent avant l'analyse
   * Méthode optionnelle à implémenter dans les sous-classes
   */
  protected prepare?(): Promise<void>;
}