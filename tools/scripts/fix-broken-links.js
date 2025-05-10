#!/usr/bin/env node

/**
 * Script pour corriger les liens cassés dans la documentation
 * 
 * Ce script corrige les liens cassés identifiés par check-links.js
 * en utilisant des mappings de correction prédéfinis.
 * 
 * Usage:
 *   node fix-broken-links.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

// Analyse des arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Mappings de correction pour les liens cassés
// Format: 'lien cassé' => 'lien correct'
const LINK_CORRECTIONS = {
    // Liens vers les technologies standards
    'standards-bases-donnees-orm': '../5-integration/standards-bases-donnees-orm',
    'technologies-standards': '../5-integration/technologies-standards',
    'agents/specific-agents/data-migration-strategy': '../1-architecture/agents/specific/data-migration-strategy',
    'prisma-zod-integration': '../5-integration/prisma-zod-integration',

    // Liens vers les guides
    'orchestrateur-standardise-guide.md': '../3-orchestration/orchestrateur-standardise-guide.md',
    '/docs/technologies-standards.md': '../5-integration/technologies-standards.md',
    '/docs/workflow-consolidation-guide.md': '../5-integration/workflow-consolidation-guide.md',
    '/docs/standards/temporal-workflow-standards.md': '../5-integration/standards/temporal-workflow-standards.md',
    '/docs/orchestrateur-standardise-guide.md': '../3-orchestration/orchestrateur-standardise-guide.md',

    // Liens vers les documents d'architecture
    '../static/img/architecture-trois-couches.png': '../../static/img/architecture-trois-couches.png',

    // Liens vers les guides NX
    'docs/nx-usage-guide.md': '../4-nx-ci/nx-usage-guide.md',

    // Correction des liens de section dans README
    '0-core/': '0-core/README.md',
    '1-architecture/': '1-architecture/README.md',
    '2-migration/': '2-migration/README.md',
    '3-orchestration/': '3-orchestration/README.md',
    '4-nx-ci/': '4-nx-ci/README.md',
    '5-integration/': '5-integration/README.md',
    '6-planning/': '6-planning/README.md',
    '_archives/': '_archives/README.md'
};

/**
 * Corrige les liens cassés dans un fichier
 */
function fixBrokenLinks(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changesCount = 0;

        // Pour chaque mapping de correction
        for (const [brokenLink, correctedLink] of Object.entries(LINK_CORRECTIONS)) {
            // Rechercher le lien cassé dans le document
            // Attention: le lien peut être entouré de parenthèses dans une syntaxe Markdown
            const linkPattern = new RegExp(`\\[([^\\]]+)\\]\\(${brokenLink.replace(/\//g, '\\/')}(\\)|\\.md\\))`, 'g');

            // Remplacer par le lien corrigé
            const corrected = content.replace(linkPattern, (match, text, suffix) => {
                changesCount++;
                // Si le lien corrigé se termine par .md ou le suffix est .md), adapter en conséquence
                if (correctedLink.endsWith('.md') || suffix === '.md)') {
                    return `[${text}](${correctedLink})`;
                }
                return `[${text}](${correctedLink}${suffix === ')' ? '' : suffix})`;
            });

            if (content !== corrected) {
                content = corrected;
            }
        }

        // Si des changements ont été effectués, enregistrer le fichier
        if (changesCount > 0) {
            if (!dryRun) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
            console.log(`${dryRun ? '[DRY RUN] ' : ''}✅ ${changesCount} lien(s) corrigé(s) dans ${path.relative(docsDir, filePath)}`);
            return changesCount;
        }

        return 0;
    } catch (error) {
        console.error(`❌ Erreur lors de la correction de ${filePath}: ${error.message}`);
        return 0;
    }
}

/**
 * Parcourt récursivement un dossier pour corriger tous les fichiers Markdown
 */
function processDirectory(dir) {
    const results = {
        filesProcessed: 0,
        linksFixed: 0
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Ne pas traiter les archives
            if (path.basename(filePath) !== '_archives') {
                const subResults = processDirectory(filePath);
                results.filesProcessed += subResults.filesProcessed;
                results.linksFixed += subResults.linksFixed;
            }
        } else if (file.endsWith('.md')) {
            results.filesProcessed++;
            results.linksFixed += fixBrokenLinks(filePath);
        }
    }

    return results;
}

/**
 * Fonction principale
 */
function main() {
    console.log('=== CORRECTION DES LIENS CASSÉS DANS LA DOCUMENTATION ===\n');

    if (dryRun) {
        console.log('Mode simulation (dry run) activé. Aucune modification ne sera effectuée.\n');
    }

    const results = processDirectory(docsDir);

    console.log(`\n== Résumé ==`);
    console.log(`Fichiers traités: ${results.filesProcessed}`);
    console.log(`Liens corrigés: ${results.linksFixed}`);

    if (results.linksFixed > 0) {
        console.log(`\n✅ Correction des liens terminée.`);
    } else {
        console.log(`\n✅ Aucun lien à corriger.`);
    }
}

// Exécuter le script
main();
