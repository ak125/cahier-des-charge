#!/usr/bin/env node

/**
 * Script pour résoudre les collisions de noms de packages dans un monorepo
 *
 * Ce script :
 * 1. Détecte les collisions de noms entre packages
 * 2. Génère des noms uniques basés sur l'emplacement dans le projet
 * 3. Applique les nouveaux noms et met à jour les références
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASE_DIR = process.cwd();
const PACKAGES_DIR = path.join(BASE_DIR, 'packages');
const REPORT_FILE = path.join(BASE_DIR, 'package-rename-report.md');

// Amélioration du débogage
process.on('uncaughtException', (err) => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});

// Fonction utilitaire pour analyser récursivement les dossiers à la recherche de package.json
function findPackageJsonFiles(dir) {
  try {
    const results = [];
    if (!fs.existsSync(dir)) {
      console.error(`Le répertoire n'existe pas: ${dir}`);
      return results;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          results.push(...findPackageJsonFiles(filePath));
        } else if (file === 'package.json') {
          results.push(filePath);
        }
      } catch (error) {
        console.error(`Erreur lors de l'accès à ${filePath}: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    console.error(`Erreur dans findPackageJsonFiles pour ${dir}: ${error.message}`);
    return [];
  }
}

// Fonction pour collecter les informations sur les packages
function collectPackageInfo() {
  console.log('Recherche des fichiers package.json...');

  try {
    const packageFiles = findPackageJsonFiles(PACKAGES_DIR);
    console.log(`  ${packageFiles.length} fichiers package.json trouvés.`);

    const packages = {};
    const packageFileMap = {};

    for (const filePath of packageFiles) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const packageData = JSON.parse(fileContent);
        const packageName = packageData.name;

        if (!packageName) {
          console.warn(`  ⚠️ Pas de nom dans ${filePath}, ignoré.`);
          continue;
        }

        if (!packages[packageName]) {
          packages[packageName] = [];
        }

        packages[packageName].push(filePath);
        packageFileMap[filePath] = packageData;
      } catch (error) {
        console.error(`  Erreur lors de la lecture de ${filePath}: ${error.message}`);
      }
    }

    return { packages, packageFileMap };
  } catch (error) {
    console.error(`Erreur dans collectPackageInfo: ${error.message}`);
    process.exit(1);
  }
}

// Fonction pour identifier les collisions
function findCollisions(packages) {
  try {
    const collisions = {};

    for (const [name, files] of Object.entries(packages)) {
      if (files.length > 1) {
        collisions[name] = files;
      }
    }

    return collisions;
  } catch (error) {
    console.error(`Erreur dans findCollisions: ${error.message}`);
    process.exit(1);
  }
}

// Fonction pour générer un nouveau nom de package en fonction de son chemin
function generateNewPackageName(packagePath, originalName) {
  try {
    // Extraire le chemin relatif à partir de packages/
    const relativePath = packagePath.replace(PACKAGES_DIR + path.sep, '').split(path.sep);

    // Identifier la catégorie et le type de package
    const _mainCategory = relativePath[0]; // ex: mcp-agents

    let packageType = '';
    let typeIndex = -1;

    // Rechercher un type de package connu dans le chemin
    const knownTypes = [
      'analyzers',
      'generators',
      'validators',
      'orchestrators',
      'bridges',
      'monitors',
    ];
    for (let i = 0; i < relativePath.length; i++) {
      if (knownTypes.includes(relativePath[i])) {
        packageType = relativePath[i].slice(0, -1); // Enlever le 's' à la fin
        typeIndex = i;
        break;
      }
    }

    // Obtenir le nom du dossier parent immédiat (qui contient le package.json)
    const parentDir = path.basename(path.dirname(packagePath));

    // Construire le nouveau nom
    let newName = originalName;

    // Si c'est un nom de package @mcp/xxx standard
    if (originalName.startsWith('@mcp/')) {
      // Base du nom sans préfixe
      const baseName = originalName.replace('@mcp/', '');

      // Traitement spécial pour la collision php-analyzer-analyzer
      if (baseName === 'php-analyzer-analyzer' || baseName === 'php-analyzer') {
        if (relativePath.includes('business')) {
          return '@mcp/php-analyzer-business';
        }
        return '@mcp/php-analyzer-core';
      }

      // Traitement général basé sur le chemin
      if (relativePath.includes('business') && !baseName.includes('business')) {
        return `@mcp/${baseName}-business`;
      }

      // Si le type est défini, utiliser une nomenclature basée sur le type
      if (packageType) {
        // Vérifier si le nom contient déjà ce type
        if (!baseName.includes(packageType)) {
          // Créer un nouveau nom avec le type et éventuellement d'autres parties du chemin
          // pour assurer l'unicité
          const pathContext = typeIndex > 0 ? relativePath[typeIndex - 1] : '';

          if (
            pathContext &&
            pathContext !== 'business' &&
            pathContext !== 'coordination' &&
            pathContext !== 'mcp-agents'
          ) {
            newName = `@mcp/${baseName}-${pathContext}-${packageType}`;
          } else {
            newName = `@mcp/${baseName}-${packageType}`;
          }
        }
      } else if (parentDir && !baseName.includes(parentDir)) {
        // Si pas de type mais un dossier parent significatif
        newName = `@mcp/${baseName}-${parentDir}`;
      }
    }

    return newName;
  } catch (error) {
    console.error(`Erreur dans generateNewPackageName pour ${packagePath}: ${error.message}`);
    return originalName;
  }
}

// Fonction pour mettre à jour un package.json
function updatePackageJson(filePath, newName, packageData) {
  try {
    packageData.name = newName;
    fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2));
    return packageData;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de ${filePath}: ${error.message}`);
    return packageData;
  }
}

// Fonction pour mettre à jour les dépendances dans tous les fichiers
function updateDependencies(packageFileMap, renamedPackages) {
  try {
    const updates = [];

    for (const [filePath, packageData] of Object.entries(packageFileMap)) {
      let updated = false;

      // Vérifier et mettre à jour les dépendances
      for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (!packageData[depType]) continue;

        for (const [oldName, newName] of Object.entries(renamedPackages)) {
          if (packageData[depType][oldName]) {
            const version = packageData[depType][oldName];
            delete packageData[depType][oldName];
            packageData[depType][newName] = version;
            updated = true;
          }
        }
      }

      if (updated) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2));
          updates.push(filePath);
        } catch (writeError) {
          console.error(`Erreur lors de l'écriture dans ${filePath}: ${writeError.message}`);
        }
      }
    }

    return updates;
  } catch (error) {
    console.error(`Erreur dans updateDependencies: ${error.message}`);
    return [];
  }
}

// Fonction principale
function main() {
  console.log('=== Résolution des collisions de noms de packages ===\n');

  try {
    // Vérifier si le dossier packages existe
    if (!fs.existsSync(PACKAGES_DIR)) {
      console.error(`Le dossier des packages n'existe pas: ${PACKAGES_DIR}`);
      console.log('Répertoires disponibles dans le dossier courant:');

      const items = fs.readdirSync(BASE_DIR);
      for (const item of items) {
        if (fs.statSync(path.join(BASE_DIR, item)).isDirectory()) {
          console.log(`  - ${item}`);
        }
      }

      process.exit(1);
    }

    // Collecter les infos sur les packages
    const { packages, packageFileMap } = collectPackageInfo();

    // Identifier les collisions
    const collisions = findCollisions(packages);
    const collisionCount = Object.keys(collisions).length;

    console.log(`\nDétection de ${collisionCount} packages avec des noms en collision:`);

    if (collisionCount === 0) {
      console.log('  ✅ Aucune collision détectée. Tous les packages ont des noms uniques.');
      return;
    }

    // Proposer et appliquer des noms alternatifs
    const renamedPackages = {};
    const renamedDetails = [];

    for (const [name, files] of Object.entries(collisions)) {
      console.log(`\n  Collision pour "${name}":`);

      for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        const relativePath = path.relative(BASE_DIR, filePath);
        const packageData = packageFileMap[filePath];

        const newName = generateNewPackageName(filePath, name);

        if (newName !== name) {
          console.log(`    - ${relativePath}: ${name} -> ${newName}`);
          updatePackageJson(filePath, newName, packageData);

          if (!renamedPackages[name]) {
            renamedPackages[name] = [];
          }
          renamedPackages[name].push(newName);

          renamedDetails.push({
            oldName: name,
            newName: newName,
            path: relativePath,
          });
        } else {
          console.log(`    - ${relativePath}: pas de changement nécessaire`);
        }
      }
    }

    // Mettre à jour les références des dépendances
    console.log('\nMise à jour des références aux packages renommés...');

    // Transformer renamedPackages en map simple pour updateDependencies
    const flatRenames = {};
    for (const [oldName, newNames] of Object.entries(renamedPackages)) {
      for (const newName of newNames) {
        flatRenames[oldName] = newName;
      }
    }

    const updatedFiles = updateDependencies(packageFileMap, flatRenames);
    console.log(
      `  ${updatedFiles.length} fichiers package.json mis à jour avec les nouvelles références.`
    );

    // Générer un rapport
    const totalRenamed = renamedDetails.length;
    console.log(`\nTous les ${totalRenamed} packages en collision ont été renommés avec succès!`);

    // Écrire le rapport
    const report = [
      '# Rapport de renommage de packages',
      '',
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      '',
      `**${totalRenamed} packages ont été renommés pour résoudre les collisions de noms**`,
      '',
      '| Ancien nom | Nouveau nom | Emplacement |',
      '|------------|-------------|-------------|',
    ];

    for (const { oldName, newName, path } of renamedDetails) {
      report.push(`| \`${oldName}\` | \`${newName}\` | \`${path}\` |`);
    }

    fs.writeFileSync(REPORT_FILE, report.join('\n'));
    console.log(`\nUn rapport détaillé a été généré dans ${REPORT_FILE}`);

    // Mettre à jour les packages installés
    console.log('\nMise à jour des packages installés...');
    try {
      execSync('pnpm install', { stdio: 'inherit' });
      console.log('  ✅ Packages mis à jour avec succès!');
    } catch (error) {
      console.error('  ❌ Erreur lors de la mise à jour des packages:', error.message);
    }

    console.log('\n=== Processus de résolution terminé ===');
  } catch (error) {
    console.error(`Erreur dans la fonction principale: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécution du script
main();
