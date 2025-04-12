import React, { useState, useEffect } from 'react';

interface FileData {
  name: string;
  status: 'analyzed' | 'nestjs-generated' | 'remix-generated' | 'pending';
  size: number;
  lastModified: string;
  issues: number;
}

export const FileAnalysis: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/files');
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    return file.status === filter;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'analyzed': return 'Analysé';
      case 'nestjs-generated': return 'NestJS généré';
      case 'remix-generated': return 'Remix généré';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'analyzed': return 'status-analyzed';
      case 'nestjs-generated': return 'status-nestjs';
      case 'remix-generated': return 'status-remix';
      case 'pending': return 'status-pending';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="file-analysis-card">
        <h2>Analyse des Fichiers</h2>
        <div className="loading-spinner">Chargement des fichiers...</div>
      </div>
    );
  }

  return (
    <div className="file-analysis-card">
      <h2>Analyse des Fichiers</h2>
      <div className="filter-controls">
        <label htmlFor="status-filter">Filtrer par statut:</label>
        <select 
          id="status-filter" 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tous les fichiers</option>
          <option value="analyzed">Analysés uniquement</option>
          <option value="nestjs-generated">NestJS générés</option>
          <option value="remix-generated">Remix générés</option>
          <option value="pending">En attente</option>
        </select>
      </div>

      <div className="files-table-container">
        <table className="files-table">
          <thead>
            <tr>
              <th>Nom du fichier</th>
              <th>Statut</th>
              <th>Taille</th>
              <th>Dernière modification</th>
              <th>Problèmes</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-files">Aucun fichier trouvé</td>
              </tr>
            ) : (
              filteredFiles.map(file => (
                <tr key={file.name}>
                  <td>{file.name}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(file.status)}`}>
                      {getStatusLabel(file.status)}
                    </span>
                  </td>
                  <td>{(file.size / 1024).toFixed(2)} KB</td>
                  <td>{new Date(file.lastModified).toLocaleString()}</td>
                  <td>
                    {file.issues > 0 ? (
                      <span className="issues-badge">{file.issues}</span>
                    ) : (
                      <span className="no-issues">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};