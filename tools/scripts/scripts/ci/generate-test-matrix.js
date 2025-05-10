#!/usr/bin/env node

/**
 * Script qui génère une matrice de tests dynamique basée sur les projets affectés par les changements.
 * Cette matrice est ensuite utilisée par GitHub Actions pour exécuter les tests en parallèle.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Analyse des arguments de ligne de commande
const argv = yargs(hideBin(process.argv))
    .option('output', {
        alias: 'o',
        description: 'Chemin de sortie pour le fichier JSON de la matrice',
        type: 'string',
        default: '.github/workflows/generated/test-matrix.json'
    })
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
    .option('all', {
        alias: 'a',
        description: 'Inclure tous les projets au lieu de seulement ceux affectés',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', '?')
    .argv;

function main() {
    console.log('🧪 Génération de la matrice de tests...');

    try {
        // Détermine quels projets doivent être testés
        let projectsToTest;

        if (argv.all) {
            // Inclure tous les projets
            console.log('Mode "tous les projets" activé');
            projectsToTest = getAllProjects();
        } else {
            // Obtenir uniquement les projets affectés
            console.log(`Calcul des projets affectés entre ${argv.base} et ${argv.head}...`);
            projectsToTest = getAffectedProjects(argv.base, argv.head);
        }

        // Filtrer pour ne garder que les projets qui ont réellement des tests
        const projectsWithTests = filterProjectsWithTests(projectsToTest);

        console.log(`Projets avec tests: ${projectsWithTests.length}`);

        // Prioriser les tests - par exemple, placer les tests critiques en premier
        const prioritizedProjects = prioritizeTests(projectsWithTests);

        // Créer le répertoire de sortie si nécessaire
        const outputDir = path.dirname(argv.output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Écrire la matrice dans le fichier JSON de sortie
        fs.writeFileSync(argv.output, JSON.stringify(prioritizedProjects, null, 2));
        console.log(`✅ Matrice de tests générée dans ${argv.output}`);
        console.log(`📊 Nombre total de jobs de test: ${prioritizedProjects.length}`);

        // Afficher la matrice sur la sortie standard pour utilisation dans GitHub Actions
        console.log(JSON.stringify(prioritizedProjects));

    } catch (error) {
        console.error('❌ Erreur lors de la génération de la matrice de tests:', error);
        process.exit(1);
    }
}

/**
 * Obtient tous les projets configurés dans le monorepo Nx
 */
function getAllProjects() {
    try {
        const output = execSync('npx nx show projects --json').toString();
        return JSON.parse(output);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les projets:', error);
        return [];
    }
}

/**
 * Obtient les projets affectés par les changements entre deux branches
 */
function getAffectedProjects(base, head) {
    try {
        const output = execSync(`npx nx affected:projects --base=${base} --head=${head} --json`).toString();
        return JSON.parse(output);
    } catch (error) {
        console.warn('Impossible de déterminer les projets affectés, retour à tous les projets:', error.message);
        return getAllProjects();
    }
}

/**
 * Filtre les projets pour ne garder que ceux qui ont des tests configurés
 */
function filterProjectsWithTests(projects) {
    try {
        const allProjectsWithTargets = JSON.parse(
            execSync('npx nx show projects --with-target=test --json').toString()
        );

        // Ne garder que les projets qui ont la cible "test" et qui sont dans la liste des projets affectés
        return projects.filter(project => allProjectsWithTargets.includes(project));
    } catch (error) {
        console.warn('Erreur lors du filtrage des projets avec tests:', error.message);
        return projects; // En cas d'erreur, retourner tous les projets sans filtre
    }
}

/**
 * Prioriser les tests (par exemple, mettre d'abord les tests critiques)
 */
function prioritizeTests(projects) {
    // Projets critiques qui doivent être testés en premier
    const criticalProjects = [
        'business',           // Couche business (la plus fondamentale)
        'coordination',       // Couche coordination (intermédiaire)
        'orchestration',      // Couche orchestration
        'core-api',
        'shared-auth',
        'dashboard',
        'admin-dashboard',
        'seo-tools'
    ];

    // Trier les projets pour mettre les critiques en premier
    return projects.sort((a, b) => {
        const aIsCritical = criticalProjects.includes(a);
        const bIsCritical = criticalProjects.includes(b);

        if (aIsCritical && !bIsCritical) return -1;
        if (!aIsCritical && bIsCritical) return 1;
        return 0;
    });
}

// Exécution du script
main();