import React from 'react';
import type { LangfuseTrace } from '~/models/job.server';
import { openLangfuseTrace } from '~/models/job.server';

interface LangfuseTraceCardProps {
  trace: LangfuseTrace;
  compact?: boolean;
}

export default function LangfuseTraceCard({ trace, compact = false }: LangfuseTraceCardProps) {
  // Formater le temps d'exécution
  const getExecutionTime = () => {
    if (!trace.endTime) return 'En cours...';
    const start = new Date(trace.startTime).getTime();
    const end = new Date(trace.endTime).getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
    return `${Math.round(durationMs / 60000)}min ${Math.round((durationMs % 60000) / 1000)}s`;
  };

  // Calculer le coût approximatif (en USD) basé sur les tokens
  // Prix approximatifs pour gpt-4 en avril 2025
  const calculateCost = () => {
    if (!trace.promptTokens || !trace.completionTokens) return 'N/A';
    
    let costPerPromptToken = 0;
    let costPerCompletionToken = 0;
    
    // Définir les coûts selon le modèle
    switch(trace.modelName) {
      case 'gpt-4':
        costPerPromptToken = 0.00003;
        costPerCompletionToken = 0.00006;
        break;
      case 'gpt-4-turbo':
        costPerPromptToken = 0.00001;
        costPerCompletionToken = 0.00003;
        break;
      default:
        costPerPromptToken = 0.000005;
        costPerCompletionToken = 0.000015;
    }
    
    const promptCost = trace.promptTokens * costPerPromptToken;
    const completionCost = trace.completionTokens * costPerCompletionToken;
    const totalCost = promptCost + completionCost;
    
    return `$${totalCost.toFixed(4)}`;
  };

  const handleViewTrace = () => {
    openLangfuseTrace(trace.traceId, trace.projectId);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-100 rounded-md text-sm mb-2">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
            <span className="text-indigo-500 text-xs">AI</span>
          </div>
          <div>
            <div className="font-medium text-indigo-800">{trace.name}</div>
            <div className="text-xs text-indigo-500">{trace.modelName || 'AI Model'}</div>
          </div>
        </div>
        <button 
          onClick={handleViewTrace}
          className="px-2 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600"
        >
          Voir trace
        </button>
      </div>
    );
  }

  return (
    <div className="langfuse-trace-card bg-white border border-indigo-200 rounded-lg overflow-hidden shadow-sm mb-4">
      <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-indigo-500">🧠</span>
          </div>
          <div>
            <h3 className="font-medium text-indigo-800">{trace.name}</h3>
            <div className="text-xs text-indigo-500">{trace.traceId}</div>
          </div>
        </div>
        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
          {trace.modelName || 'AI Model'}
        </span>
      </div>
      
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-500">Durée:</span>{' '}
            <span className="font-medium">{getExecutionTime()}</span>
          </div>
          <div>
            <span className="text-gray-500">Tokens:</span>{' '}
            <span className="font-medium">{trace.totalTokens || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Coût estimé:</span>{' '}
            <span className="font-medium">{calculateCost()}</span>
          </div>
          <div>
            <span className="text-gray-500">Projet:</span>{' '}
            <span className="font-medium">{trace.projectId}</span>
          </div>
        </div>
        
        {trace.tags && trace.tags.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {trace.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-2 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleViewTrace}
            className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 transition-colors"
          >
            Voir dans Langfuse
          </button>
        </div>
      </div>
    </div>
  );
}