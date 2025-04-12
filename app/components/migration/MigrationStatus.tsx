import React from "react";

interface TaskStatus {
  status: string;
  progress: number;
  assignedTo?: string;
  lastUpdated: string;
  notes?: string;
}

interface MigrationStatusProps {
  tables: Record<string, TaskStatus>;
  onTableSelect: (tableName: string) => void;
  realtimeUpdate: any | null;
}

export default function MigrationStatus({ 
  tables, 
  onTableSelect,
  realtimeUpdate 
}: MigrationStatusProps) {
  // Grouper les tables par statut
  const groupedTables: Record<string, string[]> = {
    pending: [],
    blocked: [],
    in_progress: [],
    migrated: [],
    validated: [],
    ignored: []
  };

  Object.entries(tables).forEach(([tableName, tableStatus]) => {
    const status = tableStatus.status;
    if (groupedTables[status]) {
      groupedTables[status].push(tableName);
    }
  });

  // Icônes et couleurs pour chaque statut
  const statusInfo = {
    pending: { icon: "⏳", color: "gray", label: "En attente" },
    blocked: { icon: "🛑", color: "red", label: "Bloqué" },
    in_progress: { icon: "🔄", color: "blue", label: "En cours" },
    migrated: { icon: "✅", color: "green", label: "Migré" },
    validated: { icon: "🏆", color: "purple", label: "Validé" },
    ignored: { icon: "⏭️", color: "lightgray", label: "Ignoré" }
  };
  
  // Vérifier si une table a été mise à jour en temps réel
  const isRealtimeUpdated = (tableName: string) => {
    return realtimeUpdate && realtimeUpdate.table_name === tableName;
  };

  return (
    <div className="migration-status-container">
      <h3>Statut de Migration</h3>
      
      {Object.entries(groupedTables).map(([status, tableNames]) => (
        <div key={status} className="status-group">
          <h4 style={{ color: statusInfo[status as keyof typeof statusInfo]?.color }}>
            {statusInfo[status as keyof typeof statusInfo]?.icon} {statusInfo[status as keyof typeof statusInfo]?.label} ({tableNames.length})
          </h4>
          
          <ul className="status-table-list">
            {tableNames.map(tableName => (
              <li 
                key={tableName}
                className={`status-table-item ${isRealtimeUpdated(tableName) ? 'realtime-updated' : ''}`}
                onClick={() => onTableSelect(tableName)}
              >
                <span className="table-name">{tableName}</span>
                {tables[tableName].progress < 100 && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${tables[tableName].progress}%` }}
                    ></div>
                  </div>
                )}
                {tables[tableName].assignedTo && (
                  <span className="assigned-to" title={`Assigné à: ${tables[tableName].assignedTo}`}>
                    👤
                  </span>
                )}
                {isRealtimeUpdated(tableName) && (
                  <span className="update-indicator" title="Mise à jour en temps réel">
                    🔔
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      
      {Object.keys(tables).length === 0 && (
        <div className="no-tables-message">
          Aucune table avec statut de migration
        </div>
      )}
    </div>
  );
}