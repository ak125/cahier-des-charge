#!/usr/bin/env node

/**
 * Script pour standardiser les titres et formats dans les documents Markdown
 * 
 * Ce script parcourt tous les documents Markdown dans le dossier docs/
 * et standardise leurs titres et formats selon les meilleures pratiques.
 * 
 * Usage:
 *   node standardize-headings.js [--dry-run]
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

// Configuration pour la standardisation
const titleMapping = {
    'Vue d\'ensemble': 'Vue d\'ensemble',
    'Overview': 'Vue d\'ensemble',
    'Vue d\'ensemble du document': 'Vue d\'ensemble',
    'Vue générale': 'Vue d\'ensemble',
    'Introduction': 'Introduction',
    'table des matières': 'Table des matières',
    'Table Des Matières': 'Table des matières',
    'table des matieres': 'Table des matières',
    'Tableau de contenu': 'Table des matières',
    'Architecture': 'Architecture',
    'Technologies': 'Technologies',
    'Étapes de migration': 'Étapes de migration',
    'Etapes de migration': 'Étapes de migration',
    'Migration Steps': 'Étapes de migration',
    'Plan de migration': 'Plan de migration',
    'Migration Plan': 'Plan de migration',
    'Guide de migration': 'Guide de migration',
    'Migration Guide': 'Guide de migration',
    'Bonnes pratiques': 'Bonnes pratiques',
    'Best Practices': 'Bonnes pratiques',
    'Implementation': 'Implémentation',
    'Implémentation': 'Implémentation',
    'Détails techniques': 'Détails techniques',
    'Technical Details': 'Détails techniques',
    'Annexes': 'Annexes',
    'Appendix': 'Annexes',
    'References': 'Références',
    'Références': 'Références'
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
 * Standardise les titres d'un document Markdown
 */
function standardizeHeadings(content) {
    // Extraire le frontmatter pour ne pas le modifier
    const frontmatter = extractFrontmatter(content);
    let mainContent = content;

    if (frontmatter.exists) {
        mainContent = content.substring(frontmatter.endPos);
    }

    // Standardiser le titre principal (H1)
    // Le premier titre H1 devrait correspondre au title du frontmatter
    const h1Regex = /^#\s+(.*?)$/m;
    mainContent = mainContent.replace(h1Regex, (match, title) => {
        // Conserver le titre tel quel, nous vérifions juste qu'il existe
        return match;
    });

    // Standardiser les titres de section (H2 et H3)
    let updatedContent = mainContent;

    // Remplacer les titres H2 selon le mapping
    const h2Regex = /^##\s+(.*?)$/gm;
    updatedContent = updatedContent.replace(h2Regex, (match, title) => {
        const trimmedTitle = title.trim();
        const standardTitle = titleMapping[trimmedTitle] || trimmedTitle;
        return `## ${standardTitle}`;
    });

    // Standardiser les conventions de formatage
    // 1. Dates : DD/MM/YYYY -> DD mois YYYY
    const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    updatedContent = updatedContent.replace(dateRegex, (match, day, month, year) => {
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        if (monthNum >= 1 && monthNum <= 12) {
            return `${dayNum} ${months[monthNum - 1]} ${year}`;
        }
        return match; // Si la date est invalide, la garder telle quelle
    });

    // 2. Standardiser les puces de listes : utiliser toujours '-' pour les listes à puces
    updatedContent = updatedContent.replace(/^\s*[*+]\s+/gm, '- ');

    // 3. Standardiser les blocs de code : s'assurer qu'ils ont un langage spécifié
    // Remplacer les blocs ```code par ```typescript si ce semble être du code TypeScript
    updatedContent = updatedContent.replace(/```(?!\w+\n)([\s\S]*?```)/gm, (match, code) => {
        if (code.includes('import ') || code.includes('export ') ||
            code.includes('interface ') || code.includes('type ') ||
            code.includes('class ') || code.includes('function ')) {
            return '```typescript' + code;
        }
        return match;
    });

    // 4. Standardiser les liens - s'assurer qu'ils utilisent le format de chemin relatif correct
    // Transformer les liens [texte](./chemin/vers/doc.md) en [texte](chemin/vers/doc.md)
    updatedContent = updatedContent.replace(/\[([^\]]+)\]\(\.\/(.*?)(?:\.md)?\)/g, '[$1]($2)');

    // Si le frontmatter existe, le réintégrer
    if (frontmatter.exists) {
        return frontmatter.content + updatedContent;
    }

    return updatedContent;
}

