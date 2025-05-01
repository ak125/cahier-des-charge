import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import DebtRadar from '~/components/migration/DebtRadar';
import DependencyGraph from '~/components/migration/DependencyGraph';
import FilterPanel from '~/components/migration/FilterPanel';
import MigrationStatus from '~/components/migration/MigrationStatus';
import TableCard from '~/components/migration/TableCard';
import { loadDebtReport } from '~/lib/migration/loadDebtReport';
import { loadRelationGraph } from '~/lib/migration/loadRelationGraph';
import { loadSchemaMap } from '~/lib/migration/loadSchemaMap';
import { loadTaskStatus } from '~/lib/migration/loadTaskStatus';
import { supabaseClient } from '~/lib/supabase/client';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Charger les données depuis les fichiers ou Supabase
  const schemaMap = await loadSchemaMap();
  const taskStatus = await loadTaskStatus();
  const relationGraph = await loadRelationGraph();
  const debtReport = await loadDebtReport();

  return json({
    schemaMap,
    taskStatus,
    relationGraph,
    debtReport,
    timestamp: new Date().toISOString(),
  });
};

export default function Dashboard() {
  const { schemaMap, taskStatus, relationGraph, debtReport, timestamp } =
    useLoaderData<typeof loader>();
  const [filteredTables, setFilteredTables] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDebtLevel, setFilterDebtLevel] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);

  // Configuration du client Supabase Realtime
  useEffect(() => {
    const supabase = supabaseClient();

    // S'abonner aux changements de statut de migration en temps réel
    const subscription = supabase
      .channel('migration_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'migration_status',
        },
        (payload) => {
          setRealtimeData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Filtrage des tables en fonction des critères sélectionnés
  useEffect(() => {
    let filtered = Object.keys(schemaMap.tables);

    if (filterCategory !== 'all') {
      filtered = filtered.filter(
        (tableName) => schemaMap.tables[tableName].category === filterCategory
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((tableName) => taskStatus[tableName]?.status === filterStatus);
    }

    if (filterDebtLevel !== 'all') {
      filtered = filtered.filter((tableName) => {
        const debtScore = debtReport[tableName]?.score || 0;
        if (filterDebtLevel === 'high') return debtScore > 70;
        if (filterDebtLevel === 'medium') return debtScore > 30 && debtScore <= 70;
        if (filterDebtLevel === 'low') return debtScore <= 30;
        return true;
      });
    }

    setFilteredTables(filtered);
  }, [filterCategory, filterStatus, filterDebtLevel, schemaMap, taskStatus, debtReport]);

  // Statistiques globales
  const totalTables = Object.keys(schemaMap.tables).length;
  const migratedTables = Object.values(taskStatus).filter((t) => t.status === 'migrated').length;
  const validatedTables = Object.values(taskStatus).filter((t) => t.status === 'validated').length;
  const pendingTables = Object.values(taskStatus).filter((t) => t.status === 'pending').length;

  return (
    <div className="migration-dashboard">
      <header className="dashboard-header">
        <h1>Dashboard de Migration SQL → Prisma/PostgreSQL</h1>
        <div className="last-update">
          Dernière mise à jour: {new Date(timestamp).toLocaleString()}
        </div>

        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value">{totalTables}</div>
            <div className="stat-label">Tables totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{migratedTables}</div>
            <div className="stat-label">Tables migrées</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{validatedTables}</div>
            <div className="stat-label">Tables validées</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pendingTables}</div>
            <div className="stat-label">Tables en attente</div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <FilterPanel
            categories={[...new Set(Object.values(schemaMap.tables).map((t) => t.category))]}
            statuses={['pending', 'blocked', 'in_progress', 'migrated', 'validated', 'ignored']}
            debtLevels={['low', 'medium', 'high']}
            onCategoryChange={setFilterCategory}
            onStatusChange={setFilterStatus}
            onDebtLevelChange={setFilterDebtLevel}
          />

          <MigrationStatus
            tables={taskStatus}
            onTableSelect={setSelectedTable}
            realtimeUpdate={realtimeData}
          />
        </aside>

        <main className="dashboard-main">
          <section className="graph-container">
            <h2>Graphe de dépendances</h2>
            <DependencyGraph
              relationGraph={relationGraph}
              highlightedTable={selectedTable}
              filteredTables={filteredTables}
            />
          </section>

          <section className="tables-container">
            <h2>Tables ({filteredTables.length})</h2>
            <div className="tables-grid">
              {filteredTables.map((tableName) => (
                <TableCard
                  key={tableName}
                  tableName={tableName}
                  schema={schemaMap.tables[tableName]}
                  status={taskStatus[tableName]}
                  debtInfo={debtReport[tableName]}
                  isSelected={selectedTable === tableName}
                  onSelect={() => setSelectedTable(tableName)}
                />
              ))}
            </div>
          </section>

          {selectedTable && (
            <section className="selected-table-detail">
              <h2>Détails: {selectedTable}</h2>
              <div className="detail-panels">
                <div className="detail-panel">
                  <h3>Structure</h3>
                  <pre className="code-block">
                    {JSON.stringify(schemaMap.tables[selectedTable], null, 2)}
                  </pre>
                </div>

                <div className="detail-panel">
                  <h3>Analyse de dette technique</h3>
                  <DebtRadar debtData={debtReport[selectedTable] || {}} tableName={selectedTable} />
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
