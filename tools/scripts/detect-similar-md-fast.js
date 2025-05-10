#!/usr/bin/env node

/**
 * Script optimisé pour détecter rapidement les similarités entre fichiers Markdown
 * 
 * Ce script utilise une technique de hachage et d'empreinte pour détecter
 * efficacement les fichiers similaires sans comparer le contenu complet.
 * 
 * Usage:
 *   node detect-similar-md-fast.js [--threshold=0.7] [--max=10] [--titles-only]
 * 
 * Options:
 *   --threshold=0.7   Seuil de similarité (0.0 à 1.0)
 *   --max=10          Nombre maximum de résultats à afficher
 *   --titles-only     Compare uniquement les titres et les en-têtes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

// Analyse des arguments
const args = process.argv.slice(2);
let threshold = 0.7;
let maxResults = 10;
let titlesOnly = false;
let specificFiles = [];

for (const arg of args) {
    if (arg.startsWith('--threshold=')) {
        const val = parseFloat(arg.split('=')[1]);
        if (!isNaN(val) && val > 0 && val <= 1) {
            threshold = val;
        }
    } else if (arg.startsWith('--max=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val) && val > 0) {
            maxResults = val;
        }
    } else if (arg === '--titles-only') {
        titlesOnly = true;
    } else if (arg.startsWith('--files=')) {
        specificFiles = arg.substring('--files='.length).split(',').map(f => f.trim());
    }
}

/**
 * Extrait les titres et en-têtes d'un document Markdown
 */
function extractTitles(content) {
    const lines = content.split('\n');
    return lines
        .filter(line => line.startsWith('#'))
        .map(line => line.replace(/^#+\s+/, '').trim())
        .join('\n');
}

/**
 * Extrait le frontmatter YAML d'un fichier Markdown (s'il existe)
 */
function extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);
    return match ? match[1].trim() : '';
}

/**
 * Calcule une empreinte du document (fingerprint) à partir de mots clés
 */
function calculateFingerprint(content) {
    // Normalisation du contenu
    const normalizedContent = content
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '');

    // Extraire les mots (en ignorant les mots très courts)
    const words = normalizedContent
        .split(' ')
        .filter(word => word.length > 3);

    // Sélection des mots significatifs (fréquents mais pas trop)
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Prendre les 100 mots les plus fréquents (mais pas les très communs)
    return Object.entries(wordCount)
        .filter(([word, count]) => count > 1 && count < words.length / 10)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
        .map(([word]) => word)
        .sort() // Tri alphabétique pour cohérence
        .join(' ');
}

/**
 * Calcule la similarité de Jaccard entre deux ensembles
 */
