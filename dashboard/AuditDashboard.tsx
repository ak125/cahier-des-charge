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

import { useState, useEffect } from 'react';
import { useLoaderData, json, Link } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { Table, Badge, Card, Button, Input, Select, Tag, Tooltip } from '../components/ui';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les données d'audit
interface AuditFile {
  path: string;
  moduleName: string;
  slug?: string;
  table?: string;
  route?: string;
  type?: string;
  score?: number;
  timestamp: string;
}

interface BacklogFile {
  path: string;
  slug?: string;
  table?: string;
  route?: string;
  type?: string;
  tasks: {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    type: string;
    status: 'todo' | 'in-progress' | 'done';
  }[];
}

interface ImpactGraphFile {
  path: string;
  slug?: string;
  dependencies: {
    source: string;
    target: string;
    type: string;
  }[];
}

interface AuditIndex {
  audits: {
    filePath: string;
    timestamp: string;
    status: string;
    score: number;
  }[];
}

interface AuditData {
  auditFiles: AuditFile[];
  backlogFiles: BacklogFile[];
  impactGraphFiles: ImpactGraphFile[];
  auditIndex: AuditIndex;
  consistencyReport: {
    missingFiles: {
      sourcePath: string;
      missingTypes: string[];
    }[];
    inconsistentFields: {
      sourcePath: string;
      fieldName: string;
      values: { [key: string]: string };
    }[];
    duplicateAnalyses: {
      slug: string;
      files: string[];
    }[];
    timestamp: string;
  };
}

// Fonction de chargement des données
export const loader: LoaderFunction = async () => {
  const fs = require('fs');
  const path = require('path');
  const glob = require('glob');
  
  try {
    // Configuration des chemins
    const config = {
      directories: {
        audits: './reports/audits',
        backlogs: './reports/backlogs',
        impactGraphs: './reports/impact_graphs',
      },
      extensions: {
        audit: '.audit.md',
        backlog: '.backlog.json',
        impactGraph: '.impact_graph.json',
      },
      indexFile: './reports/audit_index.json',
      consistencyReportFile: './reports/audit_consistency_report.json',
    };
    
    // Charger les fichiers d'audit
    const auditFiles = glob.sync(`${config.directories.audits}/**/*${config.extensions.audit}`)
      .map(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const moduleName = extractModuleName(content);
        const slug = extractField(content, 'slug');
        const table = extractField(content, 'table');
        const route = extractField(content, 'route');
        const type = extractField(content, 'type');
        
        // Extraire la date de création à partir du nom du fichier ou du contenu
        const timestamp = extractTimestamp(filePath, content);
        
        return { 
          path: filePath, 
          moduleName, 
          slug, 
          table, 
          route, 
          type,
          timestamp
        };
      });
    
    // Charger les fichiers de backlog
    const backlogFiles = glob.sync(`${config.directories.backlogs}/**/*${config.extensions.backlog}`)
      .map(filePath => {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return {
            path: filePath,
            slug: content.slug,
            table: content.table,
            route: content.route,
            type: content.type,
            tasks: content.tasks || [],
          };
        } catch (error) {
          console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
          return { path: filePath, tasks: [] };
        }
      });
    
    // Charger les fichiers de graphe d'impact
    const impactGraphFiles = glob.sync(`${config.directories.impactGraphs}/**/*${config.extensions.impactGraph}`)
      .map(filePath => {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return {
            path: filePath,
            slug: content.slug,
            dependencies: content.dependencies || [],
          };
        } catch (error) {
          console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
          return { path: filePath, dependencies: [] };
        }
      });
    
    // Charger l'index des audits
    let auditIndex = { audits: [] };
    try {
      auditIndex = JSON.parse(fs.readFileSync(config.indexFile, 'utf8'));
    } catch (error) {
      console.warn(`Fichier d'index non trouvé: ${config.indexFile}`);
    }
    
    // Charger le rapport de cohérence
    let consistencyReport = {
      missingFiles: [],
      inconsistentFields: [],
      duplicateAnalyses: [],
      timestamp: new Date().toISOString(),
    };
    try {
      consistencyReport = JSON.parse(fs.readFileSync(config.consistencyReportFile, 'utf8'));
    } catch (error) {
      console.warn(`Rapport de cohérence non trouvé: ${config.consistencyReportFile}`);
    }
    
    // Enrichir les audits avec les scores de l'index
    const enrichedAuditFiles = auditFiles.map(audit => {
      const indexEntry = auditIndex.audits.find(a => a.filePath === audit.path);
      if (indexEntry) {
        return {
          ...audit,
          score: indexEntry.score,
          status: indexEntry.status,
        };
      }
      return audit;
    });
    
    return json({
      auditFiles: enrichedAuditFiles,
      backlogFiles,
      impactGraphFiles,
      auditIndex,
      consistencyReport,
    });
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return json({ 
      auditFiles: [], 
      backlogFiles: [], 
      impactGraphFiles: [], 
      auditIndex: { audits: [] },
      consistencyReport: {
        missingFiles: [],
        inconsistentFields: [],
        duplicateAnalyses: [],
        timestamp: new Date().toISOString(),
      }
    });
  }
};

