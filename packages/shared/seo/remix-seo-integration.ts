/**
 * Intégrateur SEO pour Remix
 * 
 * Ce module permet d'intégrer facilement la génération de métadonnées SEO
 * dans une application Remix. Il offre:
 * 
 * - Des hooks pour générer des métadonnées dans loader/action
 * - Des composants pour l'insertion de métadonnées dans les templates
 * - Des utilitaires pour la validation et la transformation des métadonnées
 */

import { SEOMCPController } from ../../..@cahier-des-charge/business/src/agents/seo-mcp-controller';
import { Metadata, PageType } from ../../..@cahier-des-charge/business/src/agents/seo/seo-meta-generator';

/**
 * Options pour l'intégrateur SEO Remix
 */
export interface RemixSeoIntegratorOptions {
    /**
     * URL de base du site (sans slash final)
     */
    baseUrl: string;

    /**
     * Nom du site
     */
    siteName: string;

    /**
     * Répertoire racine de l'application
     */
    rootDir: string;

    /**
     * Mode de fonctionnement
     */
    mode?: 'auto' | 'manual';

    /**
     * Active le debug
     */
    debug?: boolean;
}

/**
 * Intégrateur SEO pour Remix
 */
export class RemixSeoIntegrator {
    private controller: SEOMCPController;
    private options: RemixSeoIntegratorOptions & { mode: 'auto' | 'manual'; debug: boolean };

    /**
     * Constructeur de l'intégrateur
     */
    constructor(options: RemixSeoIntegratorOptions) {
        this.options = {
            mode: 'auto',
            debug: false,
            ...options,
        };

        this.controller = new SEOMCPController({
            baseUrl: this.options.baseUrl,
            siteName: this.options.siteName,
            rootDir: this.options.rootDir,
            verbose: this.options.debug,
        });

        // Initialiser le contrôleur
        this.controller.initialize().catch(err => {
            console.error('Erreur lors de l\'initialisation du contrôleur SEO:', err);
        });
    }

    /**
     * Génère les métadonnées SEO pour une route Remix
     * 
     * @param context Contexte de la route (paramètres, URL, etc.)
     * @param data Données obtenues par le loader
     * @param metadata Métadonnées partielles à fusionner
     * @returns Métadonnées complètes
     */
    async generateMetadata(
        context: { route: string; params?: Record<string, string> },
        data?: Record<string, any>,
        metadata?: Partial<Metadata>
    ): Promise<{ openGraph: Record<string, string>; jsonLd: Record<string, any> }> {
        const route = context.route || '';

        // Métadonnées de base (depuis les paramètres)
        const baseMetadata: Partial<Metadata> = metadata || {};

        // Fusionner avec les données du loader si disponibles
        if (data) {
            if (data.title && !baseMetadata.title) {
                baseMetadata.title = data.title;
            }

            if (data.description && !baseMetadata.description) {
                baseMetadata.description = data.description;
            }

            if (data.image && !baseMetadata.image) {
                baseMetadata.image = data.image;
            }
        }

        // Générer les métadonnées
        return this.controller.generateForRoute(route, baseMetadata);
    }

    /**
     * Hook pour les loaders Remix
     * 
     * @param routeId ID de la route
     * @param loaderData Données du loader
     * @param pageType Type de page (optionnel, auto-détecté si non spécifié)
     * @returns Données du loader enrichies avec les métadonnées SEO
     */
    async enhanceLoader(
        routeId: string,
        loaderData: Record<string, any>,
        pageType?: PageType
    ): Promise<Record<string, any>> {
        try {
            const metadata = await this.controller.generateForRoute(routeId, {
                title: loaderData.title,
                description: loaderData.description,
                image: loaderData.image,
            });

            return {
                ...loaderData,
                seo: {
                    ...metadata,
                    // Ajouter des fonctions utilitaires pour l'utilisation dans les templates
                    toHtml: () => {
                        return `
              <!-- OpenGraph Tags -->
              ${Object.entries(metadata.openGraph)
                                .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
                                .join('\n')}
              
              <!-- JSON-LD -->
              <script type="application/ld+json">
                ${JSON.stringify(metadata.jsonLd, null, 2)}
              </script>
            `;
                    }
                }
            };
        } catch (error) {
            console.error(`Erreur lors de l'enrichissement du loader pour ${routeId}:`, error);
            return loaderData;
        }
    }

    /**
     * Composant React pour l'insertion des métadonnées SEO
     * 
     * @param props Propriétés du composant
     * @returns JSX Elements pour les métadonnées
     */
    SeoHead = ({
        title,
        description,
        image,
        route,
        jsonLd,
        openGraph
    }: {
        title?: string;
        description?: string;
        image?: string;
        route?: string;
        jsonLd?: Record<string, any>;
        openGraph?: Record<string, string>;
    }) => {
        // Si toutes les données sont fournies manuellement, les utiliser directement
        if (jsonLd && openGraph) {
            return {
                __html: `
          <!-- OpenGraph Tags -->
          ${Object.entries(openGraph)
                        .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
                        .join('\n')}
          
          <!-- JSON-LD -->
          <script type="application/ld+json">
            ${JSON.stringify(jsonLd, null, 2)}
          </script>
        `
            };
        }

        // Sinon, utiliser les données de base pour générer les métadonnées
        const currentRoute = route || typeof window !== 'undefined' ? window.location.pathname : '/';
        const seoData = this.controller.generateForRoute(currentRoute, {
            title,
            description,
            image,
        });

        return {
            __html: `
        <!-- OpenGraph Tags -->
        ${Object.entries(seoData.openGraph)
                    .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
                    .join('\n')}
        
        <!-- JSON-LD -->
        <script type="application/ld+json">
          ${JSON.stringify(seoData.jsonLd, null, 2)}
        </script>
      `
        };
    };
}

/**
 * Fonction utilitaire pour créer un intégrateur SEO Remix
 */
export function createRemixSeoIntegrator(options: RemixSeoIntegratorOptions): RemixSeoIntegrator {
    return new RemixSeoIntegrator(options);
}

export default createRemixSeoIntegrator;
