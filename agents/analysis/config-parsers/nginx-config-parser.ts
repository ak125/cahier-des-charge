import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../core/mcp-agent';

interface NginxLocation {
  path: string;
  isRegex: boolean;
  proxyPass?: string;
  rewrite?: string[];
  return?: string;
  alias?: string;
  try_files?: string[];
  headers?: Record<string, string>;
  conditions?: string[];
}

interface NginxServer {
  serverName: string[];
  listen: string[];
  root?: string;
  ssl?: boolean;
  sslCertificate?: string;
  sslCertificateKey?: string;
  locations: NginxLocation[];
  redirects?: { from: string; to: string; code: number }[];
}

interface NginxConfig {
  servers: NginxServer[];
  upstreams?: Record<string, string[]>;
  globals?: Record<string, string>;
}

export class NginxConfigParser implements MCPAgent {
  name = 'nginx-config-parser';
  description = 'Analyse les fichiers de configuration Nginx pour préparer la migration vers Caddy';

  async process(context: MCPContext): Promise<any> {
    const { configPath } = context.inputs;
    
    if (!configPath || !fs.existsSync(configPath)) {
      return {
        success: false,
        error: `Le fichier de configuration Nginx n'existe pas: ${configPath}`
      };
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = this.parseNginxConfig(content);
      
      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de l'analyse de la configuration Nginx: ${error.message}`
      };
    }
  }

  private parseNginxConfig(content: string): NginxConfig {
    const result: NginxConfig = {
      servers: [],
      upstreams: {},
      globals: {}
    };

    // Extraction des blocs server
    const serverBlocks = this.extractBlocks(content, 'server');
    
    for (const serverBlock of serverBlocks) {
      const server: NginxServer = {
        serverName: this.extractDirective(serverBlock, 'server_name').split(/\s+/).filter(Boolean),
        listen: this.extractDirectives(serverBlock, 'listen'),
        locations: []
      };

      // Extraction des paramètres SSL
      if (serverBlock.includes('ssl ') || serverBlock.includes('ssl;')) {
        server.ssl = true;
        server.sslCertificate = this.extractDirective(serverBlock, 'ssl_certificate');
        server.sslCertificateKey = this.extractDirective(serverBlock, 'ssl_certificate_key');
      }

      // Extraction du root
      server.root = this.extractDirective(serverBlock, 'root');

      // Extraction des blocs location
      const locationBlocks = this.extractLocationBlocks(serverBlock);
      
      for (const locationBlock of locationBlocks) {
        const locationMatch = locationBlock.match(/^\s*location\s+(?:([=~*^@])\s*)?([^\s{]+)\s*\{/);
        
        if (locationMatch) {
          const isRegex = locationMatch[1] === '~' || locationMatch[1] === '~*';
          const path = locationMatch[2];
          
          const location: NginxLocation = {
            path,
            isRegex,
            proxyPass: this.extractDirective(locationBlock, 'proxy_pass'),
            rewrite: this.extractDirectives(locationBlock, 'rewrite'),
            return: this.extractDirective(locationBlock, 'return'),
            alias: this.extractDirective(locationBlock, 'alias'),
            try_files: this.extractDirective(locationBlock, 'try_files')
              .split(/\s+/).filter(Boolean),
            headers: {}
          };

          // Extraction des en-têtes
          const headerDirectives = locationBlock.match(/add_header\s+([^\s]+)\s+([^;]+);/g);
          if (headerDirectives) {
            for (const directive of headerDirectives) {
              const match = directive.match(/add_header\s+([^\s]+)\s+([^;]+);/);
              if (match) {
                location.headers[match[1]] = match[2].replace(/["']/g, '');
              }
            }
          }

          server.locations.push(location);
        }
      }

      // Extraction des redirections
      server.redirects = [];
      const redirects = serverBlock.match(/rewrite\s+([^\s]+)\s+([^\s]+)(?:\s+permanent|\s+(\d+))?;/g);
      if (redirects) {
        for (const redirect of redirects) {
          const match = redirect.match(/rewrite\s+([^\s]+)\s+([^\s]+)(?:\s+permanent|\s+(\d+))?;/);
          if (match) {
            server.redirects.push({
              from: match[1],
              to: match[2],
              code: match[3] ? parseInt(match[3]) : 301
            });
          }
        }
      }

      result.servers.push(server);
    }

    // Extraction des blocs upstream
    const upstreamBlocks = this.extractBlocks(content, 'upstream');
    
    for (const upstreamBlock of upstreamBlocks) {
      const nameMatch = upstreamBlock.match(/upstream\s+([^\s{]+)\s*\{/);
      if (nameMatch) {
        const name = nameMatch[1];
        const servers = upstreamBlock.match(/server\s+([^;]+);/g);
        if (servers) {
          result.upstreams[name] = servers.map(s => {
            const match = s.match(/server\s+([^;]+);/);
            return match ? match[1] : '';
          }).filter(Boolean);
        }
      }
    }

    return result;
  }

  private extractBlocks(content: string, blockType: string): string[] {
    const blocks: string[] = [];
    const regex = new RegExp(`${blockType}\\s+[^{]*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}`, 'g');
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      blocks.push(match[0]);
    }
    
    return blocks;
  }

  private extractLocationBlocks(serverBlock: string): string[] {
    return this.extractBlocks(serverBlock, 'location');
  }

  private extractDirective(block: string, directive: string): string {
    const regex = new RegExp(`${directive}\\s+([^;]+);`);
    const match = block.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractDirectives(block: string, directive: string): string[] {
    const regex = new RegExp(`${directive}\\s+([^;]+);`, 'g');
    const directives: string[] = [];
    
    let match;
    while ((match = regex.exec(block)) !== null) {
      directives.push(match[1].trim());
    }
    
    return directives;
  }
}

export default new NginxConfigParser();