#!/usr/bin/env node

/**
 * Script pour vérifier si les tests utilisent les agents consolidés
 * 
 * Ce script analyse les fichiers de test pour détecter s'ils font référence
 * aux anciens chemins d'agents (dossiers packages/migrated-agents) plutôt qu'aux
 * nouvelles versions consolidées dans l'architecture à trois couches.
 * 
 * Usage:
 *   node check-test-imports.js
 * 
 * Options:
 *   --fix        Tente de corriger automatiquement les imports
 *   --report     Génère un rapport détaillé (par défaut)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Configuration
const REPORT_PATH = path.join(projectRoot, 'cleanup-report', 'test-imports-report.md');

// Options de ligne de commande
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const shouldReport = !args.includes('--no-report');

// Motifs pour les anciens imports à détecter
const DEPRECATED_IMPORT_PATTERNS = [
    // Import d'agents migrés
    /from\s+['"].*packages\/migrated-agents\/.*['"]/,
    // Import relatifs d'agents migrés
    /from\s+['"]\.\..*\/migrated-agents\/.*['"]/,
    // Autres formats possibles
    /require\(['"].*packages\/migrated-agents\/.*['"]\)/,
];

// Modèle pour suggérer des remplacements
const REPLACEMENT_SUGGESTIONS = {
    // Format: "pattern à détecter" => "suggestion de remplacement"
    "migrated-agents/orchestration/monitor-agent": "orchestration/monitors/monitor-agent",
    "migrated-agents/orchestration/scheduler-agent": "orchestration/schedulers/scheduler-agent",
    "migrated-agents/coordination/bridge-agent": "coordination/bridges/bridge-agent",
    "migrated-agents/business/analyzer-agent": "business/analyzers/analyzer-agent",
    "migrated-agents/business/validator-agent": "business/validators/validator-agent",
    "migrated-agents/business/generator-agent": "business/generators/generator-agent",
    "migrated-agents/business/parser-agent": "business/parsers/parser-agent",
};

/**
 * Recherche les fichiers de test dans le projet
 */
function findTestFiles() {
    try {
        // Rechercher les fichiers de test avec différentes extensions et nomenclatures
        const command = `find ${projectRoot} -type f -not -path "*/node_modules/*" -not -path "*/backup/*" -not -path "*/dist/*" \\( -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" \\)`;
        const result = execSync(command, { encoding: 'utf8' });

        return result.trim().split('\n').filter(Boolean);
    } catch (error) {
        console.error(`Erreur lors de la recherche des fichiers de test: ${error.message}`);
        return [];
    }
}

/**
 * Analyse un fichier de test pour trouver des imports obsolètes
 */
function analyzeTestFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const issues = [];

        lines.forEach((line, index) => {
            DEPRECATED_IMPORT_PATTERNS.forEach(pattern => {
                if (pattern.test(line)) {
                    // Détermine le meilleur remplacement suggéré
                    let suggestion = "Utiliser les nouveaux chemins d'imports dans l'architecture à trois couches";

                    for (const [detectPattern, replaceSuggestion] of Object.entries(REPLACEMENT_SUGGESTIONS)) {
                        if (new RegExp(detectPattern).test(line)) {
                            suggestion = `Remplacer par l'import depuis ${replaceSuggestion}`;
                            break;
                        }
                    }

                    issues.push({
                        line: index + 1,
                        content: line.trim(),
                        suggestion
                    });
                }
            });
        });

        return {
            path: filePath,
            relativePath: path.relative(projectRoot, filePath),
            issues,
            hasIssues: issues.length > 0
        };
    } catch (error) {
        console.error(`Erreur lors de l'analyse du fichier ${filePath}: ${error.message}`);
        return {
            path: filePath,
            relativePath: path.relative(projectRoot, filePath),
            issues: [],
            hasIssues: false,
            error: error.message
        };
    }
}

/**
 * Tente de corriger automatiquement les imports obsolètes
 */
function tryToFixImport(filePath, issue) {
    // Lecture du contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;

    const line = issue.content;

    // Parcourir les modèles de remplacement et appliquer celui qui correspond
    let replaced = false;
    for (const [detectPattern, replaceSuggestion] of Object.entries(REPLACEMENT_SUGGESTIONS)) {
        const pattern = new RegExp(detectPattern, 'g');
        if (pattern.test(line)) {
            // Créer la ligne de remplacement
            const updatedLine = line.replace(pattern, replaceSuggestion);

            // Remplacer la ligne dans le contenu
            updatedContent = updatedContent.replace(line, updatedLine);
            replaced = true;
            break;
        }
    }

    if (replaced) {
        // Écrire le contenu mis à jour dans le fichier
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        return true;
    }

    return false;
}

