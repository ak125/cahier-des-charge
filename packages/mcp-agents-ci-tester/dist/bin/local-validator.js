#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
/**
 * Outil CLI pour exécuter une validation CI locale
 */
async function runLocalValidator() {
    console.log(chalk_1.default.blue('🧪 Validation locale du pipeline CI'));
    console.log(chalk_1.default.gray('Cette commande teste localement votre pipeline CI avant de le pousser sur GitHub.\n'));
    try {
        // 1. Détecter les tests CI disponibles
        console.log(chalk_1.default.yellow('🔍 Détection des tests CI configurés...'));
        const ciTesterResult = await (0, index_1.runCITester)({
            generateWorkflow: false,
            validateCurrentSetup: true,
            localTest: false,
            dryRun: true
        });
        if (ciTesterResult.detectedTests.length === 0) {
            console.log(chalk_1.default.red('❌ Aucun test CI détecté dans votre projet.'));
            console.log(chalk_1.default.yellow('Astuce: Créez un fichier ci-tester.config.js ou ajoutez des scripts dans vos package.json.'));
            return;
        }
        console.log(chalk_1.default.green(`✅ ${ciTesterResult.detectedTests.length} tests CI détectés`));
        // 2. Demander à l'utilisateur quels tests exécuter
        const { selectedTests } = await inquirer_1.default.prompt([
            {
                type: 'checkbox',
                name: 'selectedTests',
                message: 'Sélectionnez les tests à exécuter localement:',
                choices: ciTesterResult.detectedTests.map((test) => ({
                    name: `${test.name} - ${test.description} ${test.required ? '(requis)' : '(optionnel)'}`,
                    value: test.name,
                    checked: test.required // Pré-sélectionner les tests requis
                }))
            }
        ]);
        if (selectedTests.length === 0) {
            console.log(chalk_1.default.yellow('⚠️ Aucun test sélectionné. Sortie.'));
            return;
        }
        // Filtrer les tests sélectionnés
        const testsToRun = ciTesterResult.detectedTests.filter((test) => selectedTests.includes(test.name));
        // 3. Demander confirmation avant d'exécuter
        const { confirmExecution } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirmExecution',
                message: `Voulez-vous exécuter ${testsToRun.length} tests CI localement?`,
                default: true
            }
        ]);
        if (!confirmExecution) {
            console.log(chalk_1.default.yellow('⚠️ Exécution annulée.'));
            return;
        }
        // 4. Exécuter les tests
        console.log(chalk_1.default.blue('\n🚀 Exécution des tests CI localement...\n'));
        const results = [];
        for (const test of testsToRun) {
            const testHeader = `🧪 Exécution: ${test.name}`;
            console.log(chalk_1.default.cyan(`\n${testHeader}`));
            console.log(chalk_1.default.cyan('='.repeat(testHeader.length)));
            const startTime = Date.now();
            try {
                // Adaptation des commandes pour l'exécution locale sécurisée
                let command = test.command;
                // Pour les commandes d'installation, ajouter --no-save si possible pour éviter de modifier package.json
                if (command.includes('npm ci') || command.includes('npm install')) {
                    command = command.replace('npm ci', 'npm ci --no-save');
                    command = command.replace('npm install', 'npm install --no-save');
                }
                // Pour les commandes de build, ajouter un flag --dry-run si disponible
                if (command.includes('npm run build')) {
                    // On ne modifie pas car --dry-run n'est généralement pas supporté pour les builds
                }
                console.log(chalk_1.default.yellow(`Commande: ${command}`));
                const output = (0, child_process_1.execSync)(command, {
                    encoding: 'utf8',
                    stdio: ['inherit', 'pipe', 'pipe']
                });
                const endTime = Date.now();
                const duration = endTime - startTime;
                console.log(chalk_1.default.green('✅ Test réussi'));
                console.log(chalk_1.default.gray(`Durée: ${(duration / 1000).toFixed(2)}s`));
                results.push({
                    test,
                    success: true,
                    output,
                    duration
                });
            }
            catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                console.log(chalk_1.default.red(`❌ Test échoué: ${error.message}`));
                console.log(chalk_1.default.gray(`Durée: ${(duration / 1000).toFixed(2)}s`));
                results.push({
                    test,
                    success: false,
                    error: error.message,
                    output: error.stdout || '',
                    duration
                });
            }
        }
        // 5. Afficher le résumé des résultats
        console.log(chalk_1.default.blue('\n📊 Résumé des tests CI locaux'));
        console.log(chalk_1.default.blue('='.repeat(30)));
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        console.log(`Total: ${results.length} tests`);
        console.log(chalk_1.default.green(`Réussis: ${successCount} tests`));
        console.log(chalk_1.default.red(`Échoués: ${failCount} tests`));
        if (failCount > 0) {
            console.log(chalk_1.default.yellow('\n⚠️ Tests échoués:'));
            results
                .filter(r => !r.success)
                .forEach((result, index) => {
                console.log(chalk_1.default.red(`${index + 1}. ${result.test.name}: ${result.error}`));
            });
        }
        // 6. Sauvegarder le rapport
        const reportDir = path_1.default.join(process.cwd(), 'reports');
        if (!fs_1.default.existsSync(reportDir)) {
            fs_1.default.mkdirSync(reportDir, { recursive: true });
        }
        const now = new Date();
        const reportFile = path_1.default.join(reportDir, `ci_local_test_${now.toISOString().replace(/[:.]/g, '-')}.json`);
        fs_1.default.writeFileSync(reportFile, JSON.stringify({
            timestamp: now.toISOString(),
            results,
            summary: {
                total: results.length,
                success: successCount,
                failed: failCount
            }
        }, null, 2));
        console.log(chalk_1.default.blue(`\n📝 Rapport sauvegardé: ${reportFile}`));
        // 7. Sortir avec le bon code selon les résultats
        if (failCount > 0) {
            console.log(chalk_1.default.yellow('\n⚠️ Certains tests ont échoué. Corrigez-les avant de pousser sur GitHub.'));
            process.exit(1);
        }
        else {
            console.log(chalk_1.default.green('\n✅ Tous les tests ont réussi! Votre code est prêt à être poussé sur GitHub.'));
            process.exit(0);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n❌ Erreur: ${error.message}`));
        process.exit(2);
    }
}
// Exécuter directement si appelé comme script
if (require.main === module) {
    runLocalValidator();
}
// Exporter pour permettre son utilisation programmatique
exports.default = runLocalValidator;
