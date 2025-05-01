import { type LoaderFunction, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import JobStatusDashboard from '~/components/JobStatusDashboard';
import { getRecentTemporalJobs, getTemporalJobStatistics } from '~/models/job.server';

export const loader: LoaderFunction = async () => {
  // Récupérer les données initiales pour le tableau de bord
  const [jobs, stats] = await Promise.all([getRecentTemporalJobs(20), getTemporalJobStatistics()]);

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
