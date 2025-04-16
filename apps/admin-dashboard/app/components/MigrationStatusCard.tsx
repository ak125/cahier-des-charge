import React from 'react';

interface MigrationStatusCardProps {
  title: string;
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
}

export default function MigrationStatusCard({
  title,
  total,
  completed,
  inProgress,
  failed,
}: MigrationStatusCardProps) {
  const pending = total - completed - inProgress - failed;
  const percentageComplete = Math.round((completed / total) * 100) || 0;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <svg
              className="h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-lg font-medium text-gray-900 truncate">
              {title}
            </dt>
            <dd>
              <div className="flex items-center mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${percentageComplete}%` }}
                  ></div>
                </div>
                <span className="ml-3 text-gray-900">
                  {percentageComplete}%
                </span>
              </div>
            </dd>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-800 text-sm font-medium">Complétées</div>
            <div className="text-green-900 text-2xl font-semibold">{completed}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-800 text-sm font-medium">En cours</div>
            <div className="text-blue-900 text-2xl font-semibold">{inProgress}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-800 text-sm font-medium">En attente</div>
            <div className="text-gray-900 text-2xl font-semibold">{pending}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-red-800 text-sm font-medium">Échouées</div>
            <div className="text-red-900 text-2xl font-semibold">{failed}</div>
          </div>
        </div>
      </div>
    </div>
  );
}