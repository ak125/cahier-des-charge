/**
 * Générateur automatique de métadonnées SEO
 * 
 * Ce module génère automatiquement les métadonnées SEO nécessaires pour améliorer
 * le référencement et la visibilité dans les résultats de recherche et les réseaux sociaux.
 * 
 * Fonctionnalités:
 * - Génération de balises méta standard
 * - Génération de balises OpenGraph pour les réseaux sociaux
 * - Génération de JSON-LD structuré pour Google Rich Results
 * - Support de plusieurs types de contenu (article, produit, FAQ, etc.)
 */

import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

/**
 * Types de contenu pris en charge pour les métadonnées
 */
export enum ContentType {
    WEBSITE = 'website',
    ARTICLE = 'article',
    BLOG = 'blog',
    NEWS = 'news',
    PRODUCT = 'product',
    SERVICE = 'service',
    PROFILE = 'profile',
    EVENT = 'event',
    VIDEO = 'video',
    RECIPE = 'recipe',
    FAQ = 'faq',
    ORGANIZATION = 'organization',
    LOCAL_BUSINESS = 'local_business',
    COURSE = 'course',
    JOB_POSTING = 'job_posting',
    BREADCRUMB = 'breadcrumb',
    LANDING_PAGE = 'landing_page',
}

/**
 * Configuration des images pour les métadonnées
 */
export interface SeoImageConfig {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    secureUrl?: string;
    type?: string; // e.g. 'image/jpeg', 'image/png'
}

/**
 * Configuration pour les métadonnées de base (meta tags)
 */
export interface BasicMetaConfig {
    title: string;
    description: string;
    keywords?: string[];
    canonicalUrl?: string;
    robots?: string;
    viewport?: string;
    author?: string;
    language?: string;
    themeColor?: string;
}

/**
 * Configuration pour les métadonnées OpenGraph
 */
export interface OpenGraphConfig {
    title?: string;
    description?: string;
    url?: string;
    type?: string;
    locale?: string;
    siteName?: string;
    images?: SeoImageConfig[];
    audio?: string;
    video?: string;
    determiner?: string;
    // Spécifique à l'article
    article?: {
        publishedTime?: string;
        modifiedTime?: string;
        expirationTime?: string;
        authors?: string[];
        section?: string;
        tags?: string[];
    };
    // Spécifique au produit
    product?: {
        price?: number;
        currency?: string;
        availability?: string;
        brand?: string;
    };
}

/**
 * Configuration pour les métadonnées Twitter
 */
export interface TwitterConfig {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
}

/**
 * Type de schéma JSON-LD
 */
export enum JsonLdType {
    ARTICLE = 'Article',
    BLOG_POSTING = 'BlogPosting',
    NEWS_ARTICLE = 'NewsArticle',
    PRODUCT = 'Product',
    LOCAL_BUSINESS = 'LocalBusiness',
    ORGANIZATION = 'Organization',
    PERSON = 'Person',
    EVENT = 'Event',
    VIDEO = 'VideoObject',
    RECIPE = 'Recipe',
    FAQ_PAGE = 'FAQPage',
    QUESTION = 'Question',
    ANSWER = 'Answer',
    BREADCRUMB_LIST = 'BreadcrumbList',
    COURSE = 'Course',
    JOB_POSTING = 'JobPosting',
    WEBSITE = 'WebSite',
    SEARCH_ACTION = 'SearchAction',
    CREATIVE_WORK = 'CreativeWork',
    SOFTWARE_APPLICATION = 'SoftwareApplication',
    OFFER = 'Offer',
    AGGREGATE_RATING = 'AggregateRating',
    REVIEW = 'Review',
}

/**
 * Configuration pour les FAQ en JSON-LD
 */
export interface FaqItem {
    question: string;
    answer: string;
}

/**
 * Configuration pour un élément de fil d'Ariane (breadcrumb)
 */
export interface BreadcrumbItem {
    name: string;
    item: string;
    position: number;
}

/**
 * Configuration générale pour les métadonnées JSON-LD
 */
