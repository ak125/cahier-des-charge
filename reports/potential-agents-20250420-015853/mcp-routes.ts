/**
 * MCP Routes Generator
 * 
 * Génère automatiquement les routes NestJS pour tous les agents MCP actifs
 * en utilisant le registre d'agents comme source de vérité.
 */

import { Controller, Post, Body, Get, Param, Logger, Injectable } from '@nestjs/common';
import { agentRegistry, AgentName, AgentRegistryManager } from './agentRegistry';

/**
 * Type de base pour les requêtes MCP
 */
export interface MCPRequest<T = any> {
  input: T;
  context?: Record<string, any>;
  options?: Record<string, any>;
}

/**
 * Type de base pour les réponses MCP
 */
export interface MCPResponse<T = any> {
  result: T;
  status: string;
  messages?: string[];
  executionTime?: number;
  timestamp: string;
  agentVersion?: string;
}

/**
 * Génère une classe controller NestJS pour un agent
 */
export function generateAgentController(agentId: AgentName) {
  const controllerName = `${agentId.charAt(0).toUpperCase() + agentId.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())}Controller`;
  
  @Controller(DoDotmcp/${agentId}`)
  class DynamicAgentController {
    private readonly logger = new Logger(controllerName);
    private readonly agentClass = agentRegistry[agentId];

    @Post()
    async process(@Body()DoDotmcpRequest: MCPRequest): Promise<MCPResponse> {
      const startTime = Date.now();
      
      try {
        // Instanciez l'agent - supposant que tous les agents ont un constructeur qui accepte des options
        const agent = new this.agentClassDoDotmcpRequest.options || {});
        
        // Déterminez quelle méthode appeler (supposons que tous les agents ont une méthode run ou analyze)
        const methodToCall = typeof agent.run === 'function' ? 'run' : 'analyze';
        
        // Appel de la méthode avec l'entrée et le contexte
        const result = await agent[methodToCall]DoDotmcpRequest.input,DoDotmcpRequest.context);
        
        // Construire la réponse
        const response: MCPResponse = {
          result,
          status: 'success',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          agentVersion: agent.getVersion?.() || '1.0.0'
        };
        
        this.logger.log(`✅ Agent ${agentId} exécuté avec succès en ${response.executionTime}ms`);
        
        return response;
      } catch (error: any) {
        const errorResponse: MCPResponse = {
          result: null,
          status: 'error',
          messages: [error.message],
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
        
        this.logger.error(`❌ Erreur lors de l'exécution de l'agent ${agentId}: ${error.message}`);
        
        return errorResponse;
      }
    }

    @Get('info')
    async getInfo(): Promise<any> {
      const manager = AgentRegistryManager.getInstance();
      await manager.loadManifest();
      
      const agentInfo = manager.getAgentManifestEntry(agentId);
      
      return {
        ...agentInfo,
        // Ne pas exposer les détails de configuration potentiellement sensibles
        config: undefined
      };
    }
  }

  return DynamicAgentController;
}

/**
 * Service pour générer automatiquement tous les controllers pour les agents actifs
 */
@Injectable()
export class MCPRoutesService {
  private readonly logger = new Logger(MCPRoutesService.name);
  
  /**
   * Génère tous les controllers pour les agents actifs
   */
  async generateAllControllers(): Promise<any[]> {
    const manager = AgentRegistryManager.getInstance();
    await manager.loadManifest();
    
    const controllers: any[] = [];
    const activeAgents = manager.getActiveAgents();
    
    for (const agentId of Object.keys(activeAgents) as AgentName[]) {
      const controller = generateAgentController(agentId);
      controllers.push(controller);
      
      this.logger.log(`✅ Controller généré pour l'agent ${agentId}`);
    }
    
    return controllers;
  }
}

/**
 * Configuration à importer dans le module NestJS principal
 * 
 * Exemple d'utilisation:
 * 
 * ```typescript
 * // app.module.ts
 * import { Module } from '@nestjs/common';
 * import { MCPRoutesService } from '.DoDotmcp-routes';
 * 
 * @Module({
 *   imports: [],
 *   controllers: [],
 *   providers: [MCPRoutesService],
 * })
 * export class AppModule {
 *   constructor(private readonlyDoDotmcpRoutesService: MCPRoutesService) {}
 * 
 *   async onModuleInit() {
 *     // Génère dynamiquement tous les controllers d'agents
 *     const controllers = await thisDoDotmcpRoutesService.generateAllControllers();
 *     
 *     // Enregistre les controllers avec NestJS
 *     controllers.forEach(controller => {
 *       // Utilisez un mécanisme d'enregistrement dynamique pour les ajouter
 *       // Par exemple avec nest-dynamic-module ou similaire
 *     });
 *   }
 * }
 * ```
 */

// Point d'entrée si exécuté directement
if (require.main === module) {
  (async () => {
    const service = new MCPRoutesService();
    const controllers = await service.generateAllControllers();
    
    console.log(`✅ ${controllers.length} controllers générés avec succès`);
    
    // Affiche les routes générées
    controllers.forEach((controller: any) => {
      const path = Reflect.getMetadata('path', controller);
      console.log(`📡 Route: /api/${path}`);
    });
  })();
}