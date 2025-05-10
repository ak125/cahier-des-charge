#!/usr/bin/env node
/**
 * Outil CLI pour la gestion des URLs legacy sans redirection
 * 
 * Cet outil permet de :
 * - Analyser des fichiers contenant des anciennes URLs PHP
 * - Générer des configurations pour différents frameworks
 * - Tester la préservation des URLs legacy
 * - Créer des handlers pour gérer les anciennes URLs
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { SeoRedirectMapper } from ../..@cahier-des-charge/business/src/agents/seo-redirect-mapper';

// Création du programme CLI
const program = new Command();

program
    .name('legacy-url-manager')
    .description('Outil de gestion des URLs legacy sans redirection')
    .version('1.0.0');

/**
 * Commande pour analyser les URLs legacy
 */
program
    .command('analyze')
    .description('Analyser un fichier contenant des URLs legacy')
    .argument('<file>', 'Fichier contenant les URLs legacy (une par ligne)')
    .action((file) => {
        try {
            console.log(chalk.blue(`📊 Analyse du fichier ${file}...`));

            if (!fs.existsSync(file)) {
                console.error(chalk.red(`❌ Le fichier ${file} n'existe pas.`));
                process.exit(1);
            }

            const content = fs.readFileSync(file, 'utf-8');
            const urls = content.split('\n')
                .filter(url => url.trim() !== '' && !url.trim().startsWith('#'))
                .map(url => url.trim());

            console.log(chalk.green(`✅ ${urls.length} URLs trouvées dans le fichier.`));

            // Analyser les motifs d'URL
            const patterns: Record<string, number> = {};
            const extensions: Record<string, number> = {};
            const params: Record<string, number> = {};

            urls.forEach(url => {
                try {
                    // Ajouter un domaine factice si l'URL ne commence pas par http(s)
                    const fullUrl = url.startsWith('http') ? url : `http://example.com${url}`;
                    const parsed = new URL(fullUrl);

                    // Extraire le chemin de base (sans les paramètres)
                    const basePath = parsed.pathname;
                    if (!patterns[basePath]) patterns[basePath] = 0;
                    patterns[basePath]++;

                    // Extraire l'extension
                    const ext = path.extname(basePath);
                    if (ext) {
                        if (!extensions[ext]) extensions[ext] = 0;
                        extensions[ext]++;
                    }

                    // Extraire les paramètres
                    parsed.searchParams.forEach((value, key) => {
                        if (!params[key]) params[key] = 0;
                        params[key]++;
                    });
                } catch (error) {
                    console.warn(chalk.yellow(`⚠️ URL invalide ignorée: ${url}`));
                }
            });

            // Afficher les résultats
            console.log('\n' + chalk.blue('📊 Résultats de l\'analyse:'));

            console.log('\n' + chalk.cyan('📁 Extensions trouvées:'));
            Object.entries(extensions)
                .sort((a, b) => b[1] - a[1])
                .forEach(([ext, count]) => {
                    console.log(`  ${ext}: ${count} (${Math.round(count / urls.length * 100)}%)`);
                });

            console.log('\n' + chalk.cyan('🔍 Paramètres les plus fréquents:'));
            Object.entries(params)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([param, count]) => {
                    console.log(`  ${param}: ${count} (${Math.round(count / urls.length * 100)}%)`);
                });

            console.log('\n' + chalk.cyan('🗂️ Chemins les plus fréquents:'));
            Object.entries(patterns)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([pattern, count]) => {
                    console.log(`  ${pattern}: ${count} (${Math.round(count / urls.length * 100)}%)`);
                });

            console.log('\n' + chalk.green('✅ Analyse terminée !'));

        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors de l'analyse: ${error}`));
            process.exit(1);
        }
    });

/**
 * Commande pour générer des configurations pour différents frameworks
 */
