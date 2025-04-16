// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractValidatorAgent, ValidatorConfig } from '../../core/abstract-validator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractValidatorAgent, ValidatorConfig } from '../../core/abstract-validator-agent';
import { AgentContext } from '../../core/mcp-agent';

import { ValidatorAgent, ValidationResult, ValidatorConfig } from '../core/interfaces/validator-agent';
import { AgentHealthState, AgentStatus } from '../core/interfaces/base-agent';

/**
 * Classe abstraite pour les agents de validation
 * Fournit une implémentation de base des méthodes communes
 */
export abstract class AbstractValidatorAgent<TInput = any> implements ValidatorAgent<TInput> {
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
   * Configuration du validateur
   */
  public config: ValidatorConfig = {
    timeout: 30000,
    retryCount: 1,
    enabled: true,
    logLevel: 'info',
    minSeverity: 'warning',
    strictMode: false,
    passThreshold: 90
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
  public async initialize(config?: ValidatorConfig): Promise<void> {
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
   * Exécute la validation
   * @param input Données à valider
   * @param context Contexte d'exécution
   */
  public async run(input: TInput, context?: any): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.validate(input, context);
      
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
   * Méthode de validation à implémenter par les classes dérivées
   */
  public abstract validate(input: TInput, context?: any): Promise<ValidationResult>;

  /**
   * Récupère toutes les règles disponibles pour ce validateur
   */
  public abstract getRules(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
  }>>;

  /**
   * Active/désactive des règles spécifiques
   */
  public abstract configureRules(ruleIds: string[], enabled: boolean): Promise<void>;

  /**
   * Applique les corrections automatiques quand c'est possible
   */
  public abstract autoFix(input: TInput, issueIds?: string[]): Promise<{
    fixedInput: TInput;
    fixedIssues: string[];
    remainingIssues: string[];
  }>;

  /**
   * Génère un rapport détaillé de la validation
   */
  public abstract generateReport(validationResult: ValidationResult, format: string): Promise<string>;

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