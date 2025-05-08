#!/usr/bin/env node

/**
 * Script qui extrait les routes affectées par les changements dans le code.
 * Utilisé pour la validation SEO ciblée.
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

// Motifs à surveiller pour les routes et éléments SEO
const ROUTE_PATTERNS = [
    /apps\/.*\/src\/routes\/(.*?)\.tsx?$/,
    /apps\/.*\/src\/pages\/(.*?)\.tsx?$/,
    /apps\/.*\/src\/app\/(.*?)\/page\.tsx?$/,
    /apps\/.*\/src\/app\/(.*?)\/route\.tsx?$/
];

// Mappings des fichiers aux routes associées
const FILE_TO_ROUTE_MAPPING = {
    'meta': true,
    'seo': true,
    'canonical': true,
    'redirects.json': true,
    'sitemap.xml': true,
    'robots.txt': true
};

/**
 * Fonction principale
 */
async function main() {
    try {
        console.log('🔍 Extraction des routes affectées...');

        // Récupérer la liste des fichiers modifiés
        const changedFiles = getChangedFiles(argv.base, argv.head);

        if (changedFiles.length === 0) {
            console.log('Aucun fichier modifié détecté.');
            process.stdout.write('[]');
            return;
        }

        console.log(`Fichiers modifiés: ${changedFiles.length}`);

        // Extraire les routes affectées
        const affectedRoutes = extractAffectedRoutes(changedFiles);

        console.log(`Routes affectées: ${affectedRoutes.length}`);
        if (affectedRoutes.length > 0) {
            console.log(`Exemples: ${affectedRoutes.slice(0, 5).join(', ')}${affectedRoutes.length > 5 ? '...' : ''}`);
        }

        // Convertir en JSON et afficher sur la sortie standard pour utilisation dans GitHub Actions
        process.stdout.write(JSON.stringify(affectedRoutes));

    } catch (error) {
        console.error('❌ Erreur lors de l\'extraction des routes affectées:', error);
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
 * Extrait les routes affectées à partir des fichiers modifiés
 */
function extractAffectedRoutes(changedFiles) {
    // Set pour éviter les duplications
    const affectedRoutesSet = new Set();

    // Analyser chaque fichier modifié
    changedFiles.forEach(file => {
        // Vérifier si le fichier est une route directe
        let isRouteFile = false;
        ROUTE_PATTERNS.forEach(pattern => {
            const match = file.match(pattern);
            if (match) {
                const routePath = normalizeRoutePath(match[1]);
                affectedRoutesSet.add(routePath);
                isRouteFile = true;
            }
        });

        // Si ce n'est pas une route directe, vérifier s'il s'agit d'un fichier qui pourrait affecter des routes
        if (!isRouteFile) {
            // Vérifier les fichiers de métadonnées, SEO, etc.
            Object.keys(FILE_TO_ROUTE_MAPPING).forEach(pattern => {
                if (file.includes(pattern)) {
                    // Pour ces fichiers, nous pourrions avoir besoin d'extraire toutes les routes du projet
                    const routes = getAllProjectRoutes(file);
                    routes.forEach(route => affectedRoutesSet.add(route));
                }
            });
        }
    });

    return Array.from(affectedRoutesSet);
}

/**
 * Normalise un chemin de route pour qu'il soit cohérent
 */
function normalizeRoutePath(routePath) {
    // Remplacer les index par / et nettoyer les chemins
    let normalized = routePath
        .replace(/\/index$/, '/')
        .replace(/\/$/, '')
        .replace(/^\//, '');

    // Si la route est vide après normalisation, c'est la route racine
    if (!normalized) {
        normalized = '/';
    } else if (normalized !== '/') {
        normalized = '/' + normalized;
    }

    return normalized;
}

/**
 * Récupère toutes les routes du projet associé au fichier
 */
function getAllProjectRoutes(file) {
    try {
        // Déterminer l'application associée au fichier
        const appMatch = file.match(/apps\/([^/]+)/);
        if (!appMatch) return [];

        const appName = appMatch[1];
        console.log(`Extraction de toutes les routes pour l'application: ${appName}`);

        // Chercher tous les fichiers de routes dans cette application
        const routePatterns = [
            `apps/${appName}/src/routes/**/*.ts`,
            `apps/${appName}/src/routes/**/*.tsx`,
            `apps/${appName}/src/pages/**/*.ts`,
            `apps/${appName}/src/pages/**/*.tsx`,
            `apps/${appName}/src/app/**/page.ts`,
            `apps/${appName}/src/app/**/page.tsx`,
            `apps/${appName}/src/app/**/route.ts`,
            `apps/${appName}/src/app/**/route.tsx`
        ];

        let routes = [];
        routePatterns.forEach(pattern => {
            try {
                const files = execSync(`find apps/${appName} -path "${pattern}" 2>/dev/null || echo ""`).toString().split('\n').filter(Boolean);

                files.forEach(routeFile => {
                    // Extraire le chemin de la route à partir du chemin du fichier
                    ROUTE_PATTERNS.forEach(regex => {
                        const match = routeFile.match(regex);
                        if (match) {
                            const routePath = normalizeRoutePath(match[1]);
                            routes.push(routePath);
                        }
                    });
                });
            } catch (e) {
                // Ignorer les erreurs pour des patterns spécifiques
            }
        });

        console.log(`Routes trouvées pour ${appName}: ${routes.length}`);
        return routes;
    } catch (error) {
        console.warn(`Erreur lors de la récupération des routes pour ${file}:`, error.message);
        return [];
    }
}

// Exécution du script
main().catch(error => {
    console.error(error);
    process.exit(1);
});