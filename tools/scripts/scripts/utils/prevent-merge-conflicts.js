#!/usr/bin/env node

/**
 * Script de vérification pré-commit pour empêcher les collisions de noms et autres problèmes structurels
 *
 * Ce script effectue les vérifications suivantes :
 * 1. Détection de collisions de noms dans les package.json
 * 2. Vérification de la profondeur excessive des dossiers (>5 niveaux)
 * 3. Détection des structures récursives problématiques
 * 4. Recherche de fichiers temporaires de fusion (.merged)
 * 5. Recherche de dossiers de backup temporaires
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASE_DIR = process.cwd();
const MAX_DEPTH = 5;
const MAX_PATH_LENGTH = 255;

// Statistiques
let errorCount = 0;
let warningCount = 0;

// Couleurs pour la sortie console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Fonction pour trouver récursivement les dossiers et calculer leur profondeur
function findFoldersWithDepth(baseDir, maxDepth) {
  const results = [];

  function traverseDir(dir, depth) {
    if (depth > maxDepth) {
      results.push({ path: dir, depth: depth });
      return;
    }

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            traverseDir(itemPath, depth + 1);
          }
        } catch (_error) {
          // Ignorer les erreurs d'accès à certains fichiers/dossiers
        }
      }
    } catch (_error) {
      // Ignorer les erreurs de lecture de dossier
    }
  }

  traverseDir(baseDir, 0);
  return results;
}

// Fonction pour détecter les structures récursives
function findRecursiveStructures(baseDir) {
  const results = [];
  const nameOccurrences = new Map();

  function traverseDir(dir, pathParts = []) {
    try {
      const dirName = path.basename(dir);
      pathParts.push(dirName);

      // Vérifier si un dossier de même nom existe dans le chemin parent
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (pathParts[i] === dirName) {
          const fullPath = path.join(baseDir, ...pathParts.slice(0, pathParts.length));
          results.push(fullPath);
          break;
        }
      }

      // Enregistrer l'occurrence du nom
      if (!nameOccurrences.has(dirName)) {
        nameOccurrences.set(dirName, 0);
      }
      nameOccurrences.set(dirName, nameOccurrences.get(dirName) + 1);

      // Parcourir les sous-dossiers
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            traverseDir(itemPath, [...pathParts]);
          }
        } catch (_error) {
          // Ignorer les erreurs d'accès
        }
      }
    } catch (_error) {
      // Ignorer les erreurs de lecture
    }
  }

  traverseDir(baseDir);

  // Trouver les dossiers qui ont le même nom à plusieurs endroits
  const duplicatedNames = [...nameOccurrences.entries()]
    .filter(([name, count]) => count > 20 && name.length > 2) // Ignorer les noms courts et peu fréquents
    .map(([name]) => name);

  return { recursivePaths: results, duplicatedNames };
}

// Fonction pour collecter les infos sur les packages.json
function collectPackageInfo(baseDir) {
  const packageFiles = [];

  function findPackageJsonFiles(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            findPackageJsonFiles(itemPath);
          } else if (item === 'package.json') {
            packageFiles.push(itemPath);
          }
        } catch (_error) {
          // Ignorer les erreurs d'accès
        }
      }
    } catch (_error) {
      // Ignorer les erreurs de lecture
    }
  }

  findPackageJsonFiles(baseDir);

  const packages = {};

  for (const filePath of packageFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const packageData = JSON.parse(fileContent);
      const packageName = packageData.name;

      if (packageName) {
        if (!packages[packageName]) {
          packages[packageName] = [];
        }
        packages[packageName].push(filePath);
      }
    } catch (_error) {
      // Ignorer les erreurs de lecture/parsing
    }
  }

  const collisions = {};
  for (const [name, files] of Object.entries(packages)) {
    if (files.length > 1) {
      collisions[name] = files;
    }
  }

  return { packageFiles: packageFiles.length, collisions };
}

// Fonction pour trouver des fichiers par motif
function findFilesByPattern(baseDir, pattern) {
  const results = [];

  function traverseDir(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            traverseDir(itemPath);
          } else if (pattern.test(item)) {
            results.push(itemPath);
          }
        } catch (_error) {
          // Ignorer les erreurs d'accès
        }
      }
    } catch (_error) {
      // Ignorer les erreurs de lecture
    }
  }

  traverseDir(baseDir);
  return results;
}

// Fonction pour trouver des dossiers par motif
function findFoldersByPattern(baseDir, pattern) {
  const results = [];

  function traverseDir(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            if (pattern.test(item)) {
              results.push(itemPath);
            }
            traverseDir(itemPath);
          }
        } catch (_error) {
          // Ignorer les erreurs d'accès
        }
      }
    } catch (_error) {
      // Ignorer les erreurs de lecture
    }
  }

  traverseDir(baseDir);
  return results;
}

// Fonction principale
function main() {
  console.log(
    `${colors.blue}1. Recherche de dossiers avec une profondeur excessive...${colors.reset}`
  );
  const deepFolders = findFoldersWithDepth(BASE_DIR, MAX_DEPTH);

  if (deepFolders.length > 0) {
    warningCount += deepFolders.length;
    for (const folder of deepFolders) {
      console.log(
        `  ${colors.yellow}Profondeur excessive: ${folder.path} (${folder.depth} niveaux, max: ${MAX_DEPTH})${colors.reset}`
      );
    }
  } else {
    console.log(`  ${colors.green}✅ Aucun dossier trop profond détecté.${colors.reset}`);
  }

  console.log(
    `\n${colors.blue}2. Recherche de collisions de noms dans les package.json...${colors.reset}`
  );
  const { packageFiles, collisions } = collectPackageInfo(BASE_DIR);
  console.log(`  ${packageFiles} fichiers package.json trouvés.`);

  if (Object.keys(collisions).length > 0) {
    errorCount += Object.keys(collisions).length;
    for (const [name, files] of Object.entries(collisions)) {
      console.log(`  ${colors.red}⚠️ Collision pour "${name}":${colors.reset}`);
      for (const filePath of files) {
        console.log(`    - ${filePath}`);
      }
    }
  } else {
    console.log(`  ${colors.green}✅ Aucune collision de nom détectée.${colors.reset}`);
  }

  console.log(`\n${colors.blue}3. Recherche de chemins de fichiers trop longs...${colors.reset}`);
  const { recursivePaths, duplicatedNames } = findRecursiveStructures(BASE_DIR);

  const longPaths = recursivePaths.filter((p) => p.length > MAX_PATH_LENGTH);
  if (longPaths.length > 0) {
    errorCount += longPaths.length;
    for (const longPath of longPaths) {
      console.log(
        `  ${colors.red}⚠️ Chemin trop long: ${longPath} (${longPath.length} caractères, max: ${MAX_PATH_LENGTH})${colors.reset}`
      );
    }
  } else {
    console.log(`  ${colors.green}✅ Aucun chemin de fichier trop long détecté.${colors.reset}`);
  }

  console.log(
    `\n${colors.blue}4. Recherche de fichiers fusionnés (.merged) restants...${colors.reset}`
  );
  const mergedFiles = findFilesByPattern(BASE_DIR, /\.merged$/);

  if (mergedFiles.length > 0) {
    errorCount += mergedFiles.length;
    for (const mergedFile of mergedFiles) {
      console.log(`  ${colors.red}⚠️ Fichier fusionné restant: ${mergedFile}${colors.reset}`);
    }
  } else {
    console.log(`  ${colors.green}✅ Aucun fichier .merged restant détecté.${colors.reset}`);
  }

  console.log(`\n${colors.blue}5. Recherche de dossiers de backup restants...${colors.reset}`);
  const backupFolders = findFoldersByPattern(BASE_DIR, /backup|\.bak$/i);

  if (backupFolders.length > 0) {
    warningCount += backupFolders.length;
    for (const backupFolder of backupFolders) {
      console.log(`  ${colors.yellow}⚠️ Dossier de backup: ${backupFolder}${colors.reset}`);
    }
  } else {
    console.log(`  ${colors.green}✅ Aucun dossier de backup restant détecté.${colors.reset}`);
  }

  console.log(`\n${colors.blue}=== Résumé ===${colors.reset}`);
  console.log(`${colors.green}✓ Erreurs détectées: ${errorCount}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Avertissements: ${warningCount}${colors.reset}\n`);

  if (errorCount > 0) {
    console.log(
      `${colors.red}⛔ Des erreurs critiques ont été détectées. Correction nécessaire avant de continuer.${colors.reset}`
    );
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(
      `${colors.yellow}⚠️ Des avertissements ont été détectés. Veuillez les examiner avant de continuer.${colors.reset}`
    );
    process.exit(0);
  } else {
    console.log(
      `${colors.green}✅ Aucun problème détecté. La structure du projet est propre.${colors.reset}`
    );
    process.exit(0);
  }
}

// Exécution du script
main();
