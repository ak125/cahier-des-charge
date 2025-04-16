import React, { useState, useEffect } from 'react';
import type { ExecutionHistoryEntry, TemporalJob } from '~/models/job.server';
import { getJobExecutionHistory, getUpcomingScheduledExecutions } from '~/models/job.server';

interface ExecutionHistoryPanelProps {
  job: TemporalJob;
  initialHistory?: ExecutionHistoryEntry[];
}

export default function ExecutionHistoryPanel({ job, initialHistory }: ExecutionHistoryPanelProps) {
  const [history, setHistory] = useState<ExecutionHistoryEntry[]>(initialHistory || job.executionHistory || []);
  const [upcomingExecutions, setUpcomingExecutions] = useState<{ scheduledTime: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Récupérer l'historique complet si nécessaire
  useEffect(() => {
    const fetchHistory = async () => {
      if (!initialHistory && (!job.executionHistory || job.executionHistory.length <= 1)) {
        setIsLoading(true);
        try {
          const fullHistory = await getJobExecutionHistory(job.workflowId);
          setHistory(fullHistory);
          
          // Si c'est un job récurrent, on récupère aussi les exécutions programmées
          if (job.isRecurring) {
            const upcoming = await getUpcomingScheduledExecutions(job.workflowId);
            setUpcomingExecutions(upcoming);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'historique:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchHistory();
  }, [job, initialHistory]);
  
  // Trier l'historique par date de début (le plus récent en premier)
  const sortedHistory = [...history].sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });
  
  // Formatage du temps relatif
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 0) {
      // Pour les dates futures
      const absDiff = Math.abs(diffInSeconds);
      if (absDiff < 60) return 'Dans quelques secondes';
      if (absDiff < 3600) return `Dans ${Math.floor(absDiff / 60)} min`;
      if (absDiff < 86400) return `Dans ${Math.floor(absDiff / 3600)} h`;
      return `Dans ${Math.floor(absDiff / 86400)} j`;
    } else {
      // Pour les dates passées
      if (diffInSeconds < 60) return 'À l\'instant';
      if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
      if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
      return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    }
  };
  
  // Formater la durée
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}min ${Math.round((ms % 60000) / 1000)}s`;
  };
  
  // Obtenir la classe CSS pour le statut
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Traduction des statuts
  const translateStatus = (status: string) => {
    switch(status) {
      case 'completed': return 'Terminé';
      case 'running': return 'En cours';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };
  
  const formatScheduleFrequency = () => {
    if (!job.isRecurring) return null;
    
    switch(job.frequency) {
      case 'daily': return 'Quotidienne';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuelle';
      default: return 'Planifiée';
    }
  };

  return (
    <div className="execution-history-panel">
      <h3 className="text-lg font-medium mb-3">Historique d'exécution</h3>
      
      {job.isRecurring && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center text-blue-800 mb-2">
            <span className="text-lg mr-2">🔄</span>
            <span className="font-medium">Exécution {formatScheduleFrequency()}</span>
          </div>
          
          {upcomingExecutions.length > 0 && (
            <div>
              <div className="text-sm text-blue-700 mb-1">Prochaines exécutions planifiées:</div>
              <ul className="text-sm space-y-1 ml-6 list-disc">
                {upcomingExecutions.map((exec, i) => (
                  <li key={i}>{formatRelativeTime(exec.scheduledTime)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-4 text-gray-500">
          Chargement de l'historique...
        </div>
      ) : sortedHistory.length > 0 ? (
        <div className="space-y-3">
          {sortedHistory.map((entry, index) => (
            <div 
              key={entry.id || index}
              className={`border rounded-md p-3 ${getStatusClass(entry.status)}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium">Tentative #{entry.attempt}</div>
                <div className="px-2 py-0.5 text-xs rounded-full bg-white bg-opacity-50">
                  {translateStatus(entry.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="opacity-70">Démarré: </span>
                  <span>{formatRelativeTime(entry.startTime)}</span>
                </div>
                {entry.endTime && (
                  <div>
                    <span className="opacity-70">Terminé: </span>
                    <span>{formatRelativeTime(entry.endTime)}</span>
                  </div>
                )}
                {entry.duration && (
                  <div>
                    <span className="opacity-70">Durée: </span>
                    <span>{formatDuration(entry.duration)}</span>
                  </div>
                )}
              </div>
              
              {entry.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800 whitespace-pre-wrap">
                  {entry.error}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 border border-dashed rounded-md">
          Aucun historique d'exécution disponible
        </div>
      )}
    </div>
  );
}