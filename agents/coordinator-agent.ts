#!/usr/bin/env node

/**
 * Coordinator Agent - Chef d'Orchestre IA pour la migration
 * 
 * Ce script analyse toutes les sorties des autres agents pour construire un
 * plan de migration stratégique, détecter les dépendances critiques et 
 * générer des alertes sur les bloqueurs.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { program } from 'commander';
import * as YAML from 'yaml';
import * as chalk from 'chalk';

// Types principaux
interface MigrationWave {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  files: MigrationFile[];
  dependencies: string[];
  estimatedEffort: number; // jours/personnes
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  startDate?: string;
  endDate?: string;
  blockers?: MigrationBlocker[];
}

interface MigrationFile {
  path: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  complexity: number; // 0-1
  seoImpact: 'high' | 'medium' | 'low' | 'none';
  businessImpact: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  blockingFor: string[];
  module: string;
  estimatedEffort: number; // heures
}

interface MigrationBlocker {
  id: string;
  type: 'dependency' | 'schema' | 'circular' | 'expired' | 'technical';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  files: string[];
  suggestedResolution?: string;
}

interface Dependency {
  source: string;
  target: string;
  weight: number; // 1-10, importance de la dépendance
  type: 'include' | 'call' | 'sql' | 'route' | 'inheritance';
}

interface MigrationWavePlan {
  totalFiles: number;
  analyzedFiles: number;
  completedFiles: number;
  totalWaves: number;
  estimatedTotalEffort: number; // jours/personnes
  waves: MigrationWave[];
  generatedAt: string;
  version: string;
}

interface DependencyMatrix {
  nodes: Array<{
    id: string;
    module: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    complexity: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
    type: string;
  }>;
}

interface AuditMetadata {
  file: string;
  analyzedAt: string;
  businessRole?: string;
  complexityRating?: string;
  securityIssues?: number;
  technicalDebt?: string;
  priority?: string;
  tags?: string[];
}

interface BacklogTask {
  id: string;
  type: string;
  description: string;
  status: string;
  estimatedEffort: string;
  subtasks?: string[];
}

interface Backlog {
  file: string;
  analyzedAt: string;
  status: string;
  priority: string;
  tasks: BacklogTask[];
  dependencies: string[];
  blockingIssues?: any[];
}

// Configuration du programme
program
  .name('coordinator-agent')
  .description('Strategic coordination agent for PHP to NestJS/Remix migration')
  .version('1.0.0')
  .option('-d, --discovery <path>', 'Path to discovery_map.json', './discovery_map.json')
  .option('-a, --audits <path>', 'Path to audit directory', './output/audits')
  .option('-s, --schema <path>', 'Path to schema_migration_diff.json', './schema_migration_diff.json')
  .option('-h, --htaccess <path>', 'Path to htaccess_map.json', './htaccess_map.json')
  .option('-o, --output <path>', 'Output directory', './output/coordinator')
  .option('-v, --verbose', 'Enable verbose output');

program.parse(process.argv);
const options = program.opts();

// Point d'entrée principal
async function main() {
  console.log(chalk.blue('🧠 Coordinator Agent - Starting strategic analysis'));
  
  // Préparer le répertoire de sortie
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }
  
  try {
    // 1. Charger les données source
    const discoveryMap = loadDiscoveryMap(options.discovery);
    console.log(chalk.green(`✓ Loaded discovery map with ${discoveryMap.files.length} files`));
    
    const auditFiles = loadAuditFiles(options.audits);
    console.log(chalk.green(`✓ Loaded ${auditFiles.length} audit files`));
    
    const backlogFiles = loadBacklogFiles(options.audits);
    console.log(chalk.green(`✓ Loaded ${backlogFiles.length} backlog files`));
    
    const impactGraphs = loadImpactGraphs(options.audits);
    console.log(chalk.green(`✓ Loaded ${Object.keys(impactGraphs).length} impact graphs`));
    
    let schemaMigrationDiff = {};
    if (fs.existsSync(options.schema)) {
      schemaMigrationDiff = JSON.parse(fs.readFileSync(options.schema, 'utf8'));
      console.log(chalk.green(`✓ Loaded schema migration diff`));
    } else {
      console.log(chalk.yellow('⚠ Schema migration diff not found, continuing without it'));
    }
    
    let htaccessMap = {};
    if (fs.existsSync(options.htaccess)) {
      htaccessMap = JSON.parse(fs.readFileSync(options.htaccess, 'utf8'));
      console.log(chalk.green(`✓ Loaded htaccess map`));
    } else {
      console.log(chalk.yellow('⚠ Htaccess map not found, continuing without it'));
    }
    
    // 2. Construire le graphe de dépendances
    const dependencies = buildDependencyGraph(discoveryMap, impactGraphs);
    console.log(chalk.green(`✓ Built dependency graph with ${dependencies.length} connections`));
    
    // 3. Détecter les blocages
    const blockers = detectBlockers(
      discoveryMap,
      dependencies,
      backlogFiles,
      schemaMigrationDiff,
      htaccessMap
    );
    console.log(chalk.green(`✓ Detected ${blockers.length} blockers`));
    
    // 4. Construire le plan de vagues de migration
    const wavePlan = buildMigrationWavePlan(
      discoveryMap,
      auditFiles,
      backlogFiles,
      dependencies,
      blockers
    );
    console.log(chalk.green(`✓ Generated migration wave plan with ${wavePlan.totalWaves} waves`));
    
    // 5. Générer la matrice de dépendances pour visualisation
    const dependencyMatrix = generateDependencyMatrix(
      discoveryMap.files,
      dependencies,
      blockers
    );
    console.log(chalk.green(`✓ Generated dependency matrix`));
    
    // 6. Générer les données pour le dashboard
    const dashboardData = generateDashboardData(wavePlan, blockers);
    console.log(chalk.green(`✓ Generated dashboard data`));
    
    // 7. Écrire les fichiers de sortie
    const wavePlanPath = path.join(options.output, 'migration_wave_plan.json');
    fs.writeFileSync(wavePlanPath, JSON.stringify(wavePlan, null, 2));
    console.log(chalk.green(`✓ Wrote migration wave plan to ${wavePlanPath}`));
    
    const dependencyMatrixPath = path.join(options.output, 'dependency_matrix.json');
    fs.writeFileSync(dependencyMatrixPath, JSON.stringify(dependencyMatrix, null, 2));
    console.log(chalk.green(`✓ Wrote dependency matrix to ${dependencyMatrixPath}`));
    
    const blockersPath = path.join(options.output, 'migration_blockers.json');
    fs.writeFileSync(blockersPath, JSON.stringify({ blockers }, null, 2));
    console.log(chalk.green(`✓ Wrote migration blockers to ${blockersPath}`));
    
    const dashboardDataPath = path.join(options.output, 'migration_dashboard_data.json');
    fs.writeFileSync(dashboardDataPath, JSON.stringify(dashboardData, null, 2));
    console.log(chalk.green(`✓ Wrote dashboard data to ${dashboardDataPath}`));
    
    console.log(chalk.blue('🎉 Coordinator Agent - Analysis completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
    process.exit(1);
  }
}

/**
 * Charge la carte de découverte (discovery_map.json)
 */
