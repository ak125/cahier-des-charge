/**
 * Script de standardisation des workflows Temporal
 * 
 * Ce script identifie les workflows Temporal dans la structure non standard
 * et les déplace vers la structure standard tout en ajustant les imports.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins des dossiers
const PROJECT_ROOT = '/workspaces/cahier-des-charge';
const NON_STANDARD_PATH = path.join(PROJECT_ROOT, 'packages/business/workflows/temporal');
const STANDARD_PATH = path.join(PROJECT_ROOT, 'packages/business/temporal/workflows');
const BACKUP_PATH = path.join(PROJECT_ROOT, 'backup/obsolete-files-20250505');

// Vérifier si les dossiers existent
if (!fs.existsSync(NON_STANDARD_PATH)) {
    console.error(`Le chemin non standard n'existe pas: ${NON_STANDARD_PATH}`);
    process.exit(1);
}

// Créer le dossier de backup s'il n'existe pas
if (!fs.existsSync(BACKUP_PATH)) {
    fs.mkdirSync(BACKUP_PATH, { recursive: true });
    console.log(`Dossier de backup créé: ${BACKUP_PATH}`);
}

// Fonction pour trouver tous les fichiers .workflow.ts
function findWorkflowFiles(dir) {
    const results = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            results.push(...findWorkflowFiles(fullPath));
        } else if (file.isFile() && (file.name.endsWith('.workflow.ts') || file.name === 'workflow.ts')) {
            results.push(fullPath);
        }
    }

    return results;
}

// Fonction pour déterminer le chemin cible dans la structure standard
function getTargetPath(filePath) {
    const relativePath = path.relative(NON_STANDARD_PATH, filePath);
    return path.join(STANDARD_PATH, relativePath);
}

// Fonction pour créer un rapport de duplication
function createDuplicationReport(nonStandardFiles) {
    const reportPath = path.join(PROJECT_ROOT, 'cleanup-report/workflow-duplication-report.md');
    let reportContent = `# Rapport de duplication des workflows Temporal\n\n`;
    reportContent += `Date: ${new Date().toISOString()}\n\n`;
    reportContent += `## Fichiers dans la structure non standard\n\n`;

    nonStandardFiles.forEach(file => {
        const relativePath = path.relative(PROJECT_ROOT, file);
        const targetPath = getTargetPath(file);
        const targetRelativePath = path.relative(PROJECT_ROOT, targetPath);

        reportContent += `- ${relativePath}\n`;
        reportContent += `  - Chemin cible: ${targetRelativePath}\n`;

        // Vérifier si un fichier similaire existe déjà dans la structure standard
        const fileName = path.basename(file);
        const similarFiles = findSimilarFiles(STANDARD_PATH, fileName.replace('.workflow.ts', ''));

        if (similarFiles.length > 0) {
            reportContent += `  - **Potentiels doublons**:\n`;
            similarFiles.forEach(similarFile => {
                reportContent += `    - ${path.relative(PROJECT_ROOT, similarFile)}\n`;
            });
        }
    });

    fs.writeFileSync(reportPath, reportContent);
    console.log(`Rapport de duplication créé: ${reportPath}`);
    return reportPath;
}

// Fonction pour trouver des fichiers similaires basés sur le nom
function findSimilarFiles(dir, baseName) {
    const results = [];
    const allWorkflowFiles = findWorkflowFiles(dir);

    const normalizedBaseName = baseName.toLowerCase().replace(/-/g, '').replace(/workflow/g, '');

    for (const file of allWorkflowFiles) {
        const fileName = path.basename(file);
        const normalizedFileName = fileName.toLowerCase().replace(/-/g, '').replace(/workflow/g, '');

        // Vérifier si les noms sont similaires
        if (normalizedFileName.includes(normalizedBaseName) ||
            normalizedBaseName.includes(normalizedFileName)) {
            results.push(file);
        }
    }

    return results;
}

// Fonction principale
async function main() {
    console.log('Recherche des workflows dans la structure non standard...');
    const nonStandardFiles = findWorkflowFiles(NON_STANDARD_PATH);

    console.log(`${nonStandardFiles.length} fichiers workflow trouvés dans la structure non standard.`);

    if (nonStandardFiles.length === 0) {
        console.log('Aucun fichier à migrer.');
        return;
    }

    // Créer le rapport de duplication
    const reportPath = createDuplicationReport(nonStandardFiles);
    console.log(`Rapport de duplication généré: ${reportPath}`);

    console.log('\nPour une migration automatique des fichiers, exécutez:');
    console.log('node cleanup-scripts/standardize-workflow-structure.js --migrate');

    // Si l'argument --migrate est présent, déplacer les fichiers
    if (process.argv.includes('--migrate')) {
        console.log('\nMigration des fichiers...');

        for (const file of nonStandardFiles) {
            const targetPath = getTargetPath(file);
            const backupPath = path.join(BACKUP_PATH, path.relative(NON_STANDARD_PATH, file));

            // Créer le dossier cible s'il n'existe pas
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Créer le dossier de backup s'il n'existe pas
            const backupDir = path.dirname(backupPath);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Copier le fichier vers le backup
            fs.copyFileSync(file, backupPath);
            console.log(`Fichier sauvegardé: ${backupPath}`);

            // Vérifier s'il existe déjà un fichier similaire à la destination
            const fileName = path.basename(file);
            const similarFiles = findSimilarFiles(STANDARD_PATH, fileName.replace('.workflow.ts', ''));

            if (similarFiles.length > 0) {
                console.log(`ATTENTION: Des fichiers similaires ont été trouvés pour ${fileName}:`);
                similarFiles.forEach(similarFile => {
                    console.log(`  - ${path.relative(PROJECT_ROOT, similarFile)}`);
                });
                console.log(`Le fichier ne sera pas déplacé automatiquement. Une revue manuelle est nécessaire.`);
            } else {
                // Déplacer le fichier vers la structure standard
                fs.copyFileSync(file, targetPath);
                console.log(`Fichier migré: ${path.relative(PROJECT_ROOT, targetPath)}`);

                // Ajuster les imports si nécessaire (à implémenter)
                // adjustImports(targetPath);
            }
        }

        console.log('\nMigration terminée. Revue manuelle recommandée pour les ajustements d\'imports.');
    }
}

main().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});