#!/usr/bin/env node

/**
 * Script pour réorganiser les fichiers de documentation
 * 
 * Ce script crée la structure de dossiers et déplace les fichiers Markdown
 * selon la nouvelle architecture documentaire à six sections.
 * 
 * Usage:
 *   node reorganize-docs.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

// Analyse des arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Structure des dossiers à créer
const folders = [
    '0-core',
    '1-architecture',
    '2-migration',
    '3-orchestration',
    '4-nx-ci',
    '5-integration',
    '6-planning',
    '_archives',
    'diagrams'
];

// Règles de déplacement des fichiers
// Format: [regex pattern, destination folder]
const moveRules = [
    // Core
    [/^(style-guide|conventions).*/i, '0-core'],
    [/^typescript-conventions.*/i, '0-core/conventions'],
    [/^contributing.md$/i, '0-core'],
    [/^README.md$/i, '0-core'],

    // Architecture
    [/.*trois-couches.*/i, '1-architecture'],
    [/^architecture.*/i, '1-architecture'],
    [/^contrats-interfaces-couches.*/i, '1-architecture'],
    [/^bonnes-pratiques-agents.*/i, '1-architecture'],
    [/^structure.*/i, '1-architecture/architecture'],
    [/^agents\/overview.md$/i, '1-architecture/agents'],
    [/^agents\/specific-agents\/.*/i, '1-architecture/agents/specific'],

    // Migration
    [/^guide-migration.*/i, '2-migration'],
    [/^guide-restructuration.*/i, '2-migration'],
    [/^guide-correction.*/i, '2-migration'],
    [/^consolidation-report.*/i, '2-migration'],
    [/^package-rename-report.md$/i, '2-migration'],

    // Orchestration
    [/^orchestr.*/i, '3-orchestration'],
    [/^communication-equipe-migration.*/i, '3-orchestration'],
    [/^taskfile-migration-report.*/i, '3-orchestration'],
    [/^technical\/readme-orchestrateur.md$/i, '3-orchestration/technical'],
    [/^technical\/\d{2}-synchronisation-metier-technique.md$/i, '3-orchestration/technical'],

    // NX CI
    [/^nx-.*/i, '4-nx-ci'],

    // Integration
    [/^n8n-.*/i, '5-integration'],
    [/^workflow-consolidation.*/i, '5-integration'],
    [/^standards-bases-donnees.*/i, '5-integration'],
    [/^prisma-zod.*/i, '5-integration'],
    [/^typebox-.*/i, '5-integration'],
    [/^technologies-standards.*/i, '5-integration'],
    [/^preservation-urls.*/i, '5-integration'],
    [/^seo-redirects.*/i, '5-integration'],
    [/^standards\/temporal-workflow-standards.md$/i, '5-integration/standards'],
    [/^presentations\/standards-workflows-temporal.md$/i, '5-integration/presentations'],
    [/^project\/onboarding-presentation.md$/i, '0-core/project'],
    [/^fiche-technique.md$/i, '5-integration'],

    // Planning
    [/^planning\/.*/i, '6-planning'],
    [/^migration-plan.*/i, '6-planning'],
    [/^migration-strategy.*/i, '6-planning'],
    [/^todomcp.*/i, '6-planning'],
    [/^changelog.*/i, '6-planning'],

    // Archives (documents avec date 2025)
    [/^.*-2025.*/i, '_archives'],

    // Diagrams
    [/^diagrams\/.*/i, 'diagrams']
];

/**
 * Crée la nouvelle structure de dossiers
 */
function createFolderStructure() {
    console.log('Création de la structure de dossiers...');

    for (const folder of folders) {
        const folderPath = path.join(docsDir, folder);

        if (dryRun) {
            console.log(`[DRY RUN] Création du dossier: ${folderPath}`);
        } else {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`✓ Dossier créé: ${folder}`);
            } else {
                console.log(`✓ Dossier existant: ${folder}`);
            }
        }
    }
}

/**
 * Déplace les fichiers selon les règles définies
 */
function moveFiles() {
    console.log('\nDéplacement des fichiers selon les règles...');

    // Fonction récursive pour traiter tous les fichiers
    function processDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(docsDir, fullPath);

            if (entry.isDirectory()) {
                // Ne pas traiter les nouveaux dossiers qu'on vient de créer
                if (!folders.includes(entry.name)) {
                    processDirectory(fullPath);
                }
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                // Appliquer les règles pour déplacer le fichier
                let matched = false;

                for (const [pattern, destination] of moveRules) {
                    if (pattern.test(relativePath)) {
                        const destDir = path.join(docsDir, destination);
                        const destPath = path.join(destDir, entry.name);

                        if (dryRun) {
                            console.log(`[DRY RUN] Déplacement: ${relativePath} -> ${path.relative(docsDir, destPath)}`);
                            matched = true;
                            break;
                        }

                        // Créer le dossier destination s'il n'existe pas (pour les sous-dossiers)
                        if (!fs.existsSync(destDir)) {
                            fs.mkdirSync(destDir, { recursive: true });
                        }

                        // Ne pas déplacer si le fichier est déjà au bon endroit
                        if (path.dirname(fullPath) === destDir) {
                            console.log(`✓ Déjà au bon endroit: ${relativePath}`);
                        } else {
                            try {
                                // Vérifier si un fichier avec le même nom existe déjà
                                if (fs.existsSync(destPath)) {
                                    const uniqueName = `${path.parse(entry.name).name}-${Date.now()}${path.parse(entry.name).ext}`;
                                    console.log(`⚠️ Conflit de nom: ${entry.name} renommé en ${uniqueName}`);
                                    fs.renameSync(fullPath, path.join(destDir, uniqueName));
                                } else {
                                    fs.renameSync(fullPath, destPath);
                                }
                                console.log(`✓ Déplacé: ${relativePath} -> ${path.relative(docsDir, destPath)}`);
                            } catch (err) {
                                console.error(`❌ Erreur lors du déplacement de ${relativePath}: ${err.message}`);
                            }
                        }

                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    console.log(`⚠️ Aucune règle trouvée pour: ${relativePath}`);
                }
            }
        }
    }

    processDirectory(docsDir);
}

