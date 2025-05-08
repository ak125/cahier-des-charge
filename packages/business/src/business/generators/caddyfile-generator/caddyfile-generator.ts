/**
 * caddyfile-generator.ts
 * Agent MCP pour convertir des configurations Nginx/.htaccess en Caddyfile
 * Date: 12 avril 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent';
import { AgentContext, FileContent, MCPAgent } from '../coreDoDotmcp-agent';
import { CaddyGenerator } from '../utils/caddy-generator';
import { HtaccessParser } from '../utils/htaccess-parser';
import { NginxConfigParser } from '../utils/nginx-config-parser';

export interface ServerConfig {
  domain: string;
  routes: RouteConfig[];
  tls?: TLSConfig;
  proxyTarget?: string;
  headers?: Record<string, string>;
  customBlocks?: string[];
}

export interface RouteConfig {
  path: string;
  type: 'proxy' | 'static' | 'redirect' | 'rewrite' | 'respond';
  target?: string;
  status?: number;
  headers?: Record<string, string>;
  options?: Record<string, any>;
  matcher?: string;
}

export interface TLSConfig {
  type: 'auto' | 'internal' | 'manual';
  certFile?: string;
  keyFile?: string;
  wildcard?: boolean;
}

export interface CaddyfileGeneratorConfig {
  input: {
    nginxConfigPath?: string;
    htaccessPath?: string[];
    existingCaddyfilePath?: string;
  };
  output: {
    caddyfilePath: string;
    dockerComposePath?: string;
  };
  serverConfigs?: ServerConfig[];
  defaultServer?: {
    proxyTarget: string;
    port: number;
  };
  globalOptions?: {
    enableAdmin?: boolean;
    logLevel?: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
    enableTelemetry?: boolean;
    caddyfilesFolder?: string;
  };
}

/**
 * Agent MCP pour générer un Caddyfile à partir de configurations Nginx et .htaccess
 */
