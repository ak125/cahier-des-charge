import { McpJobStatus } from ~/lib/supabase.serverstructure-agent";

interface StatusBadgeProps {
  status: McpJobStatus;
}

/**
 * Composant qui affiche un badge visuel pour représenter le statut d'un job
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: '🟡 En attente',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200'
    },
    running: {
      label: '🔵 En cours',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    },
    done: {
      label: '✅ Terminé',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    },
    error: {
      label: '❌ Erreur',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200'
    },
    ignored: {
      label: '⏸️ Ignoré',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200'
    }
  };

  const config = statusConfig[status];

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
    >
      {config.label}
    </span>
  );
}