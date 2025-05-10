#!/usr/bin/env node

/**
 * Script pour corriger les liens dans le README principal
 * 
 * Ce script corrige les liens dans le README.md principal qui pointent vers des fichiers README inexistants.
 * 
 * Usage:
 *   node fix-readme-links.js
 */

import fs from 'fs';
import path from 'path';

const readmePath = '/workspaces/cahier-des-charge/docs/README.md';

try {
    // Lire le contenu actuel du README
    const content = fs.readFileSync(readmePath, 'utf8');

    // Remplacer les liens cassés
    let updatedContent = content
        // Remplacer les liens vers les READMEs
        .replace(/\*\*\[Core \(0-core\/\)\]\(0-core\/README\.md\)\*\*/g, '**[Core (0-core)](0-core)**')
        .replace(/\*\*\[Architecture \(1-architecture\/\)\]\(1-architecture\/README\.md\)\*\*/g, '**[Architecture (1-architecture)](1-architecture)**')
        .replace(/\*\*\[Migration \(2-migration\/\)\]\(2-migration\/README\.md\)\*\*/g, '**[Migration (2-migration)](2-migration)**')
        .replace(/\*\*\[Orchestration \(3-orchestration\/\)\]\(3-orchestration\/README\.md\)\*\*/g, '**[Orchestration (3-orchestration)](3-orchestration)**')
        .replace(/\*\*\[NX & CI\/CD \(4-nx-ci\/\)\]\(4-nx-ci\/README\.md\)\*\*/g, '**[NX & CI/CD (4-nx-ci)](4-nx-ci)**')
        .replace(/\*\*\[Intégration \(5-integration\/\)\]\(5-integration\/README\.md\)\*\*/g, '**[Intégration (5-integration)](5-integration)**')
        .replace(/\*\*\[Planning \(6-planning\/\)\]\(6-planning\/README\.md\)\*\*/g, '**[Planning (6-planning)](6-planning)**')
        // Remplacer le lien vers les archives
        .replace(/\[`_archives\/`\]\(_archives\/README\.md\)/g, '[`_archives/`](_archives/)');

    // Écrire le contenu modifié
    fs.writeFileSync(readmePath, updatedContent, 'utf8');
    console.log('✅ Liens du README principal corrigés avec succès.');
} catch (error) {
    console.error(`❌ Erreur lors de la correction des liens du README: ${error.message}`);
}
