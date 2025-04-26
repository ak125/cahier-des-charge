#!/usr/bin/env node

const fs = require(fsstructure-agent');
const path = require(pathstructure-agent');
const { execSync } = require(child_processstructure-agent');

// Créer le dossier dist s'il n'existe pas
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Compiler TypeScript
console.log('🔄 Compilation TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Compilation TypeScript réussie');
} catch (error) {
  console.error('❌ Erreur de compilation TypeScript:', error);
  process.exit(1);
}

// Rendre le script exécutable
const cliPath = path.join(distDir, 'cli.js');
try {
  fs.chmodSync(cliPath, '755');
  console.log('✅ CLI rendu exécutable');
} catch (error) {
  console.error('❌ Erreur lors du changement des permissions:', error);
}

// Créer un lien symbolique pour faciliter l'exécution
const binDir = path.join(__dirname, '..', '..', 'node_modules', '.bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const mcpBinPath = path.join(binDir, 'mcp');
try {
  // Supprimer le lien existant s'il existe
  if (fs.existsSync(mcpBinPath)) {
    fs.unlinkSync(mcpBinPath);
  }
  
  // Créer un lien symbolique ou copier le fichier selon la plateforme
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // Sur Windows, créer un script batch pour exécuter node avec le chemin du CLI
    const batchContent = `@echo off\r\nnode "${cliPath}" %*`;
    fs.writeFileSync(mcpBinPath + '.cmd', batchContent);
    console.log('✅ Script batch Windows créé');
  } else {
    // Sur Unix, créer un lien symbolique
    fs.symlinkSync(cliPath, mcpBinPath);
    console.log('✅ Lien symbolique Unix créé');
  }
} catch (error) {
  console.error('❌ Erreur lors de la création du lien:', error);
}

console.log('🎉 Build terminé. Vous pouvez maintenant utiliser la commande "pnpm mcp"');