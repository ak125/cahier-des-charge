#!/usr/bin/env node

/**
 * Script pour nettoyer les fichiers de sauvegarde et archives inutiles du projet
 * 
 * Ce script supprime les fichiers situés dans des répertoires comme reports, backup, etc.,
 * qui sont des sauvegardes ou des copies d'archives du code et ne sont pas nécessaires
 * pour le fonctionnement du projet.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// Promisification
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const rmdir = util.promisify(fs.rmdir);
const unlink = util.promisify(fs.unlink);

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const VERBOSE = process.argv.includes('--verbose');

// Répertoires à nettoyer
const CLEANUP_DIRS = [
    'reports',
    'backup',
    '.backup',
    'backups',
    '.backups',
    'old',
    '.old',
    'archive',
    '.archive',
    'archives',
    '.archives',
    'tmp',
    '.tmp',
    'temp',
    '.temp',
];

// Extensions de fichiers de sauvegarde à supprimer partout
const BACKUP_EXTENSIONS = [
    '.bak',
    '.backup',
    '.old',
    '.tmp',
    '.temp',
    '.save',
    '.orig',
    '~',
];

// Répertoires à ignorer complètement
const IGNORE_DIRS = [
    'node_modules',
    'dist',
    '.git',
    'build',
];

// Statistiques
const stats = {
    scannedDirectories: 0,
    scannedFiles: 0,
    deletedDirectories: 0,
    deletedFiles: 0,
    sizeFreed: 0,
    errors: [],
};

/**
 * Vérifie si un chemin doit être ignoré
 */
function shouldIgnore(filePath) {
    return IGNORE_DIRS.some(dir => {
        const pattern = new RegExp(`(^|\\/)${dir}(\\/|$)`);
        return pattern.test(filePath);
    });
}

/**
 * Vérifie si un répertoire est un répertoire de sauvegarde à nettoyer
 */
function isBackupDirectory(dirName) {
    const baseName = path.basename(dirName).toLowerCase();
    return CLEANUP_DIRS.some(dir => baseName === dir || baseName.includes(`.${dir}.`) || baseName.endsWith(`.${dir}`));
}

/**
 * Vérifie si un fichier est un fichier de sauvegarde à nettoyer
 */
function isBackupFile(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName).toLowerCase();
    return BACKUP_EXTENSIONS.some(backupExt =>
        ext === backupExt ||
        baseName.endsWith(backupExt) ||
        baseName.match(/\.\d+$/) ||
        baseName.match(/\.backup\.\d+$/)
    );
}

/**
 * Formate la taille en unités lisibles
 */
function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Nettoie récursivement un répertoire
 */
