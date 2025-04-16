/**
 * Agent Registry - Point central de gestion des agents IA
 * 
 * Ce fichier sert de registre auto-généré pour tous les agents disponibles.
 * Il exploite le fichier agent-manifest.json comme source unique de vérité.
 */

import fs from 'fs-extra';
import path from 'path';
import { Logger } from '@nestjs/common';

// Import manuel des agents
import { QAAnalyzer } from './agents/qa-analyzer';
import { PhpAnalyzerAgent } from './agents/php-analyzer-agent';
import { DiffVerifier } from './agents/diff-verifier';
import { SeoCheckerAgent } from './agents/seo-checker';
import { MCPManifestManager } from './agents/mcp-manifest-manager';
import { DevLinter } from './agents/dev-linter';
import { MonitoringCheck } from './agents/monitoring-check';
import { Notifier } from './agents/notifier';
import { Orchestrator } from './agents/orchestrator';
import { PRCreator } from './agents/pr-creator';
import { BullMQOrchestrator } from './agents/bullmq-orchestrator';

// Types pour le manifest d'agents
export interface AgentManifestEntry {
  id: string;
  name: string;
  path: string;
  version: string;
  description: string;
  status: 'active' | 'inactive' | 'deprecated';
  dependencies: string[];
  apiEndpoint: string;
  runInGithubActions: boolean;
  tags: string[];
  config: Record<string, any>;
}

export interface AgentManifest {
  version: string;
  lastUpdated: string;
  project: string;
  agents: AgentManifestEntry[];
  meta: {
    totalAgents: number;
    activeAgents: number;
    inactiveAgents: number;
  };
}

// Interface de base pour tous les agents
export interface BaseAgentType {
  analyze: () => Promise<any>;
  getName: () => string;
  getVersion: () => string;
  getDependencies?: () => string[];
}

// Le registre des agents avec typage fort
export const agentRegistry = {
  'qa-analyzer': QAAnalyzer,
  'php-analyzer': PhpAnalyzerAgent,
  'diff-verifier': DiffVerifier,
  'seo-checker': SeoCheckerAgent,
  'mcp-manifest-manager': MCPManifestManager,
  'dev-linter': DevLinter,
  'monitoring-check': MonitoringCheck,
  'notifier': Notifier,
  'orchestrator': Orchestrator,
  'pr-creator': PRCreator,
  'bullmq-orchestrator': BullMQOrchestrator
} as const;

// Type dérivé des clés du registre
export type AgentName = keyof typeof agentRegistry;

// Classe ManagerRegistry pour la gestion du manifest et du registre
export class AgentRegistryManager {
  private static instance: AgentRegistryManager;
  private readonly logger = new Logger('AgentRegistryManager');
  private manifestPath: string;
  private manifest: AgentManifest | null = null;

  private constructor(manifestPath: string = path.join(process.cwd(), 'agent-manifest.json')) {
    this.manifestPath = manifestPath;
  }

  public static getInstance(manifestPath?: string): AgentRegistryManager {
    if (!AgentRegistryManager.instance) {
      AgentRegistryManager.instance = new AgentRegistryManager(manifestPath);
    }
    return AgentRegistryManager.instance;
  }

  /**
   * Charge le fichier agent-manifest.json
   */
  public async loadManifest(): Promise<AgentManifest> {
    try {
      if (!await fs.pathExists(this.manifestPath)) {
        throw new Error(`Le fichier ${this.manifestPath} n'existe pas`);
      }
      
      this.manifest = await fs.readJson(this.manifestPath) as AgentManifest;
      this.logger.log(`✅ Manifest d'agents chargé depuis ${this.manifestPath}`);
      
      return this.manifest;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors du chargement du manifest d'agents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifie que tous les agents du registre sont présents dans le manifest
   */
  public validateRegistry(): boolean {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return false;
    }
    
    const manifestAgentIds = new Set(this.manifest.agents.map(agent => agent.id));
    const registryAgentIds = new Set(Object.keys(agentRegistry));
    
    // Vérifier si tous les agents du registre sont dans le manifest
    const allRegistryAgentsInManifest = [...registryAgentIds].every(id => manifestAgentIds.has(id));
    
    if (!allRegistryAgentsInManifest) {
      const missingAgents = [...registryAgentIds].filter(id => !manifestAgentIds.has(id));
      this.logger.warn(`⚠️ Agents présents dans le registre mais absents du manifest: ${missingAgents.join(', ')}`);
    }
    
    // Vérifier si tous les agents actifs du manifest sont dans le registre
    const activeManifestAgents = this.manifest.agents
      .filter(agent => agent.status === 'active')
      .map(agent => agent.id);
      
    const allActiveAgentsInRegistry = activeManifestAgents.every(id => registryAgentIds.has(id));
    
    if (!allActiveAgentsInRegistry) {
      const missingInRegistry = activeManifestAgents.filter(id => !registryAgentIds.has(id));
      this.logger.warn(`⚠️ Agents actifs dans le manifest mais absents du registre: ${missingInRegistry.join(', ')}`);
    }
    
    return allRegistryAgentsInManifest && allActiveAgentsInRegistry;
  }

  /**
   * Récupère un agent par son ID
   */
  public getAgent(id: AgentName): typeof agentRegistry[AgentName] | null {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return null;
    }
    
    // Vérifier si l'agent est dans le registre
    if (!(id in agentRegistry)) {
      this.logger.warn(`⚠️ Agent ${id} non trouvé dans le registre`);
      return null;
    }
    
    // Vérifier si l'agent est actif dans le manifest
    const agentEntry = this.manifest.agents.find(agent => agent.id === id);
    if (!agentEntry || agentEntry.status !== 'active') {
      this.logger.warn(`⚠️ Agent ${id} inactif ou non trouvé dans le manifest`);
      return null;
    }
    
    return agentRegistry[id as AgentName];
  }

