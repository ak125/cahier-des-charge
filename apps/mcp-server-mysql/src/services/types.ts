/**
 * Types pour le serveur MCP MySQL
 * Définitions de types pour l'analyse de structure MySQL et la migration vers PostgreSQL
 */

/**
 * Information sur une table
 */
export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey?: string[];
  relations?: RelationInfo[];
  indexes?: IndexInfo[];
  comment?: string;
  engine?: string;
  collation?: string;
}

/**
 * Information sur une colonne
 */
export interface ColumnInfo {
  name: string;
  type: string;
  pgType?: string;  // Type PostgreSQL correspondant
  prismaType?: string; // Type Prisma correspondant
  nullable: boolean;
  default?: string;
  comment?: string;
  autoIncrement?: boolean;
  unsigned?: boolean;
  enum?: string[];
  enumName?: string;
  unique?: boolean;
}

/**
 * Information sur une relation (clé étrangère)
 */
export interface RelationInfo {
  name?: string;
  field: string;
  target: string;
  targetField: string;
  type: RelationType;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
}

/**
 * Type de relation
 */
export type RelationType = '1:1' | '1:n' | 'n:1' | 'n:m';

/**
 * Information sur un index
 */
export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type?: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL';
}

/**
 * Information sur une clé étrangère
 */
export interface ForeignKeyInfo {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

/**
 * Résultat de la migration
 */
export interface MigrationResult {
  schemaName: string;
  timestamp: string;
  tables: {
    total: number;
    migrated: number;
    skipped: number;
    error: number;
  };
  relations: {
    total: number;
    migrated: number;
    inferred: number;
    error: number;
  };
  prismaModels: string[];
  errorMessages: string[];
  warningMessages: string[];
  executionTimeMs: number;
}