program
    .command('generate')
    .description('Générer des configurations pour préserver les URLs legacy')
    .argument('<file>', 'Fichier contenant les URLs legacy (une par ligne)')
    .argument('<output>', 'Fichier de sortie pour la configuration générée')
    .option('-f, --framework <framework>', 'Framework cible (remix, next, ou caddy)', 'remix')
    .action((file, output, options) => {
        try {
            const framework = options.framework || 'remix';

            console.log(chalk.blue(`🔧 Génération de la configuration ${framework} à partir de ${file}...`));

            if (!fs.existsSync(file)) {
                console.error(chalk.red(`❌ Le fichier ${file} n'existe pas.`));
                process.exit(1);
            }

            // Créer le dossier de sortie s'il n'existe pas
            const outputDir = path.dirname(output);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Utiliser notre classe SeoRedirectMapper pour générer la configuration
            const mapper = new SeoRedirectMapper();
            mapper.generatePreservationConfigs(file, output, framework);

            console.log(chalk.green(`✅ Configuration générée avec succès: ${output}`));

        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors de la génération: ${error}`));
            process.exit(1);
        }
    });

/**
 * Commande pour tester la préservation des URLs legacy
 */
program
    .command('test')
    .description('Tester la préservation des URLs legacy')
    .argument('<file>', 'Fichier contenant les URLs legacy (une par ligne)')
    .argument('<baseUrl>', 'URL de base de l\'application')
    .option('-l, --limit <number>', 'Nombre maximal d\'URLs à tester', '10')
    .action((file, baseUrl, options) => {
        try {
            const limit = parseInt(options.limit) || 10;

            console.log(chalk.blue(`🧪 Test de la préservation des URLs legacy...`));

            if (!fs.existsSync(file)) {
                console.error(chalk.red(`❌ Le fichier ${file} n'existe pas.`));
                process.exit(1);
            }

            // Lire le fichier et limiter le nombre d'URLs à tester
            const content = fs.readFileSync(file, 'utf-8');
            const urls = content.split('\n')
                .filter(url => url.trim() !== '' && !url.trim().startsWith('#'))
                .map(url => url.trim())
                .slice(0, limit);

            console.log(chalk.blue(`🧪 Test de ${urls.length} URLs sur ${baseUrl}...`));

            // Utiliser notre classe SeoRedirectMapper pour tester les URLs
            const mapper = new SeoRedirectMapper();
            mapper.testPreservation(file, baseUrl);

        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors du test: ${error}`));
            process.exit(1);
        }
    });

/**
 * Commande pour extraire les URLs legacy d'un fichier log d'un serveur web
 */
program
    .command('extract')
    .description('Extraire les URLs legacy d\'un fichier log')
    .argument('<file>', 'Fichier log (Apache, Nginx, etc.)')
    .argument('<output>', 'Fichier de sortie pour les URLs extraites')
    .option('-p, --pattern <pattern>', 'Motif pour filtrer les URLs (.php par défaut)', '.php')
    .action((file, output, options) => {
        try {
            const pattern = options.pattern || '.php';

            console.log(chalk.blue(`🔍 Extraction des URLs ${pattern} depuis ${file}...`));

            if (!fs.existsSync(file)) {
                console.error(chalk.red(`❌ Le fichier ${file} n'existe pas.`));
                process.exit(1);
            }

            // Lire le fichier log
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            console.log(chalk.blue(`📊 Analyse de ${lines.length} lignes...`));

            // Regex pour extraire les URLs
            const urlRegex = /GET ([^ ]+) HTTP/gi;
            const extractedUrls = new Set<string>();

            lines.forEach(line => {
                const matches = line.matchAll(urlRegex);
                for (const match of matches) {
                    if (match[1] && match[1].includes(pattern)) {
                        extractedUrls.add(match[1]);
                    }
                }
            });

            // Écrire les URLs extraites dans le fichier de sortie
            const urlsArray = Array.from(extractedUrls);
            fs.writeFileSync(output, urlsArray.join('\n'));

            console.log(chalk.green(`✅ ${urlsArray.length} URLs extraites et enregistrées dans ${output}`));

        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors de l'extraction: ${error}`));
            process.exit(1);
        }
    });

/**
 * Commande pour créer un squelette de handler pour une route legacy
 */
