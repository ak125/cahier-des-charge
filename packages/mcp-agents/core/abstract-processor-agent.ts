/**
 * Classe abstraite pour les agents de traitement
 * Ces agents transforment les données, exécutent des opérations de traitement et modifient des fichiers
 */

import { AbstractAgent } from './abstract-agent';
import { AgentConfig } from './interfaces/base-agent';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '../utils/logger';

/**
 * Configuration spécifique aux agents de traitement
 */
export interface ProcessorConfig extends AgentConfig {
  inputDir?: string;           // Répertoire des fichiers d'entrée
  outputDir: string;          // Répertoire pour les fichiers traités
  backupDir?: string;         // Répertoire pour les sauvegardes
  createBackups?: boolean;    // Créer des sauvegardes avant traitement
  processingMode?: 'safe' | 'aggressive' | 'incremental'; // Mode de traitement
  dryRun?: boolean;           // Mode simulation sans écriture réelle
  concurrency?: number;       // Nombre d'opérations concurrentes
  filters?: {                 // Filtres pour les fichiers
    include?: string[];       // Extensions ou patterns à inclure
    exclude?: string[];       // Extensions ou patterns à exclure
  };
}

/**
 * Résultat de traitement d'un fichier
 */
export interface ProcessedFile {
  filePath: string;          // Chemin du fichier traité
  success: boolean;          // Succès de l'opération
  originalSize?: number;     // Taille originale (en octets)
  newSize?: number;          // Nouvelle taille (en octets)
  backupPath?: string;       // Chemin de la sauvegarde si créée
  changes?: {                // Description des changements effectués
    type: string;            // Type de changement
    description: string;     // Description du changement
    location?: {             // Localisation du changement
      line?: number;         // Numéro de ligne
      column?: number;       // Numéro de colonne
    };
  }[];
  errorMessage?: string;     // Message d'erreur si échec
  timestamp: string;         // Timestamp du traitement
  metadata?: Record<string, any>; // Métadonnées associées
}

/**
 * Classe abstraite pour les agents de traitement
 */
export abstract class AbstractProcessorAgent<TConfig extends ProcessorConfig = ProcessorConfig> extends AbstractAgent<TConfig> {
  // Liste des fichiers traités
  protected processedFiles: ProcessedFile[] = [];
  
  /**
   * Constructeur de l'agent de traitement
   * @param config Configuration de l'agent
   */
  constructor(filePath?: string, config?: Partial<TConfig>) {
    super(filePath, config);
    
    // Valeurs par défaut pour la configuration de traitement
    this.config = {
      ...this.config,
      createBackups: this.config.createBackups !== false,
      processingMode: this.config.processingMode || 'safe',
      dryRun: this.config.dryRun || false,
      concurrency: this.config.concurrency || 1
    } as TConfig;
  }
  