function loadDiscoveryMap(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Discovery map not found at ${filePath}`);
  }
  
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Charge les fichiers d'audit (*.audit.md)
 */
function loadAuditFiles(dirPath: string): AuditMetadata[] {
  const auditFiles = glob.sync(path.join(dirPath, '**/*.audit.md'));
  
  return auditFiles.map(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    // Extraire les métadonnées YAML/Frontmatter
    const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (metadataMatch) {
      try {
        const metadata = YAML.parse(metadataMatch[1]) as AuditMetadata;
        return metadata;
      } catch (error) {
        console.warn(`Failed to parse metadata for ${filePath}: ${error}`);
        return { file: path.basename(filePath, '.audit.md'), analyzedAt: new Date().toISOString() };
      }
    }
    
    return { file: path.basename(filePath, '.audit.md'), analyzedAt: new Date().toISOString() };
  });
}

/**
 * Charge les fichiers de backlog (*.backlog.json)
 */
function loadBacklogFiles(dirPath: string): Backlog[] {
  const backlogFiles = glob.sync(path.join(dirPath, '**/*.backlog.json'));
  
  return backlogFiles.map(filePath => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.warn(`Failed to parse backlog file ${filePath}: ${error}`);
      return { 
        file: path.basename(filePath, '.backlog.json'),
        analyzedAt: new Date().toISOString(),
        status: 'unknown',
        priority: 'unknown',
        tasks: []
      };
    }
  });
}

/**
 * Charge les graphes d'impact (*.impact_graph.json)
 */
function loadImpactGraphs(dirPath: string): Record<string, any> {
  const impactGraphFiles = glob.sync(path.join(dirPath, '**/*.impact_graph.json'));
  const result: Record<string, any> = {};
  
  for (const filePath of impactGraphFiles) {
    try {
      const fileName = path.basename(filePath, '.impact_graph.json');
      result[fileName] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.warn(`Failed to parse impact graph file ${filePath}: ${error}`);
    }
  }
  
  return result;
}

/**
 * Construit le graphe de dépendances à partir des données sources
 */
function buildDependencyGraph(
  discoveryMap: any,
  impactGraphs: Record<string, any>
): Dependency[] {
  const dependencies: Dependency[] = [];
  
  // Extraire les dépendances du discovery_map
  for (const file of discoveryMap.files) {
    if (file.dependencies) {
      for (const dep of file.dependencies) {
        dependencies.push({
          source: file.path,
          target: dep,
          weight: 5, // Poids moyen par défaut
          type: 'include'
        });
      }
    }
  }
  
  // Enrichir avec les graphes d'impact
  for (const [fileName, graph] of Object.entries(impactGraphs)) {
    if (graph.impacts && graph.impacts.files && graph.impacts.files.depends_on) {
      for (const dep of graph.impacts.files.depends_on) {
        // Trouver le fichier source complet
        const sourceFile = discoveryMap.files.find((f: any) => 
          f.path.includes(fileName) || fileName.includes(path.basename(f.path, '.php'))
        );
        
        if (sourceFile) {
          dependencies.push({
            source: sourceFile.path,
            target: dep.path,
            weight: dep.critical ? 8 : 4,
            type: dep.type || 'include'
          });
        }
      }
    }
    
    // Extraire aussi les dépendances SQL si disponibles
    if (graph.impacts && graph.impacts.database && graph.impacts.database.tables) {
      // Logique pour les dépendances SQL...
    }
  }
  
  // Dédupliquer et fusionner les dépendances
  const deduplicated: Record<string, Dependency> = {};
  
  for (const dep of dependencies) {
    const key = `${dep.source}|${dep.target}`;
    
    if (deduplicated[key]) {
      // Prendre le poids le plus élevé
      deduplicated[key].weight = Math.max(deduplicated[key].weight, dep.weight);
    } else {
      deduplicated[key] = dep;
    }
  }
  
  return Object.values(deduplicated);
}

/**
 * Détecte les blocages dans le processus de migration
 */
function detectBlockers(
  discoveryMap: any,
  dependencies: Dependency[],
  backlogFiles: Backlog[],
  schemaMigrationDiff: any,
  htaccessMap: any
): MigrationBlocker[] {
  const blockers: MigrationBlocker[] = [];
  
  // 1. Détecter les dépendances circulaires
  const circularDeps = detectCircularDependencies(dependencies);
  for (const cycle of circularDeps) {
    blockers.push({
      id: `circular-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'circular',
      description: `Dépendance circulaire détectée: ${cycle.join(' → ')}`,
      severity: 'high',
      files: cycle
    });
  }
  
  // 2. Détecter les problèmes de schéma de base de données
  if (schemaMigrationDiff && schemaMigrationDiff.tables) {
    for (const [tableName, tableDetails] of Object.entries<any>(schemaMigrationDiff.tables)) {
      if (tableDetails.status === 'error' || tableDetails.status === 'conflict') {
        const affectedFiles = findFilesUsingTable(discoveryMap, tableName);
        
        blockers.push({
          id: `schema-${tableName}`,
          type: 'schema',
          description: `Problème de schéma pour la table ${tableName}: ${tableDetails.message || 'conflit détecté'}`,
          severity: tableDetails.severity || 'medium',
          files: affectedFiles,
          suggestedResolution: tableDetails.suggestion
        });
      }
    }
  }
  
  // 3. Détecter les tâches expirées ou bloquées
  for (const backlog of backlogFiles) {
    const expiredTasks = backlog.tasks.filter(task => 
      task.status === 'blocked' || task.status === 'expired'
    );
    
    if (expiredTasks.length > 0) {
      blockers.push({
        id: `expired-${backlog.file}`,
        type: 'expired',
        description: `${expiredTasks.length} tâches bloquées ou expirées dans ${backlog.file}`,
        severity: backlog.priority === 'high' ? 'high' : 'medium',
        files: [backlog.file]
      });
    }
  }
  
  // 4. Détecter les problèmes liés aux routes htaccess
  if (htaccessMap && htaccessMap.rules) {
    const criticalRoutes = htaccessMap.rules.filter((rule: any) => 
      rule.seoImpact === 'high' && !rule.migrated
    );
    
    if (criticalRoutes.length > 0) {
      blockers.push({
        id: `htaccess-critical`,
        type: 'technical',
        description: `${criticalRoutes.length} routes critiques SEO non migrées`,
        severity: 'high',
        files: criticalRoutes.map((r: any) => r.pattern || r.from)
      });
    }
  }
  
  return blockers;
}

