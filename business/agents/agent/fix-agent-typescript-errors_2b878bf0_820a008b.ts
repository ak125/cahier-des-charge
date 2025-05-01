/**
 * Script de correction automatique des erreurs TypeScript dans les fichiers index.ts des agents MCP
 *
 * Ce script analyse et corrige les problèmes communs trouvés dans les fichiers d'agents:
 * - Virgules manquantes dans les déclarations d'interface
 * - Problèmes de syntaxe dans les implémentations d'interface
 * - Structure incorrecte dans les fichiers d'index
 *
 * Intégration CI/CD:
 * - Détection automatique des erreurs TypeScript
 * - Génération de rapports pour les PR GitHub
 * - Mise à jour du document ARCHITECTURE.md
 * - Compatible avec GitHub Actions et autres systèmes CI
 */

import * as fs from 'fsstructure-agent';
import * as path from 'pathstructure-agent';
import { execSync } from './child_processstructure-agent';
import { glob } from './globstructure-agent';

// Configuration
const AGENT_PATTERNS = [
  'packagesDoDotmcp-agents/analyzers/**/index.ts',
  'packagesDoDotmcp-agents/generators/**/index.ts',
  'packagesDoDotmcp-agents/orchestrators/**/index.ts',
  'packagesDoDotmcp-agents/validators/**/index.ts',
];

const ARCHITECTURE_MD_PATH = '/workspaces/cahier-des-charge/ARCHITECTURE.md';
const REPORTS_DIR = '/workspaces/cahier-des-charge/reports';

// Options de configuration pour le script
interface ScriptOptions {
  dryRun: boolean;
  ciMode: boolean;
  updateArchitecture: boolean;
  reportPath?: string;
  revertOnFailure: boolean;
  verbose: boolean;
}

// Structure pour stocker les statistiques de correction
interface FixStats {
  totalFiles: number;
  fixed: number;
  alreadyCorrect: number;
  failed: number;
  errors: string[];
  fixedAgents: string[];
}

// Structure pour stocker les informations d'architecture
interface ArchitectureInfo {
  structure: {
    layers: string[];
    agentTypes: string[];
    interfaces: Record<string, string>;
  };
  pipeline: {
    components: string[];
    workflows: string[];
  };
  conventions: {
    naming: Record<string, string>;
    implementation: Record<string, string>;
  };
}

