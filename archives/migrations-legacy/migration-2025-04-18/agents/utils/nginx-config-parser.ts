/**
 * nginx-config-parser.ts
 * Utilitaire pour analyser les fichiers de configuration Nginx
 * Date: 12 avril 2025
 */

import { RouteConfig, ServerConfig, TLSConfig } from '../migration/caddyfile-generator';

export interface NginxServer {
  listen: string[];
  serverName: string[];
  root?: string;
  index?: string[];
  location: NginxLocation[];
  ssl?: {
    certificate?: string;
    certificateKey?: string;
    protocols?: string[];
    ciphers?: string[];
  };
  errorPage?: Record<string, string>;
  rewrite?: string[];
  proxySettings?: Record<string, string>;
  headers?: Record<string, string>;
  customDirectives?: Record<string, any>;
}

export interface NginxLocation {
  path: string;
  root?: string;
  index?: string[];
  proxyPass?: string;
  rewrite?: string[];
  tryFiles?: string[];
  alias?: string;
  fastcgiPass?: string;
  fastcgiParams?: Record<string, string>;
  extraDirectives?: Record<string, any>;
  headers?: Record<string, string>;
  internalOnly?: boolean;
  returnDirective?: string;
  expires?: string;
  addHeader?: Record<string, string>;
}

export interface NginxConfig {
  http: {
    server: NginxServer[];
    upstream?: Record<string, string[]>;
    includeFiles?: string[];
    globalSettings?: Record<string, any>;
  };
  events?: Record<string, any>;
  user?: string;
  worker_processes?: string | number;
  error_log?: string;
  pid?: string;
  customBlocks?: Record<string, any>[];
}

/**
 * Classe pour analyser les fichiers de configuration Nginx
 */
export class NginxConfigParser {
  /**
   * Parse un fichier de configuration Nginx et extrait sa structure
   */
  async parse(content: string): Promise<NginxConfig> {
    const config: NginxConfig = {
      http: {
        server: [],
        upstream: {},
        globalSettings: {},
      },
    };

    // Découper le contenu en blocs
    const blocks = this.parseBlocks(content);

    // Parcourir les blocs de premier niveau
    for (const block of blocks) {
      if (block.name === 'http') {
        await this.parseHttpBlock(block.content, config);
      } else if (block.name === 'events') {
        config.events = this.parseDirectives(block.content);
      } else if (block.name) {
        // Autres blocs personnalisés
        if (!config.customBlocks) {
          config.customBlocks = [];
        }
        config.customBlocks.push({ [block.name]: this.parseDirectives(block.content) });
      } else {
        // Directives de premier niveau
        const directives = this.parseDirectives(block.content);
        Object.assign(config, directives);
      }
    }

    return config;
  }

  /**
   * Parse les blocs dans le contenu
   */
  private parseBlocks(content: string): { name: string; content: string }[] {
    const blocks: { name: string; content: string }[] = [];
    let currentPosition = 0;

    while (currentPosition < content.length) {
      // Trouver le prochain bloc ou directive
      const blockStart = this.findNextBlockStart(content, currentPosition);

      if (blockStart.start === -1) {
        // Plus de blocs, ajouter le reste comme directives
        const remainingContent = content.substring(currentPosition).trim();
        if (remainingContent) {
          blocks.push({ name: '', content: remainingContent });
        }
        break;
      }

      // Ajouter les directives précédant le bloc
      if (blockStart.start > currentPosition) {
        const directivesContent = content.substring(currentPosition, blockStart.start).trim();
        if (directivesContent) {
          blocks.push({ name: '', content: directivesContent });
        }
      }

      // Trouver la fin du bloc
      const blockEnd = this.findMatchingBrace(content, blockStart.contentStart);
      if (blockEnd === -1) {
        throw new Error(`Bloc non fermé commençant à la position ${blockStart.start}`);
      }

      // Ajouter le bloc
      const blockContent = content.substring(blockStart.contentStart, blockEnd).trim();
      blocks.push({ name: blockStart.name, content: blockContent });

      // Continuer après la fin du bloc
      currentPosition = blockEnd + 1;
    }

    return blocks;
  }

