import { useState, useEffect } from 'react';
import { useLoaderData, json } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { Card, Badge, Tabs, Button } from '../components/ui';
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
  Filler,
  RadialLinearScale,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Radar, Pie } from 'react-chartjs-2';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ArcElement
);

// Types pour les rapports
interface AuditMetrics {
  completeness: number;
  consistency: number;
  complexity: number;
  coverage: number;
  migrationReadiness: number;
}

interface QualityReport {
  timestamp: string;
  totalAudits: number;
  averageMetrics: AuditMetrics;
  metrics: {
    [slug: string]: {
      metrics: AuditMetrics;
      files: string[];
      lastUpdated: string;
    }
  };
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: {
    priority: string[];
    needsReview: string[];
    exemplary: string[];
  };
}

interface HistoryReport {
  timestamp: string;
  totalAudits: number;
  averageMetrics: AuditMetrics;
}

interface ValidationReport {
  missingFiles: {
    sourcePath: string;
    missingTypes: string[];
  }[];
  inconsistentFields: {
    sourcePath: string;
    fieldName: string;
    values: { [key: string]: string };
  }[];
  duplicateAnalyses: {
    slug: string;
    files: string[];
  }[];
  timestamp: string;
}

interface DashboardData {
  qualityReport: QualityReport;
  qualityHistory: HistoryReport[];
  validationReport: ValidationReport;
}

