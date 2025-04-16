// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

import { Agent, AgentResult, AgentStatus, AgentHealthState } from '../core/interfaces/base-agent';
import { AnalyzerAgent, AnalyzerConfig, AnalysisSection } from '../core/interfaces/analyzer-agent';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger';

/**
 * Classe abstraite pour les agents d'analyse
 * Fournit une implémentation de base des méthodes communes aux analyseurs
 */
export abstract class AbstractAnalyzerAgent<TConfig extends AnalyzerConfig = AnalyzerConfig> implements AnalyzerAgent<TConfig> {
  /**
   * Identifiant unique de l'agent
   */
  public abstract id: string;

  /**
   * Version de l'agent
   */
  public abstract version: string;

  /**
   * Nom descriptif de l'agent
   */
  public abstract name: string;

  /**
   * Description des fonctionnalités de l'agent
   */
  public abstract description: string;

  /**
   * Chemin du fichier analysé
   */
  public filePath?: string;

  /**
   * Contenu du fichier analysé
   */
  public fileContent?: string;

  /**
   * Configuration de l'analyseur
   */
  public config: TConfig;

  /**
   * Sections d'analyse produites par l'agent
   */
  public sections: AnalysisSection[] = [];

  /**
   * Erreurs rencontrées pendant l'analyse
   */
  public errors: Error[] = [];

  /**
   * Avertissements générés pendant l'analyse
   */
  public warnings: string[] = [];

  /**
   * Artéfacts générés (chemins de fichiers)
   */
  public artifacts: string[] = [];

  /**
   * Logger utilisé par l'agent
   */
  protected logger: Logger;

  /**
   * État de santé de l'agent
   */
  private _status: AgentStatus = {
    health: AgentHealthState.STOPPED,
    successCount: 0,
    failureCount: 0
  };

  /**
   * Constructeur
   * @param filePath Chemin du fichier à analyser (optionnel)
   * @param config Configuration de l'analyseur
   */
  constructor(filePath?: string, config?: Partial<TConfig>) {
    this.filePath = filePath;
    this.config = {
      timeout: 60000, // 60 secondes par défaut
      retryCount: 1,
      enabled: true,
      logLevel: 'info',
      maxDepth: 3,
      verbosity: 1,
      outputFormats: ['json', 'md'],
      ...(config || {})
    } as TConfig;
    
    this.logger = new Logger(this.getName() || 'AbstractAnalyzerAgent');
  }

  /**
   * Initialise l'agent avec ses dépendances et configuration
   */
  public async initialize(): Promise<void> {
    this._status.health = AgentHealthState.STARTING;
    
    // Charge le fichier si un chemin est fourni mais que le contenu n'est pas encore chargé
    if (this.filePath && !this.fileContent) {
      await this.loadFile();
    }

    this._status.health = AgentHealthState.HEALTHY;
    this.logger.info(`Agent ${this.getName()} (v${this.getVersion()}) initialisé`);
  }

  /**
   * Exécute l'agent et retourne le résultat
   */
  public async process(): Promise<AgentResult> {
    const startTime = Date.now();
    this._status.lastRun = new Date();
    
    try {
      // Vérifier si l'agent est activé
      if (!this.config.enabled) {
        this.logger.info(`Agent ${this.getName()} désactivé, traitement ignoré`);
        return {
          success: true,
          message: 'Agent désactivé, traitement ignoré',
          data: {},
          warnings: ['Agent désactivé']
        };
      }
      
      // Initialiser si ce n'est pas déjà fait
      if (this._status.health === AgentHealthState.STOPPED) {
        await this.initialize();
      }
      
      // Exécuter l'analyse
      await this.analyze();
      
      // Générer le rapport dans le format principal
      const reportPath = await this.generateReport(this.config.outputFormats?.[0] || 'json');
      if (reportPath) {
        this.artifacts.push(reportPath);
      }
      
      // Générer le même rapport dans les formats secondaires si demandé
      if (this.config.outputFormats && this.config.outputFormats.length > 1) {
        for (let i = 1; i < this.config.outputFormats.length; i++) {
          const additionalReportPath = await this.generateReport(this.config.outputFormats[i]);
          if (additionalReportPath) {
            this.artifacts.push(additionalReportPath);
          }
        }
      }
      
      const endTime = Date.now();
      this._status.lastRunDuration = endTime - startTime;
      this._status.successCount = (this._status.successCount || 0) + 1;
      
      return {
        success: this.errors.length === 0,
        message: this.errors.length === 0 
          ? 'Analyse terminée avec succès'
          : `Analyse terminée avec ${this.errors.length} erreurs`,
        data: {
          sectionCount: this.sections.length,
          sections: this.sections,
          artifacts: this.artifacts
        },
        errors: this.errors,
        warnings: this.warnings,
        artifacts: this.artifacts,
        metrics: {
          executionTime: endTime - startTime,
          sectionCount: this.sections.length,
          errorCount: this.errors.length,
          warningCount: this.warnings.length
        }
      };
    } catch (error) {
      const endTime = Date.now();
      this._status.lastRunDuration = endTime - startTime;
      this._status.failureCount = (this._status.failureCount || 0) + 1;
      this._status.health = AgentHealthState.DEGRADED;
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.errors.push(errorObj);
      
      this.logger.error(`Erreur lors de l'exécution de l'agent: ${errorObj.message}`);
      
      return {
        success: false,
        message: `Échec de l'analyse: ${errorObj.message}`,
        errors: [errorObj],
        warnings: this.warnings
      };
    }
  }

