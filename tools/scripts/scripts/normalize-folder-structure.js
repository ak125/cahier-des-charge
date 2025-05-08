#!/usr/bin/env node

/**
 * Script de normalisation de la structure du projet
 * Ce script permet de :
 * 1. Normaliser les noms de dossiers en kebab-case
 * 2. Détecter et résoudre les duplications
 * 3. Aplatir les structures redondantes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PACKAGES_ROOT = path.join(__dirname, '..', 'packages');
const AGENTS_ROOT = path.join(__dirname, '..', 'agents');
const FOLDER_MAPPING_FILE = path.join(__dirname, '..', 'structure-mapping.json');
const DRY_RUN = process.argv.includes('--dry-run');

// Utilitaire pour convertir en kebab-case
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

// Fonction pour normaliser les noms de dossiers
function normalizeFolderNames(rootDir, folderMapping = {}) {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(rootDir, entry.name);

        if (entry.isDirectory()) {
            // Normaliser le nom du dossier actuel
            const normalizedName = toKebabCase(entry.name);

            if (normalizedName !== entry.name) {
                const newPath = path.join(rootDir, normalizedName);

                // Vérifier si la destination existe déjà
                if (fs.existsSync(newPath)) {
                    console.log(`CONFLIT: ${fullPath} -> ${newPath} (destination existe déjà)`);

                    // Marquer pour résolution manuelle
                    folderMapping[fullPath] = {
                        normalizedPath: newPath,
                        status: 'conflict',
                        resolution: 'manual'
                    };
                } else {
                    console.log(`Renommage: ${fullPath} -> ${newPath}`);

                    if (!DRY_RUN) {
                        fs.renameSync(fullPath, newPath);
                    }

                    folderMapping[fullPath] = {
                        normalizedPath: newPath,
                        status: 'renamed',
                        resolution: 'automatic'
                    };

                    // Continuer la normalisation dans le nouveau chemin
                    normalizeFolderNames(newPath, folderMapping);
                }
            } else {
                // Si le nom est déjà normalisé, continuer avec les sous-dossiers
                normalizeFolderNames(fullPath, folderMapping);
            }
        }
    }

    return folderMapping;
}

// Fonction pour détecter et résoudre les dossiers dupliqués
function detectDuplicatedFolders(rootDir) {
    const duplicates = {};
    const normalizedPaths = {};

    function scanDirectory(dir, depth = 0) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(dir, entry.name);
                const normalizedName = toKebabCase(entry.name);
                const relPath = path.relative(rootDir, fullPath);

                // Enregistrer le chemin normalisé pour détecter les doublons
                const key = path.join(path.dirname(relPath), normalizedName);

                if (!normalizedPaths[key]) {
                    normalizedPaths[key] = [fullPath];
                } else {
                    normalizedPaths[key].push(fullPath);

                    if (!duplicates[key]) {
                        duplicates[key] = normalizedPaths[key];
                    }
                }

                // Continuer à parcourir
                scanDirectory(fullPath, depth + 1);
            }
        }
    }

    scanDirectory(rootDir);
    return duplicates;
}

// Fonction principale
async function main() {
    console.log('Début de la normalisation de la structure du projet...');

    // 1. Normaliser les noms de dossiers
    console.log('\n=== NORMALISATION DES NOMS DE DOSSIERS ===');
    const folderMapping = {};

    if (fs.existsSync(PACKAGES_ROOT)) {
        normalizeFolderNames(PACKAGES_ROOT, folderMapping);
    }

    if (fs.existsSync(AGENTS_ROOT)) {
        normalizeFolderNames(AGENTS_ROOT, folderMapping);
    }

    // 2. Détecter les dossiers dupliqués
    console.log('\n=== DÉTECTION DES DOSSIERS DUPLIQUÉS ===');
    const duplicatesInPackages = fs.existsSync(PACKAGES_ROOT)
        ? detectDuplicatedFolders(PACKAGES_ROOT)
        : {};

    const duplicatesInAgents = fs.existsSync(AGENTS_ROOT)
        ? detectDuplicatedFolders(AGENTS_ROOT)
        : {};

    // Fusionner les résultats
    const allDuplicates = { ...duplicatesInPackages, ...duplicatesInAgents };

    // Afficher les dossiers dupliqués
    console.log(`Nombre total de groupes de dossiers dupliqués : ${Object.keys(allDuplicates).length}`);

    Object.entries(allDuplicates).forEach(([key, paths]) => {
        console.log(`\nDuplication pour '${key}':`);
        paths.forEach(p => console.log(`  - ${p}`));
    });

    // 3. Sauvegarder le mapping et les résultats
    const results = {
        normalizedFolders: folderMapping,
        duplicatedFolders: allDuplicates,
        timestamp: new Date().toISOString()
    };

    if (!DRY_RUN) {
        fs.writeFileSync(FOLDER_MAPPING_FILE, JSON.stringify(results, null, 2));
        console.log(`\nRésultats sauvegardés dans ${FOLDER_MAPPING_FILE}`);
    } else {
        console.log('\nMode simulation (dry-run) : aucune modification n\'a été effectuée');
    }

    console.log('\nPour exécuter les changements réels, relancez sans l\'option --dry-run');
}

// Exécuter le script
if (require.main === module) {
    main().catch(err => {
        console.error('Erreur lors de la normalisation :', err);
        process.exit(1);
    });
}