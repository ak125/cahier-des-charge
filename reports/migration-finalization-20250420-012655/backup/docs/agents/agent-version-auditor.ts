import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

/**
 * Agent Version Auditor
 * 
 * Cet outil permet de :
 * - Détecter les doublons d'agents (v1, v2, .backup, etc.)
 * - Calculer un score de versionnement
 * - Générer des recommandations pour consolider les versions
 */

interface AgentInfo {
  path: string;
  name: string;
  version: string;
  createdAt: string;
  modifiedAt: string;
  sizeBytes: number;
  isBackup: boolean;
  type: string;
}

interface AgentGroup {
  baseName: string;
  type: string;
  versions: AgentInfo[];
  hasDuplicates: boolean;
  versionScore: number;
}

interface AuditResult {
  timestamp: string;
  agentCount: number;
  uniqueAgentCount: number;
  duplicateAgentCount: number;
  globalVersionScore: number;
  agentGroups: AgentGroup[];
  recommendations: {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  };
}

// Extraire les informations d'un fichier agent
function extractAgentInfo(filePath: string): AgentInfo {
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const extension = path.extname(fileName);
  const nameWithoutExt = fileName.replace(extension, '');

  // Déterminer si c'est un fichier de sauvegarde
  const isBackup = /\.(backup|bak|old)$/.test(nameWithoutExt);

  // Extraire la version (v1, v2, etc.)
  const versionMatch = nameWithoutExt.match(/\.v(\d+)$/);
  const version = versionMatch ? versionMatch[1] : isBackup ? 'backup' : 'current';

  // Nom de base (sans version ni backup)
  let baseName = nameWithoutExt
    .replace(/\.v\d+$/, '')
    .replace(/\.(backup|bak|old)$/, '');

  // Déterminer le type d'agent
  let agentType = 'unknown';
  if (baseName.includes('analyzer')) agentType = 'analyzer';
  else if (baseName.includes('generator')) agentType = 'generator';
  else if (baseName.includes('migration')) agentType = 'migration';
  else if (baseName.includes('orchestrator')) agentType = 'orchestrator';
  else if (baseName.includes('agent')) agentType = 'agent';
  else if (baseName.includes('bridge')) agentType = 'bridge';
  else if (baseName.includes('adapter')) agentType = 'adapter';

  return {
    path: filePath,
    name: baseName,
    version,
    createdAt: stats.birthtime.toISOString(),
    modifiedAt: stats.mtime.toISOString(),
    sizeBytes: stats.size,
    isBackup,
    type: agentType
  };
}

// Calculer le score de versionnement pour un groupe d'agents
function calculateVersionScore(agents: AgentInfo[]): number {
  if (agents.length <= 1) return 100; // Pas de duplication = score parfait
  
  const hasBackup = agents.some(a => a.isBackup);
  const versionCount = new Set(agents.map(a => a.version)).size;
  const hasMultipleVersions = versionCount > 1;
  const fileCount = agents.length;
  
  // Facteurs de pénalité
  const backupPenalty = hasBackup ? 20 : 0;
  const versionCountPenalty = Math.max(0, (fileCount - versionCount) * 15);
  const filePenalty = Math.max(0, (fileCount - 1) * 10);
  
  // Score de base diminué par les pénalités
  const baseScore = 100;
  const score = Math.max(0, baseScore - backupPenalty - versionCountPenalty - filePenalty);
  
  return score;
}

