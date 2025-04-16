/**
 * Utilitaire de gestion de fichiers pour les agents
 * Fournit des fonctions utilitaires pour manipuler les fichiers de manière cohérente
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import { promisify } from 'util';
import { Logger } from './logger';

const globPromise = promisify(glob);
const logger = new Logger('FileManager');

/**
 * Options pour la lecture de fichiers
 */
export interface ReadFileOptions {
  encoding?: BufferEncoding;
  flag?: string;
  normalize?: boolean; // Normaliser les fins de ligne
  cache?: boolean;     // Mettre en cache le contenu
}

/**
 * Options pour l'écriture de fichiers
 */
export interface WriteFileOptions {
  encoding?: BufferEncoding;
  flag?: string;
  mode?: number;
  createDirectories?: boolean; // Créer automatiquement les répertoires parents
  dryRun?: boolean; // Ne pas réellement écrire le fichier (utile pour les tests)
  backup?: boolean; // Créer une copie de sauvegarde avant d'écrire
}

/**
 * Cache mémoire pour les fichiers (optimisation)
 */
const fileCache = new Map<string, { content: string; timestamp: number }>();
const FILE_CACHE_TTL = 60000; // 1 minute

/**
 * Classe utilitaire pour la gestion des fichiers
 */
export class FileManager {
  /**
   * Lit le contenu d'un fichier
   * @param filePath Chemin du fichier à lire
   * @param options Options de lecture
   */
  public static async readFile(
    filePath: string,
    options: ReadFileOptions = {}
  ): Promise<string> {
    const fullPath = path.resolve(filePath);
    
    // Vérifier le cache si activé
    if (options.cache) {
      const cached = fileCache.get(fullPath);
      if (cached) {
        const now = Date.now();
        // Vérifier que le cache est encore valide
        if (now - cached.timestamp < FILE_CACHE_TTL) {
          logger.debug(`Lecture depuis le cache: ${filePath}`);
          return cached.content;
        }
        // Cache expiré, le supprimer
        fileCache.delete(fullPath);
      }
    }
    
    // Vérifier que le fichier existe
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`Le fichier n'existe pas: ${fullPath}`);
    }
    
    try {
      const content = await fs.readFile(fullPath, {
        encoding: options.encoding || 'utf-8',
        flag: options.flag
      });
      
      // Normaliser les fins de ligne si demandé
      let normalizedContent = content.toString();
      if (options.normalize) {
        normalizedContent = normalizedContent.replace(/\r\n/g, '\n');
      }
      
      // Mettre en cache si activé
      if (options.cache) {
        fileCache.set(fullPath, { 
          content: normalizedContent, 
          timestamp: Date.now() 
        });
      }
      
      return normalizedContent;
    } catch (error: any) {
      logger.error(`Erreur lors de la lecture du fichier ${fullPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Écrit du contenu dans un fichier
   * @param filePath Chemin du fichier à écrire
   * @param content Contenu à écrire
   * @param options Options d'écriture
   */
  public static async writeFile(
    filePath: string,
    content: string,
    options: WriteFileOptions = {}
  ): Promise<void> {
    const fullPath = path.resolve(filePath);
    
    try {
      // Créer les répertoires parents si nécessaire
      if (options.createDirectories) {
        await fs.ensureDir(path.dirname(fullPath));
      }
      
      // Créer une sauvegarde si demandé et si le fichier existe
      if (options.backup && await fs.pathExists(fullPath)) {
        const backupPath = `${fullPath}.bak`;
        await fs.copy(fullPath, backupPath);
        logger.debug(`Sauvegarde créée: ${backupPath}`);
      }
      
      // Ne pas écrire en mode dry run
      if (options.dryRun) {
        logger.info(`[DRY RUN] Écriture de ${content.length} caractères dans ${fullPath}`);
        return;
      }
      
      // Écrire le fichier
      await fs.writeFile(fullPath, content, {
        encoding: options.encoding || 'utf-8',
        flag: options.flag,
        mode: options.mode
      });
      
      // Invalider le cache s'il existe
      if (fileCache.has(fullPath)) {
        fileCache.delete(fullPath);
      }
      
      logger.debug(`Fichier écrit: ${fullPath}`);
    } catch (error: any) {
      logger.error(`Erreur lors de l'écriture du fichier ${fullPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recherche des fichiers selon un pattern glob
   * @param pattern Pattern glob à rechercher
   * @param options Options de recherche
   */
  public static async findFiles(
    pattern: string,
    baseDir: string = process.cwd()
  ): Promise<string[]> {
    try {
      const options = {
        cwd: baseDir,
        absolute: true,
        nodir: true
      };
      
      const files = await globPromise(pattern, options);
      logger.debug(`${files.length} fichiers trouvés avec le pattern "${pattern}" dans ${baseDir}`);
      return files;
    } catch (error: any) {
      logger.error(`Erreur lors de la recherche de fichiers avec le pattern "${pattern}": ${error.message}`);
      throw error;
    }
  }

  /**
   * Copie un fichier ou un répertoire
   * @param sourcePath Chemin source
   * @param destPath Chemin destination
   * @param overwrite Écraser si existe
   */
  public static async copy(
    sourcePath: string,
    destPath: string,
    overwrite: boolean = false
  ): Promise<void> {
    try {
      // Vérifier si la source existe
      if (!await fs.pathExists(sourcePath)) {
        throw new Error(`Le chemin source n'existe pas: ${sourcePath}`);
      }
      
      // Vérifier si la destination existe et qu'on ne doit pas l'écraser
      if (!overwrite && await fs.pathExists(destPath)) {
        throw new Error(`La destination existe déjà: ${destPath}`);
      }
      
      // Créer le répertoire parent de la destination si nécessaire
      await fs.ensureDir(path.dirname(destPath));
      
      // Copier
      await fs.copy(sourcePath, destPath, { overwrite });
      
      logger.debug(`Copie réussie: ${sourcePath} → ${destPath}`);
    } catch (error: any) {
      logger.error(`Erreur lors de la copie de ${sourcePath} vers ${destPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Déplace un fichier ou un répertoire
   * @param sourcePath Chemin source
   * @param destPath Chemin destination
   * @param overwrite Écraser si existe
   */
  public static async move(
    sourcePath: string,
    destPath: string,
    overwrite: boolean = false
  ): Promise<void> {
    try {
      // Vérifier si la source existe
      if (!await fs.pathExists(sourcePath)) {
        throw new Error(`Le chemin source n'existe pas: ${sourcePath}`);
      }
      
      // Vérifier si la destination existe et qu'on ne doit pas l'écraser
      if (!overwrite && await fs.pathExists(destPath)) {
        throw new Error(`La destination existe déjà: ${destPath}`);
      }
      
      // Créer le répertoire parent de la destination si nécessaire
      await fs.ensureDir(path.dirname(destPath));
      
      // Déplacer
      await fs.move(sourcePath, destPath, { overwrite });
      
      logger.debug(`Déplacement réussi: ${sourcePath} → ${destPath}`);
    } catch (error: any) {
      logger.error(`Erreur lors du déplacement de ${sourcePath} vers ${destPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprime un fichier ou un répertoire
   * @param targetPath Chemin à supprimer
   * @param recursive Supprimer récursivement les répertoires
   */
  public static async remove(
    targetPath: string,
    recursive: boolean = false
  ): Promise<void> {
    try {
      // Vérifier si la cible existe
      if (!await fs.pathExists(targetPath)) {
        logger.warn(`Le chemin à supprimer n'existe pas: ${targetPath}`);
        return;
      }
      
      const stats = await fs.stat(targetPath);
      
      if (stats.isDirectory()) {
        if (recursive) {
          await fs.remove(targetPath);
        } else {
          await fs.rmdir(targetPath);
        }
      } else {
        await fs.unlink(targetPath);
      }
      
      logger.debug(`Suppression réussie: ${targetPath}`);
    } catch (error: any) {
      logger.error(`Erreur lors de la suppression de ${targetPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcule un hachage MD5 du contenu d'un fichier
   * @param filePath Chemin du fichier
   */
  public static async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await FileManager.readFile(filePath);
      const crypto = require('crypto');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error: any) {
      logger.error(`Erreur lors du calcul du hash du fichier ${filePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compare le contenu de deux fichiers
   * @param file1 Premier fichier
   * @param file2 Deuxième fichier
   * @return true si identiques
   */
  public static async compareFiles(file1: string, file2: string): Promise<boolean> {
    try {
      const hash1 = await FileManager.getFileHash(file1);
      const hash2 = await FileManager.getFileHash(file2);
      return hash1 === hash2;
    } catch (error: any) {
      logger.error(`Erreur lors de la comparaison des fichiers ${file1} et ${file2}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vide le cache de fichiers
   */
  public static clearCache(): void {
    const count = fileCache.size;
    fileCache.clear();
    logger.debug(`Cache vidé (${count} entrées supprimées)`);
  }
}