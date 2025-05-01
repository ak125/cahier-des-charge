/**
 * SupabaseOptimizationTracker.ts
 * Module d'intégration pour envoyer les résultats d'analyse à Supabase
 * Agent 8 - Optimiseur SQL & Performances Prisma/PostgreSQL
 * Date: 12 avril 2025
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


export interface OptimizationRunSummary {
  runId: string;
  databaseName: string;
  totalTables: number;
  tablesWithIssues: number;
  optimizationScore: number;
  indexRecommendationsCount: number;
  typeIssuesCount: number;
  partitionRecommendationsCount: number;
  slowQueriesCount: number;
  reportPath?: string;
  runBy?: string;
}

export interface TablePerformanceData {
  runId: string;
  tableSchema: string;
  tableName: string;
  rowCount?: number;
  totalSizeMb?: number;
  indexSizeMb?: number;
  seqScanRate?: number;
  avgQueryTimeMs?: number;
  bloatPercent?: number;
  cacheHitRatio?: number;
  indexUsageRatio?: number;
  optimizationScore?: number;
  partitionStatus?: string;
}

export interface DetectedIssue {
  runId: string;
  tableSchema: string;
  tableName: string;
  issueType: string;
  issueDescription: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedFix?: string;
}

export interface IndexRecommendation {
  runId: string;
  tableSchema: string;
  tableName: string;
  indexName: string;
  indexColumns: string[];
  indexType: 'BTREE' | 'GIN' | 'GIST' | 'HASH' | 'BRIN' | 'SPGIST' | 'GiST';
  benefitDescription?: string;
  estimatedImprovement?: number;
}

export interface PartitionRecommendation {
  runId: string;
  tableSchema: string;
  tableName: string;
  partitionStrategy: 'RANGE' | 'LIST' | 'HASH';
  partitionKey: string;
  partitionInterval?: string;
  justification?: string;
}

export class SupabaseOptimizationTracker implements BaseAgent, BusinessAgent {
  private supabase: SupabaseClient;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  /**
   * Enregistre une nouvelle analyse d'optimisation
   */
  async recordOptimizationRun(summary: OptimizationRunSummary): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('sql_optimization_history')
      .insert({
        run_id: summary.runId,
        database_name: summary.databaseName,
        total_tables: summary.totalTables,
        tables_with_issues: summary.tablesWithIssues,
        optimization_score: summary.optimizationScore,
        index_recommendations_count: summary.indexRecommendationsCount,
        type_issues_count: summary.typeIssuesCount,
        partition_recommendations_count: summary.partitionRecommendationsCount,
        slow_queries_count: summary.slowQueriesCount,
        report_path: summary.reportPath,
        run_by: summary.runBy
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Erreur lors de l\'enregistrement de l\'analyse:', error);
      return null;
    }
    
    return data?.id;
  }
  
  /**
   * Enregistre les données de performance des tables
   */
  async recordTablePerformance(tableData: TablePerformanceData[]): Promise<boolean> {
    const { error } = await this.supabase
      .from('sql_table_performance')
      .insert(tableData.map(table => ({
        run_id: table.runId,
        table_schema: table.tableSchema,
        table_name: table.tableName,
        row_count: table.rowCount,
        total_size_mb: table.totalSizeMb,
        index_size_mb: table.indexSizeMb,
        seq_scan_rate: table.seqScanRate,
        avg_query_time_ms: table.avgQueryTimeMs,
        bloat_percent: table.bloatPercent,
        cache_hit_ratio: table.cacheHitRatio,
        index_usage_ratio: table.indexUsageRatio,
        optimization_score: table.optimizationScore,
        partition_status: table.partitionStatus
      })));
    
    if (error) {
      console.error('Erreur lors de l\'enregistrement des performances de tables:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Enregistre les problèmes détectés
   */
  async recordDetectedIssues(issues: DetectedIssue[]): Promise<boolean> {
    const { error } = await this.supabase
      .from('sql_detected_issues')
      .insert(issues.map(issue => ({
        run_id: issue.runId,
        table_schema: issue.tableSchema,
        table_name: issue.tableName,
        issue_type: issue.issueType,
        issue_description: issue.issueDescription,
        severity: issue.severity,
        suggested_fix: issue.suggestedFix
      })));
    
    if (error) {
      console.error('Erreur lors de l\'enregistrement des problèmes:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Enregistre les recommandations d'index
   */
  async recordIndexRecommendations(recommendations: IndexRecommendation[]): Promise<boolean> {
    const { error } = await this.supabase
      .from('sql_index_recommendations')
      .insert(recommendations.map(rec => ({
        run_id: rec.runId,
        table_schema: rec.tableSchema,
        table_name: rec.tableName,
        index_name: rec.indexName,
        index_columns: rec.indexColumns,
        index_type: rec.indexType,
        benefit_description: rec.benefitDescription,
        estimated_improvement: rec.estimatedImprovement
      })));
    
    if (error) {
      console.error('Erreur lors de l\'enregistrement des recommandations d\'index:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Enregistre les recommandations de partitionnement
   */
  async recordPartitionRecommendations(recommendations: PartitionRecommendation[]): Promise<boolean> {
    const { error } = await this.supabase
      .from('sql_partition_recommendations')
      .insert(recommendations.map(rec => ({
        run_id: rec.runId,
        table_schema: rec.tableSchema,
        table_name: rec.tableName,
        partition_strategy: rec.partitionStrategy,
        partition_key: rec.partitionKey,
        partition_interval: rec.partitionInterval,
        justification: rec.justification
      })));
    
    if (error) {
      console.error('Erreur lors de l\'enregistrement des recommandations de partitionnement:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Marque un index comme appliqué
   */
  async markIndexApplied(indexId: string, appliedBy?: string): Promise<boolean> {
    const { error } = await this.supabase.rpc('mark_index_applied', {
      p_index_id: indexId,
      p_applied_by: appliedBy
    });
    
    if (error) {
      console.error('Erreur lors du marquage de l\'index comme appliqué:', error);
      return false;
    }
    
    return true;

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }
  }
  
  /**
   * Marque un partitionnement comme appliqué
   */
  async markPartitionApplied(partitionId: string, appliedBy?: string): Promise<boolean> {
    const { error } = await this.supabase.rpc('mark_partition_applied', {
      p_partition_id: partitionId,
      p_applied_by: appliedBy
    });
    
    if (error) {
      console.error('Erreur lors du marquage du partitionnement comme appliqué:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Marque un problème comme résolu
   */
  async markIssueFixed(issueId: string, fixNotes?: string, fixedBy?: string): Promise<boolean> {
    const { error } = await this.supabase.rpc('mark_issue_fixed', {
      p_issue_id: issueId,
      p_fix_notes: fixNotes,
      p_fixed_by: fixedBy
    });
    
    if (error) {
      console.error('Erreur lors du marquage du problème comme résolu:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Récupère les dernières analyses d'optimisation
   */
  async getOptimizationHistory(limit = 10): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('sql_optimization_history')
      .select('*')
      .order('run_date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Récupère l'évolution du score d'optimisation
   */
  async getOptimizationProgress(databaseName?: string): Promise<any[]> {
    let query = this.supabase
      .from('optimization_progress')
      .select('*')
      .order('date', { ascending: true });
    
    if (databaseName) {
      query = query.eq('database_name', databaseName);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération du progrès:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Récupère les recommandations non appliquées
   */
  async getPendingRecommendations(): Promise<{ indexes: any[], partitions: any[] }> {
    const [indexData, partitionData] = await Promise.all([
      this.supabase
        .from('sql_index_recommendations')
        .select('*')
        .eq('is_applied', false)
        .order('estimated_improvement', { ascending: false }),
      
      this.supabase
        .from('sql_partition_recommendations')
        .select('*')
        .eq('is_applied', false)
    ]);
    
    return {
      indexes: indexData.data || [],
      partitions: partitionData.data || []
    };
  }
}