export interface JsonLdConfig {
    type: JsonLdType;
    name?: string;
    headline?: string;
    description?: string;
    url?: string;
    datePublished?: string;
    dateModified?: string;
    author?: {
        type: JsonLdType.PERSON | JsonLdType.ORGANIZATION;
        name: string;
        url?: string;
    };
    publisher?: {
        type: JsonLdType.ORGANIZATION;
        name: string;
        logo?: SeoImageConfig;
    };
    mainEntityOfPage?: string;
    image?: SeoImageConfig | SeoImageConfig[];
    // Pour les produits
    product?: {
        brand?: {
            type: JsonLdType.ORGANIZATION | 'Brand';
            name: string;
        };
        sku?: string;
        gtin?: string;
        mpn?: string;
        offers?: {
            type: JsonLdType.OFFER;
            price: number;
            priceCurrency: string;
            availability: string;
            url?: string;
            validFrom?: string;
            priceValidUntil?: string;
        };
        review?: {
            type: JsonLdType.REVIEW;
            author: string;
            datePublished: string;
            reviewBody: string;
            reviewRating: {
                type: 'Rating';
                ratingValue: number;
                bestRating: number;
                worstRating: number;
            };
        };
        aggregateRating?: {
            type: JsonLdType.AGGREGATE_RATING;
            ratingValue: number;
            bestRating: number;
            worstRating: number;
            ratingCount: number;
            reviewCount?: number;
        };
    };
    // Pour les FAQ
    faqs?: FaqItem[];
    // Pour les fils d'Ariane
    breadcrumbs?: BreadcrumbItem[];
    // Pour les événements
    event?: {
        startDate: string;
        endDate: string;
        location: {
            type: 'Place';
            name: string;
            address: {
                type: 'PostalAddress';
                streetAddress?: string;
                addressLocality?: string;
                addressRegion?: string;
                postalCode?: string;
                addressCountry?: string;
            };
        };
        performer?: {
            type: JsonLdType.PERSON | JsonLdType.ORGANIZATION;
            name: string;
        };
        offers?: {
            type: JsonLdType.OFFER;
            price: number;
            priceCurrency: string;
            availability: string;
            validFrom?: string;
            url?: string;
        };
    };
    // Pour les recettes
    recipe?: {
        cookTime?: string;
        prepTime?: string;
        totalTime?: string;
        recipeYield?: string;
        ingredients?: string[];
        recipeInstructions?: string | string[];
        recipeCategory?: string;
        recipeCuisine?: string;
        nutrition?: {
            type: 'NutritionInformation';
            calories?: string;
            fatContent?: string;
            // etc.
        };
    };
}

/**
 * Configuration complète pour les métadonnées SEO
 */
export interface SeoMetaConfig {
    basic: BasicMetaConfig;
    openGraph?: OpenGraphConfig;
    twitter?: TwitterConfig;
    jsonLd?: JsonLdConfig | JsonLdConfig[];
    contentType?: ContentType;
}

/**
 * Options de génération
 */
export interface GenerationOptions {
    pretty?: boolean; // Pour formater le JSON-LD
    minify?: boolean; // Pour minifier le HTML généré
    escapeHtml?: boolean; // Pour échapper les caractères HTML
    lang?: string; // Langue par défaut
    defaultImage?: SeoImageConfig; // Image par défaut
    siteUrl?: string; // URL du site
    siteName?: string; // Nom du site
    separator?: string; // Séparateur pour le titre (par défaut: '|')
}

/**
 * Générateur de métadonnées SEO
 */
export class SeoMetaGenerator {
    private options: Required<GenerationOptions>;
    private defaultConfig: Partial<SeoMetaConfig>;

    /**
     * Constructeur du générateur de métadonnées SEO
     */
    constructor(
        options: GenerationOptions = {},
        defaultConfig: Partial<SeoMetaConfig> = {}
    ) {
        this.options = {
            pretty: false,
            minify: false,
            escapeHtml: true,
            lang: 'fr',
            defaultImage: {
                url: '',
                alt: '',
            },
            siteUrl: '',
            siteName: '',
            separator: '|',
            ...options,
        };

        this.defaultConfig = defaultConfig;
    }

