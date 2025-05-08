#!/usr/bin/env node

/**
 * Script qui détecte les URLs affectées par les modifications dans le code
 * Utilisé pour la validation SEO ciblée
 * 
 * Ce script analyse les fichiers modifiés pour identifier les URLs qui pourraient 
 * être affectées et qui nécessitent une validation SEO.
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
        description: 'Branche/commit de base pour la comparaison',
        type: 'string',
        default: 'origin/main'
    })
    .option('head', {
        alias: 'h',
        description: 'Branche/commit de tête pour la comparaison',
        type: 'string',
        default: 'HEAD'
    })
    .option('format', {
        alias: 'f',
        description: 'Format de sortie (json ou list)',
        type: 'string',
        choices: ['json', 'list'],
        default: 'json'
    })
    .option('output', {
        alias: 'o',
        description: 'Fichier de sortie (optionnel)',
        type: 'string'
    })
    .help()
    .alias('help', '?')
    .argv;

// Modèles de fichiers qui peuvent contenir des routes
const ROUTE_PATTERNS = [
    // Remix routes
    /apps\/.*\/src\/routes\/(.*?)\.(tsx|jsx|ts|js|mdx)$/,
    // Next.js pages
    /apps\/.*\/src\/pages\/(.*?)\.(tsx|jsx|ts|js|mdx)$/,
    // Next.js app router
    /apps\/.*\/src\/app\/(.+?)\/(?:page|route)\.(tsx|jsx|ts|js|mdx)$/,
    // Autres patterns possibles selon votre architecture
    /apps\/.*\/routes\/(.+?)\.(tsx|jsx|ts|js|mdx)$/
];

// Fichiers qui contiennent des informations SEO globales 
const SEO_CONFIG_FILES = [
    /redirects\.json$/,
    /sitemap.*\.xml$/,
    /robots\.txt$/,
    /canonical.*\.json$/,
    /seo-config\..*$/,
    /meta\/.*\.(ts|js|json)$/
];

/**
 * Fonction principale
 */
async function main() {
    try {
        console.log('🔍 Détection des URLs affectées...');

        // Récupérer la liste des fichiers modifiés entre les deux références
        const changedFiles = getChangedFiles(argv.base, argv.head);

        if (!changedFiles.length) {
            console.log('Aucun fichier modifié détecté.');
            outputResult([], argv.format, argv.output);
            return;
        }

        console.log(`Fichiers modifiés: ${changedFiles.length}`);

        // Analyser les fichiers pour trouver les URLs affectées
        const affectedUrls = extractAffectedUrls(changedFiles);

        // Sortie des résultats
        console.log(`URLs affectées: ${affectedUrls.length}`);
        if (affectedUrls.length > 0) {
            const displayUrls = affectedUrls.length > 5
                ? `${affectedUrls.slice(0, 5).join(', ')}... et ${affectedUrls.length - 5} de plus`
                : affectedUrls.join(', ');
            console.log(`URLs: ${displayUrls}`);
        }

        outputResult(affectedUrls, argv.format, argv.output);

    } catch (error) {
        console.error('❌ Erreur lors de la détection des URLs affectées:', error);
        process.exit(1);
    }
}

/**
 * Récupère la liste des fichiers modifiés entre deux références Git
 */
function getChangedFiles(base, head) {
    try {
        const output = execSync(`git diff --name-only ${base} ${head}`).toString();
        return output.split('\n').filter(Boolean);
    } catch (error) {
        // En cas d'erreur, utiliser une comparaison avec HEAD~1 comme fallback
        console.warn('⚠️ Erreur lors de la récupération des fichiers modifiés. Utilisation du fallback...');
        try {
            const output = execSync('git diff --name-only HEAD~1 HEAD').toString();
            return output.split('\n').filter(Boolean);
        } catch (e) {
            console.error('Impossible de déterminer les fichiers modifiés:', e.message);
            return [];
        }
    }
}

/**
 * Extrait les URLs potentiellement affectées à partir des fichiers modifiés
 */
