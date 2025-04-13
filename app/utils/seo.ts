import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { createCanonicalMeta } from '~/utils/useCanonical';

/**
 * Configuration pour le générateur SEO
 */
interface SEOConfig {
  // URL de base du site
  baseUrl: string;
  // Titre par défaut du site
  defaultTitle: string;
  // Chemin vers le fichier de métadonnées SEO
  seoDataPath?: string;
  // Template pour le titre (où {title} sera remplacé)
  titleTemplate?: string;
  // Objets meta supplémentaires à ajouter
  additionalMeta?: Record<string, string>;
  // Utiliser Supabase pour les données SEO
  useSupabase?: boolean;
}

/**
 * Options pour la génération des balises meta
 */
interface SEOOptions {
  // Template de page (ex: 'fiche', 'categorie')
  template?: string;
  // Données spécifiques de la page
  data?: any;
  // URL canonique personnalisée
  canonical?: string;
  // Balises meta supplémentaires
  meta?: Array<Record<string, string>>;
}

// Configuration par défaut
const defaultSEOConfig: SEOConfig = {
  baseUrl: 'https://www.monsite.fr',
  defaultTitle: 'Mon Site',
  titleTemplate: '{title} | Mon Site',
  additionalMeta: {
    'twitter:card': 'summary_large_image',
    'og:type': 'website',
    'og:site_name': 'Mon Site'
  }
};

/**
 * Charge les données SEO depuis Supabase ou un fichier JSON
 */
export async function loadSEOData(slug: string, config: SEOConfig = defaultSEOConfig) {
  try {
    if (config.useSupabase) {
      // Charger depuis Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from('seo_metadata')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (!error && data) {
          return data;
        }
      }
    }
    
    // Fallback: charger depuis un fichier JSON
    if (config.seoDataPath) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.resolve(process.cwd(), config.seoDataPath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const seoData = JSON.parse(fileContent);
      
      return seoData[slug] || null;
    }
    
    return null;
  } catch (error) {
    console.warn(`Impossible de charger les données SEO pour ${slug}:`, error);
    return null;
  }
}

/**
 * Crée la fonction meta pour une route Remix avec support canonique
 */
export function createSEOMeta(options: SEOOptions = {}, config: SEOConfig = defaultSEOConfig): MetaFunction {
  return ({ data, params, location }) => {
    // Récupérer les données SEO si elles existent
    const seoData = data?.seo || {};
    
    // Variables pour stocker les métadonnées
    const title = seoData.title || options.data?.title || config.defaultTitle;
    const description = seoData.description || options.data?.description || '';
    const canonical = options.canonical || seoData.canonical || '';
    
    // Construire l'URL canonique si elle n'est pas fournie
    const canonicalUrl = canonical || `${config.baseUrl}${location.pathname}`;
    
    // Métadonnées de base
    const metaTags: Record<string, string>[] = [
      { title: config.titleTemplate ? config.titleTemplate.replace('{title}', title) : title },
      { name: 'description', content: description }
    ];
    
    // Ajouter la balise canonique
    metaTags.push(createCanonicalMeta(canonicalUrl));
    
    // Ajouter les balises Open Graph
    metaTags.push(
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl }
    );
    
    // Ajouter les métadonnées supplémentaires de la configuration
    if (config.additionalMeta) {
      Object.entries(config.additionalMeta).forEach(([key, value]) => {
        if (key.startsWith('og:') || key.startsWith('twitter:')) {
          metaTags.push({ property: key, content: value });
        } else {
          metaTags.push({ name: key, content: value });
        }
      });
    }
    
    // Ajouter les métadonnées personnalisées
    if (options.meta) {
      metaTags.push(...options.meta);
    }
    
    return metaTags;
  };
}

/**
 * Utilitaire complet pour générer les balises SEO (y compris canonique)
 */
export function generateSEO(options: SEOOptions = {}) {
  // Récupérer les données du loader si elles existent
  const data = useLoaderData();
  
  // Configuration adaptée au template
  let config = { ...defaultSEOConfig };
  
  // Adapter la configuration selon le template
  if (options.template) {
    switch (options.template) {
      case 'fiche':
        config.titleTemplate = '{title} | Fiche Produit | Mon Site';
        break;
      case 'categorie':
        config.titleTemplate = '{title} | Catégorie | Mon Site';
        break;
      // Autres templates...
    }
  }
  
  // Créer les méta-balises
  const meta = createSEOMeta(options, config)({ data, params: {}, location: { pathname: window.location.pathname } });
  
  return meta;
}

/**
 * Génère un loader qui charge automatiquement les données SEO
 */
export function createSEOLoader(loaderFn: (args: LoaderFunctionArgs) => Promise<any>) {
  return async (args: LoaderFunctionArgs) => {
    // Exécuter le loader original
    const result = await loaderFn(args);
    
    // Si le résultat est un objet Response, on ne peut pas y ajouter de données
    if (result instanceof Response) {
      return result;
    }
    
    // Déterminer le slug à utiliser pour les données SEO
    const slug = args.params.slug || args.params.id || args.request.url.split('/').pop()?.split('?')[0] || '';
    
    // Charger les données SEO
    const seoData = await loadSEOData(slug);
    
    // Ajouter les données SEO au résultat
    return {
      ...result,
      seo: seoData
    };
  };
}