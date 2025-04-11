/**
 * migration-dashboard.tsx
 * 
 * Tableau de bord Remix pour visualiser et gérer les plans de migration
 * Permet de suivre l'avancement, filtrer les fichiers par priorité,
 * et visualiser les dépendances.
 */

import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link, NavLink, Outlet, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Types pour les données du plan de migration
interface MigrationPlan {
  id: string;
  fileName: string;
  filePath: string;
  wave: number;
  score: number;
  type: string;
  priority: string;
  status: string;
  tasks: string[];
  createdAt: string;
  updatedAt: string;
  progress?: number;
}

// Fonction pour récupérer les données depuis Supabase
export const loader: LoaderFunction = async () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
  const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-key';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Récupérer les plans de migration
    const { data: migrationPlans, error } = await supabase
      .from('migration_plans')
      .select('*')
      .order('updatedAt', { ascending: false });
    
    if (error) throw error;
    
    // Récupérer les statistiques
    const { data: stats, error: statsError } = await supabase
      .from('migration_stats')
      .select('*')
      .single();
    
    if (statsError && statsError.code !== 'PGRST116') throw statsError;
    
    return json({
      migrationPlans: migrationPlans || [],
      stats: stats || {
        totalFiles: migrationPlans?.length || 0,
        pendingFiles: migrationPlans?.filter(p => p.status === 'pending').length || 0,
        inProgressFiles: migrationPlans?.filter(p => p.status === 'in-progress').length || 0,
        completedFiles: migrationPlans?.filter(p => p.status === 'completed').length || 0,
        highPriorityFiles: migrationPlans?.filter(p => p.priority === 'high').length || 0,
        mediumPriorityFiles: migrationPlans?.filter(p => p.priority === 'medium').length || 0,
        lowPriorityFiles: migrationPlans?.filter(p => p.priority === 'low').length || 0,
        waveDistribution: [
          migrationPlans?.filter(p => p.wave === 1).length || 0,
          migrationPlans?.filter(p => p.wave === 2).length || 0,
          migrationPlans?.filter(p => p.wave === 3).length || 0
        ]
      }
    });
  } catch (error) {
    console.error('Error loading data:', error);
    return json({ 
      migrationPlans: [], 
      stats: {
        totalFiles: 0,
        pendingFiles: 0,
        inProgressFiles: 0,
        completedFiles: 0,
        highPriorityFiles: 0,
        mediumPriorityFiles: 0,
        lowPriorityFiles: 0,
        waveDistribution: [0, 0, 0]
      },
      error: 'Failed to load migration data' 
    });
  }
};

