#!/usr/bin/env node
/**
 * Script de génération des configurations pour préserver les anciennes URLs PHP
 * 
 * Ce script analyse un fichier d'URLs legacy et génère les configurations nécessaires
 * pour préserver ces URLs sans faire de redirection, en fonction du framework choisi.
 * 
 * Usage:
 *   node preserve-legacy-urls.js --urls=./legacy-urls.txt --output=./url-preservation-map.json --type=remix
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const url = require('url');

// Définir les options de ligne de commande
program
  .description('Génère la configuration pour préserver les anciennes URLs PHP sans redirection')
  .option('-u, --urls <path>', 'Chemin vers le fichier contenant les URLs à préserver')
  .option('-o, --output <path>', 'Chemin de sortie pour le fichier de configuration', './url-preservation-map.json')
  .option('-c, --config-path <path>', 'Chemin vers le dossier de configuration', './app/config')
  .option('-t, --type <type>', 'Type de configuration à générer: remix, next, ou caddy', 'remix')
  .parse();

const options = program.opts();

/**
 * Charge la liste des anciennes URLs depuis un fichier
 * @param {string} filePath - Chemin vers le fichier d'URLs
 */
async function loadLegacyUrls(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    console.error(chalk.red(`Erreur lors du chargement des URLs: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Parse une URL pour extraire les informations importantes
 * @param {string} urlString - URL à analyser
 */
function parseUrl(urlString) {
  try {
    // Ajouter un domaine factice si l'URL ne commence pas par http(s)
    const fullUrl = urlString.startsWith('http') ? urlString : `http://example.com${urlString}`;
    const parsedUrl = new URL(fullUrl);

    // Extraire le chemin et les paramètres de requête
    const pathname = parsedUrl.pathname;
    const search = parsedUrl.search;

    // Détecter le type d'URL
    let type = 'generic';
    let params = {};

    // Convertir les paramètres de requête en objet
    const queryParams = {};
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      queryParams[key] = value;
    }

    // Détecter le type d'URL basé sur le chemin ou les paramètres
    if (pathname.includes('produit.php') || pathname.includes('product.php') || pathname.includes('fiche.php')) {
      type = 'product';
      params = {
        id: queryParams.id || '',
        ref: queryParams.ref || '',
        lang: queryParams.lang || 'fr',
      };
    } else if (pathname.includes('categorie.php') || pathname.includes('category.php')) {
      type = 'category';
      params = {
        id: queryParams.id || '',
        page: queryParams.page || '1',
        sort: queryParams.sort || 'default',
      };
    } else if (pathname.includes('marque.php') || pathname.includes('brand.php')) {
      type = 'brand';
      params = {
        id: queryParams.id || '',
      };
    } else if (pathname.includes('recherche.php') || pathname.includes('search.php')) {
      type = 'search';
      params = {
        q: queryParams.q || '',
        filter: queryParams.filter || '',
      };
    } else if (pathname.includes('article.php') || pathname.includes('blog.php') || pathname.includes('news.php')) {
      type = 'article';
      params = {
        id: queryParams.id || '',
        slug: queryParams.slug || '',
      };
    }

    return {
      originalUrl: urlString,
      pathname,
      search,
      type,
      params,
      queryParams,
      // Pour la nouvelle URL moderne
      modernPath: generateModernPath(type, queryParams),
    };
  } catch (error) {
    console.warn(chalk.yellow(`Erreur lors de l'analyse de l'URL ${urlString}: ${error.message}`));
    return {
      originalUrl: urlString,
      pathname: urlString,
      search: '',
      type: 'unknown',
      params: {},
      queryParams: {},
      modernPath: '/404',
    };
  }
}

/**
 * Génère le chemin moderne pour un type d'URL et des paramètres donnés
 * @param {string} type - Type d'URL (product, category, etc.)
 * @param {Object} params - Paramètres de requête
 */
