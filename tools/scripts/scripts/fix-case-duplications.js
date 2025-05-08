#!/usr/bin/env node

/**
 * Script pour détecter et corriger les problèmes de doublons liés aux conventions de nommage
 * PascalCase vs kebab-case dans le projet
 * 
 * Ce script :
 * 1. Identifie les fichiers qui ont le même nom mais avec des conventions différentes
 * 2. Analyse les imports pour déterminer quelle convention est la plus utilisée
 * 3. Normalise les noms de fichiers vers la convention la plus cohérente
 * 4. Met à jour les imports pour refléter les changements
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { glob } = require('glob'); // Importe correctement la fonction glob au lieu de l'objet entier

// Promisification correcte des fonctions de fs
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const renameAsync = util.promisify(fs.rename);

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const FORCE_KEBAB = process.argv.includes('--force-kebab');
const FORCE_PASCAL = process.argv.includes('--force-pascal');

// Répertoires et modèles à ignorer
const IGNORE_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/reports/**',
    '**/legacy/**',                   // Ignorer tous les fichiers legacy
    '**/legacy-*/**',                 // Ignorer les variantes
    '**/migration-20*/**'             // Ignorer les dossiers de migration datés
];

// Statistiques
const stats = {
    filesAnalyzed: 0,
    duplicatesFound: 0,
    filesRenamed: 0,
    importsFixed: 0,
    errors: []
};

/**
 * Convertit un nom de PascalCase à kebab-case
 * @param {string} name - Nom en PascalCase
 * @returns {string} - Nom en kebab-case
 */
function pascalToKebab(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase();
}

/**
 * Convertit un nom de kebab-case à PascalCase
 * @param {string} name - Nom en kebab-case
 * @returns {string} - Nom en PascalCase
 */
