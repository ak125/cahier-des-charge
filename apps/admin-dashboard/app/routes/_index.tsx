import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { useState } from 'react';
import MigrationStatusCard from '~/components/MigrationStatusCard';
import ProgressBar from '~/components/ProgressBar';
import AgentStatusList from '~/components/AgentStatusList';
import { MigrationStats, QAScores } from '~/types';

export const loader = async () => {
  // Dans une implémentation réelle, vous chargeriez ces données depuis votre API ou BDD
  const stats: MigrationStats = {
    total: 120,
    completed: 45,
    inProgress: 12,
    pending: 58,
    failed: 5,
    lastUpdated: new Date().toISOString()
  };

  const qaScores: QAScores = {
    overall: 87,
    requiredFields: 92,
    validationRules: 85,
    dataConsistency: 78,
    uiComponents: 91
  };

  // Liste des agents et leur statut
  const agents = [
    { name: 'php-analyzer', status: 'ready', lastRun: '2025-04-15T14:30:00Z', jobsCompleted: 45 },
    { name: 'remix-generator', status: 'ready', lastRun: '2025-04-15T15:45:00Z', jobsCompleted: 45 },
    { name: 'seo-checker', status: 'busy', lastRun: '2025-04-15T16:10:00Z', jobsCompleted: 40 },
    { name: 'sql-mapper', status: 'ready', lastRun: '2025-04-14T11:20:00Z', jobsCompleted: 15 },
    { name: 'htaccess-router', status: 'ready', lastRun: '2025-04-13T09:15:00Z', jobsCompleted: 30 },
    { name: 'qa-analyzer', status: 'error', lastRun: '2025-04-16T08:05:00Z', jobsCompleted: 42, error: 'Timeout lors de l\'analyse du formulaire de contact' },
    { name: 'status-tracker', status: 'ready', lastRun: '2025-04-16T10:00:00Z', jobsCompleted: 120 },
    { name: 'migration-orchestrator', status: 'ready', lastRun: '2025-04-16T10:00:00Z', jobsCompleted: 45 },
  ];

  // Dernières migrations
  const recentMigrations = [
    { id: 'MIG-045', name: 'Page Profil', status: 'completed', route: '/profil', completedAt: '2025-04-16T09:45:00Z', qaScore: 95, seoScore: 92 },
    { id: 'MIG-044', name: 'Page Contact', status: 'completed', route: '/contact', completedAt: '2025-04-15T16:30:00Z', qaScore: 88, seoScore: 90 },
    { id: 'MIG-043', name: 'Page FAQ', status: 'failed', route: '/faq', completedAt: '2025-04-15T14:15:00Z', qaScore: 62, seoScore: 45, error: 'Échec de la validation QA' },
    { id: 'MIG-042', name: 'Page Produits', status: 'in_progress', route: '/produits', startedAt: '2025-04-16T10:10:00Z' },
    { id: 'MIG-041', name: 'Page Services', status: 'completed', route: '/services', completedAt: '2025-04-14T17:25:00Z', qaScore: 97, seoScore: 94 },
  ];

  return json({ stats, qaScores, agents, recentMigrations });
};

export default function Dashboard() {
  const { stats, qaScores, agents, recentMigrations } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">MCP Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-white">Migration PHP → Remix</span>
            <span className="px-3 py-1 text-sm rounded-full bg-indigo-800 text-white">
              v1.2.0
            </span>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Vue d'ensemble
                </button>
                <button
                  onClick={() => setActiveTab('migrations')}
                  className={`${
                    activeTab === 'migrations'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Migrations
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className={`${
                    activeTab === 'agents'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Agents
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`${
                    activeTab === 'settings'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Paramètres
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                to="/new-migration"
                className="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Nouvelle Migration
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <MigrationStatusCard
                  title="Progression Globale"
                  total={stats.total}
                  completed={stats.completed}
                  inProgress={stats.inProgress}
                  failed={stats.failed}
                />
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Score QA Global
                    </h3>
                    <div className="mt-5">
                      <ProgressBar value={qaScores.overall} />
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Champs requis:</span>
                          <span className="ml-2 font-medium">{qaScores.requiredFields}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Règles:</span>
                          <span className="ml-2 font-medium">{qaScores.validationRules}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cohérence:</span>
                          <span className="ml-2 font-medium">{qaScores.dataConsistency}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Composants UI:</span>
                          <span className="ml-2 font-medium">{qaScores.uiComponents}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Activité récente
                    </h3>
                    <div className="mt-5 flow-root">
                      <ul className="-my-4 divide-y divide-gray-200">
                        {recentMigrations.slice(0, 3).map((migration) => (
                          <li key={migration.id} className="py-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {migration.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {migration.route}
                                </p>
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    migration.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : migration.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {migration.status === 'completed'
                                    ? 'Terminé'
                                    : migration.status === 'in_progress'
                                    ? 'En cours'
                                    : 'Échec'}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6">
                      <Link
                        to="/migrations"
                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Voir toutes les migrations
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Statut des agents MCP
                  </h3>
                  <div className="mt-5">
                    <AgentStatusList agents={agents} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'migrations' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {recentMigrations.map((migration) => (
                    <li key={migration.id}>
                      <Link
                        to={`/migrations/${migration.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                {migration.name}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    migration.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : migration.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {migration.status === 'completed'
                                    ? 'Terminé'
                                    : migration.status === 'in_progress'
                                    ? 'En cours'
                                    : 'Échec'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 text-sm text-gray-500">
                                {migration.id}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <span>Route: {migration.route}</span>
                              </p>
                            </div>
                            {migration.status === 'completed' && (
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <span className="mr-1.5">QA: {migration.qaScore}%</span>
                                <span className="mx-1.5">|</span>
                                <span>SEO: {migration.seoScore}%</span>
                              </div>
                            )}
                            {migration.status === 'failed' && migration.error && (
                              <div className="mt-2 flex items-center text-sm text-red-500 sm:mt-0">
                                <span>{migration.error}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Agents MCP
                  </h3>
                  <AgentStatusList agents={agents} showDetails={true} />
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Actions
                    </h4>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                      <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
                        Redémarrer tous les agents
                      </button>
                      <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                        Vérifier les mises à jour
                      </button>
                      <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                        Configuration avancée
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Paramètres du système MCP
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>
                      Configurez les options du système de migration PHP vers Remix.
                    </p>
                  </div>
                  <form className="mt-5 space-y-8 divide-y divide-gray-200">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-md font-medium leading-6 text-gray-900">
                          Notifications
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Configurez les notifications pour les événements de migration.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <label
                              htmlFor="slack"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Notifications Slack
                            </label>
                            <input
                              type="text"
                              name="slack"
                              id="slack"
                              placeholder="URL du Webhook Slack"
                              className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-1">
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Notifications Email
                            </label>
                            <input
                              type="text"
                              name="email"
                              id="email"
                              placeholder="Email pour les notifications"
                              className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8">
                      <div>
                        <h3 className="text-md font-medium leading-6 text-gray-900">
                          Intégration GitHub
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Configuration de l'intégration avec GitHub.
                        </p>
                      </div>
                      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label
                            htmlFor="repo"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Repository
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="repo"
                              id="repo"
                              placeholder="organisation/repo"
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="token"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Token d'accès
                          </label>
                          <div className="mt-1">
                            <input
                              type="password"
                              name="token"
                              id="token"
                              placeholder="ghp_..."
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Enregistrer les paramètres
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}