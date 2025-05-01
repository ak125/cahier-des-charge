import { useEffect, useState } from 'react';
import type { JobStatistics, TemporalJob } from '~/models/job.server';
import { getRecentTemporalJobs, getTemporalJobStatistics } from '~/models/job.server';
import JobStatusCard from './JobStatusCard';

interface JobStatusDashboardProps {
  initialJobs?: TemporalJob[];
  initialStats?: JobStatistics;
  autoRefresh?: boolean;
}

export default function JobStatusDashboard({
  initialJobs,
  initialStats,
  autoRefresh = true,
}: JobStatusDashboardProps) {
  const [jobs, setJobs] = useState<TemporalJob[]>(initialJobs || []);
  const [stats, setStats] = useState<JobStatistics | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState(!initialJobs);
  const [filter, setFilter] = useState<string>('all');
  const [showAiOnly, setShowAiOnly] = useState(false);
  const [showWithPR, setShowWithPR] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedJobs, fetchedStats] = await Promise.all([
        getRecentTemporalJobs(20),
        getTemporalJobStatistics(),
      ]);

      setJobs(fetchedJobs);
      setStats(fetchedStats);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour charger les données initialement et configurer l'auto-refresh
  useEffect(() => {
    if (!initialJobs || !initialStats) {
      loadData();
    }

    let refreshInterval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        loadData();
      }, 10000); // Rafraîchir toutes les 10 secondes
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [initialJobs, initialStats, autoRefresh]);

  // Filtrer les jobs selon les critères sélectionnés
  const filteredJobs = jobs.filter((job) => {
    // Filtrer par statut
    if (filter !== 'all' && job.status !== filter) return false;

    // Filtrer les jobs avec traces Langfuse
    if (showAiOnly && (!job.langfuseTraces || job.langfuseTraces.length === 0)) return false;

    // Filtrer les jobs avec PR GitHub
    if (showWithPR && !jobDoDoDoDoDoDotgithubPR) return false;

    // Filtrer les jobs récurrents
    if (showRecurring && !job.isRecurring) return false;

    return true;
  });

  // Calculer le taux de réussite
  const successRate = stats
    ? Math.round((stats.workflowsCompleted / (stats.workflowsStarted || 1)) * 100)
    : 0;

  // Calculer le nombre de jobs par statut pour les statistiques
  const jobCountByStatus = {
    running: jobs.filter((job) => job.status === 'running').length,
    pending: jobs.filter((job) => job.status === 'pending').length,
    completed: jobs.filter((job) => job.status === 'completed').length,
    failed: jobs.filter((job) => job.status === 'failed').length,
    cancelled: jobs.filter((job) => job.status === 'cancelled').length,
  };

  // Compter les jobs avec traces Langfuse, PRs et récurrents
  const jobsWithLangfuse = jobs.filter(
    (job) => job.langfuseTraces && job.langfuseTraces.length > 0
  ).length;
  const jobsWithPR = jobs.filter((_job) => jobDoDoDoDoDoDotgithubPR).length;
  const recurringJobs = jobs.filter((job) => job.isRecurring).length;

  return (
    <div className="job-status-dashboard">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">État des Jobs Temporal</h2>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium flex items-center gap-1"
        >
          {isLoading ? (
            <span>Chargement...</span>
          ) : (
            <>
              <span>Rafraîchir</span>
              <span className="text-lg">🔄</span>
            </>
          )}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500">Workflows démarrés</div>
            <div className="text-2xl font-bold">{stats.workflowsStarted}</div>
            <div className="text-xs text-gray-500 mt-1">
              Mis à jour {new Date(stats.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-500">Taux de réussite</div>
            <div className="text-2xl font-bold">{successRate}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.workflowsCompleted}/{stats.workflowsStarted} terminés
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-500">Jobs en cours</div>
            <div className="text-2xl font-bold">
              {jobCountByStatus.running + jobCountByStatus.pending}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {jobCountByStatus.running} actifs, {jobCountByStatus.pending} en attente
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-500">Échecs</div>
            <div className="text-2xl font-bold">{stats.workflowsFailed}</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((stats.workflowsFailed / (stats.workflowsStarted || 1)) * 100)}% des
              workflows
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('running')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === 'running' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            En cours ({jobCountByStatus.running})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            En attente ({jobCountByStatus.pending})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Terminés ({jobCountByStatus.completed})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === 'failed' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Échoués ({jobCountByStatus.failed})
          </button>
        </div>

        {/* Filtres supplémentaires pour les nouvelles fonctionnalités */}
        <div className="flex flex-wrap gap-3 mb-4 pt-2 border-t border-gray-100">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showAiOnly}
              onChange={() => setShowAiOnly(!showAiOnly)}
              className="rounded text-indigo-500 border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm flex items-center gap-1">
              <span>🧠</span>
              <span>Avec traces IA ({jobsWithLangfuse})</span>
            </span>
          </label>

          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showWithPR}
              onChange={() => setShowWithPR(!showWithPR)}
              className="rounded text-gray-800 border-gray-300 focus:ring-gray-500"
            />
            <span className="text-sm flex items-center gap-1">
              <span>🔀</span>
              <span>Avec PR GitHub ({jobsWithPR})</span>
            </span>
          </label>

          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showRecurring}
              onChange={() => setShowRecurring(!showRecurring)}
              className="rounded text-blue-500 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm flex items-center gap-1">
              <span>🔄</span>
              <span>Récurrents ({recurringJobs})</span>
            </span>
          </label>
        </div>

        {isLoading && !jobs.length ? (
          <div className="p-8 text-center text-gray-500">Chargement des jobs...</div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobStatusCard key={job.id} job={job} onRefresh={loadData} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Aucun job {filter !== 'all' ? `avec le statut "${filter}"` : ''} trouvé
            {(showAiOnly || showWithPR || showRecurring) && ' avec les filtres sélectionnés'}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Dernière mise à jour: {new Date().toLocaleString()}</span>
        {autoRefresh && <span>Actualisation automatique toutes les 10 secondes</span>}
      </div>
    </div>
  );
}
