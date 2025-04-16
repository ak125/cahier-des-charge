#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { migrate, audit, dryRun, qa, checkCompletion, verifyRoutes } from './commands';

// Configuration de yargs pour une meilleure interface CLI
yargs(hideBin(process.argv))
  .scriptName('mcp')
  .usage('$0 <cmd> [args]')
  .command('migrate <file>', 'Migre un fichier PHP vers Remix', (yargs) => {
    return yargs.positional('file', {
      type: 'string',
      describe: 'Nom du fichier PHP à migrer'
    });
  }, async (argv) => {
    console.log(chalk.blue(`🚀 Début de la migration de ${argv.file}...`));
    await migrate(argv.file as string);
  })
  .command('audit [status]', 'Audite les fichiers selon leur statut', (yargs) => {
    return yargs.positional('status', {
      type: 'string',
      describe: 'Filtre par statut (done, pending, invalid, in-progress)',
      choices: ['done', 'pending', 'invalid', 'in-progress']
    });
  }, async (argv) => {
    console.log(chalk.blue(`📊 Audit des fichiers ${argv.status ? `avec statut ${argv.status}` : ''}...`));
    await audit(argv.status as string | undefined);
  })
  .command('dry-run <file>', 'Simule la migration d\'un fichier sans l\'exécuter', (yargs) => {
    return yargs.positional('file', {
      type: 'string',
      describe: 'Nom du fichier PHP à simuler'
    });
  }, async (argv) => {
    console.log(chalk.blue(`🔍 Simulation de migration pour ${argv.file}...`));
    await dryRun(argv.file as string);
  })
  .command('generate', 'Génère ou met à jour le backlog.mcp.json à partir du discovery_map.json', () => {}, async () => {
    console.log(chalk.blue('🔄 Génération du fichier backlog.mcp.json...'));
    try {
      // Utilisation de require au lieu d'import pour charger un module dynamiquement 
      const { execaSync } = require('execa');
      execaSync('node', ['packages/mcp-cli/generate-backlog.js'], { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la génération du backlog:'), error);
    }
  })
  // Nouvelles commandes pour la validation CI/CD
  .command('qa <file>', 'Analyse la qualité de la migration d\'un fichier PHP', (yargs) => {
    return yargs.positional('file', {
      type: 'string',
      describe: 'Nom du fichier PHP à analyser'
    });
  }, async (argv) => {
    console.log(chalk.blue(`🔍 Analyse de qualité pour ${argv.file}...`));
    await qa(argv.file as string);
  })
  .command('check-completion <file>', 'Vérifie si la migration d\'un fichier est complète', (yargs) => {
    return yargs.positional('file', {
      type: 'string',
      describe: 'Nom du fichier PHP à vérifier'
    }).option('min-score', {
      type: 'number',
      default: 95,
      describe: 'Score minimum requis (0-100)'
    });
  }, async (argv) => {
    console.log(chalk.blue(`🔍 Vérification de la complétude de ${argv.file}...`));
    const isComplete = await checkCompletion(argv.file as string, argv.minScore as number);
    // Si en mode CI/CD, on sort avec le code d'erreur approprié
    if (process.env.CI && !isComplete) {
      process.exit(1);
    }
  })
  .command('verify:routes', 'Vérifie la validité des routes Remix', {}, async () => {
    console.log(chalk.blue('🔍 Vérification des routes Remix...'));
    const isValid = await verifyRoutes();
    // Si en mode CI/CD, on sort avec le code d'erreur approprié
    if (process.env.CI && !isValid) {
      process.exit(1);
    }
  })
  .demandCommand(1, 'Vous devez indiquer une commande à exécuter')
  .recommendCommands()
  .strict()
  .help()
  .alias('h', 'help')
  .alias('v', 'version')
  .epilogue('Pour plus d\'informations, consultez la documentation')
  .parse();