function extractAffectedUrls(changedFiles) {
    const affectedUrls = new Set();
    let hasGlobalSeoChanges = false;

    // Vérifier d'abord s'il y a des changements globaux de SEO
    for (const file of changedFiles) {
        if (SEO_CONFIG_FILES.some(pattern => pattern.test(file))) {
            hasGlobalSeoChanges = true;
            console.log(`Détecté changement de configuration SEO globale: ${file}`);
            break;
        }
    }

    // Si des changements SEO globaux sont détectés, analyser toutes les routes
    if (hasGlobalSeoChanges) {
        console.log('Changements SEO globaux détectés - analyse complète requise');
        const allRoutes = getAllRoutes();
        allRoutes.forEach(route => affectedUrls.add(route));
    } else {
        // Sinon, analyser uniquement les fichiers de route modifiés
        for (const file of changedFiles) {
            let matchFound = false;

            // Vérifier si le fichier correspond à un pattern de route
            for (const pattern of ROUTE_PATTERNS) {
                const match = file.match(pattern);
                if (match) {
                    matchFound = true;
                    const routePath = normalizeRoutePath(match[1]);
                    affectedUrls.add(routePath);

                    // Pour les routes complexes/imbriquées, ajouter aussi les segments parents
                    const segments = routePath.split('/').filter(Boolean);
                    let currentPath = '';
                    for (const segment of segments) {
                        currentPath = currentPath ? `${currentPath}/${segment}` : `/${segment}`;
                        affectedUrls.add(currentPath);
                    }
                    break;
                }
            }

            // Si le fichier n'est pas une route mais pourrait contenir des informations sur les routes
            if (!matchFound && (file.includes('/meta/') || file.includes('/data/') ||
                file.includes('/components/') || file.includes('/lib/'))) {
                console.log(`Fichier potentiellement lié aux routes mais pas une route directe: ${file}`);

                // Essayer d'extraire les informations sur la route du contenu du fichier
                try {
                    const content = fs.readFileSync(file, 'utf-8');
                    // Rechercher les URL path patterns communs dans le contenu
                    const urlPatterns = content.match(/(?:"|'|`)[/][a-zA-Z0-9_\-/]+(?:"|'|`)/g);
                    if (urlPatterns) {
                        urlPatterns.forEach(pattern => {
                            const url = pattern.replace(/["'`]/g, '');
                            affectedUrls.add(url);
                        });
                    }

                    // Rechercher les définitions d'URL ou de route
                    const routePatterns = content.match(/(?:path|route|url)(?:\s*:\s*|\s*=\s*)["'`][/][a-zA-Z0-9_\-/]+["'`]/gi);
                    if (routePatterns) {
                        routePatterns.forEach(pattern => {
                            const url = pattern.match(/["'`]([/][a-zA-Z0-9_\-/]+)["'`]/)[1];
                            affectedUrls.add(url);
                        });
                    }
                } catch (e) {
                    console.warn(`Impossible d'analyser le fichier ${file}: ${e.message}`);
                }
            }
        }
    }

    // S'assurer que la route racine est toujours vérifiée
    affectedUrls.add('/');

    return Array.from(affectedUrls);
}

/**
 * Normalise un chemin de route pour le transformer en URL
 */
function normalizeRoutePath(routePath) {
    // Remplacer les caractères spéciaux liés aux routes dynamiques
    routePath = routePath
        .replace(/\[([^\]]+)\]/g, ':$1')  // [param] -> :param (format Next.js -> Express-like)
        .replace(/\$[^/]+/g, ':id')       // $param -> :id (format Remix -> Express-like)
        .replace(/\.(tsx|jsx|ts|js|mdx)$/, ''); // Supprimer l'extension de fichier

    // Gérer les cas spéciaux des routes index
    if (routePath === 'index' || routePath.endsWith('/index')) {
        routePath = routePath.replace(/\/index$/, '/');
    }

    // S'assurer que le chemin commence par "/"
    if (!routePath.startsWith('/')) {
        routePath = '/' + routePath;
    }

    // Enlever le "/" final sauf pour la route racine
    if (routePath !== '/' && routePath.endsWith('/')) {
        routePath = routePath.slice(0, -1);
    }

    return routePath;
}

/**
 * Récupère toutes les routes du projet
 */
function getAllRoutes() {
    console.log('Recherche de toutes les routes du projet...');
    const routes = new Set();

    try {
        // Rechercher tous les fichiers qui peuvent contenir des routes
        ROUTE_PATTERNS.forEach((pattern, patternIndex) => {
            try {
                // Construire un pattern de recherche de fichiers
                const filePatternBase = pattern.toString()
                    .replace(/^\//, '')
                    .replace(/\(\.\*\?\)/, '*')
                    .replace(/\\\.\((.*?)\)/, '.*');

                const filePattern = filePatternBase
                    .replace(/\$.*?$/g, '') // Supprimer les parties regex à la fin
                    .replace(/\\\/\(\.\+\?\)\\\/(?:\(.*?\)\\\..*?|page|route)\\/, '/**/*.');

                // Utiliser find pour localiser les fichiers de route
                let command;
                if (patternIndex === 0) {
                    command = `find ./apps -path "*/src/routes/*" -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" -o -name "*.mdx" 2>/dev/null || echo ""`;
                } else if (patternIndex === 1) {
                    command = `find ./apps -path "*/src/pages/*" -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" -o -name "*.mdx" 2>/dev/null || echo ""`;
                } else if (patternIndex === 2) {
                    command = `find ./apps -path "*/src/app/*" -name "page.tsx" -o -name "page.jsx" -o -name "page.ts" -o -name "page.js" -o -name "route.tsx" -o -name "route.jsx" -o -name "route.ts" -o -name "route.js" 2>/dev/null || echo ""`;
                } else {
                    command = `find ./apps -path "*/routes/*" -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" -o -name "*.mdx" 2>/dev/null || echo ""`;
                }

                const output = execSync(command).toString();
                const files = output.split('\n').filter(Boolean);

                files.forEach(file => {
                    const match = file.match(pattern);
                    if (match) {
                        const routePath = normalizeRoutePath(match[1]);
                        routes.add(routePath);
                    }
                });
            } catch (e) {
                console.warn(`Erreur lors de la recherche pour le pattern ${patternIndex}:`, e.message);
            }
        });

        // Ajouter la route racine si elle n'existe pas encore
        routes.add('/');

        console.log(`${routes.size} routes trouvées.`);
        return Array.from(routes);
    } catch (error) {
        console.error('Erreur lors de la récupération de toutes les routes:', error);
        // En cas d'erreur, retourner au moins la route racine
        return ['/'];
    }
}

/**
 * Génère la sortie au format demandé
 */
function outputResult(urls, format, outputFile) {
    let output;

    if (format === 'json') {
        output = JSON.stringify(urls);
    } else {
        // Format 'list'
        output = urls.join('\n');
    }

    // Si un fichier de sortie est spécifié, l'écrire dans ce fichier
    if (outputFile) {
        try {
            const outputDir = path.dirname(outputFile);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            fs.writeFileSync(outputFile, output);
            console.log(`Résultat écrit dans ${outputFile}`);
        } catch (error) {
            console.error(`Erreur lors de l'écriture du résultat dans ${outputFile}:`, error);
        }
    }

    // Toujours écrire sur stdout pour utilisation dans les pipelines
    process.stdout.write(output);
}

// Exécuter le script
main().catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
});