// Générer des recommandations pour un groupe d'agents
function generateRecommendations(group: AgentGroup): string[] {
  const recommendations: string[] = [];
  
  if (group.versions.length <= 1) {
    return recommendations; // Pas de recommandations nécessaires
  }
  
  const backups = group.versions.filter(a => a.isBackup);
  const versioned = group.versions.filter(a => /^\d+$/.test(a.version));
  const current = group.versions.filter(a => a.version === 'current');
  
  // S'il y a des fichiers de sauvegarde
  if (backups.length > 0) {
    recommendations.push(
      `Supprimer les fichiers de sauvegarde pour ${group.baseName}: ${backups.map(a => path.basename(a.path)).join(', ')}`
    );
  }
  
  // S'il y a plusieurs versions numérotées
  if (versioned.length > 1) {
    // Trouver la version la plus récente
    const sortedVersions = [...versioned].sort((a, b) => {
      const versionA = parseInt(a.version);
      const versionB = parseInt(b.version);
      return versionB - versionA; // Tri descendant
    });
    
    const latestVersion = sortedVersions[0];
    const olderVersions = sortedVersions.slice(1);
    
    recommendations.push(
      `Consolider les versions de ${group.baseName} en utilisant la version ${latestVersion.version} comme référence`
    );
    
    if (olderVersions.length > 0) {
      recommendations.push(
        `Archiver ou supprimer les anciennes versions: ${olderVersions.map(a => path.basename(a.path)).join(', ')}`
      );
    }
  }
  
  // S'il y a plusieurs fichiers "current" (sans numéro de version)
  if (current.length > 1) {
    // Trouver le plus récent par date de modification
    const sortedByDate = [...current].sort(
      (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    );
    
    const mostRecent = sortedByDate[0];
    const older = sortedByDate.slice(1);
    
    recommendations.push(
      `Plusieurs versions actives de ${group.baseName} détectées. Utiliser la plus récente (${path.basename(mostRecent.path)})`
    );
    
    if (older.length > 0) {
      recommendations.push(
        `Versionner ou supprimer les autres versions: ${older.map(a => path.basename(a.path)).join(', ')}`
      );
    }
  }
  
  return recommendations;
}

// Fonction principale d'audit
async function auditAgentVersions(baseDir: string): Promise<AuditResult> {
  console.log('Analyse des versions d\'agents...');
  
  // Trouver tous les fichiers d'agents
  const agentFiles = glob.sync([
    `${baseDir}/agents/**/*.{ts,js}`,
    `${baseDir}/packagesDoDotmcp-agents/**/*.{ts,js}`,
    `${baseDir}/tools/**/*agent*.{ts,js}`,
    `${baseDir}/tools/**/*analyzer*.{ts,js}`,
    `${baseDir}/tools/**/*generator*.{ts,js}`,
    `${baseDir}/src/**/*agent*.{ts,js}`
  ], { ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] });
  
  // Extraire les informations de chaque agent
  const agents = agentFiles.map(extractAgentInfo);
  
  // Regrouper les agents par nom de base
  const groupsMap = new Map<string, AgentInfo[]>();
  
  for (const agent of agents) {
    const key = `${agent.name}-${agent.type}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(agent);
  }
  
  // Créer les groupes d'agents avec leur score de versionnement
  const agentGroups: AgentGroup[] = [];
  let duplicateAgentCount = 0;
  
  for (const [key, groupAgents] of groupsMap.entries()) {
    const [baseName, type] = key.split('-');
    const hasDuplicates = groupAgents.length > 1;
    
    if (hasDuplicates) {
      duplicateAgentCount += groupAgents.length - 1;
    }
    
    const versionScore = calculateVersionScore(groupAgents);
    
    agentGroups.push({
      baseName,
      type,
      versions: groupAgents,
      hasDuplicates,
      versionScore
    });
  }
  
  // Trier les groupes par score de versionnement (croissant)
  agentGroups.sort((a, b) => a.versionScore - b.versionScore);
  
  // Calculer le score global de versionnement
  const totalAgents = agents.length;
  const uniqueAgentCount = agentGroups.length;
  
  const globalVersionScore = agentGroups.reduce(
    (sum, group) => sum + group.versionScore,
    0
  ) / Math.max(1, agentGroups.length);
  
  // Générer les recommandations
  const allRecommendations = agentGroups
    .filter(group => group.hasDuplicates)
    .flatMap(group => generateRecommendations(group).map(rec => ({ group, recommendation: rec })));
  
  // Classer les recommandations par priorité
  const highPriority = allRecommendations
    .filter(({ group }) => group.versionScore < 50)
    .map(({ recommendation }) => recommendation);
  
  const mediumPriority = allRecommendations
    .filter(({ group }) => group.versionScore >= 50 && group.versionScore < 75)
    .map(({ recommendation }) => recommendation);
  
  const lowPriority = allRecommendations
    .filter(({ group }) => group.versionScore >= 75)
    .map(({ recommendation }) => recommendation);
  
  // Résultat de l'audit
  const auditResult: AuditResult = {
    timestamp: new Date().toISOString(),
    agentCount: totalAgents,
    uniqueAgentCount,
    duplicateAgentCount,
    globalVersionScore,
    agentGroups,
    recommendations: {
      highPriority,
      mediumPriority,
      lowPriority
    }
  };
  
  return auditResult;
}

// Exécuter l'audit et sauvegarder les résultats
async function main() {
  try {
    // Chemin de base
    const baseDir = process.cwd();
    
    // Exécuter l'audit
    const result = await auditAgentVersions(baseDir);
    
    // Afficher un résumé
    console.log('\n=== Résumé de l\'audit de versions d\'agents ===');
    console.log(`Nombre total d'agents: ${result.agentCount}`);
    console.log(`Agents uniques: ${result.uniqueAgentCount}`);
    console.log(`Agents dupliqués: ${result.duplicateAgentCount}`);
    console.log(`Score global de versionnement: ${result.globalVersionScore.toFixed(2)}/100`);
    
    // Afficher les recommandations prioritaires
    if (result.recommendations.highPriority.length > 0) {
      console.log('\n⚠️ Recommandations prioritaires:');
      result.recommendations.highPriority.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    // Créer le répertoire de rapports s'il n'existe pas
    const reportsDir = path.join(baseDir, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Sauvegarder le rapport complet
    const reportPath = path.join(reportsDir, 'agent_version_audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    console.log(`\nRapport complet sauvegardé dans: ${reportPath}`);
    
  } catch (error) {
    console.error('Erreur lors de l\'audit des versions d\'agents:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

// Exporter les fonctions pour les tests
export {
  auditAgentVersions,
  extractAgentInfo,
  calculateVersionScore,
  generateRecommendations
};