#!/usr/bin/env node

/**
 * Script de validation pour Git pre-commit
 * Vérifie les collisions de noms de packages et la structure du projet
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = process.cwd();
const PACKAGES_DIR = path.join(BASE_DIR, 'packages');
const MAX_DEPTH = 5;

// Couleurs pour la sortie console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Fonction pour journaliser les messages avec un timestamp
function log(message) {
  console.log(message);
}

log(`${colors.blue}Validation de la structure du projet...${colors.reset}`);
log(`Date d'exécution: ${new Date().toISOString()}`);
log(`Répertoire de base: ${BASE_DIR}`);
log(`Répertoire des packages: ${PACKAGES_DIR}`);

// 1. Vérifier les collisions de noms de packages
let hasErrors = false;

function findPackageJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    log(`${colors.yellow}Le répertoire n'existe pas: ${dir}${colors.reset}`);
    return [];
  }

  try {
    const results = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);

      try {
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          results.push(...findPackageJsonFiles(itemPath));
        } else if (item === 'package.json') {
          results.push(itemPath);
        }
      } catch (err) {
        log(`${colors.yellow}Erreur d'accès à ${itemPath}: ${err.message}${colors.reset}`);
      }
    }

    return results;
  } catch (err) {
    log(
      `${colors.yellow}Erreur lors de la lecture du répertoire ${dir}: ${err.message}${colors.reset}`
    );
    return [];
  }
}

// Chercher les fichiers package.json
log(`\n${colors.blue}Recherche des collisions de noms de packages...${colors.reset}`);

if (!fs.existsSync(PACKAGES_DIR)) {
  log(`${colors.yellow}Le répertoire des packages n'existe pas: ${PACKAGES_DIR}${colors.reset}`);
  log('Contenu du répertoire de base:');

  try {
    fs.readdirSync(BASE_DIR).forEach((item) => {
      const itemPath = path.join(BASE_DIR, item);
      const isDir = fs.statSync(itemPath).isDirectory();
      log(`- ${item}${isDir ? '/' : ''}`);
    });
  } catch (err) {
    log(
      `${colors.yellow}Erreur lors de la lecture du répertoire de base: ${err.message}${colors.reset}`
    );
  }

  process.exit(1);
}

const packageFiles = findPackageJsonFiles(PACKAGES_DIR);

if (packageFiles.length === 0) {
  log(`${colors.yellow}Aucun fichier package.json trouvé dans ${PACKAGES_DIR}${colors.reset}`);
} else {
  log(`${packageFiles.length} fichiers package.json trouvés.`);

  // Collecter les noms de packages
  const packages = {};

  for (const filePath of packageFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (data.name) {
        if (!packages[data.name]) {
          packages[data.name] = [];
        }
        packages[data.name].push(filePath);
      }
    } catch (err) {
      log(
        `${colors.yellow}⚠️ Erreur lors de la lecture de ${filePath}: ${err.message}${colors.reset}`
      );
    }
  }

  // Vérifier les collisions
  const collisions = {};
  for (const [name, files] of Object.entries(packages)) {
    if (files.length > 1) {
      collisions[name] = files;
      hasErrors = true;
    }
  }

  if (Object.keys(collisions).length > 0) {
    log(
      `\n${colors.red}⛔ ${
        Object.keys(collisions).length
      } collisions de noms de packages détectées:${colors.reset}`
    );

    for (const [name, files] of Object.entries(collisions)) {
      log(`\n${colors.red}Collision pour '${name}':${colors.reset}`);
      for (const file of files) {
        log(`  - ${file}`);
      }
    }

    log(
      `\n${colors.yellow}Pour résoudre ces collisions, exécutez: node fix-package-name-collisions.js${colors.reset}`
    );
  } else {
    log(`${colors.green}✓ Aucune collision de noms de packages détectée.${colors.reset}`);
  }
}

// 2. Vérifier les structures problématiques
log(`\n${colors.blue}Vérification des structures problématiques...${colors.reset}`);

// Vérifier les chemins PascalCase et kebab-case identiques
const pathCaseCollisions = [];

function checkCaseCollisions(dir, basePath = '') {
  if (!fs.existsSync(dir)) {
    log(`${colors.yellow}Le répertoire n'existe pas: ${dir}${colors.reset}`);
    return;
  }

  try {
    const items = fs.readdirSync(dir);
    const lowerCaseMap = {};

    // Vérifier les collisions de casse
    for (const item of items) {
      const itemPath = path.join(dir, item);

      try {
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          const itemLower = item.toLowerCase();

          if (!lowerCaseMap[itemLower]) {
            lowerCaseMap[itemLower] = [];
          }

          lowerCaseMap[itemLower].push({
            name: item,
            path: itemPath,
          });

          // Vérifier récursivement
          checkCaseCollisions(itemPath, path.join(basePath, item));
        }
      } catch (err) {
        log(`${colors.yellow}Erreur d'accès à ${itemPath}: ${err.message}${colors.reset}`);
      }
    }

    // Collecter les collisions
    for (const [lowerName, items] of Object.entries(lowerCaseMap)) {
      if (items.length > 1) {
        pathCaseCollisions.push({
          lowerName,
          items,
          basePath: dir,
        });
      }
    }
  } catch (err) {
    log(
      `${colors.yellow}Erreur lors de la lecture du répertoire ${dir}: ${err.message}${colors.reset}`
    );
  }
}

checkCaseCollisions(PACKAGES_DIR);

if (pathCaseCollisions.length > 0) {
  log(`${colors.red}⛔ ${pathCaseCollisions.length} collisions de casse détectées:${colors.reset}`);

  for (const collision of pathCaseCollisions) {
    log(
      `\n${colors.red}Collision pour '${collision.lowerName}' dans ${collision.basePath}:${colors.reset}`
    );

    for (const item of collision.items) {
      log(`  - ${item.name} (${item.path})`);
    }
  }

  log(
    `\n${colors.yellow}Pour résoudre ces collisions, exécutez: bash clean-recursive-structure.sh${colors.reset}`
  );
  hasErrors = true;
} else {
  log(`${colors.green}✓ Aucune collision de casse détectée.${colors.reset}`);
}

// 3. Vérifier la profondeur maximale des dossiers
log(`\n${colors.blue}Vérification de la profondeur des dossiers...${colors.reset}`);

function getDirectoryDepth(dir, baseDepth) {
  try {
    let maxDepth = baseDepth;
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);

      try {
        if (fs.statSync(itemPath).isDirectory()) {
          const depth = getDirectoryDepth(itemPath, baseDepth + 1);
          maxDepth = Math.max(maxDepth, depth);
        }
      } catch (_err) {
        // Ignorer les erreurs d'accès
      }
    }

    return maxDepth;
  } catch (_err) {
    return baseDepth;
  }
}

try {
  const maxDepthFound = getDirectoryDepth(PACKAGES_DIR, 0);

  if (maxDepthFound > MAX_DEPTH) {
    log(
      `${colors.yellow}⚠️ Profondeur maximale de dossiers: ${maxDepthFound} (supérieure au maximum recommandé de ${MAX_DEPTH})${colors.reset}`
    );
    log(`  Il est recommandé d'aplatir la structure du projet pour améliorer la maintenabilité.`);
  } else {
    log(
      `${colors.green}✓ Profondeur maximale de dossiers: ${maxDepthFound} (dans les limites recommandées)${colors.reset}`
    );
  }
} catch (err) {
  log(
    `${colors.yellow}Erreur lors de la vérification de la profondeur des dossiers: ${err.message}${colors.reset}`
  );
}

// Génération d'un rapport de résultats
const reportLines = [];
reportLines.push('# Rapport de validation de structure');
reportLines.push(`Date: ${new Date().toISOString().slice(0, 10)}`);
reportLines.push('');

if (hasErrors) {
  reportLines.push('## ⛔ Problèmes détectés');

  if (Object.keys(collisions || {}).length > 0) {
    reportLines.push('\n### Collisions de noms de packages');
    for (const [name, files] of Object.entries(collisions)) {
      reportLines.push(`\n- **${name}**`);
      for (const file of files) {
        reportLines.push(`  - ${file}`);
      }
    }
  }

  if (pathCaseCollisions.length > 0) {
    reportLines.push('\n### Collisions de casse dans les chemins');
    for (const collision of pathCaseCollisions) {
      reportLines.push(`\n- **${collision.lowerName}** dans ${collision.basePath}`);
      for (const item of collision.items) {
        reportLines.push(`  - ${item.name} (${item.path})`);
      }
    }
  }

  reportLines.push('\n## Actions recommandées');
  reportLines.push(
    '1. Exécuter `node fix-package-name-collisions.js` pour résoudre les collisions de noms'
  );
  reportLines.push(
    '2. Exécuter `bash clean-recursive-structure.sh` pour nettoyer les structures récursives'
  );
} else {
  reportLines.push('## ✅ Aucun problème détecté');
  reportLines.push('La structure du projet est propre et conforme aux bonnes pratiques.');
}

// Écrire le rapport dans un fichier
const reportPath = path.join(BASE_DIR, 'structure-validation-report.md');
fs.writeFileSync(reportPath, reportLines.join('\n'));
log(`\nUn rapport détaillé a été généré dans ${reportPath}`);

// Afficher le résultat final
if (hasErrors) {
  log(
    `\n${colors.red}⛔ Des problèmes ont été détectés dans la structure du projet. Veuillez les corriger avant de continuer.${colors.reset}`
  );
  process.exit(1);
} else {
  log(`\n${colors.green}✓ La structure du projet est valide.${colors.reset}`);
  process.exit(0);
}
