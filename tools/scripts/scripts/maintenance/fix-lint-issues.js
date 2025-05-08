#!/usr/bin/env node

/**
 * fix-lint-issues.js
 * Script automatisé pour corriger les erreurs de lint dans le projet
 * Ce script combine plusieurs approches pour corriger un maximum d'erreurs automatiquement
 */

const fs = require('fs');
const _path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const glob = promisify(require('glob').glob);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Configuration
const CONFIG = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  ignorePatterns: ['node_modules', 'dist', 'build', '.git', 'coverage', 'backups', 'temp', 'tmp'],
  maxConcurrentFiles: 50, // Limite pour éviter des problèmes de mémoire
  batchSize: 200,
};

// Statistiques
const stats = {
  filesScanned: 0,
  filesCorrected: 0,
  filesWithErrors: 0,
  correctionsByType: {
    imports: 0,
    forEach: 0,
    noAssignInExpressions: 0,
    noParameterAssign: 0,
    unusedVariables: 0,
    other: 0,
  },
};

/**
 * Couleurs pour la console
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Affiche un message avec formatage
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Trouve tous les fichiers à traiter
 */
async function findFilesToProcess() {
  const ignorePattern = `{${CONFIG.ignorePatterns.join(',')}}`;
  const extensions = CONFIG.extensions.join(',');
  const pattern = `**/*{${extensions}}`;

  log(`🔍 Recherche des fichiers ${extensions}...`, colors.cyan);
  const files = await glob(pattern, {
    ignore: `**/${ignorePattern}/**`,
    nodir: true,
  });

  log(`📁 ${files.length} fichiers trouvés`, colors.green);
  return files;
}

/**
 * Corrige les problèmes d'importation
 */
