/**
 * project-indexer.ts
 * 
 * Outil pour analyser et indexer la structure du projet MCP OS
 * 
 * Génère plusieurs rapports :
 * - project_index.json : Index complet des fichiers et leurs métadonnées
 * - structure_score.json : Score de qualité de la structure du projet
 * - redundancy_report.json : Rapport sur les redondances et duplications
 * - obsoletes.json : Liste des fichiers obsolètes candidats à suppression
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';

// Types pour les rapports générés
interface ProjectIndex {
  files: FileInfo[];
  directories: DirectoryInfo[];
  timestamp: string;
  totalFiles: number;
  totalDirectories: number;
  fileTypes: Record<string, number>;
}

interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  extension: string;
  lastModified: string;
  lineCount: number;
  imports?: string[];
  exports?: string[];
  dependencies?: string[];
  tags: FileTags;
  layer?: 'orchestration' | 'coordination' | 'business' | 'shared' | 'unknown';
  domain?: string;
  status?: 'active' | 'deprecated' | 'legacy' | 'developing' | 'testing' | 'unknown';
  usedBy?: string[];
}

interface DirectoryInfo {
  path: string;
  relativePath: string;
  fileCount: number;
  subDirectoryCount: number;
  size: number;
  lastModified: string;
  tags: FileTags;
}

interface FileTags {
  layer?: string;
  domain?: string;
  status?: string;
  [key: string]: string | undefined;
}

interface StructureScore {
  timestamp: string;
  totalScore: number;
  metrics: {
    organization: {
      score: number;
      details: {
        layerConsistency: number;
        domainCohesion: number;
        hierarchyDepth: number;
        namingConsistency: number;
      };
    };
    redundancy: {
      score: number;
      details: {
        duplicateFilesCount: number;
        duplicateCodePercentage: number;
        backupFilesCount: number;
        versionedFilesCount: number;
      };
    };
    dependencies: {
      score: number;
      details: {
        circularDependencies: number;
        orphanedFiles: number;
        deadCode: number;
      };
    };
  };
}

interface RedundancyReport {
  timestamp: string;
  duplicateFiles: Array<{
    group: string[];
    similarity: number;
    type: string;
  }>;
  backupFiles: string[];
  versionedFiles: string[];
  redundantCode: Array<{
    files: string[];
    blocks: Array<{
      startLine: number;
      endLine: number;
      content: string;
    }>;
  }>;
}

interface ObsoletesReport {
  timestamp: string;
  candidatesForRemoval: Array<{
    path: string;
    reason: string;
    confidence: number;
    lastModified: string;
    size: number;
    usedBy: string[];
  }>;
}

interface StructureMap {
  version: string;
  updated: string;
  taxonomySchema: {
    layer: {
      description: string;
      values: string[];
    };
    domain: {
      description: string;
      values: string[];
    };
    status: {
      description: string;
      values: string[];
    };
  };
  defaultClassification: {
    layer: string;
    domain: string;
    status: string;
  };
  folderClassifications: Array<{
    pattern: string;
    classification: {
      layer?: string;
      domain?: string;
      status?: string;
    };
  }>;
  fileClassifications: Array<{
    pattern: string;
    classification: {
      layer?: string;
      domain?: string;
      status?: string;
    };
  }>;
}

// Configuration
const BASE_DIR = process.cwd();
const REPORTS_DIR = path.join(BASE_DIR, 'reports');
const STRUCTURE_MAP_PATH = path.join(BASE_DIR, 'structure-map.json');
const EXCLUSION_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'legacy/**',
  'reports/**',
  '**/*.d.ts'
];

// Créer le répertoire des rapports s'il n'existe pas
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Charger la structure map si elle existe
function loadStructureMap(): StructureMap | null {
  if (fs.existsSync(STRUCTURE_MAP_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STRUCTURE_MAP_PATH, 'utf8'));
    } catch (error) {
      console.error(`Erreur lors de la lecture de structure-map.json: ${error}`);
    }
  }
  return null;
}

// Classifier les fichiers selon la structure map
function classifyFile(filePath: string, structureMap: StructureMap | null): FileTags {
  if (!structureMap) {
    return {};
  }

  const relativePath = path.relative(BASE_DIR, filePath);
  let classification = { ...structureMap.defaultClassification };

  // Vérifier les classifications de dossiers
  for (const folderClass of structureMap.folderClassifications) {
    if (minimatch(relativePath, folderClass.pattern)) {
      classification = { ...classification, ...folderClass.classification };
    }
  }

  // Vérifier les classifications de fichiers
  for (const fileClass of structureMap.fileClassifications) {
    if (minimatch(relativePath, fileClass.pattern)) {
      classification = { ...classification, ...fileClass.classification };
    }
  }

  return classification;
}