function jaccardSimilarity(set1, set2) {
    const set1Array = set1.split(' ');
    const set2Array = set2.split(' ');

    const set1Set = new Set(set1Array);
    const set2Set = new Set(set2Array);

    // Calcul de l'intersection
    const intersection = new Set([...set1Set].filter(x => set2Set.has(x)));

    // Calcul de l'union
    const union = new Set([...set1Set, ...set2Set]);

    // Similarité de Jaccard: taille de l'intersection / taille de l'union
    return intersection.size / union.size;
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

    let mdFiles = findMarkdownFiles(docsDir);

    // Filtrer les fichiers spécifiques si demandé
    if (specificFiles.length > 0) {
        const specificFilePaths = specificFiles.map(file => {
            // Recherche récursive du fichier dans le dossier docs
            const foundFiles = findMarkdownFiles(docsDir).filter(
                path => path.endsWith(`/${file}`)
            );
            return foundFiles.length > 0 ? foundFiles[0] : null;
        }).filter(Boolean);

        if (specificFilePaths.length > 0) {
            mdFiles = specificFilePaths;
            console.log(`Analyse limitée à ${specificFilePaths.length} fichiers spécifiés...`);
        }
    }

    console.log(`Analyse de ${mdFiles.length} fichiers Markdown...`);

    // Prétraitement des fichiers et calcul des empreintes
    const fileData = mdFiles.map(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const frontmatter = extractFrontmatter(content);

        let processedContent;
        if (titlesOnly) {
            processedContent = extractTitles(content);
        } else {
            processedContent = content;
        }

        return {
            path: filePath,
            relativePath: path.relative(docsDir, filePath),
            fingerprint: calculateFingerprint(processedContent),
            modifiedDate: getFileModificationDate(filePath),
            frontmatter,
            hasFrontmatter: frontmatter.length > 0
        };
    });

    console.log(`Recherche des similarités entre ${fileData.length} fichiers...`);

    const similarities = [];

    // Comparer les empreintes digitales (plus rapide que la comparaison de contenu complet)
    for (let i = 0; i < fileData.length; i++) {
        const fileA = fileData[i];

        for (let j = i + 1; j < fileData.length; j++) {
            const fileB = fileData[j];

            // Comparaison des empreintes avec Jaccard
            const score = jaccardSimilarity(fileA.fingerprint, fileB.fingerprint);

            if (score > threshold) {
                const newest = fileA.modifiedDate > fileB.modifiedDate ? fileA : fileB;
                const oldest = fileA.modifiedDate > fileB.modifiedDate ? fileB : fileA;

                similarities.push({
                    fileA: fileA.relativePath,
                    fileB: fileB.relativePath,
                    score,
                    recommended: {
                        base: newest.relativePath,
                        merge: oldest.relativePath,
                        baseHasFrontmatter: newest.hasFrontmatter
                    }
                });
            }
        }
    }

    // Trier par score de similarité décroissant
    similarities.sort((a, b) => b.score - a.score);

    // Limiter le nombre de résultats
    const limitedResults = similarities.slice(0, maxResults);

    // Afficher les résultats
    console.log('\n=== FICHIERS SIMILAIRES ===\n');

    if (limitedResults.length === 0) {
        console.log('Aucun fichier similaire trouvé avec le seuil actuel.');
        console.log(`Essayez de diminuer le seuil (--threshold=${(threshold - 0.1).toFixed(1)}) pour obtenir plus de résultats.`);
        return;
    }

    limitedResults.forEach(item => {
        console.log(`🔁 ${item.fileA} ≈ ${item.fileB} [${(item.score * 100).toFixed(1)}%]`);
        console.log(`  Recommandation: Utiliser ${item.recommended.base} comme base et y fusionner ${item.recommended.merge}`);
        console.log('');
    });

    // Suggérer des fusions pour les documents très similaires
    const highSimilarities = limitedResults.filter(item => item.score > 0.8);

    if (highSimilarities.length > 0) {
        console.log('\n=== SUGGESTIONS DE FUSION ===\n');

        highSimilarities.forEach(item => {
            console.log(`Fusion recommandée (${(item.score * 100).toFixed(1)}% de similarité):`);
            console.log(`  Base: ${item.recommended.base}`);
            console.log(`  À fusionner: ${item.recommended.merge}`);

            if (!item.recommended.baseHasFrontmatter) {
                console.log(`  Format frontmatter suggéré:`);
                console.log(`---`);
                console.log(`title: "${path.basename(item.recommended.base, '.md').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"`);
                console.log(`slug: "${path.basename(item.recommended.base, '.md')}"`);
                console.log(`module: "${item.recommended.base.split('/')[0] || 'documentation'}"`);
                console.log(`status: "merged"`);
                console.log(`from: ["${path.basename(item.recommended.base)}", "${path.basename(item.recommended.merge)}"]`);
                console.log(`lastReviewed: "${new Date().toISOString().split('T')[0]}"`);
                console.log(`---`);
            }
            console.log('');
        });
    }

    console.log(`\nAffichage de ${limitedResults.length} résultats sur ${similarities.length} similarités détectées.`);
    if (similarities.length > limitedResults.length) {
        console.log(`Pour voir plus de résultats, utilisez l'option --max=${similarities.length}.`);
    }
}

analyzeDocs();
