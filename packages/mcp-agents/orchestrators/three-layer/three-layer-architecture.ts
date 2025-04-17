/**
 * Implémentation de l'architecture à trois couches
 * 
 * Cette classe intègre les trois couches (orchestration, coordination, métier)
 * et fournit une interface unifiée pour l'utilisation de l'architecture.
 */

import { OrchestrationAbstraction, WorkflowDefinition, ExecutionOptions, ExecutionResult } from './abstraction-layer';
import { ICoordinationLayer, CoordinationOptions, AgentSequence, ParallelExecutionOptions } from './coordination-layer';
import { BusinessServiceRegistry, IBusinessService, BusinessServiceOptions } from './business-layer';

/**
 * Options de configuration de l'architecture à trois couches
 */
export interface ThreeLayerArchitectureOptions {
  /**
   * Instance de la couche d'orchestration
   */
  orchestrationLayer: OrchestrationAbstraction;

  /**
   * Instance de la couche de coordination
   */
  coordinationLayer: ICoordinationLayer;

  /**
   * Registre de services métier
   */
  businessServiceRegistry: BusinessServiceRegistry;

  /**
   * Configuration spécifique à l'orchestrateur
   */
  orchestratorConfig?: Record<string, any>;

  /**
   * Configuration spécifique à la coordination
   */
  coordinationConfig?: Record<string, any>;

  /**
   * Configuration spécifique aux services métier
   */
  businessConfig?: Record<string, any>;

  /**
   * Répertoire de travail
   */
  workDir?: string;

  /**
   * Fonction de journalisation personnalisée
   */
  logger?: (level: string, message: string, context?: any) => void;

  /**
   * Activer le mode de développement (journalisation détaillée, etc.)
   */
  devMode?: boolean;
}

/**
 * Classe principale implémentant l'architecture à trois couches
 */
export class ThreeLayerArchitecture {
  private orchestrationLayer: OrchestrationAbstraction;
  private coordinationLayer: ICoordinationLayer;
  private businessServiceRegistry: BusinessServiceRegistry;
  private config: ThreeLayerArchitectureOptions;
  private initialized: boolean = false;
  private workflowRegistry: Map<string, WorkflowDefinition> = new Map();

  /**
   * Constructeur
   * @param options Options de configuration
   */
  constructor(options: ThreeLayerArchitectureOptions) {
    this.orchestrationLayer = options.orchestrationLayer;
    this.coordinationLayer = options.coordinationLayer;
    this.businessServiceRegistry = options.businessServiceRegistry;
    this.config = options;
  }

  /**
   * Initialise l'architecture à trois couches
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.log('warning', 'ThreeLayerArchitecture est déjà initialisé');
      return;
    }

    this.log('info', 'Initialisation de l\'architecture à trois couches');

    try {
      // Initialiser les couches dans l'ordre de dépendance
      this.log('info', 'Initialisation de la couche d\'orchestration');
      await this.orchestrationLayer.initialize();

      this.log('info', 'Initialisation de la couche de coordination');
      await this.coordinationLayer.initialize();

      // Vérifier les services métier disponibles
      const services = this.businessServiceRegistry.getAllServices();
      this.log('info', `${services.length} services métier disponibles`);

      // Enregistrer les workflows par défaut
      await this.registerDefaultWorkflows();

      this.initialized = true;
      this.log('info', 'Architecture à trois couches initialisée avec succès');
    } catch (error: any) {
      this.log('error', `Erreur lors de l'initialisation: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Enregistre les workflows par défaut basés sur les services métier disponibles
   */
  private async registerDefaultWorkflows(): Promise<void> {
    this.log('info', 'Enregistrement des workflows par défaut');

    // Récupérer tous les services métier
    const services = this.businessServiceRegistry.getAllServices();

    // Créer un workflow simple pour chaque service
    for (const service of services) {
      // Création d'un workflow simple pour exécuter ce service directement
      const workflowId = `single-service-${service.id}`;
      const workflow: WorkflowDefinition = {
        id: workflowId,
        name: `Exécution directe du service ${service.name}`,
        description: `Workflow simple pour exécuter le service ${service.name} directement`,
        implementation: {
          serviceId: service.id,
          type: 'direct-execution'
        },
        metadata: {
          serviceInfo: service,
          category: 'single-service',
          createdAt: new Date().toISOString()
        }
      };

      await this.orchestrationLayer.registerWorkflow(workflow);
      this.workflowRegistry.set(workflowId, workflow);
      this.log('debug', `Workflow enregistré: ${workflowId}`);
    }

    // Enregistrer des workflows composés basés sur les dépendances des services
    await this.registerCompositeWorkflows();

    this.log('info', `${this.workflowRegistry.size} workflows enregistrés au total`);
  }

