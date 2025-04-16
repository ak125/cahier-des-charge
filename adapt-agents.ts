#!/usr/bin/env ts-node

/**
 * Script pour adapter les agents MCP à la nouvelle architecture à trois couches
 * 
 * Ce script permet d'adapter automatiquement les agents migrés pour qu'ils implémentent
 * les interfaces abstraites appropriées selon leur catégorie.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import * as readline from 'readline';

// Configuration des chemins
const BASE_PATH = '/workspaces/cahier-des-charge/packages/mcp-agents';
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
    abstractClassPath: '../../core/abstract-analyzer-agent',
    configInterface: 'AnalyzerConfig'
  },
  {
    type: 'validator',
    path: VALIDATOR_PATH,
    abstractClass: 'AbstractValidatorAgent',
    abstractClassPath: '../../core/abstract-validator-agent',
    configInterface: 'ValidatorConfig'
  },
  {
    type: 'generator',
    path: GENERATOR_PATH,
    abstractClass: 'AbstractGeneratorAgent',
    abstractClassPath: '../../core/abstract-generator-agent',
    configInterface: 'GeneratorConfig'
  },
  {
    type: 'orchestrator',
    path: ORCHESTRATOR_PATH,
    abstractClass: 'AbstractOrchestratorAgent',
    abstractClassPath: '../../core/abstract-orchestrator-agent',
    configInterface: 'OrchestratorConfig'
  }
];

/**
 * Lit et analyse le contenu d'un fichier d'agent
 */
async function analyzeAgentFile(filePath: string): Promise<{
  className: string;
  extendsClass: string;
  hasMethods: {[key: string]: boolean};
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
    analyze: /\bprotected\s+async\s+analyze\s*\(/m.test(content) || /\bpublic\s+async\s+analyze\s*\(/m.test(content),
    validate: /\bpublic\s+async\s+validate\s*\(/m.test(content),
    execute: /\bprotected\s+async\s+execute\s*\(/m.test(content) || /\bpublic\s+async\s+execute\s*\(/m.test(content),
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
    const agentFiles = matches.filter((file: string) => 
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
async function generateAgentTemplate(filePath: string, agentInfo: ReturnType<typeof analyzeAgentFile> extends Promise<infer T> ? T : never): Promise<string> {
  const agentType = determineAgentType(filePath);
  if (!agentType) {
    throw new Error(`Impossible de déterminer le type d'agent pour ${filePath}`);
  }
  
  const content = await fs.readFile(filePath, 'utf-8');
  
  let template = `// Fichier adapté pour la nouvelle architecture à trois couches\n`;
  
  // Ajouter l'import de la classe abstraite
  template += `import { ${agentType.abstractClass}, ${agentType.configInterface} } from '${agentType.abstractClassPath}';\n`;
  template += `import { AgentContext } from '../../core/mcp-agent';\n\n`;
  
  // Remplacer la classe par celle qui hérite de la classe abstraite appropriée
  template += content.replace(
    new RegExp(`export\\s+class\\s+${agentInfo.className}\\s+extends\\s+\\w+\\s*\\{`),
    `export class ${agentInfo.className} extends ${agentType.abstractClass} {\n  // Propriétés d'identité de l'agent requises par ${agentType.abstractClass}\n  public id: string = '${agentInfo.className.toLowerCase()}';\n  public name: string = '${agentInfo.className}';\n  public version: string = '1.0.0'; // À adapter\n  public description: string = 'Agent ${agentInfo.className}'; // À compléter\n`
  );
  
  return template;
}

/**
 * Interface utilisateur en ligne de commande
 */
async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
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
  const backupPath = filePath + '.backup';
  
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
  console.log('Recherche des fichiers d\'agents...');
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
        console.log('Type d\'agent non déterminé, passage au fichier suivant.');
        continue;
      }
      
      console.log(`- Type d'agent déterminé: ${agentType.type}`);
      
      // Vérifier si l'agent a déjà été adapté
      if (agentInfo.extendsClass === agentType.abstractClass) {
        console.log('Cet agent est déjà adapté à la nouvelle architecture.');
        continue;
      }
      
      const answer = await promptUser(`Adapter cet agent à la nouvelle architecture? (y/n): `);
      if (answer.toLowerCase() !== 'y') {
        console.log('Agent ignoré.');
        continue;
      }
      
      console.log('Génération du template pour adapter l\'agent...');
      const template = await generateAgentTemplate(filePath, agentInfo);
      
      const isBackup = await promptUser('Créer une sauvegarde et remplacer le fichier? (y/n): ');
      if (isBackup.toLowerCase() === 'y') {
        await writeAdaptedFile(filePath, template);
      } else {
        // Afficher le template à la place
        console.log('\nTemplate à appliquer manuellement:\n');
        console.log(template.substring(0, 1000) + '...');
      }
    } catch (error) {
      console.error(`Erreur lors du traitement de ${filePath}:`, error);
    }
  }
}

// Exécuter le script
main()
  .then(() => console.log('\nTraitement terminé.'))
  .catch(error => console.error('Erreur:', error));