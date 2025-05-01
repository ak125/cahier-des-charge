import * as path from 'path';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Job, Queue, Worker } from 'bullmq';
import * as fs from 'fs/promises';
import { createClient } from 'redis';

/**
 * Interface pour le statut d'un fichier
 */
type JobStatus = 'pending' | 'done' | 'invalid';

/**
 * Interface pour la structure des entrées dans status.json
 */
interface StatusData {
  lastUpdated: string;
  summary: {
    total: number;
    pending: number;
    done: number;
    invalid: number;
  };
  files: Record<string, {
    status: JobStatus;
    agent: string;
    lastUpdated: string;
    error?: string;
  }>;
}

/**
 * StatusWriterAgent
 * 
 * Agent responsable de :
 * 1. Surveiller l'activité des jobs Redis BullMQ
 * 2. Mettre à jour le fichier status.json
 * 3. Journaliser les erreurs dans error.log
 * 4. Synchroniser les données avec Supabase
 */
export class StatusWriterAgent {
  private readonly logger = new Logger('StatusWriterAgent');
  private readonly statusPath: string;
  private readonly logPath: string;
  private readonly redisJobsPath: string;
  private readonly redisClient: ReturnType<typeof createClient>;
  private readonly supabaseClient;
  private readonly eventEmitter: EventEmitter2;
  private statusData: StatusData;
  
  constructor(
    private readonly config: {
      statusPath?: string;
      logPath?: string; 
      redisJobsPath?: string;
      redisUrl?: string;
      supabaseUrl?: string;
      supabaseKey?: string;
    } = {}
  ) {
    // Définir les chemins des fichiers
    this.statusPath = config.statusPath || path.resolve(process.cwd(), 'status.json');
    this.logPath = config.logPath || path.resolve(process.cwd(), 'logs', 'error.log');
    this.redisJobsPath = config.redisJobsPath || path.resolve(process.cwd(), 'logs', 'jobs.redis.json');
    
    // Initialiser le client Redis
    this.redisClient = createClient({
      url: config.redisUrl || 'redis://localhost:6379'
    });
    
    // Initialiser le client Supabase s'il est configuré
    if (config.supabaseUrl && config.supabaseKey) {
      this.supabaseClient = createSupabaseClient(
        config.supabaseUrl,
        config.supabaseKey
      );
    }
    
    // Initialiser l'émetteur d'événements
    this.eventEmitter = new EventEmitter2();
    
    // Initialiser la structure de statut vide
    this.statusData = {
      lastUpdated: new Date().toISOString(),
      summary: {
        total: 0,
        pending: 0,
        done: 0,
        invalid: 0
      },
      files: {}
    };
  }