// Fonction de chargement des données
export const loader: LoaderFunction = async () => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Paths to the report files
    const config = {
      qualityReport: './reports/audit_quality_metrics.json',
      qualityHistory: './reports/audit_quality_history.json',
      validationReport: './reports/audit_consistency_report.json',
    };
    
    // Load quality report
    let qualityReport: QualityReport = {
      timestamp: new Date().toISOString(),
      totalAudits: 0,
      averageMetrics: {
        completeness: 0,
        consistency: 0,
        complexity: 0,
        coverage: 0,
        migrationReadiness: 0,
      },
      metrics: {},
      trends: {
        improving: [],
        declining: [],
        stable: [],
      },
      recommendations: {
        priority: [],
        needsReview: [],
        exemplary: [],
      },
    };
    
    try {
      if (fs.existsSync(config.qualityReport)) {
        qualityReport = JSON.parse(fs.readFileSync(config.qualityReport, 'utf8'));
      } else {
        console.warn(`Rapport de qualité non trouvé: ${config.qualityReport}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du rapport de qualité:`, error);
    }
    
    // Load quality history
    let qualityHistory: HistoryReport[] = [];
    
    try {
      if (fs.existsSync(config.qualityHistory)) {
        qualityHistory = JSON.parse(fs.readFileSync(config.qualityHistory, 'utf8'));
      } else {
        console.warn(`Historique de qualité non trouvé: ${config.qualityHistory}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture de l'historique de qualité:`, error);
    }
    
    // Load validation report
    let validationReport: ValidationReport = {
      missingFiles: [],
      inconsistentFields: [],
      duplicateAnalyses: [],
      timestamp: new Date().toISOString(),
    };
    
    try {
      if (fs.existsSync(config.validationReport)) {
        validationReport = JSON.parse(fs.readFileSync(config.validationReport, 'utf8'));
      } else {
        console.warn(`Rapport de validation non trouvé: ${config.validationReport}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du rapport de validation:`, error);
    }
    
    return json({
      qualityReport,
      qualityHistory,
      validationReport,
    });
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return json({ 
      qualityReport: null,
      qualityHistory: [],
      validationReport: null,
    });
  }
};

// Composant principal
export default function QualityDashboard() {
  const data = useLoaderData<DashboardData>();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Préparer les données pour les graphiques
  const prepareTrendData = () => {
    if (!data.qualityHistory || data.qualityHistory.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Complétude',
            data: [],
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      };
    }
    
    // Trier l'historique par date
    const sortedHistory = [...data.qualityHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Extraire les labels (dates) et les données
    const labels = sortedHistory.map(h => 
      format(new Date(h.timestamp), 'dd/MM/yyyy')
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Complétude',
          data: sortedHistory.map(h => h.averageMetrics.completeness),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Cohérence',
          data: sortedHistory.map(h => h.averageMetrics.consistency),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Préparation à la migration',
          data: sortedHistory.map(h => h.averageMetrics.migrationReadiness),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3,
        },
      ],
    };
  };
  
  const prepareDistributionData = () => {
    const report = data.qualityReport;
    if (!report || !report.metrics || Object.keys(report.metrics).length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Aucune donnée',
            data: [],
            backgroundColor: 'rgba(200, 200, 200, 0.5)',
          },
        ],
      };
    }
    
    // Distribution des scores de migration
    const migrationRanges = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0,
    };
    
    Object.values(report.metrics).forEach(item => {
      const score = item.metrics.migrationReadiness;
      if (score <= 20) migrationRanges['0-20%']++;
      else if (score <= 40) migrationRanges['21-40%']++;
      else if (score <= 60) migrationRanges['41-60%']++;
      else if (score <= 80) migrationRanges['61-80%']++;
      else migrationRanges['81-100%']++;
    });
    
    return {
      labels: Object.keys(migrationRanges),
      datasets: [
        {
          label: 'Distribution des audits par préparation à la migration',
          data: Object.values(migrationRanges),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
          ],
        },
      ],
    };
  };
  
  const prepareRadarData = () => {
    const report = data.qualityReport;
    if (!report || !report.averageMetrics) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Aucune donnée',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
          },
        ],
      };
    }
    
    return {
      labels: [
        'Complétude',
        'Cohérence',
        'Couverture',
        'Préparation à la migration',
        'Complexité'
      ],
      datasets: [
        {
          label: 'Métriques moyennes',
          data: [
            report.averageMetrics.completeness,
            report.averageMetrics.consistency,
            report.averageMetrics.coverage,
            report.averageMetrics.migrationReadiness,
            report.averageMetrics.complexity * 10, // Multiplier par 10 car l'échelle est 0-10
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
        },
      ],
    };
  };
  
  const trendOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
      title: {
        display: true,
        text: 'Évolution des métriques au fil du temps',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value: number) => `${value}%`,
        },
      },
    },
  };
  
  const distributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution des audits par préparation à la migration',
      },
    },
  };
  
  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (value: number) => `${value}%`,
        },
        pointLabels: {
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Répartition des métriques de qualité',
      },
    },
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📈 Métriques de Qualité des Audits</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            🔄 Actualiser
          </Button>
        </div>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <Tabs.List>
          <Tabs.Trigger value="overview">Vue d'ensemble</Tabs.Trigger>
          <Tabs.Trigger value="trends">Tendances</Tabs.Trigger>
          <Tabs.Trigger value="details">Détails par audit</Tabs.Trigger>
          <Tabs.Trigger value="recommendations">Recommandations</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="overview" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">📊 Résumé</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Nombre d'audits:</span>
                  <span className="font-semibold">{data.qualityReport?.totalAudits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dernière analyse:</span>
                  <span className="font-semibold">
                    {data.qualityReport ? formatDistanceToNow(new Date(data.qualityReport.timestamp), { 
                      addSuffix: true,
                      locale: fr 
                    }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Audits prioritaires:</span>
                  <Badge variant={
                    (data.qualityReport?.recommendations.priority.length || 0) > 5 ? 'destructive' : 
                    (data.qualityReport?.recommendations.priority.length || 0) > 0 ? 'warning' : 'success'
                  }>
                    {data.qualityReport?.recommendations.priority.length || 0}
                  </Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">🎯 Scores moyens</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Complétude:</span>
                  <Badge variant={
                    (data.qualityReport?.averageMetrics.completeness || 0) > 80 ? 'success' :
                    (data.qualityReport?.averageMetrics.completeness || 0) > 50 ? 'warning' : 'destructive'
                  }>
                    {(data.qualityReport?.averageMetrics.completeness || 0).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cohérence:</span>
                  <Badge variant={
                    (data.qualityReport?.averageMetrics.consistency || 0) > 80 ? 'success' :
                    (data.qualityReport?.averageMetrics.consistency || 0) > 50 ? 'warning' : 'destructive'
                  }>
                    {(data.qualityReport?.averageMetrics.consistency || 0).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Préparation à la migration:</span>
                  <Badge variant={
                    (data.qualityReport?.averageMetrics.migrationReadiness || 0) > 80 ? 'success' :
                    (data.qualityReport?.averageMetrics.migrationReadiness || 0) > 50 ? 'warning' : 'destructive'
                  }>
                    {(data.qualityReport?.averageMetrics.migrationReadiness || 0).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">🚀 Tendances</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>En amélioration:</span>
                  <Badge variant="success">
                    {data.qualityReport?.trends.improving.length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>En déclin:</span>
                  <Badge variant="destructive">
                    {data.qualityReport?.trends.declining.length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Stables:</span>
                  <Badge variant="outline">
                    {data.qualityReport?.trends.stable.length || 0}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="h-80">
                <Radar data={prepareRadarData()} options={radarOptions} />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="h-80">
                <Pie data={prepareDistributionData()} options={distributionOptions} />
              </div>
            </Card>
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="trends" className="pt-4">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Évolution au fil du temps</h2>
            <div className="h-96">
              <Line data={prepareTrendData()} options={trendOptions} />
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">⬆️ Audits en amélioration</h3>
              {data.qualityReport?.trends.improving.length === 0 ? (
                <p className="text-gray-500 italic">Aucun audit en amélioration détecté</p>
              ) : (
                <ul className="space-y-1">
                  {data.qualityReport?.trends.improving.map(slug => (
                    <li key={slug} className="flex justify-between">
                      <span className="font-medium">{slug}</span>
                      <Badge variant="success">↗️</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">⬇️ Audits en déclin</h3>
              {data.qualityReport?.trends.declining.length === 0 ? (
                <p className="text-gray-500 italic">Aucun audit en déclin détecté</p>
              ) : (
                <ul className="space-y-1">
                  {data.qualityReport?.trends.declining.map(slug => (
                    <li key={slug} className="flex justify-between">
                      <span className="font-medium">{slug}</span>
                      <Badge variant="destructive">↘️</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="details" className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Module</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Complétude</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Cohérence</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Couverture</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Migration</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Complexité</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Dernière MàJ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(data.qualityReport?.metrics || {}).map(([slug, data]) => (
                  <tr key={slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{slug}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={
                        data.metrics.completeness > 80 ? 'success' :
                        data.metrics.completeness > 50 ? 'warning' : 'destructive'
                      }>
                        {data.metrics.completeness.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={
                        data.metrics.consistency > 80 ? 'success' :
                        data.metrics.consistency > 50 ? 'warning' : 'destructive'
                      }>
                        {data.metrics.consistency.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={
                        data.metrics.coverage > 80 ? 'success' :
                        data.metrics.coverage > 50 ? 'warning' : 'destructive'
                      }>
                        {data.metrics.coverage.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={
                        data.metrics.migrationReadiness > 80 ? 'success' :
                        data.metrics.migrationReadiness > 50 ? 'warning' : 'destructive'
                      }>
                        {data.metrics.migrationReadiness.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={
                        data.metrics.complexity < 4 ? 'success' :
                        data.metrics.complexity < 7 ? 'warning' : 'destructive'
                      }>
                        {data.metrics.complexity.toFixed(1)}/10
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(data.lastUpdated), { 
                        addSuffix: true,
                        locale: fr
                      })}
                    </td>
                  </tr>
                ))}
                {(!data.qualityReport?.metrics || Object.keys(data.qualityReport?.metrics).length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="recommendations" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold mb-2 text-red-700">⚠️ Audits prioritaires</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ces audits nécessitent des améliorations immédiates en raison d'un faible score global
              </p>
              {data.qualityReport?.recommendations.priority.length === 0 ? (
                <p className="text-gray-500 italic">Aucun audit prioritaire détecté</p>
              ) : (
                <ul className="space-y-2">
                  {data.qualityReport?.recommendations.priority.map(slug => (
                    <li key={slug} className="flex justify-between items-center bg-white px-3 py-2 rounded-md shadow-sm">
                      <span className="font-medium">{slug}</span>
                      <Button size="sm" variant="destructive">Améliorer</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            
            <Card className="p-4 border-yellow-200 bg-yellow-50">
              <h3 className="text-lg font-semibold mb-2 text-yellow-700">🔍 Audits à revoir</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ces audits présentent des incohérences ou un déséquilibre dans leurs métriques
              </p>
              {data.qualityReport?.recommendations.needsReview.length === 0 ? (
                <p className="text-gray-500 italic">Aucun audit à revoir détecté</p>
              ) : (
                <ul className="space-y-2">
                  {data.qualityReport?.recommendations.needsReview.map(slug => (
                    <li key={slug} className="flex justify-between items-center bg-white px-3 py-2 rounded-md shadow-sm">
                      <span className="font-medium">{slug}</span>
                      <Button size="sm" variant="warning">Revoir</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            
            <Card className="p-4 border-green-200 bg-green-50">
              <h3 className="text-lg font-semibold mb-2 text-green-700">✅ Audits exemplaires</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ces audits sont complets, cohérents et peuvent servir de modèles
              </p>
              {data.qualityReport?.recommendations.exemplary.length === 0 ? (
                <p className="text-gray-500 italic">Aucun audit exemplaire détecté</p>
              ) : (
                <ul className="space-y-2">
                  {data.qualityReport?.recommendations.exemplary.map(slug => (
                    <li key={slug} className="flex justify-between items-center bg-white px-3 py-2 rounded-md shadow-sm">
                      <span className="font-medium">{slug}</span>
                      <Button size="sm" variant="outline">Voir</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          
          <Card className="mt-6 p-4">
            <h3 className="text-lg font-semibold mb-2">🛠️ Problèmes de validation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Problèmes détectés lors de la dernière validation des fichiers d'audit
            </p>
            
            {data.validationReport && (
              data.validationReport.missingFiles.length === 0 && 
              data.validationReport.inconsistentFields.length === 0 && 
              data.validationReport.duplicateAnalyses.length === 0
            ) ? (
              <div className="text-center py-4">
                <Badge variant="success" className="text-md">
                  ✓ Tous les fichiers d'audit sont valides
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Dernière validation: {formatDistanceToNow(new Date(data.validationReport.timestamp), { 
                    addSuffix: true,
                    locale: fr 
                  })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.validationReport?.missingFiles.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Fichiers manquants</h4>
                    <ul className="space-y-1 text-sm">
                      {data.validationReport.missingFiles.map((item, index) => (
                        <li key={index} className="flex justify-between bg-red-50 px-3 py-2 rounded-md">
                          <span className="font-medium">{item.sourcePath}</span>
                          <span>{item.missingTypes.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.validationReport?.inconsistentFields.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-600 mb-2">Champs incohérents</h4>
                    <ul className="space-y-1 text-sm">
                      {data.validationReport.inconsistentFields.map((item, index) => (
                        <li key={index} className="bg-yellow-50 px-3 py-2 rounded-md">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.sourcePath}</span>
                            <span>Champ: {item.fieldName}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {Object.entries(item.values).map(([type, value]) => (
                              <div key={type} className="flex justify-between">
                                <span>{type}:</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Tabs.Content>
      </Tabs>
      
      <div className="mt-8 text-sm text-gray-500 text-center">
        Dernière mise à jour: {data.qualityReport ? format(new Date(data.qualityReport.timestamp), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'N/A'}
      </div>
    </div>
  );
}