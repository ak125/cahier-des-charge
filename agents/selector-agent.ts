#!/usr/bin/env node

/**
 * Selector Agent - Niveau 1 du pipeline de migration IA
 * 
 * Découverte et priorisation automatique des fichiers PHP legacy
 * Génère le fichier discovery_map.json qui sera utilisé par tous les autres agents
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { program } from 'commander';
import { analyzePhpFile, FileAnalysisResult, calculatePriorityScore } from './php-discovery-engine';

// Types pour le mapping de découverte
interface DiscoveryItem {
  file: string;
  priority_score: number;
  role: string;
  status: 'pending' | 'audited' | 'migrated';
  last_modified: string;
  sql_tables: string[];
  used_in_routes: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  dependency_level: number;
  tags: string[];
  coupling_score: number;
  business_impact: number;
  complexity_score: number;
  seo_impact: number;
  dependency_graph: {
    imports: string[];
    imported_by: string[];
  };
}

// Configuration du CLI
program
  .name('selector-agent')
  .description('Discover and prioritize PHP files for migration')
  .version('1.0.0')
  .option('-s, --source <path>', 'Source directory containing PHP files', './src')
  .option('-o, --output <path>', 'Output directory for discovery files', './output')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--htaccess <path>', 'Path to .htaccess file for route analysis', './.htaccess')
  .option('--log-files <path>', 'Path to web server logs for traffic analysis', './logs')
  .option('--max-files <number>', 'Maximum number of files to analyze (0 for all)', '0')
  .option('--tags', 'Enable auto-tagging of files', true);

program.parse();
const options = program.opts();

// Point d'entrée principal
async function main() {
  console.log('🔍 Starting PHP legacy discovery and prioritization...');
  
  // Normaliser les chemins
  const sourcePath = path.resolve(options.source);
  const outputPath = path.resolve(options.output);
  
  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  // Trouver tous les fichiers PHP
  const phpFiles = await findPhpFiles(sourcePath, options.maxFiles);
  console.log(`📂 Found ${phpFiles.length} PHP files to analyze`);
  
  // Analyser les fichiers .htaccess pour les routes
  const routeMap = options.htaccess ? await analyzeHtaccess(options.htaccess) : {};
  
  // Analyser les logs pour le trafic et l'impact SEO
  const trafficStats = options.logFiles ? await analyzeLogFiles(options.logFiles) : {};
  
  // Analyser chaque fichier PHP
  const discoveryItems: DiscoveryItem[] = [];
  const fileContentsMap: Record<string, string> = {};
  const dependencyGraph: Record<string, string[]> = {};
  
  console.log('🔬 Analyzing PHP files...');
  
  for (const [index, file] of phpFiles.entries()) {
    if (options.verbose) {
      console.log(`Analyzing [${index + 1}/${phpFiles.length}]: ${file}`);
    } else if (index % 10 === 0) {
      process.stdout.write(`.`);
    }
    
    const relativePath = path.relative(sourcePath, file);
    const fileContent = fs.readFileSync(file, 'utf8');
    fileContentsMap[relativePath] = fileContent;
    
    // Analyser le fichier PHP
    const analysisResult = analyzePhpFile(fileContent, relativePath);
    
    // Stocker les dépendances pour l'analyse ultérieure
    dependencyGraph[relativePath] = analysisResult.dependencies;
    
    // Enrichir avec les données de trafic et routes
    const trafficData = trafficStats[relativePath] || { hits: 0, uniqueUsers: 0, searchBots: 0 };
    const routeData = findRouteForFile(relativePath, routeMap);
    
    // Calculer le score de priorité
    const priorityScore = calculatePriorityScore(analysisResult, trafficData, routeData);
    
    // Créer l'élément de découverte
    const discoveryItem: DiscoveryItem = {
      file: relativePath,
      priority_score: priorityScore,
      role: analysisResult.role,
      status: 'pending',
      last_modified: new Date(fs.statSync(file).mtime).toISOString(),
      sql_tables: analysisResult.sqlTables,
      used_in_routes: routeData.routes || [],
      estimated_effort: getEstimatedEffort(analysisResult),
      dependency_level: 0, // Sera calculé ultérieurement
      tags: generateTags(analysisResult, trafficData, routeData, options.tags),
      coupling_score: analysisResult.couplingScore,
      business_impact: analysisResult.businessImpact,
      complexity_score: analysisResult.complexityScore,
      seo_impact: analysisResult.seoImpact,
      dependency_graph: {
        imports: analysisResult.dependencies,
        imported_by: [] // Sera rempli ultérieurement
      }
    };
    
    discoveryItems.push(discoveryItem);
  }
  
  console.log('\n📊 Calculating dependency levels...');
  
  // Calculer les fichiers qui importent chaque fichier (imported_by)
  for (const item of discoveryItems) {
    for (const dependency of item.dependency_graph.imports) {
      const dependencyItem = discoveryItems.find(di => di.file === dependency);
      if (dependencyItem) {
        dependencyItem.dependency_graph.imported_by.push(item.file);
      }
    }
  }
  
  // Calculer les niveaux de dépendance
  calculateDependencyLevels(discoveryItems);
  
  // Trier par score de priorité
  discoveryItems.sort((a, b) => b.priority_score - a.priority_score);
  
  // Générer discovery_map.json
  const discoveryMapPath = path.join(outputPath, 'discovery_map.json');
  fs.writeFileSync(
    discoveryMapPath,
    JSON.stringify(discoveryItems, null, 2)
  );
  console.log(`✅ Generated discovery_map.json with ${discoveryItems.length} files`);
  
  // Générer summary_discovery.md
  const summaryPath = path.join(outputPath, 'summary_discovery.md');
  const summaryContent = generateSummaryMarkdown(discoveryItems);
  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`✅ Generated summary_discovery.md`);
  
  // Générer legacy_dependency.graph.json
  const dependencyGraphPath = path.join(outputPath, 'legacy_dependency.graph.json');
  const graphData = generateDependencyGraph(discoveryItems);
  fs.writeFileSync(dependencyGraphPath, JSON.stringify(graphData, null, 2));
  console.log(`✅ Generated legacy_dependency.graph.json`);
  
  console.log(`🚀 Discovery and prioritization completed successfully!`);
}

/**
 * Trouve tous les fichiers PHP dans le répertoire source
 */
