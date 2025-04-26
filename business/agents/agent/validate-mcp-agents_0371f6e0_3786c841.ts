#!/usr/bin/env node
/**
 * Script de validation des agents MCP
 * Vérifie que les agents sont bien utilisés depuis le package centralisé
 */

import fs from fsstructure-agent';
import path from pathstructure-agent';
import chalk from chalkstructure-agent';

// Fonction pour vérifier si le module est disponible
function isModuleAvailable(name: string): boolean {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
}

// Lire les noms d'agents depuis le répertoire si le package n'est pas disponible
function getAgentsFromDirectory(): string[] {
  const agents: string[] = [];
  const agentsBasePath = path.resolve(__dirname, '../packagesDoDotmcp-agents');
  
  if (fs.existsSync(agentsBasePath)) {
    // Vérifier les fichiers à la racine du package
    const rootFiles = fs.readdirSync(agentsBasePath, { withFileTypes: true })
      .filter(dirent => !dirent.isDirectory() && (dirent.name.endsWith('.ts') || dirent.name.endsWith('.js')))
      .map(dirent => dirent.name.replace(/\.(ts|js)$/, ''))
      .filter(name => name !== 'index');
    
    agents.push(...rootFiles);
    
    // Vérifier les sous-dossiers
    const directories = fs.readdirSync(agentsBasePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const dir of directories) {
      if (dir !== 'node_modules' && dir !== 'dist') {
        const dirPath = path.join(agentsBasePath, dir);
        const files = fs.readdirSync(dirPath, { withFileTypes: true })
          .filter(dirent => !dirent.isDirectory() && (dirent.name.endsWith('.ts') || dirent.name.endsWith('.js')))
          .map(dirent => dirent.name.replace(/\.(ts|js)$/, ''));
        
        agents.push(...files.map(file => `${dir}/${file}`));
      }
    }
  }
  
  return agents;
}

