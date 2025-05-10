#!/usr/bin/env node

/**
 * Script pour supprimer les dossiers vides après réorganisation de la documentation
 * 
 * Ce script parcourt le dossier docs/ et supprime tous les dossiers vides
 * après la réorganisation des fichiers dans l'architecture à six sections.
 * 
 * Usage:
 *   node cleanup-empty-folders.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

// Analyse des arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Configuration
const PROTECTED_DIRS = [
    '0-core',
    '1-architecture',
    '2-migration',
    '3-orchestration',
    '4-nx-ci',
    '5-integration',
    '6-planning',
    '_archives',
    'diagrams'
];

/**
 * Vérifie si un dossier est vide (ne contient ni fichiers ni sous-dossiers)
 */
function isDirEmpty(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);
        return items.length === 0;
    } catch (err) {
        console.error(`Erreur lors de la vérification du dossier ${dirPath}: ${err.message}`);
        return false;
    }
}

/**
 * Vérifie si un dossier est vide récursivement (ne contient que des sous-dossiers vides)
 */
function isDirEmptyRecursively(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);

        // Si le dossier n'a pas de contenu, il est vide
        if (items.length === 0) {
            return true;
        }

        // Vérifie chaque élément
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const isDir = fs.statSync(itemPath).isDirectory();

            // Si c'est un fichier, le dossier n'est pas vide
            if (!isDir) {
                return false;
            }

            // Si c'est un dossier non vide, le dossier n'est pas vide
            if (!isDirEmptyRecursively(itemPath)) {
                return false;
            }
        }

        // Tous les sous-dossiers sont vides
        return true;
    } catch (err) {
        console.error(`Erreur lors de la vérification récursive du dossier ${dirPath}: ${err.message}`);
        return false;
    }
}

/**
 * Supprime récursivement un dossier et tous ses sous-dossiers vides
 */
function removeEmptyDirsRecursively(dirPath, basePath = dirPath) {
    try {
        // Vérifier si le dossier existe
        if (!fs.existsSync(dirPath)) {
            return;
        }

        // Obtenir la liste des éléments du dossier
        const items = fs.readdirSync(dirPath);

        // Traiter récursivement chaque sous-dossier
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const isDir = fs.statSync(itemPath).isDirectory();

            if (isDir) {
                removeEmptyDirsRecursively(itemPath, basePath);
            }
        }

        // Vérifier à nouveau si le dossier est vide après le traitement des sous-dossiers
        if (isDirEmpty(dirPath)) {
            // Ne pas supprimer les dossiers protégés
            const relativePath = path.relative(basePath, dirPath);
            const isProtected = PROTECTED_DIRS.some(dir => dirPath === path.join(docsDir, dir));

            if (!isProtected) {
                if (dryRun) {
                    console.log(`[DRY RUN] Suppression du dossier vide: ${dirPath}`);
                } else {
                    fs.rmdirSync(dirPath);
                    console.log(`✓ Dossier vide supprimé: ${dirPath}`);
                }
            }
        }
    } catch (err) {
        console.error(`Erreur lors de la suppression du dossier ${dirPath}: ${err.message}`);
    }
}

/**
 * Fonction principale
 */
function main() {
    console.log('=== NETTOYAGE DES DOSSIERS VIDES ===\n');

    if (dryRun) {
        console.log('Mode simulation (dry run) activé. Aucune modification ne sera effectuée.\n');
    }

    console.log('Recherche des dossiers vides...');

    // Parcourir tous les dossiers dans docs/
    const dirs = fs.readdirSync(docsDir);

    for (const dir of dirs) {
        const dirPath = path.join(docsDir, dir);

        // Ne traiter que les dossiers et ignorer les dossiers de la nouvelle structure
        if (fs.statSync(dirPath).isDirectory() && !PROTECTED_DIRS.includes(dir)) {
            if (isDirEmptyRecursively(dirPath)) {
                if (dryRun) {
                    console.log(`[DRY RUN] Suppression du dossier vide: ${dirPath}`);
                } else {
                    fs.rmdirSync(dirPath, { recursive: true });
                    console.log(`✓ Dossier vide supprimé: ${dirPath}`);
                }
            } else {
                // S'il n'est pas complètement vide, essayer de supprimer les sous-dossiers vides
                removeEmptyDirsRecursively(dirPath);
            }
        }
    }

    console.log('\nNettoyage des dossiers vides terminé.');
}

// Exécuter le script
main();
