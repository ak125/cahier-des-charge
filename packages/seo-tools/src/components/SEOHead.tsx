/**
 * SEOHead.tsx
 * 
 * Composant React pour injecter automatiquement les métadonnées SEO
 * (JSON-LD, OpenGraph, Twitter Cards) dans le head des pages
 * 
 * Usage:
 * <SEOHead 
 *   title="Titre de la page"
 *   description="Description de la page"
 *   canonicalUrl="/chemin-canonique"
 *   jsonLd={[...]} // Optionnel, généré automatiquement si non fourni
 *   ogTags={{...}} // Optionnel, généré automatiquement si non fourni
 * />
 */

import React from 'react';
import Head from 'next/head';

export interface SEOHeadProps {
    title: string;
    description: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'product' | 'profile' | 'book';
    twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
    jsonLd?: Record<string, any>[];
    ogTags?: Record<string, string>;
    noindex?: boolean;
    nofollow?: boolean;
    siteUrl?: string;
    siteName?: string;
}

/**
 * Composant SEOHead pour injecter automatiquement les métadonnées SEO
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
    title,
    description,
    keywords = [],
    canonicalUrl,
    ogImage,
    ogType = 'website',
    twitterCard = 'summary_large_image',
    jsonLd,
    ogTags,
    noindex = false,
    nofollow = false,
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
    siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Site Name'
}) => {
    // Construire l'URL canonique complète
    const fullCanonicalUrl = canonicalUrl
        ? new URL(canonicalUrl.startsWith('http') ? canonicalUrl : canonicalUrl, siteUrl).toString()
        : siteUrl;

    // Construire les balises robots
    const robotsContent = [
        noindex ? 'noindex' : 'index',
        nofollow ? 'nofollow' : 'follow',
        'max-image-preview:large',
        'max-snippet:-1',
        'max-video-preview:-1'
    ].join(', ');

    // Générer JSON-LD par défaut si non fourni
    const defaultJsonLd = !jsonLd ? [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': title,
            'description': description,
            'url': fullCanonicalUrl,
            'inLanguage': 'fr-FR',
            'isPartOf': {
                '@type': 'WebSite',
                'name': siteName,
                'url': siteUrl
            }
        }
    ] : [];

    const finalJsonLd = jsonLd || defaultJsonLd;

    // Générer les balises OpenGraph par défaut si non fournies
    const defaultOgTags: Record<string, string> = {
        'og:title': title,
        'og:description': description,
        'og:url': fullCanonicalUrl,
        'og:type': ogType,
        'og:site_name': siteName
    };

    if (ogImage) {
        defaultOgTags['og:image'] = ogImage.startsWith('http')
            ? ogImage
            : new URL(ogImage, siteUrl).toString();
    }

    // Fusionner avec les balises OpenGraph personnalisées
    const finalOgTags = { ...defaultOgTags, ...ogTags };

    // Générer les balises Twitter Cards
    const twitterTags: Record<string, string> = {
        'twitter:card': twitterCard,
        'twitter:title': title,
        'twitter:description': description
    };

    if (ogImage) {
        twitterTags['twitter:image'] = finalOgTags['og:image'];
    }

    return (
        <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
            {keywords.length > 0 && (
                <meta name="keywords" content={keywords.join(', ')} />
            )}
            <meta name="robots" content={robotsContent} />
            <link rel="canonical" href={fullCanonicalUrl} />

            {/* OpenGraph tags */}
            {Object.entries(finalOgTags).map(([property, content]) => (
                <meta key={property} property={property} content={content} />
            ))}

            {/* Twitter Card tags */}
            {Object.entries(twitterTags).map(([name, content]) => (
                <meta key={name} name={name} content={content} />
            ))}

            {/* JSON-LD structured data */}
            {finalJsonLd.map((data, index) => (
                <script
                    key={`jsonld-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
                />
            ))}
        </Head>
    );
};

export default SEOHead;