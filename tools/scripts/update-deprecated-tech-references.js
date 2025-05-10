#!/usr/bin/env node

/**
 * Script pour mettre à jour les références aux technologies dépréciées
 * 
 * Ce script parcourt tous les documents Markdown et ajoute des notes 
 * concernant les technologies dépréciées lorsqu'elles sont mentionnées
 * sans mention des alternatives recommandées.
 * 
 * Usage:
 *   node update-deprecated-tech-references.js [--dry-run]
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

// Technologies dépréciées et leurs alternatives
const DEPRECATED_TECHNOLOGIES = {
    'n8n': {
        alternatives: ['Temporal.io', 'BullMQ'],
        note: '> **Note importante** : L\'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) ou Temporal.io (pour les workflows complexes).'
    },
    'mongodb': {
        alternatives: ['PostgreSQL'],
        note: '> **Note importante** : L\'utilisation de MongoDB est désormais dépréciée conformément au document `standards-bases-donnees-orm.md`. La base de données recommandée est PostgreSQL.'
    },
    'joi': {
        alternatives: ['Zod', 'TypeBox'],
        note: '> **Note importante** : L\'utilisation de Joi est désormais dépréciée. Les standards recommandés pour la validation sont Zod et TypeBox.'
    },
    'class-validator': {
        alternatives: ['Zod', 'TypeBox'],
        note: '> **Note importante** : L\'utilisation de class-validator est désormais dépréciée. Les standards recommandés pour la validation sont Zod et TypeBox.'
    },
    'koa': {
        alternatives: ['Fastify'],
        note: '> **Note importante** : L\'utilisation de Koa est désormais dépréciée. Le framework recommandé est Fastify pour les nouveaux projets.'
    }
};

/**
 * Extrait les frontmatter YAML d'un document Markdown
 */
function extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);

    if (match) {
        return {
            exists: true,
            content: match[0],
            endPos: match[0].length
        };
    }

    return { exists: false };
}

/**
 * Vérifie si un document mentionne des technologies dépréciées et leurs alternatives
 */
function checkDeprecatedTechnologies(content) {
    const results = {
        needsUpdate: false,
        updatedContent: content,
        technologies: []
    };

    // Vérifier chaque technologie dépréciée
    for (const [tech, info] of Object.entries(DEPRECATED_TECHNOLOGIES)) {
        // Regex pour vérifier si la technologie est mentionnée (insensible à la casse)
        const techRegex = new RegExp(`\\b${tech}\\b`, 'i');

        if (techRegex.test(content)) {
            // Vérifier si le document mentionne déjà que la technologie est dépréciée
            const deprecatedRegex = new RegExp(`\\b${tech}\\b.*\\b(d[ée]pr[ée]ci[ée]|obsol[èe]te)\\b`, 'i');
            const hasDeprecationNote = deprecatedRegex.test(content);

            // Vérifier si le document mentionne déjà les alternatives
            const alternativesMentioned = info.alternatives.every(alt => {
                const altRegex = new RegExp(`\\b${alt}\\b`, 'i');
                return altRegex.test(content);
            });

            // Si la technologie est mentionnée sans avertissement ni alternatives
            if (!hasDeprecationNote || !alternativesMentioned) {
                results.technologies.push(tech);
                results.needsUpdate = true;

                // Si le document ne contient pas déjà la note d'avertissement
                if (!content.includes(info.note)) {
                    // Extraire le frontmatter
                    const frontmatter = extractFrontmatter(content);

                    // Déterminer où insérer la note 
                    // Si le document contient un titre h1, insérer après
                    const h1Match = content.match(/^#\s+(.*?)$/m);

                    if (h1Match) {
                        const h1EndPos = h1Match.index + h1Match[0].length;
                        const contentBefore = content.substring(0, h1EndPos);
                        const contentAfter = content.substring(h1EndPos);

                        results.updatedContent = contentBefore + '\n\n' + info.note + '\n' + contentAfter;
                    } else if (frontmatter.exists) {
                        // Si pas de h1 mais il y a un frontmatter, insérer après le frontmatter
                        const contentBefore = content.substring(0, frontmatter.endPos);
                        const contentAfter = content.substring(frontmatter.endPos);

                        results.updatedContent = contentBefore + '\n' + info.note + '\n' + contentAfter;
                    } else {
                        // Sinon, insérer au début du document
                        results.updatedContent = info.note + '\n\n' + content;
                    }
                }
            }
        }
    }

    return results;
}

/**
 * Parcourt récursivement un dossier pour traiter tous les fichiers Markdown
 */
function processDirectory(dir) {
    const results = {
        filesChecked: 0,
        filesUpdated: 0,
        technologiesFound: {}
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Ne pas traiter les archives
            if (path.basename(filePath) !== '_archives') {
                const subResults = processDirectory(filePath);
                results.filesChecked += subResults.filesChecked;
                results.filesUpdated += subResults.filesUpdated;

                // Fusionner les technologies trouvées
                for (const [tech, files] of Object.entries(subResults.technologiesFound)) {
                    if (!results.technologiesFound[tech]) {
                        results.technologiesFound[tech] = [];
                    }
                    results.technologiesFound[tech] = results.technologiesFound[tech].concat(files);
                }
            }
        } else if (file.endsWith('.md')) {
            results.filesChecked++;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const { needsUpdate, updatedContent, technologies } = checkDeprecatedTechnologies(content);

                if (needsUpdate) {
                    // Enregistrer quels fichiers mentionnent chaque technologie
                    technologies.forEach(tech => {
                        if (!results.technologiesFound[tech]) {
                            results.technologiesFound[tech] = [];
                        }
                        results.technologiesFound[tech].push(path.relative(docsDir, filePath));
                    });

                    if (dryRun) {
                        console.log(`[DRY RUN] Mise à jour nécessaire pour ${filePath}: technologies dépréciées: ${technologies.join(', ')}`);
                    } else {
                        fs.writeFileSync(filePath, updatedContent, 'utf8');
                        results.filesUpdated++;
                        console.log(`✅ Mise à jour des références aux technologies dépréciées dans ${path.relative(docsDir, filePath)}`);
                    }
                }
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de ${filePath}: ${error.message}`);
            }
        }
    }

    return results;
}

/**
 * Fonction principale
 */
function main() {
    console.log('=== MISE À JOUR DES RÉFÉRENCES AUX TECHNOLOGIES DÉPRÉCIÉES ===\n');

    if (dryRun) {
        console.log('Mode simulation (dry run) activé. Aucune modification ne sera effectuée.\n');
    }

    try {
        console.log(`Vérification du dossier: ${docsDir}`);
        if (!fs.existsSync(docsDir)) {
            console.error(`Le dossier ${docsDir} n'existe pas!`);
            return;
        }

        const results = processDirectory(docsDir);

        console.log(`\n== Résumé ==`);
        console.log(`Fichiers analysés: ${results.filesChecked}`);
        console.log(`Fichiers mis à jour: ${results.filesUpdated}`);

        console.log(`\nTechnologies dépréciées détectées:`);
        for (const [tech, files] of Object.entries(results.technologiesFound)) {
            console.log(`- ${tech}: ${files.length} fichier(s)`);
            files.forEach(file => console.log(`  - ${file}`));
        }

        if (results.filesUpdated === 0) {
            console.log(`\n✅ Aucune mise à jour nécessaire.`);
        } else {
            console.log(`\n✅ Mises à jour terminées.`);
        }
    } catch (error) {
        console.error(`Erreur dans l'exécution du script: ${error.message}`);
        console.error(error.stack);
    }
}

// Exécuter le script
main();