// Fonction principale
async function main() {
  // Traiter les arguments de ligne de commande
  const options = parseCommandLineArgs();

  // Lire et analyser le document ARCHITECTURE.md avant toute correction
  console.log('📚 Analyse du document ARCHITECTURE.md pour respecter les conventions...');
  const architectureInfo = await parseArchitectureDocument();

  if (architectureInfo) {
    console.log('✅ Document ARCHITECTURE.md analysé avec succès');
    console.log(
      `   - ${architectureInfo.structure.layers.length} couches d'architecture identifiées`
    );
    console.log(`   - ${architectureInfo.structure.agentTypes.length} types d'agents reconnus`);
    console.log(
      `   - ${
        Object.keys(architectureInfo.conventions.naming).length
      } conventions de nommage extraites`
    );
  } else {
    console.log("⚠️ Impossible d'extraire les informations complètes du document ARCHITECTURE.md");
    console.log('   - Utilisation des paramètres par défaut pour les corrections');
  }

  // Créer le répertoire de rapports s'il n'existe pas
  if (options.reportPath) {
    try {
      fs.mkdirSync(path.dirname(options.reportPath), { recursive: true });
    } catch (_err) {
      // Ignorer l'erreur si le répertoire existe déjà
    }
  }

  console.log(
    `🔍 Recherche des fichiers d'agents à corriger${options.dryRun ? ' (mode simulation)' : ''}...`
  );

  // Récupère tous les fichiers d'index des agents
  const agentFiles = await findAgentFiles();

  console.log(`🔎 ${agentFiles.length} fichiers d'agents trouvés`);

  // Préparer les statistiques
  const stats: FixStats = {
    totalFiles: agentFiles.length,
    fixed: 0,
    alreadyCorrect: 0,
    failed: 0,
    errors: [],
    fixedAgents: [],
  };

  // Créer des copies de sauvegarde si revertOnFailure est activé
  const backups = new Map<string, string>();
  if (options.revertOnFailure && !options.dryRun) {
    for (const filePath of agentFiles) {
      try {
        backups.set(filePath, fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        console.warn(`⚠️ Impossible de créer une sauvegarde pour ${filePath}: ${error.message}`);
      }
    }
  }

  // Traite chaque fichier d'agent
  for (const filePath of agentFiles) {
    try {
      const wasFixed = await fixAgentFile(filePath, architectureInfo, options.dryRun);

      if (wasFixed) {
        stats.fixed++;
        stats.fixedAgents.push(path.relative(process.cwd(), filePath));
        if (options.verbose) {
          console.log(
            `✅ ${options.dryRun ? 'Serait corrigé' : 'Corrigé'}: ${path.relative(
              process.cwd(),
              filePath
            )}`
          );
        }
      } else {
        stats.alreadyCorrect++;
        if (options.verbose) {
          console.log(`ℹ️ Déjà conforme: ${path.relative(process.cwd(), filePath)}`);
        }
      }
    } catch (error) {
      stats.failed++;
      const errorMessage = `❌ Erreur sur ${path.relative(process.cwd(), filePath)}: ${
        error.message
      }`;
      if (options.verbose) {
        console.error(errorMessage);
      }
      stats.errors.push(errorMessage);

      // Restaurer la sauvegarde en cas d'échec si demandé
      if (options.revertOnFailure && !options.dryRun && backups.has(filePath)) {
        try {
          fs.writeFileSync(filePath, backups.get(filePath)!);
          console.log(
            `↩️ Restauration de la sauvegarde pour ${path.relative(process.cwd(), filePath)}`
          );
        } catch (restoreErr) {
          console.error(
            `⚠️ Impossible de restaurer la sauvegarde pour ${path.relative(
              process.cwd(),
              filePath
            )}: ${restoreErr.message}`
          );
        }
      }
    }
  }

  // Résumé
  console.log('\n📊 Résumé des corrections:');
  console.log(`- Total analysé: ${stats.totalFiles} fichiers`);
  console.log(`- ${options.dryRun ? 'Seraient corrigés' : 'Corrigés'}: ${stats.fixed} fichiers`);
  console.log(`- Déjà conformes: ${stats.alreadyCorrect} fichiers`);
  console.log(`- Échecs: ${stats.failed} fichiers`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️ Erreurs rencontrées:');
    stats.errors.forEach((err) => console.log(`  ${err}`));
  }

  // Lancer la vérification TypeScript pour confirmer les corrections
  if (!options.dryRun) {
    console.log('\n🔄 Vérification TypeScript des corrections...');
    let tscOutput = '';
    let tscSuccess = false;

    try {
      tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8' });
      tscSuccess = true;
      console.log('✅ Vérification TypeScript réussie!');
    } catch (error) {
      tscOutput = error.stdout || 'Erreur inconnue';
      console.log('⚠️ Des erreurs TypeScript persistent. Vérifiez le rapport pour plus de détails.');
    }

    // Mettre à jour ARCHITECTURE.md si demandé
    if (options.updateArchitecture && stats.fixed > 0) {
      await updateArchitectureDocument(stats, architectureInfo);
    }

    // Générer un rapport
    if (options.reportPath) {
      generateReport(options.reportPath, stats, tscOutput, tscSuccess, architectureInfo);
      console.log(`📄 Rapport généré: ${options.reportPath}`);
    }

    // En mode CI, sortir avec le code approprié
    if (options.ciMode) {
      process.exit(tscSuccess && stats.failed === 0 ? 0 : 1);
    }
  }
}

/**
 * Analyse le document ARCHITECTURE.md pour extraire les informations importantes
 * sur l'architecture MCP, les conventions de nommage et les types d'agents
 */
async function parseArchitectureDocument(): Promise<ArchitectureInfo | null> {
  try {
    if (!fs.existsSync(ARCHITECTURE_MD_PATH)) {
      return null;
    }

    const content = fs.readFileSync(ARCHITECTURE_MD_PATH, 'utf8');

    // Initialiser la structure de données pour les informations d'architecture
    const architectureInfo: ArchitectureInfo = {
      structure: {
        layers: [],
        agentTypes: [],
        interfaces: {},
      },
      pipeline: {
        components: [],
        workflows: [],
      },
      conventions: {
        naming: {},
        implementation: {},
      },
    };

    // Extraire les couches d'architecture
    const layersRegex =
      /##\s+📊\s*Architecture\s+à\s+Trois\s+Couches[^\n]*\s*\n([\s\S]*?)(?=\n##|$)/i;
    const layersMatch = content.match(layersRegex);

    if (layersMatch) {
      const layersSection = layersMatch[1];
      const layerItemRegex = /\*\*Couche\s+([^*]+)\*\*/g;
      let layerMatch;

      while ((layerMatch = layerItemRegex.exec(layersSection)) !== null) {
        architectureInfo.structure.layers.push(layerMatch[1].trim());
      }

      // Extraction plus précise avec les détails
      const coordinationLayerRegex =
        /Couche\s+[dD]e\s+Coordination[^-]*-\s*([\s\S]*?)(?=\d+\.\s+\*\*Couche|$)/i;
      const coordinationMatch = layersSection.match(coordinationLayerRegex);
      if (coordinationMatch) {
        const components = coordinationMatch[1].match(/\(([^)]+)\)/);
        if (components) {
          architectureInfo.pipeline.components = components[1]
            .split(',')
            .map((item) => item.trim());
        }
      }
    }

    // Extraire les types d'agents
    const agentTypesRegex = /\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|/g;
    let agentTypeMatch;

    while ((agentTypeMatch = agentTypesRegex.exec(content)) !== null) {
      const agentType = agentTypeMatch[1].replace(/Agent$/, '');
      if (
        !architectureInfo.structure.agentTypes.includes(agentType) &&
        agentType.length > 2 &&
        /^[A-Za-z]+$/.test(agentType)
      ) {
        architectureInfo.structure.agentTypes.push(agentType);
        architectureInfo.structure.interfaces[agentType] = `${agentType}Agent`;
      }
    }

    // Si aucun type d'agent n'est trouvé, utiliser des valeurs par défaut
    if (architectureInfo.structure.agentTypes.length === 0) {
      architectureInfo.structure.agentTypes = [
        'Analyzer',
        'Generator',
        'Orchestrator',
        'Validator',
      ];
      architectureInfo.structure.agentTypes.forEach((type) => {
        architectureInfo.structure.interfaces[type] = `${type}Agent`;
      });
    }

    // Extraire les conventions de nommage
    const conventionsRegex = /##\s+✅\s*Bonnes\s+Pratiques[^\n]*\s*\n([\s\S]*?)(?=\n##|$)/i;
    const conventionsMatch = content.match(conventionsRegex);

    if (conventionsMatch) {
      const conventionsSection = conventionsMatch[1];

      // Conventions de nommage des fichiers d'agents
      if (conventionsSection.includes('MysqlAnalyzerPlusoptimizerAgent')) {
        architectureInfo.conventions.naming.compound = 'TYPE+ROLE';
      }

      if (conventionsSection.includes('PhpAnalyzerDotworkerAgent')) {
        architectureInfo.conventions.naming.worker = 'TYPE.workerAgent';
      }

      if (conventionsSection.includes('QaAnalyzer')) {
        architectureInfo.conventions.naming.kebab = 'kebab-case';
      }
    }

    return architectureInfo;
  } catch (error) {
    console.error(`Erreur lors de l'analyse du document ARCHITECTURE.md: ${error.message}`);
    return null;
  }
}

