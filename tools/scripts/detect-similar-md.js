#!/usr/bin/env node

/**
 * Script pour détecter les similarités entre fichiers Markdown
 * 
 * Ce script analyse tous les fichiers Markdown dans le dossier docs/
 * et détecte ceux qui ont un contenu similaire, pour faciliter la fusion
 * des guides redondants.
 * 
 * Usage:
 *   node detect-similar-md.js [--threshold=0.7]
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
let threshold = 0.7;

for (const arg of args) {
    if (arg.startsWith('--threshold=')) {
        const val = parseFloat(arg.split('=')[1]);
        if (!isNaN(val) && val > 0 && val <= 1) {
            threshold = val;
        }
    }
}

/**
 * Calcule la similarité entre deux chaînes
 * Utilise la distance de Levenshtein pour une approximation raisonnable
 */
function stringSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) {
        return 1.0;
    }

    const costs = new Array(shorter.length + 1);
    for (let i = 0; i <= shorter.length; i++) {
        costs[i] = i;
    }

    let i = 0;
    for (i = 0; i < longer.length; i++) {
        let nw = i + 1;
        let cj_1 = longer[i];

        for (let j = 0; j < shorter.length; j++) {
            const cj = shorter[j];
            const cost = cj === cj_1 ? 0 : 1;
            const temp = costs[j + 1];
            costs[j + 1] = Math.min(
                costs[j + 1] + 1,
                costs[j] + 1,
                nw + cost
            );
            nw = temp;
        }
    }

    return (longer.length - costs[shorter.length]) / longer.length;
}

/**
 * Analyse la date de dernière modification d'un fichier
 */
function getFileModificationDate(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime;
    } catch (error) {
        console.error(`Erreur lors de la lecture des métadonnées du fichier ${filePath}: ${error.message}`);
        return new Date(0);
    }
}

/**
 * Analyse les fichiers Markdown dans le dossier docs/
 */
function analyzeDocs() {
    // Récupérer tous les fichiers Markdown de façon récursive
    function findMarkdownFiles(dir) {
        const results = [];
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Ne pas analyser le dossier _archives
                if (path.basename(filePath) !== '_archives') {
                    results.push(...findMarkdownFiles(filePath));
                }
            } else if (file.endsWith('.md')) {
                results.push(filePath);
            }
        }

        return results;
    }

    const mdFiles = findMarkdownFiles(docsDir);
    console.log(`Analyse de ${mdFiles.length} fichiers Markdown...`);

    const similarities = [];

    // Comparer chaque paire de fichiers
    for (let i = 0; i < mdFiles.length; i++) {
        const fileA = mdFiles[i];
        const contentA = fs.readFileSync(fileA, 'utf8');

        for (let j = i + 1; j < mdFiles.length; j++) {
            const fileB = mdFiles[j];
            const contentB = fs.readFileSync(fileB, 'utf8');

            const score = stringSimilarity(contentA, contentB);

            if (score > threshold) {
                // Obtenir les dates de modification pour la suggestion
                const dateA = getFileModificationDate(fileA);
                const dateB = getFileModificationDate(fileB);
                const newest = dateA > dateB ? fileA : fileB;
                const oldest = dateA > dateB ? fileB : fileA;

                similarities.push({
                    fileA: path.relative(docsDir, fileA),
                    fileB: path.relative(docsDir, fileB),
                    score,
                    recommended: {
                        base: path.relative(docsDir, newest),
                        merge: path.relative(docsDir, oldest)
                    }
                });
            }
        }
    }

    // Trier par score de similarité décroissant
    similarities.sort((a, b) => b.score - a.score);

    // Afficher les résultats
    console.log('\n=== FICHIERS SIMILAIRES ===\n');

    if (similarities.length === 0) {
        console.log('Aucun fichier similaire trouvé avec le seuil actuel.');
        console.log(`Essayez de diminuer le seuil (--threshold=${(threshold - 0.1).toFixed(1)}) pour obtenir plus de résultats.`);
        return;
    }

    similarities.forEach(item => {
        console.log(`🔁 ${item.fileA} ≈ ${item.fileB} [${(item.score * 100).toFixed(1)}%]`);
        console.log(`  Recommandation: Utiliser ${item.recommended.base} comme base et y fusionner ${item.recommended.merge}`);
        console.log('');
    });

    // Suggérer des fusions pour les documents très similaires
    const highSimilarities = similarities.filter(item => item.score > 0.75);

    if (highSimilarities.length > 0) {
        console.log('\n=== SUGGESTIONS DE FUSION ===\n');

        highSimilarities.forEach(item => {
            console.log(`Fusion recommandée (${(item.score * 100).toFixed(1)}% de similarité):`);
            console.log(`  Base: ${item.recommended.base}`);
            console.log(`  À fusionner: ${item.recommended.merge}`);
            console.log(`  Format frontmatter suggéré:`);
            console.log(`---`);
            console.log(`title: "${path.basename(item.recommended.base, '.md').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"`);
            console.log(`slug: "${path.basename(item.recommended.base, '.md')}"`);
            console.log(`module: "${item.recommended.base.split('/')[0] || 'documentation'}"`);
            console.log(`status: "merged"`);
            console.log(`from: ["${item.recommended.base}", "${item.recommended.merge}"]`);
            console.log(`lastReviewed: "${new Date().toISOString().split('T')[0]}"`);
            console.log(`---`);
            console.log('');
        });
    }
}

analyzeDocs();
