import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

// Vérifier la configuration de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Les variables d\'environnement SUPABASE_URL et SUPABASE_KEY sont requises.');
  process.exit(1);
}

// Initialiser le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Interface pour les résultats d'analyse
 */
interface AnalysisResult {
  id: string;
  source_dir: string;
  result: any;
  created_at: string;
  agent: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Interface pour les fichiers audités
 */
interface AuditFile {
  id: string;
  analysis_id: string;
  file_path: string;
  size: number;
  loc: number;
  complexity: number;
  file_type: string;
  created_at: string;
  issues?: any[];
  migration_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Stocke les résultats d'analyse dans Supabase
 */
export async function storeAnalysisResult(
  sourceDir: string,
  result: any,
  agent: string,
  tags: string[] = []
): Promise<string | null> {
  try {
    const timestamp = new Date().toISOString();
    const resultId = `analysis-${Date.now()}`;
    
    const analysisData: AnalysisResult = {
      id: resultId,
      source_dir: sourceDir,
      result,
      created_at: timestamp,
      agent,
      tags
    };
    
    const { error } = await supabase
      .from('analysis_results')
      .insert(analysisData);
    
    if (error) {
      console.error('❌ Erreur lors de l\'enregistrement du résultat d\'analyse:', error);
      return null;
    }
    
    console.log(`✅ Résultat d'analyse enregistré avec l'ID: ${resultId}`);
    return resultId;
  } catch (err) {
    console.error('❌ Exception lors de l\'enregistrement du résultat d\'analyse:', err);
    return null;
  }
}

/**
 * Stocke les informations sur les fichiers audités dans Supabase
 */
export async function storeAuditFiles(
  analysisId: string,
  files: any[]
): Promise<boolean> {
  try {
    if (!files || files.length === 0) {
      console.warn('⚠️ Aucun fichier à auditer.');
      return false;
    }
    
    const timestamp = new Date().toISOString();
    
    // Préparer les données pour l'insertion
    const auditFiles: AuditFile[] = files.map(file => {
      // Calculer la complexité moyenne du fichier
      let totalComplexity = 0;
      let complexityCount = 0;
      
      // Additionner la complexité des fonctions
      if (file.functions && Array.isArray(file.functions)) {
        file.functions.forEach((func: any) => {
          if (typeof func.complexity === 'number') {
            totalComplexity += func.complexity;
            complexityCount++;
          }
        });
      }
      
      // Additionner la complexité des méthodes dans les classes
      if (file.classes && Array.isArray(file.classes)) {
        file.classes.forEach((cls: any) => {
          if (cls.methods && Array.isArray(cls.methods)) {
            cls.methods.forEach((method: any) => {
              if (typeof method.complexity === 'number') {
                totalComplexity += method.complexity;
                complexityCount++;
              }
            });
          }
        });
      }
      
      // Calculer la complexité moyenne (ou 1 si aucune fonction/méthode)
      const avgComplexity = complexityCount > 0 
        ? totalComplexity / complexityCount 
        : 1;
      
      // Déterminer le type de fichier
      const fileType = path.extname(file.path).substring(1) || 'unknown';
      
      return {
        id: `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        analysis_id: analysisId,
        file_path: file.path,
        size: file.size || 0,
        loc: file.loc || 0,
        complexity: avgComplexity,
        file_type: fileType,
        created_at: timestamp,
        migration_status: 'pending'
      };
    });
    
    // Insérer les fichiers par lots de 100 pour éviter les limitations
    const batchSize = 100;
    for (let i = 0; i < auditFiles.length; i += batchSize) {
      const batch = auditFiles.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('audit_files')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Erreur lors de l'enregistrement du lot ${i / batchSize + 1}:`, error);
        return false;
      }
    }
    
    console.log(`✅ ${auditFiles.length} fichiers audités enregistrés pour l'analyse ${analysisId}`);
    return true;
  } catch (err) {
    console.error('❌ Exception lors de l\'enregistrement des fichiers audités:', err);
    return false;
  }
}

/**
 * Récupère les résultats d'analyse par ID
 */
export async function getAnalysisResult(analysisId: string): Promise<AnalysisResult | null> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('id', analysisId)
      .single();
    
    if (error || !data) {
      console.error('❌ Erreur lors de la récupération du résultat d\'analyse:', error);
      return null;
    }
    
    return data as AnalysisResult;
  } catch (err) {
    console.error('❌ Exception lors de la récupération du résultat d\'analyse:', err);
    return null;
  }
}

/**
 * Récupère les fichiers audités pour une analyse donnée
 */
