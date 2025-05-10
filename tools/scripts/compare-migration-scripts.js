#!/usr/bin/env node

/**
 * Script de comparaison des scripts de migration
 * Ce script permet de tester les scripts de migration original et amélioré
 * en mode simulation et de comparer leurs sorties.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

// Chemins des scripts à comparer
const originalScript = '/workspaces/cahier-des-charge/tools/scripts/migrate-agents.js';
const improvedScript = '/workspaces/cahier-des-charge/tools/scripts/migrate-agents-improved.js';

// Lots à tester
const batches = ['orchestration', 'coordination', 'business'];

async function runAndCompare() {
    console.log('=== Comparaison des scripts de migration (mode simulation) ===\n');

    for (const batch of batches) {
        console.log(`\n=== Test du lot: ${batch} ===\n`);

        try {
            console.log(`Exécution du script original pour le lot ${batch}...`);
            const originalResult = await execPromise(`node ${originalScript} --batch=${batch} --dry-run`);
            console.log(`Statut: OK (code: ${originalResult.code || 0})`);

            console.log(`\nExécution du script amélioré pour le lot ${batch}...`);
            const improvedResult = await execPromise(`node ${improvedScript} --batch=${batch} --dry-run`);
            console.log(`Statut: OK (code: ${improvedResult.code || 0})`);

            // Comparer les résultats
            console.log('\nComparaison des sorties:');
            if (originalResult.stdout.length === improvedResult.stdout.length) {
                console.log('- Les scripts ont produit des sorties de même longueur');
            } else {
                const originalLines = originalResult.stdout.split('\n').length;
                const improvedLines = improvedResult.stdout.split('\n').length;
                console.log(`- Script original: ${originalLines} lignes`);
                console.log(`- Script amélioré: ${improvedLines} lignes`);
            }

            // Comparer le temps d'exécution lors d'un prochain test réel

        } catch (err) {
            console.error(`Erreur lors du test du lot ${batch}:`, err.message);
        }
    }
}

async function main() {
    // Vérifier que les deux scripts existent
    if (!fs.existsSync(originalScript)) {
        console.error(`Le script original n'existe pas: ${originalScript}`);
        process.exit(1);
    }

    if (!fs.existsSync(improvedScript)) {
        console.error(`Le script amélioré n'existe pas: ${improvedScript}`);
        process.exit(1);
    }

    // Rendre les scripts exécutables si nécessaire
    try {
        await execPromise(`chmod +x ${originalScript} ${improvedScript}`);
    } catch (err) {
        console.warn('Avertissement: Impossible de rendre les scripts exécutables', err.message);
    }

    // Exécuter la comparaison
    await runAndCompare();

    console.log('\n=== Comparaison terminée ===');
    console.log('\nPour tester la migration réelle d\'un lot avec le script amélioré:');
    console.log(`node ${improvedScript} --batch=<nom-du-lot>`);
    console.log('\nPour simuler une migration avec le script amélioré:');
    console.log(`node ${improvedScript} --batch=<nom-du-lot> --dry-run`);
}

main().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});
