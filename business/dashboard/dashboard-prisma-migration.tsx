import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';

/**
 * Dashboard de migration Prisma + PostgreSQL
 * Ce tableau de bord permet de visualiser l'état de la synchronisation entre
 * la base de données PostgreSQL et les modèles Prisma, ainsi que l'impact sur le code.
 */

type MigrationState = {
  schema: {
    total: number;
    synced: number;
    warnings: number;
    errors: number;
  };
  database: {
    tables: number;
    columns: number;
    relations: number;
    indexes: number;
  };
  code: {
    services: {
      total: number;
      synced: number;
    };
    dtos: {
      total: number;
      synced: number;
    };
    remixComponents: {
      total: number;
      synced: number;
    };
  };
  warnings: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    entity?: string;
    field?: string;
  }>;
  models: Array<{
    name: string;
    fields: number;
    synced: boolean;
    relations: number;
    usedIn: {
      services: number;
      dtos: number;
      remixComponents: number;
    };
  }>;
  changes: {
    modelsAdded: string[];
    modelsRemoved: string[];
    fieldsAdded: Record<string, string[]>;
    fieldsRemoved: Record<string, string[]>;
    fieldsTypeChanged: Record<string, Record<string, { from: string; to: string }>>;
    relationsChanged: Record<string, Record<string, { from: string; to: string }>>;
  };
  entityGraph: any;
};

// Loader pour récupérer les données de migration
export async function loader({ request }: LoaderFunctionArgs) {
  // Chemins des fichiers de données
  const schemaDiffPath = path.resolve('./packages/database/prisma/schema_migration_diff.json');
  const warningsPath = path.resolve('./reports/migration_warnings.json');
  const entityGraphPath = path.resolve('./docs/entity_graph.json');
  const integrityReportPath = path.resolve('./reports/integrity_report.json');

  // Initialiser l'état par défaut
  const state: MigrationState = {
    schema: { total: 0, synced: 0, warnings: 0, errors: 0 },
    database: { tables: 0, columns: 0, relations: 0, indexes: 0 },
    code: {
      services: { total: 0, synced: 0 },
      dtos: { total: 0, synced: 0 },
      remixComponents: { total: 0, synced: 0 },
    },
    warnings: [],
    models: [],
    changes: {
      modelsAdded: [],
      modelsRemoved: [],
      fieldsAdded: {},
      fieldsRemoved: {},
      fieldsTypeChanged: {},
      relationsChanged: {},
    },
    entityGraph: null,
  };

  try {
    // Récupérer les différences de schéma si le fichier existe
    if (fs.existsSync(schemaDiffPath)) {
      const schemaDiff = JSON.parse(fs.readFileSync(schemaDiffPath, 'utf8'));
      state.changes = schemaDiff.summary || state.changes;

      // Calculer les statistiques de modèles
      if (state.changes.modelsAdded) {
        state.schema.total += state.changes.modelsAdded.length;
      }

      // Compter les champs ajoutés/supprimés
      if (state.changes.fieldsAdded) {
        Object.values(state.changes.fieldsAdded).forEach((fields) => {
          state.database.columns += fields.length;
        });
      }
    }

    // Récupérer les avertissements de migration si le fichier existe
    if (fs.existsSync(warningsPath)) {
      const warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
      state.warnings = warnings.warnings || [];

      // Compter les avertissements par sévérité
      state.schema.warnings = state.warnings.filter((w) => w.severity === 'warning').length;
      state.schema.errors = state.warnings.filter((w) => w.severity === 'critical').length;
    }

    // Récupérer le graphe d'entités si le fichier existe
    if (fs.existsSync(entityGraphPath)) {
      state.entityGraph = JSON.parse(fs.readFileSync(entityGraphPath, 'utf8'));

      // Extraire les modèles et leurs statistiques
      if (state.entityGraph.entities) {
        state.models = state.entityGraph.entities.map((entity: any) => ({
          name: entity.name,
          fields: entity.fields.length,
          synced: entity.synced || false,
          relations: entity.relations?.length || 0,
          usedIn: entity.usedIn || {
            services: 0,
            dtos: 0,
            remixComponents: 0,
          },
        }));

        // Mettre à jour les totaux
        state.schema.total = state.models.length;
        state.schema.synced = state.models.filter((m) => m.synced).length;
        state.database.tables = state.models.length;
        state.database.relations = state.models.reduce((acc, model) => acc + model.relations, 0);
      }
    }

    // Récupérer le rapport d'intégrité si le fichier existe
    if (fs.existsSync(integrityReportPath)) {
      const integrityReport = JSON.parse(fs.readFileSync(integrityReportPath, 'utf8'));

      // Ajouter des avertissements basés sur les problèmes d'intégrité
      if (integrityReport.issues) {
        integrityReport.issues.forEach((issue: any) => {
          state.warnings.push({
            severity: issue.severity || 'warning',
            message: issue.message,
            entity: issue.entity,
            field: issue.field,
          });
        });
      }
    }

    // Connecter à Prisma pour obtenir des informations supplémentaires sur la base de données
    const prisma = new PrismaClient();
    try {
      // Récupérer le nombre d'index en interrogeant pg_indexes
      const indexCount = await prisma.$queryRaw`
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE schemaname = 'public'
      `;

      if (Array.isArray(indexCount) && indexCount.length > 0) {
        state.database.indexes = Number(indexCount[0].count) || 0;
      }

      // Fermer la connexion Prisma
      await prisma.$disconnect();
    } catch (dbError) {
      console.error('Erreur lors de la récupération des informations de base de données:', dbError);
      // Continuer avec les valeurs par défaut
    }

    // Simuler la récupération des statistiques de code (remplacer par une véritable analyse)
    // Ces informations seraient normalement obtenues en analysant le code source
    state.code = {
      services: {
        total: state.schema.total,
        synced: Math.floor(state.schema.total * 0.8), // Simuler 80% de synchronisation
      },
      dtos: {
        total: state.schema.total * 2, // Généralement 2 DTOs par modèle (Create + Update)
        synced: Math.floor(state.schema.total * 1.6), // Simuler 80% de synchronisation
      },
      remixComponents: {
        total: state.schema.total * 3, // Plusieurs composants Remix par modèle
        synced: Math.floor(state.schema.total * 2.4), // Simuler 80% de synchronisation
      },
    };
  } catch (error) {
    console.error('Erreur lors du chargement des données de migration:', error);
    // Retourner l'état par défaut en cas d'erreur
  }

  return json({ state });
}

