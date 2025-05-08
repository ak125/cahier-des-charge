#!/usr/bin/env node

/**
 * legacy-url-manager.js - Outil CLI pour gérer les URLs legacy PHP sans redirection
 * 
 * Cet outil permet de :
 * 1. Analyser des URLs legacy PHP pour identifier des patterns
 * 2. Générer des configurations pour préserver ces URLs
 * 3. Créer les handlers nécessaires pour gérer ces URLs dans une application moderne
 * 4. Tester les URLs générées pour s'assurer qu'elles fonctionnent correctement
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const url = require('url');

// Configuration de l'application Commander
program
    .name('legacy-url-manager')
    .description('Outil de gestion des URLs legacy PHP sans redirection')
    .version('1.0.0');

// Commande d'analyse d'URLs
program
    .command('analyze')
    .description('Analyser un fichier contenant des URLs PHP legacy')
    .argument('<file>', 'Chemin vers le fichier contenant les URLs legacy')
    .option('-o, --output <path>', 'Chemin de sortie pour le fichier de rapport', 'legacy-url-analysis.json')
    .action(async (file, options) => {
        try {
            console.log(chalk.blue(`📊 Analyse des URLs depuis ${file}...`));
            const report = await analyzeUrls(file);
            await fs.writeFile(options.output, JSON.stringify(report, null, 2));
            console.log(chalk.green(`✅ Rapport d'analyse généré: ${options.output}`));

            // Afficher un résumé des résultats
            console.log(chalk.yellow('\n📈 Résumé de l\'analyse:'));
            console.log(`  🔹 Nombre total d'URLs: ${report.totalUrls}`);
            console.log(`  🔹 Types d'URLs détectés: ${Object.keys(report.patternsByType).length}`);
            console.log(`  🔹 Paramètres les plus courants: ${report.commonParams.slice(0, 5).join(', ')}`);
        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors de l'analyse: ${error.message}`));
            process.exit(1);
        }
    });

// Commande de génération de configuration
program
    .command('generate')
    .description('Générer les configurations pour préserver les URLs legacy')
    .argument('<file>', 'Chemin vers le fichier contenant les URLs legacy')
    .option('-o, --output <path>', 'Chemin de sortie pour le fichier de configuration', 'legacy-url-config.json')
    .option('-t, --type <type>', 'Type de configuration: remix, next, ou express', 'remix')
    .option('-r, --routes-dir <path>', 'Dossier où générer les handlers de routes', './app/routes/legacy')
    .action(async (file, options) => {
        try {
            console.log(chalk.blue(`🔧 Génération de configuration pour framework ${options.type}...`));
            const config = await generateConfig(file, options.type);
            await fs.writeFile(options.output, JSON.stringify(config, null, 2));
            console.log(chalk.green(`✅ Configuration générée: ${options.output}`));

            // Générer les handlers si nécessaire
            if (options.type === 'remix') {
                console.log(chalk.blue(`📝 Génération des handlers de routes Remix...`));
                await generateRemixHandlers(config, options.routesDir);
                console.log(chalk.green(`✅ Handlers générés dans ${options.routesDir}`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors de la génération: ${error.message}`));
            process.exit(1);
        }
    });

// Commande de test des URLs
program
    .command('test')
    .description('Tester les URLs legacy pour vérifier leur fonctionnement')
    .argument('<file>', 'Chemin vers le fichier contenant les URLs legacy')
    .option('-b, --base-url <url>', 'URL de base pour les tests', 'http://localhost:3000')
    .option('-c, --config <path>', 'Chemin vers le fichier de configuration', 'legacy-url-config.json')
    .option('-v, --verbose', 'Afficher les détails pour chaque URL', false)
    .action(async (file, options) => {
        try {
            console.log(chalk.blue(`🧪 Test des URLs legacy avec URL de base: ${options.baseUrl}`));
            const results = await testUrls(file, options.baseUrl, options.verbose);

            // Afficher le résumé des résultats
            console.log(chalk.yellow('\n📊 Résultats des tests:'));
            console.log(`  🔹 Nombre total d'URLs testées: ${results.total}`);
            console.log(chalk.green(`  🔹 Succès: ${results.success}`));
            console.log(chalk.red(`  🔹 Échecs: ${results.failed}`));
            console.log(`  🔹 Temps d'exécution: ${results.executionTime}ms`);

            if (results.failed > 0) {
                console.log(chalk.red(`\n⚠️ Attention: ${results.failed} URLs ne fonctionnent pas correctement.`));
                process.exit(1);
            } else {
                console.log(chalk.green(`\n✅ Toutes les URLs fonctionnent correctement !`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors des tests: ${error.message}`));
            process.exit(1);
        }
    });

/**
 * Analyser un fichier d'URLs legacy pour identifier des patterns
 * @param {string} filePath - Chemin vers le fichier d'URLs
 * @returns {Object} Rapport d'analyse
 */
