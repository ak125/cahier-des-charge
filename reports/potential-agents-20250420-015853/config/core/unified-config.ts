/**
 * Système de configuration unifié pour l'architecture à 3 couches
 * Sert de source unique de vérité pour toutes les couches
 */
import fs from 'fs-extra';
import path from 'path';
import { merge } from 'lodash';
import { z } from 'zod';
import { Logger } from '@nestjs/common';

// Schémas de validation pour chaque couche
import { orchestrationConfigSchema } from './schemas/orchestration-schema';
import { agentConfigSchema } from './schemas/agent-schema';
import { businessConfigSchema } from './schemas/business-schema';

// Types des configurations par couche
export type OrchestrationConfig = z.infer<typeof orchestrationConfigSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type BusinessConfig = z.infer<typeof businessConfigSchema>;

// Interface principale de configuration unifiée
export interface UnifiedConfig {
  version: string;
  environment: string;
  traceability: {
    enabled: boolean;
    idFormat: string;
    storageStrategy: 'database' | 'distributed' | 'hybrid';
  };
  circuitBreaker: {
    enabled: boolean;
    resetTimeout: number;
    failureThreshold: number;
    fallbackStrategies: Record<string, string>;
  };
  governance: {
    enabled: boolean;
    decisionRules: Array<{
      name: string;
      description: string;
      priority: number;
      conditions: string[];
      actions: string[];
    }>;
  };
  orchestration: OrchestrationConfig;
  agents: AgentConfig;
  business: BusinessConfig;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: UnifiedConfig;
  private logger = new Logger('ConfigManager');
  private configPath: string;
  private layerConfigs: {
    orchestration: OrchestrationConfig;
    agents: AgentConfig;
    business: BusinessConfig;
  };

  private constructor(configDir: string = path.join(process.cwd(), 'config')) {
    this.configPath = configDir;
    
    // Initialiser avec des valeurs par défaut
    this.config = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      traceability: {
        enabled: true,
        idFormat: DoDotmcp-{timestamp}-{layer}-{random}',
        storageStrategy: 'hybrid',
      },
      circuitBreaker: {
        enabled: true,
        resetTimeout: 60000,
        failureThreshold: 5,
        fallbackStrategies: {
          "orchestration": "isolateWorkflow",
          "agents": "disableTemporarily",
          "business": "isolateDomain"
        }
      },
      governance: {
        enabled: true,
        decisionRules: []
      },
      orchestration: {} as OrchestrationConfig,
      agents: {} as AgentConfig,
      business: {} as BusinessConfig
    };
    