export default function DashboardPrismaMigration() {
  const { state } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('overview');

  // Fonction pour calculer le pourcentage de synchronisation
  const syncPercentage = (synced: number, total: number) => {
    if (total === 0) return 100;
    return Math.round((synced / total) * 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de Bord de Migration PostgreSQL + Prisma</h1>

      {/* Résumé des statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Schéma Prisma</h2>
          <div className="flex justify-between items-center mb-2">
            <span>Modèles:</span>
            <span className="font-semibold">{state.schema.total}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Synchronisés:</span>
            <span
              className={`font-semibold ${
                syncPercentage(state.schema.synced, state.schema.total) < 90
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}
            >
              {state.schema.synced} ({syncPercentage(state.schema.synced, state.schema.total)}%)
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Avertissements:</span>
            <span
              className={`font-semibold ${
                state.schema.warnings > 0 ? 'text-amber-600' : 'text-green-600'
              }`}
            >
              {state.schema.warnings}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Erreurs:</span>
            <span
              className={`font-semibold ${
                state.schema.errors > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {state.schema.errors}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Base de données PostgreSQL</h2>
          <div className="flex justify-between items-center mb-2">
            <span>Tables:</span>
            <span className="font-semibold">{state.database.tables}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Colonnes:</span>
            <span className="font-semibold">{state.database.columns}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Relations:</span>
            <span className="font-semibold">{state.database.relations}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Index:</span>
            <span className="font-semibold">{state.database.indexes}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Synchronisation du Code</h2>
          <div className="flex justify-between items-center mb-2">
            <span>Services NestJS:</span>
            <span
              className={`font-semibold ${
                syncPercentage(state.code.services.synced, state.code.services.total) < 90
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}
            >
              {state.code.services.synced}/{state.code.services.total} (
              {syncPercentage(state.code.services.synced, state.code.services.total)}%)
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>DTOs:</span>
            <span
              className={`font-semibold ${
                syncPercentage(state.code.dtos.synced, state.code.dtos.total) < 90
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}
            >
              {state.code.dtos.synced}/{state.code.dtos.total} (
              {syncPercentage(state.code.dtos.synced, state.code.dtos.total)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Composants Remix:</span>
            <span
              className={`font-semibold ${
                syncPercentage(
                  state.code.remixComponents.synced,
                  state.code.remixComponents.total
                ) < 90
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}
            >
              {state.code.remixComponents.synced}/{state.code.remixComponents.total} (
              {syncPercentage(state.code.remixComponents.synced, state.code.remixComponents.total)}
              %)
            </span>
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="border-b border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              Vue d'ensemble
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('models')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'models'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              Modèles
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('changes')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'changes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              Changements
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('warnings')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'warnings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              Avertissements
              {state.warnings.length > 0 && (
                <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">
                  {state.warnings.length}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Vue d'ensemble de la Migration</h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">État de la Synchronisation</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className={`h-4 rounded-full ${
                    syncPercentage(state.schema.synced, state.schema.total) < 70
                      ? 'bg-red-600'
                      : syncPercentage(state.schema.synced, state.schema.total) < 90
                        ? 'bg-amber-500'
                        : 'bg-green-600'
                  }`}
                  style={{ width: `${syncPercentage(state.schema.synced, state.schema.total)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {syncPercentage(state.schema.synced, state.schema.total)}% des modèles sont
                correctement synchronisés entre PostgreSQL et Prisma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Résumé des Changements</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{state.changes.modelsAdded.length} modèles ajoutés</li>
                  <li>{state.changes.modelsRemoved.length} modèles supprimés</li>
                  <li>
                    {Object.keys(state.changes.fieldsAdded).length} modèles avec champs ajoutés
                  </li>
                  <li>
                    {Object.keys(state.changes.fieldsRemoved).length} modèles avec champs supprimés
                  </li>
                  <li>
                    {Object.keys(state.changes.fieldsTypeChanged).length} modèles avec types
                    modifiés
                  </li>
                  <li>{Object.keys(state.changes.relationsChanged).length} relations modifiées</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Actions Recommandées</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {state.schema.errors > 0 && (
                    <li className="text-red-600">
                      Corriger les {state.schema.errors} erreurs critiques
                    </li>
                  )}
                  {state.schema.warnings > 0 && (
                    <li className="text-amber-600">
                      Examiner les {state.schema.warnings} avertissements
                    </li>
                  )}
                  {syncPercentage(state.code.services.synced, state.code.services.total) < 100 && (
                    <li>
                      Mettre à jour {state.code.services.total - state.code.services.synced}{' '}
                      services NestJS
                    </li>
                  )}
                  {syncPercentage(state.code.dtos.synced, state.code.dtos.total) < 100 && (
                    <li>Mettre à jour {state.code.dtos.total - state.code.dtos.synced} DTOs</li>
                  )}
                  {syncPercentage(
                    state.code.remixComponents.synced,
                    state.code.remixComponents.total
                  ) < 100 && (
                    <li>
                      Mettre à jour{' '}
                      {state.code.remixComponents.total - state.code.remixComponents.synced}{' '}
                      composants Remix
                    </li>
                  )}
                  {state.schema.synced === state.schema.total &&
                    state.schema.errors === 0 &&
                    state.schema.warnings === 0 && (
                      <li className="text-green-600">
                        Tout est synchronisé ! Aucune action requise.
                      </li>
                    )}
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Prochaines étapes</h3>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    Exécutez{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      ./prisma-pg-sync.sh --analyze-only
                    </code>{' '}
                    pour une analyse complète
                  </li>
                  <li>Corrigez les erreurs critiques identifiées</li>
                  <li>
                    Exécutez{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      ts-node schema_diff_to_code_patch.ts
                    </code>{' '}
                    pour synchroniser le code
                  </li>
                  <li>Vérifiez les modifications automatiques et ajustez si nécessaire</li>
                  <li>
                    Exécutez{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      ./prisma-pg-sync.sh --migrate-schema
                    </code>{' '}
                    pour appliquer les changements
                  </li>
                  <li>Exécutez les tests pour valider la migration</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Modèles ({state.models.length})</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left">Nom du modèle</th>
                    <th className="py-3 px-4 text-left">Champs</th>
                    <th className="py-3 px-4 text-left">Relations</th>
                    <th className="py-3 px-4 text-left">Utilisé dans</th>
                    <th className="py-3 px-4 text-left">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {state.models.map((model, index) => (
                    <tr key={index} className={model.synced ? '' : 'bg-amber-50'}>
                      <td className="py-3 px-4 font-medium">{model.name}</td>
                      <td className="py-3 px-4">{model.fields}</td>
                      <td className="py-3 px-4">{model.relations}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block mr-2">Services: {model.usedIn.services}</span>
                        <span className="inline-block mr-2">DTOs: {model.usedIn.dtos}</span>
                        <span className="inline-block">Remix: {model.usedIn.remixComponents}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            model.synced
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {model.synced ? 'Synchronisé' : 'Désynchronisé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {state.models.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                        Aucun modèle trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'changes' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Changements Détectés</h2>

            <div className="space-y-6">
              {state.changes.modelsAdded.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Modèles Ajoutés</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {state.changes.modelsAdded.map((model, index) => (
                      <li key={index}>{model}</li>
                    ))}
                  </ul>
                </div>
              )}

              {state.changes.modelsRemoved.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Modèles Supprimés</h3>
                  <ul className="list-disc pl-5 space-y-1 text-red-600">
                    {state.changes.modelsRemoved.map((model, index) => (
                      <li key={index}>{model}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Object.keys(state.changes.fieldsAdded).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Champs Ajoutés</h3>
                  <div className="space-y-2">
                    {Object.entries(state.changes.fieldsAdded).map(([model, fields], index) => (
                      <div key={index}>
                        <h4 className="font-medium">{model}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {fields.map((field, fieldIndex) => (
                            <li key={fieldIndex}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(state.changes.fieldsRemoved).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Champs Supprimés</h3>
                  <div className="space-y-2">
                    {Object.entries(state.changes.fieldsRemoved).map(([model, fields], index) => (
                      <div key={index}>
                        <h4 className="font-medium">{model}</h4>
                        <ul className="list-disc pl-5 space-y-1 text-red-600">
                          {fields.map((field, fieldIndex) => (
                            <li key={fieldIndex}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(state.changes.fieldsTypeChanged).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Types de Champs Modifiés</h3>
                  <div className="space-y-2">
                    {Object.entries(state.changes.fieldsTypeChanged).map(
                      ([model, fields], index) => (
                        <div key={index}>
                          <h4 className="font-medium">{model}</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(fields).map(([field, change], fieldIndex) => (
                              <li key={fieldIndex}>
                                {field}:{' '}
                                <span className="line-through text-red-500">{change.from}</span> →{' '}
                                <span className="text-green-500">{change.to}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {Object.keys(state.changes.relationsChanged).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Relations Modifiées</h3>
                  <div className="space-y-2">
                    {Object.entries(state.changes.relationsChanged).map(
                      ([model, relations], index) => (
                        <div key={index}>
                          <h4 className="font-medium">{model}</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(relations).map(([field, change], fieldIndex) => (
                              <li key={fieldIndex}>
                                {field}:{' '}
                                <span className="line-through text-red-500">{change.from}</span> →{' '}
                                <span className="text-green-500">{change.to}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {state.changes.modelsAdded.length === 0 &&
                state.changes.modelsRemoved.length === 0 &&
                Object.keys(state.changes.fieldsAdded).length === 0 &&
                Object.keys(state.changes.fieldsRemoved).length === 0 &&
                Object.keys(state.changes.fieldsTypeChanged).length === 0 &&
                Object.keys(state.changes.relationsChanged).length === 0 && (
                  <p className="text-center text-gray-500">Aucun changement détecté</p>
                )}
            </div>
          </div>
        )}

        {activeTab === 'warnings' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Avertissements ({state.warnings.length})</h2>

            {state.warnings.length > 0 ? (
              <div className="space-y-4">
                {state.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      warning.severity === 'critical'
                        ? 'bg-red-50 border border-red-200'
                        : warning.severity === 'warning'
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`mr-3 ${
                          warning.severity === 'critical'
                            ? 'text-red-500'
                            : warning.severity === 'warning'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                        }`}
                      >
                        {warning.severity === 'critical'
                          ? '⚠️'
                          : warning.severity === 'warning'
                            ? '⚠️'
                            : 'ℹ️'}
                      </div>
                      <div>
                        <p className="font-medium">{warning.message}</p>
                        {(warning.entity || warning.field) && (
                          <p className="mt-1 text-sm">
                            {warning.entity && (
                              <span className="mr-2">
                                Entité:{' '}
                                <code className="bg-gray-100 px-1 rounded">{warning.entity}</code>
                              </span>
                            )}
                            {warning.field && (
                              <span>
                                Champ:{' '}
                                <code className="bg-gray-100 px-1 rounded">{warning.field}</code>
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Aucun avertissement détecté. Tout semble en ordre !
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            // Cette fonction serait normalement liée à une action côté serveur
            alert(
              "Cette action lancerait prisma-pg-sync.sh avec les options appropriées. Cette fonctionnalité n'est pas encore implémentée dans cette démo."
            );
          }}
        >
          Analyser les changements
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          onClick={() => {
            // Cette fonction serait normalement liée à une action côté serveur
            alert(
              "Cette action synchroniserait automatiquement le code avec le schéma Prisma. Cette fonctionnalité n'est pas encore implémentée dans cette démo."
            );
          }}
        >
          Synchroniser le code
        </button>

        <button
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          onClick={() => {
            // Cette fonction serait normalement liée à une action côté serveur
            alert(
              "Cette action générerait un rapport détaillé des modifications. Cette fonctionnalité n'est pas encore implémentée dans cette démo."
            );
          }}
        >
          Générer un rapport
        </button>
      </div>
    </div>
  );
}
