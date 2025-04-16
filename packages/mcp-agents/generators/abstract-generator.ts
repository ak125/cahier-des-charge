// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractGeneratorAgent, GeneratorConfig } from '../../core/abstract-generator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractGeneratorAgent, GeneratorConfig } from '../../core/abstract-generator-agent';
import { AgentContext } from '../../core/mcp-agent';

import { GeneratorAgent, GenerationResult, GeneratorConfig } from '../core/interfaces/generator-agent';
import { AgentHealthState, AgentStatus } from '../core/interfaces/base-agent';

/**
 * Classe abstraite pour les agents de génération
 * Fournit une implémentation de base des méthodes communes
 */
export abstract class AbstractGeneratorAgent<TInput = any, TOutput = any> implements GeneratorAgent<TInput, TOutput> {
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
   * Configuration du générateur
   */
  public config: GeneratorConfig = {
    timeout: 60000,
    retryCount: 2,
    enabled: true,
    logLevel: 'info',
    outputFormat: 'json'
  };

  private _status: AgentStatus = {
    health: AgentHealthState.STOPPED,
    successCount: 0,
    failureCount: 0
  };

  /**
   * Initialise l'agent avec sa configuration
   * @param config Configuration spécifique à l'agent
   */
  public async initialize(config?: GeneratorConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this._status.health = AgentHealthState.STARTING;
    
    try {
      await this.initializeInternal();
      this._status.health = AgentHealthState.HEALTHY;
    } catch (error) {
      this._status.health = AgentHealthState.UNHEALTHY;
      throw error;
    }
  }

  /**
   * Méthode d'initialisation spécifique à implémenter par les classes dérivées
   */
  protected abstract initializeInternal(): Promise<void>;

  /**
   * Exécute la génération
   * @param input Spécifications pour la génération
   * @param context Contexte d'exécution
   */
  public async run(input: TInput, context?: any): Promise<GenerationResult<TOutput>> {
    const startTime = Date.now();
    
    try {
      const validationResult = await this.validateInput(input);
      if (!validationResult.valid) {
        throw new Error(`Input validation failed for generator ${this.id}: ${validationResult.errors?.join(', ')}`);
      }
      
      const result = await this.generate(input, context);
      
      this._status.lastRun = new Date();
      this._status.lastRunDuration = Date.now() - startTime;
      this._status.successCount = (this._status.successCount || 0) + 1;
      
      return result;
    } catch (error) {
      this._status.lastRun = new Date();
      this._status.lastRunDuration = Date.now() - startTime;
      this._status.failureCount = (this._status.failureCount || 0) + 1;
      
      throw error;
    }
  }

  /**
   * Méthode de génération à implémenter par les classes dérivées
   */
  public abstract generate(input: TInput, context?: any): Promise<GenerationResult<TOutput>>;

  /**
   * Valide si les données d'entrée sont utilisables pour la génération
   */
  public abstract validateInput(input: any): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Récupère les modèles disponibles pour la génération
   */
  public abstract getAvailableTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    requiredFields: string[];
  }>>;

  /**
   * Prévisualise le résultat de la génération sans créer de fichiers
   */
  public abstract preview(input: TInput): Promise<Partial<TOutput>>;

  /**
   * Récupère le statut actuel de l'agent
   */
  public async getStatus(): Promise<AgentStatus> {
    return { ...this._status };
  }

  /**
   * Libère les ressources utilisées par l'agent
   */
  public async cleanup(identifier?: string): Promise<boolean> {
    try {
      const result = await this.cleanupInternal(identifier);
      if (!identifier) {
        this._status.health = AgentHealthState.STOPPED;
      }
      return result;
    } catch (error) {
      this._status.health = AgentHealthState.DEGRADED;
      throw error;
    }
  }

  /**
   * Méthode de nettoyage spécifique à implémenter par les classes dérivées
   */
  protected abstract cleanupInternal(identifier?: string): Promise<boolean>;
}