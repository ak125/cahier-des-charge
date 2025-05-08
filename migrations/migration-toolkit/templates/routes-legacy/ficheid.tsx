import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';
import { SeoTags } from '~/components/SeoTags';
import { PageContainer } from '~/components/layout/PageContainer';
import { prisma } from '~/lib/db.server';

/**
 * Composant Remix pour la route /fiche/:id
 * Migration de l'ancienne page PHP: /fiche.php?id=X
 */

// Définir l'interface de données
interface FicheData {
  id: number;
  titre: string;
  description: string;
  contenu: string;
  dateCreation: string;
  categorie: {
    id: number;
    nom: string;
  };
  tags: Array<{
    id: number;
    nom: string;
  }>;
  metadonnees: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
  };
}

// Loader - récupère les données côté serveur
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id || isNaN(Number(id))) {
    throw new Response('Fiche introuvable', { status: 404 });
  }

  try {
    // Récupérer les données depuis Prisma
    const fiche = await prisma.fiche.findUnique({
      where: { id: Number(id) },
      include: {
        categorie: true,
        tags: true,
        metadonnees: true,
      },
    });

    if (!fiche) {
      throw new Response('Fiche introuvable', { status: 404 });
    }

    // Transformation des données pour le front-end
    const ficheData: FicheData = {
      id: fiche.id,
      titre: fiche.titre,
      description: fiche.description || '',
      contenu: fiche.contenu || '',
      dateCreation: fiche.dateCreation?.toISOString() || new Date().toISOString(),
      categorie: {
        id: fiche.categorie?.id || 0,
        nom: fiche.categorie?.nom || 'Non catégorisé',
      },
      tags: fiche.tags.map((tag) => ({
        id: tag.id,
        nom: tag.nom,
      })),
      metadonnees: {
        title: FicheDotmetadonnees?.title || fiche.titre,
        description: FicheDotmetadonnees?.description || fiche.description || '',
        keywords: FicheDotmetadonnees?.keywords || '',
        canonical: FicheDotmetadonnees?.canonical || `/fiche/${fiche.id}`,
      },
    };

    return json({ fiche: ficheData });
  } catch (error) {
    console.error('Erreur lors de la récupération de la fiche:', error);
    throw new Response('Erreur lors de la récupération de la fiche', { status: 500 });
  }
}

// Composant principal
export default function FichePage() {
  const { fiche } = useLoaderData<typeof loader>();
  const params = useParams();

  return (
    <>
      {/* Balises SEO */}
      <SeoTags
        title={FicheDotmetadonnees.title}
        description={FicheDotmetadonnees.description}
        keywords={FicheDotmetadonnees.keywords}
        canonicalUrl={FicheDotmetadonnees.canonical}
      />

      <PageContainer>
        <div className="mx-auto max-w-4xl py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{fiche.titre}</h1>

            <div className="flex items-center text-sm text-gray-600 mb-4">
              <span className="mr-4">
                Publié le {new Date(fiche.dateCreation).toLocaleDateString('fr-FR')}
              </span>
              <span>
                Catégorie:{' '}
                <a
                  href={`/categorie/${fiche.categorie.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {fiche.categorie.nom}
                </a>
              </span>
            </div>

            <p className="text-lg text-gray-700">{fiche.description}</p>
          </header>

          <main className="prose max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: fiche.contenu }} />
          </main>

          {fiche.tags.length > 0 && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {fiche.tags.map((tag) => (
                  <a
                    key={tag.id}
                    href={`/tag/${tag.id}`}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                  >
                    {tag.nom}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
