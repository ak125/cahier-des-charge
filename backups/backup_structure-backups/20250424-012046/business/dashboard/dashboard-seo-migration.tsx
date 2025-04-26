import { json, type LoaderFunctionArgs } from @remix-run/nodestructure-agent";
import { useLoaderData, Link } from @remix-run/reactstructure-agent";
import { useEffect, useState, useMemo } from reactstructure-agent";
import fs from fsstructure-agent";
import path from pathstructure-agent";
import RadarChart from ./components/RadarChartstructure-agent";
import TrendChart from ./components/TrendChartstructure-agent";
import MigrationProgress from ./components/MigrationProgressstructure-agent";

/**
 * Dashboard de suivi de la migration SEO
 * Ce tableau de bord permet de visualiser l'état et les progrès de la migration SEO
 * en utilisant les données générées par les différentes stratégies d'analyse.
 */

type StrategyResult = {
  id: string;
  name: string;
  score: number;
  issuesCount: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  timestamp: string;
};

type PageMigrationStatus = {
  url: string;
  sourceUrl: string;
  migrationStatus: "completed" | "in_progress" | "failed" | "pending";
  seoScore: {
    before: number;
    after: number;
  };
  strategyResults: StrategyResult[];
  completedAt?: string;
  issuesCount: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
};

type MigrationHistoryEntry = {
  date: string;
  migratedPages: number;
  totalPages: number;
  averageSeoScore: number;
  strategyScores: Record<string, number>;
};

