#!/usr/bin/env node

/**
 * Script de gestion des workflows pour NX
 * Unifie la gestion de n8n et Temporal
 */

const { execSync } = require('child_process');
const path = require('path');
const _fs = require('fs');

// Configuration
const N8N_DOCKER_COMPOSE = path.join(__dirname, '..', 'docker-compose.n8n.yml');
const _TEMPORAL_CONFIG = path.join(__dirname, '..', 'temporal-config.json');

// Fonctions d'aide
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

// Gestionnaire pour n8n
const n8nManager = {
  start: () => {
    console.log('Démarrage des workflows n8n...');
    return executeCommand(`docker-compose -f ${N8N_DOCKER_COMPOSE} up -d`);
  },

  stop: () => {
    console.log('Arrêt des workflows n8n...');
    return executeCommand(`docker-compose -f ${N8N_DOCKER_COMPOSE} down`);
  },

  import: () => {
    console.log('Importation des workflows n8n...');
    return executeCommand('node scripts/setup-n8n-pipelines.js');
  },

  logs: () => {
    console.log('Affichage des logs n8n...');
    return executeCommand(`docker-compose -f ${N8N_DOCKER_COMPOSE} logs -f n8n`);
  },
};

// Gestionnaire pour Temporal
const temporalManager = {
  start: () => {
    console.log('Démarrage des workflows Temporal...');
    return executeCommand('ts-node src/temporal/worker.ts');
  },

  status: () => {
    console.log('Vérification du statut des workflows Temporal...');
    return executeCommand('node scripts/temporal-checker.js --status');
  },

  run: (workflowId) => {
    if (!workflowId) {
      console.error('ID de workflow requis');
      return { success: false };
    }
    console.log(`Exécution du workflow Temporal: ${workflowId}`);
    return executeCommand(`ts-node src/temporal/client.ts run --id=${workflowId}`);
  },

  list: () => {
    console.log('Liste des workflows Temporal disponibles...');
    return executeCommand('ts-node src/temporal/client.ts list');
  },
};

// Commandes principales
const commands = {
  n8n: (subcommand, ...args) => {
    if (!n8nManager[subcommand]) {
      console.error(`Sous-commande n8n inconnue: ${subcommand}`);
      console.log('Sous-commandes disponibles: ', Object.keys(n8nManager).join(', '));
      return { success: false };
    }
    return n8nManager[subcommand](...args);
  },

  temporal: (subcommand, ...args) => {
    if (!temporalManager[subcommand]) {
      console.error(`Sous-commande Temporal inconnue: ${subcommand}`);
      console.log('Sous-commandes disponibles: ', Object.keys(temporalManager).join(', '));
      return { success: false };
    }
    return temporalManager[subcommand](...args);
  },
};

// Analyse des arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const orchestrator = args[0];
  const subcommand = args[1];
  const params = args.slice(2);

  return { orchestrator, subcommand, params };
}

// Exécution
function main() {
  const { orchestrator, subcommand, params } = parseArgs();

  if (!commands[orchestrator]) {
    console.error(`Orchestrateur inconnu: ${orchestrator}`);
    console.log('Orchestrateurs disponibles: ', Object.keys(commands).join(', '));
    process.exit(1);
  }

  if (!subcommand) {
    console.error(`Sous-commande requise pour ${orchestrator}`);
    process.exit(1);
  }

  const result = commands[orchestrator](subcommand, ...params);

  if (!result.success) {
    process.exit(1);
  }
}

main();
