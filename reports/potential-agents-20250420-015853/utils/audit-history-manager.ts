import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Interface pour l'historique d'audit
interface AuditHistory {
  id: string;
  source_dir: string;
  report_path: string;
  timestamp: string;
  report_type: 'markdown' | 'html';
  agent_id: string;
  report_summary?: Record<string, any>;
  tags?: string[];
}

// Interface pour les mappings de fichiers
interface FileMapping {
  id: string;
  audit_id: string;
  source_file: string;
  target_file: string;
  migration_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  component_type: 'controller' | 'service' | 'entity' | 'component' | 'route' | 'other';
  updated_at: string;
}

/**
 * Classe pour gérer l'historisation des audits et mappings dans Supabase
 */
export class AuditHistoryManager {
  private supabase;
  private isInitialized = false;

  constructor() {
    // Initialiser Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "⚠️ Variables d'environnement SUPABASE_URL et/ou SUPABASE_KEY non définies. Historisation désactivée."
      );
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.isInitialized = true;
  }

  /**
   * Enregistre un rapport d'audit dans Supabase
   */
  async saveAuditReport(
    sourceDir: string,
    reportPath: string,
    agentId: string,
    reportSummary?: Record<string, any>,
    tags: string[] = []
  ): Promise<string | null> {
    if (!this.isInitialized) {
      console.warn("⚠️ AuditHistoryManager non initialisé. Impossible de sauvegarder l'historique.");
      return null;
    }

    try {
      // Valider si le fichier de rapport existe
      if (!fs.existsSync(reportPath)) {
        throw new Error(`Le fichier de rapport n'existe pas: ${reportPath}`);
      }

      // Déterminer le type de rapport
      const reportType = path.extname(reportPath).toLowerCase() === '.html' ? 'html' : 'markdown';

      // Créer un ID unique pour l'audit
      const auditId = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Préparer les données d'audit
      const auditData: AuditHistory = {
        id: auditId,
        source_dir: sourceDir,
        report_path: reportPath,
        timestamp: new Date().toISOString(),
        report_type: reportType,
        agent_id: agentId,
        report_summary: reportSummary,
        tags,
      };

      // Enregistrer dans Supabase
      const { error } = await this.supabase.from('audit_history').insert(auditData);

      if (error) {
        console.error(
          "❌ Erreur lors de l'enregistrement de l'historique d'audit dans Supabase:",
          error
        );
        return null;
      }

      console.log(`✅ Historique d'audit enregistré avec l'ID: ${auditId}`);
      return auditId;
    } catch (err) {
      console.error("❌ Exception lors de l'enregistrement de l'historique d'audit:", err);
      return null;
    }
  }

  /**
   * Enregistre un mapping de fichier source → cible dans Supabase
   */
  async saveFileMapping(
    auditId: string,
    sourceFile: string,
    targetFile: string,
    componentType: 'controller' | 'service' | 'entity' | 'component' | 'route' | 'other',
    migrationStatus: 'pending' | 'in_progress' | 'completed' | 'failed' = 'pending'
  ): Promise<string | null> {
    if (!this.isInitialized) {
      console.warn(
        '⚠️ AuditHistoryManager non initialisé. Impossible de sauvegarder le mapping de fichier.'
      );
      return null;
    }

    try {
      // Créer un ID unique pour le mapping
      const mappingId = `mapping-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Préparer les données de mapping
      const mappingData: FileMapping = {
        id: mappingId,
        audit_id: auditId,
        source_file: sourceFile,
        target_file: targetFile,
        component_type: componentType,
        migration_status: migrationStatus,
        updated_at: new Date().toISOString(),
      };

      // Enregistrer dans Supabase
      const { error } = await this.supabase.from('file_mappings').insert(mappingData);

      if (error) {
        console.error(
          "❌ Erreur lors de l'enregistrement du mapping de fichier dans Supabase:",
          error
        );
        return null;
      }

      console.log(`✅ Mapping de fichier enregistré avec l'ID: ${mappingId}`);
      return mappingId;
    } catch (err) {
      console.error("❌ Exception lors de l'enregistrement du mapping de fichier:", err);
      return null;
    }
  }

  /**
   * Met à jour le statut de migration d'un mapping de fichier
   */
  async updateFileMappingStatus(
    mappingId: string,
    migrationStatus: 'pending' | 'in_progress' | 'completed' | 'failed'
  ): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn(
        '⚠️ AuditHistoryManager non initialisé. Impossible de mettre à jour le statut de mapping.'
      );
      return false;
    }

    try {
      // Mettre à jour le statut dans Supabase
      const { error } = await this.supabase
        .from('file_mappings')
        .update({
          migration_status: migrationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mappingId);

      if (error) {
        console.error(
          '❌ Erreur lors de la mise à jour du statut de mapping dans Supabase:',
          error
        );
        return false;
      }

      console.log(`✅ Statut du mapping ${mappingId} mis à jour: ${migrationStatus}`);
      return true;
    } catch (err) {
      console.error('❌ Exception lors de la mise à jour du statut de mapping:', err);
      return false;
    }
  }

  /**
   * Récupère l'historique des audits
   */
  async getAuditHistory(limit = 20): Promise<AuditHistory[]> {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ AuditHistoryManager non initialisé. Impossible de récupérer l'historique d'audit."
      );
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('audit_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ Erreur lors de la récupération de l'historique d'audit:", error);
        return [];
      }

      return data as AuditHistory[];
    } catch (err) {
      console.error("❌ Exception lors de la récupération de l'historique d'audit:", err);
      return [];
    }
  }

  /**
   * Récupère les mappings de fichiers pour un audit donné
   */
  async getFileMappings(auditId: string): Promise<FileMapping[]> {
    if (!this.isInitialized) {
      console.warn(
        '⚠️ AuditHistoryManager non initialisé. Impossible de récupérer les mappings de fichiers.'
      );
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('file_mappings')
        .select('*')
        .eq('audit_id', auditId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des mappings de fichiers:', error);
        return [];
      }

      return data as FileMapping[];
    } catch (err) {
      console.error('❌ Exception lors de la récupération des mappings de fichiers:', err);
      return [];
    }
  }

  /**
   * Récupère un rapport d'audit spécifique
   */
  async getAuditReport(auditId: string): Promise<AuditHistory | null> {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ AuditHistoryManager non initialisé. Impossible de récupérer le rapport d'audit."
      );
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('audit_history')
        .select('*')
        .eq('id', auditId)
        .single();

      if (error || !data) {
        console.error("❌ Erreur lors de la récupération du rapport d'audit:", error);
        return null;
      }

      return data as AuditHistory;
    } catch (err) {
      console.error("❌ Exception lors de la récupération du rapport d'audit:", err);
      return null;
    }
  }

  /**
   * Récupère le dernier rapport d'audit pour un répertoire source
   */
  async getLatestAuditForSource(sourceDir: string): Promise<AuditHistory | null> {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ AuditHistoryManager non initialisé. Impossible de récupérer le dernier rapport d'audit."
      );
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('audit_history')
        .select('*')
        .eq('source_dir', sourceDir)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error("❌ Erreur lors de la récupération du dernier rapport d'audit:", error);
        return null;
      }

      return data as AuditHistory;
    } catch (err) {
      console.error("❌ Exception lors de la récupération du dernier rapport d'audit:", err);
      return null;
    }
  }

  /**
   * Initialise les tables Supabase nécessaires
   */
  async initializeDatabase(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ AuditHistoryManager non initialisé. Impossible d'initialiser la base de données."
      );
      return false;
    }

    try {
      console.log("🔄 Création des tables pour l'historisation des audits dans Supabase...");

      // Vérifier si les tables existent déjà
      const { data: auditData, error: auditError } = await this.supabase
        .from('audit_history')
        .select('id')
        .limit(1);

      // Créer la table audit_history si elle n'existe pas
      if (auditError && auditError.code === '42P01') {
        console.log('📦 Création de la table audit_history...');

        const createAuditTable = `
          CREATE TABLE audit_history (
            id TEXT PRIMARY KEY,
            source_dir TEXT NOT NULL,
            report_path TEXT NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            report_type TEXT NOT NULL,
            agent_id TEXT NOT NULL,
            report_summary JSONB DEFAULT '{}',
            tags TEXT[] DEFAULT '{}'
          );

          CREATE INDEX audit_history_timestamp_idx ON audit_history(timestamp);
          CREATE INDEX audit_history_source_dir_idx ON audit_history(source_dir);
        `;

        const { error: createError } = await this.supabase.rpc('exec_sql', {
          query: createAuditTable,
        });

        if (createError) {
          console.error('❌ Erreur lors de la création de la table audit_history:', createError);
          return false;
        }

        console.log('✅ Table audit_history créée avec succès.');
      } else {
        console.log('✅ La table audit_history existe déjà.');
      }

      // Vérifier si la table file_mappings existe
      const { data: mappingData, error: mappingError } = await this.supabase
        .from('file_mappings')
        .select('id')
        .limit(1);

      // Créer la table file_mappings si elle n'existe pas
      if (mappingError && mappingError.code === '42P01') {
        console.log('📦 Création de la table file_mappings...');

        const createMappingTable = `
          CREATE TABLE file_mappings (
            id TEXT PRIMARY KEY,
            audit_id TEXT NOT NULL REFERENCES audit_history(id),
            source_file TEXT NOT NULL,
            target_file TEXT NOT NULL,
            component_type TEXT NOT NULL,
            migration_status TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
          );

          CREATE INDEX file_mappings_audit_id_idx ON file_mappings(audit_id);
          CREATE INDEX file_mappings_migration_status_idx ON file_mappings(migration_status);
        `;

        const { error: createError } = await this.supabase.rpc('exec_sql', {
          query: createMappingTable,
        });

        if (createError) {
          console.error('❌ Erreur lors de la création de la table file_mappings:', createError);
          return false;
        }

        console.log('✅ Table file_mappings créée avec succès.');
      } else {
        console.log('✅ La table file_mappings existe déjà.');
      }

      return true;
    } catch (err) {
      console.error("❌ Exception lors de l'initialisation de la base de données:", err);
      return false;
    }
  }
}

// Export d'une instance singleton
export const auditHistoryManager = new AuditHistoryManager();

// Si ce script est exécuté directement, initialiser la base de données
if (require.main === module) {
  (async () => {
    try {
      const success = await auditHistoryManager.initializeDatabase();
      if (success) {
        console.log("✅ Base de données initialisée avec succès pour l'historisation des audits.");
      } else {
        console.error(
          "❌ Échec de l'initialisation de la base de données pour l'historisation des audits."
        );
        process.exit(1);
      }
    } catch (err) {
      console.error('❌ Exception non gérée:', err);
      process.exit(1);
    }
  })();
}
