#!/usr/bin/env node

/**
 * Script simplifié pour mettre à jour les références aux technologies dépréciées
 * 
 * Ce script corrige les références à n8n dans les fichiers identifiés
 * par l'analyse de cohérence technologique.
 */

import fs from 'fs';
import path from 'path';

// Fichiers à corriger (identifiés précédemment)
const filesToUpdate = [
    'docs/0-core/project/onboarding-presentation.md',
    'docs/5-integration/workflow-consolidation-report.md',
    'docs/README.md',
    'docs/documentation-report.md'
];

// Note standard à ajouter pour n8n
const n8nDeprecationNote =
    `> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document \`technologies-standards.md\`. 
> Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) 
> ou Temporal.io (pour les workflows complexes).`;

/**
 * Met à jour un fichier avec la note de dépréciation
 */
function updateFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`Le fichier ${filePath} n'existe pas.`);
            return false;
        }

        const content = fs.readFileSync(filePath, 'utf8');

        // Vérifier si la note existe déjà
        if (content.includes('n8n est désormais dépréciée')) {
            console.log(`⏭️ Le fichier ${filePath} contient déjà une note de dépréciation.`);
            return false;
        }

        // Trouver le bon endroit pour insérer la note
        let updatedContent;

        // Chercher le premier titre H1
        const h1Match = content.match(/^#\s+(.*?)$/m);

        if (h1Match) {
            // Insérer après le titre H1
            const h1EndPos = h1Match.index + h1Match[0].length;
            updatedContent =
                content.substring(0, h1EndPos) +
                '\n\n' + n8nDeprecationNote + '\n' +
                content.substring(h1EndPos);
        } else {
            // Insérer au début du document
            updatedContent = n8nDeprecationNote + '\n\n' + content;
        }

        // Écrire le contenu mis à jour
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`✅ Mise à jour des références à n8n dans ${filePath}`);
        return true;

    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de ${filePath}: ${error.message}`);
        return false;
    }
}

console.log('=== MISE À JOUR DES RÉFÉRENCES AUX TECHNOLOGIES DÉPRÉCIÉES ===\n');

let updatedCount = 0;
for (const relativePath of filesToUpdate) {
    const filePath = path.join(process.cwd(), relativePath);
    if (updateFile(filePath)) {
        updatedCount++;
    }
}

console.log(`\n== Résumé ==`);
console.log(`Fichiers mis à jour: ${updatedCount}/${filesToUpdate.length}`);

if (updatedCount > 0) {
    console.log(`\n✅ Mises à jour terminées.`);
} else {
    console.log(`\n✅ Aucune mise à jour nécessaire.`);
}
