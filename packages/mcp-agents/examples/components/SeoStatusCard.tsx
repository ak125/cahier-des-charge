import { useFetcher } from '@remix-run/react';
import { useState } from 'react';
import type { SeoAuditResult } from '~/types/seo';

interface SeoStatusCardProps {
  seoData: SeoAuditResult;
  onRefresh?: () => void;
}

export function SeoStatusCard({ seoData, onRefresh }: SeoStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fetcher = useFetcher();

  // Calcul de la classe CSS pour le badge de score
  const getScoreClass = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Calcul de la classe CSS pour le badge de statut
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'migrated':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Fonction pour formater l'URL
  const formatUrl = (url: string) => {
    return url.length > 40 ? `${url.substring(0, 37)}...` : url;
  };

  // Lancer une correction automatique des problèmes SEO
  const handleFix = () => {
    fetcher.submit(
      {
        action: 'fix-seo-issues',
        url: seoData.url,
      },
      { method: 'post', action: '/admin/seo/fix' }
    );
  };

  // Re-vérifier la page
  const handleRecheck = () => {
    fetcher.submit(
      {
        action: 'recheck-seo',
        url: seoData.url,
      },
      { method: 'post', action: '/admin/seo/recheck' }
    );
  };

  // Marquer comme vérifié
  const handleVerify = () => {
    fetcher.submit(
      {
        action: 'verify-seo',
        url: seoData.url,
      },
      { method: 'post', action: '/admin/seo/verify' }
    );
  };

  // Créer une PR pour les corrections
  const handleCreatePR = () => {
    fetcher.submit(
      {
        action: 'create-pr',
        url: seoData.url,
      },
      { method: 'post', action: '/admin/seo/create-pr' }
    );
  };

  // Format de la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-dDoDogit',
      month: '2-dDoDogit',
      year: 'numeric',
      hour: '2-dDoDogit',
      minute: '2-dDoDogit',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* En-tête de la carte */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800 mr-2 truncate max-w-[300px]">
              {formatUrl(seoData.url)}
            </h3>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusClass(
                seoData.status
              )}`}
            >
              {seoData.status}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <div
              className={`text-base font-semibold px-3 py-1 rounded-md border ${getScoreClass(
                seoData.score
              )}`}
            >
              Score SEO: {seoData.score}/100
            </div>
            <button
              className="p-1.5 text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Réduire' : 'Développer'}
            >
              <svg
                className={`w-5 h-5 transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span title="Fichier source">📄 {seoData.sourceFile}</span>
            <span title="Fichier cible">🎯 {seoData.targetFile}</span>
            <span title="Date de migration">🕒 {formatDate(seoData.migrationDate)}</span>
          </div>
        </div>
      </div>

      {/* Contenu détaillé (affiché uniquement si expanded est true) */}
      {isExpanded && (
        <div className="p-4 bg-gray-50">
          {/* Métadonnées */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Métadonnées</h4>
            <div className="bg-white p-3 rounded border border-gray-200 text-sm overflow-auto max-h-48">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Titre:</span> {seoData.metadata.title}
                </div>
                <div>
                  <span className="font-medium">Description:</span> {seoData.metadata.description}
                </div>
                <div>
                  <span className="font-medium">Canonical:</span> {seoData.metadata.canonical}
                </div>
                <div>
                  <span className="font-medium">Robots:</span> {seoData.metadata.robots}
                </div>
              </div>
            </div>
          </div>

          {/* Problèmes */}
          {seoData.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Problèmes ({seoData.issues.length})
              </h4>
              <div className="bg-white p-3 rounded border border-red-200 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  {seoData.issues.map((issue, index) => (
                    <li key={index} className="text-red-600">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Redirections */}
          {seoData.redirects.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Redirections ({seoData.redirects.length})
              </h4>
              <div className="bg-white p-3 rounded border border-gray-200 text-sm overflow-auto max-h-48">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Source
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Cible
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {seoData.redirects.map((redirect, index) => (
                      <tr key={index}>
                        <td className="py-1 pr-4">{redirect.source}</td>
                        <td className="py-1 pr-4">{redirect.target}</td>
                        <td className="py-1">{redirect.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scores Lighthouse */}
          {seoData.lighthouseScore && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Scores Lighthouse</h4>
              <div className="grid grid-cols-4 gap-2">
                <div
                  className={`p-2 rounded text-center ${getScoreClass(
                    seoData.lighthouseScore.performance
                  )}`}
                >
                  <div className="text-lg font-bold">{seoData.lighthouseScore.performance}</div>
                  <div className="text-xs">Performance</div>
                </div>
                <div
                  className={`p-2 rounded text-center ${getScoreClass(
                    seoData.lighthouseScore.accessibility
                  )}`}
                >
                  <div className="text-lg font-bold">{seoData.lighthouseScore.accessibility}</div>
                  <div className="text-xs">Accessibilité</div>
                </div>
                <div
                  className={`p-2 rounded text-center ${getScoreClass(
                    seoData.lighthouseScore.bestPractices
                  )}`}
                >
                  <div className="text-lg font-bold">{seoData.lighthouseScore.bestPractices}</div>
                  <div className="text-xs">Meilleures pratiques</div>
                </div>
                <div
                  className={`p-2 rounded text-center ${getScoreClass(
                    seoData.lighthouseScore.seo
                  )}`}
                >
                  <div className="text-lg font-bold">{seoData.lighthouseScore.seo}</div>
                  <div className="text-xs">SEO</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 items-center justify-end">
            <button
              onClick={handleRecheck}
              disabled={fetcher.state !== 'idle'}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🔄 Re-vérifier
            </button>
            <button
              onClick={handleFix}
              disabled={fetcher.state !== 'idle' || seoData.issues.length === 0}
              className={`px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                seoData.issues.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              🛠️ Corriger auto
            </button>
            <button
              onClick={handleCreatePR}
              disabled={fetcher.state !== 'idle'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              📝 PR GitHub
            </button>
            <button
              onClick={handleVerify}
              disabled={
                fetcher.state !== 'idle' ||
                seoData.issues.length > 0 ||
                seoData.status === 'verified'
              }
              className={`px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                seoData.issues.length > 0 || seoData.status === 'verified'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              ✓ Valider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
