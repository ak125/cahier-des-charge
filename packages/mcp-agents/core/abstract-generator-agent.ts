/**
 * Classe abstraite pour les agents de génération
 * Ces agents génèrent du code, des documentations, des configurations ou d'autres artefacts
 * Date: 16 avril 2025
 */

import { MCPAgent, AgentContext, AgentResult } from './mcp-agent';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '../utils/logger';

/**
 * Configuration spécifique aux agents de génération
 */
export interface GeneratorConfig {
  outputDir: string;          // Répertoire pour les fichiers générés
  templatesDir?: string;      // Répertoire des templates
  overwrite?: boolean;        // Autoriser l'écrasement des fichiers existants
  dryRun?: boolean;           // Mode simulation sans écriture réelle
  format?: 'ts' | 'js' | 'json' | 'md' | 'yml' | 'html' | 'css' | 'txt' | string; // Format de sortie par défaut
  prettify?: boolean;         // Activer le formatage du code généré
  variables?: Record<string, any>;  // Variables à utiliser dans la génération
  skipExisting?: boolean;     // Ignorer les fichiers déjà existants
  verbose?: boolean;          // Mode verbeux
  createDirs?: boolean;       // Créer les répertoires parents si nécessaires
  context?: Record<string, any>; // Contexte spécifique à la génération
}

/**
 * Résultat de génération d'un fichier
 */
export interface GeneratedFile {
  path: string;               // Chemin du fichier généré
  content: string;            // Contenu du fichier
  type: string;               // Type du fichier (ex: 'code', 'config', 'doc', etc.)
  template?: string;          // Nom du template utilisé (si applicable)
  variables?: Record<string, any>;  // Variables utilisées pour ce fichier
}

/**
 * Classe abstraite pour les agents générateurs
 */
export abstract class AbstractGeneratorAgent<TConfig extends GeneratorConfig = GeneratorConfig> {
  // Propriétés d'identité de l'agent
  public abstract id: string;
  public abstract name: string;
  public abstract version: string;
  public abstract description: string;
  
  // Liste des fichiers générés
  protected generatedFiles: GeneratedFile[] = [];
  
  // Templates disponibles
  protected templates: Map<string, string> = new Map();
  
  // Configuration du générateur
  protected config: TConfig;
  
  // Logger pour l'agent
  protected logger: Logger;
  
  // Erreurs, avertissements et artefacts
  protected errors: Error[] = [];
  protected warnings: string[] = [];
  protected artifacts: string[] = [];
  
