import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import {
  AreaChart,
  Badge,
  BarChart,
  Button,
  Callout,
  Card,
  Color,
  DateRangePicker,
  DateRangePickerValue,
  DonutChart,
  Grid,
  Legend,
  LineChart,
  Select,
  SelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from '@tremor/react';
import { useEffect, useState } from 'react';
import {
  type AuditReport,
  type PipelineAuditData,
  type TraceSummary,
  loadPipelineAuditData,
} from ..@cahier-des-charge/coordination/src/utils/audit-data-service';

// Types déjà existants (laissés inchangés)
interface AgentMetric {
  date: string;
  agent: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  maxMemory: number;
}

interface SystemMetric {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskIo: number;
  activeAgents: number;
}

interface MigrationMetric {
  date: string;
  completed: number;
  failed: number;
  active: number;
}

interface AuditIssue {
  id: string;
  status: string;
  type?: string;
  missing?: string[];
  generatedFiles?: string[];
  lastUpdated?: string;
  age?: string;
  recommendation?: string;
}

interface AuditReport {
  timestamp: string;
  totalManifests: number;
  issues: AuditIssue[];
  statistics: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    missingAgents: Record<string, number>;
    ageDistribution: Record<string, number>;
    completionRate: number;
  };
}

interface TraceSummary {
  timestamp: string;
  totalManifests: number;
  tracesGenerated: number;
  tracesWithMissing: number;
  completionPercentage: number;
}

