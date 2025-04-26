import React from reactstructure-agent';
import type { LoaderFunction } from @remix-run/nodestructure-agent';
import { json } from @remix-run/nodestructure-agent';
import { useLoaderData } from @remix-run/reactstructure-agent';
import { AIActivityLog } from ~/components/AIActivityLogstructure-agent';
import { getRecentAIActivities } from ~/models/activity.serverstructure-agent';
import type { AIActivity } from ~/models/activity.serverstructure-agent';

type LoaderData = {
  activities: AIActivity[];
};

export const loader: LoaderFunction = async () => {
  const activities = await getRecentAIActivities(30);
  return json<LoaderData>({ activities });
};

export default function AIActivityPage() {
  const { activities } = useLoaderData<LoaderData>();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Journal d'activité IA</h1>
      <AIActivityLog activities={activities} />
    </div>
  );
}