function kebabToPascal(name) {
    return name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

/**
 * Détecte si un nom est en PascalCase
 * @param {string} name - Nom à analyser
 * @returns {boolean} - true si PascalCase
 */
function isPascalCase(name) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Détecte si un nom est en kebab-case
 * @param {string} name - Nom à analyser
 * @returns {boolean} - true si kebab-case
 */
function isKebabCase(name) {
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/**
 * Trouve les doublons potentiels basés sur les conventions de nommage
 * @returns {Object} - Map des doublons trouvés
 */
async function findCaseDuplicates() {
    console.log('Recherche des doublons PascalCase/kebab-case...');

    // Trouver tous les fichiers TypeScript/JavaScript
    // glob est déjà promisifié dans les nouvelles versions
    const files = await glob('**/*.{ts,js,tsx,jsx}', {
        cwd: ROOT_DIR,
        ignore: IGNORE_PATTERNS,
        absolute: false
    });

    stats.filesAnalyzed = files.length;
    console.log(`Analyse de ${files.length} fichiers...`);

    // Map pour suivre les fichiers par leur nom normalisé
    const filesByNormalizedName = new Map();

    // Premier passage : indexer les fichiers par leur nom normalisé
    for (const file of files) {
        const fullPath = path.join(ROOT_DIR, file);
        const parsedPath = path.parse(fullPath);
        const fileName = parsedPath.name;

        // Normaliser en minuscules pour la comparaison
        const normalizedName = fileName.toLowerCase();

        if (!filesByNormalizedName.has(normalizedName)) {
            filesByNormalizedName.set(normalizedName, []);
        }

        filesByNormalizedName.get(normalizedName).push({
            path: fullPath,
            relativePath: file,
            name: fileName,
            dir: parsedPath.dir,
            ext: parsedPath.ext,
            isPascalCase: isPascalCase(fileName),
            isKebabCase: isKebabCase(fileName)
        });
    }

    // Deuxième passage : trouver les doublons
    const duplicates = new Map();

    for (const [normalizedName, files] of filesByNormalizedName.entries()) {
        // Si plus d'un fichier avec le même nom normalisé
        if (files.length > 1) {
            // Vérifier s'il y a un mélange de conventions
            const hasPascalCase = files.some(file => file.isPascalCase);
            const hasKebabCase = files.some(file => file.isKebabCase);

            if (hasPascalCase && hasKebabCase) {
                duplicates.set(normalizedName, files);
                stats.duplicatesFound++;

                if (VERBOSE) {
                    console.log(`Doublon trouvé: ${normalizedName}`);
                    files.forEach(file => console.log(`  - ${file.relativePath} (${file.isPascalCase ? 'PascalCase' : file.isKebabCase ? 'kebab-case' : 'autre'})`));
                }
            }
        }
    }

    console.log(`${stats.duplicatesFound} doublons potentiels trouvés.`);
    return duplicates;
}

/**
 * Analyse les imports dans le code pour déterminer la convention préférée
 * @param {Array} duplicateFiles - Liste des fichiers en doublon
 * @returns {string} - Convention préférée ('pascal' ou 'kebab')
 */
async function determinePreferredConvention(duplicateFiles) {
    // Si une convention est forcée par les arguments
    if (FORCE_KEBAB) return 'kebab';
    if (FORCE_PASCAL) return 'pascal';

    // Nombre d'imports trouvés pour chaque convention
    let pascalImports = 0;
    let kebabImports = 0;

    // Parcourir tous les fichiers TS/JS
    const allFiles = await glob('**/*.{ts,js,tsx,jsx}', {
        cwd: ROOT_DIR,
        ignore: IGNORE_PATTERNS,
        absolute: false
    });

    for (const file of allFiles) {
        try {
            const fullPath = path.join(ROOT_DIR, file);
            const content = await readFileAsync(fullPath, 'utf8');

            // Analyser les imports
            for (const duplicate of duplicateFiles) {
                const pascalName = kebabToPascal(duplicate[0].name);
                const kebabName = pascalToKebab(duplicate[0].name);

                // Compter les imports en PascalCase
                const pascalImportRegex = new RegExp(`from\\s+['"](.*?/${pascalName})['"](;|\\s)`, 'g');
                const pascalMatches = content.match(pascalImportRegex) || [];
                pascalImports += pascalMatches.length;

                // Compter les imports en kebab-case
                const kebabImportRegex = new RegExp(`from\\s+['"](.*?/${kebabName})['"](;|\\s)`, 'g');
                const kebabMatches = content.match(kebabImportRegex) || [];
                kebabImports += kebabMatches.length;
            }
        } catch (err) {
            stats.errors.push(`Erreur lors de la lecture de ${file}: ${err.message}`);
            if (VERBOSE) {
                console.error(`Erreur lors de la lecture de ${file}:`, err);
            }
        }
    }

    console.log(`Analyse des imports: ${pascalImports} en PascalCase, ${kebabImports} en kebab-case`);

    // Par défaut, préférer kebab-case car c'est le standard moderne pour les fichiers
    return kebabImports >= pascalImports ? 'kebab' : 'pascal';
}

/**
 * Met à jour les imports dans un fichier
 * @param {string} filePath - Chemin du fichier à mettre à jour
 * @param {Map} renamedFiles - Map des fichiers renommés (ancien chemin => nouveau chemin)
 */
async function updateImports(filePath, renamedFiles) {
    try {
        let content = await readFileAsync(filePath, 'utf8');
        let updated = false;

        for (const [oldPath, newPath] of renamedFiles.entries()) {
            const oldBasename = path.basename(oldPath, path.extname(oldPath));
            const newBasename = path.basename(newPath, path.extname(newPath));

            // Mettre à jour les imports avec le chemin complet
            const importRegex = new RegExp(`from\\s+['"](.*)${oldBasename}['"](;|\\s)`, 'g');
            const updatedContent = content.replace(importRegex, (match, p1, p2) => {
                updated = true;
                return `from "${p1}${newBasename}"${p2}`;
            });

            if (content !== updatedContent) {
                content = updatedContent;
                stats.importsFixed++;
            }
        }

        if (updated && !DRY_RUN) {
            await writeFileAsync(filePath, content, 'utf8');
            if (VERBOSE) {
                console.log(`Imports mis à jour dans: ${filePath}`);
            }
        }
    } catch (err) {
        stats.errors.push(`Erreur lors de la mise à jour des imports dans ${filePath}: ${err.message}`);
        if (VERBOSE) {
            console.error(`Erreur lors de la mise à jour des imports dans ${filePath}:`, err);
        }
    }
}

/**
 * Normalise les fichiers en doublon selon la convention choisie
 * @param {Map} duplicates - Map des fichiers en doublon
 * @param {string} preferredConvention - Convention préférée ('pascal' ou 'kebab')
 */
async function normalizeFilenames(duplicates, preferredConvention) {
    console.log(`Normalisation des fichiers en ${preferredConvention === 'kebab' ? 'kebab-case' : 'PascalCase'}...`);

    const renamedFiles = new Map(); // Garde une trace des fichiers renommés

    for (const [normalizedName, files] of duplicates.entries()) {
        // Séparer les fichiers par convention
        const pascalFiles = files.filter(file => file.isPascalCase);
        const kebabFiles = files.filter(file => file.isKebabCase);
        const otherFiles = files.filter(file => !file.isPascalCase && !file.isKebabCase);

        // Déterminer quels fichiers doivent être renommés
        let filesToRename = [];

        if (preferredConvention === 'kebab') {
            filesToRename = [...pascalFiles, ...otherFiles];
        } else { // pascal
            filesToRename = [...kebabFiles, ...otherFiles];
        }

        // Renommer les fichiers
        for (const file of filesToRename) {
            const newName = preferredConvention === 'kebab'
                ? pascalToKebab(file.name)
                : kebabToPascal(file.name);

            const newPath = path.join(file.dir, newName + file.ext);

            if (VERBOSE) {
                console.log(`Renommage: ${file.path} -> ${newPath}`);
            }

            if (!DRY_RUN) {
                try {
                    await renameAsync(file.path, newPath);
                    renamedFiles.set(file.path, newPath);
                    stats.filesRenamed++;
                } catch (err) {
                    stats.errors.push(`Erreur lors du renommage de ${file.path}: ${err.message}`);
                    if (VERBOSE) {
                        console.error(`Erreur lors du renommage de ${file.path}:`, err);
                    }
                }
            } else {
                stats.filesRenamed++;
            }
        }
    }

    // Mettre à jour les imports si des fichiers ont été renommés
    if (renamedFiles.size > 0 && !DRY_RUN) {
        console.log('Mise à jour des imports dans les fichiers...');

        const allFiles = await glob('**/*.{ts,js,tsx,jsx}', {
            cwd: ROOT_DIR,
            ignore: IGNORE_PATTERNS,
            absolute: false
        });

        for (const file of allFiles) {
            const fullPath = path.join(ROOT_DIR, file);
            await updateImports(fullPath, renamedFiles);
        }
    }

    return renamedFiles;
}

/**
 * Fonction principale
 */
async function main() {
    console.log('Début de la détection et correction des doublons PascalCase/kebab-case...');

    try {
        // Trouver les doublons
        const duplicates = await findCaseDuplicates();

        if (duplicates.size > 0) {
            // Déterminer la convention préférée
            const preferredConvention = await determinePreferredConvention(Array.from(duplicates.values()));
            console.log(`Convention préférée: ${preferredConvention === 'kebab' ? 'kebab-case' : 'PascalCase'}`);

            // Normaliser les noms de fichiers
            await normalizeFilenames(duplicates, preferredConvention);
        } else {
            console.log('Aucun doublon lié aux conventions de nommage trouvé.');
        }

        // Afficher les statistiques
        console.log('\n=== RÉSULTATS ===');
        console.log(`Fichiers analysés: ${stats.filesAnalyzed}`);
        console.log(`Doublons trouvés: ${stats.duplicatesFound}`);
        console.log(`Fichiers renommés: ${stats.filesRenamed}`);
        console.log(`Imports mis à jour: ${stats.importsFixed}`);

        if (stats.errors.length > 0) {
            console.log(`\nErreurs rencontrées: ${stats.errors.length}`);
            if (VERBOSE) {
                console.log('\n=== ERREURS DÉTAILLÉES ===');
                stats.errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
            } else {
                console.log('Utilisez --verbose pour voir les erreurs détaillées.');
            }
        }

        if (DRY_RUN) {
            console.log('\nMode simulation (--dry-run): aucun fichier n\'a été modifié.');
            console.log('Pour appliquer les changements, exécutez sans --dry-run.');
        }
    } catch (err) {
        console.error('Erreur lors de l\'exécution du script:', err);
        process.exit(1);
    }
}

// Exécution du script
if (require.main === module) {
    main();
}

module.exports = {
    pascalToKebab,
    kebabToPascal,
    isPascalCase,
    isKebabCase,
    findCaseDuplicates,
    normalizeFilenames
};