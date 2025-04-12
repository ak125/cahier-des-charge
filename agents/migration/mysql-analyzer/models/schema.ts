/**
 * schema.ts
 * 
 * Définit les interfaces et types pour représenter un schéma MySQL
 */

/**
 * Représente un schéma MySQL complet
 */
export interface MySQLSchema {
  name: string;
  tables: Record<string, TableInfo>;
  version?: string;
  characterSet?: string;
  collation?: string;
  metadata?: {
    extractionDate: string;
    totalTables: number;
    totalColumns: number;
    totalIndexes: number;
    totalForeignKeys: number;
    databaseSize?: number;
  };
  classificationStats?: Record<TableType, number>;
}

/**
 * Types de tables
 */
export enum TableType {
  BUSINESS_CORE = 'BUSINESS_CORE',       // Tables métier principales (entités fortes)
  BUSINESS_DETAIL = 'BUSINESS_DETAIL',   // Tables métier secondaires/détails
  TECHNICAL = 'TECHNICAL',               // Tables techniques (logs, audit, etc.)
  JUNCTION = 'JUNCTION',                 // Tables de jointure
  METADATA = 'METADATA',                 // Tables de métadonnées
  CONFIGURATION = 'CONFIGURATION',       // Tables de configuration/paramètres
  UNKNOWN = 'UNKNOWN'                    // Type non déterminé
}

/**
 * Représente une table dans le schéma MySQL
 */
export interface TableInfo {
  name: string;
  columns: Record<string, ColumnInfo>;
  primaryKey?: string[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  incomingForeignKeys?: ForeignKeyInfo[]; // Clés étrangères pointant vers cette table
  comment?: string;
  engine?: string;
  collation?: string;
  rowCount?: number;
  dataSize?: number;
  indexSize?: number;
  tableType: TableType; // Type de table (métier, technique, etc.)
  classificationReason?: string; // Raison de la classification
  businessValue?: number; // Score de valeur métier (1-10)
  technicalComplexity?: number; // Score de complexité technique (1-10)
  migrationPriority?: number; // Priorité pour la migration (1-10)
  dataQualityScore?: number; // Score de qualité des données (1-10)
  dataQualityIssues?: string[]; // Problèmes de qualité identifiés
}

/**
 * Représente une colonne dans une table
 */
export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isUnique: boolean;
  defaultValue?: string | null;
  comment?: string;
  extra?: string; // AUTO_INCREMENT, etc.
  length?: number;
  precision?: number;
  scale?: number;
}

/**
 * Représente un index dans une table
 */
export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  type?: string; // BTREE, HASH, etc.
}

/**
 * Représente une clé étrangère
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
 * Représente un problème de dette technique détecté
 */
export interface DebtIssue {
  type: string;
  tableName: string;
  columnName?: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation?: string;
  impact?: string;
}

/**
 * Statistiques globales du schéma
 */
export interface SchemaStats {
  totalTables: number;
  totalColumns: number;
  totalIndexes: number;
  totalForeignKeys: number;
  totalConstraints: number;
  tablesByType: {
    [key in TableType]: number;
  };
  columnsTypeDistribution: Record<string, number>;
  suggestedTypeConversions: Record<string, number>;
  tableStats: Record<string, TableStats>;
}

/**
 * Statistiques pour une table
 */
export interface TableStats {
  name: string;
  columnCount: number;
  indexCount: number;
  foreignKeyCount: number;
  primaryKeyColumns: string[];
  nullableColumnsCount: number;
  autoIncrementColumns: string[];
  hasSpecialUsage: boolean;
  specialUsageReason?: string;
}

/**
 * Représente un mapping vers un schéma Prisma
 */
export interface PrismaMapping {
  models: Record<string, PrismaModel>;
  enums: Record<string, PrismaEnum>;
  datasource: {
    provider: string;
    url: string;
  };
  generator: {
    provider: string;
  };
}

/**
 * Représente un modèle Prisma
 */
export interface PrismaModel {
  name: string;
  tableName: string;
  fields: Record<string, PrismaField>;
  documentation?: string;
}

/**
 * Représente un champ dans un modèle Prisma
 */
export interface PrismaField {
  name: string;
  type: string;
  optional?: boolean;
  list?: boolean;
  map?: string;
  default?: string;
  documentation?: string;
  relation?: {
    name?: string;
    fields?: string[];
    references?: string[];
    onDelete?: string;
    onUpdate?: string;
  };
}

/**
 * Représente un enum Prisma
 */
export interface PrismaEnum {
  name: string;
  values: string[];
  documentation?: string;
}

/**
 * Représente un résultat d'analyse de schéma
 */
export interface SchemaAnalysisResult {
  schema: MySQLSchema;
  businessCoreTables: string[];
  technicalTables: string[];
  junctionTables: string[];
  orphanedTables: string[]; // Tables sans relations
  cyclicDependencies: string[][]; // Cycles de dépendances
  dataQualityIssues: Record<string, string[]>; // Problèmes par table
  migrationComplexityScore: number; // Score global de complexité
  recommendations: string[]; // Recommandations pour la migration
}