export const loader = async () => {
  // Données simulées pour les métriques originales du dashboard
  // 1. Métriques des agents
  const agentMetrics: AgentMetric[] = [
    {
      date: '2025-04-16',
      agent: 'php-analyzer-agent',
      executions: 32,
      successRate: 96.7,
      avgDuration: 1432,
      maxMemory: 245,
    },
    {
      date: '2025-04-17',
      agent: 'php-analyzer-agent',
      executions: 28,
      successRate: 92.8,
      avgDuration: 1567,
      maxMemory: 258,
    },
    {
      date: '2025-04-18',
      agent: 'php-analyzer-agent',
      executions: 35,
      successRate: 97.1,
      avgDuration: 1398,
      maxMemory: 240,
    },
    {
      date: '2025-04-19',
      agent: 'php-analyzer-agent',
      executions: 26,
      successRate: 95.4,
      avgDuration: 1425,
      maxMemory: 236,
    },
    {
      date: '2025-04-20',
      agent: 'php-analyzer-agent',
      executions: 29,
      successRate: 97.5,
      avgDuration: 1375,
      maxMemory: 235,
    },
    {
      date: '2025-04-21',
      agent: 'php-analyzer-agent',
      executions: 34,
      successRate: 98.2,
      avgDuration: 1296,
      maxMemory: 230,
    },
    {
      date: '2025-04-22',
      agent: 'php-analyzer-agent',
      executions: 38,
      successRate: 98.6,
      avgDuration: 1245,
      maxMemory: 228,
    },
    {
      date: '2025-04-16',
      agent: 'remix-generator',
      executions: 25,
      successRate: 88.5,
      avgDuration: 3250,
      maxMemory: 456,
    },
    {
      date: '2025-04-17',
      agent: 'remix-generator',
      executions: 22,
      successRate: 87.2,
      avgDuration: 3345,
      maxMemory: 478,
    },
    {
      date: '2025-04-18',
      agent: 'remix-generator',
      executions: 28,
      successRate: 89.7,
      avgDuration: 3215,
      maxMemory: 465,
    },
    {
      date: '2025-04-19',
      agent: 'remix-generator',
      executions: 19,
      successRate: 88.9,
      avgDuration: 3280,
      maxMemory: 470,
    },
    {
      date: '2025-04-20',
      agent: 'remix-generator',
      executions: 23,
      successRate: 90.1,
      avgDuration: 3190,
      maxMemory: 462,
    },
    {
      date: '2025-04-21',
      agent: 'remix-generator',
      executions: 26,
      successRate: 91.5,
      avgDuration: 3150,
      maxMemory: 455,
    },
    {
      date: '2025-04-22',
      agent: 'remix-generator',
      executions: 30,
      successRate: 93.2,
      avgDuration: 3100,
      maxMemory: 450,
    },
    {
      date: '2025-04-16',
      agent: 'mysql-analyzer',
      executions: 18,
      successRate: 91.2,
      avgDuration: 2150,
      maxMemory: 320,
    },
    {
      date: '2025-04-17',
      agent: 'mysql-analyzer',
      executions: 15,
      successRate: 90.5,
      avgDuration: 2210,
      maxMemory: 328,
    },
    {
      date: '2025-04-18',
      agent: 'mysql-analyzer',
      executions: 20,
      successRate: 91.8,
      avgDuration: 2140,
      maxMemory: 322,
    },
    {
      date: '2025-04-19',
      agent: 'mysql-analyzer',
      executions: 14,
      successRate: 92.3,
      avgDuration: 2120,
      maxMemory: 318,
    },
    {
      date: '2025-04-20',
      agent: 'mysql-analyzer',
      executions: 16,
      successRate: 93.1,
      avgDuration: 2080,
      maxMemory: 315,
    },
    {
      date: '2025-04-21',
      agent: 'mysql-analyzer',
      executions: 19,
      successRate: 94.5,
      avgDuration: 2050,
      maxMemory: 310,
    },
    {
      date: '2025-04-22',
      agent: 'mysql-analyzer',
      executions: 22,
      successRate: 95.2,
      avgDuration: 2010,
      maxMemory: 305,
    },
  ];

  // 2. Métriques système
  const systemMetrics: SystemMetric[] = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const timestamp = `2025-04-22 ${hour.toString().padStart(2, '0')}:00`;
    // Simuler des fluctuations au cours de la journée
    const baselineMultiplier = 0.5 + Math.sin((i / 24) * Math.PI * 2) * 0.3;

    return {
      timestamp,
      cpuUsage: Math.round(25 + baselineMultiplier * 40),
      memoryUsage: Math.round(40 + baselineMultiplier * 25),
      diskIo: Math.round(15 + baselineMultiplier * 20),
      activeAgents: Math.max(1, Math.round(3 + baselineMultiplier * 5)),
    };
  });

  // 3. Métriques des migrations
  const migrationMetrics: MigrationMetric[] = [
    {
      date: '2025-04-16',
      completed: 12,
      failed: 2,
      active: 3,
    },
    {
      date: '2025-04-17',
      completed: 9,
      failed: 1,
      active: 5,
    },
    {
      date: '2025-04-18',
      completed: 15,
      failed: 3,
      active: 4,
    },
    {
      date: '2025-04-19',
      completed: 8,
      failed: 0,
      active: 2,
    },
    {
      date: '2025-04-20',
      completed: 11,
      failed: 1,
      active: 3,
    },
    {
      date: '2025-04-21',
      completed: 14,
      failed: 2,
      active: 6,
    },
    {
      date: '2025-04-22',
      completed: 17,
      failed: 1,
      active: 8,
    },
  ];

  // Statistiques des agents agrégées
  const agentStats = [
    {
      agent: 'php-analyzer-agent',
      totalExecutions: 222,
      avgSuccessRate: 96.7,
      avgTime: 1391,
      avgMemory: 239,
    },
    {
      agent: 'remix-generator',
      totalExecutions: 173,
      avgSuccessRate: 89.9,
      avgTime: 3218,
      avgMemory: 462,
    },
    {
      agent: 'mysql-analyzer',
      totalExecutions: 124,
      avgSuccessRate: 92.7,
      avgTime: 2109,
      avgMemory: 317,
    },
    {
      agent: 'seo-meta',
      totalExecutions: 98,
      avgSuccessRate: 99.1,
      avgTime: 945,
      avgMemory: 150,
    },
    {
      agent: 'ab-strategy-tester',
      totalExecutions: 54,
      avgSuccessRate: 100,
      avgTime: 5320,
      avgMemory: 540,
    },
    {
      agent: 'migration-orchestrator',
      totalExecutions: 86,
      avgSuccessRate: 94.8,
      avgTime: 1850,
      avgMemory: 320,
    },
  ];

  // Données de performance par type de fichier
  const fileTypePerformance = [
    {
      fileType: 'PHP Controllers',
      avgTime: 3120,
      successRate: 92,
      fileCount: 152,
    },
    {
      fileType: 'PHP Models',
      avgTime: 2850,
      successRate: 95,
      fileCount: 78,
    },
    {
      fileType: 'PHP Views',
      avgTime: 3450,
      successRate: 88,
      fileCount: 215,
    },
    {
      fileType: 'JavaScript',
      avgTime: 1980,
      successRate: 96,
      fileCount: 124,
    },
    {
      fileType: 'CSS',
      avgTime: 980,
      successRate: 99,
      fileCount: 67,
    },
    {
      fileType: 'SQL Schema',
      avgTime: 2150,
      successRate: 91,
      fileCount: 22,
    },
  ];

  // Répartition des métriques de migration par catégorie
  const migrationCategories = [
    { name: 'UI Components', value: 35 },
    { name: 'Controllers', value: 25 },
    { name: 'Data Models', value: 22 },
    { name: 'API Endpoints', value: 18 },
    { name: 'CSS & Styling', value: 12 },
    { name: 'Assets', value: 8 },
  ];

  // Charger les données d'audit du pipeline
  const pipelineAuditData = await loadPipelineAuditData();

  return json({
    // Données originales conservées
    agentMetrics,
    systemMetrics,
    migrationMetrics,
    agentStats,
    fileTypePerformance,
    migrationCategories,

    // Données d'audit du pipeline
    ...pipelineAuditData,
  });
};

