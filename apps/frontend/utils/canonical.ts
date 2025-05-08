import { useLocation, useMatches } from '@remix-run/react';
import type { MetaDescriptor } from '@remix-run/react';
import { z } from 'zod';

/**
 * Configuration des URL canoniques
 */
export const CanonicalConfigSchema = z.object({
  baseUrl: z.string().url(),
  stripTrailingSlash: z.boolean().default(true),
  forceHttps: z.boolean().default(true),
  forceWww: z.boolean().default(false),
  removeQueryParams: z.boolean().default(true),
  allowedQueryParams: z.array(z.string()).default([]),
  customMapping: z.record(z.string(), z.string()).optional(),
});

export type CanonicalConfig = z.infer<typeof CanonicalConfigSchema>;

/**
 * Configuration par défaut
 */
const defaultConfig: CanonicalConfig = {
  baseUrl: 'https://www.monsite.fr',
  stripTrailingSlash: true,
  forceHttps: true,
  forceWww: true,
  removeQueryParams: true,
  allowedQueryParams: ['id', 'ref', 'slug'],
  customMapping: {},
};

let canonicalCache: Record<string, string> = {};

/**
 * Charge les mappings canoniques depuis Supabase ou un fichier JSON
 */
export async function loadCanonicalMappings(): Promise<Record<string, string>> {
  try {
    // Essayer de charger depuis Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('seo_canonicals')
        .select('source_url, canonical_url');

      if (!error && data) {
        return data.reduce(
          (acc, item) => {
            acc[item.source_url] = item.canonical_url;
            return acc;
          },
          {} as Record<string, string>
        );
      }
    }

    // Fallback: charger depuis un fichier JSON
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.resolve(process.cwd(), 'app/config/seo-canonicals.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.warn('Impossible de charger les mappings canoniques:', error);
    return {};
  }
}

/**
 * Initialise le cache des URL canoniques
 */
export async function initCanonicalCache(): Promise<void> {
  canonicalCache = await loadCanonicalMappings();
}

/**
 * Génère une URL canonique à partir d'une URL relative ou absolue
 */
