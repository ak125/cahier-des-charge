#!/usr/bin/env node

/**
 * Script de préparation de l'environnement pour la consolidation
 * 
 * Ce script prépare l'environnement pour la consolidation des agents
 * en créant les dossiers cibles et en copiant les interfaces de base.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Structure à trois couches
const layerStructure = {
    'orchestration': [
        'core',
        'monitors',
        'schedulers',
        'adapters'
    ],
    'coordination': [
        'core',
        'bridges',
        'registries',
        'adapters'
    ],
    'business': [
        'core',
        'analyzers',
        'generators',
        'validators'
    ]
};

/**
 * Vérifie si un dossier existe, sinon le crée
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Création du dossier: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
        return true;
    }
    return false;
}

/**
 * Copie un fichier source vers une destination si la destination n'existe pas
 * ou si elle est vide
 */
function copyIfNotExists(sourcePath, destPath) {
    if (!fs.existsSync(sourcePath)) {
        console.log(`  [AVERTISSEMENT] Le fichier source n'existe pas: ${sourcePath}`);
        return false;
    }

    const destDir = path.dirname(destPath);
    ensureDirectoryExists(destDir);

    // Si le fichier de destination existe mais est vide, nous le remplaçons
    if (fs.existsSync(destPath)) {
        const destContent = fs.readFileSync(destPath, 'utf-8');
        if (destContent.trim().length > 0) {
            console.log(`  [INFO] Le fichier de destination existe déjà et n'est pas vide: ${destPath}`);
            return false;
        }
    }

    // Copier le contenu du fichier source vers le fichier destination
    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  [SUCCÈS] Fichier copié: ${sourcePath} -> ${destPath}`);
        return true;
    } catch (err) {
        console.error(`  [ERREUR] Impossible de copier le fichier: ${err.message}`);
        return false;
    }
}

/**
 * Prépare la structure des dossiers pour les trois couches
 */
function prepareLayeredStructure() {
    console.log('Préparation de la structure à trois couches...');

    Object.entries(layerStructure).forEach(([layer, subdirectories]) => {
        const layerDir = path.join(projectRoot, 'packages', layer);
        ensureDirectoryExists(layerDir);

        subdirectories.forEach(subdir => {
            const fullPath = path.join(layerDir, subdir);
            if (ensureDirectoryExists(fullPath)) {
                console.log(`  Dossier créé: ${fullPath}`);
            } else {
                console.log(`  Dossier existant: ${fullPath}`);
            }
        });
    });
}

/**
 * Copie les interfaces de base des agents depuis le dossier 'core'
 */
function copyBaseInterfaces() {
    console.log('\nCopie des interfaces de base...');

    // Interfaces d'orchestration
    const orchestrationInterfaces = [
        { name: 'monitor-agent.ts', source: 'orchestration', target: 'orchestration/core' },
        { name: 'scheduler-agent.ts', source: 'orchestration', target: 'orchestration/core' },
        { name: 'orchestration-agent.ts', source: 'orchestration', target: 'orchestration/core' },
        { name: 'orchestrator-agent.ts', source: 'orchestration', target: 'orchestration/core' }
    ];

    // Interfaces de coordination
    const coordinationInterfaces = [
        { name: 'coordination-agent.ts', source: 'coordination', target: 'coordination/core' },
        { name: 'registry-agent.ts', source: 'coordination', target: 'coordination/core' },
        { name: 'bridge-agent.ts', source: 'coordination', target: 'coordination/core' }
    ];

    // Interfaces business
    const businessInterfaces = [
        { name: 'business-agent.ts', source: 'business', target: 'business/core' },
        { name: 'analyzer-agent.ts', source: 'business', target: 'business/core' },
        { name: 'generator-agent.ts', source: 'business', target: 'business/core' },
        { name: 'validator-agent.ts', source: 'business', target: 'business/core' }
    ];

    const allInterfaces = [...orchestrationInterfaces, ...coordinationInterfaces, ...businessInterfaces];

    let copiedCount = 0;

    for (const iface of allInterfaces) {
        const sourcePath = path.join(projectRoot, 'packages/core/interfaces', iface.source, iface.name);
        const destPath = path.join(projectRoot, 'packages', iface.target, iface.name);

        // Vérifier si le fichier interface existe dans le dossier core
        if (fs.existsSync(sourcePath)) {
            if (copyIfNotExists(sourcePath, destPath)) {
                copiedCount++;
            }
        } else {
            // Si l'interface n'existe pas dans core, cherchons dans packages/migrated-agents
            const migratedPath = path.join(projectRoot, 'packages/migrated-agents', iface.source, iface.name);

            if (fs.existsSync(migratedPath)) {
                if (copyIfNotExists(migratedPath, destPath)) {
                    copiedCount++;
                }
            } else {
                console.log(`  [AVERTISSEMENT] Interface non trouvée: ${iface.name}`);
            }
        }
    }

    console.log(`\nTotal des interfaces copiées: ${copiedCount}`);
}

/**
 * Fonction principale pour préparer l'environnement
 */
async function prepareEnvironment() {
    console.log('=== Préparation de l\'environnement pour la consolidation des agents ===');

    try {
        // Créer une sauvegarde avant de commencer
        const backupDir = `backup/consolidation-prep-${new Date().toISOString().replace(/:/g, '').split('.')[0]}`;
        console.log(`Création d'une sauvegarde dans ${backupDir}...`);
        ensureDirectoryExists(path.join(projectRoot, backupDir));

        // Sauvegarde des dossiers clés
        for (const folder of ['packages']) {
            execSync(`cp -r ${path.join(projectRoot, folder)} ${path.join(projectRoot, backupDir)}/ 2>/dev/null || true`);
        }
        console.log(`Sauvegarde créée avec succès.`);
    } catch (err) {
        console.warn(`Avertissement: Impossible de créer une sauvegarde: ${err.message}`);
        // Continuer malgré l'erreur de sauvegarde
    }

    // Étape 1: Préparer la structure des dossiers
    prepareLayeredStructure();

    // Étape 2: Copier les interfaces de base
    copyBaseInterfaces();

    console.log('\n=== Préparation terminée ===');
    console.log('Vous pouvez maintenant exécuter le script de consolidation des agents:');
    console.log('node tools/scripts/consolidate-duplicated-agents.js --dry-run');
}

// Lancer la préparation
prepareEnvironment().catch(err => {
    console.error('Erreur lors de la préparation de l\'environnement:', err);
    process.exit(1);
});
