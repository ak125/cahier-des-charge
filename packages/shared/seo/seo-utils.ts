import {
  SEOMetadata,
  SEOMetadataSchema,
  validateSEOMetadata,
} from '../..DoDotmcp-agents/SeoChecker/SeoMetadataSchema';

/**
 * Utilitaires pour la gestion des métadonnées SEO standardisées
 * Ces fonctions permettent de générer et valider facilement les métadonnées SEO
 * pour les utiliser dans les routes Remix
 */

export interface SEOGeneratorOptions {
  defaultTitle?: string;
  defaultDescription?: string;
  defaultImage?: string;
  siteName?: string;
  siteUrl?: string;
  twitterUsername?: string;
  defaultLocale?: string;
}

// Configuration par défaut pour les métadonnées SEO
const defaultOptions: SEOGeneratorOptions = {
  defaultTitle: 'Site par défaut',
  defaultDescription: 'Description par défaut du site',
  siteName: 'Nom du site',
  siteUrl: 'https://example.com',
  defaultLocale: 'fr_FR',
};

/**
 * Génère des métadonnées SEO validées à partir d'une entrée partielle
 * Complète avec les valeurs par défaut si nécessaire
 */
export function generateSEOMetadata(
  partialMetadata: Partial<SEOMetadata>,
  options: SEOGeneratorOptions = defaultOptions
): SEOMetadata {
  // Fusionner les métadonnées partielles avec les valeurs par défaut
  const metadata: Partial<SEOMetadata> = {
    standard: {
      title:
        partialMetadata.standard?.title || options.defaultTitle || defaultOptions.defaultTitle!,
      description:
        partialMetadata.standard?.description ||
        options.defaultDescription ||
        defaultOptions.defaultDescription!,
      canonical:
        partialMetadata.standard?.canonical ||
        `${options.siteUrl || defaultOptions.siteUrl}${partialMetadata.url || ''}`,
      robots: partialMetadata.standard?.robots || 'index, follow',
      lang: partialMetadata.standard?.lang || 'fr',
    },
    openGraph: {
      title:
        partialMetadata.openGraph?.title ||
        partialMetadata.standard?.title ||
        options.defaultTitle ||
        defaultOptions.defaultTitle!,
      description:
        partialMetadata.openGraph?.description ||
        partialMetadata.standard?.description ||
        options.defaultDescription ||
        defaultOptions.defaultDescription!,
      image: partialMetadata.openGraph?.image || options.defaultImage,
      type: partialMetadata.openGraph?.type || 'website',
      site_name:
        partialMetadata.openGraph?.site_name || options.siteName || defaultOptions.siteName!,
      locale:
        partialMetadata.openGraph?.locale || options.defaultLocale || defaultOptions.defaultLocale!,
      url:
        partialMetadata.openGraph?.url ||
        `${options.siteUrl || defaultOptions.siteUrl}${partialMetadata.url || ''}`,
    },
    twitterCard: partialMetadata.twitterCard || {
      card: 'summary_large_image',
      title:
        partialMetadata.standard?.title || options.defaultTitle || defaultOptions.defaultTitle!,
      description:
        partialMetadata.standard?.description ||
        options.defaultDescription ||
        defaultOptions.defaultDescription!,
      image: options.defaultImage,
      site: options.twitterUsername,
    },
    url: partialMetadata.url || '/',
    createdAt: partialMetadata.createdAt || new Date(),
    updatedAt: new Date(),
  };

  // Valider et retourner les métadonnées complètes
  const validationResult = validateSEOMetadata(metadata);
  if (validationResult.success) {
    return validationResult.data as SEOMetadata;
  }

  console.error('Erreur de validation SEO:', validationResult.errors);

  // En cas d'erreur, retourner une version minimale valide des métadonnées
  return SEOMetadataSchema.parse({
    standard: {
      title: options.defaultTitle || defaultOptions.defaultTitle!,
      description: options.defaultDescription || defaultOptions.defaultDescription!,
    },
    url: '/',
  });
}

/**
 * Transforme les métadonnées SEO en balises meta pour le document HTML
 */
export function generateMetaTags(metadata: SEOMetadata): Record<string, string> {
  const metaTags: Record<string, string> = {};

  // Standard meta tags
  metaTags.title = metadata.standard.title;
  metaTags.description = metadata.standard.description;

  if (metadata.standard.canonical) {
    metaTags.canonical = metadata.standard.canonical;
  }

  if (metadata.standard.robots) {
    metaTags.robots = metadata.standard.robots;
  }

  if (metadata.standard.keywords) {
    metaTags.keywords = metadata.standard.keywords;
  }

  // OpenGraph tags
  if (metadata.openGraph) {
    metaTags['og:title'] = metadata.openGraph.title || metadata.standard.title;
    metaTags['og:description'] = metadata.openGraph.description || metadata.standard.description;
    metaTags['og:type'] = metadata.openGraph.type;

    if (metadata.openGraph.image) {
      metaTags['og:image'] = metadata.openGraph.image;
    }

    if (metadata.openGraph.url) {
      metaTags['og:url'] = metadata.openGraph.url;
    }

    if (metadata.openGraph.site_name) {
      metaTags['og:site_name'] = metadata.openGraph.site_name;
    }

    if (metadata.openGraph.locale) {
      metaTags['og:locale'] = metadata.openGraph.locale;
    }
  }

  // Twitter Card tags
  if (metadata.twitterCard) {
    metaTags['twitter:card'] = metadata.twitterCard.card;

    if (metadata.twitterCard.title) {
      metaTags['twitter:title'] = metadata.twitterCard.title;
    }

    if (metadata.twitterCard.description) {
      metaTags['twitter:description'] = metadata.twitterCard.description;
    }

    if (metadata.twitterCard.image) {
      metaTags['twitter:image'] = metadata.twitterCard.image;
    }

    if (metadata.twitterCard.creator) {
      metaTags['twitter:creator'] = metadata.twitterCard.creator;
    }

    if (metadata.twitterCard.site) {
      metaTags['twitter:site'] = metadata.twitterCard.site;
    }
  }

  return metaTags;
}

/**
 * Génère un script JSON-LD pour les données structurées Schema.org
 */
export function generateJsonLdScript(metadata: SEOMetadata): string | null {
  if (!metadata.schemaOrg || metadata.schemaOrg.length === 0) {
    return null;
  }

  const jsonLdData = metadata.schemaOrg.map((schema) => ({
    '@context': 'https://schema.org',
    '@type': schema.type,
    ...schema.data,
  }));

  return JSON.stringify(jsonLdData);
}

/**
 * Configuration globale des options SEO par défaut
 */
let globalSeoOptions = defaultOptions;

export function configureSEO(options: SEOGeneratorOptions): void {
  globalSeoOptions = { ...defaultOptions, ...options };
}

export function getGlobalSEOOptions(): SEOGeneratorOptions {
  return globalSeoOptions;
}
