import { Form, Link } from '@remix-run/react';
import { SEOHistoryGraph } from './SEOHistoryGraph';
import { SEOIssuesList } from './SEOIssuesList';
import { SEOPagesList } from './SEOPagesList';

interface SEODashboardProps {
  data: Array<{
    url: string;
    title: string;
    description: string;
    canonical: string;
    score: number;
    lastChecked: string;
    status: 'success' | 'warning' | 'error' | 'pending';
    issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
    }>;
    history?: Array<{
      date: string;
      score: number;
      event: string;
    }>;
  }>;
  activeTab: 'pages' | 'issues' | 'history';
  filters: {
    status: string;
    score: string;
    sort: string;
    dir: string;
  };
}

export function SEODashboard({ data, activeTab, filters }: SEODashboardProps) {
  // Récupérer tous les problèmes pour l'onglet des issues
  const allIssues = data.flatMap((item) =>
    item.issues.map((issue) => ({
      ...issue,
      url: item.url,
      title: item.title,
      score: item.score,
    }))
  );

  // Récupérer les données historiques pour le graphique
  const historyData = {
    dates: [] as string[],
    scores: [] as number[],
    events: [] as string[],
  };

  // Traiter les données d'historique pour le graphique (utiliser les 5 premières pages)
  data.slice(0, 5).forEach((item) => {
    if (item.history) {
      item.history.forEach((h) => {
        historyData.dates.push(h.date.split('T')[0]); // Formater la date
        historyData.scores.push(h.score);
        historyData.events.push(h.event);
      });
    }
  });

  return (
    <div className="mt-4">
      {activeTab === 'pages' && <SEOPagesList data={data} filters={filters} />}

      {activeTab === 'issues' && <SEOIssuesList issues={allIssues} />}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Évolution du score SEO</h2>
          <SEOHistoryGraph
            dates={historyData.dates}
            scores={historyData.scores}
            events={historyData.events}
          />

          <div className="mt-6">
            <h3 className="font-medium mb-2">Événements récents</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Événement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data
                    .flatMap(
                      (item) =>
                        item.history?.map((h, idx) => (
                          <tr key={`${item.url}-${idx}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(h.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {h.event}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  h.score >= 90
                                    ? 'bg-green-100 text-green-800'
                                    : h.score >= 70
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {h.score}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                              <Link to={`/admin/seo/page?url=${encodeURIComponent(item.url)}`}>
                                {item.url}
                              </Link>
                            </td>
                          </tr>
                        )) || []
                    )
                    .slice(0, 10)}{' '}
                  {/* Afficher les 10 derniers événements */}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <span className="text-sm text-gray-500">
          Dernière vérification SEO: {new Date().toLocaleDateString()}
        </span>
        <Form method="post" action="/api/seo/refresh">
          <button type="submit" className="text-sm text-blue-500 hover:text-blue-700">
            Actualiser les données
          </button>
        </Form>
      </div>
    </div>
  );
}
