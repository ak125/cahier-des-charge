/**
 * Service de journalisation pour les agents MCP
 */
import { LogLevel } from '../types';

/**
 * Interface pour les adaptateurs de journalisation
 */
export interface LogAdapter {
  /**
   * Enregistre un message de log
   * @param level Niveau de log
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  log(level: LogLevel, message: string, context?: any): void;
}

/**
 * Adaptateur de log console par défaut
 */
export class ConsoleLogAdapter implements LogAdapter {
  log(level: LogLevel, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, context || '');
        break;
      case 'info':
        console.info(formattedMessage, context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, context || '');
        break;
      case 'error':
        console.error(formattedMessage, context || '');
        break;
    }
  }
}

/**
 * Configuration du logger
 */
export interface LoggerConfig {
  /**
   * Niveau de log minimum
   */
  minLevel?: LogLevel;
  
  /**
   * Adaptateurs de log
   */
  adapters?: LogAdapter[];
  
  /**
   * Préfixe pour tous les messages
   */
  prefix?: string;
  
  /**
   * Contexte global à inclure dans chaque log
   */
  globalContext?: Record<string, any>;
}

/**
 * Classe principale du logger MCP
 */
export class McpLogger {
  private config: LoggerConfig;
  private adapters: LogAdapter[];
  
  /**
   * Crée une nouvelle instance de logger
   * @param config Configuration du logger
   */
  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel || 'info',
      prefix: config.prefix || '',
      globalContext: config.globalContext || {}
    };
    
    // Si aucun adaptateur n'est fourni, utiliser l'adaptateur console par défaut
    this.adapters = config.adapters || [new ConsoleLogAdapter()];
  }
  
  /**
   * Détermine si un niveau de log doit être enregistré
   * @param level Niveau de log à vérifier
   */
  private shouldLog(level: LogLevel): boolean {
    const logLevels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return logLevels[level] >= logLevels[this.config.minLevel || 'info'];
  }
  
  /**
   * Enregistre un message avec le niveau et contexte spécifiés
   * @param level Niveau de log
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  log(level: LogLevel, message: string, context?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    // Préfixer le message si nécessaire
    const prefixedMessage = this.config.prefix 
      ? `${this.config.prefix} ${message}`
      : message;
    
    // Combiner le contexte global et le contexte spécifique
    const fullContext = context 
      ? { ...this.config.globalContext, ...context }
      : this.config.globalContext;
    
    // Envoyer le message à tous les adaptateurs
    for (const adapter of this.adapters) {
      adapter.log(level, prefixedMessage, fullContext);
    }
  }
  
  /**
   * Enregistre un message de niveau debug
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }
  
  /**
   * Enregistre un message de niveau info
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  info(message: string, context?: any): void {
    this.log('info', message, context);
  }
  
  /**
   * Enregistre un message de niveau warn
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }
  
  /**
   * Enregistre un message de niveau error
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  error(message: string, context?: any): void {
    this.log('error', message, context);
  }
  
  /**
   * Crée un nouveau logger avec un préfixe spécifique
   * @param prefix Préfixe à ajouter
   * @param context Contexte additionnel à fusionner avec le contexte global
   */
  createSubLogger(prefix: string, context?: Record<string, any>): McpLogger {
    const newPrefix = this.config.prefix
      ? `${this.config.prefix}:${prefix}`
      : prefix;
    
    const newContext = context 
      ? { ...this.config.globalContext, ...context }
      : this.config.globalContext;
    
    return new McpLogger({
      ...this.config,
      prefix: newPrefix,
      globalContext: newContext
    });
  }
  
  /**
   * Ajoute un adaptateur de log
   * @param adapter Adaptateur à ajouter
   */
  addAdapter(adapter: LogAdapter): void {
    this.adapters.push(adapter);
  }
  
  /**
   * Définit le niveau de log minimum
   * @param level Niveau minimum
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }
}