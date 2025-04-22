#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parsePhpCode } from '../utils/phpParser';
import { saveAuditResult, saveAuditLocally, initSupabase } from '../utils/auditSaver';
import { createLogger } from '../utils/logger';

// Configuration du logger
const logger = createLogger('php-analyzer-v2');

// Fonction principale
async function main() {
  // Analyser les arguments de la ligne de commande
  const args = parseArguments();

  // Afficher l'aide si demandé
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Vérifier si un fichier est spécifié
  if (!args.file && !args.directory) {
    logger.error('Vous devez spécifier un fichier ou un répertoire à analyser');
    showHelp();
    process.exit(1);
  }

  // Initialiser Supabase si nécessaire
  if (args.saveToSupabase) {
    logger.info('Initialisation de la connexion Supabase...');
    if (!initSupabase()) {
      logger.warn('La connexion à Supabase a échoué. Les résultats ne seront pas sauvegardés dans Supabase.');
      args.saveToSupabase = false;
    }
  }

  // Créer le répertoire de sortie si nécessaire
  if (args.outputDir) {
    ensureDirectoryExists(args.outputDir);
  }

  // Analyse d'un seul fichier ou d'un répertoire
  if (args.file) {
    await analyzeFile(args.file, args);
  } else if (args.directory) {
    await analyzeDirectory(args.directory, args);
  }
}

// Fonction pour analyser un seul fichier
async function analyzeFile(filePath: string, args: Args) {
  logger.info(`Analyse du fichier PHP: ${filePath}`);

  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      logger.error(`Le fichier ${filePath} n'existe pas`);
      process.exit(1);
    }

    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');

    // Analyser le code PHP
    const result = parsePhpCode(content, filePath);

    // Sauvegarder dans Supabase si demandé
    if (args.saveToSupabase) {
      try {
        const supabaseResult = await saveAuditResult(filePath, result);
        if (supabaseResult.success) {
          logger.info(`Résultat sauvegardé dans Supabase pour ${filePath}`);
        } else {
          logger.error(`Erreur lors de la sauvegarde dans Supabase: ${supabaseResult.error}`);
        }
      } catch (error) {
        logger.error('Erreur lors de la sauvegarde dans Supabase:', error);
      }
    }

    // Sauvegarder localement si un répertoire de sortie est spécifié
    if (args.outputDir) {
      try {
        const localResult = saveAuditLocally(filePath, result, args.outputDir);
        if (localResult.success) {
          logger.info(`Résultat sauvegardé localement dans ${localResult.outputPath}`);
          logger.info(`Rapport Markdown généré dans ${localResult.mdOutputPath}`);
        } else {
          logger.error(`Erreur lors de la sauvegarde locale: ${localResult.error}`);
        }
      } catch (error) {
        logger.error('Erreur lors de la sauvegarde locale:', error);
      }
    }

    // Afficher le résultat dans la sortie standard si demandé
    if (args.stdout) {
      console.log(JSON.stringify(result, null, 2));
    }

    // Afficher un résumé des résultats
    logger.info(`Analyse terminée pour ${filePath}`);
    logger.info(`Classes trouvées: ${result.classes.length}`);
    logger.info(`Fonctions trouvées: ${result.functions.length}`);
    logger.info(`Problèmes détectés: ${result.issues.length}`);
    logger.info(`Lignes de code: ${result.linesOfCode}`);
    logger.info(`Complexité cyclomatique: ${result.complexity.cyclomaticComplexity}`);
    logger.info(`Indice de maintenabilité: ${result.complexity.maintainabilityIndex}`);

  } catch (error) {
    logger.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
    process.exit(1);
  }
}

