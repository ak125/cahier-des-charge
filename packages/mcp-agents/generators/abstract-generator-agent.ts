// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractGeneratorAgent, GeneratorConfig } from '../../core/abstract-generator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractGeneratorAgent, GeneratorConfig } from '../../core/abstract-generator-agent';
import { AgentContext } from '../../core/mcp-agent';

import { Agent, AgentResult, AgentStatus, AgentHealthState } from '../core/interfaces/base-agent';
import { GeneratorAgent, GeneratorConfig, GeneratedFile, GenerationResult } from '../core/interfaces/generator-agent';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger';

/**
 * Classe abstraite pour les agents générateurs
 * Fournit une implémentation de base des méthodes communes aux générateurs
 */
export abstract class AbstractGeneratorAgent<TConfig extends GeneratorConfig = GeneratorConfig> implements GeneratorAgent<TConfig> {
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
   * Chemin du fichier source (si applicable)
   */
  public filePath?: string;

  /**
   * Contenu du fichier source (si applicable)
   */
  public fileContent?: string;

  /**
   * Configuration du générateur
   */
  public config: TConfig;

  /**
   * Liste des fichiers générés
   */
  public generatedFiles: GeneratedFile[] = [];

  /**
   * Erreurs rencontrées pendant la génération
   */
  public errors: Error[] = [];

  /**
   * Avertissements générés pendant la génération
   */
  public warnings: string[] = [];

  /**
   * Chemins des templates chargés
   */
  protected templates: Record<string, string> = {};

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
   * @param filePath Chemin du fichier source (optionnel)
   * @param config Configuration du générateur
   */
  constructor(filePath?: string, config?: Partial<TConfig>) {
    this.filePath = filePath;
    this.config = {
      outputDir: './generated',
      format: 'ts',
      overwrite: false,
      fileNamePrefix: '',
      fileNameSuffix: '',
      ...(config || {})
    } as TConfig;
    
    this.logger = new Logger(this.getName() || 'AbstractGeneratorAgent');
  }

