/**
 * Agent Runner - Composant de l'orchestrateur MCP
 * 
 * Module responsable de lancer les agents MCP de manière ordonnée et contrôlée,
 * avec gestion des erreurs et mécanismes de reprise.
 * 
 * Fonctionnalités principales:
 * - Lancement d'agents avec gestion du contexte
 * - Communication entre agents via Redis ou directement
 * - Gestion des erreurs et relance automatique
 * - Tracking de l'état d'exécution
 * - Support pour les modes synchrone et asynchrone
 */

import { Logger } from '@nestjs/common';
import { Queue, QueueScheduler } from 'bullmq';
import { createClient } from 'redis';
import fs from 'fs-extra';
import path from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Types
export type AgentType = 'php-analyzer' | 'remix-generator' | 'qa-analyzer' | 'diff-verifier' | 'dev-linter';

export interface AgentContext {
  filename: string;
  filePath?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  priority?: number;
  retryCount?: number;
  [key: string]: any;
}

export interface AgentResult {
  success: boolean;
  agentType: AgentType;
  context: AgentContext;
  data?: any;
  error?: Error | string;
  executionTime?: number;
}

export interface AgentRunnerConfig {
  redisUrl?: string;
  simulationMode?: boolean;
  simulationDir?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  useDirectExecution?: boolean;
}

/**
 * Lanceur d'agents MCP
 */
export class AgentRunner {
  private readonly logger = new Logger('AgentRunner');
  private readonly redisUrl: string;
  private readonly redisClient: ReturnType<typeof createClient>;
  private readonly simulationMode: boolean;
  private readonly simulationDir: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly timeout: number;
  private readonly useDirectExecution: boolean;
  private readonly eventEmitter: EventEmitter2;
  
  // Files d'attente BullMQ (une par type d'agent)
  private queues: Record<AgentType, Queue> = {} as any;
  private schedulers: Record<AgentType, QueueScheduler> = {} as any;
  
  // Cache des agents si direct execution est activé
  private agentInstances: Record<string, any> = {};
  
  /**
   * Constructeur
   */
  constructor(
    private readonly config: AgentRunnerConfig = {}
  ) {
    this.redisUrl = config.redisUrl || 'redis://localhost:6379';
    this.simulationMode = config.simulationMode || false;
    this.simulationDir = config.simulationDir || './simulations';
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 5000;
    this.timeout = config.timeout || 60000;
    this.useDirectExecution = config.useDirectExecution || false;
    
    // Connexion Redis
    this.redisClient = createClient({
      url: this.redisUrl
    });
    
    // Event emitter
    this.eventEmitter = new EventEmitter2();
  }
  
  /**
   * Initialise le lanceur d'agents
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log('Initialisation du lanceur d\'agents MCP');
      
      // Créer le répertoire de simulation s'il n'existe pas
      if (this.simulationMode) {
        await fs.ensureDir(this.simulationDir);
      }
      
      // Se connecter à Redis si pas en mode simulation
      if (!this.simulationMode) {
        await this.redisClient.connect();
        
        // Créer les queues pour chaque type d'agent
        await this.setupQueues();
      }
      
      this.logger.log('Lanceur d\'agents MCP initialisé avec succès');
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'initialisation du lanceur d'agents: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Configure les files d'attente BullMQ
   */
  private async setupQueues(): Promise<void> {
    const agentTypes: AgentType[] = [
      'php-analyzer', 
      'remix-generator', 
      'qa-analyzer', 
      'diff-verifier', 
      'dev-linter'
    ];
    
    for (const agentType of agentTypes) {
      // Créer un planificateur pour gérer les retards, backoffs, etc.
      this.schedulers[agentType] = new QueueScheduler(`mcp-${agentType}`, {
        connection: {
          host: new URL(this.redisUrl).hostname,
          port: parseInt(new URL(this.redisUrl).port || '6379')
        }
      });
      
      // Créer la file d'attente
      this.queues[agentType] = new Queue(`mcp-${agentType}`, {
        connection: {
          host: new URL(this.redisUrl).hostname,
          port: parseInt(new URL(this.redisUrl).port || '6379')
        },
        defaultJobOptions: {
          attempts: this.maxRetries,
          backoff: {
            type: 'exponential',
            delay: this.retryDelay
          },
          removeOnComplete: false,
          removeOnFail: false,
          timeout: this.timeout
        }
      });
      
      this.logger.log(`File d'attente pour ${agentType} configurée`);
    }
  }
  