async function analyzeUrls(filePath) {
    // Lire le fichier
    const content = await fs.readFile(filePath, 'utf-8');
    const urlLines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    // Initialiser le rapport
    const report = {
        totalUrls: urlLines.length,
        patternsByType: {},
        extensions: new Set(),
        paramCounts: {},
        commonParams: [],
        examples: {}
    };

    // Parcourir chaque URL
    urlLines.forEach(urlString => {
        try {
            // Pour les URLs relatives, ajouter un domaine factice
            const fullUrl = urlString.startsWith('http')
                ? urlString
                : `http://example.com${urlString}`;

            const parsedUrl = new URL(fullUrl);
            const pathname = parsedUrl.pathname;
            const extension = path.extname(pathname);

            // Enregistrer l'extension
            if (extension) {
                report.extensions.add(extension);
            }

            // Déterminer le type d'URL
            let urlType = 'generic';
            if (pathname.includes('produit') || pathname.includes('product') || pathname.includes('fiche')) {
                urlType = 'product';
            } else if (pathname.includes('categorie') || pathname.includes('category')) {
                urlType = 'category';
            } else if (pathname.includes('marque') || pathname.includes('brand')) {
                urlType = 'brand';
            } else if (pathname.includes('recherche') || pathname.includes('search')) {
                urlType = 'search';
            } else if (pathname.includes('article') || pathname.includes('blog') || pathname.includes('news')) {
                urlType = 'article';
            } else if (pathname.includes('contact') || pathname.includes('about') || pathname.includes('info')) {
                urlType = 'page';
            }

            // Créer ou mettre à jour le groupe de pattern pour ce type
            if (!report.patternsByType[urlType]) {
                report.patternsByType[urlType] = {
                    count: 0,
                    patterns: {}
                };
            }

            // Créer un pattern généralisé (remplacer les IDs par des placeholders)
            let genericPattern = pathname;
            if (urlType !== 'generic') {
                genericPattern = pathname.replace(/\/\d+/, '/{id}');
            }

            // Mettre à jour le compteur pour ce pattern
            if (!report.patternsByType[urlType].patterns[genericPattern]) {
                report.patternsByType[urlType].patterns[genericPattern] = {
                    count: 0,
                    examples: []
                };
            }

            report.patternsByType[urlType].patterns[genericPattern].count++;
            report.patternsByType[urlType].count++;

            // Ajouter un exemple si nécessaire
            if (report.patternsByType[urlType].patterns[genericPattern].examples.length < 3) {
                report.patternsByType[urlType].patterns[genericPattern].examples.push(urlString);
            }

            // Compter les paramètres
            for (const [param] of parsedUrl.searchParams) {
                report.paramCounts[param] = (report.paramCounts[param] || 0) + 1;
            }

        } catch (error) {
            console.warn(chalk.yellow(`⚠️ Impossible d'analyser l'URL: ${urlString}`));
        }
    });

    // Convertir les ensembles en tableaux
    report.extensions = Array.from(report.extensions);

    // Trier les paramètres par fréquence
    report.commonParams = Object.entries(report.paramCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([param]) => param);

    return report;
}

/**
 * Générer une configuration pour préserver les URLs legacy
 * @param {string} filePath - Chemin vers le fichier d'URLs
 * @param {string} framework - Framework cible (remix, next, express)
 * @returns {Object} Configuration générée
 */
