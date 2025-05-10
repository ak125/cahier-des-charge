#!/usr/bin/env node

/**
 * Script qui génère une matrice d'agents pour les tests parallèles dans GitHub Actions.
 * Utilise la liste des agents affectés et les transforme en format JSON compatible avec les matrices de GitHub Actions.
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Analyse des arguments de ligne de commande
const argv = yargs(hideBin(process.argv))
    .option('agents', {
        alias: 'a',
        description: 'Liste d\'agents séparés par des espaces',
        type: 'string',
        default: process.env.AFFECTED_AGENTS || ''
    })
    .help()
    .alias('help', '?')
    .argv;

/**
 * Fonction principale
 */
function main() {
    try {
        console.log('📊 Génération de la matrice d\'agents...');

        // Récupérer la liste des agents à inclure dans la matrice
        let agents = [];

        if (argv.agents) {
            // Si fourni en argument, utiliser cette liste
            agents = argv.agents.split(' ').filter(Boolean);
        } else {
            // Sinon, lire depuis STDIN (pour le piping depuis detect-affected-agents.js)
            const input = fs.readFileSync(0, 'utf-8').toString().trim();
            agents = input.split(' ').filter(Boolean);
        }

        // Si aucun agent n'est trouvé, renvoyer une matrice vide
        if (agents.length === 0) {
            console.log('Aucun agent à tester trouvé.');
            console.log('[]');
            return;
        }

        console.log(`Agents à inclure dans la matrice: ${agents.length}`);
        console.log(`Liste: ${agents.join(', ')}`);

        // Prioritiser certains agents (par exemple, les agents critiques d'abord)
        const prioritizedAgents = prioritizeAgents(agents);

        // Afficher la matrice JSON sur la sortie standard pour utilisation dans GitHub Actions
        console.log(JSON.stringify(prioritizedAgents));

    } catch (error) {
        console.error('❌ Erreur lors de la génération de la matrice d\'agents:', error);
        process.exit(1);
    }
}

/**
 * Priorise la liste des agents pour les tests
 */
function prioritizeAgents(agents) {
    // Définir les agents critiques qui doivent être testés en priorité
    const criticalAgents = [
        'orchestrator',
        'seo-mcp-controller',
        'seo-checker-agent',
        'canonical-validator',
        'monitoring-check'
    ];

    // Trier pour placer les agents critiques en premier
    return agents.sort((a, b) => {
        const aIsCritical = criticalAgents.includes(a);
        const bIsCritical = criticalAgents.includes(b);

        if (aIsCritical && !bIsCritical) return -1;
        if (!aIsCritical && bIsCritical) return 1;
        return 0;
    });
}

// Exécution du script
main();