export class CaddyfileGenerator
  implements
    BusinessAgent,
    BaseAgent,
    BusinessAgent,
    BaseAgent,
    BusinessAgent,
    BaseAgent,
    BusinessAgent,
    MCPAgent
{
  name = 'CaddyfileGenerator';
  version = '1.0.0';
  description = 'Génère un Caddyfile à partir de configurations Nginx et .htaccess';

  private config!: CaddyfileGeneratorConfig;
  private nginxParser = new NginxConfigParser();
  private htaccessParser = new HtaccessParser();
  private caddyGenerator = new CaddyGenerator();

  async initialize(context: AgentContext): Promise<void> {
    this.config = context.getConfig<CaddyfileGeneratorConfig>();
    console.log(
      `[${this.name}] Initialisation avec la configuration:`,
      JSON.stringify(this.config, null, 2)
    );
  }

  async execute(context: AgentContext): Promise<void> {
    console.log(`[${this.name}] Début de la génération du Caddyfile...`);

    // Étape 1: Analyser la configuration Nginx si disponible
    let serverConfigs: ServerConfig[] = this.config.serverConfigs || [];
    if (this.config.input.nginxConfigPath) {
      try {
        const nginxConfig = fs.readFileSync(this.config.input.nginxConfigPath, 'utf8');
        const parsedNginxConfig = await this.nginxParser.parse(nginxConfig);
        console.log(`[${this.name}] Configuration Nginx analysée avec succès.`);

        // Convertir la configuration Nginx en ServerConfig[]
        const nginxServerConfigs = await this.nginxParser.convertToServerConfigs(parsedNginxConfig);
        serverConfigs = [...serverConfigs, ...nginxServerConfigs];
      } catch (error) {
        console.error(`[${this.name}] Erreur lors de l'analyse de la configuration Nginx:`, error);
      }
    }

    // Étape 2: Analyser les fichiers .htaccess si disponibles
    if (this.config.input.htaccessPath && this.config.input.htaccessPath.length > 0) {
      for (const htaccessPath of this.config.input.htaccessPath) {
        try {
          const htaccessContent = fs.readFileSync(htaccessPath, 'utf8');
          const parsedHtaccess = await this.htaccessParser.parse(htaccessContent);
          console.log(`[${this.name}] Fichier .htaccess ${htaccessPath} analysé avec succès.`);

          // Convertir les règles .htaccess en routes pour les ServerConfig existants ou nouveaux
          await this.htaccessParser.enhanceServerConfigs(
            serverConfigs,
            parsedHtaccess,
            path.dirname(htaccessPath)
          );
        } catch (error) {
          console.error(
            `[${this.name}] Erreur lors de l'analyse du fichier .htaccess ${htaccessPath}:`,
            error
          );
        }
      }
    }

    // Étape 3: Fusionner avec un Caddyfile existant si spécifié
    if (this.config.input.existingCaddyfilePath) {
      try {
        const existingCaddyfile = fs.readFileSync(this.config.input.existingCaddyfilePath, 'utf8');
        serverConfigs = await this.caddyGenerator.mergeWithExistingCaddyfile(
          serverConfigs,
          existingCaddyfile
        );
        console.log(`[${this.name}] Fusion avec le Caddyfile existant effectuée avec succès.`);
      } catch (error) {
        console.error(`[${this.name}] Erreur lors de la fusion avec le Caddyfile existant:`, error);
      }
    }

    // Étape 4: Générer le Caddyfile
    try {
      const caddyfile = await this.caddyGenerator.generate(
        serverConfigs,
        this.config.globalOptions
      );
      fs.writeFileSync(this.config.output.caddyfilePath, caddyfile);
      console.log(
        `[${this.name}] Caddyfile généré avec succès et enregistré dans ${this.config.output.caddyfilePath}.`
      );

      // Fournir le Caddyfile généré au contexte pour utilisation ultérieure
      context.setOutput('caddyfile', new FileContent(caddyfile, this.config.output.caddyfilePath));
    } catch (error) {
      console.error(`[${this.name}] Erreur lors de la génération du Caddyfile:`, error);
      throw new Error(`Échec de la génération du Caddyfile: ${error}`);
    }

    // Étape 5: Générer/mettre à jour le docker-compose.yml si nécessaire
    if (this.config.output.dockerComposePath) {
      try {
        await this.generateDockerCompose(context);
        console.log(`[${this.name}] Configuration Docker Compose mise à jour avec succès.`);
      } catch (error) {
        console.error(
          `[${this.name}] Erreur lors de la mise à jour de la configuration Docker Compose:`,
          error
        );
      }
    }
  }

  /**
   * Génère ou met à jour un fichier docker-compose.yml pour inclure Caddy
   */
  private async generateDockerCompose(_context: AgentContext): Promise<void> {
    const dockerComposePath = this.config.output.dockerComposePath!;
    const dockerCompose: any = {
      version: '3.9',
      services: {
        caddy: {
          image: 'caddy:2.7',
          volumes: [
            `${this.config.output.caddyfilePath}:/etc/caddy/Caddyfile`,
            'caddy_data:/data',
            'caddy_config:/config',
          ],
          ports: ['80:80', '443:443'],
          networks: ['web'],
          restart: 'unless-stopped',
        },
      },
      volumes: {
        caddy_data: {},
        caddy_config: {},
      },
      networks: {
        web: {
          external: false,
        },
      },
    };

    // Si le fichier docker-compose.yml existe déjà, le charger et ajouter/mettre à jour le service Caddy
    if (fs.existsSync(dockerComposePath)) {
      try {
        const existingDockerCompose = JSON.parse(fs.readFileSync(dockerComposePath, 'utf8'));

        // Fusionner les services existants avec le service Caddy
        dockerCompose.services = {
          ...existingDockerCompose.services,
          caddy: dockerCompose.services.caddy,
        };

        // Fusionner les volumes existants avec les volumes Caddy
        dockerCompose.volumes = {
          ...existingDockerCompose.volumes,
          ...dockerCompose.volumes,
        };

        // Fusionner les réseaux existants
        if (existingDockerCompose.networks) {
          dockerCompose.networks = {
            ...existingDockerCompose.networks,
            ...dockerCompose.networks,
          };
        }
      } catch (error) {
        console.error(
          `[${this.name}] Erreur lors de la lecture du fichier docker-compose.yml existant:`,
          error
        );
      }
    }

    // Écrire le fichier docker-compose.yml
    fs.writeFileSync(dockerComposePath, JSON.stringify(dockerCompose, null, 2));
    console.log(`[${this.name}] Fichier docker-compose.yml mis à jour avec succès.`);
  }

  id = '';
  type = '';
  version = '1.0.0';

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version,
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString(),
    };
  }

  id = '';
  type = '';
  version = '1.0.0';

  id = '';
  type = '';
  version = '1.0.0';

  id = '';
  type = '';
  version = '1.0.0';

  id = '';
  type = '';
  version = '1.0.0';

  id = '';
  type = '';
  version = '1.0.0';
}
