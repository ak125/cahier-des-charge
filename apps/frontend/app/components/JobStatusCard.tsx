import React from 'react';
import { useFetcher } from '@remix-run/react';

interface JobStatusProps {
  filename: string;
  status: 'pending' | 'done' | 'invalid';
  agent: string;
  updatedAt: string;
  error?: string;
  jobId?: string;
}

export function JobStatusCard({
  filename,
  status,
  agent,
  updatedAt,
  error,
  jobId
}: JobStatusProps) {
  const fetcher = useFetcher();
  
  // Configuration des couleurs en fonction du statut
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
    invalid: 'bg-red-100 text-red-800'
  };

  // Fonction pour relancer un job échoué
  const handleRetry = () => {
    if (!jobId) return;
    
    fetcher.submit(
      { jobId, filename },
      { method: "post", action: "/admin/jobs/retry" }
    );
  };

  return (
    <div className="border rounded-md p-4 shadow-sm mb-3 bg-white">
      <div className="flex justify-between items-center">
        <h3 className="font-bold truncate">{filename}</h3>
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500">Agent: {agent}</p>
        <p className="text-xs text-gray-400 mt-1">Dernière mise à jour: {new Date(updatedAt).toLocaleString()}</p>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
          <p className="text-red-600 text-sm flex items-start">
            <span className="mr-1">❌</span>
            <span>{error}</span>
          </p>
        </div>
      )}
      
      {/* Bouton de retry pour les jobs en erreur */}
      {status === 'invalid' && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleRetry}
            disabled={fetcher.state !== 'idle'}
            className={`px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors ${
              fetcher.state !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {fetcher.state !== 'idle' ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Relance...
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Réessayer
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}