/**
 * Détecte les dépendances circulaires
 */
function detectCircularDependencies(dependencies: Dependency[]): string[][] {
  // Construire un graphe dirigé à partir des dépendances
  const graph: Record<string, string[]> = {};
  
  for (const dep of dependencies) {
    if (!graph[dep.source]) {
      graph[dep.source] = [];
    }
    
    graph[dep.source].push(dep.target);
  }
  
  // Détecter les cycles dans le graphe (implémentation simplifiée)
  const cycles: string[][] = [];
  const visited: Record<string, boolean> = {};
  const recStack: Record<string, boolean> = {};
  const path: string[] = [];
  
  function dfs(node: string) {
    if (!graph[node]) return false;
    
    visited[node] = true;
    recStack[node] = true;
    path.push(node);
    
    for (const neighbor of graph[node]) {
      if (!visited[neighbor]) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recStack[neighbor]) {
        // Cycle détecté
        const cycle = path.slice(path.indexOf(neighbor));
        cycles.push([...cycle, neighbor]);
        return true;
      }
    }
    
    path.pop();
    recStack[node] = false;
    return false;
  }
  
  for (const node of Object.keys(graph)) {
    if (!visited[node]) {
      dfs(node);
    }
  }
  
  return cycles;
}

/**
 * Trouve les fichiers utilisant une table donnée
 */