// Fonction utilitaire pour formater la durée en millisecondes
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

// Fonction pour déterminer la couleur du badge en fonction du statut
function getStatusColor(status: string): Color {
  const statusColors: Record<string, Color> = {
    planned: 'gray',
    detected: 'blue',
    analyzed: 'indigo',
    structured: 'purple',
    generated: 'violet',
    validated: 'amber',
    integrated: 'orange',
    completed: 'green',
    in_progress: 'cyan',
  };

  return statusColors[status] || 'gray';
}

export default function MetricsPage() {
  const {
    agentMetrics,
    systemMetrics,
    migrationMetrics,
    agentStats,
    fileTypePerformance,
    migrationCategories,
    auditReport = {
      timestamp: new Date().toISOString(),
      totalManifests: 0,
      issues: [],
      statistics: {
        byStatus: {},
        byType: {},
        missingAgents: {},
        ageDistribution: {},
        completionRate: 0,
      },
    },
    traceSummary = {
      timestamp: new Date().toISOString(),
      totalManifests: 0,
      tracesGenerated: 0,
      tracesWithMissing: 0,
      completionPercentage: 0,
    },
    trendReport,
    missingAgentsData = [],
    statusDistribution = [],
    lastUpdated = new Date(),
  } = useLoaderData<typeof loader>();

  const [dateRange, setDateRange] = useState<DateRangePickerValue>({
    from: new Date('2025-04-16'),
    to: new Date('2025-04-22'),
  });

  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [isAuditRunning, setIsAuditRunning] = useState(false);

  // Fetcher pour déclencher l'audit à la demande
  const auditFetcher = useFetcher();

  // Détecter lorsque l'audit est terminé
  useEffect(() => {
    if (auditFetcher.state === 'submitting') {
      setIsAuditRunning(true);
    } else if (auditFetcher.state === 'idle' && auditFetcher.data) {
      setIsAuditRunning(false);
    }
  }, [auditFetcher.state, auditFetcher.data]);

  // Transformer les données pour les graphiques

  // Données pour le taux de réussite par agent
  const successRateData = agentStats.map((stat) => ({
    agent: stat.agent.replace('-agent', ''),
    'Taux de réussite (%)': stat.avgSuccessRate,
  }));

  // Données pour le temps moyen d'exécution par agent
  const executionTimeData = agentStats.map((stat) => ({
    agent: stat.agent.replace('-agent', ''),
    'Temps moyen (ms)': stat.avgTime,
  }));

  // Données pour le nombre d'exécutions par jour
  const dailyExecutions = agentMetrics.reduce(
    (acc, metric) => {
      const existingDay = acc.find((day) => day.date === metric.date);
      if (existingDay) {
        existingDay[metric.agent] = metric.executions;
      } else {
        const newDay: any = { date: metric.date };
        newDay[metric.agent] = metric.executions;
        acc.push(newDay);
      }
      return acc;
    },
    [] as any[]
  );

  // Données pour les métriques système avec horodatage formaté
  const formattedSystemMetrics = systemMetrics.map((metric) => ({
    ...metric,
    hour: `${metric.timestamp.split(' ')[1].split(':')[0]}h`,
  }));

  // Données pour le camembert des catégories de migration
  const migrationCategoriesData = migrationCategories.map((category) => ({
    name: category.name,
    value: category.value,
  }));

  const handleRunAudit = () => {
    if (!isAuditRunning) {
      auditFetcher.submit(
        {},
        {
          method: 'post',
          action: '/api/pipeline-audit/trigger',
        }
      );
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Métriques du Pipeline MCP</h1>
        <p className="text-gray-600">
          Visualisation des performances et métriques du pipeline de migration
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <DateRangePicker
          value={dateRange}
          onValueChange={setDateRange}
          color="blue"
          className="max-w-md"
        />

        <Select
          value={selectedAgent}
          onValueChange={setSelectedAgent}
          placeholder="Filtrer par agent"
          className="max-w-xs"
        >
          <SelectItem value="all" text="Tous les agents" />
          {agentStats.map((stat) => (
            <SelectItem
              key={stat.agent}
              value={stat.agent}
              text={stat.agent.replace('-agent', '').replace('php-', 'PHP ').replace('-', ' ')}
            />
          ))}
        </Select>
      </div>

      <TabGroup>
        <TabList className="mb-8">
          <Tab>Vue d'ensemble</Tab>
          <Tab>Performance des Agents</Tab>
          <Tab>Migrations</Tab>
          <Tab>Système</Tab>
          <Tab>Audit du Pipeline</Tab>
        </TabList>

        <TabPanels>
          {/* Vue d'ensemble */}
          <TabPanel>
            <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mb-6">
              <Card>
                <Title>Taux de Réussite par Agent</Title>
                <BarChart
                  data={successRateData}
                  index="agent"
                  categories={['Taux de réussite (%)']}
                  colors={['green']}
                  valueFormatter={(value) => `${value.toFixed(1)}%`}
                  yAxisWidth={48}
                  className="mt-6 h-72"
                />
              </Card>

              <Card>
                <Title>Migrations (7 derniers jours)</Title>
                <AreaChart
                  data={migrationMetrics}
                  index="date"
                  categories={['completed', 'failed', 'active']}
                  colors={['green', 'red', 'blue']}
                  valueFormatter={(value) => value.toString()}
                  yAxisWidth={32}
                  className="mt-6 h-72"
                />
              </Card>

              <Card>
                <Title>Distribution des Types de Migration</Title>
                <DonutChart
                  data={migrationCategoriesData}
                  category="value"
                  index="name"
                  valueFormatter={(value) => `${value}%`}
                  colors={['slate', 'violet', 'indigo', 'rose', 'cyan', 'amber']}
                  className="mt-6 h-72"
                />
              </Card>
            </Grid>

            <Grid numItemsMd={2} className="gap-6">
              <Card>
                <Title>Utilisation des Ressources (Aujourd'hui)</Title>
                <LineChart
                  data={formattedSystemMetrics}
                  index="hour"
                  categories={['cpuUsage', 'memoryUsage']}
                  colors={['blue', 'orange']}
                  valueFormatter={(value) => `${value}%`}
                  yAxisWidth={40}
                  className="mt-6 h-72"
                />
              </Card>

              <Card>
                <Title>Performance par Type de Fichier</Title>
                <BarChart
                  data={fileTypePerformance}
                  index="fileType"
                  categories={['avgTime']}
                  colors={['blue']}
                  valueFormatter={(value) => `${(value / 1000).toFixed(1)}s`}
                  yAxisWidth={48}
                  className="mt-6 h-72"
                />
              </Card>
            </Grid>
          </TabPanel>

          {/* Performance des Agents */}
          <TabPanel>
            <Card className="mb-6">
              <Title>Récapitulatif des Performances des Agents</Title>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mt-4">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-left">Agent</th>
                      <th className="pb-3 text-right">Exécutions</th>
                      <th className="pb-3 text-right">Taux de Succès</th>
                      <th className="pb-3 text-right">Temps Moyen</th>
                      <th className="pb-3 text-right">Utilisation Mémoire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentStats.map((stat) => (
                      <tr key={stat.agent} className="border-b border-gray-100">
                        <td className="py-3 font-medium">
                          {stat.agent
                            .replace('-agent', '')
                            .replace('php-', 'PHP ')
                            .replace('-', ' ')}
                        </td>
                        <td className="py-3 text-right">{stat.totalExecutions}</td>
                        <td className="py-3 text-right">{stat.avgSuccessRate.toFixed(1)}%</td>
                        <td className="py-3 text-right">{formatDuration(stat.avgTime)}</td>
                        <td className="py-3 text-right">{stat.avgMemory} MB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Grid numItemsMd={1} numItemsLg={2} className="gap-6 mb-6">
              <Card>
                <Title>Temps d'Exécution par Agent</Title>
                <BarChart
                  data={executionTimeData}
                  index="agent"
                  categories={['Temps moyen (ms)']}
                  colors={['blue']}
                  valueFormatter={(value) => formatDuration(value)}
                  yAxisWidth={60}
                  className="mt-6 h-72"
                />
              </Card>

              <Card>
                <Title>Exécutions Quotidiennes par Agent</Title>
                <AreaChart
                  data={dailyExecutions}
                  index="date"
                  categories={['php-analyzer-agent', 'remix-generator', 'mysql-analyzer']}
                  colors={['indigo', 'violet', 'cyan']}
                  valueFormatter={(value) => value.toString()}
                  yAxisWidth={32}
                  className="mt-6 h-72"
                />
                <Legend
                  categories={['PHP Analyzer', 'Remix Generator', 'MySQL Analyzer']}
                  colors={['indigo', 'violet', 'cyan']}
                  className="mt-4"
                />
              </Card>
            </Grid>

            <Card>
              <Title>Taux de Réussite par Jour</Title>
              <LineChart
                data={agentMetrics.filter(
                  (m) => selectedAgent === 'all' || m.agent === selectedAgent
                )}
                index="date"
                categories={['successRate']}
                colors={['green']}
                valueFormatter={(value) => `${value.toFixed(1)}%`}
                yAxisWidth={56}
                className="mt-6 h-72"
              />
            </Card>
          </TabPanel>

          {/* Migrations */}
          <TabPanel>
            <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mb-6">
              <Card>
                <Title>Migrations Terminées vs Échecs</Title>
                <BarChart
                  data={migrationMetrics}
                  index="date"
                  categories={['completed', 'failed']}
                  colors={['green', 'red']}
                  stack
                  valueFormatter={(value) => value.toString()}
                  yAxisWidth={32}
                  className="mt-6 h-72"
                />
              </Card>

              <Card>
                <Title>Types de Fichiers Migrés</Title>
                <DonutChart
                  data={fileTypePerformance}
                  index="fileType"
                  category="fileCount"
                  valueFormatter={(value) => `${value} fichiers`}
                  colors={['slate', 'violet', 'indigo', 'rose', 'cyan', 'amber']}
                  className="mt-6 h-72"
                />
              </Card>

              <Card>
                <Title>Taux de Succès par Type de Fichier</Title>
                <BarChart
                  data={fileTypePerformance}
                  index="fileType"
                  categories={['successRate']}
                  colors={['emerald']}
                  valueFormatter={(value) => `${value}%`}
                  yAxisWidth={48}
                  className="mt-6 h-72"
                />
              </Card>
            </Grid>

            <Card>
              <Title>Répartition des Catégories de Migration</Title>
              <Grid numItemsMd={2} className="mt-6">
                <div>
                  <DonutChart
                    data={migrationCategoriesData}
                    category="value"
                    index="name"
                    valueFormatter={(value) => `${value}%`}
                    colors={['slate', 'violet', 'indigo', 'rose', 'cyan', 'amber']}
                    className="h-80"
                  />
                </div>

                <div className="space-y-3">
                  {migrationCategories.map((category, idx) => (
                    <div key={category.name} className="flex items-center">
                      <div
                        className="w-4 h-4 mr-2 rounded-full"
                        style={{
                          backgroundColor: [
                            '#64748b',
                            '#8b5cf6',
                            '#6366f1',
                            '#f43f5e',
                            '#06b6d4',
                            '#f59e0b',
                          ][idx % 6],
                        }}
                      />
                      <span className="flex-1">{category.name}</span>
                      <span className="font-medium">{category.value}%</span>
                    </div>
                  ))}

                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Points clés</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                      <li>Les composants UI représentent la plus grande part des migrations</li>
                      <li>Les données et les contrôleurs sont migrés en parallèle</li>
                      <li>Les actifs statiques ont le taux de succès le plus élevé</li>
                    </ul>
                  </div>
                </div>
              </Grid>
            </Card>
          </TabPanel>

          {/* Système */}
          <TabPanel>
            <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
              <Card decoration="top" decorationColor="indigo">
                <Text className="text-center text-gray-500">Utilisation CPU Maximum</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {Math.max(...systemMetrics.map((m) => m.cpuUsage))}%
                </p>
              </Card>

              <Card decoration="top" decorationColor="orange">
                <Text className="text-center text-gray-500">Utilisation Mémoire Maximum</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {Math.max(...systemMetrics.map((m) => m.memoryUsage))}%
                </p>
              </Card>

              <Card decoration="top" decorationColor="cyan">
                <Text className="text-center text-gray-500">Agents Actifs Maximum</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {Math.max(...systemMetrics.map((m) => m.activeAgents))}
                </p>
              </Card>

              <Card decoration="top" decorationColor="amber">
                <Text className="text-center text-gray-500">IO Disque Maximum</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {Math.max(...systemMetrics.map((m) => m.diskIo))} MB/s
                </p>
              </Card>
            </Grid>

            <Grid numItemsMd={1} className="gap-6 mb-6">
              <Card>
                <Title>Utilisation des Ressources par Heure</Title>
                <LineChart
                  data={formattedSystemMetrics}
                  index="hour"
                  categories={['cpuUsage', 'memoryUsage', 'diskIo']}
                  colors={['blue', 'orange', 'amber']}
                  valueFormatter={(value) => `${value}${value <= 100 ? '%' : ' MB/s'}`}
                  yAxisWidth={48}
                  className="mt-6 h-72"
                />
                <Legend
                  categories={['CPU', 'Mémoire', 'IO Disque']}
                  colors={['blue', 'orange', 'amber']}
                  className="mt-4"
                />
              </Card>
            </Grid>

            <Grid numItemsMd={2} className="gap-6">
              <Card>
                <Title>Agents Actifs par Heure</Title>
                <AreaChart
                  data={formattedSystemMetrics}
                  index="hour"
                  categories={['activeAgents']}
                  colors={['cyan']}
                  valueFormatter={(value) => value.toString()}
                  showLegend={false}
                  yAxisWidth={32}
                  className="mt-6 h-72"
                />
              </Card>

              <Card>
                <Title>Corrélation Utilisation CPU et Mémoire</Title>
                <div className="h-72 flex items-center justify-center p-6">
                  <div className="text-gray-500 text-center">
                    <p className="mb-2">
                      Graphique de corrélation détaillé disponible dans l'analyse complète
                    </p>
                    <p className="text-sm">
                      Coefficient de corrélation: 0.87 (forte corrélation positive)
                    </p>
                  </div>
                </div>
              </Card>
            </Grid>
          </TabPanel>

          {/* Nouvel onglet: Audit du Pipeline */}
          <TabPanel>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <Title>Audit du Pipeline de Migration MCP</Title>
                <Text>Dernière mise à jour: {new Date(lastUpdated).toLocaleString()}</Text>
              </div>
              <Button
                onClick={handleRunAudit}
                color="blue"
                loading={isAuditRunning}
                disabled={isAuditRunning}
              >
                {isAuditRunning ? 'Audit en cours...' : "Lancer l'audit"}
              </Button>
            </div>

            {auditFetcher.data?.success && (
              <Callout title="Audit terminé avec succès" color="green" className="mb-6">
                L'audit du pipeline a été exécuté avec succès. Rafraîchissez la page pour voir les
                résultats mis à jour.
              </Callout>
            )}

            {auditFetcher.data && !auditFetcher.data.success && (
              <Callout title="Erreur lors de l'audit" color="red" className="mb-6">
                {auditFetcher.data.message ||
                  "Une erreur est survenue lors de l'exécution de l'audit du pipeline."}
              </Callout>
            )}

            <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
              <Card decoration="top" decorationColor="blue">
                <Text className="text-center text-gray-500">Taux de complétion</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {auditReport.statistics.completionRate}%
                </p>
              </Card>

              <Card decoration="top" decorationColor="amber">
                <Text className="text-center text-gray-500">Migrations avec problèmes</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {auditReport.issues.length}
                </p>
              </Card>

              <Card decoration="top" decorationColor="green">
                <Text className="text-center text-gray-500">Traces vérifiées</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {traceSummary.tracesGenerated} / {traceSummary.totalManifests}
                </p>
              </Card>

              <Card decoration="top" decorationColor="red">
                <Text className="text-center text-gray-500">Traces incomplètes</Text>
                <p className="text-center text-2xl font-semibold mt-2">
                  {traceSummary.tracesWithMissing}
                </p>
              </Card>
            </Grid>

            {/* Graphiques de tendance si disponibles */}
            {trendReport && (
              <Card className="mb-6">
                <Title>Évolution sur les 7 derniers jours</Title>
                <LineChart
                  data={trendReport.data.dates.map((date, index) => ({
                    date,
                    'Taux de complétion (%)': trendReport.data.completionRates[index],
                    Problèmes: trendReport.data.issuesCounts[index],
                  }))}
                  index="date"
                  categories={['Taux de complétion (%)', 'Problèmes']}
                  colors={['emerald', 'rose']}
                  valueFormatter={(value, category) =>
                    category === 'Taux de complétion (%)' ? `${value}%` : `${value}`
                  }
                  yAxisWidth={56}
                  className="mt-6 h-72"
                />
                <div className="mt-4 border-t pt-4">
                  <div className="flex gap-4">
                    <div
                      className={`${
                        trendReport.analysis.improvingCompletionRate
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      <span className="font-medium">Tendance complétion: </span>
                      {trendReport.analysis.improvingCompletionRate
                        ? 'En amélioration'
                        : 'En baisse'}
                    </div>
                    <div
                      className={`${
                        trendReport.analysis.decreasingIssues
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      <span className="font-medium">Tendance problèmes: </span>
                      {trendReport.analysis.decreasingIssues ? 'En baisse' : 'En hausse'}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Grid numItemsMd={1} numItemsLg={2} className="gap-6 mb-6">
              <Card>
                <Title>Agents Manquants dans les Migrations</Title>
                {missingAgentsData && missingAgentsData.length > 0 ? (
                  <BarChart
                    data={missingAgentsData}
                    index="agent"
                    categories={['count']}
                    colors={['rose']}
                    valueFormatter={(value) => value.toString()}
                    yAxisWidth={32}
                    className="mt-6 h-72"
                  />
                ) : (
                  <div className="h-72 flex items-center justify-center">
                    <Text className="text-gray-500">Aucun agent manquant</Text>
                  </div>
                )}
              </Card>

              <Card>
                <Title>Distribution des Statuts de Migration</Title>
                {statusDistribution && statusDistribution.length > 0 ? (
                  <DonutChart
                    data={statusDistribution}
                    index="status"
                    category="count"
                    valueFormatter={(value) => `${value} migrations`}
                    colors={[
                      'gray',
                      'blue',
                      'indigo',
                      'purple',
                      'violet',
                      'amber',
                      'orange',
                      'green',
                    ]}
                    className="mt-6 h-72"
                  />
                ) : (
                  <div className="h-72 flex items-center justify-center">
                    <Text className="text-gray-500">Aucune donnée de statut disponible</Text>
                  </div>
                )}
              </Card>
            </Grid>

            <Card className="mb-6">
              <Title>Distribution des Âges par Statut</Title>
              <BarChart
                data={[
                  { status: 'planned', '<3j': 2, '3-7j': 4, '7-14j': 3, '>14j': 3 },
                  { status: 'detected', '<3j': 3, '3-7j': 3, '7-14j': 2, '>14j': 0 },
                  { status: 'analyzed', '<3j': 5, '3-7j': 5, '7-14j': 4, '>14j': 1 },
                  { status: 'structured', '<3j': 4, '3-7j': 3, '7-14j': 2, '>14j': 1 },
                  { status: 'generated', '<3j': 6, '3-7j': 5, '7-14j': 2, '>14j': 1 },
                  { status: 'validated', '<3j': 4, '3-7j': 3, '7-14j': 2, '>14j': 0 },
                  { status: 'integrated', '<3j': 4, '3-7j': 2, '7-14j': 0, '>14j': 0 },
                  { status: 'completed', '<3j': 4, '3-7j': 3, '7-14j': 3, '>14j': 2 },
                ]}
                index="status"
                categories={['<3j', '3-7j', '7-14j', '>14j']}
                colors={['green', 'amber', 'orange', 'red']}
                stack
                valueFormatter={(value) => `${value}`}
                yAxisWidth={32}
                className="mt-6 h-72"
              />
              <Legend
                categories={['Moins de 3 jours', '3-7 jours', '7-14 jours', 'Plus de 14 jours']}
                colors={['green', 'amber', 'orange', 'red']}
                className="mt-4"
              />
            </Card>

            <Card>
              <div className="flex justify-between items-center mb-4">
                <Title>Migrations avec Problèmes</Title>

                {auditReport.issues.length > 0 && (
                  <Badge size="md" color={auditReport.issues.length > 10 ? 'red' : 'amber'}>
                    {auditReport.issues.length} problèmes
                  </Badge>
                )}
              </div>

              {auditReport.issues.length === 0 ? (
                <div className="py-8 text-center">
                  <Text className="text-gray-500">Aucun problème détecté dans les migrations</Text>
                </div>
              ) : (
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>ID</TableHeaderCell>
                      <TableHeaderCell>Statut</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Âge</TableHeaderCell>
                      <TableHeaderCell>Agents Manquants</TableHeaderCell>
                      <TableHeaderCell>Recommandation</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditReport.issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>{issue.id}</TableCell>
                        <TableCell>
                          <Badge color={getStatusColor(issue.status)}>{issue.status}</Badge>
                        </TableCell>
                        <TableCell>{issue.type || 'standard'}</TableCell>
                        <TableCell>{issue.age}</TableCell>
                        <TableCell>
                          {issue.missing?.map((agent, idx) => (
                            <Badge key={idx} color="red" className="mr-1 mb-1">
                              {agent}
                            </Badge>
                          )) || '-'}
                        </TableCell>
                        <TableCell>{issue.recommendation || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
