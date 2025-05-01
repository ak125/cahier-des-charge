import { LoaderFunctionArgs, json } from '@remix-run/node';
import { prisma } from '~/lib/db.server';

/**
 * Loader pour la route /fiche/:id
 * Migration de l'ancienne page PHP: /fiche.php?id=X
 */

export interface FicheData {
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

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id || isNaN(Number(id))) {
    throw new Response('Fiche introuvable', { status: 404 });
  }

  // Récupérer l'ancien ID si c'est une redirection d'une ancienne URL
  // Cette logique aide à maintenir la compatibilité avec l'ancien format ?id=X
  const url = new URL(request.url);
  const oldIdParam = url.searchParams.get('id');

  // Si on a un ancien format d'URL, rediriger vers le nouveau format
  if (oldIdParam && !isNaN(Number(oldIdParam))) {
    return redirect(`/fiche/${oldIdParam}`, { status: 301 });
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

    // Journaliser l'accès à la fiche pour les analytics (optionnel)
    if (process.env.ENABLE_ACCESS_LOGS === 'true') {
      await prisma.accessLog.create({
        data: {
          pagePath: `/fiche/${id}`,
          userAgent: request.headers.get('User-Agent') || '',
          referer: request.headers.get('Referer') || '',
          timestamp: new Date(),
          ficheId: fiche.id,
        },
      });
    }

    return json({ fiche: ficheData });
  } catch (error) {
    console.error('Erreur lors de la récupération de la fiche:', error);
    throw new Response('Erreur lors de la récupération de la fiche', { status: 500 });
  }
}