function findFilesUsingTable(discoveryMap: any, tableName: string): string[] {
  const files: string[] = [];
  
  for (const file of discoveryMap.files) {
    if (file.sql_tables && file.sql_tables.includes(tableName)) {
      files.push(file.path);
    }
  }
  
  return files;
}

/**
 * Construit le plan de vagues de migration
 */
function buildMigrationWavePlan(
  discoveryMap: any,
  auditFiles: AuditMetadata[],
  backlogFiles: Backlog[],
  dependencies: Dependency[],
  blockers: MigrationBlocker[]
): MigrationWavePlan {
  // 1. Fusionner les données pour chaque fichier
  const enrichedFiles = enrichFilesWithMetadata(
    discoveryMap.files,
    auditFiles,
    backlogFiles
  );
  
  // 2. Calculer les dépendances et blocages
  enrichedFiles.forEach(file => {
    file.blockingFor = [];
  });
  
  // Identifier les fichiers qui bloquent d'autres fichiers
  dependencies.forEach(dep => {
    const targetFile = enrichedFiles.find(f => f.path === dep.target);
    const sourceFile = enrichedFiles.find(f => f.path === dep.source);
    
    if (targetFile && sourceFile) {
      if (!targetFile.blockingFor.includes(sourceFile.path)) {
        targetFile.blockingFor.push(sourceFile.path);
      }
    }
  });
  
  // 3. Appliquer des règles de tri pour créer des vagues optimales
  // Calcul du score composite pour chaque fichier
  enrichedFiles.forEach(file => {
    // Convertir les facteurs en scores numériques
    const priorityScore = 
      file.priority === 'critical' ? 4 :
      file.priority === 'high' ? 3 :
      file.priority === 'medium' ? 2 : 1;
    
    const complexityFactor = file.complexity || 0.5;
    const seoImpactFactor = 
      file.seoImpact === 'high' ? 1 :
      file.seoImpact === 'medium' ? 0.6 : 0.3;
    const businessImpactFactor =
      file.businessImpact === 'critical' ? 1 :
      file.businessImpact === 'high' ? 0.8 : 0.5;
    const blockingFactor = 1 + (file.blockingFor.length * 0.1); // Plus bloquant = plus important
    
    // Score composite = priorité * (complexité + SEO + business) * facteur bloquant
    file.compositeScore = priorityScore * (complexityFactor + seoImpactFactor + businessImpactFactor) * blockingFactor;
  });
  
  // Trier par score composite décroissant
  enrichedFiles.sort((a, b) => b.compositeScore - a.compositeScore);
  
  // 4. Allouer les fichiers aux vagues
  const waves: MigrationWave[] = [];
  const maxFilesPerWave = 10; // Paramètre à ajuster
  let waveCounter = 1;
  let processedFiles = new Set<string>();
  
  // Fonction pour vérifier si un fichier est prêt à être migré
  function isFileReady(file: any): boolean {
    // Un fichier est prêt si toutes ses dépendances sont déjà traitées
    return file.dependencies.every((dep: string) => processedFiles.has(dep));
  }
  
  // Tant qu'il reste des fichiers à traiter
  while (enrichedFiles.filter(f => !processedFiles.has(f.path)).length > 0) {
    // Identifier les fichiers candidats pour cette vague
    const readyFiles = enrichedFiles
      .filter(f => !processedFiles.has(f.path) && isFileReady(f))
      .slice(0, maxFilesPerWave);
    
    // Si aucun fichier n'est prêt (à cause de dépendances circulaires), prendre les plus prioritaires
    if (readyFiles.length === 0) {
      const remainingFiles = enrichedFiles
        .filter(f => !processedFiles.has(f.path))
        .slice(0, maxFilesPerWave);
      
      if (remainingFiles.length === 0) break; // Sortir si plus aucun fichier
      
      // Créer une nouvelle vague avec avertissement
      const wave: MigrationWave = {
        id: `wave-${waveCounter}`,
        name: `Vague ${waveCounter} (⚠️ Dépendances circulaires)`,
        description: `Cette vague contient des fichiers avec dépendances circulaires qui nécessitent une attention particulière.`,
        priority: getWavePriority(remainingFiles),
        files: remainingFiles,
        dependencies: [],
        estimatedEffort: calculateWaveEffort(remainingFiles),
        status: 'pending',
        blockers: getWaveBlockers(remainingFiles, blockers)
      };
      
      waves.push(wave);
      
      // Marquer ces fichiers comme traités
      remainingFiles.forEach(f => processedFiles.add(f.path));
    } else {
      // Créer une nouvelle vague normale
      const wave: MigrationWave = {
        id: `wave-${waveCounter}`,
        name: `Vague ${waveCounter}`,
        description: `Migration des fichiers de priorité ${getWavePriority(readyFiles)}.`,
        priority: getWavePriority(readyFiles),
        files: readyFiles,
        dependencies: [],
        estimatedEffort: calculateWaveEffort(readyFiles),
        status: 'pending',
        blockers: getWaveBlockers(readyFiles, blockers)
      };
      
      waves.push(wave);
      
      // Marquer ces fichiers comme traités
      readyFiles.forEach(f => processedFiles.add(f.path));
    }
    
    waveCounter++;
  }
  
  // 5. Calculer les dépendances entre vagues
  for (const wave of waves) {
    wave.dependencies = [];
    
    // Une vague dépend d'une autre si un de ses fichiers dépend d'un fichier de l'autre vague
    for (const file of wave.files) {
      for (const dep of file.dependencies) {
        // Trouver la vague qui contient cette dépendance
        const dependencyWave = waves.find(w => 
          w.files.some(f => f.path === dep)
        );
        
        if (dependencyWave && dependencyWave.id !== wave.id && !wave.dependencies.includes(dependencyWave.id)) {
          wave.dependencies.push(dependencyWave.id);
        }
      }
    }
  }
  
  // 6. Calculer les métriques globales
  const totalEffort = waves.reduce((sum, wave) => sum + wave.estimatedEffort, 0);
  
  // 7. Construire et retourner le plan de vagues
  return {
    totalFiles: discoveryMap.files.length,
    analyzedFiles: enrichedFiles.length,
    completedFiles: enrichedFiles.filter(f => f.status === 'completed').length,
    totalWaves: waves.length,
    estimatedTotalEffort: totalEffort,
    waves,
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
  };
}

