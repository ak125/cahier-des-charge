/**
 * Types générés pour la base de données Supabase
 * Ces types correspondent aux tables de votre base Supabase
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: number
          created_at: string
          file_name: string
          module: string | null
          agent: string
          status: 'pending' | 'running' | 'done' | 'error'
          audit_json: Json
          updated_at: string | null
          error_message: string | null
          duration_ms: number | null
          version: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          file_name: string
          module?: string | null
          agent: string
          status?: 'pending' | 'running' | 'done' | 'error'
          audit_json: Json
          updated_at?: string | null
          error_message?: string | null
          duration_ms?: number | null
          version?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          file_name?: string
          module?: string | null
          agent?: string
          status?: 'pending' | 'running' | 'done' | 'error'
          audit_json?: Json
          updated_at?: string | null
          error_message?: string | null
          duration_ms?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_file_name_fkey"
            columns: ["file_name"]
            referencedRelation: "file_mappings"
            referencedColumns: ["file_path"]
          }
        ]
      }
      file_mappings: {
        Row: {
          id: number
          created_at: string
          file_path: string
          php_file: string | null
          js_file: string | null
          status: 'pending' | 'mapped' | 'analyzed' | 'migrated' | 'error'
          module: string | null
          category: 'controller' | 'model' | 'view' | 'helper' | 'api' | 'other' | null
          updated_at: string | null
          migration_priority: number | null
          description: string | null
          lines_of_code: number | null
          complexity: number | null
        }
        Insert: {
          id?: number
          created_at?: string
          file_path: string
          php_file?: string | null
          js_file?: string | null
          status?: 'pending' | 'mapped' | 'analyzed' | 'migrated' | 'error'
          module?: string | null
          category?: 'controller' | 'model' | 'view' | 'helper' | 'api' | 'other' | null
          updated_at?: string | null
          migration_priority?: number | null
          description?: string | null
          lines_of_code?: number | null
          complexity?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          file_path?: string
          php_file?: string | null
          js_file?: string | null
          status?: 'pending' | 'mapped' | 'analyzed' | 'migrated' | 'error'
          module?: string | null
          category?: 'controller' | 'model' | 'view' | 'helper' | 'api' | 'other' | null
          updated_at?: string | null
          migration_priority?: number | null
          description?: string | null
          lines_of_code?: number | null
          complexity?: number | null
        }
        Relationships: []
      }
      migration_tasks: {
        Row: {
          id: number
          created_at: string
          file_id: number
          status: 'pending' | 'in_progress' | 'completed' | 'failed'
          task_type: 'php_to_js' | 'php_to_ts' | 'mysql_to_postgres' | 'other'
          priority: number
          assigned_to: string | null
          completed_at: string | null
          notes: string | null
          updated_at: string | null
          estimated_hours: number | null
          actual_hours: number | null
          conversion_quality: number | null
        }
        Insert: {
          id?: number
          created_at?: string
          file_id: number
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          task_type?: 'php_to_js' | 'php_to_ts' | 'mysql_to_postgres' | 'other'
          priority?: number
          assigned_to?: string | null
          completed_at?: string | null
          notes?: string | null
          updated_at?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          conversion_quality?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          file_id?: number
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          task_type?: 'php_to_js' | 'php_to_ts' | 'mysql_to_postgres' | 'other'
          priority?: number
          assigned_to?: string | null
          completed_at?: string | null
          notes?: string | null
          updated_at?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          conversion_quality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "migration_tasks_file_id_fkey"
            columns: ["file_id"]
            referencedRelation: "file_mappings"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_runs: {
        Row: {
          id: number
          created_at: string
          agent_name: string
          status: 'started' | 'completed' | 'failed'
          input_params: Json
          output_result: Json | null
          duration_ms: number | null
          error_message: string | null
          workspace_id: string | null
          pipeline_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          agent_name: string
          status?: 'started' | 'completed' | 'failed'
          input_params: Json
          output_result?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          workspace_id?: string | null
          pipeline_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          agent_name?: string
          status?: 'started' | 'completed' | 'failed'
          input_params?: Json
          output_result?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          workspace_id?: string | null
          pipeline_id?: string | null
        }
        Relationships: []
      }
      sql_migrations: {
        Row: {
          id: number
          created_at: string
          table_name: string
          source_db: string
          target_db: string
          migration_sql: string
          status: 'pending' | 'applied' | 'failed'
          applied_at: string | null
          error_message: string | null
          version: string
          checksum: string
          migration_type: 'schema' | 'data' | 'index' | 'constraint' | 'other'
        }
        Insert: {
          id?: number
          created_at?: string
          table_name: string
          source_db: string
          target_db: string
          migration_sql: string
          status?: 'pending' | 'applied' | 'failed'
          applied_at?: string | null
          error_message?: string | null
          version: string
          checksum: string
          migration_type?: 'schema' | 'data' | 'index' | 'constraint' | 'other'
        }
        Update: {
          id?: number
          created_at?: string
          table_name?: string
          source_db?: string
          target_db?: string
          migration_sql?: string
          status?: 'pending' | 'applied' | 'failed'
          applied_at?: string | null
          error_message?: string | null
          version?: string
          checksum?: string
          migration_type?: 'schema' | 'data' | 'index' | 'constraint' | 'other'
        }
        Relationships: []
      }
     DoDotmcp_events: {
        Row: {
          id: number
          created_at: string
          event_type: string
          payload: Json
          source: string
          status: 'received' | 'processing' | 'completed' | 'failed'
          processed_at: string | null
          error_message: string | null
          priority: number
        }
        Insert: {
          id?: number
          created_at?: string
          event_type: string
          payload: Json
          source: string
          status?: 'received' | 'processing' | 'completed' | 'failed'
          processed_at?: string | null
          error_message?: string | null
          priority?: number
        }
        Update: {
          id?: number
          created_at?: string
          event_type?: string
          payload?: Json
          source?: string
          status?: 'received' | 'processing' | 'completed' | 'failed'
          processed_at?: string | null
          error_message?: string | null
          priority?: number
        }
        Relationships: []
      }
    }
    Views: {
      audit_summary: {
        Row: {
          module: string | null
          total_files: number
          analyzed_files: number
          pending_files: number
          error_files: number
          last_updated: string | null
        }
        Relationships: []
      }
      migration_progress: {
        Row: {
          task_type: string
          total_tasks: number
          completed_tasks: number
          pending_tasks: number
          failed_tasks: number
          completion_percentage: number
        }
        Relationships: []
      }
    }
    Functions: {
      notify_agent_completed: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      notify_audit_completed: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      task_status: 'pending' | 'in_progress' | 'completed' | 'failed'
      file_status: 'pending' | 'mapped' | 'analyzed' | 'migrated' | 'error'
      audit_status: 'pending' | 'running' | 'done' | 'error'
    }
  }
}