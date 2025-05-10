#!/usr/bin/env node

/**
 * Script qui vérifie que tous les workflows GitHub Actions sont compatibles
 * avec la nouvelle structure en 3 couches (business, coordination, orchestration)
 * Version améliorée avec des règles plus précises et vérification de contenu
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const workflowsDir = path.join(process.cwd(), '.github/workflows');
const files = fs.readdirSync(workflowsDir).filter(file => file.endsWith('.yml'));

// Constantes
const OLD_PATHS = [
    'packages/agents/',
    'packages/orchestrators/',
    'packages/mcp-agents/',
    'orchestrators/',
    '/agents/',
    '"agents/',
    "'agents/"
];

const NEW_PATHS = [
    'packages/business/',
    'packages/coordination/',
    'packages/orchestration/'
];

console.log(`Vérification précise de ${files.length} fichiers de workflow...`);

// Pour chaque fichier de workflow
files.forEach(file => {
    const filePath = path.join(workflowsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Analyser les sections "paths" du fichier
    const pathsSections = content.match(/paths:[^-]*((?:-[^\n]*\n)+)/g);

    if (!pathsSections) {
        console.log(`ℹ️ ${file} - Ne contient pas de section paths (non pertinent)`);
        return;
    }

    let usesOldPaths = false;
    let usesNewPaths = false;
    let inconsistencies = [];

    // Pour chaque section paths dans le workflow
    pathsSections.forEach(section => {
        const oldPathsInSection = OLD_PATHS.filter(oldPath => section.includes(oldPath));
        const newPathsInSection = NEW_PATHS.filter(newPath => section.includes(newPath));

        if (oldPathsInSection.length > 0) {
            usesOldPaths = true;

            // Si ce chemin spécifique d'agent est utilisé sans les nouveaux chemins
            if (oldPathsInSection.some(p => p.includes('agents/')) &&
                !newPathsInSection.some(p => p.includes('business') || p.includes('coordination') || p.includes('orchestration'))) {
                inconsistencies.push(`Section paths utilise les anciens chemins d'agents sans les nouveaux: ${oldPathsInSection.join(', ')}`);
            }
        }

        if (newPathsInSection.length > 0) {
            usesNewPaths = true;

            // Pour chaque couche de la nouvelle architecture utilisée, vérifions si les autres sont présentes
            if (newPathsInSection.includes('packages/business/') &&
                (!newPathsInSection.includes('packages/coordination/') || !newPathsInSection.includes('packages/orchestration/'))) {
                inconsistencies.push(`Section utilise packages/business/ mais pas toutes les autres couches`);
            }
        }
    });

    // Output du résultat
    if (inconsistencies.length > 0) {
        console.log(`❌ ${file} - Problèmes détectés:`);
        inconsistencies.forEach(issue => console.log(`   - ${issue}`));
    } else if (usesOldPaths && usesNewPaths) {
        console.log(`✅ ${file} - Contient à la fois d'anciens et de nouveaux chemins (transition correcte)`);
    } else if (usesOldPaths) {
        console.log(`⚠️ ${file} - Utilise uniquement d'anciens chemins, à mettre à jour`);
    } else if (usesNewPaths) {
        console.log(`✅ ${file} - Utilise les nouveaux chemins (structure en 3 couches)`);
    } else {
        console.log(`ℹ️ ${file} - Ne contient aucun chemin spécifique à l'architecture (non pertinent)`);
    }
});

console.log('\nAnalyse terminée. Vérifiez les fichiers marqués en ❌ ou ⚠️.');
