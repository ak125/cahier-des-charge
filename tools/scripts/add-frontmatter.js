#!/usr/bin/env node

/**
 * Script pour ajouter des frontmatter YAML aux fichiers Markdown
 * 
 * Ce script parcourt les fichiers Markdown de la documentation et ajoute
 * ou met à jour les métadonnées frontmatter YAML en fonction du chemin du fichier.
 * 
 * Usage:
 *   node add-frontmatter.js [--dry-run] [--force]
 * 
 * Options:
 *   --dry-run    Simule l'ajout de frontmatter sans modifier les fichiers
 *   --force      Remplace les frontmatter existants
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
const force = args.includes('--force');

// Configuration des modules/sections basée sur la structure des dossiers
const MODULES = {
    '0-core': { name: 'Core', status: 'stable' },
    '1-architecture': { name: 'Architecture', status: 'stable' },
    '2-migration': { name: 'Migration', status: 'stable' },
    '3-orchestration': { name: 'Orchestration', status: 'stable' },
    '4-nx-ci': { name: 'NX & CI/CD', status: 'stable' },
    '5-integration': { name: 'Intégration', status: 'stable' },
    '6-planning': { name: 'Planning', status: 'stable' },
};

/**
 * Extrait les frontmatter YAML existants d'un contenu Markdown
 */
function extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);

    if (match) {
        const frontmatterYaml = match[1];
        const frontmatter = {};
        const lines = frontmatterYaml.split('\n');

        for (const line of lines) {
            if (line.trim() === '') continue;

            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();

                // Nettoyer les guillemets
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }

                frontmatter[key] = value;
            }
        }

        return {
            exists: true,
            content: frontmatterYaml,
            data: frontmatter,
            startPos: 0,
            endPos: match[0].length
        };
    }

    return { exists: false };
}

/**
 * Génère un slug à partir d'un nom de fichier
 */
function slugify(text) {
    return text
        .replace(/\.\w+$/, '') // Enlever l'extension
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

/**
 * Convertit un nom de fichier en titre formaté
 */
function fileToTitle(filename) {
    return path.basename(filename, path.extname(filename))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliser la première lettre de chaque mot
}

/**
 * Génère un frontmatter YAML pour un fichier Markdown
 */
function generateFrontmatter(filePath) {
    const relativePath = path.relative(docsDir, filePath);
    const dirname = path.dirname(relativePath);
    const filename = path.basename(filePath);

    // Déterminer le module en fonction du dossier parent
    const module = dirname.split('/')[0];
    const moduleInfo = MODULES[module] || { name: 'Documentation', status: 'draft' };

    // Construire les métadonnées
    const frontmatter = {
        title: fileToTitle(filename),
        slug: slugify(filename),
        module: module,
        category: dirname.includes('/') ? dirname.split('/').slice(1).join('/') : '',
        status: moduleInfo.status,
        lastReviewed: new Date().toISOString().split('T')[0] // Date au format YYYY-MM-DD
    };

    // Construire le frontmatter YAML
    let yaml = '---\n';
    for (const [key, value] of Object.entries(frontmatter)) {
        if (value) { // Ne pas inclure les valeurs vides
            // Mettre les chaînes entre guillemets pour éviter les problèmes de formatage
            yaml += `${key}: "${value}"\n`;
        }
    }
    yaml += '---\n\n';

    return yaml;
}

/**
 * Ajoute des frontmatter YAML à un fichier Markdown
 */
function addFrontmatter(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const existingFrontmatter = extractFrontmatter(content);

        // Si un frontmatter existe déjà et qu'on ne force pas le remplacement
        if (existingFrontmatter.exists && !force) {
            console.log(`⏭️ Frontmatter existant pour ${filePath} (utilisez --force pour remplacer)`);
            return false;
        }

        const yaml = generateFrontmatter(filePath);
        let newContent;

        // Si un frontmatter existe et qu'on veut le remplacer
        if (existingFrontmatter.exists) {
            newContent = content.substring(0, existingFrontmatter.startPos) + yaml + content.substring(existingFrontmatter.endPos);
        } else {
            // Ajouter au début du fichier
            newContent = yaml + content;
        }

        if (dryRun) {
            console.log(`[DRY RUN] Ajout de frontmatter à ${filePath}:`);
            console.log(yaml);
        } else {
            fs.writeFileSync(filePath, newContent);
            console.log(`✅ Frontmatter ajouté à ${filePath}`);
        }

        return true;

    } catch (error) {
        console.error(`⚠️ Erreur lors du traitement de ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Traverse récursivement un répertoire et traite les fichiers Markdown
 */
function processDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const itemPath = path.join(dir, item);

        if (fs.statSync(itemPath).isDirectory()) {
            // Ignorer le dossier _archives
            if (item !== '_archives') {
                processDirectory(itemPath);
            }
        } else if (item.endsWith('.md')) {
            addFrontmatter(itemPath);
        }
    }
}

/**
 * Fonction principale
 */
function main() {
    console.log('=== AJOUT DE FRONTMATTER AUX FICHIERS MARKDOWN ===\n');

    if (dryRun) {
        console.log('Mode simulation (dry run) activé. Aucune modification ne sera effectuée.\n');
    }

    // Parcourir les dossiers de section
    for (const section of Object.keys(MODULES)) {
        const sectionDir = path.join(docsDir, section);

        if (fs.existsSync(sectionDir) && fs.statSync(sectionDir).isDirectory()) {
            console.log(`\nTraitement de la section ${section}...`);
            processDirectory(sectionDir);
        }
    }

    console.log('\nTraitement terminé.');
}

// Exécuter le script
main();