// Fonctions utilitaires pour extraire les données
function extractModuleName(content: string): string {
  const match = content.match(/# Audit: (.*)/);
  return match ? match[1].trim() : 'Module Inconnu';
}

function extractField(content: string, fieldName: string): string | undefined {
  const regex = new RegExp(`## ${fieldName}:([^\\n]*)|${fieldName}:\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? (match[1] || match[2]).trim() : undefined;
}

function extractTimestamp(filePath: string, content: string): string {
  // Essayer d'extraire du contenu
  const timestampMatch = content.match(/généré automatiquement le (.*) à (.*)\./);
  if (timestampMatch) {
    return new Date(`${timestampMatch[1]} ${timestampMatch[2]}`).toISOString();
  }
  
  // Essayer d'extraire du nom de fichier (si format avec timestamp)
  const fileNameMatch = filePath.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  if (fileNameMatch) {
    return fileNameMatch[1].replace(/-/g, ':').replace('T', ' ');
  }
  
  // Utiliser la date de modification du fichier
  const stats = require('fs').statSync(filePath);
  return stats.mtime.toISOString();
}

// Composant principal
export default function AuditDashboard() {
  const data = useLoaderData<AuditData>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'score'>('date');
  const [showProblems, setShowProblems] = useState(false);
  
  // Filtrer et trier les audits
  const filteredAudits = data.auditFiles
    .filter(audit => {
      const searchMatch = 
        audit.moduleName.toLowerCase().includes(search.toLowerCase()) ||
        (audit.slug?.toLowerCase().includes(search.toLowerCase())) ||
        (audit.table?.toLowerCase().includes(search.toLowerCase()));
      
      const filterMatch = filter === 'all' || 
        (filter === 'complete' && audit.score && audit.score > 80) ||
        (filter === 'incomplete' && (!audit.score || audit.score <= 80));
      
      return searchMatch && filterMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'name') {
        return a.moduleName.localeCompare(b.moduleName);
      } else {
        return (b.score || 0) - (a.score || 0);
      }
    });
    
  // Préparer les données de problèmes à afficher
  const problems = [
    ...data.consistencyReport.missingFiles.map(item => ({
      type: 'missing',
      source: item.sourcePath,
      details: `Fichiers manquants: ${item.missingTypes.join(', ')}`,
    })),
    ...data.consistencyReport.inconsistentFields.map(item => ({
      type: 'inconsistent',
      source: item.sourcePath,
      details: `Champ incohérent: ${item.fieldName}`,
    })),
    ...data.consistencyReport.duplicateAnalyses.map(item => ({
      type: 'duplicate',
      source: item.slug,
      details: `Analyses en double: ${item.files.length} fichiers`,
    })),
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📊 Tableau de Bord des Audits</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            🔄 Actualiser
          </Button>
          <Link to="/run-validation">
            <Button variant="default">🔍 Exécuter validation</Button>
          </Link>
        </div>
      </div>
      
      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <Input
            placeholder="Rechercher un audit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <Select.Trigger>
              <Select.Value placeholder="Filtrer par statut" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Tous les audits</Select.Item>
              <Select.Item value="complete">Audits complets (>80%)</Select.Item>
              <Select.Item value="incomplete">Audits incomplets (≤80%)</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <Select.Trigger>
              <Select.Value placeholder="Trier par" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="date">Date (récent → ancien)</Select.Item>
              <Select.Item value="name">Nom du module</Select.Item>
              <Select.Item value="score">Score d'audit</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div>
          <Button 
            variant={showProblems ? "default" : "outline"}
            onClick={() => setShowProblems(!showProblems)}
            className="w-full"
          >
            {showProblems ? "Masquer les problèmes" : "Afficher les problèmes"} 
            {problems.length > 0 && (
              <Badge variant="destructive" className="ml-2">{problems.length}</Badge>
            )}
          </Button>
        </div>
      </div>
      
      {/* Section des problèmes */}
      {showProblems && problems.length > 0 && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold mb-4">⚠️ Problèmes détectés</h2>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Type</Table.Head>
                <Table.Head>Source</Table.Head>
                <Table.Head>Détails</Table.Head>
                <Table.Head>Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {problems.map((problem, index) => (
                <Table.Row key={index}>
                  <Table.Cell>
                    <Badge variant={
                      problem.type === 'missing' ? 'destructive' :
                      problem.type === 'inconsistent' ? 'warning' : 'outline'
                    }>
                      {problem.type === 'missing' ? 'Manquant' : 
                       problem.type === 'inconsistent' ? 'Incohérent' : 'Doublon'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{problem.source}</Table.Cell>
                  <Table.Cell>{problem.details}</Table.Cell>
                  <Table.Cell>
                    <Link to={`/fix-audit/${encodeURIComponent(problem.source)}`}>
                      <Button size="sm" variant="outline">Réparer</Button>
                    </Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <div className="mt-4 text-sm text-gray-500">
            Dernière vérification: {new Date(data.consistencyReport.timestamp).toLocaleString()}
          </div>
        </Card>
      )}
      
      {/* Tableau principal des audits */}
      <Card className="overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Module</Table.Head>
              <Table.Head>Slug</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Table DB</Table.Head>
              <Table.Head>Score</Table.Head>
              <Table.Head>Fichiers</Table.Head>
              <Table.Head>Date d'audit</Table.Head>
              <Table.Head>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredAudits.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center py-8">
                  Aucun audit trouvé correspondant aux critères
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredAudits.map((audit, index) => {
                // Trouver les fichiers backlog et impact graph associés
                const backlog = data.backlogFiles.find(b => b.slug === audit.slug);
                const impactGraph = data.impactGraphFiles.find(i => i.slug === audit.slug);
                
                // Calculer le nombre de tâches complétées
                const completedTasks = backlog?.tasks.filter(t => t.status === 'done').length || 0;
                const totalTasks = backlog?.tasks.length || 0;
                
                return (
                  <Table.Row key={index}>
                    <Table.Cell className="font-medium">{audit.moduleName}</Table.Cell>
                    <Table.Cell>{audit.slug || '-'}</Table.Cell>
                    <Table.Cell>
                      {audit.type ? (
                        <Tag color={getTypeColor(audit.type)}>{audit.type}</Tag>
                      ) : '-'}
                    </Table.Cell>
                    <Table.Cell>{audit.table || '-'}</Table.Cell>
                    <Table.Cell>
                      {audit.score ? (
                        <Badge variant={
                          audit.score > 80 ? 'success' :
                          audit.score > 50 ? 'warning' : 'destructive'
                        }>
                          {audit.score}%
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex space-x-1">
                        <Tooltip content="Rapport d'audit">
                          <Link to={`/view-audit/${encodeURIComponent(audit.path)}`}>
                            <Badge variant="secondary">📝</Badge>
                          </Link>
                        </Tooltip>
                        
                        {backlog && (
                          <Tooltip content={`Backlog: ${completedTasks}/${totalTasks} tâches complétées`}>
                            <Link to={`/view-backlog/${encodeURIComponent(backlog.path)}`}>
                              <Badge variant="secondary">📋</Badge>
                            </Link>
                          </Tooltip>
                        )}
                        
                        {impactGraph && (
                          <Tooltip content={`Graphe d'impact: ${impactGraph.dependencies.length} dépendances`}>
                            <Link to={`/view-graph/${encodeURIComponent(impactGraph.path)}`}>
                              <Badge variant="secondary">📊</Badge>
                            </Link>
                          </Tooltip>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Tooltip content={new Date(audit.timestamp).toLocaleString()}>
                        {formatDistanceToNow(new Date(audit.timestamp), { 
                          addSuffix: true,
                          locale: fr 
                        })}
                      </Tooltip>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex space-x-1">
                        <Link to={`/edit-audit/${encodeURIComponent(audit.path)}`}>
                          <Button size="sm" variant="outline">Éditer</Button>
                        </Link>
                        <Link to={`/rerun-audit/${encodeURIComponent(audit.slug || '')}`}>
                          <Button size="sm" variant="outline">Re-auditer</Button>
                        </Link>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table>
      </Card>
      
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">📊 Statistiques globales</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total des audits:</span>
              <span className="font-semibold">{data.auditFiles.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Backlogs:</span>
              <span className="font-semibold">{data.backlogFiles.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Graphes d'impact:</span>
              <span className="font-semibold">{data.impactGraphFiles.length}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">📝 Répartition par type</h3>
          <div className="space-y-2">
            {getTypeDistribution(data.auditFiles).map(type => (
              <div key={type.name} className="flex justify-between">
                <span>{type.name || 'Non spécifié'}:</span>
                <Badge variant="outline">{type.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">⏱️ Activité récente</h3>
          <div className="space-y-2">
            {getRecentActivity(data.auditFiles).map((activity, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{activity.module}</span>
                <span className="text-gray-500">
                  {formatDistanceToNow(new Date(activity.timestamp), { 
                    addSuffix: true,
                    locale: fr 
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Fonctions utilitaires pour les statistiques
function getTypeColor(type: string): string {
  const typeMap = {
    'controller': 'blue',
    'model': 'green',
    'service': 'purple',
    'component': 'orange',
    'utility': 'teal',
  };
  return typeMap[type.toLowerCase()] || 'gray';
}

function getTypeDistribution(audits: AuditFile[]) {
  const types = {};
  audits.forEach(audit => {
    const type = audit.type || 'Non spécifié';
    types[type] = (types[type] || 0) + 1;
  });
  
  return Object.entries(types)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function getRecentActivity(audits: AuditFile[]) {
  return audits
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map(audit => ({
      module: audit.moduleName,
      timestamp: audit.timestamp,
    }));
}
