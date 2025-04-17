import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { WorkflowCheckpoint, CheckpointStatus } from './types';
import { createLogger } from '../../utils/logger';

/**
 * Service pour la persistance des points de contrôle dans une base SQLite
 * Fournit une solution robuste et indépendante de Prisma
 */
export class DatabaseService {
  private db: Database | null = null;
  private dbPath: string;
  private logger = createLogger('DatabaseService');
  private initialized = false;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'checkpoints.db');
    this.ensureDirectoryExists();
  }

  /**
   * S'assure que le répertoire de données existe
   */
  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.info(`Created directory: ${dir}`);
    }
  }

  /**
   * Initialise la connexion à la base de données
   */
  private async initializeDb(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      this.initialized = true;
      this.logger.info(`Connected to SQLite database at ${this.dbPath}`);
    } catch (error) {
      this.logger.error('Failed to connect to SQLite database:', error);
      throw error;
    }
  }

  /**
   * Crée les tables nécessaires si elles n'existent pas
   */
  async ensureTablesExist(): Promise<void> {
    await this.initializeDb();

    try {
      // Table principale des checkpoints
      await this.db!.exec(`
        CREATE TABLE IF NOT EXISTS checkpoints (
          workflow_id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          step INTEGER DEFAULT 0,
          total_steps INTEGER DEFAULT 0,
          progress INTEGER DEFAULT 0,
          data JSON,
          metadata JSON,
          errors JSON,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Table d'historique des checkpoints
      await this.db!.exec(`
        CREATE TABLE IF NOT EXISTS checkpoint_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workflow_id TEXT NOT NULL,
          status TEXT NOT NULL,
          step INTEGER DEFAULT 0,
          progress INTEGER DEFAULT 0,
          snapshot JSON,
          timestamp TEXT NOT NULL,
          FOREIGN KEY (workflow_id) REFERENCES checkpoints(workflow_id)
        )
      `);

      // Index pour améliorer les performances de recherche
      await this.db!.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_id ON checkpoint_history(workflow_id)`);
      await this.db!.exec(`CREATE INDEX IF NOT EXISTS idx_timestamp ON checkpoint_history(timestamp)`);
      await this.db!.exec(`CREATE INDEX IF NOT EXISTS idx_status ON checkpoints(status)`);

      this.logger.info('SQLite tables verified/created successfully');
    } catch (error) {
      this.logger.error('Failed to create SQLite tables:', error);
      throw error;
    }
  }

  /**
   * Enregistre un point de contrôle dans la base de données
   * @param checkpoint Point de contrôle à sauvegarder
   */
  async saveCheckpoint(checkpoint: WorkflowCheckpoint): Promise<void> {
    await this.initializeDb();

    try {
      // Vérifier si le checkpoint existe déjà
      const existing = await this.db!.get(
        'SELECT workflow_id FROM checkpoints WHERE workflow_id = ?',
        checkpoint.workflowId
      );

      if (existing) {
        // Mettre à jour un checkpoint existant
        await this.db!.run(
          `UPDATE checkpoints
           SET status = ?, step = ?, total_steps = ?, progress = ?, 
               data = ?, metadata = ?, errors = ?, updated_at = ?
           WHERE workflow_id = ?`,
          checkpoint.status,
          checkpoint.step,
          checkpoint.totalSteps,
          checkpoint.progress,
          JSON.stringify(checkpoint.data || {}),
          JSON.stringify(checkpoint.metadata || {}),
          JSON.stringify(checkpoint.errors || []),
          checkpoint.updatedAt.toISOString(),
          checkpoint.workflowId
        );
      } else {
        // Insérer un nouveau checkpoint
        await this.db!.run(
          `INSERT INTO checkpoints
           (workflow_id, status, step, total_steps, progress, data, metadata, errors, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          checkpoint.workflowId,
          checkpoint.status,
          checkpoint.step,
          checkpoint.totalSteps,
          checkpoint.progress,
          JSON.stringify(checkpoint.data || {}),
          JSON.stringify(checkpoint.metadata || {}),
          JSON.stringify(checkpoint.errors || []),
          checkpoint.createdAt.toISOString(),
          checkpoint.updatedAt.toISOString()
        );
      }

      // Ajouter une entrée dans l'historique
      await this.db!.run(
        `INSERT INTO checkpoint_history
         (workflow_id, status, step, progress, snapshot, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        checkpoint.workflowId,
        checkpoint.status,
        checkpoint.step,
        checkpoint.progress,
        JSON.stringify(checkpoint),
        new Date().toISOString()
      );

      this.logger.debug(`Saved checkpoint for workflow: ${checkpoint.workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to save checkpoint for workflow ${checkpoint.workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère un point de contrôle depuis la base de données
   * @param workflowId ID du workflow
   */
  async getCheckpoint(workflowId: string): Promise<WorkflowCheckpoint | null> {
    await this.initializeDb();

    try {
      const result = await this.db!.get(
        'SELECT * FROM checkpoints WHERE workflow_id = ?',
        workflowId
      );

      if (!result) {
        return null;
      }

      return {
        workflowId: result.workflow_id,
        status: result.status as CheckpointStatus,
        step: result.step,
        totalSteps: result.total_steps,
        progress: result.progress,
        data: JSON.parse(result.data || '{}'),
        metadata: JSON.parse(result.metadata || '{}'),
        errors: JSON.parse(result.errors || '[]'),
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      };
    } catch (error) {
      this.logger.error(`Failed to get checkpoint for workflow ${workflowId}:`, error);
      return null;
    }
  }

  /**
   * Récupère l'historique des checkpoints pour un workflow
   * @param workflowId ID du workflow
   * @param limit Nombre maximum d'entrées à récupérer
   */
  async getCheckpointHistory(workflowId: string, limit: number = 10): Promise<any[]> {
    await this.initializeDb();

    try {
      const history = await this.db!.all(
        `SELECT * FROM checkpoint_history 
         WHERE workflow_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        workflowId,
        limit
      );

      return history.map(entry => {
        const snapshot = JSON.parse(entry.snapshot || '{}');
        return {
          id: entry.id,
          workflowId: entry.workflow_id,
          status: entry.status,
          step: entry.step,
          progress: entry.progress,
          timestamp: entry.timestamp,
          ...snapshot
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get history for workflow ${workflowId}:`, error);
      return [];
    }
  }

  /**
   * Nettoie les checkpoints complétés plus anciens qu'une date donnée
   * @param olderThan Date limite
   */
  async cleanupCheckpoints(olderThan: Date): Promise<void> {
    await this.initializeDb();

    try {
      const olderThanStr = olderThan.toISOString();
      
      // Récupérer les IDs des workflows à supprimer
      const workflowsToDelete = await this.db!.all(
        `SELECT workflow_id FROM checkpoints 
         WHERE status = ? AND updated_at < ?`,
        CheckpointStatus.COMPLETED,
        olderThanStr
      );
      
      if (workflowsToDelete.length === 0) {
        return;
      }
      
      // Créer une liste d'IDs pour la clause IN
      const workflowIds = workflowsToDelete.map(w => w.workflow_id);
      const placeholders = workflowIds.map(() => '?').join(',');
      
      // Supprimer l'historique associé
      await this.db!.run(
        `DELETE FROM checkpoint_history 
         WHERE workflow_id IN (${placeholders})`,
        ...workflowIds
      );
      
      // Supprimer les checkpoints complétés
      await this.db!.run(
        `DELETE FROM checkpoints 
         WHERE workflow_id IN (${placeholders})`,
        ...workflowIds
      );
      
      this.logger.info(`Cleaned up ${workflowsToDelete.length} completed checkpoints`);
    } catch (error) {
      this.logger.error('Failed to clean up checkpoints:', error);
      throw error;
    }
  }

  /**
   * Trouve les workflows potentiellement bloqués
   * @param stuckThresholdMinutes Minutes d'inactivité avant de considérer un workflow comme bloqué
   */
  async findStuckWorkflows(stuckThresholdMinutes: number = 30): Promise<WorkflowCheckpoint[]> {
    await this.initializeDb();

    try {
      const threshold = new Date();
      threshold.setMinutes(threshold.getMinutes() - stuckThresholdMinutes);
      const thresholdStr = threshold.toISOString();
      
      const stuckWorkflows = await this.db!.all(
        `SELECT * FROM checkpoints 
         WHERE status IN (?, ?, ?) AND updated_at < ?`,
        CheckpointStatus.IN_PROGRESS,
        CheckpointStatus.PENDING,
        CheckpointStatus.RESUMING,
        thresholdStr
      );
      
      return stuckWorkflows.map(result => ({
        workflowId: result.workflow_id,
        status: result.status as CheckpointStatus,
        step: result.step,
        totalSteps: result.total_steps,
        progress: result.progress,
        data: JSON.parse(result.data || '{}'),
        metadata: JSON.parse(result.metadata || '{}'),
        errors: JSON.parse(result.errors || '[]'),
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      }));
    } catch (error) {
      this.logger.error('Failed to find stuck workflows:', error);
      return [];
    }
  }

  /**
   * Ferme la connexion à la base de données
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.initialized = false;
      this.logger.info('Database connection closed');
    }
  }
}