export async function getAuditFiles(analysisId: string): Promise<AuditFile[]> {
  try {
    const { data, error } = await supabase
      .from('audit_files')
      .select('*')
      .eq('analysis_id', analysisId);
    
    if (error || !data) {
      console.error('❌ Erreur lors de la récupération des fichiers audités:', error);
      return [];
    }
    
    return data as AuditFile[];
  } catch (err) {
    console.error('❌ Exception lors de la récupération des fichiers audités:', err);
    return [];
  }
}

/**
 * Met à jour le statut de migration d'un fichier
 */
export async function updateFileMigrationStatus(
  fileId: string, 
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  issues: any[] = []
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('audit_files')
      .update({
        migration_status: status,
        issues: issues.length > 0 ? issues : undefined
      })
      .eq('id', fileId);
    
    if (error) {
      console.error('❌ Erreur lors de la mise à jour du statut de migration:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Exception lors de la mise à jour du statut de migration:', err);
    return false;
  }
}

/**
 * Fonction utilitaire pour créer les tables nécessaires dans Supabase
 * (À exécuter une seule fois lors de la configuration initiale)
 */
export async function createSupabaseTables(): Promise<boolean> {
  console.log('🔄 Création des tables Supabase pour le pipeline de migration...');
  
  try {
    // Vérifier si les tables existent déjà en essayant de les sélectionner
    const { data: analysisData, error: analysisError } = await supabase
      .from('analysis_results')
      .select('id')
      .limit(1);
    
    // Si la table n'existe pas, nous aurons une erreur
    if (analysisError && analysisError.code === '42P01') {
      console.log('📦 Création de la table analysis_results...');
      
      // Requête SQL pour créer la table analysis_results
      const createAnalysisTable = `
        CREATE TABLE analysis_results (
          id TEXT PRIMARY KEY,
          source_dir TEXT NOT NULL,
          result JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          agent TEXT NOT NULL,
          tags TEXT[] DEFAULT '{}',
          metadata JSONB DEFAULT '{}'
        );
      `;
      
      // Exécuter la création de la table via une requête RPC
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: createAnalysisTable
      });
      
      if (createError) {
        console.error('❌ Erreur lors de la création de la table analysis_results:', createError);
        return false;
      }
    } else {
      console.log('✅ La table analysis_results existe déjà.');
    }
    
    // Vérifier si la table audit_files existe
    const { data: auditData, error: auditError } = await supabase
      .from('audit_files')
      .select('id')
      .limit(1);
    
    if (auditError && auditError.code === '42P01') {
      console.log('📦 Création de la table audit_files...');
      
      // Requête SQL pour créer la table audit_files
      const createAuditTable = `
        CREATE TABLE audit_files (
          id TEXT PRIMARY KEY,
          analysis_id TEXT NOT NULL REFERENCES analysis_results(id),
          file_path TEXT NOT NULL,
          size INTEGER NOT NULL,
          loc INTEGER NOT NULL,
          complexity FLOAT NOT NULL,
          file_type TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          migration_status TEXT DEFAULT 'pending',
          issues JSONB DEFAULT '[]'
        );
        
        CREATE INDEX audit_files_analysis_id_idx ON audit_files(analysis_id);
        CREATE INDEX audit_files_migration_status_idx ON audit_files(migration_status);
      `;
      
      // Exécuter la création de la table via une requête RPC
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: createAuditTable
      });
      
      if (createError) {
        console.error('❌ Erreur lors de la création de la table audit_files:', createError);
        return false;
      }
    } else {
      console.log('✅ La table audit_files existe déjà.');
    }
    
    console.log('✅ Configuration des tables Supabase terminée avec succès.');
    return true;
  } catch (err) {
    console.error('❌ Exception lors de la création des tables Supabase:', err);
    return false;
  }
}

// Export d'une fonction pour tester la connexion à Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erreur de connexion à Supabase:', error);
      return false;
    }
    
    console.log('✅ Connexion à Supabase établie avec succès.');
    return true;
  } catch (err) {
    console.error('❌ Exception lors du test de connexion à Supabase:', err);
    return false;
  }
}

// Si ce script est exécuté directement, créer les tables
if (require.main === module) {
  (async () => {
    console.log('🔄 Test de la connexion à Supabase...');
    const connected = await testSupabaseConnection();
    
    if (connected) {
      await createSupabaseTables();
    } else {
      console.error('❌ Impossible de se connecter à Supabase. Vérifiez vos variables d\'environnement.');
      process.exit(1);
    }
  })();
}