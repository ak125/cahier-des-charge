/**
 * agentRegistry.ts
 * 
 * Registre d'agents avec support pour la nouvelle architecture MCP OS en 3 couches
 * Cette version maintient la compatibilité avec l'ancien système tout en supportant 
 * progressivement la nouvelle architecture.
 */

import * as fs from fs-extrastructure-agent';
import * as path from pathstructure-agent';
import { Logger } from @nestjs/commonstructure-agent';

// Importer les types de la nouvelle architecture
import { BaseAgent } from ./src/core/interfaces/BaseAgentstructure-agent';
import { OrchestratorAgent, SchedulerAgent, MonitorAgent } from ./src/core/interfaces/orchestrationstructure-agent';
import { BridgeAgent, AdapterAgent, RegistryAgent } from ./src/core/interfaces/coordinationstructure-agent';
import { AnalyzerAgent, GeneratorAgent, ValidatorAgent, ParserAgent } from ./src/core/interfaces/businessstructure-agent';

// Import manuel des agents
import { QAAnalyzer } from ./agents/qa-analyzer';
import { PhpAnalyzerAgent } from ./agents/PhpAnalyzer-agentstructure-agent';
import { DiffVerifier } from ./agents/DiffVerifierstructure-agent';
import { SeoCheckerAgent } from ./agents/SeoCheckerstructure-agent';
import { MCPManifestManager } from ./agentsDotMcpManifestManagerstructure-agent';
import { DevLinter } from ./agents/DevLinterstructure-agent';
import { MonitoringCheck } from ./agents/MonitoringCheckstructure-agent';
import { Notifier } from ./agents/notifierstructure-agent';
import { Orchestrator } from ./agents/orchestratorstructure-agent';
import { PRCreator } from ./agents/PrCreatorstructure-agent';
import { BullMQOrchestrator } from ./agents/BullmqOrchestratorstructure-agent';

// Types pour le manifest
export interface AgentManifestEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  path: string;
  status: 'active' | 'deprecated' | 'experimental';
  dependencies?: string[];
  tags?: string[];
  apiEndpoint?: string;
  runInGithubActions?: boolean;
  config?: Record<string, any>;
}

export interface AgentManifest {
  version: string;
  lastUpdated: string;
  agents: AgentManifestEntry[];
}

/**
 * Gestionnaire du registre d'agents
 * Compatible avec l'architecture MCP OS en 3 couches
 */
export class AgentRegistryManager {
  private static instance: AgentRegistryManager;
  private readonly logger = new Logger('AgentRegistryManager');
  private manifestData: AgentManifest | null = null;
  private readonly manifestPath: string;
  
  // Registre structuré par couches pour la nouvelle architecture
  private readonly layeredAgents = {
    orchestration: new Map<string, BaseAgent>(),
    coordination: new Map<string, BaseAgent>(),
    business: new Map<string, BaseAgent>()
  };
  
  // Maintenir aussi l'ancien format plat pour rétrocompatibilité
  private readonly legacyAgentRegistry: Record<string, any> = {};
  
  constructor(manifestPath?: string) {
    this.manifestPath = manifestPath || path.join(process.cwd(), 'agent-manifest.json');
  }
  
  /**
   * Obtient l'instance singleton
   */
  public static getInstance(manifestPath?: string): AgentRegistryManager {
    if (!AgentRegistryManager.instance) {
      AgentRegistryManager.instance = new AgentRegistryManager(manifestPath);
    }
    return AgentRegistryManager.instance;
  }
  
