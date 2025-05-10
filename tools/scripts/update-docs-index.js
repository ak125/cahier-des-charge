#!/usr/bin/env node

/**
 * Script pour mettre à jour l'index de la documentation
 * 
 * Ce script analyse tous les fichiers Markdown de la documentation
 * et génère un index au format JSON pour faciliter l'intégration
 * avec des outils comme Obsidian ou un dashboard Remix.
 * 
 * Usage:
 *   node update-docs-index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

/**
 * Extrait les métadonnées YAML frontmatter d'un fichier Markdown
 */
function extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);

    if (match && match[1]) {
        const frontmatter = {};
        const lines = match[1].split('\n');

        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                // Nettoyer les guillemets et espaces
                let value = valueParts.join(':').trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }

                // Gérer les tableaux
                if (value.startsWith('[') && value.endsWith(']')) {
                    try {
                        frontmatter[key.trim()] = JSON.parse(value.replace(/'/g, '"'));
                    } catch (e) {
                        frontmatter[key.trim()] = value;
                    }
                } else {
                    frontmatter[key.trim()] = value;
                }
            }
        }

        return { frontmatter, content: content.replace(frontmatterRegex, '') };
    }

    return { frontmatter: null, content };
}

/**
 * Extrait le titre d'un fichier Markdown
 */
function extractTitle(content) {
    // Chercher le premier titre H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : null;
}

/**
 * Analyse les fichiers Markdown dans le dossier docs/
 */
function analyzeDocs() {
    console.log('Analyse des fichiers Markdown dans docs/...');

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
                try {
                    // Lire le contenu du fichier
                    const rawContent = fs.readFileSync(fullPath, 'utf8');
                    const { frontmatter, content } = extractFrontmatter(rawContent);

                    // Extraire des informations
                    let title = frontmatter?.title;
                    if (!title) {
                        title = extractTitle(content);
                    }
                    if (!title) {
                        title = entry.name.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }

                    // Déterminer le module et le statut
                    let phase = frontmatter?.module || 'documentation';
                    if (!frontmatter?.module) {
                        // Déterminer la phase en fonction du dossier
                        if (path.relative(docsDir, dir).startsWith('0-core')) phase = 'core';
                        if (path.relative(docsDir, dir).startsWith('1-architecture')) phase = 'architecture';
                        if (path.relative(docsDir, dir).startsWith('2-migration')) phase = 'migration';
                        if (path.relative(docsDir, dir).startsWith('3-orchestration')) phase = 'orchestration';
                        if (path.relative(docsDir, dir).startsWith('4-nx-ci')) phase = 'devops';
                        if (path.relative(docsDir, dir).startsWith('5-integration')) phase = 'integration';
                        if (path.relative(docsDir, dir).startsWith('6-planning')) phase = 'planning';
                    }

                    const status = frontmatter?.status || 'stable';
                    const slug = frontmatter?.slug || path.basename(entry.name, '.md');

                    // Ajouter au tableau d'index
                    indexData.push({
                        title,
                        path: path.relative(docsDir, fullPath),
                        phase,
                        status,
                        slug,
                        from: frontmatter?.from || null,
                        lastReviewed: frontmatter?.lastReviewed || new Date().toISOString().split('T')[0]
                    });
                } catch (error) {
                    console.error(`Erreur lors de l'analyse de ${fullPath}: ${error.message}`);
                }
            }
        }
    }

    scanDirectory(docsDir);

    // Trier les entrées par chemin
    indexData.sort((a, b) => a.path.localeCompare(b.path));

    return indexData;
}

/**
 * Génère le fichier d'index JSON
 */
function generateIndex() {
    const indexData = analyzeDocs();
    const indexPath = path.join(docsDir, 'docs-index.json');

    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    console.log(`✅ Index généré avec ${indexData.length} entrées: docs-index.json`);

    // Générer aussi un rapport Markdown
    const reportPath = path.join(docsDir, 'documentation-report.md');
    let report = `# Rapport de la Documentation\n\n`;
    report += `*Généré le ${new Date().toISOString().split('T')[0]}*\n\n`;
    report += `## Résumé\n\n`;
    report += `- Nombre total de documents: ${indexData.length}\n`;

    // Compter par phase
    const phaseCount = {};
    for (const item of indexData) {
        phaseCount[item.phase] = (phaseCount[item.phase] || 0) + 1;
    }

    report += `\n## Répartition par section\n\n`;
    for (const [phase, count] of Object.entries(phaseCount)) {
        report += `- **${phase}**: ${count} document(s)\n`;
    }

    report += `\n## Documents par section\n\n`;
    const groupedByPhase = {};
    for (const item of indexData) {
        if (!groupedByPhase[item.phase]) {
            groupedByPhase[item.phase] = [];
        }
        groupedByPhase[item.phase].push(item);
    }

    for (const [phase, items] of Object.entries(groupedByPhase)) {
        report += `### ${phase}\n\n`;
        for (const item of items) {
            report += `- **[${item.title}](${item.path})** _(${item.status})_\n`;
        }
        report += '\n';
    }

    report += `## Documents fusionnés\n\n`;
    const mergedDocs = indexData.filter(item => item.from && item.from.length > 0);
    if (mergedDocs.length > 0) {
        for (const doc of mergedDocs) {
            report += `- **[${doc.title}](${doc.path})** - Fusion de: ${doc.from.join(', ')}\n`;
        }
    } else {
        report += `Aucun document fusionné pour l'instant.\n`;
    }

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`✅ Rapport généré: documentation-report.md`);
}

/**
 * Fonction principale
 */
function main() {
    console.log('=== MISE À JOUR DE L\'INDEX DE DOCUMENTATION ===\n');
    generateIndex();
}

main();
