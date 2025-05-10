#!/usr/bin/env node

/**
 * Script qui vérifie que tous les workflows GitHub Actions sont compatibles
 * avec la nouvelle structure en 3 couches (business, coordination, orchestration)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflowsDir = path.join(process.cwd(), '.github/workflows');
const files = fs.readdirSync(workflowsDir).filter(file => file.endsWith('.yml'));

console.log(`Vérification de ${files.length} fichiers de workflow...`);

const oldPaths = [
    'packages/agents',
    'packages/orchestrators',
    'packages/mcp-agents',
    'orchestrators/',
    'agents/'
];

const newPaths = [
    'packages/business',
    'packages/coordination',
    'packages/orchestration'
];

const results = {
    needsUpdate: [],
    upToDate: [],
    potentialIssues: []
};

for (const file of files) {
    const filePath = path.join(workflowsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Vérifier si le fichier contient des anciens chemins
    const hasOldPaths = oldPaths.some(oldPath => content.includes(oldPath));

    // Vérifier si le fichier contient déjà les nouveaux chemins
    const hasNewPaths = newPaths.some(newPath => content.includes(newPath));

    if (hasOldPaths && !hasNewPaths) {
        results.needsUpdate.push(file);
        console.log(`❌ ${file} - Utilise d'anciens chemins sans les nouveaux chemins`);
    } else if (hasNewPaths && hasOldPaths) {
        results.potentialIssues.push(file);
        console.log(`⚠️ ${file} - Contient à la fois d'anciens et de nouveaux chemins (vérification manuelle nécessaire)`);
    } else if (hasNewPaths) {
        results.upToDate.push(file);
        console.log(`✅ ${file} - Utilise déjà les nouveaux chemins`);
    } else {
        // Le fichier ne contient ni anciens ni nouveaux chemins, il est peut-être non pertinent
        console.log(`ℹ️ ${file} - Ne contient aucun chemin pertinent pour l'architecture en couches`);
    }
}

console.log('\nRésumé:');
console.log(`- Fichiers à mettre à jour: ${results.needsUpdate.length}`);
console.log(`- Fichiers déjà à jour: ${results.upToDate.length}`);
console.log(`- Fichiers avec conflits potentiels: ${results.potentialIssues.length}`);

if (results.needsUpdate.length > 0) {
    console.log('\nLes fichiers suivants nécessitent une mise à jour:');
    results.needsUpdate.forEach(file => console.log(`- ${file}`));
}

if (results.potentialIssues.length > 0) {
    console.log('\nLes fichiers suivants contiennent à la fois d\'anciens et de nouveaux chemins:');
    results.potentialIssues.forEach(file => console.log(`- ${file}`));
}
