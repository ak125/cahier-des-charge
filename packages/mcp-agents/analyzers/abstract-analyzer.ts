// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

import { AnalyzerAgent, AnalysisResult, AnalyzerConfig } from '../core/interfaces/analyzer-agent';
import { AgentHealthState, AgentStatus } from '../core/interfaces/base-agent';

/**
 * Classe abstraite pour les agents d'analyse
 * Fournit une implémentation de base des méthodes communes
 */
export abstract class AbstractAnalyzerAgent<TInput = any, TOutput = any> implements AnalyzerAgent<TInput, TOutput> {
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
   * Configuration de l'analyseur
   */
  public config: AnalyzerConfig = {
    timeout: 30000,
    retryCount: 3,
    enabled: true,
    logLevel: 'info',
    maxDepth: 10,
    maxItems: 1000
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
  public async initialize(config?: AnalyzerConfig): Promise<void> {
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
   * Exécute l'analyse
   * @param input Données à analyser
   * @param context Contexte d'exécution
   */
  public async run(input: TInput, context?: any): Promise<AnalysisResult<TOutput>> {
    const startTime = Date.now();
    
    try {
      const isValid = await this.validateInput(input);
      if (!isValid) {
        throw new Error(`Input validation failed for analyzer ${this.id}`);
      }
      
      const result = await this.analyze(input, context);
      
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
   * Méthode d'analyse à implémenter par les classes dérivées
   */
  public abstract analyze(input: TInput, context?: any): Promise<AnalysisResult<TOutput>>;

  /**
   * Valide si les données d'entrée sont analysables
   */
  public abstract validateInput(input: any): Promise<boolean>;

  /**
   * Récupère les règles d'analyse disponibles
   */
  public abstract getAvailableRules(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    severity: string;
  }>>;

  /**
   * Récupère les statistiques d'analyse
   */
  public abstract getAnalysisStats(): Promise<{
    processed: number;
    issuesByType: Record<string, number>;
    averageProcessingTime: number;
  }>;

  /**
   * Récupère le statut actuel de l'agent
   */
  public async getStatus(): Promise<AgentStatus> {
    return { ...this._status };
  }

  /**
   * Libère les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    try {
      await this.cleanupInternal();
      this._status.health = AgentHealthState.STOPPED;
    } catch (error) {
      this._status.health = AgentHealthState.DEGRADED;
      throw error;
    }
  }

  /**
   * Méthode de nettoyage spécifique à implémenter par les classes dérivées
   */
  protected abstract cleanupInternal(): Promise<void>;
}