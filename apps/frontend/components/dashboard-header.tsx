import { Link } from '@remix-run/react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <div className="dashboard-title">
        <h1>{title}</h1>
        {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
      </div>
      <div className="dashboard-actions">
        <button className="dashboard-button primary">Rafraîchir</button>
        <Link to="/admin/reports" className="dashboard-button secondary">
          Rapports
        </Link>
        <Link to="/admin/settings" className="dashboard-button secondary">
          Paramètres
        </Link>
      </div>
    </div>
  );
}
