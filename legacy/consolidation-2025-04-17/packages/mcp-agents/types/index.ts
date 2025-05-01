/**
 * Types partagés pour le système MCP (Model Context Protocol)
 */

/**
 * Configuration de migration
 */
export interface MigrationConfig {
  sourceDir: string;
  destinationDir: string;
  includePatterns: string[];
  excludePatterns: string[];
  options: {
    generatePrismaModels: boolean;
    preserveSeo: boolean;
    generateTests: boolean;
    verbose: boolean;
  };
}

/**
 * Résultat d'analyse d'un fichier PHP
 */
export interface PhpAnalysisResult {
  fileName: string;
  phpBlocks: string[];
  htmlContent: string;
  variables: PhpVariable[];
  sqlQueries: SqlQuery[];
  functions: PhpFunction[];
  routes: Record<string, string>;
  includes: string[];
  dbConfig: Record<string, string> | null;
  transactions: any[];
  seoMetadata: Record<string, string>;
  htmlStructure: Record<string, any>;
}

/**
 * Variable PHP détectée
 */
export interface PhpVariable {
  name: string;
  value: string;
  type: string;
}

/**
 * Requête SQL détectée
 */
export interface SqlQuery {
  query: string;
  type: string;
  tables: string[];
  parameters: Record<string, string>;
}

/**
 * Fonction PHP détectée
 */
export interface PhpFunction {
  name: string;
  params: string[];
  body: string;
}

/**
 * Résultat d'un agent MCP
 */
export interface AgentResult {
  success: boolean;
  sourceFile: string;
  generatedFiles?: string[];
  auditReport?: {
    path: string;
    content: string;
  };
  error?: string;
}

/**
 * Structure de données extraite
 */
export interface DataStructure {
  name: string;
  tableName: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  relations: Array<{
    name: string;
    targetTable: string;
    type: 'oneToOne' | 'oneToMany' | 'manyToMany';
    joinColumn?: string;
  }>;
}

/**
 * Métadonnées SEO extraites
 */
export interface SeoMetadata {
  title: string;
  description: string;
  canonical?: string;
  openGraph: Record<string, string>;
  structuredData?: any;
}

/**
 * Configuration pour le pipeline MCP
 */
export interface McpPipelineConfig {
  webhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  agents: string[];
  notificationChannels: string[];
  dryRun: boolean;
}
