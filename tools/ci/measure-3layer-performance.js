#!/usr/bin/env node

/**
 * Script qui analyse les performances de build dans la nouvelle architecture en 3 couches
 * et compare avec les métriques historiques.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERFORMANCE_LOG_FILE = path.join(process.cwd(), 'reports', 'build-performance.json');

// Exécute une commande et mesure son temps d'exécution
function measureCommandExecution(command, label) {
    console.log(`Exécution de: ${label}`);
    const startTime = Date.now();

    try {
        execSync(command, { stdio: 'inherit' });
        const duration = Date.now() - startTime;
        return {
            label,
            success: true,
            durationMs: duration,
            durationFormatted: formatDuration(duration)
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            label,
            success: false,
            error: error.message,
            durationMs: duration,
            durationFormatted: formatDuration(duration)
        };
    }
}

// Formate la durée en millisecondes en un format lisible
function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
}

// Enregistre les résultats de performance
function savePerformanceResults(results) {
    let historicalData = [];

    try {
        if (fs.existsSync(PERFORMANCE_LOG_FILE)) {
            historicalData = JSON.parse(fs.readFileSync(PERFORMANCE_LOG_FILE, 'utf8'));
        }
    } catch (err) {
        console.warn('Impossible de lire les données historiques de performance');
    }

    const entry = {
        timestamp: new Date().toISOString(),
        results
    };

    historicalData.push(entry);

    // Garder seulement les 10 dernières entrées
    if (historicalData.length > 10) {
        historicalData = historicalData.slice(-10);
    }

    // S'assurer que le répertoire existe
    const dir = path.dirname(PERFORMANCE_LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(PERFORMANCE_LOG_FILE, JSON.stringify(historicalData, null, 2));
}

// Analyse les performances par rapport à l'historique
function analyzePerformance(currentResults) {
    if (!fs.existsSync(PERFORMANCE_LOG_FILE)) {
        console.log('Pas de données historiques disponibles pour comparer');
        return;
    }

    try {
        const historicalData = JSON.parse(fs.readFileSync(PERFORMANCE_LOG_FILE, 'utf8'));

        if (historicalData.length <= 1) {
            console.log('Pas assez de données historiques pour une comparaison significative');
            return;
        }

        // Obtenir les données les plus récentes (excluant celle qu'on vient d'ajouter)
        const previousEntries = historicalData.slice(0, -1);

        // Calculer les moyennes historiques
        const averages = {};

        for (const result of currentResults) {
            const { label } = result;

            const historicalTimes = previousEntries
                .map(entry => entry.results.find(r => r.label === label))
                .filter(Boolean)
                .map(r => r.durationMs);

            if (historicalTimes.length > 0) {
                const avgTime = historicalTimes.reduce((sum, time) => sum + time, 0) / historicalTimes.length;
                const diff = result.durationMs - avgTime;
                const diffPercent = (diff / avgTime * 100).toFixed(2);

                console.log(`${label}: ${result.durationFormatted} (${diffPercent}% par rapport à la moyenne historique de ${formatDuration(avgTime)})`);
            } else {
                console.log(`${label}: ${result.durationFormatted} (pas de données historiques)`);
            }
        }

    } catch (err) {
        console.error('Erreur lors de l\'analyse des performances:', err);
    }
}

// Mesure les performances de build pour différentes couches
async function measureBuildPerformance() {
    console.log('📊 Analyse des performances de build pour l\'architecture en 3 couches');

    // Nettoyer le cache de build pour une mesure précise
    execSync('rm -rf dist .nx-cache || true', { stdio: 'inherit' });

    const results = [
        // Mesurer le temps de build de la couche business
        measureCommandExecution('npx nx build business', 'Build - Couche Business'),

        // Mesurer le temps de build de la couche coordination
        measureCommandExecution('npx nx build coordination', 'Build - Couche Coordination'),

        // Mesurer le temps de build de la couche orchestration
        measureCommandExecution('npx nx build orchestration', 'Build - Couche Orchestration'),

        // Mesurer le temps de build en parallèle
        measureCommandExecution('npx nx run-many --target=build --projects=business,coordination,orchestration --parallel=3',
            'Build parallèle - Toutes les couches'),

        // Mesurer le temps de test
        measureCommandExecution('npx nx run-many --target=test --projects=business,coordination,orchestration --parallel=3',
            'Test - Toutes les couches')
    ];

    // Enregistrer les résultats
    savePerformanceResults(results);

    console.log('\n📈 Analyse comparative des performances:');
    analyzePerformance(results);

    return results;
}

// Exécution principale
try {
    measureBuildPerformance();
    console.log('✅ Analyse des performances terminée');
} catch (error) {
    console.error('❌ Erreur lors de l\'analyse des performances:', error);
    process.exit(1);
}
