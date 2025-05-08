#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = '/workspaces/cahier-des-charge';
const IGNORED_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', '.cache'];
const IGNORED_FILES = [
    'README.md',
    'LICENSE',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'tsconfig.json',
    'jest.config.js'
];
const DRY_RUN = false; // Mettre à true pour simuler sans renommer réellement
const LOG_FILE = path.join(ROOT_DIR, 'standardized-filenames.log');
const COPY_MODE = true; // true: copier puis supprimer, false: renommer directement

// Initialiser le fichier journal
fs.writeFileSync(LOG_FILE, '# Noms de fichiers standardisés\n\n');

let renamedCount = 0;
let scannedCount = 0;
let errorCount = 0;

/**
 * Ajoute un message au journal
 */
function log(message) {
    fs.appendFileSync(LOG_FILE, message + '\n');
    console.log(message);
}

/**
 * Convertit un nom de fichier en kebab-case
 * Exemples:
 * - camelCase -> kebab-case
 * - PascalCase -> pascal-case
 * - snake_case -> snake-case
 * - SCREAMING_SNAKE -> screaming-snake
 * - Les points sont préservés pour les extensions
 */
function toKebabCase(name) {
    // Séparer l'extension de fichier
    const lastDotIndex = name.lastIndexOf('.');
    let baseName = name;
    let extension = '';

    if (lastDotIndex !== -1) {
        baseName = name.substring(0, lastDotIndex);
        extension = name.substring(lastDotIndex);
    }

    // Ignorer les fichiers avec des extensions spéciales
    if (extension === '.d.ts') {
        return name; // Laisser les fichiers de définition TypeScript intacts
    }

    // Convertir le nom de base en kebab-case
    const kebabBase = baseName
        // CamelCase ou PascalCase en kebab-case
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        // SCREAMING_SNAKE en kebab-case
        .replace(/_/g, '-')
        // Suppression des caractères non alphanumériques sauf les tirets
        .replace(/[^a-zA-Z0-9-]/g, '')
        .toLowerCase();

    return kebabBase + extension;
}

/**
 * Détermine si un fichier doit être renommé
 */
function shouldRename(filePath) {
    const fileName = path.basename(filePath);

    // Ignorer les fichiers spécifiques
    if (IGNORED_FILES.includes(fileName)) {
        return false;
    }

    // Vérifier si le nom actuel est différent du nom standardisé
    const kebabName = toKebabCase(fileName);
    return kebabName !== fileName;
}

/**
 * Renomme un fichier selon les règles de standardisation
 */
function standardizeFileName(filePath) {
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const kebabName = toKebabCase(fileName);
    const newPath = path.join(dirName, kebabName);

    if (kebabName === fileName) {
        return false; // Pas besoin de renommer
    }

    // Éviter les conflits
    if (fs.existsSync(newPath)) {
        log(`⚠️ Conflit de nom pour ${filePath} -> ${newPath} (le fichier cible existe déjà)`);
        return false;
    }

    try {
        if (DRY_RUN) {
            log(`[SIMULATION] Renommage: ${filePath} -> ${newPath}`);
            return true;
        } else {
            if (COPY_MODE) {
                // Copier puis supprimer (plus sûr pour les fichiers importants)
                fs.copyFileSync(filePath, newPath);
                fs.unlinkSync(filePath);
            } else {
                // Renommer directement
                fs.renameSync(filePath, newPath);
            }

            log(`✓ Renommé: ${filePath} -> ${newPath}`);
            return true;
        }
    } catch (error) {
        log(`✗ Erreur lors du renommage de ${filePath}: ${error.message}`);
        errorCount++;
        return false;
    }
}

/**
 * Parcourt récursivement la structure de dossiers et standardise les noms de fichiers
 */
function standardizeFileNames(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);

        // Traiter d'abord les fichiers
        for (const item of items) {
            if (IGNORED_DIRS.includes(item)) continue;

            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isFile()) {
                scannedCount++;

                if (shouldRename(itemPath)) {
                    const renamed = standardizeFileName(itemPath);
                    if (renamed) renamedCount++;
                }
            }
        }

        // Ensuite traiter les dossiers (pour éviter les problèmes de renommage récursif)
        for (const item of items) {
            if (IGNORED_DIRS.includes(item)) continue;

            const itemPath = path.join(dirPath, item);
            let stats;

            try {
                stats = fs.statSync(itemPath);
            } catch (error) {
                // Le fichier a peut-être été renommé entre-temps
                continue;
            }

            if (stats.isDirectory()) {
                standardizeFileNames(itemPath);
            }
        }
    } catch (error) {
        console.error(`Erreur lors du parcours de ${dirPath}: ${error.message}`);
    }
}

// Exécuter la standardisation des noms de fichiers
console.log('Début de la standardisation des noms de fichiers...');
console.log(`Mode: ${DRY_RUN ? 'SIMULATION' : 'RÉEL'}`);

const startTime = Date.now();
standardizeFileNames(ROOT_DIR);
const endTime = Date.now();

// Afficher un résumé
const summary = `
# Résumé
- Fichiers analysés: ${scannedCount}
- Fichiers renommés: ${renamedCount}
- Erreurs: ${errorCount}
- Durée: ${((endTime - startTime) / 1000).toFixed(2)} secondes
- Date: ${new Date().toISOString()}
- Mode: ${DRY_RUN ? 'SIMULATION' : 'RÉEL'}
`;

log(summary);
console.log(`Journal sauvegardé dans ${LOG_FILE}`);