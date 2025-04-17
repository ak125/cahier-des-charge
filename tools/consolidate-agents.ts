/**
 * consolidate-agents.ts
 * 
 * Outil pour consolider les agents MCP dans une architecture à trois couches
 * 
 * Cet outil analyse les agents redondants, détermine la "source de vérité"
 * pour chaque agent et réorganise le code dans une structure à trois couches:
 * - Orchestration: gestion des workflows, coordination de haut niveau
 * - Coordination: enregistrement des agents, logs, propagation de statut
 * - Business: agents analytiques, générateurs, stratégies
 * 
 * Usage: npx ts-node consolidate-agents.ts [options]
 * 
 * Options:
 *   --dry-run           Simulation sans modification de fichiers
 *   --threshold=<n>     Seuil de redondance minimum (défaut: 3.0)
 *   --top=<n>           Limiter aux n agents les plus redondants
 *   --organize-by-layer Organiser par couche (orchestration, coordination, business)
 *   --update-imports    Mettre à jour automatiquement les imports
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { glob } from 'glob';
import { execSync } from 'child_process';

// Types pour les fichiers de structure et de rapport
interface ConsolidationReport {
  totalAgentsConsolidated: number;
  layerStats: Record<string, number>;
  typeStats: Record<string, number>;
  plans: Array<ConsolidationPlan>;
  timestamp: string;
}

interface ConsolidationPlan {
  agentName: string;
  sourceOfTruth: string;
  destinationPath: string;
  archivedFiles: number;
}

interface AgentConsolidation {
  agentName: string;
  mainFile: string;
  recommendedAction: 'CONSOLIDATION_URGENTE' | 'REVUE_RECOMMANDEE';
  files: AgentFile[];
}

interface AgentFile {
  path: string;
  isBackup: boolean;
  isVersioned: boolean;
  version: string | null;
  lastModified: string;
  lineCount: number;
}

interface StructureMap {
  version: string;
  updated: string;
  taxonomySchema: {
    layer: TaxonomyField;
    domain: TaxonomyField;
    status: TaxonomyField;
  };
  defaultClassification: FileClassification;
  folderClassifications: PatternClassification[];
  fileClassifications: PatternClassification[];
}

interface TaxonomyField {
  description: string;
  values: string[];
}

interface FileClassification {
  layer: string;
  domain: string;
  status: string;
}

interface PatternClassification {
  pattern: string;
  classification: Partial<FileClassification>;
}

// Configuration et constantes
const BASE_DIR = process.cwd();
const AGENT_AUDIT_PATH = path.join(BASE_DIR, 'reports', 'agent_consolidation_plan.json');
const STRUCTURE_MAP_PATH = path.join(BASE_DIR, 'structure-map.json');
const OUTPUT_REPORT_PATH = path.join(BASE_DIR, 'reports', 'consolidation-report.json');
const LEGACY_DIR = path.join(BASE_DIR, 'legacy');
const SRC_DIR = path.join(BASE_DIR, 'src');

// Créer les dossiers nécessaires s'ils n'existent pas
const ensureDirectories = () => {
  [
    path.join(BASE_DIR, 'reports'),
    path.join(SRC_DIR, 'orchestration'),
    path.join(SRC_DIR, 'coordination'),
    path.join(SRC_DIR, 'business'),
    path.join(SRC_DIR, 'core', 'interfaces'),
    LEGACY_DIR
  ].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Charger le rapport d'audit des agents
const loadAgentAudit = (): AgentConsolidation[] => {
  if (!fs.existsSync(AGENT_AUDIT_PATH)) {
    console.error(`Le fichier d'audit d'agents ${AGENT_AUDIT_PATH} est introuvable`);
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(AGENT_AUDIT_PATH, 'utf8'));
  } catch (error) {
    console.error(`Erreur lors de la lecture du rapport d'audit: ${error}`);
    process.exit(1);
  }
};

// Charger la structure map
const loadStructureMap = (): StructureMap => {
  if (!fs.existsSync(STRUCTURE_MAP_PATH)) {
    console.error(`Le fichier structure-map ${STRUCTURE_MAP_PATH} est introuvable`);
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(STRUCTURE_MAP_PATH, 'utf8'));
  } catch (error) {
    console.error(`Erreur lors de la lecture de la structure map: ${error}`);
    process.exit(1);
  }
};

// Déterminer la classification d'un fichier selon la structure map
const classifyFile = (filePath: string, structureMap: StructureMap): FileClassification => {
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
};

// Détermine le type d'agent à partir de son nom et de son chemin
const determineAgentType = (agentName: string, filePath: string): string => {
  const lowerName = agentName.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  
  // Détecter les types spécifiques
  if (lowerName.includes('analyzer') || lowerPath.includes('analyzer') || lowerName.includes('analyseur')) {
    return 'analyzer';
  } else if (lowerName.includes('generator') || lowerPath.includes('generator') || lowerName.includes('générateur')) {
    return 'generator';
  } else if (lowerName.includes('validator') || lowerPath.includes('validator') || lowerName.includes('validateur')) {
    return 'validator';
  } else if (lowerName.includes('parser') || lowerPath.includes('parser') || lowerName.includes('parseur')) {
    return 'parser';
  } else if (lowerName.includes('orchestrator') || lowerPath.includes('orchestrator') || lowerName.includes('orchestrateur')) {
    return 'orchestrator';
  } else if (lowerName.includes('monitor') || lowerPath.includes('monitor') || lowerName.includes('moniteur')) {
    return 'monitor';
  } else if (lowerName.includes('bridge') || lowerPath.includes('bridge') || lowerName.includes('pont')) {
    return 'bridge';
  } else if (lowerName.includes('adapter') || lowerPath.includes('adapter') || lowerName.includes('adaptateur')) {
    return 'adapter';
  }
  
  return 'agent';
};

// Détermine le domaine d'un agent à partir de son nom et de son chemin
const determineAgentDomain = (agentName: string, filePath: string): string => {
  const lowerName = agentName.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  
  // Détecter les domaines spécifiques
  if (lowerName.includes('migration') || lowerPath.includes('migration')) {
    return 'migration';
  } else if (lowerName.includes('seo') || lowerPath.includes('seo')) {
    return 'seo';
  } else if (lowerName.includes('qa') || lowerPath.includes('qa') || lowerName.includes('quality') || lowerPath.includes('quality')) {
    return 'quality';
  } else if (lowerPath.includes('dashboard') || lowerName.includes('dashboard')) {
    return 'dashboard';
  }
  
  return 'unknown';
};

// Détermine le chemin de destination selon la nouvelle structure à trois couches
const determineDestinationPath = (
  agentName: string, 
  sourceFile: string, 
  classification: FileClassification, 
  agentType: string,
  agentDomain: string,
  organizeByLayer: boolean
): string => {
  // Par défaut, maintenir le même chemin relatif si nous ne réorganisons pas par couche
  if (!organizeByLayer) {
    return sourceFile;
  }
  
  // Déterminer la couche
  let layer = classification.layer;
  if (layer === 'unknown') {
    // Deviner la couche en fonction du type d'agent
    if (['orchestrator', 'monitor', 'scheduler'].includes(agentType)) {
      layer = 'orchestration';
    } else if (['bridge', 'adapter', 'mediator'].includes(agentType)) {
      layer = 'coordination';
    } else {
      layer = 'business';
    }
  }
  
  // Construire le chemin de destination
  const fileName = path.basename(sourceFile);
  const domain = agentDomain !== 'unknown' ? agentDomain : 'core';
  
  // Structure: src/<layer>/<type>s/<domain>/<agent-name>/<file>
  const destDir = path.join(
    SRC_DIR,
    layer,
    `${agentType}s`,
    domain,
    agentName.toLowerCase().replace(/\s/g, '-')
  );
  
  return path.join(destDir, fileName);
};

// Crée un lien symbolique ou une copie du fichier selon le besoin
const createLinkOrCopy = (sourcePath: string, targetPath: string, dryRun = false): void => {
  if (dryRun) {
    console.log(`[SIMULATION] Lien/copie: ${sourcePath} -> ${targetPath}`);
    return;
  }

  // Créer le répertoire cible si nécessaire
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    // Copier le fichier (plus sûr qu'un lien symbolique dans de nombreux environnements)
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Fichier copié: ${sourcePath} -> ${targetPath}`);
  } catch (error) {
    console.error(`Erreur lors de la copie du fichier: ${error}`);
  }
};

// Déplace un fichier vers le répertoire d'archives
const archiveFile = (filePath: string, dryRun = false): void => {
  if (dryRun) {
    console.log(`[SIMULATION] Archivage: ${filePath} -> ${LEGACY_DIR}`);
    return;
  }

  const fileName = path.basename(filePath);
  const archivePath = path.join(LEGACY_DIR, fileName);
  
  // Créer un nom unique si un fichier avec le même nom existe déjà
  let uniqueArchivePath = archivePath;
  let counter = 1;
  while (fs.existsSync(uniqueArchivePath)) {
    uniqueArchivePath = path.join(LEGACY_DIR, `${path.basename(fileName, path.extname(fileName))}_${counter}${path.extname(fileName)}`);
    counter++;
  }

  try {
    // Créer le répertoire d'archives si nécessaire
    if (!fs.existsSync(LEGACY_DIR)) {
      fs.mkdirSync(LEGACY_DIR, { recursive: true });
    }
    
    // Copier le fichier vers les archives
    fs.copyFileSync(filePath, uniqueArchivePath);
    console.log(`Fichier archivé: ${filePath} -> ${uniqueArchivePath}`);
  } catch (error) {
    console.error(`Erreur lors de l'archivage du fichier: ${error}`);
  }
};

// Mettre à jour les imports dans les fichiers
const updateImports = async (oldPath: string, newPath: string, dryRun = false): Promise<void> => {
  if (dryRun) {
    console.log(`[SIMULATION] Mise à jour des imports: ${oldPath} -> ${newPath}`);
    return;
  }

  try {
    // Trouver tous les fichiers TypeScript
    const files = await glob('**/*.{ts,tsx}', { cwd: BASE_DIR, ignore: ['node_modules/**', 'legacy/**'] });
    
    // Extraire les parties pertinentes pour les imports
    const oldImportPath = oldPath.replace(/\.[^/.]+$/, ''); // Supprimer l'extension
    const newImportPath = newPath.replace(/\.[^/.]+$/, '');
    const oldRelativePath = path.relative(BASE_DIR, oldImportPath);
    const newRelativePath = path.relative(BASE_DIR, newImportPath);

    for (const file of files) {
      const filePath = path.join(BASE_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Rechercher les imports qui correspondent à l'ancien chemin
      const importRegex = new RegExp(`from\\s+['"](.*${path.basename(oldImportPath)})['"']`, 'g');
      let match;
      let updatedContent = content;
      let hasChanges = false;
      
      while ((match = importRegex.exec(content)) !== null) {
        const fullImportPath = match[1];
        if (fullImportPath.includes(path.basename(oldImportPath))) {
          const newImport = fullImportPath.replace(path.basename(oldImportPath), path.basename(newImportPath));
          updatedContent = updatedContent.replace(fullImportPath, newImport);
          hasChanges = true;
        }
      }
      
      // Enregistrer le fichier mis à jour si des changements ont été effectués
      if (hasChanges) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`Imports mis à jour dans: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des imports: ${error}`);
  }
};

// Fonction principale de consolidation
const consolidateAgents = async (
  threshold: number, 
  topN: number | undefined, 
  dryRun: boolean,
  organizeByLayer: boolean,
  updateImportsFlag: boolean
): Promise<ConsolidationReport> => {
  // Charger les données nécessaires
  const agentAudit = loadAgentAudit();
  const structureMap = loadStructureMap();
  
  // Filtrer les agents selon le seuil de redondance
  let eligibleAgents = agentAudit.filter(agent => 
    agent.files.length > 1 && (
      agent.recommendedAction === 'CONSOLIDATION_URGENTE' || 
      agent.files.length >= threshold
    )
  );
  
  // Limiter aux N agents les plus redondants si spécifié
  if (topN && topN > 0) {
    eligibleAgents = eligibleAgents
      .sort((a, b) => b.files.length - a.files.length)
      .slice(0, topN);
  }
  
  console.log(`${eligibleAgents.length} agents éligibles pour la consolidation.`);
  
  // Initialiser le rapport de consolidation
  const report: ConsolidationReport = {
    totalAgentsConsolidated: 0,
    layerStats: { orchestration: 0, coordination: 0, business: 0 },
    typeStats: {},
    plans: [],
    timestamp: new Date().toISOString()
  };
  
  // Traiter chaque agent éligible
  for (const agent of eligibleAgents) {
    console.log(`\n=== Consolidation de l'agent "${agent.agentName}" ===`);
    
    if (agent.files.length <= 1) {
      console.log(`Ignoré: L'agent n'a qu'un seul fichier.`);
      continue;
    }
    
    // Trouver la "source de vérité"
    let sourceOfTruth = agent.mainFile;
    
    // Vérifier si tous les fichiers spécifiés existent
    if (!fs.existsSync(sourceOfTruth)) {
      console.log(`Le fichier principal ${sourceOfTruth} n'existe pas. Recherche d'une alternative...`);
      
      // Trouver le premier fichier existant
      const existingFile = agent.files.find(file => fs.existsSync(file.path));
      if (!existingFile) {
        console.log(`Aucun fichier de l'agent "${agent.agentName}" n'a été trouvé. Agent ignoré.`);
        continue;
      }
      
      sourceOfTruth = existingFile.path;
      console.log(`Alternative trouvée: ${sourceOfTruth}`);
    }
    
    // Déterminer la classification et le type d'agent
    const classification = classifyFile(sourceOfTruth, structureMap);
    const agentType = determineAgentType(agent.agentName, sourceOfTruth);
    const agentDomain = determineAgentDomain(agent.agentName, sourceOfTruth);
    
    // Déterminer le chemin de destination
    const destinationPath = determineDestinationPath(
      agent.agentName,
      sourceOfTruth,
      classification,
      agentType,
      agentDomain,
      organizeByLayer
    );
    
    console.log(`Source de vérité: ${sourceOfTruth}`);
    console.log(`Classification: couche=${classification.layer}, domaine=${classification.domain}, statut=${classification.status}`);
    console.log(`Type d'agent: ${agentType}`);
    console.log(`Destination: ${destinationPath}`);
    
    // Créer le lien ou copie vers la destination
    createLinkOrCopy(sourceOfTruth, destinationPath, dryRun);
    
    // Archiver les autres fichiers
    let archivedCount = 0;
    for (const file of agent.files) {
      if (file.path !== sourceOfTruth && fs.existsSync(file.path)) {
        archiveFile(file.path, dryRun);
        archivedCount++;
        
        // Mettre à jour les imports si demandé
        if (updateImportsFlag) {
          await updateImports(file.path, destinationPath, dryRun);
        }
      }
    }
    
    // Mise à jour des statistiques
    report.totalAgentsConsolidated++;
    
    // Incrémenter les stats par couche
    if (classification.layer && report.layerStats[classification.layer]) {
      report.layerStats[classification.layer]++;
    } else {
      report.layerStats.business++; // Par défaut, considérer comme couche business
    }
    
    // Incrémenter les stats par type
    if (!report.typeStats[agentType]) {
      report.typeStats[agentType] = 0;
    }
    report.typeStats[agentType]++;
    
    // Ajouter le plan de consolidation
    report.plans.push({
      agentName: agent.agentName,
      sourceOfTruth,
      destinationPath,
      archivedFiles: archivedCount
    });
    
    console.log(`${archivedCount} fichiers archivés.`);
  }
  
  return report;
};

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

// Analyser les arguments de la ligne de commande
const parseArgs = (): {
  dryRun: boolean;
  threshold: number;
  topN?: number;
  organizeByLayer: boolean;
  updateImports: boolean;
} => {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    threshold: parseFloat(args.find(arg => arg.startsWith('--threshold='))?.split('=')[1] || '3.0'),
    topN: args.find(arg => arg.startsWith('--top='))
      ? parseInt(args.find(arg => arg.startsWith('--top='))!.split('=')[1])
      : undefined,
    organizeByLayer: args.includes('--organize-by-layer'),
    updateImports: args.includes('--update-imports')
  };
};

// Point d'entrée principal
(async () => {
  try {
    // Analyser les arguments
    const { dryRun, threshold, topN, organizeByLayer, updateImports } = parseArgs();
    
    console.log('=== Consolidation des agents MCP ===');
    console.log(`Mode: ${dryRun ? 'Simulation (dry-run)' : 'Exécution'}`);
    console.log(`Seuil de redondance: ${threshold}`);
    if (topN) console.log(`Limité aux ${topN} agents les plus redondants`);
    console.log(`Organisation par couche: ${organizeByLayer ? 'Oui' : 'Non'}`);
    console.log(`Mise à jour des imports: ${updateImports ? 'Oui' : 'Non'}\n`);
    
    // S'assurer que les répertoires nécessaires existent
    ensureDirectories();
    
    // Exécuter la consolidation
    const report = await consolidateAgents(threshold, topN, dryRun, organizeByLayer, updateImports);
    
    // Enregistrer le rapport de consolidation
    if (!dryRun) {
      fs.writeFileSync(OUTPUT_REPORT_PATH, JSON.stringify(report, null, 2));
      console.log(`\nRapport de consolidation enregistré dans: ${OUTPUT_REPORT_PATH}`);
    } else {
      console.log('\n[SIMULATION] Rapport de consolidation:');
      console.log(JSON.stringify(report, null, 2));
    }
    
    // Afficher le résumé
    console.log('\n=== Résumé de la consolidation ===');
    console.log(`Agents consolidés: ${report.totalAgentsConsolidated}`);
    console.log('\nPar couche:');
    for (const [layer, count] of Object.entries(report.layerStats)) {
      console.log(`- ${layer}: ${count} agents`);
    }
    console.log('\nPar type:');
    for (const [type, count] of Object.entries(report.typeStats)) {
      console.log(`- ${type}: ${count} agents`);
    }
    
  } catch (error) {
    console.error(`Erreur lors de la consolidation des agents: ${error}`);
    process.exit(1);
  }
})();