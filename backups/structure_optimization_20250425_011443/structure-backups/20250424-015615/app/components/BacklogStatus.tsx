import { Link } from @remix-run/reactstructure-agent";
import type { BacklogStatus as BacklogStatusType } from ~/models/backlog.serverstructure-agent";

interface BacklogStatusProps {
  backlog: BacklogStatusType;
}

export default function BacklogStatus({ backlog }: BacklogStatusProps) {
  // Calculer le pourcentage de complétion
  const completionPercentage = Math.round((backlog.completed / backlog.total) * 100);
  
  // Formater le temps estimé
  const formatEstimatedTime = (hours: number) => {
    if (hours < 24) return `${hours} heures`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} jour${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} h` : ''}`;
  };

  return (
    <div className="backlog-status">
      <div className="backlog-summary">
        <div className="progress-container">
          <div className="progress-circle">
            <svg viewBox="0 0 36 36">
              <path
                className="progress-circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="progress-circle-fill"
                strokeDasharray={`${completionPercentage}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="progress-text">
                {completionPercentage}%
              </text>
            </svg>
          </div>
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-value">{backlog.completed}</span>
              <span className="stat-label">Complétés</span>
            </div>
            <div className="stat">
              <span className="stat-value">{backlog.inProgress}</span>
              <span className="stat-label">En cours</span>
            </div>
            <div className="stat">
              <span className="stat-value">{backlog.pending}</span>
              <span className="stat-label">En attente</span>
            </div>
          </div>
        </div>
        
        <div className="time-estimate">
          <span className="estimate-label">Temps restant estimé:</span>
          <span className="estimate-value">
            {formatEstimatedTime(backlog.estimatedRemainingTime)}
          </span>
        </div>
      </div>
      
      <div className="backlog-priority-items">
        <h3>Modules prioritaires</h3>
        <div className="priority-items-list">
          {backlog.items
            .filter(item => item.priority >= 4)
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 3)
            .map(item => (
              <div key={item.id} className="priority-item">
                <div className="item-priority">P{item.priority}</div>
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-path">{item.modulePath}</div>
                  <div className="item-metrics">
                    <span className="item-complexity">
                      Complexité: {item.complexity}/5
                    </span>
                    <span className="item-effort">
                      Effort: {item.estimatedEffort}h
                    </span>
                  </div>
                </div>
                <div className="item-status">
                  <span className={`status-badge status-${item.status}`}>
                    {item.status === 'pending' && 'En attente'}
                    {item.status === 'scheduled' && 'Planifié'}
                    {item.status === 'in_progress' && 'En cours'}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      <div className="backlog-footer">
        <Link to="/admin/backlog" className="view-all-link">
          Voir tout le backlog
        </Link>
        <button className="priority-button">
          Planifier prochaine migration
        </button>
      </div>
    </div>
  );
}
