/**
 * agent-version-auditor.ts
 * 
 * Outil d'audit des versions d'agents
 * 
 * Détecte:
 * - Les doublons (v1, v2, .backup)
 * - Les agents obsolètes
 * - Les incohérences de versionnage
 * 
 * Génère:
 * - score_versioning.json: Score de qualité du versionnage
 * - agent_versions.json: Inventaire des versions d'agents
 */

import * as fs from fs-extrastructure-agent';
import * as path from pathstructure-agent';
import * as glob from globstructure-agent';
import { execSync } from child_processstructure-agent';

// Constantes
const WORKSPACE_ROOT = process.cwd();
const REPORT_DIR = path.join(WORKSPACE_ROOT, 'reports');
const AGENTS_DIR = path.join(WORKSPACE_ROOT, 'agents');
const PACKAGES_DIR = path.join(WORKSPACE_ROOT, 'packages');

// Utilitaires d'affichage
const logger = {
  info: (msg: string) => console.log(`\x1b[36mINFO\x1b[0m: ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33mWARN\x1b[0m: ${msg}`),
  error: (msg: string) => console.log(`\x1b[31mERROR\x1b[0m: ${msg}`),
  success: (msg: string) => console.log(`\x1b[32mSUCCESS\x1b[0m: ${msg}`)
};

// Types
interface AgentFile {
  name: string;
  path: string;
  relativePath: string;
  version: string | null;
  lastModified: string;
  size: number;
  versionIndicators: {
    inFilename: boolean;
    inCode: boolean;
    explicit: boolean;
  };
  content?: {
    classDefinition?: string;
    versionDeclaration?: string;
  };
  status: 'active' | 'deprecated' | 'backup' | 'v1' | 'v2' | 'unknown';
}

interface AgentGroup {
  baseName: string;
  files: AgentFile[];
  versions: string[];
  hasBackup: boolean;
  hasMultipleVersions: boolean;
  hasActiveVersion: boolean;
  usageCounts: Record<string, number>;
  newestFile: AgentFile;
}

interface VersioningScore {
  overall: number;
  byCategory: {
    consistentVersioning: number;
    backupCleanliness: number;
    duplicateReduction: number;
    explicitVersionDeclaration: number;
  };
  problemAreas: {
    inconsistentVersions: string[];
    unnecessaryBackups: string[];
    duplicates: string[];
    missingVersions: string[];
  };
}

/**
 * Analyse un fichier d'agent
 */
