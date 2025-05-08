#!/usr/bin/env ts-node

/**
 * Script pour adapter les agents MCP à la nouvelle architecture à trois couches
 *
 * Ce script permet d'adapter automatiquement les agents migrés pour qu'ils implémentent
 * les interfaces abstraites appropriées selon leur catégorie.
 */

import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs-extra';
import { glob } from 'glob';

// Configuration des chemins
const BASE_PATH = '/workspaces/cahier-des-charge/packagesDoDotmcp-agents';
const ANALYZER_PATH = path.join(BASE_PATH, 'analyzers');
const VALIDATOR_PATH = path.join(BASE_PATH, 'validators');
const GENERATOR_PATH = path.join(BASE_PATH, 'generators');
const ORCHESTRATOR_PATH = path.join(BASE_PATH, 'orchestrators');

// Interface abstraite selon le type d'agent
interface AgentMapping {
  type: string;
  path: string;
  abstractClass: string;
  abstractClassPath: string;
  configInterface: string;
}

// Définition des mappings pour chaque type d'agent
const AGENT_MAPPINGS: AgentMapping[] = [
  {
    type: 'analyzer',
    path: ANALYZER_PATH,
    abstractClass: 'AbstractAnalyzerAgent',
    abstractClassPath: '../../core/AbstractAnalyzer-agent',
    configInterface: 'AnalyzerConfig',
  },
  {
    type: 'validator',
    path: VALIDATOR_PATH,
    abstractClass: 'AbstractValidatorAgent',
    abstractClassPath: '../../core/AbstractValidator-agent',
    configInterface: 'ValidatorConfig',
  },
  {
    type: 'generator',
    path: GENERATOR_PATH,
    abstractClass: 'AbstractGeneratorAgent',
    abstractClassPath: '../../core/AbstractGenerator-agent',
    configInterface: 'GeneratorConfig',
  },
  {
    type: 'orchestrator',
    path: ORCHESTRATOR_PATH,
    abstractClass: 'AbstractOrchestratorAgent',
    abstractClassPath: '../../core/AbstractOrchestrator-agent',
    configInterface: 'OrchestratorConfig',
  },
];

/**
 * Lit et analyse le contenu d'un fichier d'agent
 */
