/**
 * MCP Manifest Manager - Gestionnaire pour le fichier MCPManifest.json
 *
 * Cette classe fournit des méthodes pour lire, manipuler et écrire dans le fichier
 * MCPManifest.json qui sert de source de vérité pour toutes les migrations.
 */

import path from 'path';
import { Logger } from '@nestjs/common';
import fs from 'fs-extra';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';

// Types
export interface MCPMigration {
  id: string;
  sourceFile: string;
  targetFiles: Record<string, string>;
  status: string;
  route?: string;
  qaStatus?: string;
  seoStatus?: string;
  tags?: string[];
  createdAt: string;
  completedAt?: string;
  prUrl?: string;
  assignee?: string;
  verificationSteps?: Array<{
    name: string;
    status: string;
    score?: number;
    error?: string;
  }>;
  error?: {
    message: string;
    location?: string;
    retryCount?: number;
  };
  scheduledFor?: string;
  priority?: string;
}

export interface MCPMetadata {
  totalPlanned: number;
  totalCompleted: number;
  totalInProgress: number;
  totalFailed: number;
}

export interface MCPManifest {
  version: string;
  lastUpdated: string;
  project: string;
  metadata: MCPMetadata;
  migrations: MCPMigration[];
  notifications: {
    slack: {
      enabled: boolean;
      channel: string;
      events: string[];
    };
    email: {
      enabled: boolean;
      recipients: string[];
      events: string[];
    };
    DoDoDoDoDoDotgithub: {
      enabled: boolean;
      repo: string;
      owner: string;
      events: string[];
    };
  };
  integrations: {
    supabase: {
      table: string;
      enabled: boolean;
    };
    DoDoDoDoDoDotgithub: {
      autoCreatePR: boolean;
      prTemplate: string;
      enabled: boolean;
    };
    Dotn8N: {
      workflow: string;
      enabled: boolean;
    };
  };
}

/**
 * Classe de gestion du fichier MCPManifest.json
 */
export class MCPManifestManager implements BaseAgent, BusinessAgent {
  private logger = new Logger('MCPManifestManager');
  private manifestPath: string;
  private manifest: MCPManifest | null = null;

  constructor(manifestPath: string) {
    this.manifestPath = manifestPath;
  }

