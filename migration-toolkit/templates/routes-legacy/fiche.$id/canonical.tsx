import { useParams, useLocation } from "@remix-run/react";
import { generateCanonicalUrl } from "~/utils/seo";

/**
 * Composant pour générer les URLs canoniques pour la page fiche
 * Assure la cohérence SEO et gère les problèmes de contenu dupliqué
 */

export function CanonicalUrl() {
  const params = useParams();
  const location = useLocation();
  
  // Construction de l'URL canonique
  const baseUrl = `https://${window.location.hostname}`;
  const path = `/fiche/${params.id}`;
  
  // Génération de l'URL canonique complète
  const canonicalUrl = generateCanonicalUrl(baseUrl, path);
  
  return (
    <link rel="canonical" href={canonicalUrl} />
  );
}