function generateModernPath(type, params) {
  switch (type) {
    case 'product':
      return `/produit/${params.id || 'unknown'}`;
    case 'category':
      return `/categorie/${params.id || 'unknown'}`;
    case 'brand':
      return `/marque/${params.id || 'unknown'}`;
    case 'search':
      return `/recherche${params.q ? `?q=${params.q}` : ''}`;
    case 'article':
      return `/blog/${params.slug || params.id || 'unknown'}`;
    default:
      // Pour les URLs génériques, conserver le chemin d'origine mais sans l'extension .php
      const pathname = params.page ? `/${params.page}` : '/';
      return pathname;
  }
}

/**
 * Groupe les URL par type pour faciliter la génération des routes
 * @param {Array} parsedUrls - Liste des URL analysées
 */
function groupUrlsByType(parsedUrls) {
  const groups = {};

  parsedUrls.forEach(url => {
    if (!groups[url.type]) {
      groups[url.type] = [];
    }
    groups[url.type].push(url);
  });

  return groups;
}

/**
 * Génère la configuration pour Remix.js
 * @param {Array} parsedUrls - Liste des URLs analysées
 */
function generateRemixConfig(parsedUrls) {
  const urlMapping = {
    preservedUrls: {},
    routes: {},
    totalUrls: parsedUrls.length,
    totalRoutes: 0,
  };

  const routeComponentMap = {
    product: '~/routes/legacy/product.legacy',
    category: '~/routes/legacy/category.legacy',
    brand: '~/routes/legacy/brand.legacy',
    search: '~/routes/legacy/search.legacy',
    article: '~/routes/legacy/article.legacy',
    generic: '~/routes/legacy/generic.legacy',
  };

  const groupedUrls = groupUrlsByType(parsedUrls);

  // Pour chaque groupe d'URL de même type
  Object.entries(groupedUrls).forEach(([type, urls]) => {
    // Configurer la route pour ce type
    const componentPath = routeComponentMap[type] || routeComponentMap.generic;

    urlMapping.routes[type] = {
      component: componentPath,
      loader: true,
      examples: urls.slice(0, 3).map(u => u.originalUrl),
    };

    urlMapping.totalRoutes++;

    // Pour chaque URL de ce type
    urls.forEach(url => {
      urlMapping.preservedUrls[url.originalUrl] = {
        type,
        path: url.pathname,
        params: url.params,
        component: componentPath,
      };
    });
  });

  return urlMapping;
}

/**
 * Génère la configuration pour Next.js
 * @param {Array} parsedUrls - Liste des URLs analysées
 */
function generateNextConfig(parsedUrls) {
  const urlMapping = {
    preservedUrls: {},
    rewrites: [],
    routes: {},
    totalUrls: parsedUrls.length,
    totalRoutes: 0,
  };

  const groupedUrls = groupUrlsByType(parsedUrls);

  // Pour chaque groupe d'URL de même type
  Object.entries(groupedUrls).forEach(([type, urls]) => {
    // Configurer le rewrite pour ce type
    const destination = `/${type}/[id]`;

    urlMapping.routes[type] = {
      page: destination,
      examples: urls.slice(0, 3).map(u => u.originalUrl),
    };

    urlMapping.totalRoutes++;

    // Pour chaque URL de ce type
    urls.forEach(url => {
      // Ajouter un rewrite pour cette URL spécifique
      urlMapping.rewrites.push({
        source: url.pathname + (url.search || ''),
        destination: url.modernPath,
        locale: false,
      });

      // Enregistrer l'URL dans le mapping global
      urlMapping.preservedUrls[url.originalUrl] = {
        type,
        path: url.pathname,
        params: url.params,
        page: destination,
      };
    });
  });

  return urlMapping;
}

/**
 * Génère la configuration pour Caddy
 * @param {Array} parsedUrls - Liste des URLs analysées
 */
