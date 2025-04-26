/**
 * project-indexer.ts
 * 
 * Outil d'indexation et d'analyse du projet pour l'architecture MCP OS 3 couches
 * 
 * Génère:
 * - project_index.json: Inventaire complet de tous les fichiers pertinents
 * - structure_score.json: Score de conformité à l'architecture en 3 couches
 * - redundancy_report.json: Identification des duplications et redondances
 * - obsoletes.json: Fichiers et composants obsolètes ou non utilisés
 */

import * as fs from fs-extrastructure-agent';
import * as path from pathstructure-agent';
import * as glob from globstructure-agent';
import { exec } from child_processstructure-agent';
import { promisify } from utilstructure-agent';

// Utilitaires
const execAsync = promisify(exec);
const logger = {
  info: (msg: string) => console.log(`\x1b[36mINFO\x1b[0m: ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33mWARN\x1b[0m: ${msg}`),
  error: (msg: string) => console.log(`\x1b[31mERROR\x1b[0m: ${msg}`),
  success: (msg: string) => console.log(`\x1b[32mSUCCESS\x1b[0m: ${msg}`)
};

// Constantes
const WORKSPACE_ROOT = process.cwd();
const REPORT_DIR = path.join(WORKSPACE_ROOT, 'reports');
const SRC_DIR = path.join(WORKSPACE_ROOT, 'src');
const AGENTS_DIR = path.join(WORKSPACE_ROOT, 'agents');
const PACKAGES_DIR = path.join(WORKSPACE_ROOT, 'packages');

// Types pour l'indexation
interface ProjectFile {
  path: string;
  relativePath: string;
  type: string;
  layer?: 'orchestration' | 'coordination' | 'business' | 'core' | 'utils' | 'unknown';
  domain?: string;
  status?: 'active' | 'deprecated' | 'migrated' | 'unknown';
  usageCount: number;
  loc: number; // lines of code
  dependencies: string[];
  imports: string[];
  exports: string[];
  lastModified: string;
  migrated: boolean;
}

interface StructureScore {
  overall: number;
  byCategory: {
    layerConformity: number;
    namingConsistency: number;
    interfaceImplementation: number;
    redundancyFactor: number;
    testCoverage: number;
  };
  details: {
    totalFiles: number;
    layeredFiles: number;
    interfaceImplementingFiles: number;
    testedFiles: number;
    redundantComponents: string[];
  };
}

interface RedundancyReport {
  duplicatedCode: Array<{
    files: string[];
    similarity: number;
    linesCount: number;
    sample: string;
  }>;
  similarComponents: Array<{
    components: string[];
    similarity: number;
    functionalities: string[];
  }>;
  recommendedActions: Array<{
    target: string[];
    action: 'merge' | 'extract' | 'refactor';
    description: string;
  }>;
}

interface ObsoletesReport {
  files: Array<{
    path: string;
    reason: string;
    usageCount: number;
    lastModified: string;
  }>;
  components: Array<{
    name: string;
    path: string;
    reason: string;
    replacementSuggestion?: string;
  }>;
  code: Array<{
    path: string;
    lineStart: number;
    lineEnd: number;
    reason: string;
  }>;
}

/**
 * Analyse un fichier source
 */
