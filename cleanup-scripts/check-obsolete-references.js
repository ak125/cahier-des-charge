/**
 * Script pour identifier les références obsolètes dans le code
 * 
 * Ce script recherche les références à des fichiers qui n'existent plus,
 * notamment après les opérations de déduplication et de consolidation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = '/workspaces/cahier-des-charge';
const REPORT_PATH = path.join(PROJECT_ROOT, 'cleanup-report/references-obsoletes.md');
const EXCLUDED_DIRS = ['node_modules', '.git', 'backup'];

// Obtenir la liste des fichiers supprimés (à partir des rapports de déduplication)
function getDeletedFiles() {
    const deletedFiles = new Set();

    // Analyser les rapports de déduplication pour trouver les fichiers supprimés
    const reportsDir = path.join(PROJECT_ROOT, 'cleanup-report');
    const reportFiles = fs.readdirSync(reportsDir)
        .filter(file => file.includes('deduplication') && file.endsWith('.md'));

    reportFiles.forEach(reportFile => {
        const content = fs.readFileSync(path.join(reportsDir, reportFile), 'utf-8');
        const deletedMatches = content.matchAll(/[Ff]ichier supprimé:?\s*([\w\/\.-]+)/g);
        for (const match of deletedMatches) {
            if (match[1]) {
                deletedFiles.add(match[1]);
            }
        }
    });

    return Array.from(deletedFiles);
}

// Chercher les références aux fichiers supprimés dans le code
function findObsoleteReferences(deletedFiles) {
    const references = [];

    deletedFiles.forEach(file => {
        const filename = path.basename(file);
        const filenameWithoutExt = filename.split('.')[0];

        // Utiliser grep pour chercher les références au fichier
        try {
            const grepResult = execSync(
                `grep -r --include="*.{ts,js,json}" "${filenameWithoutExt}" ${PROJECT_ROOT} | grep -v "node_modules" | grep -v "backup" | grep -v "cleanup-report"`,
                { encoding: 'utf-8' }
            ).trim();

            if (grepResult) {
                const lines = grepResult.split('\n');
                lines.forEach(line => {
                    if (line) {
                        references.push({
                            deletedFile: file,
                            reference: line
                        });
                    }
                });
            }
        } catch (error) {
            // grep retourne un code d'erreur quand il ne trouve rien, ce n'est pas une erreur pour nous
            if (error.status !== 1) {
                console.error(`Erreur lors de la recherche de références pour ${file}:`, error);
            }
        }
    });

    return references;
}

// Générer un rapport des références obsolètes
function generateReport(references) {
    const content = `# Rapport des Références Obsolètes

Date: ${new Date().toISOString()}

Ce rapport liste les références potentiellement obsolètes dans le code, 
pointant vers des fichiers qui ont été supprimés lors des opérations de déduplication et de consolidation.

## Références trouvées (${references.length})

${references.length > 0
            ? references.map(ref => `- Fichier supprimé: \`${ref.deletedFile}\`\n  - Référence: \`${ref.reference}\`\n`).join('\n')
            : '**Aucune référence obsolète trouvée.**'
        }

## Recommandations

${references.length > 0
            ? `Les références ci-dessus devraient être vérifiées et mises à jour pour pointer vers les fichiers consolidés correspondants.`
            : `Toutes les références ont été correctement mises à jour. Aucune action supplémentaire n'est nécessaire.`
        }
`;

    fs.writeFileSync(REPORT_PATH, content, 'utf-8');
    console.log(`Rapport généré: ${REPORT_PATH}`);
}

// Fonction principale
async function main() {
    console.log('Analyse des références obsolètes...');

    // 1. Obtenir la liste des fichiers supprimés
    console.log('Récupération de la liste des fichiers supprimés...');
    const deletedFiles = getDeletedFiles();
    console.log(`${deletedFiles.length} fichiers supprimés identifiés.`);

    // 2. Chercher les références aux fichiers supprimés
    console.log('Recherche des références obsolètes...');
    const references = findObsoleteReferences(deletedFiles);
    console.log(`${references.length} références potentiellement obsolètes trouvées.`);

    // 3. Générer un rapport
    console.log('Génération du rapport...');
    generateReport(references);

    console.log('\nAnalyse terminée avec succès!');
}

main().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});