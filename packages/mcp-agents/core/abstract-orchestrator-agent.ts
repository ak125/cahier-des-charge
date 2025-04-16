/**
 * Classe abstraite pour les agents d'orchestration
 * Ces agents coordonnent et supervisent l'exécution d'autres agents
 */

import { AbstractAgent } from './abstract-agent';
import { AgentConfig, AgentResult } from './interfaces/base-agent';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '../utils/logger';
import { agentCommunication, AgentEventType, AgentMessage } from '../utils/agent-communication';

/**
 * Configuration spécifique aux agents orchestrateurs
 */
export interface OrchestratorConfig extends AgentConfig {
  agentsToOrchestrate: string[];   // IDs des agents à orchestrate
  executionMode?: 'sequential' | 'parallel' | 'dependency-based'; // Mode d'exécution
  timeout?: number;              // Timeout global en ms
  retryFailed?: boolean;        // Réessayer les agents échoués
  maxRetries?: number;          // Nombre max de tentatives
  continueOnFailure?: boolean;  // Continuer en cas d'échec
  reportDir?: string;           // Répertoire pour les rapports consolidés
  callbackUrl?: string;         // URL de callback pour notifier la fin d'exécution
  environmentVariables?: Record<string, string>; // Variables d'environnement à passer
}

/**
 * Statut d'exécution d'un agent
 */
export enum AgentExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMEOUT = 'timeout'
}

/**
 * Information sur l'exécution d'un agent
 */
export interface AgentExecutionInfo {
  agentId: string;               // ID de l'agent
  status: AgentExecutionStatus;  // Statut d'exécution
  startTime?: string;            // Moment de début d'exécution
  endTime?: string;              // Moment de fin d'exécution
  executionTimeMs?: number;      // Temps d'exécution en ms
  result?: AgentResult;          // Résultat de l'exécution
  attempts: number;              // Nombre de tentatives effectuées
  error?: string;                // Message d'erreur en cas d'échec
  artifacts?: string[];          // Liste des artefacts générés
}

/**
 * Résultat d'orchestration
 */
export interface OrchestrationResult {
  orchestratorId: string;        // ID de l'orchestrateur
  startTime: string;             // Moment de début d'orchestration
  endTime: string;               // Moment de fin d'orchestration
  executionTimeMs: number;       // Temps d'exécution total en ms
  agentsExecuted: number;        // Nombre d'agents exécutés
  agentsSuccessful: number;      // Nombre d'agents réussis
  agentsFailed: number;          // Nombre d'agents échoués
  agentsSkipped: number;         // Nombre d'agents ignorés
  agents: AgentExecutionInfo[];  // Informations sur tous les agents
  consolidatedErrors: string[];  // Consolidation des erreurs
  consolidatedWarnings: string[]; // Consolidation des avertissements
  consolidatedArtifacts: string[]; // Consolidation des artefacts
}

/**
 * Classe abstraite pour les agents d'orchestration
 */
export abstract class AbstractOrchestratorAgent<TConfig extends OrchestratorConfig = OrchestratorConfig> extends AbstractAgent<TConfig> {
  // Informations de suivi des agents orchestrés
  protected agentExecutions: Map<string, AgentExecutionInfo> = new Map();
  
  // Résultat d'orchestration
  protected orchestrationResult: OrchestrationResult | null = null;
  
  // Suivi des agents en cours d'exécution
  private runningAgents: Set<string> = new Set();
  
  // Map des promesses de réponse pour chaque demande
  private correlationPromises: Map<string, {
    resolve: (result: AgentResult) => void;
    reject: (error: Error) => void;
    timeout?: NodeJS.Timeout;
  }> = new Map();
  
  /**
   * Constructeur de l'agent orchestrateur
   * @param config Configuration de l'agent
   */
  constructor(config?: Partial<TConfig>) {
    super(undefined, config);
    
    // Valeurs par défaut pour la configuration d'orchestration
    this.config = {
      ...this.config,
      executionMode: this.config.executionMode || 'sequential',
      retryFailed: this.config.retryFailed !== false,
      maxRetries: this.config.maxRetries || 1,
      continueOnFailure: this.config.continueOnFailure !== false,
      timeout: this.config.timeout || 30000 // 30s par défaut
    } as TConfig;
    
    // Initialiser les informations d'exécution
    if (this.config.agentsToOrchestrate) {
      for (const agentId of this.config.agentsToOrchestrate) {
        this.agentExecutions.set(agentId, {
          agentId,
          status: AgentExecutionStatus.PENDING,
          attempts: 0
        });
      }
    }
    
    // Configurer les écouteurs pour les messages de retour
    this.setupResponseListeners();
  }
  
