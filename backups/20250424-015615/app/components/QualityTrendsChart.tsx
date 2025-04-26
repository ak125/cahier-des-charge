import React from reactstructure-agent";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from chart.jsstructure-agent';
import { Line } from react-chartjs-2structure-agent';

// Enregistrer les composants nécessaires pour le graphique
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

interface QualityTrendsChartProps {
  dates: string[];
  seoScores: number[];
  performanceScores?: number[];
  accessibilityScores?: number[];
  bestPracticesScores?: number[];
  height?: number;
  showLegend?: boolean;
}

export const QualityTrendsChart: React.FC<QualityTrendsChartProps> = ({
  dates,
  seoScores,
  performanceScores,
  accessibilityScores,
  bestPracticesScores,
  height = 400,
  showLegend = true
}) => {
  const datasets = [
    {
      label: 'SEO',
      data: seoScores,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      fill: true,
      tension: 0.3,
    }
  ];
  
  // Ajouter les autres métriques si elles sont disponibles
  if (performanceScores && performanceScores.length > 0) {
    datasets.push({
      label: 'Performance',
      data: performanceScores,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      fill: true,
      tension: 0.3,
    });
  }
  
  if (accessibilityScores && accessibilityScores.length > 0) {
    datasets.push({
      label: 'Accessibilité',
      data: accessibilityScores,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      fill: true,
      tension: 0.3,
    });
  }
  
  if (bestPracticesScores && bestPracticesScores.length > 0) {
    datasets.push({
      label: 'Meilleures pratiques',
      data: bestPracticesScores,
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.1)',
      fill: true,
      tension: 0.3,
    });
  }
  
  const data = {
    labels: dates,
    datasets,
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: showLegend,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}/100`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Score'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };
  
  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default QualityTrendsChart;