import { useState } from 'react';
import type { TemporalJob } from '~/models/job.server';
import { cancelTemporalJob, retryTemporalJob } from '~/models/job.server';
import LangfuseTraceCard from './LangfuseTraceCard';
import GitHubPRCard from './GitHubPRCard';
import ExecutionHistoryPanel from './ExecutionHistoryPanel';

interface JobStatusCardProps {
  job: TemporalJob;
  onRefresh?: () => void;
  compact?: boolean;
}

export default function JobStatusCard({ job, onRefresh, compact = false }: JobStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'langfuse' | 'github'>('details');
  
  // Formater la durée en format lisible
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}min ${Math.round((ms % 60000) / 1000)}s`;
  };
  
  // Formater la date relative
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  };

  // Actions sur les jobs
  const handleCancel = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce job ?')) {
      setIsLoading(true);
      try {
        await cancelTemporalJob(job.workflowId);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Erreur lors de l\'annulation du job :', error);
      }
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      await retryTemporalJob(job.workflowId);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erreur lors de la relance du job :', error);
    }
    setIsLoading(false);
  };
  
  // Définir les classes CSS en fonction du statut
  const getStatusClasses = () => {
    switch (job.status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'retry': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Traduire le statut en français
  const getStatusLabel = () => {
    switch (job.status) {
      case 'completed': return 'Terminé';
      case 'running': return 'En cours';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      case 'cancelled': return 'Annulé';
      case 'retry': return 'Relance';
      default: return job.status;
    }
  };
  
  // Icône du statut
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed': return '✅';
      case 'running': return '⏳';
      case 'pending': return '⏱️';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      case 'retry': return '🔄';
      default: return '❓';
    }
  };
  
  // Badges pour indiquer la présence de liens associés
  const renderBadges = () => {
    const badges = [];
    
    if (job.langfuseTraces && job.langfuseTraces.length > 0) {
      badges.push(
        <span key="ai" className="text-xs py-0.5 px-2 bg-indigo-100 text-indigo-800 rounded-full flex items-center gap-1">
          <span>🧠</span>
          <span>AI: {job.langfuseTraces.length}</span>
        </span>
      );
    }
    
    if (job.githubPR) {
      badges.push(
        <span key="pr" className="text-xs py-0.5 px-2 bg-gray-100 text-gray-800 rounded-full flex items-center gap-1">
          <span>🔀</span>
          <span>PR #{job.githubPR.prNumber}</span>
        </span>
      );
    }
    
    if (job.isRecurring) {
      badges.push(
        <span key="recurring" className="text-xs py-0.5 px-2 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
          <span>🔄</span>
          <span>Récurrent</span>
        </span>
      );
    }
    
    return badges.length > 0 ? <div className="flex gap-1 mt-1">{badges}</div> : null;
  };
  
  if (compact) {
    return (
      <div className={`job-status-card-compact rounded-md border p-3 mb-2 ${getStatusClasses()}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <div>
              <h4 className="font-medium">{job.name}</h4>
              <p className="text-sm opacity-70">{formatRelativeTime(job.startTime)}</p>
              {renderBadges()}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
              {getStatusLabel()}
            </span>
            {(job.status === 'running' || job.status === 'pending') && (
              <button 
                onClick={handleCancel} 
                disabled={isLoading}
                className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-50 text-sm"
                title="Annuler"
              >
                ⏹️
              </button>
            )}
            {job.status === 'failed' && (
              <button 
                onClick={handleRetry} 
                disabled={isLoading}
                className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-50 text-sm"
                title="Réessayer"
              >
                🔄
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`job-status-card rounded-lg border shadow-sm mb-4 ${getStatusClasses()}`}>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getStatusIcon()}</span>
            <div>
              <h3 className="text-lg font-medium">{job.name}</h3>
              <p className="text-sm text-gray-600">ID: {job.workflowId}</p>
              {renderBadges()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`
              px-3 py-1 rounded-full font-medium text-sm
              ${job.status === 'running' ? 'animate-pulse' : ''}
              bg-white bg-opacity-50
            `}>
              {getStatusLabel()}
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-50"
              title={isExpanded ? "Masquer les détails" : "Afficher les détails"}
            >
              {isExpanded ? '🔼' : '🔽'}
            </button>
          </div>
        </div>
        
        {job.status === 'running' && job.progress !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progression</span>
              <span>{job.progress}%</span>
            </div>
            <div className="h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${job.progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="opacity-70">Démarré: </span>
            <span>{formatRelativeTime(job.startTime)}</span>
          </div>
          {job.endTime && (
            <div>
              <span className="opacity-70">Terminé: </span>
              <span>{formatRelativeTime(job.endTime)}</span>
            </div>
          )}
          {job.duration && (
            <div>
              <span className="opacity-70">Durée: </span>
              <span>{formatDuration(job.duration)}</span>
            </div>
          )}
          <div>
            <span className="opacity-70">Tentatives: </span>
            <span>{job.attempts}/{job.maxAttempts}</span>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-opacity-20">
            {/* Navigation par onglets */}
            <div className="border-b mb-4">
              <div className="flex">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Détails
                </button>
                
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Historique
                </button>
                
                {job.langfuseTraces && job.langfuseTraces.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('langfuse')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${activeTab === 'langfuse' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <span>🧠</span>
                    <span>Traces IA ({job.langfuseTraces.length})</span>
                  </button>
                )}
                
                {job.githubPR && (
                  <button 
                    onClick={() => setActiveTab('github')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${activeTab === 'github' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <span>🔀</span>
                    <span>GitHub PR</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Contenu des onglets */}
            {activeTab === 'details' && (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="opacity-70">Type: </span>
                    <span className="font-mono">{job.type}</span>
                  </div>
                  <div>
                    <span className="opacity-70">File: </span>
                    <span className="font-mono">{job.taskQueue}</span>
                  </div>
                  <div>
                    <span className="opacity-70">RunID: </span>
                    <span className="font-mono text-xs break-all">{job.runId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="opacity-70">Priorité: </span>
                    <span>{job.priority}</span>
                  </div>
                </div>
                
                {job.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm font-mono text-red-800 whitespace-pre-wrap">
                    {job.error}
                  </div>
                )}
                
                {job.metadata && Object.keys(job.metadata).length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-1">Métadonnées:</h4>
                    <div className="bg-white bg-opacity-50 p-2 rounded text-sm font-mono">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(job.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'history' && (
              <ExecutionHistoryPanel job={job} />
            )}
            
            {activeTab === 'langfuse' && job.langfuseTraces && (
              <div className="space-y-4">
                {job.langfuseTraces.map((trace, index) => (
                  <LangfuseTraceCard key={index} trace={trace} />
                ))}
              </div>
            )}
            
            {activeTab === 'github' && job.githubPR && (
              <GitHubPRCard pr={job.githubPR} />
            )}
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-white bg-opacity-20 flex justify-end gap-2 rounded-b-lg">
        {(job.status === 'running' || job.status === 'pending') && (
          <button 
            onClick={handleCancel}
            disabled={isLoading}
            className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-md text-sm font-medium transition-colors"
          >
            {isLoading ? 'Annulation...' : 'Annuler'}
          </button>
        )}
        
        {job.status === 'failed' && (
          <button 
            onClick={handleRetry}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-md text-sm font-medium transition-colors"
          >
            {isLoading ? 'Relance...' : 'Réessayer'}
          </button>
        )}
      </div>
    </div>
  );
}