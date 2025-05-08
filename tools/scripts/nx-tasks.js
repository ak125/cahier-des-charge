#!/usr/bin/env node

/**
 * Script d'aide pour exécuter les tâches NX standardisées
 * Permet d'exécuter facilement les commandes NX les plus courantes selon notre configuration standard
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Couleurs pour le terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

const workspaceRoot = path.resolve(__dirname, '../..');

// Fonctions d'aide
function execCommand(command) {
    try {
        return execSync(command, { stdio: 'inherit', cwd: workspaceRoot });
    } catch (error) {
        process.exit(error.status || 1);
    }
}

function printHelp() {
    console.log(`
${colors.bright}Script d'aide pour les tâches NX standardisées${colors.reset}

${colors.bright}Usage:${colors.reset}
  node nx-tasks.js <commande> [options]

${colors.bright}Commandes:${colors.reset}
  ${colors.green}serve <projet>${colors.reset}                Démarrer le serveur de développement pour un projet
  ${colors.green}build <projet>${colors.reset}                Construire un projet
  ${colors.green}test <projet>${colors.reset}                 Exécuter les tests pour un projet
  ${colors.green}lint <projet>${colors.reset}                 Exécuter le linter pour un projet
  ${colors.green}typecheck <projet>${colors.reset}            Vérifier les types pour un projet
  ${colors.green}affected <cible>${colors.reset}              Exécuter une cible sur les projets affectés
  ${colors.green}run-many <cible> <projets>${colors.reset}    Exécuter une cible sur plusieurs projets
  ${colors.green}graph${colors.reset}                         Générer une visualisation du graphe de dépendance
  ${colors.green}create-lib <nom>${colors.reset}              Créer une nouvelle bibliothèque
  ${colors.green}create-app <nom>${colors.reset}              Créer une nouvelle application

${colors.bright}Options:${colors.reset}
  ${colors.yellow}--prod${colors.reset}                       Utiliser la configuration de production
  ${colors.yellow}--watch${colors.reset}                      Exécuter en mode watch
  ${colors.yellow}--skip-nx-cache${colors.reset}              Ignorer le cache NX

${colors.bright}Exemples:${colors.reset}
  node nx-tasks.js serve frontend
  node nx-tasks.js build backend --prod
  node nx-tasks.js affected test
  node nx-tasks.js run-many build frontend,backend --prod
  `);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    const projectOrTarget = args[1];

    const options = args.slice(2).filter(arg => arg.startsWith('--'));

    return { command, projectOrTarget, options };
}

// Exécution principale
const { command, projectOrTarget, options } = parseArgs();

// Options formatées pour NX
const optionsStr = options.join(' ');

switch (command) {
    case 'serve':
        console.log(`${colors.bright}Démarrage du serveur pour ${colors.blue}${projectOrTarget}${colors.reset}...`);
        execCommand(`npx nx serve ${projectOrTarget} ${optionsStr}`);
        break;

    case 'build':
        console.log(`${colors.bright}Construction de ${colors.blue}${projectOrTarget}${colors.reset}...`);
        execCommand(`npx nx build ${projectOrTarget} ${optionsStr}`);
        break;

    case 'test':
        console.log(`${colors.bright}Exécution des tests pour ${colors.blue}${projectOrTarget}${colors.reset}...`);
        execCommand(`npx nx test ${projectOrTarget} ${optionsStr}`);
        break;

    case 'lint':
        console.log(`${colors.bright}Linting de ${colors.blue}${projectOrTarget}${colors.reset}...`);
        execCommand(`npx nx lint ${projectOrTarget} ${optionsStr}`);
        break;

    case 'typecheck':
        console.log(`${colors.bright}Vérification des types pour ${colors.blue}${projectOrTarget}${colors.reset}...`);
        execCommand(`npx nx typecheck ${projectOrTarget} ${optionsStr}`);
        break;

    case 'affected':
        console.log(`${colors.bright}Exécution de la cible ${colors.blue}${projectOrTarget}${colors.reset} sur les projets affectés...`);
        execCommand(`npx nx affected --target=${projectOrTarget} ${optionsStr}`);
        break;

    case 'run-many': {
        const target = projectOrTarget;
        const projects = options.find(opt => !opt.startsWith('--'));
        const filteredOptions = options.filter(opt => opt !== projects);

        console.log(`${colors.bright}Exécution de la cible ${colors.blue}${target}${colors.reset} sur les projets ${colors.blue}${projects}${colors.reset}...`);
        execCommand(`npx nx run-many --target=${target} --projects=${projects} ${filteredOptions.join(' ')}`);
        break;
    }

    case 'graph':
        console.log(`${colors.bright}Génération du graphe de dépendance...${colors.reset}`);
        execCommand(`npx nx graph ${optionsStr}`);
        break;

    case 'create-lib':
        console.log(`${colors.bright}Création d'une nouvelle bibliothèque ${colors.blue}${projectOrTarget}${colors.reset}...`);
        execCommand(`npx nx g @nx/js:lib ${projectOrTarget} ${optionsStr}`);
        break;

    case 'create-app':
        console.log(`${colors.bright}Création d'une nouvelle application ${colors.blue}${projectOrTarget}${colors.reset}...`);
        execCommand(`npx nx g @nx/js:app ${projectOrTarget} ${optionsStr}`);
        break;

    case 'help':
    case '--help':
    case '-h':
        printHelp();
        break;

    default:
        console.log(`${colors.red}Commande non reconnue: ${command}${colors.reset}`);
        printHelp();
        process.exit(1);
}