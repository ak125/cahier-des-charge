#!/usr/bin/env node

/**
 * Script de gestion des tâches pour NX
 * Remplace la commande default de Taskfile qui liste toutes les tâches disponibles
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');
const NX_JSON = path.join(ROOT_DIR, 'nx.json');

// Formatage des couleurs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m',
  },

  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m',
  },
};

// Fonctions d'aide
function readPackageJson() {
  try {
    const content = fs.readFileSync(PACKAGE_JSON, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${PACKAGE_JSON}:`, error.message);
    return null;
  }
}

function readNxJson() {
  try {
    const content = fs.readFileSync(NX_JSON, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${NX_JSON}:`, error.message);
    return null;
  }
}

function runNxHelp() {
  try {
    return execSync('npx nx --help', { encoding: 'utf-8' });
  } catch (_error) {
    return '';
  }
}

// Commandes
const commands = {
  list: () => {
    console.log(`${colors.bright}${colors.fg.blue}=== Tâches disponibles ===${colors.reset}\n`);

    // Lire package.json pour les scripts npm
    const packageJson = readPackageJson();
    const scripts = packageJson?.scripts || {};

    // Lire nx.json pour les targets NX
    const nxJson = readNxJson();
    const _targets = nxJson?.targetDefaults || {};

    // Afficher les groupes de commandes
    console.log(`${colors.bright}${colors.fg.green}Commandes principales:${colors.reset}`);
    const mainCommands = [
      'dev',
      'build',
      'test',
      'lint',
      'format',
      'setup',
      'migrate',
      'audit',
      'docker:up',
      'docker:down',
    ];

    mainCommands.forEach((cmdName) => {
      if (scripts[cmdName]) {
        console.log(`  ${colors.fg.cyan}${cmdName}${colors.reset}: ${scripts[cmdName]}`);
      }
    });

    console.log(`\n${colors.bright}${colors.fg.green}Commandes Docker:${colors.reset}`);
    Object.keys(scripts)
      .filter((key) => key.startsWith('docker:'))
      .forEach((cmdName) => {
        console.log(`  ${colors.fg.cyan}${cmdName}${colors.reset}: ${scripts[cmdName]}`);
      });

    console.log(`\n${colors.bright}${colors.fg.green}Commandes Workflow:${colors.reset}`);
    const workflowCommands = [
      'n8n:start',
      'n8n:stop',
      'n8n:import',
      'n8n:logs',
      'start:worker',
      'start:client',
      'bullmq:start',
      'bullmq:stop',
    ];

    workflowCommands.forEach((cmdName) => {
      if (scripts[cmdName]) {
        console.log(`  ${colors.fg.cyan}${cmdName}${colors.reset}: ${scripts[cmdName]}`);
      }
    });

    console.log(`\n${colors.bright}${colors.fg.green}Commandes Migration:${colors.reset}`);
    Object.keys(scripts)
      .filter((key) => key.includes('migrate') || key.startsWith('migration'))
      .forEach((cmdName) => {
        console.log(`  ${colors.fg.cyan}${cmdName}${colors.reset}: ${scripts[cmdName]}`);
      });

    console.log(`\n${colors.bright}${colors.fg.green}Commandes CI/CD:${colors.reset}`);
    Object.keys(scripts)
      .filter((key) => key.startsWith('ci:') || key.startsWith('build:'))
      .forEach((cmdName) => {
        console.log(`  ${colors.fg.cyan}${cmdName}${colors.reset}: ${scripts[cmdName]}`);
      });

    console.log(`\n${colors.bright}${colors.fg.green}Commandes NX:${colors.reset}`);
    Object.keys(scripts)
      .filter((key) => key.startsWith('nx:') || key.startsWith('affected'))
      .forEach((cmdName) => {
        console.log(`  ${colors.fg.cyan}${cmdName}${colors.reset}: ${scripts[cmdName]}`);
      });

    // Afficher des instructions d'utilisation
    console.log(`\n${colors.bright}${colors.fg.yellow}Pour exécuter une commande:${colors.reset}`);
    console.log(
      `  ${colors.fg.white}pnpm run ${colors.fg.cyan}<nom-de-la-commande>${colors.reset}\n`
    );

    console.log(
      `${colors.bright}${colors.fg.yellow}Pour les commandes NX spécifiques:${colors.reset}`
    );
    console.log(`  ${colors.fg.white}nx run ${colors.fg.cyan}<target>${colors.reset}`);
    console.log(
      `  ${colors.fg.white}nx run ${colors.fg.cyan}<target> --configuration=<config>${colors.reset}\n`
    );

    console.log(`${colors.bright}${colors.fg.magenta}Pour en savoir plus sur NX:${colors.reset}`);
    console.log(`  ${colors.fg.white}nx help${colors.reset}`);
    console.log(`  ${colors.fg.white}nx graph${colors.reset} (visualisation des dépendances)`);

    return { success: true };
  },

  help: () => {
    const nxHelp = runNxHelp();
    console.log(nxHelp);
    return { success: true };
  },
};

// Analyse des arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  const params = args.slice(1);

  return { command, params };
}

// Exécution
function main() {
  const { command, params } = parseArgs();

  if (!commands[command]) {
    console.error(`Commande inconnue: ${command}`);
    console.log('Commandes disponibles: ', Object.keys(commands).join(', '));
    process.exit(1);
  }

  const result = commands[command](...params);

  if (!result.success) {
    process.exit(1);
  }
}

main();