  /**
   * Constructeur de l'agent générateur
   * @param config Configuration de l'agent
   */
  constructor(config: Partial<TConfig>) {
    // Initialiser la configuration avec les valeurs par défaut et celles fournies
    this.config = {
      outputDir: './output',
      overwrite: true,
      dryRun: false,
      prettify: true,
      variables: {},
      skipExisting: false,
      createDirs: true,
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
   * Initialisation de l'agent : charge les templates et prépare l'environnement
   */
  public async initialize(context: AgentContext): Promise<void> {
    this.logger.info(`Initialisation de l'agent ${this.name}`);
    
    // Mise à jour de la configuration à partir du contexte
    const contextConfig = context.getConfig<Partial<TConfig>>();
    Object.assign(this.config, contextConfig);
    
    try {
      // S'assurer que le répertoire de sortie existe
      if (!this.config.dryRun) {
        await fs.ensureDir(this.config.outputDir);
        this.logger.info(`Répertoire de sortie préparé: ${this.config.outputDir}`);
      }
      
      // Charger les templates si un répertoire est spécifié
      if (this.config.templatesDir && await fs.pathExists(this.config.templatesDir)) {
        await this.loadTemplates(this.config.templatesDir);
        this.logger.info(`${this.templates.size} template(s) chargé(s)`);
      }
      
      // Préparation spécifique à l'agent
      if (this.prepare) {
        await this.prepare();
      }
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.logger.error(`Erreur lors de l'initialisation: ${errorMessage}`);
      this.errors.push(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }
  
  /**
   * Charge les templates depuis un répertoire
   * @param templatesDir Chemin du répertoire des templates
   */
  protected async loadTemplates(templatesDir: string): Promise<void> {
    try {
      // Vérifier que le répertoire existe
      if (!await fs.pathExists(templatesDir)) {
        throw new Error(`Le répertoire de templates n'existe pas: ${templatesDir}`);
      }
      
      // Lire le contenu du répertoire
      const files = await fs.readdir(templatesDir);
      
      // Charger chaque fichier comme un template
      for (const file of files) {
        const filePath = path.join(templatesDir, file);
        
        // Vérifier si c'est un fichier
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          // Charger le template
          const templateContent = await fs.readFile(filePath, 'utf-8');
          const templateName = path.parse(file).name;
          
          this.templates.set(templateName, templateContent);
          this.logger.debug(`Template chargé: ${templateName}`);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.logger.error(`Erreur lors du chargement des templates: ${errorMessage}`);
      throw error;
    }
  }
  
  /**
   * Utilise un template identifié par son nom et y applique les variables
   * @param templateName Nom du template
   * @param variables Variables à injecter dans le template
   */
  protected applyTemplate(templateName: string, variables: Record<string, any> = {}): string {
    // Vérifier que le template existe
    if (!this.templates.has(templateName)) {
      throw new Error(`Template non trouvé: ${templateName}`);
    }
    
    // Récupérer le template
    let content = this.templates.get(templateName)!;
    
    // Fusionner les variables globales avec les variables spécifiques
    const allVariables = {
      ...this.config.variables,
      ...variables
    };
    
    // Remplacer les variables dans le template (format simple {{variable}})
    for (const [key, value] of Object.entries(allVariables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, String(value));
    }
    
    return content;
  }
  
  /**
   * Exécute l'agent et retourne le résultat
   */
  public async execute(context: AgentContext): Promise<void> {
    this.logger.info(`Exécution de la génération avec l'agent ${this.name} v${this.version}`);
    
    const startTime = Date.now();
    
    try {
      // Réinitialiser les artefacts pour cette exécution
      this.generatedFiles = [];
      
      // Exécuter la logique de génération spécifique à cet agent
      await this.generate();
      
      // Si ce n'est pas un dry run, écrire les fichiers générés sur le disque
      if (!this.config.dryRun) {
        await this.writeGeneratedFiles();
      } else {
        this.logger.info(`Mode dry run: les fichiers ne seront pas écrits sur le disque`);
        
        // En mode dry run, afficher un résumé des fichiers qui auraient été générés
        this.logGeneratedFilesSummary();
      }
      
      this.logger.info(`Génération terminée en ${Date.now() - startTime}ms - ${this.generatedFiles.length} fichier(s) généré(s)`);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.logger.error(`Erreur lors de la génération: ${errorMessage}`);
      this.errors.push(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }
  
  /**
   * Méthode à implémenter dans les classes dérivées pour la logique de génération
   */
  protected abstract generate(): Promise<void>;
  
  /**
   * Écrit les fichiers générés sur le disque
   */
  protected async writeGeneratedFiles(): Promise<void> {
    for (const file of this.generatedFiles) {
      try {
        // Vérifier si le fichier existe déjà
        const fileExists = await fs.pathExists(file.path);
        
        // Si le fichier existe et qu'on ne doit pas l'écraser, passer au suivant
        if (fileExists && !this.config.overwrite && !this.config.skipExisting) {
          this.logger.warn(`Fichier existant ignoré (overwrite=false): ${file.path}`);
          continue;
        }
        
        // Si le fichier existe et qu'on doit l'ignorer, passer au suivant
        if (fileExists && this.config.skipExisting) {
          this.logger.info(`Fichier existant ignoré (skipExisting=true): ${file.path}`);
          continue;
        }
        
        // Créer le répertoire parent si nécessaire
        if (this.config.createDirs) {
          await fs.ensureDir(path.dirname(file.path));
        }
        
        // Formater le contenu si demandé et applicable
        let content = file.content;
        if (this.config.prettify) {
          content = await this.formatContent(content, file.path);
        }
        
        // Écrire le fichier
        await fs.writeFile(file.path, content);
        
        // Ajouter le fichier aux artefacts
        this.artifacts.push(file.path);
        
        this.logger.info(`Fichier généré: ${file.path}`);
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        this.logger.error(`Erreur lors de l'écriture du fichier ${file.path}: ${errorMessage}`);
        this.errors.push(error instanceof Error ? error : new Error(`Erreur écriture ${file.path}: ${errorMessage}`));
      }
    }
  }
  
  /**
   * Formatage du contenu selon le type de fichier
   * @param content Contenu à formater
   * @param filePath Chemin du fichier (pour déterminer le type)
   */
  protected async formatContent(content: string, filePath: string): Promise<string> {
    // Cette implémentation par défaut ne fait rien
    // Les sous-classes peuvent implémenter une logique de formatage spécifique
    return content;
  }
  
  /**
   * Ajoute un fichier à la liste des fichiers générés
   * @param filePath Chemin du fichier
   * @param content Contenu du fichier
   * @param type Type du fichier
   * @param template Nom du template utilisé (optionnel)
   * @param variables Variables utilisées (optionnel)
   */
  protected addGeneratedFile(filePath: string, content: string, type: string, template?: string, variables?: Record<string, any>): void {
    // Normaliser le chemin pour utiliser le séparateur de l'OS
    const normalizedPath = path.normalize(filePath);
    
    // Ajouter à la liste des fichiers générés
    this.generatedFiles.push({
      path: normalizedPath,
      content,
      type,
      template,
      variables
    });
    
    this.logger.debug(`Fichier ajouté à la liste des générations: ${normalizedPath}`);
  }
  
  /**
   * Génère du contenu depuis un template
   * @param templateName Nom du template
   * @param filePath Chemin du fichier à générer
   * @param variables Variables à injecter
   * @param type Type de fichier
   */
  protected generateFromTemplate(templateName: string, filePath: string, variables: Record<string, any> = {}, type: string = 'code'): void {
    try {
      // Appliquer le template
      const content = this.applyTemplate(templateName, variables);
      
      // Ajouter le fichier à la liste des fichiers générés
      this.addGeneratedFile(filePath, content, type, templateName, variables);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.logger.error(`Erreur lors de la génération depuis le template ${templateName}: ${errorMessage}`);
      this.errors.push(error instanceof Error ? error : new Error(`Erreur template ${templateName}: ${errorMessage}`));
    }
  }
  
  /**
   * Affiche un résumé des fichiers qui auraient été générés en mode dry run
   */
  protected logGeneratedFilesSummary(): void {
    this.logger.info(`Résumé des fichiers qui auraient été générés:`);
    
    for (const file of this.generatedFiles) {
      this.logger.info(`- ${file.path} (${file.type}${file.template ? `, template: ${file.template}` : ''})`);
    }
  }
  
  /**
   * Nettoie les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    this.logger.info(`Nettoyage de l'agent ${this.name}`);
    
    // Vider les templates pour libérer la mémoire
    this.templates.clear();
    
    // Les erreurs et artefacts sont conservés pour la traçabilité
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
      
      // Exécuter la génération
      await this.execute(context);
      
      // Nettoyer les ressources
      await this.cleanup();
      
      const endTime = Date.now();
      
      // Construire le résultat
      return {
        success: this.errors.length === 0,
        message: this.errors.length === 0 
          ? `${this.generatedFiles.length} fichier(s) généré(s) avec succès` 
          : `Génération terminée avec ${this.errors.length} erreur(s)`,
        data: {
          generatedFiles: this.generatedFiles.map(file => ({
            path: file.path,
            type: file.type,
            template: file.template
          }))
        },
        errors: this.errors.length > 0 ? this.errors : undefined,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        artifacts: this.artifacts.length > 0 ? this.artifacts : undefined,
        executionTimeMs: endTime - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // S'assurer que l'erreur est dans la liste des erreurs
      if (!this.errors.some(e => e.message === errorObj.message)) {
        this.errors.push(errorObj);
      }
      
      return {
        success: false,
        message: `Échec de la génération: ${errorObj.message}`,
        errors: this.errors,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
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
   * Préparation spécifique de l'agent avant la génération
   * Méthode optionnelle à implémenter dans les sous-classes
   */
  protected prepare?(): Promise<void>;
}