  /**
   * Trouve le prochain début de bloc
   */
  private findNextBlockStart(
    content: string,
    startPosition: number
  ): { name: string; start: number; contentStart: number } {
    const regex = /\s*([a-zA-Z0-9_-]+)\s*\{/g;
    regex.lastIndex = startPosition;

    const match = regex.exec(content);
    if (!match) {
      return { name: '', start: -1, contentStart: -1 };
    }

    return {
      name: match[1],
      start: match.index,
      contentStart: regex.lastIndex,
    };
  }

  /**
   * Trouve l'accolade fermante correspondante
   */
  private findMatchingBrace(content: string, startPosition: number): number {
    let braceCount = 1;
    let inQuotes = false;
    let inSingleQuotes = false;
    let escaped = false;

    for (let i = startPosition; i < content.length; i++) {
      const char = content[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"' && !inSingleQuotes) {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "'" && !inQuotes) {
        inSingleQuotes = !inSingleQuotes;
        continue;
      }

      if (inQuotes || inSingleQuotes) {
        continue;
      }

      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }

    return -1;
  }

  /**
   * Parse les directives simples
   */
  private parseDirectives(content: string): Record<string, any> {
    const directives: Record<string, any> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Ignorer les commentaires et les lignes vides
      if (trimmedLine.startsWith('#') || trimmedLine === '') {
        continue;
      }

      // Trouver la fin de la directive (avant le point-virgule)
      const endIndex = trimmedLine.lastIndexOf(';');
      if (endIndex === -1) {
        continue; // Ignorer les lignes sans point-virgule
      }

      const directive = trimmedLine.substring(0, endIndex).trim();
      const parts = directive.split(/\s+/);

      if (parts.length >= 2) {
        const name = parts[0];
        const value = parts.slice(1).join(' ');

        // Gérer les directives à valeurs multiples
        if (directives[name]) {
          if (Array.isArray(directives[name])) {
            directives[name].push(value);
          } else {
            directives[name] = [directives[name], value];
          }
        } else {
          directives[name] = value;
        }
      }
    }

    return directives;
  }

  /**
   * Parse le bloc HTTP
   */
  private async parseHttpBlock(content: string, config: NginxConfig): Promise<void> {
    const blocks = this.parseBlocks(content);

    for (const block of blocks) {
      if (block.name === 'server') {
        const server = await this.parseServerBlock(block.content);
        config.http.server.push(server);
      } else if (block.name === 'upstream') {
        // Extraire le nom de l'upstream et ses serveurs
        const upstreamName = block.name.split(/\s+/)[1];
        const upstreamServers = this.parseUpstreamServers(block.content);
        if (upstreamName && upstreamServers.length > 0) {
          config.http.upstream![upstreamName] = upstreamServers;
        }
      } else if (block.name === 'location') {
        // Ignorer les blocs de location en dehors d'un serveur
        console.warn("Bloc location trouvé en dehors d'un bloc server - ignoré");
      } else if (block.name) {
        // Autres blocs dans http
        config.http.globalSettings![block.name] = this.parseDirectives(block.content);
      } else {
        // Directives dans http
        const directives = this.parseDirectives(block.content);
        Object.assign(config.http.globalSettings!, directives);
      }
    }
  }

  /**
   * Parse le bloc server
   */
  private async parseServerBlock(content: string): Promise<NginxServer> {
    const server: NginxServer = {
      listen: [],
      serverName: [],
      location: [],
    };

    const blocks = this.parseBlocks(content);

    for (const block of blocks) {
      if (block.name === 'location') {
        const locationPath = block.name.split(/\s+/).slice(1).join(' ');
        const location = await this.parseLocationBlock(locationPath, block.content);
        server.location.push(location);
      } else if (block.name) {
        // Autres blocs dans server
        if (!server.customDirectives) {
          server.customDirectives = {};
        }
        server.customDirectives[block.name] = this.parseDirectives(block.content);
      } else {
        // Directives dans server
        const directives = this.parseDirectives(block.content);

        // Traiter les directives spécifiques
        for (const [key, value] of Object.entries(directives)) {
          switch (key) {
            case 'listen':
              server.listen = Array.isArray(value) ? value : [value];
              break;
            case 'server_name':
              server.serverName = Array.isArray(value) ? value : value.split(/\s+/);
              break;
            case 'root':
              server.root = value;
              break;
            case 'index':
              server.index = Array.isArray(value) ? value : value.split(/\s+/);
              break;
            case 'ssl_certificate':
              if (!server.ssl) server.ssl = {};
              server.ssl.certificate = value;
              break;
            case 'ssl_certificate_key':
              if (!server.ssl) server.ssl = {};
              server.ssl.certificateKey = value;
              break;
            case 'ssl_protocols':
              if (!server.ssl) server.ssl = {};
              server.ssl.protocols = Array.isArray(value) ? value : value.split(/\s+/);
              break;
            case 'ssl_ciphers':
              if (!server.ssl) server.ssl = {};
              server.ssl.ciphers = Array.isArray(value) ? value : value.split(/\s+/);
              break;
            case 'error_page':
              if (!server.errorPage) server.errorPage = {};
              const [code, ...path] = value.split(/\s+/);
              server.errorPage[code] = path.join(' ');
              break;
            case 'rewrite':
              if (!server.rewrite) server.rewrite = [];
              server.rewrite.push(value);
              break;
            case 'add_header':
              if (!server.headers) server.headers = {};
              const headerParts = value.split(/\s+/);
              server.headers[headerParts[0]] = headerParts.slice(1).join(' ');
              break;
            default:
              // Autres directives
              if (!server.customDirectives) {
                server.customDirectives = {};
              }
              server.customDirectives[key] = value;
          }
        }
      }
    }

    return server;
  }