export function generateCanonical(
  path: string,
  configOverride: Partial<CanonicalConfig> = {}
): string {
  const config = { ...defaultConfig, ...configOverride };

  // Vérifier le cache pour les mappings personnalisés
  if (canonicalCache[path]) {
    return canonicalCache[path];
  }

  // Ne pas modifier les URL externes
  if (path.startsWith('http') && !path.includes(new URL(config.baseUrl).hostname)) {
    return path;
  }

  // Vérifier les mappings personnalisés dans la config
  if (config.customMapping?.[path]) {
    return generateCanonical(config.customMapping[path], config);
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

      url.search = newParams.toString();
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
 * Hook pour utiliser les URL canoniques dans les composants
 */
export function useCanonical(
  customPath?: string,
  configOverride: Partial<CanonicalConfig> = {}
): string {
  const location = useLocation();
  const matches = useMatches();
  const currentRoute = matches[matches.length - 1];

  // Priorité : 1. URL personnalisée fournie, 2. Route data, 3. URL actuelle
  const pathToUse =
    customPath || (currentRoute.data?.canonical as string) || location.pathname + location.search;

  return generateCanonical(pathToUse, configOverride);
}

/**
 * Fonction utilitaire pour convertir les anciennes URL PHP en URL Remix
 */
export function mapPhpUrlToRemix(phpUrl: string): string {
  // Conversions courantes d'URL
  const urlMap: Record<string, string> = {
    '/fiche.php': '/fiche',
    '/categorie.php': '/categorie',
    '/marque.php': '/marque',
    '/recherche.php': '/recherche',
    '/panier.php': '/cart',
    '/mon-compte.php': '/account',
    '/catalogue.php': '/catalog',
  };

  try {
    // Extraire le chemin et les paramètres
    const url = new URL(phpUrl, 'https://placeholder.com');
    const path = url.pathname;
    const params = url.searchParams;

    // Vérifier si nous avons un mapping pour ce chemin
    if (urlMap[path]) {
      const newBasePath = urlMap[path];

      // Gérer les cas courants
      if (path === '/fiche.php' && params.has('id')) {
        const id = params.get('id');
        const slug = params.get('slug') || id;
        return `${newBasePath}/${slug}`;
      }

      if (path === '/categorie.php' && params.has('id')) {
        const id = params.get('id');
        const slug = params.get('slug') || id;
        return `${newBasePath}/${slug}`;
      }

      if (path === '/marque.php' && params.has('id')) {
        const id = params.get('id');
        const slug = params.get('slug') || id;
        return `${newBasePath}/${slug}`;
      }

      if (path === '/recherche.php') {
        const q = params.get('q');
        return q ? `${newBasePath}?q=${encodeURIComponent(q)}` : newBasePath;
      }

      // Fallback: utiliser simplement le nouveau chemin de base
      return newBasePath;
    }

    // Si pas de mapping connu, conserver le chemin original
    return phpUrl;
  } catch (error) {
    console.error(`Erreur lors de la conversion de l'URL PHP '${phpUrl}':`, error);
    return phpUrl;
  }
}

/**
 * Nettoie une URL pour générer une URL canonique
 */
export function cleanCanonicalUrl(url: string | URL, config: CanonicalConfig): string {
  // Convertir l'entrée en objet URL
  const urlObj = typeof url === 'string' ? new URL(url, config.baseUrl) : url;

  // Appliquer les règles de nettoyage
  const cleanUrl = new URL(urlObj.toString());

  // Forcer HTTPS
  if (config.forceHttps) {
    cleanUrl.protocol = 'https:';
  }

  // Forcer www
  if (config.forceWww && !cleanUrl.hostname.startsWith('www.')) {
    cleanUrl.hostname = `www.${cleanUrl.hostname}`;
  }

  // Vérifier si une redirection personnalisée est définie
  const pathWithParams = urlObj.pathname + urlObj.search;
  if (config.customMapping[pathWithParams]) {
    cleanUrl.pathname = config.customMapping[pathWithParams];
    cleanUrl.search = '';
  } else if (config.customMapping[urlObj.pathname]) {
    cleanUrl.pathname = config.customMapping[urlObj.pathname];
  } else {
    // Supprimer les paramètres de requête sauf ceux qui sont autorisés
    if (config.removeQueryParams && urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const allowedParams = new URLSearchParams();

      params.forEach((value, key) => {
        if (config.allowedQueryParams.includes(key)) {
          allowedParams.append(key, value);
        }
      });

      cleanUrl.search = allowedParams.toString() ? `?${allowedParams.toString()}` : '';
    }
  }

  // Supprimer le slash final si nécessaire
  if (config.stripTrailingSlash && cleanUrl.pathname.endsWith('/') && cleanUrl.pathname !== '/') {
    cleanUrl.pathname = cleanUrl.pathname.slice(0, -1);
  }

  return cleanUrl.toString();
}

/**
 * S'assure qu'il y a une balise canonique dans les métadonnées
 */
export function ensureCanonical(
  metadata: MetaDescriptor[],
  path: string,
  baseUrl = 'https://www.monsite.fr'
): MetaDescriptor[] {
  // Vérifier si une balise canonique existe déjà
  const hasCanonical = metadata.some((meta) => 'rel' in meta && meta.rel === 'canonical');

  if (hasCanonical) {
    return metadata;
  }

  // Créer une URL complète à partir du chemin
  let url = path;
  if (!url.startsWith('http')) {
    // S'assurer que le chemin commence par un slash
    if (!url.startsWith('/')) {
      url = `/${url}`;
    }
    url = `${baseUrl}${url}`;
  }

  // Ajouter la balise canonique
  return [...metadata, { rel: 'canonical', href: url }];
}

/**
 * Hook utilitaire pour obtenir l'URL canonique
 */
export function getCanonicalUrl(path: string, config: CanonicalConfig): string {
  // Construire l'URL complète
  const fullUrl = path.startsWith('http')
    ? path
    : `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // Nettoyer et retourner l'URL canonique
  return cleanCanonicalUrl(fullUrl, config);
}

/**
 * Récupère les balises canoniques depuis le cache SEO
 */
export async function getCanonicalFromCache(
  slug: string,
  fallbackUrl: string,
  cachePath = '/workspaces/cahier-des-charge/app/config/seo-metadata.json'
): Promise<string> {
  try {
    // Importer dynamiquement le cache SEO
    const seoCache = await import(cachePath);
    return seoCache[slug]?.canonical || fallbackUrl;
  } catch (error) {
    console.error('Erreur lors du chargement du cache SEO:', error);
    return fallbackUrl;
  }
}

/**
 * Types et fonctions pour la gestion des URL canoniques dans l'application
 */

export interface CanonicalConfigType {
  // URL de base du site (avec protocole)
  baseUrl: string;

  // Retirer le "/" final des URLs
  stripTrailingSlash: boolean;

  // Forcer le protocole HTTPS
  forceHttps: boolean;

  // Forcer l'utilisation du www
  forceWww: boolean;

  // Supprimer tous les paramètres de requête
  removeQueryParams: boolean;

  // Paramètres de requête à conserver (ex: UTM)
  allowedQueryParams: string[];

  // Mapping personnalisé d'URL (ex: anciennes URL -> nouvelles URL)
  customMapping: Record<string, string>;
}

/**
 * Convertit une URL relative ou absolue en URL canonique selon la configuration
 */
export function getCanonicalUrl(url: string, config: CanonicalConfigType): string {
  // Vérifier si l'URL est dans le mapping personnalisé
  if (url in config.customMapping) {
    return getCanonicalUrl(config.customMapping[url], config);
  }

  // Gestion des URLs relatives vs absolues
  let fullUrl: URL;
  try {
    // Si l'URL est déjà absolue
    fullUrl = new URL(url);
  } catch {
    // Si l'URL est relative, la combiner avec l'URL de base
    fullUrl = new URL(url, config.baseUrl);
  }

  // Appliquer les transformations selon la configuration
  if (config.forceHttps) {
    fullUrl.protocol = 'https:';
  }

  if (config.forceWww && fullUrl.hostname.split('.').length >= 2) {
    const parts = fullUrl.hostname.split('.');
    if (parts[0] !== 'www') {
      fullUrl.hostname = `www.${fullUrl.hostname}`;
    }
  }

  // Gestion des paramètres de requête
  if (config.removeQueryParams && fullUrl.search) {
    if (config.allowedQueryParams.length > 0) {
      // Conserver uniquement les paramètres autorisés
      const params = new URLSearchParams(fullUrl.search);
      const newParams = new URLSearchParams();

      for (const param of config.allowedQueryParams) {
        if (params.has(param)) {
          newParams.set(param, params.get(param)!);
        }
      }

      fullUrl.search = newParams.toString().length > 0 ? `?${newParams.toString()}` : '';
    } else {
      // Supprimer tous les paramètres
      fullUrl.search = '';
    }
  }

  // Gestion du slash final
  let urlString = fullUrl.toString();
  if (config.stripTrailingSlash && urlString.endsWith('/') && fullUrl.pathname !== '/') {
    urlString = urlString.slice(0, -1);
  }

  return urlString;
}

/**
 * Charge le mapping d'URL personnalisé depuis une source externe
 * (fichier JSON, API, Supabase, etc.)
 */
export async function loadCanonicalMapping(): Promise<Record<string, string>> {
  try {
    // Exemple d'implémentation - à adapter selon votre source de données
    // const response = await fetch('/api/canonical-mapping');
    // return await response.json();

    // Pour l'instant, retourner un mapping statique d'exemple
    return {
      '/fiche.php?id=123': '/fiche/plaquettes-frein-bosch',
      '/produit.php?ref=AB123': '/produit/filtre-huile-ab123',
      // Ajouter d'autres mappings au besoin
    };
  } catch (error) {
    console.error('Erreur lors du chargement du mapping canonique', error);
    return {};
  }
}

/**
 * Version synchrone pour les contextes où l'async n'est pas possible
 */
export function getStaticCanonicalMapping(): Record<string, string> {
  return {
    '/fiche.php?id=123': '/fiche/plaquettes-frein-bosch',
    '/produit.php?ref=AB123': '/produit/filtre-huile-ab123',
    // Ajouter d'autres mappings au besoin
  };
}

/**
 * Utilitaires pour gérer les URLs canoniques
 */

// URL de base du site (à configurer selon votre environnement)
const BASE_URL = process.env.CANONICAL_BASE_URL || 'https://votre-site.fr';

/**
 * Génère une URL canonique complète à partir d'un chemin relatif
 * @param path Chemin relatif (commençant par /)
 * @returns URL canonique complète
 */
export function getCanonicalUrl(path: string): string {
  // S'assurer que le chemin commence par un slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${BASE_URL}${normalizedPath}`;
}

/**
 * Vérifie si une URL est une URL legacy (avec .php)
 * @param url URL à vérifier
 * @returns true si c'est une URL legacy
 */
export function isLegacyUrl(url: string): boolean {
  return url.includes('.php');
}

/**
 * Extrait les paramètres importants d'une URL legacy
 * @param url URL legacy à analyser
 * @returns Objet contenant les paramètres importants
 */
export function extractLegacyParams(url: string): Record<string, string> {
  try {
    // Ajouter un domaine factice si l'URL ne commence pas par http(s)
    const fullUrl = url.startsWith('http') ? url : `http://example.com${url}`;
    const parsedUrl = new URL(fullUrl);

    const params: Record<string, string> = {};

    // Extraire tous les paramètres de l'URL
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      params[key] = value;
    }

    return params;
  } catch (error) {
    console.error(`Erreur lors de l'analyse de l'URL legacy: ${error}`);
    return {};
  }
}

/**
 * Classe pour travailler avec des paires d'URLs (legacy et moderne)
 */
export class UrlPair {
  legacyUrl: string;
  modernUrl: string;

  constructor(legacyUrl: string, modernUrl: string) {
    this.legacyUrl = legacyUrl;
    this.modernUrl = modernUrl;
  }

  /**
   * Obtient l'URL à utiliser comme canonical
   * Dans notre architecture, nous voulons utiliser l'URL legacy comme canonical
   */
  getCanonical(): string {
    return getCanonicalUrl(this.legacyUrl);
  }
}
