/**
 * supabaseClient.ts
 * 
 * Client Supabase partagé pour les agents MCP.
 * Ce module fournit une interface commune pour interagir avec la base de données Supabase.
 * Il est utilisé par tous les agents pour stocker et récupérer des données d'analyse.
 */

import { createClient } from @supabase/supabase-jsstructure-agent';
import { Database } from ./typesstructure-agent'; // Typages générés par Supabase CLI (à générer séparément)
import * as dotenv from dotenvstructure-agent';
import * as path from pathstructure-agent';
import * as fs from fsstructure-agent';

// Chargement des variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Vérification des variables d'environnement requises
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('⚠️ Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies');
  process.exit(1);
}

/**
 * Client Supabase partagé pour tous les agents MCP
 * 
 * Ce client utilise la clé de service pour avoir des droits complets sur la base
 * À utiliser uniquement dans les agents et services backend, jamais côté client.
 */
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Crée un client Supabase avec la clé d'API publique
 * À utiliser pour les clients frontend avec authentification utilisateur
 */
export function createSupabaseClient(supabaseUrl?: string, supabaseKey?: string) {
  const url = supabaseUrl || process.env.SUPABASE_URL;
  const key = supabaseKey || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('URL Supabase et clé anonyme requises');
  }
  
  return createClient<Database>(url, key);
}

/**
 * Utilitaire pour vérifier que la connexion Supabase fonctionne
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('audit_logs').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion à Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Connexion à Supabase établie avec succès');
    return true;
  } catch (err) {
    console.error('❌ Erreur lors de la vérification de la connexion Supabase:', err);
    return false;
  }
}

export default supabase;

// Types pour les tables Supabase
export interface AuditLog {
  id?: number;
  created_at?: string;
  file_name: string;
  module: string;
  agent: string;
  status: 'pending' | 'running' | 'done' | 'error';
  audit_json: any;
}

export interface FileMapping {
  id?: number;
  created_at?: string;
  php_file: string;
  typescript_file?: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'migrated' | 'error';
  migration_data?: any;
}

export interface CodeSuggestion {
  id?: number;
  created_at?: string;
  file_name: string;
  original_code: string;
  suggested_code: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  score: number;
  user_feedback?: string;
}

export interface MigrationJob {
  id?: number;
  created_at?: string;
  job_name: string;
  source_path: string;
  target_path: string;
  status: 'pending' | 'running' | 'done' | 'error';
  progress: number;
  files_total: number;
  files_processed: number;
  files_error: number;
  config_json: any;
}

/**
 * Classe d'aide pour interagir avec les tables Supabase
 */
export class SupabaseHelper {
  /**
   * Crée un log d'audit
   * @param auditLog Données du log d'audit
   * @returns ID du log créé
   */
  static async createAuditLog(auditLog: AuditLog): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert(auditLog)
        .select('id')
        .single();
      
