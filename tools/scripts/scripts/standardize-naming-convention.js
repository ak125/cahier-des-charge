#!/usr/bin/env node

/**
 * Script de standardisation des conventions de nommage
 * 
 * Ce script parcourt l'ensemble du projet et convertit tous les fichiers et dossiers
 * qui utilisent PascalCase ou camelCase vers kebab-case, qui est la convention standard du projet.
 * 
 * Il met également à jour les imports et références pour maintenir la cohérence.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { execSync } = require('child_process');
const { glob } = require('glob');

// Promisification
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const renameAsync = util.promisify(fs.rename);
const statAsync = util.promisify(fs.stat);
const readdirAsync = util.promisify(fs.readdir);
const mkdirAsync = util.promisify(fs.mkdir);

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const FORCE = process.argv.includes('--force');
const MAX_DEPTH = 10; // Profondeur maximale pour éviter les boucles infinies

// Répertoires et fichiers à ignorer
const IGNORE_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/reports/**',
    '**/legacy/**',
    '**/.git/**',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml'
];

// Statistiques
const stats = {
    scannedFiles: 0,
    scannedDirectories: 0,
    renamedFiles: 0,
    renamedDirectories: 0,
    updatedImports: 0,
    errors: []
};

/**
 * Convertit une chaîne en kebab-case
 * @param {string} str - La chaîne à convertir
 * @returns {string} - La chaîne en kebab-case
 */
function toKebabCase(str) {
    return str
        // Conversion PascalCase/camelCase en kebab-case
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        // Conversion des espaces, points et underscores en tirets
        .replace(/[\s._]+/g, '-')
        // Tout en minuscules
        .toLowerCase()
        // Suppression des tirets multiples
        .replace(/-+/g, '-')
        // Suppression des tirets au début et à la fin
        .replace(/^-|-$/g, '');
}

/**
 * Vérifie si un nom est en PascalCase
 * @param {string} name - Le nom à vérifier
 * @returns {boolean} - true si PascalCase
 */
function isPascalCase(name) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Vérifie si un nom est en camelCase
 * @param {string} name - Le nom à vérifier
 * @returns {boolean} - true si camelCase
 */
function isCamelCase(name) {
    return /^[a-z][a-zA-Z0-9]*[A-Z]/.test(name);
}

/**
 * Vérifie si un nom est en kebab-case
 * @param {string} name - Le nom à vérifier
 * @returns {boolean} - true si kebab-case
 */
