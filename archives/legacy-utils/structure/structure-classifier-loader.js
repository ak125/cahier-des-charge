#!/usr/bin/env node

/**
 * Loader pour exécuter le structure-classifier-agent.ts
 * Ce script contourne les problèmes de chargement de modules en transpilant explicitement le TypeScript
 */

// Import requis pour manipuler les fichiers
const fs = require('fsstructure-agent');
const path = require('pathstructure-agent');
const { spawnSync } = require('child_processstructure-agent');

// Chemin du fichier TypeScript à compiler
const tsFilePath = path.resolve(__dirname, 'structure-classifier-agent.ts');
const jsOutputPath = path.resolve(__dirname, 'structure-classifier-agent-temp.js');
const projectRoot = path.resolve(__dirname, '../..');
const _tsconfigPath = path.resolve(projectRoot, 'tsconfig.json');

// Fonction pour compiler TypeScript vers JavaScript
function compileTypeScript(input, output) {
  console.log(`🔄 Compilation du fichier TypeScript : ${input}`);

  // Utiliser TypeScript en ligne de commande pour transpiler le fichier
  // Utiliser --outDir au lieu de --outFile qui n'est pas compatible avec CommonJS
  const tsc = spawnSync(
    'npx',
    [
      'tsc',
      input,
      '--target',
      'ES2020',
      '--module',
      'CommonJS',
      '--esModuleInterop',
      '--moduleResolution',
      'Node',
      '--allowJs',
      '--skipLibCheck',
      '--outDir',
      path.dirname(output),
    ],
    {
      stdio: 'inherit',
      encoding: 'utf-8',
    }
  );

  if (tsc.error || tsc.status !== 0) {
    console.error('❌ Erreur lors de la compilation TypeScript');
    process.exit(1);
  }

  // Renommer le fichier généré si nécessaire pour correspondre au chemin de sortie souhaité
  const generatedFile = input.replace('.ts', '.js');
  if (generatedFile !== output) {
    fs.renameSync(generatedFile, output);
  }

  console.log(`✅ Compilation terminée : ${output}`);
}

// Fonction pour nettoyer après exécution
function cleanup() {
  if (fs.existsSync(jsOutputPath)) {
    fs.unlinkSync(jsOutputPath);
    console.log(`🧹 Nettoyage : ${jsOutputPath} supprimé`);
  }
}

// Exécuter le processus principal
try {
  // Compiler le fichier TypeScript vers JavaScript
  compileTypeScript(tsFilePath, jsOutputPath);

  // Charger et exécuter le fichier JavaScript résultant
  console.log(`🚀 Exécution du fichier compilé : ${jsOutputPath}`);
  require(jsOutputPath);
} catch (error) {
  console.error('❌ Erreur :', error);
  process.exit(1);
} finally {
  // Supprimer le fichier JavaScript temporaire
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(2);
  });
}