// Compter les lignes dans un fichier
function countFileLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.warn(`Impossible de compter les lignes pour ${filePath}: ${error}`);
    return 0;
  }
}

// Extraire les imports et dépendances d'un fichier TypeScript/JavaScript
function extractDependencies(filePath: string): { imports: string[], exports: string[] } {
  const imports: string[] = [];
  const exports: string[] = [];
  
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(filePath))) {
    return { imports, exports };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Trouver les imports
    const importRegex = /import(?:["'\s]*([\w*{}\n\r\t, ]+)from\s*)?["'\s]*([^"']+)["'\s]*/g;
    let match;
    while (match = importRegex.exec(content)) {
      imports.push(match[2]);
    }
    
    // Trouver les exports
    const exportRegex = /export\s+(?:default\s+)?(?:class|const|function|interface|type|enum|abstract class|var|let)\s+([A-Za-z0-9_$]+)/g;
    while (match = exportRegex.exec(content)) {
      exports.push(match[1]);
    }
    
    return { imports, exports };
  } catch (error) {
    console.warn(`Erreur lors de l'extraction des dépendances de ${filePath}: ${error}`);
    return { imports, exports };
  }
}

// Fonction utilitaire pour le matching de motifs
function minimatch(subject: string, pattern: string): boolean {
  try {
    // Convertir les motifs glob en expressions régulières simples
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(subject);
  } catch (error) {
    console.error(`Erreur lors du matching du motif ${pattern}: ${error}`);
    return false;
  }
}

// Indexer le projet
async function indexProject(): Promise<ProjectIndex> {
  console.log('Indexation du projet...');
  
  const structureMap = loadStructureMap();
  
  // Trouver tous les fichiers
  const files = await glob('**/*', { 
    cwd: BASE_DIR, 
    ignore: EXCLUSION_PATTERNS,
    nodir: true 
  });
  
  // Trouver tous les répertoires
  const directories = await glob('**/', { 
    cwd: BASE_DIR, 
    ignore: EXCLUSION_PATTERNS 
  });
  
  console.log(`Trouvé ${files.length} fichiers et ${directories.length} répertoires.`);
  
  // Collecter les informations sur les fichiers
  const fileInfos: FileInfo[] = [];
  const fileTypeCount: Record<string, number> = {};
  
  for (const file of files) {
    const filePath = path.join(BASE_DIR, file);
    const stats = fs.statSync(filePath);
    const extension = path.extname(file).toLowerCase();
    
    if (fileTypeCount[extension]) {
      fileTypeCount[extension]++;
    } else {
      fileTypeCount[extension] = 1;
    }
    
    const { imports, exports } = extractDependencies(filePath);
    const tags = classifyFile(filePath, structureMap);
    
    fileInfos.push({
      path: filePath,
      relativePath: file,
      size: stats.size,
      extension,
      lastModified: stats.mtime.toISOString(),
      lineCount: countFileLines(filePath),
      imports,
      exports,
      tags,
      layer: tags.layer as any,
      domain: tags.domain,
      status: tags.status as any
    });
  }
  
  // Collecter les informations sur les répertoires
  const directoryInfos: DirectoryInfo[] = [];
  
  for (const dir of directories) {
    const dirPath = path.join(BASE_DIR, dir);
    const stats = fs.statSync(dirPath);
    const filesInDir = fileInfos.filter(file => file.relativePath.startsWith(dir));
    const subDirs = directories.filter(d => d !== dir && d.startsWith(dir));
    
    directoryInfos.push({
      path: dirPath,
      relativePath: dir,
      fileCount: filesInDir.length,
      subDirectoryCount: subDirs.length,
      size: filesInDir.reduce((sum, file) => sum + file.size, 0),
      lastModified: stats.mtime.toISOString(),
      tags: classifyFile(dirPath, structureMap)
    });
  }
  
  // Calculer les relations used_by
  for (const file of fileInfos) {
    file.usedBy = fileInfos
      .filter(f => f.imports && f.imports.some(imp => {
        // Normaliser le chemin d'importation
        let normalizedPath = imp;
        if (imp.startsWith('.')) {
          const importingDir = path.dirname(f.path);
          normalizedPath = path.normalize(path.join(importingDir, imp));
          
          // Ajouter les extensions possibles si elles ne sont pas spécifiées
          if (!path.extname(normalizedPath)) {
            const extensions = ['.ts', '.tsx', '.js', '.jsx'];
            for (const ext of extensions) {
              if (normalizedPath + ext === file.path) {
                return true;
              }
            }
          }
        }
        return normalizedPath === file.path || file.path.includes(normalizedPath);
      }))
      .map(f => f.relativePath);
  }
  
  return {
    files: fileInfos,
    directories: directoryInfos,
    timestamp: new Date().toISOString(),
    totalFiles: fileInfos.length,
    totalDirectories: directoryInfos.length,
    fileTypes: fileTypeCount
  };
}