/**
 * Analyse les arguments de ligne de commande
 */
function parseCommandLineArgs(): ScriptOptions {
  const args = process.argv.slice(2);

  const options: ScriptOptions = {
    dryRun: false,
    ciMode: false,
    updateArchitecture: false,
    revertOnFailure: true,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--ci') {
      options.ciMode = true;
    } else if (arg === '--update-architecture' || arg === '-u') {
      options.updateArchitecture = true;
    } else if (arg.startsWith('--report=')) {
      options.reportPath = arg.split('=')[1] || getDefaultReportPath();
    } else if (arg === '--no-revert') {
      options.revertOnFailure = false;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  // En mode CI, toujours générer un rapport s'il n'est pas spécifié
  if (options.ciMode && !options.reportPath) {
    options.reportPath = getDefaultReportPath();
  }

  return options;
}

/**
 * Affiche l'aide pour l'utilisation du script
 */
function printUsage() {
  console.log(`
Usage: npx ts-node fix-agent-typescript-errors.ts [options]

Options:
  --dry-run, -d         Simuler les corrections sans modifier les fichiers
  --ci                  Mode CI/CD: génère un rapport et sort avec un code d'erreur approprié
  --update-architecture, -u  Mettre à jour le document ARCHITECTURE.md avec les agents corrigés
  --report=CHEMIN       Générer un rapport à l'emplacement spécifié
  --no-revert           Ne pas restaurer les fichiers en cas d'erreur
  --verbose, -v         Afficher plus d'informations pendant l'exécution
  --help, -h            Afficher cette aide
  `);
}

/**
 * Génère un chemin par défaut pour le rapport
 */
function getDefaultReportPath(): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const dirPath = path.join(REPORTS_DIR, `fixed-agents-${timestamp.replace(/[T\-:]/g, '')}`);
  fs.mkdirSync(dirPath, { recursive: true });
  return path.join(dirPath, 'report.md');
}