async function generateConfig(filePath, framework) {
    // Lire le fichier et analyser les URLs
    const content = await fs.readFile(filePath, 'utf-8');
    const urlLines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    // Structure de base de la configuration
    const config = {
        framework,
        totalUrls: urlLines.length,
        generatedAt: new Date().toISOString(),
        urlsByType: {},
        routes: []
    };

    // Parcourir chaque URL
    urlLines.forEach(urlString => {
        try {
            // Pour les URLs relatives, ajouter un domaine factice
            const fullUrl = urlString.startsWith('http')
                ? urlString
                : `http://example.com${urlString}`;

            const parsedUrl = new URL(fullUrl);
            const pathname = parsedUrl.pathname;

            // Déterminer le type d'URL
            let urlType = 'generic';
            if (pathname.includes('produit') || pathname.includes('product') || pathname.includes('fiche')) {
                urlType = 'product';
            } else if (pathname.includes('categorie') || pathname.includes('category')) {
                urlType = 'category';
            } else if (pathname.includes('marque') || pathname.includes('brand')) {
                urlType = 'brand';
            } else if (pathname.includes('recherche') || pathname.includes('search')) {
                urlType = 'search';
            } else if (pathname.includes('article') || pathname.includes('blog') || pathname.includes('news')) {
                urlType = 'article';
            } else if (pathname.includes('contact') || pathname.includes('about') || pathname.includes('info')) {
                urlType = 'page';
            }

            // Initialiser le groupe si nécessaire
            if (!config.urlsByType[urlType]) {
                config.urlsByType[urlType] = [];
            }

            // Collecter les paramètres de requête
            const params = {};
            parsedUrl.searchParams.forEach((value, key) => {
                params[key] = value;
            });

            // Déterminer la route moderne équivalente
            let modernPath = '';
            switch (urlType) {
                case 'product':
                    modernPath = `/produits/${params.id || params.ref || 'detail'}`;
                    break;
                case 'category':
                    modernPath = `/categories/${params.id || params.slug || 'liste'}`;
                    break;
                case 'brand':
                    modernPath = `/marques/${params.id || params.name || 'detail'}`;
                    break;
                case 'search':
                    modernPath = `/recherche${params.q ? `?q=${params.q}` : ''}`;
                    break;
                case 'article':
                    modernPath = `/blog/${params.slug || params.id || 'article'}`;
                    break;
                case 'page':
                    // Pour les pages simples, garder seulement le nom sans l'extension
                    modernPath = pathname.replace('.php', '');
                    break;
                default:
                    modernPath = pathname.replace('.php', '');
            }

            // Ajouter à la configuration
            config.urlsByType[urlType].push({
                originalUrl: urlString,
                pathname,
                params,
                modernPath,
            });

            // Générer la configuration de route selon le framework
            const route = generateRouteConfig(urlString, framework, urlType, modernPath);
            if (route) {
                config.routes.push(route);
            }

        } catch (error) {
            console.warn(chalk.yellow(`⚠️ Impossible de traiter l'URL: ${urlString}`));
        }
    });

    return config;
}

/**
 * Générer la configuration de route spécifique au framework
 * @param {string} urlString - URL originale
 * @param {string} framework - Framework cible
 * @param {string} urlType - Type d'URL
 * @param {string} modernPath - Chemin moderne équivalent
 * @returns {Object} Configuration de route
 */
function generateRouteConfig(urlString, framework, urlType, modernPath) {
    try {
        // Pour les URLs relatives, ajouter un domaine factice
        const fullUrl = urlString.startsWith('http')
            ? urlString
            : `http://example.com${urlString}`;

        const parsedUrl = new URL(fullUrl);
        const pathname = parsedUrl.pathname;

        switch (framework) {
            case 'remix':
                return {
                    path: pathname,
                    component: `~/routes/legacy/${urlType}.route.tsx`,
                    modernPath,
                    type: urlType
                };

            case 'next':
                return {
                    source: pathname + (parsedUrl.search ? parsedUrl.search.replace(/&/g, '\\&') : ''),
                    destination: modernPath,
                    permanent: false,
                    locale: false,
                    type: urlType
                };

            case 'express':
                return {
                    path: pathname,
                    handler: `legacyHandlers.${urlType}Handler`,
                    modernPath,
                    type: urlType
                };

            default:
                return null;
        }
    } catch (error) {
        console.warn(chalk.yellow(`⚠️ Impossible de générer la configuration de route pour: ${urlString}`));
        return null;
    }
}

/**
 * Générer les handlers de routes pour Remix
 * @param {Object} config - Configuration générée
 * @param {string} routesDir - Dossier de destination des routes
 */
