import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../coreDoDotmcp-agent';

interface CaddyfileConfig {
  globalOptions?: Record<string, any>;
  sites: {
    hostname: string;
    routes: any[];
    tls?: any;
    options?: Record<string, any>;
  }[];
}

export class CaddyfileGenerator implements MCPAgent {
  name = 'caddyfile-generator';
  description = 'Génère un Caddyfile à partir des configurations Nginx et .htaccess analysées';

  async process(context: MCPContext): Promise<any> {
    const { nginxConfig, htaccessConfig, outputPath } = context.inputs;
    
    try {
      let caddyConfig: CaddyfileConfig = {
        sites: []
      };

      // Traiter la configuration Nginx si présente
      if (nginxConfig) {
        caddyConfig = this.processNginxConfig(nginxConfig, caddyConfig);
      }

      // Traiter la configuration .htaccess si présente
      if (htaccessConfig) {
        caddyConfig = this.processHtaccessConfig(htaccessConfig, caddyConfig);
      }

      // Générer le contenu du Caddyfile
      const caddyfileContent = this.generateCaddyfileContent(caddyConfig);
      
      // Écrire le fichier si un chemin de sortie est spécifié
      if (outputPath) {
        fs.writeFileSync(outputPath, caddyfileContent, 'utf8');
      }
      
      return {
        success: true,
        data: {
          caddyfileContent,
          config: caddyConfig
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de la génération du Caddyfile: ${error.message}`
      };
    }
  }

  private processNginxConfig(nginxConfig: any, caddyConfig: CaddyfileConfig): CaddyfileConfig {
    // Parcourir tous les serveurs Nginx
    for (const server of nginxConfig.servers) {
      for (const serverName of server.serverName) {
        // Ignorer les configurations de serveur par défaut sans nom
        if (serverName === '_' || serverName === 'default_server') continue;

        const site = {
          hostname: serverName,
          routes: [],
          options: {}
        };

        // Configurer TLS/SSL
        if (server.ssl) {
          site.tls = {
            cert: server.sslCertificate,
            key: server.sslCertificateKey
          };
        }

        // Configurer le répertoire racine
        if (server.root) {
          site.options.root = server.root;
        }

        // Traiter les locations
        for (const location of server.locations) {
          const route: any = {};

          // Traiter les différents types de locations
          if (location.proxyPass) {
            // Proxy pass
            route.handle = [{
              handler: 'reverse_proxy',
              upstreams: [this.normalizeProxyPass(location.proxyPass)]
            }];

            // Ajouter le chemin au besoin
            if (location.path !== '/') {
              route.path = location.path;
            }
          } else if (location.alias) {
            // Alias
            route.handle = [{
              handler: 'file_server',
              root: location.alias
            }];
            route.path = location.path;
          } else if (location.try_files && location.try_files.length > 0) {
            // Try files
            route.handle = [{
              handler: 'try_files',
              files: location.try_files
            }];
            route.path = location.path;
          } else if (location.return) {
            // Return (redirect)
            const parts = location.return.split(' ');
            const code = parseInt(parts[0]);
            const url = parts.slice(1).join(' ');
            
            if (code >= 300 && code < 400) {
              route.handle = [{
                handler: 'redir',
                to: url,
                code
              }];
              route.path = location.path;
            }
          }

          // Ajouter les en-têtes si présents
          if (location.headers && Object.keys(location.headers).length > 0) {
            if (!route.handle) {
              route.handle = [];
            }
            
            route.handle.push({
              handler: 'headers',
              headers: location.headers
            });
          }

          // Ajouter la route si elle n'est pas vide
          if (route.handle && route.handle.length > 0) {
            site.routes.push(route);
          }
        }

        // Traiter les redirections
        if (server.redirects && server.redirects.length > 0) {
          for (const redirect of server.redirects) {
            site.routes.push({
              path: redirect.from,
              handle: [{
                handler: 'redir',
                to: redirect.to,
                code: redirect.code || 301
              }]
            });
          }
        }

        // Ajouter le site à la configuration
        caddyConfig.sites.push(site);
      }
    }

    // Traiter les upstreams
    if (nginxConfig.upstreams) {
      // Dans Caddy, les upstreams sont définis directement dans les directives reverse_proxy
      // Nous les gardons en mémoire pour les utiliser lors de la génération du Caddyfile
    }

    return caddyConfig;
  }

  private processHtaccessConfig(htaccessConfig: any, caddyConfig: CaddyfileConfig): CaddyfileConfig {
    // Si aucun site n'existe encore, créer un site par défaut
    if (caddyConfig.sites.length === 0) {
      caddyConfig.sites.push({
        hostname: ':80',
        routes: []
      });
    }

    const defaultSite = caddyConfig.sites[0];

    // Traiter les règles
    for (const rule of htaccessConfig.rules) {
      switch (rule.type) {
        case 'redirect':
          defaultSite.routes.push({
            path: rule.pattern,
            handle: [{
              handler: 'redir',
              to: rule.target,
              code: rule.code || 302
            }]
          });
          break;
        
        case 'rewrite':
          // Pour les règles de réécriture complexes, on utilise la directive `rewrite`
          const hasFlagRedirect = rule.flags && rule.flags.some(f => ['R', 'redirect'].includes(f));
          
          if (hasFlagRedirect) {
            // C'est une redirection
            const code = rule.flags.find(f => f.startsWith('R=')) ? 
              parseInt(rule.flags.find(f => f.startsWith('R='))?.split('=')[1] || '302') : 302;
            
            defaultSite.routes.push({
              path: rule.pattern,
              handle: [{
                handler: 'redir',
                to: rule.target,
                code
              }]
            });
          } else {
            // C'est une réécriture (URI interne)
            defaultSite.routes.push({
              path: rule.pattern,
              handle: [{
                handler: 'rewrite',
                to: rule.target
              }]
            });
          }
          break;
        
        case 'header':
          // Ajouter des en-têtes HTTP
          defaultSite.routes.push({
            path: '*',
            handle: [{
              handler: 'header',
              [rule.header]: rule.target
            }]
          });
          break;
        
        case 'errorDocument':
          // Gestion des documents d'erreur
          if (!defaultSite.options.errors) {
            defaultSite.options.errors = {};
          }
          defaultSite.options.errors[rule.code.toString()] = rule.target;
          break;
        
        // Autres cas selon les besoins
      }
    }

    // Traiter les règles par répertoire
    for (const [directory, rules] of Object.entries(htaccessConfig.directories)) {
      for (const rule of rules) {
        // Similaire au traitement ci-dessus, mais avec un préfixe de chemin
        // basé sur le répertoire concerné
        const pathPrefix = directory.replace(/^\//, '').replace(/\/$/, '');
        
        // Traitement similaire au bloc ci-dessus pour chaque type de règle
        // avec l'ajout du préfixe de chemin
      }
    }

    return caddyConfig;
  }

  private normalizeProxyPass(proxyPass: string): string {
    // Supprimer le préfixe http:// ou https://
    let normalized = proxyPass.replace(/^https?:\/\//, '');
    
    // Gérer les cas particuliers comme les variables Nginx
    if (normalized.includes('$')) {
      // Pour les variables, nous utilisons une approximation
      // Dans un cas réel, ces variables devraient être résolues selon le contexte
      normalized = normalized.replace(/\$host/g, '{host}')
                            .replace(/\$server_name/g, '{host}')
                            .replace(/\$remote_addr/g, '{remote_host}')
                            .replace(/\$proxy_add_x_forwarded_for/g, '{remote_host}');
    }
    
    return normalized;
  }

  private generateCaddyfileContent(config: CaddyfileConfig): string {
    let content = '# Caddyfile généré automatiquement\n\n';

    // Ajouter les options globales si présentes
    if (config.globalOptions) {
      content += '{\n';
      for (const [key, value] of Object.entries(config.globalOptions)) {
        content += `\t${key} ${this.formatValue(value)}\n`;
      }
      content += '}\n\n';
    }

    // Ajouter chaque site
    for (const site of config.sites) {
      content += `${site.hostname} {\n`;
      
      // Ajouter les options du site
      if (site.options) {
        for (const [key, value] of Object.entries(site.options)) {
          if (key === 'root') {
            content += `\troot ${value}\n`;
          } else {
            content += `\t${key} ${this.formatValue(value)}\n`;
          }
        }
      }
      
      // Ajouter la configuration TLS si présente
      if (site.tls) {
        if (site.tls.cert && site.tls.key) {
          content += `\ttls ${site.tls.cert} ${site.tls.key}\n`;
        } else if (site.tls === 'internal' || site.tls === true) {
          content += '\ttls internal\n';
        }
      }
      
      // Ajouter les routes
      for (const route of site.routes) {
        // Ajouter la directive de chemin si présente
        if (route.path && route.path !== '/') {
          if (route.path.includes('*') || route.path.includes('(') || route.path.includes('[')) {
            content += `\t@${this.sanitizeMatcher(route.path)} {\n`;
            content += `\t\tpath_regexp ${this.convertNginxRegexToCaddy(route.path)}\n`;
            content += '\t}\n';
            
            // Les gestionnaires utilisent maintenant le matcher
            for (const handle of route.handle) {
              content += `\t${handle.handler} @${this.sanitizeMatcher(route.path)} `;
              
              // Ajouter les détails du gestionnaire selon son type
              switch (handle.handler) {
                case 'reverse_proxy':
                  content += handle.upstreams.join(' ');
                  break;
                case 'redir':
                  content += `${handle.to} ${handle.code || 302}`;
                  break;
                case 'rewrite':
                  content += handle.to;
                  break;
                case 'file_server':
                  if (handle.root) {
                    content += `{\n\t\troot ${handle.root}\n\t}`;
                  }
                  break;
                case 'try_files':
                  content += handle.files.join(' ');
                  break;
                case 'headers':
                  content += '{\n';
                  for (const [header, value] of Object.entries(handle.headers)) {
                    content += `\t\t${header} ${value}\n`;
                  }
                  content += '\t}';
                  break;
                default:
                  content += this.formatValue(handle);
              }
              
              content += '\n';
            }
          } else {
            content += `\thandle_path ${route.path} {\n`;
            
            // Ajouter les gestionnaires pour ce chemin
            for (const handle of route.handle) {
              content += `\t\t${handle.handler} `;
              
              // Ajouter les détails du gestionnaire selon son type
              switch (handle.handler) {
                case 'reverse_proxy':
                  content += handle.upstreams.join(' ');
                  break;
                case 'redir':
                  content += `${handle.to} ${handle.code || 302}`;
                  break;
                case 'rewrite':
                  content += handle.to;
                  break;
                case 'file_server':
                  if (handle.root) {
                    content += `{\n\t\t\troot ${handle.root}\n\t\t}`;
                  }
                  break;
                case 'try_files':
                  content += handle.files.join(' ');
                  break;
                case 'headers':
                  content += '{\n';
                  for (const [header, value] of Object.entries(handle.headers)) {
                    content += `\t\t\t${header} ${value}\n`;
                  }
                  content += '\t\t}';
                  break;
                default:
                  content += this.formatValue(handle);
              }
              
              content += '\n';
            }
            
            content += '\t}\n';
          }
        } else {
          // Routes sans chemin spécifique (racine du site)
          for (const handle of route.handle) {
            content += `\t${handle.handler} `;
            
            // Similaire au bloc ci-dessus pour chaque type de gestionnaire
            switch (handle.handler) {
              case 'reverse_proxy':
                content += handle.upstreams.join(' ');
                break;
              case 'redir':
                content += `${handle.to} ${handle.code || 302}`;
                break;
              case 'rewrite':
                content += handle.to;
                break;
              case 'file_server':
                if (handle.root) {
                  content += `{\n\t\troot ${handle.root}\n\t}`;
                }
                break;
              case 'try_files':
                content += handle.files.join(' ');
                break;
              case 'headers':
                content += '{\n';
                for (const [header, value] of Object.entries(handle.headers)) {
                  content += `\t\t${header} ${value}\n`;
                }
                content += '\t}';
                break;
              default:
                content += this.formatValue(handle);
            }
            
            content += '\n';
          }
        }
      }
      
      content += '}\n\n';
    }

    return content;
  }

  private sanitizeMatcher(path: string): string {
    // Créer un identifiant de matcher valide en remplaçant les caractères spéciaux
    return `matcher_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  private convertNginxRegexToCaddy(regex: string): string {
    // Convertir les expressions régulières de Nginx au format Caddy
    // C'est une conversion basique, certains cas complexes pourraient nécessiter des ajustements manuels
    return regex
      .replace(/\^/g, '^') // Début de chaîne
      .replace(/\$/g, '$') // Fin de chaîne
      .replace(/\.\*/g, '.*') // Caractère joker
      .replace(/\(\.\*\)/g, '(.*)'); // Groupe de capture avec joker
  }

  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return value.toString();
    } else if (Array.isArray(value)) {
      return value.map(v => this.formatValue(v)).join(' ');
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return '';
  }
}

export default new CaddyfileGenerator();