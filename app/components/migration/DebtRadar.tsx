import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface DebtMetric {
  name: string;
  value: number;
  description: string;
}

interface DebtData {
  score: number;
  metrics: DebtMetric[];
  suggestions: string[];
}

interface DebtRadarProps {
  debtData: DebtData;
  tableName: string;
}

export default function DebtRadar({ debtData, tableName }: DebtRadarProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !debtData || !debtData.metrics) return;

    // Détruire le graphique précédent s'il existe
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const metrics = debtData.metrics || [];
    
    // Créer le graphique radar
    chartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: metrics.map(metric => metric.name),
        datasets: [{
          label: 'Dette Technique',
          data: metrics.map(metric => metric.value),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        }
      }
    });
    
    // Nettoyer en détruisant le graphique lors du démontage du composant
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [debtData, tableName]);

  if (!debtData || !debtData.metrics || debtData.metrics.length === 0) {
    return (
      <div className="no-debt-data">
        Aucune donnée de dette technique disponible pour cette table
      </div>
    );
  }

  // Déterminer la classe CSS en fonction du score de dette
  const getDebtClass = (score: number) => {
    if (score > 70) return 'high-debt';
    if (score > 30) return 'medium-debt';
    return 'low-debt';
  };

  return (
    <div className="debt-radar-container">
      <div className="debt-score">
        <span className={`score ${getDebtClass(debtData.score)}`}>
          {debtData.score}
        </span>
        <span className="score-label">Score de dette</span>
      </div>
      
      <div className="radar-chart-container">
        <canvas ref={chartRef}></canvas>
      </div>
      
      {debtData.metrics && debtData.metrics.length > 0 && (
        <div className="metrics-details">
          <h4>Détails des métriques</h4>
          <ul>
            {debtData.metrics.map((metric, index) => (
              <li key={index}>
                <strong>{metric.name}</strong>: {metric.value}/100
                <p>{metric.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {debtData.suggestions && debtData.suggestions.length > 0 && (
        <div className="debt-suggestions">
          <h4>Suggestions d'amélioration</h4>
          <ul>
            {debtData.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}