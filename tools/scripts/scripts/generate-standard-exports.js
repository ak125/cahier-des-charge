#!/usr/bin/env node

/**
 * Script pour générer automatiquement des exports standards pour les agents
 * Ce script résout le problème de duplication massive de code d'export (lignes 28-33)
 * détecté dans plus de 200 fichiers du projet.
 */

import fs from 'fs';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Obtenir l'équivalent de __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DIRS_TO_PROCESS = [
    'agents',
    'packages',
    'src'
];

// Liste des dossiers à exclure explicitement
const EXCLUDED_PATHS = [
    '/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/businessagent',
    '/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/qualityagent'
];

const CUSTOM_DIR = process.argv.find(arg => arg.startsWith('--dir='))?.split('=')[1];
if (CUSTOM_DIR) {
    DIRS_TO_PROCESS.length = 0;
    DIRS_TO_PROCESS.push(CUSTOM_DIR);
}

// Statistiques
const stats = {
    filesProcessed: 0,
    filesUpdated: 0,
    duplicateExportsDetected: 0,
    errorsEncountered: 0,
    errors: [] // Pour stocker les erreurs spécifiques
};

/**
 * Vérifie si un chemin est explicitement exclu
 * @param {string} path - Le chemin à vérifier
 * @returns {boolean} - True si le chemin est exclu
 */
function isExcludedPath(pathToCheck) {
    return EXCLUDED_PATHS.some(excludedPath =>
        pathToCheck === excludedPath ||
        pathToCheck.startsWith(excludedPath + '/'));
}

/**
 * Vérifie si un fichier est un fichier d'export standard pour un agent
 * @param {string} content - Le contenu du fichier
 * @returns {boolean} - True si le fichier est un export standard
 */
function hasStandardExportPattern(content) {
    // Vérifier le pattern typique des lignes 28-33
    const pattern = /\/\*\*\s*\n\s*\*\s*[A-Za-z0-9_]+\s*\n\s*\*\s*Agent export file\s*\n\s*\*\/\s*\n\s*import\s*\{\s*[A-Za-z0-9_]+\s*\}\s*from\s*'\.\/[a-z0-9\-]+'\s*;\s*\n\s*export\s*\{\s*[A-Za-z0-9_]+\s*\};\s*\n\s*export default\s*[A-Za-z0-9_]+\s*;/;
    return pattern.test(content);
}

/**
 * Génère un export standard pour un fichier agent
 * @param {string} componentName - Le nom de la classe/composant
 * @param {string} fileName - Le nom du fichier source (sans extension)
 * @returns {string} - Le code d'export standard généré
 */
function generateStandardExport(componentName, fileName) {
    return `/**
 * ${componentName}
 * Agent export file
 */

import { ${componentName} } from './${fileName}';

export { ${componentName} };
export default ${componentName};
`;
}

/**
 * Détermine le nom de la classe/composant à partir du nom de fichier
 * @param {string} fileName - Le nom du fichier (sans extension)
 * @returns {string} - Le nom de classe/composant formaté en PascalCase
 */
function getComponentNameFromFileName(fileName) {
    // Convertir kebab-case en PascalCase
    return fileName
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

/**
 * Traite récursivement les dossiers pour trouver les fichiers agents
 * @param {string} dir - Le dossier à analyser
 */
async function processDirectory(dir) {
    try {
        // Vérifier si le répertoire existe avant d'essayer de le lire
        if (!fs.existsSync(dir) || isExcludedPath(dir)) {
            if (isExcludedPath(dir)) {
                if (VERBOSE) {
                    console.log(`Dossier exclu: ${dir}`);
                }
                return;
            }

            const error = new Error(`Répertoire non trouvé: ${dir}`);
            error.code = 'ENOENT';
            throw error;
        }

        const entries = await readdir(dir);

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);

            if (isExcludedPath(fullPath)) {
                if (VERBOSE) {
                    console.log(`Élément exclu: ${fullPath}`);
                }
                continue;
            }

            try {
                const entryStats = await stat(fullPath);

                if (entryStats.isDirectory()) {
                    // Exclure certains dossiers
                    if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist' && entry !== 'build') {
                        await processDirectory(fullPath);
                    }
                } else if (entryStats.isFile() && entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !entry.endsWith('.test.ts')) {
                    await processFile(fullPath);
                }
            } catch (err) {
                // Si le fichier ou sous-dossier n'existe pas, on continue avec les autres
                if (err.code === 'ENOENT') {
                    const errorMessage = `Élément non trouvé: ${fullPath}`;
                    stats.errors.push(errorMessage);
                    console.warn(errorMessage);
                } else {
                    throw err;
                }
            }
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            const errorMessage = `Répertoire non trouvé: ${dir}`;
            stats.errors.push(errorMessage);
            console.error(errorMessage);
        } else {
            console.error(`Erreur lors du traitement du répertoire ${dir}:`, err);
        }
        stats.errorsEncountered++;
    }
}