  /**
   * Récupère tous les agents actifs
   */
  public getActiveAgents(): Record<AgentName, typeof agentRegistry[AgentName]> {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return {} as Record<AgentName, typeof agentRegistry[AgentName]>;
    }
    
    const activeAgents: Partial<typeof agentRegistry> = {};
    
    this.manifest.agents
      .filter(agent => agent.status === 'active')
      .forEach(agent => {
        const id = agent.id as AgentName;
        if (id in agentRegistry) {
          activeAgents[id] = agentRegistry[id];
        }
      });
    
    return activeAgents as Record<AgentName, typeof agentRegistry[AgentName]>;
  }

  /**
   * Récupère tous les agents qui peuvent être exécutés dans GitHub Actions
   */
  public getGithubActionsAgents(): Record<AgentName, typeof agentRegistry[AgentName]> {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return {} as Record<AgentName, typeof agentRegistry[AgentName]>;
    }
    
    const ghAgents: Partial<typeof agentRegistry> = {};
    
    this.manifest.agents
      .filter(agent => agent.status === 'active' && agent.runInGithubActions)
      .forEach(agent => {
        const id = agent.id as AgentName;
        if (id in agentRegistry) {
          ghAgents[id] = agentRegistry[id];
        }
      });
    
    return ghAgents as Record<AgentName, typeof agentRegistry[AgentName]>;
  }
  
  /**
   * Récupère l'entrée du manifest pour un agent donné
   */
  public getAgentManifestEntry(id: AgentName): AgentManifestEntry | null {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return null;
    }
    
    return this.manifest.agents.find(agent => agent.id === id) || null;
  }

  /**
   * Met à jour le statut d'un agent dans le manifest
   */
  public async updateAgentStatus(id: AgentName, status: 'active' | 'inactive' | 'deprecated'): Promise<boolean> {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return false;
    }
    
    const agentIndex = this.manifest.agents.findIndex(agent => agent.id === id);
    if (agentIndex === -1) {
      this.logger.warn(`⚠️ Agent ${id} non trouvé dans le manifest`);
      return false;
    }
    
    this.manifest.agents[agentIndex].status = status;
    
    // Mettre à jour les métadonnées
    const activeAgents = this.manifest.agents.filter(agent => agent.status === 'active').length;
    const inactiveAgents = this.manifest.agents.length - activeAgents;
    
    this.manifest.meta = {
      totalAgents: this.manifest.agents.length,
      activeAgents,
      inactiveAgents
    };
    
    // Sauvegarder le manifest
    this.manifest.lastUpdated = new Date().toISOString();
    await fs.writeJson(this.manifestPath, this.manifest, { spaces: 2 });
    
    this.logger.log(`✅ Statut de l'agent ${id} mis à jour: ${status}`);
    return true;
  }

  /**
   * Génère le code TypeScript pour le registre d'agents
   * Peut être utilisé pour automatiser la mise à jour du registre
   */
  public generateRegistryCode(): string {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return '';
    }
    
    // Générer les imports
    const imports = this.manifest.agents
      .map(agent => `import { ${agent.name} } from '${agent.path}';`)
      .join('\n');
    
    // Générer le registre
    const registryEntries = this.manifest.agents
      .map(agent => `  '${agent.id}': ${agent.name}`)
      .join(',\n');
    
    return `/**
 * Agent Registry - GÉNÉRÉ AUTOMATIQUEMENT
 * Ne pas modifier directement - Mettre à jour le fichier agent-manifest.json à la place
 * Dernière mise à jour: ${new Date().toISOString()}
 */

${imports}

export const agentRegistry = {
${registryEntries}
} as const;

export type AgentName = keyof typeof agentRegistry;
`;
  }
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  const manager = AgentRegistryManager.getInstance();
  
  manager.loadManifest()
    .then(() => {
      console.log('✅ Validation du registre d\'agents...');
      const isValid = manager.validateRegistry();
      
      if (isValid) {
        console.log('✅ Le registre est valide et cohérent avec le manifest');
      } else {
        console.log('❌ Le registre n\'est pas cohérent avec le manifest');
      }
      
      // Générer le code pour un registre automatique
      const registryCode = manager.generateRegistryCode();
      console.log('\n📝 Code généré pour le registre:');
      console.log(registryCode);
    })
    .catch(error => {
      console.error(`❌ Erreur: ${error.message}`);
      process.exit(1);
    });
}