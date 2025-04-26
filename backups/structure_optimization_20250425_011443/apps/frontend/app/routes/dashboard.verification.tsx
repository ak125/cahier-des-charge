import { json } from @remix-run/nodestructure-agent";
import { useLoaderData, Link } from @remix-run/reactstructure-agent";
import { useEffect, useState } from reactstructure-agent";
import axios from axiosstructure-agent";
import fs from fsstructure-agent";
import path from pathstructure-agent";

/**
 * Type pour le rapport de vérification d'un fichier
 */
type FileVerificationResult = {
  file: string;
  fileType: string;
  status: 'success' | 'warning' | 'error' | 'not-found';
  tags: string[];
  messages: string[];
};

/**
 * Type pour le rapport complet
 */
type VerificationReport = {
  file: string;
  status: string;
  tags: string[];
  results: FileVerificationResult[];
};

/**
 * Charge les rapports de vérification générés
 */
export async function loader() {
  // Chemin vers le dossier des rapports
  const reportsDir = path.resolve("./apps/frontend/app/generated/reports");
  const apiUrl = process.env.MCP_API_URL || "http://localhost:3030/api";
  
  try {
    // Vérifier si le dossier existe
    if (!fs.existsSync(reportsDir)) {
      return json({
        reports: [],
        apiUrl,
        message: "Aucun rapport disponible. Le dossier des rapports n'existe pas."
      });
    }
    
    // Récupération des fichiers de rapport
    const reportFiles = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.verification_report.json'));
    
    // Chargement du contenu des rapports
    const reports = reportFiles.map(file => {
      const filePath = path.join(reportsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as VerificationReport;
    });
    
    // Récupération du rapport global si existant
    let globalReport = null;
    const globalReportPath = path.resolve("./apps/frontend/app/generated/verification_report.json");
    
    if (fs.existsSync(globalReportPath)) {
      const content = fs.readFileSync(globalReportPath, 'utf-8');
      globalReport = JSON.parse(content);
    }
    
    return json({
      reports,
      globalReport,
      apiUrl,
      message: reports.length > 0 ? null : "Aucun rapport de vérification trouvé."
    });
  } catch (error) {
    console.error("Erreur lors du chargement des rapports:", error);
    return json({
      reports: [],
      apiUrl,
      error: `Erreur lors du chargement des rapports: ${error.message}`
    });
  }
}

export default function VerificationDashboard() {
  const { reports, globalReport, apiUrl, message, error } = useLoaderData<typeof loader>();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  
  // Sélectionner automatiquement le premier fichier si disponible
  useEffect(() => {
    if (reports.length > 0 && !selectedFile) {
      setSelectedFile(reports[0].file);
    }
  }, [reports, selectedFile]);
  
  // Obtenir le rapport pour le fichier sélectionné
  const selectedReport = selectedFile 
    ? reports.find(report => report.file === selectedFile) 
    : null;
  
  // Fonction pour lancer une vérification
  const runVerification = async (filePrefix: string) => {
    setLoadingVerification(true);
    try {
      await axios.post(`${apiUrl}/jobs/verification`, {
        filePrefix,
        options: {
          priority: 5,
          generateReport: true,
          addTags: true,
          typeCheck: true
        }
      });
      
      alert(`Vérification de "${filePrefix}" lancée avec succès ! Le rapport sera disponible prochainement.`);
    } catch (err) {
      console.error("Erreur lors du lancement de la vérification:", err);
      alert(`Erreur lors du lancement de la vérification: ${err.message}`);
    } finally {
      setLoadingVerification(false);
    }
  };
  
  // Déterminer la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'not-found': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard MCP Verifier</h1>
        
        <div className="flex space-x-2">
          <Link 
            to="/dashboard/bullmq" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            BullMQ Dashboard
          </Link>
          <button
            onClick={() => {
              const prefix = prompt("Entrez le préfixe du fichier à vérifier (ex: fiche, login, etc.)");
              if (prefix) runVerification(prefix);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            disabled={loadingVerification}
          >
            {loadingVerification ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Lancement...
              </>
            ) : (
              "Nouvelle vérification"
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      {/* Statistiques globales */}
      {globalReport && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Statistiques globales</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-blue-100 p-4 rounded">
              <p className="text-blue-800 font-semibold">Total fichiers</p>
              <p className="text-3xl font-bold">{globalReport.summary.totalFiles}</p>
            </div>
            <div className="bg-green-100 p-4 rounded">
              <p className="text-green-800 font-semibold">Validés</p>
              <p className="text-3xl font-bold">{globalReport.summary.verifiedFiles}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded">
              <p className="text-yellow-800 font-semibold">Avertissements</p>
              <p className="text-3xl font-bold">{globalReport.summary.warningFiles}</p>
            </div>
            <div className="bg-red-100 p-4 rounded">
              <p className="text-red-800 font-semibold">Erreurs</p>
              <p className="text-3xl font-bold">{globalReport.summary.errorFiles}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-800 font-semibold">Non trouvés</p>
              <p className="text-3xl font-bold">{globalReport.summary.notFoundFiles}</p>
            </div>
          </div>
          <p className="text-gray-500 mt-2 text-sm">
            Dernière mise à jour: {new Date(globalReport.timestamp).toLocaleString()}
          </p>
        </div>
      )}
      
      {/* Interface principale */}
      <div className="flex space-x-6">
        {/* Liste des fichiers vérifiés */}
        <div className="w-1/4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-bold mb-4">Fichiers vérifiés</h2>
            {reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((report) => (
                  <div 
                    key={report.file}
                    onClick={() => setSelectedFile(report.file)}
                    className={`p-3 rounded cursor-pointer flex justify-between items-center ${
                      selectedFile === report.file 
                        ? 'bg-blue-100 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{report.file}</span>
                      <div className="text-sm text-gray-500">
                        {report.tags.map(tag => tag.replace('✅', '').replace('⏳', '').replace('❌', ''))}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(report.status)}`}>
                      {report.status === 'success' ? '✅' : 
                       report.status === 'warning' ? '⚠️' : 
                       report.status === 'error' ? '❌' : '❓'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun fichier vérifié disponible</p>
            )}
          </div>
        </div>
        
        {/* Détails du rapport sélectionné */}
        <div className="w-3/4">
          {selectedReport ? (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  Rapport de vérification: {selectedReport.file}
                </h2>
                <button
                  onClick={() => runVerification(selectedReport.file)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  disabled={loadingVerification}
                >
                  {loadingVerification ? "En cours..." : "Relancer la vérification"}
                </button>
              </div>
              
              <div className="flex space-x-2 mb-4">
                {selectedReport.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b text-left">Fichier</th>
                      <th className="py-2 px-4 border-b text-center">Type</th>
                      <th className="py-2 px-4 border-b text-center">Statut</th>
                      <th className="py-2 px-4 border-b text-center">Tags</th>
                      <th className="py-2 px-4 border-b text-left">Messages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.results.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b font-medium">
                          {result.file ? path.basename(result.file) : `${selectedReport.file}${result.fileType}`}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <code>{result.fileType}</code>
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(result.status)}`}>
                            {result.status === 'success' ? '✅ Validé' : 
                             result.status === 'warning' ? '⚠️ Attention' : 
                             result.status === 'error' ? '❌ Erreur' : '❓ Non trouvé'}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {result.tags.map((tag, tagIndex) => (
                              <span 
                                key={tagIndex} 
                                className="px-2 py-1 bg-gray-100 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {result.messages.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {result.messages.map((message, msgIndex) => (
                                <li key={msgIndex} className="text-sm text-gray-700">{message}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-gray-500">Pas de message</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center h-full">
              <p className="text-gray-500">
                {reports.length > 0 
                  ? "Sélectionnez un fichier pour voir son rapport de vérification" 
                  : "Aucun rapport disponible"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}