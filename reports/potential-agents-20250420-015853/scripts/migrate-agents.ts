/**
 * migrate-agents.ts
 * 
 * Script d'analyse et de migration des agents vers l'architecture MCP OS en 3 couches
 * 
 * Ce script:
 * 1. Analyse les agents existants et leur structure
 * 2. Identifie leur couche appropriée (orchestration, coordination, business)
 * 3. Génère une proposition de migration
 * 4. Crée un plan de priorité de migration basé sur les dépendances
 * 5. Effectue les migrations approuvées
 */

import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as glob from 'glob';

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
const AGENTS_DIR = path.join(WORKSPACE_ROOT, 'agents');
const PACKAGES_DIR = path.join(WORKSPACE_ROOT, 'packages');
const MCP_AGENTS_DIR = path.join(WORKSPACE_ROOT, 'packages', DoDotmcp-agents');
const INTERFACES_DIR = path.join(WORKSPACE_ROOT, 'src', 'core', 'interfaces');
const LEGACY_DIR = path.join(WORKSPACE_ROOT, 'legacy', `migration-${new Date().toISOString().split('T')[0]}`);

// Types pour la migration
interface AgentAnalysis {
  id: string;
  name: string;
  filePath: string;
  lines: number;
  imports: string[];
  methods: string[];
  layer: 'orchestration' | 'coordination' | 'business' | 'unknown';
  agentType: string;
  usageCount: number;
  dependencies: string[];
  implemented: {
    baseInterface: boolean;
    layerInterface: boolean;
    typeInterface: boolean;
  };
  generatedCode?: string;
  migrationPath?: string;
}

/**
 * Analyse un agent existant pour déterminer sa couche et son type
 */
async function analyzeAgent(filePath: string): Promise<AgentAnalysis> {
  // Lire le contenu du fichier
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extraction du nom de l'agent
  const nameMatch = content.match(/export\s+class\s+(\w+)/);
  const name = nameMatch ? nameMatch[1] : path.basename(filePath, path.extname(filePath));
  const id = path.basename(filePath, path.extname(filePath)).toLowerCase();

  // Extraction des imports
  const imports = lines
    .filter(line => line.startsWith('import '))
    .map(line => line.trim());

  // Extraction des méthodes
  const methodRegex = /(?:public|private|protected|async)?\s*(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g;
  let match;
  const methods: string[] = [];
  while ((match = methodRegex.exec(content)) !== null) {
    if (match[1] && !match[1].startsWith('_') && match[1] !== 'constructor') {
      methods.push(match[1]);
    }
  }

  // Déterminer la couche en fonction du contenu et du nom
  let layer: AgentAnalysis['layer'] = 'unknown';
  let agentType = 'unknown';

  // Couche orchestration
  if (
    /Orchestrat(or|ion)/i.test(name) || 
    /Workflow/i.test(name) || 
    /Schedul(er|ing)/i.test(name) || 
    /Monitor(ing)?/i.test(name) ||
    methods.some(m => 
      /^(start|schedule|monitor|orchestrate|coordinate|execute)/.test(m)
    )
  ) {
    layer = 'orchestration';
    
    if (/Orchestrat/i.test(name)) agentType = 'orchestrator';
    else if (/Schedul/i.test(name)) agentType = 'scheduler';
    else if (/Monitor/i.test(name)) agentType = 'monitor';
  }
  
  // Couche coordination
  else if (
    /Bridge/i.test(name) ||
    /Adapt(er|or)/i.test(name) ||
    /Registry/i.test(name) ||
    /Connect(or|ion)/i.test(name) ||
    methods.some(m => 
      /^(bridge|adapt|register|connect|discover|lookup)/.test(m)
    )
  ) {
    layer = 'coordination';
    
    if (/Bridge/i.test(name)) agentType = 'bridge';
    else if (/Adapt/i.test(name)) agentType = 'adapter';
    else if (/Registry/i.test(name)) agentType = 'registry';
  }
  
  // Couche business
  else if (
    /Analyz(er|e)/i.test(name) ||
    /Generat(or|e)/i.test(name) ||
    /Validat(or|e)/i.test(name) ||
    /Check(er)?/i.test(name) ||
    /Parser/i.test(name) ||
    methods.some(m => 
      /^(analyze|generate|validate|check|parse)/.test(m)
    )
  ) {
    layer = 'business';
    
    if (/Analyz/i.test(name)) agentType = 'analyzer';
    else if (/Generat/i.test(name)) agentType = 'generator';
    else if (/Validat|Check/i.test(name)) agentType = 'validator';
    else if (/Pars/i.test(name)) agentType = 'parser';
  }

  // UtiliserDoDoDoDotgit grep pour compter les utilisations
  const usageCount = 0;
  try {
    const { stdout } = await execAsync(DoDoDoDotgit grep -l "${name}" --exclude="*.md" | wc -l`);
    usageCount = parseInt(stdout.trim(), 10);
  } catch (error) {
    logger.warn(`Impossible de compter les utilisations pour ${name}`);
  }

  // Déterminer les dépendances
  const dependencies = imports
    .filter(imp => imp.includes('from'))
    .map(imp => {
      const match = imp.match(/from\s+['"](.*?)['"]/);
      return match ? match[1] : '';
    })
    .filter(dep => dep && !dep.startsWith('.') && !dep.startsWith('@'));

  // Vérifier si l'agent implémente déjà les interfaces
  const implemented = {
    baseInterface: content.includes('implements BaseAgent') || content.includes('extends BaseAgent'),
    layerInterface: content.includes(`implements ${layer === 'orchestration' ? 'Orchestrator' : layer === 'coordination' ? 'Bridge' : 'Analyzer'}Agent`),
    typeInterface: content.includes(`implements ${agentType.charAt(0).toUpperCase() + agentType.slice(1)}Agent`)
  };

  return {
    id,
    name,
    filePath,
    lines: lines.length,
    imports,
    methods,
    layer,
    agentType,
    usageCount,
    dependencies,
    implemented
  };
}

/**
 * Génère une proposition de migration pour un agent
 */
function generateMigrationProposal(agent: AgentAnalysis): AgentAnalysis {
  // Construire le chemin cible selon l'architecture en couches
  const migrationPath = path.join(
    MCP_AGENTS_DIR,
    agent.layer === 'unknown' ? 'others' : agent.layer,
    agent.agentType === 'unknown' ? 'misc' : `${agent.agentType}s`,
    agent.id,
    `${agent.id}.ts`
  );

  // Construire le template adapté
  const interfaceBaseName = agent.agentType.charAt(0).toUpperCase() + agent.agentType.slice(1) + 'Agent';
  
  const generatedCode = `/**
 * ${agent.name} - Agent MCP pour ${agent.layer} (${agent.agentType})
 * 
 * Migration automatique vers l'architecture MCP OS en 3 couches
 * Date: ${new Date().toISOString()}
 */

import { ${interfaceBaseName} } from '@workspaces/cahier-des-charge/src/core/interfaces/${agent.layer}';
import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
${agent.imports.join('\n')}

/**
 * Configuration pour ${agent.name}
 */
export interface ${agent.name}Config {
  // TODO: Ajouter les propriétés de configuration spécifiques à l'agent
}

/**
 * ${agent.name} - ${agent.layer === 'business' 
  ? 'Agent d\'analyse et de traitement métier' 
  : agent.layer === 'coordination' 
  ? 'Agent de coordination et d\'intégration' 
  : 'Agent d\'orchestration et de workflows'}
 */
export class ${agent.name} implements ${interfaceBaseName} {
  id = '${agent.id}';
  name = '${agent.name}';
  type = '${agent.agentType}';
  version = '1.0.0';
  
  constructor(private config: ${agent.name}Config) {
    // Initialisation
  }
  
  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // TODO: Implémenter l'initialisation
  }
  
  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true; // TODO: Implémenter la vérification d'état
  }
  
  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    // TODO: Implémenter la fermeture propre
  }
  
  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }
  
  // TODO: Implémenter les méthodes spécifiques de l'interface ${interfaceBaseName}
${agent.methods.map(method => `  
  /**
   * ${method}
   */
  ${method}() {
    // TODO: Migrer l'implémentation existante
  }`).join('\n')}
}

export default ${agent.name};
`;

  return {
    ...agent,
    generatedCode,
    migrationPath
  };
}

/**
 * Exécute la migration d'un agent
 */
async function executeMigration(agent: AgentAnalysis, backupOriginal: boolean = true): Promise<boolean> {
  try {
    // S'assurer que le dossier de destination existe
    await fs.ensureDir(path.dirname(agent.migrationPath!));
    
    // Backup de l'agent original si demandé
    if (backupOriginal) {
      const backupDir = path.join(LEGACY_DIR, path.relative(WORKSPACE_ROOT, path.dirname(agent.filePath)));
      const backupPath = path.join(backupDir, path.basename(agent.filePath));
      await fs.ensureDir(backupDir);
      await fs.copy(agent.filePath, backupPath);
    }
    
    // Écrire le fichier migré
    await fs.writeFile(agent.migrationPath!, agent.generatedCode!);
    
    // Vérifier que le fichier a bien été écrit
    if (await fs.pathExists(agent.migrationPath!)) {
      logger.success(`✅ Agent migré: ${path.relative(WORKSPACE_ROOT, agent.filePath)} -> ${path.relative(WORKSPACE_ROOT, agent.migrationPath!)}`);
      return true;
    } else {
      logger.error(`❌ Erreur lors de la migration de ${agent.name}: le fichier n'a pas été créé`);
      return false;
    }
  } catch (error: any) {
    logger.error(`❌ Erreur lors de la migration de ${agent.name}: ${error.message}`);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  logger.info('Analyse des agents existants...');

  // Récupérer les arguments de ligne de commande
  const args = process.argv.slice(2);
  const shouldExecute = args.includes('--execute');
  const specificLayer = args.find(arg => arg.startsWith('--layer='))?.split('=')[1] as AgentAnalysis['layer'] | undefined;
  
  // Rechercher tous les agents existants
  const agentFiles = glob.sync(path.join(AGENTS_DIR, '**/*.ts'), { ignore: ['**/*.spec.ts', '**/*.test.ts'] });
  logger.info(`${agentFiles.length} agents trouvés.`);
  
  // Analyser chaque agent
  const analyses: AgentAnalysis[] = [];
  
  for (const filePath of agentFiles) {
    try {
      const analysis = await analyzeAgent(filePath);
      analyses.push(analysis);
    } catch (error: any) {
      logger.error(`Erreur lors de l'analyse de ${filePath}: ${error.message}`);
    }
  }
  
  // Trier par couche et nombre d'utilisations
  analyses.sort((a, b) => {
    // D'abord par couche: orchestration > coordination > business
    const layerOrder = { orchestration: 1, coordination: 2, business: 3, unknown: 4 };
    const layerDiff = layerOrder[a.layer] - layerOrder[b.layer];
    if (layerDiff !== 0) return layerDiff;
    
    // Ensuite par nombre d'utilisations (décroissant)
    return b.usageCount - a.usageCount;
  });
  
  // Générer des propositions de migration
  const proposals: AgentAnalysis[] = analyses.map(generateMigrationProposal);
  
  // Ecrire le rapport de migration
  const report = {
    date: new Date().toISOString(),
    totalAgents: analyses.length,
    byLayer: {
      orchestration: analyses.filter(a => a.layer === 'orchestration').length,
      coordination: analyses.filter(a => a.layer === 'coordination').length,
      business: analyses.filter(a => a.layer === 'business').length,
      unknown: analyses.filter(a => a.layer === 'unknown').length
    },
    agents: proposals.map(p => ({
      id: p.id,
      name: p.name,
      layer: p.layer,
      agentType: p.agentType,
      usageCount: p.usageCount,
      currentPath: p.filePath,
      migrationPath: p.migrationPath,
      implemented: p.implemented
    }))
  };
  
  await fs.ensureDir(path.dirname(LEGACY_DIR));
  await fs.writeJson(path.join(WORKSPACE_ROOT, 'MigrationReport.json'), report, { spaces: 2 });
  
  logger.success(`Rapport de migration généré: MigrationReport.json`);
  logger.info(`Agents par couche: Orchestration: ${report.byLayer.orchestration}, Coordination: ${report.byLayer.coordination}, Business: ${report.byLayer.business}, Non classés: ${report.byLayer.unknown}`);
  
  // Générer un exemple de plan de migration
  await generateMigrationPlan(proposals);

  // Exécuter la migration si demandé
  if (shouldExecute) {
    logger.info(`Mode exécution activé. Migration des agents...`);
    
    // Préparer les dossiers de la nouvelle structure
    await prepareDirectoryStructure();
    
    // Filtrer les agents selon la couche spécifiée
    const agentsToMigrate = specificLayer 
      ? proposals.filter(p => p.layer === specificLayer)
      : proposals;
    
    if (agentsToMigrate.length === 0) {
      logger.warn(`Aucun agent à migrer ${specificLayer ? `pour la couche ${specificLayer}` : ''}`);
      return;
    }
    
    logger.info(`Migration de ${agentsToMigrate.length} agents ${specificLayer ? `de la couche ${specificLayer}` : ''}...`);
    
    // Exécuter la migration pour chaque agent
    let successCount = 0;
    for (const agent of agentsToMigrate) {
      if (agent.generatedCode && agent.migrationPath) {
        const success = await executeMigration(agent, true);
        if (success) successCount++;
      } else {
        logger.warn(`⚠️ Impossible de migrer ${agent.name}: code généré ou chemin de migration manquant`);
      }
    }
    
    logger.success(`Migration terminée: ${successCount}/${agentsToMigrate.length} agents migrés avec succès`);
  }
}

