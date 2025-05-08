#!/usr/bin/env node

/**
 * Script de fusion des dossiers dupliqués avec des conventions de nommage différentes
 * 
 * Ce script résout les erreurs ENOTEMPTY rencontrées lors de la standardisation
 * des noms de dossiers en fusionnant le contenu des dossiers en conflit.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { execSync } = require('child_process');
const { glob } = require('glob');

// Promisification
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);
const copyFileAsync = util.promisify(fs.copyFile);
const mkdirAsync = util.promisify(fs.mkdir);

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const FORCE_MERGE = process.argv.includes('--force');

// Répertoires et fichiers à ignorer
const IGNORE_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/reports/**',
    '**/legacy/**',
    '**/.git/**'
];

// Configuration pour les erreurs identifiées
const DUPLICATE_FOLDERS = require('./duplicate-folders-data.js');

// Statistiques
const stats = {
    foldersMerged: 0,
    filesCopied: 0,
    filesOverwritten: 0,
    errors: []
};

/**
 * Vérifie si un chemin doit être ignoré
 * @param {string} filePath - Chemin à vérifier
 * @returns {boolean} - true si le chemin doit être ignoré
 */
function shouldIgnore(filePath) {
    return IGNORE_PATTERNS.some(pattern => {
        const regexPattern = new RegExp(pattern.replace(/\*/g, '.*'));
        return regexPattern.test(filePath);
    });
}

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
 * Copie récursivement les fichiers d'un dossier à un autre
 * @param {string} source - Chemin du dossier source
 * @param {string} target - Chemin du dossier cible
 * @param {function} onFileCopy - Callback appelé pour chaque fichier copié
 * @returns {Promise<void>}
 */
async function copyFolderRecursive(source, target, onFileCopy) {
    if (shouldIgnore(source)) {
        if (VERBOSE) {
            console.log(`Ignoré: ${source}`);
        }
        return;
    }

    try {
        // Créer le dossier cible s'il n'existe pas
        if (!fs.existsSync(target) && !DRY_RUN) {
            await mkdirAsync(target, { recursive: true });
        }

        // Obtenir la liste des fichiers/dossiers dans le dossier source
        const entries = await readdirAsync(source);

        // Copier chaque entrée
        for (const entry of entries) {
            const srcPath = path.join(source, entry);
            const tgtPath = path.join(target, entry);

            try {
                const stats = await statAsync(srcPath);

                if (stats.isDirectory()) {
                    // Récursion pour les sous-répertoires
                    await copyFolderRecursive(srcPath, tgtPath, onFileCopy);
                } else {
                    // Copier le fichier
                    if (!DRY_RUN) {
                        const fileExists = fs.existsSync(tgtPath);

                        // Si le fichier existe déjà, vérifier s'il est différent
                        if (fileExists && !FORCE_MERGE) {
                            const sourceContent = await readFileAsync(srcPath, 'utf8');
                            const targetContent = await readFileAsync(tgtPath, 'utf8');

                            if (sourceContent !== targetContent) {
                                // Les fichiers sont différents, sauvegarder le fichier cible avec extension .bak
                                const bakPath = `${tgtPath}.bak`;
                                await copyFileAsync(tgtPath, bakPath);
                                if (VERBOSE) {
                                    console.log(`Fichier existant sauvegardé: ${tgtPath} -> ${bakPath}`);
                                }
                                stats.filesOverwritten++;
                            }
                        }

                        await copyFileAsync(srcPath, tgtPath);
                        stats.filesCopied++;

                        if (onFileCopy) {
                            onFileCopy(srcPath, tgtPath, fileExists);
                        }
                    } else if (VERBOSE) {
                        const fileExists = fs.existsSync(tgtPath);
                        console.log(`Simulation - Copie: ${srcPath} -> ${tgtPath}${fileExists ? ' (écrasement)' : ''}`);
                    }
                }
            } catch (err) {
                stats.errors.push(`Erreur lors de la copie de ${srcPath}: ${err.message}`);
                if (VERBOSE) {
                    console.error(`Erreur lors de la copie de ${srcPath}:`, err);
                }
            }
        }
    } catch (err) {
        stats.errors.push(`Erreur lors de la lecture du répertoire ${source}: ${err.message}`);
        if (VERBOSE) {
            console.error(`Erreur lors de la lecture du répertoire ${source}:`, err);
        }
    }
}

/**
 * Fusionne deux dossiers en conflit
 * @param {string} pascalCaseFolder - Chemin du dossier en PascalCase
 * @param {string} kebabCaseFolder - Chemin du dossier en kebab-case
 */
async function mergeFolders(pascalCaseFolder, kebabCaseFolder) {
    try {
        console.log(`Fusion des dossiers:`);
        console.log(`  Source: ${pascalCaseFolder}`);
        console.log(`  Cible: ${kebabCaseFolder}`);

        // Copier les fichiers du dossier PascalCase vers le dossier kebab-case
        await copyFolderRecursive(pascalCaseFolder, kebabCaseFolder, (src, tgt, overwritten) => {
            if (VERBOSE) {
                console.log(`  Fichier ${overwritten ? 'écrasé' : 'copié'}: ${src} -> ${tgt}`);
            }
        });

        // Supprimer le dossier PascalCase après la copie
        if (!DRY_RUN) {
            try {
                execSync(`rm -rf "${pascalCaseFolder}"`);
                console.log(`Dossier supprimé après fusion: ${pascalCaseFolder}`);
                stats.foldersMerged++;
            } catch (err) {
                stats.errors.push(`Erreur lors de la suppression du dossier ${pascalCaseFolder}: ${err.message}`);
                if (VERBOSE) {
                    console.error(`Erreur lors de la suppression du dossier ${pascalCaseFolder}:`, err);
                }
            }
        } else {
            console.log(`Simulation - Dossier à supprimer après fusion: ${pascalCaseFolder}`);
        }
    } catch (err) {
        stats.errors.push(`Erreur lors de la fusion des dossiers ${pascalCaseFolder} et ${kebabCaseFolder}: ${err.message}`);
        if (VERBOSE) {
            console.error(`Erreur lors de la fusion des dossiers ${pascalCaseFolder} et ${kebabCaseFolder}:`, err);
        }
    }
}

