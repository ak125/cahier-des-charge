import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import type { Migration, Agent } from "../types";
import DependencyGraph from "../components/DependencyGraph";

export const loader = async () => {
  // Dans une implémentation réelle, ces données proviendraient d'une API
  // qui interrogerait le fichier MCPManifest.json et status.json
  const migrations: Migration[] = [
    {
      id: "contact-page-migration",
      name: "Migration de la page Contact",
      status: "completed",
      route: "/contact",
      startedAt: "2025-04-15T10:30:00Z",
      completedAt: "2025-04-15T10:35:22Z",
      qaScore: 92,
      seoScore: 87
    },
    {
      id: "product-list-migration",
      name: "Migration de la liste des produits",
      status: "in_progress",
      route: "/products",
      startedAt: "2025-04-15T11:30:00Z"
    },
    {
      id: "login-form-migration",
      name: "Migration du formulaire de connexion",
      status: "planned",
      route: "/login"
    },
    {
      id: "checkout-migration",
      name: "Migration du processus de paiement",
      status: "failed",
      route: "/checkout",
      startedAt: "2025-04-14T09:30:00Z",
      error: "Erreur lors de la génération du composant de paiement: Invalid schema"
    }
  ];

  const agents: Agent[] = [
    {
      name: "PhpAnalyzer",
      status: "ready",
      lastRun: "2025-04-15T10:35:22Z",
      jobsCompleted: 42
    },
    {
      name: "RemixGenerator",
      status: "busy",
      lastRun: "2025-04-15T11:30:00Z",
      jobsCompleted: 38
    },
    {
      name: "QaAnalyzer",
      status: "error",
      lastRun: "2025-04-14T09:30:00Z",
      jobsCompleted: 41,
      error: "Erreur de connexion à la base de données"
    }
  ];

  const recentLogs = [
    "[2025-04-15 11:30:05] INFO: Démarrage de la migration product-list-migration",
    "[2025-04-15 11:30:10] INFO: Analyse PHP terminée pour src/pages/products.php",
    "[2025-04-15 11:31:22] WARNING: Détection de requête SQL dynamique dans products.php:56",
    "[2025-04-15 11:32:45] INFO: Génération de la route Remix pour /products"
  ];

  // Données pour le graphe de dépendances
  const graphData = {
    nodes: [
      // Nœuds de migration
      { id: "contact-page-migration", label: "Contact Page", type: "migration", status: "completed" },
      { id: "product-list-migration", label: "Product List", type: "migration", status: "in_progress" },
      { id: "login-form-migration", label: "Login Form", type: "migration", status: "planned" },

      // Nœuds d'agents
      { id: "php-analyzer", label: "PHP Analyzer", type: "agent" },
      { id: "remix-generator", label: "Remix Generator", type: "agent" },
      { id: "qa-analyzer", label: "QA Analyzer", type: "agent" },

      // Nœuds de fichiers
      { id: "contact-php", label: "contact.php", type: "file" },
      { id: "contact-tsx", label: "contact.tsx", type: "file" },
      { id: "products-php", label: "products.php", type: "file" },
      { id: "products-tsx", label: "products.tsx", type: "file" },
    ],
    edges: [
      // Relations entre migrations et fichiers
      { source: "contact-page-migration", target: "contact-php", label: "source" },
      { source: "contact-page-migration", target: "contact-tsx", label: "output" },
      { source: "product-list-migration", target: "products-php", label: "source" },
      { source: "product-list-migration", target: "products-tsx", label: "output" },

      // Relations entre agents et migrations
      { source: "php-analyzer", target: "contact-page-migration" },
      { source: "php-analyzer", target: "product-list-migration" },
      { source: "remix-generator", target: "contact-page-migration" },
      { source: "remix-generator", target: "product-list-migration" },
      { source: "qa-analyzer", target: "contact-page-migration" },
    ]
  };

  return json({ migrations, agents, recentLogs, graphData });
};

