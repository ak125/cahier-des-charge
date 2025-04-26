import { json, type LoaderFunction } from @remix-run/nodestructure-agent";
import { useLoaderData } from @remix-run/reactstructure-agent";
import { getRecentTemporalJobs, getTemporalJobStatistics } from ~/models/job.serverstructure-agent";
import JobStatusDashboard from ~/components/JobStatusDashboardstructure-agent";

export const loader: LoaderFunction = async () => {
  // Récupérer les données initiales pour le tableau de bord
  const [jobs, stats] = await Promise.all([
    getRecentTemporalJobs(20),
    getTemporalJobStatistics()
  ]);

  return json({ jobs, stats });
};

export default function AdminJobs() {
  const { jobs, stats } = useLoaderData();

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Tableau de Bord des Jobs</h1>
      <JobStatusDashboard initialJobs={jobs} initialStats={stats} autoRefresh={true} />
    </div>
  );
}