async function findPhpFiles(sourcePath: string, maxFiles: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(`${sourcePath}/**/*.php`, {}, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Limiter le nombre de fichiers si spécifié
      if (maxFiles > 0 && files.length > maxFiles) {
        files = files.slice(0, maxFiles);
      }
      
      resolve(files);
    });
  });
}

/**
 * Analyse le fichier .htaccess pour les routes
 */
async function analyzeHtaccess(htaccessPath: string): Promise<Record<string, any>> {
  if (!fs.existsSync(htaccessPath)) {
    console.warn(`⚠️ .htaccess file not found at ${htaccessPath}`);
    return {};
  }
  
  const content = fs.readFileSync(htaccessPath, 'utf8');
  const routeMap: Record<string, any> = {};
  
  // Analyse des règles RewriteRule
  const rewriteRegex = /RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[(.*)\])?/g;
  let match;
  
  while ((match = rewriteRegex.exec(content)) !== null) {
    const pattern = match[1];
    const target = match[2];
    
    // Extraire le fichier PHP cible
    if (target.endsWith('.php') || target.includes('.php?')) {
      const phpFile = target.split('?')[0];
      
      if (!routeMap[phpFile]) {
        routeMap[phpFile] = { routes: [] };
      }
      
      routeMap[phpFile].routes.push(pattern);
    }
  }
  
  return routeMap;
}

/**
 * Analyse les fichiers de log pour les statistiques de trafic
 */
async function analyzeLogFiles(logPath: string): Promise<Record<string, any>> {
  if (!fs.existsSync(logPath)) {
    console.warn(`⚠️ Log directory not found at ${logPath}`);
    return {};
  }
  
  // Exemple simplifié - dans un cas réel, analyserait les logs Apache/Nginx
  const trafficStats: Record<string, any> = {};
  
  // Simuler quelques statistiques pour la démonstration
  trafficStats['src/core/panier/shopping_cart_v8.php'] = {
    hits: 15000,
    uniqueUsers: 8500,
    searchBots: 120
  };
  
  trafficStats['src/product/view.php'] = {
    hits: 45000,
    uniqueUsers: 28000,
    searchBots: 450
  };
  
  return trafficStats;
}

/**
 * Trouve les routes associées à un fichier PHP
 */
function findRouteForFile(filePath: string, routeMap: Record<string, any>): any {
  // Normaliser le chemin du fichier pour la correspondance
  const phpName = path.basename(filePath);
  
  for (const [phpFile, data] of Object.entries(routeMap)) {
    if (phpFile.endsWith(phpName)) {
      return data;
    }
  }
  
  return { routes: [] };
}

/**
 * Estime l'effort de migration nécessaire
 */
function getEstimatedEffort(analysis: FileAnalysisResult): 'low' | 'medium' | 'high' {
  const score = analysis.complexityScore * 0.4 + 
                analysis.couplingScore * 0.3 + 
                analysis.businessImpact * 0.3;
  
  if (score < 0.3) return 'low';
  if (score < 0.7) return 'medium';
  return 'high';
}

/**
 * Génère des tags automatiques pour le fichier
 */