function generateCaddyConfig(parsedUrls) {
  const urlMapping = {
    preservedUrls: {},
    caddyRules: [],
    totalUrls: parsedUrls.length,
  };

  // Grouper les URLs par chemin de base pour réduire le nombre de règles
  const pathGroups = {};

  parsedUrls.forEach(url => {
    const basePath = path.dirname(url.pathname);

    if (!pathGroups[basePath]) {
      pathGroups[basePath] = [];
    }

    pathGroups[basePath].push(url);

    // Enregistrer l'URL dans le mapping global
    urlMapping.preservedUrls[url.originalUrl] = {
      type: url.type,
      path: url.pathname,
      params: url.params,
    };
  });

  // Pour chaque groupe de chemin
  Object.entries(pathGroups).forEach(([basePath, urls]) => {
    urlMapping.caddyRules.push({
      path: `${basePath}/*`,
      rule: `handle_path ${basePath}/* {
  # Préserver l'URL exacte, pas de redirection
  rewrite * {http.request.uri.path}
  reverse_proxy localhost:3000
}`,
      urls: urls.length,
      examples: urls.slice(0, 3).map(u => u.originalUrl),
    });
  });

  return urlMapping;
}

/**
 * Écrit les fichiers de configuration nécessaires
 * @param {Object} config - Configuration générée
 * @param {string} outputPath - Chemin du fichier de sortie
 */