async function cleanDirectory(dir, isRootLevel = false) {
    if (shouldIgnore(dir)) {
        if (VERBOSE) console.log(`Ignoré: ${dir}`);
        return false;
    }

    try {
        stats.scannedDirectories++;
        const entries = await readdir(dir, { withFileTypes: true });

        let isEmpty = entries.length === 0;
        let isBackupDir = isBackupDirectory(dir);

        // Si ce n'est pas un répertoire racine et c'est un répertoire de sauvegarde, on le supprime
        if (!isRootLevel && isBackupDir) {
            try {
                // Obtenir la taille du répertoire
                const dirSize = parseInt(
                    execSync(`du -sb "${dir}" | cut -f1`, { encoding: 'utf8' })
                );

                if (VERBOSE || DRY_RUN) {
                    console.log(`${DRY_RUN ? '[SIMULATION] ' : ''}Suppression du répertoire de sauvegarde: ${dir} (${formatSize(dirSize)})`);
                }

                if (!DRY_RUN) {
                    execSync(`rm -rf "${dir}"`);
                    stats.deletedDirectories++;
                    stats.sizeFreed += dirSize;
                }

                return true; // Répertoire supprimé
            } catch (err) {
                stats.errors.push(`Erreur lors de la suppression du répertoire ${dir}: ${err.message}`);
                if (VERBOSE) console.error(`Erreur lors de la suppression du répertoire ${dir}:`, err);
                return false;
            }
        }

        // Traiter récursivement tous les sous-répertoires et fichiers
        for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                const wasRemoved = await cleanDirectory(entryPath);
                if (!wasRemoved) isEmpty = false;
            } else if (entry.isFile()) {
                stats.scannedFiles++;

                // Vérifier si c'est un fichier de sauvegarde
                if (isBackupFile(entry.name) || (isBackupDir && FORCE)) {
                    try {
                        const fileStats = await stat(entryPath);

                        if (VERBOSE || DRY_RUN) {
                            console.log(`${DRY_RUN ? '[SIMULATION] ' : ''}Suppression du fichier de sauvegarde: ${entryPath} (${formatSize(fileStats.size)})`);
                        }

                        if (!DRY_RUN) {
                            await unlink(entryPath);
                            stats.deletedFiles++;
                            stats.sizeFreed += fileStats.size;
                        }
                    } catch (err) {
                        stats.errors.push(`Erreur lors de la suppression du fichier ${entryPath}: ${err.message}`);
                        if (VERBOSE) console.error(`Erreur lors de la suppression du fichier ${entryPath}:`, err);
                        isEmpty = false;
                    }
                } else {
                    isEmpty = false;
                }
            } else {
                isEmpty = false;
            }
        }

        // Si le répertoire est vide après le nettoyage et ce n'est pas le répertoire racine, on le supprime
        if (isEmpty && !isRootLevel) {
            if (VERBOSE || DRY_RUN) {
                console.log(`${DRY_RUN ? '[SIMULATION] ' : ''}Suppression du répertoire vide: ${dir}`);
            }

            if (!DRY_RUN) {
                await rmdir(dir);
                stats.deletedDirectories++;
            }

            return true; // Répertoire supprimé
        }

        return false; // Répertoire non supprimé
    } catch (err) {
        stats.errors.push(`Erreur lors du traitement du répertoire ${dir}: ${err.message}`);
        if (VERBOSE) console.error(`Erreur lors du traitement du répertoire ${dir}:`, err);
        return false;
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('Nettoyage des fichiers de sauvegarde et archives inutiles...');
    console.log(`Mode: ${DRY_RUN ? 'Simulation (dry-run)' : 'Réel'}`);
    console.log(`Force: ${FORCE ? 'Oui (suppression forcée dans les répertoires de sauvegarde)' : 'Non (suppression sélective)'}`);

    try {
        // Nettoyer à partir du répertoire racine
        await cleanDirectory(ROOT_DIR, true);

        // Afficher les statistiques
        console.log('\n=== RÉSULTATS ===');
        console.log(`Répertoires analysés: ${stats.scannedDirectories}`);
        console.log(`Fichiers analysés: ${stats.scannedFiles}`);
        console.log(`Répertoires supprimés: ${stats.deletedDirectories}`);
        console.log(`Fichiers supprimés: ${stats.deletedFiles}`);
        console.log(`Espace libéré: ${formatSize(stats.sizeFreed)}`);

        if (stats.errors.length > 0) {
            console.log(`\nErreurs rencontrées: ${stats.errors.length}`);
            if (VERBOSE) {
                console.log('\n=== ERREURS DÉTAILLÉES ===');
                stats.errors.forEach((err, i) => {
                    console.log(`${i + 1}. ${err}`);
                });
            } else {
                console.log('Pour voir les erreurs détaillées, exécutez avec l\'option --verbose');
            }
        }

        if (DRY_RUN) {
            console.log('\nMode simulation: aucun changement n\'a été effectué.');
            console.log('Pour appliquer les modifications, exécutez sans l\'option --dry-run');
            console.log('Pour forcer la suppression de tous les fichiers dans les répertoires de sauvegarde, ajoutez l\'option --force');
        }
    } catch (err) {
        console.error('Erreur non gérée lors de l\'exécution du script:', err);
        process.exit(1);
    }
}

// Exécuter le script
if (require.main === module) {
    main().catch(err => {
        console.error('Erreur non gérée:', err);
        process.exit(1);
    });
}