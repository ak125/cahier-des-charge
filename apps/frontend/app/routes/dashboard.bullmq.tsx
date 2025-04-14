import { json } from "@remix-run/node";
import { useLoaderData, useRevalidator, Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import axios from "axios";

// Types pour les statistiques et jobs BullMQ
type QueueStats = {
  queueName: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  };
  timestamp: string;
};

type AllQueuesStats = {
  queues: QueueStats[];
  totals: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  };
  timestamp: string;
};

// Fonction loader pour charger les statistiques initiales
export async function loader() {
  const apiUrl = process.env.MCP_API_URL || "http://localhost:3030/api";
  try {
    const response = await axios.get(`${apiUrl}/jobs/stats`);
    return json({
      stats: response.data,
      apiUrl,
      error: null
    });
  } catch (error) {
    console.error("Erreur lors du chargement des statistiques:", error);
    return json({
      stats: null,
      apiUrl,
      error: "Impossible de charger les statistiques. Assurez-vous que le serveur MCP est en cours d'exécution."
    });
  }
}

export default function BullMQDashboard() {
  const { stats: initialStats, error, apiUrl } = useLoaderData<typeof loader>();
  const [stats, setStats] = useState<AllQueuesStats | null>(initialStats);
  const [activeQueue, setActiveQueue] = useState<string>("all");
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const revalidator = useRevalidator();

  // Auto-refresh périodique
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    const intervalId = setInterval(() => {
      revalidator.revalidate();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, isAutoRefresh, revalidator]);

  // Mise à jour des statistiques lorsque les données du loader changent
  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // Gestion de l'ajout d'un job de test pour une file spécifique
  const handleAddTestJob = async (queueName: string) => {
    try {
      let endpoint = "";
      let data = {};
      
      switch (queueName) {
        case "php-analyzer":
          endpoint = `${apiUrl}/jobs/php-analyzer`;
          data = { 
            filePath: `/test/example-${Date.now()}.php`,
            options: { 
              priority: 1,
              metadata: { source: "dashboard-test" }
            }
          };
          break;
          
        case "js-analyzer":
          endpoint = `${apiUrl}/jobs/js-analyzer`;
          data = { 
            filePath: `/test/example-${Date.now()}.js`,
            options: { 
              priority: 1,
              metadata: { source: "dashboard-test" }
            }
          };
          break;
          
        case "migration":
          endpoint = `${apiUrl}/jobs/migration`;
          data = { 
            source: `/pages/test-${Date.now()}.php`,
            target: `/routes/test-${Date.now()}.tsx`,
            type: "route",
            options: { 
              priority: 1,
              metadata: { source: "dashboard-test" }
            }
          };
          break;
          
        case "verification":
          endpoint = `${apiUrl}/jobs/verification`;
          data = { 
            filePrefix: `test-${Date.now()}`,
            options: { 
              priority: 5,
              typeCheck: true,
              metadata: { source: "dashboard-test" }
            }
          };
          break;
      }
      
      await axios.post(endpoint, data);
      revalidator.revalidate();
    } catch (error) {
      console.error(`Erreur lors de l'ajout d'un job de test à ${queueName}:`, error);
    }
  };

  // Gestion de la suppression de tous les jobs d'une file
  const handleClearQueue = async (queueName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir vider la file d'attente ${queueName} ?`)) {
      return;
    }
    
    try {
      await axios.delete(`${apiUrl}/jobs/clear/${queueName}`);
      revalidator.revalidate();
    } catch (error) {
      console.error(`Erreur lors du vidage de la file ${queueName}:`, error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard BullMQ</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={isAutoRefresh}
              onChange={() => setIsAutoRefresh(!isAutoRefresh)}
              className="mr-2"
            />
            <label htmlFor="autoRefresh">Auto-refresh</label>
          </div>
          
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="border rounded px-2 py-1"
            disabled={!isAutoRefresh}
          >
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
          
          <Link 
            to="/dashboard/verification" 
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Rapports de vérification
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {stats && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Statistiques globales</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-blue-100 p-4 rounded">
              <p className="text-blue-800 font-semibold">En attente</p>
              <p className="text-3xl font-bold">{stats.totals.waiting}</p>
            </div>
            
            <div className="bg-yellow-100 p-4 rounded">
              <p className="text-yellow-800 font-semibold">Actifs</p>
              <p className="text-3xl font-bold">{stats.totals.active}</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded">
              <p className="text-green-800 font-semibold">Terminés</p>
              <p className="text-3xl font-bold">{stats.totals.completed}</p>
            </div>
            
            <div className="bg-red-100 p-4 rounded">
              <p className="text-red-800 font-semibold">Échoués</p>
              <p className="text-3xl font-bold">{stats.totals.failed}</p>
            </div>
            
            <div className="bg-purple-100 p-4 rounded">
              <p className="text-purple-800 font-semibold">Différés</p>
              <p className="text-3xl font-bold">{stats.totals.delayed}</p>
            </div>
          </div>
          
          <p className="text-gray-500 mt-2 text-sm">
            Dernière mise à jour: {new Date(stats.timestamp).toLocaleString()}
            {revalidator.state === "loading" && " (actualisation en cours...)"}
          </p>
        </div>
      )}
      
      {/* Sélecteur de file */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveQueue("all")}
            className={`px-3 py-2 rounded-md ${
              activeQueue === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Toutes les files
          </button>
          
          {stats?.queues.map((queue) => (
            <button
              key={queue.queueName}
              onClick={() => setActiveQueue(queue.queueName)}
              className={`px-3 py-2 rounded-md ${
                activeQueue === queue.queueName
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {queue.queueName}
            </button>
          ))}
        </div>
      </div>
      
      {/* Détails des files */}
      {stats && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            {activeQueue === "all" ? "Toutes les files" : `File: ${activeQueue}`}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Nom de la file</th>
                  <th className="py-2 px-4 border-b text-center">En attente</th>
                  <th className="py-2 px-4 border-b text-center">Actifs</th>
                  <th className="py-2 px-4 border-b text-center">Terminés</th>
                  <th className="py-2 px-4 border-b text-center">Échoués</th>
                  <th className="py-2 px-4 border-b text-center">Différés</th>
                  <th className="py-2 px-4 border-b text-center">Total</th>
                  <th className="py-2 px-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.queues
                  .filter(
                    (queue) =>
                      activeQueue === "all" || queue.queueName === activeQueue
                  )
                  .map((queue) => (
                    <tr key={queue.queueName} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b font-medium">
                        {queue.queueName}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {queue.counts.waiting}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {queue.counts.active}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {queue.counts.completed}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {queue.counts.failed}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {queue.counts.delayed}
                      </td>
                      <td className="py-2 px-4 border-b text-center font-medium">
                        {queue.counts.total}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => handleAddTestJob(queue.queueName)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                          >
                            Test Job
                          </button>
                          <button
                            onClick={() => handleClearQueue(queue.queueName)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                          >
                            Vider
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}