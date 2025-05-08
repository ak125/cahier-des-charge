/**
 * Script de vérification de l'intégrité du projet après nettoyage
 * 
 * Ce script effectue des tests de base pour s'assurer que le processus
 * de nettoyage n'a pas cassé de fonctionnalités essentielles.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = '/workspaces/cahier-des-charge';
const REPORT_PATH = path.join(PROJECT_ROOT, 'cleanup-report/verification-integrite.md');

// Vérifier que les fichiers importants existent
function checkCriticalFiles() {
    console.log('Vérification des fichiers critiques...');

    const criticalFiles = [
        'package.json',
        'tsconfig.json',
        'pnpm-workspace.yaml',
        'nx.json'
    ];

    const results = criticalFiles.map(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        const exists = fs.existsSync(filePath);
        return {
            file,
            exists,
            status: exists ? 'OK' : 'MANQUANT'
        };
    });

    console.log(`${results.filter(r => r.exists).length}/${results.length} fichiers critiques trouvés.`);
    return results;
}

// Vérifier que les dépendances sont correctement installées
function checkDependencies() {
    console.log('Vérification des dépendances...');

    try {
        execSync('npm list --depth=0', {
            cwd: PROJECT_ROOT,
            stdio: ['ignore', 'ignore', 'ignore']
        });
        return { success: true, error: null };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Vérifier la syntaxe TypeScript
function checkTypeScript() {
    console.log('Vérification de la syntaxe TypeScript...');

    try {
        execSync('npx tsc --noEmit', {
            cwd: PROJECT_ROOT,
            stdio: ['ignore', 'ignore', 'ignore']
        });
        return { success: true, error: null };
    } catch (error) {
        return {
            success: false,
            error: `Erreurs TypeScript détectées: ${error.message}`
        };
    }
}

// Vérifier l'intégrité des imports dans les fichiers de workflows
function checkWorkflowImports() {
    console.log('Vérification des imports dans les workflows...');

    const workflowDirs = [
        'packages/business/temporal/workflows',
        'packages/business/src/temporal'
    ];

    let allSuccessful = true;
    const errors = [];

    workflowDirs.forEach(dir => {
        const fullDir = path.join(PROJECT_ROOT, dir);
        if (fs.existsSync(fullDir)) {
            try {
                // Rechercher les imports qui pourraient être problématiques
                const result = execSync(
                    `grep -r "import .* from" ${fullDir} | grep -v "node_modules"`,
                    { encoding: 'utf-8' }
                ).trim();

                // Vérifier si les fichiers importés existent
                const importMatches = result.matchAll(/from ['"]([^'"]+)['"]/g);
                for (const match of importMatches) {
                    const importPath = match[1];
                    if (!importPath.startsWith('.')) continue; // Ignorer les packages npm

                    // Construire le chemin absolu du fichier importé
                    const importedFile = path.resolve(fullDir, importPath);
                    if (!fs.existsSync(importedFile) && !fs.existsSync(`${importedFile}.ts`) && !fs.existsSync(`${importedFile}.js`) && !fs.existsSync(`${importedFile}/index.ts`)) {
                        errors.push(`Import introuvable: ${importPath} dans ${fullDir}`);
                        allSuccessful = false;
                    }
                }
            } catch (error) {
                // grep retourne une erreur s'il ne trouve rien, ce n'est pas une erreur pour nous
                if (error.status !== 1) {
                    errors.push(`Erreur lors de l'analyse des imports dans ${dir}: ${error.message}`);
                    allSuccessful = false;
                }
            }
        }
    });

    return { success: allSuccessful, errors };
}

// Générer un rapport de vérification
function generateReport(criticalFiles, dependencies, typescript, workflowImports) {
    const content = `# Rapport de Vérification d'Intégrité du Projet

Date: ${new Date().toISOString()}

Ce rapport présente les résultats de la vérification de l'intégrité du projet 
après les opérations de nettoyage et de déduplication.

## Fichiers Critiques

${criticalFiles.map(file => `- ${file.file}: **${file.status}**`).join('\n')}

## Dépendances

${dependencies.success
            ? '✅ Les dépendances sont correctement installées.'
            : `❌ Problèmes détectés avec les dépendances:\n\`\`\`\n${dependencies.error}\n\`\`\``
        }

## Validation TypeScript

${typescript.success
            ? '✅ Aucune erreur TypeScript détectée.'
            : `❌ Problèmes TypeScript détectés:\n\`\`\`\n${typescript.error}\n\`\`\``
        }

## Imports dans les Workflows

${workflowImports.success
            ? '✅ Tous les imports sont valides.'
            : `❌ Problèmes détectés avec les imports:\n${workflowImports.errors.map(err => `- ${err}`).join('\n')}`
        }

## Conclusion

${criticalFiles.every(file => file.exists) && dependencies.success && typescript.success && workflowImports.success
            ? '✅ **Le projet est en bon état.** Tous les tests d\'intégrité ont réussi.'
            : '⚠️ **Attention : Des problèmes ont été détectés.** Veuillez consulter les détails ci-dessus et résoudre les problèmes avant de continuer.'
        }
`;

    fs.writeFileSync(REPORT_PATH, content, 'utf-8');
    console.log(`Rapport généré: ${REPORT_PATH}`);
}

// Fonction principale
async function main() {
    console.log('Vérification de l\'intégrité du projet...');

    // 1. Vérifier les fichiers critiques
    const criticalFiles = checkCriticalFiles();

    // 2. Vérifier les dépendances
    const dependencies = checkDependencies();

    // 3. Vérifier la syntaxe TypeScript
    const typescript = checkTypeScript();

    // 4. Vérifier les imports dans les workflows
    const workflowImports = checkWorkflowImports();

    // 5. Générer un rapport
    generateReport(criticalFiles, dependencies, typescript, workflowImports);

    console.log('\nVérification terminée avec succès!');

    // Retourner un code d'erreur si des problèmes ont été détectés
    const success = criticalFiles.every(file => file.exists) &&
        dependencies.success &&
        typescript.success &&
        workflowImports.success;

    if (!success) {
        console.log('⚠️ Des problèmes ont été détectés. Consultez le rapport pour plus de détails.');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});