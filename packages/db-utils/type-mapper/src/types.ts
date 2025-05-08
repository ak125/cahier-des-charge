/**
 * Types et interfaces pour la bibliothèque de mapping de types
 */

/**
 * Informations sur une table
 */
export interface Table {
  name: string;
  columns: Column[];
  primaryKey?: string[];
  foreignKeys?: ForeignKey[];
  indexes?: Index[];
  comment?: string;
}

/**
 * Informations sur une colonne
 */
export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string | null;
  autoIncrement?: boolean;
  comment?: string;
  extra?: string;
  primaryKey?: boolean;
}

/**
 * Informations sur une clé étrangère
 */
export interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onUpdate?: string;
  onDelete?: string;
}

/**
 * Informations sur un index
 */
export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
  type?: string;
}

/**
 * Configuration du mapping de types
 */
export interface TypeMappingConfig {
  mysqlSchemaPath?: string;
  outputJsonPath?: string;
  outputPrismaPath?: string;
  outputMarkdownPath?: string;
  databaseName?: string;
  databaseHost?: string;
  databasePort?: number;
  databaseUser?: string;
  databasePassword?: string;
}

/**
 * Résultat du mapping de types
 */
export interface TypeMappingResult {
  tables: TableMappingResult[];
  enums: EnumType[];
  errors: TypeMappingError[];
  warnings: TypeMappingWarning[];
  timestamp: string;
  version: string;
}

/**
 * Résultat du mapping pour une table
 */
export interface TableMappingResult {
  mysqlName: string;
  postgresName: string;
  prismaModel: string;
  columns: ColumnMappingResult[];
  primaryKey?: string[];
  foreignKeys?: ForeignKeyMappingResult[];
  indexes?: IndexMappingResult[];
  anomalies?: TypeAnomalies[];
}

/**
 * Résultat du mapping pour une colonne
 */
export interface ColumnMappingResult {
  mysqlName: string;
  mysqlType: string;
  postgresName: string;
  postgresType: string;
  prismaField: string;
  prismaType: string;
  defaultValue?: string;
  nullable: boolean;
  comment?: string;
}

/**
 * Résultat du mapping pour une clé étrangère
 */
export interface ForeignKeyMappingResult {
  mysqlName: string;
  postgresName: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onUpdate?: string;
  onDelete?: string;
}

/**
 * Résultat du mapping pour un index
 */
export interface IndexMappingResult {
  mysqlName: string;
  postgresName: string;
  columns: string[];
  unique: boolean;
  type?: string;
}

/**
 * Type d'énumération
 */
export interface EnumType {
  name: string;
  values: string[];
  originalColumn?: {
    table: string;
    column: string;
    type: string;
  };
}

/**
 * Anomalie de type détectée
 */
export interface TypeAnomalies {
  type: 'enum' | 'set' | 'unsigned' | 'size' | 'precision' | 'other';
  table: string;
  column: string;
  mysqlType: string;
  issue: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Erreur de mapping
 */
export interface TypeMappingError {
  message: string;
  table?: string;
  column?: string;
  type?: string;
  context?: any;
}

/**
 * Avertissement de mapping
 */
export interface TypeMappingWarning {
  message: string;
  table?: string;
  column?: string;
  type?: string;
  context?: any;
}

/**
 * Informations sur le type et la taille
 */
export interface TypeSizeInfo {
  baseType: string;
  size?: number;
  precision?: number;
  scale?: number;
  values?: string[];
}

/**
 * Détails du mapping de type
 */
export interface TypeMappingDetail {
  postgres: string;
  prisma: string;
  warning?: string;
  suggestion?: string;
}

/**
 * Type de sortie
 */
export enum OutputFormat {
  JSON = 'json',
  PRISMA = 'prisma',
  MARKDOWN = 'markdown',
  CONSOLE = 'console'
}

/**
 * Options pour le générateur de schéma Prisma
 */
export interface PrismaSchemaOptions {
  datasourceProvider?: 'postgresql' | 'mysql';
  datasourceUrl?: string;
  useEnumTypes?: boolean;
  mapTableNames?: boolean;
  includeComments?: boolean;
  relationFieldNames?: Record<string, string>;
}

/**
 * Options pour le générateur de documentation Markdown
 */
export interface MarkdownDocOptions {
  includeTypeMapping?: boolean;
  includeAnomalies?: boolean;
  includeColumnDetails?: boolean;
  includeRelations?: boolean;
}