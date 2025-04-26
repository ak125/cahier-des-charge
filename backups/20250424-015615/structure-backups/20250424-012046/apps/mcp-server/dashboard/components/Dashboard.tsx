import React, { useState, useEffect } from reactstructure-agent';
import { MigrationProgress } from ./MigrationProgressstructure-agent';
import { FileAnalysis } from ./FileAnalysisstructure-agent';
import { StatsSummary } from ./StatsSummarystructure-agent';

interface DashboardProps {
  apiUrl?: string;
}

interface MigrationStats {
  filesAnalyzed: number;
  nestjsFilesGenerated: number;
  remixFilesGenerated: number;
  completionPercentage: number;
  lastUpdated: string;
}

const Dashboard: React.FC<DashboardProps> = ({ apiUrl = '/api/stats' }) => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(`Erreur lors du chargement des statistiques: ${err.message}`);
        console.error('Erreur lors du chargement des statistiques:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, [apiUrl]);

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Tableau de Bord MCP</h1>
        <p className="last-updated">
          Dernière mise à jour: {stats?.lastUpdated || 'Inconnue'}
        </p>
      </header>

      <div className="dashboard-grid">
        <StatsSummary stats={stats} />
        <MigrationProgress stats={stats} />
        <FileAnalysis />
      </div>
    </div>
  );
};

export default Dashboard;