/**
 * Prépare la structure de répertoires pour la migration
 */
async function prepareDirectoryStructure(): Promise<void> {
  const structure = [
    // Orchestration
    path.join(MCP_AGENTS_DIR, 'orchestration', 'orchestrators'),
    path.join(MCP_AGENTS_DIR, 'orchestration', 'schedulers'),
    path.join(MCP_AGENTS_DIR, 'orchestration', 'monitors'),
    path.join(MCP_AGENTS_DIR, 'orchestration', 'misc'),
    
    // Coordination
    path.join(MCP_AGENTS_DIR, 'coordination', 'bridges'),
    path.join(MCP_AGENTS_DIR, 'coordination', 'adapters'),
    path.join(MCP_AGENTS_DIR, 'coordination', 'registries'),
    path.join(MCP_AGENTS_DIR, 'coordination', 'misc'),
    
    // Business
    path.join(MCP_AGENTS_DIR, 'business', 'analyzers'),
    path.join(MCP_AGENTS_DIR, 'business', 'generators'),
    path.join(MCP_AGENTS_DIR, 'business', 'validators'),
    path.join(MCP_AGENTS_DIR, 'business', 'parsers'),
    path.join(MCP_AGENTS_DIR, 'business', 'misc'),
    
    // Others
    path.join(MCP_AGENTS_DIR, 'others', 'misc'),
    
    // Backup directory
    LEGACY_DIR
  ];
  
  for (const dir of structure) {
    await fs.ensureDir(dir);
  }
  
  logger.info('Structure de répertoires créée pour la migration');
}

