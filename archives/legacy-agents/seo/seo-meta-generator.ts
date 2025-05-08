/**
 * SEO Meta Generator
 * 
 * Ce module génère automatiquement des métadonnées SEO (JSON-LD, OpenGraph) pour
 * les pages générées lors de la migration depuis du code PHP legacy vers une
 * architecture TypeScript/Remix/NestJS.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

/**
 * Types de pages pour lesquels nous générons des métadonnées spécifiques
 */
export enum PageType {
    HOMEPAGE = 'homepage',
    ARTICLE = 'article',
    BLOG = 'blog',
    PRODUCT = 'product',
    CATEGORY = 'category',
    FAQ = 'faq',
    CONTACT = 'contact',
    ABOUT = 'about',
    SERVICE = 'service',
    GENERIC = 'generic',
}

/**
 * Schéma de validation pour les métadonnées de base
 */
export const BaseMetadataSchema = z.object({
    title: z.string().min(5).max(60),
    description: z.string().min(50).max(160),
    url: z.string().url(),
    image: z.string().url().optional(),
    locale: z.string().default('fr_FR'),
    type: z.enum(['website', 'article', 'product', 'profile']).default('website'),
    siteName: z.string().default(''),
    twitterCard: z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
});

/**
 * Schéma de validation pour les métadonnées d'article
 */
export const ArticleMetadataSchema = BaseMetadataSchema.extend({
    type: z.literal('article'),
    articleSection: z.string().optional(),
    publishedTime: z.string().optional(),
    modifiedTime: z.string().optional(),
    authors: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
});

/**
 * Schéma de validation pour les métadonnées de produit
 */
export const ProductMetadataSchema = BaseMetadataSchema.extend({
    type: z.literal('product'),
    price: z.number().optional(),
    currency: z.string().optional(),
    availability: z.enum(['InStock', 'OutOfStock', 'PreOrder']).optional(),
    sku: z.string().optional(),
    brand: z.string().optional(),
    reviewCount: z.number().optional(),
    ratingValue: z.number().min(0).max(5).optional(),
});

/**
 * Schéma de validation pour les métadonnées de FAQ
 */
export const FaqMetadataSchema = BaseMetadataSchema.extend({
    faqItems: z.array(
        z.object({
            question: z.string(),
            answer: z.string(),
        })
    ).optional(),
});

/**
 * Type pour les métadonnées de base
 */
export type BaseMetadata = z.infer<typeof BaseMetadataSchema>;

/**
 * Type pour les métadonnées d'article
 */
export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;

/**
 * Type pour les métadonnées de produit
 */
export type ProductMetadata = z.infer<typeof ProductMetadataSchema>;

/**
 * Type pour les métadonnées de FAQ
 */
export type FaqMetadata = z.infer<typeof FaqMetadataSchema>;

/**
 * Type union pour tous les types de métadonnées
 */
export type Metadata = BaseMetadata | ArticleMetadata | ProductMetadata | FaqMetadata;

/**
 * Options du générateur de métadonnées SEO
 */
export interface SeoMetaGeneratorOptions {
    defaultSiteName: string;
    defaultLocale: string;
    defaultImage: string;
    baseUrl: string;
    outputDir?: string;
}

/**
 * Générateur de métadonnées SEO
 */
export class SeoMetaGenerator {
    private readonly options: SeoMetaGeneratorOptions;

    /**
     * Constructeur du générateur de métadonnées SEO
     */
    constructor(options: SeoMetaGeneratorOptions) {
        this.options = {
            defaultLocale: 'fr_FR',
            ...options,
        };
    }

