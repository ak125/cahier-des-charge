#!/usr/bin/env node

/**
 * Script pour vérifier les liens croisés dans la documentation
 * 
 * Ce script vérifie que tous les liens entre documents fonctionnent correctement.
 * 
 * Usage:
 *   node check-links.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

// Regex pour extraire les liens Markdown
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

// Liste des extensions de fichiers à vérifier dans les liens
const fileExtensions = ['.md', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

/**
 * Vérifie si un lien est valide
 */
function checkLink(link, sourcePath) {
    // Ignorer les liens externes (http://, https://, etc.)
    if (link.match(/^https?:\/\//i) || link.match(/^mailto:/i)) {
        return { valid: true, type: 'external' };
    }

    // Nettoyer le lien des ancres (#section)
    const cleanLink = link.split('#')[0];

    // Ignorer les liens vides (qui pointent vers des ancres dans le même document)
    if (cleanLink === '') {
        return { valid: true, type: 'anchor' };
    }

    // Construire le chemin absolu du lien
    let targetPath;
    if (path.isAbsolute(cleanLink)) {
        // Si le lien est absolu par rapport au système, le laisser tel quel
        targetPath = cleanLink;
    } else {
        // Pour les liens relatifs, les résoudre par rapport au document source
        const sourceDir = path.dirname(sourcePath);
        targetPath = path.resolve(sourceDir, cleanLink);

        // Si aucune extension n'est fournie, essayer d'ajouter .md
        if (!path.extname(targetPath)) {
            targetPath += '.md';
        }
    }

    // Vérifier si le fichier existe
    return {
        valid: fs.existsSync(targetPath),
        type: 'internal',
        targetPath
    };
}

/**
 * Parcourt récursivement un dossier pour vérifier tous les liens dans les fichiers Markdown
 */
function checkLinksInDirectory(dir) {
    const results = {
        totalFiles: 0,
        totalLinks: 0,
        brokenLinks: []
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Ne pas traiter les archives
            if (path.basename(filePath) !== '_archives') {
                const subResults = checkLinksInDirectory(filePath);

                // Fusionner les résultats
                results.totalFiles += subResults.totalFiles;
                results.totalLinks += subResults.totalLinks;
                results.brokenLinks = results.brokenLinks.concat(subResults.brokenLinks);
            }
        } else if (file.endsWith('.md')) {
            results.totalFiles++;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                let match;

                // Rechercher tous les liens dans le document
                while ((match = linkRegex.exec(content)) !== null) {
                    const [fullMatch, text, link] = match;
                    results.totalLinks++;

                    // Vérifier si le lien est valide
                    const { valid, type, targetPath } = checkLink(link, filePath);

                    if (!valid && type === 'internal') {
                        results.brokenLinks.push({
                            file: path.relative(docsDir, filePath),
                            link,
                            targetPath,
                            position: match.index
                        });
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
    console.log('=== VÉRIFICATION DES LIENS CROISÉS DANS LA DOCUMENTATION ===\n');

    const results = checkLinksInDirectory(docsDir);

    console.log(`Fichiers analysés: ${results.totalFiles}`);
    console.log(`Liens trouvés: ${results.totalLinks}`);

    if (results.brokenLinks.length > 0) {
        console.log(`\n⚠️ Liens cassés trouvés: ${results.brokenLinks.length}`);

        // Regrouper les liens cassés par fichier source
        const groupedByFile = {};
        results.brokenLinks.forEach(broken => {
            if (!groupedByFile[broken.file]) {
                groupedByFile[broken.file] = [];
            }
            groupedByFile[broken.file].push(broken);
        });

        // Afficher les liens cassés par fichier
        for (const [file, links] of Object.entries(groupedByFile)) {
            console.log(`\nFichier: ${file}`);
            links.forEach(broken => {
                console.log(`  - Lien cassé: ${broken.link}`);
                console.log(`    Cible inexistante: ${broken.targetPath}`);
            });
        }

        console.log(`\n⚠️ Total des liens cassés: ${results.brokenLinks.length}`);
    } else {
        console.log(`\n✅ Tous les liens sont valides.`);
    }
}

// Exécuter le script
main();
