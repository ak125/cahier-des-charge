import { useLocation, useMatches } from '@remix-run/react';
import { useMemo } from 'react';
import type { CanonicalConfig } from './canonical';

interface UseCanonicalOptions {
  // URL personnalisée à utiliser (surcharge l'URL actuelle)
  customPath?: string;

  // Configuration personnalisée (surcharge la config par défaut)
  config?: Partial<CanonicalConfig>;

  // Extraire l'URL canonique depuis les données de route
  extractFromRouteData?: boolean;

  // Clé dans les données de route où chercher l'URL canonique
  routeDataKey?: string;

  // Autoriser les fragments d'URL (#)
  allowFragments?: boolean;
}

// Configuration par défaut
const defaultConfig: CanonicalConfig = {
  baseUrl: 'https://www.monsite.fr',
  stripTrailingSlash: true,
  forceHttps: true,
  forceWww: true,
  removeQueryParams: true,
  allowedQueryParams: ['id', 'ref', 'slug'],
  customMapping: {},
};

/**
 * Hook pour générer facilement des URL canoniques dans les composants Remix
 *
 * @example
 * // Dans un composant :
 * const canonical = useCanonical();
 * // Dans meta function :
 * export const meta = () => {
 *   return [
 *     { title: "Ma page" },
 *     { rel: "canonical", href: useCanonical() }
 *   ];
 * };
 */
export function useCanonical(options: UseCanonicalOptions = {}): string {
  const location = useLocation();
  const matches = useMatches();

  // Fusionner la configuration par défaut avec les options
  const config = useMemo(() => {
    return { ...defaultConfig, ...options.config };
  }, [options.config]);

  // Chercher une URL canonique dans les données de route si demandé
  const canonicalFromRouteData = useMemo(() => {
    if (!options.extractFromRouteData) return null;

    // Parcourir les routes matchées, de la plus spécifique à la plus générale
    for (const match of [...matches].reverse()) {
      if (match.data) {
        const key = options.routeDataKey || 'canonical';
        if (match.data[key]) {
          return match.data[key];
        }
      }
    }

    return null;
  }, [matches, options.extractFromRouteData, options.routeDataKey]);

  // Déterminer l'URL à utiliser (par ordre de priorité)
  const pathToUse = useMemo(() => {
    // 1. URL personnalisée fournie directement
    if (options.customPath) {
      return options.customPath;
    }

    // 2. URL canonique trouvée dans les données de route
    if (canonicalFromRouteData) {
      return canonicalFromRouteData;
    }

    // 3. URL actuelle
    return `${location.pathname}${location.search}${options.allowFragments ? location.hash : ''}`;
  }, [
    options.customPath,
    canonicalFromRouteData,
    location.pathname,
    location.search,
    location.hash,
    options.allowFragments,
  ]);

  // Générer l'URL canonique
  return useMemo(() => {
    // Vérifier si nous avons un mapping personnalisé pour cette URL
    if (config.customMapping?.[pathToUse]) {
      return generateCanonicalURL(config.customMapping[pathToUse], config);
    }

    return generateCanonicalURL(pathToUse, config);
  }, [pathToUse, config]);
}

/**
 * Génère une URL canonique à partir d'une URL relative ou absolue
 */
function generateCanonicalURL(path: string, config: CanonicalConfig): string {
  // Ne pas modifier les URL externes
  if (path.startsWith('http') && !path.includes(new URL(config.baseUrl).hostname)) {
    return path;
  }

  // Construire l'URL
  try {
    // Pour les chemins relatifs, ajouter le baseUrl
    const url = path.startsWith('http') ? new URL(path) : new URL(path, config.baseUrl);

    // Appliquer les règles de normalisation
    if (config.forceHttps) {
      url.protocol = 'https:';
    }

    if (config.forceWww && !url.hostname.startsWith('www.')) {
      url.hostname = `www.${url.hostname}`;
    }

    // Gérer les paramètres de requête
    if (config.removeQueryParams && url.search) {
      const params = new URLSearchParams(url.search);
      const newParams = new URLSearchParams();

      for (const [key, value] of params.entries()) {
        if (config.allowedQueryParams.includes(key)) {
          newParams.append(key, value);
        }
      }

      url.search = newParams.toString() ? `?${newParams.toString()}` : '';
    }

    // Gérer le slash final
    let canonical = url.toString();
    if (config.stripTrailingSlash && canonical.endsWith('/') && !canonical.endsWith('://')) {
      canonical = canonical.slice(0, -1);
    }

    return canonical;
  } catch (error) {
    console.error(`Erreur lors de la génération de l'URL canonique pour '${path}':`, error);
    return `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}

/**
 * Helpers pour faciliter l'utilisation dans les fonctions meta/links de Remix
 */

/**
 * Aide à créer une balise <link rel="canonical"> pour les fonctions meta ou links de Remix
 */
export function createCanonicalMeta(
  url?: string,
  options: Omit<UseCanonicalOptions, 'customPath'> = {}
) {
  const canonicalUrl = url || useCanonical({ ...options, customPath: url });
  return { rel: 'canonical', href: canonicalUrl };
}

/**
 * Version pour la fonction links (signature différente)
 */
export function createCanonicalLink(url?: string) {
  // Dans ce cas, nous ne pouvons pas utiliser le hook (car la fonction links est appelée côté serveur)
  // Nous devons donc nous contenter d'une URL statique ou d'une logique synchrone
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  return { rel: 'canonical', href: canonicalUrl };
}

/**
 * Utilitaire pour générer une URL canonique à partir d'une ancienne URL PHP
 *
 * @example
 * // Ancien format: /fiche.php?id=123
 * // Nouveau format: /fiche/plaquettes-frein-bosch
 */
export function mapPhpUrlToCanonical(phpUrl: string): string {
  // On pourrait ici implémenter une logique personnalisée
  // ou utiliser une table de correspondance

  // Exemple simplifié:
  const url = new URL(phpUrl, 'https://placeholder.com');
  const path = url.pathname;

  // Extraire les paramètres
  const params = Object.fromEntries(url.searchParams);

  // Mapper les URL PHP vers Remix
  if (path === '/fiche.php' && params.id) {
    // Idéalement, on chercherait le slug dans une base de données
    // Mais ici, on simule juste
    return `/fiche/${params.id}`;
  }

  if (path === '/categorie.php' && params.id) {
    return `/categorie/${params.id}`;
  }

  // Par défaut, juste remplacer .php par rien
  return path.replace('.php', '');
}