async function fixImports(content, _filePath) {
  let newContent = content;
  let fixCount = 0;

  // Patterns
  const patterns = [
    // import sans guillemets
    {
      regex: /import\s+\{\s*([^}]+)\s*\}\s+from\s+([^'"]+)['"];/g,
      replacer: (_match, importName, path) => {
        if (path.startsWith('.') || path.startsWith('/')) {
          return `import { ${importName} } from '${path}';`;
        }
        return `import { ${importName} } from './${path}';`;
      },
    },
    // import sans guillemets (import par défaut)
    {
      regex: /import\s+(\w+)\s+from\s+([^'"]+)['"];/g,
      replacer: (_match, importName, path) => {
        if (path.startsWith('.') || path.startsWith('/')) {
          return `import ${importName} from '${path}';`;
        }
        return `import ${importName} from './${path}';`;
      },
    },
    // double import
    {
      regex: /import\s+import\s+/g,
      replacer: 'import ',
    },
    // require sans guillemets
    {
      regex: /require\(([^'"](.*?)['"])/g,
      replacer: "require('$1",
    },
    // from structure-agent avec erreurs
    {
      regex: /(from|require\(['"]{0,1})(.+?)structure-agent(['"]{0,1}\)?;?)/g,
      replacer: (_match, prefix, path, suffix) => {
        // Assurer que le chemin se termine par un slash s'il n'est pas vide
        const cleanPath = path === '' || path.endsWith('/') ? path : `${path}/`;
        // Assurer que suffix commence par un guillemet si ce n'est pas déjà le cas
        const cleanSuffix =
          suffix.startsWith("'") || suffix.startsWith('"') ? suffix : `'${suffix}`;
        return `${prefix}'${cleanPath}structure-agent${cleanSuffix}`;
      },
    },
    // Structure spécifique à votre codebase
    {
      regex: /structure-agentstructure-agent/g,
      replacer: 'structure-agent',
    },
    // Import mal formé avec suffix structure-agent
    {
      regex: /from\s+(.+?)structure-agent['"];/g,
      replacer: (match, path) => {
        if (path.startsWith("'") || path.startsWith('"')) {
          return match;
        }
        return `from '${path}structure-agent';`;
      },
    },
  ];

  // Appliquer toutes les corrections
  for (const pattern of patterns) {
    const originalContent = newContent;
    newContent = newContent.replace(pattern.regex, pattern.replacer);
    if (newContent !== originalContent) {
      fixCount++;
    }
  }

  if (fixCount > 0) {
    stats.correctionsByType.imports += fixCount;
    return { content: newContent, fixed: true };
  }

  return { content: newContent, fixed: false };
}

/**
 * Corrige les problèmes de forEach
 */
async function fixForEach(content) {
  let newContent = content;
  let fixCount = 0;

  // Pattern pour forEach avec => { }
  const forEachPattern = /(\w+)\.forEach\(\s*(\([^)]*\)|[^(,]+)\s*=>\s*\{([\s\S]*?)\}\s*\);/g;

  // Remplacer forEach par for...of
  newContent = newContent.replace(forEachPattern, (_match, array, params, body) => {
    // Extraction des paramètres
    let itemParam;
    let indexParam;

    // Cas avec les parenthèses: (item, index) => { ... }
    if (params.startsWith('(')) {
      const paramsContent = params.substring(1, params.length - 1).split(',');
      itemParam = paramsContent[0].trim();
      indexParam = paramsContent.length > 1 ? paramsContent[1].trim() : null;
    } else {
      // Cas sans parenthèses: item => { ... }
      itemParam = params.trim();
      indexParam = null;
    }

    // Si on a un index, utiliser entries()
    if (indexParam) {
      fixCount++;
      return `for (const [${indexParam}, ${itemParam}] of ${array}.entries()) {${body}}`;
    }
    fixCount++;
    return `for (const ${itemParam} of ${array}) {${body}}`;
  });

  if (fixCount > 0) {
    stats.correctionsByType.forEach += fixCount;
    return { content: newContent, fixed: true };
  }

  return { content: newContent, fixed: false };
}

/**
 * Corrige les problèmes d'assignation dans les expressions
 */
async function fixAssignInExpressions(content) {
  let newContent = content;
  let fixCount = 0;

  // Pattern pour les assignations dans les while conditions
  const whileAssignPattern = /while\s*\(\s*\(([^=]+)\s*=\s*([^)]+)\)\s*!==\s*null\s*\)/g;

  // Remplacer par une structure plus claire
  newContent = newContent.replace(whileAssignPattern, (_match, variable, expression) => {
    fixCount++;
    return `while (true) {\n  ${variable} = ${expression};\n  if (${variable} === null) break;`;
  });

  if (fixCount > 0) {
    stats.correctionsByType.noAssignInExpressions += fixCount;
    return { content: newContent, fixed: true };
  }

  return { content: newContent, fixed: false };
}

/**
 * Corrige les réassignations de paramètres
 */
async function fixParameterAssign(content) {
  let newContent = content;
  let fixCount = 0;

  // Cette correction est plus complexe et nécessite une analyse syntaxique
  // Pour une solution simplifiée, nous allons chercher les motifs communs

  const functionPattern = /function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;

  newContent = newContent.replace(functionPattern, (_match, name, params, body) => {
    const paramsList = params.split(',').map((p) => p.trim().split('=')[0].trim());

    // Pour chaque paramètre, vérifier s'il est réassigné dans le corps
    let updatedBody = body;
    for (const param of paramsList) {
      if (!param) continue;

      // Détecter la réassignation du paramètre
      const reassignPattern = new RegExp(`\\b${param}\\s*=\\s*`, 'g');

      if (reassignPattern.test(body)) {
        // Ajouter une déclaration locale au début du corps
        fixCount++;
        updatedBody = `\n  let local${param} = ${param};${updatedBody}`;

        // Remplacer toutes les réassignations
        updatedBody = updatedBody.replace(
          new RegExp(`\\b${param}\\s*=\\s*`, 'g'),
          `local${param} = `
        );
      }
    }

    return `function ${name}(${params}) {${updatedBody}}`;
  });

  if (fixCount > 0) {
    stats.correctionsByType.noParameterAssign += fixCount;
    return { content: newContent, fixed: true };
  }

  return { content: newContent, fixed: false };
}

/**
 * Traite un fichier et applique toutes les corrections possibles
 */
async function processFile(filePath) {
  try {
    stats.filesScanned++;

    // Lire le contenu du fichier
    const content = await readFileAsync(filePath, 'utf8');

    // Appliquer les corrections en série
    const result = { content, fixed: false };

    // 1. Corriger les imports
    const importsResult = await fixImports(result.content, filePath);
    if (importsResult.fixed) {
      result.content = importsResult.content;
      result.fixed = true;
    }

    // 2. Corriger les forEach
    const forEachResult = await fixForEach(result.content);
    if (forEachResult.fixed) {
      result.content = forEachResult.content;
      result.fixed = true;
    }

    // 3. Corriger les assignations dans les expressions
    const assignResult = await fixAssignInExpressions(result.content);
    if (assignResult.fixed) {
      result.content = assignResult.content;
      result.fixed = true;
    }

    // 4. Corriger les réassignations de paramètres
    const paramAssignResult = await fixParameterAssign(result.content);
    if (paramAssignResult.fixed) {
      result.content = paramAssignResult.content;
      result.fixed = true;
    }

    // Si des corrections ont été apportées, écrire le fichier
    if (result.fixed) {
      await writeFileAsync(filePath, result.content, 'utf8');
      stats.filesCorrected++;
      return { filePath, fixed: true };
    }

    return { filePath, fixed: false };
  } catch (error) {
    stats.filesWithErrors++;
    return { filePath, error: error.message };
  }
}

/**
 * Traite les fichiers par lots pour éviter les problèmes de mémoire
 */
async function processBatch(files, startIndex) {
  const batchFiles = files.slice(startIndex, Math.min(startIndex + CONFIG.batchSize, files.length));

  if (batchFiles.length === 0) {
    return;
  }

  log(
    `🔄 Traitement du lot ${Math.floor(startIndex / CONFIG.batchSize) + 1}/${Math.ceil(
      files.length / CONFIG.batchSize
    )} (${batchFiles.length} fichiers)`,
    colors.cyan
  );

  // Traiter les fichiers par groupe pour limiter la concurrence
  const results = [];

  for (let i = 0; i < batchFiles.length; i += CONFIG.maxConcurrentFiles) {
    const batchGroup = batchFiles.slice(i, i + CONFIG.maxConcurrentFiles);
    const groupResults = await Promise.all(batchGroup.map((file) => processFile(file)));
    results.push(...groupResults);
  }

  // Afficher les résultats du lot
  const fixedFiles = results.filter((r) => r.fixed).map((r) => r.filePath);
  const errorFiles = results.filter((r) => r.error).map((r) => r.filePath);

  if (fixedFiles.length > 0) {
    log(`✅ ${fixedFiles.length} fichiers corrigés dans ce lot`, colors.green);
  }

  if (errorFiles.length > 0) {
    log(`❌ ${errorFiles.length} fichiers avec erreurs dans ce lot`, colors.red);
  }

  // Traiter le lot suivant
  if (startIndex + CONFIG.batchSize < files.length) {
    await processBatch(files, startIndex + CONFIG.batchSize);
  }
}

/**
 * Exécute Biome avec l'option --apply puis --apply-unsafe
 */
function runBiomeWithFixes() {
  log('\n🔨 Exécution de Biome avec --apply pour les corrections sûres...', colors.cyan);
  try {
    execSync('npx biome check --apply .', { stdio: 'inherit' });
  } catch (_error) {
    log('Biome a rencontré des erreurs, mais a pu appliquer certaines corrections', colors.yellow);
  }

  log('\n🔨 Exécution de Biome avec --apply-unsafe pour les corrections avancées...', colors.cyan);
  try {
    execSync('npx biome check --apply-unsafe .', { stdio: 'inherit' });
  } catch (_error) {
    log('Biome a rencontré des erreurs, mais a pu appliquer certaines corrections', colors.yellow);
  }
}

/**
 * Fonction principale
 */
async function main() {
  const startTime = Date.now();

  log(
    '🚀 Démarrage de la correction automatique des erreurs de lint...',
    colors.bright + colors.cyan
  );

  // 1. Exécuter Biome d'abord pour corriger ce qui peut l'être facilement
  runBiomeWithFixes();

  // 2. Trouver tous les fichiers à traiter
  const files = await findFilesToProcess();

  // 3. Traiter les fichiers par lots
  await processBatch(files, 0);

  // 4. Exécuter Biome une dernière fois pour appliquer les règles
  runBiomeWithFixes();

  // 5. Afficher le résumé des corrections
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  log('\n📊 Résumé des corrections :', colors.bright + colors.cyan);
  log(`- Fichiers analysés: ${stats.filesScanned}`, colors.reset);
  log(`- Fichiers corrigés: ${stats.filesCorrected}`, colors.green);
  log(`- Fichiers avec erreurs: ${stats.filesWithErrors}`, colors.red);
  log('\nTypes de corrections :', colors.bright + colors.cyan);
  log(`- Imports: ${stats.correctionsByType.imports}`, colors.reset);
  log(`- ForEach: ${stats.correctionsByType.forEach}`, colors.reset);
  log(
    `- Assignations dans les expressions: ${stats.correctionsByType.noAssignInExpressions}`,
    colors.reset
  );
  log(`- Réassignations de paramètres: ${stats.correctionsByType.noParameterAssign}`, colors.reset);
  log(`- Autres: ${stats.correctionsByType.other}`, colors.reset);
  log(`\nTemps d'exécution: ${duration} secondes`, colors.cyan);

  log('\n✨ Processus de correction terminé.', colors.bright + colors.green);
}

// Démarrer le processus
main().catch((error) => {
  log(`❌ Une erreur est survenue : ${error.message}`, colors.bright + colors.red);
  process.exit(1);
});
