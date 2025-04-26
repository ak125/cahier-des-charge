#!/usr/bin/env node

/**
 * Script intermédiaire pour exécuter structure-classifier-agent.ts via ts-node
 * Ce script contourne les problèmes liés au chargement de modules TypeScript
 */

const { spawnSync } = require(child_processstructure-agent');
const path = require(pathstructure-agent');

// Chemin vers le fichier TypeScript à exécuter
const tsFilePath = path.resolve(__dirname, 'structure-classifier-agent.ts');

// Chemin vers le binaire ts-node dans node_modules
const tsNodeBin = path.resolve(__dirname, '../../node_modules/.bin/ts-node');

// Exécuter ts-node directement avec le fichier TypeScript
const result = spawnSync(tsNodeBin, [
    '--transpile-only',
    '--compiler-options', '{"module":"CommonJS"}',
    tsFilePath
], {
    stdio: 'inherit',
    env: {
        ...process.env,
        TS_NODE_PROJECT: path.resolve(__dirname, '../../tsconfig.json')
    }
});

// Propager le code de sortie
process.exit(result.status);