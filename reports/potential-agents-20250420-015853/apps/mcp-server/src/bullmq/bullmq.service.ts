import { Inject, Injectable, Logger } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';

// Interface pour les options personnalisées pour nos jobs
export interface McpJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  timeout?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean | number;
  jobId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class BullQueueService {
  private readonly logger = new Logger(BullQueueService.name);

  constructor(
    @Inject('PHP_ANALYZER_QUEUE') private readonly phpQueue: Queue,
    @Inject('JS_ANALYZER_QUEUE') private readonly jsQueue: Queue,
    @Inject('MIGRATION_QUEUE') private readonly migrationQueue: Queue,
    @Inject('VERIFICATION_QUEUE') private readonly verificationQueue: Queue
  ) {}

  /**
   * Ajoute un job d'analyse PHP à la queue
   */
  async addPhpAnalyzerJob(
    filePath: string, 
    options: McpJobOptions = {}
  ) {
    const jobId = options.jobId || `php:${filePath}:${Date.now()}`;
    const jobOptions = this.buildJobOptions(options);
    
    this.logger.log(`Ajout d'un job PHP Analyzer pour le fichier: ${filePath} (priorité: ${options.priority || 1})`);
    
    return await this.phpQueue.add('analyze-php', { 
      filePath,
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    }, {
      ...jobOptions,
      jobId
    });
  }

  /**
   * Ajoute un job d'analyse JavaScript à la queue
   */
  async addJsAnalyzerJob(
    filePath: string, 
    options: McpJobOptions = {}
  ) {
    const jobId = options.jobId || `js:${filePath}:${Date.now()}`;
    const jobOptions = this.buildJobOptions(options);
    
    this.logger.log(`Ajout d'un job JS Analyzer pour le fichier: ${filePath} (priorité: ${options.priority || 1})`);
    
    return await this.jsQueue.add('analyze-js', { 
      filePath,
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    }, {
      ...jobOptions,
      jobId
    });
  }

  /**
   * Ajoute un job de migration à la queue
   */
  async addMigrationJob(
    payload: {
      source: string;
      target: string;
      type: 'route' | 'component' | 'api' | 'full';
      params?: Record<string, any>;
    }, 
    options: McpJobOptions = {}
  ) {
    const jobId = options.jobId || `migration:${payload.source}:${Date.now()}`;
    const jobOptions = this.buildJobOptions(options);
    
    this.logger.log(`Ajout d'un job de migration pour: ${payload.source} -> ${payload.target} (type: ${payload.type})`);
    
    return await this.migrationQueue.add('migrate', { 
      ...payload,
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    }, {
      ...jobOptions,
      jobId
    });
  }

  /**
   * Ajoute un job de vérification à la queue
   */
  async addVerificationJob(
    filePrefix: string,
    options: McpJobOptions & {
      generatedDir?: string;
      specsDir?: string;
      verbosity?: number;
      typeCheck?: boolean;
    } = {}
  ) {
    const jobId = options.jobId || `verify:${filePrefix}:${Date.now()}`;
    const jobOptions = this.buildJobOptions(options);
    
    this.logger.log(`Ajout d'un job de vérification pour: ${filePrefix} (priorité: ${options.priority || 1})`);
    
    return await this.verificationQueue.add('verify', { 
      filePrefix,
      options: {
        generatedDir: options.generatedDir,
        specsDir: options.specsDir,
        verbosity: options.verbosity,
        typeCheck: options.typeCheck
      },
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    }, {
      ...jobOptions,
      jobId
    });
  }

  /**
   * Vide une queue spécifique
   */
  async clearQueue(queueName: 'PhpAnalyzer' | 'js-analyzer' | 'migration' | 'verification') {
    let queue: Queue;
    
    switch (queueName) {
      case 'PhpAnalyzer':
        queue = this.phpQueue;
        break;
      case 'js-analyzer':
        queue = this.jsQueue;
        break;
      case 'migration':
        queue = this.migrationQueue;
        break;
      case 'verification':
        queue = this.verificationQueue;
        break;
    }
    
    this.logger.warn(`Vidage de la queue ${queueName}`);
    await queue.obliterate({ force: true });
    return { success: true, message: `Queue ${queueName} vidée avec succès` };
  }

  /**
   * Récupère les statistiques d'une queue
   */
  async getQueueStats(queueName: 'PhpAnalyzer' | 'js-analyzer' | 'migration' | 'verification') {
    let queue: Queue;
    
    switch (queueName) {
      case 'PhpAnalyzer':
        queue = this.phpQueue;
        break;
      case 'js-analyzer':
        queue = this.jsQueue;
        break;
      case 'migration':
        queue = this.migrationQueue;
        break;
      case 'verification':
        queue = this.verificationQueue;
        break;
    }
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);
    
    return {
      queueName,
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Récupère les statistiques de toutes les queues
   */
  async getAllQueuesStats() {
    const [phpStats, jsStats, migrationStats, verificationStats] = await Promise.all([
      this.getQueueStats('PhpAnalyzer'),
      this.getQueueStats('js-analyzer'),
      this.getQueueStats('migration'),
      this.getQueueStats('verification')
    ]);
    
    return {
      queues: [phpStats, jsStats, migrationStats, verificationStats],
      totals: {
        waiting: phpStats.counts.waiting + jsStats.counts.waiting + migrationStats.counts.waiting + verificationStats.counts.waiting,
        active: phpStats.counts.active + jsStats.counts.active + migrationStats.counts.active + verificationStats.counts.active,
        completed: phpStats.counts.completed + jsStats.counts.completed + migrationStats.counts.completed + verificationStats.counts.completed,
        failed: phpStats.counts.failed + jsStats.counts.failed + migrationStats.counts.failed + verificationStats.counts.failed,
        delayed: phpStats.counts.delayed + jsStats.counts.delayed + migrationStats.counts.delayed + verificationStats.counts.delayed,
        total: phpStats.counts.total + jsStats.counts.total + migrationStats.counts.total + verificationStats.counts.total
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Construit les options de job BullMQ à partir de nos options personnalisées
   */
  private buildJobOptions(options: McpJobOptions): JobsOptions {
    return {
      priority: options.priority || 1,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      timeout: options.timeout || 60000, // 1 minute par défaut
      removeOnComplete: options.removeOnComplete ?? 100, // Garde les 100 derniers jobs complétés
      removeOnFail: options.removeOnFail ?? 100, // Garde les 100 derniers jobs échoués
    };
  }
}