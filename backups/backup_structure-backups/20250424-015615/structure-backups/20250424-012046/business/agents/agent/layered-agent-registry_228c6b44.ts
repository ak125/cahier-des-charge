/**
 * layered-agent-registry.ts
 * 
 * Registre d'agents avancé pour l'architecture MCP OS en 3 couches
 * 
 * Ce registre permet:
 * - La découverte automatique des agents par couche
 * - L'instanciation contrôlée des agents
 * - La gestion des dépendances entre agents
 * - Le suivi des métriques d'utilisation
 * 
 * Il est conçu pour remplacer progressivement l'ancien registre (agentRegistry.ts)
 */

import * as fs from fs-extrastructure-agent';
import * as path from pathstructure-agent';
import { Logger } from @nestjs/commonstructure-agent';
import { EventEmitter } from eventsstructure-agent';

// Types pour le manifest
import { AgentManifestEntry, AgentManifest } from ../../agentRegistrystructure-agent';

// Interfaces de la nouvelle architecture
import { BaseAgent } from ./interfaces/BaseAgentstructure-agent';
import { OrchestratorAgent, SchedulerAgent, MonitorAgent } from ./interfaces/orchestrationstructure-agent';
import { BridgeAgent, AdapterAgent, RegistryAgent } from ./interfaces/coordinationstructure-agent';
import { AnalyzerAgent, GeneratorAgent, ValidatorAgent, ParserAgent } from ./interfaces/businessstructure-agent';

// Type union pour tous les types d'agents
export type AnyAgent = BaseAgent | OrchestratorAgent | SchedulerAgent | MonitorAgent |
                      BridgeAgent | AdapterAgent | RegistryAgent |
                      AnalyzerAgent | GeneratorAgent | ValidatorAgent | ParserAgent;

// Couches disponibles
export type AgentLayer = 'orchestration' | 'coordination' | 'business';

// Types d'agents par couche
export type OrchestrationAgentType = 'orchestrator' | 'scheduler' | 'monitor';
export type CoordinationAgentType = 'bridge' | 'adapter' | 'registry';
export type BusinessAgentType = 'analyzer' | 'generator' | 'validator' | 'parser';
export type AgentType = OrchestrationAgentType | CoordinationAgentType | BusinessAgentType;

// Fonction utilitaire pour obtenir la couche d'un type d'agent
export function getLayerFromType(type: AgentType): AgentLayer {
  if (['orchestrator', 'scheduler', 'monitor'].includes(type)) return 'orchestration';
  if (['bridge', 'adapter', 'registry'].includes(type)) return 'coordination';
  return 'business';
}

// Configuration du registre d'agents
export interface LayeredAgentRegistryConfig {
  manifestPath?: string;
  enableAutoDiscovery?: boolean;
  agentBasePaths?: {
    orchestration?: string;
    coordination?: string;
    business?: string;
  };
  enableMetrics?: boolean;
  enableFailover?: boolean;
  verboseLogging?: boolean;
}

// Entrée du registre d'agent nouvelle architecture
export interface LayeredAgentEntry<T extends BaseAgent = BaseAgent> {
  id: string;
  name: string;
  type: AgentType;
  layer: AgentLayer;
  version: string;
  active: boolean;
  instance?: T;
  factory: () => Promise<T>;
  dependencies: string[];
  metadata: Record<string, any>;
  metrics?: {
    usageCount: number;
    lastUsed?: Date;
    avgExecutionTime?: number;
    failureRate?: number;
    totalExecutions: number;
    successfulExecutions: number;
  };
}

/**
 * Registre d'agents pour l'architecture en 3 couches
 */
export class LayeredAgentRegistry {
  private static instance: LayeredAgentRegistry;
  private readonly logger = new Logger('LayeredAgentRegistry');
  private readonly agents: Map<string, LayeredAgentEntry> = new Map();
  private readonly eventEmitter = new EventEmitter();
  private manifestData: AgentManifest | null = null;
  private isInitialized = false;

  private constructor(
    private readonly config: LayeredAgentRegistryConfig = {}
  ) {}

