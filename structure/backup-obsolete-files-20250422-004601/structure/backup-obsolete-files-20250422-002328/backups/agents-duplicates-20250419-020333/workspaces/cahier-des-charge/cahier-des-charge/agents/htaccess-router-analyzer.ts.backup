#!/usr/bin/env node

/**
 * htaccess-router-analyzer.ts
 * 
 * Analyse les fichiers .htaccess pour extraire et classifier les règles,
 * puis générer les mappings pour la migration vers Remix et NestJS.
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';

// Types pour l'analyse des règles .htaccess
interface BaseRule {
  type: string;
  raw: string;
  line: number;
  category?: string;
  seoImpact?: 'high' | 'medium' | 'low' | 'none';
}

interface RewriteRule extends BaseRule {
  type: 'RewriteRule';
  pattern: string;
  target: string;
  flags: string[];
  conditions?: RewriteCondition[];
}

interface RewriteCondition extends BaseRule {
  type: 'RewriteCond';
  test: string;
  pattern: string;
  flags: string[];
}

interface RedirectRule extends BaseRule {
  type: 'Redirect';
  status: number;
  from: string;
  to: string;
}

interface ErrorDocumentRule extends BaseRule {
  type: 'ErrorDocument';
  code: number;
  document: string;
}

interface AuthRule extends BaseRule {
  type: 'Auth';
  directive: string;
  value: string;
}

type HtaccessRule = RewriteRule | RedirectRule | ErrorDocumentRule | AuthRule;

interface HtaccessMap {
  source: string;
  rules: HtaccessRule[];
}

interface RemixRoute {
  from: string;
  to: string;
  type: 'static' | 'dynamic';
  file: string;
  params?: string[];
  seoImpact?: 'high' | 'medium' | 'low';
}

interface NestJSRoute {
  path: string;
  controller: string;
  method?: string;
  middleware?: string[];
}

interface RoutingMap {
  remix: RemixRoute[];
  nestjs: NestJSRoute[];
}

interface SEORoute {
  legacy: string;
  target: string;
  action: string;
  seoImpact: 'high' | 'medium' | 'low';
  traffic?: number;
  backlinks?: number;
}

// Configuration du programme
program
  .name('htaccess-router-analyzer')
  .description('Analyze .htaccess files and generate routing maps for Remix and NestJS')
  .version('1.0.0')
  .requiredOption('-i, --input <path>', '.htaccess file path (or directory with multiple .htaccess files)')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-c, --categories <path>', 'Categories mapping JSON file', './htaccess_categories.json')
  .option('-s, --seo <path>', 'SEO impact data JSON file', './seo_impact.json')
  .option('-v, --verbose', 'Verbose output', false);

program.parse();
const options = program.opts();

// Point d'entrée principal
async function main() {
  try {
    console.log('🔍 Analyzing .htaccess rules...');
    
    // 1. Déterminer les fichiers à analyser
    const inputPath = path.resolve(options.input);
    const isDirectory = fs.statSync(inputPath).isDirectory();
    
    const htaccessFiles = isDirectory 
      ? findHtaccessFiles(inputPath)
      : [inputPath];
    
    if (htaccessFiles.length === 0) {
      throw new Error('No .htaccess files found');
    }
    
    console.log(`Found ${htaccessFiles.length} .htaccess files to analyze`);
    
    // 2. Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.resolve(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 3. Charger les mappings de catégories si disponible
    let categoriesMapping = {};
    const categoriesPath = path.resolve(options.categories);
    if (fs.existsSync(categoriesPath)) {
      categoriesMapping = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      console.log(`✅ Loaded categories mapping from ${categoriesPath}`);
    }
    
    // 4. Charger les données d'impact SEO si disponible
    let seoImpact = {};
    const seoPath = path.resolve(options.seo);
    if (fs.existsSync(seoPath)) {
      seoImpact = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
      console.log(`✅ Loaded SEO impact data from ${seoPath}`);
    }
    
    // 5. Analyser chaque fichier .htaccess
    const htaccessMaps: HtaccessMap[] = [];
    
    for (const htaccessFile of htaccessFiles) {
      console.log(`🔍 Analyzing ${htaccessFile}...`);
      
      const content = fs.readFileSync(htaccessFile, 'utf8');
      const rules = parseHtaccessFile(content, htaccessFile, categoriesMapping, seoImpact);
      
      htaccessMaps.push({
        source: htaccessFile,
        rules
      });
    }
    
    // 6. Générer le htaccess_map.json
    const flattenedRules = htaccessMaps.flatMap(map => map.rules);
    const htaccessMapOutput = {
      sources: htaccessFiles,
      rules: flattenedRules
    };
    
    const htaccessMapPath = path.join(outputDir, 'htaccess_map.json');
    fs.writeFileSync(htaccessMapPath, JSON.stringify(htaccessMapOutput, null, 2));
    console.log(`✅ Generated htaccess_map.json with ${flattenedRules.length} rules`);
    
    // 7. Générer le routing_map.json
    console.log('🔍 Generating routing map...');
    const routingMap = generateRoutingMap(flattenedRules);
    
    const routingMapPath = path.join(outputDir, 'routing_map.json');
    fs.writeFileSync(routingMapPath, JSON.stringify(routingMap, null, 2));
    console.log(`✅ Generated routing_map.json with ${routingMap.remix.length} Remix routes and ${routingMap.nestjs.length} NestJS routes`);
    
    // 8. Générer le seo_routes.md
    console.log('🔍 Generating SEO routes document...');
    const seoRoutes = generateSEORoutes(flattenedRules, routingMap);
    
    const seoRoutesPath = path.join(outputDir, 'seo_routes.md');
    fs.writeFileSync(seoRoutesPath, seoRoutes);
    console.log(`✅ Generated seo_routes.md`);
    
    console.log('✅ Analysis completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Trouve tous les fichiers .htaccess dans un répertoire (récursivement)
 */
