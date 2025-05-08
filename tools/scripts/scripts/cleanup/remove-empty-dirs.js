#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = '/workspaces/cahier-des-charge';
const IGNORED_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', '.cache'];
const DRY_RUN = false; // Mettre à true pour simuler sans supprimer réellement
const LOG_FILE = path.join(ROOT_DIR, 'empty-dirs-removed.log');

// Initialiser le fichier journal
fs.writeFileSync(LOG_FILE, '# Dossiers vides supprimés\n\n');

let removedCount = 0;
let scannedCount = 0;

/**
 * Ajoute un message au journal
 */
function log(message) {
    fs.appendFileSync(LOG_FILE, message + '\n');
    console.log(message);
}

/**
 * Vérifie si un dossier est vide
 * Un dossier est considéré comme vide s'il ne contient aucun fichier
 * ou s'il ne contient que des dossiers vides
 */
function isDirectoryEmpty(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);

        // Pas d'éléments = dossier vide
        if (items.length === 0) {
            return true;
        }

        // Vérifier si tous les éléments sont des dossiers vides
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);

            // Si c'est un fichier, le dossier n'est pas vide
            if (stats.isFile()) {
                return false;
            }

            // Si c'est un dossier qui n'est pas vide, le dossier parent n'est pas vide
            if (stats.isDirectory() && !isDirectoryEmpty(itemPath)) {
                return false;
            }
        }

        // Tous les éléments sont des dossiers vides
        return true;
    } catch (error) {
        console.error(`Erreur lors de l'analyse de ${dirPath}: ${error.message}`);
        return false;
    }
}

/**
 * Parcourt récursivement la structure de dossiers et supprime les dossiers vides
 */
function removeEmptyDirectories(dirPath, depth = 0) {
    if (depth === 0) {
        console.log(`Analyse des dossiers à partir de: ${dirPath}`);
    }

    try {
        const items = fs.readdirSync(dirPath);

        // Traiter d'abord les sous-dossiers (bottom-up)
        for (const item of items) {
            if (IGNORED_DIRS.includes(item)) continue;

            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                scannedCount++;
                removeEmptyDirectories(itemPath, depth + 1);
            }
        }

        // Vérifier si ce dossier est maintenant vide (après traitement des sous-dossiers)
        if (isDirectoryEmpty(dirPath)) {
            if (DRY_RUN) {
                log(`[SIMULATION] Suppression du dossier vide: ${dirPath}`);
            } else {
                try {
                    fs.rmdirSync(dirPath);
                    log(`✓ Suppression du dossier vide: ${dirPath}`);
                    removedCount++;
                } catch (error) {
                    log(`✗ Erreur lors de la suppression de ${dirPath}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error(`Erreur lors du parcours de ${dirPath}: ${error.message}`);
    }
}

// Exécuter la suppression des dossiers vides
console.log('Début de la suppression des dossiers vides...');
console.log(`Mode: ${DRY_RUN ? 'SIMULATION' : 'RÉEL'}`);

const startTime = Date.now();
removeEmptyDirectories(ROOT_DIR);
const endTime = Date.now();

// Afficher un résumé
const summary = `
# Résumé
- Dossiers analysés: ${scannedCount}
- Dossiers vides supprimés: ${removedCount}
- Durée: ${((endTime - startTime) / 1000).toFixed(2)} secondes
- Date: ${new Date().toISOString()}
- Mode: ${DRY_RUN ? 'SIMULATION' : 'RÉEL'}
`;

log(summary);
console.log(`Journal sauvegardé dans ${LOG_FILE}`);