/**
 * Enrichit les fichiers avec des métadonnées provenant des audits et backlogs
 */
function enrichFilesWithMetadata(
  files: any[],
  auditFiles: AuditMetadata[],
  backlogFiles: Backlog[]
): MigrationFile[] {
  return files.map(file => {
    // Trouver l'audit correspondant
    const audit = auditFiles.find(a => a.file === file.path || file.path.includes(a.file));
    
    // Trouver le backlog correspondant
    const backlog = backlogFiles.find(b => b.file === file.path || file.path.includes(b.file));
    
    // Estimer l'effort en fonction du backlog
    let estimatedEffort = 4; // 4 heures par défaut
    
    if (backlog) {
      // Calculer l'effort basé sur les tâches
      const taskEffort = backlog.tasks.reduce((sum, task) => {
        switch (task.estimatedEffort) {
          case 'high': return sum + 8;
          case 'medium': return sum + 4;
          case 'low': return sum + 2;
          default: return sum + 4;
        }
      }, 0);
      
      estimatedEffort = taskEffort;
    }
    
    // Créer et retourner le fichier enrichi
    return {
      path: file.path,
      priority: file.priority || 'medium',
      status: backlog?.status || file.status || 'pending',
      complexity: file.complexity_score || 0.5,
      seoImpact: file.seo_impact || 'low',
      businessImpact: file.business_impact || 'medium',
      dependencies: file.dependencies || [],
      blockingFor: [], // Sera rempli plus tard
      module: determineModule(file.path),
      estimatedEffort,
      compositeScore: 0 // Sera calculé plus tard
    };
  });
}

