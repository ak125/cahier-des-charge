/**
 * Utilitaire pour gérer les URL canoniques dans l'application Remix
 * Intégré avec le pipeline de migration PHP -> Remix
 */

import canonicalConfig from ../config/seo-canonicals.jsonstructure-agent';
import type { Location } from @remix-run/reactstructure-agent';

interface CanonicalOptions {
  baseUrl?: string;
  forcePath?: string;
  includeQueryParams?: string[];
  excludeQueryParams?: boolean;
  forceHttps?: boolean;
}

/**
 * Génère une URL canonique à partir d'un slug ou d'une URL complète
 * 
 * @param pathOrSlug - Le chemin ou slug de la page
 * @param options - Options de personnalisation
 * @returns URL canonique complète
 */
export function generateCanonicalUrl(
  pathOrSlug: string,
  options: CanonicalOptions = {}
): string {
  // Utiliser les options ou les valeurs par défaut du fichier de configuration
  const baseUrl = options.baseUrl || canonicalConfig.baseUrl;
  const forceHttps = options.forceHttps ?? canonicalConfig.forceHttps;
  
  // Vérifier si le chemin est dans le mapping personnalisé
  if (canonicalConfig.customMapping && canonicalConfig.customMapping[pathOrSlug]) {
    const mappedPath = canonicalConfig.customMapping[pathOrSlug];
    return `${baseUrl}${mappedPath}`;
  }

  // Construire l'URL canonique
  let canonicalPath = options.forcePath || pathOrSlug;
  
  // Assurer que le chemin commence par /
  if (!canonicalPath.startsWith('/') && !canonicalPath.startsWith('http')) {
    canonicalPath = `/${canonicalPath}`;
  }
  
  // URL complète ou chemin relatif
  if (canonicalPath.startsWith('http')) {
    const url = new URL(canonicalPath);
    
    // Appliquer les options
    if (forceHttps) {
      url.protocol = 'https:';
    }
    
    if (canonicalConfig.forceWww && !url.hostname.startsWith('www.')) {
      url.hostname = `www.${url.hostname}`;
    }
    
    // Gérer les paramètres de requête
    if (options.excludeQueryParams || canonicalConfig.removeQueryParams) {
      return `${url.origin}${url.pathname}`;
    }
    
    return url.toString();
  }
  
  // Si c'est un chemin relatif, ajouter le baseUrl
  let finalUrl = `${baseUrl}${canonicalPath}`;
  
  // Supprimer le slash final si configuré
  if (canonicalConfig.stripTrailingSlash && finalUrl.endsWith('/') && finalUrl.length > 1) {
    finalUrl = finalUrl.slice(0, -1);
  }
  
  return finalUrl;
}

/**
 * Hook personnalisé pour obtenir l'URL canonique dans un composant
 * 
 * @param options - Options de personnalisation
 * @returns URL canonique
 */
export function useCanonicalUrl(
  forcePath?: string,
  options: Omit<CanonicalOptions, 'forcePath'> = {}
): string {
  // En environnement client, utiliser window.location
  if (typeof window !== 'undefined') {
    const currentPath = forcePath || window.location.pathname;
    const currentUrl = `${window.location.origin}${currentPath}`;
    return generateCanonicalUrl(currentUrl, { ...options, forcePath });
  }
  
  // En environnement serveur, utiliser juste le chemin fourni
  return generateCanonicalUrl(forcePath || '/', options);
}

/**
 * Fonction pour transformer les anciennes URLs PHP en nouvelles URLs Remix
 * pour la migration SEO
 * 
 * @param phpUrl - L'ancienne URL PHP (ex: /fiche.php?id=123)
 * @returns La nouvelle URL Remix canonique
 */
export function transformPhpToRemixUrl(phpUrl: string): string {
  // Vérifier d'abord si l'URL est dans le mapping personnalisé
  if (canonicalConfig.customMapping && canonicalConfig.customMapping[phpUrl]) {
    return canonicalConfig.customMapping[phpUrl];
  }
  
  // Sinon, essayer d'extraire des paramètres et appliquer une logique générique
  try {
    const url = new URL(phpUrl, canonicalConfig.baseUrl);
    const path = url.pathname;
    const params = Object.fromEntries(url.searchParams);
    
    // Logique spécifique à vos modèles d'URL PHP
    if (path === '/fiche.php' && params.id) {
      // Idéalement, vous auriez une fonction qui retrouve le slug à partir de l'ID
      // Pour l'exemple, on retourne un chemin générique
      return `/fiche/${params.id}`;
    }
    
    if (path === '/categorie.php' && params.id) {
      return `/categorie/${params.id}`;
    }
    
    // URL par défaut
    return phpUrl;
  } catch (error) {
    console.error(`Erreur lors de la transformation de l'URL PHP: ${phpUrl}`, error);
    return phpUrl;
  }
}

/**
 * Génère les métadonnées pour l'URL canonique
 * Utilisable directement dans la fonction meta ou links des routes Remix
 */
export function generateCanonicalMeta(url?: string, options: CanonicalOptions = {}): { rel: string; href: string } {
  const canonicalUrl = url 
    ? generateCanonicalUrl(url, options)
    : typeof window !== 'undefined' 
      ? generateCanonicalUrl(window.location.href, options)
      : '';
      
  return { rel: 'canonical', href: canonicalUrl };
}

/**
 * Synchronise les canonicals depuis un fichier .audit.md ou une source externe
 * 
 * @param source - Source des données (chemin du fichier ou table Supabase)
 * @returns Mapping des URLs canoniques
 */
export async function syncCanonicalMappings(source: string): Promise<Record<string, string>> {
  // Implémentation fictive - à adapter selon votre source de données
  // Pourrait lire un fichier .audit.md ou faire une requête à Supabase
  
  // Exemple fictif
  return {
    '/fiche.php?id=123': '/fiche/plaquettes-frein-bosch',
    '/categorie.php?id=10': '/categorie/freinage'
  };
}