async function analyzeAgentFile(filePath: string): Promise<AgentFile> {
  const stats = await fs.stat(filePath);
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const relativePath = path.relative(WORKSPACE_ROOT, filePath);
  const fileName = path.basename(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  
  // Détection de version dans le nom de fichier
  const versionInFilename = baseName.match(/[._-]?v(\d+)(?:[._-]|$)|[._-]backup/i);
  
  // Détection de version dans le code
  const versionLineMatch = content.match(/version\s*(?:=|:)\s*['"]([\d.]+)['"]/);
  const explicitVersionMatch = content.match(/\/\*\s*@version\s*:\s*([\d.]+)/i);
  
  // Extrait la classe principale 
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  
  // Déterminer le statut du fichier
  let status: AgentFile['status'] = 'active';
  
  if (baseName.includes('.backup') || baseName.endsWith('_backup')) {
    status = 'backup';
  } else if (baseName.includes('.v1') || baseName.endsWith('_v1')) {
    status = 'v1';
  } else if (baseName.includes('.v2') || baseName.endsWith('_v2')) {
    status = 'v2';
  } else if (content.includes('@deprecated') || fileName.includes('legacy') || 
             filePath.includes('/legacy/')) {
    status = 'deprecated';
  }
  
  // Détermine la version
  let version = explicitVersionMatch 
    ? explicitVersionMatch[1] 
    : versionLineMatch
      ? versionLineMatch[1]
      : versionInFilename 
        ? versionInFilename[1] 
        : null;
  
  // Parse le nom
  const nameMatch = classMatch ? classMatch[1] : baseName;
  
  return {
    name: nameMatch,
    path: filePath,
    relativePath,
    version,
    lastModified: stats.mtime.toISOString(),
    size: stats.size,
    versionIndicators: {
      inFilename: !!versionInFilename,
      inCode: !!versionLineMatch,
      explicit: !!explicitVersionMatch
    },
    content: {
      classDefinition: classMatch ? classMatch[0] : undefined,
      versionDeclaration: versionLineMatch ? versionLineMatch[0] : undefined
    },
    status
  };
}

/**
 * Regroupe les agents par nom de base (sans suffixe de version)
 */
function groupAgentsByBaseName(agents: AgentFile[]): AgentGroup[] {
  // Fonction pour déterminer le nom de base
  function getBaseName(fileName: string): string {
    // Enlever les suffixes de version courants (v1, v2, .backup, etc.)
    return fileName
      .replace(/[._-]?v\d+(?:[._-]|$)/i, '')
      .replace(/[._-]backup$/i, '')
      .replace(/[._-]old$/i, '')
      .replace(/[._-]new$/i, '');
  }
  
  // Regrouper les agents
  const groupMap = new Map<string, AgentFile[]>();
  
  for (const agent of agents) {
    const baseName = getBaseName(agent.name);
    if (!groupMap.has(baseName)) {
      groupMap.set(baseName, []);
    }
    groupMap.get(baseName)?.push(agent);
  }
  
  // Convertir la map en tableau de groupes
  return Array.from(groupMap.entries()).map(([baseName, files]) => {
    // Trier les fichiers par date de modification (plus récent en premier)
    files.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    
    // Extraire les versions uniques
    const versions = Array.from(new Set(
      files
        .map(f => f.version)
        .filter(v => v !== null) as string[]
    ));
    
    // Vérifier les statuts
    const hasBackup = files.some(f => f.status === 'backup');
    const hasMultipleVersions = versions.length > 1 || files.length > 1;
    const hasActiveVersion = files.some(f => f.status === 'active');
    
    // Compter les utilisations
    const usageCounts: Record<string, number> = {};
    for (const file of files) {
      try {
        const count = parseInt(
          execSync(DoDoDoDotgit grep -l "${file.name}" --exclude="${path.basename(file.path)}" | wc -l`, 
                  { encoding: 'utf8' }).trim(),
          10
        );
        usageCounts[file.relativePath] = count;
      } catch (error) {
        usageCounts[file.relativePath] = 0;
      }
    }
    
    return {
      baseName,
      files,
      versions,
      hasBackup,
      hasMultipleVersions,
      hasActiveVersion,
      usageCounts,
      newestFile: files[0] // Premier fichier (le plus récent)
    };
  });
}

/**
 * Calcule le score de versionnage
 */
function calculateVersioningScore(groups: AgentGroup[]): VersioningScore {
  // Compteurs pour problèmes
  const inconsistentVersions: string[] = [];
  const unnecessaryBackups: string[] = [];
  const duplicates: string[] = [];
  const missingVersions: string[] = [];
  
  // Analyser chaque groupe
  for (const group of groups) {
    // Versions incohérentes
    if (group.hasMultipleVersions && !group.versions.every(v => v.startsWith('1.') || v.startsWith('2.'))) {
      inconsistentVersions.push(group.baseName);
    }
    
    // Sauvegardes inutiles
    if (group.hasBackup && group.files.length > 2) {
      unnecessaryBackups.push(group.baseName);
    }
    
    // Doublons
    if (group.files.length > 1 && !group.versions.length) {
      duplicates.push(group.baseName);
    }
    
    // Versions manquantes
    if (!group.versions.length) {
      missingVersions.push(group.baseName);
    }
  }
  
  // Calculer les scores
  const totalAgents = groups.length;
  const consistentVersioning = totalAgents > 0 
    ? 100 - (inconsistentVersions.length / totalAgents) * 100 
    : 100;
    
  const backupCleanliness = totalAgents > 0 
    ? 100 - (unnecessaryBackups.length / totalAgents) * 100 
    : 100;
    
  const duplicateReduction = totalAgents > 0 
    ? 100 - (duplicates.length / totalAgents) * 100 
    : 100;
    
  const explicitVersionDeclaration = totalAgents > 0 
    ? 100 - (missingVersions.length / totalAgents) * 100 
    : 100;
  
  // Score global avec pondération
  const overall = (
    consistentVersioning * 0.3 + 
    backupCleanliness * 0.2 + 
    duplicateReduction * 0.3 + 
    explicitVersionDeclaration * 0.2
  );
  
  return {
    overall,
    byCategory: {
      consistentVersioning,
      backupCleanliness,
      duplicateReduction,
      explicitVersionDeclaration
    },
    problemAreas: {
      inconsistentVersions,
      unnecessaryBackups,
      duplicates,
      missingVersions
    }
  };
}

/**
 * Fonction principale
 */
async function main() {
  logger.info('Audit des versions d\'agents...');
  
  // Créer le répertoire de rapports
  await fs.ensureDir(REPORT_DIR);
  
  // Trouver tous les fichiers d'agents
  const agentPatterns = [
    `${AGENTS_DIR}/**/*.{ts,js}`,
    `${PACKAGES_DIR}DoDotmcp-agents/**/*.{ts,js}`
  ];
  
  const agentFiles: string[] = [];
  agentPatterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['**/*.{spec,test}.{ts,js}', '**/node_modules/**'] });
    agentFiles.push(...files);
  });
  
  logger.info(`${agentFiles.length} fichiers d'agents trouvés.`);
  
  // Analyser chaque fichier
  const analysisPromises = agentFiles.map(analyzeAgentFile);
  const analyses = await Promise.all(analysisPromises);
  
  // Regrouper par nom de base
  const groups = groupAgentsByBaseName(analyses);
  
  logger.info(`${groups.length} agents uniques identifiés.`);
  
  // Calculer le score de versionnage
  const versioningScore = calculateVersioningScore(groups);
  
  // Générer le rapport
  const duplicatesReport = groups
    .filter(g => g.hasMultipleVersions)
    .map(group => ({
      baseName: group.baseName,
      files: group.files.map(f => ({
        path: f.relativePath,
        version: f.version,
        status: f.status,
        lastModified: f.lastModified,
        usageCount: group.usageCounts[f.relativePath] || 0
      })),
      recommendedAction: group.files.length > 2 
        ? 'Supprimer les anciennes versions non utilisées' 
        : 'Consolider vers une seule version'
    }));
  
  // Générer les rapports JSON
  await fs.writeJson(path.join(REPORT_DIR, 'agent_versions.json'), {
    timestamp: new Date().toISOString(),
    totalAgentsCount: analyses.length,
    uniqueAgentsCount: groups.length,
    duplicateCandidates: groups.filter(g => g.files.length > 1).length,
    agents: groups.map(g => ({
      name: g.baseName,
      files: g.files.map(f => ({
        path: f.relativePath,
        version: f.version,
        status: f.status,
        lastModified: f.lastModified
      })),
      versions: g.versions,
      hasBackup: g.hasBackup,
      hasMultipleVersions: g.hasMultipleVersions
    }))
  }, { spaces: 2 });
  
  await fs.writeJson(path.join(REPORT_DIR, 'score_versioning.json'), versioningScore, { spaces: 2 });
  
  // Afficher le résumé
  logger.success(`Score global de versionnage: ${versioningScore.overall.toFixed(2)}/100`);
  logger.info(`Doublons détectés: ${versioningScore.problemAreas.duplicates.length}`);
  logger.info(`Sauvegardes inutiles: ${versioningScore.problemAreas.unnecessaryBackups.length}`);
  logger.info(`Versions incohérentes: ${versioningScore.problemAreas.inconsistentVersions.length}`);
  logger.info(`Versions manquantes: ${versioningScore.problemAreas.missingVersions.length}`);
  
  logger.success(`Rapports générés:`);
  logger.info(`- ${path.join(REPORT_DIR, 'agent_versions.json')}`);
  logger.info(`- ${path.join(REPORT_DIR, 'score_versioning.json')}`);
}

// Exécuter la fonction principale
main().catch(error => {
  logger.error(`Erreur lors de l'audit des versions d'agents: ${error.message}`);
  process.exit(1);
});