#!/usr/bin/env node

/**
 * Script de validation post-migration pour vérifier l'intégrité du projet
 * après restructuration.
 * 
 * Utilisation: node validate-migration.js [--verbose] [--report-file=nom_du_fichier]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Options par défaut
const options = {
    verbose: false,
    reportFile: path.join(process.cwd(), 'validation-report.md'),
    baseDir: process.cwd()
};

// Traitement des arguments
process.argv.slice(2).forEach(arg => {
    if (arg === '--verbose') {
        options.verbose = true;
    } else if (arg.startsWith('--report-file=')) {
        options.reportFile = arg.split('=')[1];
    }
});

console.log('🔍 Validation de la migration...');

// Résultats de validation
const results = {
    success: [],
    warnings: [],
    errors: [],
    summary: {
        packageCount: 0,
        importCount: 0,
        testCount: 0
    }
};

// Fonction d'aide pour ajouter des messages aux résultats
function addResult(type, message, details = null) {
    results[type].push({ message, details });
    if (options.verbose) {
        const icon = type === 'success' ? '✅' : (type === 'warnings' ? '⚠️' : '❌');
        console.log(`${icon} ${message}`);
        if (details) console.log(`   ${details}`);
    }
}

// Vérification des dossiers requis
function checkRequiredDirectories() {
    console.log('\n📁 Vérification des dossiers requis...');

    const requiredDirs = [
        'apps',
        'packages',
        'packages/agents',
        'packages/orchestration',
        'packages/business',
        'packages/ui',
        'packages/utils',
        'tools',
        'tools/scripts',
        'docker',
        'docs',
        'prisma'
    ];

    requiredDirs.forEach(dir => {
        const fullPath = path.join(options.baseDir, dir);
        if (fs.existsSync(fullPath)) {
            addResult('success', `Le dossier ${dir} existe.`);
        } else {
            addResult('errors', `Le dossier ${dir} est manquant.`);
        }
    });
}

// Vérification des fichiers index.ts
function checkIndexFiles() {
    console.log('\n📄 Vérification des fichiers index.ts...');

    const indexPaths = [
        'packages/agents/index.ts',
        'packages/agents/base/index.ts',
        'packages/orchestration/index.ts',
        'packages/business/index.ts',
        'packages/ui/index.ts',
        'packages/utils/index.ts'
    ];

    indexPaths.forEach(filePath => {
        const fullPath = path.join(options.baseDir, filePath);
        if (fs.existsSync(fullPath)) {
            addResult('success', `Le fichier d'index ${filePath} existe.`);
        } else {
            addResult('warnings', `Le fichier d'index ${filePath} est manquant.`);
        }
    });
}

// Vérification des fichiers de configuration
function checkConfigFiles() {
    console.log('\n⚙️ Vérification des fichiers de configuration...');

    const configFiles = [
        { path: 'tsconfig.json', searchText: '@packages/agents' },
        { path: 'tsconfig.json', searchText: '@packages/orchestration' },
        { path: 'nx.json', searchText: 'workspaceLayout' },
        { path: 'nx.json', searchText: '"appsDir": "apps"' }
    ];

    configFiles.forEach(({ path: filePath, searchText }) => {
        const fullPath = path.join(options.baseDir, filePath);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(searchText)) {
                addResult('success', `Le fichier ${filePath} contient "${searchText}".`);
            } else {
                addResult('warnings', `Le fichier ${filePath} ne contient pas "${searchText}".`);
            }
        } else {
            addResult('errors', `Le fichier ${filePath} est manquant.`);
        }
    });
}

// Comptage des paquets et fichiers
function countPackagesAndFiles() {
    console.log('\n📊 Analyse des statistiques du projet...');

    try {
        // Compter les packages
        const packageDirs = fs.readdirSync(path.join(options.baseDir, 'packages'));
        results.summary.packageCount = packageDirs.length;

        // Compter les imports utilisant @packages
        let importCount = 0;
        try {
            const grepOutput = execSync(`grep -r "from '@packages/" --include="*.ts" --include="*.tsx" ${options.baseDir}`, { encoding: 'utf8' });
            importCount = grepOutput.split('\n').length - 1; // -1 pour la dernière ligne vide
        } catch (err) {
            // grep renvoie un code d'erreur s'il ne trouve rien, ce n'est pas une vraie erreur
            importCount = 0;
        }
        results.summary.importCount = importCount;

        // Compter les tests
        try {
            const grepTestOutput = execSync(`find ${options.baseDir} -name "*.spec.ts" -o -name "*.test.ts" | wc -l`, { encoding: 'utf8' });
            results.summary.testCount = parseInt(grepTestOutput.trim());
        } catch (err) {
            results.summary.testCount = 0;
        }

        addResult('success', `Structure analysée: ${results.summary.packageCount} packages, ${results.summary.importCount} imports @packages, ${results.summary.testCount} fichiers de test.`);
    } catch (err) {
        addResult('errors', `Erreur lors de l'analyse des statistiques: ${err.message}`);
    }
}

// Détection de fichiers dans l'ancienne structure
function detectOldStructureFiles() {
    console.log('\n🔍 Détection de fichiers dans l\'ancienne structure...');

    const oldPaths = [
        'agents',
        'orchestration',
        'orchestrators',
        'utils'
    ];

    oldPaths.forEach(oldPath => {
        const fullPath = path.join(options.baseDir, oldPath);
        if (fs.existsSync(fullPath)) {
            try {
                const fileCount = execSync(`find ${fullPath} -type f | wc -l`, { encoding: 'utf8' }).trim();
                if (parseInt(fileCount) > 0) {
                    addResult('warnings', `Le dossier ${oldPath} existe toujours et contient ${fileCount} fichiers.`);
                }
            } catch (err) {
                addResult('warnings', `Impossible d'analyser le dossier ${oldPath}: ${err.message}`);
            }
        }
    });
}

// Vérification des scripts CI/CD
function checkCICDScripts() {
    console.log('\n🔄 Vérification des scripts CI/CD...');

    const cicdFiles = [
        '.github/workflows',
        'earthfile'
    ];

    cicdFiles.forEach(filePath => {
        const fullPath = path.join(options.baseDir, filePath);
        if (fs.existsSync(fullPath)) {
            addResult('success', `Le fichier/dossier CI/CD ${filePath} existe.`);
        } else {
            addResult('warnings', `Le fichier/dossier CI/CD ${filePath} est manquant.`);
        }
    });
}

// Génération du rapport
function generateReport() {
    console.log('\n📝 Génération du rapport de validation...');

    let report = `# Rapport de Validation de Migration\n\n`;
    report += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;

    // Résumé
    report += `## Résumé\n\n`;
    report += `- Succès: ${results.success.length}\n`;
    report += `- Avertissements: ${results.warnings.length}\n`;
    report += `- Erreurs: ${results.errors.length}\n`;
    report += `- Packages: ${results.summary.packageCount}\n`;
    report += `- Imports @packages: ${results.summary.importCount}\n`;
    report += `- Fichiers de test: ${results.summary.testCount}\n\n`;

    // Détails
    if (results.errors.length > 0) {
        report += `## Erreurs\n\n`;
        results.errors.forEach(item => {
            report += `- ${item.message}\n`;
            if (item.details) report += `  - ${item.details}\n`;
        });
        report += `\n`;
    }

    if (results.warnings.length > 0) {
        report += `## Avertissements\n\n`;
        results.warnings.forEach(item => {
            report += `- ${item.message}\n`;
            if (item.details) report += `  - ${item.details}\n`;
        });
        report += `\n`;
    }

    // Étapes suivantes
    report += `## Prochaines étapes recommandées\n\n`;

    if (results.errors.length > 0) {
        report += `1. Corriger les erreurs identifiées dans ce rapport\n`;
    }

    if (results.warnings.length > 0) {
        report += `${results.errors.length > 0 ? '2' : '1'}. Examiner les avertissements et résoudre les problèmes potentiels\n`;
    }

    const nextStep = results.errors.length + (results.warnings.length > 0 ? 1 : 0);
    report += `${nextStep + 1}. Exécuter les tests de l'application pour vérifier son fonctionnement\n`;
    report += `${nextStep + 2}. Mettre à jour la documentation avec la nouvelle structure\n`;
    report += `${nextStep + 3}. Exécuter un build complet avec \`nx run-many --target=build --all\`\n`;

    fs.writeFileSync(options.reportFile, report);
    console.log(`✅ Rapport généré: ${options.reportFile}`);
}

// Exécution des vérifications
try {
    checkRequiredDirectories();
    checkIndexFiles();
    checkConfigFiles();
    countPackagesAndFiles();
    detectOldStructureFiles();
    checkCICDScripts();
    generateReport();

    console.log('\n✅ Validation terminée!');
    console.log(`📊 Résumé: ${results.success.length} succès, ${results.warnings.length} avertissements, ${results.errors.length} erreurs.`);
    console.log(`📝 Rapport complet disponible dans: ${options.reportFile}`);

    if (results.errors.length > 0) {
        process.exit(1);
    }
} catch (err) {
    console.error(`\n❌ Erreur lors de la validation: ${err.message}`);
    process.exit(1);
}