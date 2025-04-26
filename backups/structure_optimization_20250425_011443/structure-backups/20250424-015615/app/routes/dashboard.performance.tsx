import React, { useState, useEffect } from reactstructure-agent';
import { json, LoaderFunction } from @remix-run/nodestructure-agent';
import { useLoaderData } from @remix-run/reactstructure-agent';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from rechartsstructure-agent';
import { Table, Badge, Progress, Tabs, Tab, Card, Metric, Text, Title, Button, AreaChart, DonutChart } from @tremor/reactstructure-agent';

// Définir les types pour les données de performance
type TablePerformanceData = {
  id: string;
  table_name: string;
  schema_name: string;
  row_count: number;
  total_size_mb: number;
  index_size_mb: number;
  seq_scan_rate: number;
  avg_query_time_ms: number;
  bloat_percent: number;
  cache_hit_ratio: number;
  index_usage_ratio: number;
  issues: string[];
  optimization_score: number;
  last_analyzed: string;
  partition_status: 'needed' | 'recommended' | 'implemented' | 'not_needed';
  missing_indexes: string[];
  redundant_indexes: string[];
};

type PerformanceOverview = {
  total_tables: number;
  total_size_gb: number;
  tables_with_issues: number;
  avg_optimization_score: number;
  slow_queries_count: number;
  index_recommendations_count: number;
  type_issues_count: number;
  optimization_history: {
    date: string;
    score: number;
  }[];
};

// Loader pour récupérer les données
export const loader: LoaderFunction = async () => {
  // En production, cette fonction appellerait une API ou base de données
  // Dans cet exemple, nous utilisons des données fictives
  const tablesData: TablePerformanceData[] = [
    {
      id: '1',
      table_name: 'commandes',
      schema_name: 'public',
      row_count: 5423980,
      total_size_mb: 1250,
      index_size_mb: 320,
      seq_scan_rate: 0.45,
      avg_query_time_ms: 850,
      bloat_percent: 12,
      cache_hit_ratio: 0.78,
      index_usage_ratio: 0.65,
      issues: ['Scan séquentiel fréquent', 'Jointure inefficace'],
      optimization_score: 65,
      last_analyzed: '2025-04-10',
      partition_status: 'recommended',
      missing_indexes: ['idx_commandes_date', 'idx_commandes_client_id'],
      redundant_indexes: []
    },
    {
      id: '2',
      table_name: 'lignes_commande',
      schema_name: 'public',
      row_count: 25689420,
      total_size_mb: 4230,
      index_size_mb: 980,
      seq_scan_rate: 0.12,
      avg_query_time_ms: 210,
      bloat_percent: 5,
      cache_hit_ratio: 0.92,
      index_usage_ratio: 0.88,
      issues: ['Relation avec commandes non optimisée'],
      optimization_score: 82,
      last_analyzed: '2025-04-10',
      partition_status: 'needed',
      missing_indexes: ['idx_lignes_commande_commande_id_produit_id'],
      redundant_indexes: ['idx_old_reference']
    },
    {
      id: '3',
      table_name: 'produits',
      schema_name: 'public',
      row_count: 125680,
      total_size_mb: 450,
      index_size_mb: 85,
      seq_scan_rate: 0.05,
      avg_query_time_ms: 25,
      bloat_percent: 2,
      cache_hit_ratio: 0.98,
      index_usage_ratio: 0.95,
      issues: [],
      optimization_score: 95,
      last_analyzed: '2025-04-10',
      partition_status: 'not_needed',
      missing_indexes: [],
      redundant_indexes: []
    },
    {
      id: '4',
      table_name: 'utilisateurs',
      schema_name: 'public',
      row_count: 243560,
      total_size_mb: 180,
      index_size_mb: 45,
      seq_scan_rate: 0.08,
      avg_query_time_ms: 15,
      bloat_percent: 1,
      cache_hit_ratio: 0.99,
      index_usage_ratio: 0.93,
      issues: ['Type Float pour données financières'],
      optimization_score: 88,
      last_analyzed: '2025-04-10',
      partition_status: 'not_needed',
      missing_indexes: [],
      redundant_indexes: []
    },
    {
      id: '5',
      table_name: 'logs',
      schema_name: 'public',
      row_count: 35420680,
      total_size_mb: 9800,
      index_size_mb: 1250,
      seq_scan_rate: 0.72,
      avg_query_time_ms: 1850,
      bloat_percent: 25,
      cache_hit_ratio: 0.45,
      index_usage_ratio: 0.32,
      issues: ['Table non partitionnée', 'Scans séquentiels fréquents', 'Temps de requête > 1s'],
      optimization_score: 35,
      last_analyzed: '2025-04-10',
      partition_status: 'needed',
      missing_indexes: ['idx_logs_date', 'idx_logs_level'],
      redundant_indexes: []
    }
  ];

  const overview: PerformanceOverview = {
    total_tables: 185,
    total_size_gb: 28.5,
    tables_with_issues: 42,
    avg_optimization_score: 73,
    slow_queries_count: 18,
    index_recommendations_count: 65,
    type_issues_count: 23,
    optimization_history: [
      { date: '2025-01-12', score: 62 },
      { date: '2025-02-12', score: 65 },
      { date: '2025-03-12', score: 69 },
      { date: '2025-04-12', score: 73 }
    ]
  };

  return json({ tablesData, overview });
};

