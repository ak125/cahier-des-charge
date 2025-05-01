#!/usr/bin/env ts-node
/**
 * Script pour automatiser la migration des agents vers l'architecture à base de classes abstraites
 *
 * Ce script analyse les fichiers d'agents existants et les convertit pour utiliser
 * les classes abstraites et interfaces appropriées.
 *
 * Usage: ts-node scripts/migrate-agents-to-abstracts.ts --type=analyzer --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Configuration du script
const MCP_AGENTS_ROOT = path.resolve(__dirname, '../packagesDoDotmcp-agents');
const AGENT_TYPES = ['analyzer', 'validator', 'generator', 'orchestrator'];
const TYPE_PLURALS: Record<string, string> = {
  analyzer: 'analyzers',
  validator: 'validators',
  generator: 'generators',
  orchestrator: 'orchestrators',
};

// Options du script
interface ScriptOptions {
  type?: string;
  agentName?: string;
  dryRun: boolean;
  verbose: boolean;
}

// Modèles d'importation et d'extension
const IMPORT_PATTERNS = {
  analyzer: "import { AbstractAnalyzerAgent } from '../AbstractAnalyzer';",
  validator: "import { AbstractValidatorAgent } from '../AbstractValidator';",
  generator: "import { AbstractGeneratorAgent } from '../AbstractGenerator';",
  orchestrator: "import { AbstractOrchestratorAgent } from '../AbstractOrchestrator';",
};

// Journalisation avec niveaux
function log(
  message: string,
  options: ScriptOptions,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (!options.verbose && level === 'info') return;

  const prefix = {
    info: '📝 INFO:',
    warning: '⚠️ ATTENTION:',
    error: '❌ ERREUR:',
  }[level];

  console.log(`${prefix} ${message}`);
}

/**
 * Analyse le fichier d'agent et extrait les métadonnées
 */
function extractAgentMetadata(fileContent: string): Record<string, string> {
  const metadata: Record<string, string> = {};

  // Extraire le nom de la classe
  const classNameMatch = fileContent.match(/export\s+class\s+(\w+)/);
  if (classNameMatch) {
    metadata.className = classNameMatch[1];
  }

  // Extraire les propriétés communes
  const propMatches = {
    id: /(?:public|readonly|private)?\s*id\s*=\s*['"]([^'"]+)['"]/,
    name: /(?:public|readonly|private)?\s*name\s*=\s*['"]([^'"]+)['"]/,
    description: /(?:public|readonly|private)?\s*description\s*=\s*['"]([^'"]+)['"]/,
    version: /(?:public|readonly|private)?\s*version\s*=\s*['"]([^'"]+)['"]/,
  };

  for (const [key, pattern] of Object.entries(propMatches)) {
    const match = fileContent.match(pattern);
    if (match) {
      metadata[key] = match[1];
    }
  }

  return metadata;
}

/**
 * Détecte les types d'entrée/sortie utilisés dans l'agent
 */
