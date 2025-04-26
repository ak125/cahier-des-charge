import { useState } from reactstructure-agent';
import { json, type LoaderFunctionArgs } from @remix-run/nodestructure-agent';
import { useLoaderData, useNavigation, useSubmit } from @remix-run/reactstructure-agent';
import { SEOStatsOverview } from ~/components/seo/SEOStatsOverviewstructure-agent';
import { SEOIssuesList } from ~/components/seo/SEOIssuesListstructure-agent';
import { SEOHistoryGraph } from ~/components/seo/SEOHistoryGraphstructure-agent';
import { requireUserRole } from ~/utils/auth.serverstructure-agent';

export async function loader({ request }: LoaderFunctionArgs) {
  // Vérifier que l'utilisateur est authentifié et a les droits
  const user = await requireUserRole(request, ['ADMIN', 'EDITOR']);
  
  // Récupérer les données du backend
  const API_URL = process.env.API_URL || 'http://localhost:3001';
  
  const [stats, issues, historyData] = await Promise.all([
    fetch(`${API_URL}/api/seo/stats`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    }).then(res => res.json()),
    
    fetch(`${API_URL}/api/seo/issues?severity=all&limit=20`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    }).then(res => res.json()),
    
    fetch(`${API_URL}/api/seo/history?limit=30`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    }).then(res => res.json()),
  ]);
  
  // Formater les données d'historique pour notre graphique
  const dates = [];
  const scores = [];
  const events = [];
  
  for (const entry of historyData) {
    dates.push(entry.date);
    scores.push(entry.score);
    events.push(entry.event && entry.event.includes('Premier audit') ? 'Audit initial' : '');
  }
  
  return json({
    stats,
    issues: issues.issues || [],
    historyData: {
      dates,
      scores,
      events,
    },
  });
}

export default function SEODashboardPage() {
  const { stats, issues, historyData } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [isAuditRunning, setIsAuditRunning] = useState(false);
  
  const startAudit = async () => {
    setIsAuditRunning(true);
    submit(null, { method: 'post', action: '/admin/seo/audit-start' });
  };
  
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord SEO</h1>
          <p className="mt-1 text-sm text-gray-600">
            Suivez et optimisez votre référencement naturel
          </p>
        </div>
        
        <div>
          <button
            type="button"
            onClick={startAudit}
            disabled={isAuditRunning || navigation.state === 'submitting'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isAuditRunning || navigation.state === 'submitting' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Audit en cours...
              </>
            ) : (
              'Lancer un audit complet'
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <SEOStatsOverview stats={stats} />
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Tendances SEO</h2>
            <p className="mt-1 text-sm text-gray-500">Evolution du score SEO sur la période</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <SEOHistoryGraph 
              dates={historyData.dates} 
              scores={historyData.scores} 
              events={historyData.events} 
            />
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Problèmes SEO à résoudre</h2>
            <p className="mt-1 text-sm text-gray-500">Les problèmes les plus critiques d'abord</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <SEOIssuesList issues={issues} />
          </div>
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 text-right">
            <a href="/admin/seo/issues" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Voir tous les problèmes <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Pages les plus consultées</h2>
            <p className="mt-1 text-sm text-gray-500">Performances SEO des pages principales</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {/* Ici, on intégrerait le composant SEOPagesList */}
            <div className="text-center py-4 text-gray-500">
              <p>Chargement des pages...</p>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 text-right">
            <a href="/admin/seo/pages" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Voir toutes les pages <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Actions SEO</h2>
            <p className="mt-1 text-sm text-gray-500">Outils et actions rapides</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <nav className="space-y-3" aria-label="Actions SEO">
              <a 
                href="/admin/seo/redirects"
                className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Gérer les redirections</p>
                  <p className="text-xs text-gray-500">Configurer les redirections 301/302</p>
                </div>
              </a>
              
              <a 
                href="/admin/seo/sitemap"
                className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Plan du site</p>
                  <p className="text-xs text-gray-500">Générer et gérer votre sitemap</p>
                </div>
              </a>
              
              <a 
                href="/admin/seo/structured-data"
                className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0-4.5l-5.571 3-5.571-3" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Données structurées</p>
                  <p className="text-xs text-gray-500">Améliorer vos rich snippets</p>
                </div>
              </a>
              
              <a 
                href="/admin/seo/reports"
                className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Rapports SEO</p>
                  <p className="text-xs text-gray-500">Télécharger des rapports complets</p>
                </div>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}