    /**
     * Génère les balises OpenGraph à partir des métadonnées
     */
    generateOpenGraph(metadata: Metadata): Record<string, string> {
        const openGraphTags: Record<string, string> = {
            'og:title': metadata.title,
            'og:description': metadata.description,
            'og:url': metadata.url,
            'og:type': metadata.type,
            'og:site_name': metadata.siteName || this.options.defaultSiteName,
            'og:locale': metadata.locale || this.options.defaultLocale,
        };

        if (metadata.image) {
            openGraphTags['og:image'] = metadata.image;
        } else if (this.options.defaultImage) {
            openGraphTags['og:image'] = this.options.defaultImage;
        }

        // Ajouter des propriétés spécifiques aux articles
        if (metadata.type === 'article') {
            const articleMeta = metadata as ArticleMetadata;

            if (articleMeta.publishedTime) {
                openGraphTags['article:published_time'] = articleMeta.publishedTime;
            }

            if (articleMeta.modifiedTime) {
                openGraphTags['article:modified_time'] = articleMeta.modifiedTime;
            }

            if (articleMeta.articleSection) {
                openGraphTags['article:section'] = articleMeta.articleSection;
            }

            if (articleMeta.tags && articleMeta.tags.length > 0) {
                // Note: les tags sont gérés différemment car il peut y en avoir plusieurs
                // Il faudra les traiter spécialement lors de l'intégration
                openGraphTags['article:tag'] = articleMeta.tags.join(',');
            }
        }

        // Ajout des métadonnées Twitter Card
        openGraphTags['twitter:card'] = metadata.twitterCard || 'summary_large_image';
        openGraphTags['twitter:title'] = metadata.title;
        openGraphTags['twitter:description'] = metadata.description;

        if (metadata.image) {
            openGraphTags['twitter:image'] = metadata.image;
        } else if (this.options.defaultImage) {
            openGraphTags['twitter:image'] = this.options.defaultImage;
        }

        return openGraphTags;
    }

