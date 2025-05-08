/**
 * Agent de préservation des URLs legacy
 * 
 * Cet agent permet de maintenir les anciennes URLs PHP sans effectuer de redirection,
 * conformément à la stratégie SEO qui consiste à préserver exactement les mêmes URLs
 * pour ne pas perdre le référencement acquis.
 */

import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import { BaseAgent } from '../core/base-agent';

interface PreservationConfig {
    preserveLegacyUrls: boolean;
    legacyUrlMap: string;
    routeHandler: string;
    stripQueryParams: boolean;
    allowedQueryParams: string[];
}

interface PreservedUrl {
    type: string;
    path: string;
    params: Record<string, string>;
    component?: string;
    loader?: string;
}

interface UrlMapping {
    preservedUrls: Record<string, PreservedUrl>;
    routes: Record<string, {
        component: string;
        loader: boolean;
        examples: string[];
    }>;
    totalUrls: number;
    totalRoutes: number;
}

/**
 * Agent responsable de la préservation des anciennes URLs PHP
 * sans effectuer de redirection HTTP (pour préserver le SEO).
 */
export class UrlPreservationAgent extends BaseAgent {
    private config: PreservationConfig = {
        preserveLegacyUrls: true,
        legacyUrlMap: './url-preservation-map.json',
        routeHandler: 'remix',
        stripQueryParams: false,
        allowedQueryParams: ['id', 'q', 'ref']
    };

    private urlMapping: UrlMapping | null = null;

    constructor() {
        super('url-preservation-agent');
    }