  /**
   * Configure les écouteurs pour les réponses des agents
   */
  private setupResponseListeners(): void {
    // Écouter les réponses des agents orchestrés
    agentCommunication.on(AgentEventType.RESPONSE, this.id, (message: AgentMessage) => {
      // Vérifier si c'est une réponse destinée à cet orchestrateur
      if (message.targetId === this.id) {
        const correlationId = message.correlationId;
        
        // Récupérer et résoudre la promesse associée à cette corrélation
        const promiseData = this.correlationPromises.get(correlationId);
        if (promiseData) {
          // Annuler le timeout si défini
          if (promiseData.timeout) {
            clearTimeout(promiseData.timeout);
          }
          
          // Retirer l'agent des agents en cours d'exécution
          if (message.senderId) {
            this.runningAgents.delete(message.senderId);
          }
          
          // Résoudre la promesse avec le résultat
          promiseData.resolve(message.payload as AgentResult);
          
          // Retirer la promesse de la map
          this.correlationPromises.delete(correlationId);
        }
      }
    });
  }
  
  /**
   * Initialisation de l'agent : prépare l'environnement pour l'orchestration
   */
  public async init(): Promise<void> {
    try {
      // Vérifier la configuration
      if (!this.config.agentsToOrchestrate || this.config.agentsToOrchestrate.length === 0) {
        throw new Error('Aucun agent à orchestrer spécifié');
      }
      
      // Créer le répertoire de rapports si spécifié
      if (this.config.reportDir) {
        await fs.ensureDir(this.config.reportDir);
        this.logger.info(`Répertoire de rapports préparé: ${this.config.reportDir}`);
      }
      
      // Initialiser le résultat d'orchestration
      this.orchestrationResult = {
        orchestratorId: this.id,
        startTime: new Date().toISOString(),
        endTime: '',
        executionTimeMs: 0,
        agentsExecuted: 0,
        agentsSuccessful: 0,
        agentsFailed: 0,
        agentsSkipped: 0,
        agents: Array.from(this.agentExecutions.values()),
        consolidatedErrors: [],
        consolidatedWarnings: [],
        consolidatedArtifacts: []
      };
      
      // Initialisation spécifique à l'agent
      if (this.prepare) {
        await this.prepare();
      }
    } catch (error: any) {
      this.addError(`Erreur lors de l'initialisation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exécute l'orchestration des agents
   */
  protected async execute(): Promise<void> {
    try {
      // Déterminer l'ordre d'exécution des agents
      const executionSequence = await this.determineExecutionSequence();
      
      this.logger.info(`Début de l'orchestration de ${executionSequence.length} agent(s)`);
      
      // Mode d'exécution
      switch (this.config.executionMode) {
        case 'parallel':
          await this.executeInParallel(executionSequence);
          break;
        
        case 'dependency-based':
          await this.executeWithDependencies(executionSequence);
          break;
        
        case 'sequential':
        default:
          await this.executeSequentially(executionSequence);
          break;
      }
      
      // Finaliser le résultat d'orchestration
      if (this.orchestrationResult) {
        this.orchestrationResult.endTime = new Date().toISOString();
        this.orchestrationResult.executionTimeMs = 
          new Date(this.orchestrationResult.endTime).getTime() - 
          new Date(this.orchestrationResult.startTime).getTime();
        
        // Compter les résultats
        this.orchestrationResult.agentsSuccessful = Array.from(this.agentExecutions.values())
          .filter(info => info.status === AgentExecutionStatus.SUCCESSFUL).length;
        
        this.orchestrationResult.agentsFailed = Array.from(this.agentExecutions.values())
          .filter(info => info.status === AgentExecutionStatus.FAILED || info.status === AgentExecutionStatus.TIMEOUT).length;
        
        this.orchestrationResult.agentsSkipped = Array.from(this.agentExecutions.values())
          .filter(info => info.status === AgentExecutionStatus.SKIPPED).length;
        
        this.orchestrationResult.agentsExecuted = 
          this.orchestrationResult.agentsSuccessful + 
          this.orchestrationResult.agentsFailed;
      }
      
      // Résumé de l'orchestration
      this.logOrchestrationSummary();
      
      // Notifier via callback si configuré
      if (this.config.callbackUrl && this.orchestrationResult) {
        this.notifyCallback(this.orchestrationResult);
      }
    } catch (error: any) {
      this.addError(`Erreur lors de l'orchestration: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exécute les agents séquentiellement
   * @param executionSequence Ordre d'exécution des agents
   */
  private async executeSequentially(executionSequence: string[]): Promise<void> {
    for (const agentId of executionSequence) {
      const agentInfo = this.agentExecutions.get(agentId);
      
      // Ignorer les agents déjà exécutés ou annulés
      if (agentInfo && agentInfo.status === AgentExecutionStatus.PENDING) {
        try {
          // Exécuter l'agent
          const result = await this.executeAgent(agentId);
          
          // Mettre à jour l'information d'exécution
          agentInfo.result = result;
          agentInfo.status = result && result.success
            ? AgentExecutionStatus.SUCCESSFUL
            : AgentExecutionStatus.FAILED;
          
          // Si échec et pas de continuation, arrêter la séquence
          if (!result || !result.success && !this.config.continueOnFailure) {
            this.logger.warn(`Agent ${agentId} a échoué; arrêt de la séquence.`);
            
            // Marquer les agents restants comme ignorés
            for (const remainingId of executionSequence.slice(executionSequence.indexOf(agentId) + 1)) {
              const remainingInfo = this.agentExecutions.get(remainingId);
              if (remainingInfo && remainingInfo.status === AgentExecutionStatus.PENDING) {
                remainingInfo.status = AgentExecutionStatus.SKIPPED;
              }
            }
            break;
          }
        } catch (error: any) {
          // En cas d'erreur, marquer l'agent comme échoué
          agentInfo.status = AgentExecutionStatus.FAILED;
          agentInfo.error = error.message;
          
          if (!this.config.continueOnFailure) {
            this.logger.error(`Erreur fatale lors de l'exécution de l'agent ${agentId}: ${error.message}`);
            
            // Marquer les agents restants comme ignorés
            for (const remainingId of executionSequence.slice(executionSequence.indexOf(agentId) + 1)) {
              const remainingInfo = this.agentExecutions.get(remainingId);
              if (remainingInfo && remainingInfo.status === AgentExecutionStatus.PENDING) {
                remainingInfo.status = AgentExecutionStatus.SKIPPED;
              }
            }
            break;
          } else {
            this.logger.warn(`Erreur lors de l'exécution de l'agent ${agentId}, mais l'orchestration continue: ${error.message}`);
          }
        }
      }
    }
  }
  
  /**
   * Exécute les agents en parallèle
   * @param executionSequence Ordre d'exécution des agents
   */
  private async executeInParallel(executionSequence: string[]): Promise<void> {
    const promises = executionSequence.map(async (agentId) => {
      const agentInfo = this.agentExecutions.get(agentId);
      
      if (agentInfo && agentInfo.status === AgentExecutionStatus.PENDING) {
        try {
          // Exécuter l'agent
          const result = await this.executeAgent(agentId);
          
          // Mettre à jour l'information d'exécution
          agentInfo.result = result;
          agentInfo.status = result && result.success
            ? AgentExecutionStatus.SUCCESSFUL
            : AgentExecutionStatus.FAILED;
          
          return { agentId, success: result && result.success };
        } catch (error: any) {
          // En cas d'erreur, marquer l'agent comme échoué
          agentInfo.status = AgentExecutionStatus.FAILED;
          agentInfo.error = error.message;
          
          return { agentId, success: false, error: error.message };
        }
      }
      
      return { agentId, success: false, skipped: true };
    });
    
    // Attendre que tous les agents terminent
    await Promise.all(promises);
  }
  
  /**
   * Exécute les agents en respectant leurs dépendances
   * @param executionSequence Ordre d'exécution initial des agents
   */
  private async executeWithDependencies(executionSequence: string[]): Promise<void> {
    // Map des dépendances pour chaque agent
    const dependencies: Map<string, string[]> = new Map();
    
    // Récupérer les dépendances pour chaque agent
    for (const agentId of executionSequence) {
      try {
        const agentDeps = await this.getAgentDependencies(agentId);
        dependencies.set(agentId, agentDeps);
      } catch (error) {
        dependencies.set(agentId, []);
      }
    }
    
    // Ensemble des agents dont les dépendances sont satisfaites
    const satisfiedAgents: Set<string> = new Set();
    
    // Ensemble des agents terminés
    const completedAgents: Set<string> = new Set();
    
    // Marquer les agents sans dépendances comme satisfaits
    for (const [agentId, deps] of dependencies.entries()) {
      if (deps.length === 0) {
        satisfiedAgents.add(agentId);
      }
    }
    
    // Tant qu'il reste des agents à exécuter
    while (completedAgents.size < executionSequence.length) {
      // S'il n'y a plus d'agents satisfaits mais qu'il reste des agents à exécuter,
      // c'est qu'il y a un cycle de dépendances
      if (satisfiedAgents.size === 0) {
        this.logger.error('Cycle de dépendances détecté ou dépendances impossibles à satisfaire');
        
        // Marquer les agents restants comme ignorés
        for (const agentId of executionSequence) {
          if (!completedAgents.has(agentId)) {
            const agentInfo = this.agentExecutions.get(agentId);
            if (agentInfo && agentInfo.status === AgentExecutionStatus.PENDING) {
              agentInfo.status = AgentExecutionStatus.SKIPPED;
              agentInfo.error = 'Dépendances impossibles à satisfaire';
            }
          }
        }
        break;
      }
      
      // Exécuter les agents satisfaits en parallèle
      const batch = Array.from(satisfiedAgents);
      satisfiedAgents.clear();
      
      const batchPromises = batch.map(async (agentId) => {
        const agentInfo = this.agentExecutions.get(agentId);
        
        if (agentInfo && agentInfo.status === AgentExecutionStatus.PENDING) {
          try {
            // Exécuter l'agent
            const result = await this.executeAgent(agentId);
            
            // Mettre à jour l'information d'exécution
            agentInfo.result = result;
            agentInfo.status = result && result.success
              ? AgentExecutionStatus.SUCCESSFUL
              : AgentExecutionStatus.FAILED;
            
            // Si échec et pas de continuation, ignorer les dépendants
            if (!result || !result.success && !this.config.continueOnFailure) {
              this.logger.warn(`Agent ${agentId} a échoué; les agents dépendants seront ignorés.`);
            }
            
            return { agentId, success: result && result.success };
          } catch (error: any) {
            // En cas d'erreur, marquer l'agent comme échoué
            agentInfo.status = AgentExecutionStatus.FAILED;
            agentInfo.error = error.message;
            
            return { agentId, success: false, error: error.message };
          } finally {
            // Marquer l'agent comme terminé
            completedAgents.add(agentId);
          }
        }
        
        completedAgents.add(agentId);
        return { agentId, success: false, skipped: true };
      });
      
      // Attendre que le batch termine
      await Promise.all(batchPromises);
      
      // Vérifier quels nouveaux agents sont satisfaits
      for (const [agentId, deps] of dependencies.entries()) {
        if (!completedAgents.has(agentId)) {
          // Vérifier si toutes les dépendances sont terminées
          const allDepsCompleted = deps.every(dep => completedAgents.has(dep));
          
          // Vérifier si toutes les dépendances ont réussi (si nécessaire)
          const allDepsSuccessful = this.config.continueOnFailure || deps.every(dep => {
            const depInfo = this.agentExecutions.get(dep);
            return depInfo && depInfo.status === AgentExecutionStatus.SUCCESSFUL;
          });
          
          if (allDepsCompleted && allDepsSuccessful) {
            satisfiedAgents.add(agentId);
          } else if (allDepsCompleted && !allDepsSuccessful) {
            // Si les dépendances sont terminées mais ont échoué
            const agentInfo = this.agentExecutions.get(agentId);
            if (agentInfo && agentInfo.status === AgentExecutionStatus.PENDING) {
              agentInfo.status = AgentExecutionStatus.SKIPPED;
              agentInfo.error = 'Dépendances échouées';
            }
            completedAgents.add(agentId);
          }
        }
      }
    }
  }
  
  /**
   * Exécute un agent en envoyant une requête et en attendant la réponse
   * @param agentId ID de l'agent à exécuter
   * @returns Résultat de l'exécution
   */
  private async executeAgent(agentId: string): Promise<AgentResult> {
    const agentInfo = this.agentExecutions.get(agentId);
    if (!agentInfo) {
      throw new Error(`Agent inconnu: ${agentId}`);
    }
    
    // Mettre à jour le statut
    agentInfo.status = AgentExecutionStatus.RUNNING;
    agentInfo.startTime = new Date().toISOString();
    agentInfo.attempts++;
    
    this.logger.info(`Exécution de l'agent ${agentId} (tentative ${agentInfo.attempts}/${this.config.maxRetries || 1})`);
    
    try {
      // Générer un ID de corrélation unique
      const correlationId = `${this.id}-${agentId}-${Date.now()}`;
      
      // Ajouter l'agent à la liste des agents en cours d'exécution
      this.runningAgents.add(agentId);
      
      // Créer une promesse pour attendre la réponse
      const responsePromise = new Promise<AgentResult>((resolve, reject) => {
        // Configurer un timeout
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout lors de l'exécution de l'agent ${agentId}`));
          this.correlationPromises.delete(correlationId);
          
          // Mettre à jour le statut
          agentInfo.status = AgentExecutionStatus.TIMEOUT;
          agentInfo.endTime = new Date().toISOString();
          agentInfo.error = `Timeout après ${this.config.timeout}ms`;
          
          // Retirer l'agent des agents en cours d'exécution
          this.runningAgents.delete(agentId);
        }, this.config.timeout);
        
        // Stocker la promesse et son handler
        this.correlationPromises.set(correlationId, { resolve, reject, timeout });
      });
      
      // Envoyer la requête à l'agent
      agentCommunication.sendMessage({
        type: AgentEventType.REQUEST,
        senderId: this.id,
        targetId: agentId,
        correlationId,
        payload: {
          // Paramètres spécifiques à passer à l'agent
          ...(this.config.environmentVariables || {}),
          // Paramètres spécifiques déterminés par l'orchestrateur
          ...(await this.getAgentParameters(agentId))
        }
      });
      
      // Attendre la réponse ou le timeout
      const result = await responsePromise;
      
      // Mettre à jour le statut avec le résultat
      agentInfo.endTime = new Date().toISOString();
      agentInfo.executionTimeMs = result.executionTimeMs;
      
      // Consolider les résultats
      this.consolidateResults(agentId, result);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'exécution de l'agent ${agentId}: ${error.message}`);
      
      // Mettre à jour le statut
      agentInfo.endTime = new Date().toISOString();
      agentInfo.error = error.message;
      
      // Calculer le temps d'exécution si possible
      if (agentInfo.startTime) {
        agentInfo.executionTimeMs = 
          new Date(agentInfo.endTime).getTime() - 
          new Date(agentInfo.startTime).getTime();
      }
      
      // Réessayer si configuré et si le nombre max de tentatives n'est pas atteint
      if (
        this.config.retryFailed && 
        agentInfo.attempts < (this.config.maxRetries || 1) &&
        agentInfo.status !== AgentExecutionStatus.TIMEOUT
      ) {
        this.logger.info(`Nouvelle tentative pour l'agent ${agentId}`);
        return this.executeAgent(agentId);
      }
      
      // Construire un résultat d'échec
      const failedResult: AgentResult = {
        success: false,
        errors: [error],
        executionTimeMs: agentInfo.executionTimeMs || 0,
        timestamp: new Date().toISOString()
      };
      
      return failedResult;
    }
  }
  
  /**
   * Consolide les résultats d'un agent dans le résultat d'orchestration
   * @param agentId ID de l'agent
   * @param result Résultat de l'agent
   */
  private consolidateResults(agentId: string, result: AgentResult): void {
    if (!this.orchestrationResult) return;
    
    // Ajouter les erreurs
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(error => {
        const errorMsg = `[${agentId}] ${error.message || String(error)}`;
        this.orchestrationResult!.consolidatedErrors.push(errorMsg);
      });
    }
    
    // Ajouter les avertissements
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        const warningMsg = `[${agentId}] ${warning}`;
        this.orchestrationResult!.consolidatedWarnings.push(warningMsg);
      });
    }
    
    // Ajouter les artefacts
    if (result.artifacts && result.artifacts.length > 0) {
      result.artifacts.forEach(artifact => {
        const artifactWithSource = `${artifact} (source: ${agentId})`;
        this.orchestrationResult!.consolidatedArtifacts.push(artifactWithSource);
      });
      
      // Mettre à jour les artefacts de l'agent
      const agentInfo = this.agentExecutions.get(agentId);
      if (agentInfo) {
        agentInfo.artifacts = result.artifacts;
      }
    }
  }
  
  /**
   * Affiche un résumé de l'orchestration
   */
  private logOrchestrationSummary(): void {
    if (!this.orchestrationResult) return;
    
    this.logger.info('='.repeat(50));
    this.logger.info(`Résumé de l'orchestration par ${this.name} v${this.version}`);
    this.logger.info('='.repeat(50));
    
    const result = this.orchestrationResult;
    this.logger.info(`Début: ${result.startTime}`);
    this.logger.info(`Fin: ${result.endTime}`);
    this.logger.info(`Durée: ${result.executionTimeMs}ms`);
    this.logger.info(`Agents exécutés: ${result.agentsExecuted}/${result.agents.length}`);
    this.logger.info(`Succès: ${result.agentsSuccessful}`);
    this.logger.info(`Échecs: ${result.agentsFailed}`);
    this.logger.info(`Ignorés: ${result.agentsSkipped}`);
    
    // Afficher le détail des agents
    this.logger.info('-'.repeat(50));
    this.logger.info('Détail des exécutions:');
    Array.from(this.agentExecutions.values()).forEach(info => {
      const statusEmoji = 
        info.status === AgentExecutionStatus.SUCCESSFUL ? '✅' :
        info.status === AgentExecutionStatus.FAILED ? '❌' :
        info.status === AgentExecutionStatus.TIMEOUT ? '⏱️' :
        info.status === AgentExecutionStatus.SKIPPED ? '⏭️' : '❓';
      
      this.logger.info(`${statusEmoji} ${info.agentId}: ${info.status.toUpperCase()}`);
      if (info.executionTimeMs) {
        this.logger.info(`   Durée: ${info.executionTimeMs}ms`);
      }
      if (info.error) {
        this.logger.info(`   Erreur: ${info.error}`);
      }
    });
    
    // Afficher les erreurs consolidées
    if (result.consolidatedErrors.length > 0) {
      this.logger.info('-'.repeat(50));
      this.logger.info('Erreurs:');
      result.consolidatedErrors.forEach(error => {
        this.logger.error(`- ${error}`);
      });
    }
    
    // Afficher les avertissements consolidés
    if (result.consolidatedWarnings.length > 0) {
      this.logger.info('-'.repeat(50));
      this.logger.info('Avertissements:');
      result.consolidatedWarnings.forEach(warning => {
        this.logger.warn(`- ${warning}`);
      });
    }
    
    this.logger.info('='.repeat(50));
  }
  
  /**
   * Envoie une notification au callback configuré
   * @param result Résultat d'orchestration
   */
  private async notifyCallback(result: OrchestrationResult): Promise<void> {
    try {
      const callbackUrl = this.config.callbackUrl;
      if (!callbackUrl) return;
      
      this.logger.info(`Envoi de notification au callback: ${callbackUrl}`);
      
      // Tenter d'envoyer la notification (implémentation fictive)
      // Dans une implémentation réelle, on utiliserait fetch, axios ou autre
      const notificationResult = await Promise.resolve({ success: true });
      
      if (notificationResult.success) {
        this.logger.info('Notification envoyée avec succès');
      } else {
        throw new Error('Échec de la notification');
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de la notification: ${error.message}`);
      // Ne pas propager l'erreur pour ne pas faire échouer l'orchestration
    }
  }
  
  /**
   * Génère un rapport d'orchestration
   */
  protected async generateReport(): Promise<string | undefined> {
    if (!this.orchestrationResult || !this.config.reportDir) {
      return undefined;
    }
    
    try {
      // Nom du fichier de rapport
      const reportFileName = `${this.id}-orchestration-${new Date().toISOString().replace(/:/g, '-')}.json`;
      const reportPath = path.join(this.config.reportDir, reportFileName);
      
      // Écrire le rapport
      await fs.writeFile(reportPath, JSON.stringify(this.orchestrationResult, null, 2));
      
      this.logger.info(`Rapport d'orchestration généré: ${reportPath}`);
      
      // Ajouter aux artefacts
      this.artifacts.push(reportPath);
      
      return reportPath;
    } catch (error: any) {
      this.addWarning(`Erreur lors de la génération du rapport: ${error.message}`);
      return undefined;
    }
  }
  
  /**
   * Détermine l'ordre d'exécution des agents
   * Par défaut, utilise l'ordre spécifié dans la configuration
   * Les sous-classes peuvent surcharger cette méthode pour implémenter des logiques personnalisées
   */
  protected async determineExecutionSequence(): Promise<string[]> {
    return this.config.agentsToOrchestrate || [];
  }
  
  /**
   * Récupère les dépendances d'un agent
   * @param agentId ID de l'agent
   * @returns Liste des IDs des agents dont dépend cet agent
   */
  protected async getAgentDependencies(agentId: string): Promise<string[]> {
    // Méthode par défaut pour récupérer les dépendances
    // Les sous-classes peuvent implémenter une logique plus complexe
    try {
      // Interroger l'agent pour ses dépendances
      // Cette implémentation suppose que l'agent a une méthode getDependencies
      const correlationId = `deps-${agentId}-${Date.now()}`;
      
      // Créer une promesse pour attendre la réponse
      const responsePromise = new Promise<string[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout lors de la récupération des dépendances de l'agent ${agentId}`));
          this.correlationPromises.delete(correlationId);
        }, 5000); // Timeout plus court pour cette opération
        
        // Stocker la promesse et son handler
        this.correlationPromises.set(correlationId, { 
          resolve: (result: any) => {
            // Convertir le résultat en liste de dépendances
            const dependencies = Array.isArray(result) ? result : 
              (result && result.dependencies ? result.dependencies : []);
            resolve(dependencies);
          },
          reject,
          timeout
        });
      });
      
      // Envoyer la requête à l'agent
      agentCommunication.sendMessage({
        type: AgentEventType.REQUEST,
        senderId: this.id,
        targetId: agentId,
        correlationId,
        payload: { action: 'getDependencies' }
      });
      
      // Attendre la réponse ou le timeout
      return await responsePromise;
    } catch (error) {
      this.logger.warn(`Impossible de récupérer les dépendances de l'agent ${agentId}, aucune dépendance assumée`);
      return [];
    }
  }
  
  /**
   * Récupère les paramètres spécifiques à passer à un agent
   * @param agentId ID de l'agent
   * @returns Paramètres à passer à l'agent
   */
  protected async getAgentParameters(agentId: string): Promise<Record<string, any>> {
    // Par défaut, aucun paramètre spécifique
    // Les sous-classes peuvent surcharger pour injecter des paramètres
    return {};
  }
  
  /**
   * Nettoyage après orchestration
   */
  public async cleanup(): Promise<void> {
    // Supprimer tous les timeouts en attente
    for (const promiseData of this.correlationPromises.values()) {
      if (promiseData.timeout) {
        clearTimeout(promiseData.timeout);
      }
    }
    
    // Arrêter tous les agents en cours d'exécution
    for (const agentId of this.runningAgents) {
      try {
        this.logger.warn(`Tentative d'arrêt de l'agent ${agentId} encore en cours d'exécution`);
        
        // Envoyer une demande d'arrêt
        agentCommunication.sendMessage({
          type: AgentEventType.REQUEST,
          senderId: this.id,
          targetId: agentId,
          correlationId: `stop-${agentId}-${Date.now()}`,
          payload: { action: 'stop' }
        });
      } catch (error) {
        // Ignorer les erreurs d'arrêt
      }
    }
    
    // Nettoyage de la classe parente
    await super.cleanup();
  }
  
  /**
   * Méthode optionnelle de préparation avant l'orchestration
   */
  protected prepare?(): Promise<void>;
}