/**
 * Détermine le module d'un fichier en fonction de son chemin
 */
function determineModule(filePath: string): string {
  const parts = filePath.split('/');
  
  // Si dans src/module/...
  if (parts.length > 2 && parts[0] === 'src') {
    return parts[1];
  }
  
  // Si format module/file.php
  if (parts.length === 2) {
    return parts[0];
  }
  
  // Fallback: utiliser le répertoire parent
  return parts[parts.length - 2] || 'unknown';
}

/**
 * Détermine la priorité d'une vague en fonction de ses fichiers
 */
function getWavePriority(files: MigrationFile[]): 'critical' | 'high' | 'medium' | 'low' {
  if (files.some(f => f.priority === 'critical')) return 'critical';
  if (files.some(f => f.priority === 'high')) return 'high';
  if (files.some(f => f.priority === 'medium')) return 'medium';
  return 'low';
}

/**
 * Calcule l'effort estimé pour une vague
 */
function calculateWaveEffort(files: MigrationFile[]): number {
  // Somme les efforts de tous les fichiers
  const totalHours = files.reduce((sum, file) => sum + file.estimatedEffort, 0);
  
  // Convertir en jours-personnes (8h par jour)
  return Math.ceil(totalHours / 8);
}

/**
 * Identifie les blockers affectant une vague
 */