  /**
   * Initialisation de l'agent : prépare l'environnement pour le traitement
   */
  public async init(): Promise<void> {
    try {
      // Vérifier et créer les répertoires nécessaires
      if (this.config.outputDir) {
        await fs.ensureDir(this.config.outputDir);
        this.logger.info(`Répertoire de sortie préparé: ${this.config.outputDir}`);
      } else {
        throw new Error('Le répertoire de sortie doit être spécifié');
      }
      
      // Créer le répertoire de backup si demandé
      if (this.config.createBackups && this.config.backupDir) {
        await fs.ensureDir(this.config.backupDir);
        this.logger.info(`Répertoire de backup préparé: ${this.config.backupDir}`);
      }
      
      // Préparation spécifique à l'agent
      if (this.prepare) {
        await this.prepare();
      }
    } catch (error: any) {
      this.addError(`Erreur lors de l'initialisation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exécute le traitement des fichiers
   */
  protected async execute(): Promise<void> {
    try {
      // Identifier les fichiers à traiter
      const filesToProcess = await this.identifyFilesToProcess();
      
      this.logger.info(`${filesToProcess.length} fichier(s) identifié(s) pour traitement`);
      
      // Traiter les fichiers
      if (this.config.concurrency && this.config.concurrency > 1) {
        // Traitement en parallèle avec limite de concurrence
        const chunks: string[][] = [];
        const chunkSize = this.config.concurrency;
        
        for (let i = 0; i < filesToProcess.length; i += chunkSize) {
          chunks.push(filesToProcess.slice(i, i + chunkSize));
        }
        
        for (const chunk of chunks) {
          await Promise.all(chunk.map(file => this.processFile(file)));
        }
      } else {
        // Traitement séquentiel
        for (const file of filesToProcess) {
          await this.processFile(file);
        }
      }
      
      // Résumé du traitement
      const successCount = this.processedFiles.filter(f => f.success).length;
      const failureCount = this.processedFiles.length - successCount;
      
      this.logger.info(`Traitement terminé: ${successCount} fichier(s) traité(s), ${failureCount} échec(s)`);
      
      // Si des fichiers ont échoué, les lister
      if (failureCount > 0) {
        const failedFiles = this.processedFiles
          .filter(f => !f.success)
          .map(f => `${f.filePath}: ${f.errorMessage}`);
        
        this.logger.warn(`Fichiers en échec:\n${failedFiles.join('\n')}`);
      }
    } catch (error: any) {
      this.addError(`Erreur globale lors du traitement: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Identifie les fichiers à traiter en fonction de la configuration
   */
  protected async identifyFilesToProcess(): Promise<string[]> {
    if (this.filePath) {
      // Si un fichier spécifique est fourni, l'utiliser
      return [this.filePath];
    } else if (this.config.inputDir) {
      // Sinon, chercher les fichiers dans le répertoire d'entrée
      return this.findFilesInDirectory(this.config.inputDir);
    } else {
      throw new Error('Aucun fichier ou répertoire d\'entrée spécifié');
    }
  }
  
  /**
   * Recherche les fichiers à traiter dans un répertoire
   * @param dirPath Chemin du répertoire
   * @returns Liste des fichiers à traiter
   */
  protected async findFilesInDirectory(dirPath: string): Promise<string[]> {
    try {
      // Vérifier que le répertoire existe
      if (!(await fs.pathExists(dirPath))) {
        throw new Error(`Le répertoire n'existe pas: ${dirPath}`);
      }
      
      // Récupérer tous les fichiers récursivement
      const allFiles: string[] = [];
      
      const readDirRecursive = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Parcourir récursivement le sous-répertoire
            await readDirRecursive(entryPath);
          } else if (entry.isFile()) {
            // Ajouter le fichier à la liste
            allFiles.push(entryPath);
          }
        }
      };
      
      await readDirRecursive(dirPath);
      
      // Appliquer les filtres d'inclusion/exclusion
      return this.applyFilters(allFiles);
    } catch (error: any) {
      this.logger.error(`Erreur lors de la recherche des fichiers: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Applique les filtres d'inclusion et d'exclusion aux fichiers
   * @param files Liste de fichiers à filtrer
   * @returns Liste filtrée
   */
  protected applyFilters(files: string[]): string[] {
    if (!this.config.filters) {
      return files;
    }
    
    // Fonction pour vérifier si un fichier correspond à un pattern
    const matchesPattern = (filePath: string, patterns: string[]): boolean => {
      const fileName = path.basename(filePath);
      const extension = path.extname(filePath).slice(1); // Enlever le point
      
      return patterns.some(pattern => {
        if (pattern.startsWith('*.')) {
          // Filtre par extension
          const patternExt = pattern.slice(2);
          return extension === patternExt;
        } else if (pattern.includes('*')) {
          // Filtre avec glob
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(fileName);
        } else {
          // Correspondance exacte
          return fileName === pattern;
        }
      });
    };
    
    // Filtrer les fichiers
    return files.filter(file => {
      // Exclure les fichiers correspondant aux patterns d'exclusion
      if (this.config.filters?.exclude && matchesPattern(file, this.config.filters.exclude)) {
        return false;
      }
      
      // Si des patterns d'inclusion sont définis, vérifier la correspondance
      if (this.config.filters?.include && this.config.filters.include.length > 0) {
        return matchesPattern(file, this.config.filters.include);
      }
      
      // Par défaut, inclure le fichier
      return true;
    });
  }
  
  /**
   * Traite un fichier individuel
   * @param filePath Chemin du fichier à traiter
   * @returns Résultat du traitement
   */
  protected async processFile(filePath: string): Promise<ProcessedFile> {
    const result: ProcessedFile = {
      filePath,
      success: false,
      timestamp: new Date().toISOString()
    };
    
    try {
      this.logger.info(`Traitement du fichier: ${filePath}`);
      
      // Lire le contenu du fichier
      const content = await fs.readFile(filePath, 'utf-8');
      result.originalSize = Buffer.byteLength(content, 'utf-8');
      
      // Créer une sauvegarde si demandé
      if (this.config.createBackups && this.config.backupDir) {
        const backupPath = path.join(
          this.config.backupDir,
          `${path.basename(filePath)}.${Date.now()}.bak`
        );
        
        if (!this.config.dryRun) {
          await fs.copy(filePath, backupPath);
          result.backupPath = backupPath;
          this.logger.debug(`Backup créé: ${backupPath}`);
        } else {
          this.logger.debug(`[DRY RUN] Backup simulé: ${backupPath}`);
        }
      }
      
      // Traiter le contenu du fichier avec la méthode spécifique
      const { processedContent, changes } = await this.processContent(content, filePath);
      result.changes = changes;
      
      // Calculer la nouvelle taille
      result.newSize = Buffer.byteLength(processedContent, 'utf-8');
      
      // Sauvegarder les modifications si ce n'est pas un dry run
      if (!this.config.dryRun) {
        // Déterminer le chemin de sortie
        const outputPath = this.config.outputDir === this.config.inputDir
          ? filePath // Écraser le fichier original
          : path.join(this.config.outputDir, path.basename(filePath));
        
        // Écrire le fichier
        await fs.writeFile(outputPath, processedContent);
        result.filePath = outputPath;
        
        this.logger.info(`Fichier traité avec succès: ${outputPath} (${result.originalSize} -> ${result.newSize} bytes)`);
      } else {
        this.logger.info(`[DRY RUN] Fichier traité avec succès (${result.originalSize} -> ${result.newSize} bytes)`);
      }
      
      result.success = true;
    } catch (error: any) {
      result.errorMessage = error.message;
      this.logger.error(`Erreur lors du traitement de ${filePath}: ${error.message}`);
    }
    
    // Ajouter à la liste des fichiers traités
    this.processedFiles.push(result);
    
    return result;
  }
  
  /**
   * Génère un index des fichiers traités
   */
  protected async generateIndex(): Promise<string | undefined> {
    // Ne rien faire si aucun fichier n'a été traité
    if (this.processedFiles.length === 0) {
      return undefined;
    }
    
    try {
      // Construire l'index
      const index = {
        agent: {
          id: this.id,
          name: this.name,
          version: this.version
        },
        processing: {
          count: this.processedFiles.length,
          success: this.processedFiles.filter(f => f.success).length,
          failure: this.processedFiles.filter(f => !f.success).length,
          timestamp: new Date().toISOString()
        },
        files: this.processedFiles.map(file => ({
          path: file.filePath,
          success: file.success,
          originalSize: file.originalSize,
          newSize: file.newSize,
          changes: file.changes?.length || 0
        }))
      };
      
      // Chemin du fichier d'index
      const indexPath = path.join(this.config.outputDir, `${this.id}-processing-index.json`);
      
      // Écrire l'index
      if (!this.config.dryRun) {
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
        this.logger.info(`Index de traitement généré: ${indexPath}`);
        return indexPath;
      } else {
        this.logger.info(`[DRY RUN] Index de traitement simulé`);
        return undefined;
      }
    } catch (error: any) {
      this.addWarning(`Erreur lors de la génération de l'index: ${error.message}`);
      return undefined;
    }
  }
  
  /**
   * Génère un rapport de traitement
   */
  protected async generateReport(): Promise<string | undefined> {
    return this.generateIndex();
  }
  
  /**
   * Méthode abstraite de traitement de contenu à implémenter par les sous-classes
   * @param content Contenu original du fichier
   * @param filePath Chemin du fichier
   * @returns Contenu traité et liste des changements effectués
   */
  protected abstract processContent(content: string, filePath: string): Promise<{
    processedContent: string;
    changes: ProcessedFile['changes'];
  }>;
  
  /**
   * Méthode optionnelle de préparation avant le traitement
   */
  protected prepare?(): Promise<void>;
}