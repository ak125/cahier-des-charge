/**
 * useSEO.ts
 * 
 * Hook React pour charger automatiquement les métadonnées SEO
 * générées par l'agent SEO pour la route courante
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface SEOData {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl?: string;
    ogTags: Record<string, string>;
    jsonLd: Record<string, any>[];
}

// Type d'erreur pour les métadonnées SEO
type SEOError = 'not-found' | 'loading-error';

/**
 * Hook personnalisé pour charger les métadonnées SEO
 */
export function useSEO(options: {
    fallbackTitle?: string;
    fallbackDescription?: string;
    metadataPath?: string;
}) {
    const router = useRouter();
    const [seoData, setSeoData] = useState<SEOData | null>(null);
    const [error, setError] = useState<SEOError | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const {
        fallbackTitle = 'Site Default Title',
        fallbackDescription = 'Default site description',
        metadataPath = '/generated/seo/metadata.json',
    } = options;

    useEffect(() => {
        if (!router.isReady) return;

        // Fonction pour charger les données SEO
        const loadSEOData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Récupérer le chemin actuel
                const currentPath = router.asPath.split('?')[0].split('#')[0];

                // Charger le fichier de métadonnées généré par l'agent SEO
                const response = await fetch(metadataPath);
                if (!response.ok) {
                    throw new Error(`Impossible de charger les métadonnées SEO: ${response.statusText}`);
                }

                const metadata = await response.json();

                // Chercher les données pour la route actuelle
                if (metadata[currentPath]) {
                    setSeoData(metadata[currentPath]);
                } else {
                    // Si pas de données spécifiques, utiliser les valeurs par défaut
                    setError('not-found');
                    setSeoData({
                        title: fallbackTitle,
                        description: fallbackDescription,
                        keywords: [],
                        ogTags: {
                            'og:title': fallbackTitle,
                            'og:description': fallbackDescription,
                            'og:url': `${window.location.origin}${currentPath}`
                        },
                        jsonLd: [{
                            '@context': 'https://schema.org',
                            '@type': 'WebPage',
                            'name': fallbackTitle,
                            'description': fallbackDescription,
                            'url': `${window.location.origin}${currentPath}`
                        }]
                    });
                }
            } catch (error) {
                console.error('Erreur lors du chargement des métadonnées SEO:', error);
                setError('loading-error');

                // Utiliser les valeurs par défaut en cas d'erreur
                setSeoData({
                    title: fallbackTitle,
                    description: fallbackDescription,
                    keywords: [],
                    ogTags: {
                        'og:title': fallbackTitle,
                        'og:description': fallbackDescription
                    },
                    jsonLd: []
                });
            } finally {
                setLoading(false);
            }
        };

        loadSEOData();
    }, [router.isReady, router.asPath, fallbackTitle, fallbackDescription, metadataPath]);

    return { seoData, loading, error };
}

export default useSEO;