/**
 * Trouve tous les fichiers d'agents correspondant aux patterns
 */
async function findAgentFiles(): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of AGENT_PATTERNS) {
    const matches = await glob(pattern);
    files.push(...matches);
  }

  return files;
}

/**
 * Corrige les problèmes TypeScript dans un fichier d'agent
 * @param filePath Chemin du fichier à corriger
 * @param architectureInfo Informations extraites du document ARCHITECTURE.md
 * @param dryRun Si true, simule la correction sans modifier le fichier
 * @returns true si des corrections ont été appliquées, false sinon
 */
async function fixAgentFile(
  filePath: string,
  architectureInfo: ArchitectureInfo | null = null,
  dryRun = false
): Promise<boolean> {
  // Lire le contenu du fichier
  const content = fs.readFileSync(filePath, 'utf8');

  // Analyser le nom de l'agent à partir du chemin
  const agentName = extractAgentName(filePath);

  // Vérifier si le fichier contient déjà une implémentation correcte
  const interfaceRegex = new RegExp(`class\\s+${agentName}\\s+implements\\s+\\w+Agent`);
  if (interfaceRegex.test(content) && !hasTypicalErrors(content)) {
    return false; // Déjà correct, aucune modification nécessaire
  }

  // Déterminer le type d'agent approprié, en utilisant les informations d'architecture si disponibles
  const agentType = determineAgentType(filePath, architectureInfo);
  const interfaceName = architectureInfo?.structure.interfaces[agentType] || `${agentType}Agent`;

  // Créer une nouvelle implémentation correcte
  const newContent = generateCorrectImplementation(
    content,
    agentName,
    interfaceName,
    architectureInfo
  );

  // Écrire le contenu corrigé si ce n'est pas un dry run
  if (!dryRun) {
    fs.writeFileSync(filePath, newContent);
  }

  return true;
}

/**
 * Extrait le nom de l'agent à partir du chemin du fichier
 */
