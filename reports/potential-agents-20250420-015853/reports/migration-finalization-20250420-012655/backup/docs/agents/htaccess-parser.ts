/**
import { AnalyzerAgent , ParserAgent} from '@workspaces/cahier-des-charge/src/core/interfaces/business';
 * htaccess-parser.ts
 * Utilitaire pour analyser les fichiers .htaccess et les convertir en configurations pour Caddy
 * Date: 12 avril 2025
 */

import { ServerConfig, RouteConfig } from '../migration/CaddyfileGenerator';
import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


export interface HtaccessRule {
  type: string;
  pattern?: string;
  target?: string;
  flags?: string[];
  conditions?: HtaccessCondition[];
  options?: Record<string, any>;
}

export interface HtaccessCondition {
  type: string;
  test: string;
  pattern: string;
  flags?: string[];
}

export interface HtaccessConfig {
  rules: HtaccessRule[];
  directives: Record<string, any>;
}

/**
 * Classe pour analyser les fichiers .htaccess
 */
export class HtaccessParser implements BusinessAgent, BaseAgent, BusinessAgent, BaseAgent, BusinessAgent, BaseAgent, BusinessAgent , AnalyzerAgent, ParserAgent{
  /**
   * Parse un fichier .htaccess et extrait ses règles
   */
  async parse(content: string): Promise<HtaccessConfig> {
    const config: HtaccessConfig = {
      rules: [],
      directives: {}
    };
    
    // Diviser le contenu en lignes
    const lines = content.split('\n');
    let currentRuleBlock: string[] = [];
    let inRewriteEngine = false;
    let inIfModule = false;
    let inLocation = false;
    let inDirectory = false;
    let inFiles = false;
    let inLimit = false;
    
    // Parcourir chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ignorer les lignes vides et les commentaires
      if (line === '' || line.startsWith('#')) {
        continue;
      }
      
      // Détecter le début et la fin des sections
      if (line.startsWith('<IfModule')) {
        inIfModule = true;
        continue;
      } else if (line.startsWith('</IfModule>')) {
        inIfModule = false;
        continue;
      } else if (line.startsWith('<Location')) {
        inLocation = true;
        continue;
      } else if (line.startsWith('</Location>')) {
        inLocation = false;
        continue;
      } else if (line.startsWith('<Directory')) {
        inDirectory = true;
        continue;
      } else if (line.startsWith('</Directory>')) {
        inDirectory = false;
        continue;
      } else if (line.startsWith('<Files')) {
        inFiles = true;
        continue;
      } else if (line.startsWith('</Files>')) {
        inFiles = false;
        continue;
      } else if (line.startsWith('<Limit')) {
        inLimit = true;
        continue;
      } else if (line.startsWith('</Limit>')) {
        inLimit = false;
        continue;
      }
      
      // Gérer les règles RewriteEngine
      if (line.startsWith('RewriteEngine')) {
        const parts = line.split(/\s+/);
        if (parts.length > 1 && parts[1].toLowerCase() === 'on') {
          inRewriteEngine = true;
        } else {
          inRewriteEngine = false;
        }
        continue;
      }
      
      // Collecter les règles de réécriture
      if (inRewriteEngine) {
        if (line.startsWith('RewriteRule') || line.startsWith('RewriteCond')) {
          currentRuleBlock.push(line);
        } else if (currentRuleBlock.length > 0 && line.startsWith('RewriteMap')) {
          // Les RewriteMaps sont des directives spéciales, on les stocke dans les directives
          const parts = line.split(/\s+/);
          if (parts.length >= 3) {
            const mapName = parts[1];
            const mapType = parts[2];
            config.directives[`RewriteMap_${mapName}`] = { type: mapType, data: parts.slice(3).join(' ') };
          }
        } else if (currentRuleBlock.length > 0) {
          // Traiter le bloc de règles accumulé
          this.processRewriteBlock(currentRuleBlock, config.rules);
          currentRuleBlock = [];
          
          // Traiter cette ligne comme une nouvelle directive
          if (line.includes(' ')) {
            const [directive, ...valueParts] = line.split(/\s+/);
            config.directives[directive] = valueParts.join(' ');
          }
        } else {
          // Autres directives dans RewriteEngine
          if (line.includes(' ')) {
            const [directive, ...valueParts] = line.split(/\s+/);
            config.directives[directive] = valueParts.join(' ');
          }
        }
      } else {
        // Directives en dehors de RewriteEngine
        if (line.includes(' ')) {
          const [directive, ...valueParts] = line.split(/\s+/);
          config.directives[directive] = valueParts.join(' ');
        }
      }
    }
    
