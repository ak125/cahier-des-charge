#!/usr/bin/env node

/**
 * Script de gestion des tâches CI pour NX
 * Remplace les commandes Taskfile dans CI.yaml
 */

const { execSync } = require('child_process');
const path = require('path');
const _fs = require('fs');

// Configuration
const _ROOT_DIR = path.join(__dirname, '..');

// Exécution des commandes
function executeCommand(command, showOutput = true) {
  try {
    const output = execSync(command, { stdio: showOutput ? 'inherit' : 'pipe' });
    return { success: true, output: output ? output.toString() : '' };
  } catch (error) {
    console.error(`Erreur lors de l'exécution de: ${command}`);
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

// Commandes pour la gestion du CI
const commands = {
  check: () => {
    console.log('Exécution de toutes les vérifications CI...');

    const steps = [
      { name: 'Lint', cmd: 'pnpm nx run-many --target=lint --all --parallel=4' },
      { name: 'Test', cmd: 'pnpm nx run-many --target=test --all --parallel=4 --ci' },
      { name: 'Build', cmd: 'pnpm nx affected:build --parallel=4' },
    ];

    let allSuccess = true;

    for (const step of steps) {
      console.log(`\n[CI Check] Exécution de ${step.name}...`);
      const result = executeCommand(step.cmd);

      if (!result.success) {
        console.error(`[CI Check] L'étape ${step.name} a échoué.`);
        allSuccess = false;
        break;
      }
    }

    if (allSuccess) {
      console.log('\n✅ Toutes les vérifications CI ont réussi!');
    } else {
      console.error('\n❌ Une ou plusieurs vérifications CI ont échoué.');
      return { success: false };
    }

    return { success: allSuccess };
  },

  lint: () => {
    console.log('Exécution du linting du code...');
    return executeCommand('pnpm nx run-many --target=lint --all --parallel=4');
  },

  test: () => {
    console.log("Exécution des tests unitaires et d'intégration...");
    return executeCommand('pnpm nx run-many --target=test --all --parallel=4 --ci');
  },

  build: () => {
    console.log('Construction des artefacts...');
    return executeCommand('pnpm nx affected:build --parallel=4');
  },

  deploy: (env = 'staging') => {
    const validEnvs = ['staging', 'production'];
    if (!validEnvs.includes(env)) {
      console.error(`Environnement invalide: ${env}. Utilisez 'staging' ou 'production'.`);
      return { success: false };
    }

    console.log(`Déploiement vers l'environnement ${env}...`);
    return executeCommand(`./scripts/deploy.sh ${env}`);
  },
};

// Analyse des arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
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