  /**
   * Charge le manifest des agents
   */
  public async loadManifest(): Promise<AgentManifest> {
    try {
      if (await fs.pathExists(this.manifestPath)) {
        this.manifestData = await fs.readJson(this.manifestPath);
        this.logger.log(`Manifest d'agents chargé: ${this.manifestPath}`);
        return this.manifestData;
      } else {
        this.logger.warn(`Le manifest d'agents n'existe pas: ${this.manifestPath}`);
        // Créer un manifest vide par défaut
        this.manifestData = {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          agents: []
        };
        return this.manifestData;
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement du manifest: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Enregistre un agent dans le registre par couche
   */
  public registerLayeredAgent(
    layer: 'orchestration' | 'coordination' | 'business', 
    agentId: string, 
    agent: BaseAgent
  ): void {
    this.layeredAgents[layer].set(agentId, agent);
    
    // Maintenir aussi dans le registre plat pour rétrocompatibilité
    this.legacyAgentRegistry[agentId] = agent;
    
    this.logger.log(`Agent ${agentId} enregistré dans la couche ${layer}`);
  }
  
  /**
   * Récupère un agent par son ID
   */
  public getAgent(agentId: string): BaseAgent | null {
    // Chercher d'abord dans l'ancien registre pour rétrocompatibilité
    if (this.legacyAgentRegistry[agentId]) {
      return this.legacyAgentRegistry[agentId];
    }
    
    // Sinon chercher dans le registre par couches
    for (const layer of ['orchestration', 'coordination', 'business'] as const) {
      if (this.layeredAgents[layer].has(agentId)) {
        return this.layeredAgents[layer].get(agentId) || null;
      }
    }
    
    return null;
  }
  
  /**
   * Récupère tous les agents d'une couche spécifique
   */
  public getAgentsByLayer(layer: 'orchestration' | 'coordination' | 'business'): BaseAgent[] {
    return Array.from(this.layeredAgents[layer].values());
  }
  
  /**
   * Récupère tous les agents d'un type spécifique
   */
  public getAgentsByType(type: string): BaseAgent[] {
    const result: BaseAgent[] = [];
    
    for (const layer of ['orchestration', 'coordination', 'business'] as const) {
      for (const agent of this.layeredAgents[layer].values()) {
        if ((agent as any).type === type) {
          result.push(agent);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Méthode de validation d'agents
   */
  public validateAgent(agentId: string): boolean {
    const agent = this.getAgent(agentId);
    if (!agent) {
      this.logger.warn(`Agent non trouvé: ${agentId}`);
      return false;
    }
    
    // Vérification basique que l'agent a les méthodes requises
    const requiredMethods = ['initialize', 'shutdown'];
    const missingMethods = requiredMethods.filter(
      method => typeof (agent as any)[method] !== 'function'
    );
    
    if (missingMethods.length > 0) {
      this.logger.warn(`Agent ${agentId} ne respecte pas l'interface: méthodes manquantes: ${missingMethods.join(', ')}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Génère un rapport sur les agents enregistrés
   */
  public generateReport(): Record<string, any> {
    const report = {
      totalAgents: 0,
      byLayer: {
        orchestration: 0,
        coordination: 0,
        business: 0
      },
      byType: {} as Record<string, number>,
      agents: [] as Record<string, any>[]
    };
    
    // Compter les agents par couche
    for (const layer of ['orchestration', 'coordination', 'business'] as const) {
      report.byLayer[layer] = this.layeredAgents[layer].size;
      report.totalAgents += this.layeredAgents[layer].size;
      
      // Détails des agents
      for (const [id, agent] of this.layeredAgents[layer].entries()) {
        const type = (agent as any).type || 'unknown';
        
        // Compter par type
        if (!report.byType[type]) {
          report.byType[type] = 0;
        }
        report.byType[type]++;
        
        // Ajouter les détails de l'agent
        report.agents.push({
          id,
          name: (agent as any).name || id,
          layer,
          type,
          version: (agent as any).version || '1.0.0'
        });
      }
    }
    
    return report;
  }
}

// Exporter l'instance singleton pour usage global
export const agentRegistryManager = AgentRegistryManager.getInstance();

// Ancien registre d'agents (maintenu pour rétrocompatibilité)
export const agentRegistry = {
  'QaAnalyzer': QAAnalyzer,
  'PhpAnalyzer': PhpAnalyzerAgent,
  'DiffVerifier': DiffVerifier,
  'SeoChecker': SeoCheckerAgent,
  DotMcpManifestManager': MCPManifestManager,
  'DevLinter': DevLinter,
  'MonitoringCheck': MonitoringCheck,
  'notifier': Notifier,
  'orchestrator': Orchestrator,
  'PrCreator': PRCreator,
  'BullmqOrchestrator': BullMQOrchestrator
} as const;

export type AgentName = keyof typeof agentRegistry;

// Exporter le registre en couches pour la nouvelle architecture
export const layeredAgentRegistry = {
  orchestration: {
    getAgent: (id: string) => agentRegistryManager.getAgent(id),
    getAll: () => agentRegistryManager.getAgentsByLayer('orchestration'),
    getByType: (type: string) => agentRegistryManager.getAgentsByType(type).filter(
      agent => (agent as any).layer === 'orchestration'
    )
  },
  coordination: {
    getAgent: (id: string) => agentRegistryManager.getAgent(id),
    getAll: () => agentRegistryManager.getAgentsByLayer('coordination'),
    getByType: (type: string) => agentRegistryManager.getAgentsByType(type).filter(
      agent => (agent as any).layer === 'coordination'
    )
  },
  business: {
    getAgent: (id: string) => agentRegistryManager.getAgent(id),
    getAll: () => agentRegistryManager.getAgentsByLayer('business'),
    getByType: (type: string) => agentRegistryManager.getAgentsByType(type).filter(
      agent => (agent as any).layer === 'business'
    )
  }
};

export default layeredAgentRegistry;