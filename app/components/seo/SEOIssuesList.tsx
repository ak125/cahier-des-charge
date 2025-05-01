import React from 'react';

type IssueSeverity = 'critical' | 'warning' | 'info';

interface SEOIssue {
  id: string;
  title: string;
  severity: IssueSeverity;
  url: string;
  description: string;
  pageTitle?: string;
  impact?: string;
  recommendation?: string;
  dateDetected: string;
}

interface SEOIssuesListProps {
  issues: SEOIssue[];
}

export const SEOIssuesList: React.FC<SEOIssuesListProps> = ({ issues }) => {
  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Critique
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Avertissement
          </span>
        );
      case 'info':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Information
          </span>
        );
      default:
        return null;
    }
  };

  if (!issues || issues.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun problème SEO</h3>
        <p className="mt-1 text-sm text-gray-500">
          Votre site est optimisé et ne présente pas de problèmes SEO.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {issues.map((issue) => (
          <li key={issue.id} className="px-0 py-4">
            <div className="flex items-start space-x-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(issue.severity)}
                  <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">{issue.description}</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <p className="truncate">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {issue.pageTitle || issue.url}
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Voir détails
                </button>
              </div>
            </div>
            {issue.impact && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-semibold">Impact:</span> {issue.impact}
              </div>
            )}
            {issue.recommendation && (
              <div className="mt-1 text-xs text-gray-500">
                <span className="font-semibold">Recommandation:</span> {issue.recommendation}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
