#!/usr/bin/env node

/**
 * Script qui détecte les agents affectés par les changements dans le code.
 * Analyse les fichiers modifiés pour identifier quels agents doivent être reconstruits et testés.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Analyse des arguments de ligne de commande
const argv = yargs(hideBin(process.argv))
    .option('base', {
        alias: 'b',
        description: 'Branche de base pour la comparaison',
        type: 'string',
        default: 'origin/main'
    })
    .option('head', {
        alias: 'h',
        description: 'Branche de tête pour la comparaison',
        type: 'string',
        default: 'HEAD'
    })
    .help()
    .alias('help', '?')
    .argv;

// Répertoires contenant les agents et leurs dépendances
const AGENT_DIRECTORIES = [
    'agents',
    'packages/mcp-agents'
];

// Mapping des fichiers de dépendances communes vers les agents qui en dépendent
const COMMON_DEPENDENCIES = {
    'agents/utils/': [
        'seo-checker-agent',
        'seo-content-enhancer',
        'canonical-validator',
        'seo-redirect-mapper',
        'seo-migration-agent'
    ],
    'agents/core/': [
        'seo-mcp-controller',
        'pr-creator',
        'orchestrator',
        'ci-tester',
        'dev-checker',
        'dev-linter',
        'dev-integrator'
    ],
    'agents/monitoring/': [
        'monitoring-check',
        'notifier'
    ],
    'agents/pipeline/': [
        'pipeline-strategy-auditor',
        'diff-verifier',
        'ci-tester'
    ]
};

/**
 * Fonction principale
 */
async function main() {
    try {
        console.log('🔍 Détection des agents affectés...');

        // Récupérer la liste des fichiers modifiés
        const changedFiles = getChangedFiles(argv.base, argv.head);

        if (changedFiles.length === 0) {
            console.log('Aucun fichier modifié détecté.');
            process.stdout.write('');
            return;
        }

        console.log(`Fichiers modifiés: ${changedFiles.length}`);

        // Identifier les agents affectés
        const affectedAgents = getAffectedAgents(changedFiles);

        console.log(`Agents affectés: ${affectedAgents.length}`);
        console.log(`Liste: ${affectedAgents.join(', ')}`);

        // Afficher les agents affectés sur la sortie standard pour utilisation dans GitHub Actions
        process.stdout.write(affectedAgents.join(' '));

    } catch (error) {
        console.error('❌ Erreur lors de la détection des agents affectés:', error);
        process.exit(1);
    }
}

/**
 * Récupère la liste des fichiers modifiés entre deux branches
 */
function getChangedFiles(base, head) {
    try {
        const output = execSync(`git diff --name-only ${base} ${head}`).toString();
        return output.split('\n').filter(Boolean);
    } catch (error) {
        console.error('Erreur lors de la récupération des fichiers modifiés:', error);
        return [];
    }
}

/**
 * Identifie les agents affectés en fonction des fichiers modifiés
 */
function getAffectedAgents(changedFiles) {
    // Set pour éviter les duplications
    const affectedAgentsSet = new Set();

    // Analyser chaque fichier modifié
    changedFiles.forEach(file => {
        // Vérifier si le fichier est directement dans un répertoire d'agent
        AGENT_DIRECTORIES.forEach(agentDir => {
            if (file.startsWith(agentDir)) {
                // Si c'est un fichier agent spécifique
                const match = file.match(new RegExp(`${agentDir}/(.*?)-agent\\.ts$`));
                if (match) {
                    affectedAgentsSet.add(match[1]);
                }

                // Vérifier les dépendances communes
                Object.entries(COMMON_DEPENDENCIES).forEach(([commonDir, dependentAgents]) => {
                    if (file.startsWith(commonDir)) {
                        dependentAgents.forEach(agent => affectedAgentsSet.add(agent));
                    }
                });
            }
        });
    });

    // Vérifier le fichier registry des agents
    if (changedFiles.some(file => file === 'agents/agent-registry.ts')) {
        // Si le registre a changé, considérer tous les agents comme affectés
        getAllAgents().forEach(agent => affectedAgentsSet.add(agent));
    }

    return Array.from(affectedAgentsSet);
}

/**
 * Récupère la liste de tous les agents disponibles
 */
function getAllAgents() {
    try {
        // Recherche de tous les fichiers "-agent.ts" dans les répertoires d'agents
        let allAgents = [];

        AGENT_DIRECTORIES.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = execSync(`find ${dir} -name "*-agent.ts" -o -name "*.agent.ts"`).toString().split('\n').filter(Boolean);

                files.forEach(file => {
                    const match = file.match(/([^\/]+)-agent\.ts$/) || file.match(/([^\/]+)\.agent\.ts$/);
                    if (match) {
                        allAgents.push(match[1]);
                    }
                });
            }
        });

        return allAgents;
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les agents:', error);
        return [];
    }
}

// Exécution du script
main().catch(error => {
    console.error(error);
    process.exit(1);
});