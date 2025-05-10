#!/usr/bin/env node

/**
 * Script simplifié pour générer une matrice de tests pour l'architecture à 3 couches
 * Ne dépend pas de NX pour fonctionner
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couches de l'architecture 
const LAYERS = ['business', 'coordination', 'orchestration'];

// Répertoire de sortie pour la matrice de tests
const OUTPUT_FILE = '.github/workflows/generated/test-matrix.json';

/**
 * Point d'entrée principal
 */
function main() {
    console.log('🧪 Génération de matrice de tests simplifiée pour l\'architecture à 3 couches...');

    try {
        // Trouver les répertoires de test dans chaque couche
        const testDirs = findTestDirectories();
        console.log(`Répertoires de test trouvés: ${testDirs.length}`);

        // Préparer la matrice de tests
        const testMatrix = {
            include: testDirs.map(dir => {
                const [layer, component] = extractLayerAndComponent(dir);
                return {
                    layer,
                    component,
                    testDir: dir,
                };
            })
        };

        // Prioriser la matrice (mettre les couches fondamentales en premier)
        prioritizeMatrix(testMatrix);

        // Écrire la matrice dans un fichier
        writeMatrix(testMatrix);

        console.log(`✅ Matrice de tests générée dans ${OUTPUT_FILE}`);
        console.log(`📊 Nombre total de jobs de test: ${testMatrix.include.length}`);

        // Afficher la matrice générée
        console.log(JSON.stringify(testMatrix, null, 2));

    } catch (error) {
        console.error('❌ Erreur lors de la génération de la matrice de tests:', error);
        process.exit(1);
    }
}

/**
 * Trouve les répertoires de test dans l'architecture à 3 couches
 */
function findTestDirectories() {
    const testDirs = [];

    // Chercher dans chaque couche
    for (const layer of LAYERS) {
        const layerPath = path.join(process.cwd(), 'packages', layer);

        // Vérifier si la couche existe
        if (!fs.existsSync(layerPath)) {
            console.warn(`⚠️ Couche "${layer}" non trouvée, ignorée`);
            continue;
        }

        // Chercher les dossiers 'tests', '__tests__', ou fichiers '*.test.ts'
        try {
            const result = execSync(
                `find ${layerPath} -type d -name "tests" -o -type d -name "__tests__" -o -type f -name "*.test.ts" -o -type f -name "*.spec.ts" | sort`,
                { encoding: 'utf8' }
            ).trim();

            if (result) {
                const dirs = result.split('\n').filter(Boolean);
                testDirs.push(...dirs);
            }
        } catch (e) {
            console.warn(`⚠️ Erreur lors de la recherche de tests dans ${layer}:`, e.message);
        }
    }

    return testDirs;
}

/**
 * Extrait la couche et le composant à partir d'un chemin de test
 */
function extractLayerAndComponent(testPath) {
    // Format typique: /workspaces/cahier-des-charge/packages/business/src/component/...
    const parts = testPath.split('/');
    const layerIndex = parts.findIndex(p => ['business', 'coordination', 'orchestration'].includes(p));

    if (layerIndex >= 0) {
        const layer = parts[layerIndex];

        // Essayer de trouver le composant (généralement après src/)
        const srcIndex = parts.findIndex((p, i) => i > layerIndex && p === 'src');
        const component = srcIndex >= 0 && parts.length > srcIndex + 1 ? parts[srcIndex + 1] : 'core';

        return [layer, component];
    }

    return ['unknown', 'unknown'];
}

/**
 * Priorise la matrice en fonction des couches
 */
function prioritizeMatrix(matrix) {
    // Ordre de priorité: business, coordination, orchestration
    const layerPriority = {
        'business': 0,
        'coordination': 1,
        'orchestration': 2,
        'unknown': 99
    };

    // Trier par priorité de couche
    matrix.include.sort((a, b) => {
        const priorityA = layerPriority[a.layer] || 99;
        const priorityB = layerPriority[b.layer] || 99;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Si même couche, trier par nom de composant
        return a.component.localeCompare(b.component);
    });
}

/**
 * Écrit la matrice de tests dans un fichier JSON
 */
function writeMatrix(matrix) {
    // Créer le répertoire de sortie si nécessaire
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Écrire la matrice dans le fichier
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(matrix, null, 2));
}

// Exécuter le script
main();
