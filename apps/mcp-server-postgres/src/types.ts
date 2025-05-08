/**
 * Types pour le serveur MCP PostgreSQL
 */

// Carte du schéma
export interface SchemaMap {
  name: string;
  timestamp: string;
  tables: Record<string, TableInfo>;
  foreignKeys: ForeignKeyInfo[];
}

// Informations sur une table
export interface TableInfo {
  name: string;
  schema?: string;
  columns: Record<string, ColumnInfo>;
  primaryKey?: string[];
  indexes: IndexInfo[];
}

// Informations sur une colonne
export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isUnique: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
  defaultValue?: string;
}

// Informations sur un index
export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string;
}

// Informations sur une clé étrangère
export interface ForeignKeyInfo {
  name: string;
  sourceTable: string;
  sourceColumns: string[];
  targetTable: string;
  targetColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

// Informations sur une relation
export interface RelationInfo {
  name?: string;
  type: '1:1' | '1:n' | 'n:1' | 'n:m';
  sourceTable: string;
  sourceColumns: string[];
  targetTable: string;
  targetColumns: string[];
  joinTable?: string;
}

// Différence entre deux schémas
export interface SchemaDiff {
  timestamp: string;
  sourceName?: string;
  targetName?: string;
  changes: SchemaDiffChange[];
  statistics: {
    total: number;
    tables: {
      added: number;
      removed: number;
      modified: number;
    };
    columns: {
      added: number;
      removed: number;
      typeChanged: number;
      constraintChanged: number;
    };
    indexes: {
      added: number;
      removed: number;
    };
    foreignKeys: {
      added: number;
      removed: number;
    };
  };
}

// Changement dans un schéma
export interface SchemaDiffChange {
  type:
    | 'table_added'
    | 'table_removed'
    | 'column_added'
    | 'column_removed'
    | 'column_type_changed'
    | 'column_constraint_changed'
    | 'index_added'
    | 'index_removed'
    | 'foreign_key_added'
    | 'foreign_key_removed';
  tableName: string;
  columnName?: string;
  indexName?: string;
  foreignKeyName?: string;
  oldValue?: any;
  newValue?: any;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

// Modèle Prisma
export interface PrismaModel {
  name: string;
  tableName: string;
  fields: PrismaField[];
  schema: string;
}

// Champ Prisma
export interface PrismaField {
  name: string;
  type: string;
  list?: boolean;
  required?: boolean;
  unique?: boolean;
  id?: boolean;
  default?: string;
  relation?: {
    name?: string;
    fields?: string[];
    references?: string[];
  };
  map?: string;
}

// Type pour les suggestions d'index
export interface IndexSuggestion {
  tableName: string;
  columns: string[];
  reason: string;
}

// Type pour les résultats de comparaison de schéma
export interface SchemaComparisonResult {
  databaseA: string;
  databaseB: string;
  timestamp: string;
  addedTables: string[];
  removedTables: string[];
  modifiedTables: {
    tableName: string;
    addedColumns: string[];
    removedColumns: string[];
    modifiedColumns: {
      columnName: string;
      changes: string[];
    }[];
    addedIndexes: string[];
    removedIndexes: string[];
    modifiedIndexes: {
      indexName: string;
      changes: string[];
    }[];
  }[];
  addedForeignKeys: {
    name: string;
    sourceTable: string;
    targetTable: string;
  }[];
  removedForeignKeys: {
    name: string;
    sourceTable: string;
    targetTable: string;
  }[];
}

// Configuration du serveur MCP
export interface MCPServerConfig {
  port: number;
  host: string;
  connectionString: string;
  verbose: boolean;
  allowedOrigins?: string[];
}

// Options pour la génération de modèle Prisma
export interface PrismaModelOptions {
  includeForeignKeys: boolean;
  includeIndexes: boolean;
  includeDefaults: boolean;
  includeComments: boolean;
}

// Résultat d'une requête MCP
export interface MCPResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    duration?: number;
    tool?: string;
    params?: any;
    [key: string]: any;
  };
}

// Options pour l'exportation du schéma
export interface SchemaExportOptions {
  includeViews?: boolean;
  includeStats?: boolean;
  includeIndexes?: boolean;
  includeForeignKeys?: boolean;
  tableFilter?: (tableName: string) => boolean;
}
