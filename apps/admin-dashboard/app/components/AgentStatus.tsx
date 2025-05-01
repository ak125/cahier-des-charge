import { useEffect, useState } from 'react';
import type { Agent, AgentStatus as AgentStatusType } from '../types';

interface AgentStatusProps {
  agents: Agent[];
  onRefresh?: () => void;
  onRestartAgent?: (agentId: string) => void;
  onViewLogs?: (agentId: string) => void;
  onViewMetrics?: (agentId: string) => void; // Nouvelle prop pour visualiser les métriques
  onConfigureAgent?: (agentId: string) => void; // Nouvelle prop pour configurer l'agent
}

export default function AgentStatus({
  agents,
  onRefresh,
  onRestartAgent,
  onViewLogs,
  onViewMetrics,
  onConfigureAgent,
}: AgentStatusProps) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'lastRunTime' | 'performance'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [_groupByLayer, _setGroupByLayer] = useState(false);

  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const filteredAgents = agents.filter((agent) => {
    return (
      (filterStatus ? agent.status.toLowerCase() === filterStatus.toLowerCase() : true) &&
      (agent.name.toLowerCase().includes(filter.toLowerCase()) ||
        agent.id.toLowerCase().includes(filter.toLowerCase()) ||
        agent.status.toLowerCase().includes(filter.toLowerCase()))
    );
  });

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === 'status') {
      return sortDirection === 'asc'
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    if (sortBy === 'performance') {
      return sortDirection === 'asc'
        ? a.performance - b.performance
        : b.performance - a.performance;
    }
    // lastRunTime
    const aTime = a.lastRunTime ? new Date(a.lastRunTime).getTime() : 0;
    const bTime = b.lastRunTime ? new Date(b.lastRunTime).getTime() : 0;
    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
  });

  const getStatusIndicator = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return (
          <span className="flex items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400 mr-2" />
            Actif
          </span>
        );
      case 'idle':
        return (
          <span className="flex items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400 mr-2" />
            En attente
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400 mr-2" />
            Erreur
          </span>
        );
      case 'disabled':
        return (
          <span className="flex items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400 mr-2" />
            Désactivé
          </span>
        );
      default:
        return (
          <span className="flex items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 mr-2" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">État des Agents MCP</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filtrer les agents..."
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
            >
              <option value="">Tous les statuts</option>
              <option value="running">Actif</option>
              <option value="idle">En attente</option>
              <option value="error">Erreur</option>
              <option value="disabled">Désactivé</option>
            </select>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('name')}
            >
              Agent
              {sortBy === 'name' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Statut
              {sortBy === 'status' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Version
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('lastRunTime')}
            >
              Dernière exécution
              {sortBy === 'lastRunTime' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedAgents.map((agent) => (
            <tr key={agent.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                {agent.name}
                <div className="text-xs text-gray-500">{agent.id}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {getStatusIndicator(agent.status)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{agent.version}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {agent.lastRunTime ? new Date(agent.lastRunTime).toLocaleString('fr-FR') : '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-right space-x-2">
                <button
                  onClick={() => onViewLogs?.(agent.id)}
                  className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded"
                >
                  Logs
                </button>
                <button
                  onClick={() => onRestartAgent?.(agent.id)}
                  className="px-2 py-1 text-xs text-green-600 hover:text-green-900 bg-green-50 rounded"
                >
                  Redémarrer
                </button>
                <button
                  onClick={() => onViewMetrics?.(agent.id)}
                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-900 bg-blue-50 rounded"
                >
                  Métriques
                </button>
                <button
                  onClick={() => onConfigureAgent?.(agent.id)}
                  className="px-2 py-1 text-xs text-yellow-600 hover:text-yellow-900 bg-yellow-50 rounded"
                >
                  Configurer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