type SeoMigrationData = {
  summary: {
    totalPages: number;
    migratedPages: number;
    pendingPages: number;
    failedPages: number;
    averageSeoScore: number;
    completionPercentage: number;
    startDate: string;
    lastUpdate: string;
    estimatedCompletionDate?: string;
  };
  pages: PageMigrationStatus[];
  history: MigrationHistoryEntry[];
  strategyPerformance: {
    id: string;
    name: string;
    averageScore: number;
    trend: "up" | "down" | "stable";
    issuesFixed: number;
    issuesRemaining: number;
  }[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Chemins des fichiers de données
  const seoMigrationDataPath = path.resolve('./reports/seo-migration-data.json');
  
  // Initialiser les données par défaut
  let migrationData: SeoMigrationData = {
    summary: {
      totalPages: 0,
      migratedPages: 0,
      pendingPages: 0,
      failedPages: 0,
      averageSeoScore: 0,
      completionPercentage: 0,
      startDate: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    },
    pages: [],
    history: [],
    strategyPerformance: []
  };
  
  try {
    // Récupérer les données de migration SEO si le fichier existe
    if (fs.existsSync(seoMigrationDataPath)) {
      migrationData = JSON.parse(fs.readFileSync(seoMigrationDataPath, 'utf8'));
    } else {
      // Si le fichier n'existe pas, générer des données de démonstration
      migrationData = generateDemoData();
    }
  } catch (error) {
    console.error("Erreur lors du chargement des données de migration SEO:", error);
  }

  return json({ migrationData });
}

/**
 * Génère des données de démonstration pour le tableau de bord
 */
function generateDemoData(): SeoMigrationData {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 3);
  
  const totalPages = 120;
  const migratedPages = 68;
  const failedPages = 12;
  const pendingPages = totalPages - migratedPages - failedPages;
  const averageSeoScore = 78;
  
  // Générer l'historique des 12 dernières semaines
  const history: MigrationHistoryEntry[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 7));
    
    const weekProgress = Math.min(1, (12 - i) / 12); // Plus récent = plus de progrès
    const weekMigratedPages = Math.floor(migratedPages * weekProgress);
    const weekScore = 60 + Math.floor((averageSeoScore - 60) * weekProgress);
    
    history.push({
      date: date.toISOString(),
      migratedPages: weekMigratedPages,
      totalPages,
      averageSeoScore: weekScore,
      strategyScores: {
        "meta-tags-analyzer": 50 + Math.floor((85 - 50) * weekProgress),
        "links-analyzer": 45 + Math.floor((75 - 45) * weekProgress),
        "content-quality-analyzer": 65 + Math.floor((80 - 65) * weekProgress),
        "mobile-friendliness-analyzer": 70 + Math.floor((85 - 70) * weekProgress)
      }
    });
  }
  
  // Trier l'historique par date (le plus ancien en premier)
  history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Générer les performances par stratégie
  const strategyPerformance = [
    {
      id: "meta-tags-analyzer",
      name: "Analyse des balises meta",
      averageScore: 85,
      trend: "up" as const,
      issuesFixed: 156,
      issuesRemaining: 34
    },
    {
      id: "links-analyzer",
      name: "Analyse des liens",
      averageScore: 75,
      trend: "up" as const,
      issuesFixed: 92,
      issuesRemaining: 45
    },
    {
      id: "content-quality-analyzer",
      name: "Qualité du contenu",
      averageScore: 80,
      trend: "stable" as const,
      issuesFixed: 108,
      issuesRemaining: 67
    },
    {
      id: "mobile-friendliness-analyzer",
      name: "Compatibilité mobile",
      averageScore: 85,
      trend: "up" as const,
      issuesFixed: 73,
      issuesRemaining: 12
    },
    {
      id: "performance-analyzer",
      name: "Performance",
      averageScore: 65,
      trend: "down" as const,
      issuesFixed: 41,
      issuesRemaining: 89
    }
  ];
  
  // Générer des pages d'exemple
  const pages: PageMigrationStatus[] = [];
  const statuses: ("completed" | "in_progress" | "failed" | "pending")[] = [
    "completed", "completed", "completed", "in_progress", "failed", "pending"
  ];
  
  for (let i = 0; i < 50; i++) {
    const status = statuses[i % statuses.length];
    const sourceUrl = `/legacy/page-${i + 1}.php`;
    const url = `/page-${i + 1}`;
    
    const scoreBefore = 40 + Math.floor(Math.random() * 20);
    const scoreAfter = status === "completed" 
      ? 70 + Math.floor(Math.random() * 25) 
      : status === "in_progress" 
        ? 50 + Math.floor(Math.random() * 20)
        : scoreBefore;
    
    const criticalIssues = status === "completed" ? 0 : Math.floor(Math.random() * 3);
    const warningIssues = status === "completed" 
      ? Math.floor(Math.random() * 5) 
      : 3 + Math.floor(Math.random() * 5);
    const infoIssues = 2 + Math.floor(Math.random() * 8);
    
    pages.push({
      url,
      sourceUrl,
      migrationStatus: status,
      seoScore: {
        before: scoreBefore,
        after: scoreAfter
      },
      strategyResults: strategyPerformance.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        score: status === "completed" 
          ? strategy.averageScore + Math.floor(Math.random() * 15) - 7 
          : Math.floor(strategy.averageScore * 0.7),
        issuesCount: {
          total: criticalIssues + warningIssues + infoIssues,
          critical: criticalIssues,
          warning: warningIssues,
          info: infoIssues
        },
        timestamp: today.toISOString()
      })),
      completedAt: status === "completed" ? new Date(today.getTime() - Math.random() * 7776000000).toISOString() : undefined,
      issuesCount: {
        total: criticalIssues + warningIssues + infoIssues,
        critical: criticalIssues,
        warning: warningIssues,
        info: infoIssues
      }
    });
  }
  
  return {
    summary: {
      totalPages,
      migratedPages,
      pendingPages,
      failedPages,
      averageSeoScore,
      completionPercentage: Math.floor((migratedPages / totalPages) * 100),
      startDate: startDate.toISOString(),
      lastUpdate: today.toISOString(),
      estimatedCompletionDate: new Date(today.getTime() + 7776000000).toISOString()
    },
    pages,
    history,
    strategyPerformance
  };
}

const StatusBadge = ({ status }: { status: string }) => {
  let color;
  let text;

  switch (status) {
    case "completed":
      color = "bg-green-100 text-green-800";
      text = "Terminé";
      break;
    case "in_progress":
      color = "bg-blue-100 text-blue-800";
      text = "En cours";
      break;
    case "failed":
      color = "bg-red-100 text-red-800";
      text = "Échec";
      break;
    case "pending":
      color = "bg-gray-100 text-gray-800";
      text = "En attente";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
      text = status;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {text}
    </span>
  );
};

const ScoreBadge = ({ score }: { score: number }) => {
  let color;
  
  if (score >= 90) {
    color = "bg-green-100 text-green-800";
  } else if (score >= 70) {
    color = "bg-yellow-100 text-yellow-800";
  } else if (score >= 50) {
    color = "bg-orange-100 text-orange-800";
  } else {
    color = "bg-red-100 text-red-800";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {score}
    </span>
  );
};

