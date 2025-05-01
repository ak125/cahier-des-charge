import type { MetaFunction } from '@remix-run/node';
import { getCanonicalUrl } from '~/utils/seo';

/**
 * Métadonnées SEO pour la page de fiche
 * Migration depuis l'ancienne structure PHP /fiche.php?id=X
 */

export const meta: MetaFunction = ({ data, params, location }) => {
  // Si aucune donnée n'est disponible (erreur ou chargement)
  if (!data?.fiche) {
    return [
      { title: 'Fiche introuvable' },
      { name: 'description', content: "La fiche demandée n'a pas été trouvée." },
      { name: 'robots', content: 'noindex, nofollow' },
    ];
  }

  const { fiche } = data;
  const canonicalUrl = getCanonicalUrl(`/fiche/${params.id}`, location);

  return [
    // Titre principal de la page
    { title: FicheDotmetadonnees.title },

    // Description principale
    { name: 'description', content: FicheDotmetadonnees.description },

    // Mots-clés (toujours utiles pour certains moteurs et l'analyse interne)
    { name: 'keywords', content: FicheDotmetadonnees.keywords },

    // URL canonique
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },

    // Open Graph - pour un meilleur partage sur les réseaux sociaux
    { property: 'og:title', content: FicheDotmetadonnees.title },
    { property: 'og:description', content: FicheDotmetadonnees.description },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:type', content: 'article' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: FicheDotmetadonnees.title },
    { name: 'twitter:description', content: FicheDotmetadonnees.description },

    // Métadonnées structurées pour les moteurs de recherche (à compléter selon le modèle de données)
    {
      tagName: 'script',
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: fiche.titre,
        description: fiche.description,
        datePublished: fiche.dateCreation,
        author: {
          '@type': 'Organization',
          name: 'Votre Organisation',
        },
      }),
    },
  ];
};
