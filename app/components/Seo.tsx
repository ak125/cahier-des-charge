import { useLocation, useMatches } from '@remix-run/react';
import type { MetaDescriptor } from '@remix-run/react';
import { config } from '~/config/seo-config';
import { ensureCanonical } from '~/utils/canonical';

interface SEOProps {
  /** Métadonnées spécifiques à cette page, remplace les valeurs par défaut */
  meta?: MetaDescriptor[];
  /** Type de page pour utiliser un modèle prédéfini dans la config */
  template?: keyof typeof config.templates;
  /** Données utilisées pour générer les métadonnées dynamiques */
  data?: Record<string, any>;
  /** Empêche l'indexation de cette page */
  noindex?: boolean;
}

/**
 * Composant pour générer les métadonnées SEO, incluant les balises canoniques
 * À utiliser dans l'export meta de chaque route
 */
export function generateSEO({
  meta = [],
  template,
  data,
  noindex = false,
}: SEOProps = {}): MetaDescriptor[] {
  // Récupérer l'URL actuelle
  const matches = useMatches();
  const location = useLocation();
  const _currentRoute = matches[matches.length - 1];

  // Vérifier si la page doit être exclue de l'indexation
  const shouldNoindex =
    noindex ||
    config.noindex.some((path) => location.pathname.startsWith(path) || location.pathname === path);

  // Métadonnées par défaut
  let metadata: MetaDescriptor[] = [
    { title: config.defaultMeta.title },
    { name: 'description', content: config.defaultMeta.description },
    { property: 'og:title', content: config.defaultMeta.title },
    { property: 'og:description', content: config.defaultMeta.description },
    { property: 'og:image', content: config.defaultMeta.image },
    { property: 'og:type', content: config.defaultMeta.type },
    { property: 'og:locale', content: config.defaultMeta.locale },
    { property: 'og:site_name', content: config.defaultMeta.siteName },
    { name: 'twitter:card', content: config.defaultMeta.twitterCard },
    { name: 'robots', content: shouldNoindex ? 'noindex, nofollow' : 'index, follow' },
  ];

  // Appliquer le template si spécifié et si des données sont disponibles
  if (template && data && config.templates[template]) {
    const templateConfig = config.templates[template];

    // Générer le titre selon le template
    if (templateConfig.title) {
      const title =
        typeof templateConfig.title === 'function'
          ? templateConfig.title(data)
          : templateConfig.title;

      metadata = metadata.map((meta) =>
        meta.title
          ? { title }
          : meta.property === 'og:title'
            ? { property: 'og:title', content: title }
            : meta
      );
    }

    // Générer la description selon le template
    if (templateConfig.description) {
      const description =
        typeof templateConfig.description === 'function'
          ? templateConfig.description(data)
          : templateConfig.description;

      metadata = metadata.map((meta) =>
        meta.name === 'description'
          ? { name: 'description', content: description }
          : meta.property === 'og:description'
            ? { property: 'og:description', content: description }
            : meta
      );
    }

    // Générer l'URL canonique selon le template
    if (templateConfig.canonical) {
      const canonicalPath =
        typeof templateConfig.canonical === 'function'
          ? templateConfig.canonical(data, new Request(location.pathname + location.search))
          : templateConfig.canonical;

      metadata = ensureCanonical(metadata, canonicalPath);
    }
  }

  // Fusionner avec les métadonnées spécifiques
  const mergedMeta = [...metadata, ...meta].reduce(
    (acc, item) => {
      // Éviter les doublons en remplaçant les métadonnées avec la même clé
      const key = Object.keys(item)[0];
      const existingIndex = acc.findIndex((i) => Object.keys(i)[0] === key);

      if (existingIndex !== -1) {
        acc[existingIndex] = item;
      } else {
        acc.push(item);
      }

      return acc;
    },
    [] as MetaDescriptor[]
  );

  // Assurer qu'il y a une balise canonique
  return ensureCanonical(mergedMeta, location.pathname + location.search);
}

/**
 * Hook à utiliser dans les composants pour générer les métadonnées SEO
 */
export function useSEO(props: SEOProps = {}): MetaDescriptor[] {
  return generateSEO(props);
}
