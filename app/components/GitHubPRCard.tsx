import React from 'react';
import type { GitHubPR } from '~/models/job.server';

interface GitHubPRCardProps {
  pr: GitHubPR;
  compact?: boolean;
}

export default function GitHubPRCard({ pr, compact = false }: GitHubPRCardProps) {
  // Obtenir la couleur du statut
  const getStatusColor = () => {
    switch(pr.status) {
      case 'merged': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'open': return 'bg-green-100 border-green-300 text-green-800';
      case 'draft': return 'bg-gray-100 border-gray-300 text-gray-800';
      case 'closed': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  // Obtenir l'icône du statut
  const getStatusIcon = () => {
    switch(pr.status) {
      case 'merged': return '🔄';
      case 'open': return '📝';
      case 'draft': return '🚧';
      case 'closed': return '❌';
      default: return '❓';
    }
  };
  
  // Obtenir le libellé du statut
  const getStatusLabel = () => {
    switch(pr.status) {
      case 'merged': return 'Fusionné';
      case 'open': return 'Ouvert';
      case 'draft': return 'Brouillon';
      case 'closed': return 'Fermé';
      default: return pr.status;
    }
  };
  
  // Formatage du temps relatif
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  };

  const openPR = () => {
    window.open(pr.url, '_blank');
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md text-sm mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 flex items-center justify-center rounded-full ${getStatusColor().split(' ')[0]}`}>
            <span className="text-xs">{getStatusIcon()}</span>
          </div>
          <div className="truncate">
            <span className="font-medium">PR #{pr.prNumber}</span>
          </div>
        </div>
        <button 
          onClick={openPR}
          className="px-2 py-0.5 bg-gray-800 text-white text-xs rounded hover:bg-black"
        >
          Voir
        </button>
      </div>
    );
  }

  return (
    <div className={DoDoDoDoDoDotgithub-pr-card border rounded-lg overflow-hidden shadow-sm mb-4 ${getStatusColor()}`}>
      <div className="p-3 flex justify-between items-center border-b border-opacity-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white bg-opacity-50 rounded-full flex items-center justify-center">
            <span>{getStatusIcon()}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">PR #{pr.prNumber}</span>
              <span className="px-2 py-0.5 rounded-full bg-white bg-opacity-50 text-xs font-medium">
                {getStatusLabel()}
              </span>
            </div>
            <div className="text-xs opacity-70">
              {pr.repository}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium mb-2">{pr.title}</h3>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="opacity-70">Créé: </span>
            <span>{formatRelativeTime(pr.createdAt)}</span>
          </div>
          <div>
            <span className="opacity-70">Mis à jour: </span>
            <span>{formatRelativeTime(pr.updatedAt)}</span>
          </div>
          <div className="col-span-2">
            <span className="opacity-70">Par: </span>
            <span>{pr.author}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-2 border-t border-opacity-20 flex justify-end">
          <button 
            onClick={openPR}
            className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-black transition-colors"
          >
            Voir sur GitHub
          </button>
        </div>
      </div>
    </div>
  );
}