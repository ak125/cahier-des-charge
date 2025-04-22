/**
 * Agent d'analyse avancée des fichiers .htaccess
 * Extrait toutes les règles et les classe par type pour faciliter la migration vers Remix
 */

import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../../coreDoDotmcp-agent';

interface HtaccessRule {
  type: 'rewrite' | 'redirect' | 'condition' | 'error' | 'gone' | 'environment' | 'other';
  original: string;
  pattern?: string;
  target?: string;
  flags?: string[];
  conditions?: string[];
  status?: number;
  priority: number;
  description?: string;
  params?: string[];
}

interface ParsedHtaccessData {
  rewrites: HtaccessRule[];
  redirects: HtaccessRule[];
  conditions: HtaccessRule[];
  errors: HtaccessRule[];
  gone: HtaccessRule[];
  environment: HtaccessRule[];
  other: HtaccessRule[];
}

interface HtaccessOutput {
  mapping: Record<string, string>;
  redirects: Record<string, { to: string, status: number }>;
  gone: string[];
  seoRoutes: string[];
  criticalPaths: string[];
}

export class HtaccessParser implements MCPAgent {
  name = 'htaccess-parser';
  description = "Analyse complète des fichiers .htaccess pour la migration vers Remix avec gestion des redirections SEO";

  async process(context: MCPContext): Promise<any> {
    const { 
      htaccessPath,
      outputDir = path.join(process.cwd(), 'reports'),
      generateRoutingPatch = true,
      identifySeoRoutes = true,
      includeCommonPhp = true
    } = context.inputs;

    if (!htaccessPath || !fs.existsSync(htaccessPath)) {
      return {
        success: false,
        error: `Le fichier .htaccess n'existe pas: ${htaccessPath}`
      };
    }

    try {
      // Assurer que le répertoire de sortie existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Lire et analyser le fichier .htaccess
      const content = fs.readFileSync(htaccessPath, 'utf8');
      const parsedRules = this.parseHtaccessRules(content);
      
      // Générer le fichier htaccess_map.json
      const htaccessMapPath = path.join(outputDir, 'htaccess_map.json');
      fs.writeFileSync(htaccessMapPath, JSON.stringify(parsedRules, null, 2), 'utf8');
      
      // Traiter les règles et générer les sorties
      const output = this.generateOutputFiles(parsedRules, includeCommonPhp);
      
      // Générer les fichiers de sortie
      this.writeOutputFiles(output, outputDir);
      
      // Générer le fichier d'audit SEO si demandé
      if (identifySeoRoutes) {
        this.generateSeoAudit(parsedRules, output, path.join(outputDir, 'seo_routes.audit.md'));
      }
      
      // Générer le fichier routing_patch.json si demandé
      if (generateRoutingPatch) {
        this.generateRoutingPatch(output, path.join(outputDir, 'routing_patch.json'));
      }
      
      return {
        success: true,
        data: {
          files: {
            htaccessMap: htaccessMapPath,
            redirects: path.join(outputDir, 'redirects.json'),
            deletedRoutes: path.join(outputDir, 'deleted_routes.json'),
            routingPatch: generateRoutingPatch ? path.join(outputDir, 'routing_patch.json') : null,
            seoAudit: identifySeoRoutes ? path.join(outputDir, 'seo_routes.audit.md') : null
          },
          stats: {
            totalRules: this.countTotalRules(parsedRules),
            redirects: output.redirects ? Object.keys(output.redirects).length : 0,
            gone: output.gone ? output.gone.length : 0,
            mapping: output.mapping ? Object.keys(output.mapping).length : 0,
            seoRoutes: output.seoRoutes ? output.seoRoutes.length : 0,
            criticalPaths: output.criticalPaths ? output.criticalPaths.length : 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de l'analyse du fichier .htaccess: ${error.message}`
      };
    }
  }

  private parseHtaccessRules(content: string): ParsedHtaccessData {
    // Initialiser l'objet de sortie
    const result: ParsedHtaccessData = {
      rewrites: [],
      redirects: [],
      conditions: [],
      errors: [],
      gone: [],
      environment: [],
      other: []
    };
    
    // Supprimer les commentaires et les lignes vides
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    // Variables pour suivre les conditions en attente
    let pendingConditions: string[] = [];
    let priority = 0;
    
    // Parcourir chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // RewriteCond : conditions pour les règles de réécriture
      if (line.startsWith('RewriteCond')) {
        const condMatch = line.match(/^RewriteCond\s+(\S+)\s+(\S+)(?:\s+\[([^\]]+)\])?$/);
        if (condMatch) {
          pendingConditions.push(line);
          result.conditions.push({
            type: 'condition',
            original: line,
            pattern: condMatch[1],
            target: condMatch[2],
            flags: condMatch[3] ? condMatch[3].split(',') : undefined,
            priority: priority++,
            description: `Condition pour la prochaine règle de réécriture`
          });
        }
        continue;
      }
      
      // RewriteRule : règles de réécriture
      if (line.startsWith('RewriteRule')) {
        const rule = this.parseRewriteRule(line, pendingConditions);
        if (rule) {
          // Déterminer le type selon les flags
          if (rule.flags && (rule.flags.includes('R') || rule.flags.some(f => f.startsWith('R=')))) {
            result.redirects.push({
              ...rule,
              type: 'redirect',
              priority: priority++
            });
          } else if (rule.flags && rule.flags.includes('G')) {
            result.gone.push({
              ...rule,
              type: 'gone',
              priority: priority++
            });
          } else {
            result.rewrites.push({
              ...rule,
              type: 'rewrite',
              priority: priority++
            });
          }
        }
        pendingConditions = []; // Réinitialiser les conditions
        continue;
      }
      
      // ErrorDocument : documents d'erreur
      if (line.startsWith('ErrorDocument')) {
        const errorRule = this.parseErrorDocument(line);
        if (errorRule) {
          result.errors.push({
            ...errorRule,
            priority: priority++
          });
        }
        continue;
      }
      
      // SetEnv/SetEnvIf : variables d'environnement
      if (line.startsWith('SetEnv') || line.startsWith('SetEnvIf')) {
        result.environment.push({
          type: 'environment',
          original: line,
          priority: priority++,
          description: 'Variable d\'environnement'
        });
        continue;
      }
      
      // Toute autre règle
      result.other.push({
        type: 'other',
        original: line,
        priority: priority++,
        description: 'Règle non classifiée'
      });
    }
    
    return result;
  }