function findHtaccessFiles(directory: string): string[] {
  const files: string[] = [];
  
  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name === '.htaccess') {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(directory);
  return files;
}

/**
 * Parse un fichier .htaccess pour extraire les règles
 */
function parseHtaccessFile(
  content: string,
  filePath: string,
  categoriesMapping: any,
  seoImpact: any
): HtaccessRule[] {
  const rules: HtaccessRule[] = [];
  const lines = content.split('\n');
  
  // Stocker temporairement les conditions RewriteCond
  let currentConditions: RewriteCondition[] = [];
  
  // Extraire le module à partir du chemin du fichier
  const moduleName = extractModuleFromPath(filePath);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ignorer les lignes vides et les commentaires
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    // Analyser les différents types de règles
    if (line.startsWith('RewriteRule')) {
      // Format: RewriteRule pattern target [flags]
      const match = line.match(/RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[(.*)\])?/);
      
      if (match) {
        const pattern = match[1];
        const target = match[2];
        const flags = match[3] ? match[3].split(',').map(f => f.trim()) : [];
        
        const rule: RewriteRule = {
          type: 'RewriteRule',
          raw: line,
          line: i + 1,
          pattern,
          target,
          flags,
          conditions: [...currentConditions], // Copier les conditions accumulées
          category: categorizeRule(pattern, target, moduleName, categoriesMapping),
          seoImpact: determineSEOImpact(pattern, target, seoImpact)
        };
        
        rules.push(rule);
        
        // Réinitialiser les conditions pour la prochaine règle
        currentConditions = [];
      }
    } else if (line.startsWith('RewriteCond')) {
      // Format: RewriteCond TestString CondPattern [flags]
      const match = line.match(/RewriteCond\s+(\S+)\s+(\S+)(?:\s+\[(.*)\])?/);
      
      if (match) {
        const test = match[1];
        const pattern = match[2];
        const flags = match[3] ? match[3].split(',').map(f => f.trim()) : [];
        
        const condition: RewriteCondition = {
          type: 'RewriteCond',
          raw: line,
          line: i + 1,
          test,
          pattern,
          flags
        };
        
        currentConditions.push(condition);
      }
    } else if (line.startsWith('Redirect')) {
      // Format: Redirect [status] URL-path URL
      const match = line.match(/Redirect(?:\s+(\d+))?\s+(\S+)\s+(\S+)/);
      
      if (match) {
        const status = match[1] ? parseInt(match[1], 10) : 302; // Default to 302 if not specified
        const from = match[2];
        const to = match[3];
        
        const rule: RedirectRule = {
          type: 'Redirect',
          raw: line,
          line: i + 1,
          status,
          from,
          to,
          category: categorizeRule(from, to, moduleName, categoriesMapping),
          seoImpact: determineSEOImpact(from, to, seoImpact)
        };
        
        rules.push(rule);
      }
    } else if (line.startsWith('ErrorDocument')) {
      // Format: ErrorDocument error-code document
      const match = line.match(/ErrorDocument\s+(\d+)\s+(\S+)/);
      
      if (match) {
        const code = parseInt(match[1], 10);
        const document = match[2];
        
        const rule: ErrorDocumentRule = {
          type: 'ErrorDocument',
          raw: line,
          line: i + 1,
          code,
          document,
          category: 'error_handling'
        };
        
        rules.push(rule);
      }
    } else if (
      line.startsWith('AuthType') || 
      line.startsWith('AuthName') || 
      line.startsWith('AuthUserFile') || 
      line.startsWith('Require')
    ) {
      // Directives d'authentification
      const match = line.match(/^(\S+)\s+(.+)$/);
      
      if (match) {
        const directive = match[1];
        const value = match[2];
        
        const rule: AuthRule = {
          type: 'Auth',
          raw: line,
          line: i + 1,
          directive,
          value,
          category: 'authentication'
        };
        
        rules.push(rule);
      }
    }
    // Ajouter d'autres types de règles selon les besoins
  }
  
  return rules;
}

