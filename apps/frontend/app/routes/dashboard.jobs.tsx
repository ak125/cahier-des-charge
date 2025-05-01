import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';

export async function loader() {
  // On pourrait charger ici la liste initiale des jobs depuis l'API backend
  return json({ initialJobs: [] });
}

export default function DashboardJobs() {
  const { initialJobs } = useLoaderData<typeof loader>();
  const [jobs, setJobs] = useState(initialJobs);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Établir une connexion SSE avec le backend
    const eventSource = new EventSource('http://localhost:3333/jobs/events');

    eventSource.onopen = () => {
      console.log('📡 Connexion SSE établie');
      setConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error('❌ Erreur SSE:', error);
      setConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const jobData = JSON.parse(event.data);
        console.log('📨 Nouveau job reçu:', jobData);
        setJobs((currentJobs) => [jobData, ...currentJobs]);
      } catch (error) {
        console.error('❌ Erreur de parsing du message:', error);
      }
    };

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('🔌 Fermeture de la connexion SSE');
      eventSource.close();
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Tableau de bord des jobs MCP</h1>
        <div className="flex items-center mb-4">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span>{connected ? 'Connecté en temps réel' : 'Déconnecté'}</span>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-gray-600">Aucun job à afficher pour le moment.</p>
          <p className="text-gray-500 text-sm mt-2">
            Les nouveaux jobs apparaîtront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">Job ID</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Timestamp</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{job.jobId}</td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'done'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{new Date(job.timestamp).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">
                    <button className="text-blue-500 hover:text-blue-700">Détails</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