  /**
   * Initialise l'agent et commence à écouter les événements BullMQ
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log('Initialisation de StatusWriterAgent');
      
      // Charger le fichier status.json s'il existe
      await this.loadStatusFile();
      
      // Se connecter à Redis
      await this.redisClient.connect();
      
      // Configurer les écouteurs d'événements BullMQ
      this.setupEventListeners();
      
      // Première synchronisation des données
      await this.syncJobsWithRedis();
      
      this.logger.log('StatusWriterAgent initialisé avec succès');
    } catch (error) {
      this.logger.error(`Erreur lors de l'initialisation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Charge le fichier status.json s'il existe
   */
  private async loadStatusFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.statusPath, 'utf8');
      this.statusData = JSON.parse(content);
      this.logger.log(`Fichier status.json chargé: ${this.statusPath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.log(`Fichier status.json non trouvé, création d'un nouveau fichier`);
        await this.saveStatusFile();
      } else {
        this.logger.error(`Erreur lors de la lecture du fichier status.json: ${error.message}`);
      }
    }
  }

  /**
   * Sauvegarde le fichier status.json
   */
  private async saveStatusFile(): Promise<void> {
    try {
      // Mise à jour de la date de dernière mise à jour
      this.statusData.lastUpdated = new Date().toISOString();
      
      // Mise à jour des statistiques
      this.updateSummary();
      
      // Écriture du fichier
      await fs.writeFile(
        this.statusPath,
        JSON.stringify(this.statusData, null, 2),
        'utf8'
      );
      
      this.logger.log(`Fichier status.json mis à jour: ${this.statusPath}`);
      
      // Déclencher un événement
      this.eventEmitter.emit('status.updated', this.statusData);
    } catch (error) {
      this.logger.error(`Erreur lors de la sauvegarde du fichier status.json: ${error.message}`);
    }
  }

  /**
   * Met à jour les statistiques de résumé
   */
  private updateSummary(): void {
    const files = this.statusData.files;
    const total = Object.keys(files).length;
    const pending = Object.values(files).filter(f => f.status === 'pending').length;
    const done = Object.values(files).filter(f => f.status === 'done').length;
    const invalid = Object.values(files).filter(f => f.status === 'invalid').length;
    
    this.statusData.summary = { total, pending, done, invalid };
  }

  /**
   * Configure les écouteurs d'événements BullMQ
   */
  private setupEventListeners(): void {
    // Créer un worker qui écoute les événements des queues BullMQ
    constDoDotmcpWorker = new Worker(DoDotmcp-jobs', async job => {
      await this.processJob(job);
    }, {
      connection: this.redisClient
    });

    // Écouter les événements de complétion
   DoDotmcpWorker.on('completed', async job => {
      await this.updateJobStatus(job.data.filename, 'done', job.name, new Date().toISOString());
    });

    // Écouter les événements d'erreur
   DoDotmcpWorker.on('failed', async (job, error) => {
      await this.updateJobStatus(
        job.data.filename,
        'invalid',
        job.name,
        new Date().toISOString(),
        error.message
      );
      await this.logError(job.name, job.data.filename, error.message);
    });

    // Écouter les événements d'ajout de job
   DoDotmcpWorker.on('active', async job => {
      await this.updateJobStatus(job.data.filename, 'pending', job.name, new Date().toISOString());
    });
  }

  /**
   * Met à jour le statut d'un job dans status.json
   */
  async updateJobStatus(
    filename: string,
    status: JobStatus,
    agent: string,
    timestamp: string,
    error?: string
  ): Promise<void> {
    // Mise à jour du statut
    this.statusData.files[filename] = {
      status,
      agent,
      lastUpdated: timestamp,
      ...(error ? { error } : {})
    };
    
    // Sauvegarder les modifications
    await this.saveStatusFile();
    
    // Synchroniser avec Supabase si configuré
    await this.syncWithSupabase(filename, status, agent, timestamp, error);
    
    this.logger.log(`Statut de "${filename}" mis à jour: ${status}`);
  }

  /**
   * Journalise une erreur dans error.log
   */
  async logError(agent: string, filename: string, errorMessage: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${agent}] [${filename}] ${errorMessage}\n`;
      
      await fs.appendFile(this.logPath, logEntry, 'utf8');
      
      this.logger.log(`Erreur journalisée pour "${filename}"`);
    } catch (error) {
      this.logger.error(`Erreur lors de la journalisation: ${error.message}`);
    }
  }

  /**
   * Synchronise les données avec Supabase
   */
  async syncWithSupabase(
    filename: string,
    status: JobStatus,
    agent: string,
    timestamp: string,
    error?: string
  ): Promise<void> {
    if (!this.supabaseClient) {
      return;
    }
    
    try {
      const { error: supabaseError } = await this.supabaseClient
        .from('migration_files')
        .upsert(
          {
            filename,
            status,
            agent,
            updated_at: timestamp,
            error_message: error || null
          },
          { onConflict: 'filename' }
        );
      
      if (supabaseError) {
        this.logger.error(`Erreur Supabase: ${supabaseError.message}`);
      } else {
        this.logger.log(`Données synchronisées avec Supabase pour "${filename}"`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la synchronisation avec Supabase: ${error.message}`);
    }
  }

  /**
   * Synchronise les jobs avec Redis et met à jour status.json
   */
  async syncJobsWithRedis(): Promise<void> {
    try {
      // Réalise un dump des jobs Redis et l'écrit dans jobs.redis.json
      const activeJobs = await this.getRedisJobs('active');
      const waitingJobs = await this.getRedisJobs('waiting');
      const completedJobs = await this.getRedisJobs('completed');
      const failedJobs = await this.getRedisJobs('failed');
      
      const jobsDump = {
        active: activeJobs,
        waiting: waitingJobs,
        completed: completedJobs,
        failed: failedJobs
      };
      
      // Écrire le dump dans le fichier
      await fs.writeFile(
        this.redisJobsPath,
        JSON.stringify(jobsDump, null, 2),
        'utf8'
      );
      
      // Mettre à jour status.json en fonction des jobs
      for (const job of activeJobs.concat(waitingJobs)) {
        if (job.data?.filename) {
          await this.updateJobStatus(
            job.data.filename,
            'pending',
            job.name,
            job.data.timestamp || new Date().toISOString()
          );
        }
      }
      
      for (const job of completedJobs) {
        if (job.data?.filename) {
          await this.updateJobStatus(
            job.data.filename,
            'done',
            job.name,
            job.result?.processedAt || new Date().toISOString()
          );
        }
      }
      
      for (const job of failedJobs) {
        if (job.data?.filename) {
          await this.updateJobStatus(
            job.data.filename,
            'invalid',
            job.name,
            job.data.timestamp || new Date().toISOString(),
            job.failedReason
          );
          
          // Journaliser l'erreur
          await this.logError(job.name, job.data.filename, job.failedReason);
        }
      }
      
      this.logger.log('Synchronisation avec Redis terminée');
    } catch (error) {
      this.logger.error(`Erreur lors de la synchronisation avec Redis: ${error.message}`);
    }
  }

  /**
   * Récupère les jobs Redis
   */
  private async getRedisJobs(state: 'active' | 'waiting' | 'completed' | 'failed'): Promise<any[]> {
    try {
      const queue = new Queue(DoDotmcp-jobs', {
        connection: this.redisClient
      });
      
      let jobs: Job[] = [];
      
      switch (state) {
        case 'active':
          jobs = await queue.getActive();
          break;
        case 'waiting':
          jobs = await queue.getWaiting();
          break;
        case 'completed':
          jobs = await queue.getCompleted();
          break;
        case 'failed':
          jobs = await queue.getFailed();
          break;
      }
      
      return jobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        ...(job.opts.priority ? { priority: job.opts.priority } : {}),
        ...(job.timestamp ? { timestamp: job.timestamp } : {}),
        ...(state === 'completed' && job.returnvalue ? { result: job.returnvalue } : {}),
        ...(state === 'completed' && job.finishedOn ? { completedOn: job.finishedOn } : {}),
        ...(state === 'failed' && job.stacktrace ? { 
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason,
          stacktrace: job.stacktrace.join('\n') 
        } : {})
      }));
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des jobs ${state}: ${error.message}`);
      return [];
    }
  }

  /**
   * Démarre l'agent avec une synchronisation planifiée
   */
  async start(syncIntervalMs: number = 60000): Promise<void> {
    await this.initialize();
    
    // Synchroniser régulièrement les données
    setInterval(() => this.syncJobsWithRedis(), syncIntervalMs);
    
    this.logger.log(`StatusWriterAgent démarré avec une synchronisation toutes les ${syncIntervalMs}ms`);
  }

  /**
   * Arrête l'agent
   */
  async stop(): Promise<void> {
    try {
      // Déconnexion de Redis
      await this.redisClient.disconnect();
      
      this.logger.log('StatusWriterAgent arrêté');
    } catch (error) {
      this.logger.error(`Erreur lors de l'arrêt: ${error.message}`);
    }
  }
}

// Pour une utilisation en ligne de commande
if (require.main === module) {
  const agent = new StatusWriterAgent();
  agent.start()
    .catch(error => {
      console.error('Erreur lors du démarrage de l\'agent:', error);
      process.exit(1);
    });
}