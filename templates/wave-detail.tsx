// Page de détail d'une vague de migration spécifique

import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

// Types pour les données de la vague
interface WaveFile {
  id: string;
  path: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  priority: "high" | "medium" | "low";
  complexity: number;
  seoImpact: "high" | "medium" | "low";
}

interface WaveModule {
  id: string;
  name: string;
  type: "backend" | "frontend" | "prisma";
  path: string;
  generatedAt: string;
}

interface WaveDetail {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  files: WaveFile[];
  modules: WaveModule[];
  logs: string[];
}

// Fonction loader pour récupérer les détails d'une vague
export const loader: LoaderFunction = async ({ params }) => {
  const waveId = params.waveId;
  
  if (!waveId) {
    throw new Response("Wave ID is required", { status: 400 });
  }

  // Initialiser le client Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || ""
  );

  // Récupérer les détails de la vague
  const { data: wave, error: waveError } = await supabase
    .from("migration_waves")
    .select("*")
    .eq("id", waveId)
    .single();

  if (waveError || !wave) {
    throw new Response("Wave not found", { status: 404 });
  }

  // Récupérer les fichiers de la vague
  const { data: files, error: filesError } = await supabase
    .from("migration_files")
    .select("*")
    .eq("wave_id", waveId)
    .order("path");

  // Récupérer les modules générés
  const { data: modules, error: modulesError } = await supabase
    .from("generated_modules")
    .select("*")
    .eq("wave_id", waveId)
    .order("generatedAt", { ascending: false });

  // Récupérer les logs
  const { data: logs, error: logsError } = await supabase
    .from("migration_logs")
    .select("content, created_at")
    .eq("wave_id", waveId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (filesError || modulesError || logsError) {
    throw new Error(
      `Failed to load data: ${filesError?.message || modulesError?.message || logsError?.message}`
    );
  }

  return json({
    ...wave,
    files: files || [],
    modules: modules || [],
    logs: (logs || []).map(log => log.content)
  });
};

// Action function pour le rollback
export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const waveId = params.waveId;

  if (intent === "rollback" && waveId) {
    // Appeler l'API de rollback
    const response = await fetch(`/api/rollback-wave/${waveId}`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to rollback wave: ${await response.text()}`);
    }

    return json({ success: true });
  }

  return json({ success: false });
};

// Composant principal
export default function WaveDetail() {
  const wave = useLoaderData<WaveDetail>();
  const [activeTab, setActiveTab] = useState("files");

  // Fonction pour formater la date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wave: {wave.name}</h1>
          <p className="text-gray-600">ID: {wave.id}</p>
        </div>
        <div className="flex items-center">
          <div className="mr-4">
            <StatusBadge status={wave.status} />
          </div>
          {wave.status === "completed" && (
            <form method="post">
              <input type="hidden" name="intent" value="rollback" />
              <button
                type="submit"
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
                onClick={(e) => {
                  if (!confirm("Are you sure you want to rollback this wave?")) {
                    e.preventDefault();
                  }
                }}
              >
                Rollback Wave
              </button>
            </form>
          )}
          {wave.status === "pending" && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Start Wave
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          title="Progress"
          value={`${wave.progress}%`}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Started"
          value={formatDate(wave.startedAt)}
          icon="🕒"
          color="green"
        />
        <StatCard
          title="Completed"
          value={formatDate(wave.completedAt)}
          icon="✅"
          color="purple"
        />
        <StatCard
          title="Files"
          value={wave.files.length.toString()}
          icon="📁"
          color="orange"
        />
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "files"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("files")}
            >
              Files
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "modules"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("modules")}
            >
              Generated Modules
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "logs"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("logs")}
            >
              Logs
            </button>
          </nav>
        </div>

        <div className="mt-4">
          {activeTab === "files" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Complexity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SEO Impact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wave.files.map((file) => (
                    <tr key={file.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                        <Link to={`/dashboard/files/${file.id}`}>
                          {file.path}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={file.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={file.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ComplexityRating complexity={file.complexity} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SeoImpactBadge impact={file.seoImpact} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <Link
                          to={`/dashboard/files/${file.id}`}
                          className="hover:underline"
                        >
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "modules" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wave.modules.map((module) => (
                    <tr key={module.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {module.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ModuleTypeBadge type={module.type} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {module.path}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(module.generatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <a
                          href={`/code-viewer?path=${encodeURIComponent(module.path)}`}
                          className="hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View code
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto font-mono text-sm">
              {wave.logs.length > 0 ? (
                wave.logs.map((log, index) => (
                  <div key={index} className="py-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="py-1">No logs available</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour les cartes statistiques
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`rounded-full p-2 mr-4 ${colorClasses[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Autres composants d'interface
function StatusBadge({ status }) {
  const statusClasses = {
    pending: "bg-gray-100 text-gray-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusClasses[status] || statusClasses.pending
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const priorityClasses = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        priorityClasses[priority] || priorityClasses.medium
      }`}
    >
      {priority}
    </span>
  );
}

function SeoImpactBadge({ impact }) {
  const impactClasses = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        impactClasses[impact] || impactClasses.low
      }`}
    >
      {impact}
    </span>
  );
}

function ComplexityRating({ complexity }) {
  // Convertir la complexité (0-1) en étoiles (1-5)
  const stars = Math.round(complexity * 5);
  
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < stars ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ModuleTypeBadge({ type }) {
  const typeClasses = {
    backend: "bg-blue-100 text-blue-800",
    frontend: "bg-purple-100 text-purple-800",
    prisma: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        typeClasses[type] || "bg-gray-100 text-gray-800"
      }`}
    >
      {type}
    </span>
  );
}
