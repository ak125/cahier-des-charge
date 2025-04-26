import { json, type LoaderFunctionArgs } from @remix-run/nodestructure-agent";
import { useLoaderData, useRevalidator } from @remix-run/reactstructure-agent";
import { useEffect, useState } from reactstructure-agent";
import axios from axiosstructure-agent";

// Définition des types pour les jobs MCP
type McpJob = {
  id: number;
  jobId: string;
  status: "pending" | "processing" | "done" | "failed";
  filePath: string;
  result: any;
  createdAt: string;
  updatedAt: string;
};

// Fonction loader pour charger les données initiales
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Récupérer les paramètres de recherche (status, limit)
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = url.searchParams.get("limit") || "20";
    
    // Construire l'URL de l'API
    let apiUrl = `${process.env.API_URL || "http://localhost:3333"}/jobs`;
    if (status) {
      apiUrl += `?status=${status}&limit=${limit}`;
    } else {
      apiUrl += `?limit=${limit}`;
    }
    
    // Appeler l'API backend
    const response = await axios.get(apiUrl);
    return json({ jobs: response.data, error: null });
  } catch (error) {
    console.error("Erreur lors du chargement des jobs:", error);
    return json({ 
      jobs: [], 
      error: "Impossible de charger les jobs MCP. Veuillez réessayer plus tard." 
    });
  }
}

// Composant principal du tableau de bord des jobs
export default function DashboardJobsAdvanced() {
  const { jobs: initialJobs, error } = useLoaderData<typeof loader>();
  const [jobs, setJobs] = useState<McpJob[]>(initialJobs || []);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterText, setFilterText] = useState("");
  const revalidator = useRevalidator();

  // Connexion SSE pour les mises à jour en temps réel
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3333/jobs/events");

    eventSource.onopen = () => {
      console.log("📡 Connexion SSE établie");
      setConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error("❌ Erreur SSE:", error);
      setConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const jobData = JSON.parse(event.data);
        console.log("📨 Nouveau job reçu:", jobData);
        
        // Mettre à jour l'état local et éventuellement revalider les données
        setJobs((currentJobs) => {
          // Vérifier si le job existe déjà
          const existingJobIndex = currentJobs.findIndex(job => job.jobId === jobData.jobId);
          if (existingJobIndex >= 0) {
            // Mettre à jour le job existant
            const updatedJobs = [...currentJobs];
            updatedJobs[existingJobIndex] = {
              ...updatedJobs[existingJobIndex],
              status: jobData.status,
              updatedAt: jobData.timestamp
            };
            return updatedJobs;
          } else {
            // Ajouter le nouveau job au début de la liste
            return [jobData, ...currentJobs];
          }
        });
        
        // Revalider les données complètes périodiquement
        if (Math.random() < 0.2) { // 20% de chances de revalider (pour limiter les appels API)
          revalidator.revalidate();
        }
        
      } catch (error) {
        console.error("❌ Erreur de parsing du message:", error);
      }
    };

    // Nettoyage lors du démontage du composant
    return () => {
      console.log("🔌 Fermeture de la connexion SSE");
      eventSource.close();
    };
  }, [revalidator]);

  // Filtrer les jobs selon l'onglet actif et le texte de recherche
  const filteredJobs = jobs.filter(job => {
    const matchesTab = activeTab === "all" || job.status === activeTab;
    const matchesFilter = !filterText || 
                          job.jobId.toLowerCase().includes(filterText.toLowerCase()) ||
                          job.filePath?.toLowerCase().includes(filterText.toLowerCase());
    return matchesTab && matchesFilter;
  });

  // Fonction pour obtenir la couleur du badge de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "processing": return "bg-blue-100 text-blue-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Tableau de bord des jobs MCP</h1>
        <div className="flex items-center mb-4">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span>{connected ? 'Connecté en temps réel' : 'Déconnecté'}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab("all")}
            className={`px-3 py-2 rounded-md ${activeTab === "all" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Tous
          </button>
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-2 rounded-md ${activeTab === "pending" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            En attente
          </button>
          <button 
            onClick={() => setActiveTab("processing")}
            className={`px-3 py-2 rounded-md ${activeTab === "processing" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            En cours
          </button>
          <button 
            onClick={() => setActiveTab("done")}
            className={`px-3 py-2 rounded-md ${activeTab === "done" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Terminés
          </button>
          <button 
            onClick={() => setActiveTab("failed")}
            className={`px-3 py-2 rounded-md ${activeTab === "failed" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Échoués
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher par ID ou chemin..."
            className="px-4 py-2 border rounded-md w-full md:w-64"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          {filterText && (
            <button
              className="absolute right-2 top-2.5 text-gray-500"
              onClick={() => setFilterText("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tableau des jobs */}
      {filteredJobs.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-gray-600">Aucun job à afficher pour le moment.</p>
          <p className="text-gray-500 text-sm mt-2">Les nouveaux jobs apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">Job ID</th>
                <th className="py-2 px-4 border-b text-left">Fichier</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Créé</th>
                <th className="py-2 px-4 border-b text-left">Mis à jour</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job, index) => (
                <tr key={job.jobId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b font-mono text-sm">{job.jobId}</td>
                  <td className="py-2 px-4 border-b text-sm truncate max-w-[200px]" title={job.filePath}>
                    {job.filePath}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b text-sm">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b text-sm">
                    {new Date(job.updatedAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button className="text-blue-500 hover:text-blue-700 mr-2">
                      Détails
                    </button>
                    {job.status === 'failed' && (
                      <button className="text-orange-500 hover:text-orange-700">
                        Réessayer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistiques */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 font-semibold">Total des jobs</p>
          <p className="text-3xl font-bold">{jobs.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800 font-semibold">En attente</p>
          <p className="text-3xl font-bold">{jobs.filter(j => j.status === 'pending').length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800 font-semibold">Terminés</p>
          <p className="text-3xl font-bold">{jobs.filter(j => j.status === 'done').length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800 font-semibold">Échoués</p>
          <p className="text-3xl font-bold">{jobs.filter(j => j.status === 'failed').length}</p>
        </div>
      </div>
    </div>
  );
}