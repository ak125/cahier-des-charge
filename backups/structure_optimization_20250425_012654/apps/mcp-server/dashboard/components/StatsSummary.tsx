import React from reactstructure-agent';

interface StatsSummaryProps {
  stats: {
    filesAnalyzed: number;
    nestjsFilesGenerated: number;
    remixFilesGenerated: number;
  } | null;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats }) => {
  if (!stats) return <div>Aucune donnée disponible</div>;

  return (
    <div className="stats-summary-card">
      <h2>Résumé des Statistiques</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.filesAnalyzed}</div>
          <div className="stat-label">Fichiers PHP analysés</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.nestjsFilesGenerated}</div>
          <div className="stat-label">Contrôleurs NestJS générés</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.remixFilesGenerated}</div>
          <div className="stat-label">Composants Remix générés</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {stats.nestjsFilesGenerated + stats.remixFilesGenerated}
          </div>
          <div className="stat-label">Total fichiers générés</div>
        </div>
      </div>
    </div>
  );
};