    /**
     * Échapper les caractères HTML
     */
    private escapeHtml(text: string): string {
        if (!this.options.escapeHtml) {
            return text;
        }

        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Générer les balises meta de base
     */
    generateBasicMeta(config: BasicMetaConfig): string {
        const { title, description, keywords, canonicalUrl, robots, viewport, author, language, themeColor } = config;

        let metaTags = `<title>${this.escapeHtml(title)}</title>\n`;
        metaTags += `<meta name="description" content="${this.escapeHtml(description)}" />\n`;

        if (keywords && keywords.length > 0) {
            metaTags += `<meta name="keywords" content="${this.escapeHtml(keywords.join(', '))}" />\n`;
        }

        if (canonicalUrl) {
            metaTags += `<link rel="canonical" href="${this.escapeHtml(canonicalUrl)}" />\n`;
        }

        if (robots) {
            metaTags += `<meta name="robots" content="${this.escapeHtml(robots)}" />\n`;
        }

        if (viewport) {
            metaTags += `<meta name="viewport" content="${this.escapeHtml(viewport)}" />\n`;
        } else {
            metaTags += `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n`;
        }

        if (author) {
            metaTags += `<meta name="author" content="${this.escapeHtml(author)}" />\n`;
        }

        if (language) {
            metaTags += `<meta http-equiv="content-language" content="${this.escapeHtml(language)}" />\n`;
        } else {
            metaTags += `<meta http-equiv="content-language" content="${this.options.lang}" />\n`;
        }

        if (themeColor) {
            metaTags += `<meta name="theme-color" content="${this.escapeHtml(themeColor)}" />\n`;
        }

        return metaTags;
    }

    /**
     * Générer les balises OpenGraph
     */
    generateOpenGraph(config: OpenGraphConfig, basicConfig?: BasicMetaConfig): string {
        const defaultBasicConfig = basicConfig || { title: '', description: '' };

        const {
            title = defaultBasicConfig.title || '',
            description = defaultBasicConfig.description || '',
            url = '',
            type = 'website',
            locale = this.options.lang,
            siteName = this.options.siteName,
            images = [],
            audio,
            video,
            determiner,
            article,
            product,
        } = config;

        let ogTags = `<meta property="og:title" content="${this.escapeHtml(title)}" />\n`;
        ogTags += `<meta property="og:description" content="${this.escapeHtml(description)}" />\n`;
        ogTags += `<meta property="og:type" content="${this.escapeHtml(type)}" />\n`;

        if (url) {
            ogTags += `<meta property="og:url" content="${this.escapeHtml(url)}" />\n`;
        }

        if (locale) {
            ogTags += `<meta property="og:locale" content="${this.escapeHtml(locale)}" />\n`;
        }

        if (siteName) {
            ogTags += `<meta property="og:site_name" content="${this.escapeHtml(siteName)}" />\n`;
        }

        // Images
        if (images.length > 0) {
            for (const image of images) {
                ogTags += `<meta property="og:image" content="${this.escapeHtml(image.url)}" />\n`;

                if (image.secureUrl) {
                    ogTags += `<meta property="og:image:secure_url" content="${this.escapeHtml(image.secureUrl)}" />\n`;
                }

                if (image.type) {
                    ogTags += `<meta property="og:image:type" content="${this.escapeHtml(image.type)}" />\n`;
                }

                if (image.width) {
                    ogTags += `<meta property="og:image:width" content="${image.width}" />\n`;
                }

                if (image.height) {
                    ogTags += `<meta property="og:image:height" content="${image.height}" />\n`;
                }

                if (image.alt) {
                    ogTags += `<meta property="og:image:alt" content="${this.escapeHtml(image.alt)}" />\n`;
                }
            }
        } else if (this.options.defaultImage.url) {
            ogTags += `<meta property="og:image" content="${this.escapeHtml(this.options.defaultImage.url)}" />\n`;

            if (this.options.defaultImage.alt) {
                ogTags += `<meta property="og:image:alt" content="${this.escapeHtml(this.options.defaultImage.alt)}" />\n`;
            }
        }

        // Audio
        if (audio) {
            ogTags += `<meta property="og:audio" content="${this.escapeHtml(audio)}" />\n`;
        }

        // Vidéo
        if (video) {
            ogTags += `<meta property="og:video" content="${this.escapeHtml(video)}" />\n`;
        }

        // Déterminant (rarement utilisé)
        if (determiner) {
            ogTags += `<meta property="og:determiner" content="${this.escapeHtml(determiner)}" />\n`;
        }

        // Article spécifique
        if (article && type === 'article') {
            const { publishedTime, modifiedTime, expirationTime, authors, section, tags } = article;

            if (publishedTime) {
                ogTags += `<meta property="article:published_time" content="${this.escapeHtml(publishedTime)}" />\n`;
            }

            if (modifiedTime) {
                ogTags += `<meta property="article:modified_time" content="${this.escapeHtml(modifiedTime)}" />\n`;
            }

            if (expirationTime) {
                ogTags += `<meta property="article:expiration_time" content="${this.escapeHtml(expirationTime)}" />\n`;
            }

            if (authors && authors.length > 0) {
                for (const author of authors) {
                    ogTags += `<meta property="article:author" content="${this.escapeHtml(author)}" />\n`;
                }
            }

            if (section) {
                ogTags += `<meta property="article:section" content="${this.escapeHtml(section)}" />\n`;
            }

            if (tags && tags.length > 0) {
                for (const tag of tags) {
                    ogTags += `<meta property="article:tag" content="${this.escapeHtml(tag)}" />\n`;
                }
            }
        }

        // Produit spécifique
        if (product && type === 'product') {
            const { price, currency, availability, brand } = product;

            if (price !== undefined) {
                ogTags += `<meta property="product:price:amount" content="${price}" />\n`;
            }

            if (currency) {
                ogTags += `<meta property="product:price:currency" content="${this.escapeHtml(currency)}" />\n`;
            }

            if (availability) {
                ogTags += `<meta property="product:availability" content="${this.escapeHtml(availability)}" />\n`;
            }

            if (brand) {
                ogTags += `<meta property="product:brand" content="${this.escapeHtml(brand)}" />\n`;
            }
        }

        return ogTags;
    }

    /**
     * Générer les balises Twitter Card
     */
    generateTwitter(config: TwitterConfig, basicConfig?: BasicMetaConfig, openGraphConfig?: OpenGraphConfig): string {
        const defaultBasicConfig = basicConfig || { title: '', description: '' };
        const defaultOgConfig = openGraphConfig || {};

        const {
            card = 'summary',
            site,
            creator,
            title = basicConfig?.title || '',
            description = basicConfig?.description || '',
            image = openGraphConfig?.images && openGraphConfig.images.length > 0
                ? openGraphConfig.images[0].url
                : this.options.defaultImage.url,
            imageAlt = openGraphConfig?.images && openGraphConfig.images.length > 0
                ? openGraphConfig.images[0].alt
                : this.options.defaultImage.alt,
        } = config;

        let twitterTags = `<meta name="twitter:card" content="${this.escapeHtml(card)}" />\n`;

        if (site) {
            twitterTags += `<meta name="twitter:site" content="${this.escapeHtml(site)}" />\n`;
        }

        if (creator) {
            twitterTags += `<meta name="twitter:creator" content="${this.escapeHtml(creator)}" />\n`;
        }

        if (title) {
            twitterTags += `<meta name="twitter:title" content="${this.escapeHtml(title)}" />\n`;
        }

        if (description) {
            twitterTags += `<meta name="twitter:description" content="${this.escapeHtml(description)}" />\n`;
        }

        if (image) {
            twitterTags += `<meta name="twitter:image" content="${this.escapeHtml(image)}" />\n`;

            if (imageAlt) {
                twitterTags += `<meta name="twitter:image:alt" content="${this.escapeHtml(imageAlt)}" />\n`;
            }
        }

        return twitterTags;
    }

    /**
     * Formater un objet JSON-LD
     */
    private formatJsonLd(jsonLd: object): string {
        if (this.options.pretty) {
            return JSON.stringify(jsonLd, null, 2);
        }
        return JSON.stringify(jsonLd);
    }

    /**
     * Générer un schéma JSON-LD d'article
     */
    private generateArticleJsonLd(config: JsonLdConfig): object {
        const {
            type,
            name,
            headline,
            description,
            url,
            datePublished,
            dateModified,
            author,
            publisher,
            mainEntityOfPage,
            image,
        } = config;

        const jsonLd: Record<string, any> = {
            '@context': 'https://schema.org',
            '@type': type,
            headline: headline || name,
            description,
        };

        if (url) {
            jsonLd.url = url;
        }

        if (datePublished) {
            jsonLd.datePublished = datePublished;
        }

        if (dateModified) {
            jsonLd.dateModified = dateModified;
        }

        if (author) {
            jsonLd.author = {
                '@type': author.type,
                name: author.name,
            };

            if (author.url) {
                jsonLd.author.url = author.url;
            }
        }

        if (publisher) {
            jsonLd.publisher = {
                '@type': publisher.type,
                name: publisher.name,
            };

            if (publisher.logo) {
                jsonLd.publisher.logo = {
                    '@type': 'ImageObject',
                    url: publisher.logo.url,
                };

                if (publisher.logo.width) {
                    jsonLd.publisher.logo.width = publisher.logo.width;
                }

                if (publisher.logo.height) {
                    jsonLd.publisher.logo.height = publisher.logo.height;
                }
            }
        }

        if (mainEntityOfPage) {
            jsonLd.mainEntityOfPage = {
                '@type': 'WebPage',
                '@id': mainEntityOfPage,
            };
        }

        if (image) {
            if (Array.isArray(image)) {
                jsonLd.image = image.map(img => img.url);
            } else {
                jsonLd.image = image.url;
            }
        }

        return jsonLd;
    }

    /**
     * Générer un schéma JSON-LD de produit
     */
    private generateProductJsonLd(config: JsonLdConfig): object {
        const {
            name,
            description,
            url,
            image,
            product,
        } = config;

        if (!product) {
            throw new Error('Informations produit manquantes pour le JSON-LD de type Product');
        }

        const jsonLd: Record<string, any> = {
            '@context': 'https://schema.org',
            '@type': JsonLdType.PRODUCT,
            name,
            description,
        };

        if (url) {
            jsonLd.url = url;
        }

        if (image) {
            if (Array.isArray(image)) {
                jsonLd.image = image.map(img => img.url);
            } else {
                jsonLd.image = image.url;
            }
        }

        if (product.brand) {
            jsonLd.brand = {
                '@type': product.brand.type,
                name: product.brand.name,
            };
        }

        if (product.sku) {
            jsonLd.sku = product.sku;
        }

        if (product.gtin) {
            jsonLd.gtin = product.gtin;
        }

        if (product.mpn) {
            jsonLd.mpn = product.mpn;
        }

        if (product.offers) {
            jsonLd.offers = {
                '@type': product.offers.type,
                price: product.offers.price,
                priceCurrency: product.offers.priceCurrency,
                availability: `https://schema.org/${product.offers.availability}`,
            };

            if (product.offers.url) {
                jsonLd.offers.url = product.offers.url;
            }

            if (product.offers.validFrom) {
                jsonLd.offers.validFrom = product.offers.validFrom;
            }

            if (product.offers.priceValidUntil) {
                jsonLd.offers.priceValidUntil = product.offers.priceValidUntil;
            }
        }

        if (product.review) {
            jsonLd.review = {
                '@type': product.review.type,
                author: product.review.author,
                datePublished: product.review.datePublished,
                reviewBody: product.review.reviewBody,
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: product.review.reviewRating.ratingValue,
                    bestRating: product.review.reviewRating.bestRating,
                    worstRating: product.review.reviewRating.worstRating,
                },
            };
        }

        if (product.aggregateRating) {
            jsonLd.aggregateRating = {
                '@type': product.aggregateRating.type,
                ratingValue: product.aggregateRating.ratingValue,
                bestRating: product.aggregateRating.bestRating,
                worstRating: product.aggregateRating.worstRating,
                ratingCount: product.aggregateRating.ratingCount,
            };

            if (product.aggregateRating.reviewCount) {
                jsonLd.aggregateRating.reviewCount = product.aggregateRating.reviewCount;
            }
        }

        return jsonLd;
    }