function isKebabCase(name) {
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/**
 * Vérifie si un nom doit être converti
 * @param {string} name - Le nom à vérifier
 * @returns {boolean} - true si le nom doit être converti
 */
function shouldConvert(name) {
    // Exceptions - ne pas convertir
    const exceptions = [
        'package.json', 'README.md', 'LICENSE', 'Dockerfile', 'Earthfile',
        'tsconfig.json', 'jest.config.js', 'index.ts', 'index.js', '.gitignore'
    ];

    if (exceptions.includes(name)) {
        return false;
    }

    // Vérifier si ce n'est pas déjà en kebab-case
    if (isKebabCase(name)) {
        return false;
    }

    // Vérifier si c'est en PascalCase ou camelCase
    return isPascalCase(name) || isCamelCase(name);
}

/**
 * Scanne récursivement les répertoires et convertit les noms de fichiers et dossiers
 * @param {string} dirPath - Le chemin du répertoire à scanner
 * @param {number} depth - Profondeur actuelle de la récursion
 * @returns {Object} - Map des chemins renommés (ancien => nouveau)
 */
async function scanAndConvertDirectory(dirPath, depth = 0) {
    if (depth > MAX_DEPTH) {
        console.warn(`Atteinte de la profondeur maximale à ${dirPath}`);
        return new Map();
    }

    // Vérifier si le répertoire doit être ignoré
    for (const pattern of IGNORE_PATTERNS) {
        if (dirPath.includes(pattern.replace(/\*/g, ''))) {
            if (VERBOSE) {
                console.log(`Répertoire ignoré: ${dirPath}`);
            }
            return new Map();
        }
    }

    stats.scannedDirectories++;

    // Liste pour stocker les chemins à renommer (ancien => nouveau)
    const renamePaths = new Map();

    try {
        const entries = await readdirAsync(dirPath);

        // Phase 1: Scanner et collecter les entrées à renommer (d'abord les fichiers)
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);

            try {
                const entryStats = await statAsync(fullPath);

                // Traiter uniquement les fichiers dans cette phase
                if (entryStats.isFile() && shouldConvert(entry)) {
                    stats.scannedFiles++;
                    const parsedPath = path.parse(fullPath);
                    const kebabName = toKebabCase(parsedPath.name);
                    const newFilePath = path.join(parsedPath.dir, `${kebabName}${parsedPath.ext}`);

                    if (fullPath !== newFilePath) {
                        renamePaths.set(fullPath, newFilePath);

                        if (VERBOSE) {
                            console.log(`Fichier à renommer: ${fullPath} -> ${newFilePath}`);
                        }
                    }
                }
            } catch (err) {
                stats.errors.push(`Erreur lors de l'analyse de ${fullPath}: ${err.message}`);
                console.error(`Erreur lors de l'analyse de ${fullPath}:`, err);
            }
        }

        // Phase 2: Scanner récursivement les sous-répertoires
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);

            try {
                const entryStats = await statAsync(fullPath);

                if (entryStats.isDirectory()) {
                    // Récursion pour les sous-répertoires
                    const subDirRenamePaths = await scanAndConvertDirectory(fullPath, depth + 1);

                    // Fusionner les chemins à renommer
                    for (const [oldPath, newPath] of subDirRenamePaths.entries()) {
                        renamePaths.set(oldPath, newPath);
                    }

                    // Vérifier si le répertoire lui-même doit être renommé
                    if (shouldConvert(entry)) {
                        const parsedPath = path.parse(fullPath);
                        const kebabName = toKebabCase(parsedPath.name);
                        const newDirPath = path.join(parsedPath.dir, kebabName);

                        if (fullPath !== newDirPath) {
                            renamePaths.set(fullPath, newDirPath);

                            if (VERBOSE) {
                                console.log(`Répertoire à renommer: ${fullPath} -> ${newDirPath}`);
                            }
                        }
                    }
                }
            } catch (err) {
                stats.errors.push(`Erreur lors de l'analyse de ${fullPath}: ${err.message}`);
                console.error(`Erreur lors de l'analyse de ${fullPath}:`, err);
            }
        }
    } catch (err) {
        stats.errors.push(`Erreur lors de la lecture du répertoire ${dirPath}: ${err.message}`);
        console.error(`Erreur lors de la lecture du répertoire ${dirPath}:`, err);
    }

    return renamePaths;
}

/**
 * Met à jour les imports dans les fichiers TypeScript/JavaScript
 * @param {string} filePath - Chemin du fichier à mettre à jour
 * @param {Map} renamePaths - Map des chemins renommés (ancien => nouveau)
 * @returns {boolean} - true si des modifications ont été apportées
 */
async function updateImports(filePath, renamePaths) {
    try {
        // Ne traiter que les fichiers TypeScript/JavaScript
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.js') &&
            !filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
            return false;
        }

        const content = await readFileAsync(filePath, 'utf8');
        let updatedContent = content;
        let modified = false;

        // Convertir les chemins absolus en relatifs pour les imports
        for (const [oldPath, newPath] of renamePaths.entries()) {
            // Ne gérer que les changements de nom de fichier, pas de chemin complet
            const oldBaseName = path.basename(oldPath, path.extname(oldPath));
            const newBaseName = path.basename(newPath, path.extname(newPath));

            if (oldBaseName !== newBaseName) {
                // Remplacer les imports et require
                const importRegex = new RegExp(`(from\\s+['"])([^'"]*?/)?(${oldBaseName})(['"])`, 'g');
                const requireRegex = new RegExp(`(require\\s*\\(\\s*['"])([^'"]*?/)?(${oldBaseName})(['"]\\s*\\))`, 'g');

                const importUpdated = updatedContent.replace(importRegex, (match, prefix, path, _, suffix) => {
                    return `${prefix}${path || ''}${newBaseName}${suffix}`;
                });

                if (importUpdated !== updatedContent) {
                    modified = true;
                    updatedContent = importUpdated;
                }

                const requireUpdated = updatedContent.replace(requireRegex, (match, prefix, path, _, suffix) => {
                    return `${prefix}${path || ''}${newBaseName}${suffix}`;
                });

                if (requireUpdated !== updatedContent) {
                    modified = true;
                    updatedContent = requireUpdated;
                }
            }
        }

        if (modified && !DRY_RUN) {
            await writeFileAsync(filePath, updatedContent, 'utf8');
            stats.updatedImports++;

            if (VERBOSE) {
                console.log(`Imports mis à jour dans: ${filePath}`);
            }
        }

        return modified;
    } catch (err) {
        stats.errors.push(`Erreur lors de la mise à jour des imports dans ${filePath}: ${err.message}`);
        console.error(`Erreur lors de la mise à jour des imports dans ${filePath}:`, err);
        return false;
    }
}

