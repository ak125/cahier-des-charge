// Dashboard Remix principal pour suivre l'état des migrations

import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link, NavLink, Outlet } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// Types pour les données de migration
interface MigrationWave {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  files: number;
  filesCompleted: number;
  priority: "high" | "medium" | "low";
}

interface MigrationFile {
  id: string;
  path: string;
  wave_id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  priority: "high" | "medium" | "low";
  complexity: number;
  seoImpact: "high" | "medium" | "low";
}

interface DashboardData {
  waves: MigrationWave[];
  recentFiles: MigrationFile[];
  stats: {
    totalFiles: number;
    completedFiles: number;
    inProgressFiles: number;
    pendingFiles: number;
    overallProgress: number;
  };
}

// Fonction loader pour récupérer les données depuis Supabase
export const loader: LoaderFunction = async () => {
  // Initialiser le client Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || ""
  );

  // Récupérer les vagues de migration
  const { data: waves, error: wavesError } = await supabase
    .from("migration_waves")
    .select("*")
    .order("priority", { ascending: false });

  // Récupérer les fichiers récemment modifiés
  const { data: recentFiles, error: filesError } = await supabase
    .from("migration_files")
    .select("*")
    .order("updatedAt", { ascending: false })
    .limit(10);

  // Récupérer les statistiques globales
  const { data: statsData, error: statsError } = await supabase
    .from("migration_stats")
    .select("*")
    .single();

  if (wavesError || filesError || statsError) {
    throw new Error(
      `Failed to load data: ${wavesError?.message || filesError?.message || statsError?.message}`
    );
  }

  return json({
    waves: waves || [],
    recentFiles: recentFiles || [],
    stats: statsData || {
      totalFiles: 0,
      completedFiles: 0,
      inProgressFiles: 0,
      pendingFiles: 0,
      overallProgress: 0,
    },
  });
};

// Composant principal du dashboard
export default function MigrationDashboard() {
  const data = useLoaderData<DashboardData>();
  const [activeWave, setActiveWave] = useState<string | null>(null);

  // Déclencher manuellement une vague de migration
  const triggerWave = async (waveId: string) => {
    try {
      const response = await fetch("/api/trigger-wave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wave_id: waveId }),
      });
      
      if (response.ok) {
        alert(`Wave ${waveId} triggered successfully!`);
      } else {
        const error = await response.text();
        alert(`Failed to trigger wave: ${error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-4">Migration Dashboard</h1>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${data.stats.overallProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {data.stats.overallProgress}% completed
          </div>
        </div>

        <nav>
          <div className="mb-2 font-medium text-gray-700">Navigation</div>
          <ul className="space-y-1">
            <li>
              <NavLink 
                to="/dashboard" 
                end
                className={({isActive}) => 
                  `block py-2 px-3 rounded ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                Overview
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/dashboard/waves" 
                className={({isActive}) => 
                  `block py-2 px-3 rounded ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                Migration Waves
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/dashboard/files" 
                className={({isActive}) => 
                  `block py-2 px-3 rounded ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                Files
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/dashboard/logs" 
                className={({isActive}) => 
                  `block py-2 px-3 rounded ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                Logs
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="mt-8">
          <div className="mb-2 font-medium text-gray-700">Migration Waves</div>
          <ul className="space-y-1">
            {data.waves.map((wave) => (
              <li key={wave.id}>
                <button
                  onClick={() => setActiveWave(wave.id === activeWave ? null : wave.id)}
                  className={`flex justify-between items-center w-full py-2 px-3 rounded ${
                    activeWave === wave.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>Wave {wave.name}</span>
                  <StatusBadge status={wave.status} />
                </button>
                
                {activeWave === wave.id && (
                  <div className="pl-4 py-2 text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Progress:</span>
                      <span>{wave.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full mb-3">
                      <div
                        className="h-1.5 bg-blue-500 rounded-full"
                        style={{ width: `${wave.progress}%` }}
                      ></div>
                    </div>
                    <Link
                      to={`/dashboard/waves/${wave.id}`}
                      className="text-blue-600 hover:underline block mb-2"
                    >
                      View details
                    </Link>
                    <button
                      onClick={() => triggerWave(wave.id)}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                    >
                      Trigger wave
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

// Composant StatusBadge pour afficher l'état d'une vague
function StatusBadge({ status }: { status: string }) {
  let color = "";
  let label = status;

  switch (status) {
    case "completed":
      color = "bg-green-100 text-green-800";
      break;
    case "in_progress":
      color = "bg-yellow-100 text-yellow-800";
      break;
    case "pending":
      color = "bg-gray-100 text-gray-800";
      break;
    case "failed":
      color = "bg-red-100 text-red-800";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
  }

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
