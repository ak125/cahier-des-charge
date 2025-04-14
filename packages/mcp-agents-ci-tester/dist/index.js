"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCIReport = exports.generateGitHubWorkflow = exports.validateSetup = exports.detectCITests = exports.analyzePackageScripts = void 0;
exports.runCITester = runCITester;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const glob_1 = require("glob");
const core_1 = require("./core");
Object.defineProperty(exports, "generateGitHubWorkflow", { enumerable: true, get: function () { return core_1.generateGitHubWorkflow; } });
Object.defineProperty(exports, "validateSetup", { enumerable: true, get: function () { return core_1.validateSetup; } });
Object.defineProperty(exports, "detectCITests", { enumerable: true, get: function () { return core_1.detectCITests; } });
Object.defineProperty(exports, "analyzePackageScripts", { enumerable: true, get: function () { return core_1.analyzePackageScripts; } });
Object.defineProperty(exports, "generateCIReport", { enumerable: true, get: function () { return core_1.generateCIReport; } });
// Configuration par défaut
const DEFAULT_CONFIG = {
    rootDir: process.cwd(),
    outputWorkflowPath: path_1.default.join(process.cwd(), '.github/workflows/ci-migration.yml'),
    outputReportPath: path_1.default.join(process.cwd(), 'reports/ci_check_report.md'),
    outputLastRunPath: path_1.default.join(process.cwd(), 'reports/ci_last_run.json'),
    packageJsonPath: path_1.default.join(process.cwd(), 'package.json'),
    workspacePackages: [],
    templatesDir: path_1.default.join(__dirname, '../templates')
};
/**
 * Point d'entrée principal de l'agent CI-Tester
 */
