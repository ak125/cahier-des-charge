#!/usr/bin/env node

/**
 * Script pour standardiser les frontmatters des documents Markdown
 * 
 * Ce script parcourt tous les documents Markdown dans le dossier docs/
 * et standardise leurs frontmatters selon les meilleures pratiques.
 * 
 * Usage:
 *   node standardize-frontmatter.js [--dry-run]
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
const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
const DEFAULT_STATUS = 'stable';
const STATUS_MAPPING = {
    // Conversion des statuts anciens vers les nouveaux
    'wip': 'draft',
    'draft': 'draft',
    'review': 'review',
    'stable': 'stable',
    'published': 'published',
    'deprecated': 'deprecated',
    'archived': 'archived'
};

// Modules et leurs descriptions
const MODULE_DESCRIPTIONS = {
    '0-core': 'Documentation fondamentale et conventions',
    '1-architecture': 'Architecture à trois couches et structure',
    '2-migration': 'Guides et processus de migration',
    '3-orchestration': 'Orchestrateur standardisé et coordination',
    '4-nx-ci': 'Configuration NX et CI/CD',
    '5-integration': 'Intégration et standards technologiques',
    '6-planning': 'Planification et suivi des tâches'
};

/**
 * Extrait les frontmatter YAML existants d'un document Markdown
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
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
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
 * Génère un titre à partir d'un nom de fichier
 */
function generateTitleFromFilename(filename) {
    return path.basename(filename, path.extname(filename))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Génère un slug à partir d'un nom de fichier
 */
function generateSlugFromFilename(filename) {
    return path.basename(filename, path.extname(filename))
        .toLowerCase()
        .replace(/\s+/g, '-');
}

/**
 * Détermine le module et la catégorie d'un document en fonction de son chemin
 */
function getModuleAndCategory(filePath) {
    const relativePath = path.relative(docsDir, filePath);
    const parts = relativePath.split(path.sep);

    // Si le chemin commence par un dossier numéroté, c'est un module
    const module = parts[0];

    // La catégorie est le reste du chemin sans le nom de fichier
    let category = '';
    if (parts.length > 2) {
        category = parts.slice(1, -1).join('/');
    }

    return { module, category };
}

/**
 * Standardise le frontmatter d'un document Markdown
 */
function standardizeFrontmatter(filePath, content) {
    const existingFrontmatter = extractFrontmatter(content);
    const { module, category } = getModuleAndCategory(filePath);

    // Préparer les données du frontmatter standard
    const standardFrontmatter = {
        title: '',
        description: '',
        slug: '',
        module: module,
        category: category,
        status: DEFAULT_STATUS,
        lastReviewed: today
    };

    // Récupérer les valeurs existantes, si disponibles
    if (existingFrontmatter.exists) {
        const data = existingFrontmatter.data;

        if (data.title) standardFrontmatter.title = data.title;
        if (data.description) standardFrontmatter.description = data.description;
        if (data.slug) standardFrontmatter.slug = data.slug;
        if (data.module) standardFrontmatter.module = data.module;
        if (data.category) standardFrontmatter.category = data.category;
        if (data.status) {
            const normalizedStatus = data.status.toLowerCase();
            standardFrontmatter.status = STATUS_MAPPING[normalizedStatus] || DEFAULT_STATUS;
        }
        if (data.lastReviewed) standardFrontmatter.lastReviewed = data.lastReviewed;

        // Ajouter les champs personnalisés qui ne font pas partie du standard
        for (const [key, value] of Object.entries(data)) {
            if (!standardFrontmatter.hasOwnProperty(key)) {
                standardFrontmatter[key] = value;
            }
        }
    }

    // Si certains champs sont vides, les générer à partir du nom de fichier
    if (!standardFrontmatter.title) {
        standardFrontmatter.title = generateTitleFromFilename(filePath);
    }

    if (!standardFrontmatter.slug) {
        standardFrontmatter.slug = generateSlugFromFilename(filePath);
    }

    // Si pas de description mais un module identifiable, utiliser la description du module
    if (!standardFrontmatter.description && MODULE_DESCRIPTIONS[standardFrontmatter.module]) {
        standardFrontmatter.description = MODULE_DESCRIPTIONS[standardFrontmatter.module];
    }

    // Générer le frontmatter YAML
    let yaml = '---\n';
    for (const [key, value] of Object.entries(standardFrontmatter)) {
        if (value !== '' && value !== undefined && value !== null) {
            // Protéger les valeurs qui pourraient contenir des caractères spéciaux YAML
            const needsQuotes = typeof value === 'string' &&
                (value.includes(':') || value.includes('#') || value.includes("'") ||
                    value.includes('"') || value.includes('\n') || value.trim() !== value);

            if (needsQuotes) {
                yaml += `${key}: "${value.replace(/"/g, '\\"')}"\n`;
            } else {
                yaml += `${key}: ${value}\n`;
            }
        }
    }
    yaml += '---\n\n';

    // Remplacer l'ancien frontmatter ou ajouter un nouveau
    let newContent;
    if (existingFrontmatter.exists) {
        newContent = content.substring(0, existingFrontmatter.startPos) + yaml + content.substring(existingFrontmatter.endPos);
    } else {
        newContent = yaml + content;
    }

    return newContent;
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
                const updatedContent = standardizeFrontmatter(filePath, content);

                if (content !== updatedContent) {
                    if (dryRun) {
                        console.log(`[DRY RUN] Standardisation du frontmatter pour ${filePath}`);
                    } else {
                        fs.writeFileSync(filePath, updatedContent, 'utf8');
                        console.log(`✅ Frontmatter standardisé pour ${filePath}`);
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
    console.log('=== STANDARDISATION DES FRONTMATTERS MARKDOWN ===\n');

    if (dryRun) {
        console.log('Mode simulation (dry run) activé. Aucune modification ne sera effectuée.\n');
    }

    for (const section of Object.keys(MODULE_DESCRIPTIONS)) {
        const sectionDir = path.join(docsDir, section);

        if (fs.existsSync(sectionDir) && fs.statSync(sectionDir).isDirectory()) {
            console.log(`\nTraitement de la section ${section}...`);
            processDirectory(sectionDir);
        }
    }

    // Traiter également les fichiers à la racine du dossier docs/
    const rootFiles = fs.readdirSync(docsDir).filter(file => {
        const filePath = path.join(docsDir, file);
        return fs.statSync(filePath).isFile() && file.endsWith('.md');
    });

    if (rootFiles.length > 0) {
        console.log('\nTraitement des fichiers à la racine...');

        for (const file of rootFiles) {
            try {
                const filePath = path.join(docsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const updatedContent = standardizeFrontmatter(filePath, content);

                if (content !== updatedContent) {
                    if (dryRun) {
                        console.log(`[DRY RUN] Standardisation du frontmatter pour ${filePath}`);
                    } else {
                        fs.writeFileSync(filePath, updatedContent, 'utf8');
                        console.log(`✅ Frontmatter standardisé pour ${filePath}`);
                    }
                } else {
                    console.log(`⏭️ Aucune modification nécessaire pour ${filePath}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de ${file}: ${error.message}`);
            }
        }
    }

    console.log('\nStandardisation des frontmatters terminée.');
}

// Exécuter le script
main();