program
    .command('create-handler')
    .description('Créer un handler pour une route legacy')
    .argument('<type>', 'Type de handler (product, category, brand, article, search, generic)')
    .argument('<output>', 'Dossier où créer le handler')
    .action((type, output) => {
        try {
            console.log(chalk.blue(`🛠️ Création d'un handler pour les routes de type '${type}'...`));

            // Vérifier que le type est valide
            const validTypes = ['product', 'category', 'brand', 'article', 'search', 'generic'];
            if (!validTypes.includes(type)) {
                console.error(chalk.red(`❌ Type invalide. Utilisez un des types suivants: ${validTypes.join(', ')}`));
                process.exit(1);
            }

            // Créer le dossier de sortie s'il n'existe pas
            if (!fs.existsSync(output)) {
                fs.mkdirSync(output, { recursive: true });
            }

            // Définir le contenu du handler selon le type
            const handlerContent = generateHandlerContent(type);

            // Écrire le handler dans un fichier
            const filePath = path.join(output, `${type}.legacy.tsx`);
            fs.writeFileSync(filePath, handlerContent);

            console.log(chalk.green(`✅ Handler créé avec succès: ${filePath}`));

        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors de la création du handler: ${error}`));
            process.exit(1);
        }
    });

/**
 * Fonction pour générer le contenu d'un handler selon le type
 */
function generateHandlerContent(type: string): string {
    const componentMap: Record<string, string> = {
        'product': '~/routes/produit.$id',
        'category': '~/routes/categorie.$id',
        'brand': '~/routes/marque.$id',
        'article': '~/routes/blog.$slug',
        'search': '~/routes/recherche',
        'generic': '~/routes/legacy.$path',
    };

    const importPath = componentMap[type];

    let loaderCode = '';
    switch (type) {
        case 'product':
            loaderCode = `  // Extraire l'ID du produit depuis les paramètres de requête
  let productId = new URLSearchParams(originalUrl.search).get('id');
  if (productId) {
    // Remplacer les paramètres pour qu'ils correspondent à la route moderne
    params.id = productId;
  }`;
            break;
        case 'category':
            loaderCode = `  // Extraire l'ID de catégorie depuis les paramètres de requête
  let categoryId = new URLSearchParams(originalUrl.search).get('id');
  let categorySlug = new URLSearchParams(originalUrl.search).get('slug');
  if (categoryId) {
    // Remplacer les paramètres pour qu'ils correspondent à la route moderne
    params.id = categoryId;
  }
  if (categorySlug) {
    params.slug = categorySlug;
  }`;
            break;
        case 'brand':
            loaderCode = `  // Extraire l'ID de marque depuis les paramètres de requête
  let brandId = new URLSearchParams(originalUrl.search).get('id');
  let brandSlug = new URLSearchParams(originalUrl.search).get('slug');
  if (brandId) {
    // Remplacer les paramètres pour qu'ils correspondent à la route moderne
    params.id = brandId;
  }
  if (brandSlug) {
    params.slug = brandSlug;
  }`;
            break;
        case 'search':
            loaderCode = `  // Préserver les paramètres de recherche
  let query = new URLSearchParams(originalUrl.search).get('q');
  if (query) {
    // Créer une nouvelle requête avec les mêmes paramètres
    const newUrl = new URL(request.url);
    newUrl.searchParams.set('q', query);
    request = new Request(newUrl, request);
  }`;
            break;
        default:
            loaderCode = `  // Conserver tous les paramètres de requête
  // Aucune transformation spécifique nécessaire pour ce type de route`;
    }

    return `/**
 * Handler de route legacy pour les URLs de type "${type}"
 * Ce fichier a été généré automatiquement par legacy-url-manager
 */
 
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Importer le composant et le loader du chemin moderne équivalent
import { default as RouteComponent, loader as originalLoader } from "${importPath}";

/**
 * Loader qui préserve les URLs PHP legacy tout en utilisant les données
 * des nouvelles routes
 */
export async function loader({ request, params, context }: LoaderFunctionArgs) {
  // Conserver l'URL d'origine dans les données pour l'utiliser comme canonical
  const originalUrl = new URL(request.url);
  
  // Extraire l'ID ou autres paramètres importants selon le type
${loaderCode}
  
  // Appeler le loader de la route moderne avec les paramètres adaptés
  const result = await originalLoader({ 
    request, 
    params,
    context 
  });
  
  // Modifier les données pour inclure l'URL originale pour le canonical
  const data = result instanceof Response ? await result.json() : result;
  
  return json({
    ...data,
    canonical: originalUrl.pathname + originalUrl.search,
    legacyUrl: true
  });
}

/**
 * Le composant de route renvoie simplement le composant moderne
 */
export default function LegacyRoute() {
  const data = useLoaderData<typeof loader>();
  
  // Passer les données modifiées au composant moderne
  return <RouteComponent />;
}

/**
 * Meta function qui assure que le canonical est correctement défini
 */
export function meta({ data }: { data: any }) {
  // Si meta existe dans le module importé, l'utiliser comme base
  const baseMeta = RouteComponent.meta ? RouteComponent.meta({ data }) : [];
  
  // S'assurer qu'il y a une balise canonical qui pointe vers l'URL originale
  const hasCanonicalTag = baseMeta.some(
    (meta: any) => meta.rel === 'canonical' || meta.tagName === 'link' && meta.rel === 'canonical'
  );
  
  if (!hasCanonicalTag && data?.canonical) {
    return [
      ...baseMeta,
      {
        rel: "canonical", 
        href: data.canonical
      }
    ];
  }
  
  return baseMeta;
}`;
}

// Analyser les arguments de la ligne de commande et exécuter le programme
program.parse(process.argv);

// Si aucune commande n'est spécifiée, afficher l'aide
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