async function generateRemixHandlers(config, routesDir) {
    // Créer le dossier des routes si nécessaire
    try {
        await fs.mkdir(routesDir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }

    // Regrouper par type d'URL
    const routeTypes = new Set();
    config.routes.forEach(route => {
        routeTypes.add(route.type);
    });

    // Générer un handler pour chaque type
    for (const type of routeTypes) {
        const handlerContent = generateRemixHandler(type, config);
        const filePath = path.join(routesDir, `${type}.route.tsx`);
        await fs.writeFile(filePath, handlerContent);
        console.log(chalk.blue(`📝 Handler généré: ${filePath}`));
    }

    // Générer l'utilitaire de canonicaux
    const utilsPath = path.join(routesDir, '../utils');
    try {
        await fs.mkdir(utilsPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }

    const canonicalUtilPath = path.join(utilsPath, 'canonical.ts');
    await fs.writeFile(canonicalUtilPath, generateCanonicalUtil());
    console.log(chalk.blue(`📝 Utilitaire de canonicaux généré: ${canonicalUtilPath}`));
}

/**
 * Générer le contenu d'un handler de route Remix
 * @param {string} type - Type de route (product, category, etc.)
 * @param {Object} config - Configuration générée
 * @returns {string} Contenu du fichier handler
 */
function generateRemixHandler(type, config) {
    // Sélectionner la route moderne correspondante
    let modernRoute = '';
    let paramMapping = '';

    switch (type) {
        case 'product':
            modernRoute = '~/routes/produits.$id';
            paramMapping = `  // Extraire l'ID du produit depuis les paramètres de requête
  const productId = new URLSearchParams(url.search).get('id') || '';
  params = { ...params, id: productId };`;
            break;

        case 'category':
            modernRoute = '~/routes/categories.$id';
            paramMapping = `  // Extraire l'ID de catégorie depuis les paramètres de requête
  const categoryId = new URLSearchParams(url.search).get('id') || '';
  params = { ...params, id: categoryId };`;
            break;

        case 'brand':
            modernRoute = '~/routes/marques.$id';
            paramMapping = `  // Extraire l'ID de marque depuis les paramètres de requête
  const brandId = new URLSearchParams(url.search).get('id') || '';
  params = { ...params, id: brandId };`;
            break;

        case 'search':
            modernRoute = '~/routes/recherche';
            paramMapping = `  // Conserver les paramètres de recherche
  const queryParams = Object.fromEntries(new URLSearchParams(url.search));
  params = { ...params, ...queryParams };`;
            break;

        case 'article':
            modernRoute = '~/routes/blog.$slug';
            paramMapping = `  // Extraire le slug ou l'ID de l'article
  const slug = new URLSearchParams(url.search).get('slug');
  const id = new URLSearchParams(url.search).get('id');
  params = { ...params, slug: slug || id || '' };`;
            break;

        case 'page':
        case 'generic':
        default:
            modernRoute = '~/routes/_index';
            paramMapping = `  // Conserver tous les paramètres de requête
  const queryParams = Object.fromEntries(new URLSearchParams(url.search));
  params = { ...params, ...queryParams };`;
            break;
    }

    return `/**
 * Handler de route legacy pour les URLs de type "${type}"
 * Ce fichier a été généré automatiquement par le script legacy-url-manager.js
 */
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getCanonicalUrl } from "~/utils/canonical";

// Importer le composant et le loader du chemin moderne équivalent
import { default as RouteComponent, loader as originalLoader } from "${modernRoute}";

/**
 * Loader qui préserve les URLs PHP legacy tout en utilisant les données
 * des nouvelles routes
 */
export async function loader({ request, params, context }: LoaderFunctionArgs) {
  // Conserver l'URL d'origine pour l'utiliser comme canonical
  const url = new URL(request.url);
  const originalPath = url.pathname + url.search;
  
${paramMapping}
  
  // Appeler le loader de la route moderne avec les paramètres adaptés
  const result = await originalLoader({ 
    request, 
    params,
    context 
  });
  
  // Ajouter l'URL originale pour le canonical
  const data = result instanceof Response ? await result.json() : result;
  
  return json({
    ...data,
    canonical: originalPath,
    legacyUrl: true
  });
}

/**
 * Le composant de route renvoie simplement le composant moderne
 */
export default function LegacyRoute() {
  const data = useLoaderData<typeof loader>();
  
  // Passer les données au composant moderne
  return <RouteComponent />;
}

/**
 * Meta function qui assure que le canonical est correctement défini
 */
export function meta({ data }: { data: any }) {
  // Récupérer les meta du composant moderne si disponibles
  const baseMeta = typeof RouteComponent.meta === 'function' 
    ? RouteComponent.meta({ data }) 
    : [];
  
  // S'assurer qu'il y a une balise canonical qui pointe vers l'URL originale
  const hasCanonicalTag = baseMeta.some(
    (meta: any) => meta.rel === 'canonical' || (meta.tagName === 'link' && meta.rel === 'canonical')
  );
  
  if (!hasCanonicalTag && data?.canonical) {
    return [
      ...baseMeta,
      {
        rel: "canonical", 
        href: getCanonicalUrl(data.canonical)
      }
    ];
  }
  
  return baseMeta;
}

/**
 * Headers function qui ajoute les entêtes nécessaires
 */
export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return {
    "Cache-Control": "public, max-age=300",
    "Vary": "Accept-Encoding"
  };
}`;
}

/**
 * Générer l'utilitaire de gestion des URLs canoniques
 * @returns {string} Contenu du fichier utilitaire
 */
function generateCanonicalUtil() {
    return `/**
 * Utilitaires pour gérer les URLs canoniques
 * Ce fichier a été généré automatiquement par le script legacy-url-manager.js
 */

// URL de base du site (à configurer selon votre environnement)
const BASE_URL = process.env.CANONICAL_BASE_URL || 'https://votre-site.fr';

/**
 * Génère une URL canonique complète à partir d'un chemin relatif
 * @param path Chemin relatif (commençant par /)
 * @returns URL canonique complète
 */
export function getCanonicalUrl(path: string): string {
  // S'assurer que le chemin commence par un slash
  const normalizedPath = path.startsWith('/') ? path : \`/\${path}\`;
  
  return \`\${BASE_URL}\${normalizedPath}\`;
}

/**
 * Vérifie si une URL est une URL legacy (avec .php)
 * @param url URL à vérifier
 * @returns true si c'est une URL legacy
 */
export function isLegacyUrl(url: string): boolean {
  return url.includes('.php');
}

/**
 * Extrait les paramètres importants d'une URL legacy
 * @param url URL legacy à analyser
 * @returns Objet contenant les paramètres importants
 */
export function extractLegacyParams(url: string): Record<string, string> {
  try {
    // Ajouter un domaine factice si l'URL ne commence pas par http(s)
    const fullUrl = url.startsWith('http') ? url : \`http://example.com\${url}\`;
    const parsedUrl = new URL(fullUrl);
    
    const params: Record<string, string> = {};
    
    // Extraire tous les paramètres de l'URL
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  } catch (error) {
    console.error(\`Erreur lors de l'analyse de l'URL legacy: \${error}\`);
    return {};
  }
}`;
}

/**
 * Tester les URLs générées
 * @param {string} filePath - Chemin vers le fichier d'URLs
 * @param {string} baseUrl - URL de base pour les tests
 * @param {boolean} verbose - Mode verbeux
 * @returns {Object} Résultats des tests
 */
async function testUrls(filePath, baseUrl, verbose = false) {
    const startTime = Date.now();

    // Lire le fichier
    const content = await fs.readFile(filePath, 'utf-8');
    const urlLines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    // Initialiser les compteurs
    let success = 0;
    let failed = 0;

    // Tester chaque URL
    for (const urlLine of urlLines) {
        try {
            // Construire l'URL complète pour le test
            const testUrl = urlLine.startsWith('/')
                ? `${baseUrl}${urlLine}`
                : urlLine.startsWith('http')
                    ? urlLine
                    : `${baseUrl}/${urlLine}`;

            if (verbose) {
                process.stdout.write(chalk.blue(`🧪 Test de ${testUrl}... `));
            }

            // Faire une requête GET
            const response = await axios.get(testUrl, {
                validateStatus: null,
                timeout: 5000
            });

            if (response.status >= 200 && response.status < 400) {
                if (verbose) {
                    console.log(chalk.green(`✅ OK (${response.status})`));
                }
                success++;
            } else {
                if (verbose) {
                    console.log(chalk.red(`❌ Échec (${response.status})`));
                }
                failed++;
            }
        } catch (error) {
            if (verbose) {
                console.log(chalk.red(`❌ Erreur: ${error.message}`));
            }
            failed++;
        }
    }

    const endTime = Date.now();

    return {
        total: urlLines.length,
        success,
        failed,
        executionTime: endTime - startTime
    };
}

// Point d'entrée principal
program.parse();