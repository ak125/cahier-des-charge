#!/usr/bin/env node

/**
 * Script d'archivage manuel d'une version du cahier des charges
 * 
 * Ce script permet de créer explicitement une nouvelle version archivée
 * du cahier des charges.
 */

const { execSync } = require(child_processstructure-agent');
const { program } = require(commanderstructure-agent');
const chalk = require(chalkstructure-agent');
const inquirer = require(inquirerstructure-agent');

// Options du programme
program
  .option('-m, --message <message>', 'Message décrivant la version')
  .option('-i, --increment <type>', 'Type d\'incrémentation (patch, minor, major)', 'patch')
  .option('-f, --force', 'Forcer la création même sans changements significatifs')
  .option('-y, --yes', 'Confirmer automatiquement sans demander')
  .parse(process.argv);

const options = program.opts();

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(chalk.blue('📦 Archivage manuel d\'une version du cahier des charges'));
    
    // Si --message n'est pas spécifié, demander un message
    if (!options.message && !options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: 'Message décrivant cette version:',
          default: 'Mise à jour du cahier des charges',
          validate: input => input.trim() !== '' ? true : 'Le message ne peut pas être vide'
        },
        {
          type: 'list',
          name: 'increment',
          message: 'Type d\'incrémentation de version:',
          default: options.increment,
          choices: [
            { name: 'Patch (corrections mineurs, 1.0.0 → 1.0.1)', value: 'patch' },
            { name: 'Minor (nouvelles fonctionnalités, 1.0.0 → 1.1.0)', value: 'minor' },
            { name: 'Major (changements majeurs, 1.0.0 → 2.0.0)', value: 'major' }
          ]
        },
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Confirmer la création de la version?',
          default: true
        }
      ]);
      
      if (!answers.confirm) {
        console.log(chalk.yellow('❌ Opération annulée'));
        process.exit(0);
      }
      
      options.message = answers.message;
      options.increment = answers.increment;
    }
    
    // Préparer les options pour le versionnement
    const cmdOptions = [
      options.message ? `--message "${options.message}"` : '',
      `--increment ${options.increment}`,
      options.force ? '--force' : '',
      '--trigger manual'
    ].filter(Boolean).join(' ');
    
    // Exécuter le gestionnaire de versions
    console.log(chalk.blue('🔄 Création de la version en cours...'));
    
    const result = execSync(`node scripts/version-manager.js ${cmdOptions}`, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log(chalk.green('✅ Version archivée avec succès'));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
}

// Exécuter le script
main();