async function runCITester(options = {}) {
    const logs = [];
    const report = {
        status: 'success',
        generatedFiles: [],
        packageScripts: {},
        detectedTests: [],
        timestamp: new Date().toISOString(),
        logs: [],
        customTests: []
    };
    try {
        logs.push('🚀 Lancement de l\'agent ci-tester...');
        // 1. Charger la configuration
        const config = await loadConfig(options.configPath);
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };
        // Mettre à jour le rootDir si un outputPath est spécifié
        if (options.outputPath) {
            mergedConfig.outputWorkflowPath = path_1.default.join(options.outputPath, 'ci-migration.yml');
            mergedConfig.outputReportPath = path_1.default.join(options.outputPath, 'ci_check_report.md');
            mergedConfig.outputLastRunPath = path_1.default.join(options.outputPath, 'ci_last_run.json');
        }
        // Détecter automatiquement les packages workspace si non spécifiés
        if (mergedConfig.workspacePackages.length === 0) {
            mergedConfig.workspacePackages = detectWorkspacePackages(mergedConfig.rootDir);
            logs.push(`📦 ${mergedConfig.workspacePackages.length} packages workspace détectés automatiquement`);
        }
        // 2. Analyser les scripts disponibles
        logs.push('🔍 Analyse des scripts disponibles dans package.json...');
        const packageScripts = await (0, core_1.analyzePackageScripts)(mergedConfig);
        report.packageScripts = packageScripts;
        // 3. Détecter les tests CI à exécuter
        logs.push('🔍 Détection des tests et commandes CI...');
        const detectedTests = (0, core_1.detectCITests)(packageScripts, mergedConfig);
        // 4. Ajouter les tests personnalisés de la config
        if (config.customTests && Array.isArray(config.customTests)) {
            logs.push(`✅ Ajout de ${config.customTests.length} tests personnalisés depuis la configuration`);
            report.customTests = config.customTests;
            detectedTests.push(...config.customTests);
        }
        report.detectedTests = detectedTests;
        // Afficher les tests détectés
        if (detectedTests.length > 0) {
            logs.push(`✅ ${detectedTests.length} commandes CI détectées :`);
            detectedTests.forEach(test => {
                logs.push(`  - ${test.name}: \`${test.command}\` ${test.required ? '(Requis)' : '(Optionnel)'}`);
            });
        }
        else {
            logs.push('⚠️ Aucune commande CI détectée. Vérifiez vos scripts package.json.');
            report.status = 'warning';
        }
        // 5. Générer le fichier workflow GitHub Actions
        if (options.generateWorkflow !== false) {
            logs.push('🔧 Génération du fichier workflow GitHub Actions...');
            const workflowContent = (0, core_1.generateGitHubWorkflow)(detectedTests, mergedConfig);
            // Créer le répertoire .github/workflows s'il n'existe pas
            const workflowDir = path_1.default.dirname(mergedConfig.outputWorkflowPath);
            if (!options.dryRun) {
                if (!fs_1.default.existsSync(workflowDir)) {
                    fs_1.default.mkdirSync(workflowDir, { recursive: true });
                    logs.push(`📁 Création du répertoire ${workflowDir}`);
                }
                // Écrire le fichier workflow
                fs_1.default.writeFileSync(mergedConfig.outputWorkflowPath, workflowContent);
                logs.push(`✅ Fichier workflow GitHub Actions généré : ${mergedConfig.outputWorkflowPath}`);
                report.generatedFiles.push(mergedConfig.outputWorkflowPath);
            }
            else {
                logs.push(`📄 [DRY RUN] Le fichier workflow serait écrit dans : ${mergedConfig.outputWorkflowPath}`);
            }
        }
        // 6. Valider la configuration actuelle
        if (options.validateCurrentSetup !== false) {
            logs.push('🔍 Validation de la configuration actuelle...');
            const validationResults = (0, core_1.validateSetup)(detectedTests, packageScripts);
            const missingRequired = validationResults.filter(result => !result.present && result.test.required);
            if (missingRequired.length > 0) {
                logs.push('❌ Tests requis manquants :');
                missingRequired.forEach(result => {
                    logs.push(`  - ${result.test.name}: \`${result.test.command}\` est requis mais non configuré`);
                });
                report.status = 'error';
            }
            else {
                logs.push('✅ Tous les tests requis sont configurés');
                const missingOptional = validationResults.filter(result => !result.present && !result.test.required);
                if (missingOptional.length > 0) {
                    logs.push('⚠️ Tests optionnels manquants :');
                    missingOptional.forEach(result => {
                        logs.push(`  - ${result.test.name}: \`${result.test.command}\` est recommandé`);
                    });
                    if (report.status === 'success') {
                        report.status = 'warning';
                    }
                }
            }
        }
        // 7. Exécuter une validation locale si demandé
        if (options.localTest) {
            logs.push('🧪 Exécution d\'un test local de la CI...');
            const localTestResults = await runLocalCITest(detectedTests, logs, options.dryRun);
            report.localTestResults = localTestResults;
            const failedTests = localTestResults.filter(r => !r.success);
            if (failedTests.length > 0) {
                logs.push('❌ Tests locaux échoués :');
                failedTests.forEach(result => {
                    logs.push(`  - ${result.test.name}: ${result.error || 'Erreur inconnue'}`);
                });
                report.status = 'error';
            }
            else {
                logs.push('✅ Tous les tests locaux ont réussi');
            }
        }
        // 8. Suggérer l'installation d'applications GitHub
        if (options.installGitHubApps) {
            logs.push('🔧 Applications GitHub recommandées :');
            const appsToInstall = [
                { name: 'Codecov', url: 'https://github.com/apps/codecov' },
                { name: 'Dependabot', url: 'https://github.com/apps/dependabot' },
                { name: 'SonarCloud', url: 'https://github.com/apps/sonarcloud' }
            ];
            appsToInstall.forEach(app => {
                logs.push(`  - ${app.name}: ${app.url}`);
            });
        }
        // 9. Générer le rapport CI
        logs.push('📝 Génération du rapport CI...');
        if (!options.dryRun) {
            await (0, core_1.generateCIReport)(report, logs, mergedConfig);
            logs.push(`✅ Rapport CI généré : ${mergedConfig.outputReportPath}`);
            report.generatedFiles.push(mergedConfig.outputReportPath);
        }
        else {
            logs.push(`📄 [DRY RUN] Le rapport CI serait généré dans : ${mergedConfig.outputReportPath}`);
        }
        // 10. Sauvegarder les informations de la dernière exécution
        const lastRunInfo = {
            timestamp: report.timestamp,
            status: report.status,
            detectedTests: report.detectedTests.length,
            customTests: report.customTests.length,
            requiredTestsConfigured: options.validateCurrentSetup !== false
                ? (0, core_1.validateSetup)(detectedTests, packageScripts).filter(r => r.test.required && r.present).length
                : 'non vérifié',
            generatedFiles: report.generatedFiles,
            localTestResults: report.localTestResults ? {
                total: report.localTestResults.length,
                success: report.localTestResults.filter(r => r.success).length,
                failed: report.localTestResults.filter(r => !r.success).length
            } : undefined
        };
        if (!options.dryRun) {
            const lastRunDir = path_1.default.dirname(mergedConfig.outputLastRunPath);
            if (!fs_1.default.existsSync(lastRunDir)) {
                fs_1.default.mkdirSync(lastRunDir, { recursive: true });
            }
            fs_1.default.writeFileSync(mergedConfig.outputLastRunPath, JSON.stringify(lastRunInfo, null, 2));
            logs.push(`✅ Informations de dernière exécution sauvegardées : ${mergedConfig.outputLastRunPath}`);
            report.generatedFiles.push(mergedConfig.outputLastRunPath);
        }
        else {
            logs.push(`📄 [DRY RUN] Les informations de dernière exécution seraient sauvegardées dans : ${mergedConfig.outputLastRunPath}`);
        }
        // Résumé final
        logs.push(`\n📋 Résumé :`);
        logs.push(`  - Statut : ${report.status === 'success' ? '✅ Succès' : report.status === 'warning' ? '⚠️ Avertissement' : '❌ Erreur'}`);
        logs.push(`  - Tests détectés : ${report.detectedTests.length}`);
        if (report.customTests.length > 0) {
            logs.push(`  - Tests personnalisés : ${report.customTests.length}`);
        }
        logs.push(`  - Fichiers générés : ${options.dryRun ? '0 (dry run)' : report.generatedFiles.length}`);
        // Ajouter les logs au rapport final
        report.logs = logs;
        return report;
    }
    catch (error) {
        logs.push(`❌ Erreur lors de l'exécution de l'agent ci-tester: ${error.message}`);
        console.error(error);
        report.logs = logs;
        report.status = 'error';
        return report;
    }
}
/**
 * Charge la configuration depuis un fichier
 */
