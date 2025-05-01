import type { LinksFunction, MetaFunction } from '@remix-run/node';
import type { ProductData } from '~/types/product';
import { getSeoData } from '~/utils/seo-utils';

// Cette fonction est appelée par le loader de la route
// Les données du produit sont fournies par le loader après récupération en BDD
export const generateMetadata = (product: ProductData) => {
  // Récupération des données SEO depuis le fichier .seo.json (si disponible)
  // Sinon, génération des données SEO à partir des informations du produit
  const seoData = getSeoData(`/pneus/${product.brand.slug}/${product.slug}`);

  const meta: MetaFunction = () => {
    const title =
      seoData?.metadata.title ||
      `Pneu ${product.brand.name} ${product.name} ${product.size} - Mon Site`;

    const description =
      seoData?.metadata.description ||
      `Achetez le pneu ${product.brand.name} ${product.name} ${product.size} au meilleur prix. Livraison rapide et montage disponible dans nos centres partenaires.`;

    const canonical =
      seoData?.metadata.canonical ||
      `https://www.mon-site.fr/pneus/${product.brand.slug}/${product.slug}`;

    return {
      // Métadonnées de base
      title,
      description,

      // Contrôle d'indexation
      robots: seoData?.metadata.robots || 'index, follow',
      'robots-directive': seoData?.metadata.robots || 'index, follow',

      // Métadonnées Open Graph
      'og:title': seoData?.metadata.ogTitle || title,
      'og:description': seoData?.metadata.ogDescription || description,
      'og:url': seoData?.metadata.ogUrl || canonical,
      'og:image':
        seoData?.metadata.ogImage ||
        `https://www.mon-site.fr/images/products/${product.brand.slug}-${product.slug}.jpg`,
      'og:type': 'product',

      // Métadonnées Twitter
      'twitter:card': 'summary_large_image',
      'twitter:title': seoData?.metadata.twitterTitle || title,
      'twitter:description': seoData?.metadata.twitterDescription || description,
      'twitter:image':
        seoData?.metadata.twitterImage ||
        `https://www.mon-site.fr/images/products/${product.brand.slug}-${product.slug}.jpg`,

      // Autres métadonnées utiles
      keywords:
        seoData?.metadata.keywords ||
        `pneu, ${product.brand.name}, ${product.name}, ${product.size}`,

      // Informations de produit pour les résultats enrichis (en complément du JSON-LD)
      'product:brand': product.brand.name,
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'EUR',
      'product:condition': 'new',
    };
  };

  return meta;
};

export const generateLinks: LinksFunction = (product: ProductData) => {
  const seoData = getSeoData(`/pneus/${product.brand.slug}/${product.slug}`);

  return () => {
    return [
      // Lien canonique
      {
        rel: 'canonical',
        href:
          seoData?.metadata.canonical ||
          `https://www.mon-site.fr/pneus/${product.brand.slug}/${product.slug}`,
      },

      // Liens alternatifs pour différentes langues (si applicable)
      {
        rel: 'alternate',
        hrefLang: 'fr',
        href: `https://www.mon-site.fr/pneus/${product.brand.slug}/${product.slug}`,
      },
      {
        rel: 'alternate',
        hrefLang: 'en',
        href: `https://www.mon-site.com/tires/${product.brand.slug}/${product.slug}`,
      },

      // Prévention de pages en double avec des attributs de pagination
      {
        rel: 'first',
        href: `https://www.mon-site.fr/pneus/${product.brand.slug}/${product.slug}`,
      },

      // Préchargement des ressources critiques
      {
        rel: 'preload',
        href: `https://www.mon-site.fr/images/products/${product.brand.slug}-${product.slug}.jpg`,
        as: 'image',
      },
    ];
  };
};

// Cette fonction génère le JSON-LD pour la fiche produit
export const generateJsonLd = (product: ProductData) => {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: `Pneu ${product.brand.name} ${product.name} ${product.size}`,
    image: [`https://www.mon-site.fr/images/products/${product.brand.slug}-${product.slug}.jpg`],
    description: `Le ${product.brand.name} ${product.name} offre une excellente tenue de route sur sol mouillé et sec, ainsi qu'une distance de freinage réduite.`,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand.name,
    },
    offers: {
      '@type': 'Offer',
      url: `https://www.mon-site.fr/pneus/${product.brand.slug}/${product.slug}`,
      priceCurrency: 'EUR',
      price: product.price,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Mon Site',
      },
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
    review: product.reviews?.map((review) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: '5',
      },
      author: {
        '@type': 'Person',
        name: review.author,
      },
      datePublished: review.date,
      reviewBody: review.content,
    })),
  };
};