// Fonction principale
async function main() {
  console.log(chalk.blue('=== Validation de l\'utilisation des agents MCP ==='));
  
  // Déterminer les agents disponibles
  let agentRegistry: any = {};
  let agentNames: string[] = [];
  
  if (isModuleAvailable('@fafaDoDotmcp-agents')) {
    try {
      constDoDotmcpAgents = require(@fafaDoDotmcp-agentsstructure-agent');
      agentRegistry =DoDotmcpAgents.agentRegistry || {};
      agentNames = Object.keys(agentRegistry);
      console.log(chalk.green('✅ Package @fafaDoDotmcp-agents trouvé et chargé avec succès.'));
    } catch (error: any) {
      console.log(chalk.yellow('⚠️ Package @fafaDoDotmcp-agents trouvé mais erreur lors du chargement:'), error.message || String(error));
      agentNames = getAgentsFromDirectory();
    }
  } else {
    console.log(chalk.yellow('⚠️ Package @fafaDoDotmcp-agents non trouvé. Recherche des agents dans le répertoire...'));
    agentNames = getAgentsFromDirectory();
  }
  
  // Liste des agents disponibles
  console.log(chalk.cyan('\nAgents disponibles:'));
  if (agentNames.length === 0) {
    console.log(chalk.yellow('  Aucun agent trouvé. Vérifiez que le package @fafaDoDotmcp-agents est correctement configuré.'));
  } else {
    agentNames.forEach(agentName => {
      console.log(`  - ${agentName}`);
    });
  }

  // Vérifier les imports dans les fichiers du projet
  console.log(chalk.cyan('\nAnalyse des imports dans le code:'));
  
  const sourceDirectories = [
    path.resolve(__dirname, '../appsDoDotmcp-server'),
    path.resolve(__dirname, '../apps/backend')
  ];
  
  let incorrectImports = 0;
  let correctImports = 0;
  
  for (const sourceDir of sourceDirectories) {
    if (!fs.existsSync(sourceDir)) {
      console.log(chalk.yellow(`⚠️ Répertoire non trouvé: ${sourceDir}`));
      continue;
    }
    
    console.log(chalk.blue(`Analyse du répertoire: ${path.relative(process.cwd(), sourceDir)}`));
    const files = getFilesRecursively(sourceDir);
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          
          // Rechercher les imports relatifs d'agents (potentiellement des doublons)
          const relativeAgentImports = content.match(/from\s+['"]\.\.?(\/[\w-]+)*\/agents\/([\w-]+)['"];?/g);
          
          if (relativeAgentImports && relativeAgentImports.length > 0) {
            for (const importStr of relativeAgentImports) {
              const agentName = importStr.match(/agents\/([\w-]+)['"]/)?.[1];
              
              if (agentName && agentNames.includes(agentName)) {
                incorrectImports++;
                console.log(chalk.yellow(`⚠️  Import relatif d'un agent centralisé trouvé dans ${path.relative(process.cwd(), file)}:`));
                console.log(chalk.red(`    ${importStr}`));
                console.log(chalk.green(`    À remplacer par: import { ${agentName}Agent } from @fafaDoDotmcp-agentsstructure-agent';`));
              }
            }
          }
          
          // Rechercher les imports corrects depuis le package centralisé
          const correctAgentImports = content.match(/from\s+['"]@fafa\DoDotmcp-agents(\/[\w-]+)*['"];?/g);
          
          if (correctAgentImports && correctAgentImports.length > 0) {
            correctImports += correctAgentImports.length;
          }
        } catch (error: any) {
          console.error(`Erreur lors de l'analyse du fichier ${file}:`, error.message || String(error));
        }
      }
    }
  }
  
  console.log(chalk.cyan('\nRésultats de l\'analyse:'));
  console.log(`  - ${chalk.green(`${correctImports} imports corrects`)} depuis @fafaDoDotmcp-agents`);
  console.log(`  - ${chalk.yellow(`${incorrectImports} imports incorrects`)} (imports relatifs à remplacer)`);
  
  if (incorrectImports === 0) {
    console.log(chalk.green('\n✅ Tous les imports d\'agents utilisent le package centralisé @fafaDoDotmcp-agents!'));
  } else {
    console.log(chalk.yellow(`\n⚠️  Attention: ${incorrectImports} imports ne sont pas encore migrés vers le package centralisé.`));
    console.log('   Remplacez-les par des imports depuis @fafaDoDotmcp-agents pour éviter les doublons.');
  }

  // Suggestions pour la suite
  console.log(chalk.cyan('\nÉtapes suivantes recommandées:'));
  if (!isModuleAvailable('@fafaDoDotmcp-agents')) {
    console.log(chalk.yellow(`1. Initialisez correctement le package @fafaDoDotmcp-agents s'il n'est pas encore créé.`));
    console.log(chalk.yellow(`2. Assurez-vous que le package est correctement référencé dans les dépendances des applications.`));
    console.log(chalk.yellow(`3. Exécutez 'pnpm install' ou 'npm install' pour installer les dépendances du monorepo.`));
  } else if (incorrectImports > 0) {
    console.log(chalk.yellow(`1. Remplacez progressivement les imports relatifs par des imports depuis @fafaDoDotmcp-agents.`));
    console.log(chalk.yellow(`2. Exécutez ce script régulièrement pour suivre votre progression.`));
  } else {
    console.log(chalk.green(`1. Votre projet utilise déjà correctement le package centralisé d'agents MCP!`));
    console.log(chalk.green(`2. Pensez à ajouter de nouveaux agents directement dans le package @fafaDoDotmcp-agents.`));
  }
}

// Fonction utilitaire pour récupérer tous les fichiers récursivement
function getFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map(dirent => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFilesRecursively(res) : res;
  });
  
  return Array.prototype.concat(...files);
}

// Exécution du script
main().catch((error: any) => {
  console.error(chalk.red('❌ Erreur durant l\'analyse:'));
  console.error(error.message || String(error));
  process.exit(1);
});