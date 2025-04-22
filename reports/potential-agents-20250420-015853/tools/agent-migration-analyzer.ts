/**
 * Script d'analyse et migration des agents MCP
 * 
 * Ce script permet de :
 * 1. Analyser tous les fichiers agents dans le projet
 * 2. Identifier les meilleures versions de chaque agent
 * 3. Proposer une migration vers la structure unifiée
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface AgentFile {
  path: string;
  name: string;
  type: string;
  modifiedDate: Date;
  lines: number;
  imports: string[];
  exports: string[];
}

interface MigrationRecommendation {
  agentType: string;
  bestVersion: AgentFile;
  otherVersions: AgentFile[];
  targetPath: string;
}

// Dossiers à analyser pour trouver des agents
const searchDirectories = [
  './agents',
  './packagesDoDotmcp-agents',
  './legacy',
  './docs/agents',
  './src/business'
];

// Types d'agents à rechercher
const agentTypes = [
  { name: 'PhpAnalyzer', type: 'analyzer' },
  { name: 'MysqlAnalyzer', type: 'analyzer' },
  { name: 'SqlAnalyzer', type: 'analyzer' },
  { name: 'htaccess-analyzer', type: 'analyzer' },
  { name: 'HtaccessRouterAnalyzer', type: 'analyzer' },
  { name: 'SeoChecker', type: 'validator' },
  { name: 'CanonicalValidator', type: 'validator' },
  { name: 'QaAnalyzer', type: 'analyzer' },
  { name: 'RemixGenerator', type: 'generator' },
  { name: 'NestjsGenerator', type: 'generator' },
  { name: 'PrismaGenerator', type: 'generator' },
  { name: 'ComponentGenerator', type: 'generator' },
  { name: 'CoordinatorAgent', type: 'orchestrator' },
  { name: 'SelectorAgent', type: 'orchestrator' },
  { name: 'BullmqOrchestrator', type: 'orchestrator' },
  { name: DotMcpIntegrator', type: 'orchestrator' },
];

// Analyse un fichier d'agent
function analyzeAgentFile(filePath: string, agentType: string, agentCategory: string): AgentFile | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    // Extraire les imports
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let importMatch;
    
    while ((importMatch = importRegex.exec(content)) !== null) {
      imports.push(importMatch[1]);
    }
    
    // Extraire les exports
    const exportRegex = /export\s+(class|interface|type|const|function)\s+([a-zA-Z0-9_]+)/g;
    const exports: string[] = [];
    let exportMatch;
    
    while ((exportMatch = exportRegex.exec(content)) !== null) {
      exports.push(exportMatch[2]);
    }
    
    return {
      path: filePath,
      name: path.basename(filePath),
      type: agentCategory,
      modifiedDate: stats.mtime,
      lines: content.split('\n').length,
      imports,
      exports
    };
  } catch (error) {
    console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
    return null;
  }
}

// Trouver tous les fichiers correspondant à un motif d'agent
function findAgentFiles(agentTypePattern: string): string[] {
  try {
    const cmd = `find ${searchDirectories.join(' ')} -type f -name "*${agentTypePattern}*.ts" | grep -v "node_modules" | grep -v ".test.ts" | grep -v ".d.ts" | sort`;
    const output = execSync(cmd).toString();
    return output.trim().split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error(`Erreur lors de la recherche de fichiers pour ${agentTypePattern}:`, error);
    return [];
  }
}

// Proposer une migration pour un type d'agent
function generateMigrationRecommendation(agentTypeInfo: { name: string, type: string }): MigrationRecommendation | null {
  const { name: agentTypePattern, type: agentCategory } = agentTypeInfo;
  const files = findAgentFiles(agentTypePattern);
  
  if (files.length === 0) {
    console.log(`Aucun fichier trouvé pour l'agent ${agentTypePattern}`);
    return null;
  }
  
  console.log(`\n===== Agent: ${agentTypePattern} (${files.length} fichiers trouvés) =====`);
  
  // Analyser chaque fichier
  const agentFiles: AgentFile[] = files
    .map(file => analyzeAgentFile(file, agentTypePattern, agentCategory))
    .filter((file): file is AgentFile => file !== null);
  
  if (agentFiles.length === 0) {
    console.log(`Aucun fichier analysable trouvé pour l'agent ${agentTypePattern}`);
    return null;
  }
  
  // Trouver la meilleure version (basée sur la date de modification et le nombre de lignes)
  const bestVersion = agentFiles
    .sort((a, b) => {
      // D'abord trier par date de modification (plus récent = meilleur)
      const dateCompare = b.modifiedDate.getTime() - a.modifiedDate.getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // En cas d'égalité, préférer le fichier avec le plus de lignes
      return b.lines - a.lines;
    })[0];
  
  // Les autres versions
  const otherVersions = agentFiles.filter(file => file.path !== bestVersion.path);
  
  // Chemin cible pour la migration
  const targetPath = `packagesDoDotmcp-agents/business/${agentCategory}s/${agentTypePattern}`;
  
  console.log(`Meilleure version trouvée: ${bestVersion.path}`);
  console.log(`  - Date de modification: ${bestVersion.modifiedDate}`);
  console.log(`  - Nombre de lignes: ${bestVersion.lines}`);
  console.log(`  - Exports: ${bestVersion.exports.join(', ')}`);
  console.log(`Chemin cible proposé: ${targetPath}`);
  
  return {
    agentType: agentTypePattern,
    bestVersion,
    otherVersions,
    targetPath
  };
}

// Effectuer la migration d'un agent
function migrateAgent(recommendation: MigrationRecommendation, dryRun: boolean = true): void {
  const { bestVersion, targetPath } = recommendation;
  
  console.log(`\n>>> Migration de l'agent ${recommendation.agentType}`);
  
  // Créer le dossier cible
  if (!dryRun) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  console.log(`[${dryRun ? 'DRY RUN' : 'EXEC'}] Création du dossier: ${targetPath}`);
  
  // Copier le fichier
  const targetFilePath = path.join(targetPath, 'index.ts');
  if (!dryRun) {
    fs.copyFileSync(bestVersion.path, targetFilePath);
  }
  console.log(`[${dryRun ? 'DRY RUN' : 'EXEC'}] Copie: ${bestVersion.path} -> ${targetFilePath}`);
  
  // Créer un fichier package.json de base si nécessaire
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (!dryRun && !fs.existsSync(packageJsonPath)) {
    const packageData = {
      name: `DoDotmcp/${recommendation.agentType}`,
      version: '1.0.0',
      description: `Agent MCP ${recommendation.agentType}`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        test: 'jest'
      },
      dependencies: {},
      devDependencies: {}
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
  }
  console.log(`[${dryRun ? 'DRY RUN' : 'EXEC'}] Création du package.json: ${packageJsonPath}`);
}

// Point d'entrée principal
async function main() {
  console.log('Analyse et migration des agents MCP');
  console.log('===================================\n');
  
  const recommendations: MigrationRecommendation[] = [];
  
  for (const agentTypeInfo of agentTypes) {
    const recommendation = generateMigrationRecommendation(agentTypeInfo);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }
  
  // Résumé
  console.log('\nRésumé des recommandations de migration:');
  console.log('=====================================\n');
  
  for (const recommendation of recommendations) {
    console.log(`${recommendation.agentType}: ${recommendation.bestVersion.path} -> ${recommendation.targetPath}`);
  }
  
  // Option d'exécution
  console.log('\nExécuter la migration (dry run par défaut):');
  console.log('Pour exécuter réellement la migration, ajoutez le paramètre --exec');
  
  const dryRun = !process.argv.includes('--exec');
  
  console.log(`\nMode: ${dryRun ? 'DRY RUN' : 'EXÉCUTION RÉELLE'}\n`);
  
  // Exécuter les migrations
  for (const recommendation of recommendations) {
    migrateAgent(recommendation, dryRun);
  }
  
  console.log('\nAnalyse et recommandations terminées.');
  if (dryRun) {
    console.log('Pour exécuter la migration réelle, relancez avec le paramètre --exec');
  }
}

// Exécuter le script
main().catch(console.error);