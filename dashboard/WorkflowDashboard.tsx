import React, { useState, useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';
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
import { Pie, Line, Bar } from 'react-chartjs-2';

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

export default function WorkflowDashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowExecutions, setWorkflowExecutions] = useState([]);
  const [executionStats, setExecutionStats] = useState({
    successful: 0,
    failed: 0,
    running: 0
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      fetchWorkflowExecutions(selectedWorkflow.id);
    }
  }, [selectedWorkflow]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des workflows');
      }
      const data = await response.json();
      setWorkflows(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchWorkflowExecutions = async (workflowId) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/executions`);
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des exécutions du workflow ${workflowId}`);
      }
      const data = await response.json();
      setWorkflowExecutions(data);
      
      // Calculer les statistiques
      const stats = data.reduce((acc, execution) => {
        if (execution.status === 'success') acc.successful++;
        else if (execution.status === 'failed') acc.failed++;
        else if (execution.status === 'running') acc.running++;
        return acc;
      }, { successful: 0, failed: 0, running: 0 });
      
      setExecutionStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWorkflow = async (workflowId) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Erreur lors du basculement du workflow ${workflowId}`);
      }
      const updatedWorkflow = await response.json();
      
      // Mettre à jour l'état local des workflows
      setWorkflows(workflows.map(wf => 
        wf.id === workflowId ? { ...wf, active: updatedWorkflow.active } : wf
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const executeWorkflow = async (workflowId) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Erreur lors de l'exécution du workflow ${workflowId}`);
      }
      // Actualiser les exécutions après le lancement d'une nouvelle exécution
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        fetchWorkflowExecutions(workflowId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Préparation des données pour les graphiques
  const executionStatusData = {
    labels: ['Réussis', 'Échoués', 'En cours'],
    datasets: [
      {
        label: 'Statut des exécutions',
        data: [executionStats.successful, executionStats.failed, executionStats.running],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div className="p-4">Chargement des workflows...</div>;
  if (error) return <div className="p-4 text-red-600">Erreur: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Pilotage des Workflows</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Liste des Workflows</h2>
          <div className="space-y-2">
            {workflows.length === 0 ? (
              <p>Aucun workflow trouvé</p>
            ) : (
              workflows.map(workflow => (
                <div 
                  key={workflow.id} 
                  className={`p-3 border rounded cursor-pointer ${
                    selectedWorkflow?.id === workflow.id ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{workflow.name}</span>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.active ? 'Actif' : 'Inactif'}
                      </span>
                      <button
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          executeWorkflow(workflow.id);
                        }}
                      >
                        Exécuter
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWorkflow(workflow.id);
                        }}
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
        
        <div className="col-span-2 bg-white shadow rounded p-4">
          {selectedWorkflow ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Workflow: {selectedWorkflow.name}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">Statistiques d'exécution</h3>
                  <div style={{ height: '200px' }}>
                    <Pie data={executionStatusData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Exécutions récentes</h3>
                {workflowExecutions.length === 0 ? (
                  <p>Aucune exécution récente trouvée</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Démarré le</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terminé le</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workflowExecutions.map(execution => (
                          <tr key={execution.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{execution.id}</td>
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
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {execution.status === 'success' ? 'Réussi' :
                                execution.status === 'failed' ? 'Échoué' :
                                'En cours'}
                              </span>
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
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Sélectionnez un workflow pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}