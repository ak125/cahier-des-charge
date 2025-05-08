#!/usr/bin/env node

/**
 * Script pour valider que les noms de fichiers suivent la convention kebab-case
 * Conçu pour être utilisé dans un hook pre-commit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Récupérer la liste des fichiers modifiés/ajoutés
function getChangedFiles() {
    try {
        // Liste des fichiers en staging
        const output = execSync('git diff --cached --name-only --diff-filter=ACM').toString();
        return output.split('\n').filter(file => file.trim().length > 0);
    } catch (error) {
        console.error('Erreur lors de la récupération des fichiers modifiés:', error);
        return [];
    }
}

// Vérifier si un nom de fichier suit la convention kebab-case
function isKebabCase(filename) {
    // Exclure l'extension et le chemin
    const basename = path.basename(filename, path.extname(filename));

    // Exceptions: les fichiers d'index, les fichiers commençant par un point, etc.
    if (basename === 'index' || basename.startsWith('.') || basename === 'README') {
        return true;
    }

    // Vérifier le format kebab-case
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(basename);
}

// Fonction principale
function main() {
    const changedFiles = getChangedFiles();
    const nonCompliantFiles = [];

    // Filtrer pour ne garder que les fichiers TypeScript/JavaScript/React
    const tsJsFiles = changedFiles.filter(file =>
        /\.(ts|js|tsx|jsx)$/.test(file) &&
        !file.includes('node_modules/'));

    // Vérifier chaque fichier
    for (const file of tsJsFiles) {
        if (!isKebabCase(file)) {
            nonCompliantFiles.push(file);
        }
    }

    // Afficher les erreurs
    if (nonCompliantFiles.length > 0) {
        console.error('\n❌ Erreur: Les fichiers suivants ne suivent pas la convention kebab-case:');
        nonCompliantFiles.forEach(file => console.error(`  - ${file}`));
        console.error('\nVeuillez renommer ces fichiers en utilisant kebab-case.');
        console.error('Exemple: "ComponentName.tsx" → "component-name.tsx"');
        console.error('\nUtilisez le script ./scripts/fix-case-duplications.js pour corriger automatiquement.');
        process.exit(1);
    } else if (tsJsFiles.length > 0) {
        console.log('✅ Tous les fichiers suivent la convention kebab-case.');
    }
}

// Exécution
main();