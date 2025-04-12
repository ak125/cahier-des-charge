import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MigrationProgressProps {
  stats: {
    filesAnalyzed: number;
    nestjsFilesGenerated: number;
    remixFilesGenerated: number;
    completionPercentage: number;
  } | null;
}

export const MigrationProgress: React.FC<MigrationProgressProps> = ({ stats }) => {
  if (!stats) return <div>Aucune donnée disponible</div>;

  const data = {
    labels: ['Analysés', 'NestJS générés', 'Remix générés', 'En attente'],
    datasets: [
      {
        data: [
          stats.filesAnalyzed,
          stats.nestjsFilesGenerated,
          stats.remixFilesGenerated,
          Math.max(0, stats.filesAnalyzed - stats.nestjsFilesGenerated - stats.remixFilesGenerated)
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)', // Bleu pour les fichiers analysés
          'rgba(255, 99, 132, 0.6)',  // Rouge pour NestJS
          'rgba(75, 192, 192, 0.6)',  // Turquoise pour Remix
          'rgba(255, 206, 86, 0.6)',  // Jaune pour en attente
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Progression de la Migration',
      },
    },
  };

  return (
    <div className="migration-progress-card">
      <h2>Progression de la Migration</h2>
      <div className="chart-container">
        <Doughnut data={data} options={options} />
      </div>
      <div className="completion-info">
        <div className="percentage-circle">
          <span>{stats.completionPercentage}%</span>
        </div>
        <p>Progression globale</p>
      </div>
    </div>
  );
};