// Composant principal du tableau de bord
export default function MigrationDashboard() {
  const { migrationPlans, stats } = useLoaderData<{
    migrationPlans: MigrationPlan[];
    stats: {
      totalFiles: number;
      pendingFiles: number;
      inProgressFiles: number;
      completedFiles: number;
      highPriorityFiles: number;
      mediumPriorityFiles: number;
      lowPriorityFiles: number;
      waveDistribution: number[];
    };
  }>();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredPlans, setFilteredPlans] = useState<MigrationPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filterWave, setFilterWave] = useState(searchParams.get('wave') || 'all');
  const [filterPriority, setFilterPriority] = useState(searchParams.get('priority') || 'all');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  
  // Filtrer les plans de migration en fonction des critères
  useEffect(() => {
    let filtered = [...migrationPlans];
    
    if (searchTerm) {
      filtered = filtered.filter(plan => 
        plan.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.filePath.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterWave !== 'all') {
      filtered = filtered.filter(plan => plan.wave.toString() === filterWave);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(plan => plan.priority === filterPriority);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(plan => plan.status === filterStatus);
    }
    
    setFilteredPlans(filtered);
    
    // Mettre à jour l'URL avec les filtres
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (filterWave !== 'all') params.set('wave', filterWave);
    if (filterPriority !== 'all') params.set('priority', filterPriority);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    
    setSearchParams(params);
  }, [migrationPlans, searchTerm, filterWave, filterPriority, filterStatus, setSearchParams]);
  
  // Préparer les données pour les graphiques
  const statusData = {
    labels: ['En attente', 'En cours', 'Terminé'],
    datasets: [
      {
        label: 'État des fichiers',
        data: [stats.pendingFiles, stats.inProgressFiles, stats.completedFiles],
        backgroundColor: [
          'rgba(255, 206, 86, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const priorityData = {
    labels: ['Haute', 'Moyenne', 'Basse'],
    datasets: [
      {
        label: 'Priorité des fichiers',
        data: [stats.highPriorityFiles, stats.mediumPriorityFiles, stats.lowPriorityFiles],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const waveData = {
    labels: ['Vague 1', 'Vague 2', 'Vague 3'],
    datasets: [
      {
        label: 'Fichiers par vague',
        data: stats.waveDistribution,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Options pour le graphique de vagues
  const waveOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution par vague de migration',
      },
    },
  };
  
  // Calculer la progression globale
  const overallProgress = stats.totalFiles > 0 
    ? ((stats.inProgressFiles * 0.5 + stats.completedFiles) / stats.totalFiles) * 100 
    : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord de migration PHP → NestJS/Remix</h1>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Total des fichiers</h2>
          <p className="text-3xl font-bold">{stats.totalFiles}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Progression globale</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div 
              className="bg-blue-600 h-4 rounded-full" 
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <p className="text-right mt-1">{Math.round(overallProgress)}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Haute priorité</h2>
          <p className="text-3xl font-bold text-red-500">{stats.highPriorityFiles}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Fichiers terminés</h2>
          <p className="text-3xl font-bold text-green-500">{stats.completedFiles}</p>
        </div>
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">État des fichiers</h2>
          <Pie data={statusData} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Priorité des fichiers</h2>
          <Pie data={priorityData} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Vagues de migration</h2>
          <Bar data={waveData} options={waveOptions} />
        </div>
      </div>
      
      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <input
              type="text"
              id="search"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Nom ou chemin du fichier"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="wave" className="block text-sm font-medium text-gray-700 mb-1">
              Vague
            </label>
            <select
              id="wave"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filterWave}
              onChange={(e) => setFilterWave(e.target.value)}
            >
              <option value="all">Toutes les vagues</option>
              <option value="1">Vague 1</option>
              <option value="2">Vague 2</option>
              <option value="3">Vague 3</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priorité
            </label>
            <select
              id="priority"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">Toutes les priorités</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              État
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les états</option>
              <option value="pending">En attente</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Liste des fichiers */}
      <div className="bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-700 p-6 border-b">
          Fichiers à migrer {filteredPlans.length > 0 && `(${filteredPlans.length})`}
        </h2>
        
        {filteredPlans.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun fichier ne correspond aux critères de filtrage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vague
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    État
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {plan.fileName}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {plan.filePath}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{plan.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.wave === 1 ? 'bg-green-100 text-green-800' :
                        plan.wave === 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Vague {plan.wave}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.priority === 'high' ? 'bg-red-100 text-red-800' :
                        plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {plan.priority === 'high' ? 'Haute' :
                         plan.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                        plan.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {plan.status === 'pending' ? 'En attente' :
                         plan.status === 'in-progress' ? 'En cours' : 'Terminé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            plan.status === 'completed' ? 'bg-green-600' :
                            plan.status === 'in-progress' ? 'bg-blue-600' : 'bg-gray-400'
                          }`}
                          style={{ width: `${plan.status === 'completed' ? 100 : plan.status === 'in-progress' ? (plan.progress || 50) : 0}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/migration-plan/${plan.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Détails
                      </Link>
                      <Link 
                        to={`/migration-plan/${plan.id}/update`} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Éditer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}