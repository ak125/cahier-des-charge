import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../../core/mcp-agent';

interface RouteMapping {
  from: string;
  to: string;
  type: 'exact' | 'redirect' | 'dynamic' | 'removed';
  status?: number;
  queryParams?: string[];
  description?: string;
}

export class HtaccessRouteAnalyzer implements MCPAgent {
  name = 'htaccess-route-analyzer';
  description = 'Analyse les règles de réécriture dans les fichiers .htaccess pour générer un mappage des routes pour Remix';

  async process(context: MCPContext): Promise<any> {
    const { htaccessPath, outputPath } = context.inputs;
    
    if (!htaccessPath || !fs.existsSync(htaccessPath)) {
      return {
        success: false,
        error: `Le fichier .htaccess n'existe pas: ${htaccessPath}`
      };
    }

    try {
      const content = fs.readFileSync(htaccessPath, 'utf8');
      const routeMappings = this.analyzeHtaccessRules(content);
      
      // Générer routing_patch.json
      if (outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(routeMappings, null, 2), 'utf8');
      }
      
      return {
        success: true,
        data: {
          routeMappings,
          totalRoutes: routeMappings.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de l'analyse des routes dans .htaccess: ${error.message}`
      };
    }
  }

  private analyzeHtaccessRules(content: string): RouteMapping[] {
    const routeMappings: RouteMapping[] = [];
    
    // Supprimer les commentaires et les lignes vides
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    // Extraire les règles RewriteRule
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Règles de redirection
      if (line.startsWith('RewriteRule')) {
        const mapping = this.parseRewriteRule(line, lines, i);
        if (mapping) {
          routeMappings.push(mapping);
        }
      }
      
      // Documents d'erreur
      if (line.startsWith('ErrorDocument')) {
        const mapping = this.parseErrorDocument(line);
        if (mapping) {
          routeMappings.push(mapping);
        }
      }
    }
    
    // Ajouter des règles pour les fichiers PHP courants (à personnaliser selon vos besoins)
    this.addCommonPhpRoutes(routeMappings);
    
    return routeMappings;
  }

  private parseRewriteRule(rule: string, allLines: string[], currentIndex: number): RouteMapping | null {
    // RewriteRule pattern target [flags]
    const match = rule.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]+)\])?$/);
    
    if (!match) return null;
    
    const [, pattern, target, flags] = match;
    let type: 'exact' | 'redirect' | 'dynamic' | 'removed' = 'exact';
    let status = 200;
    
    // Vérifier les flags pour déterminer le type de redirection
    if (flags) {
      if (flags.includes('R=301') || flags.includes('R=302') || flags.includes('R')) {
        type = 'redirect';
        
        // Extraire le code de statut
        const statusMatch = flags.match(/R=(\d+)/);
        status = statusMatch ? parseInt(statusMatch[1]) : flags.includes('R') ? 302 : 200;
      } else if (flags.includes('G')) {
        type = 'removed';
        status = 410; // Gone
      }
    }
    
    // Vérifier si c'est une redirection vers une page PHP
    const isPhpRedirect = target.includes('.php');
    const hasQueryParams = target.includes('?');
    
    // Extraire les paramètres de requête
    const queryParams: string[] = [];
    if (hasQueryParams) {
      const queryPart = target.split('?')[1];
      if (queryPart) {
        queryPart.split('&').forEach(param => {
          const [key] = param.split('=');
          if (key) queryParams.push(key);
        });
      }
    }
    
    // Convertir le pattern pour Remix
    const fromPattern = this.convertPatternToRemix(pattern);
    
    // Convertir la cible pour Remix
    let toPattern = '';
    
    if (type === 'redirect') {
      // Pour les redirections, conserver la cible telle quelle
      toPattern = target.replace(/^\//g, '');
    } else if (isPhpRedirect) {
      // Pour les fichiers PHP, convertir en routes Remix
      if (target.startsWith('/')) {
        // Chemin absolu
        const phpFile = path.basename(target.split('?')[0]);
        toPattern = phpFile.replace('.php', '_').replace(/\//g, '_') + '.php';
      } else {
        // Chemin relatif
        const phpFile = target.split('?')[0];
        toPattern = phpFile.replace('.php', '_').replace(/\//g, '_') + '.php';
      }
    } else {
      // Pour les autres cibles, conserver la structure
      toPattern = target.replace(/^\//g, '');
    }
    
    // Rechercher une éventuelle RewriteCond précédente
    let description = '';
    if (currentIndex > 0) {
      let j = currentIndex - 1;
      const conditions = [];
      
      while (j >= 0 && allLines[j].startsWith('RewriteCond')) {
        conditions.push(allLines[j]);
        j--;
      }
      
      if (conditions.length > 0) {
        description = `Conditions: ${conditions.reverse().join(' AND ')}`;
      }
    }
    
    return {
      from: fromPattern,
      to: toPattern,
      type,
      status,
      queryParams: queryParams.length > 0 ? queryParams : undefined,
      description: description || undefined
    };
  }

  private parseErrorDocument(rule: string): RouteMapping | null {
    // ErrorDocument error-code document
    const match = rule.match(/^ErrorDocument\s+(\d+)\s+(.+)$/);
    
    if (!match) return null;
    
    const [, code, document] = match;
    
    // Vérifier si c'est un fichier PHP
    if (document.endsWith('.php')) {
      const phpFile = path.basename(document);
      const remixRoute = phpFile.replace('.php', '_').replace(/\//g, '_') + '.php';
      
      return {
        from: document,
        to: remixRoute,
        type: 'exact',
        status: parseInt(code),
        description: `Page d'erreur ${code}`
      };
    }
    
    return null;
  }

  private convertPatternToRemix(pattern: string): string {
    // Convertir les patterns Regex en patterns Remix
    // Exemple: ^legacy/old-page-([0-9]+)\.html$ -> legacy/old-page-$id.html
    
    let remixPattern = pattern;
    
    // Remplacer les groupes de capture par des paramètres Remix
    let paramCounter = 1;
    remixPattern = remixPattern.replace(/\(([^)]+)\)/g, (match, group) => {
      return `$param${paramCounter++}`;
    });
    
    // Supprimer les marqueurs de début et de fin
    remixPattern = remixPattern.replace(/^\^|\$$/g, '');
    
    return remixPattern;
  }

  private addCommonPhpRoutes(routeMappings: RouteMapping[]): void {
    // Ajouter des routes courantes pour les fichiers PHP
    const commonPhpFiles = [
      { file: 'index.php', route: '' },
      { file: 'fiche.php', route: 'fiche_.php', params: ['id'] },
      { file: 'panier.php', route: 'panier_.php' },
      { file: 'produit.php', route: 'produit_.php', params: ['id', 'cat'] },
      { file: 'categorie.php', route: 'categorie_.php', params: ['id'] },
      { file: 'contact.php', route: 'contact_.php' },
      { file: 'login.php', route: 'login_.php' },
      { file: 'register.php', route: 'register_.php' },
      { file: 'account.php', route: 'account_.php' },
      { file: 'search.php', route: 'search_.php', params: ['q'] }
    ];
    
    for (const { file, route, params } of commonPhpFiles) {
      // Vérifier si cette route existe déjà
      const exists = routeMappings.some(m => m.from === file || m.from.includes(file));
      
      if (!exists) {
        routeMappings.push({
          from: file,
          to: route,
          type: 'exact',
          queryParams: params,
          description: 'Route PHP commune automatiquement ajoutée'
        });
      }
    }
  }
}

export default new HtaccessRouteAnalyzer();