function getWaveBlockers(files: MigrationFile[], blockers: MigrationBlocker[]): MigrationBlocker[] {
  const waveBlockers: MigrationBlocker[] = [];
  const filePaths = files.map(f => f.path);
  
  for (const blocker of blockers) {
    // Si au moins un fichier de la vague est impacté par ce blocker
    if (blocker.files.some(f => filePaths.includes(f))) {
      waveBlockers.push(blocker);
    }
  }
  
  return waveBlockers;
}

/**
 * Génère la matrice de dépendances pour visualisation
 */
function generateDependencyMatrix(
  files: any[],
  dependencies: Dependency[],
  blockers: MigrationBlocker[]
): DependencyMatrix {
  // 1. Créer les nœuds du graphe
  const nodes = files.map(file => {
    // Vérifier si le fichier est bloqué
    const isBlocked = blockers.some(b => b.files.includes(file.path));
    
    return {
      id: file.path,
      module: determineModule(file.path),
      priority: file.priority || 'medium',
      status: isBlocked ? 'blocked' : (file.status || 'pending'),
      complexity: file.complexity_score || 0.5
    };
  });
  
  // 2. Créer les liens du graphe
  const links = dependencies.map(dep => ({
    source: dep.source,
    target: dep.target,
    value: dep.weight,
    type: dep.type
  }));
  
  return { nodes, links };
}

/**
 * Génère les données pour le dashboard
 */
function generateDashboardData(
  wavePlan: MigrationWavePlan,
  blockers: MigrationBlocker[]
): any {
  return {
    summary: {
      totalFiles: wavePlan.totalFiles,
      analyzedFiles: wavePlan.analyzedFiles,
      completedFiles: wavePlan.completedFiles,
      totalWaves: wavePlan.totalWaves,
      estimatedTotalEffort: wavePlan.estimatedTotalEffort,
      blockers: blockers.length,
      criticalBlockers: blockers.filter(b => b.severity === 'critical').length
    },
    progressByModule: computeProgressByModule(wavePlan),
    wavesList: wavePlan.waves.map(wave => ({
      id: wave.id,
      name: wave.name,
      priority: wave.priority,
      status: wave.status,
      filesCount: wave.files.length,
      effort: wave.estimatedEffort,
      blockers: wave.blockers?.length || 0
    })),
    blockersHighlights: blockers
      .filter(b => b.severity === 'critical' || b.severity === 'high')
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        description: b.description,
        severity: b.severity,
        type: b.type,
        filesCount: b.files.length
      }))
  };
}

/**
 * Calcule la progression par module
 */
function computeProgressByModule(wavePlan: MigrationWavePlan): any[] {
  const moduleStats: Record<string, { total: number; completed: number; inProgress: number }> = {};
  
  // Parcourir toutes les vagues
  for (const wave of wavePlan.waves) {
    for (const file of wave.files) {
      if (!moduleStats[file.module]) {
        moduleStats[file.module] = { total: 0, completed: 0, inProgress: 0 };
      }
      
      moduleStats[file.module].total++;
      
      if (file.status === 'completed') {
        moduleStats[file.module].completed++;
      } else if (file.status === 'in_progress') {
        moduleStats[file.module].inProgress++;
      }
    }
  }
  
  // Convertir en tableau pour le dashboard
  return Object.entries(moduleStats).map(([module, stats]) => ({
    module,
    total: stats.total,
    completed: stats.completed,
    inProgress: stats.inProgress,
    percentComplete: Math.round((stats.completed / stats.total) * 100)
  }));
}

// Démarrer le script si exécuté directement
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
