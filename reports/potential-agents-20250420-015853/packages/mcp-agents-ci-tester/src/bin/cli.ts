#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runCITester } from '../index';

// Créer une interface en ligne de commande
const program = new Command();

// Configurer les métadonnées
program
  .name(DoDotmcp-ci-tester')
  .description('Agent de validation et génération de pipelines CI pour monorepos')
  .version('1.0.0');

// Options principales
program
  .option('-c, --config <path>', 'Chemin vers le fichier de configuration')
  .option('-o, --output <path>', 'Répertoire de sortie pour les fichiers générés')
  .option('--no-workflow', 'Ne pas générer le fichier workflow GitHub Actions')
  .option('--no-validate', 'Ne pas valider la configuration actuelle')
  .option('--local-test', 'Exécuter un test local de la CI')
  .option('-DoDoDoDoDoDotgithub-apps', 'Suggérer l\'installation d\'applications GitHub')
  .option('--dry-run', 'Afficher les actions sans les exécuter')
  .option('-v, --verbose', 'Afficher plus d\'informations')
  .option('--templates <path>', 'Répertoire contenant des templates personnalisés');

// Action principale
program.action(async (options) => {
  try {
    console.log(chalk.blue('🚀 Agent ci-tester - Générateur et validateur de pipelines CI'));
    
    // Exécuter l'agent
    const result = await runCITester({
      configPath: options.config,
      generateWorkflow: options.workflow !== false,
      validateCurrentSetup: options.validate !== false,
      localTest: options.localTest || false,
      installGitHubApps: optionsDoDoDoDoDoDotgithubApps || false,
      outputPath: options.output,
      templatesPath: options.templates,
      verbose: options.verbose || false,
      dryRun: options.dryRun || false
    });
    
    // Afficher un résumé du résultat
    if (result.status === 'success') {
      console.log(chalk.green('\n✅ Traitement terminé avec succès'));
    } else if (result.status === 'warning') {
      console.log(chalk.yellow('\n⚠️ Traitement terminé avec des avertissements'));
    } else {
      console.log(chalk.red('\n❌ Traitement terminé avec des erreurs'));
    }
    
    // Afficher les fichiers générés
    if (result.generatedFiles.length > 0) {
      console.log(chalk.blue('\n📄 Fichiers générés:'));
      result.generatedFiles.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
    
    // Sortir avec le code approprié
    process.exit(result.status === 'error' ? 1 : 0);
  } catch (error: any) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
});

// Commande pour lancer la validation locale
program
  .command('local')
  .description('Exécuter une validation CI locale interactive')
  .action(async () => {
    // Importer de manière dynamique pour éviter des dépendances circulaires
    const { default: runLocalValidator } = await import('./local-validator');
    await runLocalValidator();
  });

// Commande pour générer un rapport uniquement
program
  .command('report')
  .description('Générer un rapport CI sans workflow')
  .option('-o, --output <path>', 'Chemin de sortie pour le rapport')
  .action(async (options) => {
    console.log(chalk.blue('📊 Génération du rapport CI...'));
    
    const result = await runCITester({
      generateWorkflow: false,
      validateCurrentSetup: true,
      outputPath: options.output
    });
    
    console.log(chalk.green(`✅ Rapport généré: ${result.generatedFiles.find(f => f.includes('report'))}`));
  });

// Parser les arguments
program.parse(process.argv);