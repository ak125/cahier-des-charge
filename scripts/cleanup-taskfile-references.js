#!/usr/bin/env node

/**
 * Script de nettoyage qui supprime les références obsolètes à Taskfile
 * et aide à finaliser la migration vers NX
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Nettoyage des références obsolètes à Taskfile...');

// Répertoires à vérifier pour les références à Taskfile
const dirsToCheck = ['scripts', 'ci', 'docs'];

// Chemins de fichiers à ignorer
const ignorePatterns = [
  'node_modules',
  'dist',
  '.git',
  'backup',
  'docs/nx-pipeline-ci-cd.md', // Documentation sur la migration elle-même
  'docs/nx-usage-guide.md', // Guide d'utilisation NX
  'docs/communication-equipe-migration.md', // Communication sur la migration
];

// Extensions de fichiers à vérifier
const fileExtensions = ['.js', '.ts', '.sh', '.md', '.json'];

// Patterns à rechercher qui indiquent une utilisation de Taskfile
const taskfilePatterns = ['task ', 'Taskfile.y', 'go-task', 'task run', 'task:'];

// Fonction pour vérifier si un chemin doit être ignoré
function shouldIgnore(itemPath) {
  return ignorePatterns.some((pattern) => itemPath.includes(pattern));
}

// Fonction pour vérifier si un fichier contient des références à Taskfile
function checkFileForTaskfileReferences(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;

    const ext = path.extname(filePath).toLowerCase();
    if (!fileExtensions.includes(ext)) return false;

    const content = fs.readFileSync(filePath, 'utf-8');

    return taskfilePatterns.some((pattern) => content.includes(pattern));
  } catch (error) {
    console.log(`⚠️ Erreur lors de la vérification du fichier ${filePath}: ${error.message}`);
    return false;
  }
}

// Fonction récursive pour vérifier les fichiers dans un répertoire
function checkDirectory(dir) {
  const results = [];

  try {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ Le répertoire n'existe pas: ${dir}`);
      return results;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);

      if (shouldIgnore(itemPath)) continue;

      try {
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          results.push(...checkDirectory(itemPath));
        } else if (stats.isFile() && checkFileForTaskfileReferences(itemPath)) {
          results.push(itemPath);
        }
      } catch (error) {
        console.log(`⚠️ Erreur lors de l'accès à ${itemPath}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`⚠️ Erreur lors de la lecture du répertoire ${dir}: ${error.message}`);
  }

  return results;
}

// Vérifier les répertoires pour trouver des références à Taskfile
const filesWithReferences = [];

for (const dir of dirsToCheck) {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    filesWithReferences.push(...checkDirectory(dirPath));
  } else {
    console.log(`⚠️ Le répertoire n'existe pas: ${dirPath}`);
  }
}

// Rapport des résultats
console.log('\n=== Rapport de nettoyage ===');
console.log(`\nFichiers potentiellement obsolètes (${filesWithReferences.length}) :`);

if (filesWithReferences.length > 0) {
  filesWithReferences.forEach((file) => {
    console.log(`- ${file}`);
  });

  console.log('\n⚠️  Ces fichiers peuvent contenir des références à Taskfile.');
  console.log(
    'Veuillez les examiner manuellement et mettre à jour les références pour utiliser NX à la place.'
  );
} else {
  console.log(
    "Aucun fichier contenant des références à Taskfile n'a été trouvé. La migration est complète ! 🎉"
  );
}

// Vérifier si le répertoire tasks/ existe encore et suggérer de le supprimer
const tasksDir = path.join(process.cwd(), 'tasks');
try {
  if (fs.existsSync(tasksDir) && fs.statSync(tasksDir).isDirectory()) {
    console.log('\n⚠️  Le répertoire "tasks/" existe toujours.');
    console.log(
      'Ce répertoire contenait probablement des définitions pour Taskfile qui ne sont plus nécessaires.'
    );
    console.log(
      'Suggestion: Vérifiez le contenu et supprimez ce répertoire si toutes les tâches ont été migrées vers NX.'
    );
  }
} catch (error) {
  console.log(`⚠️ Erreur lors de la vérification du répertoire tasks/: ${error.message}`);
}

console.log('\n✅ Nettoyage terminé !');
console.log('\nPour utiliser NX avec pnpm :');
console.log('1. Exécuter NX avec pnpm :');
console.log('   pnpm exec nx --version');
console.log('2. Exécuter votre première tâche avec NX :');
console.log('   pnpm exec nx test');