    /**
     * Charge la configuration
     */
    async loadConfig(configPath: string): Promise<boolean> {
        try {
            this.logger.info(`Chargement de la configuration depuis ${configPath}`);
            const configContent = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent);

            if (config.preserveLegacyUrls !== undefined) {
                this.config.preserveLegacyUrls = config.preserveLegacyUrls;
            }

            if (config.legacyUrlMap) {
                this.config.legacyUrlMap = config.legacyUrlMap;
            }

            if (config.routeHandler) {
                this.config.routeHandler = config.routeHandler;
            }

            if (config.stripQueryParams !== undefined) {
                this.config.stripQueryParams = config.stripQueryParams;
            }

            if (Array.isArray(config.allowedQueryParams)) {
                this.config.allowedQueryParams = config.allowedQueryParams;
            }

            this.logger.info(`Configuration chargée: ${JSON.stringify(this.config)}`);
            return true;
        } catch (error) {
            this.logger.error(`Erreur lors du chargement de la configuration: ${error.message}`);
            return false;
        }
    }

    /**
     * Charge la carte des URLs
     */
    async loadUrlMapping(): Promise<boolean> {
        try {
            this.logger.info(`Chargement de la carte des URLs depuis ${this.config.legacyUrlMap}`);
            const mappingContent = await fs.readFile(this.config.legacyUrlMap, 'utf-8');
            this.urlMapping = JSON.parse(mappingContent);
            this.logger.info(`Carte des URLs chargée: ${this.urlMapping.totalUrls} URLs, ${this.urlMapping.totalRoutes} routes`);
            return true;
        } catch (error) {
            this.logger.error(`Erreur lors du chargement de la carte des URLs: ${error.message}`);
            return false;
        }
    }

    /**
     * Recherche une URL préservée dans la carte
     */
    findPreservedUrl(url: string): PreservedUrl | null {
        if (!this.urlMapping) {
            this.logger.warn('La carte des URLs n\'a pas été chargée');
            return null;
        }

        // Normaliser l'URL pour la recherche
        let normalizedUrl = url;
        try {
            if (url.startsWith('http')) {
                const urlObj = new URL(url);
                normalizedUrl = urlObj.pathname + urlObj.search;
            }
        } catch (error) {
            this.logger.warn(`Impossible de normaliser l'URL ${url}`);
        }

        // Chercher dans la carte
        return this.urlMapping.preservedUrls[normalizedUrl] || null;
    }

    /**
     * Génère les fichiers de route nécessaires pour Remix
     */
    async generateRemixRoutes(outputDir: string): Promise<boolean> {
        if (!this.urlMapping) {
            this.logger.error('La carte des URLs n\'a pas été chargée');
            return false;
        }

        // Assurer que le répertoire existe
        await fs.mkdir(outputDir, { recursive: true });

        // Générer un handler pour chaque type de route
        const routeTypes = new Set<string>();
        Object.values(this.urlMapping.preservedUrls).forEach(url => {
            routeTypes.add(url.type);
        });

        // Générer les handlers pour chaque type
        for (const routeType of routeTypes) {
            const handlerPath = path.join(outputDir, `${routeType}.legacy.tsx`);
            const routeHandler = this.generateRemixRouteHandler(routeType);
            await fs.writeFile(handlerPath, routeHandler);
            this.logger.info(`Handler généré pour le type ${routeType}: ${handlerPath}`);
        }

        // Générer le fichier principal de routage legacy
        const legacyRoutesPath = path.join(outputDir, 'legacy-routes.json');
        await fs.writeFile(legacyRoutesPath, JSON.stringify(this.urlMapping.routes, null, 2));
        this.logger.info(`Configuration des routes legacy générée: ${legacyRoutesPath}`);

        return true;
    }

    /**
     * Génère un gestionnaire de route Remix pour un type spécifique
     */
    private generateRemixRouteHandler(routeType: string): string {
        // Convertir les types en chemins de composants appropriés
        const componentMap: Record<string, string> = {
            'product': '~/routes/produit.$id',
            'category': '~/routes/categorie.$id',
            'brand': '~/routes/marque.$id',
            'article': '~/routes/blog.$slug',
            'search': '~/routes/recherche',
            'generic': '~/routes/legacy.$path',
        };

        const importPath = componentMap[routeType] || '~/routes/legacy.$path';

        return `/**
 * Gestionnaire de routes legacy pour les URLs de type "${routeType}"
 * Ce fichier a été généré automatiquement par UrlPreservationAgent
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
  const hasCanonicaTag = baseMeta.some(
    (meta: any) => meta.rel === 'canonical' || meta.tagName === 'link' && meta.rel === 'canonical'
  );
  
  if (!hasCanonicaTag && data?.canonical) {
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
     * Génère un fichier de configuration Caddy pour préserver les URLs
     */
    async generateCaddyConfig(outputPath: string): Promise<boolean> {
        if (!this.urlMapping) {
            this.logger.error('La carte des URLs n\'a pas été chargée');
            return false;
        }

        let caddyConfig = `# Configuration Caddy pour la préservation des URLs legacy
# Généré automatiquement par UrlPreservationAgent
# Date: ${new Date().toISOString()}

# Préserver toutes les URLs PHP legacy sans redirection
# Ces règles servent le nouveau contenu aux anciennes URLs

`;

        // Grouper par chemin de base pour réduire le nombre de règles
        const pathGroups: Record<string, string[]> = {};

        Object.keys(this.urlMapping.preservedUrls).forEach(url => {
            const parsed = new URL(url, 'http://example.com');
            const basePath = path.dirname(parsed.pathname);

            if (!pathGroups[basePath]) {
                pathGroups[basePath] = [];
            }

            pathGroups[basePath].push(url);
        });

        // Générer des règles pour chaque groupe de chemin
        Object.keys(pathGroups).forEach(basePath => {
            caddyConfig += `# Routes pour ${basePath}/*\n`;
            caddyConfig += `handle_path ${basePath}/* {\n`;
            caddyConfig += `  # Préserver l'URL exacte, pas de redirection\n`;
            caddyConfig += `  rewrite * {http.request.uri.path}\n`;
            caddyConfig += `  reverse_proxy localhost:3000\n`;
            caddyConfig += `}\n\n`;
        });

        await fs.writeFile(outputPath, caddyConfig);
        this.logger.info(`Configuration Caddy générée: ${outputPath}`);

        return true;
    }

    /**
     * Génère un fichier de configuration NGINX pour préserver les URLs
     */
    async generateNginxConfig(outputPath: string): Promise<boolean> {
        if (!this.urlMapping) {
            this.logger.error('La carte des URLs n\'a pas été chargée');
            return false;
        }

        let nginxConfig = `# Configuration NGINX pour la préservation des URLs legacy
# Généré automatiquement par UrlPreservationAgent
# Date: ${new Date().toISOString()}

# Préserver les URLs PHP sans redirection
# Ces règles permettent de servir le nouveau contenu aux anciennes URLs

`;

        // Utiliser une approche de localisation par type de fichier
        nginxConfig += `# Traitement des fichiers PHP legacy\n`;
        nginxConfig += `location ~* \\.php$ {\n`;
        nginxConfig += `  # Conserver l'URL originale, pas de redirection\n`;
        nginxConfig += `  proxy_pass http://localhost:3000;\n`;
        nginxConfig += `  proxy_set_header Host $host;\n`;
        nginxConfig += `  proxy_set_header X-Real-IP $remote_addr;\n`;
        nginxConfig += `  proxy_set_header X-Legacy-Url $request_uri;\n`;
        nginxConfig += `}\n\n`;

        // Ajouter des règles spécifiques pour certains fichiers PHP courants
        const commonPhpFiles = [
            'produit.php', 'product.php', 'fiche.php',
            'categorie.php', 'category.php',
            'marque.php', 'brand.php',
            'article.php', 'blog.php',
            'recherche.php', 'search.php'
        ];

        commonPhpFiles.forEach(file => {
            nginxConfig += `# Préservation spécifique pour ${file}\n`;
            nginxConfig += `location = /${file} {\n`;
            nginxConfig += `  proxy_pass http://localhost:3000;\n`;
            nginxConfig += `  proxy_set_header Host $host;\n`;
            nginxConfig += `  proxy_set_header X-Real-IP $remote_addr;\n`;
            nginxConfig += `  proxy_set_header X-Legacy-Url $request_uri;\n`;
            nginxConfig += `}\n\n`;
        });

        await fs.writeFile(outputPath, nginxConfig);
        this.logger.info(`Configuration NGINX générée: ${outputPath}`);

        return true;
    }

    /**
     * Exécution principale de l'agent
     */
    async run(configPath = '/workspaces/cahier-des-charge/app/config/seo-config.json'): Promise<boolean> {
        try {
            this.logger.info('Démarrage de l\'agent de préservation des URLs');

            // Charger la configuration
            await this.loadConfig(configPath);

            // Si la préservation des URLs n'est pas activée, on s'arrête là
            if (!this.config.preserveLegacyUrls) {
                this.logger.info('La préservation des URLs legacy n\'est pas activée');
                return true;
            }

            // Charger la carte des URLs
            await this.loadUrlMapping();

            // Générer les configs selon le type de serveur
            switch (this.config.routeHandler) {
                case 'remix':
                    await this.generateRemixRoutes('/workspaces/cahier-des-charge/app/routes/legacy');
                    break;
                case 'next':
                    // Pour Next.js, la config est dans next.config.js
                    this.logger.info('La configuration Next.js doit être ajoutée manuellement au fichier next.config.js');
                    break;
                case 'caddy':
                    await this.generateCaddyConfig('/workspaces/cahier-des-charge/config/caddy/legacy-urls.caddy');
                    break;
                case 'nginx':
                    await this.generateNginxConfig('/workspaces/cahier-des-charge/config/nginx/legacy-urls.conf');
                    break;
                default:
                    this.logger.warn(`Gestionnaire de route non supporté: ${this.config.routeHandler}`);
                    break;
            }

            this.logger.info('Agent de préservation des URLs terminé avec succès');
            return true;
        } catch (error) {
            this.logger.error(`Erreur lors de l'exécution de l'agent: ${error.message}`);
            return false;
        }
    }
}