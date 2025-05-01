/**
 * Service de points de contrôle pour les migrations
 *
 * Ce service permet de sauvegarder et de récupérer l'état des migrations
 * pour permettre une reprise après échec
 */
import fs from 'fs';
import path from 'path';

export interface CheckpointData {
  workflowId: string;
  migrationId: string;
  stage: string;
  data: any;
  timestamp: string;
}

export class CheckpointService {
  private checkpointDir: string;

  constructor(baseDir = './logs/checkpoints') {
    this.checkpointDir = baseDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  /**
   * Sauvegarde un point de contrôle pour une migration
   */
  async saveCheckpoint(checkpoint: CheckpointData): Promise<void> {
    const filename = this.getCheckpointFilename(checkpoint.workflowId, checkpoint.migrationId);
    await fs.promises.writeFile(filename, JSON.stringify(checkpoint, null, 2), 'utf-8');
    console.log(`Checkpoint sauvegardé: ${filename}`);
  }

  /**
   * Récupère le dernier point de contrôle d'une migration
   */
  async getCheckpoint(workflowId: string, migrationId: string): Promise<CheckpointData | null> {
    const filename = this.getCheckpointFilename(workflowId, migrationId);

    try {
      if (fs.existsSync(filename)) {
        const data = await fs.promises.readFile(filename, 'utf-8');
        return JSON.parse(data) as CheckpointData;
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du checkpoint: ${error.message}`);
    }

    return null;
  }

  /**
   * Liste tous les points de contrôle disponibles
   */
  async listCheckpoints(migrationId?: string): Promise<string[]> {
    const files = await fs.promises.readdir(this.checkpointDir);
    if (migrationId) {
      return files.filter((file) => file.includes(migrationId));
    }
    return files;
  }

  /**
   * Supprime un point de contrôle
   */
  async removeCheckpoint(workflowId: string, migrationId: string): Promise<void> {
    const filename = this.getCheckpointFilename(workflowId, migrationId);
    if (fs.existsSync(filename)) {
      await fs.promises.unlink(filename);
      console.log(`Checkpoint supprimé: ${filename}`);
    }
  }

  private getCheckpointFilename(workflowId: string, migrationId: string): string {
    return path.join(this.checkpointDir, `${workflowId}-${migrationId}.json`);
  }
}

export default new CheckpointService();