// Fonction pour analyser tous les fichiers PHP d'un répertoire
async function analyzeDirectory(directoryPath: string, args: Args) {
  logger.info(`Analyse du répertoire: ${directoryPath}`);

  try {
    // Vérifier si le répertoire existe
    if (!fs.existsSync(directoryPath)) {
      logger.error(`Le répertoire ${directoryPath} n'existe pas`);
      process.exit(1);
    }

    // Trouver tous les fichiers PHP dans le répertoire
    const phpFiles = findPhpFiles(directoryPath, args.recursive);
    logger.info(`Nombre de fichiers PHP trouvés: ${phpFiles.length}`);

    // Limiter le nombre de fichiers si spécifié
    const filesToProcess = args.maxFiles ? phpFiles.slice(0, args.maxFiles) : phpFiles;
    if (args.maxFiles && phpFiles.length > args.maxFiles) {
      logger.info(`Limitation à ${args.maxFiles} fichiers sur ${phpFiles.length} trouvés`);
    }

    // Analyser chaque fichier
    const results = {
      success: 0,
      errors: 0,
      files: [] as any[]
    };

    for (let i = 0; i < filesToProcess.length; i++) {
      const filePath = filesToProcess[i];
      logger.info(`Analyse du fichier ${i + 1}/${filesToProcess.length}: ${filePath}`);

      try {
        // Lire le contenu du fichier
        const content = fs.readFileSync(filePath, 'utf8');

        // Analyser le code PHP
        const result = parsePhpCode(content, filePath);

        // Sauvegarder dans Supabase si demandé
        let supabaseResult;
        if (args.saveToSupabase) {
          try {
            supabaseResult = await saveAuditResult(filePath, result);
            if (supabaseResult.success) {
              logger.info(`Résultat sauvegardé dans Supabase pour ${filePath}`);
            } else {
              logger.error(`Erreur lors de la sauvegarde dans Supabase: ${supabaseResult.error}`);
            }
          } catch (error) {
            logger.error('Erreur lors de la sauvegarde dans Supabase:', error);
          }
        }

        // Sauvegarder localement si un répertoire de sortie est spécifié
        let localResult;
        if (args.outputDir) {
          try {
            localResult = saveAuditLocally(filePath, result, args.outputDir);
            if (localResult.success) {
              logger.info(`Résultat sauvegardé localement dans ${localResult.outputPath}`);
            } else {
              logger.error(`Erreur lors de la sauvegarde locale: ${localResult.error}`);
            }
          } catch (error) {
            logger.error('Erreur lors de la sauvegarde locale:', error);
          }
        }

        // Ajouter le résultat à la liste
        results.success++;
        results.files.push({
          filePath,
          success: true,
          classes: result.classes.length,
          functions: result.functions.length,
          issues: result.issues.length,
          linesOfCode: result.linesOfCode
        });
      } catch (error) {
        logger.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
        results.errors++;
        results.files.push({
          filePath,
          success: false,
          error: (error as Error).message
        });
      }
    }

    // Afficher un résumé
    logger.info(`Analyse terminée pour ${filesToProcess.length} fichiers`);
    logger.info(`Succès: ${results.success}`);
    logger.info(`Erreurs: ${results.errors}`);

    // Écrire un rapport global si un répertoire de sortie est spécifié
    if (args.outputDir) {
      const summaryPath = path.join(args.outputDir, 'analysis_summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf8');
      logger.info(`Résumé de l'analyse sauvegardé dans ${summaryPath}`);
    }

    // Afficher le résultat dans la sortie standard si demandé
    if (args.stdout) {
      console.log(JSON.stringify(results, null, 2));
    }

  } catch (error) {
    logger.error(`Erreur lors de l'analyse du répertoire ${directoryPath}:`, error);
    process.exit(1);
  }
}

// Fonction pour trouver tous les fichiers PHP dans un répertoire
function findPhpFiles(directory: string, recursive: boolean): string[] {
  const phpFiles: string[] = [];

  function searchDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && recursive) {
        searchDirectory(filePath);
      } else if (file.endsWith('.php')) {
        phpFiles.push(filePath);
      }
    }
  }

  searchDirectory(directory);
  return phpFiles;
}

// Fonction pour s'assurer qu'un répertoire existe
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Répertoire créé: ${dirPath}`);
  }
}

// Interface pour les arguments
interface Args {
  file?: string;
  directory?: string;
  outputDir?: string;
  saveToSupabase: boolean;
  stdout: boolean;
  recursive: boolean;
  maxFiles?: number;
  help: boolean;
}

// Fonction pour analyser les arguments de la ligne de commande
function parseArguments(): Args {
  const args: Args = {
    saveToSupabase: false,
    stdout: false,
    recursive: true,
    help: false
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--file' || arg === '-f') {
      args.file = process.argv[++i];
    } else if (arg === '--directory' || arg === '-d') {
      args.directory = process.argv[++i];
    } else if (arg === '--output-dir' || arg === '-o') {
      args.outputDir = process.argv[++i];
    } else if (arg === '--save-to-supabase' || arg === '-s') {
      args.saveToSupabase = true;
    } else if (arg === '--stdout') {
      args.stdout = true;
    } else if (arg === '--no-recursive') {
      args.recursive = false;
    } else if (arg === '--max-files') {
      args.maxFiles = parseInt(process.argv[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log(`
PHP Analyzer v2 - Outil d'analyse de code PHP

Usage:
  node php-analyzer-v2.js [options]

Options:
  --file, -f <chemin>            Chemin vers le fichier PHP à analyser
  --directory, -d <chemin>       Chemin vers le répertoire contenant des fichiers PHP
  --output-dir, -o <chemin>      Répertoire de sortie pour les résultats
  --save-to-supabase, -s         Sauvegarder les résultats dans Supabase
  --stdout                       Afficher les résultats dans la sortie standard
  --no-recursive                 Ne pas rechercher récursivement dans les sous-répertoires
  --max-files <nombre>           Nombre maximum de fichiers à analyser
  --help, -h                     Afficher cette aide

Exemples:
  node php-analyzer-v2.js --file ./src/Controller.php
  node php-analyzer-v2.js --directory ./src --output-dir ./reports
  node php-analyzer-v2.js --directory ./src --save-to-supabase --max-files 10
  `);
}

// Exécution du script
main().catch(error => {
  logger.error('Erreur non gérée:', error);
  process.exit(1);
});