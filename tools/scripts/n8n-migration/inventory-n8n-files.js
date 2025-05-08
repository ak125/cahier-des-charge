/**
 * Script d'inventaire des fichiers n8n existants dans le projet
 * Ce script identifie tous les fichiers liés à n8n, les catalogue
 * et génère un rapport d'inventaire pour la Phase 1 du plan de migration.
 * 
 * Usage: node inventory-n8n-files.js
 * 
 * Date de création: 6 mai 2025
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = '/workspaces/cahier-des-charge';
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'migrations/n8n-inventory');
const ARCHIVE_DIR = path.join(PROJECT_ROOT, 'archives/n8n-legacy-20250506');
const REPORT_FILE = path.join(OUTPUT_DIR, 'n8n-files-inventory.md');
const JSON_REPORT_FILE = path.join(OUTPUT_DIR, 'n8n-files-inventory.json');

// Patterns pour identifier les fichiers n8n
const N8N_PATTERNS = [
    // Fichiers de workflows et configurations
    "*n8n*.json",
    "*n8n*.js",
    "*n8n*.ts",
    "n8n-*.json",
    "n8n-*.js",
    "n8n-*.ts"
];

// Créer les répertoires de sortie s'ils n'existent pas
function createDirectories() {
    console.log('Création des répertoires de sortie...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Répertoire créé: ${OUTPUT_DIR}`);
    }

    if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
        console.log(`Répertoire créé: ${ARCHIVE_DIR}`);
    }
}

// Trouver tous les fichiers n8n dans le projet
function findN8nFiles() {
    console.log('Recherche des fichiers n8n dans le projet...');

    let allFiles = [];

    for (const pattern of N8N_PATTERNS) {
        try {
            // Utiliser find pour rechercher les fichiers correspondant au pattern
            const cmd = `find ${PROJECT_ROOT} -type f -name "${pattern}" | grep -v "node_modules" | grep -v "dist" | grep -v "archives"`;
            const result = execSync(cmd, { encoding: 'utf-8' }).trim();

            if (result) {
                const files = result.split('\n').filter(Boolean);
                allFiles = [...allFiles, ...files];
            }
        } catch (error) {
            // Ignorer les erreurs de grep lorsqu'aucun fichier n'est trouvé
            if (!error.message.includes('grep')) {
                console.error(`Erreur lors de la recherche avec pattern ${pattern}:`, error.message);
            }
        }
    }

    // Éliminer les doublons
    return [...new Set(allFiles)];
}

// Analyser un fichier pour déterminer son type
function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const stats = fs.statSync(filePath);

    let fileType = 'unknown';
    let description = '';
    let category = 'unknown';

    // Déterminer le type de fichier en fonction du contenu
    if (content.includes('"nodes":') && content.includes('"connections":')) {
        fileType = 'workflow';

        // Essayer de déterminer le nom du workflow
        try {
            const jsonContent = JSON.parse(content);
            description = jsonContent.name || '';
        } catch (e) {
            // Ignorer les erreurs de parsing
        }
    } else if (content.includes('"credentialType":')) {
        fileType = 'credential';
    } else if (relativePath.includes('/config/')) {
        fileType = 'configuration';
    } else if (relativePath.includes('/scripts/')) {
        fileType = 'script';
    }

    // Déterminer la catégorie basée sur le nom et le chemin du fichier
    if (relativePath.includes('php') || relativePath.includes('PHP')) {
        category = 'php-analysis';
    } else if (relativePath.includes('seo') || relativePath.includes('SEO')) {
        category = 'seo';
    } else if (relativePath.includes('audit')) {
        category = 'audit';
    } else if (relativePath.includes('migration')) {
        category = 'migration';
    } else if (relativePath.includes('monitor')) {
        category = 'monitoring';
    } else if (relativePath.includes('pipeline')) {
        category = 'pipeline';
    } else if (relativePath.includes('database') || relativePath.includes('sql') ||
        relativePath.includes('mysql') || relativePath.includes('postgres')) {
        category = 'database';
    }

    return {
        path: filePath,
        relativePath,
        fileType,
        description,
        category,
        lastModified: stats.mtime,
        size: stats.size
    };
}

// Générer un rapport d'inventaire en Markdown
function generateMarkdownReport(files) {
    console.log('Génération du rapport d\'inventaire en Markdown...');

    // Organiser les fichiers par catégorie
    const filesByCategory = {};
    for (const file of files) {
        if (!filesByCategory[file.category]) {
            filesByCategory[file.category] = [];
        }
        filesByCategory[file.category].push(file);
    }

    // Générer le rapport
    let report = `# Inventaire des Fichiers n8n\n\n`;
    report += `*Rapport généré le ${new Date().toISOString().split('T')[0]}*\n\n`;
    report += `## Vue d'ensemble\n\n`;
    report += `- **Nombre total de fichiers n8n**: ${files.length}\n`;
    report += `- **Catégories identifiées**: ${Object.keys(filesByCategory).length}\n\n`;

    // Tableau récapitulatif par catégorie
    report += `| Catégorie | Nombre de fichiers |\n`;
    report += `|-----------|-------------------|\n`;
    for (const [category, categoryFiles] of Object.entries(filesByCategory)) {
        report += `| ${category} | ${categoryFiles.length} |\n`;
    }
    report += `\n`;

    // Détail par catégorie
    for (const [category, categoryFiles] of Object.entries(filesByCategory)) {
        report += `## Catégorie: ${category}\n\n`;
        report += `| Fichier | Type | Description | Dernière modification |\n`;
        report += `|---------|------|-------------|----------------------|\n`;

        for (const file of categoryFiles) {
            const lastModified = new Date(file.lastModified).toISOString().split('T')[0];
            report += `| \`${file.relativePath}\` | ${file.fileType} | ${file.description || '-'} | ${lastModified} |\n`;
        }

        report += `\n`;
    }

    // Étapes suivantes (Plan de migration)
    report += `## Étapes suivantes\n\n`;
    report += `Selon le plan de migration n8n vers Temporal:\n\n`;
    report += `1. **Phase 1 (Mai 2025)**: Compléter l'audit et l'analyse de ces fichiers\n`;
    report += `2. **Phase 2 (Juin 2025)**: Classification et priorisation de la migration\n`;
    report += `3. **Phase 3 (Juillet 2025)**: Migrer les workflows non critiques\n`;
    report += `4. **Phase 4 (Août-Octobre 2025)**: Migration générale\n`;
    report += `5. **Phase 5 (Novembre 2025)**: Décommissionnement de n8n\n\n`;

    report += `Pour plus de détails, consultez le [Plan de migration n8n](/docs/n8n-migration-plan.md).\n`;

    return report;
}

// Exécution du script principal
async function main() {
    console.log('=== Inventaire des fichiers n8n ===');

    // Créer les répertoires
    createDirectories();

    // Trouver tous les fichiers n8n
    const n8nFiles = findN8nFiles();
    console.log(`${n8nFiles.length} fichiers n8n trouvés dans le projet.`);

    // Analyser chaque fichier
    const fileDetails = [];
    for (const filePath of n8nFiles) {
        try {
            const details = analyzeFile(filePath);
            fileDetails.push(details);
            console.log(`Analysé: ${filePath}`);
        } catch (error) {
            console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error.message);
        }
    }

    // Générer le rapport Markdown
    const markdownReport = generateMarkdownReport(fileDetails);

    // Écrire le rapport Markdown
    fs.writeFileSync(REPORT_FILE, markdownReport);
    console.log(`Rapport Markdown généré: ${REPORT_FILE}`);

    // Écrire le rapport JSON pour traitement ultérieur
    fs.writeFileSync(JSON_REPORT_FILE, JSON.stringify(fileDetails, null, 2));
    console.log(`Rapport JSON généré: ${JSON_REPORT_FILE}`);

    console.log('\n=== Inventaire terminé avec succès ===');
    console.log(`Consultez le rapport d'inventaire dans: ${REPORT_FILE}`);
}

main().catch(error => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
});