async function analyzeFile(filePath: string): Promise<ProjectFile> {
  // Lire le contenu du fichier
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(WORKSPACE_ROOT, filePath);
  const stats = await fs.stat(filePath);
  
  // Déterminer le type de fichier
  let type = 'unknown';
  if (path.basename(filePath).includes('.test.') || path.basename(filePath).includes('.spec.')) {
    type = 'test';
  } else if (filePath.includes('interface') || filePath.includes('type') || (content.includes('interface ') && content.includes('export'))) {
    type = 'interface';
  } else if (content.includes('class ') && content.includes('extends BaseAgent')) {
    type = 'agent';
  } else if (content.includes('class ') && content.includes('component')) {
    type = 'component';
  } else if (content.includes('function ') && !content.includes('class ')) {
    type = 'utility';
  } else {
    // Déterminer par l'extension
    const ext = path.extname(filePath).toLowerCase();
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      type = 'script';
    } else if (['.json', '.yaml', '.yml'].includes(ext)) {
      type = 'config';
    } else if (['.md', '.txt'].includes(ext)) {
      type = 'documentation';
    }
  }
  
  // Déterminer la couche (layer)
  let layer = 'unknown' as ProjectFile['layer'];
  if (filePath.includes('/orchestration/') || filePath.includes('orchestrator')) {
    layer = 'orchestration';
  } else if (filePath.includes('/coordination/') || filePath.includes('bridge') || filePath.includes('registry')) {
    layer = 'coordination';
  } else if (filePath.includes('/business/') || filePath.includes('analyzer') || filePath.includes('validator')) {
    layer = 'business';
  } else if (filePath.includes('/core/')) {
    layer = 'core';
  } else if (filePath.includes('/utils/')) {
    layer = 'utils';
  }
  
  // Extraire les imports et exports
  const imports = lines
    .filter(line => line.trim().startsWith('import '))
    .map(line => line.trim());
  
  const exports = lines
    .filter(line => line.trim().startsWith('export '))
    .map(line => line.trim());
  
  // Déterminer les dépendances
  const dependencies = imports
    .filter(imp => imp.includes('from'))
    .map(imp => {
      const match = imp.match(/from\s+['"](.*?)['"]/);
      return match ? match[1] : '';
    })
    .filter(dep => dep && !dep.startsWith('.'));
  
  // Compter les utilisations
  let usageCount = 0;
  try {
    const fileName = path.basename(filePath, path.extname(filePath));
    const { stdout } = await execAsync(DoDoDoDotgit grep -l "${fileName}" --exclude="${path.basename(filePath)}" | wc -l`);
    usageCount = parseInt(stdout.trim(), 10);
  } catch (error) {
    logger.warn(`Impossible de compter les utilisations pour ${filePath}`);
  }
  
  // Déterminer le statut
  let status = 'active' as ProjectFile['status'];
  if (filePath.includes('/legacy/') || content.includes('@deprecated')) {
    status = 'deprecated';
  } else if (content.includes('@migrated') || content.includes('migrated to')) {
    status = 'migrated';
  }
  
  // Déterminer si le fichier est migré vers la nouvelle architecture
  const migrated = 
    content.includes('implements BaseAgent') || 
    content.includes('implements OrchestratorAgent') ||
    content.includes('implements BridgeAgent') ||
    content.includes('implements AnalyzerAgent') ||
    content.includes('implements ValidatorAgent') ||
    content.includes('implements GeneratorAgent');
  
  return {
    path: filePath,
    relativePath,
    type,
    layer,
    domain: determineDomain(filePath, content),
    status,
    usageCount,
    loc: lines.length,
    dependencies,
    imports,
    exports,
    lastModified: stats.mtime.toISOString(),
    migrated
  };
}

/**
 * Détermine le domaine métier d'un fichier
 */
function determineDomain(filePath: string, content: string): string {
  // Cette fonction serait plus sophistiquée dans un vrai projet
  // Elle pourrait analyser les imports, le contenu, les commentaires, etc.
  
  if (filePath.includes('seo') || content.includes('SEO')) {
    return 'seo';
  } else if (filePath.includes('php') || filePath.includes('migration') || content.includes('migration')) {
    return 'migration';
  } else if (filePath.includes('qa') || content.includes('quality') || content.includes('QA')) {
    return 'qa';
  } else if (filePath.includes('monitor') || content.includes('monitoring') || content.includes('health')) {
    return 'monitoring';
  } else if (filePath.includes('workflow') || content.includes('workflow')) {
    return 'workflow';
  } else {
    return 'general';
  }
}

/**
 * Calcule le score de structure
 */
function calculateStructureScore(files: ProjectFile[]): StructureScore {
  const totalFiles = files.filter(f => ['.ts', '.tsx', '.js', '.jsx'].some(ext => f.path.endsWith(ext))).length;
  const layeredFiles = files.filter(f => f.layer && f.layer !== 'unknown').length;
  const interfaceImplementingFiles = files.filter(f => f.migrated).length;
  const testedFiles = files.filter(f => 
    files.some(tf => tf.type === 'test' && tf.path.includes(path.basename(f.path, path.extname(f.path))))
  ).length;
  
  const redundantComponentsMap = new Map<string, string[]>();
  files.forEach(f => {
    if (f.exports.length > 0) {
      const mainExport = f.exports[0];
      if (redundantComponentsMap.has(mainExport)) {
        redundantComponentsMap.get(mainExport)?.push(f.relativePath);
      } else {
        redundantComponentsMap.set(mainExport, [f.relativePath]);
      }
    }
  });
  
  const redundantComponents = Array.from(redundantComponentsMap.entries())
    .filter(([_, paths]) => paths.length > 1)
    .map(([name, paths]) => `${name} (${paths.join(', ')})`);
  
  // Calculer les scores individuels
  const layerConformity = totalFiles > 0 ? (layeredFiles / totalFiles) * 100 : 0;
  const namingConsistency = calculateNamingConsistency(files);
  const interfaceImplementation = totalFiles > 0 ? (interfaceImplementingFiles / totalFiles) * 100 : 0;
  const testCoverage = totalFiles > 0 ? (testedFiles / totalFiles) * 100 : 0;
  const redundancyFactor = totalFiles > 0 ? 100 - (redundantComponents.length / totalFiles) * 100 : 100;
  
  // Score global pondéré
  const overall = (
    layerConformity * 0.3 +
    namingConsistency * 0.2 +
    interfaceImplementation * 0.25 +
    redundancyFactor * 0.15 +
    testCoverage * 0.1
  );
  
  return {
    overall,
    byCategory: {
      layerConformity,
      namingConsistency,
      interfaceImplementation,
      redundancyFactor,
      testCoverage
    },
    details: {
      totalFiles,
      layeredFiles,
      interfaceImplementingFiles,
      testedFiles,
      redundantComponents
    }
  };
}

/**
 * Calcule la cohérence de nommage
 */
function calculateNamingConsistency(files: ProjectFile[]): number {
  const agentFiles = files.filter(f => f.type === 'agent');
  
  // Vérifier le pattern de suffixe '-agent' ou 'Agent'
  const correctlyNamedAgents = agentFiles.filter(f => 
    path.basename(f.path, path.extname(f.path)).toLowerCase().endsWith('agent')
  ).length;
  
  // Cohérence de nommage par couche
  const layerConsistency: Record<string, number> = {};
  const layerFiles: Record<string, ProjectFile[]> = {};
  
  files.forEach(f => {
    if (f.layer && f.layer !== 'unknown') {
      if (!layerFiles[f.layer]) {
        layerFiles[f.layer] = [];
      }
      layerFiles[f.layer].push(f);
    }
  });
  
  // Calculer la cohérence par couche
  Object.entries(layerFiles).forEach(([layer, files]) => {
    // Pattern de préfixe par couche
    const expectedPrefix = layer.charAt(0).toLowerCase();
    const consistentlyNamed = files.filter(f => {
      const baseName = path.basename(f.path, path.extname(f.path));
      return (
        baseName.startsWith(expectedPrefix) ||
        baseName.toLowerCase().includes(layer.toLowerCase())
      );
    }).length;
    
    layerConsistency[layer] = files.length > 0 ? (consistentlyNamed / files.length) * 100 : 0;
  });
  
  // Moyenne des scores
  const agentScore = agentFiles.length > 0 ? (correctlyNamedAgents / agentFiles.length) * 100 : 100;
  const layerScores = Object.values(layerConsistency);
  const layerScore = layerScores.length > 0 
    ? layerScores.reduce((sum, score) => sum + score, 0) / layerScores.length 
    : 100;
  
  return (agentScore * 0.6 + layerScore * 0.4);
}

/**
 * Analyse les redondances et duplications
 */
function analyzeRedundancies(files: ProjectFile[]): RedundancyReport {
  const duplicatedCode: RedundancyReport['duplicatedCode'] = [];
  const similarComponents: RedundancyReport['similarComponents'] = [];
  const recommendedActions: RedundancyReport['recommendedActions'] = [];
  
  // Regrouper les fichiers par domaine et type
  const filesByDomainAndType = new Map<string, ProjectFile[]>();
  
  files.forEach(file => {
    const key = `${file.domain}-${file.type}`;
    if (!filesByDomainAndType.has(key)) {
      filesByDomainAndType.set(key, []);
    }
    filesByDomainAndType.get(key)?.push(file);
  });
  
  // Analyser chaque groupe
  filesByDomainAndType.forEach((groupFiles, key) => {
    if (groupFiles.length < 2) return;
    
    // Vérifier les fichiers similaires
    for (let i = 0; i < groupFiles.length; i++) {
      for (let j = i + 1; j < groupFiles.length; j++) {
        const file1 = groupFiles[i];
        const file2 = groupFiles[j];
        
        // Calculer la similarité basée sur les imports et exports (simpliste mais suffisant)
        const importSimilarity = calculateArraySimilarity(
          file1.imports.map(i => i.replace(/'/g, '"')),
          file2.imports.map(i => i.replace(/'/g, '"'))
        );
        
        const exportSimilarity = calculateArraySimilarity(
          file1.exports.map(e => e.replace(/'/g, '"')),
          file2.exports.map(e => e.replace(/'/g, '"'))
        );
        
        const overallSimilarity = (importSimilarity * 0.4 + exportSimilarity * 0.6) * 100;
        
        // Si la similarité est suffisamment élevée
        if (overallSimilarity > 70) {
          // Détecter les fonctionnalités similaires basées sur les noms
          const functionalities = [...new Set([
            ...extractFunctionNames(file1.exports),
            ...extractFunctionNames(file2.exports)
          ])];
          
          similarComponents.push({
            components: [file1.relativePath, file2.relativePath],
            similarity: Math.round(overallSimilarity),
            functionalities
          });
          
          // Recommander une action
          if (overallSimilarity > 85) {
            recommendedActions.push({
              target: [file1.relativePath, file2.relativePath],
              action: 'merge',
              description: `Fusionner ces fichiers en un seul composant ${file1.layer} dû à leur grande similarité`
            });
          } else {
            recommendedActions.push({
              target: [file1.relativePath, file2.relativePath],
              action: 'extract',
              description: `Extraire les fonctionnalités communes dans un module partagé`
            });
          }
        }
      }
    }
  });
  
  return {
    duplicatedCode,
    similarComponents,
    recommendedActions
  };
}

/**
 * Calcule la similarité entre deux tableaux
 */
function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  
  let intersection = 0;
  set1.forEach(item => {
    if (set2.has(item)) intersection++;
  });
  
  return intersection / Math.max(set1.size, set2.size);
}

/**
 * Extrait les noms de fonctions à partir des lignes d'export
 */
function extractFunctionNames(exports: string[]): string[] {
  const names: string[] = [];
  
  exports.forEach(exp => {
    // Export de fonction
    const funcMatch = exp.match(/export\s+(?:function|const)\s+(\w+)/);
    if (funcMatch) names.push(funcMatch[1]);
    
    // Export de classe
    const classMatch = exp.match(/export\s+class\s+(\w+)/);
    if (classMatch) names.push(classMatch[1]);
    
    // Export d'interface
    const interfaceMatch = exp.match(/export\s+interface\s+(\w+)/);
    if (interfaceMatch) names.push(interfaceMatch[1]);
    
    // Export nommé
    const namedMatch = exp.match(/export\s+\{([^}]+)\}/);
    if (namedMatch) {
      const parts = namedMatch[1].split(',').map(p => p.trim());
      names.push(...parts);
    }
  });
  
  return names;
}

/**
 * Identifie les fichiers et composants obsolètes
 */
function identifyObsoletes(files: ProjectFile[]): ObsoletesReport {
  const obsoleteFiles: ObsoletesReport['files'] = [];
  const obsoleteComponents: ObsoletesReport['components'] = [];
  const obsoleteCode: ObsoletesReport['code'] = [];
  
  // Fichiers obsolètes
  files.forEach(file => {
    // Fichier obsolète si status deprecated ou non utilisé
    if (file.status === 'deprecated' || (file.usageCount === 0 && !file.path.endsWith('index.ts'))) {
      obsoleteFiles.push({
        path: file.relativePath,
        reason: file.status === 'deprecated' 
          ? 'Marqué comme déprécié' 
          : 'N\'est pas utilisé ailleurs dans le projet',
        usageCount: file.usageCount,
        lastModified: file.lastModified
      });
    }
    
    // Fichier qui a probablement été remplacé
    const baseName = path.basename(file.path, path.extname(file.path));
    const similarFiles = files.filter(f => 
      path.basename(f.path, path.extname(f.path)).toLowerCase() === baseName.toLowerCase() && 
      f.path !== file.path
    );
    
    if (similarFiles.length > 0) {
      // Si une version plus récente existe
      const newerVersions = similarFiles.filter(f => 
        new Date(f.lastModified) > new Date(file.lastModified) &&
        (
          f.migrated || // Déjà migré vers MCP OS
          f.path.includes('DoDotmcp-agents/') || // Dans le nouveau répertoire
          f.status === 'active' // Actif contrairement à ce fichier
        )
      );
      
      if (newerVersions.length > 0) {
        obsoleteFiles.push({
          path: file.relativePath,
          reason: `Remplacé par ${newerVersions[0].relativePath}`,
          usageCount: file.usageCount,
          lastModified: file.lastModified
        });
      }
    }
  });
  
  return {
    files: obsoleteFiles,
    components: obsoleteComponents,
    code: obsoleteCode
  };
}

/**
 * Fonction principale
 */
async function main() {
  logger.info('Indexation du projet...');
  
  // Créer le répertoire de rapports
  await fs.ensureDir(REPORT_DIR);
  
  // Chercher les fichiers TypeScript/JavaScript
  const sourceFiles = glob.sync('**/*.{ts,tsx,js,jsx}', { 
    cwd: WORKSPACE_ROOT,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/DoDoDoDotgit/**']
  }).map(f => path.join(WORKSPACE_ROOT, f));
  
  logger.info(`${sourceFiles.length} fichiers source trouvés.`);
  
  // Analyser chaque fichier
  const fileAnalyses: ProjectFile[] = [];
  
  for (const filePath of sourceFiles) {
    try {
      const analysis = await analyzeFile(filePath);
      fileAnalyses.push(analysis);
    } catch (error: any) {
      logger.error(`Erreur lors de l'analyse de ${filePath}: ${error.message}`);
    }
  }
  
  // Générer les rapports
  const projectIndex = {
    timestamp: new Date().toISOString(),
    filesCount: fileAnalyses.length,
    files: fileAnalyses
  };
  
  const structureScore = calculateStructureScore(fileAnalyses);
  const redundancyReport = analyzeRedundancies(fileAnalyses);
  const obsoletesReport = identifyObsoletes(fileAnalyses);
  
  // Écrire les fichiers de rapport
  await fs.writeJson(path.join(REPORT_DIR, 'project_index.json'), projectIndex, { spaces: 2 });
  await fs.writeJson(path.join(REPORT_DIR, 'structure_score.json'), structureScore, { spaces: 2 });
  await fs.writeJson(path.join(REPORT_DIR, 'redundancy_report.json'), redundancyReport, { spaces: 2 });
  await fs.writeJson(path.join(REPORT_DIR, 'obsoletes.json'), obsoletesReport, { spaces: 2 });
  
  // Également générer le fichier structure-map.json demandé
  const structureMap = fileAnalyses.map(file => ({
    path: file.relativePath,
    layer: file.layer || 'unknown',
    domain: file.domain || 'general',
    status: file.status || 'unknown'
  }));
  
  await fs.writeJson(path.join(WORKSPACE_ROOT, 'structure-map.json'), structureMap, { spaces: 2 });
  
  logger.success('Indexation terminée!');
  logger.success(`Score de structure global: ${structureScore.overall.toFixed(2)}/100`);
  logger.info(`Fichiers obsolètes identifiés: ${obsoletesReport.files.length}`);
  logger.info(`Redondances détectées: ${redundancyReport.similarComponents.length}`);
  logger.info(`Rapports générés dans: ${path.relative(WORKSPACE_ROOT, REPORT_DIR)}`);
}

// Exécuter la fonction principale
main().catch(error => {
  logger.error(`Erreur lors de l'indexation du projet: ${error.message}`);
  process.exit(1);
});