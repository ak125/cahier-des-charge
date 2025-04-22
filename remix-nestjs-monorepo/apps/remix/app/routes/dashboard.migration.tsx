import { json, useLoaderData, useSearchParams, Link } from '@remix-run/react';
import { LoaderFunction } from '@remix-run/node';
import { promises as fs } from 'fs';
import path from 'path';

interface BacklogItem {
  priority: number;
  status: 'pending' | 'done' | 'invalid' | 'in-progress';
  path: string;
  dependencies: string[];
  metadata: {
    routeType: string;
    isCritical: boolean;
    hasDatabase: boolean;
    hasAuthentication: boolean;
  };
}

interface Backlog {
  [key: string]: BacklogItem;
}

interface LoaderData {
  backlog: Backlog;
  stats: {
    total: number;
    done: number;
    pending: number;
    invalid: number;
    inProgress: number;
    percentageDone: number;
  };
}

// Statut possibles pour filtrer
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'done', label: 'Terminés' },
  { value: 'invalid', label: 'Invalides' },
  { value: 'in-progress', label: 'En cours' },
];

// Type de routes possibles pour filtrer
const ROUTE_TYPE_OPTIONS = [
  { value: 'all', label: 'Tous types' },
  { value: 'model', label: 'Modèles' },
  { value: 'auth', label: 'Authentification' },
  { value: 'listing', label: 'Listes' },
  { value: 'detail', label: 'Détails' },
  { value: 'form', label: 'Formulaires' },
  { value: 'static', label: 'Pages statiques' },
  { value: 'homepage', label: 'Accueil' },
  { value: 'cart', label: 'Panier' },
  { value: 'checkout', label: 'Commande' },
  { value: 'order', label: 'Commandes' },
];

// Fonction utilitaire pour déterminer la couleur de statut
function getStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'invalid':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

// Loader pour récupérer les données du backlog
export const loader: LoaderFunction = async () => {
  try {
    // Chemin absolu vers le fichier backlogDoDotmcp.json
    const backlogPath = path.resolve(process.cwd(), '../../backlogDoDotmcp.json');
    
    // Lecture du fichier backlog
    const backlogData = await fs.readFile(backlogPath, 'utf8');
    const backlog: Backlog = JSON.parse(backlogData);
    
    // Calcul des statistiques
    const total = Object.keys(backlog).length;
    const done = Object.values(backlog).filter(item => item.status === 'done').length;
    const pending = Object.values(backlog).filter(item => item.status === 'pending').length;
    const invalid = Object.values(backlog).filter(item => item.status === 'invalid').length;
    const inProgress = Object.values(backlog).filter(item => item.status === 'in-progress').length;
    
    return json<LoaderData>({
      backlog,
      stats: {
        total,
        done,
        pending,
        invalid,
        inProgress,
        percentageDone: total > 0 ? Math.round((done / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement du backlog:', error);
    throw new Error('Erreur lors du chargement du backlog');
  }
};

export default function MigrationDashboard() {
  const { backlog, stats } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Récupération des paramètres de recherche
  const status = searchParams.get('status') || 'all';
  const routeType = searchParams.get('routeType') || 'all';
  const sortBy = searchParams.get('sortBy') || 'priority';
  const sortDirection = searchParams.get('sortDirection') || 'desc';
  
  // Mise à jour des paramètres de recherche
  const updateSearchParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, value);
    setSearchParams(newParams);
  };
  
  // Filtrage du backlog selon les paramètres
  const filteredBacklog = Object.entries(backlog)
    .filter(([_, item]) => {
      if (status !== 'all' && item.status !== status) return false;
      if (routeType !== 'all' && item.metadata.routeType !== routeType) return false;
      return true;
    })
    // Tri des fichiers
    .sort(([fileNameA, itemA], [fileNameB, itemB]) => {
      let comparison = 0;
      
      if (sortBy === 'priority') {
        comparison = itemB.priority - itemA.priority; // Plus la priorité est haute, plus le nombre est grand
      } else if (sortBy === 'fileName') {
        comparison = fileNameA.localeCompare(fileNameB);
      } else if (sortBy === 'status') {
        comparison = itemA.status.localeCompare(itemB.status);
      } else if (sortBy === 'routeType') {
        comparison = itemA.metadata.routeType.localeCompare(itemB.metadata.routeType);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  
  // Fonction pour inverser la direction de tri
  const toggleSortDirection = (field: string) => {
    if (sortBy === field) {
      updateSearchParams('sortDirection', sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      updateSearchParams('sortBy', field);
      updateSearchParams('sortDirection', 'desc');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Migration PHP → Remix</h1>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total de fichiers</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-green-500">Terminés</div>
          <div className="text-2xl font-semibold">{stats.done} <span className="text-sm text-gray-400">({stats.percentageDone}%)</span></div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-500">En attente</div>
          <div className="text-2xl font-semibold">{stats.pending}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-blue-500">En cours</div>
          <div className="text-2xl font-semibold">{stats.inProgress}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-red-500">Invalides</div>
          <div className="text-2xl font-semibold">{stats.invalid}</div>
        </div>
      </div>
      
      {/* Barre de progression globale */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-8">
        <div 
          className="bg-green-500 h-4 rounded-full" 
          style={{ width: `${stats.percentageDone}%` }}
        />
      </div>
      
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            id="status"
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={status}
            onChange={(e) => updateSearchParams('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label htmlFor="routeType" className="block text-sm font-medium text-gray-700 mb-1">Type de route</label>
          <select
            id="routeType"
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={routeType}
            onChange={(e) => updateSearchParams('routeType', e.target.value)}
          >
            {ROUTE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Tableau des fichiers */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSortDirection('fileName')}
                >
                  Fichier {sortBy === 'fileName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSortDirection('priority')}
                >
                  Priorité {sortBy === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSortDirection('status')}
                >
                  Statut {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSortDirection('routeType')}
                >
                  Type {sortBy === 'routeType' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Critique
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DB
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auth
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBacklog.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucun fichier ne correspond aux filtres sélectionnés
                  </td>
                </tr>
              ) : (
                filteredBacklog.map(([fileName, item]) => (
                  <tr key={fileName} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.metadata.routeType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.metadata.isCritical ? '✅' : '❌'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.metadata.hasDatabase ? '✅' : '❌'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.metadata.hasAuthentication ? '✅' : '❌'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        onClick={() => {
                          window.open(`/terminal?command=pnpmDoDotmcp migrate ${fileName}`, '_blank');
                        }}
                      >
                        Migrer
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={() => {
                          window.open(`/terminal?command=pnpmDoDotmcp dry-run ${fileName}`, '_blank');
                        }}
                      >
                        Simuler
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}