  /**
   * Obtient l'instance singleton du registre
   */
  public static getInstance(config?: LayeredAgentRegistryConfig): LayeredAgentRegistry {
    if (!LayeredAgentRegistry.instance) {
      LayeredAgentRegistry.instance = new LayeredAgentRegistry(config);
    }
    return LayeredAgentRegistry.instance;
  }

  /**
   * Initialise le registre d'agents
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.logger.log('Initialisation du registre d\'agents en couches...');

    // Chargement du manifest si présent
    if (this.config.manifestPath) {
      await this.loadManifest(this.config.manifestPath);
    }

    // Découverte automatique des agents
    if (this.config.enableAutoDiscovery) {
      await this.discoverAgents();
    }

    this.isInitialized = true;
    this.logger.log(`✅ Registre d'agents initialisé avec ${this.agents.size} agents`);
  }

  /**
   * Charge le fichier manifest
   */
  public async loadManifest(manifestPath: string): Promise<void> {
    try {
      if (!await fs.pathExists(manifestPath)) {
        this.logger.warn(`⚠️ Le fichier ${manifestPath} n'existe pas`);
        return;
      }
      
      this.manifestData = await fs.readJson(manifestPath);
      this.logger.log(`✅ Manifest d'agents chargé depuis ${manifestPath}`);
      
      // Enregistrer les agents du manifest
      for (const entry of this.manifestData.agents) {
        if (entry.status === 'active') {
          // Définir une factory simple basée sur le chemin de l'agent
          const factory = async () => {
            try {
              // Import dynamique basé sur le chemin relatif
              const modulePath = path.resolve(process.cwd(), entry.path);
              const AgentClass = (await import(modulePath))[entry.name];
              return new AgentClass();
            } catch (error: any) {
              this.logger.error(`❌ Erreur lors de l'instanciation de l'agent ${entry.id}: ${error.message}`);
              throw error;
            }
          };
          
          // Déterminer le type et la couche de l'agent à partir du nom et des tags
          const agentType = this.determineAgentType(entry.name, entry.tags);
          const layer = getLayerFromType(agentType);
          
          // Enregistrer l'agent
          this.registerAgent({
            id: entry.id,
            name: entry.name,
            type: agentType,
            layer,
            version: entry.version,
            active: true,
            factory,
            dependencies: entry.dependencies || [],
            metadata: {
              description: entry.description,
              apiEndpoint: entry.apiEndpoint,
              runInGithubActions: entry.runInGithubActions,
              config: entry.config
            },
            metrics: {
              usageCount: 0,
              totalExecutions: 0,
              successfulExecutions: 0
            }
          });
        }
      }
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors du chargement du manifest d'agents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Détermine le type d'agent à partir du nom et des tags
   */
  private determineAgentType(name: string, tags: string[]): AgentType {
    // Essayer d'abord avec les tags
    if (tags) {
      for (const tag of tags) {
        const normalizedTag = tag.toLowerCase();
        
        // Types d'orchestration
        if (['orchestrator', 'orchestration'].some(t => normalizedTag.includes(t))) {
          return 'orchestrator';
        }
        if (['scheduler', 'schedule'].some(t => normalizedTag.includes(t))) {
          return 'scheduler';
        }
        if (['monitor', 'monitoring'].some(t => normalizedTag.includes(t))) {
          return 'monitor';
        }
        
        // Types de coordination
        if (['bridge', 'integration'].some(t => normalizedTag.includes(t))) {
          return 'bridge';
        }
        if (['adapter', 'transform'].some(t => normalizedTag.includes(t))) {
          return 'adapter';
        }
        if (['registry', 'service-discovery'].some(t => normalizedTag.includes(t))) {
          return 'registry';
        }
        
        // Types métier
        if (['analyzer', 'analysis'].some(t => normalizedTag.includes(t))) {
          return 'analyzer';
        }
        if (['generator', 'generate'].some(t => normalizedTag.includes(t))) {
          return 'generator';
        }
        if (['validator', 'validate'].some(t => normalizedTag.includes(t))) {
          return 'validator';
        }
        if (['parser', 'parse'].some(t => normalizedTag.includes(t))) {
          return 'parser';
        }
      }
    }
    
    // Déterminer à partir du nom
    const normalizedName = name.toLowerCase();
    
    // Types d'orchestration
    if (normalizedName.includes('orchestrat')) return 'orchestrator';
    if (normalizedName.includes('schedul')) return 'scheduler';
    if (normalizedName.includes('monitor')) return 'monitor';
    
    // Types de coordination
    if (normalizedName.includes('bridge')) return 'bridge';
    if (normalizedName.includes('adapt')) return 'adapter';
    if (normalizedName.includes('registry')) return 'registry';
    
    // Types métier
    if (normalizedName.includes('analyz')) return 'analyzer';
    if (normalizedName.includes('generat')) return 'generator';
    if (normalizedName.includes('validat')) return 'validator';
    if (normalizedName.includes('parser')) return 'parser';
    
    // Par défaut, on considère que c'est un analyzer
    return 'analyzer';
  }

  /**
   * Découvre automatiquement les agents dans les répertoires configurés
   */
  private async discoverAgents(): Promise<void> {
    this.logger.log('Découverte automatique des agents en cours...');
    const basePaths = this.config.agentBasePaths || {};
    
    // Parcourir les 3 couches
    for (const layer of ['orchestration', 'coordination', 'business'] as AgentLayer[]) {
      const basePath = basePaths[layer] || path.join(process.cwd(), 'src', layer);
      
      try {
        // Vérifier si le répertoire existe
        if (!await fs.pathExists(basePath)) continue;
        
        // Explorer tous les sous-répertoires pour les agents
        const dirContent = await fs.readdir(basePath, { withFileTypes: true });
        
        for (const dirent of dirContent) {
          if (dirent.isDirectory()) {
            const agentTypeDir = path.join(basePath, dirent.name);
            
            // Vérifier si ce répertoire contient des implémentations d'agents
            const agentFiles = await this.findAgentImplementations(agentTypeDir);
            
            for (const agentFilePath of agentFiles) {
              await this.registerAgentFromFile(agentFilePath, layer);
            }
          }
        }
      } catch (error: any) {
        this.logger.warn(`⚠️ Erreur lors de la découverte d'agents dans ${basePath}: ${error.message}`);
      }
    }
    
    this.logger.log(`✅ Découverte terminée: ${this.agents.size} agents trouvés`);
  }

  /**
   * Trouve les implémentations d'agents dans un répertoire
   */
  private async findAgentImplementations(dir: string): Promise<string[]> {
    const result: string[] = [];
    
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          // Récursivement chercher dans les sous-répertoires
          const subDirResults = await this.findAgentImplementations(filePath);
          result.push(...subDirResults);
        } else if (file.name.endsWith('.ts') && !file.name.includes('.spec.') && !file.name.includes('.test.')) {
          // Vérifier si le fichier contient une implémentation d'agent
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (
              content.includes('implements BaseAgent') || 
              content.includes('extends BaseAgent') ||
              content.includes('implements OrchestratorAgent') ||
              content.includes('implements BridgeAgent') ||
              content.includes('implements AnalyzerAgent') ||
              content.includes('implements ValidatorAgent')
            ) {
              result.push(filePath);
            }
          } catch (error) {
            // Ignorer les erreurs de lecture
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ Erreur lors de la recherche d'implémentations d'agents dans ${dir}: ${error.message}`);
    }
    
    return result;
  }

  /**
   * Enregistre un agent à partir d'un fichier
   */
  private async registerAgentFromFile(filePath: string, layer: AgentLayer): Promise<void> {
    try {
      // Lire le contenu pour extraire les métadonnées
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extraire le nom de la classe
      const classMatch = content.match(/export\s+class\s+(\w+)/);
      if (!classMatch) return;
      
      const className = classMatch[1];
      
      // Extraire la version
      const versionMatch = content.match(/version\s*(?:=|:)\s*['"]([\d.]+)['"]/);
      const version = versionMatch ? versionMatch[1] : '1.0.0';
      
      // Extraire le type
      let type: AgentType;
      if (content.includes('implements OrchestratorAgent')) {
        type = 'orchestrator';
      } else if (content.includes('implements SchedulerAgent')) {
        type = 'scheduler';
      } else if (content.includes('implements MonitorAgent')) {
        type = 'monitor';
      } else if (content.includes('implements BridgeAgent')) {
        type = 'bridge';
      } else if (content.includes('implements AdapterAgent')) {
        type = 'adapter';
      } else if (content.includes('implements RegistryAgent')) {
        type = 'registry';
      } else if (content.includes('implements AnalyzerAgent')) {
        type = 'analyzer';
      } else if (content.includes('implements GeneratorAgent')) {
        type = 'generator';
      } else if (content.includes('implements ValidatorAgent')) {
        type = 'validator';
      } else if (content.includes('implements ParserAgent')) {
        type = 'parser';
      } else {
        // Déterminer à partir du nom
        type = this.determineAgentType(className, []);
      }
      
      // Créer une factory pour l'agent
      const factory = async () => {
        try {
          const AgentClass = (await import(filePath))[className];
          return new AgentClass();
        } catch (error: any) {
          this.logger.error(`❌ Erreur lors de l'instanciation de l'agent ${className}: ${error.message}`);
          throw error;
        }
      };
      
      // Déterminer l'ID
      const id = className.charAt(0).toLowerCase() + className.slice(1).replace(/Agent$/, '');
      
      // Enregistrer l'agent
      this.registerAgent({
        id,
        name: className,
        type,
        layer,
        version,
        active: true,
        factory,
        dependencies: [],
        metadata: {
          filePath,
          className
        },
        metrics: {
          usageCount: 0,
          totalExecutions: 0,
          successfulExecutions: 0
        }
      });
      
    } catch (error: any) {
      this.logger.warn(`⚠️ Erreur lors de l'enregistrement de l'agent depuis ${filePath}: ${error.message}`);
    }
  }

  /**
   * Enregistre un nouvel agent dans le registre
   */
  public registerAgent(entry: LayeredAgentEntry): void {
    if (this.agents.has(entry.id)) {
      this.logger.warn(`⚠️ Un agent avec l'ID "${entry.id}" existe déjà dans le registre. Écrasement...`);
    }
    
    this.agents.set(entry.id, entry);
    this.eventEmitter.emit('agent:registered', entry);
    
    if (this.config.verboseLogging) {
      this.logger.log(`📝 Agent enregistré: ${entry.name} (${entry.layer}/${entry.type}) v${entry.version}`);
    }
  }

  /**
   * Récupère un agent par son ID
   */
  public async getAgent<T extends BaseAgent>(id: string): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const entry = this.agents.get(id);
    if (!entry || !entry.active) {
      throw new Error(`Agent "${id}" non trouvé ou inactif`);
    }
    
    try {
      // Si l'instance n'existe pas encore, la créer
      if (!entry.instance) {
        entry.instance = await entry.factory();
      }
      
      // Mettre à jour les métriques
      if (this.config.enableMetrics && entry.metrics) {
        entry.metrics.usageCount++;
        entry.metrics.lastUsed = new Date();
      }
      
      this.eventEmitter.emit('agent:used', {
        id: entry.id,
        timestamp: new Date()
      });
      
      return entry.instance as T;
    } catch (error) {
      this.eventEmitter.emit('agent:error', {
        id: entry.id,
        error,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Récupère tous les agents d'une couche spécifique
   */
  public async getAgentsByLayer<T extends BaseAgent = BaseAgent>(layer: AgentLayer): Promise<Map<string, T>> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const result = new Map<string, T>();
    
    for (const [id, entry] of this.agents.entries()) {
      if (entry.layer === layer && entry.active) {
        try {
          if (!entry.instance) {
            entry.instance = await entry.factory();
          }
          result.set(id, entry.instance as T);
        } catch (error) {
          this.logger.warn(`⚠️ Impossible d'instancier l'agent ${id}: ${error}`);
        }
      }
    }
    
    return result;
  }

  /**
   * Récupère tous les agents d'un type spécifique
   */
  public async getAgentsByType<T extends BaseAgent = BaseAgent>(type: AgentType): Promise<Map<string, T>> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const result = new Map<string, T>();
    
    for (const [id, entry] of this.agents.entries()) {
      if (entry.type === type && entry.active) {
        try {
          if (!entry.instance) {
            entry.instance = await entry.factory();
          }
          result.set(id, entry.instance as T);
        } catch (error) {
          this.logger.warn(`⚠️ Impossible d'instancier l'agent ${id}: ${error}`);
        }
      }
    }
    
    return result;
  }

  /**
   * Désactive un agent
   */
  public deactivateAgent(id: string): boolean {
    const entry = this.agents.get(id);
    if (!entry) {
      return false;
    }
    
    entry.active = false;
    this.eventEmitter.emit('agent:deactivated', { id, timestamp: new Date() });
    return true;
  }

  /**
   * Réactive un agent désactivé
   */
  public activateAgent(id: string): boolean {
    const entry = this.agents.get(id);
    if (!entry) {
      return false;
    }
    
    entry.active = true;
    this.eventEmitter.emit('agent:activated', { id, timestamp: new Date() });
    return true;
  }

  /**
   * Enregistre l'exécution d'un agent (pour les métriques)
   */
  public recordExecution(id: string, success: boolean, executionTime?: number): void {
    if (!this.config.enableMetrics) return;
    
    const entry = this.agents.get(id);
    if (!entry || !entry.metrics) return;
    
    entry.metrics.totalExecutions++;
    if (success) {
      entry.metrics.successfulExecutions++;
    }
    
    if (executionTime !== undefined) {
      if (!entry.metrics.avgExecutionTime) {
        entry.metrics.avgExecutionTime = executionTime;
      } else {
        // Moyenne mobile
        entry.metrics.avgExecutionTime = 
          (entry.metrics.avgExecutionTime * (entry.metrics.totalExecutions - 1) + executionTime) / 
          entry.metrics.totalExecutions;
      }
    }
    
    // Calculer le taux d'échec
    entry.metrics.failureRate = 
      (entry.metrics.totalExecutions - entry.metrics.successfulExecutions) / 
      entry.metrics.totalExecutions;
  }

  /**
   * S'abonne aux événements du registre d'agents
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Se désabonne des événements du registre d'agents
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Récupère les métriques pour tous les agents
   */
  public getMetrics(): Record<string, any> {
    if (!this.config.enableMetrics) {
      return { metricsDisabled: true };
    }
    
    const metrics: Record<string, any> = {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.active).length,
      byLayer: {} as Record<string, any>,
      byType: {} as Record<string, any>,
      agentMetrics: {} as Record<string, any>
    };
    
    // Compter par couche
    for (const layer of ['orchestration', 'coordination', 'business'] as AgentLayer[]) {
      metrics.byLayer[layer] = Array.from(this.agents.values()).filter(a => a.layer === layer).length;
    }
    
    // Compter par type
    const types: AgentType[] = [
      'orchestrator', 'scheduler', 'monitor',
      'bridge', 'adapter', 'registry',
      'analyzer', 'generator', 'validator', 'parser'
    ];
    
    for (const type of types) {
      metrics.byType[type] = Array.from(this.agents.values()).filter(a => a.type === type).length;
    }
    
    // Métriques individuelles
    for (const [id, entry] of this.agents.entries()) {
      if (entry.metrics) {
        metrics.agentMetrics[id] = { ...entry.metrics };
      }
    }
    
    return metrics;
  }
}

// Point d'entrée pour création facile du registre
export const createLayeredAgentRegistry = (config?: LayeredAgentRegistryConfig): LayeredAgentRegistry => {
  return LayeredAgentRegistry.getInstance(config);
};

export default LayeredAgentRegistry;