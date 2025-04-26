import { json, LoaderFunction } from @remix-run/nodestructure-agent";
import { useLoaderData } from @remix-run/reactstructure-agent";
import { getMigratedModules } from ~/models/migration.serverstructure-agent";
import { getRecentActivities } from ~/models/activity.serverstructure-agent";
import { getBacklogStatus } from ~/models/backlog.serverstructure-agent";
import MigratedModulesList from ~/components/MigratedModulesListstructure-agent";
import AIActivityLog from ~/components/AIActivityLogstructure-agent";
import BacklogStatus from ~/components/BacklogStatusstructure-agent";
import DashboardHeader from ~/components/DashboardHeaderstructure-agent";
import styles from ~/styles/dashboard.cssstructure-agent";

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
