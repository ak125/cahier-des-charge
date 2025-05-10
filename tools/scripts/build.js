#!/usr/bin/env node

/**
 * Script de build simplifié pour le projet
 * Ce script valide le code TypeScript sans générer de fichiers JS
 */

const { execSync } = require('child_process');
const path = require('path');

// Chemin vers le projet
const projectRoot = path.resolve(__dirname, '../../');

console.log('=== Validation du code TypeScript ===');

try {
  console.log('Exécution de la validation du typage...');
  execSync('pnpm tsc --noEmit', { 
    cwd: projectRoot, 
    stdio: 'inherit'
  });
  console.log('\n✅ Le code TypeScript est valide');
} catch (error) {
  console.error('\n❌ Erreurs de typage détectées');
  process.exit(1);
}

console.log('\n=== Build terminé avec succès ===');
