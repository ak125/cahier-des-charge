import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  trend?: number;
  trendDescription?: string;
  icon: React.ReactNode;
  colorClass?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  trend,
  trendDescription,
  icon,
  colorClass = 'bg-blue-500',
}) => {
  let trendIcon;
  let trendColorClass;

  if (trend !== undefined) {
    if (trend > 0) {
      trendIcon = (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
      trendColorClass = 'text-green-500';
    } else if (trend < 0) {
      trendIcon = (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
      trendColorClass = 'text-red-500';
    } else {
      trendIcon = (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      );
      trendColorClass = 'text-gray-500';
    }
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colorClass}`}>{icon}</div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
              <dd className="flex items-center text-xs text-gray-500">
                <span>{description}</span>
                {trend !== undefined && (
                  <span className={`flex items-center ml-2 ${trendColorClass}`}>
                    {trendIcon}
                    <span className="ml-0.5">{trendDescription || `${Math.abs(trend)}%`}</span>
                  </span>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SEOStatsOverviewProps {
  stats: {
    total: number;
    critical: number;
    warnings: number;
    good: number;
    averageScore: number;
  };
}

export const SEOStatsOverview: React.FC<SEOStatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <StatsCard
        title="Score SEO moyen"
        value={`${Math.round(stats.averageScore)}/100`}
        description="Score global du site"
        icon={
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
        colorClass="bg-indigo-600"
      />

      <StatsCard
        title="Pages analysées"
        value={stats.total}
        description="Nombre total de pages"
        icon={
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
        }
        colorClass="bg-blue-600"
      />

      <StatsCard
        title="Problèmes critiques"
        value={stats.critical}
        description={`${Math.round((stats.critical / stats.total) * 100)}% des pages`}
        icon={
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        }
        colorClass="bg-red-600"
      />

      <StatsCard
        title="Avertissements"
        value={stats.warnings}
        description={`${Math.round((stats.warnings / stats.total) * 100)}% des pages`}
        icon={
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        colorClass="bg-yellow-500"
      />

      <StatsCard
        title="Pages optimisées"
        value={stats.good}
        description={`${Math.round((stats.good / stats.total) * 100)}% des pages`}
        icon={
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
        colorClass="bg-green-600"
      />
    </div>
  );
};