  /**
   * Parse le bloc location
   */
  private async parseLocationBlock(path: string, content: string): Promise<NginxLocation> {
    const location: NginxLocation = {
      path,
    };

    const directives = this.parseDirectives(content);

    // Traiter les directives spécifiques
    for (const [key, value] of Object.entries(directives)) {
      switch (key) {
        case 'root':
          location.root = value;
          break;
        case 'index':
          location.index = Array.isArray(value) ? value : value.split(/\s+/);
          break;
        case 'proxy_pass':
          location.proxyPass = value;
          break;
        case 'rewrite':
          if (!location.rewrite) location.rewrite = [];
          location.rewrite.push(value);
          break;
        case 'try_files':
          location.tryFiles = Array.isArray(value) ? value : value.split(/\s+/);
          break;
        case 'alias':
          location.alias = value;
          break;
        case 'fastcgi_pass':
          location.fastcgiPass = value;
          break;
        case 'internal':
          location.internalOnly = true;
          break;
        case 'return':
          location.returnDirective = value;
          break;
        case 'expires':
          location.expires = value;
          break;
        case 'add_header':
          if (!location.addHeader) location.addHeader = {};
          const headerParts = value.split(/\s+/);
          location.addHeader[headerParts[0]] = headerParts.slice(1).join(' ');
          break;
        default:
          // Directives fastcgi_param
          if (key.startsWith('fastcgi_param')) {
            if (!location.fastcgiParams) location.fastcgiParams = {};
            const paramName = key.split(/\s+/)[1];
            location.fastcgiParams[paramName] = value;
          } else {
            // Autres directives
            if (!location.extraDirectives) {
              location.extraDirectives = {};
            }
            location.extraDirectives[key] = value;
          }
      }
    }

    return location;
  }

  /**
   * Parse les serveurs dans un bloc upstream
   */
  private parseUpstreamServers(content: string): string[] {
    const servers: string[] = [];
    const directives = this.parseDirectives(content);

    for (const [key, value] of Object.entries(directives)) {
      if (key === 'server') {
        if (Array.isArray(value)) {
          servers.push(...value);
        } else {
          servers.push(value);
        }
      }
    }

    return servers;
  }