/**
 * Génère un rapport au format Markdown
 */
function generateReport(results) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const totalFiles = results.length;
    const filesWithIssues = results.filter(r => r.hasIssues).length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    let report = `<!-- filepath: ${REPORT_PATH} -->\n`;
    report += `# Rapport de vérification des imports dans les tests\n\n`;
    report += `*Généré le ${timestamp}*\n\n`;
    report += `## Résumé\n\n`;
    report += `- **Fichiers de test analysés**: ${totalFiles}\n`;
    report += `- **Fichiers avec imports obsolètes**: ${filesWithIssues}\n`;
    report += `- **Total des imports à corriger**: ${totalIssues}\n\n`;

    if (filesWithIssues > 0) {
        report += `## Détails des problèmes\n\n`;

        results.filter(r => r.hasIssues).forEach(fileResult => {
            report += `### ${fileResult.relativePath}\n\n`;

            fileResult.issues.forEach(issue => {
                report += `- **Ligne ${issue.line}**: \`${issue.content}\`\n`;
                report += `  - *Suggestion*: ${issue.suggestion}\n`;
            });

            report += `\n`;
        });

        report += `## Comment corriger\n\n`;
        report += `Pour corriger automatiquement ces problèmes, exécutez :\n\n`;
        report += `\`\`\`bash\n`;
        report += `node tools/scripts/check-test-imports.js --fix\n`;
        report += `\`\`\`\n\n`;
        report += `Vous pouvez également corriger les problèmes manuellement en suivant les suggestions pour chaque fichier.\n`;

    } else {
        report += `## Félicitations! 🎉\n\n`;
        report += `Aucun import obsolète n'a été détecté dans les fichiers de test. Tous les tests utilisent les agents de la nouvelle architecture à trois couches.\n`;
    }

    return report;
}

/**
 * Fonction principale
 */
async function main() {
    // 1. Recherche des fichiers de test
    console.log("Recherche des fichiers de test dans le projet...");
    const testFiles = findTestFiles();
    console.log(`${testFiles.length} fichiers de test trouvés.`);

    if (testFiles.length === 0) {
        console.log("Aucun fichier de test trouvé. Vérifiez le chemin du projet.");
        return;
    }

    // 2. Analyse de chaque fichier de test
    console.log("Analyse des imports obsolètes...");
    const results = testFiles.map(filePath => analyzeTestFile(filePath));

    // 3. Afficher les résultats
    const filesWithIssues = results.filter(r => r.hasIssues);
    console.log(`${filesWithIssues.length} fichiers de test ont des imports obsolètes.`);

    // 4. Génération du rapport
    if (shouldReport) {
        const report = generateReport(results);

        // Créer le répertoire du rapport s'il n'existe pas
        const reportDir = path.dirname(REPORT_PATH);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        fs.writeFileSync(REPORT_PATH, report);
        console.log(`Rapport généré: ${REPORT_PATH}`);
    }

    // 5. Correction automatique si demandée
    if (shouldFix && filesWithIssues.length > 0) {
        console.log("Tentative de correction automatique des imports obsolètes...");

        let fixedCount = 0;
        let failedCount = 0;

        for (const fileResult of filesWithIssues) {
            let fileFixedCount = 0;

            for (const issue of fileResult.issues) {
                const isFixed = tryToFixImport(fileResult.path, issue);
                if (isFixed) {
                    fileFixedCount++;
                    fixedCount++;
                } else {
                    failedCount++;
                }
            }

            if (fileFixedCount > 0) {
                console.log(`  ✅ ${fileResult.relativePath}: ${fileFixedCount} imports corrigés`);
            }
        }

        console.log(`\nRésultat de la correction automatique:`);
        console.log(`- ${fixedCount} imports corrigés`);
        console.log(`- ${failedCount} imports n'ont pas pu être corrigés automatiquement`);

        if (failedCount > 0) {
            console.log(`\nCertains imports n'ont pas pu être corrigés automatiquement. Veuillez les corriger manuellement en consultant le rapport.`);
        }
    } else if (filesWithIssues.length > 0) {
        console.log(`\nPour corriger automatiquement les imports obsolètes, exécutez ce script avec l'option --fix:`);
        console.log(`node tools/scripts/check-test-imports.js --fix`);
    }
}

// Exécuter le script
main().catch(error => {
    console.error(`Erreur lors de l'exécution du script: ${error.message}`);
    process.exit(1);
});