  /**
   * Renvoie le statut actuel de l'agent
   */
  public getStatus(): AgentStatus {
    return { ...this._status };
  }

  /**
   * Nettoie les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    // Libérer les ressources potentiellement utilisées par l'analyseur
    this.fileContent = undefined;
    this._status.health = AgentHealthState.STOPPED;
    this.logger.info(`Agent ${this.getName()} nettoyé`);
  }

  /**
   * Renvoie les agents dont celui-ci dépend
   * À surcharger dans les classes dérivées selon leurs dépendances
   */
  public getDependencies(): string[] {
    return [];
  }

  /**
   * Renvoie le nom de l'agent
   * Par défaut utilise le nom de la classe
   */
  public getName(): string {
    return this.name || this.constructor.name;
  }

  /**
   * Renvoie la version de l'agent
   * À surcharger dans les classes dérivées
   */
  public getVersion(): string {
    return this.version || '1.0.0';
  }

  /**
   * Charge le fichier à analyser
   */
  public async loadFile(): Promise<void> {
    if (!this.filePath) {
      throw new Error('Aucun chemin de fichier spécifié');
    }
    
    try {
      this.fileContent = await fs.readFile(this.filePath, 'utf-8');
      this.logger.debug(`Fichier chargé: ${this.filePath}`);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      const newError = new Error(`Erreur lors du chargement du fichier ${this.filePath}: ${errorMessage}`);
      this.errors.push(newError);
      throw newError;
    }
  }

  /**
   * Effectue l'analyse et génère les sections du rapport
   * À implémenter dans les classes dérivées
   */
  public abstract analyze(): Promise<void>;

  /**
   * Ajoute une section au rapport d'analyse
   */
  public addSection(id: string, title: string, content: string, category: string, metadata?: Record<string, any>): void {
    this.sections.push({
      id,
      title,
      content,
      category,
      metadata
    });
    this.logger.debug(`Section ajoutée: ${title}`);
  }

  /**
   * Ajoute un avertissement non critique
   */
  public addWarning(warning: string): void {
    this.warnings.push(warning);
    this.logger.warn(warning);
  }

  /**
   * Génère un rapport final à partir des sections d'analyse
   */
  public async generateReport(format: string = 'json'): Promise<string> {
    if (!this.config.outputDir) {
      this.config.outputDir = './reports';
    }
    
    await fs.ensureDir(this.config.outputDir);
    
    const fileName = `${path.basename(this.filePath || 'analysis')}-${this.getName()}-report`;
    const filePath = path.join(this.config.outputDir, `${fileName}.${format}`);
    
    try {
      let content: string;
      
      if (format === 'json') {
        const reportObj = {
          agent: {
            name: this.getName(),
            version: this.getVersion(),
            id: this.id
          },
          file: this.filePath,
          timestamp: new Date().toISOString(),
          sections: this.sections,
          errors: this.errors.map(err => err.message),
          warnings: this.warnings,
          statistics: {
            sectionCount: this.sections.length,
            errorCount: this.errors.length,
            warningCount: this.warnings.length
          }
        };
        content = JSON.stringify(reportObj, null, 2);
      } else if (format === 'md') {
        content = this.generateMarkdownReport();
      } else {
        throw new Error(`Format de rapport non supporté: ${format}`);
      }
      
      await fs.writeFile(filePath, content, 'utf-8');
      this.logger.info(`Rapport généré: ${filePath}`);
      
      return filePath;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.addWarning(`Erreur lors de la génération du rapport: ${errorMessage}`);
      return '';
    }
  }

  /**
   * Génère un rapport au format Markdown
   */
  protected generateMarkdownReport(): string {
    let md = `# Rapport d'analyse: ${path.basename(this.filePath || 'unknown')}\n\n`;
    md += `Généré par: ${this.getName()} v${this.getVersion()}\n`;
    md += `Date: ${new Date().toISOString()}\n\n`;
    
    if (this.errors.length > 0) {
      md += `## ⚠️ Erreurs (${this.errors.length})\n\n`;
      this.errors.forEach(err => {
        md += `- ${err.message}\n`;
      });
      md += '\n';
    }
    
    if (this.warnings.length > 0) {
      md += `## ⚠️ Avertissements (${this.warnings.length})\n\n`;
      this.warnings.forEach(warning => {
        md += `- ${warning}\n`;
      });
      md += '\n';
    }
    
    // Regrouper les sections par catégorie
    const sectionsByCategory: Record<string, AnalysisSection[]> = {};
    
    this.sections.forEach(section => {
      if (!sectionsByCategory[section.category]) {
        sectionsByCategory[section.category] = [];
      }
      sectionsByCategory[section.category].push(section);
    });
    
    // Générer les sections par catégorie
    Object.entries(sectionsByCategory).forEach(([category, sections]) => {
      md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      
      sections.forEach(section => {
        md += `### ${section.title}\n\n`;
        md += `${section.content}\n\n`;
      });
    });
    
    return md;
  }
}