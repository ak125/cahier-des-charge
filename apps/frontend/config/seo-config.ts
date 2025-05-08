import { CanonicalConfig } from '~/utils/canonical';

/**
 * Configuration SEO globale pour l'application
 */
export const config = {
  // Configuration des URL canoniques
  canonical: {
    baseUrl: 'https://www.monsite.fr',
    stripTrailingSlash: true,
    forceHttps: true,
    forceWww: true,
    removeQueryParams: true,
    allowedQueryParams: ['id', 'ref', 'slug', 'cat', 'page', 'q'],
    customMapping: {
      // Mappings spécifiques pour certaines pages
      '/ancien-panier.php': '/cart',
      '/mon-compte.php': '/account',
      '/catalogue.php': '/catalog',
      '/api.php': '/api',
      '/panier.php': '/cart',
    },
  },

  // Paramètres généraux pour les métadonnées
  defaultMeta: {
    title: 'Auto Pièces Équipements - Pièces détachées auto au meilleur prix',
    description:
      'Achetez vos pièces détachées auto à prix discount. Livraison rapide, large gamme de produits pour toutes marques de véhicules.',
    image: '/images/default-og-image.jpg',
    locale: 'fr_FR',
    type: 'website',
    twitterCard: 'summary_large_image',
    siteName: 'Auto Pièces Équipements',
  },

  // Configuration des règles de métadonnées par type de page
  templates: {
    fiche: {
      title: (data) => `Acheter ${data.nom} au meilleur prix | ${config.defaultMeta.siteName}`,
      description: (data) =>
        data.description?.slice(0, 160) ||
        `Découvrez ${data.nom} - Prix bas et livraison rapide sur ${config.defaultMeta.siteName}`,
      canonical: (data) => `/fiche/${data.slug}`,
    },
    categorie: {
      title: (data) => `${data.nom} - Catalogue Complet | ${config.defaultMeta.siteName}`,
      description: (data) =>
        data.description?.slice(0, 160) ||
        `Explorez notre gamme de ${data.nom} à prix compétitifs. Livraison rapide et garantie qualité.`,
      canonical: (data) => `/categorie/${data.slug}`,
    },
    marque: {
      title: (data) => `Pièces ${data.nom} - Catalogue Officiel | ${config.defaultMeta.siteName}`,
      description: (data) =>
        `Pièces détachées ${data.nom} d'origine au meilleur prix. Catalogue complet, expédition sous 24h.`,
      canonical: (data) => `/marque/${data.slug}`,
    },
    recherche: {
      title: (data) => `Résultats pour "${data.query}" | ${config.defaultMeta.siteName}`,
      description: (data) =>
        `Découvrez nos produits correspondant à votre recherche "${data.query}". Livraison rapide, paiement sécurisé.`,
      canonical: (_data, request) => {
        // Pour les pages de recherche, nous voulons inclure le paramètre q mais pas page
        const url = new URL(request.url);
        const cleanUrl = new URL('/recherche', config.canonical.baseUrl);
        cleanUrl.searchParams.set('q', url.searchParams.get('q') || '');
        return cleanUrl.pathname + cleanUrl.search;
      },
    },
  },

  // Pages à ne pas indexer
  noindex: [
    '/cart',
    '/checkout',
    '/account',
    '/login',
    '/register',
    '/404',
    '/500',
    '/maintenance',
    '/recherche-avancee',
    '/print/',
    '/test/',
    '/legacy-not-migrated',
  ],

  // Redirections pour les anciens URLs (complément à routing_patch.json)
  legacyRedirects: {
    '/catalogue.php': '/catalog',
    '/galerie.php': '/gallery',
    '/promo.php': '/promotions',
    '/nouveautes.php': '/new-products',
  },
};
