import React, { useState } from 'react';
import { Link } from '@remix-run/react';

type AuditData = {
  id: string;
  module_id: string;
  module_name: string;
  status: "success" | "warning" | "error";
  score: number;
  details: Record<string, any>;
  created_at: string;
};

type AuditDetailProps = {
  audit: AuditData;
  onResolve: (id: string) => Promise<void>;
};

export function AuditDetail({ audit, onResolve }: AuditDetailProps) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  const handleResolve = async () => {
    setResolving(true);
    try {
      await onResolve(audit.id);
    } catch (error) {
      console.error('Failed to resolve audit:', error);
    } finally {
      setResolving(false);
    }
  };
  
  // Formatage des détails d'audit pour un affichage plus lisible
  const formatAuditDetails = () => {
    // Vérifier si details existe et n'est pas vide
    if (!audit.details || Object.keys(audit.details).length === 0) {
      return <p>Aucun détail disponible</p>;
    }
    
    return (
      <div className="audit-details-sections">
        {/* Section SEO si présente */}
        {audit.details.seo && (
          <div className="audit-section">
            <h4>SEO</h4>
            <ul>
              {Object.entries(audit.details.seo).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {renderValue(value)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Section Performance si présente */}
        {audit.details.performance && (
          <div className="audit-section">
            <h4>Performance</h4>
            <ul>
              {Object.entries(audit.details.performance).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {renderValue(value)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Section Tests si présente */}
        {audit.details.tests && (
          <div className="audit-section">
            <h4>Tests</h4>
            <div className="tests-summary">
              <span className="test-stat">
                <span className="test-count">{audit.details.tests.passed}</span> réussis
              </span>
              <span className="test-stat">
                <span className="test-count">{audit.details.tests.failed}</span> échoués
              </span>
              <span className="test-stat">
                <span className="test-count">{audit.details.tests.total}</span> total
              </span>
            </div>
            
            {audit.details.tests.failures && audit.details.tests.failures.length > 0 && (
              <div className="test-failures">
                <h5>Tests échoués:</h5>
                <ul>
                  {audit.details.tests.failures.map((failure: any, index: number) => (
                    <li key={index}>
                      <strong>{failure.name}:</strong> {failure.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Autres sections si présentes */}
        {Object.entries(audit.details).filter(([key]) => 
          !['seo', 'performance', 'tests'].includes(key)
        ).map(([key, value]) => (
          <div key={key} className="audit-section">
            <h4>{key}</h4>
            <pre className="audit-json">{JSON.stringify(value, null, 2)}</pre>
          </div>
        ))}
      </div>
    );
  };
  
  // Helper pour rendre différents types de valeurs
  const renderValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? '✅' : '❌';
    }
    if (typeof value === 'number') {
      // Si c'est un pourcentage
      if (value >= 0 && value <= 1) {
        return `${(value * 100).toFixed(1)}%`;
      }
      return value.toString();
    }
    if (typeof value === 'object') {
      return <pre className="audit-json-inline">{JSON.stringify(value, null, 2)}</pre>;
    }
    return value;
  };
  
  return (
    <div className={`audit-card status-${audit.status}`}>
      <div className="audit-header">
        <h3>{audit.module_name}</h3>
        <div className="audit-meta">
          <span className={`audit-score score-${audit.status}`}>
            {audit.score}/100
          </span>
          <span className="audit-date">
            {new Date(audit.created_at).toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="audit-summary">
        <div className="audit-summary-item">
          <span className="label">Status:</span>
          <span className={`value status-${audit.status}`}>
            {audit.status === 'success' ? 'Succès' : 
             audit.status === 'warning' ? 'Avertissement' : 'Erreur'}
          </span>
        </div>
        
        {audit.details.coverage && (
          <div className="audit-summary-item">
            <span className="label">Couverture:</span>
            <span className="value">
              {audit.details.coverage.lines}%
            </span>
          </div>
        )}
        
        {audit.details.tests && (
          <div className="audit-summary-item">
            <span className="label">Tests:</span>
            <span className="value">
              {audit.details.tests.passed}/{audit.details.tests.total}
            </span>
          </div>
        )}
      </div>
      
      {expanded && (
        <div className="audit-details">
          {formatAuditDetails()}
        </div>
      )}
      
      <div className="audit-footer">
        <button 
          className="btn btn-sm btn-toggle" 
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Masquer détails' : 'Afficher détails'}
        </button>
        
        <div className="audit-actions">
          <Link 
            to={`/modules/${audit.module_id}`} 
            className="btn btn-sm"
          >
            Voir module
          </Link>
          
          <button 
            className="btn btn-sm btn-resolve" 
            onClick={handleResolve}
            disabled={resolving}
          >
            {resolving ? 'En cours...' : 'Marquer comme traité'}
          </button>
        </div>
      </div>
    </div>
  );
}