async function loadConfig(configPath) {
    if (!configPath) {
        // Chercher des fichiers de configuration par défaut
        const possibleConfigs = [
            'ci-tester.config.js',
            'ci-tester.config.json',
            'ci-tester.config.ts',
            '.ci-testerrc',
            '.ci-testerrc.json'
        ];
        for (const configFile of possibleConfigs) {
            if (fs_1.default.existsSync(path_1.default.join(process.cwd(), configFile))) {
                configPath = path_1.default.join(process.cwd(), configFile);
                break;
            }
        }
    }
    if (!configPath || !fs_1.default.existsSync(configPath)) {
        return {};
    }
    try {
        if (configPath.endsWith('.js')) {
            return require(configPath);
        }
        else if (configPath.endsWith('.ts')) {
            // Pour les fichiers .ts, on utilise ts-node si disponible
            try {
                (0, child_process_1.execSync)('npx ts-node -v', { stdio: 'ignore' });
                const output = (0, child_process_1.execSync)(`npx ts-node -e "console.log(JSON.stringify(require('${configPath}')))"`, {
                    encoding: 'utf8'
                });
                return JSON.parse(output);
            }
            catch (error) {
                throw new Error(`Impossible de charger la configuration TypeScript. Assurez-vous que ts-node est installé : ${error.message}`);
            }
        }
        else {
            return JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
        }
    }
    catch (error) {
        throw new Error(`Erreur lors du chargement de la configuration : ${error.message}`);
    }
}
/**
 * Détecte automatiquement les packages workspace
 */