export default function MigrationsDashboard() {
  const { migrations, agents, recentLogs, graphData } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"migrations" | "agents" | "logs" | "graph">("migrations");
  const [selectedMigration, setSelectedMigration] = useState<Migration | null>(null);

  const getStatusBadge = (status: Migration["status"]) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Complété</span>;
      case "in_progress":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">En cours</span>;
      case "planned":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Planifié</span>;
      case "failed":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Échoué</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getAgentStatusBadge = (status: Agent["status"]) => {
    switch (status) {
      case "ready":
        return <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-green-400 mr-2"></span>Prêt</span>;
      case "busy":
        return <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-blue-400 mr-2"></span>Occupé</span>;
      case "error":
        return <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-red-400 mr-2"></span>Erreur</span>;
      default:
        return <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-gray-400 mr-2"></span>{status}</span>;
    }
  };

  const handleRestartAgent = (agentName: string) => {
    // Logique pour redémarrer un agent
    console.log(`Redémarrage de l'agent ${agentName}`);
    alert(`Redémarrage de l'agent ${agentName} demandé`);
  };

  const handleRunMigration = (migrationId: string) => {
    // Logique pour lancer/relancer une migration
    console.log(`Lancement de la migration ${migrationId}`);
    alert(`Lancement de la migration ${migrationId} demandé`);
  };

  const handleFixMigration = (migration: Migration) => {
    // Logique pour corriger une migration en échec
    setSelectedMigration(migration);
    console.log(`Correction de la migration ${migration.id}`);
    alert(`Ouverture de l'interface de correction pour ${migration.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord des migrations MCP</h1>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("migrations")}
            className={`py-4 px-6 ${activeTab === "migrations"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Migrations
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`py-4 px-6 ${activeTab === "agents"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-4 px-6 ${activeTab === "logs"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Logs
          </button>
          <button
            onClick={() => setActiveTab("graph")}
            className={`py-4 px-6 ${activeTab === "graph"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Graphe
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "migrations" && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Route</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Scores</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {migrations.map((migration) => (
                <tr key={migration.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {migration.id}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900">{migration.name}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">{migration.route}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(migration.status)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {migration.qaScore && (
                      <div className="flex items-center">
                        <span className="mr-2">QA:</span>
                        <span className={`font-medium ${migration.qaScore > 80 ? "text-green-700" :
                            migration.qaScore > 60 ? "text-yellow-700" : "text-red-700"
                          }`}>{migration.qaScore}/100</span>
                      </div>
                    )}
                    {migration.seoScore && (
                      <div className="flex items-center">
                        <span className="mr-2">SEO:</span>
                        <span className={`font-medium ${migration.seoScore > 80 ? "text-green-700" :
                            migration.seoScore > 60 ? "text-yellow-700" : "text-red-700"
                          }`}>{migration.seoScore}/100</span>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRunMigration(migration.id)}
                        className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded"
                      >
                        {migration.status === "failed" ? "Relancer" : "Détails"}
                      </button>
                      {migration.status === "failed" && (
                        <button
                          onClick={() => handleFixMigration(migration)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-900 bg-red-50 rounded"
                        >
                          Corriger
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Agent</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dernière exécution</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tâches complétées</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.name} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                    {agent.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getAgentStatusBadge(agent.status)}
                    {agent.error && (
                      <div className="text-xs text-red-500 mt-1">{agent.error}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(agent.lastRun).toLocaleString("fr-FR")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {agent.jobsCompleted}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRestartAgent(agent.name)}
                        className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded"
                      >
                        Redémarrer
                      </button>
                      <button
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 rounded"
                      >
                        Logs
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium">Logs récents</h3>
            <button className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
              Actualiser
            </button>
          </div>
          <div className="h-64 overflow-auto">
            {recentLogs.map((log, index) => (
              <div key={index} className="py-1">
                {log.includes("ERROR") || log.includes("ERREUR") ? (
                  <span className="text-red-400">{log}</span>
                ) : log.includes("WARNING") || log.includes("AVERTISSEMENT") ? (
                  <span className="text-yellow-400">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "graph" && (
        <div className="mb-6">
          <DependencyGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            width={800}
            height={600}
          />
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Légende</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#6366f1] mr-2"></span>
                <span className="text-sm">Migration</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#10b981] mr-2"></span>
                <span className="text-sm">Fichier</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#f59e0b] mr-2"></span>
                <span className="text-sm">Agent</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#ef4444] mr-2"></span>
                <span className="text-sm">Échec</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#22c55e] mr-2"></span>
                <span className="text-sm">Complété</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></span>
                <span className="text-sm">En cours</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}