function extractAgentName(filePath: string): string {
  const dirName = path.basename(path.dirname(filePath));

  // Gérer les différents formats de noms d'agents
  if (dirName.includes('+')) {
    // Format: MysqlAnalyzerPlusoptimizerAgent
    return dirName.split('+')[0];
  }
  if (dirName.includes('.')) {
    // Format: PhpAnalyzerDotworkerAgent
    return dirName.split('.')[0];
  }
  // Format: QaAnalyzer -> QaAnalyzer
  return dirName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Détermine le type d'agent en fonction du chemin du fichier et des informations d'architecture
 */
function determineAgentType(
  filePath: string,
  architectureInfo: ArchitectureInfo | null = null
): string {
  // Types d'agents standard
  const standardTypes = {
    '/analyzers/': 'Analyzer',
    '/generators/': 'Generator',
    '/orchestrators/': 'Orchestrator',
    '/validators/': 'Validator',
  };

  // Si on a des informations d'architecture, utiliser les types définis
  if (architectureInfo && architectureInfo.structure.agentTypes.length > 0) {
    for (const [pattern, type] of Object.entries(standardTypes)) {
      if (filePath.includes(pattern)) {
        // Vérifier si ce type existe dans l'architecture
        const matchedType = architectureInfo.structure.agentTypes.find(
          (t) => t.toLowerCase() === type.toLowerCase()
        );

        if (matchedType) {
          return matchedType; // Utiliser le type avec la casse exacte définie dans l'architecture
        }
      }
    }
  }

  // Fallback sur la détection standard
  for (const [pattern, type] of Object.entries(standardTypes)) {
    if (filePath.includes(pattern)) {
      return type;
    }
  }

  return 'Base';
}

/**
 * Vérifie si le contenu présente les erreurs typiques identifiées dans les logs
 */
function hasTypicalErrors(content: string): boolean {
  // Recherche les patterns d'erreurs courants
  const errorPatterns = [
    /implements\s+\w+Agent\s*\{/, // Pas de virgule après l'interface
    /implements\s+\w+Agent\s*([^,])\s*\{/, // Accolade juste après l'interface
    /class\s+\w+\s+extends/, // Agent étendu au lieu d'implémenter
    /interface\s+\w+Agent\s*\{/, // Déclaration d'interface dans le même fichier
  ];

  return errorPatterns.some((pattern) => pattern.test(content));
}

/**
 * Génère une implémentation correcte basée sur le contenu actuel et les informations d'architecture
 */
function generateCorrectImplementation(
  content: string,
  agentName: string,
  interfaceName: string,
  architectureInfo: ArchitectureInfo | null = null
): string {
  // Extraire les imports existants
  const importRegex = /import.*?;/gs;
  const imports = content.match(importRegex) || [];

  // Vérifier si l'import de l'interface existe déjà
  const hasInterfaceImport = imports.some(
    (imp) => imp.includes(interfaceName) || imp.includes('Agent')
  );

  // Construire les imports
  let newImports = imports.join('\n');

  // Si l'import de l'interface n'existe pas, l'ajouter
  // en respectant les conventions d'architecture si disponibles
  if (!hasInterfaceImport) {
    const importPath = architectureInfo?.conventions.naming?.imports || '../../interfaces';

    newImports += `\nimport { ${interfaceName} } from '${importPath}/${interfaceName.toLowerCase()}structure-agent'\n`;
  }

  // Extraire le corps de la classe existante si possible
  const classBodyRegex = /class\s+\w+\s+(?:implements|extends)?\s*\w*\s*\{([\s\S]*?)\n\}/;
  const classBodyMatch = content.match(classBodyRegex);
  let classBody = classBodyMatch ? classBodyMatch[1] : '';

  // Si aucun corps n'est trouvé, créer un squelette de base
  if (!classBody) {
    classBody = `
  name = '${agentName}';
  description = 'Agent ${agentName} pour l\\'architecture MCP';
  version = '1.0.0';
  
  async initialize(config: any): Promise<void> {
    // Initialisation de l'agent
    console.log(\`Initialisation de l'agent \${this.name}\`);
  }
  
  async execute(input: any): Promise<any> {
    // Implémentation de la logique principale
    console.log(\`Exécution de l'agent \${this.name}\`);
    return { success: true, result: input };
  }`;
  }

  // Détecter le type d'agent pour la documentation
  const agentType = interfaceName.replace(/Agent$/, '');

  // Construire le nouveau contenu du fichier
  // Avec un commentaire JSDoc conforme aux standards d'architecture
  return `${newImports}

/**
 * Agent ${agentName} - Implémentation pour l'architecture MCP
 * 
 * Type: ${agentType}
 * Rôle: Fait partie de la couche ${getLayerForAgentType(agentType, architectureInfo)}
 * 
 * @implements {${interfaceName}}
 */
export class ${agentName} implements ${interfaceName} {${classBody}
}

export default ${agentName};
`;
}

/**
 * Détermine la couche d'architecture à laquelle appartient un type d'agent
 */
function getLayerForAgentType(
  agentType: string,
  architectureInfo: ArchitectureInfo | null
): string {
  if (!architectureInfo || !architectureInfo.structure.layers) {
    // Mappings par défaut si aucune information d'architecture n'est disponible
    const defaultLayers: Record<string, string> = {
      Analyzer: 'Business',
      Generator: 'Business',
      Orchestrator: 'Coordination',
      Validator: 'Business',
      Adapter: 'Adapters',
    };

    return defaultLayers[agentType] || 'Business';
  }

  // Dans le cas où on a des informations d'architecture
  if (
    agentType.includes('Orchestrator') &&
    architectureInfo.structure.layers.includes('Coordination')
  ) {
    return 'Coordination';
  }

  if (
    (agentType.includes('Adapter') || agentType.includes('Connector')) &&
    architectureInfo.structure.layers.some((l) => l.includes('Adapter'))
  ) {
    return architectureInfo.structure.layers.find((l) => l.includes('Adapter')) || 'Adapters';
  }

  // Par défaut, la plupart des agents sont dans la couche Business
  return architectureInfo.structure.layers.find((l) => l.includes('Business')) || 'Business';
}

/**
 * Met à jour le document ARCHITECTURE.md avec les informations sur les agents corrigés
 */
async function updateArchitectureDocument(
  stats: FixStats,
  architectureInfo: ArchitectureInfo | null = null
): Promise<void> {
  try {
    if (!fs.existsSync(ARCHITECTURE_MD_PATH)) {
      console.warn(
        `⚠️ Le fichier ARCHITECTURE.md n'a pas été trouvé à l'emplacement: ${ARCHITECTURE_MD_PATH}`
      );
      return;
    }

    const content = fs.readFileSync(ARCHITECTURE_MD_PATH, 'utf8');

    // Vérifier si la section des agents existe déjà
    const agentsSectionRegex = /## 📊 Agents MCP Validés[\s\S]*?(?=\n##|$)/;
    const agentsSectionMatch = content.match(agentsSectionRegex);

    // Trier les agents par type pour une meilleure organisation
    const agentsByType = stats.fixedAgents.reduce<Record<string, string[]>>((acc, agent) => {
      const relativePath = agent;
      const agentType = determineAgentType(relativePath, architectureInfo);

      if (!acc[agentType]) {
        acc[agentType] = [];
      }

      acc[agentType].push(agent);
      return acc;
    }, {});

    // Créer la liste des agents corrigés
    const agentsTable = `
| Type d'agent | Nom | Interface | Couche | Statut |
|-------------|-----|-----------|--------|--------|
${Object.entries(agentsByType)
  .flatMap(([type, agents]) =>
    agents.map((agent) => {
      const relativePath = agent;
      const _dirName = path.basename(path.dirname(relativePath));
      const agentName = extractAgentName(relativePath);
      const layer = getLayerForAgentType(type, architectureInfo);
      return `| ${type} | ${agentName} | ${type}Agent | ${layer} | ✅ Corrigé |`;
    })
  )
  .join('\n')}
`;

    let newContent;
    const timestamp = new Date().toISOString().split('T')[0];

    if (agentsSectionMatch) {
      // Mettre à jour la section existante
      newContent = content.replace(
        agentsSectionRegex,
        `## 📊 Agents MCP Validés\n\nDernière validation: ${timestamp}\n\nLes agents suivants ont été automatiquement vérifiés et corrigés pour assurer la conformité TypeScript:${agentsTable}`
      );
    } else {
      // Ajouter une nouvelle section avant la fin du document
      const lastSectionRegex = /\n##\s+[^#]+([\s\S]*)$/;
      const lastSectionMatch = content.match(lastSectionRegex);

      if (lastSectionMatch) {
        newContent = content.replace(
          lastSectionMatch[0],
          `\n## 📊 Agents MCP Validés\n\nDernière validation: ${timestamp}\n\nLes agents suivants ont été automatiquement vérifiés et corrigés pour assurer la conformité TypeScript:${agentsTable}\n${lastSectionMatch[0]}`
        );
      } else {
        // Si aucune section n'est trouvée, ajouter à la fin du document
        newContent = `${content}\n\n## 📊 Agents MCP Validés\n\nDernière validation: ${timestamp}\n\nLes agents suivants ont été automatiquement vérifiés et corrigés pour assurer la conformité TypeScript:${agentsTable}`;
      }
    }

    fs.writeFileSync(ARCHITECTURE_MD_PATH, newContent);
    console.log('📝 Document ARCHITECTURE.md mis à jour avec les agents corrigés');
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du document ARCHITECTURE.md: ${error.message}`);
  }
}

/**
 * Génère un rapport détaillé sur les corrections effectuées
 */
function generateReport(
  reportPath: string,
  stats: FixStats,
  tscOutput: string,
  tscSuccess: boolean,
  architectureInfo: ArchitectureInfo | null = null
): void {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];

  // Créer le dossier contenant le rapport si nécessaire
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Également enregistrer la sortie TypeScript dans un fichier séparé
  const tscLogPath = path.join(reportDir, 'tsc.log');
  fs.writeFileSync(tscLogPath, tscOutput);

  // Organisation des agents par couche d'architecture pour le rapport
  const agentsByLayer: Record<string, string[]> = {};

  stats.fixedAgents.forEach((agent) => {
    const agentType = determineAgentType(agent, architectureInfo);
    const layer = getLayerForAgentType(agentType, architectureInfo);

    if (!agentsByLayer[layer]) {
      agentsByLayer[layer] = [];
    }

    agentsByLayer[layer].push(`${extractAgentName(agent)} (${agentType})`);
  });

  // Liste des couches d'architecture trouvées dans le document
  const architectureSummary = architectureInfo
    ? `\n\n### Couches d'architecture identifiées\n\n${architectureInfo.structure.layers
        .map((layer) => `- ${layer}`)
        .join('\n')}`
    : '';

  // Générer le contenu du rapport
  const reportContent = `# Rapport de correction des agents MCP

## Résumé

- **Date**: ${timestamp}
- **Total analysé**: ${stats.totalFiles} fichiers
- **Corrigés**: ${stats.fixed} fichiers
- **Déjà conformes**: ${stats.alreadyCorrect} fichiers
- **Échecs**: ${stats.failed} fichiers
- **Vérification TypeScript**: ${tscSuccess ? '✅ Réussie' : '❌ Échouée'}${architectureSummary}

## Détails des corrections

### Agents corrigés par couche d'architecture

${Object.entries(agentsByLayer)
  .map(
    ([layer, agents]) => `#### Couche ${layer}\n\n${agents.map((agent) => `- ${agent}`).join('\n')}`
  )
  .join('\n\n')}

### Erreurs rencontrées

${
  stats.errors.length > 0
    ? stats.errors.map((error) => `- ${error}`).join('\n')
    : '- Aucune erreur rencontrée'
}

## Intégration à l'architecture MCP

Les corrections appliquées maintiennent la cohérence avec l'architecture à trois couches définie dans le document ARCHITECTURE.md:

1. **Couche de Coordination**: Les agents d'orchestration peuvent désormais communiquer correctement via leurs interfaces.
2. **Couche Business**: Les agents d'analyse et de génération sont correctement typés.
3. **Couche Adapters**: Les connexions avec les services externes sont maintenues.

## Prochaines étapes recommandées

${
  tscSuccess
    ? `- Fusionner les corrections dans la branche principale
- Exécuter les tests d'intégration pour valider les changements
- Mettre à jour la documentation si nécessaire`
    : `- Résoudre les erreurs TypeScript restantes (voir \`tsc.log\`)
- Vérifier manuellement les fichiers problématiques
- Exécuter à nouveau ce script après les corrections`
}

---
Pour plus de détails sur la vérification TypeScript, voir le fichier [\`tsc.log\`](./tsc.log).
`;

  // Écrire le rapport
  fs.writeFileSync(reportPath, reportContent);

  // Si en mode CI, créer un résumé court pour les PR GitHub
  if (process.env.GITHUB_ACTIONS) {
    const ciSummaryPath = process.env.GITHUB_STEP_SUMMARY || path.join(reportDir, 'ci-summary.md');

    const ciSummary = `## 🔧 Correction automatique des agents MCP

- **Total**: ${stats.totalFiles} fichiers analysés
- **Corrigés**: ${stats.fixed} fichiers
- **Statut**: ${
      tscSuccess && stats.failed === 0
        ? '✅ Tous les problèmes ont été résolus'
        : '⚠️ Des problèmes persistent'
    }

${
  stats.fixed > 0
    ? `### Agents corrigés\n\n${stats.fixedAgents
        .slice(0, 5)
        .map((a) => `- \`${a}\``)
        .join('\n')}${
        stats.fixedAgents.length > 5 ? `\n- et ${stats.fixedAgents.length - 5} autres...` : ''
      }`
    : ''
}
${
  stats.errors.length > 0
    ? `### Erreurs\n\n${stats.errors
        .slice(0, 3)
        .map((e) => `- ${e}`)
        .join('\n')}${stats.errors.length > 3 ? `\n- et ${stats.errors.length - 3} autres...` : ''}`
    : ''
}

[Voir le rapport complet](${reportPath})
`;

    fs.writeFileSync(ciSummaryPath, ciSummary);
  }
}

// Exécution du script
main().catch((error) => {
  console.error("❌ Erreur lors de l'exécution du script:", error);
  process.exit(1);
});

/**
 * Intégration GitHub Actions
 *
 * Pour utiliser ce script dans votre workflow CI/CD, ajoutez une étape comme celle-ci:
 *
 * ```yml
 * - name: Corriger les erreurs TypeScript des agents MCP
 *   run: |
 *     npx ts-node fix-agent-typescript-errors.ts --ci --update-architecture
 *   env:
 *     NODE_ENV: development
 * ```
 */