export default function DashboardSeoMigration() {
  const { migrationData } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtrer les pages en fonction du statut et du terme de recherche
  const filteredPages = useMemo(() => {
    return migrationData.pages.filter(page => {
      const matchesStatus = filterStatus === "all" || page.migrationStatus === filterStatus;
      const matchesSearch = searchTerm === "" || 
                           page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [migrationData.pages, filterStatus, searchTerm]);
  
  // Obtenir les détails de la page sélectionnée
  const selectedPageDetails = useMemo(() => {
    if (!selectedPage) return null;
    return migrationData.pages.find(page => page.url === selectedPage);
  }, [selectedPage, migrationData.pages]);
  
  // Calculer les données pour le graphique radar des stratégies
  const strategyRadarData = useMemo(() => {
    const labels = migrationData.strategyPerformance.map(s => s.name);
    const scores = migrationData.strategyPerformance.map(s => s.averageScore);
    return { labels, scores };
  }, [migrationData.strategyPerformance]);
  
  // Préparer les données pour le graphique de tendance
  const trendData = useMemo(() => {
    return {
      labels: migrationData.history.map(h => {
        const date = new Date(h.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: "Score SEO moyen",
          data: migrationData.history.map(h => h.averageSeoScore),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
        }
      ]
    };
  }, [migrationData.history]);
  
  // Préparer les données du graphique d'avancement
  const progressData = useMemo(() => {
    return {
      completed: migrationData.summary.migratedPages,
      inProgress: migrationData.summary.pendingPages,
      failed: migrationData.summary.failedPages,
      total: migrationData.summary.totalPages
    };
  }, [migrationData.summary]);
  
  // Obtenir les 5 pages avec les meilleurs scores et les 5 pages avec les pires scores
  const topAndBottomPages = useMemo(() => {
    const completedPages = migrationData.pages
      .filter(page => page.migrationStatus === "completed")
      .sort((a, b) => b.seoScore.after - a.seoScore.after);
    
    return {
      top: completedPages.slice(0, 5),
      bottom: [...completedPages].reverse().slice(0, 5)
    };
  }, [migrationData.pages]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord de migration SEO</h1>
        <div className="text-sm text-gray-600">
          Dernière mise à jour: {new Date(migrationData.summary.lastUpdate).toLocaleString()}
        </div>
      </div>
      
      {/* Onglets */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'pages' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('pages')}
        >
          Pages
        </button>
        <button
          className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'strategies' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('strategies')}
        >
          Stratégies
        </button>
        <button
          className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('history')}
        >
          Historique
        </button>
      </div>
      
      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Pages migrées</h2>
              <div className="flex items-end">
                <span className="text-4xl font-bold text-blue-600">
                  {migrationData.summary.migratedPages}
                </span>
                <span className="text-lg text-gray-500 ml-2">/ {migrationData.summary.totalPages}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: `${migrationData.summary.completionPercentage}%` }}
                ></div>
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {migrationData.summary.completionPercentage}% terminé
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Score SEO moyen</h2>
              <div className="flex items-end">
                <span className={`text-4xl font-bold ${
                  migrationData.summary.averageSeoScore >= 90 ? 'text-green-600' : 
                  migrationData.summary.averageSeoScore >= 70 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {migrationData.summary.averageSeoScore}
                </span>
                <span className="text-lg text-gray-500 ml-1">/100</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Pages en échec</h2>
              <div className="text-4xl font-bold text-red-600">
                {migrationData.summary.failedPages}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {Math.round((migrationData.summary.failedPages / migrationData.summary.totalPages) * 100)}% des pages
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Date estimée de fin</h2>
              <div className="text-xl font-medium text-gray-800">
                {migrationData.summary.estimatedCompletionDate ? 
                  new Date(migrationData.summary.estimatedCompletionDate).toLocaleDateString() : 
                  'Non disponible'}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Démarré le {new Date(migrationData.summary.startDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Avancement de la migration</h2>
              <MigrationProgress
                completed={progressData.completed}
                inProgress={progressData.inProgress}
                failed={progressData.failed}
                total={progressData.total}
                height={250}
              />
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Scores par stratégie</h2>
              <div className="flex justify-center">
                <RadarChart
                  labels={strategyRadarData.labels}
                  datasets={[
                    {
                      label: "Score moyen",
                      data: strategyRadarData.scores,
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      borderColor: "rgba(59, 130, 246, 1)"
                    }
                  ]}
                  height={250}
                  width={300}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Évolution du score SEO</h2>
            <TrendChart
              labels={trendData.labels}
              datasets={trendData.datasets}
              height={300}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Top 5 des meilleures pages</h2>
              <ul className="divide-y divide-gray-200">
                {topAndBottomPages.top.map((page, index) => (
                  <li key={index} className="py-3">
                    <div className="flex justify-between">
                      <Link to={`/dashboard/seo/page?url=${encodeURIComponent(page.url)}`} className="text-blue-600 hover:underline truncate max-w-xs">
                        {page.url}
                      </Link>
                      <ScoreBadge score={page.seoScore.after} />
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <span>Avant: <ScoreBadge score={page.seoScore.before} /></span>
                      <span className="mx-1">→</span>
                      <span>Après: <ScoreBadge score={page.seoScore.after} /></span>
                      <span className="ml-2 text-green-600">+{page.seoScore.after - page.seoScore.before}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Top 5 des pages à améliorer</h2>
              <ul className="divide-y divide-gray-200">
                {topAndBottomPages.bottom.map((page, index) => (
                  <li key={index} className="py-3">
                    <div className="flex justify-between">
                      <Link to={`/dashboard/seo/page?url=${encodeURIComponent(page.url)}`} className="text-blue-600 hover:underline truncate max-w-xs">
                        {page.url}
                      </Link>
                      <ScoreBadge score={page.seoScore.after} />
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <span>Problèmes critiques: {page.issuesCount.critical}</span>
                      <span className="mx-2">•</span>
                      <span>Avertissements: {page.issuesCount.warning}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Pages */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-xl font-semibold">Pages migrées</h2>
              <div className="mt-2 md:mt-0 flex space-x-2">
                <select 
                  className="rounded border border-gray-300 px-3 py-1 text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="completed">Terminé</option>
                  <option value="in_progress">En cours</option>
                  <option value="failed">Échec</option>
                  <option value="pending">En attente</option>
                </select>
                <input 
                  type="text"
                  placeholder="Rechercher..." 
                  className="rounded border border-gray-300 px-3 py-1 text-sm flex-grow md:flex-grow-0 md:w-64"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredPages.length} pages sur {migrationData.summary.totalPages}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Liste des pages */}
            <div className="overflow-y-auto max-h-96 md:h-[36rem]">
              {filteredPages.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredPages.map((page, index) => (
                    <li 
                      key={index}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedPage === page.url ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedPage(page.url)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{page.url}</div>
                          <div className="text-sm text-gray-500 truncate">Source: {page.sourceUrl}</div>
                        </div>
                        <StatusBadge status={page.migrationStatus} />
                      </div>
                      <div className="mt-2 flex items-center">
                        <div className="text-xs text-gray-500">Score SEO:</div>
                        <div className="ml-2 flex items-center">
                          <ScoreBadge score={page.seoScore.before} />
                          <svg className="h-4 w-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <ScoreBadge score={page.seoScore.after} />
                        </div>
                        {page.seoScore.after > page.seoScore.before && (
                          <span className="text-xs text-green-600 ml-2">
                            +{page.seoScore.after - page.seoScore.before}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Aucune page ne correspond à vos critères de recherche
                </div>
              )}
            </div>
            
            {/* Détails de la page sélectionnée */}
            <div className="p-6 overflow-y-auto h-96 md:h-[36rem]">
              {selectedPageDetails ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedPageDetails.url}</h3>
                  <div className="mb-4 text-sm text-gray-500">Source: {selectedPageDetails.sourceUrl}</div>
                  
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-500 w-28">Statut:</span>
                      <StatusBadge status={selectedPageDetails.migrationStatus} />
                    </div>
                    {selectedPageDetails.completedAt && (
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-500 w-28">Terminé le:</span>
                        <span className="text-sm">{new Date(selectedPageDetails.completedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-500 w-28">Score avant:</span>
                      <ScoreBadge score={selectedPageDetails.seoScore.before} />
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-500 w-28">Score après:</span>
                      <ScoreBadge score={selectedPageDetails.seoScore.after} />
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-28">Amélioration:</span>
                      <span className={`text-sm font-medium ${
                        selectedPageDetails.seoScore.after > selectedPageDetails.seoScore.before ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedPageDetails.seoScore.after - selectedPageDetails.seoScore.before > 0 ? '+' : ''}
                        {selectedPageDetails.seoScore.after - selectedPageDetails.seoScore.before}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">Problèmes</h4>
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-red-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Critiques</div>
                        <div className="text-lg font-medium text-red-600">{selectedPageDetails.issuesCount.critical}</div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Avertissements</div>
                        <div className="text-lg font-medium text-yellow-600">{selectedPageDetails.issuesCount.warning}</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Informations</div>
                        <div className="text-lg font-medium text-blue-600">{selectedPageDetails.issuesCount.info}</div>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">Scores par stratégie</h4>
                  <ul className="mb-6 space-y-2">
                    {selectedPageDetails.strategyResults.map((result, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="text-sm">{result.name}</span>
                        <ScoreBadge score={result.score} />
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 flex justify-end">
                    <Link
                      to={`/dashboard/seo/page?url=${encodeURIComponent(selectedPageDetails.url)}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Sélectionnez une page pour voir les détails
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Stratégies */}
      {activeTab === 'strategies' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Performance des stratégies</h2>
              <div className="flex justify-center">
                <RadarChart
                  labels={strategyRadarData.labels}
                  datasets={[
                    {
                      label: "Score moyen",
                      data: strategyRadarData.scores,
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      borderColor: "rgba(59, 130, 246, 1)"
                    }
                  ]}
                  height={300}
                  width={350}
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Progression des problèmes résolus</h2>
              <ul className="divide-y divide-gray-200">
                {migrationData.strategyPerformance.map((strategy, index) => (
                  <li key={index} className="py-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                      <ScoreBadge score={strategy.averageScore} />
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {Math.round((strategy.issuesFixed / (strategy.issuesFixed + strategy.issuesRemaining)) * 100)}%
                          </span>
                        </div>
                        <div className="text-xs font-semibold inline-block text-gray-600">
                          {strategy.issuesFixed} sur {strategy.issuesFixed + strategy.issuesRemaining} problèmes résolus
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-blue-200">
                        <div style={{ width: `${Math.round((strategy.issuesFixed / (strategy.issuesFixed + strategy.issuesRemaining)) * 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <span className={`inline-flex items-center ${
                        strategy.trend === 'up' ? 'text-green-600' : 
                        strategy.trend === 'down' ? 'text-red-600' : 
                        'text-yellow-600'
                      }`}>
                        {strategy.trend === 'up' ? (
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : strategy.trend === 'down' ? (
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                          </svg>
                        )}
                        {strategy.trend === 'up' ? 'En amélioration' : 
                         strategy.trend === 'down' ? 'En détérioration' : 
                         'Stable'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Évolution des stratégies</h2>
            <TrendChart
              labels={migrationData.history.map(h => {
                const date = new Date(h.date);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              })}
              datasets={Object.keys(migrationData.history[0]?.strategyScores || {}).map((strategyId, index) => {
                const colors = [
                  { bg: "rgba(59, 130, 246, 0.2)", border: "rgba(59, 130, 246, 1)" },
                  { bg: "rgba(16, 185, 129, 0.2)", border: "rgba(16, 185, 129, 1)" },
                  { bg: "rgba(245, 158, 11, 0.2)", border: "rgba(245, 158, 11, 1)" },
                  { bg: "rgba(239, 68, 68, 0.2)", border: "rgba(239, 68, 68, 1)" },
                  { bg: "rgba(139, 92, 246, 0.2)", border: "rgba(139, 92, 246, 1)" },
                ];
                const color = colors[index % colors.length];
                
                const strategyName = migrationData.strategyPerformance.find(s => s.id === strategyId)?.name || strategyId;
                
                return {
                  label: strategyName,
                  data: migrationData.history.map(h => h.strategyScores[strategyId] || 0),
                  borderColor: color.border,
                  backgroundColor: color.bg,
                };
              })}
              height={400}
            />
          </div>
        </div>
      )}
      
      {/* Historique */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Historique de la migration SEO</h2>
          
          <div className="mb-8">
            <TrendChart
              labels={migrationData.history.map(h => {
                const date = new Date(h.date);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              })}
              datasets={[
                {
                  label: "Score SEO moyen",
                  data: migrationData.history.map(h => h.averageSeoScore),
                  borderColor: "#3b82f6",
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                },
                {
                  label: "Pages migrées",
                  data: migrationData.history.map(h => h.migratedPages),
                  borderColor: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  yAxisID: 'y1'
                }
              ]}
              height={300}
              showSecondYAxis={true}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pages migrées</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score SEO moyen</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {migrationData.history.slice().reverse().map((entry, index) => {
                  const prevEntry = index < migrationData.history.length - 1
                    ? migrationData.history[migrationData.history.length - index - 2]
                    : null;
                  
                  const pageDiff = prevEntry ? entry.migratedPages - prevEntry.migratedPages : entry.migratedPages;
                  const scoreDiff = prevEntry ? entry.averageSeoScore - prevEntry.averageSeoScore : 0;
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.migratedPages} / {entry.totalPages}
                        {pageDiff > 0 && (
                          <span className="ml-2 text-green-600">+{pageDiff}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <ScoreBadge score={entry.averageSeoScore} />
                        {scoreDiff !== 0 && (
                          <span className={`ml-2 ${scoreDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round((entry.migratedPages / entry.totalPages) * 100)}%
                        <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-2 bg-blue-600 rounded-full"
                            style={{ width: `${Math.round((entry.migratedPages / entry.totalPages) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}