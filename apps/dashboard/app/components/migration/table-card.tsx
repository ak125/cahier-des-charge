import { Link } from '@remix-run/react';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  defaultValue?: string;
}

interface Relation {
  type: string; // "hasMany" | "belongsTo" | "hasOne" | "manyToMany"
  tableName: string;
  foreignKey: string;
  alias?: string;
}

interface TableDebt {
  score: number;
  issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
}

export interface Table {
  name: string;
  category: string;
  module?: string;
  description?: string;
  columns: Column[];
  relations: Relation[];
  migrationStatus: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  debt: TableDebt;
  prismaModel?: string;
}

interface TableCardProps {
  table: Table;
  onStatusChange: (tableName: string, newStatus: string) => void;
}

export default function TableCard({ table, onStatusChange }: TableCardProps) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    skipped: 'bg-yellow-100 text-yellow-800',
  };

  const debtScoreColor = (score: number) => {
    if (score < 25) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    if (score < 75) return 'text-orange-600';
    return 'text-red-600';
  };

  // Créer une liste des PK pour la table
  const primaryKeys = table.columns
    .filter((col) => col.isPrimaryKey)
    .map((col) => col.name)
    .join(', ');

  // Générer un modèle Prisma basique pour cette table
  const generatePrismaModel = () => {
    if (table.prismaModel) return table.prismaModel;

    const modelName = table.name
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const columnDefinitions = table.columns
      .map((col) => {
        const type = mapSqlToPrismaType(col.type);
        const modifiers = [];

        if (col.isPrimaryKey) modifiers.push('@id');
        if (!col.nullable) modifiers.push("@default('')");

        const modifierStr = modifiers.length > 0 ? ` ${modifiers.join(' ')}` : '';

        return `  ${col.name} ${type}${col.nullable ? '?' : ''}${modifierStr}`;
      })
      .join('\n');

    const relationDefinitions = table.relations
      .map((rel) => {
        const relatedModelName = rel.tableName
          .toLowerCase()
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');

        if (rel.type === 'hasMany') {
          return `  ${rel.tableName.toLowerCase()}s ${relatedModelName}[]`;
        }
        if (rel.type === 'belongsTo') {
          return `  ${rel.tableName.toLowerCase()} ${relatedModelName}${rel.nullable ? '?' : ''}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');

    return `model ${modelName} {
${columnDefinitions}
${relationDefinitions.length > 0 ? `\n${relationDefinitions}` : ''}
}`;
  };

  // Fonction helper pour mapper les types SQL vers Prisma
  const mapSqlToPrismaType = (sqlType: string): string => {
    const typeMap: Record<string, string> = {
      int: 'Int',
      bigint: 'BigInt',
      tinyint: 'Int',
      smallint: 'Int',
      mediumint: 'Int',
      varchar: 'String',
      char: 'String',
      text: 'String',
      longtext: 'String',
      mediumtext: 'String',
      tinytext: 'String',
      decimal: 'Decimal',
      numeric: 'Decimal',
      float: 'Float',
      double: 'Float',
      date: 'DateTime',
      datetime: 'DateTime',
      timestamp: 'DateTime',
      time: 'String',
      year: 'Int',
      boolean: 'Boolean',
      bool: 'Boolean',
      'tinyint(1)': 'Boolean',
      enum: 'String',
      set: 'String',
      json: 'Json',
      binary: 'Bytes',
      varbinary: 'Bytes',
      blob: 'Bytes',
      longblob: 'Bytes',
      mediumblob: 'Bytes',
      tinyblob: 'Bytes',
    };

    // Extraire le type de base (ignorer la taille/précision)
    const baseType = sqlType.toLowerCase().split('(')[0];
    return typeMap[baseType] || 'String';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* En-tête de la fiche avec nom de table et statut */}
      <div className="flex justify-between items-center border-b p-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{table.name}</h3>
          <p className="text-sm text-gray-500">
            {table.category === 'business'
              ? `Table métier${table.module ? ` (${table.module})` : ''}`
              : table.category === 'junction'
                ? 'Table de jointure'
                : table.category === 'technical'
                  ? 'Table technique'
                  : table.category}
          </p>
        </div>
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColors[table.migrationStatus]
            }`}
          >
            {table.migrationStatus === 'pending'
              ? 'En attente'
              : table.migrationStatus === 'in_progress'
                ? 'En cours'
                : table.migrationStatus === 'completed'
                  ? 'Terminée'
                  : table.migrationStatus === 'blocked'
                    ? 'Bloquée'
                    : 'Ignorée'}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Description de la table */}
        {table.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">{table.description}</p>
          </div>
        )}

        {/* Informations clés */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Clé primaire</h4>
            <p className="text-sm text-gray-900">{primaryKeys || 'Aucune'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Dette technique</h4>
            <p className={`text-sm font-medium ${debtScoreColor(table.debt.score)}`}>
              {table.debt.score}/100
            </p>
          </div>
        </div>

        {/* Tabs pour colonnes, relations et problèmes */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button className="border-indigo-500 text-indigo-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              Structure
            </button>
            <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              Relations ({table.relations.length})
            </button>
            <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              Problèmes ({table.debt.issues.length})
            </button>
          </nav>
        </div>

        {/* Colonnes */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Structure des colonnes</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nom
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Attributs
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.columns.slice(0, 5).map((column) => (
                  <tr key={column.name}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {column.name}
                      {column.isPrimaryKey && (
                        <span className="ml-1 text-xs font-medium text-indigo-700">PK</span>
                      )}
                      {column.isForeignKey && (
                        <span className="ml-1 text-xs font-medium text-blue-700">FK</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {column.type}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {column.nullable ? 'NULL' : 'NOT NULL'}
                      {column.defaultValue && ` DEFAULT ${column.defaultValue}`}
                    </td>
                  </tr>
                ))}
                {table.columns.length > 5 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-center text-sm text-gray-500">
                      + {table.columns.length - 5} autres colonnes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modèle Prisma proposé */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Modèle Prisma proposé</h4>
          <div className="bg-gray-50 rounded overflow-x-auto">
            <pre className="p-3 text-xs text-gray-800 overflow-x-auto">{generatePrismaModel()}</pre>
          </div>
        </div>
      </div>

      {/* Footer - Actions */}
      <div className="border-t px-4 py-3 flex justify-between items-center bg-gray-50">
        <div>
          <select
            className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={table.migrationStatus}
            onChange={(e) => onStatusChange(table.name, e.target.value)}
          >
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="blocked">Bloquée</option>
            <option value="skipped">Ignorée</option>
          </select>
        </div>
        <div>
          <Link
            to={`/dashboard/tables/${table.name}`}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Détails
          </Link>
        </div>
      </div>
    </div>
  );
}
