/**
 * Connecteur de base de données pour le stockage des données SEO
 * Compatible avec PostgreSQL/Supabase
 */

import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

interface DatabaseConfig {
  connectionString: string;
  schema: string;
  table: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

interface SEORecord {
  url: string;
  source_file: string;
  target_file: string;
  seo_score: number;
  status: string;
  migration_date: Date;
  metadata: string;
  issues: string;
  lighthouse_score?: string;
}

export class Database {
  private config: DatabaseConfig;
  private pgClient: Client | null = null;
  private supabaseClient: any | null = null;
  
  constructor(config: DatabaseConfig) {
    this.config = config;
  }
  
  /**
   * Initialise la connexion à la base de données
   */
  async initialize(): Promise<void> {
    // Si une URL Supabase et une clé sont fournies, utiliser Supabase
    if (this.config.supabaseUrl && this.config.supabaseKey) {
      this.supabaseClient = createClient(
        this.config.supabaseUrl,
        this.config.supabaseKey
      );
    } 
    // Sinon, utiliser une connexion PostgreSQL directe
    else if (this.config.connectionString) {
      this.pgClient = new Client({
        connectionString: this.config.connectionString
      });
      
      await this.pgClient.connect();
      
      // Vérifier que la table existe, sinon la créer
      await this.ensureTableExists();
    } else {
      throw new Error('Aucune configuration de base de données valide fournie');
    }
  }
  
  /**
   * S'assure que la table pour les données SEO existe
   */
  private async ensureTableExists(): Promise<void> {
    if (!this.pgClient) return;
    
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS "${this.config.schema}"."${this.config.table}" (
          "id" SERIAL PRIMARY KEY,
          "url" VARCHAR(255) NOT NULL,
          "source_file" VARCHAR(255) NOT NULL,
          "target_file" VARCHAR(255) NOT NULL,
          "seo_score" INTEGER NOT NULL,
          "status" VARCHAR(50) NOT NULL,
          "migration_date" TIMESTAMP WITH TIME ZONE NOT NULL,
          "metadata" JSONB,
          "issues" JSONB,
          "lighthouse_score" JSONB,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS "${this.config.table}_url_idx" ON "${this.config.schema}"."${this.config.table}" ("url");
        CREATE INDEX IF NOT EXISTS "${this.config.table}_status_idx" ON "${this.config.schema}"."${this.config.table}" ("status");
      `;
      
      await this.pgClient.query(query);
      console.log(`Table "${this.config.schema}"."${this.config.table}" prête`);
    } catch (error) {
      console.error('Erreur lors de la création de la table:', error);
      throw error;
    }
  }
  
  /**
   * Insère ou met à jour un enregistrement SEO
   */
  async upsert(record: SEORecord): Promise<void> {
    try {
      if (this.supabaseClient) {
        // Utiliser Supabase
        const { data, error } = await this.supabaseClient
          .from(this.config.table)
          .upsert(
            {
              url: record.url,
              source_file: record.source_file,
              target_file: record.target_file,
              seo_score: record.seo_score,
              status: record.status,
              migration_date: record.migration_date,
              metadata: record.metadata,
              issues: record.issues,
              lighthouse_score: record.lighthouse_score,
              updated_at: new Date()
            },
            {
              onConflict: 'url',
              returning: 'minimal'
            }
          );
          
        if (error) throw error;
      } else if (this.pgClient) {
        // Utiliser PostgreSQL directement
        const query = `
          INSERT INTO "${this.config.schema}"."${this.config.table}"
            (url, source_file, target_file, seo_score, status, migration_date, metadata, issues, lighthouse_score, updated_at)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (url)
          DO UPDATE SET
            source_file = EXCLUDED.source_file,
            target_file = EXCLUDED.target_file,
            seo_score = EXCLUDED.seo_score,
            status = EXCLUDED.status,
            migration_date = EXCLUDED.migration_date,
            metadata = EXCLUDED.metadata,
            issues = EXCLUDED.issues,
            lighthouse_score = EXCLUDED.lighthouse_score,
            updated_at = NOW()
        `;
        
        await this.pgClient.query(query, [
          record.url,
          record.source_file,
          record.target_file,
          record.seo_score,
          record.status,
          record.migration_date,
          record.metadata,
          record.issues,
          record.lighthouse_score || null
        ]);
      } else {
        throw new Error('Aucune connexion à la base de données disponible');
      }
    } catch (error) {
      console.error('Erreur lors de l\'insertion/mise à jour de l\'enregistrement SEO:', error);
      throw error;
    }
  }
  
  /**
   * Récupère un enregistrement SEO par URL
   */
  async getByUrl(url: string): Promise<SEORecord | null> {
    try {
      if (this.supabaseClient) {
        // Utiliser Supabase
        const { data, error } = await this.supabaseClient
          .from(this.config.table)
          .select('*')
          .eq('url', url)
          .single();
          
        if (error) throw error;
        return data;
      } else if (this.pgClient) {
        // Utiliser PostgreSQL directement
        const query = `
          SELECT * FROM "${this.config.schema}"."${this.config.table}"
          WHERE url = $1
        `;
        
        const result = await this.pgClient.query(query, [url]);
        return result.rows.length > 0 ? result.rows[0] : null;
      } else {
        throw new Error('Aucune connexion à la base de données disponible');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'enregistrement SEO:', error);
      return null;
    }
  }
  
  /**
   * Récupère les statistiques SEO
   */
  async getStatistics(): Promise<{
    total: number;
    migrated: number;
    verified: number;
    failed: number;
    averageScore: number;
  }> {
    try {
      if (this.supabaseClient) {
        // Utiliser Supabase - nécessite plusieurs requêtes
        const { data: totalData, error: totalError } = await this.supabaseClient
          .from(this.config.table)
          .select('count', { count: 'exact' });
          
        const { data: stats, error: statsError } = await this.supabaseClient
          .from(this.config.table)
          .select('status, seo_score');
          
        if (totalError || statsError) throw totalError || statsError;
        
        const total = totalData[0].count;
        const migrated = stats.filter(r => r.status === 'migrated').length;
        const verified = stats.filter(r => r.status === 'verified').length;
        const failed = stats.filter(r => r.status === 'failed').length;
        const averageScore = stats.reduce((acc, curr) => acc + curr.seo_score, 0) / total;
        
        return { total, migrated, verified, failed, averageScore: Math.round(averageScore) };
        
      } else if (this.pgClient) {
        // Utiliser PostgreSQL directement
        const query = `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'migrated' THEN 1 ELSE 0 END) as migrated,
            SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            ROUND(AVG(seo_score)) as average_score
          FROM "${this.config.schema}"."${this.config.table}"
        `;
        
        const result = await this.pgClient.query(query);
        const row = result.rows[0];
        
        return {
          total: parseInt(row.total),
          migrated: parseInt(row.migrated),
          verified: parseInt(row.verified),
          failed: parseInt(row.failed),
          averageScore: parseInt(row.average_score)
        };
      } else {
        throw new Error('Aucune connexion à la base de données disponible');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques SEO:', error);
      return {
        total: 0,
        migrated: 0,
        verified: 0,
        failed: 0,
        averageScore: 0
      };
    }
  }
  
  /**
   * Ferme la connexion à la base de données
   */
  async close(): Promise<void> {
    if (this.pgClient) {
      await this.pgClient.end();
    }
  }
}

// Exemple d'utilisation:
// const db = new Database({
//   connectionString: 'postgresql://user:password@localhost:5432/database',
//   schema: 'public',
//   table: 'seo_migration_status'
// });
// await db.initialize();