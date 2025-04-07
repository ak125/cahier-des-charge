#!/usr/bin/env node

/**
 * Script pour mettre à jour les références technologiques dans le cahier des charges
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const readline = require('readline');

const argv = yargs(hideBin(process.argv))
  .option('replace', {
    alias: 'r',
    description: 'Technologie à remplacer',
    type: 'string',
    demandOption: true
  })
  .option('with', {
    alias: 'w',
    description: 'Technologie de remplacement',
    type: 'string',
    demandOption: true
  })
  .option('files', {
    alias: 'f',
    description: 'Fichiers à modifier (glob pattern)',
    type: 'string'
  })
  .option('yes', {
    alias: 'y',
    description: 'Confirmer automatiquement les modifications',
    type: 'boolean',
    default: false
  })
  .option('context', {
    alias: 'c',
    description: 'Ajouter un contexte de migration',
    type: 'boolean',
    default: true
  })
  .help()
  .alias('help', 'h')
  .argv;

const CDC_DIR = path.join(process.cwd(), 'cahier-des-charges');

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log(chalk.blue(`🔄 Mise à jour de la technologie: ${argv.replace} → ${argv.with}`));
    
    let filesToProcess = [];
    
    if (argv.files) {
      // Si un pattern de fichiers est fourni
      const glob = require('glob');
      filesToProcess = glob.sync(argv.files);
    } else {
      // Sinon, rechercher dans tous les fichiers markdown
      filesToProcess = await findFilesWithTech(CDC_DIR, argv.replace);
    }
    
    if (filesToProcess.length === 0) {
      console.log(chalk.yellow(`⚠️ Aucun fichier trouvé contenant '${argv.replace}'`));
      process.exit(0);
    }
    
    console.log(chalk.blue(`📁 ${filesToProcess.length} fichiers à traiter:`));
    filesToProcess.forEach(file => console.log(`  - ${file}`));
    
    if (!argv.yes) {
      const confirmed = await confirmAction(`Voulez-vous continuer? [y/N] `);
      if (!confirmed) {
        console.log(chalk.yellow('⚠️ Opération annulée'));
        process.exit(0);
      }
    }
    
    // Traiter chaque fichier
    let updatedFiles = 0;
    for (const file of filesToProcess) {
      const updated = await updateTechInFile(file, argv.replace, argv.with);
      if (updated) {
        updatedFiles++;
      }
    }
    
    console.log(chalk.green(`✅ Mise à jour terminée: ${updatedFiles} fichiers modifiés`));
    
    // Mise à jour du changelog
    await updateChangelog(argv.replace, argv.with, updatedFiles);
    
    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Trouve les fichiers contenant une technologie spécifique
 */
async function findFilesWithTech(dir, tech) {
  const files = [];
  const allFiles = await findMarkdownFiles(dir);
  
  // Créer une expression régulière pour rechercher la technologie
  const techRegex = new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i');
  
  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf8');
    if (techRegex.test(content)) {
      files.push(file);
    }
  }
  
  return files;
}

/**
 * Trouve tous les fichiers markdown récursivement
 */
async function findMarkdownFiles(dir) {
  const files = [];
  
  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Met à jour les références technologiques dans un fichier
 */
async function updateTechInFile(filePath, oldTech, newTech) {
  let content = await fs.readFile(filePath, 'utf8');
  const originalContent = content;
  
  // Créer une expression régulière pour rechercher la technologie
  const techRegex = new RegExp(`\\b${escapeRegExp(oldTech)}\\b`, 'gi');
  
  // Compter les occurrences
  const matches = content.match(techRegex) || [];
  if (matches.length === 0) {
    return false;
  }
  
  // Remplacer la technologie
  content = content.replace(techRegex, newTech);
  
  // Ajouter un encadré de contexte si demandé
  if (argv.context && !content.includes('[!MIGRATION]')) {
    const migrationNote = `
> [!MIGRATION]
> Ce document fait référence à la technologie **${newTech}**, qui remplace **${oldTech}** précédemment utilisée.
> La migration a été effectuée le ${new Date().toLocaleDateString()} pour améliorer les performances et la maintenabilité.
`;
    
    // Insérer après le premier titre
    const titleMatch = content.match(/^# .*/m);
    if (titleMatch) {
      const index = titleMatch.index + titleMatch[0].length;
      content = content.substring(0, index) + '\n' + migrationNote + content.substring(index);
    } else {
      content = migrationNote + content;
    }
  }
  
  // Écrire le contenu mis à jour
  if (content !== originalContent) {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(chalk.green(`✅ Fichier mis à jour: ${filePath} (${matches.length} occurrences)`));
    return true;
  }
  
  return false;
}

/**
 * Échappe les caractères spéciaux dans une expression régulière
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Demande une confirmation utilisateur
 */
async function confirmAction(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Met à jour le changelog avec l'information de migration
 */
async function updateChangelog(oldTech, newTech, fileCount) {
  const changelogPath = path.join(CDC_DIR, 'changelog.md');
  
  try {
    let content = await fs.readFile(changelogPath, 'utf8');
    
    // Ajouter l'entrée au changelog
    const date = new Date().toISOString().split('T')[0];
    const newEntry = `
## ${date} - Migration technologique

- Migration de **${oldTech}** vers **${newTech}**
- Mise à jour de ${fileCount} fichier(s) du cahier des charges
- Migration initiée suite à l'analyse d'obsolescence technologique
`;
    
    content = newEntry + content;
    
    await fs.writeFile(changelogPath, content, 'utf8');
    console.log(chalk.green('✅ Changelog mis à jour'));
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Impossible de mettre à jour le changelog: ${error.message}`));
  }
}

// Exécuter le script
main();
