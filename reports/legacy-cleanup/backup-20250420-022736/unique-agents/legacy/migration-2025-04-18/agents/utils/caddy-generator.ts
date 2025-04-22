/**
 * caddy-generator.ts
 * Utilitaire pour générer des fichiers Caddyfile à partir de configurations de serveur
 * Date: 12 avril 2025
 */

import { ServerConfig, RouteConfig, TLSConfig } from '../migration/CaddyfileGenerator';

/**
 * Classe pour générer des fichiers Caddyfile
 */
export class CaddyGenerator {
  /**
   * Génère un fichier Caddyfile à partir de configurations de serveur
   */
  async generate(serverConfigs: ServerConfig[], globalOptions?: any): Promise<string> {
    const globalSnippets: string[] = [];
    const serverBlocks: string[] = [];
    
    // Ajouter les options globales
    if (globalOptions) {
      if (globalOptions.enableAdmin) {
        globalSnippets.push('{', '  admin', '}');
      }
      
      if (globalOptions.logLevel) {
        globalSnippets.push('{', `  log {`, `    level ${globalOptions.logLevel.toLowerCase()}`, '  }', '}');
      }
      
      if (globalOptions.enableTelemetry === false) {
        globalSnippets.push('{', '  telemetry off', '}');
      }
    }
    
    // Traiter chaque configuration de serveur
    for (const server of serverConfigs) {
      const serverBlock = await this.generateServerBlock(server);
      serverBlocks.push(serverBlock);
    }
    
    // Combiner tous les blocs
    const caddyfile = [
      '# Caddyfile généré automatiquement',
      '# Date: ' + new Date().toISOString(),
      '',
      ...globalSnippets,
      '',
      ...serverBlocks
    ].join('\n');
    
    return caddyfile;
  }
  
  /**
   * Fusionne des nouvelles configurations avec un Caddyfile existant
   */
  async mergeWithExistingCaddyfile(serverConfigs: ServerConfig[], existingCaddyfile: string): Promise<ServerConfig[]> {
    // Cette méthode est une approximation simplifiée
    // Dans un système réel, on analyserait le Caddyfile existant pour extraire les configurations
    // et les fusionner avec les nouvelles
    
    // Pour l'instant, on conserve simplement les configurations existantes
    return serverConfigs;
  }
  
  /**
   * Génère un bloc de serveur pour le Caddyfile
   */
  private async generateServerBlock(server: ServerConfig): Promise<string> {
    const lines: string[] = [];
    
    // Ajouter le nom de domaine
    lines.push(`${server.domain} {`);
    
    // Ajouter la configuration TLS si nécessaire
    if (server.tls) {
      lines.push(this.generateTLSConfig(server.tls));
    }
    
    // Ajouter les en-têtes globaux
    if (server.headers && Object.keys(server.headers).length > 0) {
      for (const [header, value] of Object.entries(server.headers)) {
        lines.push(`  header ${header} "${value}"`);
      }
    }
    
    // Ajouter les routes
    const sortedRoutes = this.sortRoutesBySpecificity(server.routes);
    for (const route of sortedRoutes) {
      const routeBlock = this.generateRouteBlock(route);
      lines.push(routeBlock);
    }
    
    // Ajouter les blocs personnalisés
    if (server.customBlocks && server.customBlocks.length > 0) {
      for (const block of server.customBlocks) {
        lines.push(`  ${block}`);
      }
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }
  
  /**
   * Génère la configuration TLS pour un serveur
   */
  private generateTLSConfig(tls: TLSConfig): string {
    switch (tls.type) {
      case 'auto':
        return '  tls';
      case 'internal':
        return '  tls internal';
      case 'manual':
        return `  tls ${tls.certFile} ${tls.keyFile}`;
      default:
        return '  tls';
    }
  }
  
  /**
   * Génère un bloc de route pour le Caddyfile
   */
  private generateRouteBlock(route: RouteConfig): string {
    const lines: string[] = [];
    const indent = '  ';
    
    // Déterminer si nous avons besoin d'un bloc ou d'une directive simple
    const needsBlock = (
      (route.headers && Object.keys(route.headers).length > 0) ||
      (route.options && Object.keys(route.options).length > 0) ||
      route.path.includes(' ') ||
      route.matcher
    );
    
    // Commencer le bloc ou la directive
    if (needsBlock) {
      if (route.matcher) {
        lines.push(`${indent}${route.matcher} {`);
      } else if (route.path && route.path !== '/') {
        const routePath = route.path === '/*' ? '*' : route.path;
        lines.push(`${indent}handle${routePath.startsWith('/') ? '_path' : ''} ${routePath} {`);
      } else {
        lines.push(`${indent}handle {`);
      }
    }
    
    // Ajouter la directive principale en fonction du type
    const directiveIndent = needsBlock ? `${indent}  ` : indent;
    
    switch (route.type) {
      case 'proxy':
        lines.push(`${directiveIndent}reverse_proxy ${route.target}`);
        break;
      case 'static':
        if (route.options?.index) {
          lines.push(`${directiveIndent}root * ${route.target}`);
          lines.push(`${directiveIndent}file_server browse`);
          lines.push(`${directiveIndent}try_files {path} ${route.options.index}`);
        } else {
          lines.push(`${directiveIndent}root * ${route.target}`);
          lines.push(`${directiveIndent}file_server`);
        }
        break;
      case 'redirect':
        if (route.status === 301) {
          lines.push(`${directiveIndent}redir ${route.target} permanent`);
        } else {
          lines.push(`${directiveIndent}redir ${route.target} ${route.status || 302}`);
        }
        break;
      case 'rewrite':
        lines.push(`${directiveIndent}rewrite * ${route.target}`);
        break;
      case 'respond':
        if (route.status) {
          lines.push(`${directiveIndent}respond "${route.target || ''}" ${route.status}`);
        } else {
          lines.push(`${directiveIndent}respond "${route.target || ''}"`);
        }
        break;
      default:
        // Type non reconnu, utiliser file_server par défaut
        lines.push(`${directiveIndent}file_server`);
    }
    
    // Ajouter les en-têtes spécifiques à la route
    if (route.headers && Object.keys(route.headers).length > 0) {
      for (const [header, value] of Object.entries(route.headers)) {
        lines.push(`${directiveIndent}header ${header} "${value}"`);
      }
    }
    
    // Ajouter les options supplémentaires
    if (route.options && Object.keys(route.options).length > 0) {
      for (const [key, value] of Object.entries(route.options)) {
        if (key !== 'index') { // index est géré séparément
          lines.push(`${directiveIndent}${key} ${value}`);
        }
      }
    }
    
    // Fermer le bloc si nécessaire
    if (needsBlock) {
      lines.push(`${indent}}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Trie les routes par spécificité (les plus spécifiques d'abord)
   */
  private sortRoutesBySpecificity(routes: RouteConfig[]): RouteConfig[] {
    return [...routes].sort((a, b) => {
      // Les routes avec matcher sont plus spécifiques
      if (a.matcher && !b.matcher) return -1;
      if (!a.matcher && b.matcher) return 1;
      
      // Les chemins exacts sont plus spécifiques que les motifs génériques
      const aHasWildcard = a.path.includes('*');
      const bHasWildcard = b.path.includes('*');
      
      if (!aHasWildcard && bHasWildcard) return -1;
      if (aHasWildcard && !bHasWildcard) return 1;
      
      // Les chemins plus longs sont plus spécifiques
      return b.path.length - a.path.length;
    });
  }
}