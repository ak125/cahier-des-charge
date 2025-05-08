#!/usr/bin/env node

/**
 * Script wrapper pour l'outil de validation sécurisée
 * 
 * Ce script permet d'exécuter facilement l'outil de validation
 * sans les problèmes liés à la transmission d'arguments via npm run.
 */

const { spawn } = require('child_process');
const path = require('path');

// Chemin vers le script ts-node
const tsNodeBin = path.resolve(__dirname, 'node_modules/.bin/ts-node');

// Chemin vers notre CLI de validation
const validatorPath = path.resolve(__dirname, 'src/cli/validate-code.ts');

// Obtenir les arguments passés au script
const args = process.argv.slice(2);

// Log pour debug
console.log('🔍 Exécution du validateur de sécurité IA...');

// Exécuter le validateur avec ts-node
const child = spawn(tsNodeBin, [validatorPath, ...args], {
    stdio: 'inherit',
    shell: true
});

// Gérer la fin du processus enfant
child.on('close', code => {
    process.exit(code);
});