/**
 * Standardise le formatage général d'un document Markdown
 */
function standardizeFormatting(content) {
    // 1. S'assurer qu'il y a une ligne vide après chaque titre
    content = content.replace(/^(#+\s+.*?)$/gm, '$1\n');

    // 2. S'assurer qu'il y a une ligne vide avant chaque titre (sauf s'il est au début du document ou après un frontmatter)
    content = content.replace(/([^\n])(\n#+\s+)/g, '$1\n\n$2');

    // 3. Standardiser les espaces : supprimer les espaces à la fin des lignes
    content = content.replace(/[ \t]+$/gm, '');

    // 4. Standardiser les fins de lignes : utiliser LF
    content = content.replace(/\r\n/g, '\n');

    // 5. S'assurer qu'il y a une ligne vide à la fin du fichier
    if (!content.endsWith('\n\n')) {
        if (content.endsWith('\n')) {
            content += '\n';
        } else {
            content += '\n\n';
        }
    }

    return content;
}

/**
 * Parcourt récursivement un dossier pour traiter tous les fichiers Markdown
 */
function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Ne pas traiter les archives
            if (path.basename(filePath) !== '_archives') {
                processDirectory(filePath);
            }
        } else if (file.endsWith('.md')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');

                // Standardiser les titres et le formatage
                const updatedContent = standardizeFormatting(standardizeHeadings(content));

                if (content !== updatedContent) {
                    if (dryRun) {
                        console.log(`[DRY RUN] Standardisation des titres et du format pour ${filePath}`);
                    } else {
                        fs.writeFileSync(filePath, updatedContent, 'utf8');
                        console.log(`✅ Titres et format standardisés pour ${filePath}`);
                    }
                } else {
                    console.log(`⏭️ Aucune modification nécessaire pour ${filePath}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de ${filePath}: ${error.message}`);
            }
        }
    }
}

/**
 * Fonction principale
 */
function main() {
    console.log('=== STANDARDISATION DES TITRES ET FORMATS MARKDOWN ===\n');

    if (dryRun) {
        console.log('Mode simulation (dry run) activé. Aucune modification ne sera effectuée.\n');
    }

    // Traiter tous les sous-dossiers de docs/
    for (const item of fs.readdirSync(docsDir)) {
        const itemPath = path.join(docsDir, item);

        if (fs.statSync(itemPath).isDirectory() && !item.startsWith('_')) {
            console.log(`\nTraitement du dossier ${item}...`);
            processDirectory(itemPath);
        }
    }

    // Traiter également les fichiers à la racine du dossier docs/
    console.log('\nTraitement des fichiers à la racine...');
    const rootFiles = fs.readdirSync(docsDir).filter(file => {
        const filePath = path.join(docsDir, file);
        return fs.statSync(filePath).isFile() && file.endsWith('.md');
    });

    for (const file of rootFiles) {
        try {
            const filePath = path.join(docsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            // Standardiser les titres et le formatage
            const updatedContent = standardizeFormatting(standardizeHeadings(content));

            if (content !== updatedContent) {
                if (dryRun) {
                    console.log(`[DRY RUN] Standardisation des titres et du format pour ${filePath}`);
                } else {
                    fs.writeFileSync(filePath, updatedContent, 'utf8');
                    console.log(`✅ Titres et format standardisés pour ${filePath}`);
                }
            } else {
                console.log(`⏭️ Aucune modification nécessaire pour ${filePath}`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du traitement de ${file}: ${error.message}`);
        }
    }

    console.log('\nStandardisation des titres et formats terminée.');
}

// Exécuter le script
main();