/**
 * Génère un plan de migration pour les agents
 */
async function generateMigrationPlan(proposals: AgentAnalysis[]) {
  const plan = `# Plan de Migration vers MCP OS 3 couches

## Priorisation des agents

${proposals.slice(0, 10).map((p, i) => 
    `${i+1}. **${p.name}** (${p.layer}/${p.agentType}) - ${p.usageCount} utilisations`
  ).join('\n')}

## Structure cible

\`\`\`
packagesDoDotmcp-agents/
├─ orchestration/
│  ├─ orchestrators/
│  ├─ schedulers/
│  └─ monitors/
├─ coordination/
│  ├─ bridges/
│  ├─ adapters/
│  └─ registries/
└─ business/
   ├─ analyzers/
   ├─ generators/
   ├─ validators/
   └─ parsers/
\`\`\`

## Étapes d'exécution

1. Créer la structure de répertoires
2. Migrer les agents d'orchestration
3. Migrer les agents de coordination
4. Migrer les agents métier
5. Mettre à jour le registre d'agents
6. Exécuter les tests de validation
7. Supprimer les agents obsolètes

## Commandes

\`\`\`bash
# Créer la structure
mkdir -p packagesDoDotmcp-agents/{orchestration,coordination,business}/{orchestrators,schedulers,monitors,bridges,adapters,registries,analyzers,generators,validators,parsers}

# Migrer en utilisant ce script
node scripts/migrate-agents.ts --execute --layer=orchestration
node scripts/migrate-agents.ts --execute --layer=coordination
node scripts/migrate-agents.ts --execute --layer=business

# Valider la migration
npm run test:coverage
\`\`\`
`;

  await fs.writeFile(path.join(WORKSPACE_ROOT, 'migration-plan.md'), plan);
  logger.success('Plan de migration généré: migration-plan.md');
}

// Exécuter la fonction principale
main().catch(error => {
  logger.error(`Erreur lors de la migration des agents: ${error.message}`);
  process.exit(1);
});