import React, { useState, useEffect } from 'react';
import workflowAnalyticsService, { WorkflowMetrics, PerformanceData } from './services/workflowAnalyticsService';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WorkflowPerformanceProps {
  workflowId: string | null;
  onProblemDetected?: (problems: { workflowId: string, action: string }[]) => void;
}

const WorkflowPerformance: React.FC<WorkflowPerformanceProps> = ({ workflowId, onProblemDetected }) => {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [timeframe, setTimeframe] = useState<number>(7); // 7 jours par défaut
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showGlobalAnalysis, setShowGlobalAnalysis] = useState<boolean>(false);
  const [problemWorkflows, setProblemWorkflows] = useState<WorkflowMetrics[]>([]);
  const [recommendations, setRecommendations] = useState<{ workflowId: string, action: string }[]>([]);

  // Configuration des options de graphique
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance du workflow dans le temps'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Effet pour charger les métriques d'un workflow spécifique
  useEffect(() => {
    if (!workflowId) {
      setMetrics(null);
      setPerformanceData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setShowGlobalAnalysis(false);

    // Charger les métriques
    Promise.all([
      workflowAnalyticsService.getWorkflowMetrics(workflowId),
      workflowAnalyticsService.getPerformanceData(workflowId, timeframe)
    ])
      .then(([metricsData, perfData]) => {
        setMetrics(metricsData);
        setPerformanceData(perfData);
      })
      .catch(err => {
        console.error('Erreur lors du chargement des données d\'analyse :', err);
        setError(`Erreur lors du chargement des données : ${err.message || 'Erreur inconnue'}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workflowId, timeframe]);

  // Effet pour analyser tous les workflows lors de l'affichage de l'analyse globale
  useEffect(() => {
    if (!showGlobalAnalysis) return;

    setLoading(true);
    setError(null);

    workflowAnalyticsService.analyzeAllWorkflows()
      .then(({ problemWorkflows, recommendedActions }) => {
        setProblemWorkflows(problemWorkflows);
        setRecommendations(recommendedActions);
        
        // Notifier le composant parent des problèmes détectés
        if (onProblemDetected && recommendedActions.length > 0) {
          onProblemDetected(recommendedActions);
        }
      })
      .catch(err => {
        console.error('Erreur lors de l\'analyse globale des workflows :', err);
        setError(`Erreur lors de l'analyse : ${err.message || 'Erreur inconnue'}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showGlobalAnalysis, onProblemDetected]);

  // Données pour le graphique de taux de réussite
  const successRateChartData = performanceData ? {
    labels: performanceData.timeframes,
    datasets: [
      {
        label: 'Taux de réussite (%)',
        data: performanceData.successRates,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      }
    ]
  } : null;

  // Données pour le graphique de nombre d'exécutions
  const executionCountChartData = performanceData ? {
    labels: performanceData.timeframes,
    datasets: [
      {
        label: 'Nombre d\'exécutions',
        data: performanceData.executionCounts,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1
      }
    ]
  } : null;

  // Données pour le graphique de temps d'exécution
  const durationChartData = performanceData ? {
    labels: performanceData.timeframes,
    datasets: [
      {
        label: 'Temps moyen d\'exécution (s)',
        data: performanceData.averageDurations,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  } : null;

  // Fonction pour obtenir la couleur de la classe CSS en fonction du statut
  const getStatusColorClass = (successRate: number, trend: string): string => {
    if (successRate < 50) return 'text-red-600';
    if (successRate < 80) return 'text-yellow-600';
    if (trend === 'degrading') return 'text-orange-600';
    return 'text-green-600';
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
        <p className="text-center mt-4">Chargement des données d'analyse...</p>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded">
        <h3 className="font-bold mb-2">Erreur</h3>
        <p>{error}</p>
        <button 
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => workflowId ? setShowGlobalAnalysis(false) : setShowGlobalAnalysis(true)}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {showGlobalAnalysis 
            ? "Analyse globale des workflows" 
            : (workflowId ? "Analyse de performance" : "Sélectionnez un workflow pour voir son analyse")}
        </h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 ${showGlobalAnalysis ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded hover:bg-blue-600`}
            onClick={() => setShowGlobalAnalysis(!showGlobalAnalysis)}
          >
            {showGlobalAnalysis ? "Vue individuelle" : "Analyse globale"}
          </button>
          {!showGlobalAnalysis && workflowId && (
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded"
            >
              <option value={7}>7 jours</option>
              <option value={14}>14 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
          )}
        </div>
      </div>

      {/* Analyse globale des workflows */}
      {showGlobalAnalysis && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Workflows nécessitant une attention ({problemWorkflows.length})</h3>
            {problemWorkflows.length === 0 ? (
              <p className="text-green-600">Tous les workflows fonctionnent correctement.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {problemWorkflows.map(workflow => (
                  <div 
                    key={workflow.id} 
                    className="border rounded p-3 bg-white shadow-sm"
                  >
                    <h4 className="font-medium">{workflow.name}</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Taux de succès:</span>{' '}
                        <span className={getStatusColorClass(workflow.successRate, workflow.trend)}>
                          {workflow.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tendance:</span>{' '}
                        <span className={workflow.trend === 'improving' ? 'text-green-600' : 
                                        workflow.trend === 'degrading' ? 'text-red-600' : 'text-gray-600'}>
                          {workflow.trend === 'improving' ? '↗️ Amélioration' : 
                           workflow.trend === 'degrading' ? '↘️ Dégradation' : '→ Stable'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Recommandations d'action</h3>
            {recommendations.length === 0 ? (
              <p className="text-gray-600">Aucune action nécessaire pour le moment.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-800">{rec.action}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Analyse d'un workflow spécifique */}
      {!showGlobalAnalysis && workflowId && metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded p-4 bg-white shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Taux de réussite</h3>
              <p className={`text-2xl font-bold ${getStatusColorClass(metrics.successRate, metrics.trend)}`}>
                {metrics.successRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Sur {metrics.totalExecutions} exécution(s)</p>
            </div>
            
            <div className="border rounded p-4 bg-white shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Temps moyen d'exécution</h3>
              <p className="text-2xl font-bold text-gray-800">
                {metrics.averageDuration.toFixed(2)}s
              </p>
              <p className="text-xs text-gray-500">
                {metrics.averageDuration > 60 ? '⚠️ Durée élevée' : '✓ Durée acceptable'}
              </p>
            </div>
            
            <div className="border rounded p-4 bg-white shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Dernière exécution</h3>
              <p className={`text-lg font-bold ${metrics.lastExecutionStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.lastExecutionStatus === 'success' ? 'Réussie' : 'Échec'}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(metrics.lastExecutionTime).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {successRateChartData && (
              <div className="border rounded p-4 bg-white shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Évolution du taux de réussite</h3>
                <Line options={chartOptions} data={successRateChartData} />
              </div>
            )}
            
            {executionCountChartData && (
              <div className="border rounded p-4 bg-white shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Nombre d'exécutions par jour</h3>
                <Bar 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: { ...chartOptions.plugins?.title, text: 'Exécutions quotidiennes' }
                    }
                  }} 
                  data={executionCountChartData} 
                />
              </div>
            )}
          </div>

          {durationChartData && (
            <div className="border rounded p-4 bg-white shadow-sm mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Durée moyenne d'exécution</h3>
              <Line 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: { ...chartOptions.plugins?.title, text: 'Durée d\'exécution au fil du temps' }
                  }
                }} 
                data={durationChartData} 
              />
            </div>
          )}

          <div className="border rounded p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Recommandations</h3>
            {metrics.successRate < 80 && (
              <div className="flex items-start space-x-2 mb-2">
                <div className="text-red-500">⚠️</div>
                <p>Le taux de réussite est inférieur à 80%. Vérifiez la configuration du workflow et les journaux d'erreurs.</p>
              </div>
            )}
            
            {metrics.trend === 'degrading' && (
              <div className="flex items-start space-x-2 mb-2">
                <div className="text-orange-500">⚠️</div>
                <p>La tendance de fiabilité se dégrade. Examinez les changements récents qui pourraient affecter le workflow.</p>
              </div>
            )}
            
            {metrics.averageDuration > 60 && (
              <div className="flex items-start space-x-2 mb-2">
                <div className="text-yellow-500">⚠️</div>
                <p>Le temps d'exécution moyen est élevé. Envisagez d'optimiser les étapes du workflow pour améliorer les performances.</p>
              </div>
            )}
            
            {metrics.successRate >= 80 && metrics.trend !== 'degrading' && metrics.averageDuration <= 60 && (
              <div className="flex items-start space-x-2">
                <div className="text-green-500">✓</div>
                <p>Le workflow fonctionne correctement. Continuez à surveiller régulièrement.</p>
              </div>
            )}
          </div>
        </>
      )}

      {!showGlobalAnalysis && !workflowId && (
        <div className="text-center py-10 text-gray-500">
          <p>Sélectionnez un workflow dans la liste pour afficher son analyse détaillée</p>
          <p className="mt-2">ou</p>
          <button
            onClick={() => setShowGlobalAnalysis(true)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Voir l'analyse globale
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowPerformance;