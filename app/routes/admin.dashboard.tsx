import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getMigratedModules } from "~/models/migration.server";
import { getRecentActivities } from "~/models/activity.server";
import { getBacklogStatus } from "~/models/backlog.server";
import MigratedModulesList from "~/components/MigratedModulesList";
import AIActivityLog from "~/components/AIActivityLog";
import BacklogStatus from "~/components/BacklogStatus";
import DashboardHeader from "~/components/DashboardHeader";
import styles from "~/styles/dashboard.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

type LoaderData = {
  migratedModules: Awaited<ReturnType<typeof getMigratedModules>>;
  recentActivities: Awaited<ReturnType<typeof getRecentActivities>>;
  backlogStatus: Awaited<ReturnType<typeof getBacklogStatus>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const migratedModules = await getMigratedModules();
  const recentActivities = await getRecentActivities();
  const backlogStatus = await getBacklogStatus();

  return json<LoaderData>({
    migratedModules,
    recentActivities,
    backlogStatus
  });
};

export default function AdminDashboard() {
  const { migratedModules, recentActivities, backlogStatus } = useLoaderData<LoaderData>();

  return (
    <div className="dashboard-container">
      <DashboardHeader title="Command Center" subtitle="Tableau de bord de migration IA" />
      
      <div className="dashboard-grid">
        <div className="dashboard-section modules-section">
          <h2>Modules Migrés</h2>
          <MigratedModulesList modules={migratedModules} />
        </div>
        
        <div className="dashboard-section activity-section">
          <h2>Journal d'Activité IA</h2>
          <AIActivityLog activities={recentActivities} />
        </div>
        
        <div className="dashboard-section backlog-section">
          <h2>État du Backlog</h2>
          <BacklogStatus backlog={backlogStatus} />
        </div>
      </div>
    </div>
  );
}