export default function DatabaseOptimizer() {
  const { tablesData, overview } = useLoaderData<{
    tablesData: TablePerformanceData[];
    overview: PerformanceOverview;
  }>();

  const [sortedData, setSortedData] = useState<TablePerformanceData[]>([]);
  const [sortField, setSortField] = useState<string>('optimization_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Trier les données
    const sorted = [...tablesData].sort((a, b) => {
      const aValue = a[sortField as keyof TablePerformanceData];
      const bValue = b[sortField as keyof TablePerformanceData];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });
    
    setSortedData(sorted);
  }, [tablesData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'emerald';
    if (score >= 70) return 'blue';
    if (score >= 50) return 'amber';
    return 'rose';
  };

  const getPartitionStatusColor = (status: string) => {
    switch (status) {
      case 'needed': return 'rose';
      case 'recommended': return 'amber';
      case 'implemented': return 'emerald';
      default: return 'gray';
    }
  };

  const getPartitionStatusText = (status: string) => {
    switch (status) {
      case 'needed': return 'Nécessaire';
      case 'recommended': return 'Recommandé';
      case 'implemented': return 'Implémenté';
      default: return 'Non nécessaire';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agent 8 - Tableau de Bord d'Optimisation PostgreSQL/Prisma</h1>
        <p className="text-gray-600">Optimiseur SQL & Performances - Dernière analyse: 12 avril 2025</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-3">
          <Card>
            <Title>Nombre de Tables</Title>
            <Metric>{overview.total_tables}</Metric>
            <Text>{overview.tables_with_issues} tables avec problèmes</Text>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <Title>Taille Totale</Title>
            <Metric>{overview.total_size_gb.toFixed(1)} GB</Metric>
            <Text>Répartie sur {overview.total_tables} tables</Text>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <Title>Score d'Optimisation</Title>
            <Metric>{overview.avg_optimization_score}/100</Metric>
            <Progress value={overview.avg_optimization_score} color={getScoreColor(overview.avg_optimization_score)} className="mt-2" />
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <Title>Recommandations</Title>
            <Metric>{overview.index_recommendations_count + overview.type_issues_count}</Metric>
            <Text>{overview.index_recommendations_count} index, {overview.type_issues_count} types</Text>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <Title>Évolution du Score d'Optimisation</Title>
          <AreaChart
            className="h-72 mt-4"
            data={overview.optimization_history}
            index="date"
            categories={["score"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value}%`}
          />
        </Card>
        <Card>
          <Title>Distribution des Problèmes</Title>
          <DonutChart
            className="h-72 mt-4"
            data={[
              { name: 'Problèmes d\'index', value: overview.index_recommendations_count },
              { name: 'Problèmes de types', value: overview.type_issues_count },
              { name: 'Requêtes lentes', value: overview.slow_queries_count },
              { name: 'Tables nécessitant partitionnement', value: sortedData.filter(t => t.partition_status === 'needed').length }
            ]}
            category="value"
            index="name"
            colors={["blue", "amber", "rose", "emerald"]}
          />
        </Card>
      </div>

      <Card className="mb-8">
        <Tabs defaultValue="all" className="mb-6">
          <Tab value="all" text="Toutes les Tables" />
          <Tab value="issues" text="Tables avec Problèmes" />
          <Tab value="partition" text="Candidats au Partitionnement" />
          <Tab value="index" text="Problèmes d'Index" />
        </Tabs>

        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th className="cursor-pointer px-4 py-2" onClick={() => handleSort('table_name')}>
                  Table
                  {sortField === 'table_name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="cursor-pointer px-4 py-2" onClick={() => handleSort('row_count')}>
                  Lignes
                  {sortField === 'row_count' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="cursor-pointer px-4 py-2" onClick={() => handleSort('total_size_mb')}>
                  Taille (MB)
                  {sortField === 'total_size_mb' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="cursor-pointer px-4 py-2" onClick={() => handleSort('seq_scan_rate')}>
                  Taux de Scan. Séq.
                  {sortField === 'seq_scan_rate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="cursor-pointer px-4 py-2" onClick={() => handleSort('avg_query_time_ms')}>
                  Temps Moy. (ms)
                  {sortField === 'avg_query_time_ms' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="cursor-pointer px-4 py-2" onClick={() => handleSort('partition_status')}>
                  Partitionnement
                  {sortField === 'partition_status' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="cursor-pointer px-4 py-2" onClick={() => handleSort('optimization_score')}>
                  Score
                  {sortField === 'optimization_score' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-2">Problèmes</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((table) => (
                <tr key={table.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{table.table_name}</td>
                  <td className="px-4 py-2">{table.row_count.toLocaleString()}</td>
                  <td className="px-4 py-2">{table.total_size_mb.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <Badge color={table.seq_scan_rate > 0.3 ? 'rose' : 'emerald'}>
                      {(table.seq_scan_rate * 100).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge color={table.avg_query_time_ms > 500 ? 'rose' : table.avg_query_time_ms > 100 ? 'amber' : 'emerald'}>
                      {table.avg_query_time_ms.toFixed(0)} ms
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge color={getPartitionStatusColor(table.partition_status)}>
                      {getPartitionStatusText(table.partition_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Progress value={table.optimization_score} color={getScoreColor(table.optimization_score)} />
                  </td>
                  <td className="px-4 py-2">
                    {table.issues.length > 0 ? (
                      <div className="space-y-1">
                        {table.issues.map((issue, idx) => (
                          <Badge key={idx} color="rose" className="mr-1">{issue}</Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge color="emerald">Aucun problème</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card>
        <Title>Répartition par Taille de Table</Title>
        <ResponsiveContainer width="100%" height={400} className="mt-6">
          <BarChart data={sortedData.sort((a, b) => b.total_size_mb - a.total_size_mb).slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="table_name" />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MB`} />
            <Legend />
            <Bar dataKey="total_size_mb" name="Taille Totale (MB)" fill="#3b82f6" />
            <Bar dataKey="index_size_mb" name="Taille Index (MB)" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}