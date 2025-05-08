import { useEffect, useRef, useState } from 'react';

interface LogViewerProps {
  logs: string[];
  title?: string;
  maxLines?: number;
  autoScroll?: boolean;
  loading?: boolean;
  onClear?: () => void;
  onRefresh?: () => void;
}

export default function LogViewer({
  logs = [],
  title = 'Logs du système',
  maxLines = 500,
  autoScroll = true,
  loading = false,
  onClear,
  onRefresh,
}: LogViewerProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(autoScroll);

  // Auto-scroll au bas des logs quand de nouvelles entrées sont ajoutées
  useEffect(() => {
    if (isAutoScrollEnabled && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScrollEnabled]);

  // Filtrage des logs
  const filteredLogs = filter
    ? logs.filter((log) => log.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  // Limiter le nombre de lignes affichées pour des raisons de performance
  const displayedLogs = filteredLogs.slice(-maxLines);

  // Fonction pour mettre en évidence des mots-clés dans les logs
  const highlightKeywords = (log: string) => {
    // Mettre en évidence les erreurs en rouge
    let highlightedLog = log.replace(
      /(error|failed|exception|erreur|échec|fail)/gi,
      '<span class="text-red-500 font-semibold">$1</span>'
    );

    // Mettre en évidence les avertissements en jaune
    highlightedLog = highlightedLog.replace(
      /(warning|warn|attention|avertissement)/gi,
      '<span class="text-yellow-500 font-semibold">$1</span>'
    );

    // Mettre en évidence les succès en vert
    highlightedLog = highlightedLog.replace(
      /(success|succeeded|complété|terminé|done)/gi,
      '<span class="text-green-500 font-semibold">$1</span>'
    );

    // Mettre en évidence les noms d'agents
    highlightedLog = highlightedLog.replace(
      /\b(PhpAnalyzer|MysqlAnalyzer|SqlAnalyzer|DataAnalyzer|RemixGenerator|NestjsGenerator)\b/g,
      '<span class="text-blue-500 font-semibold">$1</span>'
    );

    // Si un filtre est actif, mettre en évidence les termes recherchés
    if (filter) {
      const escapedFilter = filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const filterRegex = new RegExp(`(${escapedFilter})`, 'gi');
      highlightedLog = highlightedLog.replace(filterRegex, '<span class="bg-yellow-200">$1</span>');
    }

    return highlightedLog;
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filtrer les logs..."
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="flex items-center">
              <input
                id="auto-scroll"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={isAutoScrollEnabled}
                onChange={(e) => setIsAutoScrollEnabled(e.target.checked)}
              />
              <label htmlFor="auto-scroll" className="ml-2 block text-sm text-gray-900">
                Auto-scroll
              </label>
            </div>
            <button
              onClick={onRefresh}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Actualiser
            </button>
            <button
              onClick={onClear}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Effacer
            </button>
          </div>
        </div>
      </div>

      <div
        ref={logContainerRef}
        className="bg-gray-900 p-4 font-mono text-sm text-gray-300 h-96 overflow-auto"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : displayedLogs.length > 0 ? (
          displayedLogs.map((log, index) => (
            <div
              key={index}
              className="py-1 border-b border-gray-800 last:border-0"
              dangerouslySetInnerHTML={{ __html: highlightKeywords(log) }}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucun log à afficher
          </div>
        )}
      </div>

      {filteredLogs.length > maxLines && (
        <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs">
          Affichage limité aux {maxLines} dernières lignes sur un total de {filteredLogs.length}{' '}
          lignes correspondantes.
        </div>
      )}
    </div>
  );
}
