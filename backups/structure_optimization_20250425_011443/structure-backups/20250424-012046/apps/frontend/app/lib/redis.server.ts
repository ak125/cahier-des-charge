import { createClient } from redisstructure-agent';
import { McpJob } from ./supabase.serverstructure-agent';

// Types pour les évènements Redis
export type McpRedisEvent = {
  type: 'job:status-changed' | 'job:created' | 'job:updated';
  jobId: string;
  data: Partial<McpJob>;
  timestamp: number;
};

// Types pour Redis
export type McpQueueName = DoDotmcp:PhpAnalyzer' | DoDotmcp:verification' | DoDotmcp:commit';

// Canaux Redis utilisés
export const REDIS_CHANNELS = {
  JOB_EVENTS: DoDotmcp:job-events',
  JOB_QUEUE: DoDotmcp:job-queue'
};

// Initialisation du client Redis
let redisClient: ReturnType<typeof createClient>;

/**
 * Initialise le client Redis côté serveur
 */
export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl
  });

  redisClient.on('error', (err) => console.error('Erreur Redis:', err));
  
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  
  return redisClient;
}

/**
 * Utilitaires pour interagir avec Redis pour les jobs MCP
 */
export constDoDotmcpRedisApi = {
  /**
   * Publie un événement de changement de statut
   */
  async publishStatusChange(jobId: string, status: McpJob['status'], additionalData: Partial<McpJob> = {}) {
    const redis = await getRedisClient();
    
    const event: McpRedisEvent = {
      type: 'job:status-changed',
      jobId,
      data: {
        status,
        ...additionalData
      },
      timestamp: Date.now()
    };
    
    await redis.publish(REDIS_CHANNELS.JOB_EVENTS, JSON.stringify(event));
    
    return true;
  },
  
  /**
   * Ajoute un job à la file d'attente Redis
   */
  async addJobToQueue(job: {
    id: string;
    filename: string;
    originalPath: string;
    priority: number;
    dryRun?: boolean;
  }) {
    const redis = await getRedisClient();
    
    const jobData = {
      ...job,
      queuedAt: Date.now()
    };
    
    // Ajoute le job à la queue avec la priorité (plus la valeur est faible, plus la priorité est élevée)
    await redis.zAdd(REDIS_CHANNELS.JOB_QUEUE, {
      score: 10 - Math.min(Math.max(job.priority, 0), 10), // Inversion de la priorité pour Redis (0=plus haute, 10=plus basse)
      value: JSON.stringify(jobData)
    });
    
    // Publie un événement pour informer que le job a été ajouté
    await this.publishStatusChange(job.id, 'pending', {
      metadata: { queuedAt: new Date().toISOString(), dryRun: job.dryRun }
    });
    
    return true;
  },
  
  /**
   * Ajoute un job à la file d'attente Redis
   */
  async addJobToQueue(queueName: McpQueueName, jobData: any) {
    const redis = await getRedisClient();

    // Ajouter à la file d'attente (list) Redis
    await redis.rPush(queueName, JSON.stringify(jobData));

    // Publier un événement pour les souscripteurs
    await redis.publish(`${queueName}:new`, JSON.stringify(jobData));

    return true;
  },

  /**
   * Lance un job MCP (relance ou dry-run)
   */
  async runMcpJob(filename: string, options: { dryRun?: boolean; jobId?: string } = {}) {
    const { dryRun = false, jobId } = options;

    // Préparer les données du job
    const jobData = {
      filename,
      jobId,
      dryRun,
      timestamp: new Date().toISOString(),
    };

    // Ajouter à la file d'attente des jobs MCP
    return this.addJobToQueue(DoDotmcp:PhpAnalyzer', jobData);
  },

  /**
   * Récupère les jobs en attente dans la file
   */
  async getQueuedJobs() {
    const redis = await getRedisClient();
    
    // Récupère les jobs par ordre de priorité (scores les plus bas = priorité la plus haute)
    const jobsData = await redis.zRangeWithScores(REDIS_CHANNELS.JOB_QUEUE, 0, -1);
    
    return jobsData.map(item => {
      const jobData = JSON.parse(item.value);
      return {
        ...jobData,
        priority: 10 - item.score, // Re-conversion de la priorité pour l'API
      };
    });
  },
  
  /**
   * Récupère l'état actuel d'un job depuis Redis
   */
  async getJobStatus(jobId: string) {
    const redis = await getRedisClient();

    // Vérifier si le job est en cours d'exécution
    const runningJob = await redis.get(`job:running:${jobId}`);
    if (runningJob) {
      return { status: 'running', details: JSON.parse(runningJob) };
    }

    // Vérifier si le job est terminé récemment
    const completedJob = await redis.get(`job:completed:${jobId}`);
    if (completedJob) {
      return { status: 'done', details: JSON.parse(completedJob) };
    }

    // Vérifier si le job a échoué récemment
    const failedJob = await redis.get(`job:failed:${jobId}`);
    if (failedJob) {
      return { status: 'error', details: JSON.parse(failedJob) };
    }

    // Si aucune information n'est trouvée dans Redis, le job est soit en attente soit non existant
    return { status: 'unknown' };
  },

  /**
   * Retire un job de la file d'attente (quand il est traité)
   */
  async removeJobFromQueue(jobId: string) {
    const redis = await getRedisClient();
    
    const jobs = await this.getQueuedJobs();
    const jobToRemove = jobs.find(job => job.id === jobId);
    
    if (jobToRemove) {
      await redis.zRem(REDIS_CHANNELS.JOB_QUEUE, JSON.stringify(jobToRemove));
      return true;
    }
    
    return false;
  },

  /**
   * Souscrit aux mises à jour d'état des jobs (pour les websockets)
   */
  async subscribeToJobUpdates(callback: (channel: string, message: string) => void) {
    const redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    await redis.connect();

    // S'abonner aux canaux de mise à jour des jobs
    await redis.subscribe('job:status:update', callback);
    await redis.subscribe(DoDotmcp:PhpAnalyzer:new', callback);
    await redis.subscribe(DoDotmcp:verification:new', callback);
    await redis.subscribe(DoDotmcp:commit:new', callback);

    return redis;
  },
};

export default getRedisClient;