/**
 * Génère un fichier index JSON pour la documentation
 */
function generateDocsIndex() {
    console.log('\nGénération du fichier docs-index.json...');

    const indexData = [];

    // Fonction récursive pour scanner tous les fichiers
    function scanDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Ne pas scanner le dossier _archives
                if (entry.name !== '_archives') {
                    scanDirectory(fullPath);
                }
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                // Lire le contenu du fichier pour extraire le titre
                const content = fs.readFileSync(fullPath, 'utf8');
                const titleMatch = content.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : entry.name.replace('.md', '').replace(/-/g, ' ');

                // Déterminer la phase en fonction du dossier
                let phase = 'documentation';
                if (path.relative(docsDir, dir).startsWith('0-core')) phase = 'core';
                if (path.relative(docsDir, dir).startsWith('1-architecture')) phase = 'architecture';
                if (path.relative(docsDir, dir).startsWith('2-migration')) phase = 'migration';
                if (path.relative(docsDir, dir).startsWith('3-orchestration')) phase = 'orchestration';
                if (path.relative(docsDir, dir).startsWith('4-nx-ci')) phase = 'devops';
                if (path.relative(docsDir, dir).startsWith('5-integration')) phase = 'integration';
                if (path.relative(docsDir, dir).startsWith('6-planning')) phase = 'planning';

                indexData.push({
                    title,
                    path: path.relative(docsDir, fullPath),
                    phase,
                    status: 'stable'
                });
            }
        }
    }

    scanDirectory(docsDir);

    // Trier les entrées par chemin
    indexData.sort((a, b) => a.path.localeCompare(b.path));

    const indexPath = path.join(docsDir, 'docs-index.json');

    if (dryRun) {
        console.log(`[DRY RUN] Génération du fichier: ${indexPath}`);
        console.log(`[DRY RUN] Nombre d'entrées: ${indexData.length}`);
    } else {
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
        console.log(`✓ Index généré avec ${indexData.length} entrées: docs-index.json`);
    }
}

/**
 * Crée ou met à jour le fichier README.md principal
 */
function updateMainReadme() {
    console.log('\nMise à jour du README.md principal...');

    const readmePath = path.join(docsDir, 'README.md');
    const today = new Date().toISOString().split('T')[0];

    const readmeContent = `# Documentation du Projet

*Dernière mise à jour: ${today}*

Cette documentation est organisée selon une architecture à six sections pour faciliter la navigation et la maintenance.

## Structure

1. **Core (0-core/)**
   - Conventions de code, style guides et documentation fondamentale

2. **Architecture (1-architecture/)**
   - Architecture à trois couches, structures et bonnes pratiques

3. **Migration (2-migration/)**
   - Guides et rapports sur les processus de migration

4. **Orchestration (3-orchestration/)**
   - Documentation sur l'orchestrateur standardisé et les systèmes de coordination

5. **NX & CI/CD (4-nx-ci/)**
   - Configuration NX, pipelines CI/CD et automatisation

6. **Intégration (5-integration/)**
   - Standards d'intégration, migrations N8N, ORM et autres outils

7. **Planning (6-planning/)**
   - Planification, stratégie et suivi des tâches

## Utilisation

Cette documentation peut être consultée de plusieurs façons:
- Directement sur GitHub
- Importée dans Obsidian (via le fichier docs-index.json)
- Via le dashboard Remix Admin (en développement)

## Maintenance

Pour ajouter de nouveaux documents, placez-les dans le dossier approprié et exécutez:
\`\`\`bash
node tools/scripts/update-docs-index.js
\`\`\`

Pour identifier les documents similaires à fusionner:
\`\`\`bash
node tools/scripts/detect-similar-md.js
\`\`\`
`;

    if (dryRun) {
        console.log(`[DRY RUN] Mise à jour du fichier: ${readmePath}`);
    } else {
        fs.writeFileSync(readmePath, readmeContent, 'utf8');
        console.log(`✓ README.md mis à jour`);
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('=== RÉORGANISATION DE LA DOCUMENTATION ===\n');

    if (dryRun) {
        console.log('Mode simulation (dry run) activé. Aucune modification ne sera effectuée.\n');
    }

    createFolderStructure();
    moveFiles();
    generateDocsIndex();
    updateMainReadme();

    console.log('\nRéorganisation de la documentation terminée.');

    if (dryRun) {
        console.log('\nPour appliquer ces changements, exécutez la commande sans --dry-run:');
        console.log('node tools/scripts/reorganize-docs.js');
    }
}

main().catch(error => {
    console.error(`\n❌ Erreur: ${error.message}`);
    process.exit(1);
});
