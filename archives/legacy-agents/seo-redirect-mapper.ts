import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface RedirectMapping {
  source: string;
  destination: string;
  statusCode: number;
  preserveQuery: boolean;
}

interface LegacyUrlConfig {
  pattern: string;
  handler: string;
  preserveQueryParams?: boolean;
  modernPath?: string;
  type?: string;
}

/**
 * Classe SeoRedirectMapper - Gère la préservation des anciennes URLs PHP sans redirection
 * Cette approche permet de conserver les anciennes URLs tout en utilisant
 * l'architecture moderne de l'application.
 */
export class SeoRedirectMapper {
  private mappings: RedirectMapping[] = [];
  private legacyConfigs: LegacyUrlConfig[] = [];

  constructor(private configPath: string = path.join(process.cwd(), 'config', 'legacy-urls.json')) {
    this.loadConfigurations();
  }

  private loadConfigurations(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const rawData = fs.readFileSync(this.configPath, 'utf-8');
        this.legacyConfigs = JSON.parse(rawData);
        console.log(`Chargé ${this.legacyConfigs.length} configurations d'URL legacy`);
      } else {
        console.warn(`Le fichier de configuration ${this.configPath} n'existe pas. Utilisation d'une configuration vide.`);
        this.legacyConfigs = [];
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des configurations: ${error}`);
      this.legacyConfigs = [];
    }
  }

  /**
   * Génère des configurations de préservation à partir d'un fichier d'URLs legacy
   * @param legacyUrlsFile Chemin vers le fichier contenant les URLs legacy
   * @param outputFile Chemin où sauvegarder la configuration générée
   * @param framework Framework utilisé ('remix', 'next', ou 'caddy')
   */
  public generatePreservationConfigs(legacyUrlsFile: string, outputFile: string, framework: string = 'remix'): void {
    try {
      const content = fs.readFileSync(legacyUrlsFile, 'utf-8');
      const urls = content.split('\n')
        .filter(url => url.trim() !== '' && !url.trim().startsWith('#'))
        .map(url => url.trim());

      console.log(`Analyse de ${urls.length} URLs legacy...`);

      const parsedUrls = urls.map(url => this.parseUrl(url));
      const groupedUrls = this.groupUrlsByType(parsedUrls);

      // Générer la configuration selon le framework
      let config: any;
      switch (framework) {
        case 'remix':
          config = this.generateRemixConfig(parsedUrls, groupedUrls);
          break;
        case 'next':
          config = this.generateNextConfig(parsedUrls, groupedUrls);
          break;
        case 'caddy':
          config = this.generateCaddyConfig(parsedUrls, groupedUrls);
          break;
        default:
          throw new Error(`Framework non supporté: ${framework}`);
      }

      // Ajouter des métadonnées
      config.metadata = {
        generated: new Date().toISOString(),
        totalUrls: urls.length,
        framework,
      };

      // Écrire la configuration
      fs.writeFileSync(outputFile, JSON.stringify(config, null, 2));
      console.log(`Configuration générée avec succès: ${outputFile}`);

      // Générer les fichiers supplémentaires selon le framework
      this.generateAdditionalFiles(config, outputFile, framework);

    } catch (error) {
      console.error(`Erreur lors de la génération des configurations: ${error}`);
    }
  }

  /**
   * Génère des fichiers supplémentaires selon le framework
   */
  private generateAdditionalFiles(config: any, outputFile: string, framework: string): void {
    const baseDir = path.dirname(outputFile);

    switch (framework) {
      case 'remix': {
        // Générer les handlers de routes legacy pour Remix
        const legacyRoutesDir = path.join(baseDir, '..', 'app', 'routes', 'legacy');
        fs.mkdirSync(legacyRoutesDir, { recursive: true });

        // Pour chaque type de route, générer un handler
        Object.entries(config.routes).forEach(([type, routeConfig]: [string, any]) => {
          const filePath = path.join(legacyRoutesDir, `${type}.legacy.tsx`);
          const routeContent = this.generateRemixRouteHandler(type, routeConfig);

          fs.writeFileSync(filePath, routeContent);
          console.log(`Handler de route généré: ${filePath}`);
        });

        // Générer un utilitaire pour les URLs canoniques
        const utilsDir = path.join(baseDir, '..', 'app', 'utils');
        fs.mkdirSync(utilsDir, { recursive: true });

        const canonicalUtil = path.join(utilsDir, 'canonical.ts');
        fs.writeFileSync(canonicalUtil, this.generateCanonicalUtil());
        console.log(`Utilitaire pour les URLs canoniques généré: ${canonicalUtil}`);
        break;
      }

      case 'next': {
        // Générer un exemple de configuration Next.js
        const nextConfigPath = path.join(baseDir, 'next-legacy-config.js');
        fs.writeFileSync(nextConfigPath, this.generateNextConfigFile(config));
        console.log(`Exemple de configuration Next.js généré: ${nextConfigPath}`);
        break;
      }

      case 'caddy': {
        // Générer la configuration Caddy
        const caddyConfigPath = path.join(baseDir, 'legacy-urls.caddy');
        fs.writeFileSync(caddyConfigPath, this.generateCaddyConfigFile(config));
        console.log(`Configuration Caddy générée: ${caddyConfigPath}`);
        break;
      }
    }
  }

  /**
   * Parse une URL legacy pour extraire les informations importantes
   */
  private parseUrl(urlString: string): any {
    try {
      // Ajouter un domaine factice si l'URL ne commence pas par http(s)
      const fullUrl = urlString.startsWith('http') ? urlString : `http://example.com${urlString}`;
      const parsedUrl = new URL(fullUrl);

      // Extraire le chemin et les paramètres de requête
      const pathname = parsedUrl.pathname;
      const search = parsedUrl.search;

      // Détecter le type d'URL
      let type = 'generic';
      let params: Record<string, string> = {};

      // Convertir les paramètres de requête en objet
      const queryParams: Record<string, string> = {};
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
        modernPath: this.generateModernPath(type, params),
      };
    } catch (error) {
      console.warn(`Erreur lors de l'analyse de l'URL ${urlString}: ${error}`);
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
   */
  private generateModernPath(type: string, params: Record<string, string>): string {
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
   */
  private groupUrlsByType(parsedUrls: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

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
   */
  private generateRemixConfig(parsedUrls: any[], groupedUrls: Record<string, any[]>): any {
    const urlMapping = {
      preservedUrls: {} as Record<string, any>,
      routes: {} as Record<string, any>,
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

    // Pour chaque groupe d'URL de même type
    Object.entries(groupedUrls).forEach(([type, urls]) => {
      // Configurer la route pour ce type
      const componentPath = routeComponentMap[type as keyof typeof routeComponentMap] || routeComponentMap.generic;

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
   */
  private generateNextConfig(parsedUrls: any[], groupedUrls: Record<string, any[]>): any {
    const urlMapping = {
      preservedUrls: {} as Record<string, any>,
      rewrites: [] as any[],
      routes: {} as Record<string, any>,
      totalUrls: parsedUrls.length,
      totalRoutes: 0,
    };

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
   */
  private generateCaddyConfig(parsedUrls: any[], groupedUrls: Record<string, any[]>): any {
    const urlMapping = {
      preservedUrls: {} as Record<string, any>,
      caddyRules: [] as any[],
      totalUrls: parsedUrls.length,
    };

    // Grouper les URLs par chemin de base pour réduire le nombre de règles
    const pathGroups: Record<string, any[]> = {};

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
   * Génère un gestionnaire de route Remix pour un type spécifique
   */
  private generateRemixRouteHandler(routeType: string, routeConfig: any): string {
    // Convertir les types en chemins de composants appropriés
    const componentMap: Record<string, string> = {
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
 * Ce fichier a été généré automatiquement par SeoRedirectMapper
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
  ${this.generateLoaderCodeForType(routeType)}
  
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
  private generateLoaderCodeForType(routeType: string): string {
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
   * Génère le contenu de l'utilitaire pour les URLs canoniques
   */
  private generateCanonicalUtil(): string {
    return `/**
 * Utilitaires pour gérer les URLs canoniques
 * Généré automatiquement par SeoRedirectMapper
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
}
`;
  }

  /**
   * Génère un exemple de configuration Next.js
   */
  private generateNextConfigFile(config: any): string {
    return `/**
 * Exemple de configuration Next.js pour préserver les URLs legacy
 * Généré automatiquement par SeoRedirectMapper
 */

/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      // URLs legacy préservées (${config.totalUrls} URLs)
      ${config.rewrites.slice(0, 5).map(rewrite =>
      `{
        source: '${rewrite.source}',
        destination: '${rewrite.destination}',
        locale: false,
      }`).join(',\n      ')}${config.rewrites.length > 5 ? ',\n      // ... et ' + (config.rewrites.length - 5) + ' autres rewrites' : ''}
    ]
  }
}
`;
  }

  /**
   * Génère un exemple de configuration Caddy
   */
  private generateCaddyConfigFile(config: any): string {
    let caddyContent = `# Configuration Caddy pour la préservation des URLs legacy
# Généré automatiquement par SeoRedirectMapper le ${new Date().toISOString()}
# Total: ${config.totalUrls} URLs préservées

`;

    // Ajouter chaque règle
    config.caddyRules.forEach((rule: any) => {
      caddyContent += `# Routes pour ${rule.path} (${rule.urls} URLs)
${rule.rule}

`;
    });

    return caddyContent;
  }

  /**
   * Vérifie si une URL correspond à un pattern d'URL legacy
   * @param url URL à vérifier
   * @returns Le gestionnaire à utiliser pour cette URL, ou null si aucune correspondance
   */
  public matchLegacyUrl(url: string): { handler: string, params: Record<string, string>, preserveQuery: boolean } | null {
    const parsedUrl = new URL(url, 'http://example.com');
    const pathname = parsedUrl.pathname;

    for (const config of this.legacyConfigs) {
      // Convertir le pattern en expression régulière
      const regexPattern = config.pattern
        .replace(/\//g, '\\/') // Échapper les slashes
        .replace(/\{(\w+)\}/g, '(?<$1>[^/]+)'); // Convertir {param} en groupes nommés

      const regex = new RegExp(`^${regexPattern}$`);
      const match = pathname.match(regex);

      if (match) {
        return {
          handler: config.handler,
          params: match.groups || {},
          preserveQuery: config.preserveQueryParams || false
        };
      }
    }

    return null;
  }

  /**
   * Teste toutes les URLs legacy pour vérifier si elles sont correctement gérées
   * @param legacyUrlsFile Fichier contenant les URLs à tester
   * @param baseUrl URL de base de l'application
   */
  public async testPreservation(legacyUrlsFile: string, baseUrl: string): Promise<void> {
    try {
      const content = fs.readFileSync(legacyUrlsFile, 'utf-8');
      const urls = content.split('\n')
        .filter(url => url.trim() !== '' && !url.trim().startsWith('#'))
        .map(url => url.trim());

      console.log(`Test de ${urls.length} URLs legacy...`);

      let successCount = 0;
      let failureCount = 0;
      let noRedirectCount = 0;

      for (const url of urls) {
        try {
          if (!url) continue;

          const testUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
          console.log(`Test de l'URL: ${testUrl}`);

          const response = await axios.get(testUrl, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400,
            headers: {
              'User-Agent': 'SeoRedirectMapper/1.0'
            }
          });

          if (response.status === 200) {
            const hasCanonical = response.headers['link']?.includes('rel="canonical"') ||
              false;  // Vérifiez également dans le HTML pour être plus précis

            if (hasCanonical) {
              console.log(`✅ URL ${url} correctement préservée avec canonical`);
              successCount++;
            } else {
              console.log(`⚠️ URL ${url} préservée mais sans canonical`);
              noRedirectCount++;
            }
          } else if (response.status >= 300 && response.status < 400) {
            console.warn(`⚠️ URL ${url} redirige (${response.status})`);
            failureCount++;
          } else {
            console.log(`✅ URL ${url} préservée (statut ${response.status})`);
            successCount++;
          }
        } catch (error: any) {
          if (error.response?.status >= 300 && error.response?.status < 400) {
            console.warn(`⚠️ URL ${url} redirige (${error.response.status})`);
            failureCount++;
          } else {
            console.error(`❌ Erreur lors du test de ${url}: ${error.message}`);
            failureCount++;
          }
        }
      }

      console.log(`
Test terminé:
✅ ${successCount} URLs correctement préservées
⚠️ ${noRedirectCount} URLs préservées mais sans canonical
❌ ${failureCount} échecs (redirections ou erreurs)
      `);

    } catch (error) {
      console.error(`Erreur lors du test des URLs: ${error}`);
    }
  }
}

// Si exécuté directement
if (require.main === module) {
  const mapper = new SeoRedirectMapper();

  // Exemple d'utilisation
  const args = process.argv.slice(2);

  if (args[0] === 'generate' && args.length >= 3) {
    const framework = args.length >= 4 ? args[3] : 'remix';
    mapper.generatePreservationConfigs(args[1], args[2], framework);
  } else if (args[0] === 'test' && args.length >= 3) {
    mapper.testPreservation(args[1], args[2]);
  } else {
    console.log('Usage:');
    console.log('  node seo-redirect-mapper.ts generate <fichier-urls> <fichier-sortie> [framework]');
    console.log('  node seo-redirect-mapper.ts test <fichier-urls> <base-url>');
    console.log('');
    console.log('Frameworks supportés: remix, next, caddy');
  }
}