  private parseRewriteRule(rule: string, conditions: string[] = []): HtaccessRule | null {
    // RewriteRule pattern target [flags]
    const match = rule.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]+)\])?$/);
    
    if (!match) return null;
    
    const [, pattern, target, flagsStr] = match;
    const flags = flagsStr ? flagsStr.split(',') : [];
    
    // Extraire le code de statut pour les redirections
    let status = 200;
    if (flags) {
      // Chercher le flag R=xxx
      const redirectFlag = flags.find(f => f.startsWith('R='));
      if (redirectFlag) {
        const statusMatch = redirectFlag.match(/R=(\d+)/);
        if (statusMatch && statusMatch[1]) {
          status = parseInt(statusMatch[1], 10);
        }
      } else if (flags.includes('R')) {
        // R sans code = 302 par défaut
        status = 302;
      }
      
      // Si G (Gone) est présent, statut 410
      if (flags.includes('G')) {
        status = 410;
      }
    }
    
    // Extraire les paramètres de requête
    const params: string[] = [];
    if (target.includes('?')) {
      const queryPart = target.split('?')[1];
      if (queryPart) {
        queryPart.split('&').forEach(param => {
          const [key] = param.split('=');
          if (key) params.push(key);
        });
      }
    }
    
    return {
      type: 'rewrite', // Type par défaut, sera ajusté plus tard
      original: rule,
      pattern,
      target,
      flags,
      conditions: conditions.length > 0 ? [...conditions] : undefined,
      status,
      priority: 0, // Sera ajusté par la méthode appelante
      description: conditions.length > 0 
        ? `Règle avec ${conditions.length} condition(s)` 
        : 'Règle de réécriture simple',
      params: params.length > 0 ? params : undefined
    };
  }

  private parseErrorDocument(rule: string): HtaccessRule | null {
    // ErrorDocument error-code document
    const match = rule.match(/^ErrorDocument\s+(\d+)\s+(.+)$/);
    
    if (!match) return null;
    
    const [, code, document] = match;
    const status = parseInt(code, 10);
    
    return {
      type: 'error',
      original: rule,
      target: document,
      status,
      priority: 0,
      description: `Document d'erreur pour le code ${code}`
    };
  }

  private countTotalRules(parsedRules: ParsedHtaccessData): number {
    return parsedRules.rewrites.length +
      parsedRules.redirects.length +
      parsedRules.conditions.length +
      parsedRules.errors.length +
      parsedRules.gone.length +
      parsedRules.environment.length +
      parsedRules.other.length;
  }

  private generateOutputFiles(parsedRules: ParsedHtaccessData, includeCommonPhp: boolean): HtaccessOutput {
    const output: HtaccessOutput = {
      mapping: {},
      redirects: {},
      gone: [],
      seoRoutes: [],
      criticalPaths: []
    };
    
    // Traiter les redirections
    parsedRules.redirects.forEach(rule => {
      if (rule.pattern && rule.target) {
        const from = this.normalizePattern(rule.pattern);
        const to = this.normalizeTarget(rule.target);
        
        output.redirects[from] = {
          to,
          status: rule.status || 302
        };
        
        // Si la redirection semble être permanente (301), c'est une route SEO importante
        if (rule.status === 301) {
          output.seoRoutes.push(from);
        }
      }
    });
    
    // Traiter les routes "Gone" (410)
    parsedRules.gone.forEach(rule => {
      if (rule.pattern) {
        const path = this.normalizePattern(rule.pattern);
        output.gone.push(path);
      }
    });
    
    // Traiter les règles de réécriture
    parsedRules.rewrites.forEach(rule => {
      if (rule.pattern && rule.target) {
        const from = this.normalizePattern(rule.pattern);
        const to = this.normalizeTarget(rule.target);
        
        output.mapping[from] = to;
        
        // Vérifier si c'est une route critique pour le SEO (ex: .php ou paramètres d'ID)
        if (from.includes('.php') || 
            (rule.params && (rule.params.includes('id') || rule.params.includes('slug')))) {
          output.criticalPaths.push(from);
          output.seoRoutes.push(from);
        }
      }
    });
    
    // Traiter les documents d'erreur
    parsedRules.errors.forEach(rule => {
      if (rule.target && rule.target.endsWith('.php')) {
        const from = rule.target;
        const to = from.replace('.php', '');
        
        output.mapping[from] = to;
      } else if (rule.status === 410 && rule.target) {
        output.gone.push(rule.target);
      }
    });
    
    // Ajouter les URL PHP courantes si demandé
    if (includeCommonPhp) {
      this.addCommonPhpRoutes(output);
    }
    
    return output;
  }

  private normalizePattern(pattern: string): string {
    // Convertir le pattern regex en chemin d'URL
    // Exemple: ^fiche\.php$ -> /fiche.php
    let normalized = pattern;
    
    // Supprimer les marqueurs de début et de fin
    normalized = normalized.replace(/^\^|\$$/g, '');
    
    // Remplacer les groupes de capture par des paramètres URL
    normalized = normalized.replace(/\(([^)]+)\)/g, ':param');
    
    // Échapper les caractères spéciaux courants dans les regex
    normalized = normalized.replace(/\\\./g, '.');
    
    // Ajouter un slash au début si nécessaire
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    
    return normalized;
  }

  private normalizeTarget(target: string): string {
    // S'assurer que le chemin cible commence par un slash
    return target.startsWith('/') ? target : '/' + target;
  }

  private addCommonPhpRoutes(output: HtaccessOutput): void {
    // Liste des fichiers PHP courants à inclure
    const commonPhpFiles = [
      { path: '/index.php', to: '/' },
      { path: '/fiche.php', to: '/fiche', isSeo: true },
      { path: '/panier.php', to: '/panier' },
      { path: '/produit.php', to: '/produit', isSeo: true },
      { path: '/categorie.php', to: '/categorie', isSeo: true },
      { path: '/contact.php', to: '/contact' },
      { path: '/login.php', to: '/login' },
      { path: '/register.php', to: '/register' },
      { path: '/account.php', to: '/compte' },
      { path: '/search.php', to: '/recherche' }
    ];
    
    commonPhpFiles.forEach(file => {
      // Ajouter au mapping seulement si n'existe pas déjà
      if (!output.mapping[file.path] && !output.redirects[file.path]) {
        output.mapping[file.path] = file.to;
        
        // Ajouter aux routes SEO si marqué comme tel
        if (file.isSeo) {
          output.seoRoutes.push(file.path);
        }
      }
    });
  }

  private generateSeoAudit(parsedRules: ParsedHtaccessData, output: HtaccessOutput, filePath: string): void {
    // Générer un rapport d'audit pour les routes SEO
    let audit = `# Audit SEO des routes héritées (.htaccess)\n\n`;
    audit += `_Généré le ${new Date().toLocaleString()}_\n\n`;
    
    // Résumé
    audit += `## Résumé\n\n`;
    audit += `- **Rules totales analysées**: ${this.countTotalRules(parsedRules)}\n`;
    audit += `- **Redirections permanentes (301)**: ${Object.values(output.redirects).filter(r => r.status === 301).length}\n`;
    audit += `- **Pages supprimées (410)**: ${output.gone.length}\n`;
    audit += `- **Routes SEO critiques**: ${output.seoRoutes.length}\n\n`;
    
    // Routes SEO critiques
    audit += `## Routes SEO critiques\n\n`;
    audit += `Ces routes sont importantes pour le référencement et doivent être conservées (redirection ou équivalent).\n\n`;
    audit += `| Route originale | Traitement | Status |\n`;
    audit += `|----------------|------------|--------|\n`;
    
    output.seoRoutes.forEach(route => {
      let treatment = 'Non géré';
      let status = '⚠️';
      
      if (output.redirects[route]) {
        treatment = `Redirection vers ${output.redirects[route].to}`;
        status = output.redirects[route].status === 301 ? '✅' : '⚠️';
      } else if (output.mapping[route]) {
        treatment = `Mappage vers ${output.mapping[route]}`;
        status = '✅';
      } else if (output.gone.includes(route)) {
        treatment = 'Supprimé (410 Gone)';
        status = '✅';
      }
      
      audit += `| \`${route}\` | ${treatment} | ${status} |\n`;
    });
    
    // Redirections permanentes
    audit += `\n## Redirections permanentes (301)\n\n`;
    audit += `Ces redirections doivent être maintenues pour préserver le référencement.\n\n`;
    
    Object.entries(output.redirects)
      .filter(([, value]) => value.status === 301)
      .forEach(([from, to]) => {
        audit += `- \`${from}\` → \`${to.to}\`\n`;
      });
    
    // Pages supprimées
    audit += `\n## Pages supprimées (410 Gone)\n\n`;
    audit += `Ces pages sont explicitement marquées comme supprimées et doivent retourner un code HTTP 410.\n\n`;
    
    output.gone.forEach(path => {
      audit += `- \`${path}\`\n`;
    });
    
    // Recommandations
    audit += `\n## Recommandations\n\n`;
    audit += `1. **Vérifier les redirections critiques** - Assurez-vous que toutes les routes SEO ont un traitement approprié\n`;
    audit += `2. **Utiliser le code 301** - Les redirections permanentes doivent utiliser le code 301 (pas 302)\n`;
    audit += `3. **Préférer 410 à 404** - Pour les pages supprimées, utilisez 410 (Gone) plutôt que 404 (Not Found)\n`;
    audit += `4. **Tester les redirections** - Validez toutes les redirections importantes avec un outil comme Screaming Frog\n`;
    
    // Écrire le fichier
    fs.writeFileSync(filePath, audit, 'utf8');
  }

  private writeOutputFiles(output: HtaccessOutput, outputDir: string): void {
    // Écrire le fichier redirects.json
    fs.writeFileSync(
      path.join(outputDir, 'redirects.json'),
      JSON.stringify(output.redirects, null, 2),
      'utf8'
    );
    
    // Écrire le fichier deleted_routes.json
    fs.writeFileSync(
      path.join(outputDir, 'deleted_routes.json'),
      JSON.stringify(output.gone, null, 2),
      'utf8'
    );
    
    // Écrire le fichier legacy_route_map.json
    fs.writeFileSync(
      path.join(outputDir, 'legacy_route_map.json'),
      JSON.stringify(output.mapping, null, 2),
      'utf8'
    );
    
    // Écrire le fichier seo_routes.json
    fs.writeFileSync(
      path.join(outputDir, 'seo_routes.json'),
      JSON.stringify(output.seoRoutes, null, 2),
      'utf8'
    );
  }

  private generateRoutingPatch(output: HtaccessOutput, filePath: string): void {
    // Convertir notre structure en format routing_patch.json
    const routingPatch = [];
    
    // Ajouter les mappings
    Object.entries(output.mapping).forEach(([from, to]) => {
      routingPatch.push({
        from,
        to,
        type: 'rewrite',
        status: 200,
        description: 'Généré depuis .htaccess'
      });
    });
    
    // Ajouter les redirections
    Object.entries(output.redirects).forEach(([from, value]) => {
      routingPatch.push({
        from,
        to: value.to,
        type: 'redirect',
        status: value.status,
        description: `Redirection ${value.status}`
      });
    });
    
    // Ajouter les pages supprimées
    output.gone.forEach(path => {
      routingPatch.push({
        from: path,
        to: '/gone',
        type: 'removed',
        status: 410,
        description: 'Page supprimée (410 Gone)'
      });
    });
    
    // Écrire le fichier
    fs.writeFileSync(filePath, JSON.stringify(routingPatch, null, 2), 'utf8');
  }
}

export default new HtaccessParser();