async function analyzeAgentFile(filePath: string): Promise<{
  className: string;
  extendsClass: string;
  hasMethods: { [key: string]: boolean };
}> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Extraire le nom de la classe
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'UnknownClass';

  // Vérifier quelle classe il étend - amélioration de la détection
  // Cette regex plus robuste supporte les variations dans la mise en forme
  const extendsMatch = content.match(/export\s+class\s+\w+\s+extends\s+(\w+)[\s{<]/);
  const extendsClass = extendsMatch ? extendsMatch[1] : '';

  // Vérifier aussi pour la présence des classes abstraites spécifiques
  let detectedAbstractClass = '';
  for (const mapping of AGENT_MAPPINGS) {
    if (content.includes(`extends ${mapping.abstractClass}`)) {
      detectedAbstractClass = mapping.abstractClass;
      break;
    }
  }

  // Si on a trouvé une classe abstraite spécifique mais pas avec la regex principale
  const finalExtendsClass = extendsClass || detectedAbstractClass;

  // Vérifier la présence de méthodes communes
  const hasMethods = {
    initialize: /\bpublic\s+async\s+initialize\s*\(/m.test(content),
    analyze:
      /\bprotected\s+async\s+analyze\s*\(/m.test(content) ||
      /\bpublic\s+async\s+analyze\s*\(/m.test(content),
    validate: /\bpublic\s+async\s+validate\s*\(/m.test(content),
    execute:
      /\bprotected\s+async\s+execute\s*\(/m.test(content) ||
      /\bpublic\s+async\s+execute\s*\(/m.test(content),
    cleanup: /\bpublic\s+async\s+cleanup\s*\(/m.test(content),
    getVersion: /\bpublic\s+getVersion\s*\(/m.test(content),
    getName: /\bpublic\s+getName\s*\(/m.test(content),
    getDependencies: /\bpublic\s+getDependencies\s*\(/m.test(content),
  };

  return { className, extendsClass: finalExtendsClass, hasMethods };
}

/**
 * Détermine le type d'agent en fonction du chemin du fichier
 */
function determineAgentType(filePath: string): AgentMapping | undefined {
  for (const mapping of AGENT_MAPPINGS) {
    if (filePath.includes(mapping.type)) {
      return mapping;
    }
  }
  return undefined;
}

/**
 * Liste tous les fichiers d'agents dans les dossiers ciblés
 */
async function findAllAgentFiles(): Promise<string[]> {
  const pattern = path.join(BASE_PATH, '**/*.ts');
  const options = { ignore: '**/core/**', nodir: true };

  try {
    const matches = await glob(pattern, options);

    // Filtrer les fichiers qui sont probablement des agents (contiennent "agent" ou "Agent" dans le nom)
    const agentFiles = matches.filter(
      (file: string) =>
        path.basename(file).toLowerCase().includes('agent') ||
        path.basename(file).toLowerCase().includes('analyzer') ||
        path.basename(file).toLowerCase().includes('validator') ||
        path.basename(file).toLowerCase().includes('generator') ||
        path.basename(file).toLowerCase().includes('orchestrator')
    );

    return agentFiles;
  } catch (err) {
    console.error('Erreur lors de la recherche des fichiers:', err);
    return [];
  }
}

/**
 * Génère un template pour adapter un agent au nouveau format
 */
async function generateAgentTemplate(
  filePath: string,
  agentInfo: ReturnType<typeof analyzeAgentFile> extends Promise<infer T> ? T : never
): Promise<string> {
  const agentType = determineAgentType(filePath);
  if (!agentType) {
    throw new Error(`Impossible de déterminer le type d'agent pour ${filePath}`);
  }

  const content = await fs.readFile(filePath, 'utf-8');

  let template = '// Fichier adapté pour la nouvelle architecture à trois couches\n';

  // Ajouter l'import de la classe abstraite
  template += `import { ${agentType.abstractClass}, ${agentType.configInterface} } from '${agentType.abstractClassPath}';\n`;
  template += `import { AgentContext } from '../../coreDoDotmcp-agent';\n\n`;

  // Remplacer la classe par celle qui hérite de la classe abstraite appropriée
  template += content.replace(
    new RegExp(`export\\s+class\\s+${agentInfo.className}\\s+extends\\s+\\w+\\s*\\{`),
    `export class ${agentInfo.className} extends ${
      agentType.abstractClass
    } {\n  // Propriétés d'identité de l'agent requises par ${
      agentType.abstractClass
    }\n  public id: string = '${agentInfo.className.toLowerCase()}';\n  public name: string = '${
      agentInfo.className
    }';\n  public version: string = '1.0.0'; // À adapter\n  public description: string = 'Agent ${
      agentInfo.className
    }'; // À compléter\n`
  );

  return template;
}

/**
 * Interface utilisateur en ligne de commande
 */
async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Écrit le nouveau fichier adapté
 */
async function writeAdaptedFile(filePath: string, newContent: string): Promise<void> {
  const backupPath = `${filePath}.backup`;

  // Créer une sauvegarde du fichier original
  await fs.copy(filePath, backupPath);
  console.log(`Sauvegarde du fichier original dans ${backupPath}`);

  // Écrire le nouveau contenu
  await fs.writeFile(filePath, newContent);
  console.log(`Fichier adapté écrit avec succès: ${filePath}`);
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log("Recherche des fichiers d'agents...");
  const agentFiles = await findAllAgentFiles();

  console.log(`${agentFiles.length} fichiers d'agents trouvés.`);

  for (const filePath of agentFiles) {
    console.log(`\nAnalyse de ${filePath}...`);

    try {
      const agentInfo = await analyzeAgentFile(filePath);
      console.log(`- Classe: ${agentInfo.className}`);
      console.log(`- Étend: ${agentInfo.extendsClass || 'Aucune classe parent'}`);

      const agentType = determineAgentType(filePath);
      if (!agentType) {
        console.log("Type d'agent non déterminé, passage au fichier suivant.");
        continue;
      }

      console.log(`- Type d'agent déterminé: ${agentType.type}`);

      // Vérifier si l'agent a déjà été adapté
      if (agentInfo.extendsClass === agentType.abstractClass) {
        console.log('Cet agent est déjà adapté à la nouvelle architecture.');
        continue;
      }

      const answer = await promptUser('Adapter cet agent à la nouvelle architecture? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Agent ignoré.');
        continue;
      }

      console.log("Génération du template pour adapter l'agent...");
      const template = await generateAgentTemplate(filePath, agentInfo);

      const isBackup = await promptUser('Créer une sauvegarde et remplacer le fichier? (y/n): ');
      if (isBackup.toLowerCase() === 'y') {
        await writeAdaptedFile(filePath, template);
      } else {
        // Afficher le template à la place
        console.log('\nTemplate à appliquer manuellement:\n');
        console.log(`${template.substring(0, 1000)}...`);
      }
    } catch (error) {
      console.error(`Erreur lors du traitement de ${filePath}:`, error);
    }
  }
}

// Exécuter le script
main()
  .then(() => console.log('\nTraitement terminé.'))
  .catch((error) => console.error('Erreur:', error));

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Chemins
const PACKAGES_DIR = '/workspaces/cahier-des-charge/packagesDoDotmcp-agents';
const AGENTS_DIR = '/workspaces/cahier-des-charge/agents';
const REPORT_DIR = '/workspaces/cahier-des-charge/reports/migration';

// Ensembles d'interfaces par couche
const INTERFACE_MAP = {
  orchestration: {
    layer: 'OrchestrationAgent',
    types: {
      orchestrator: 'OrchestratorAgent',
      monitor: 'MonitorAgent',
      scheduler: 'SchedulerAgent',
    },
  },
  coordination: {
    layer: 'CoordinationAgent',
    types: {
      bridge: 'BridgeAgent',
      adapter: 'AdapterAgent',
      registry: 'RegistryAgent',
    },
  },
  business: {
    layer: 'BusinessAgent',
    types: {
      analyzer: 'AnalyzerAgent',
      generator: 'GeneratorAgent',
      validator: 'ValidatorAgent',
      parser: 'ParserAgent',
    },
  },
};

// Créer le répertoire de rapport s'il n'existe pas
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Formatter le fichier rapport
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = path.join(REPORT_DIR, 'interface-implementation-results.md');
fs.writeFileSync(reportFile, `# Rapport d'implémentation des interfaces - ${timestamp}\n\n`);

// Map pour collecter les statistiques
const stats = {
  total: 0,
  updated: 0,
  skipped: 0,
  details: {} as Record<string, string[]>,
};

/**
 * Déterminer la couche pour un fichier donné
 */
function determineLayer(filePath: string): 'orchestration' | 'coordination' | 'business' {
  const content = fs.readFileSync(filePath, 'utf8');

  // Vérifier dans le contenu
  if (
    content.includes('Agent MCP pour orchestration') ||
    filePath.includes('/orchestration/') ||
    filePath.includes('/agents/core/')
  ) {
    return 'orchestration';
  }

  if (
    content.includes('Agent MCP pour coordination') ||
    filePath.includes('/coordination/') ||
    filePath.includes('/agents/integration/')
  ) {
    return 'coordination';
  }

  // Par défaut, on considère que c'est un agent business
  return 'business';
}

/**
 * Déterminer le type spécifique d'agent
 */
function determineType(filePath: string, content: string): string {
  // Vérifier dans le contenu
  const typeMatch = content.match(/type\s*=\s*['"](\w+)['"]/);
  if (typeMatch) {
    return typeMatch[1];
  }

  // Deviner à partir du chemin de fichier
  const filename = path.basename(filePath).toLowerCase();

  if (filename.includes('analyzer') || filePath.includes('/analysis/')) {
    return 'analyzer';
  }
  if (filename.includes('generator')) {
    return 'generator';
  }
  if (filename.includes('monitor')) {
    return 'monitor';
  }
  if (filename.includes('orchestrator')) {
    return 'orchestrator';
  }
  if (filename.includes('validator')) {
    return 'validator';
  }
  if (filename.includes('parser')) {
    return 'parser';
  }
  if (filename.includes('bridge')) {
    return 'bridge';
  }

  return 'unknown';
}

/**
 * Implémenter les interfaces dans un fichier
 */
function implementInterfaces(filePath: string): void {
  stats.total++;

  console.log(`Traitement de ${filePath}`);

  // Lire le contenu du fichier
  const content = fs.readFileSync(filePath, 'utf8');

  // Déterminer la couche et le type
  const layer = determineLayer(filePath);
  const type = determineType(filePath, content);

  // Lister les interfaces nécessaires
  const requiredInterfaces = [];

  // Interface de base
  if (!content.includes('BaseAgent')) {
    requiredInterfaces.push('BaseAgent');
  }

  // Interface de couche
  const layerInterface = INTERFACE_MAP[layer].layer;
  if (!content.includes(layerInterface)) {
    requiredInterfaces.push(layerInterface);
  }

  // Interface de type spécifique
  if (type !== 'unknown' && INTERFACE_MAP[layer].types[type]) {
    const typeInterface = INTERFACE_MAP[layer].types[type];
    if (!content.includes(typeInterface)) {
      requiredInterfaces.push(typeInterface);
    }
  }

  // Si aucune interface manquante, on passe
  if (requiredInterfaces.length === 0) {
    console.log('  ✓ Aucune interface manquante');
    stats.skipped++;
    stats.details[filePath] = [];
    return;
  }

  console.log(`  ! Interfaces manquantes: ${requiredInterfaces.join(', ')}`);

  // Ajouter les imports nécessaires
  const importLines = [];
  if (requiredInterfaces.includes('BaseAgent')) {
    importLines.push(
      `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent';`
    );
  }
  if (requiredInterfaces.includes(layerInterface)) {
    importLines.push(
      `import { ${layerInterface} } from '@workspaces/cahier-des-charge/src/core/interfaces/${layer}';`
    );
  }
  if (
    type !== 'unknown' &&
    INTERFACE_MAP[layer].types[type] &&
    requiredInterfaces.includes(INTERFACE_MAP[layer].types[type])
  ) {
    if (!importLines[1]?.includes(INTERFACE_MAP[layer].types[type])) {
      importLines[1] = importLines[1]?.replace(
        `import { ${layerInterface}`,
        `import { ${layerInterface}, ${INTERFACE_MAP[layer].types[type]}`
      );
    }
  }

  // Ajouter ces imports après les imports existants s'il y en a
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    // Insérer après le dernier import
    lines.splice(lastImportIndex + 1, 0, ...importLines);
  } else {
    // Insérer au début du fichier
    lines.splice(0, 0, ...importLines);
  }

  // Ajout de l'implémentation des interfaces à la classe
  let implementsAdded = false;
  for (let i = 0; i < lines.length; i++) {
    const classMatch = lines[i].match(/class\s+(\w+)(\s+implements\s+([^{]*))?/);
    if (classMatch) {
      const className = classMatch[1];

      if (classMatch[2]) {
        // Il y a déjà une clause implements
        const implementsList = classMatch[3];
        const alreadyImplemented = implementsList.split(',').map((i) => i.trim());
        const interfacesToAdd = requiredInterfaces.filter((i) => !alreadyImplemented.includes(i));

        if (interfacesToAdd.length > 0) {
          lines[i] = lines[i].replace(
            /implements\s+([^{]*)/,
            `implements ${implementsList}, ${interfacesToAdd.join(', ')}`
          );
        }
      } else {
        // Pas de clause implements
        lines[i] = lines[i].replace(
          /class\s+(\w+)/,
          `class ${className} implements ${requiredInterfaces.join(', ')}`
        );
      }

      implementsAdded = true;
      break;
    }
  }

  if (implementsAdded) {
    // Écrire le nouveau contenu
    fs.writeFileSync(filePath, lines.join('\n'));

    stats.updated++;
    stats.details[filePath] = requiredInterfaces;

    console.log(`  ✓ Interfaces ajoutées: ${requiredInterfaces.join(', ')}`);
  } else {
    console.log('  ✗ Aucune classe trouvée pour ajouter les interfaces');
    stats.skipped++;
    stats.details[filePath] = [];
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('Recherche des fichiers agents...');

  // Liste des répertoires à scanner
  const directories = [PACKAGES_DIR, AGENTS_DIR];

  // Récupérer tous les fichiers agents récursivement
  const allAgentFiles = [];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`Le répertoire ${dir} n'existe pas.`);
      return;
    }

    // Fonction récursive pour parcourir les dossiers
    const findAgentFiles = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);

      files.forEach((file) => {
        const filePath = path.join(currentDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          findAgentFiles(filePath);
        } else if (
          file.endsWith('.ts') &&
          !file.endsWith('.test.ts') &&
          !file.endsWith('.spec.ts')
        ) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Vérifier si c'est un fichier agent (contient une classe et le mot "Agent")
          if (
            (content.includes('class') && content.includes('Agent')) ||
            file.toLowerCase().includes('agent')
          ) {
            allAgentFiles.push(filePath);
          }
        }
      });
    };

    findAgentFiles(dir);
  });

  console.log(`Trouvé ${allAgentFiles.length} fichiers agents.`);

  // Traiter chaque fichier
  allAgentFiles.forEach((filePath) => {
    try {
      implementInterfaces(filePath);
    } catch (error) {
      console.error(`Erreur lors du traitement de ${filePath}:`, error);
    }
  });

  // Générer le rapport final
  let report = `# Rapport d'implémentation des interfaces - ${timestamp}\n\n`;
  report += '## Résumé\n\n';
  report += `- Total des fichiers traités: ${stats.total}\n`;
  report += `- Fichiers mis à jour: ${stats.updated}\n`;
  report += `- Fichiers ignorés: ${stats.skipped}\n\n`;

  report += '## Détails\n\n';

  Object.entries(stats.details).forEach(([filePath, interfaces]) => {
    report += `### ${filePath}\n`;
    if (interfaces.length > 0) {
      report += `- Ajout des imports pour: ${interfaces.join(', ')}\n`;
      report += `- Ajout des interfaces à la classe: ${interfaces.join(', ')}\n`;
      report += '- Ajout des méthodes requises par les interfaces\n\n';
    } else {
      report += '- Déjà conforme, aucun changement\n\n';
    }
  });

  fs.writeFileSync(reportFile, report);

  console.log(`\nTerminé ! Rapport généré: ${reportFile}`);
  console.log(`${stats.updated} fichiers mis à jour.`);
  console.log(`${stats.skipped} fichiers déjà conformes.`);
}

// Exécuter la fonction principale
main().catch(console.error);
