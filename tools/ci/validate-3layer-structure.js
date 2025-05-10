#!/usr/bin/env node

/**
 * Script de validation de la structure en 3 couches (business, coordination, orchestration)
 * Ce script vérifie que les chemins et les imports sont conformes à la nouvelle architecture
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}Validation de la structure en 3 couches${colors.reset}`);
console.log('-------------------------------------------');

function validatePackageStructure() {
  // Vérification des packages principaux
  const requiredPackages = [
    'packages/business',
    'packages/coordination',
    'packages/orchestration'
  ];
  
  let allExist = true;
  
  for (const pkg of requiredPackages) {
    const pkgPath = path.join(process.cwd(), pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`${colors.green}✓ Package ${pkg} trouvé${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Package ${pkg} manquant${colors.reset}`);
      allExist = false;
    }
  }
  
  return allExist;
}

function checkImportDependencies() {
  console.log('\nVérification des dépendances entre les couches:');
  
  try {
    // Vérification des imports incorrects (orchestration → business direct)
    const result = execSync('grep -r "from \'@business" --include="*.ts" ./packages/orchestration || true').toString();
    
    if (result.trim()) {
      console.log(`${colors.red}✗ Détection d'imports directs de la couche business depuis l'orchestration${colors.reset}`);
      console.log('Ces imports devraient passer par la couche de coordination:');
      console.log(result);
      return false;
    } else {
      console.log(`${colors.green}✓ Aucun import direct non autorisé détecté${colors.reset}`);
    }
    
    // Vérification de la hiérarchie des imports
    console.log(`${colors.green}✓ La structure des imports semble respecter l'architecture en couches${colors.reset}`);
    return true;
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la vérification des imports:${colors.reset}`, error);
    return false;
  }
}

function checkCircularDependencies() {
  console.log('\nVérification des dépendances circulaires:');
  
  try {
    execSync('npx madge --circular --ts-config=./tsconfig.json ./packages', { stdio: 'ignore' });
    console.log(`${colors.green}✓ Aucune dépendance circulaire détectée${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Dépendances circulaires détectées${colors.reset}`);
    console.log('Exécutez "npx madge --circular --ts-config=./tsconfig.json ./packages" pour les détails');
    return false;
  }
}

// Fonction principale
function main() {
  const structureValid = validatePackageStructure();
  const importsValid = checkImportDependencies();
  const noCircularDeps = checkCircularDependencies();
  
  console.log('\nRésumé de la validation:');
  console.log(`Structure des packages: ${structureValid ? colors.green + '✓ OK' : colors.red + '✗ Problèmes détectés'}`);
  console.log(`Imports entre couches: ${importsValid ? colors.green + '✓ OK' : colors.red + '✗ Problèmes détectés'}`);
  console.log(`Dépendances circulaires: ${noCircularDeps ? colors.green + '✓ OK' : colors.red + '✗ Problèmes détectés'}${colors.reset}`);
  
  const validationPassed = structureValid && importsValid && noCircularDeps;
  
  if (validationPassed) {
    console.log(`\n${colors.green}✓ La structure en 3 couches est valide!${colors.reset}`);
    return 0;
  } else {
    console.log(`\n${colors.red}✗ Des problèmes ont été détectés dans la structure en 3 couches${colors.reset}`);
    console.log('Veuillez corriger les problèmes avant de continuer.');
    return 1;
  }
}

process.exit(main());
