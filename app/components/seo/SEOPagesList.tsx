import { Link } from "@remix-run/react";

interface SEOPagesListProps {
  data: Array<{
    url: string;
    title: string;
    description: string;
    canonical: string;
    score: number;
    lastChecked: string;
    status: "success" | "warning" | "error" | "pending";
    issues: Array<{
      type: string;
      severity: "error" | "warning" | "info";
      message: string;
    }>;
  }>;
  filters: {
    status: string;
    score: string;
    sort: string;
    dir: string;
  };
}

export function SEOPagesList({ data, filters }: SEOPagesListProps) {
  // Obtenir le nombre total de pages
  const totalPages = data.length;

  return (
    <div>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                URL
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Score SEO
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Statut
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Problèmes
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Dernière vérification
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-center text-gray-500">
                  Aucune page trouvée avec les filtres actuels
                </td>
              </tr>
            ) : (
              data.map((page) => (
                <tr key={page.url} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <Link to={`/admin/seo/page?url=${encodeURIComponent(page.url)}`} className="text-blue-500 hover:text-blue-700">
                      {page.url}
                    </Link>
                    <p className="text-xs text-gray-500 truncate max-w-xs" title={page.title}>
                      {page.title || <span className="italic text-red-500">Titre manquant</span>}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getScoreColorClass(page.score)}`}>
                        {page.score}%
                      </span>
                      <div className="ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getScoreBgColorClass(page.score)}`}
                          style={{ width: `${Math.min(100, page.score)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColorClass(page.status)}`}>
                      {getStatusLabel(page.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {page.issues.length === 0 ? (
                      <span className="text-green-500">Aucun</span>
                    ) : (
                      <div>
                        <span className="font-medium">{page.issues.length}</span>
                        <span className="ml-1 text-xs">
                          ({page.issues.filter(i => i.severity === "error").length} critique{page.issues.filter(i => i.severity === "error").length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(page.lastChecked).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-dDoDoDoDotgit',
                      minute: '2-dDoDoDoDotgit'
                    })}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex space-x-2 justify-end">
                      <Link
                        to={`/admin/seo/analyze?url=${encodeURIComponent(page.url)}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Analyser
                      </Link>
                      <button
                        onClick={() => runPageAudit(page.url)}
                        className="text-indigo-500 hover:text-indigo-700"
                      >
                        Audit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Affichage de <span className="font-medium">{data.length}</span> page{data.length !== 1 ? 's' : ''} sur{' '}
          <span className="font-medium">{totalPages}</span> au total
        </p>
        {/* Ici, vous pourriez ajouter une pagination si nécessaire */}
      </div>
    </div>
  );
}

function getScoreColorClass(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function getScoreBgColorClass(score: number): string {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  return "bg-red-500";
}

function getStatusColorClass(status: string): string {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "success":
      return "Optimisé";
    case "warning":
      return "Avertissements";
    case "error":
      return "Problèmes";
    case "pending":
      return "En attente";
    default:
      return "Inconnu";
  }
}

// Fonction pour lancer un audit SEO sur une page spécifique
async function runPageAudit(url: string) {
  try {
    const response = await fetch('/api/seo/audit/page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (response.ok) {
      alert(`Audit démarré pour ${url}. Les résultats seront disponibles dans quelques instants.`);
    } else {
      alert(`Erreur lors du lancement de l'audit pour ${url}.`);
    }
  } catch (error) {
    console.error('Erreur lors de la demande d\'audit:', error);
    alert('Une erreur est survenue lors de la demande d\'audit.');
  }
}