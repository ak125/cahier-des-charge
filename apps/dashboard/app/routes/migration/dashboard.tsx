import { LoaderFunction, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import DebtRadar from '~/components/migration/DebtRadar';
import DependencyGraph from '~/components/migration/DependencyGraph';
import FilterPanel from '~/components/migration/FilterPanel';
import MigrationStatus from '~/components/migration/MigrationStatus';
import TableCard from '~/components/migration/TableCard';
import {
  loadDebtReport,
  loadMigrationTasks,
  loadRelationGraph,
  loadSchemaMap,
  loadTableClassification,
  loadTypeMapping,
} from '~/lib/migration/dataLoaders';
import type {
  DebtReport,
  MigrationTask,
  RelationGraph,
  SchemaMap,
  TableClassification,
  TypeMapping,
} from '~/types/migration';

/**
 * Dashboard de Supervision de Migration SQL → Prisma/PostgreSQL
 *
 * Ce dashboard permet de visualiser l'état de la migration, les dépendances
 * entre tables, la dette technique et le plan de migration.
 */

type LoaderData = {
  schemaMap: SchemaMap;
  tableClassification: TableClassification;
  relationGraph: RelationGraph;
  typeMapping: TypeMapping;
  debtReport: DebtReport;
  migrationTasks: MigrationTask[];
  lastUpdate: string;
};

export const loader: LoaderFunction = async () => {
  try {
    // Charger toutes les données nécessaires pour le dashboard
    const schemaMap = await loadSchemaMap();
    const tableClassification = await loadTableClassification();
    const relationGraph = await loadRelationGraph();
    const typeMapping = await loadTypeMapping();
    const debtReport = await loadDebtReport();
    const migrationTasks = await loadMigrationTasks();

    // Date de dernière mise à jour (la plus récente de tous les fichiers)
    const lastUpdate = new Date().toISOString();

    return json<LoaderData>({
      schemaMap,
      tableClassification,
      relationGraph,
      typeMapping,
      debtReport,
      migrationTasks,
      lastUpdate,
    });
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    throw new Response('Erreur lors du chargement des données', { status: 500 });
  }
};

export default function MigrationDashboard() {
  const {
    schemaMap,
    tableClassification,
    relationGraph,
    typeMapping,
    debtReport,
    migrationTasks,
    lastUpdate,
  } = useLoaderData<LoaderData>();

  // État local pour les filtres
  const [filters, setFilters] = useState({
    category: 'all', // business, junction, reference, view
    status: 'all', // pending, in_progress, completed, blocked
    debtThreshold: 0, // Seuil minimal de dette technique (0-100)
    searchTerm: '',
    module: 'all',
  });

  // Tables filtrées en fonction des critères
  const filteredTables = migrationTasks.filter((task) => {
    // Filtre par catégorie
    if (filters.category !== 'all' && task.category !== filters.category) {
      return false;
    }

    // Filtre par statut
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // Filtre par seuil de dette technique
    const debtScore = debtReport.tables[task.table]?.score || 0;
    if (debtScore < filters.debtThreshold) {
      return false;
    }

    // Filtre par recherche textuelle (nom de table ou modèle Prisma)
    if (
      filters.searchTerm &&
      !task.table.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
      !task.prismaModel.toLowerCase().includes(filters.searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Statistiques globales
  const totalTables = migrationTasks.length;
  const completedTables = migrationTasks.filter((t) => t.status === 'completed').length;
  const blockedTables = migrationTasks.filter((t) => t.status === 'blocked').length;
  const pendingTables = migrationTasks.filter((t) => t.status === 'pending').length;
  const inProgressTables = migrationTasks.filter((t) => t.status === 'in_progress').length;

  // Calcul du pourcentage d'avancement
  const progressPercentage = Math.round((completedTables / totalTables) * 100);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Dashboard de Migration SQL → Prisma
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualisation et suivi de la migration des tables SQL vers des modèles Prisma. Dernière
            mise à jour: {new Date(lastUpdate).toLocaleString()}
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Progression globale</div>
            <div className="mt-1">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {progressPercentage}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-center">
                <div className="bg-green-100 p-1 rounded">
                  <span className="font-medium">{completedTables}</span> terminées
                </div>
                <div className="bg-yellow-100 p-1 rounded">
                  <span className="font-medium">{inProgressTables}</span> en cours
                </div>
                <div className="bg-red-100 p-1 rounded">
                  <span className="font-medium">{blockedTables}</span> bloquées
                </div>
                <div className="bg-gray-100 p-1 rounded">
                  <span className="font-medium">{pendingTables}</span> en attente
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de filtres */}
      <div className="mt-6">
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          categories={tableClassification.categories}
        />
      </div>

      {/* Affichage en mode grille/liste/graphe */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Graphe de dépendances - occupe 8 colonnes */}
        <div className="col-span-8 bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Graphe de dépendances</h2>
          <DependencyGraph
            relationGraph={relationGraph}
            highlightedTables={filteredTables.map((t) => t.table)}
          />
        </div>

        {/* Dashboard de dette technique - occupe 4 colonnes */}
        <div className="col-span-4 bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dette technique</h2>
          <DebtRadar debtReport={debtReport} selectedTables={filteredTables.map((t) => t.table)} />

          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Tables critiques</h3>
            <ul className="space-y-1 text-sm">
              {migrationTasks
                .filter((t) => t.critical)
                .slice(0, 5)
                .map((task) => (
                  <li key={task.table} className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" />
                    <span className="font-medium">{task.prismaModel}</span>
                    <span className="ml-2 text-gray-500 text-xs">({task.table})</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Liste des tables filtrées */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Tables filtrées ({filteredTables.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map((task) => (
            <TableCard
              key={task.table}
              task={task}
              schema={schemaMap.tables[task.table]}
              debtScore={debtReport.tables[task.table]?.score || 0}
              debtIssues={debtReport.tables[task.table]?.issues || []}
              typeMapping={typeMapping}
            />
          ))}
        </div>
      </div>

      {/* Statut des migrations */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Plan de migration</h2>
        <MigrationStatus tasks={filteredTables} />
      </div>
    </div>
  );
}