  /**
   * Initialise l'agent avec ses dépendances et configuration
   */
  public async initialize(): Promise<void> {
    this._status.health = AgentHealthState.STARTING;
    
    // Charge le fichier source si spécifié et pas encore chargé
    if (this.filePath && !this.fileContent) {
      try {
        // Vérifier si le fichier existe
        if (!await fs.pathExists(this.filePath)) {
          throw new Error(`Le fichier ${this.filePath} n'existe pas`);
        }
        
        // Charger le contenu du fichier
        this.fileContent = await fs.readFile(this.filePath, 'utf-8');
        this.logger.debug(`Fichier source chargé: ${this.filePath}`);
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        const newError = new Error(`Erreur lors du chargement du fichier source: ${errorMessage}`);
        this.errors.push(newError);
        throw newError;
      }
    }
    
    // S'assurer que le répertoire de sortie existe
    await fs.ensureDir(this.config.outputDir);
    
    // Charger les templates
    await this.loadTemplates();
    
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
      // Initialiser si ce n'est pas déjà fait
      if (this._status.health === AgentHealthState.STOPPED) {
        await this.initialize();
      }
      
      // Exécuter la génération
      const result = await this.generate();
      
      // Écrire les fichiers générés sur le disque
      await this.writeFiles();
      
      // Formater le code généré si nécessaire
      await this.formatOutput();
      
      // Valider les fichiers générés
      const isValid = await this.validateOutput();
      
      const endTime = Date.now();
      this._status.lastRunDuration = endTime - startTime;
      
      if (isValid && this.errors.length === 0) {
        this._status.successCount = (this._status.successCount || 0) + 1;
      } else {
        this._status.failureCount = (this._status.failureCount || 0) + 1;
      }
      
      // Construire les chemins vers les fichiers générés comme artefacts
      const artifacts = this.generatedFiles.map(file => file.path);
      
      return {
        success: isValid && this.errors.length === 0,
        message: isValid && this.errors.length === 0
          ? `Génération terminée avec succès: ${this.generatedFiles.length} fichier(s) généré(s)`
          : `Génération terminée avec des erreurs ou des avertissements`,
        data: {
          fileCount: this.generatedFiles.length,
          files: this.generatedFiles,
          stats: {
            fileCount: this.generatedFiles.length,
            totalLines: this.calculateTotalLines(),
            generationTime: endTime - startTime
          }
        },
        errors: this.errors,
        warnings: this.warnings,
        artifacts,
        metrics: {
          executionTime: endTime - startTime,
          fileCount: this.generatedFiles.length,
          lineCount: this.calculateTotalLines(),
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
      
      this.logger.error(`Erreur lors de l'exécution du générateur: ${errorObj.message}`);
      
      return {
        success: false,
        message: `Échec de la génération: ${errorObj.message}`,
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
    // Libérer les ressources potentiellement utilisées par le générateur
    this.fileContent = undefined;
    this.templates = {};
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
   * Charge les modèles de génération (templates)
   * À surcharger dans les classes dérivées pour charger des templates spécifiques
   */
  public async loadTemplates(): Promise<void> {
    // Utiliser les templates intégrés par défaut
    this.templates = {};
    
    // Si un répertoire de templates personnalisés est spécifié, les charger
    if (this.config.customTemplatesDir && await fs.pathExists(this.config.customTemplatesDir)) {
      try {
        const templateFiles = await fs.readdir(this.config.customTemplatesDir);
        
        for (const templateFile of templateFiles) {
          const templatePath = path.join(this.config.customTemplatesDir, templateFile);
          const templateName = path.basename(templateFile, path.extname(templateFile));
          
          if ((await fs.stat(templatePath)).isFile()) {
            this.templates[templateName] = await fs.readFile(templatePath, 'utf-8');
            this.logger.debug(`Template personnalisé chargé: ${templateName}`);
          }
        }
        
        this.logger.info(`${Object.keys(this.templates).length} templates personnalisés chargés depuis ${this.config.customTemplatesDir}`);
      } catch (error: any) {
        this.addWarning(`Erreur lors du chargement des templates personnalisés: ${error.message}`);
      }
    }
    
    // Si des templates sont spécifiés directement dans la configuration, les utiliser
    if (this.config.templates) {
      this.templates = {
        ...this.templates,
        ...this.config.templates
      };
      
      this.logger.info(`${Object.keys(this.config.templates).length} templates chargés depuis la configuration`);
    }
    
    // Si aucun template n'est chargé, avertir
    if (Object.keys(this.templates).length === 0) {
      this.addWarning('Aucun template chargé. La génération pourrait être compromise.');
    }
  }

  /**
   * Effectue la génération de code/fichiers
   * À implémenter dans les classes dérivées
   */
  public abstract generate(): Promise<GenerationResult>;

  /**
   * Écrit les fichiers générés sur le disque
   */
  public async writeFiles(): Promise<void> {
    if (this.generatedFiles.length === 0) {
      this.logger.warn('Aucun fichier à écrire');
      return;
    }
    
    for (const file of this.generatedFiles) {
      try {
        // S'assurer que le répertoire parent existe
        await fs.ensureDir(path.dirname(file.path));
        
        // Vérifier si le fichier existe déjà
        const fileExists = await fs.pathExists(file.path);
        
        if (fileExists && !this.config.overwrite) {
          this.addWarning(`Le fichier ${file.path} existe déjà et ne sera pas écrasé (overwrite=false)`);
          continue;
        }
        
        // Écrire le fichier
        await fs.writeFile(file.path, file.content);
        file.modified = fileExists; // Marquer comme modifié si le fichier existait déjà
        
        this.logger.info(`Fichier ${fileExists ? 'modifié' : 'créé'}: ${file.path}`);
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        this.addWarning(`Erreur lors de l'écriture du fichier ${file.path}: ${errorMessage}`);
      }
    }
    
    this.logger.info(`${this.generatedFiles.length} fichiers écrits dans ${this.config.outputDir}`);
  }

  /**
   * Ajoute un fichier généré
   */
  public addGeneratedFile(file: GeneratedFile): void {
    // Construire le chemin complet si ce n'est pas un chemin absolu
    if (!path.isAbsolute(file.path)) {
      file.path = path.join(this.config.outputDir, file.path);
    }
    
    // Appliquer les préfixes et suffixes aux noms de fichiers si configurés
    if (this.config.fileNamePrefix || this.config.fileNameSuffix) {
      const dir = path.dirname(file.path);
      const ext = path.extname(file.path);
      const baseName = path.basename(file.path, ext);
      
      file.path = path.join(
        dir, 
        `${this.config.fileNamePrefix}${baseName}${this.config.fileNameSuffix}${ext}`
      );
    }
    
    // Vérifier si un fichier avec le même chemin existe déjà dans la liste
    const existingIndex = this.generatedFiles.findIndex(f => f.path === file.path);
    
    if (existingIndex >= 0) {
      // Mettre à jour le fichier existant
      this.generatedFiles[existingIndex] = { ...file };
      this.logger.debug(`Fichier mis à jour: ${file.path}`);
    } else {
      // Ajouter le nouveau fichier
      this.generatedFiles.push({ ...file });
      this.logger.debug(`Fichier ajouté: ${file.path}`);
    }
  }

  /**
   * Ajoute un avertissement non critique
   */
  public addWarning(warning: string): void {
    this.warnings.push(warning);
    this.logger.warn(warning);
  }

  /**
   * Formate les fichiers générés selon des règles spécifiques
   * À surcharger dans les classes dérivées pour formatter selon le type de fichier
   */
  public async formatOutput(): Promise<void> {
    // Par défaut, ne fait rien
    // Les classes dérivées peuvent implémenter un formattage spécifique au type de fichier
  }

  /**
   * Vérifie si les fichiers générés sont valides
   * À surcharger dans les classes dérivées pour des validations spécifiques
   */
  public async validateOutput(): Promise<boolean> {
    // Par défaut, considère que les fichiers sont valides
    return this.generatedFiles.length > 0 && this.errors.length === 0;
  }

  /**
   * Calcule le nombre total de lignes générées
   */
  private calculateTotalLines(): number {
    return this.generatedFiles.reduce((total, file) => {
      return total + (file.content.split('\n').length);
    }, 0);
  }

  /**
   * Remplace les placeholders dans un template
   * @param template Contenu du template
   * @param replacements Variables à remplacer dans le template
   */
  protected renderTemplate(template: string, replacements: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
}