/**
 * Extrait le nom de module à partir du chemin du fichier
 */
function extractModuleFromPath(filePath: string): string {
  // Exemple: extraire 'blog' de '/path/to/blog/.htaccess'
  const parts = filePath.split(path.sep);
  
  // Trouver le nom du répertoire parent
  const parentDir = parts[parts.length - 2];
  
  // Si le parent est 'src', 'app', etc., remonter au répertoire grand-parent
  if (['src', 'app', 'www', 'public'].includes(parentDir.toLowerCase())) {
    return parts[parts.length - 3] || 'core';
  }
  
  return parentDir || 'core';
}

/**
 * Catégorise une règle en fonction de son pattern, target et module
 */
function categorizeRule(pattern: string, target: string, module: string, categoriesMapping: any): string {
  // Si un mapping personnalisé est disponible, l'utiliser
  if (categoriesMapping && categoriesMapping.patterns) {
    for (const [category, patterns] of Object.entries(categoriesMapping.patterns)) {
      for (const patternRegex of patterns as string[]) {
        const regex = new RegExp(patternRegex);
        if (regex.test(pattern) || regex.test(target)) {
          return category;
        }
      }
    }
  }
  
  // Catégorisation automatique basée sur les motifs courants
  if (pattern.includes('blog') || target.includes('blog')) {
    return 'blog';
  } else if (pattern.includes('produit') || target.includes('produit') || 
             pattern.includes('product') || target.includes('product')) {
    return 'product';
  } else if (pattern.includes('commande') || target.includes('commande') ||
             pattern.includes('order') || target.includes('order')) {
    return 'order';
  } else if (pattern.includes('panier') || target.includes('panier') ||
             pattern.includes('cart') || target.includes('cart')) {
    return 'cart';
  } else if (pattern.includes('user') || target.includes('user') ||
             pattern.includes('compte') || target.includes('compte')) {
    return 'user';
  } else if (pattern.includes('seo') || target.includes('seo')) {
    return 'seo';
  }
  
  // Utiliser le module comme catégorie par défaut
  return module;
}

/**
 * Détermine l'impact SEO d'une règle
 */
function determineSEOImpact(pattern: string, target: string, seoImpact: any): 'high' | 'medium' | 'low' | 'none' {
  // Si des données d'impact SEO personnalisées sont disponibles, les utiliser
  if (seoImpact && seoImpact.routes) {
    for (const route of seoImpact.routes) {
      if (route.pattern === pattern || route.url === pattern) {
        return route.impact;
      }
    }
  }
  
  // Impact SEO par défaut basé sur des heuristiques
  if (pattern.includes('sitemap') || target.includes('sitemap')) {
    return 'high';
  } else if (pattern.endsWith('.html') || pattern.endsWith('/')) {
    return 'medium';
  } else if (pattern.includes('.php')) {
    return 'medium';
  } else if (pattern.includes('admin') || pattern.includes('panel')) {
    return 'none';
  }
  
  return 'low';
}

/**
 * Génère une carte de routage pour Remix et NestJS
 */
function generateRoutingMap(rules: HtaccessRule[]): RoutingMap {
  const routingMap: RoutingMap = {
    remix: [],
    nestjs: []
  };
  
  // Traiter chaque règle
  for (const rule of rules) {
    if (rule.type === 'RewriteRule') {
      // Générer une route Remix
      const remixRoute = generateRemixRoute(rule);
      if (remixRoute) {
        routingMap.remix.push(remixRoute);
      }
      
      // Générer une route NestJS si nécessaire (pour les API)
      const nestjsRoute = generateNestJSRouteFromRewrite(rule);
      if (nestjsRoute) {
        routingMap.nestjs.push(nestjsRoute);
      }
    } else if (rule.type === 'Redirect') {
      // Traiter les redirections
      const remixRoute = generateRemixRouteFromRedirect(rule);
      if (remixRoute) {
        routingMap.remix.push(remixRoute);
      }
    } else if (rule.type === 'ErrorDocument') {
      // Traiter les pages d'erreur
      processErrorDocument(rule, routingMap);
    } else if (rule.type === 'Auth') {
      // Traiter les règles d'authentification
      processAuthRule(rule, routingMap);
    }
  }
  
  return routingMap;
}