      if (error) {
        console.error('Erreur lors de la création du log d\'audit:', error.message);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Exception lors de la création du log d\'audit:', error.message);
      return null;
    }
  }
  
  /**
   * Met à jour un log d'audit
   * @param id ID du log
   * @param updates Mises à jour
   * @returns true si la mise à jour a réussi
   */
  static async updateAuditLog(id: number, updates: Partial<AuditLog>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors de la mise à jour du log d\'audit:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors de la mise à jour du log d\'audit:', error.message);
      return false;
    }
  }
  
  /**
   * Récupère un log d'audit par ID
   * @param id ID du log
   * @returns Log d'audit
   */
  static async getAuditLog(id: number): Promise<AuditLog | null> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erreur lors de la récupération du log d\'audit:', error.message);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception lors de la récupération du log d\'audit:', error.message);
      return null;
    }
  }
  
  /**
   * Récupère les logs d'audit pour un fichier
   * @param fileName Nom du fichier
   * @returns Logs d'audit
   */
  static async getAuditLogsForFile(fileName: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('file_name', fileName)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des logs d\'audit pour le fichier:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des logs d\'audit pour le fichier:', error.message);
      return [];
    }
  }
  
  /**
   * Crée un mapping de fichier
   * @param fileMapping Données du mapping
   * @returns ID du mapping créé
   */
  static async createFileMapping(fileMapping: FileMapping): Promise<number | null> {
    try {
      // Vérifier si un mapping existe déjà pour ce fichier
      const { data: existingMapping } = await supabase
        .from('file_mappings')
        .select('id')
        .eq('php_file', fileMapping.php_file)
        .single();
      
      if (existingMapping) {
        // Mettre à jour le mapping existant
        const { error } = await supabase
          .from('file_mappings')
          .update(fileMapping)
          .eq('id', existingMapping.id);
        
        if (error) {
          console.error('Erreur lors de la mise à jour du mapping:', error.message);
          return null;
        }
        
        return existingMapping.id;
      } else {
        // Créer un nouveau mapping
        const { data, error } = await supabase
          .from('file_mappings')
          .insert(fileMapping)
          .select('id')
          .single();
        
        if (error) {
          console.error('Erreur lors de la création du mapping:', error.message);
          return null;
        }
        
        return data.id;
      }
    } catch (error) {
      console.error('Exception lors de la création/mise à jour du mapping:', error.message);
      return null;
    }
  }
  
  /**
   * Met à jour un mapping de fichier
   * @param id ID du mapping
   * @param updates Mises à jour
   * @returns true si la mise à jour a réussi
   */
  static async updateFileMapping(id: number, updates: Partial<FileMapping>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('file_mappings')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors de la mise à jour du mapping:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors de la mise à jour du mapping:', error.message);
      return false;
    }
  }
  
  /**
   * Récupère un mapping par chemin de fichier PHP
   * @param phpFilePath Chemin du fichier PHP
   * @returns Mapping de fichier
   */
  static async getFileMappingByPhpFile(phpFilePath: string): Promise<FileMapping | null> {
    try {
      const { data, error } = await supabase
        .from('file_mappings')
        .select('*')
        .eq('php_file', phpFilePath)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Code pour "aucun résultat"
          console.error('Erreur lors de la récupération du mapping:', error.message);
        }
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception lors de la récupération du mapping:', error.message);
      return null;
    }
  }
  
  /**
   * Crée une suggestion de code
   * @param suggestion Données de la suggestion
   * @returns ID de la suggestion créée
   */
  static async createCodeSuggestion(suggestion: CodeSuggestion): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('code_suggestions')
        .insert(suggestion)
        .select('id')
        .single();
      
      if (error) {
        console.error('Erreur lors de la création de la suggestion:', error.message);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Exception lors de la création de la suggestion:', error.message);
      return null;
    }
  }
  
  /**
   * Met à jour une suggestion de code
   * @param id ID de la suggestion
   * @param updates Mises à jour
   * @returns true si la mise à jour a réussi
   */
  static async updateCodeSuggestion(id: number, updates: Partial<CodeSuggestion>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('code_suggestions')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors de la mise à jour de la suggestion:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors de la mise à jour de la suggestion:', error.message);
      return false;
    }
  }
  
  /**
   * Récupère les suggestions de code pour un fichier
   * @param fileName Nom du fichier
   * @returns Suggestions de code
   */
  static async getCodeSuggestionsForFile(fileName: string): Promise<CodeSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('code_suggestions')
        .select('*')
        .eq('file_name', fileName)
        .order('score', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des suggestions:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des suggestions:', error.message);
      return [];
    }
  }
  
  /**
   * Crée un job de migration
   * @param job Données du job
   * @returns ID du job créé
   */
  static async createMigrationJob(job: MigrationJob): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('migration_jobs')
        .insert(job)
        .select('id')
        .single();
      
      if (error) {
        console.error('Erreur lors de la création du job:', error.message);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Exception lors de la création du job:', error.message);
      return null;
    }
  }
  
  /**
   * Met à jour un job de migration
   * @param id ID du job
   * @param updates Mises à jour
   * @returns true si la mise à jour a réussi
   */
  static async updateMigrationJob(id: number, updates: Partial<MigrationJob>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('migration_jobs')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors de la mise à jour du job:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors de la mise à jour du job:', error.message);
      return false;
    }
  }
  
  /**
   * Récupère un job de migration
   * @param id ID du job
   * @returns Job de migration
   */
  static async getMigrationJob(id: number): Promise<MigrationJob | null> {
    try {
      const { data, error } = await supabase
        .from('migration_jobs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erreur lors de la récupération du job:', error.message);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception lors de la récupération du job:', error.message);
      return null;
    }
  }
  
  /**
   * Récupère tous les jobs de migration
   * @returns Jobs de migration
   */
  static async getAllMigrationJobs(): Promise<MigrationJob[]> {
    try {
      const { data, error } = await supabase
        .from('migration_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des jobs:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des jobs:', error.message);
      return [];
    }
  }
}