/**
 * Recherche et fusionne automatiquement les dossiers en conflit dans le projet
 */
async function findAndMergeConflictFolders() {
    console.log('Recherche automatique des dossiers en conflit...');

    // Liste pour stocker les paires de dossiers en conflit (PascalCase => kebab-case)
    const conflictPairs = [];

    // Parcourir tous les dossiers du projet
    try {
        const allDirs = await glob('**/*/!(node_modules|dist|build|reports|legacy|.git)', {
            cwd: ROOT_DIR,
            onlyDirectories: true,
            absolute: true,
            follow: false
        });

        // Premier passage: identifier les dossiers avec des noms similaires
        const dirsByBaseName = {};

        for (const dir of allDirs) {
            if (shouldIgnore(dir)) continue;

            const dirName = path.basename(dir);
            const kebabName = toKebabCase(dirName);

            if (!dirsByBaseName[kebabName]) {
                dirsByBaseName[kebabName] = [];
            }

            dirsByBaseName[kebabName].push(dir);
        }

        // Trouver les dossiers en conflit
        for (const [kebabName, dirs] of Object.entries(dirsByBaseName)) {
            if (dirs.length > 1) {
                // Filtrer pour ne garder que les paires avec un dossier PascalCase et un kebab-case
                const pascalCaseDirs = dirs.filter(dir => {
                    const dirName = path.basename(dir);
                    return dirName !== kebabName && /^[A-Z]/.test(dirName);
                });

                const kebabCaseDirs = dirs.filter(dir => {
                    const dirName = path.basename(dir);
                    return dirName === kebabName;
                });

                if (pascalCaseDirs.length > 0 && kebabCaseDirs.length > 0) {
                    // Ajouter chaque paire PascalCase => kebab-case aux conflits
                    for (const pascalDir of pascalCaseDirs) {
                        for (const kebabDir of kebabCaseDirs) {
                            // Vérifier que les dossiers sont au même niveau (même répertoire parent)
                            if (path.dirname(pascalDir) === path.dirname(kebabDir)) {
                                conflictPairs.push({
                                    pascalCase: pascalDir,
                                    kebabCase: kebabDir
                                });
                            }
                        }
                    }
                }
            }
        }

        if (conflictPairs.length === 0) {
            console.log("Aucun dossier en conflit détecté automatiquement.");
        } else {
            console.log(`${conflictPairs.length} paires de dossiers en conflit détectées.`);

            // Fusionner chaque paire
            for (const { pascalCase, kebabCase } of conflictPairs) {
                await mergeFolders(pascalCase, kebabCase);
            }
        }
    } catch (err) {
        stats.errors.push(`Erreur lors de la recherche des dossiers en conflit: ${err.message}`);
        if (VERBOSE) {
            console.error("Erreur lors de la recherche des dossiers en conflit:", err);
        }
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('Fusion des dossiers dupliqués avec des conventions de nommage différentes...');
    console.log(`Mode: ${DRY_RUN ? 'Simulation (dry-run)' : 'Réel'}`);
    console.log(`Force: ${FORCE_MERGE ? 'Oui (écrasement des fichiers)' : 'Non (sauvegarde des fichiers différents)'}`);

    try {
        // Si on a des données préconfigurées pour les erreurs identifiées
        if (DUPLICATE_FOLDERS && DUPLICATE_FOLDERS.length > 0) {
            console.log(`Traitement de ${DUPLICATE_FOLDERS.length} paires de dossiers en conflit préconfigurées...`);

            for (const { pascalCase, kebabCase } of DUPLICATE_FOLDERS) {
                const pascalPath = path.join(ROOT_DIR, pascalCase);
                const kebabPath = path.join(ROOT_DIR, kebabCase);

                // Vérifier si les deux dossiers existent
                if (fs.existsSync(pascalPath) && fs.existsSync(kebabPath)) {
                    await mergeFolders(pascalPath, kebabPath);
                } else {
                    console.log(`Avertissement: L'un des dossiers n'existe pas:`);
                    console.log(`  ${pascalPath}: ${fs.existsSync(pascalPath) ? 'Existe' : 'N\'existe pas'}`);
                    console.log(`  ${kebabPath}: ${fs.existsSync(kebabPath) ? 'Existe' : 'N\'existe pas'}`);
                }
            }
        } else {
            // Recherche automatique des dossiers en conflit si aucune donnée n'est fournie
            await findAndMergeConflictFolders();
        }

        // Afficher les statistiques
        console.log('\n=== RÉSULTATS ===');
        if (!DRY_RUN) {
            console.log(`Dossiers fusionnés: ${stats.foldersMerged}`);
            console.log(`Fichiers copiés: ${stats.filesCopied}`);
            console.log(`Fichiers écrasés (avec sauvegarde): ${stats.filesOverwritten}`);
        }

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

        // Conseil pour la prochaine étape
        if (!DRY_RUN && stats.foldersMerged > 0) {
            console.log('\nConseil: Exécutez maintenant le script standardize-naming.js pour finaliser la standardisation:');
            console.log('  node scripts/standardize-naming.js --verbose');
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