// Calculer le score de structure
function calculateStructureScore(projectIndex: ProjectIndex): StructureScore {
  console.log('Calcul du score de structure...');
  
  // Calcul du score d'organisation
  const totalFiles = projectIndex.totalFiles;
  const filesWithLayer = projectIndex.files.filter(file => file.layer && file.layer !== 'unknown').length;
  const filesWithDomain = projectIndex.files.filter(file => file.domain && file.domain !== 'unknown').length;
  const filesWithStatus = projectIndex.files.filter(file => file.status && file.status !== 'unknown').length;
  
  const layerConsistencyScore = Math.min(100, (filesWithLayer / totalFiles) * 100);
  const domainCohesionScore = Math.min(100, (filesWithDomain / totalFiles) * 100);
  
  // Calcul du score de redondance
  const backupFiles = projectIndex.files.filter(file => 
    file.relativePath.includes('.backup') || 
    file.relativePath.includes('.bak') || 
    file.relativePath.endsWith('.old')
  );
  
  const versionedFiles = projectIndex.files.filter(file => {
    const filename = path.basename(file.relativePath);
    return /\.v\d+\.\w+$/.test(filename);
  });
  
  const redundancyScore = Math.max(0, 100 - (backupFiles.length + versionedFiles.length) * 5);
  
  // Calcul du score de dépendances
  const orphanedFiles = projectIndex.files.filter(file => 
    (!file.usedBy || file.usedBy.length === 0) && 
    !file.relativePath.endsWith('index.ts') &&
    !file.relativePath.endsWith('index.js') &&
    !file.relativePath.includes('package.json')
  );
  
  const dependencyScore = Math.max(0, 100 - (orphanedFiles.length / totalFiles) * 100);
  
  // Score total
  const organizationScore = (layerConsistencyScore + domainCohesionScore) / 2;
  const totalScore = (organizationScore * 0.5) + (redundancyScore * 0.3) + (dependencyScore * 0.2);
  
  return {
    timestamp: new Date().toISOString(),
    totalScore: Math.round(totalScore),
    metrics: {
      organization: {
        score: Math.round(organizationScore),
        details: {
          layerConsistency: Math.round(layerConsistencyScore),
          domainCohesion: Math.round(domainCohesionScore),
          hierarchyDepth: projectIndex.directories.reduce((max, dir) => Math.max(max, dir.relativePath.split('/').length - 1), 0),
          namingConsistency: Math.round((filesWithStatus / totalFiles) * 100)
        }
      },
      redundancy: {
        score: Math.round(redundancyScore),
        details: {
          duplicateFilesCount: 0, // Sera calculé ultérieurement
          duplicateCodePercentage: 0, // Sera calculé ultérieurement
          backupFilesCount: backupFiles.length,
          versionedFilesCount: versionedFiles.length
        }
      },
      dependencies: {
        score: Math.round(dependencyScore),
        details: {
          circularDependencies: 0, // Nécessite une analyse plus poussée
          orphanedFiles: orphanedFiles.length,
          deadCode: 0 // Nécessite une analyse plus poussée
        }
      }
    }
  };
}

// Générer le rapport de redondance
function generateRedundancyReport(projectIndex: ProjectIndex): RedundancyReport {
  console.log('Génération du rapport de redondance...');
  
  // Trouver les fichiers de backup
  const backupFiles = projectIndex.files
    .filter(file => 
      file.relativePath.includes('.backup') || 
      file.relativePath.includes('.bak') || 
      file.relativePath.endsWith('.old')
    )
    .map(file => file.relativePath);
  
  // Trouver les fichiers versionnés
  const versionedFiles = projectIndex.files
    .filter(file => {
      const filename = path.basename(file.relativePath);
      return /\.v\d+\.\w+$/.test(filename);
    })
    .map(file => file.relativePath);
  
  // Trouver les fichiers en double basés sur leur nom
  const filesByBaseName = projectIndex.files.reduce((acc: Record<string, FileInfo[]>, file) => {
    const baseName = path.basename(file.relativePath).replace(/\.v\d+|\.(backup|bak|old)/g, '');
    if (!acc[baseName]) {
      acc[baseName] = [];
    }
    acc[baseName].push(file);
    return acc;
  }, {});
  
  const duplicateGroups = Object.entries(filesByBaseName)
    .filter(([_, files]) => files.length > 1)
    .map(([name, files]) => ({
      group: files.map(f => f.relativePath),
      similarity: 100, // Supposer une similarité complète basée sur le nom
      type: path.extname(name).slice(1) || 'unknown'
    }));
  
  return {
    timestamp: new Date().toISOString(),
    duplicateFiles: duplicateGroups,
    backupFiles,
    versionedFiles,
    redundantCode: [] // Nécessite une analyse plus poussée
  };
}