    /**
     * Génère le JSON-LD pour une page article
     */
    generateArticleJsonLd(metadata: ArticleMetadata): Record<string, any> {
        return {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': metadata.title,
            'description': metadata.description,
            'image': metadata.image || this.options.defaultImage,
            'datePublished': metadata.publishedTime,
            'dateModified': metadata.modifiedTime || metadata.publishedTime,
            'author': metadata.authors && metadata.authors.length > 0 ?
                metadata.authors.map(author => ({
                    '@type': 'Person',
                    'name': author,
                })) :
                [{
                    '@type': 'Person',
                    'name': this.options.defaultSiteName,
                }],
            'publisher': {
                '@type': 'Organization',
                'name': metadata.siteName || this.options.defaultSiteName,
                'logo': {
                    '@type': 'ImageObject',
                    'url': this.options.defaultImage,
                }
            },
            'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': metadata.url,
            }
        };
    }

    /**
     * Génère le JSON-LD pour une page produit
     */
    generateProductJsonLd(metadata: ProductMetadata): Record<string, any> {
        const productLd: Record<string, any> = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            'name': metadata.title,
            'description': metadata.description,
            'image': metadata.image || this.options.defaultImage,
            'url': metadata.url,
        };

        if (metadata.brand) {
            productLd.brand = {
                '@type': 'Brand',
                'name': metadata.brand,
            };
        }

        if (metadata.sku) {
            productLd.sku = metadata.sku;
        }

        if (metadata.price !== undefined && metadata.currency) {
            productLd.offers = {
                '@type': 'Offer',
                'price': metadata.price,
                'priceCurrency': metadata.currency,
                'availability': `https://schema.org/${metadata.availability || 'InStock'}`
            };
        }

        if (metadata.ratingValue !== undefined && metadata.reviewCount !== undefined) {
            productLd.aggregateRating = {
                '@type': 'AggregateRating',
                'ratingValue': metadata.ratingValue,
                'reviewCount': metadata.reviewCount,
            };
        }

        return productLd;
    }

    /**
     * Génère le JSON-LD pour une page FAQ
     */
    generateFaqJsonLd(metadata: FaqMetadata): Record<string, any> {
        if (!metadata.faqItems || metadata.faqItems.length === 0) {
            return this.generateWebsiteJsonLd(metadata);
        }

        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': metadata.faqItems.map(item => ({
                '@type': 'Question',
                'name': item.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': item.answer,
                }
            })),
        };
    }

    /**
     * Génère le JSON-LD pour une page Web générique
     */
    generateWebsiteJsonLd(metadata: BaseMetadata): Record<string, any> {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': metadata.title,
            'url': metadata.url,
            'description': metadata.description,
            'inLanguage': metadata.locale || this.options.defaultLocale,
            'publisher': {
                '@type': 'Organization',
                'name': metadata.siteName || this.options.defaultSiteName,
                'logo': this.options.defaultImage,
            }
        };
    }

    /**
     * Génère le JSON-LD en fonction du type de page
     */
    generateJsonLd(metadata: Metadata, pageType: PageType = PageType.GENERIC): Record<string, any> {
        switch (pageType) {
            case PageType.ARTICLE:
            case PageType.BLOG:
                return this.generateArticleJsonLd(metadata as ArticleMetadata);

            case PageType.PRODUCT:
                return this.generateProductJsonLd(metadata as ProductMetadata);

            case PageType.FAQ:
                return this.generateFaqJsonLd(metadata as FaqMetadata);

            case PageType.HOMEPAGE:
            case PageType.GENERIC:
            default:
                return this.generateWebsiteJsonLd(metadata);
        }
    }

    /**
     * Génère et valide les métadonnées pour une route spécifique
     */
    async generateForRoute(
        routePath: string,
        metadata: Metadata,
        pageType: PageType = PageType.GENERIC
    ): Promise<{ openGraph: Record<string, string>, jsonLd: Record<string, any> }> {
        // Valider les métadonnées en fonction du type de page
        let validatedMetadata: Metadata;

        try {
            switch (pageType) {
                case PageType.ARTICLE:
                case PageType.BLOG:
                    validatedMetadata = ArticleMetadataSchema.parse(metadata);
                    break;

                case PageType.PRODUCT:
                    validatedMetadata = ProductMetadataSchema.parse(metadata);
                    break;

                case PageType.FAQ:
                    validatedMetadata = FaqMetadataSchema.parse(metadata);
                    break;

                default:
                    validatedMetadata = BaseMetadataSchema.parse(metadata);
            }
        } catch (e) {
            console.error(`Validation error for route ${routePath}:`, e);
            throw new Error(`Invalid metadata for route ${routePath}`);
        }

        // Générer les métadonnées
        const openGraph = this.generateOpenGraph(validatedMetadata);
        const jsonLd = this.generateJsonLd(validatedMetadata, pageType);

        // Enregistrer les métadonnées si un répertoire de sortie est spécifié
        if (this.options.outputDir) {
            const normalizedPath = routePath.replace(/^\/?/, '').replace(/\/$/, '');
            const outputPath = path.join(this.options.outputDir, normalizedPath);

            await fs.mkdir(outputPath, { recursive: true });

            await fs.writeFile(
                path.join(outputPath, 'meta.json'),
                JSON.stringify({ openGraph, jsonLd }, null, 2)
            );
        }

        return { openGraph, jsonLd };
    }

    /**
     * Convertit les balises OpenGraph en HTML
     */
    generateOpenGraphHtml(openGraph: Record<string, string>): string {
        return Object.entries(openGraph)
            .map(([key, value]) => {
                if (key.startsWith('article:tag')) {
                    // Gestion spéciale pour les tags d'article qui peuvent être multiples
                    return value.split(',')
                        .map(tag => `<meta property="article:tag" content="${tag.trim()}" />`)
                        .join('\n');
                }
                return `<meta property="${key}" content="${value}" />`;
            })
            .join('\n');
    }

    /**
     * Convertit le JSON-LD en balise script HTML
     */
    generateJsonLdHtml(jsonLd: Record<string, any>): string {
        return `<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>`;
    }

    /**
     * Génère le HTML complet des métadonnées SEO pour une page
     */
    generateSeoHtml(
        metadata: Metadata,
        pageType: PageType = PageType.GENERIC
    ): string {
        const { openGraph, jsonLd } = this.generateForRoute(
            metadata.url.replace(this.options.baseUrl, ''),
            metadata,
            pageType
        ) as { openGraph: Record<string, string>; jsonLd: Record<string, any> };

        return `<!-- SEO Meta Tags -->
<title>${metadata.title}</title>
<meta name="description" content="${metadata.description}" />

<!-- Open Graph / Facebook -->
${this.generateOpenGraphHtml(openGraph)}

<!-- JSON-LD -->
${this.generateJsonLdHtml(jsonLd)}`;
    }
}

/**
 * Fonction utilitaire pour extraire des métadonnées d'une page PHP existante
 * Utile lors de la migration pour conserver les métadonnées SEO existantes
 */
export async function extractMetaFromPhpPage(
    phpFilePath: string
): Promise<Partial<BaseMetadata>> {
    try {
        const content = await fs.readFile(phpFilePath, 'utf-8');

        // Extraction du titre
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : undefined;

        // Extraction de la description
        const descriptionMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        const description = descriptionMatch ? descriptionMatch[1] : undefined;

        // Extraction des balises OpenGraph
        const ogTitleMatch = content.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
        const ogTitle = ogTitleMatch ? ogTitleMatch[1] : title;

        const ogDescriptionMatch = content.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
        const ogDescription = ogDescriptionMatch ? ogDescriptionMatch[1] : description;

        const ogImageMatch = content.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
        const image = ogImageMatch ? ogImageMatch[1] : undefined;

        return {
            title: ogTitle || title,
            description: ogDescription || description,
            image,
        };
    } catch (error) {
        console.error(`Error extracting metadata from ${phpFilePath}:`, error);
        return {};
    }
}

export default SeoMetaGenerator;