  /**
   * Enregistre des workflows composés qui combinent plusieurs services
   */
  private async registerCompositeWorkflows(): Promise<void> {
    // Récupérer tous les services
    const services = this.businessServiceRegistry.getAllServices();
    
    // Créer un graphe de dépendances entre services
    const dependencyGraph = new Map<string, string[]>();
    
    for (const service of services) {
      if (service.dependencies && service.dependencies.length > 0) {
        dependencyGraph.set(service.id, service.dependencies);
      }
    }
    
    // Identifier les chaînes de services (séquences)
    const chains = this.identifyServiceChains(dependencyGraph);
    
    // Créer un workflow pour chaque chaîne significative
    for (let i = 0; i < chains.length; i++) {
      const chain = chains[i];
      
      // Ne considérer que les chaînes de 2 services ou plus
      if (chain.length >= 2) {
        const workflowId = `chain-${i}-${chain.join('-')}`;
        const serviceNames = chain.map(id => {
          const serviceInfo = services.find(s => s.id === id);
          return serviceInfo ? serviceInfo.name : id;
        });
        
        const workflow: WorkflowDefinition = {
          id: workflowId,
          name: `Chaîne: ${serviceNames.join(' → ')}`,
          description: `Workflow exécutant la chaîne de services: ${serviceNames.join(' → ')}`,
          implementation: {
            type: 'service-chain',
            services: chain,
          },
          metadata: {
            category: 'composite',
            serviceChain: chain,
            createdAt: new Date().toISOString()
          }
        };
        
        await this.orchestrationLayer.registerWorkflow(workflow);
        this.workflowRegistry.set(workflowId, workflow);
        this.log('debug', `Workflow chaîné enregistré: ${workflowId}`);
      }
    }
    
    // Créer aussi quelques workflows parallèles pour les services indépendants
    const independentServices = services.filter(s => !s.dependencies || s.dependencies.length === 0);
    
    if (independentServices.length >= 2) {
      const parallelGroups = this.groupIndependentServices(independentServices);
      
      for (let i = 0; i < parallelGroups.length; i++) {
        const group = parallelGroups[i];
        
        if (group.length >= 2) {
          const serviceIds = group.map(s => s.id);
          const serviceNames = group.map(s => s.name);
          const workflowId = `parallel-${i}-${serviceIds.join('-')}`;
          
          const workflow: WorkflowDefinition = {
            id: workflowId,
            name: `Parallèle: ${serviceNames.join(' + ')}`,
            description: `Workflow exécutant en parallèle les services: ${serviceNames.join(', ')}`,
            implementation: {
              type: 'parallel-execution',
              services: serviceIds,
            },
            metadata: {
              category: 'parallel',
              serviceGroup: serviceIds,
              createdAt: new Date().toISOString()
            }
          };
          
          await this.orchestrationLayer.registerWorkflow(workflow);
          this.workflowRegistry.set(workflowId, workflow);
          this.log('debug', `Workflow parallèle enregistré: ${workflowId}`);
        }
      }
    }
  }

