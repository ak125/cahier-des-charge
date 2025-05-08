import { useState } from 'react';
import type { MCPManifest, Migration } from '../types';

interface MigrationTableProps {
  migrations: Migration[];
  onRerun?: (migrationId: string) => void;
  onViewDetails?: (migration: Migration) => void;
  onFixError?: (migration: Migration) => void;
}

export default function MigrationTable({
  migrations,
  onRerun,
  onViewDetails,
  onFixError,
}: MigrationTableProps) {
  const [sortField, setSortField] = useState<keyof Migration>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');

  const handleSort = (field: keyof Migration) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredMigrations = migrations.filter((migration) => {
    return (
      migration.id.toLowerCase().includes(filter.toLowerCase()) ||
      migration.source.toLowerCase().includes(filter.toLowerCase()) ||
      migration.target.toLowerCase().includes(filter.toLowerCase()) ||
      migration.status.toLowerCase().includes(filter.toLowerCase())
    );
  });

  const sortedMigrations = [...filteredMigrations].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Complété
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Échoué
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            En cours
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            En attente
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Migrations MCP</h3>
          <div>
            <input
              type="text"
              placeholder="Filtrer les migrations..."
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('id')}
            >
              ID
              {sortField === 'id' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('source')}
            >
              Source
              {sortField === 'source' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('target')}
            >
              Cible
              {sortField === 'target' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Statut
              {sortField === 'status' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
              onClick={() => handleSort('timestamp')}
            >
              Date
              {sortField === 'timestamp' && (
                <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedMigrations.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-4 text-sm text-center text-gray-500">
                Aucune migration ne correspond à votre recherche
              </td>
            </tr>
          ) : (
            sortedMigrations.map((migration) => (
              <tr key={migration.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                  {migration.id}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {migration.source}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {migration.target}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {getStatusBadge(migration.status)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {new Date(migration.timestamp).toLocaleString('fr-FR')}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-right space-x-2">
                  <button
                    onClick={() => onViewDetails?.(migration)}
                    className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded"
                  >
                    Détails
                  </button>
                  {migration.status.toLowerCase() === 'failed' && (
                    <button
                      onClick={() => onFixError?.(migration)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-900 bg-red-50 rounded"
                    >
                      Corriger
                    </button>
                  )}
                  <button
                    onClick={() => onRerun?.(migration.id)}
                    className="px-2 py-1 text-xs text-green-600 hover:text-green-900 bg-green-50 rounded"
                  >
                    Relancer
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