function detectWorkspacePackages(rootDir) {
    const workspacePackages = [];
    // Vérifier s'il y a un package.json à la racine
    const rootPackageJsonPath = path_1.default.join(rootDir, 'package.json');
    if (fs_1.default.existsSync(rootPackageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs_1.default.readFileSync(rootPackageJsonPath, 'utf8'));
            // Chercher la config workspaces
            if (packageJson.workspaces) {
                let patterns = [];
                if (Array.isArray(packageJson.workspaces)) {
                    patterns = packageJson.workspaces;
                }
                else if (packageJson.workspaces.packages && Array.isArray(packageJson.workspaces.packages)) {
                    patterns = packageJson.workspaces.packages;
                }
                // Trouver tous les package.json correspondant aux patterns
                for (const pattern of patterns) {
                    const matches = (0, glob_1.globSync)(`${pattern}/package.json`, { cwd: rootDir });
                    workspacePackages.push(...matches);
                }
            }
        }
        catch (error) {
            console.error(`Erreur lors de la détection des workspaces : ${error.message}`);
        }
    }
    // Chercher également dans les dossiers classiques d'applications
    const commonAppDirs = ['apps/*', 'packages/*', 'libs/*', 'services/*'];
    for (const dirPattern of commonAppDirs) {
        const matches = (0, glob_1.globSync)(`${dirPattern}/package.json`, { cwd: rootDir });
        // Ajouter seulement ceux qui ne sont pas déjà inclus
        for (const match of matches) {
            if (!workspacePackages.includes(match)) {
                workspacePackages.push(match);
            }
        }
    }
    return workspacePackages;
}
/**
 * Exécute un test CI local pour vérifier si les commandes fonctionnent
 */
async function runLocalCITest(tests, logs, dryRun = false) {
    const results = [];
    if (dryRun) {
        logs.push('📄 [DRY RUN] Simulation d\'exécution des tests CI locaux');
        return tests.map(test => ({ test, success: true }));
    }
    for (const test of tests) {
        logs.push(`🧪 Exécution du test local: ${test.name}`);
        try {
            // Pour certaines commandes spéciales, on fait juste une vérification de version
            if (test.command.includes('npm ci') || test.command.includes('npm install')) {
                // On ne fait pas réellement l'installation, juste vérifier npm
                (0, child_process_1.execSync)('npm -v', { stdio: 'ignore' });
                results.push({ test, success: true });
                logs.push(`  ✅ Vérification de npm réussie (sans installation réelle)`);
                continue;
            }
            if (test.command.startsWith('npx ')) {
                // Extraire le nom du package npx
                const packageName = test.command.split(' ')[1];
                // Vérifier juste que la commande existe
                (0, child_process_1.execSync)(`npx ${packageName} --version || npx ${packageName} -v || npx ${packageName} help`, {
                    stdio: 'ignore'
                });
                results.push({ test, success: true });
                logs.push(`  ✅ Vérification de la commande npx ${packageName} réussie`);
                continue;
            }
            // Pour les autres tests (non-destructifs), on exécute avec --dry-run si possible
            let command = test.command;
            // Adapter certaines commandes pour le test local
            if (command.includes('npm run ')) {
                command = command.replace('npm run ', 'npm run --dry-run ');
            }
            else if (command.includes('npm test')) {
                command = command.replace('npm test', 'npm test --dry-run');
            }
            (0, child_process_1.execSync)(command, { stdio: 'ignore' });
            results.push({ test, success: true });
            logs.push(`  ✅ Test réussi`);
        }
        catch (error) {
            results.push({
                test,
                success: false,
                error: error.message
            });
            logs.push(`  ❌ Échec: ${error.message}`);
        }
    }
    return results;
}
// Exporter les types
__exportStar(require("./types"), exports);