/**
 * Analyse et met à jour un fichier si nécessaire
 * @param {string} filePath - Chemin du fichier à traiter
 */
async function processFile(filePath) {
    try {
        stats.filesProcessed++;

        const content = await readFile(filePath, 'utf8');

        // Vérifier si c'est un fichier d'export d'agent
        if (hasStandardExportPattern(content)) {
            stats.duplicateExportsDetected++;

            if (VERBOSE) {
                console.log(`Export standard détecté dans: ${filePath}`);
            }

            const fileName = path.basename(filePath, '.ts');
            const componentName = getComponentNameFromFileName(fileName);
            const standardExport = generateStandardExport(componentName, fileName);

            // Vérifier si le contenu généré correspond au contenu actuel (normalisation)
            if (standardExport.trim() !== content.trim()) {
                stats.filesUpdated++;

                if (!DRY_RUN) {
                    await writeFile(filePath, standardExport, 'utf8');
                    console.log(`Fichier mis à jour: ${filePath}`);
                } else {
                    if (VERBOSE) {
                        console.log(`Simulation - Mise à jour de: ${filePath}`);
                    }
                }
            }
        }
    } catch (err) {
        const errorMessage = `Erreur lors du traitement du fichier ${filePath}: ${err.message}`;
        stats.errors.push(errorMessage);
        console.error(errorMessage);
        stats.errorsEncountered++;
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('Début du traitement des exports standards d\'agents...');

    for (const dir of DIRS_TO_PROCESS) {
        const fullPath = path.join(ROOT_DIR, dir);
        if (fs.existsSync(fullPath)) {
            await processDirectory(fullPath);
        } else {
            console.warn(`Avertissement: Le répertoire ${fullPath} n'existe pas et sera ignoré.`);
        }
    }

    console.log('\n=== RÉSULTATS ===');
    console.log(`Fichiers analysés: ${stats.filesProcessed}`);
    console.log(`Exports standards détectés: ${stats.duplicateExportsDetected}`);
    console.log(`Fichiers mis à jour: ${stats.filesUpdated}`);
    console.log(`Erreurs rencontrées: ${stats.errorsEncountered}`);

    if (stats.errors.length > 0) {
        console.log('\n=== ERREURS DÉTAILLÉES ===');
        stats.errors.forEach((err, index) => {
            console.log(`${index + 1}. ${err}`);
        });
        console.log('\nConseil: Vérifiez les chemins de ces fichiers ou répertoires.');
    }

    if (DRY_RUN) {
        console.log('\nMode simulation (dry-run): aucun fichier n\'a été modifié');
    } else {
        console.log('\nConseils pour standardiser les exports:');
        console.log('1. Ajoutez ce script à vos hooks de pre-commit pour maintenir la cohérence');
        console.log('2. Mettre en place un modèle pour les nouveaux fichiers qui suit cette convention');
    }

    console.log('\nPour générer des exports standards pour tous les nouveaux fichiers agents, exécutez:');
    console.log('./scripts/generate-standard-exports.js');
}

// Exécution du script
// En ES modules, on vérifie si le fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(err => {
        console.error('Erreur globale:', err);
        process.exit(1);
    });
}

// Export pour ES modules
export {
    hasStandardExportPattern,
    generateStandardExport,
    getComponentNameFromFileName
};