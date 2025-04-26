import React from reactstructure-agent";

interface TableSchema {
  name: string;
  category: string;
  columns: Record<string, {
    type: string;
    nullable: boolean;
    isPrimary: boolean;
    isForeign: boolean;
    references?: {
      table: string;
      column: string;
    };
  }>;
}

interface TableStatus {
  status: string;
  assignedTo?: string;
  lastUpdated?: string;
  notes?: string;
}

interface DebtInfo {
  score: number;
  issues: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
  suggestions: string[];
}

interface TableCardProps {
  tableName: string;
  schema: TableSchema;
  status: TableStatus;
  debtInfo: DebtInfo;
  isSelected: boolean;
  onSelect: () => void;
}

const TableCard: React.FC<TableCardProps> = ({
  tableName,
  schema,
  status,
  debtInfo,
  isSelected,
  onSelect,
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending": return "bg-gray-200";
      case "blocked": return "bg-red-200";
      case "in_progress": return "bg-yellow-200";
      case "migrated": return "bg-blue-200";
      case "validated": return "bg-green-200";
      case "ignored": return "bg-purple-200";
      default: return "bg-gray-100";
    }
  };
  
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "blocked": return "Bloquée";
      case "in_progress": return "En cours";
      case "migrated": return "Migrée";
      case "validated": return "Validée";
      case "ignored": return "Ignorée";
      default: return "Non défini";
    }
  };
  
  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "business": return "Métier";
      case "pivot": return "Pivot (N:N)";
      case "technical": return "Technique";
      default: return category || "Non défini";
    }
  };
  
  const getDebtLabel = (score: number) => {
    if (score > 70) return "Élevée";
    if (score > 30) return "Moyenne";
    return "Faible";
  };
  
  // Compter les relations
  const relationCount = Object.values(schema.columns || {}).filter(c => c.isForeign).length;
  
  return (
    <div 
      className={`table-card ${isSelected ? 'selected' : ''} ${getStatusColor(status?.status)}`}
      onClick={onSelect}
    >
      <div className="table-card-header">
        <h3>{tableName}</h3>
        <span className="category-badge">{getCategoryLabel(schema.category)}</span>
      </div>
      
      <div className="table-card-body">
        <div className="table-stats">
          <div className="stat">
            <div className="stat-value">{Object.keys(schema.columns || {}).length}</div>
            <div className="stat-label">Colonnes</div>
          </div>
          <div className="stat">
            <div className="stat-value">{relationCount}</div>
            <div className="stat-label">Relations</div>
          </div>
          <div className="stat">
            <div className="stat-value">{debtInfo?.score || 0}</div>
            <div className="stat-label">Dette</div>
          </div>
        </div>
        
        <div className="table-status">
          <div className="status-badge">
            {getStatusLabel(status?.status)}
          </div>
          {status?.assignedTo && (
            <div className="assigned-to">
              <span>Assigné à:</span> {status.assignedTo}
            </div>
          )}
        </div>
        
        {debtInfo?.issues && debtInfo.issues.length > 0 && (
          <div className="debt-issues">
            <div className="debt-level">
              Dette: <span className={`debt-level-${getDebtLabel(debtInfo.score).toLowerCase()}`}>
                {getDebtLabel(debtInfo.score)}
              </span>
            </div>
            <div className="top-issue">
              <span className="issue-icon">⚠️</span>
              {debtInfo.issues[0].description}
            </div>
          </div>
        )}
      </div>
      
      <div className="table-card-footer">
        {status?.lastUpdated && (
          <div className="last-updated">
            Mise à jour: {new Date(status.lastUpdated).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableCard;