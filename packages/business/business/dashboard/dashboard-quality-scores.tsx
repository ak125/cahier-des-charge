import fs from 'fs';
import path from 'path';
import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useEffect, useMemo, useState } from 'react';
import QualityAlertNotification, { QualityAlert } from '../components/QualityAlertNotification';
import QualityImprovementTips from '../components/QualityImprovementTips';
import QualityTrendsChart from '../components/QualityTrendsChart';
import RadarChart from '../components/RadarChart';

/**
 * Dashboard de scores de qualité
 * Ce tableau de bord permet de visualiser les scores de qualité de l'application
 * générés par l'agent QA-Analyzer viaDotn8N.
 */

type QAResult = {
  filePath: string;
  score: number;
  status: 'success' | 'partial' | 'failed';
  missingFields: string[];
  requiredFields: string[];
  optionalFields: string[];
  completedFields: string[];
  timestamp: string;
  history?: Array<{
    timestamp: string;
    score: number;
    status: string;
  }>;
  // Nouveaux indicateurs de qualité
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  performanceMetrics?: {
    firstContentfulPaint?: number;
    speedIndex?: number;
    timeToInteractive?: number;
    totalBlockingTime?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
  };
  accessibilityIssues?: Array<{
    type: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    selector?: string;
    message: string;
  }>;
  bestPracticesIssues?: Array<{
    category: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }>;
};

type QADashboardData = {
  lastUpdate: string;
  results: Record<string, QAResult>;
  stats: {
    totalFiles: number;
    passedFiles: number;
    partialFiles: number;
    failedFiles: number;
  };
  averageScore: number;
  historicalData?: Array<{
    date: string;
    averageScore: number;
    passedFiles: number;
    failedFiles: number;
    partialFiles: number;
    // Nouvelles données historiques
    avgPerformanceScore?: number;
    avgAccessibilityScore?: number;
    avgBestPracticesScore?: number;
  }>;
  topIssues?: Array<{
    issue: string;
    count: number;
    affectedFiles: string[];
  }>;
  // Nouvelles statistiques globales
  performanceStats?: {
    averageScore: number;
    goodPerformanceCount: number;
    poorPerformanceCount: number;
  };
  accessibilityStats?: {
    averageScore: number;
    criticalIssuesCount: number;
    seriousIssuesCount: number;
  };
  bestPracticesStats?: {
    averageScore: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
  };
};

// Types
interface DashboardData {
  results: Record<string, FileAnalysisResult>;
  seoStats: {
    averageScore: number;
    successRate: number;
    analyzedFiles: number;
    withIssues: number;
    topIssues: Array<{ issue: string; count: number }>;
  };
  performanceStats: {
    averageScore: number;
    goodPerformanceCount: number;
    poorPerformanceCount: number;
    averageFCP: number;
    averageLCP: number;
    averageCLS: number;
  };
  accessibilityStats: {
    averageScore: number;
    criticalIssuesCount: number;
    seriousIssuesCount: number;
    moderateIssuesCount: number;
    minorIssuesCount: number;
  };
  bestPracticesStats: {
    averageScore: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
  };
  history: Array<{
    date: string;
    seoScore: number;
    performanceScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
  }>;
}