/**
 * Génère une route Remix à partir d'une règle RewriteRule
 */
function generateRemixRoute(rule: RewriteRule): RemixRoute | null {
  // Ignorer les règles qui pointent vers des fichiers PHP ou des scripts internes
  if (rule.target.includes('.php') && !rule.flags.includes('R=301') && !rule.flags.includes('R=302')) {
    return null;
  }
  
  // Détecter si c'est une route dynamique (contient des groupes de capture)
  const isDynamic = rule.pattern.includes('(') && rule.pattern.includes(')');
  
  // Extraire les paramètres pour les routes dynamiques
  const params: string[] = [];
  if (isDynamic) {
    // Trouver tous les groupes de capture
    const paramMatches = rule.pattern.match(/\(([^)]+)\)/g);
    if (paramMatches) {
      for (let i = 0; i < paramMatches.length; i++) {
        // Déduire un nom de paramètre
        let paramName = `param${i + 1}`;
        
        // Essayer de déduire un meilleur nom basé sur le groupe de capture
        const paramValue = paramMatches[i].replace(/[()]/g, '');
        if (paramValue.includes('id') || rule.pattern.includes('id')) {
          paramName = 'id';
        } else if (paramValue.includes('slug') || rule.pattern.includes('slug')) {
          paramName = 'slug';
        } else if (rule.pattern.includes('category') || rule.pattern.includes('categorie')) {
          paramName = 'category';
        } else if (rule.pattern.includes('product') || rule.pattern.includes('produit')) {
          paramName = 'product';
        }
        
        params.push(paramName);
      }
    }
  }
  
  // Convertir le pattern en route Remix
  let remixPattern = rule.pattern
    .replace(/^\^/, '')        // Supprimer le ^ initial
    .replace(/\$$/, '')        // Supprimer le $ final
    .replace(/\\\./, '.')      // Remplacer \. par .
    .replace(/\(\[0-9\]\+\)/, ':id') // Remplacer ([0-9]+) par :id
    .replace(/\([^)]+\)/, ':param'); // Remplacer d'autres groupes par :param
  
  // Si le pattern ne commence pas par /, l'ajouter
  if (!remixPattern.startsWith('/')) {
    remixPattern = '/' + remixPattern;
  }
  
  // Générer le chemin du fichier Remix
  let remixFile = 'routes';
  
  if (isDynamic) {
    // Construire le nom de fichier pour une route dynamique
    const routeParts = remixPattern.split('/').filter(Boolean);
    
    for (let i = 0; i < routeParts.length; i++) {
      let part = routeParts[i];
      
      // Remplacer les paramètres dynamiques
      if (part.startsWith(':')) {
        const paramName = params[0] || 'param';
        part = `$${paramName}`;
        params.shift();
      }
      
      // Ajouter au chemin du fichier
      remixFile += `/${part}`;
    }
    
    remixFile += '.tsx';
  } else {
    // Route statique
    remixFile += remixPattern === '/' ? '/_index.tsx' : `${remixPattern.replace(/\//g, '_')}.tsx`;
  }
  
  return {
    from: rule.pattern,
    to: rule.target,
    type: isDynamic ? 'dynamic' : 'static',
    file: remixFile,
    params: isDynamic ? params : undefined,
    seoImpact: rule.seoImpact
  };
}

/**
 * Génère une route NestJS à partir d'une règle RewriteRule
 */
function generateNestJSRouteFromRewrite(rule: RewriteRule): NestJSRoute | null {
  // Ne générer des routes NestJS que pour les réécritures pointant vers des fichiers PHP
  if (!rule.target.includes('.php')) {
    return null;
  }
  
  // Extraire le nom de base du fichier PHP
  const phpFile = rule.target.split('/').pop() || '';
  const baseName = phpFile.replace('.php', '');
  
  // Convertir en format PascalCase pour le contrôleur
  const controllerName = baseName
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('') + 'Controller';
  
  // Déduire le chemin de l'API
  let apiPath = rule.target.replace('.php', '');
  
  // Si le chemin ne commence pas par /, l'ajouter
  if (!apiPath.startsWith('/')) {
    apiPath = '/' + apiPath;
  }
  
  // Ajouter /api au début s'il n'y est pas déjà
  if (!apiPath.startsWith('/api')) {
    apiPath = '/api' + apiPath;
  }
  
  return {
    path: apiPath,
    controller: controllerName,
    middleware: rule.conditions ? ['RewriteConditionMiddleware'] : undefined
  };
}