async function writeConfigFiles(config, outputPath, type, configPath) {
  try {
    // Écrire le fichier de mapping principal
    await fs.writeFile(outputPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✅ Configuration écrite dans ${outputPath}`));

    // Selon le type, générer des fichiers supplémentaires
    switch (type) {
      case 'remix': {
        const legacyRoutesDir = path.join(configPath, '..', 'routes', 'legacy');

        // Créer le dossier des routes legacy si nécessaire
        try {
          await fs.mkdir(legacyRoutesDir, { recursive: true });
          console.log(chalk.blue(`📁 Dossier des routes legacy créé: ${legacyRoutesDir}`));
        } catch (error) {
          if (error.code !== 'EEXIST') {
            throw error;
          }
        }

        // Générer un fichier pour chaque type de route
        for (const [type, routeConfig] of Object.entries(config.routes)) {
          const filePath = path.join(legacyRoutesDir, `${type}.legacy.tsx`);
          const routeContent = generateRemixRouteHandler(type, routeConfig);

          await fs.writeFile(filePath, routeContent);
          console.log(chalk.green(`✅ Handler de route généré pour ${type}: ${filePath}`));
        }
        break;
      }

      case 'caddy': {
        const caddyConfigDir = path.join(configPath, '..', '..', 'config', 'caddy');
        const caddyConfigPath = path.join(caddyConfigDir, 'legacy-urls.caddy');

        // Créer le dossier de config Caddy si nécessaire
        try {
          await fs.mkdir(caddyConfigDir, { recursive: true });
          console.log(chalk.blue(`📁 Dossier de config Caddy créé: ${caddyConfigDir}`));
        } catch (error) {
          if (error.code !== 'EEXIST') {
            throw error;
          }
        }

        // Générer la configuration Caddy
        let caddyContent = `# Configuration Caddy pour la préservation des URLs legacy
# Généré automatiquement le ${new Date().toISOString()}
# Total: ${config.totalUrls} URLs préservées

`;

        // Ajouter chaque règle
        config.caddyRules.forEach(rule => {
          caddyContent += `# Routes pour ${rule.path} (${rule.urls} URLs)
${rule.rule}

`;
        });

        await fs.writeFile(caddyConfigPath, caddyContent);
        console.log(chalk.green(`✅ Configuration Caddy générée: ${caddyConfigPath}`));
        break;
      }

      case 'next': {
        console.log(chalk.blue(`ℹ️ Pour Next.js, ajoutez les rewrites générés à votre fichier next.config.js`));
        break;
      }

      default:
        console.log(chalk.yellow(`⚠️ Aucun fichier supplémentaire généré pour le type ${type}`));
    }
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'écriture des fichiers de configuration: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Génère un gestionnaire de route Remix pour un type spécifique
 * @param {string} routeType - Type de route
 * @param {Object} routeConfig - Configuration de la route
 */
function generateRemixRouteHandler(routeType, routeConfig) {
  // Convertir les types en chemins de composants appropriés
  const componentMap = {
    'product': '~/routes/produit.$id',
    'category': '~/routes/categorie.$id',
    'brand': '~/routes/marque.$id',
    'article': '~/routes/blog.$slug',
    'search': '~/routes/recherche',
    'generic': '~/routes/legacy.$path',
  };

  const importPath = componentMap[routeType] || componentMap.generic;

  return `/**
 * Handler de route legacy pour les URLs de type "${routeType}"
 * Ce fichier a été généré automatiquement par le script preserve-legacy-urls.js
 */
 
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getCanonicalUrl } from "~/utils/canonical";

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
  ${generateLoaderCodeForType(routeType)}
  
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
        href: getCanonicalUrl(data.canonical)
      }
    ];
  }
  
  return baseMeta;
}`;
}

/**
 * Génère le code spécifique du loader selon le type de route
 */
function generateLoaderCodeForType(routeType) {
  switch (routeType) {
    case 'product':
      return `  // Extraire l'ID du produit depuis les paramètres de requête
  let productId = new URLSearchParams(originalUrl.search).get('id');
  if (productId) {
    // Remplacer les paramètres pour qu'ils correspondent à la route moderne
    params.id = productId;
  }`;

    case 'category':
      return `  // Extraire l'ID de catégorie depuis les paramètres de requête
  let categoryId = new URLSearchParams(originalUrl.search).get('id');
  let categorySlug = new URLSearchParams(originalUrl.search).get('slug');
  if (categoryId) {
    // Remplacer les paramètres pour qu'ils correspondent à la route moderne
    params.id = categoryId;
  }
  if (categorySlug) {
    params.slug = categorySlug;
  }`;

    case 'brand':
      return `  // Extraire l'ID de marque depuis les paramètres de requête
  let brandId = new URLSearchParams(originalUrl.search).get('id');
  let brandSlug = new URLSearchParams(originalUrl.search).get('slug');
  if (brandId) {
    // Remplacer les paramètres pour qu'ils correspondent à la route moderne
    params.id = brandId;
  }
  if (brandSlug) {
    params.slug = brandSlug;
  }`;

    case 'search':
      return `  // Préserver les paramètres de recherche
  let query = new URLSearchParams(originalUrl.search).get('q');
  if (query) {
    // Créer une nouvelle requête avec les mêmes paramètres
    const newUrl = new URL(request.url);
    newUrl.searchParams.set('q', query);
    request = new Request(newUrl, request);
  }`;

    default:
      return `  // Conserver tous les paramètres de requête
  // Aucune transformation spécifique nécessaire pour ce type de route`;
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    if (!options.urls) {
      console.error(chalk.red('Vous devez spécifier un fichier d\'URLs avec --urls'));
      process.exit(1);
    }

    console.log(chalk.blue(`🔍 Analyse des URLs depuis ${options.urls}`));
    const legacyUrls = await loadLegacyUrls(options.urls);
    console.log(chalk.blue(`📊 ${legacyUrls.length} URLs trouvées`));

    // Analyser chaque URL
    const parsedUrls = legacyUrls.map(parseUrl);

    // Générer la configuration selon le type demandé
    let config;
    switch (options.type) {
      case 'remix':
        config = generateRemixConfig(parsedUrls);
        break;
      case 'next':
        config = generateNextConfig(parsedUrls);
        break;
      case 'caddy':
        config = generateCaddyConfig(parsedUrls);
        break;
      default:
        console.error(chalk.red(`Type de configuration non supporté: ${options.type}`));
        process.exit(1);
    }

    // Écrire les fichiers de configuration
    await writeConfigFiles(config, options.output, options.type, options.configPath);

    console.log(chalk.green(`✅ Configuration générée avec succès pour ${parsedUrls.length} URLs en mode ${options.type}`));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
}

// Lancer le script
main();