interface FileAnalysisResult {
  url: string;
  filename: string;
  seoScore: number;
  seoIssues: SeoIssue[];
  performanceScore?: number;
  performanceMetrics?: {
    firstContentfulPaint: number;
    speedIndex: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  accessibilityScore?: number;
  accessibilityIssues?: Array<{
    message: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    element: string;
  }>;
  bestPracticesScore?: number;
  bestPracticesIssues?: Array<{
    category: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

// Loader pour récupérer les données de qualité
export async function loader({ request }: LoaderFunctionArgs) {
  // Chemins des fichiers de données
  const qaDataPath = path.resolve('./qa-reports/qa-dashboard-data.json');
  const historicalDataPath = path.resolve('./qa-reports/qa-historical-data.json');
  const notificationsPath = path.resolve('./qa-reports/quality-alerts.json');

  // Initialiser les données par défaut
  let dashboardData: QADashboardData = {
    lastUpdate: new Date().toISOString(),
    results: {},
    stats: {
      totalFiles: 0,
      passedFiles: 0,
      partialFiles: 0,
      failedFiles: 0,
    },
    averageScore: 0,
  };

  // Initialiser les alertes
  let alerts: QualityAlert[] = [];

  try {
    // Récupérer les données QA si le fichier existe
    if (fs.existsSync(qaDataPath)) {
      dashboardData = JSON.parse(fs.readFileSync(qaDataPath, 'utf8'));
    }

    // Récupérer les données historiques si le fichier existe
    if (fs.existsSync(historicalDataPath)) {
      const historicalData = JSON.parse(fs.readFileSync(historicalDataPath, 'utf8'));
      dashboardData.historicalData = historicalData.data;
    }

    // Récupérer les alertes si le fichier existe
    if (fs.existsSync(notificationsPath)) {
      alerts = JSON.parse(fs.readFileSync(notificationsPath, 'utf8'));
    }

    // Analyser les problèmes les plus courants
    if (dashboardData.results && Object.keys(dashboardData.results).length > 0) {
      const issueCounter: Record<string, { count: number; files: string[] }> = {};

      // Compter les occurrences de chaque champ manquant
      Object.entries(dashboardData.results).forEach(([filePath, result]) => {
        if (result.missingFields && result.missingFields.length > 0) {
          result.missingFields.forEach((field) => {
            if (!issueCounter[field]) {
              issueCounter[field] = { count: 0, files: [] };
            }
            issueCounter[field].count++;
            issueCounter[field].files.push(filePath);
          });
        }
      });

      // Trier et limiter aux 5 problèmes les plus fréquents
      dashboardData.topIssues = Object.entries(issueCounter)
        .map(([issue, data]) => ({
          issue,
          count: data.count,
          affectedFiles: data.files,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données de qualité:', error);
    // Retourner les données par défaut en cas d'erreur
  }

  return json({ dashboardData, alerts });
}

const TabNavigation = ({
  activeTab,
  setActiveTab,
}: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'files', label: 'Fichiers' },
    { id: 'performance', label: 'Performances & Accessibilité' }, // Nouvel onglet
    { id: 'recommendations', label: 'Recommandations' }, // Nouvel onglet
    { id: 'history', label: 'Historique' },
    { id: 'issues', label: 'Problèmes courants' },
  ];

  return (
    <div className="flex border-b mb-4 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default function DashboardQualityScores() {
  const { dashboardData, alerts } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentAlerts, setCurrentAlerts] = useState<QualityAlert[]>(alerts);

  // Gérer les alertes
  const handleDismissAlert = (alert: QualityAlert) => {
    setCurrentAlerts(currentAlerts.filter((a) => a !== alert));
  };

  const handleDismissAllAlerts = () => {
    setCurrentAlerts([]);
  };

  const handleMarkAsRead = (alert: QualityAlert) => {
    setCurrentAlerts(currentAlerts.map((a) => (a === alert ? { ...a, isRead: true } : a)));
  };

  // Calculer le pourcentage de réussite
  const successRate = useMemo(() => {
    const { passedFiles, totalFiles } = dashboardData.stats;
    return totalFiles > 0 ? Math.round((passedFiles / totalFiles) * 100) : 0;
  }, [dashboardData.stats]);

  // Filtrer les résultats par statut et terme de recherche
  const filteredResults = useMemo(() => {
    return Object.entries(dashboardData.results).filter(([filePath, result]) => {
      const matchesStatus = filterStatus === 'all' || result.status === filterStatus;
      const matchesSearch =
        searchTerm === '' ||
        filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.missingFields.some((field) =>
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesStatus && matchesSearch;
    });
  }, [dashboardData.results, filterStatus, searchTerm]);

  // Obtenir les détails du fichier sélectionné
  const selectedFileDetails = useMemo(() => {
    if (!selectedFile) return null;
    return dashboardData.results[selectedFile];
  }, [selectedFile, dashboardData.results]);

  // Fonction pour générer une couleur basée sur le score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Préparation des données pour le graphique de tendances historiques
  const historicalChartData = useMemo(() => {
    if (!dashboardData.historicalData || dashboardData.historicalData.length === 0) {
      return {
        dates: [],
        seoScores: [],
        performanceScores: [],
        accessibilityScores: [],
        bestPracticesScores: [],
      };
    }

    return {
      dates: dashboardData.historicalData.map((entry) => new Date(entry.date).toLocaleDateString()),
      seoScores: dashboardData.historicalData.map((entry) => entry.averageScore),
      performanceScores: dashboardData.historicalData.map(
        (entry) => entry.avgPerformanceScore || 0
      ),
      accessibilityScores: dashboardData.historicalData.map(
        (entry) => entry.avgAccessibilityScore || 0
      ),
      bestPracticesScores: dashboardData.historicalData.map(
        (entry) => entry.avgBestPracticesScore || 0
      ),
    };
  }, [dashboardData.historicalData]);

  // Obtenir les scores moyens pour les différents critères de qualité
  const averageScores = useMemo(() => {
    return {
      seo: dashboardData.averageScore || 0,
      performance: dashboardData.performanceStats?.averageScore || 0,
      accessibility: dashboardData.accessibilityStats?.averageScore || 0,
      bestPractices: dashboardData.bestPracticesStats?.averageScore || 0,
    };
  }, [dashboardData]);

  // Préparation des recommandations pour l'onglet Recommandations
  const qualityIssues = useMemo(() => {
    const issues: Array<{
      category: 'seo' | 'performance' | 'accessibility' | 'bestPractices';
      message: string;
      impact: 'high' | 'medium' | 'low';
      solution?: string;
      documentation?: string;
    }> = [];

    // Ajouter les problèmes SEO
    Object.values(dashboardData.results).forEach((result) => {
      if (result.missingFields && result.missingFields.length > 0) {
        result.missingFields.forEach((field) => {
          const existingIssue = issues.find(
            (issue) => issue.category === 'seo' && issue.message === `Champ manquant: ${field}`
          );

          if (!existingIssue) {
            issues.push({
              category: 'seo',
              message: `Champ manquant: ${field}`,
              impact: 'high',
              solution: `Ajouter le champ "${field}" dans les fichiers concernés pour améliorer le référencement.`,
              documentation: `/docs/seo-fields/${field.toLowerCase().replace(/\s+/g, '-')}`,
            });
          }
        });
      }
    });

    // Ajouter les problèmes d'accessibilité
    Object.values(dashboardData.results).forEach((result) => {
      if (result.accessibilityIssues && result.accessibilityIssues.length > 0) {
        result.accessibilityIssues.forEach((issue) => {
          const existingIssue = issues.find(
            (i) => i.category === 'accessibility' && i.message === issue.message
          );

          if (!existingIssue) {
            issues.push({
              category: 'accessibility',
              message: issue.message,
              impact: issue.impact as any,
              solution: `Corriger l'élément ${
                issue.selector || 'concerné'
              } pour assurer une meilleure accessibilité.`,
              documentation: `/docs/accessibility/${issue.type
                ?.toLowerCase()
                .replace(/\s+/g, '-')}`,
            });
          }
        });
      }
    });

    // Ajouter les problèmes de performance
    Object.values(dashboardData.results).forEach((result) => {
      if (result.performanceMetrics) {
        if (
          result.performanceMetrics.largestContentfulPaint &&
          result.performanceMetrics.largestContentfulPaint > 2.5
        ) {
          const existingIssue = issues.find(
            (i) => i.category === 'performance' && i.message.includes('Largest Contentful Paint')
          );

          if (!existingIssue) {
            issues.push({
              category: 'performance',
              message: 'Largest Contentful Paint (LCP) trop élevé',
              impact: result.performanceMetrics.largestContentfulPaint > 4 ? 'high' : 'medium',
              solution:
                'Optimiser les images, utiliser le lazy loading, et améliorer le temps de chargement des ressources principales.',
              documentation: '/docs/performance/optimize-lcp',
            });
          }
        }

        if (
          result.performanceMetrics.cumulativeLayoutShift &&
          result.performanceMetrics.cumulativeLayoutShift > 0.1
        ) {
          const existingIssue = issues.find(
            (i) => i.category === 'performance' && i.message.includes('Cumulative Layout Shift')
          );

          if (!existingIssue) {
            issues.push({
              category: 'performance',
              message: 'Cumulative Layout Shift (CLS) trop élevé',
              impact: result.performanceMetrics.cumulativeLayoutShift > 0.25 ? 'high' : 'medium',
              solution:
                "Définir les dimensions des images et vidéos, éviter d'insérer du contenu dynamique au-dessus du contenu existant.",
              documentation: '/docs/performance/reduce-cls',
            });
          }
        }
      }
    });

    // Ajouter les problèmes de meilleures pratiques
    Object.values(dashboardData.results).forEach((result) => {
      if (result.bestPracticesIssues && result.bestPracticesIssues.length > 0) {
        result.bestPracticesIssues.forEach((issue) => {
          const existingIssue = issues.find(
            (i) => i.category === 'bestPractices' && i.message === issue.message
          );

          if (!existingIssue) {
            issues.push({
              category: 'bestPractices',
              message: issue.message,
              impact: issue.severity as any,
              solution: `Appliquer les meilleures pratiques pour la catégorie "${issue.category}".`,
              documentation: `/docs/best-practices/${issue.category
                ?.toLowerCase()
                .replace(/\s+/g, '-')}`,
            });
          }
        });
      }
    });

    // Tri par impact (criticité)
    return issues.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }, [dashboardData.results]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord des scores de qualité</h1>
        <div className="flex items-center">
          <div className="text-sm text-gray-600 mr-4">
            Dernière mise à jour: {new Date(dashboardData.lastUpdate).toLocaleString()}
          </div>
          <div className="relative">
            <QualityAlertNotification
              alerts={currentAlerts}
              onDismiss={handleDismissAlert}
              onDismissAll={handleDismissAllAlerts}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Score moyen</h2>
              <div className="flex items-end">
                <span
                  className={`text-4xl font-bold ${
                    dashboardData.averageScore >= 90
                      ? 'text-green-600'
                      : dashboardData.averageScore >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {Math.round(dashboardData.averageScore)}
                </span>
                <span className="text-lg text-gray-500 ml-1">/100</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Taux de réussite</h2>
              <div className="flex items-end">
                <span
                  className={`text-4xl font-bold ${
                    successRate >= 90
                      ? 'text-green-600'
                      : successRate >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {successRate}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Fichiers analysés</h2>
              <div className="text-4xl font-bold text-gray-800">
                {dashboardData.stats.totalFiles}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Statut des fichiers</h2>
              <div className="flex space-x-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.stats.passedFiles}
                  </div>
                  <div className="text-sm text-gray-500">Succès</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {dashboardData.stats.partialFiles}
                  </div>
                  <div className="text-sm text-gray-500">Partiel</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData.stats.failedFiles}
                  </div>
                  <div className="text-sm text-gray-500">Échec</div>
                </div>
              </div>
            </div>
          </div>

          {/* Nouvelle section avec le graphique radar */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Vue globale des scores</h2>
            <div className="flex flex-col md:flex-row items-center justify-around">
              <div className="md:w-1/2 flex justify-center">
                <RadarChart
                  seoScore={averageScores.seo}
                  performanceScore={averageScores.performance}
                  accessibilityScore={averageScores.accessibility}
                  bestPracticesScore={averageScores.bestPractices}
                  height={350}
                  width={350}
                />
              </div>
              <div className="md:w-1/2 mt-6 md:mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-sm font-medium text-gray-500">SEO</h3>
                    <div
                      className={`text-2xl font-bold ${
                        averageScores.seo >= 90
                          ? 'text-green-600'
                          : averageScores.seo >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {Math.round(averageScores.seo)}/100
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-sm font-medium text-gray-500">Performance</h3>
                    <div
                      className={`text-2xl font-bold ${
                        averageScores.performance >= 90
                          ? 'text-green-600'
                          : averageScores.performance >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {Math.round(averageScores.performance)}/100
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-sm font-medium text-gray-500">Accessibilité</h3>
                    <div
                      className={`text-2xl font-bold ${
                        averageScores.accessibility >= 90
                          ? 'text-green-600'
                          : averageScores.accessibility >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {Math.round(averageScores.accessibility)}/100
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-sm font-medium text-gray-500">Meilleures pratiques</h3>
                    <div
                      className={`text-2xl font-bold ${
                        averageScores.bestPractices >= 90
                          ? 'text-green-600'
                          : averageScores.bestPractices >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {Math.round(averageScores.bestPractices)}/100
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {dashboardData.historicalData && dashboardData.historicalData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Évolution récente</h2>
              <div className="h-64">
                {/* Intégrer un graphique ici */}
                <div className="flex h-full items-end space-x-2">
                  {dashboardData.historicalData.slice(-10).map((entry, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full ${getScoreColor(entry.averageScore)}`}
                        style={{ height: `${entry.averageScore}%` }}
                      />
                      <div className="text-xs mt-1 transform -rotate-45 origin-top-left">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {dashboardData.topIssues && dashboardData.topIssues.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Problèmes les plus fréquents</h2>
              <ul className="divide-y divide-gray-200">
                {dashboardData.topIssues.map((issue, index) => (
                  <li key={index} className="py-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{issue.issue}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {issue.count} fichiers
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Affecte: {issue.affectedFiles.slice(0, 3).join(', ')}
                      {issue.affectedFiles.length > 3 &&
                        ` et ${issue.affectedFiles.length - 3} autres`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Liste des fichiers */}
      {activeTab === 'files' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-xl font-semibold">Fichiers analysés</h2>
              <div className="mt-2 md:mt-0 flex space-x-2">
                <select
                  className="rounded border border-gray-300 px-3 py-1 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="success">Succès</option>
                  <option value="partial">Partiel</option>
                  <option value="failed">Échec</option>
                </select>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="rounded border border-gray-300 px-3 py-1 text-sm flex-grow md:flex-grow-0 md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredResults.length} fichiers sur {dashboardData.stats.totalFiles}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Liste des fichiers */}
            <div className="overflow-y-auto max-h-96 md:h-[32rem]">
              {filteredResults.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredResults.map(([filePath, result]) => (
                    <li
                      key={filePath}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedFile === filePath ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedFile(filePath)}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium truncate max-w-xs">{filePath}</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : result.status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.score}
                        </span>
                      </div>
                      {result.missingFields.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Champs manquants: {result.missingFields.length}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Aucun fichier ne correspond à vos critères de recherche
                </div>
              )}
            </div>

            {/* Détails du fichier sélectionné */}
            <div className="p-6 overflow-y-auto h-96 md:h-[32rem]">
              {selectedFileDetails ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedFile}</h3>
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-500 w-28">Score:</span>
                      <span
                        className={`font-semibold ${
                          selectedFileDetails.score >= 90
                            ? 'text-green-600'
                            : selectedFileDetails.score >= 70
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {selectedFileDetails.score}/100
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-500 w-28">Statut:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedFileDetails.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : selectedFileDetails.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedFileDetails.status === 'success'
                          ? 'Succès'
                          : selectedFileDetails.status === 'partial'
                            ? 'Partiel'
                            : 'Échec'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-28">Dernière analyse:</span>
                      <span className="text-sm">
                        {new Date(selectedFileDetails.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-2">Champs</h4>
                  <div className="mb-6">
                    <div className="mb-2">
                      <h5 className="text-sm font-medium text-gray-700">
                        Champs requis ({selectedFileDetails.requiredFields.length})
                      </h5>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedFileDetails.requiredFields.map((field) => (
                          <span
                            key={field}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              selectedFileDetails.completedFields.includes(field)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedFileDetails.optionalFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">
                          Champs optionnels ({selectedFileDetails.optionalFields.length})
                        </h5>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedFileDetails.optionalFields.map((field) => (
                            <span
                              key={field}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                selectedFileDetails.completedFields.includes(field)
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedFileDetails.history && selectedFileDetails.history.length > 0 && (
                    <>
                      <h4 className="font-medium text-gray-900 mb-2">Historique</h4>
                      <ul className="divide-y divide-gray-200">
                        {selectedFileDetails.history.map((entry, index) => (
                          <li key={index} className="py-2 flex justify-between">
                            <span className="text-sm text-gray-600">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                entry.score >= 90
                                  ? 'text-green-600'
                                  : entry.score >= 70
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {entry.score}/100 ({entry.status})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="mt-6 flex justify-end">
                    <Link
                      to={`/edit/${selectedFile}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Éditer ce fichier
                    </Link>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Sélectionnez un fichier pour voir les détails
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performances & Accessibilité */}
      {activeTab === 'performance' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Performance</h2>
              <div className="flex items-end">
                <span
                  className={`text-4xl font-bold ${
                    (dashboardData.performanceStats?.averageScore || 0) >= 90
                      ? 'text-green-600'
                      : (dashboardData.performanceStats?.averageScore || 0) >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {Math.round(dashboardData.performanceStats?.averageScore || 0)}
                </span>
                <span className="text-lg text-gray-500 ml-1">/100</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Sites performants:</span>
                  <span className="font-medium text-green-600">
                    {dashboardData.performanceStats?.goodPerformanceCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sites lents:</span>
                  <span className="font-medium text-red-600">
                    {dashboardData.performanceStats?.poorPerformanceCount || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Accessibilité</h2>
              <div className="flex items-end">
                <span
                  className={`text-4xl font-bold ${
                    (dashboardData.accessibilityStats?.averageScore || 0) >= 90
                      ? 'text-green-600'
                      : (dashboardData.accessibilityStats?.averageScore || 0) >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {Math.round(dashboardData.accessibilityStats?.averageScore || 0)}
                </span>
                <span className="text-lg text-gray-500 ml-1">/100</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Problèmes critiques:</span>
                  <span className="font-medium text-red-600">
                    {dashboardData.accessibilityStats?.criticalIssuesCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Problèmes sérieux:</span>
                  <span className="font-medium text-orange-500">
                    {dashboardData.accessibilityStats?.seriousIssuesCount || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Meilleures pratiques</h2>
              <div className="flex items-end">
                <span
                  className={`text-4xl font-bold ${
                    (dashboardData.bestPracticesStats?.averageScore || 0) >= 90
                      ? 'text-green-600'
                      : (dashboardData.bestPracticesStats?.averageScore || 0) >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {Math.round(dashboardData.bestPracticesStats?.averageScore || 0)}
                </span>
                <span className="text-lg text-gray-500 ml-1">/100</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Problèmes graves:</span>
                  <span className="font-medium text-red-600">
                    {dashboardData.bestPracticesStats?.highSeverityCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Problèmes moyens:</span>
                  <span className="font-medium text-yellow-600">
                    {dashboardData.bestPracticesStats?.mediumSeverityCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Métriques de performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Métriques de performance</h2>
              <div className="space-y-4">
                {Object.entries(filteredResults)
                  .slice(0, 5)
                  .map(
                    ([filePath, result]) =>
                      result.performanceMetrics && (
                        <div key={filePath} className="border-b pb-3">
                          <h3 className="font-medium mb-1 truncate">{filePath}</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">FCP: </span>
                              <span>
                                {result.performanceMetrics.firstContentfulPaint?.toFixed(1) ||
                                  'N/A'}{' '}
                                s
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">TTI: </span>
                              <span>
                                {result.performanceMetrics.timeToInteractive?.toFixed(1) || 'N/A'} s
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">LCP: </span>
                              <span>
                                {result.performanceMetrics.largestContentfulPaint?.toFixed(1) ||
                                  'N/A'}{' '}
                                s
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">CLS: </span>
                              <span>
                                {result.performanceMetrics.cumulativeLayoutShift?.toFixed(3) ||
                                  'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                  )}
              </div>
            </div>

            {/* Problèmes d'accessibilité */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Problèmes d'accessibilité</h2>
              <div className="space-y-2">
                {Object.entries(filteredResults)
                  .slice(0, 3)
                  .map(
                    ([filePath, result]) =>
                      result.accessibilityIssues &&
                      result.accessibilityIssues.length > 0 && (
                        <div key={filePath} className="border-b pb-3">
                          <h3 className="font-medium mb-1 truncate">{filePath}</h3>
                          <ul className="text-sm space-y-1">
                            {result.accessibilityIssues.slice(0, 3).map((issue, idx) => (
                              <li key={idx} className="flex">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0 ${
                                    issue.impact === 'critical'
                                      ? 'bg-red-500'
                                      : issue.impact === 'serious'
                                        ? 'bg-orange-500'
                                        : issue.impact === 'moderate'
                                          ? 'bg-yellow-500'
                                          : 'bg-blue-500'
                                  }`}
                                />
                                <span>{issue.message}</span>
                              </li>
                            ))}
                            {result.accessibilityIssues.length > 3 && (
                              <li className="text-sm text-gray-500">
                                + {result.accessibilityIssues.length - 3} autres problèmes
                              </li>
                            )}
                          </ul>
                        </div>
                      )
                  )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Meilleures pratiques à implémenter</h2>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Catégorie
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Message
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Sévérité
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(dashboardData.results)
                    .filter(
                      (result) =>
                        result.bestPracticesIssues && result.bestPracticesIssues.length > 0
                    )
                    .flatMap((result) => result.bestPracticesIssues)
                    .slice(0, 10)
                    .map((issue, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {issue.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{issue.message}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              issue.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : issue.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recommandations */}
      {activeTab === 'recommendations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recommandations d'amélioration</h2>
            <div>
              <button
                onClick={() => {
                  // Export des recommandations en format PDF ou CSV
                  alert('Export des recommandations en cours...');
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
              >
                Exporter
              </button>
            </div>
          </div>

          {qualityIssues.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Voici les recommandations pour améliorer la qualité de votre site sur les critères
                  SEO, performance, accessibilité et bonnes pratiques. Ces recommandations sont
                  classées par ordre de priorité et par catégorie.
                </p>
              </div>

              <QualityImprovementTips
                issues={qualityIssues}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Plan d'action recommandé</h3>

                <div className="bg-gray-50 p-4 rounded mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">1. Actions prioritaires</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {qualityIssues
                      .filter((issue) => issue.impact === 'high')
                      .slice(0, 3)
                      .map((issue, index) => (
                        <li key={index}>{issue.message}</li>
                      ))}
                    {qualityIssues.filter((issue) => issue.impact === 'high').length === 0 && (
                      <li className="text-green-600">Aucune action prioritaire détectée</li>
                    )}
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium text-gray-800 mb-2">2. Automatisation possible</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Certaines corrections peuvent être appliquées de manière automatique par le
                    système. Cliquez sur le bouton ci-dessous pour lancer le processus de correction
                    automatique.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    onClick={() => {
                      // Lancer le processus d'autofix
                      window.location.href = '/autofix';
                    }}
                  >
                    Lancer la correction automatique
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="inline-block p-3 rounded-full bg-green-100 text-green-600 mb-3">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tout est conforme !</h3>
              <p className="text-gray-500">
                Aucune recommandation n'a été détectée. Votre site suit déjà les meilleures
                pratiques.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Historique des scores de qualité</h2>

          {dashboardData.historicalData && dashboardData.historicalData.length > 0 ? (
            <div>
              {/* Nouveau graphique de tendances */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Évolution des scores de qualité</h3>
                <QualityTrendsChart
                  dates={historicalChartData.dates}
                  seoScores={historicalChartData.seoScores}
                  performanceScores={historicalChartData.performanceScores}
                  accessibilityScores={historicalChartData.accessibilityScores}
                  bestPracticesScores={historicalChartData.bestPracticesScores}
                  height={400}
                />
                <div className="text-sm text-gray-500 mt-2 text-center">
                  Tendances sur les {historicalChartData.dates.length} dernières analyses
                </div>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-6">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Score moyen
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Succès
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Partiel
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Échec
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {dashboardData.historicalData.map((entry, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`font-medium ${
                              entry.averageScore >= 90
                                ? 'text-green-600'
                                : entry.averageScore >= 70
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {Math.round(entry.averageScore)}/100
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600">
                          {entry.passedFiles}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-yellow-600">
                          {entry.partialFiles}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-red-600">
                          {entry.failedFiles}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-64">
                {/* Intégrer un graphique ici */}
                <div className="flex h-full items-end space-x-2">
                  {dashboardData.historicalData.slice(-20).map((entry, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full ${getScoreColor(entry.averageScore)}`}
                        style={{ height: `${entry.averageScore}%` }}
                      />
                      <div className="text-xs mt-1 transform -rotate-45 origin-top-left">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Aucune donnée historique disponible
            </div>
          )}
        </div>
      )}

      {/* Problèmes courants */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Problèmes courants</h2>

          {dashboardData.topIssues && dashboardData.topIssues.length > 0 ? (
            <div>
              {dashboardData.topIssues.map((issue, index) => (
                <div key={index} className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">{issue.issue}</h3>
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      {issue.count} fichiers affectés
                    </span>
                  </div>

                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Fichier
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Score
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {issue.affectedFiles.slice(0, 10).map((file, fileIndex) => (
                          <tr key={fileIndex}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {file}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span
                                className={`font-medium ${
                                  (dashboardData.results[file]?.score || 0) >= 90
                                    ? 'text-green-600'
                                    : (dashboardData.results[file]?.score || 0) >= 70
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {dashboardData.results[file]?.score || 0}/100
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <Link
                                to={`/edit/${file}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Éditer
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {issue.affectedFiles.length > 10 && (
                    <div className="mt-2 text-sm text-gray-500 text-right">
                      Et {issue.affectedFiles.length - 10} autres fichiers
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium mb-3">Remédiation automatique</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Les problèmes listés ci-dessus peuvent être corrigés automatiquement par notre
                  outil d'autofix. Cliquez sur le bouton ci-dessous pour lancer la correction
                  automatique des champs manquants.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      // Lien vers le processus d'autofix
                      window.location.href = '/autofix';
                    }}
                  >
                    Corriger automatiquement
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Aucun problème récurrent détecté</div>
          )}
        </div>
      )}
    </div>
  );
}

interface QualityData {
  averageScore: number;
  successRate: number;
  analyzedFiles: number;
  // Nouvelles métriques
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  files: {
    url: string;
    score: number;
    issues: number;
    // Nouvelles métriques par fichier
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
  }[];
  history: {
    date: string;
    score: number;
    // Historique des nouvelles métriques
    performanceScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
  }[];
  commonIssues: {
    issue: string;
    count: number;
    impact: 'high' | 'medium' | 'low';
    category?: 'seo' | 'performance' | 'accessibility' | 'bestPractices';
  }[];
}
