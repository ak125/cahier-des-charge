/**
 * Types pour le serveur MCP MySQL
 */

// Carte du schéma MySQL
export interface SchemaMap {
  name: string;
  timestamp: string;
  tables: Record<string, TableInfo>;
  foreignKeys: ForeignKeyInfo[];
}

// Informations sur une table
export interface TableInfo {
  name: string;
  database?: string;
  columns: Record<string, ColumnInfo>;
  primaryKey?: string[];
  indexes: IndexInfo[];
  comment?: string;
  engine?: string;
  collation?: string;
  autoIncrement?: number;
}

// Informations sur une colonne
export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  defaultValue?: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
  charset?: string;
  collation?: string;
  enumValues?: string[];
  comment?: string;
}

// Informations sur un index
export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string;
  comment?: string;
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
  type: 'table_added' | 'table_removed' | 'column_added' | 'column_removed' | 
        'column_type_changed' | 'column_constraint_changed' | 'index_added' | 
        'index_removed' | 'foreign_key_added' | 'foreign_key_removed';
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

// Qualité du schéma
export interface SchemaQualityCheck {
  timestamp: string;
  databaseName: string;
  issues: SchemaQualityIssue[];
  statistics: {
    total: number;
    byLevel: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    byType: Record<string, number>;
  };
  suggestions: string[];
}

// Problème de qualité du schéma
export interface SchemaQualityIssue {
  type: string;
  level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  tableName: string;
  columnName?: string;
  description: string;
  suggestion?: string;
}

// Classification des entités
export interface EntityClassification {
  modules: EntityModule[];
  unclassified: string[];
}

// Module d'entités
export interface EntityModule {
  name: string;
  description: string;
  tables: string[];
  relations: EntityRelation[];
}

// Relation entre entités
export interface EntityRelation {
  source: string;
  target: string;
  type: '1:1' | '1:n' | 'n:1' | 'n:m';
}

// Optimisation des types pour PostgreSQL
export interface TypeOptimization {
  original: {
    mysqlType: string;
    description: string;
  };
  optimized: {
    postgresType: string;
    prismaType: string;
    description: string;
  };
  considerations: string[];
}

// Mappage MySQL vers Prisma
export interface MySQLToPrismaMap {
  types: Record<string, string>;
  defaultMappings: Record<string, any>;
  constraintMappings: Record<string, string>;
  specialCases: Record<string, string>;
}

// Configuration du serveur MCP
export interface MCPServerConfig {
  port: number;
  host: string;
  connectionString: string;
  verbose: boolean;
  allowedOrigins?: string[];
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
  includeProcs?: boolean;
  includeStats?: boolean;
  includeIndexes?: boolean;
  includeForeignKeys?: boolean;
  includeEngineInfo?: boolean;
  includeComments?: boolean;
  tableFilter?: (tableName: string) => boolean;
}