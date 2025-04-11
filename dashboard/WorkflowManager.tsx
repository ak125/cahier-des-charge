import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import n8nService, { Workflow, WorkflowExecution } from './services/n8nService';

// Enregistrement des composants nécessaires pour ChartJS
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

const WorkflowManager: React.FC = () => {
  // États pour gérer les workflows et leurs exécutions
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowExecutions, setWorkflowExecutions] = useState<WorkflowExecution[]>([]);
  const [executionStats, setExecutionStats] = useState({
    successful: 0,
    failed: 0,
    running: 0,
    waiting: 0
  });
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // Rafraîchissement toutes les 30 secondes par défaut
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Récupérer la liste des workflows au chargement du composant
  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Rafraîchir les exécutions à intervalles réguliers si un workflow est sélectionné
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (selectedWorkflow && refreshInterval > 0) {
      intervalId = setInterval(() => {
        if (!isRefreshing) {
          fetchWorkflowExecutions(selectedWorkflow.id);
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedWorkflow, refreshInterval, isRefreshing]);

  // Récupérer les exécutions lorsqu'un workflow est sélectionné
  useEffect(() => {
    if (selectedWorkflow) {
      fetchWorkflowExecutions(selectedWorkflow.id);
    }
  }, [selectedWorkflow]);

  // Récupération de la liste des workflows
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await n8nService.getWorkflows();
      setWorkflows(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des workflows');
      setLoading(false);
    }
  };

  // Récupération des exécutions pour un workflow spécifique
  const fetchWorkflowExecutions = async (workflowId: string) => {
    try {
      setIsRefreshing(true);
      const data = await n8nService.getWorkflowExecutions(workflowId);
      setWorkflowExecutions(data);
      
      // Calculer les statistiques d'exécution
      const stats = data.reduce((acc, execution) => {
        if (execution.status === 'success') acc.successful++;
        else if (execution.status === 'failed') acc.failed++;
        else if (execution.status === 'running') acc.running++;
        else if (execution.status === 'waiting') acc.waiting++;
        return acc;
      }, { successful: 0, failed: 0, running: 0, waiting: 0 });
      
      setExecutionStats(stats);
      setIsRefreshing(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des exécutions :', err);
      setIsRefreshing(false);
    }
  };

  // Activer/désactiver un workflow
  const toggleWorkflow = async (workflowId: string) => {
    try {
      // Trouver le workflow actuel pour connaître son état
      const workflow = workflows.find(wf => wf.id === workflowId);
      if (!workflow) return;

      const updatedWorkflow = await n8nService.toggleWorkflowActive(
        workflowId, 
        !workflow.active
      );
      
      // Mettre à jour l'état local des workflows
      setWorkflows(workflows.map(wf => 
        wf.id === workflowId ? { ...wf, active: updatedWorkflow.active } : wf
      ));

      // Si le workflow sélectionné est celui qui a été modifié, mettre à jour selectedWorkflow
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        setSelectedWorkflow({ ...selectedWorkflow, active: updatedWorkflow.active });
      }
    } catch (err) {
      console.error('Erreur lors du basculement du workflow :', err);
    }
  };

  // Exécuter un workflow
  const executeWorkflow = async (workflowId: string) => {
    try {
      await n8nService.executeWorkflow(workflowId);
      
      // Actualiser les exécutions après le lancement d'une nouvelle exécution
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        // Petite temporisation pour laisser le temps à l'exécution de démarrer
        setTimeout(() => {
          fetchWorkflowExecutions(workflowId);
        }, 1000);
      }
    } catch (err) {
      console.error('Erreur lors de l\'exécution du workflow :', err);
    }
  };

  // Arrêter une exécution en cours
  const stopExecution = async (executionId: string) => {
    try {
      await n8nService.stopExecution(executionId);
      
      // Actualiser les exécutions après l'arrêt
      if (selectedWorkflow) {
        setTimeout(() => {
          fetchWorkflowExecutions(selectedWorkflow.id);
        }, 1000);
      }
    } catch (err) {
      console.error('Erreur lors de l\'arrêt de l\'exécution :', err);
    }
  };

  // Voir les détails d'une exécution
  const viewExecutionDetails = async (executionId: string) => {
    try {
      const executionDetails = await n8nService.getExecution(executionId);
      console.log('Détails de l\'exécution :', executionDetails);
      // Ici, vous pourriez ouvrir une modale pour afficher les détails
      // ou naviguer vers une page de détails dédiée
    } catch (err) {
      console.error('Erreur lors de la récupération des détails de l\'exécution :', err);
    }
  };

  // Changer l'intervalle de rafraîchissement
  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(Number(e.target.value));
  };

  // Préparation des données pour le graphique circulaire
  const executionStatusData = {
    labels: ['Réussis', 'Échoués', 'En cours', 'En attente'],
    datasets: [
      {
        label: 'Statut des exécutions',
        data: [
          executionStats.successful, 
          executionStats.failed, 
          executionStats.running,
          executionStats.waiting
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Affichage d'un message de chargement
  if (loading) return <div className="p-4">Chargement des workflows...</div>;
  
  // Affichage d'un message d'erreur
  if (error) return <div className="p-4 text-red-600">Erreur: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestionnaire de Workflows n8n</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => fetchWorkflows()} 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
          <div className="flex items-center">
            <label htmlFor="refresh-interval" className="mr-2 text-sm text-gray-600">
              Rafraîchir tous les:
            </label>
            <select 
              id="refresh-interval" 
              value={refreshInterval} 
              onChange={handleRefreshIntervalChange}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="0">Jamais</option>
              <option value="5000">5 secondes</option>
              <option value="10000">10 secondes</option>
              <option value="30000">30 secondes</option>
              <option value="60000">1 minute</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Liste des workflows */}
        <div className="col-span-1 bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Liste des Workflows</h2>
          <div className="space-y-2">
            {workflows.length === 0 ? (
              <p className="text-gray-500">Aucun workflow trouvé</p>
            ) : (
              workflows.map(workflow => (
                <div 
                  key={workflow.id} 
                  className={`p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedWorkflow?.id === workflow.id ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{workflow.name}</span>
                    <div className="flex space-x-2 ml-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.active ? 'Actif' : 'Inactif'}
                      </span>
                      <button
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          executeWorkflow(workflow.id);
                        }}
                        title="Exécuter ce workflow"
                      >
                        Exécuter
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded ${
                          workflow.active 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWorkflow(workflow.id);
                        }}
                        title={workflow.active ? "Désactiver ce workflow" : "Activer ce workflow"}
                      >
                        {workflow.active ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Détails du workflow et exécutions */}
        <div className="col-span-2 bg-white shadow rounded p-4">
          {selectedWorkflow ? (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Workflow: {selectedWorkflow.name}
                {isRefreshing && (
                  <span className="ml-2 inline-block animate-spin text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                )}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Détails du workflow */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">Détails</h3>
                  <p><span className="font-semibold">ID:</span> {selectedWorkflow.id}</p>
                  <p><span className="font-semibold">Créé le:</span> {new Date(selectedWorkflow.createdAt).toLocaleString()}</p>
                  <p><span className="font-semibold">Mis à jour le:</span> {new Date(selectedWorkflow.updatedAt).toLocaleString()}</p>
                  <p>
                    <span className="font-semibold">Statut:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      selectedWorkflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedWorkflow.active ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => executeWorkflow(selectedWorkflow.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                    >
                      Exécuter maintenant
                    </button>
                    <button
                      onClick={() => toggleWorkflow(selectedWorkflow.id)}
                      className={`px-3 py-1 rounded ${
                        selectedWorkflow.active 
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {selectedWorkflow.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
                
                {/* Statistiques d'exécution */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">Statistiques d'exécution</h3>
                  <div style={{ height: '200px' }}>
                    <Pie data={executionStatusData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
              
              {/* Tableau des exécutions récentes */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Exécutions récentes</h3>
                  <button
                    onClick={() => fetchWorkflowExecutions(selectedWorkflow.id)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                  >
                    Actualiser
                  </button>
                </div>
                {workflowExecutions.length === 0 ? (
                  <p className="text-gray-500">Aucune exécution récente trouvée</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Démarré le</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terminé le</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workflowExecutions.map(execution => (
                          <tr key={execution.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {execution.id.length > 8 ? execution.id.substring(0, 8) + '...' : execution.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(execution.startedAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {execution.finishedAt ? new Date(execution.finishedAt).toLocaleString() : 'En cours'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded ${
                                execution.status === 'success' ? 'bg-green-100 text-green-800' :
                                execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                                execution.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {execution.status === 'success' ? 'Réussi' :
                                execution.status === 'failed' ? 'Échoué' :
                                execution.status === 'waiting' ? 'En attente' :
                                'En cours'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => viewExecutionDetails(execution.id)}
                                className="text-blue-600 hover:text-blue-900 mr-2"
                                title="Voir les détails"
                              >
                                Détails
                              </button>
                              {(execution.status === 'running' || execution.status === 'waiting') && (
                                <button
                                  onClick={() => stopExecution(execution.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Arrêter l'exécution"
                                >
                                  Arrêter
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Sélectionnez un workflow pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;