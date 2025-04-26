#!/usr/bin/env node

/**
 * Script de gestion des conteneurs Docker pour NX
 * Remplace les commandes Taskfile docker:*
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const DOCKER_COMPOSE_FILE = path.join(__dirname, '..', 'docker-compose.mcp.yml');
const N8N_DOCKER_COMPOSE_FILE = path.join(__dirname, '..', 'docker-compose.n8n.yml');

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

function getDockerCompose(type = 'default') {
    return type === 'n8n'
        ? `docker-compose -f ${N8N_DOCKER_COMPOSE_FILE}`
        : `docker-compose -f ${DOCKER_COMPOSE_FILE}`;
}

// Commandes
const commands = {
    up: (type = 'default') => {
        console.log(`Démarrage des services Docker (${type})...`);
        return executeCommand(`${getDockerCompose(type)} up -d`);
    },

    down: (type = 'default') => {
        console.log(`Arrêt des services Docker (${type})...`);
        return executeCommand(`${getDockerCompose(type)} down`);
    },

    restart: (type = 'default') => {
        console.log(`Redémarrage des services Docker (${type})...`);
        commands.down(type);
        return commands.up(type);
    },

    logs: (service, type = 'default') => {
        const serviceArg = service ? service : '';
        console.log(`Affichage des logs pour ${serviceArg || 'tous les services'} (${type})...`);
        return executeCommand(`${getDockerCompose(type)} logs -f ${serviceArg}`);
    },

    ps: (type = 'default') => {
        console.log(`Liste des conteneurs actifs (${type})...`);
        return executeCommand(`${getDockerCompose(type)} ps`);
    }
};

// Analyse des arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0] || 'ps';
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