  /**
   * Identifie les chaînes de services basées sur leurs dépendances
   */
  private identifyServiceChains(dependencyGraph: Map<string, string[]>): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();
    
    // Pour chaque service dans le graphe
    for (const [serviceId, _] of dependencyGraph) {
      if (!visited.has(serviceId)) {
        const chain: string[] = [];
        this.depthFirstTraversal(serviceId, dependencyGraph, visited, chain);
        if (chain.length > 0) {
          chains.push(chain);
        }
      }
    }
    
    return chains;
  }

  /**
   * Parcours en profondeur du graphe de dépendances
   */
  private depthFirstTraversal(
    serviceId: string, 
    graph: Map<string, string[]>, 
    visited: Set<string>,
    currentChain: string[]
  ): void {
    visited.add(serviceId);
    currentChain.push(serviceId);
    
    const dependencies = graph.get(serviceId) || [];
    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        this.depthFirstTraversal(dependency, graph, visited, currentChain);
      }
    }
  }

  /**
   * Groupe les services indépendants par affinité fonctionnelle
   */
  private groupIndependentServices(services: any[]): any[][] {
    // Simplification: grouper par préfixe commun dans l'ID ou par type d'entrée/sortie
    const groups: any[][] = [];
    const used = new Set<string>();
    
    // Grouper par préfixe d'ID (ex: "seo-*", "dev-*")
    const prefixes = new Set<string>();
    for (const service of services) {
      const match = service.id.match(/^([a-z]+-)/);
      if (match) {
        prefixes.add(match[1]);
      }
    }
    
    for (const prefix of prefixes) {
      const group = services.filter(s => 
        s.id.startsWith(prefix) && !used.has(s.id)
      );
      
      if (group.length >= 2) {
        for (const service of group) {
          used.add(service.id);
        }
        groups.push(group);
      }
    }
    
    // Grouper par type d'entrée commun
    const inputTypes = new Map<string, any[]>();
    for (const service of services) {
      if (used.has(service.id)) continue;
      
      if (service.inputTypes && service.inputTypes.length > 0) {
        for (const inputType of service.inputTypes) {
          if (!inputTypes.has(inputType)) {
            inputTypes.set(inputType, []);
          }
          inputTypes.get(inputType)?.push(service);
        }
      }
    }
    
    for (const [_, servicesOfType] of inputTypes) {
      const group = servicesOfType.filter(s => !used.has(s.id));
      if (group.length >= 2) {
        for (const service of group) {
          used.add(service.id);
        }
        groups.push(group);
      }
    }
    
    // Ajouter les services restants dans des groupes ad hoc
    const remaining = services.filter(s => !used.has(s.id));
    if (remaining.length >= 2) {
      for (let i = 0; i < remaining.length; i += 3) {
        const group = remaining.slice(i, i + 3);
        if (group.length >= 2) {
          groups.push(group);
        }
      }
    }
    
    return groups;
  }

  /**
   * Enregistre un workflow personnalisé
   * @param workflow Définition du workflow
   */
  async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log('info', `Enregistrement du workflow ${workflow.id}`);
    
    try {
      await this.orchestrationLayer.registerWorkflow(workflow);
      this.workflowRegistry.set(workflow.id, workflow);
      this.log('info', `Workflow ${workflow.id} enregistré avec succès`);
    } catch (error: any) {
      this.log('error', `Erreur lors de l'enregistrement du workflow ${workflow.id}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Exécute un workflow enregistré
   * @param workflowId Identifiant du workflow à exécuter
   * @param input Données d'entrée pour le workflow
   * @param options Options d'exécution
   */
  async executeWorkflow(workflowId: string, input: any, options?: ExecutionOptions): Promise<ExecutionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log('info', `Exécution du workflow ${workflowId}`);
    
    if (!this.workflowRegistry.has(workflowId)) {
      this.log('warning', `Workflow ${workflowId} non trouvé dans le registre local`);
    }
    
    try {
      // Si le workflow est de type "direct-execution", il s'agit d'une exécution directe d'un service
      const workflow = this.workflowRegistry.get(workflowId);
      
      if (workflow?.implementation?.type === 'direct-execution') {
        return this.executeDirectServiceWorkflow(workflow, input, options);
      } 
      else if (workflow?.implementation?.type === 'service-chain') {
        return this.executeServiceChainWorkflow(workflow, input, options);
      }
      else if (workflow?.implementation?.type === 'parallel-execution') {
        return this.executeParallelServicesWorkflow(workflow, input, options);
      }
      
      // Sinon, déléguer à la couche d'orchestration
      return await this.orchestrationLayer.executeWorkflow(workflowId, input, options);
    } catch (error: any) {
      this.log('error', `Erreur lors de l'exécution du workflow ${workflowId}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Exécute un workflow de type "direct-execution" (service unique)
   */
  private async executeDirectServiceWorkflow(
    workflow: WorkflowDefinition, 
    input: any, 
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    const serviceId = workflow.implementation.serviceId;
    this.log('info', `Exécution directe du service ${serviceId}`);
    
    // Créer un identifiant d'exécution unique
    const executionId = options?.executionId || `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Obtenir le service depuis le registre
      const service = await this.businessServiceRegistry.getService(serviceId);
      
      // Adapter les options pour le service métier
      const serviceOptions: BusinessServiceOptions = {
        context: {
          executionId,
          workDir: this.config.workDir,
          utils: {
            log: (level, message) => this.log(level, message, { serviceId, executionId }),
            fetchData: async (source, params) => this.fetchData(source, params),
            reportProgress: (progress, message) => this.reportProgress(executionId, progress, message)
          },
          environment: {
            env: process.env.NODE_ENV || 'development',
            pathSeparator: '/'
          },
          metadata: options
        },
        dryRun: options?.dryRun || false,
        verbosity: this.config.devMode ? 'detailed' : 'normal'
      };
      
      // Exécuter le service
      const startTime = Date.now();
      const result = await service.execute(input, serviceOptions);
      const endTime = Date.now();
      
      // Convertir le résultat au format attendu par la couche d'orchestration
      return {
        jobId: executionId,
        status: {
          state: result.status === 'success' ? 'COMPLETED' : result.status === 'warning' ? 'COMPLETED' : 'FAILED',
          progress: 100,
          result: result.data,
          error: result.status === 'error' ? {
            message: result.error?.message || 'Erreur inconnue',
            code: result.error?.code,
            details: result.error?.context
          } : undefined,
          timestamps: {
            created: new Date(startTime),
            started: new Date(startTime),
            completed: new Date(endTime)
          }
        },
        context: {
          serviceId,
          workflowId: workflow.id,
          summary: result.summary,
          logs: result.logs
        }
      };
    } catch (error: any) {
      this.log('error', `Erreur lors de l'exécution du service ${serviceId}: ${error.message}`, error);
      
      // Convertir l'erreur en résultat d'exécution
      return {
        jobId: executionId,
        status: {
          state: 'FAILED',
          error: {
            message: error.message,
            code: error.code,
            details: error.stack
          },
          timestamps: {
            created: new Date(),
            started: new Date(),
            completed: new Date()
          }
        }
      };
    }
  }

  /**
   * Exécute un workflow de type "service-chain" (chaîne de services)
   */
  private async executeServiceChainWorkflow(
    workflow: WorkflowDefinition, 
    input: any, 
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    const serviceIds = workflow.implementation.services;
    this.log('info', `Exécution de la chaîne de services: ${serviceIds.join(' → ')}`);
    
    // Créer un identifiant d'exécution unique
    const executionId = options?.executionId || `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Créer une séquence d'agents pour la couche de coordination
      const sequence: AgentSequence = {
        steps: serviceIds.map(serviceId => ({
          agentId: serviceId
        })),
        options: {
          context: {
            executionId,
            executionType: 'sequence',
            sharedData: {},
            utils: {
              log: (level, message) => this.log(level, message, { sequence: serviceIds, executionId }),
              updateSharedData: () => {}, // Sera remplacé par la couche de coordination
              reportProgress: (progress, message) => this.reportProgress(executionId, progress, message),
              createCheckpoint: async () => executionId
            }
          },
          maxRetries: options?.retries || 0,
          timeout: options?.timeout
        }
      };
      
      // Exécuter la séquence via la couche de coordination
      const startTime = Date.now();
      const result = await this.coordinationLayer.executeSequence(sequence, input, sequence.options);
      const endTime = Date.now();
      
      // Convertir le résultat au format attendu par la couche d'orchestration
      return {
        jobId: executionId,
        status: {
          state: result.status === 'success' ? 'COMPLETED' : result.status === 'warning' ? 'COMPLETED' : 'FAILED',
          progress: 100,
          result: result.data,
          error: result.status === 'error' ? {
            message: result.error?.message || 'Erreur inconnue',
            code: '',
            details: result.error
          } : undefined,
          timestamps: {
            created: new Date(startTime),
            started: new Date(startTime),
            completed: new Date(endTime)
          }
        },
        context: {
          serviceIds,
          workflowId: workflow.id,
          results: result.results.map(r => ({
            serviceId: r.agentId,
            status: r.status,
            duration: r.duration
          })),
          sharedData: result.sharedData
        }
      };
    } catch (error: any) {
      this.log('error', `Erreur lors de l'exécution de la chaîne de services: ${error.message}`, error);
      
      // Convertir l'erreur en résultat d'exécution
      return {
        jobId: executionId,
        status: {
          state: 'FAILED',
          error: {
            message: error.message,
            code: '',
            details: error.stack
          },
          timestamps: {
            created: new Date(),
            started: new Date(),
            completed: new Date()
          }
        }
      };
    }
  }

  /**
   * Exécute un workflow de type "parallel-execution" (services en parallèle)
   */
  private async executeParallelServicesWorkflow(
    workflow: WorkflowDefinition, 
    input: any, 
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    const serviceIds = workflow.implementation.services;
    this.log('info', `Exécution parallèle des services: ${serviceIds.join(', ')}`);
    
    // Créer un identifiant d'exécution unique
    const executionId = options?.executionId || `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Créer les options pour l'exécution parallèle
      const parallelOptions: ParallelExecutionOptions = {
        context: {
          executionId,
          executionType: 'parallel',
          sharedData: {},
          utils: {
            log: (level, message) => this.log(level, message, { parallel: serviceIds, executionId }),
            updateSharedData: () => {}, // Sera remplacé par la couche de coordination
            reportProgress: (progress, message) => this.reportProgress(executionId, progress, message),
            createCheckpoint: async () => executionId
          }
        },
        maxRetries: options?.retries || 0,
        timeout: options?.timeout,
        maxConcurrency: options?.maxConcurrency || serviceIds.length,
        failFast: options?.failFast || false
      };
      
      // Exécuter les services en parallèle via la couche de coordination
      const startTime = Date.now();
      const result = await this.coordinationLayer.executeParallel(serviceIds, input, parallelOptions);
      const endTime = Date.now();
      
      // Convertir le résultat au format attendu par la couche d'orchestration
      return {
        jobId: executionId,
        status: {
          state: result.status === 'success' ? 'COMPLETED' : result.status === 'warning' ? 'COMPLETED' : 'FAILED',
          progress: 100,
          result: Object.fromEntries(
            Object.entries(result.results).map(([id, res]) => [id, res.data])
          ),
          error: result.status === 'error' ? {
            message: `${result.errorCount} services ont échoué`,
            code: '',
            details: result.errors
          } : undefined,
          timestamps: {
            created: new Date(startTime),
            started: new Date(startTime),
            completed: new Date(endTime)
          }
        },
        context: {
          serviceIds,
          workflowId: workflow.id,
          successCount: result.successCount,
          warningCount: result.warningCount,
          errorCount: result.errorCount,
          results: Object.entries(result.results).map(([id, res]) => ({
            serviceId: id,
            status: res.status,
            duration: res.duration
          }))
        }
      };
    } catch (error: any) {
      this.log('error', `Erreur lors de l'exécution parallèle des services: ${error.message}`, error);
      
      // Convertir l'erreur en résultat d'exécution
      return {
        jobId: executionId,
        status: {
          state: 'FAILED',
          error: {
            message: error.message,
            code: '',
            details: error.stack
          },
          timestamps: {
            created: new Date(),
            started: new Date(),
            completed: new Date()
          }
        }
      };
    }
  }

  /**
   * Exécute un service métier directement
   * @param serviceId Identifiant du service
   * @param input Données d'entrée
   * @param options Options d'exécution
   */
  async executeService<T = any, R = any>(
    serviceId: string, 
    input: T, 
    options?: BusinessServiceOptions
  ): Promise<R> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log('info', `Exécution directe du service ${serviceId}`);
    
    try {
      const service = await this.businessServiceRegistry.getService<T, R>(serviceId);
      const result = await service.execute(input, options);
      
      if (result.status === 'error') {
        throw new Error(result.error?.message || 'Erreur inconnue dans le service');
      }
      
      return result.data as R;
    } catch (error: any) {
      this.log('error', `Erreur lors de l'exécution du service ${serviceId}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Crée une séquence de services à exécuter
   * @param serviceIds Liste ordonnée d'identifiants de services
   * @param options Options de coordination
   */
  createSequence(serviceIds: string[], options?: CoordinationOptions): AgentSequence {
    return {
      steps: serviceIds.map(serviceId => ({ agentId: serviceId })),
      options
    };
  }

  /**
   * Fonction utilitaire pour récupérer des données
   */
  private async fetchData<T>(source: string, params?: any): Promise<T> {
    // Implémentation simplifiée, à étendre selon les besoins
    this.log('debug', `Récupération de données depuis ${source}`);
    
    try {
      // Simulation de récupération de données
      return {} as T;
    } catch (error: any) {
      this.log('error', `Erreur lors de la récupération de données: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fonction utilitaire pour rapporter la progression
   */
  private reportProgress(executionId: string, progress: number, message?: string): void {
    this.log('debug', `Progression de ${executionId}: ${progress}%${message ? ' - ' + message : ''}`);
    
    // Ici, vous pourriez implémenter un mécanisme pour suivre la progression
    // et la rendre disponible via une API ou un tableau de bord
  }

  /**
   * Journalisation
   */
  private log(level: 'debug' | 'info' | 'warning' | 'error', message: string, context?: any): void {
    // Utiliser la fonction de journalisation personnalisée si disponible
    if (this.config.logger) {
      this.config.logger(level, message, context);
      return;
    }
    
    // Sinon, utiliser console.log avec un format simple
    const timestamp = new Date().toISOString();
    const levelPrefix = level.toUpperCase().padEnd(7);
    const contextStr = context ? JSON.stringify(context) : '';
    
    // En mode dev, tout afficher
    if (this.config.devMode || level !== 'debug') {
      console.log(`[${timestamp}] ${levelPrefix} ${message}${contextStr ? ' ' + contextStr : ''}`);
    }
  }

  /**
   * Ferme l'architecture à trois couches
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('info', 'Fermeture de l\'architecture à trois couches');
    
    try {
      await this.coordinationLayer.close();
      await this.orchestrationLayer.close();
      this.initialized = false;
      this.log('info', 'Architecture à trois couches fermée avec succès');
    } catch (error: any) {
      this.log('error', `Erreur lors de la fermeture: ${error.message}`, error);
      throw error;
    }
  }
}