import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import React from 'react';
import { Radar } from 'react-chartjs-2';

// Enregistrer les composants nécessaires pour le graphique radar
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  label?: string;
  height?: number;
  width?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  seoScore,
  performanceScore,
  accessibilityScore,
  bestPracticesScore,
  label = 'Score de qualité',
  height = 300,
  width = 300,
}) => {
  const data = {
    labels: ['SEO', 'Performance', 'Accessibilité', 'Meilleures pratiques'],
    datasets: [
      {
        label: label,
        data: [seoScore, performanceScore, accessibilityScore, bestPracticesScore],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 4,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
        },
        pointLabels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Score: ${context.raw}/100`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height, width }}>
      <Radar data={data} options={options} />
    </div>
  );
};

export default RadarChart;
