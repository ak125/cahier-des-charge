#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Vérifier si un nom de fichier a été fourni
if (process.argv.length < 3) {
  console.error('❌ Usage: ./fix-recursive-structure.js <file-path>');
  process.exit(1);
}

const filePath = process.argv[2];

// Vérifier si le fichier existe
if (!fs.existsSync(filePath)) {
  console.error(`❌ Le fichier ${filePath} n'existe pas`);
  process.exit(1);
}

// Créer une sauvegarde du fichier original
const backupPath = `${filePath}.bak-recursive`;
try {
  fs.copyFileSync(filePath, backupPath);
  console.log(`✓ Sauvegarde créée: ${backupPath}`);
} catch (error) {
  console.error(`❌ Impossible de créer une sauvegarde: ${error.message}`);
  process.exit(1);
}

// Lire le contenu du fichier
let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (error) {
  console.error(`❌ Erreur lors de la lecture du fichier: ${error.message}`);
  process.exit(1);
}

// Fonction pour analyser et corriger la structure des accolades, parenthèses et crochets
function analyzeAndFixBracketStructure(content) {
  const lines = content.split('\n');
  const result = [];

  // Compteurs pour les différents types de délimiteurs
  const counts = {
    '{': 0, '}': 0,
    '(': 0, ')': 0,
    '[': 0, ']': 0,
    '"': 0, "'": 0,
    '`': 0
  };

  // Pile pour suivre l'ordre des délimiteurs ouvrants
  const stack = [];

  // Variables pour suivre l'état du parsing
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let inString = null; // peut être '"', "'" ou '`'
  let lastChar = '';

  // Traitement ligne par ligne
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let newLine = '';

    // Traiter chaque caractère de la ligne
    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      // Gérer les commentaires et les chaînes de caractères
      if (inMultiLineComment) {
        newLine += char;
        if (lastChar === '*' && char === '/') {
          inMultiLineComment = false;
        }
      } else if (inSingleLineComment) {
        newLine += char;
        // Les commentaires sur une ligne se terminent à la fin de la ligne
      } else if (inString !== null) {
        newLine += char;
        if (char === inString && lastChar !== '\\') {
          inString = null;
          counts[char]++;
        }
      } else {
        // Vérifier le début des commentaires et des chaînes
        if (char === '/' && lastChar === '/') {
          inSingleLineComment = true;
          newLine += char;
        } else if (char === '*' && lastChar === '/') {
          inMultiLineComment = true;
          newLine += char;
        } else if (char === '"' || char === "'" || char === '`') {
          inString = char;
          counts[char]++;
          newLine += char;
        } else {
          // Compter les délimiteurs en dehors des commentaires et des chaînes
          if (char === '{' || char === '(' || char === '[') {
            counts[char]++;
            stack.push(char);
            newLine += char;
          } else if (char === '}' || char === ')' || char === ']') {
            const matchingOpen = char === '}' ? '{' : (char === ')' ? '(' : '[');
            counts[char]++;

            if (stack.length > 0 && stack[stack.length - 1] === matchingOpen) {
              stack.pop();
            } else {
              // Délimiteur fermant sans correspondant ouvrant
              console.log(`⚠️ Ligne ${i + 1}: Délimiteur fermant '${char}' sans correspondant ouvrant`);
              // Ne pas l'ajouter à la ligne
              continue;
            }
            newLine += char;
          } else {
            newLine += char;
          }
        }
      }

      lastChar = char;
    }

    // Réinitialiser l'état des commentaires sur une ligne à la fin de la ligne
    if (inSingleLineComment) {
      inSingleLineComment = false;
    }

    result.push(newLine);
  }

  // Vérifier les délimiteurs non fermés et les fermer si nécessaire
  let appendix = '';
  while (stack.length > 0) {
    const opener = stack.pop();
    const closer = opener === '{' ? '}' : (opener === '(' ? ')' : ']');
    appendix += closer;
    console.log(`⚠️ Ajout d'un délimiteur fermant '${closer}' manquant`);
  }

  // Afficher un résumé des corrections
  console.log('--- Résumé des délimiteurs ---');
  console.log(`Accolades: ${counts['{']} ouvrantes, ${counts['}']} fermantes`);
  console.log(`Parenthèses: ${counts['(']} ouvrantes, ${counts[')']} fermantes`);
  console.log(`Crochets: ${counts['[']} ouvrantes, ${counts[']']} fermantes`);
  console.log(`Guillemets doubles: ${counts['"']} (devrait être pair)`);
  console.log(`Guillemets simples: ${counts["'"]} (devrait être pair)`);
  console.log(`Backticks: ${counts['`']} (devrait être pair)`);

  // Corriger les chaînes non fermées
  let finalContent = result.join('\n');
  if (counts['"'] % 2 !== 0) {
    finalContent += '"';
    console.log('⚠️ Ajout d\'un guillemet double manquant');
  }
  if (counts["'"] % 2 !== 0) {
    finalContent += "'";
    console.log('⚠️ Ajout d\'un guillemet simple manquant');
  }
  if (counts['`'] % 2 !== 0) {
    finalContent += '`';
    console.log('⚠️ Ajout d\'un backtick manquant');
  }

  // Ajouter les délimiteurs fermants manquants
  if (appendix) {
    finalContent += '\n' + appendix;
  }

  return finalContent;
}

