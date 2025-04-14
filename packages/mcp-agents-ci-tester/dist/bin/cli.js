#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const index_1 = require("../index");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Récupération des infos du package
const packageJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../../package.json'), 'utf8'));
const program = new commander_1.Command();
program
    .name('mcp-ci-tester')
    .description(packageJson.description)
    .version(packageJson.version);
program
    .option('-c, --config <path>', 'Chemin vers le fichier de configuration', 'ci-tester.config.js')
    .option('--no-workflow', 'Ne pas générer le fichier workflow GitHub Actions')
    .option('--no-validate', 'Ne pas valider la configuration actuelle')
    .option('--install-github-apps', 'Suggérer l\'installation d\'applications GitHub')
    .option('--local-test', 'Effectuer un test local de la CI')
    .option('--output <path>', 'Répertoire de sortie pour les fichiers générés')
    .option('--templates <path>', 'Répertoire contenant des templates personnalisés')
    .option('-v, --verbose', 'Afficher plus d\'informations')
    .option('--dry-run', 'Afficher les actions sans les exécuter');
program.action(async (options) => {
    console.log(chalk_1.default.blue('🚀 MCP CI Tester v' + packageJson.version));
    try {
        const result = await (0, index_1.runCITester)({
            configPath: options.config,
            generateWorkflow: options.workflow,
            validateCurrentSetup: options.validate,
            installGitHubApps: options.installGitHubApps,
            localTest: options.localTest,
            outputPath: options.output,
            templatesPath: options.templates,
            verbose: options.verbose,
            dryRun: options.dryRun
        });
        if (options.verbose) {
            result.logs.forEach(log => console.log(log));
        }
        else {
            // Afficher un résumé si non verbose
            console.log(chalk_1.default.green(`\n✅ Statut: ${result.status === 'success' ? 'Succès' : result.status === 'warning' ? 'Avertissement' : 'Erreur'}`));
            console.log(chalk_1.default.blue(`📊 Tests détectés: ${result.detectedTests.length}`));
            console.log(chalk_1.default.blue(`📄 Fichiers générés: ${result.generatedFiles.length}`));
            if (result.generatedFiles.length > 0) {
                console.log(chalk_1.default.blue('\nFichiers générés:'));
                result.generatedFiles.forEach(file => console.log(`- ${file}`));
            }
        }
        process.exit(result.status === 'success' ? 0 : result.status === 'warning' ? 1 : 2);
    }
    catch (error) {
        console.error(chalk_1.default.red(`❌ Erreur: ${error.message}`));
        process.exit(2);
    }
});
program.parse();
