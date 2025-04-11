import React, { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  Text,
  Progress,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Icon,
  Grid,
  useColorModeValue,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Code
} from '@chakra-ui/react';
import { FiFile, FiCheck, FiAlertTriangle, FiAlertCircle, FiPieChart, FiList, FiCode } from 'react-icons/fi';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { json as remixJson, LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { createClient } from '@supabase/supabase-js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Enregistrement des éléments nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Enregistrer les langages pour la coloration syntaxique
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('json', json);

// Type pour un rapport d'audit
interface AuditReport {
  id: string;
  fileName: string;
  status: 'completed' | 'in-progress' | 'pending';
  completedSections: number;
  totalSections: number;
  auditContent?: string;
  backlogTasks?: {
    type: string;
    target: string;
    status: string;
    description?: string;
  }[];
  securityIssues?: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  migrationPlan?: string;
  generatedOn: Date;
}

// Données factices pour la démo
const mockAudits: AuditReport[] = [
  {
    id: '1',
    fileName: 'fiche.php',
    status: 'completed',
    completedSections: 24,
    totalSections: 24,
    auditContent: '# Audit fiche.php\n\n## 1. Rôle métier principal\nAffiche une fiche produit complète...',
    backlogTasks: [
      { type: 'generate.dto', target: 'backend', status: 'pending' },
      { type: 'generate.controller', target: 'backend', status: 'pending' },
      { type: 'generate.loader', target: 'frontend', status: 'pending' }
    ],
    securityIssues: [
      { type: 'XSS', severity: 'high', description: 'Pas de filtrage XSS' },
      { type: 'SQL Injection', severity: 'medium', description: 'Variables non échappées' }
    ],
    migrationPlan: '## Plan de migration\n\n1. Créer DTO\n2. Implémenter controller\n3. Créer loader Remix',
    generatedOn: new Date('2023-05-15')
  },
  {
    id: '2',
    fileName: 'panier.php',
    status: 'in-progress',
    completedSections: 16,
    totalSections: 24,
    generatedOn: new Date('2023-05-16')
  },
  {
    id: '3',
    fileName: 'index.php',
    status: 'pending',
    completedSections: 0,
    totalSections: 24,
    generatedOn: new Date('2023-05-17')
  }
];

// Interfaces pour typer les données
interface AuditHistory {
  id: string;
  source_dir: string;
  report_path: string;
  timestamp: string;
  report_type: string;
  agent_id: string;
  report_summary?: {
    totalFiles?: number;
    successRate?: number;
    complexity?: number;
    migrationProgress?: number;
  };
  tags?: string[];
}

interface FileMappingStats {
  component_type: string;
  count: number;
}

interface MigrationStatusStats {
  migration_status: string;
  count: number;
}

// Types pour les données du loader
type LoaderData = {
  audits: AuditHistory[];
  componentStats: FileMappingStats[];
  statusStats: MigrationStatusStats[];
  progressHistory: { date: string; progress: number }[];
  latestAudit: AuditHistory | null;
};

// Fonction loader pour charger les données du serveur
export const loader: LoaderFunction = async () => {
  // Initialiser Supabase avec des variables d'environnement
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Clé de service pour le backend

  if (!supabaseUrl || !supabaseKey) {
    console.error('Variables d\'environnement Supabase manquantes');
    return remixJson({ 
      audits: [], 
      componentStats: [], 
      statusStats: [], 
      progressHistory: [],
      latestAudit: null 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Récupérer l'historique des audits
    const { data: audits, error: auditsError } = await supabase
      .from('audit_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (auditsError) throw auditsError;

    // Récupérer les statistiques par type de composant
    const { data: componentStats, error: componentStatsError } = await supabase
      .rpc('get_component_type_stats');

    if (componentStatsError) throw componentStatsError;

    // Récupérer les statistiques par statut de migration
    const { data: statusStats, error: statusStatsError } = await supabase
      .rpc('get_migration_status_stats');

    if (statusStatsError) throw statusStatsError;

    // Récupérer l'historique de progression
    const { data: progressHistory, error: progressHistoryError } = await supabase
      .rpc('get_migration_progress_history');

    if (progressHistoryError) throw progressHistoryError;

    // Récupérer le dernier audit
    const { data: latestAudit, error: latestAuditError } = await supabase
      .from('audit_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Formater les données pour le graphique de progression
    const formattedProgressHistory = progressHistory.map((entry: any) => ({
      date: new Date(entry.date).toLocaleDateString(),
      progress: entry.progress,
    }));

    return remixJson({
      audits: audits || [],
      componentStats: componentStats || [],
      statusStats: statusStats || [],
      progressHistory: formattedProgressHistory || [],
      latestAudit: latestAudit || null,
    });
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return remixJson({ 
      audits: [], 
      componentStats: [], 
      statusStats: [], 
      progressHistory: [],
      latestAudit: null,
      error: 'Erreur lors du chargement des données'
    });
  }
};

// Composant principal
export default function Dashboard() {
  const { audits, componentStats, statusStats, progressHistory, latestAudit } = 
    useLoaderData<LoaderData>();
  
  // État pour stocker les données des graphiques
  const [componentChartData, setComponentChartData] = useState<any>(null);
  const [statusChartData, setStatusChartData] = useState<any>(null);
  const [progressChartData, setProgressChartData] = useState<any>(null);

  // Préparation des données des graphiques lorsque les données sont chargées
  useEffect(() => {
    if (componentStats.length > 0) {
      setComponentChartData({
        labels: componentStats.map(stat => formatComponentType(stat.component_type)),
        datasets: [
          {
            label: 'Nombre de fichiers par type de composant',
            data: componentStats.map(stat => stat.count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      });
    }

    if (statusStats.length > 0) {
      setStatusChartData({
        labels: statusStats.map(stat => formatMigrationStatus(stat.migration_status)),
        datasets: [
          {
            label: 'Statut de migration',
            data: statusStats.map(stat => stat.count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
          },
        ],
      });
    }

    if (progressHistory.length > 0) {
      setProgressChartData({
        labels: progressHistory.map(entry => entry.date),
        datasets: [
          {
            label: 'Progression de la migration (%)',
            data: progressHistory.map(entry => entry.progress),
            fill: false,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
        ],
      });
    }
  }, [componentStats, statusStats, progressHistory]);

  // Fonctions de formatage pour l'affichage
  function formatComponentType(type: string): string {
    switch (type) {
      case 'controller':
        return 'Contrôleur';
      case 'service':
        return 'Service';
      case 'entity':
        return 'Entité';
      case 'component':
        return 'Composant';
      case 'route':
        return 'Route';
      default:
        return 'Autre';
    }
  }

  function formatMigrationStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'failed':
        return 'Échec';
      default:
        return status;
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('fr-FR');
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Dashboard de Migration PHP → NestJS + Remix</h1>
        {latestAudit && (
          <div className="latest-audit-info">
            <p>
              Dernière analyse: <strong>{formatDate(latestAudit.timestamp)}</strong> |
              Répertoire: <strong>{latestAudit.source_dir}</strong>
            </p>
          </div>
        )}
      </header>

      <div className="summary-cards">
        <div className="card">
          <h3>Fichiers analysés</h3>
          <p className="number">{latestAudit?.report_summary?.totalFiles || 0}</p>
        </div>
        <div className="card">
          <h3>Complexité</h3>
          <p className="number">{latestAudit?.report_summary?.complexity?.toFixed(1) || 'N/A'}/10</p>
        </div>
        <div className="card">
          <h3>Progression</h3>
          <p className="number">{latestAudit?.report_summary?.migrationProgress?.toFixed(1) || 0}%</p>
        </div>
        <div className="card">
          <h3>Taux de succès</h3>
          <p className="number">{latestAudit?.report_summary?.successRate?.toFixed(1) || 0}%</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h2>Progression de la migration</h2>
          {progressChartData ? (
            <Line 
              data={progressChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Évolution de la progression dans le temps'
                  }
                },
                scales: {
                  y: {
                    min: 0,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <p className="no-data">Aucune donnée de progression disponible</p>
          )}
        </div>

        <div className="chart-box">
          <h2>Types de composants</h2>
          {componentChartData ? (
            <Bar 
              data={componentChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Répartition par type de composant'
                  }
                }
              }}
            />
          ) : (
            <p className="no-data">Aucune donnée de composant disponible</p>
          )}
        </div>

        <div className="chart-box">
          <h2>Statut de migration</h2>
          {statusChartData ? (
            <Pie 
              data={statusChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Répartition par statut de migration'
                  }
                }
              }}
            />
          ) : (
            <p className="no-data">Aucune donnée de statut disponible</p>
          )}
        </div>
      </div>

      <div className="audit-history">
        <h2>Historique des audits</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Répertoire source</th>
                <th>Type de rapport</th>
                <th>Agent</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {audits.length > 0 ? (
                audits.map(audit => (
                  <tr key={audit.id}>
                    <td>{formatDate(audit.timestamp)}</td>
                    <td>{audit.source_dir}</td>
                    <td>{audit.report_type}</td>
                    <td>{audit.agent_id}</td>
                    <td>
                      <a href={`/reports/${audit.id}`} className="btn btn-view">
                        Voir
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>Aucun audit disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="actions">
        <h2>Actions</h2>
        <div className="buttons">
          <a href="/run-analysis" className="btn btn-primary">
            Lancer une nouvelle analyse
          </a>
          <a href="/migration-map" className="btn btn-secondary">
            Voir la carte de migration
          </a>
          <a href="/file-mappings" className="btn btn-secondary">
            Explorer les mappings de fichiers
          </a>
        </div>
      </div>
    </div>
  );
}
