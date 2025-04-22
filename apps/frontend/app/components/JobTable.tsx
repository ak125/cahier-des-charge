import { useState } from "react";
import { Link, useSearchParams, Form } from "@remix-run/react";
import { McpJob, McpJobStatus } from "~/lib/supabase.server";
import StatusBadge from "./StatusBadge";
import RetryButton from "./RetryButton";

interface JobTableProps {
  jobs: McpJob[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Tableau principal pour afficher les jobs MCP avec filtres et pagination
 */
export default function JobTable({ jobs, totalCount, currentPage, pageSize, totalPages }: JobTableProps) {
  const [searchParams] = useSearchParams();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Gestion de l'expansion des détails
  const toggleExpand = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
    }
  };

  // Construction des liens de pagination
  const buildPaginationLink = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/admin?${params.toString()}`;
  };

  // Formatage de la date pour l'affichage
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-dDoDoDoDotgit",
      month: "short",
      hour: "2-dDoDoDoDotgit",
      minute: "2-dDoDoDoDotgit"
    }).format(date);
  };

  // Rendu des détails étendus d'un job
  const renderExpandedDetails = (job: McpJob) => {
    return (
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700">Détails du fichier</h4>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Chemin d'origine:</span> {job.originalPath}
              </p>
              <p className="mt-1">
                <span className="font-medium">Chemin cible:</span> {job.targetPath}
              </p>
              <p className="mt-1">
                <span className="font-medium">Priorité:</span> {job.priority.toFixed(1)}
              </p>
              <p className="mt-1">
                <span className="font-medium">Créé le:</span> {formatDate(job.createdAt)}
              </p>
              <p className="mt-1">
                <span className="font-medium">Mis à jour le:</span> {formatDate(job.updatedAt)}
              </p>
              <p className="mt-1">
                <span className="font-medium">Dernière exécution:</span> {formatDate(job.lastRun)}
              </p>
            </div>
          </div>
          
          {job.status === "error" && job.errorDetails && (
            <div>
              <h4 className="font-medium text-sm text-red-700">Détails de l'erreur</h4>
              <pre className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 overflow-auto max-h-40">
                {job.errorDetails}
              </pre>
            </div>
          )}
          
          {job.logDetails && (
            <div className={`${job.status === "error" ? "col-span-2" : ""}`}>
              <h4 className="font-medium text-sm text-gray-700">Logs</h4>
              <pre className="mt-2 p-2 bg-gray-100 border border-gray-200 rounded text-xs text-gray-800 overflow-auto max-h-40">
                {job.logDetails}
              </pre>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <Link
            to={`/admin/job/${job.id}`}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Détails complets
          </Link>
          
          <div className="flex-1"></div>
          
          <div className="flex space-x-2">
            <RetryButton jobId={job.id} filename={job.filename} dryRun={true} />
            {job.status !== "running" && (
              <RetryButton jobId={job.id} filename={job.filename} />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-md">
      {/* Barre de filtrage */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 sm:px-6">
        <Form method="get" className="flex flex-wrap items-center gap-4">
          <div className="max-w-lg flex rounded-md">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.get("search") || ""}
              placeholder="Rechercher un fichier..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div className="max-w-xs">
            <select
              name="status"
              defaultValue={searchParams.get("status") || ""}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="running">En cours</option>
              <option value="done">Terminés</option>
              <option value="error">En erreur</option>
              <option value="ignored">Ignorés</option>
            </select>
          </div>
          
          <div className="max-w-xs">
            <select
              name="sortBy"
              defaultValue={searchParams.get("sortBy") || "priority"}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="priority">Trier par priorité</option>
              <option value="filename">Trier par nom de fichier</option>
              <option value="lastRun">Trier par dernière exécution</option>
              <option value="createdAt">Trier par date de création</option>
              <option value="updatedAt">Trier par date de mise à jour</option>
            </select>
          </div>
          
          <div>
            <select
              name="sortDirection"
              defaultValue={searchParams.get("sortDirection") || "desc"}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Filtrer
          </button>
          
          <Link
            to="/admin"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Réinitialiser
          </Link>
        </Form>
      </div>
      
      {/* Tableau des jobs */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fichier
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priorité
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière Analyse
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun job trouvé
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <React.Fragment key={job.id}>
                  <tr 
                    className={`${expandedJobId === job.id ? 'bg-gray-50' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => toggleExpand(job.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.priority >= 9 ? 'bg-red-100 text-red-800' : 
                        job.priority >= 7 ? 'bg-orange-100 text-orange-800' :
                        job.priority >= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.priority >= 9 ? '🔥' : job.priority >= 7 ? '🚨' : job.priority >= 5 ? '⚠️' : '📋'} {job.priority.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(job.lastRun)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/job/${job.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Voir
                        </Link>
                        {job.status === "error" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(job.id);
                            }}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Logs
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedJobId === job.id && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        {renderExpandedDetails(job)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> à{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>{" "}
                sur <span className="font-medium">{totalCount}</span> résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Link
                  to={buildPaginationLink(Math.max(1, currentPage - 1))}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                    currentPage === 1 ? "cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Précédent</span>
                  &laquo;
                </Link>
                
                {/* Première page */}
                {currentPage > 2 && (
                  <Link
                    to={buildPaginationLink(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </Link>
                )}
                
                {/* Ellipsis pour les pages précédentes */}
                {currentPage > 3 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                
                {/* Page précédente si ce n'est pas la première */}
                {currentPage > 1 && (
                  <Link
                    to={buildPaginationLink(currentPage - 1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {currentPage - 1}
                  </Link>
                )}
                
                {/* Page courante */}
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-indigo-50 text-sm font-medium text-indigo-600">
                  {currentPage}
                </span>
                
                {/* Page suivante si ce n'est pas la dernière */}
                {currentPage < totalPages && (
                  <Link
                    to={buildPaginationLink(currentPage + 1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {currentPage + 1}
                  </Link>
                )}
                
                {/* Ellipsis pour les pages suivantes */}
                {currentPage < totalPages - 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                
                {/* Dernière page */}
                {currentPage < totalPages - 1 && (
                  <Link
                    to={buildPaginationLink(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {totalPages}
                  </Link>
                )}
                
                <Link
                  to={buildPaginationLink(Math.min(totalPages, currentPage + 1))}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                    currentPage === totalPages ? "cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Suivant</span>
                  &raquo;
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}