    this.layerConfigs = {
      orchestration: {} as OrchestrationConfig,
      agents: {} as AgentConfig,
      business: {} as BusinessConfig
    };
  }

  public static getInstance(configDir?: string): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(configDir);
    }
    return ConfigManager.instance;
  }

  /**
   * Charge la configuration unifiée et génère les configs spécifiques à chaque couche
   */
  public async loadConfig(): Promise<UnifiedConfig> {
    try {
      // Charger la configuration de base
      const baseConfigPath = path.join(this.configPath, 'unified-config.json');
      if (await fs.pathExists(baseConfigPath)) {
        const baseConfig = await fs.readJson(baseConfigPath) as Partial<UnifiedConfig>;
        this.config = merge({}, this.config, baseConfig);
      }

      // Charger les configurations spécifiques à l'environnement
      const envConfigPath = path.join(
        this.configPath, 
        `unified-config.${this.config.environment}.json`
      );
      
      if (await fs.pathExists(envConfigPath)) {
        const envConfig = await fs.readJson(envConfigPath) as Partial<UnifiedConfig>;
        this.config = merge({}, this.config, envConfig);
      }

      // Générer et valider les configurations par couche
      await this.generateLayerConfigs();
      this.validateConfig();

      this.logger.log(`Configuration unifiée chargée pour l'environnement: ${this.config.environment}`);
      return this.config;
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement de la configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Génère les configurations spécifiques à chaque couche et les enregistre
   */
  private async generateLayerConfigs(): Promise<void> {
    try {
      // Générer la configuration d'orchestration
      this.layerConfigs.orchestration = {
       Dotn8N: this.config.orchestrationDotn8N,
        bullMQ: this.config.orchestration.bullMQ,
        shellScripts: this.config.orchestration.shellScripts,
        circuitBreaker: {
          ...this.config.circuitBreaker,
          strategy: 'isolateWorkflow'
        },
        traceability: {
          ...this.config.traceability,
          layer: 'orchestration'
        }
      };

      // Générer la configuration des agents
      this.layerConfigs.agents = {
        registry: this.config.agents.registry,
        manifests: this.config.agents.manifests,
        monitoring: this.config.agents.monitoring,
        circuitBreaker: {
          ...this.config.circuitBreaker,
          strategy: 'disableTemporarily'
        },
        traceability: {
          ...this.config.traceability,
          layer: 'agents'
        }
      };

      // Générer la configuration métier
      this.layerConfigs.business = {
        migrations: this.config.business.migrations,
        domains: this.config.business.domains,
        rules: this.config.business.rules,
        circuitBreaker: {
          ...this.config.circuitBreaker,
          strategy: 'isolateDomain'
        },
        traceability: {
          ...this.config.traceability,
          layer: 'business'
        }
      };

      // Sauvegarder les configurations dérivées
      const configsDir = path.join(this.configPath, 'derived');
      await fs.ensureDir(configsDir);
      
      await fs.writeJson(
        path.join(configsDir, 'orchestration-config.json'), 
        this.layerConfigs.orchestration,
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(configsDir, 'agent-config.json'), 
        this.layerConfigs.agents,
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(configsDir, 'business-config.json'), 
        this.layerConfigs.business,
        { spaces: 2 }
      );

    } catch (error: any) {
      this.logger.error(`Erreur lors de la génération des configurations par couche: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valide la configuration à l'aide des schémas Zod
   */
  private validateConfig(): void {
    try {
      // Valider la configuration d'orchestration
      orchestrationConfigSchema.parse(this.layerConfigs.orchestration);
      
      // Valider la configuration des agents
      agentConfigSchema.parse(this.layerConfigs.agents);
      
      // Valider la configuration métier
      businessConfigSchema.parse(this.layerConfigs.business);
      
      this.logger.log('Validation réussie pour toutes les configurations de couche');
    } catch (error: any) {
      this.logger.error(`Validation de configuration échouée: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère la configuration unifiée complète
   */
  public getConfig(): UnifiedConfig {
    return this.config;
  }

  /**
   * Récupère la configuration spécifique à une couche
   */
  public getLayerConfig<T extends keyof typeof this.layerConfigs>(
    layer: T
  ): typeof this.layerConfigs[T] {
    return this.layerConfigs[layer];
  }

  /**
   * Met à jour une partie de la configuration unifiée
   */
  public async updateConfig(partialConfig: Partial<UnifiedConfig>): Promise<void> {
    try {
      // Fusionner avec la configuration existante
      this.config = merge({}, this.config, partialConfig);
      
      // Régénérer les configurations par couche
      await this.generateLayerConfigs();
      
      // Valider la nouvelle configuration
      this.validateConfig();
      
      // Enregistrer la configuration complète
      const baseConfigPath = path.join(this.configPath, 'unified-config.json');
      await fs.writeJson(baseConfigPath, this.config, { spaces: 2 });
      
      this.logger.log('Configuration mise à jour avec succès');
    } catch (error: any) {
      this.logger.error(`Erreur lors de la mise à jour de la configuration: ${error.message}`);
      throw error;
    }
  }
}

// Point d'entrée pour l'utilisation de la configuration
export const configManager = ConfigManager.getInstance();

// Si exécuté directement, générer les fichiers de configuration
if (require.main === module) {
  configManager.loadConfig()
    .then(config => {
      console.log('✅ Configuration unifiée chargée');
      console.log(`Version: ${config.version}`);
      console.log(`Environnement: ${config.environment}`);
    })
    .catch(error => {
      console.error(`❌ Erreur: ${error.message}`);
      process.exit(1);
    });
}