function detectInputOutputTypes(fileContent: string): { inputType: string; outputType: string } {
  // Valeurs par défaut
  let inputType = 'any';
  let outputType = 'any';

  // Chercher des types en analysant les signatures de méthodes
  const processMatch = fileContent.match(
    /(?:process|analyze|validate|generate)\s*\(\s*(?:input|data|params)\s*:\s*(\w+)/
  );
  if (processMatch) {
    inputType = processMatch[1];
  }

  // Chercher le type de retour des méthodes principales
  const returnTypeMatch = fileContent.match(
    /(?:process|analyze|validate|generate)[^:]+:\s*Promise<([^>]+)>/
  );
  if (returnTypeMatch) {
    outputType = returnTypeMatch[1].trim();
  }

  return { inputType, outputType };
}

/**
 * Modifie le contenu d'un fichier d'agent pour utiliser la classe abstraite
 */
async function transformAgentFile(
  filePath: string,
  agentType: string,
  options: ScriptOptions
): Promise<string> {
  // Lire le contenu du fichier
  const originalContent = fs.readFileSync(filePath, 'utf-8');
  let content = originalContent;

  // Extraire les métadonnées
  const metadata = extractAgentMetadata(content);
  if (!metadata.className) {
    log(`Impossible de trouver le nom de classe dans ${filePath}`, options, 'error');
    return content;
  }

  log(`Traitement de l'agent ${metadata.className}...`, options);

  // Détecter les types d'entrée/sortie
  const { inputType, outputType } = detectInputOutputTypes(content);
  log(`  Types détectés - Input: ${inputType}, Output: ${outputType}`, options);

  // Vérifier si la classe étend déjà la classe abstraite
  const abstractClassName = `Abstract${
    agentType.charAt(0).toUpperCase() + agentType.slice(1)
  }Agent`;
  const extendsPattern = new RegExp(`extends\\s+${abstractClassName}`);

  if (extendsPattern.test(content)) {
    log(`  L'agent ${metadata.className} utilise déjà la classe abstraite.`, options, 'warning');
    return content;
  }

  // Ajouter l'import pour la classe abstraite s'il n'existe pas déjà
  if (!content.includes(IMPORT_PATTERNS[agentType as keyof typeof IMPORT_PATTERNS])) {
    content = IMPORT_PATTERNS[agentType as keyof typeof IMPORT_PATTERNS] + '\n' + content;
  }

  // Modifier la déclaration de classe pour étendre la classe abstraite
  const classPattern = new RegExp(`(export\\s+class\\s+${metadata.className})(\\s+[^{]+)?\\s*{`);
  content = content.replace(
    classPattern,
    `$1 extends ${abstractClassName}<${inputType}, ${outputType}> {`
  );

  // Remplacer les anciennes méthodes par les nouvelles signatures
  const methodsMap: Record<string, { oldPattern: RegExp; newMethod: string }> = {
    analyzer: {
      oldPattern: /\b(async\s+)?(process|analyze)\s*\(\s*([^:)]+)\s*:\s*([^)]+)\)\s*:[^{]+{/,
      newMethod: 'public async analyze',
    },
    validator: {
      oldPattern: /\b(async\s+)?(process|validate)\s*\(\s*([^:)]+)\s*:\s*([^)]+)\)\s*:[^{]+{/,
      newMethod: 'public async validate',
    },
    generator: {
      oldPattern: /\b(async\s+)?(process|generate)\s*\(\s*([^:)]+)\s*:\s*([^)]+)\)\s*:[^{]+{/,
      newMethod: 'public async generate',
    },
    orchestrator: {
      oldPattern: /\b(async\s+)?(process|orchestrate)\s*\(\s*([^:)]+)\s*:\s*([^)]+)\)\s*:[^{]+{/,
      newMethod: 'public async orchestrate',
    },
  };

  if (methodsMap[agentType]) {
    const { oldPattern, newMethod } = methodsMap[agentType];
    content = content.replace(
      oldPattern,
      `${newMethod}($3: ${inputType}, context?: any): Promise<${outputType}> {`
    );
  }

  // Adapter les méthodes d'initialisation et de nettoyage
  if (!content.includes('initializeInternal')) {
    const initMatch = content.match(/\b(async\s+)?(init|initialize)\s*\([^)]*\)\s*:[^{]+{([^}]+)}/);
    if (initMatch) {
      const initBody = initMatch[3].trim();
      content = content.replace(
        initMatch[0],
        `protected async initializeInternal(): Promise<void> {${initBody}}`
      );
    } else {
      // Ajouter une méthode d'initialisation minimale
      content = content.replace(
        /{(\s*)/,
        `{\n  protected async initializeInternal(): Promise<void> {\n    // Initialisation de l'agent\n  }\n$1`
      );
    }
  }

  if (!content.includes('cleanupInternal')) {
    const cleanupMatch = content.match(
      /\b(async\s+)?(cleanup|dispose|destroy)\s*\([^)]*\)\s*:[^{]+{([^}]+)}/
    );
    if (cleanupMatch) {
      const cleanupBody = cleanupMatch[3].trim();
      content = content.replace(
        cleanupMatch[0],
        `protected async cleanupInternal(): Promise<void> {${cleanupBody}}`
      );
    } else {
      // Ajouter une méthode de nettoyage minimale
      content = content.replace(
        /{(\s*)/,
        `{\n  protected async cleanupInternal(): Promise<void> {\n    // Nettoyage des ressources\n  }\n$1`
      );
    }
  }

  // Signaler les changements
  if (content !== originalContent) {
    log(`  ✅ Agent ${metadata.className} transformé avec succès.`, options);
  } else {
    log(`  ⚠️ Aucune modification n'a été apportée à ${metadata.className}.`, options, 'warning');
  }

  return content;
}

/**
 * Traite tous les agents d'un type donné
 */
async function processAgentsOfType(agentType: string, options: ScriptOptions): Promise<number> {
  const agentTypeDir = path.join(MCP_AGENTS_ROOT, TYPE_PLURALS[agentType]);
  let processedCount = 0;

  // Obtenir tous les fichiers d'agents (mais pas les abstraits et les interfaces)
  const agentPattern = `${agentTypeDir}/**/*-${agentType}.ts`;
  const agentFiles = glob.sync(agentPattern);

  // Ajouter d'autres motifs courants pour les noms d'agents
  const altPattern = `${agentTypeDir}/**/*.ts`;
  const allFiles = glob.sync(altPattern).filter((file) => {
    const basename = path.basename(file);
    return (
      !basename.startsWith('abstract-') &&
      !basename.startsWith('base-') &&
      !basename.startsWith('index.') &&
      !basename.includes('interface') &&
      !file.includes('/interfaces/')
    );
  });

  // Combiner les deux listes et éliminer les doublons
  const agentFilesToProcess = [...new Set([...agentFiles, ...allFiles])];

  // Filtrer par nom d'agent spécifique si fourni
  const filteredAgents = options.agentName
    ? agentFilesToProcess.filter((file) => path.basename(file).includes(options.agentName!))
    : agentFilesToProcess;

  log(`Traitement de ${filteredAgents.length} agents de type ${agentType}...`, options);

  // Traitement de chaque fichier d'agent
  for (const filePath of filteredAgents) {
    try {
      const transformedContent = await transformAgentFile(filePath, agentType, options);

      if (!options.dryRun) {
        fs.writeFileSync(filePath, transformedContent, 'utf-8');
        log(`  💾 Fichier sauvegardé: ${filePath}`, options);
      } else {
        log(
          `  🔍 Mode simulation: modifications non sauvegardées pour ${path.basename(filePath)}`,
          options
        );
      }

      processedCount++;
    } catch (error) {
      log(`  ❌ Erreur lors du traitement de ${filePath}: ${error}`, options, 'error');
    }
  }

  return processedCount;
}

/**
 * Point d'entrée principal du script
 */
async function main() {
  // Analyser les arguments de la ligne de commande
  const argv = await yargs(hideBin(process.argv))
    .option('type', {
      alias: 't',
      describe: "Type d'agent à migrer (analyzer, validator, generator, orchestrator ou all)",
      type: 'string',
      choices: [...AGENT_TYPES, 'all'],
    })
    .option('agent', {
      alias: 'a',
      describe: "Nom spécifique d'agent à migrer (ex: PhpAnalyzer)",
      type: 'string',
    })
    .option('dry-run', {
      alias: 'd',
      describe: 'Exécuter sans modifier les fichiers',
      type: 'boolean',
      default: false,
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Afficher des informations détaillées',
      type: 'boolean',
      default: false,
    })
    .help().argv;

  const options: ScriptOptions = {
    type: argv.type as string | undefined,
    agentName: argv.agent,
    dryRun: argv['dry-run'],
    verbose: argv.verbose,
  };

  // Afficher le mode d'exécution
  console.log(`🚀 Migration des agents MCP vers l'architecture abstraite`);
  console.log(`Mode: ${options.dryRun ? '🔍 Simulation (Dry Run)' : '✏️ Modification réelle'}`);

  // Déterminer les types d'agents à traiter
  const typesToProcess = options.type === 'all' || !options.type ? AGENT_TYPES : [options.type];

  let totalProcessed = 0;

  // Traiter chaque type d'agent
  for (const agentType of typesToProcess) {
    const processedCount = await processAgentsOfType(agentType, options);
    totalProcessed += processedCount;

    if (processedCount > 0) {
      console.log(`✅ ${processedCount} agents de type ${agentType} traités.`);
    } else {
      console.log(`ℹ️ Aucun agent de type ${agentType} n'a été traité.`);
    }
  }

  // Résumé final
  console.log('\n📊 Résumé de la migration:');
  console.log(`Total traité: ${totalProcessed} agents`);

  if (options.dryRun && totalProcessed > 0) {
    console.log(
      "\n⚠️ Il s'agissait d'une simulation. Pour effectuer les modifications, exécutez sans --dry-run"
    );
  }
}

// Exécuter le script
main().catch((err) => {
  console.error("❌ Erreur lors de l'exécution du script:", err);
  process.exit(1);
});