// Fonction pour corriger les virgules incorrectes
function fixCommaIssues(content) {
  // Corriger les virgules incorrectes dans les conditions
  let result = content.replace(/if\s*\(([^,;)]*),\s*([^,;)]*)\)/g, (match, left, right) => {
    if (!/[=!<>]/.test(left) && /[=!<>]/.test(right)) {
      return `if (${left} ${right})`;
    }
    return match;
  });

  // Corriger les virgules incorrectes dans les expressions
  result = result.replace(/([a-zA-Z0-9_)\]"']+)\s*,\s*([=!<>]+)\s*([a-zA-Z0-9_("']+)/g, (match, left, op, right) => {
    return `${left} ${op} ${right}`;
  });

  // Corriger les virgules incorrectes dans les définitions d'objets
  result = result.replace(/([a-zA-Z0-9_]+)\s*,\s*:/g, '$1:');

  return result;
}

// Fonction pour corriger les imports TypeScript malformés
function fixTypeScriptImports(content) {
  // Corriger les imports avec des guillemets supplémentaires
  let result = content.replace(/import\s+(.+?)\s+from\s+(['"])(['"])(.+?)(['"])(['"])/g, 'import $1 from $2$4$5');

  // Corriger les imports avec des virgules incorrectes
  result = result.replace(/import\s*{\s*([^}]*),\s*}\s*from/g, (match, imports) => {
    return `import { ${imports.replace(/,\s*$/, '')} } from`;
  });

  return result;
}

// Appliquer les corrections dans l'ordre
console.log('Étape 1: Correction des imports TypeScript');
let correctedContent = fixTypeScriptImports(content);

console.log('Étape 2: Correction des virgules incorrectes');
correctedContent = fixCommaIssues(correctedContent);

console.log('Étape 3: Analyse et correction de la structure des délimiteurs');
correctedContent = analyzeAndFixBracketStructure(correctedContent);

// Écrire le contenu corrigé dans le fichier
try {
  fs.writeFileSync(filePath, correctedContent, 'utf-8');
  console.log(`✓ Corrections structurelles appliquées à ${filePath}`);

  // Vérifier si le fichier est maintenant valide avec TypeScript
  try {
    execSync(`npx tsc --noEmit --allowJs ${filePath}`, { stdio: 'pipe' });
    console.log('✓ Le fichier passe maintenant la vérification TypeScript');
  } catch (error) {
    console.log('⚠️ Des erreurs TypeScript persistent après correction');
    console.log('Envisagez une correction manuelle ou une analyse plus approfondie');
  }
} catch (error) {
  console.error(`❌ Erreur lors de l'écriture des corrections: ${error.message}`);
  process.exit(1);
}

/**
 * Script de correction avancé pour résoudre les problèmes de fusion récursive
 * et les collisions de nommage dans les agents MCP.
 *
 * Ce script:
 * 1. Identifie les structures récursives problématiques
 * 2. Extrait la version correcte de chaque fichier
 * 3. Sauvegarde ces fichiers
 * 4. Nettoie la structure de répertoires récursive
 * 5. Restaure les fichiers corrects
 *
 * Usage: node fix-recursive-structure.js
 */

const AGENTS_DIR = path.join(__dirname, 'packages/mcp-agents');
const CLEAN_BACKUP_DIR = path.join(__dirname, 'clean-structure-backups');
const PROBLEMATIC_PATTERNS = [
  {
    name: 'QaAnalyzer',
    dir: path.join(AGENTS_DIR, 'analyzers/QaAnalyzer'),
    recursive: 'qa-analyzer',
    mainFile: 'index.ts',
  },
  {
    name: 'CaddyfileGenerator',
    dir: path.join(AGENTS_DIR, 'generators/CaddyfileGenerator'),
    recursive: 'caddyfile-generator',
    mainFile: 'caddyfile-generator.ts',
  },
  {
    name: 'CanonicalValidator',
    dir: path.join(AGENTS_DIR, 'business/validators/canonical-validator'),
    recursive: 'canonical-validator',
    mainFile: 'canonical-validator.ts',
  },
  {
    name: 'SeoChecker',
    dir: path.join(AGENTS_DIR, 'business/validators/seo-checker-agent'),
    recursive: 'seo-checker-agent',
    mainFile: 'seo-checker-agent.ts',
  },
];

// Créer le répertoire de sauvegarde propre s'il n'existe pas
if (!fs.existsSync(CLEAN_BACKUP_DIR)) {
  fs.mkdirSync(CLEAN_BACKUP_DIR, { recursive: true });
}

console.log('=== Script de correction de structure récursive ===');
console.log(`Répertoire de sauvegarde: ${CLEAN_BACKUP_DIR}\n`);

/**
 * Analyse la structure récursive pour un modèle spécifique
 */
function analyzeRecursiveStructure(pattern) {
  console.log(`\n--- Analyse de ${pattern.name} ---`);

  if (!fs.existsSync(pattern.dir)) {
    console.log(`Le répertoire ${pattern.dir} n'existe pas. Ignoré.`);
    return null;
  }

  // Recherche de structures récursives
  let findCmd = `find "${pattern.dir}" -name "${pattern.recursive}" -type d | sort`;
  let recursiveDirs;

  try {
    recursiveDirs = execSync(findCmd)
      .toString()
      .trim()
      .split('\n')
      .filter((dir) => dir.length > 0);
  } catch (error) {
    console.log(`Erreur lors de la recherche de structures récursives: ${error.message}`);
    return null;
  }

  console.log(`Structures récursives trouvées: ${recursiveDirs.length}`);

  if (recursiveDirs.length > 1) {
    console.log('Répertoires récursifs détectés:');
    recursiveDirs.forEach((dir) => console.log(`  - ${dir}`));
  }

  // Recherche des fichiers principaux
  let mainFiles = [];
  try {
    findCmd = `find "${pattern.dir}" -name "${pattern.mainFile}" -type f | sort`;
    mainFiles = execSync(findCmd)
      .toString()
      .trim()
      .split('\n')
      .filter((file) => file.length > 0);
  } catch (error) {
    console.log(`Erreur lors de la recherche de fichiers principaux: ${error.message}`);
    return null;
  }

  console.log(`Fichiers principaux trouvés: ${mainFiles.length}`);
  if (mainFiles.length > 0) {
    console.log(`  - ${mainFiles[0]} (version considérée comme principale)`);
    if (mainFiles.length > 1) {
      console.log(`  ... et ${mainFiles.length - 1} autres copies`);
    }
  }

  return {
    recursiveDirs,
    mainFiles,
    // Prendre le fichier principal le plus haut dans la hiérarchie comme référence
    mainFilePath: mainFiles.length > 0 ? mainFiles[0] : null,
  };
}

/**
 * Sauvegarde le fichier principal et clean la structure récursive
 */
function cleanAndRestore(pattern, analysis) {
  if (!analysis || !analysis.mainFilePath) {
    console.log(`Pas de fichier principal trouvé pour ${pattern.name}. Ignoré.`);
    return false;
  }

  const backupPath = path.join(
    CLEAN_BACKUP_DIR,
    `${pattern.name}-${path.basename(analysis.mainFilePath)}`
  );

  console.log(`\n--- Nettoyage de ${pattern.name} ---`);

  // Backup du fichier principal
  console.log(`Sauvegarde du fichier principal en ${backupPath}`);
  try {
    fs.copyFileSync(analysis.mainFilePath, backupPath);
  } catch (error) {
    console.log(`Erreur lors de la sauvegarde: ${error.message}`);
    return false;
  }

  // Supprimer les dossiers récursifs de niveau 2 et plus
  if (analysis.recursiveDirs.length > 1) {
    console.log('Suppression des structures récursives...');

    // Trier par profondeur (du plus profond au moins profond)
    const sortedDirs = [...analysis.recursiveDirs].sort((a, b) => {
      const depthA = a.split('/').length;
      const depthB = b.split('/').length;
      return depthB - depthA; // Ordre décroissant
    });

    // Garder le premier niveau et supprimer les niveaux plus profonds
    const dirsToKeep = sortedDirs[sortedDirs.length - 1];
    const dirsToRemove = sortedDirs.slice(0, sortedDirs.length - 1);

    console.log(`  Conservation de: ${dirsToKeep}`);
    dirsToRemove.forEach((dir) => {
      console.log(`  Suppression de: ${dir}`);
      try {
        // Utilisez rm -rf pour supprimer les répertoires
        execSync(`rm -rf "${dir}"`);
      } catch (error) {
        console.log(`  Erreur lors de la suppression de ${dir}: ${error.message}`);
      }
    });
  } else {
    console.log('Pas de structures récursives à nettoyer.');
  }

  // Nettoyage des fichiers .merged
  try {
    const mergedFiles = execSync(`find "${pattern.dir}" -name "*.merged*" | wc -l`)
      .toString()
      .trim();
    if (parseInt(mergedFiles) > 0) {
      console.log(`Suppression de ${mergedFiles} fichiers .merged...`);
      execSync(`find "${pattern.dir}" -name "*.merged*" -delete`);
    } else {
      console.log('Pas de fichiers .merged à nettoyer.');
    }
  } catch (error) {
    console.log(`Erreur lors du nettoyage des fichiers .merged: ${error.message}`);
  }

  // Nettoyage des dossiers _backup_
  try {
    const backupDirs = execSync(`find "${pattern.dir}" -type d -name "*_backup_*" | wc -l`)
      .toString()
      .trim();
    if (parseInt(backupDirs) > 0) {
      console.log(`Suppression de ${backupDirs} dossiers de backup...`);
      execSync(
        `find "${pattern.dir}" -type d -name "*_backup_*" -exec rm -rf {} \\; 2>/dev/null || true`
      );
    } else {
      console.log('Pas de dossiers de backup à nettoyer.');
    }
  } catch (error) {
    console.log(`Erreur lors du nettoyage des dossiers de backup: ${error.message}`);
  }

  return true;
}

/**
 * Vérifie la présence de collisions de noms dans les packages.json
 */
function checkPackageNameCollisions() {
  console.log('\n--- Vérification des collisions de noms dans package.json ---');

  try {
    // Trouver tous les package.json
    const packageJsons = execSync(`find "${AGENTS_DIR}" -name "package.json" | sort`)
      .toString()
      .trim()
      .split('\n');

    // Extraire les noms des packages
    const packageNames = {};

    packageJsons.forEach((pkgPath) => {
      try {
        if (!pkgPath || pkgPath.length === 0) return;

        const content = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(content);

        if (pkg.name) {
          if (!packageNames[pkg.name]) {
            packageNames[pkg.name] = [];
          }
          packageNames[pkg.name].push(pkgPath);
        }
      } catch (error) {
        console.log(`Impossible de lire ${pkgPath}: ${error.message}`);
      }
    });

    // Vérifier les collisions
    let collisionsFound = false;
    Object.entries(packageNames).forEach(([name, paths]) => {
      if (paths.length > 1) {
        collisionsFound = true;
        console.log(`\nCollision pour le package "${name}":`);
        paths.forEach((p) => console.log(`  - ${p}`));
      }
    });

    if (!collisionsFound) {
      console.log('Aucune collision de noms détectée.');
    } else {
      console.log("\nCes collisions peuvent causer des problèmes avec Jest et d'autres outils.");
      console.log(
        'Suggestion: Renommez les packages ou utilisez un moduleNameMapper personnalisé dans Jest'
      );
    }
  } catch (error) {
    console.log(`Erreur lors de la vérification des collisions: ${error.message}`);
  }
}

// Analyse et nettoyage de chaque modèle problématique
PROBLEMATIC_PATTERNS.forEach((pattern) => {
  const analysis = analyzeRecursiveStructure(pattern);
  if (analysis) {
    cleanAndRestore(pattern, analysis);
  }
});

// Vérifier les collisions de noms
checkPackageNameCollisions();

console.log('\n=== Nettoyage terminé ===');
console.log(`Les fichiers originaux ont été sauvegardés dans: ${CLEAN_BACKUP_DIR}`);
console.log('Exécutez à nouveau les tests pour vérifier que les problèmes sont résolus.');