// Générer le rapport des fichiers obsolètes
function generateObsoletesReport(projectIndex: ProjectIndex): ObsoletesReport {
  console.log('Génération du rapport des fichiers obsolètes...');
  
  const candidatesForRemoval: ObsoletesReport['candidatesForRemoval'] = [];
  
  // Fichiers de backup sans référence
  projectIndex.files
    .filter(file => 
      (file.relativePath.includes('.backup') || 
      file.relativePath.includes('.bak') || 
      file.relativePath.endsWith('.old')) && 
      (!file.usedBy || file.usedBy.length === 0)
    )
    .forEach(file => {
      candidatesForRemoval.push({
        path: file.relativePath,
        reason: 'Fichier de backup sans référence',
        confidence: 90,
        lastModified: file.lastModified,
        size: file.size,
        usedBy: file.usedBy || []
      });
    });
  
  // Fichiers versionnés anciens
  const filesByBaseName = projectIndex.files.reduce((acc: Record<string, FileInfo[]>, file) => {
    const match = path.basename(file.relativePath).match(/(.+)\.v(\d+)(\.\w+)$/);
    if (match) {
      const [_, baseName, version, ext] = match;
      const key = `${baseName}${ext}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({ ...file, version: parseInt(version, 10) });
    }
    return acc;
  }, {});
  
  Object.entries(filesByBaseName).forEach(([baseName, files]) => {
    if (files.length > 1) {
      // Trier par numéro de version
      files.sort((a, b) => (b.version as number) - (a.version as number));
      
      // Marquer toutes les versions sauf la plus récente comme candidates à la suppression
      files.slice(1).forEach(file => {
        candidatesForRemoval.push({
          path: file.relativePath,
          reason: `Version obsolète (v${file.version}). Version actuelle: v${files[0].version}`,
          confidence: 85,
          lastModified: file.lastModified,
          size: file.size,
          usedBy: file.usedBy || []
        });
      });
    }
  });
  
  // Fichiers orphelins
  projectIndex.files
    .filter(file => 
      (!file.usedBy || file.usedBy.length === 0) && 
      file.status !== 'active' &&
      !file.relativePath.endsWith('index.ts') &&
      !file.relativePath.endsWith('index.js') &&
      !file.relativePath.includes('package.json') &&
      !file.relativePath.includes('tsconfig.json') &&
      !file.relativePath.includes('README')
    )
    .forEach(file => {
      candidatesForRemoval.push({
        path: file.relativePath,
        reason: 'Fichier orphelin, non référencé dans le projet',
        confidence: 70,
        lastModified: file.lastModified,
        size: file.size,
        usedBy: file.usedBy || []
      });
    });
  
  return {
    timestamp: new Date().toISOString(),
    candidatesForRemoval
  };
}

// Point d'entrée principal
(async function main() {
  try {
    console.log('=== Indexation du projet MCP OS ===');
    
    // 1. Indexation du projet
    const projectIndex = await indexProject();
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'project_index.json'),
      JSON.stringify(projectIndex, null, 2)
    );
    console.log('✅ Index du projet généré: project_index.json');
    
    // 2. Calcul du score de structure
    const structureScore = calculateStructureScore(projectIndex);
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'structure_score.json'),
      JSON.stringify(structureScore, null, 2)
    );
    console.log('✅ Score de structure généré: structure_score.json');
    
    // 3. Génération du rapport de redondance
    const redundancyReport = generateRedundancyReport(projectIndex);
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'redundancy_report.json'),
      JSON.stringify(redundancyReport, null, 2)
    );
    console.log('✅ Rapport de redondance généré: redundancy_report.json');
    
    // 4. Génération du rapport des fichiers obsolètes
    const obsoletesReport = generateObsoletesReport(projectIndex);
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'obsoletes.json'),
      JSON.stringify(obsoletesReport, null, 2)
    );
    console.log('✅ Rapport des fichiers obsolètes généré: obsoletes.json');
    
    console.log('\n=== Résumé ===');
    console.log(`Total de fichiers indexés: ${projectIndex.totalFiles}`);
    console.log(`Total de répertoires: ${projectIndex.totalDirectories}`);
    console.log(`Score de structure: ${structureScore.totalScore}/100`);
    console.log(`Fichiers en double potentiels: ${redundancyReport.duplicateFiles.length}`);
    console.log(`Candidats pour suppression: ${obsoletesReport.candidatesForRemoval.length}`);
    
  } catch (error) {
    console.error(`Erreur lors de l'indexation du projet: ${error}`);
    process.exit(1);
  }
})();