  /**
   * Lance un agent pour traiter un fichier
   */
  async launchAgent(
    agentType: AgentType, 
    context: AgentContext, 
    options: { waitForResult?: boolean } = {}
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const waitForResult = options.waitForResult ?? false;
    
    try {
      this.logger.log(`Lancement de l'agent ${agentType} pour ${context.filename}`);
      
      // Enrichir le contexte avec un timestamp si absent
      if (!context.timestamp) {
        context.timestamp = new Date().toISOString();
      }
      
      // En mode simulation, écrire un fichier de simulation
      if (this.simulationMode) {
        const result = await this.simulateAgent(agentType, context);
        return {
          success: true,
          agentType,
          context,
          data: result,
          executionTime: Date.now() - startTime
        };
      }
      
      // Si exécution directe, lancer l'agent immédiatement
      if (this.useDirectExecution) {
        return await this.executeAgentDirectly(agentType, context);
      }
      
      // Sinon, ajouter à la file d'attente BullMQ
      const queue = this.queues[agentType];
      if (!queue) {
        throw new Error(`File d'attente non configurée pour l'agent ${agentType}`);
      }
      
      const job = await queue.add(context.filename, context, {
        priority: context.priority,
        attempts: context.retryCount || this.maxRetries
      });
      
      this.logger.log(`Job ajouté à la file d'attente pour ${agentType}, ID: ${job.id}`);
      
      // Si on n'attend pas le résultat, retourner immédiatement
      if (!waitForResult) {
        return {
          success: true,
          agentType,
          context,
          data: { jobId: job.id },
          executionTime: Date.now() - startTime
        };
      }
      
      // Sinon, attendre le résultat
      const result = await job.waitUntilFinished(queue);
      
      return {
        success: true,
        agentType,
        context,
        data: result,
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      this.logger.error(`Erreur lors du lancement de l'agent ${agentType}: ${error.message}`);
      
      return {
        success: false,
        agentType,
        context,
        error: error.message || error,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Simule l'exécution d'un agent (pour le mode dry-run)
   */
  private async simulateAgent(agentType: AgentType, context: AgentContext): Promise<any> {
    const simulationFile = path.join(this.simulationDir, `${context.filename}.${agentType}.json`);
    
    // Générer un résultat simulé
    const simulatedResult = {
      agent: agentType,
      context,
      timestamp: new Date().toISOString(),
      simulationMode: true,
      result: {
        success: true,
        message: `Simulation d'exécution de ${agentType} pour ${context.filename}`
      }
    };
    
    // Écrire le résultat simulé dans un fichier
    await fs.writeJson(simulationFile, simulatedResult, { spaces: 2 });
    
    this.logger.log(`Simulation écrite dans ${simulationFile}`);
    
    return simulatedResult;
  }
  
  /**
   * Exécute un agent directement (sans passer par BullMQ)
   */
  private async executeAgentDirectly(agentType: AgentType, context: AgentContext): Promise<AgentResult> {
    try {
      // Charger dynamiquement l'agent si nécessaire
      if (!this.agentInstances[agentType]) {
        this.agentInstances[agentType] = await this.loadAgent(agentType);
      }
      
      const agent = this.agentInstances[agentType];
      
      if (!agent) {
        throw new Error(`Agent ${agentType} non trouvé`);
      }
      
      // Exécuter l'agent
      const startTime = Date.now();
      const result = await agent.run(context);
      
      return {
        success: true,
        agentType,
        context,
        data: result,
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        agentType,
        context,
        error: error.message || error,
        executionTime: 0
      };
    }
  }
  
  /**
   * Charge dynamiquement un agent à partir du registre d'agents
   */
  private async loadAgent(agentType: AgentType): Promise<any> {
    try {
      // Mapping des types d'agents vers les classes
      const agentClassMap: Record<AgentType, string> = {
        'php-analyzer': 'PhpAnalyzerAgent',
        'remix-generator': 'RemixGeneratorAgent',
        'qa-analyzer': 'QAAnalyzer',
        'diff-verifier': 'DiffVerifier',
        'dev-linter': 'DevLinter'
      };
      
      const className = agentClassMap[agentType];
      
      // Tenter de charger à partir du registre d'agents
      try {
        const registry = require('../../agentRegistry');
        if (registry[className]) {
          return new registry[className]();
        }
      } catch (e) {
        this.logger.warn(`Impossible de charger l'agent depuis le registre: ${e.message}`);
      }
      
      // Tenter de charger directement depuis le dossier agents
      try {
        const agentModule = require(`../../agents/${agentType}`);
        if (agentModule[className]) {
          return new agentModule[className]();
        }
        
        // Si le nom de classe standard n'est pas trouvé, essayer l'export par défaut
        if (agentModule.default) {
          return new agentModule.default();
        }
      } catch (e) {
        this.logger.warn(`Impossible de charger l'agent depuis le dossier: ${e.message}`);
      }
      
      throw new Error(`Agent ${agentType} non trouvé`);
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement de l'agent ${agentType}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Vérifie le statut d'un job
   */
  async checkJobStatus(agentType: AgentType, jobId: string): Promise<any> {
    try {
      const queue = this.queues[agentType];
      if (!queue) {
        throw new Error(`File d'attente non configurée pour l'agent ${agentType}`);
      }
      
      const job = await queue.getJob(jobId);
      
      if (!job) {
        return { 
          exists: false, 
          message: 'Job non trouvé' 
        };
      }
      
      const state = await job.getState();
      
      return {
        exists: true,
        id: job.id,
        state,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp
      };
    } catch (error: any) {
      this.logger.error(`Erreur lors de la vérification du job ${jobId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Écoute les événements de complétion d'un agent
   */
  onAgentComplete(
    callback: (result: AgentResult) => void | Promise<void>
  ): void {
    this.eventEmitter.on('agent.complete', callback);
  }
  
  /**
   * Écoute les événements d'échec d'un agent
   */
  onAgentFail(
    callback: (result: AgentResult) => void | Promise<void>
  ): void {
    this.eventEmitter.on('agent.fail', callback);
  }
  
  /**
   * Nettoie les ressources
   */
  async cleanup(): Promise<void> {
    try {
      // Fermer la connexion Redis
      if (this.redisClient.isOpen) {
        await this.redisClient.disconnect();
      }
      
      // Fermer les files d'attente
      if (!this.simulationMode) {
        for (const agentType of Object.keys(this.queues) as AgentType[]) {
          await this.queues[agentType].close();
          await this.schedulers[agentType].close();
        }
      }
      
      this.logger.log('Nettoyage terminé');
    } catch (error: any) {
      this.logger.error(`Erreur lors du nettoyage: ${error.message}`);
    }
  }
  
  /**
   * Obtient la version du lanceur d'agents
   */
  getVersion(): string {
    return '1.0.0';
  }
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  (async () => {
    const runner = new AgentRunner({
      simulationMode: process.argv.includes('--simulation'),
      useDirectExecution: process.argv.includes('--direct')
    });
    
    try {
      await runner.initialize();
      
      if (process.argv.length >= 4) {
        const agentType = process.argv[2] as AgentType;
        const filename = process.argv[3];
        
        console.log(`Lancement de l'agent ${agentType} pour ${filename}`);
        
        const result = await runner.launchAgent(agentType, {
          filename,
          priority: 10
        }, { waitForResult: true });
        
        console.log('Résultat:', JSON.stringify(result, null, 2));
      } else {
        console.log('Usage: node agent-runner.js <agent-type> <filename> [--simulation] [--direct]');
      }
      
      await runner.cleanup();
    } catch (error) {
      console.error('Erreur lors de l\'exécution du lanceur d\'agents:', error);
      await runner.cleanup();
      process.exit(1);
    }
  })();
}