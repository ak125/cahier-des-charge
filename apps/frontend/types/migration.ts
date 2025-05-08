/**
 * Types pour la migration SQL vers Prisma/PostgreSQL
 */

// Structure de table SQL
export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  defaultValue?: string;
  extra?: string;
}

export interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
}

export interface Table {
  name: string;
  category: string;
  columns: Column[];
  primaryKey: string[];
  foreignKeys: ForeignKey[];
}

export interface SchemaMap {
  tables: Record<string, Table>;
  version: string;
  generatedAt: string;
}

// Statut de migration
export interface TaskStatus {
  status: string; // 'pending' | 'blocked' | 'in_progress' | 'migrated' | 'validated' | 'ignored'
  progress: number;
  assignedTo?: string;
  lastUpdated: string;
  notes?: string;
}

// Relations entre tables
export interface Relation {
  source: string;
  target: string;
  type: string; // 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany'
}

export interface RelationGraph {
  relations: Relation[];
  version: string;
  generatedAt: string;
}

// Dette technique
export interface DebtMetric {
  name: string;
  value: number;
  description: string;
}

export interface DebtData {
  score: number;
  metrics: DebtMetric[];
  suggestions: string[];
}

// Mapping de types SQL vers Prisma
export interface TypeMapping {
  sqlType: string;
  prismaType: string;
  postgresType: string;
  notes?: string;
}

// Configuration du dashboard
export interface DashboardConfig {
  categories: {
    id: string;
    name: string;
    color: string;
  }[];
  statuses: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }[];
  debtLevels: {
    id: string;
    name: string;
    minScore: number;
    maxScore: number;
    color: string;
  }[];
  layout: {
    showRelationGraph: boolean;
    showDebtRadar: boolean;
    tableCardLayout: 'grid' | 'list';
  };
}
