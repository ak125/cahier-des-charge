#!/usr/bin/env node
/**
 * Script de vérification des imports MCP
 * Identifie les fichiers qui n'utilisent pas encore le package centralisé @fafaDoDotmcp-agents
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Répertoires à analyser
const DIRECTORIES_TO_CHECK = [
  '/workspaces/cahier-des-charge/appsDoDotmcp-server',
  '/workspaces/cahier-des-charge/apps/backend',
  '/workspaces/cahier-des-charge/apps/frontend',
];

// Extensions de fichiers à analyser
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Compteurs pour les statistiques
let totalFiles = 0;
let filesWithLocalImports = 0;
let filesWithCentralizedImports = 0;
let localImportsCount = 0;
let centralizedImportsCount = 0;

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue("=== Vérification des imports d'agents MCP ===\n"));

  // Analyser chaque répertoire
  for (const directory of DIRECTORIES_TO_CHECK) {
    if (!fs.existsSync(directory)) {
      console.log(chalk.yellow(`Répertoire non trouvé, ignoré: ${directory}`));
      continue;
    }

    console.log(chalk.cyan(`Analyse du répertoire: ${directory}`));
    const files = getAllFiles(directory);

    for (const file of files) {
      if (FILE_EXTENSIONS.includes(path.extname(file))) {
        analyzeFile(file);
      }
    }
  }

  // Afficher les statistiques
  console.log(chalk.blue('\n=== Statistiques ==='));
  console.log(`Total de fichiers analysés: ${totalFiles}`);
  console.log(`Fichiers avec imports locaux: ${filesWithLocalImports}`);
  console.log(`Fichiers avec imports centralisés: ${filesWithCentralizedImports}`);
  console.log(`Nombre d'imports locaux: ${localImportsCount}`);
  console.log(`Nombre d'imports centralisés: ${centralizedImportsCount}`);

  // Afficher le statut global
  const ratio = centralizedImportsCount / (localImportsCount + centralizedImportsCount) || 1;
  const percentage = Math.round(ratio * 100);

  console.log(chalk.blue('\n=== Statut global ==='));
  if (percentage === 100) {
    console.log(
      chalk.green(
        '✅ Tous les imports (100%) utilisent le package centralisé @fafaDoDotmcp-agents !'
      )
    );
  } else {
    console.log(chalk.yellow(`⚠️ ${percentage}% des imports utilisent le package centralisé.`));
    console.log(chalk.yellow(`Il reste ${localImportsCount} imports locaux à migrer.`));
  }
}

/**
 * Récupère tous les fichiers récursivement dans un répertoire
 */
function getAllFiles(dir: string): string[] {
  const files: string[] = [];

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // Ignorer les répertoires node_modules et DoDoDoDotgit
      if (item.name !== 'node_modules' && item.name !== 'DoDogit') {
        files.push(...getAllFiles(fullPath));
      }
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Analyse un fichier pour détecter les imports d'agents
 */
function analyzeFile(filePath: string): void {
  try {
    totalFiles++;

    const content = fs.readFileSync(filePath, 'utf-8');

    // Rechercher les imports locaux (relatifs)
    const localAgentImports =
      content.match(/from\s+['"]\.\.?(\/[\w-]+)*\/agents\/([\w-]+)['"];?/g) || [];

    // Rechercher les imports centralisés (@fafaDoDotmcp-agents)
    const centralizedAgentImports =
      content.match(/from\s+['"]@fafa\DoDotmcp-agents(\/[\w-]+)*['"];?/g) || [];

    if (localAgentImports.length > 0) {
      filesWithLocalImports++;
      localImportsCount += localAgentImports.length;

      console.log(
        chalk.yellow(
          `\nFichier avec imports locaux: ${path.relative(
            '/workspaces/cahier-des-charge',
            filePath
          )}`
        )
      );
      localAgentImports.forEach((importStatement) => {
        console.log(chalk.red(`  ${importStatement.trim()}`));

        // Essayer d'extraire le nom de l'agent pour suggérer un remplacement
        const agentName = importStatement.match(/agents\/([\w-]+)['"]/)?.[1];
        if (agentName) {
          console.log(
            chalk.green(
              `  À remplacer par: import { ...  } from './@fafaDoDotmcp-agents/${agentName}structure-agent'`
            )
          );
        }
      });
    }

    if (centralizedAgentImports.length > 0) {
      filesWithCentralizedImports++;
      centralizedImportsCount += centralizedAgentImports.length;
    }
  } catch (error: any) {
    console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error.message);
  }
}

// Exécution du script
main().catch((error) => {
  console.error(chalk.red('Une erreur est survenue:'), error);
  process.exit(1);
});