  /**
   * Charge le fichier MCPManifest.json
   */
  public async load(): Promise<MCPManifest> {
    try {
      if (!(await fs.pathExists(this.manifestPath))) {
        throw new Error(`Le fichier ${this.manifestPath} n'existe pas`);
      }

      const content = await fs.readJson(this.manifestPath);
      this.manifest = content as MCPManifest;

      this.logger.log(`✅ Manifest chargé depuis ${this.manifestPath}`);
      return this.manifest;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors du chargement du manifest: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sauvegarde le fichier MCPManifest.json
   */
  public async save(): Promise<void> {
    try {
      if (!this.manifest) {
        throw new Error('Manifest non chargé');
      }

      // Mettre à jour la date de dernière mise à jour
      this.manifest.lastUpdated = new Date().toISOString();

      await fs.writeJson(this.manifestPath, this.manifest, { spaces: 2 });

      this.logger.log(`✅ Manifest sauvegardé dans ${this.manifestPath}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la sauvegarde du manifest: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère une migration par son ID
   */
  public getMigration(id: string): MCPMigration | undefined {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return undefined;
    }

    return this.manifest.migrations.find((m) => m.id === id);
  }

  /**
   * Récupère une migration par son fichier source
   */
  public getMigrationBySourceFile(sourceFile: string): MCPMigration | undefined {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return undefined;
    }

    // Normaliser les chemins pour la comparaison
    const normalizedSourceFile = path.normalize(sourceFile);

    return this.manifest.migrations.find((m) => {
      const migrationSourceFile = path.normalize(m.sourceFile);
      return (
        migrationSourceFile === normalizedSourceFile ||
        migrationSourceFile === path.basename(normalizedSourceFile) ||
        path.basename(migrationSourceFile) === path.basename(normalizedSourceFile)
      );
    });
  }

  /**
   * Ajoute une nouvelle migration
   */
  public addMigration(migration: MCPMigration): void {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return;
    }

    // Vérifier si la migration existe déjà
    const existingIndex = this.manifest.migrations.findIndex((m) => m.id === migration.id);

    if (existingIndex >= 0) {
      // Mettre à jour la migration existante
      this.manifest.migrations[existingIndex] = migration;
      this.logger.log(`✅ Migration ${migration.id} mise à jour`);
    } else {
      // Ajouter la nouvelle migration
      this.manifest.migrations.push(migration);
      this.logger.log(`✅ Migration ${migration.id} ajoutée`);
    }

    // Mettre à jour les métadonnées
    this.updateMetadata();
  }

  /**
   * Met à jour le statut d'une migration
   */
  public updateMigrationStatus(id: string, status: string): boolean {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return false;
    }

    const migration = this.getMigration(id);

    if (!migration) {
      this.logger.warn(`⚠️ Migration ${id} non trouvée`);
      return false;
    }

    migration.status = status;

    // Mettre à jour la date de complétion si terminé
    if (status === 'completed') {
      migration.completedAt = new Date().toISOString();
    }

    // Mettre à jour les métadonnées
    this.updateMetadata();

    this.logger.log(`✅ Statut de la migration ${id} mis à jour: ${status}`);
    return true;
  }

  /**
   * Met à jour les metadata du manifest
   */
  public updateMetadata(): void {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return;
    }

    const migrations = this.manifest.migrations;

    // Calculer les totaux
    const totalPlanned = migrations.filter((m) => m.status === 'planned').length;
    const totalCompleted = migrations.filter((m) => m.status === 'completed').length;
    const totalInProgress = migrations.filter((m) => m.status === 'in_progress').length;
    const totalFailed = migrations.filter((m) => m.status === 'failed').length;

    // Mettre à jour les métadonnées
    this.manifest.metadata = {
      totalPlanned,
      totalCompleted,
      totalInProgress,
      totalFailed,
    };

    this.logger.log('✅ Métadonnées du manifest mises à jour');
  }

  /**
   * Récupère toutes les migrations
   */
  public getAllMigrations(): MCPMigration[] {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return [];
    }

    return this.manifest.migrations;
  }

  /**
   * Récupère les migrations par statut
   */
  public getMigrationsByStatus(status: string): MCPMigration[] {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return [];
    }

    return this.manifest.migrations.filter((m) => m.status === status);
  }

  /**
   * Récupère les migrations par tag
   */
  public getMigrationsByTag(tag: string): MCPMigration[] {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return [];
    }

    return this.manifest.migrations.filter((m) => m.tags && m.tags.includes(tag));
  }

  /**
   * Récupère les métadonnées du manifest
   */
  public getMetadata(): MCPMetadata {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return {
        totalPlanned: 0,
        totalCompleted: 0,
        totalInProgress: 0,
        totalFailed: 0,
      };
    }

    return this.manifest.metadata;
  }

  /**
   * Génère un nouvel ID de migration
   */
  public generateMigrationId(): string {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return `MIG-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;
    }

    // Trouver le plus grand ID existant
    const ids = this.manifest.migrations.map((m) => {
      const match = m.id.match(/MIG-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxId = Math.max(0, ...ids);
    const nextId = maxId + 1;

    return `MIG-${nextId.toString().padStart(3, '0')}`;
  }

  /**
   * Récupère la configuration des notifications
   */
  public getNotificationsConfig(): any {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return {};
    }

    return this.manifest.notifications;
  }

  /**
   * Récupère la configuration des intégrations
   */
  public getIntegrationsConfig(): any {
    if (!this.manifest) {
      this.logger.warn('⚠️ Manifest non chargé');
      return {};
    }

    return this.manifest.integrations;
  }

  id = '';
  type = '';
  version = '1.0.0';

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
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}

// Exécution autonome si appelé directement
if (require.main === module) {
  const manifestPath = process.argv[2] || path.join(process.cwd(), 'MCPManifest.json');

  console.log(`📋 Lecture du manifest depuis ${manifestPath}`);

  const manager = new MCPManifestManager(manifestPath);

  manager
    .load()
    .then((manifest) => {
      console.log('✅ Manifest chargé avec succès');
      console.log(
        `📊 Statistiques: ${manifest.metadata.totalCompleted}/${manifest.migrations.length} migrations terminées`
      );
      console.log(`🚀 Migrations en cours: ${manifest.metadata.totalInProgress}`);
      console.log(`⏳ Migrations planifiées: ${manifest.metadata.totalPlanned}`);
      console.log(`❌ Migrations échouées: ${manifest.metadata.totalFailed}`);
    })
    .catch((error) => {
      console.error(`❌ Erreur: ${error.message}`);
      process.exit(1);
    });
}
