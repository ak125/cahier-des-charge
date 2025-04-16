import { ActionFunction, json } from '@remix-run/node';
import { createClient } from 'redis';
import { Queue } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';

// Type pour les fichiers dans status.json
type JobStatus = 'pending' | 'done' | 'invalid';

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

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const jobId = formData.get('jobId') as string;
  const filename = formData.get('filename') as string;
  
  if (!jobId || !filename) {
    return json({ success: false, error: 'Job ID et nom de fichier requis' }, { status: 400 });
  }

  try {
    // 1. Mise à jour du fichier status.json
    const statusPath = path.resolve(process.cwd(), '../../status.json');
    const statusContent = await fs.readFile(statusPath, 'utf8');
    const statusData: StatusData = JSON.parse(statusContent);

    if (!statusData.files[filename]) {
      return json({ success: false, error: 'Fichier non trouvé dans status.json' }, { status: 404 });
    }

    // Mettre à jour le statut du fichier
    statusData.files[filename].status = 'pending';
    statusData.files[filename].lastUpdated = new Date().toISOString();
    delete statusData.files[filename].error;

    // Mettre à jour les statistiques
    const files = statusData.files;
    const total = Object.keys(files).length;
    const pending = Object.values(files).filter(f => f.status === 'pending').length;
    const done = Object.values(files).filter(f => f.status === 'done').length;
    const invalid = Object.values(files).filter(f => f.status === 'invalid').length;
    
    statusData.summary = { total, pending, done, invalid };
    statusData.lastUpdated = new Date().toISOString();

    // Écrire les changements dans status.json
    await fs.writeFile(statusPath, JSON.stringify(statusData, null, 2), 'utf8');

    // 2. Remettre le job dans la queue Redis/BullMQ
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redisClient = createClient({ url: redisUrl });
    await redisClient.connect();

    // Trouver les informations sur le job depuis jobs.redis.json
    const jobsPath = path.resolve(process.cwd(), '../../logs/jobs.redis.json');
    if (!fs.access(jobsPath).catch(() => false)) {
      // Si le fichier n'existe pas encore ou n'est pas accessible
      // On crée un job minimal avec les informations disponibles
      const queue = new Queue('mcp-jobs', { connection: redisClient });
      
      await queue.add(
        statusData.files[filename].agent,
        {
          filename,
          path: `/var/www/html/${filename}`, // Chemin approximatif
          timestamp: statusData.files[filename].lastUpdated
        },
        { 
          removeOnComplete: false,
          removeOnFail: false,
        }
      );
      
      await redisClient.disconnect();
      return json({ success: true });
    }
    
    // Le fichier jobs.redis.json existe, cherchons les infos du job
    const jobsContent = await fs.readFile(jobsPath, 'utf8');
    const jobsData = JSON.parse(jobsContent);
    
    // Chercher le job dans les jobs échoués
    const failedJobs = jobsData.failed || [];
    const jobInfo = failedJobs.find(job => job.id === jobId || job.data?.filename === filename);
    
    if (!jobInfo) {
      // Si on ne trouve pas le job, on crée un job minimal
      const queue = new Queue('mcp-jobs', { connection: redisClient });
      
      await queue.add(
        statusData.files[filename].agent,
        {
          filename,
          path: `/var/www/html/${filename}`, // Chemin approximatif
          timestamp: statusData.files[filename].lastUpdated
        },
        { 
          removeOnComplete: false,
          removeOnFail: false,
        }
      );
    } else {
      // Utiliser les infos du job précédent pour créer un nouveau job
      const queue = new Queue('mcp-jobs', { connection: redisClient });
      
      await queue.add(
        jobInfo.name,
        jobInfo.data,
        { 
          priority: jobInfo.priority || 1,
          removeOnComplete: false,
          removeOnFail: false,
        }
      );
      
      // Journaliser l'événement
      const logPath = path.resolve(process.cwd(), '../../logs/error.log');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${jobInfo.name}] [${filename}] Job relancé manuellement\n`;
      await fs.appendFile(logPath, logEntry, 'utf8');
    }
    
    await redisClient.disconnect();
    return json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la relance du job:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};