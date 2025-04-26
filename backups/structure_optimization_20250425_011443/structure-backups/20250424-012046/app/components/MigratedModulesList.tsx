import { Link } from @remix-run/reactstructure-agent";
import type { MigratedModule } from ~/models/migration.serverstructure-agent";

interface MigratedModulesListProps {
  modules: MigratedModule[];
}

export default function MigratedModulesList({ modules }: MigratedModulesListProps) {
  // Format relatif pour les dates
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: MigratedModule['status'] }) => {
    const statusMap = {
      success: { label: 'Succès', className: 'badge-success' },
      partial: { label: 'Partiel', className: 'badge-warning' },
      failed: { label: 'Échec', className: 'badge-danger' },
      in_review: { label: 'En revue', className: 'badge-info' }
    };
    
    const { label, className } = statusMap[status];
    
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  return (
    <div className="modules-list">
      <div className="modules-summary">
        <div className="summary-card">
          <span className="summary-number">{modules.length}</span>
          <span className="summary-label">Total migrés</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {modules.filter(m => m.status === 'success').length}
          </span>
          <span className="summary-label">Réussis</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {modules.filter(m => m.testCoverage >= 80).length}
          </span>
          <span className="summary-label">Bonne couverture</span>
        </div>
      </div>
      
      <div className="modules-table-container">
        <table className="modules-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Statut</th>
              <th>Tests</th>
              <th>Qualité</th>
              <th>Migré</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(module => (
              <tr key={module.id}>
                <td>
                  <div className="module-name">{module.name}</div>
                  <div className="module-path">{module.destinationPath}</div>
                </td>
                <td><StatusBadge status={module.status} /></td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress-value" 
                      style={{ width: `${module.testCoverage}%` }}
                      data-value={`${module.testCoverage}%`}
                    />
                  </div>
                </td>
                <td>
                  <div className="quality-score">
                    <span className={`score score-${Math.floor(module.qualityScore / 10)}`}>
                      {module.qualityScore}
                    </span>
                  </div>
                </td>
                <td>{formatRelativeTime(module.migratedAt)}</td>
                <td>
                  <div className="module-actions">
                    <Link to={`/admin/modules/${module.id}`} className="action-button view">
                      Voir
                    </Link>
                    {module.hasAudit && (
                      <Link to={`/admin/audit/${module.id}`} className="action-button audit">
                        Audit
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="modules-footer">
        <Link to="/admin/modules" className="view-all-link">
          Voir tous les modules
        </Link>
      </div>
    </div>
  );
}