    /**
     * Générer un schéma JSON-LD de FAQ
     */
    private generateFAQJsonLd(config: JsonLdConfig): object {
        const { faqs } = config;

        if (!faqs || faqs.length === 0) {
            throw new Error('Questions-réponses manquantes pour le JSON-LD de type FAQPage');
        }

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': JsonLdType.FAQ_PAGE,
            mainEntity: faqs.map(faq => ({
                '@type': JsonLdType.QUESTION,
                name: faq.question,
                acceptedAnswer: {
                    '@type': JsonLdType.ANSWER,
                    text: faq.answer,
                },
            })),
        };

        return jsonLd;
    }

    /**
     * Générer un schéma JSON-LD de fil d'Ariane (breadcrumb)
     */
    private generateBreadcrumbJsonLd(config: JsonLdConfig): object {
        const { breadcrumbs } = config;

        if (!breadcrumbs || breadcrumbs.length === 0) {
            throw new Error('Fil d\'Ariane manquant pour le JSON-LD de type BreadcrumbList');
        }

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': JsonLdType.BREADCRUMB_LIST,
            itemListElement: breadcrumbs.map(item => ({
                '@type': 'ListItem',
                position: item.position,
                name: item.name,
                item: item.item,
            })),
        };

        return jsonLd;
    }

    /**
     * Générer un schéma JSON-LD d'événement
     */
    private generateEventJsonLd(config: JsonLdConfig): object {
        const {
            name,
            description,
            url,
            image,
            event,
        } = config;

        if (!event) {
            throw new Error('Informations événement manquantes pour le JSON-LD de type Event');
        }

        const jsonLd: Record<string, any> = {
            '@context': 'https://schema.org',
            '@type': JsonLdType.EVENT,
            name,
            description,
            startDate: event.startDate,
            endDate: event.endDate,
            location: {
                '@type': 'Place',
                name: event.location.name,
            },
        };

        if (url) {
            jsonLd.url = url;
        }

        if (image) {
            if (Array.isArray(image)) {
                jsonLd.image = image.map(img => img.url);
            } else {
                jsonLd.image = image.url;
            }
        }

        if (event.location.address) {
            jsonLd.location.address = {
                '@type': 'PostalAddress',
            };

            if (event.location.address.streetAddress) {
                jsonLd.location.address.streetAddress = event.location.address.streetAddress;
            }

            if (event.location.address.addressLocality) {
                jsonLd.location.address.addressLocality = event.location.address.addressLocality;
            }

            if (event.location.address.addressRegion) {
                jsonLd.location.address.addressRegion = event.location.address.addressRegion;
            }

            if (event.location.address.postalCode) {
                jsonLd.location.address.postalCode = event.location.address.postalCode;
            }

            if (event.location.address.addressCountry) {
                jsonLd.location.address.addressCountry = event.location.address.addressCountry;
            }
        }

        if (event.performer) {
            jsonLd.performer = {
                '@type': event.performer.type,
                name: event.performer.name,
            };
        }

        if (event.offers) {
            jsonLd.offers = {
                '@type': event.offers.type,
                price: event.offers.price,
                priceCurrency: event.offers.priceCurrency,
                availability: `https://schema.org/${event.offers.availability}`,
            };

            if (event.offers.validFrom) {
                jsonLd.offers.validFrom = event.offers.validFrom;
            }

            if (event.offers.url) {
                jsonLd.offers.url = event.offers.url;
            }
        }

        return jsonLd;
    }

    /**
     * Générer un schéma JSON-LD de recette
     */
    private generateRecipeJsonLd(config: JsonLdConfig): object {
        const {
            name,
            description,
            url,
            image,
            author,
            datePublished,
            recipe,
        } = config;

        if (!recipe) {
            throw new Error('Informations recette manquantes pour le JSON-LD de type Recipe');
        }

        const jsonLd: Record<string, any> = {
            '@context': 'https://schema.org',
            '@type': JsonLdType.RECIPE,
            name,
            description,
        };

        if (url) {
            jsonLd.url = url;
        }

        if (image) {
            if (Array.isArray(image)) {
                jsonLd.image = image.map(img => img.url);
            } else {
                jsonLd.image = image.url;
            }
        }

        if (author) {
            jsonLd.author = {
                '@type': author.type,
                name: author.name,
            };

            if (author.url) {
                jsonLd.author.url = author.url;
            }
        }

        if (datePublished) {
            jsonLd.datePublished = datePublished;
        }

        if (recipe.cookTime) {
            jsonLd.cookTime = recipe.cookTime;
        }

        if (recipe.prepTime) {
            jsonLd.prepTime = recipe.prepTime;
        }

        if (recipe.totalTime) {
            jsonLd.totalTime = recipe.totalTime;
        }

        if (recipe.recipeYield) {
            jsonLd.recipeYield = recipe.recipeYield;
        }

        if (recipe.ingredients && recipe.ingredients.length > 0) {
            jsonLd.recipeIngredient = recipe.ingredients;
        }

        if (recipe.recipeInstructions) {
            if (Array.isArray(recipe.recipeInstructions)) {
                jsonLd.recipeInstructions = recipe.recipeInstructions.map(instruction => ({
                    '@type': 'HowToStep',
                    text: instruction,
                }));
            } else {
                jsonLd.recipeInstructions = recipe.recipeInstructions;
            }
        }

        if (recipe.recipeCategory) {
            jsonLd.recipeCategory = recipe.recipeCategory;
        }

        if (recipe.recipeCuisine) {
            jsonLd.recipeCuisine = recipe.recipeCuisine;
        }

        if (recipe.nutrition) {
            jsonLd.nutrition = {
                '@type': 'NutritionInformation',
            };

            if (recipe.nutrition.calories) {
                jsonLd.nutrition.calories = recipe.nutrition.calories;
            }

            if (recipe.nutrition.fatContent) {
                jsonLd.nutrition.fatContent = recipe.nutrition.fatContent;
            }
        }

        return jsonLd;
    }

    /**
     * Générer un schéma JSON-LD
     */
    private generateJsonLdObject(config: JsonLdConfig): object {
        const { type } = config;

        switch (type) {
            case JsonLdType.ARTICLE:
            case JsonLdType.BLOG_POSTING:
            case JsonLdType.NEWS_ARTICLE:
                return this.generateArticleJsonLd(config);

            case JsonLdType.PRODUCT:
                return this.generateProductJsonLd(config);

            case JsonLdType.FAQ_PAGE:
                return this.generateFAQJsonLd(config);

            case JsonLdType.BREADCRUMB_LIST:
                return this.generateBreadcrumbJsonLd(config);

            case JsonLdType.EVENT:
                return this.generateEventJsonLd(config);

            case JsonLdType.RECIPE:
                return this.generateRecipeJsonLd(config);

            default:
                throw new Error(`Type JSON-LD non pris en charge: ${type}`);
        }
    }

    /**
     * Générer un schéma JSON-LD
     */
    generateJsonLd(config: JsonLdConfig | JsonLdConfig[]): string {
        if (Array.isArray(config)) {
            const jsonLdObjects = config.map(conf => this.generateJsonLdObject(conf));
            return `<script type="application/ld+json">\n${this.formatJsonLd(jsonLdObjects)}\n</script>`;
        } else {
            const jsonLdObject = this.generateJsonLdObject(config);
            return `<script type="application/ld+json">\n${this.formatJsonLd(jsonLdObject)}\n</script>`;
        }
    }

    /**
     * Générer des métadonnées SEO complètes
     */
    generateFullSeoMeta(config: SeoMetaConfig): string {
        const { basic, openGraph, twitter, jsonLd } = config;

        let metaTags = '';

        // Méta tags de base
        metaTags += this.generateBasicMeta(basic);

        // OpenGraph
        if (openGraph) {
            metaTags += this.generateOpenGraph(openGraph, basic);
        }

        // Twitter
        if (twitter) {
            metaTags += this.generateTwitter(twitter, basic, openGraph);
        }

        // JSON-LD
        if (jsonLd) {
            metaTags += this.generateJsonLd(jsonLd);
        }

        return this.options.minify
            ? metaTags.replace(/\s+/g, ' ').replace(/\n/g, '')
            : metaTags;
    }

    /**
     * Créer une configuration de métadonnées SEO à partir d'un type de contenu
     */
    createConfigFromContentType(
        contentType: ContentType,
        data: Record<string, any>,
        overrides: Partial<SeoMetaConfig> = {}
    ): SeoMetaConfig {
        const config: SeoMetaConfig = {
            basic: {
                title: '',
                description: '',
            },
        };

        // Configuration de base selon le type de contenu
        switch (contentType) {
            case ContentType.WEBSITE:
                config.basic = {
                    title: data.title || '',
                    description: data.description || '',
                };

                config.openGraph = {
                    type: 'website',
                    title: data.title,
                    description: data.description,
                    url: data.url || this.options.siteUrl,
                };

                if (data.image) {
                    config.openGraph.images = [{
                        url: data.image,
                        alt: data.title,
                    }];
                }
                break;

            case ContentType.ARTICLE:
            case ContentType.BLOG:
            case ContentType.NEWS:
                const articleType =
                    contentType === ContentType.NEWS
                        ? JsonLdType.NEWS_ARTICLE
                        : contentType === ContentType.BLOG
                            ? JsonLdType.BLOG_POSTING
                            : JsonLdType.ARTICLE;

                config.basic = {
                    title: data.title || '',
                    description: data.description || '',
                    keywords: data.keywords || [],
                };

                config.openGraph = {
                    type: 'article',
                    title: data.title,
                    description: data.description,
                    url: data.url || this.options.siteUrl,
                    article: {
                        publishedTime: data.publishedAt || data.createdAt || new Date().toISOString(),
                        modifiedTime: data.updatedAt || new Date().toISOString(),
                        authors: data.author ? [data.author] : undefined,
                        section: data.category || undefined,
                        tags: data.tags || undefined,
                    },
                };

                if (data.image) {
                    config.openGraph.images = [{
                        url: data.image,
                        alt: data.title,
                    }];
                }

                config.jsonLd = {
                    type: articleType,
                    headline: data.title,
                    description: data.description,
                    url: data.url || this.options.siteUrl,
                    datePublished: data.publishedAt || data.createdAt || new Date().toISOString(),
                    dateModified: data.updatedAt || new Date().toISOString(),
                    author: data.author
                        ? {
                            type: JsonLdType.PERSON,
                            name: data.author,
                            url: data.authorUrl,
                        }
                        : undefined,
                    publisher: {
                        type: JsonLdType.ORGANIZATION,
                        name: this.options.siteName,
                        logo: this.options.defaultImage,
                    },
                    mainEntityOfPage: data.url || this.options.siteUrl,
                    image: data.image
                        ? {
                            url: data.image,
                            alt: data.title,
                        }
                        : undefined,
                };
                break;

            case ContentType.PRODUCT:
                config.basic = {
                    title: data.title || data.name || '',
                    description: data.description || '',
                };

                config.openGraph = {
                    type: 'product',
                    title: data.title || data.name,
                    description: data.description,
                    url: data.url || this.options.siteUrl,
                    product: {
                        price: data.price,
                        currency: data.currency || 'EUR',
                        availability: data.availability || 'in stock',
                        brand: data.brand,
                    },
                };

                if (data.image) {
                    config.openGraph.images = [{
                        url: data.image,
                        alt: data.title || data.name,
                    }];
                }

                config.jsonLd = {
                    type: JsonLdType.PRODUCT,
                    name: data.title || data.name,
                    description: data.description,
                    url: data.url || this.options.siteUrl,
                    image: data.image
                        ? {
                            url: data.image,
                            alt: data.title || data.name,
                        }
                        : undefined,
                    product: {
                        brand: {
                            type: JsonLdType.ORGANIZATION,
                            name: data.brand || this.options.siteName,
                        },
                        sku: data.sku,
                        mpn: data.mpn,
                        offers: {
                            type: JsonLdType.OFFER,
                            price: data.price,
                            priceCurrency: data.currency || 'EUR',
                            availability: data.inStock ? 'InStock' : 'OutOfStock',
                            url: data.url || this.options.siteUrl,
                        },
                    },
                };

                // Ajout des avis et notations si disponibles
                if (data.rating) {
                    (config.jsonLd as JsonLdConfig).product!.aggregateRating = {
                        type: JsonLdType.AGGREGATE_RATING,
                        ratingValue: data.rating,
                        bestRating: data.bestRating || 5,
                        worstRating: data.worstRating || 1,
                        ratingCount: data.ratingCount || 1,
                    };
                }
                break;

            case ContentType.FAQ:
                config.basic = {
                    title: data.title || 'FAQ',
                    description: data.description || 'Questions fréquemment posées',
                };

                config.jsonLd = {
                    type: JsonLdType.FAQ_PAGE,
                    faqs: (data.questions || []).map((q: any) => ({
                        question: q.question,
                        answer: q.answer,
                    })),
                };
                break;

            case ContentType.BREADCRUMB:
                config.jsonLd = {
                    type: JsonLdType.BREADCRUMB_LIST,
                    breadcrumbs: (data.items || []).map((item: any, index: number) => ({
                        name: item.name,
                        item: item.url,
                        position: index + 1,
                    })),
                };
                break;

            default:
                // Type de contenu par défaut
                config.basic = {
                    title: data.title || '',
                    description: data.description || '',
                };
        }

        // Fusion avec les remplacements fournis
        return this.mergeWithOverrides(config, overrides);
    }

    /**
     * Fusionner une configuration avec des remplacements
     */
    private mergeWithOverrides(
        config: SeoMetaConfig,
        overrides: Partial<SeoMetaConfig>
    ): SeoMetaConfig {
        return {
            ...config,
            basic: {
                ...config.basic,
                ...(overrides.basic || {}),
            },
            openGraph: overrides.openGraph !== undefined
                ? {
                    ...(config.openGraph || {}),
                    ...overrides.openGraph,
                }
                : config.openGraph,
            twitter: overrides.twitter !== undefined
                ? {
                    ...(config.twitter || {}),
                    ...overrides.twitter,
                }
                : config.twitter,
            jsonLd: overrides.jsonLd || config.jsonLd,
        };
    }

    /**
     * Générer des métadonnées SEO à partir d'un type de contenu
     */
    generateFromContentType(
        contentType: ContentType,
        data: Record<string, any>,
        overrides: Partial<SeoMetaConfig> = {}
    ): string {
        const config = this.createConfigFromContentType(contentType, data, overrides);
        return this.generateFullSeoMeta(config);
    }

    /**
     * Obtenir le flux de lecture pour les métadonnées générées
     */
    getReadableStream(
        contentType: ContentType,
        data: Record<string, any>,
        overrides: Partial<SeoMetaConfig> = {}
    ): Readable {
        const metaTags = this.generateFromContentType(contentType, data, overrides);
        return Readable.from([metaTags]);
    }
}

/**
 * Fonction utilitaire pour extraire des métadonnées d'une page PHP existante
 * Utile lors de la migration pour conserver les métadonnées SEO existantes
 */
export async function extractMetaFromPhpPage(
    phpFilePath: string
): Promise<Partial<BasicMetaConfig>> {
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