/**
 * Exécute les renommages collectés
 * @param {Map} renamePaths - Map des chemins à renommer (ancien => nouveau)
 */
async function executeRenames(renamePaths) {
    console.log(`Exécution de ${renamePaths.size} renommages...`);

    // Convertir la Map en tableau d'objets pour le tri
    const renameOperations = Array.from(renamePaths.entries()).map(([oldPath, newPath]) => {
        const isDirectory = oldPath.split('/').pop().indexOf('.') === -1;
        return { oldPath, newPath, isDirectory };
    });

    // Trier pour renommer d'abord les fichiers, puis les répertoires (de la profondeur la plus grande à la plus petite)
    renameOperations.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return 1;
        if (!a.isDirectory && b.isDirectory) return -1;
        if (a.isDirectory && b.isDirectory) {
            // Renommer les répertoires les plus profonds d'abord
            return b.oldPath.split('/').length - a.oldPath.split('/').length;
        }
        return 0;
    });

    // Exécuter les renommages
    for (const { oldPath, newPath, isDirectory } of renameOperations) {
        try {
            if (!DRY_RUN) {
                // S'assurer que le répertoire parent existe
                const parentDir = path.dirname(newPath);
                await mkdirAsync(parentDir, { recursive: true });

                // Renommer le fichier ou répertoire
                await renameAsync(oldPath, newPath);

                if (isDirectory) {
                    stats.renamedDirectories++;
                } else {
                    stats.renamedFiles++;
                }

                console.log(`Renommé: ${oldPath} -> ${newPath}`);
            } else if (VERBOSE) {
                console.log(`Simulation - Renommage: ${oldPath} -> ${newPath}`);
            }
        } catch (err) {
            stats.errors.push(`Erreur lors du renommage de ${oldPath}: ${err.message}`);
            console.error(`Erreur lors du renommage de ${oldPath}:`, err);
        }
    }
}

/**
 * Met à jour tous les imports dans le projet
 * @param {Map} renamePaths - Map des chemins renommés (ancien => nouveau)
 */
async function updateAllImports(renamePaths) {
    console.log('Mise à jour des imports dans les fichiers...');

    // Trouver tous les fichiers TypeScript/JavaScript
    const files = await glob('**/*.{ts,js,tsx,jsx}', {
        cwd: ROOT_DIR,
        ignore: IGNORE_PATTERNS,
        absolute: false
    });

    for (const relativeFilePath of files) {
        const fullFilePath = path.join(ROOT_DIR, relativeFilePath);
        await updateImports(fullFilePath, renamePaths);
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('Standardisation des conventions de nommage en kebab-case...');
    console.log(`Mode: ${DRY_RUN ? 'Simulation (dry-run)' : 'Réel'}`);

    try {
        // Étape 1: Scanner et collecter les renommages nécessaires
        const renamePaths = await scanAndConvertDirectory(ROOT_DIR);

        if (renamePaths.size === 0) {
            console.log('Aucun fichier ou répertoire à renommer.');
            return;
        }

        // Étape 2: Exécuter les renommages
        await executeRenames(renamePaths);

        // Étape 3: Mettre à jour les imports
        await updateAllImports(renamePaths);

        // Afficher les statistiques
        console.log('\n=== RÉSULTATS ===');
        console.log(`Répertoires analysés: ${stats.scannedDirectories}`);
        console.log(`Fichiers analysés: ${stats.scannedFiles}`);
        console.log(`Répertoires renommés: ${stats.renamedDirectories}`);
        console.log(`Fichiers renommés: ${stats.renamedFiles}`);
        console.log(`Fichiers avec imports mis à jour: ${stats.updatedImports}`);

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
        }

        // Conseil pour valider les changements avec git diff
        if (!DRY_RUN && stats.renamedFiles + stats.renamedDirectories > 0) {
            console.log('\nConseil: Utilisez "git status" pour vérifier les modifications et "git diff" pour voir les changements de contenu.');
        }
    } catch (err) {
        console.error('Erreur lors de l\'exécution du script:', err);
        process.exit(1);
    }
}

// Exécuter le script si appelé directement
if (require.main === module) {
    main().catch(err => {
        console.error('Erreur non gérée:', err);
        process.exit(1);
    });
}

module.exports = {
    toKebabCase,
    isPascalCase,
    isCamelCase,
    isKebabCase,
    shouldConvert
};