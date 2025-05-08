import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import React from 'react';
import { AIActivityLog } from '~/components/AIActivityLog';
import { getRecentAIActivities } from '~/models/activity.server';
import type { AIActivity } from '~/models/activity.server';

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
