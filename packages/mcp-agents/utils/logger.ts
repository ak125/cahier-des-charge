/**
 * Système de journalisation unifié pour tous les agents
 * Permet une gestion cohérente et configurable des logs
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { format } from 'util';

/**
 * Niveaux de journalisation disponibles, par ordre de criticité croissante
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // Désactive tous les logs
}

/**
 * Interface de configuration du logger
 */
export interface LoggerConfig {
  level: LogLevel;               // Niveau minimum de log à afficher
  outputToConsole: boolean;      // Afficher les logs dans la console
  outputToFile: boolean;         // Écrire les logs dans un fichier
  logFilePath?: string;          // Chemin du fichier de log
  timestampFormat?: Intl.DateTimeFormatOptions; // Format d'horodatage
  colorize?: boolean;            // Coloriser les logs dans la console
  includeContext?: boolean;      // Inclure le contexte d'exécution
  maxFileSize?: number;          // Taille maximale du fichier de log en octets
  logRotation?: boolean;         // Activer la rotation des fichiers de log
  maxLogFiles?: number;          // Nombre maximum de fichiers de log à conserver
}

/**
 * Configuration par défaut du logger
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  outputToConsole: true,
  outputToFile: false,
  timestampFormat: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  },
  colorize: true,
  includeContext: true,
  maxFileSize: 10 * 1024 * 1024, // 10 Mo
  logRotation: true,
  maxLogFiles: 5
};

/**
 * Couleurs ANSI pour les différents niveaux de log
 */
const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[90m', // Gris
  info: '\x1b[36m',  // Cyan
  warn: '\x1b[33m',  // Jaune
  error: '\x1b[31m', // Rouge
  context: '\x1b[35m' // Violet
};

/**
 * Classe Logger pour la journalisation standardisée
 */
export class Logger {
  private config: LoggerConfig;
  private context: string;

  // Instance statique partagée pour la configuration globale
  private static globalConfig: LoggerConfig = DEFAULT_CONFIG;
  
  /**
   * Crée une nouvelle instance de Logger
   * @param context Le contexte du logger (généralement le nom de l'agent)
   * @param config Configuration spécifique à cette instance
   */
  constructor(context: string, config?: Partial<LoggerConfig>) {
    this.context = context;
    this.config = { ...Logger.globalConfig, ...config };
    
    // S'assurer que le répertoire du fichier de log existe
    if (this.config.outputToFile && this.config.logFilePath) {
      const logDir = path.dirname(this.config.logFilePath);
      fs.ensureDirSync(logDir);
    }
  }

  /**
   * Configure les options globales du logger pour toutes les nouvelles instances
   * @param config Options de configuration
   */
  public static configure(config: Partial<LoggerConfig>): void {
    Logger.globalConfig = { ...Logger.globalConfig, ...config };
  }

  /**
   * Log un message de niveau DEBUG
   */
  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log un message de niveau INFO
   */
  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log un message de niveau INFO (alias de info)
   */
  public log(messageOrLevel: string | LogLevel, ...args: any[]): void {
    if (typeof messageOrLevel === 'string') {
      this.info(messageOrLevel, ...args);
    } else {
      const level = messageOrLevel;
      const [message, ...restArgs] = args;
      
      if (level < this.config.level) {
        return;
      }

      const now = new Date();
      const timestamp = new Intl.DateTimeFormat('fr-FR', this.config.timestampFormat).format(now);
      
      let levelStr: string;
      let color: string = '';
      let resetColor: string = '';
      
      switch (level) {
        case LogLevel.DEBUG:
          levelStr = 'DEBUG';
          color = COLORS.debug;
          break;
        case LogLevel.INFO:
          levelStr = 'INFO ';
          color = COLORS.info;
          break;
        case LogLevel.WARN:
          levelStr = 'WARN ';
          color = COLORS.warn;
          break;
        case LogLevel.ERROR:
          levelStr = 'ERROR';
          color = COLORS.error;
          break;
        default:
          levelStr = 'INFO ';
          color = COLORS.info;
      }

      if (this.config.colorize) {
        resetColor = COLORS.reset;
      } else {
        color = '';
      }
      
      // Formater le message avec les arguments
      const formattedMessage = restArgs.length > 0 ? format(message, ...restArgs) : message;
      
      // Construire le message de log complet
      let logEntry = `[${timestamp}] ${color}${levelStr}${resetColor}`;
      
      // Ajouter le contexte si configuré
      if (this.config.includeContext && this.context) {
        const contextColor = this.config.colorize ? COLORS.context : '';
        logEntry += ` ${contextColor}[${this.context}]${resetColor}`;
      }
      
      logEntry += `: ${formattedMessage}`;
      
      // Afficher dans la console si configuré
      if (this.config.outputToConsole) {
        console.log(logEntry);
      }
      
      // Écrire dans un fichier si configuré
      if (this.config.outputToFile && this.config.logFilePath) {
        // Version sans couleurs pour le fichier
        const fileEntry = `[${timestamp}] ${levelStr} ${this.config.includeContext ? `[${this.context}]` : ''}: ${formattedMessage}\n`;
        
        // Vérifier si la rotation des logs est nécessaire
        this.checkLogRotation().then(() => {
          fs.appendFileSync(this.config.logFilePath!, fileEntry);
        }).catch(err => {
          console.error(`Erreur lors de l'écriture dans le fichier de log: ${err.message}`);
        });
      }
    }
  }

  /**
   * Log un message de niveau WARN
   */
  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log un message de niveau ERROR
   */
  public error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Vérifie si une rotation des logs est nécessaire et la réalise si besoin
   */
  private async checkLogRotation(): Promise<void> {
    if (!this.config.logRotation || !this.config.logFilePath) {
      return;
    }
    
    try {
      // Vérifier si le fichier existe
      if (!await fs.pathExists(this.config.logFilePath)) {
        return;
      }
      
      // Obtenir les stats du fichier
      const stats = await fs.stat(this.config.logFilePath);
      
      // Si la taille dépasse le maximum, faire une rotation
      if (stats.size >= (this.config.maxFileSize || DEFAULT_CONFIG.maxFileSize)) {
        const dir = path.dirname(this.config.logFilePath);
        const ext = path.extname(this.config.logFilePath);
        const base = path.basename(this.config.logFilePath, ext);
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const newPath = path.join(dir, `${base}-${timestamp}${ext}`);
        
        // Renommer le fichier actuel
        await fs.rename(this.config.logFilePath, newPath);
        
        // Supprimer les anciens fichiers si nécessaire
        const logFiles = (await fs.readdir(dir))
          .filter(f => f.startsWith(base) && f !== path.basename(this.config.logFilePath!))
          .map(f => path.join(dir, f))
          .sort();
        
        // Garder seulement les N fichiers les plus récents
        const maxFiles = this.config.maxLogFiles || DEFAULT_CONFIG.maxLogFiles;
        if (logFiles.length > maxFiles) {
          const filesToDelete = logFiles.slice(0, logFiles.length - maxFiles);
          for (const file of filesToDelete) {
            await fs.unlink(file);
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la rotation des logs: ${error.message}`);
    }
  }
}

// Exporter une instance par défaut
export const defaultLogger = new Logger('Default');