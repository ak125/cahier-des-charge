import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/react';
import { createSEOLoader, createSEOMeta } from '~/utils/seo';
import { createCanonicalLink } from '~/utils/use-canonical';

// Combiner notre loader original avec l'utilitaire SEO
const originalLoader = async ({ params, request }: LoaderFunctionArgs) => {
  const slug = params.slug;

  // Appel à ton backend NestJS ou Prisma directement
  const fiche = await fetchFicheBySlug(slug);

  if (!fiche) throw new Response('Not Found', { status: 404 });

  // Construire l'URL canonique pour cette fiche
  // Utiliser le slug SEO-friendly s'il existe, sinon utiliser le slug de l'URL
  const canonicalSlug = fiche.seoSlug || slug;
  const canonicalUrl = `/fiche/${canonicalSlug}`;

  // Renvoyer les données enrichies
  return {
    fiche,
    canonical: canonicalUrl,
    // Ajouter des informations pour le SEO
    seo: {
      title: fiche.nom,
      description: fiche.description?.substring(0, 160) || `Fiche produit pour ${fiche.nom}`,
      canonical: canonicalUrl,
    },
  };
};

// Utiliser notre wrapper pour enrichir le loader avec les données SEO
export const loader = createSEOLoader(originalLoader);

// Fonction meta améliorée avec support canonique
export const meta: MetaFunction<typeof loader> = ({ data, params, location }) => {
  // Si la page n'est pas trouvée, renvoyer un titre d'erreur
  if (!data?.fiche) return [{ title: 'Fiche produit non trouvée' }];

  // Utiliser notre fonction createSEOMeta pour générer toutes les balises
  return createSEOMeta({
    template: 'fiche',
    data: data.fiche,
    canonical: data.canonical,
    meta: [
      // Exemple d'ajout d'une balise spécifique à cette fiche
      {
        name: 'keywords',
        content: `${data.fiche.marque}, ${data.fiche.categorie}, pièces détachées`,
      },
      // Balises spécifiques pour les produits
      { property: 'og:type', content: 'product' },
      { property: 'og:image', content: data.fiche.image || '' },
      { property: 'product:price:amount', content: data.fiche.prix?.toString() || '' },
      { property: 'product:price:currency', content: 'EUR' },
    ],
  })({
    data,
    params,
    location,
  });
};

// Fonction links pour ajouter le lien canonique (alternative pour le SSR)
export const links: LinksFunction = () => {
  return [
    createCanonicalLink(), // Ce sera remplacé par l'URL canonique correcte lors du rendu
  ];
};

export default function FicheProduit() {
  const { fiche } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{fiche.nom}</h1>
      {/* Le lien canonique sera automatiquement ajouté dans l'en-tête HTML */}
      {/* Contenu de la page */}
    </div>
  );
}

// Fonction fictive à remplacer par votre implémentation réelle
async function fetchFicheBySlug(_slug: string | undefined) {
  // Simuler un appel à l'API ou à la base de données
  return {
    id: '123',
    nom: 'Plaquettes de frein Bosch',
    description: 'Plaquettes de frein haute performance pour votre véhicule',
    marque: 'Bosch',
    categorie: 'Freinage',
    prix: 49.99,
    image: 'https://www.monsite.fr/images/plaquettes-frein-bosch.jpg',
    seoSlug: 'plaquettes-frein-bosch', // Slug optimisé pour le SEO, peut être différent du slug de l'URL
  };
}