  /**
   * Convertit la configuration Nginx en configuration pour Caddy
   */
  async convertToServerConfigs(config: NginxConfig): Promise<ServerConfig[]> {
    const serverConfigs: ServerConfig[] = [];

    // Traiter chaque serveur Nginx
    for (const nginxServer of config.http.server) {
      const serverNames = nginxServer.serverName || ['_'];

      // Créer une configuration de serveur pour chaque nom de serveur
      for (const domainName of serverNames) {
        if (domainName === '_' || domainName === 'default_server') {
          continue; // Ignorer les serveurs par défaut
        }

        const serverConfig: ServerConfig = {
          domain: domainName,
          routes: [],
        };

        // Configurer TLS si le serveur utilise SSL
        if (nginxServer.ssl) {
          serverConfig.tls = {
            type: 'manual',
            certFile: nginxServer.ssl.certificate,
            keyFile: nginxServer.ssl.certificateKey,
          };
        }

        // Ajouter les en-têtes personnalisés
        if (nginxServer.headers) {
          serverConfig.headers = { ...nginxServer.headers };
        }

        // Traiter la racine de fichiers statiques
        if (nginxServer.root) {
          serverConfig.routes.push({
            path: '/',
            type: 'static',
            target: nginxServer.root,
          });
        }

        // Ajouter les règles de réécriture au niveau du serveur
        if (nginxServer.rewrite) {
          for (const rewrite of nginxServer.rewrite) {
            // Format: rewrite regex replacement [flags];
            const parts = rewrite.split(/\s+/);
            if (parts.length >= 3) {
              const [, pattern, target] = parts;
              const hasRedirectFlag =
                parts.length > 3 &&
                (parts[3].includes('redirect') || parts[3].includes('permanent'));

              serverConfig.routes.push({
                path: pattern,
                type: hasRedirectFlag ? 'redirect' : 'rewrite',
                target,
                status: parts[3]?.includes('permanent') ? 301 : undefined,
              });
            }
          }
        }

        // Convertir les blocs de localisation
        for (const location of nginxServer.location) {
          await this.convertLocation(serverConfig, location);
        }

        // Ajouter les pages d'erreur
        if (nginxServer.errorPage) {
          for (const [code, page] of Object.entries(nginxServer.errorPage)) {
            serverConfig.routes.push({
              path: '',
              type: 'respond',
              status: parseInt(code, 10),
              target: page,
              options: {
                code: parseInt(code, 10),
              },
            });
          }
        }

        serverConfigs.push(serverConfig);
      }
    }

    return serverConfigs;
  }

  /**
   * Convertit un bloc location en routes Caddy
   */
  private async convertLocation(
    serverConfig: ServerConfig,
    location: NginxLocation
  ): Promise<void> {
    const path = location.path;

    // Proxy
    if (location.proxyPass) {
      serverConfig.routes.push({
        path,
        type: 'proxy',
        target: location.proxyPass,
        headers: location.addHeader,
      });
      return;
    }

    // Redirection (return)
    if (location.returnDirective) {
      const parts = location.returnDirective.split(/\s+/);
      if (parts.length >= 2) {
        const status = parseInt(parts[0], 10);
        const target = parts
          .slice(1)
          .join(' ')
          .replace(/^"(.*)"$/, '$1');

        serverConfig.routes.push({
          path,
          type: 'redirect',
          target,
          status,
        });
      }
      return;
    }

    // Fichiers statiques (root/alias)
    if (location.root || location.alias) {
      const target = location.alias || location.root!;
      serverConfig.routes.push({
        path,
        type: 'static',
        target,
        options: {
          index: location.index?.join(' ') || 'index.html',
        },
      });
      return;
    }

    // Réécritures
    if (location.rewrite) {
      for (const rewrite of location.rewrite) {
        const parts = rewrite.split(/\s+/);
        if (parts.length >= 3) {
          const [, pattern, target] = parts;
          const fullPattern = path === '/' ? pattern : `${path}${pattern}`;
          const hasRedirectFlag =
            parts.length > 3 && (parts[3].includes('redirect') || parts[3].includes('permanent'));

          serverConfig.routes.push({
            path: fullPattern,
            type: hasRedirectFlag ? 'redirect' : 'rewrite',
            target,
            status: parts[3]?.includes('permanent') ? 301 : undefined,
          });
        }
      }
      return;
    }

    // Try_files (fallback)
    if (location.tryFiles) {
      // try_files est souvent utilisé pour le routage frontend (ex: Remix, SPA)
      // Dans Caddy, on peut gérer cela avec une combinaison de routes
      const fallbackFile = location.tryFiles[location.tryFiles.length - 1];

      if (fallbackFile.startsWith('=')) {
        // Si le fallback est une réponse HTTP, c'est probablement un routage frontend
        serverConfig.routes.push({
          path: path === '/' ? '/*' : `${path}/*`,
          type: 'rewrite',
          target: path === '/' ? '/index.html' : `${path}/index.html`,
        });
      } else if (fallbackFile.includes('$uri')) {
        // Cas classique pour SPA: try_files $uri $uri/ /index.html
        serverConfig.routes.push({
          path: path === '/' ? '/*' : `${path}/*`,
          type: 'rewrite',
          target: fallbackFile.replace('$uri', '{path}'),
        });
      }
      return;
    }

    // Si aucun traitement spécial n'est trouvé, ajouter une route par défaut
    if (!location.internalOnly) {
      serverConfig.routes.push({
        path,
        type: 'static',
        target:
          location.root ||
          serverConfig.routes.find((r) => r.type === 'static')?.target ||
          '/var/www/html',
      });
    }
  }
}
