/**
 * Route Remix pour gérer toutes les anciennes routes PHP
 * DoDoDoDotgit comme un filet de sécurité et permet de gérer les anciennes URLs 
 * qui n'ont pas été explicitement mappées
 */

import { json, LoaderFunctionArgs } from @remix-run/nodestructure-agent";
import { useLoaderData, Link, MetaFunction } from @remix-run/reactstructure-agent";
import { useEffect, useState } from reactstructure-agent";

/**
 * Configuration des routes héritées
 */
interface LegacyRoutesConfig {
  redirects: Record<string, { to: string, status: number }>;
  gone: string[];
  mapping: Record<string, string>;
  isLoaded: boolean;
}

// Fonction loader qui gère les anciennes routes
export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const path = url.pathname;
  const searchParams = Object.fromEntries(url.searchParams.entries());

  // Tenter de charger la configuration depuis le serveur
  let config: LegacyRoutesConfig = {
    redirects: {},
    gone: [],
    mapping: {},
    isLoaded: false
  };

  try {
    // Dans un environnement de production, ces fichiers seraient chargés de manière plus efficace
    // Par exemple, en étant injectés lors de la construction ou via un service dédié
    const redirectsPath = "../../reports/redirects.json";
    const gonePath = "../../reports/deleted_routes.json";
    const mappingPath = "../../reports/legacy_route_map.json";

    // En utilisant dynamic import pour éviter les erreurs lors du build
    const redirectsModule = await import(redirectsPath).catch(() => ({ default: {} }));
    const goneModule = await import(gonePath).catch(() => ({ default: [] }));
    const mappingModule = await import(mappingPath).catch(() => ({ default: {} }));

    config = {
      redirects: redirectsModule.default,
      gone: goneModule.default,
      mapping: mappingModule.default,
      isLoaded: true
    };
  } catch (error) {
    console.error("Erreur lors du chargement des configurations de routes:", error);
  }

  // Vérifier si la route est dans les redirections
  if (config.isLoaded && config.redirects[path]) {
    const { to, status } = config.redirects[path];
    return new Response("", {
      status,
      headers: {
        Location: to
      }
    });
  }

  // Vérifier si la route est dans les pages supprimées
  if (config.isLoaded && config.gone.includes(path)) {
    throw new Response("Cette ressource n'existe plus", { status: 410 });
  }

  // Vérifier si c'est une ancienne URL PHP à mapper
  if (path.endsWith('.php') && config.isLoaded) {
    const basePath = path.split('?')[0];
    
    if (config.mapping[basePath]) {
      const targetPath = config.mapping[basePath];
      
      // Traitement spécial pour certaines routes
      if (basePath === '/fiche.php' && searchParams.id) {
        return new Response("", {
          status: 301,
          headers: {
            Location: `${targetPath}/${searchParams.id}`
          }
        });
      }
      
      if (basePath === '/categorie.php' && searchParams.id) {
        return new Response("", {
          status: 301,
          headers: {
            Location: `${targetPath}/${searchParams.id}`
          }
        });
      }
      
      if (basePath === '/search.php' && searchParams.q) {
        return new Response("", {
          status: 301,
          headers: {
            Location: `${targetPath}?q=${searchParams.q}`
          }
        });
      }
      
      // Redirection simple pour les autres cas
      return new Response("", {
        status: 301,
        headers: {
          Location: targetPath
        }
      });
    }
  }

  // Si nous arrivons ici, c'est une route inconnue
  return json({
    path,
    searchParams,
    message: "Cette page n'a pas été trouvée ou a été déplacée",
    isPhp: path.endsWith('.php'),
    referrer: request.headers.get("referer") || undefined
  });
}

// Métadonnées de la page
export const meta: MetaFunction = () => {
  return [
    { title: "Page non trouvée | Migration PHP" },
    { name: "robots", content: "noindex, nofollow" }
  ];
};

// Composant pour afficher une page d'erreur personnalisée
export default function LegacyPhpPage() {
  const data = useLoaderData<typeof loader>();
  const [submitted, setSubmitted] = useState(false);
  
  // Signaler la route manquante à l'API pour analyse
  useEffect(() => {
    if (!submitted && data.path.endsWith('.php')) {
      fetch('/api/legacy-routes/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: data.path,
          params: data.searchParams,
          referrer: data.referrer
        })
      }).then(() => setSubmitted(true))
        .catch(err => console.error("Erreur lors du signalement de la route:", err));
    }
  }, [data, submitted]);

  return (
    <div className="legacy-page-container">
      <div className="legacy-page-content">
        <h1>Page non trouvée</h1>
        
        <div className="legacy-page-message">
          <p>La page que vous recherchez n'est plus disponible ou a été déplacée vers une nouvelle adresse.</p>
          
          {data.isPhp && (
            <div className="legacy-php-notice">
              <h2>Migration en cours</h2>
              <p>Notre site est en cours de migration depuis notre ancienne plateforme PHP.</p>
              <p>L'URL <code>{data.path}</code> n'est plus active.</p>
            </div>
          )}
          
          <div className="legacy-page-actions">
            <Link to="/" className="primary-button">
              Retour à l'accueil
            </Link>
            
            <Link to="/recherche" className="secondary-button">
              Rechercher sur le site
            </Link>
          </div>
        </div>
        
        <div className="legacy-page-help">
          <h3>Besoin d'aide?</h3>
          <p>Si vous pensez qu'il s'DoDoDoDotgit d'une erreur ou si vous cherchez un contenu spécifique, n'hésitez pas à nous contacter.</p>
          <Link to="/contact" className="contact-link">
            Contactez-nous
          </Link>
        </div>
      </div>
    </div>
  );
}

// Gestion des erreurs pour afficher une page 410 Gone personnalisée
export function ErrorBoundary({ error }: { error: Error }) {
  const isGone = error instanceof Response && error.status === 410;
  
  return (
    <div className="legacy-page-container">
      <div className="legacy-page-content">
        <h1>{isGone ? "Ressource supprimée" : "Erreur"}</h1>
        
        <div className="legacy-page-message">
          {isGone ? (
            <>
              <p>Cette ressource a été définitivement supprimée et n'est plus disponible.</p>
              <p>Veuillez mettre à jour vos liens ou favoris.</p>
            </>
          ) : (
            <p>Une erreur s'est produite lors du traitement de votre demande.</p>
          )}
          
          <div className="legacy-page-actions">
            <Link to="/" className="primary-button">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}