function generateTags(
  analysis: FileAnalysisResult, 
  trafficData: any, 
  routeData: any, 
  enableTagging: boolean
): string[] {
  if (!enableTagging) return [];
  
  const tags: string[] = [];
  
  // Tags basés sur le rôle
  if (analysis.role) tags.push(analysis.role);
  
  // Tags basés sur les tables SQL
  if (analysis.sqlTables.length > 0) {
    tags.push('sql-dependent');
    if (analysis.sqlTables.length > 4) tags.push('sql-heavy');
  }
  
  // Tags basés sur la complexité
  if (analysis.complexityScore > 0.7) tags.push('complex');
  
  // Tags basés sur le trafic
  if (trafficData.hits > 10000) tags.push('high-traffic');
  
  // Tags basés sur l'impact SEO
  if (analysis.seoImpact > 0.7) tags.push('seo-critical');
  
  // Tags basés sur le domaine métier
  if (analysis.sqlTables.some(t => t.includes('CART') || t.includes('PANIER'))) {
    tags.push('ecommerce', 'panier');
  }
  if (analysis.sqlTables.some(t => t.includes('PRODUCT') || t.includes('PRODUIT'))) {
    tags.push('ecommerce', 'produit');
  }
  if (analysis.sqlTables.some(t => t.includes('USER') || t.includes('UTILISATEUR'))) {
    tags.push('utilisateur');
  }
  
  // Priorité
  if (analysis.businessImpact > 0.8) tags.push('prioritaire');
  
  return [...new Set(tags)]; // Éliminer les doublons
}

/**
 * Calcule les niveaux de dépendance pour chaque fichier
 */
function calculateDependencyLevels(items: DiscoveryItem[]): void {
  // Algorithme simplifié - devrait utiliser un algorithme plus robuste
  // pour les graphes de dépendances cycliques dans un cas réel
  
  // Initialiser tous les niveaux à 0
  items.forEach(item => item.dependency_level = 0);
  
  let changed = true;
  let iterations = 0;
  const maxIterations = items.length * 2; // Éviter les boucles infinies
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    for (const item of items) {
      const dependenciesLevels = item.dependency_graph.imports
        .map(dep => {
          const depItem = items.find(di => di.file === dep);
          return depItem ? depItem.dependency_level : 0;
        })
        .filter(level => level !== undefined);
      
      if (dependenciesLevels.length > 0) {
        const maxLevel = Math.max(...dependenciesLevels);
        const newLevel = maxLevel + 1;
        
        if (newLevel !== item.dependency_level) {
          item.dependency_level = newLevel;
          changed = true;
        }
      }
    }
  }
}

/**
 * Génère un résumé au format Markdown
 */
function generateSummaryMarkdown(items: DiscoveryItem[]): string {
  let markdown = '# PHP Legacy Discovery Summary\n\n';
  
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  markdown += `Total PHP files analyzed: ${items.length}\n\n`;
  
  // Statistiques générales
  const highPriority = items.filter(i => i.priority_score >= 7).length;
  const mediumPriority = items.filter(i => i.priority_score >= 4 && i.priority_score < 7).length;
  const lowPriority = items.filter(i => i.priority_score < 4).length;
  
  markdown += '## Priority Distribution\n\n';
  markdown += `- High Priority (7-10): ${highPriority} files\n`;
  markdown += `- Medium Priority (4-7): ${mediumPriority} files\n`;
  markdown += `- Low Priority (0-4): ${lowPriority} files\n\n`;
  
  // Liste des fichiers haute priorité
  markdown += '## Top 10 High Priority Files\n\n';
  markdown += '| File | Priority | Effort | Role | Tags |\n';
  markdown += '|------|----------|--------|------|------|\n';
  
  items.slice(0, 10).forEach(item => {
    markdown += `| ${item.file} | ${item.priority_score.toFixed(1)} | ${item.estimated_effort} | ${item.role} | ${item.tags.join(', ')} |\n`;
  });
  
  markdown += '\n## Tags Distribution\n\n';
  
  // Compter les tags
  const tagCounts: Record<string, number> = {};
  items.forEach(item => {
    item.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  // Trier par fréquence
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  
  markdown += '| Tag | Count |\n';
  markdown += '|-----|-------|\n';
  
  sortedTags.forEach(([tag, count]) => {
    markdown += `| ${tag} | ${count} |\n`;
  });
  
  return markdown;
}

/**
 * Génère les données du graphe de dépendances
 */
function generateDependencyGraph(items: DiscoveryItem[]): any {
  const nodes = items.map(item => ({
    id: item.file,
    priority: item.priority_score,
    role: item.role,
    tags: item.tags,
    level: item.dependency_level
  }));
  
  const links: any[] = [];
  
  items.forEach(source => {
    source.dependency_graph.imports.forEach(target => {
      links.push({
        source: source.file,
        target,
        value: 1
      });
    });
  });
  
  return {
    nodes,
    links
  };
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