/**
 * Génère une route Remix à partir d'une règle Redirect
 */
function generateRemixRouteFromRedirect(rule: RedirectRule): RemixRoute | null {
  // Convertir en format de route Remix
  let remixPattern = rule.from;
  
  // Si le pattern ne commence pas par /, l'ajouter
  if (!remixPattern.startsWith('/')) {
    remixPattern = '/' + remixPattern;
  }
  
  return {
    from: rule.from,
    to: rule.to,
    type: 'static',
    file: `routes${remixPattern === '/' ? '/_index.tsx' : remixPattern.replace(/\//g, '_')}.tsx`,
    seoImpact: rule.seoImpact
  };
}

/**
 * Traite une règle ErrorDocument
 */
function processErrorDocument(rule: ErrorDocumentRule, routingMap: RoutingMap): void {
  // Convertir en route Remix pour les pages d'erreur
  if (rule.code >= 400) {
    let errorFile = '';
    
    switch (rule.code) {
      case 404:
        errorFile = 'routes/_404.tsx';
        break;
      case 500:
        errorFile = 'routes/_500.tsx';
        break;
      default:
        errorFile = `routes/_${rule.code}.tsx`;
    }
    
    routingMap.remix.push({
      from: `Error ${rule.code}`,
      to: rule.document,
      type: 'static',
      file: errorFile,
      seoImpact: 'low'
    });
  }
}

/**
 * Traite une règle d'authentification
 */
function processAuthRule(rule: AuthRule, routingMap: RoutingMap): void {
  // Créer un middleware NestJS pour l'authentification
  if (rule.directive === 'Require') {
    routingMap.nestjs.push({
      path: '/*', // À ajuster selon les besoins
      controller: 'AuthController',
      middleware: ['AuthGuard']
    });
  }
}

/**
 * Génère un document markdown des routes SEO
 */
function generateSEORoutes(rules: HtaccessRule[], routingMap: RoutingMap): string {
  let markdown = `# 📈 Routes SEO Critiques\n\n`;
  
  // Créer le tableau des routes
  markdown += `| URL legacy | Cible migrée | Action | Impact SEO |\n`;
  markdown += `|------------|--------------|--------|------------|\n`;
  
  // Collecter les routes SEO
  const seoRoutes: SEORoute[] = [];
  
  // Extraire les routes à partir des règles
  for (const rule of rules) {
    if (rule.seoImpact === 'high' || rule.seoImpact === 'medium') {
      let legacy = '';
      let target = '';
      let action = '';
      
      if (rule.type === 'RewriteRule') {
        legacy = rule.pattern.replace(/^\^/, '').replace(/\$$/, '');
        target = rule.target;
        action = rule.flags.includes('R=301') ? 'Redirection 301' : 'Rewrite';
      } else if (rule.type === 'Redirect') {
        legacy = rule.from;
        target = rule.to;
        action = `Redirection ${rule.status}`;
      }
      
      if (legacy && target) {
        seoRoutes.push({
          legacy,
          target,
          action,
          seoImpact: rule.seoImpact || 'low'
        });
      }
    }
  }
  
  // Trier par impact SEO (high en premier)
  seoRoutes.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.seoImpact] - impactOrder[b.seoImpact];
  });
  
  // Ajouter les routes au markdown
  for (const route of seoRoutes) {
    const impactEmoji = route.seoImpact === 'high' ? '🔴' : route.seoImpact === 'medium' ? '🟠' : '🟡';
    markdown += `| ${route.legacy} | ${route.target} | ${route.action} | ${impactEmoji} ${route.seoImpact} |\n`;
  }
  
  // Ajouter la section d'informations
  markdown += `\n## 🚨 Priorité : Ces routes génèrent du trafic important\n\n`;
  
  // Ajouter des suggestions pour les routes Remix à générer
  markdown += `## 🧩 Suggestions de routes Remix à générer\n\n`;
  
  for (const route of routingMap.remix.filter(r => r.seoImpact === 'high')) {
    markdown += `- \`${route.file}\` → pour correspondre à \`${route.from}\`\n`;
  }
  
  return markdown;
}

// Exécuter le programme
if (require.main === module) {
  main();
}