    // Traiter le dernier bloc de règles s'il en reste
    if (currentRuleBlock.length > 0) {
      this.processRewriteBlock(currentRuleBlock, config.rules);
    }
    
    return config;
  }
  
  /**
   * Traite un bloc de règles de réécriture
   */
  private processRewriteBlock(block: string[], rules: HtaccessRule[]): void {
    // Extraire les conditions
    const conditions: HtaccessCondition[] = [];
    let ruleIndex = -1;
    
    for (let i = 0; i < block.length; i++) {
      const line = block[i];
      
      if (line.startsWith('RewriteCond')) {
        // Format: RewriteCond TestString CondPattern [flags]
        const parts = this.splitPreservingQuotes(line.substring('RewriteCond'.length).trim());
        
        if (parts.length >= 2) {
          const condition: HtaccessCondition = {
            type: 'RewriteCond',
            test: parts[0],
            pattern: parts[1]
          };
          
          // Extraire les drapeaux s'il y en a
          if (parts.length > 2) {
            condition.flags = this.extractFlags(parts[2]);
          }
          
          conditions.push(condition);
        }
      } else if (line.startsWith('RewriteRule')) {
        ruleIndex = i;
        break;
      }
    }
    
    // Extraire la règle
    if (ruleIndex !== -1) {
      const ruleLine = block[ruleIndex];
      // Format: RewriteRule Pattern Substitution [flags]
      const parts = this.splitPreservingQuotes(ruleLine.substring('RewriteRule'.length).trim());
      
      if (parts.length >= 2) {
        const rule: HtaccessRule = {
          type: 'RewriteRule',
          pattern: parts[0],
          target: parts[1]
        };
        
        // Extraire les drapeaux s'il y en a
        if (parts.length > 2) {
          rule.flags = this.extractFlags(parts[2]);
        }
        
        // Ajouter les conditions si elles existent
        if (conditions.length > 0) {
          rule.conditions = [...conditions];
        }
        
        rules.push(rule);
      }
    }
  }
  
  /**
   * Divise une chaîne en préservant les citations
   */
  private splitPreservingQuotes(str: string): string[] {
    const parts: string[] = [];
    let currentPart = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        } else {
          currentPart += char;
        }
      } else if (char === ' ' && !inQuotes) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = '';
        }
      } else {
        currentPart += char;
      }
    }
    
    if (currentPart) {
      parts.push(currentPart);
    }
    
    return parts;
  }
  
  /**
   * Extrait les drapeaux d'une chaîne de drapeaux
   */
  private extractFlags(flagString: string): string[] {
    // Supprimer les crochets s'ils sont présents
    if (flagString.startsWith('[') && flagString.endsWith(']')) {
      flagString = flagString.substring(1, flagString.length - 1);
    }
    
    // Diviser par des virgules ou des espaces
    return flagString.split(/[,\s]+/).filter(flag => flag.length > 0);
  }
  
  /**
   * Améliore les configurations de serveur avec les règles .htaccess
   */
  async enhanceServerConfigs(
    serverConfigs: ServerConfig[],
    htaccessConfig: HtaccessConfig,
    htaccessDir: string
  ): Promise<void> {
    // Trouver le serveur par défaut ou en créer un
    let defaultServer = serverConfigs.find(s => s.domain === '_' || s.domain === 'localhost');
    
    if (!defaultServer) {
      defaultServer = {
        domain: 'localhost',
        routes: []
      };
      serverConfigs.push(defaultServer);
    }
    
    // Traiter les règles de réécriture
    for (const rule of htaccessConfig.rules) {
      if (rule.type === 'RewriteRule') {
        await this.processRewriteRule(defaultServer, rule);
      }
    }
    
    // Traiter les autres directives
    await this.processDirectives(defaultServer, htaccessConfig.directives, htaccessDir);
  }
  
  /**
   * Traite une règle de réécriture et l'ajoute à la configuration du serveur
   */
  private async processRewriteRule(server: ServerConfig, rule: HtaccessRule): Promise<void> {
    // Ignorer les règles sans motif ou cible
    if (!rule.pattern || !rule.target) {
      return;
    }
    
    // Détecter le type de règle en fonction des drapeaux
    let routeType: string = 'rewrite';
    let status: number | undefined;
    
    if (rule.flags) {
      if (rule.flags.includes('R=301') || rule.flags.includes('R=permanent')) {
        routeType = 'redirect';
        status = 301;
      } else if (rule.flags.includes('R=302') || rule.flags.includes('R=temp')) {
        routeType = 'redirect';
        status = 302;
      } else if (rule.flags.includes('R=303')) {
        routeType = 'redirect';
        status = 303;
      } else if (rule.flags.includes('R=307')) {
        routeType = 'redirect';
        status = 307;
      } else if (rule.flags.includes('R=308')) {
        routeType = 'redirect';
        status = 308;
      } else if (rule.flags.includes('R')) {
        routeType = 'redirect';
        status = 302; // Défaut pour R sans code
      } else if (rule.flags.includes('F')) {
        routeType = 'respond';
        status = 403;
      } else if (rule.flags.includes('G')) {
        routeType = 'respond';
        status = 410;
      }
    }
    
    // Convertir le motif de regex Apache en motif compatible avec Caddy
    let pattern = rule.pattern;
    let target = rule.target;
    
    // Convertir les motifs et cibles
    if (pattern === '^(.*)$') {
      pattern = '*';
    } else if (pattern.startsWith('^') && pattern.endsWith('$')) {
      pattern = pattern.substring(1, pattern.length - 1);
    }
    
    // Remplacer les références back dans le motif de redirection
    target = target.replace(/\$(\d)/g, '{re.$1}');
    
    // Créer la route
    const route: RouteConfig = {
      path: pattern,
      type: routeType as 'redirect' | 'rewrite' | 'proxy' | 'static' | 'respond',
      target
    };
    
    // Ajouter le statut pour les redirections
    if (status) {
      route.status = status;
    }
    
    // Conditions spéciales (e.g., vérification d'en-têtes)
    if (rule.conditions) {
      let matcherExpressions: string[] = [];
      
      for (const condition of rule.conditions) {
        if (condition.test === '%{HTTP_HOST}') {
          matcherExpressions.push(`host ${this.convertPatternToCaddyFormat(condition.pattern)}`);
        } else if (condition.test === '%{REQUEST_URI}') {
          matcherExpressions.push(`path ${this.convertPatternToCaddyFormat(condition.pattern)}`);
        } else if (condition.test === '%{QUERY_STRING}') {
          matcherExpressions.push(`query ${this.convertPatternToCaddyFormat(condition.pattern)}`);
        } else if (condition.test.startsWith('%{HTTP:')) {
          const header = condition.test.substring(7, condition.test.length - 1);
          matcherExpressions.push(`header ${header} ${this.convertPatternToCaddyFormat(condition.pattern)}`);
        }
      }
      
      if (matcherExpressions.length > 0) {
        route.matcher = `@match_${server.routes.length}`;
        
        // Ajouter un bloc de matchers personnalisé
        if (!server.customBlocks) {
          server.customBlocks = [];
        }
        
        server.customBlocks.push(`${route.matcher} {
  ${matcherExpressions.join('\n  ')}
}`);
      }

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

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
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';
    }
    
    server.routes.push(route);
  }
  
  /**
   * Convertit un motif de regex Apache en motif compatible avec Caddy
   */
  private convertPatternToCaddyFormat(pattern: string): string {
    // Supprimer les délimiteurs de regex s'ils sont présents
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      pattern = pattern.substring(1, pattern.length - 1);
    }
    
    // Remplacer les références arrière
    pattern = pattern.replace(/\$(\d)/g, '{re.$1}');
    
    return pattern;
  }
  
  /**
   * Traite les autres directives .htaccess
   */
  private async processDirectives(
    server: ServerConfig,
    directives: Record<string, any>,
    htaccessDir: string
  ): Promise<void> {
    // Traiter les directives d'erreur
    if (directives['ErrorDocument']) {
      const errorCodes = Object.keys(directives['ErrorDocument']);
      
      for (const code of errorCodes) {
        const page = directives['ErrorDocument'][code];
        
        server.routes.push({
          path: '',
          type: 'respond',
          target: page,
          status: parseInt(code, 10)
        });
      }
    }
    
    // Traiter les en-têtes
    if (!server.headers) {
      server.headers = {};
    }
    
    if (directives['Header']) {
      const headers = Array.isArray(directives['Header']) ? directives['Header'] : [directives['Header']];
      
      for (const header of headers) {
        const parts = header.split(' ');
        if (parts.length >= 3) {
          const action = parts[0];
          const name = parts[1];
          const value = parts.slice(2).join(' ');
          
          if (action.toLowerCase() === 'set') {
            server.headers[name] = value;
          }
        }
      }
    }
    
    // Traiter les directives d'autorisation/contrôle d'accès
    if (directives['AuthType'] || directives['AuthName'] || directives['AuthUserFile']) {
      // Pour les authentifications basiques, Caddy a besoin d'une directive 'basicauth'
      const authType = directives['AuthType'];
      const authName = directives['AuthName'];
      const authUserFile = directives['AuthUserFile'];
      
      if (authType === 'Basic' && authUserFile) {
        // Vérifier si le fichier existe
        const authFilePath = path.resolve(htaccessDir, authUserFile);
        
        if (fs.existsSync(authFilePath)) {
          // Lire le fichier htpasswd
          const htpasswdContent = fs.readFileSync(authFilePath, 'utf8');
          const authUsers = this.parseHtpasswd(htpasswdContent);
          
          if (Object.keys(authUsers).length > 0) {
            // Ajouter un bloc d'authentification de base
            if (!server.customBlocks) {
              server.customBlocks = [];
            }
            
            let basicAuthBlock = 'basicauth * {';
            for (const [username, password] of Object.entries(authUsers)) {
              basicAuthBlock += `\n  ${username} ${password}`;
            }
            basicAuthBlock += '\n}';
            
            server.customBlocks.push(basicAuthBlock);
          }
        }
      }
    }
    
    // Traiter les directives de cache et d'expiration
    if (directives['ExpiresActive'] === 'On' && directives['ExpiresByType']) {
      for (const [mimeType, expireRule] of Object.entries(directives['ExpiresByType'])) {
        // Extraire la règle d'expiration
        const expireMatch = expireRule.match(/^"access plus (\d+) (seconds|minutes|hours|days|months|years)"$/);
        
        if (expireMatch) {
          const amount = parseInt(expireMatch[1], 10);
          const unit = expireMatch[2];
          
          // Convertir en secondes pour Caddy
          let seconds = amount;
          switch (unit) {
            case 'minutes':
              seconds *= 60;
              break;
            case 'hours':
              seconds *= 3600;
              break;
            case 'days':
              seconds *= 86400;
              break;
            case 'months':
              seconds *= 2592000; // 30 jours
              break;
            case 'years':
              seconds *= 31536000; // 365 jours
              break;
          }
          
          // Ajouter une route pour ce type MIME
          server.routes.push({
            path: '*',
            type: 'static',
            target: '/var/www/html', // Chemin par défaut, sera remplacé
            options: {
              header: {
                'Cache-Control': `max-age=${seconds}, public`
              }
            },
            matcher: `@mime_${mimeType.replace('/', '_')}`
          });
          
          // Ajouter un bloc de matcher pour ce type MIME
          if (!server.customBlocks) {
            server.customBlocks = [];
          }
          
          server.customBlocks.push(`@mime_${mimeType.replace('/', '_')} {
  header Content-Type ${mimeType}
}`);
        }
      }
    }
    
    // Traiter les redirections directes
    if (directives['Redirect']) {
      const redirects = Array.isArray(directives['Redirect']) ? directives['Redirect'] : [directives['Redirect']];
      
      for (const redirect of redirects) {
        const parts = redirect.split(' ');
        
        if (parts.length >= 2) {
          const status = parts[0].match(/^\d+$/) ? parseInt(parts[0], 10) : 302;
          const source = parts[0].match(/^\d+$/) ? parts[1] : parts[0];
          const target = parts[0].match(/^\d+$/) ? parts.slice(2).join(' ') : parts.slice(1).join(' ');
          
          server.routes.push({
            path: source,
            type: 'redirect',
            target,
            status
          });
        }
      }
    }
  }
  
  /**
   * Parse un fichier htpasswd
   */
  private parseHtpasswd(content: string): Record<string, string> {
    const users: Record<string, string> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const [username, password] = line.split(':');
      if (username && password) {
        users[username] = password;
      }
    }
    
    return users;
  }
}